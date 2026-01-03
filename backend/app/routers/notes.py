from fastapi import APIRouter, Depends, Request, HTTPException
import uuid
from ..limiter import limiter 
from sqlmodel import Session, select, col, or_
from ..database import get_session
from ..models import Note, User
from ..schemas.note import NoteCreate, NoteRead, ExplainRequest, ChatRequest, FixRequest 
from ..services.auth_service import SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from ..services.cache_service import get_cache, set_cache, clear_user_search_cache, set_simple_cache
from ..services.ai_service import generate_tags, explain_code_snippet, chat_with_notes, perform_ai_action
from ..services.vector_service import get_vector
import hashlib
from collections import Counter

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/notes", tags=["Notes"])

def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials", headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None: raise credentials_exception
        user = session.get(User, user_id)
        if user is None: raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

@router.post("/", response_model=NoteRead)
@limiter.limit("5/minute")
async def create_note(request: Request, note_data: NoteCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    print("🤖 AI is analyzing your code...")
    ai_tags = generate_tags(note_data.code_snippet, note_data.language)
    combined_text = f"{note_data.title} \n {note_data.code_snippet}"
    vector = get_vector(combined_text)

    new_note = Note(
        title=note_data.title, 
        code_snippet=note_data.code_snippet, 
        language=note_data.language,
        tags=ai_tags, 
        embedding=vector, 
        owner_id=current_user.id,
        project_id=note_data.project_id # <--- ADD THIS LINE
    )
    
    session.add(new_note)
    session.commit()
    session.refresh(new_note)
    clear_user_search_cache(current_user.id)
    return new_note

# --- NEW: Get All Notes (For My Library) ---
@router.get("/", response_model=list[NoteRead])
async def get_all_notes(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Sort by: Pinned (True first), then Created At (Newest first)
    statement = select(Note).where(Note.owner_id == current_user.id).order_by(
        Note.is_pinned.desc(), 
        Note.created_at.desc()
    )
    results = session.exec(statement).all()
    return results
# -------------------------------------------

@router.get("/search/", response_model=list[NoteRead])
async def search_notes(q: str, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    cache_key = f"search:{current_user.id}:{q.lower()}"
    cached_result = get_cache(cache_key)
    if cached_result: return cached_result

    print(f"🧠 Semantic Search for '{q}'...")
    query_vector = get_vector(q)
    statement = select(Note).where(Note.owner_id == current_user.id).order_by(
        Note.embedding.cosine_distance(query_vector)
    ).limit(10)
    
    results = session.exec(statement).all()
    clean_results = [NoteRead.model_validate(note) for note in results]
    
    if clean_results: set_cache(cache_key, clean_results)
    return clean_results

@router.get("/tags/")
async def get_user_tags(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Fetch all tag strings
    statement = select(Note.tags).where(Note.owner_id == current_user.id)
    results = session.exec(statement).all()
    
    # 2. Count frequencies
    tag_counter = Counter()
    for tag_str in results:
        if tag_str:
            # Split, strip whitespace, and handle case (Python vs python)
            tags = [t.strip() for t in tag_str.split(",")] 
            tag_counter.update(tags)
            
    # 3. Return tags sorted by popularity (Most common first)
    # This ensures the most "useful" filters are always on the left
    return [tag for tag, count in tag_counter.most_common()]

@router.put("/{note_id}", response_model=NoteRead)
async def update_note(note_id: str, note_data: NoteCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try: n_uuid = uuid.UUID(note_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid ID")
    note = session.get(Note, n_uuid)
    if not note or note.owner_id != current_user.id: raise HTTPException(status_code=404, detail="Not found")

    new_tags = generate_tags(note_data.code_snippet, note_data.language)
    new_vector = get_vector(f"{note_data.title} \n {note_data.code_snippet}")
    
    note.title = note_data.title
    note.code_snippet = note_data.code_snippet
    note.language = note_data.language
    note.tags = new_tags
    note.embedding = new_vector
    
    session.add(note)
    session.commit()
    session.refresh(note)
    clear_user_search_cache(current_user.id)
    return note

@router.patch("/{note_id}/pin")
async def toggle_pin(
    note_id: str, 
    current_user: User = Depends(get_current_user), 
    session: Session = Depends(get_session)
):
    try: n_uuid = uuid.UUID(note_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid ID")

    note = session.get(Note, n_uuid)
    if not note or note.owner_id != current_user.id: 
        raise HTTPException(status_code=404, detail="Not found")

    note.is_pinned = not note.is_pinned # Toggle
    session.add(note)
    session.commit()
    return {"message": "Toggled", "is_pinned": note.is_pinned}

@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    try: n_uuid = uuid.UUID(note_id)
    except ValueError: raise HTTPException(status_code=400, detail="Invalid ID")
    note = session.get(Note, n_uuid)
    if not note or note.owner_id != current_user.id: raise HTTPException(status_code=404, detail="Not found")
    session.delete(note)
    session.commit()
    clear_user_search_cache(current_user.id)
    return {"message": "Deleted"}

@router.post("/explain/")
@limiter.limit("5/minute")
async def explain_note(request: Request, body: ExplainRequest, current_user: User = Depends(get_current_user)):
    snippet_hash = hashlib.md5(body.code_snippet.encode()).hexdigest()
    cache_key = f"explain:{snippet_hash}"
    cached_result = get_cache(cache_key)
    if cached_result: return cached_result

    print("🎓 AI is explaining...")
    explanation = explain_code_snippet(body.code_snippet, body.language)
    response_data = {"explanation": explanation}
    set_simple_cache(cache_key, response_data)
    return response_data

@router.post("/chat/")
@limiter.limit("10/minute")
async def chat_rag(request: Request, body: ChatRequest, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    print(f"💬 Chatting: {body.message}")
    query_vector = get_vector(body.message)
    
    statement = select(Note).where(Note.owner_id == current_user.id).order_by(
        Note.embedding.cosine_distance(query_vector)
    ).limit(3)
    
    relevant_notes = session.exec(statement).all()
    
    if not relevant_notes:
        context_str = "No relevant notes found."
    else:
        context_str = "\n\n".join([f"--- Note: {note.title} ({note.language}) ---\n{note.code_snippet}" for note in relevant_notes])
    
    print("🧠 Asking Llama 3...")
    answer = chat_with_notes(context_str, body.message)
    
    return {"reply": answer, "sources": [n.title for n in relevant_notes]}

@router.post("/fix/")
@limiter.limit("5/minute")
async def fix_code(
    request: Request,
    body: FixRequest,
    current_user: User = Depends(get_current_user)
):
    request.state.user = current_user 
    
    # 1. Generate Cache Key (Fingerprint)
    # Unique per code content + language + action type
    raw_data = f"{body.code_snippet}-{body.language}-{body.action}"
    snippet_hash = hashlib.md5(raw_data.encode()).hexdigest()
    cache_key = f"fix:{snippet_hash}"

    # 2. Check Cache
    cached_result = get_cache(cache_key)
    if cached_result: 
        print(f"⚡ Serving {body.action} result from Cache")
        return cached_result

    print(f"🔧 AI is running action: {body.action}...")
    
    # 3. Call AI Service
    result_code = perform_ai_action(
        body.code_snippet, 
        body.language, 
        body.action, 
        body.error_message
    )
    
    response_data = {"fixed_code": result_code}
    
    # 4. Save to Cache
    set_simple_cache(cache_key, response_data)
    
    return response_data