from fastapi import APIRouter, Depends, Request, HTTPException
import uuid
from ..limiter import limiter 
from sqlmodel import Session, select, col, or_
from ..database import get_session
from ..models import Note, User
# UPDATED IMPORT: Added ExplainRequest here
from ..schemas.note import NoteCreate, NoteRead, ExplainRequest 
from ..services.auth_service import SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from ..services.cache_service import get_cache, set_cache, clear_user_search_cache 
from ..services.ai_service import generate_tags, explain_code_snippet 

# Setup Auth Security
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/notes", tags=["Notes"])

# Helper to get the current user from the token
# NEW (Safe version)
def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        user = session.get(User, user_id)
        if user is None:
            raise credentials_exception
            
        return user
    except JWTError:
        raise credentials_exception

@router.post("/", response_model=NoteRead)
@limiter.limit("5/minute")
async def create_note(
    request: Request,
    note_data: NoteCreate, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Call AI to generate tags (Pass Language for better accuracy)
    print("🤖 AI is analyzing your code...")
    ai_tags = generate_tags(note_data.code_snippet, note_data.language)
    
    # 2. Create Database Object
    new_note = Note(
        title=note_data.title,
        code_snippet=note_data.code_snippet,
        language=note_data.language,
        tags=ai_tags,
        owner_id=current_user.id
    )
    
    # 3. Save to DB
    session.add(new_note)
    session.commit()
    session.refresh(new_note)

    # 4. Clear Search Cache (So the new note shows up in search immediately)
    clear_user_search_cache(current_user.id)
    
    return new_note

@router.get("/search/", response_model=list[NoteRead])
async def search_notes(
    q: str, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Define a unique cache key based on User + Query
    cache_key = f"search:{current_user.id}:{q.lower()}"
    
    # 2. Check Redis First (The "Fast Path")
    cached_result = get_cache(cache_key)
    if cached_result:
        print(f"⚡ Cache Hit! Serving '{q}' from Redis.")
        return cached_result

    # 3. If missing, Check Database (The "Slow Path")
    print(f"🐢 Cache Miss. Querying DB for '{q}'...")
    statement = select(Note).where(Note.owner_id == current_user.id).where(
        or_(
            col(Note.title).icontains(q),
            col(Note.code_snippet).icontains(q),
            col(Note.tags).icontains(q)
        )
    )
    results = session.exec(statement).all()
    
    # 4. Save result to Redis for next time
    if results:
        set_cache(cache_key, results)
        
    return results

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Find the note
    try:
        n_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    note = session.get(Note, n_uuid)
    
    # 2. Security Check: Does it exist? Is it yours?
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
        
    # 3. Delete it
    session.delete(note)
    session.commit()

    # 4. Clear Search Cache (So the deleted note disappears from search immediately)
    clear_user_search_cache(current_user.id)
    
    return {"message": "Note deleted successfully"}

@router.put("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: str,
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # 1. Find the note
    try:
        n_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    note = session.get(Note, n_uuid)
    
    # 2. Security Check
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this note")
    
    # 3. Re-Analyze with AI (Since code/language might have changed)
    print("🤖 AI is re-analyzing your edits...")
    new_tags = generate_tags(note_data.code_snippet, note_data.language)
    
    # 4. Update Fields
    note.title = note_data.title
    note.code_snippet = note_data.code_snippet
    note.language = note_data.language
    note.tags = new_tags
    
    # 5. Save & Clear Cache
    session.add(note)
    session.commit()
    session.refresh(note)
    
    clear_user_search_cache(current_user.id)
    
    return note

@router.post("/explain/")
@limiter.limit("5/minute")
async def explain_note(
    request: Request,
    body: ExplainRequest, # <--- Correctly uses the Schema
    current_user: User = Depends(get_current_user),
):
    print("🎓 AI is preparing a lesson...")
    explanation = explain_code_snippet(body.code_snippet, body.language)
    return {"explanation": explanation}