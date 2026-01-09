from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
import uuid
import hashlib
from collections import Counter
from typing import Optional, List
from datetime import datetime

from sqlmodel import Session, select
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

# Internal Modules
from ..limiter import limiter
from ..database import get_session, engine
from ..models import Note, User
from ..schemas.note import NoteCreate, NoteRead, ExplainRequest, FixRequest
from ..services.auth_service import SECRET_KEY, ALGORITHM
from ..services.cache_service import (
    get_cache,
    set_cache,
    clear_user_search_cache,
    set_simple_cache,
)
from ..services.ai_service import (
    generate_tags,
    explain_code_snippet,
    perform_ai_action,
)
from ..services.vector_service import get_vector
from ..services.scraper_service import scrape_url 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/notes", tags=["Notes"])


# --- Models ---
class UrlImportRequest(BaseModel):
    url: str
    project_id: Optional[str] = None
    save: bool = True 

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    code_snippet: Optional[str] = None
    language: Optional[str] = None
    project_id: Optional[str] = None


# --- Dependency ---
def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)
):
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


# --- Background Task ---
def process_note_ai(
    note_id: uuid.UUID, user_id: uuid.UUID, title: str, code: str, language: str
):
    try:
        print(f"⚙️ Background: Generating AI tags for note {note_id}...")
        ai_tags = generate_tags(code, language)
        combined_text = f"{title} \n {code}"
        vector = get_vector(combined_text)

        with Session(engine) as session:
            note = session.get(Note, note_id)
            if note:
                note.tags = ai_tags
                note.embedding = vector
                session.add(note)
                session.commit()
                print(f"✅ Background: Note {note_id} updated successfully.")

        clear_user_search_cache(user_id)
    except Exception as e:
        print(f"🔥 Background Task Failed: {e}")


# --- 🚀 Import from URL ---
@router.post("/import-url", response_model=NoteRead)
@limiter.limit("5/minute")
async def import_note_from_url(
    request: Request,
    body: UrlImportRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    data = scrape_url(body.url)
    if not data:
        raise HTTPException(status_code=400, detail="Could not scrape that URL")

    if body.save:
        vector = get_vector(data["content"])
        new_note = Note(
            title=f"Imported: {data['title']}",
            content=data["content"],
            code_snippet=data["content"],
            language=data["language"],
            tags="imported,documentation",
            owner_id=current_user.id,
            project_id=uuid.UUID(body.project_id) if body.project_id else None,
            embedding=vector,
        )

        session.add(new_note)
        session.commit()
        session.refresh(new_note)
        clear_user_search_cache(current_user.id)
        return new_note

    else:
        return NoteRead(
            id=uuid.uuid4(), 
            title=data['title'] or "Fetched Snippet",
            content=data["content"],
            code_snippet=data["content"],
            language=data["language"],
            tags="transient",
            is_pinned=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            owner_id=current_user.id,
            project_id=uuid.UUID(body.project_id) if body.project_id else None
        )


# --- Standard Endpoints ---

@router.post("/", response_model=NoteRead)
@limiter.limit("5/minute")
async def create_note(
    request: Request,
    note_data: NoteCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    new_note = Note(
        title=note_data.title,
        code_snippet=note_data.code_snippet,
        language=note_data.language,
        tags="", 
        embedding=None, 
        owner_id=current_user.id,
        project_id=note_data.project_id,
    )

    session.add(new_note)
    session.commit()
    session.refresh(new_note)

    background_tasks.add_task(
        process_note_ai,
        new_note.id,
        current_user.id,
        new_note.title,
        new_note.code_snippet,
        new_note.language,
    )
    return new_note


@router.get("/", response_model=List[NoteRead])
async def get_all_notes(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = (
        select(Note)
        .where(Note.owner_id == current_user.id)
        .order_by(Note.is_pinned.desc(), Note.created_at.desc())
    )
    results = session.exec(statement).all()
    return results


@router.get("/search/", response_model=List[NoteRead])
async def search_notes(
    q: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    cache_key = f"search:{current_user.id}:{q.lower()}"
    cached_result = get_cache(cache_key)
    if cached_result:
        return cached_result

    query_vector = get_vector(q)
    statement = (
        select(Note)
        .where(Note.owner_id == current_user.id)
        .order_by(Note.embedding.cosine_distance(query_vector))
        .limit(10)
    )

    results = session.exec(statement).all()
    clean_results = [NoteRead.model_validate(note) for note in results]

    if clean_results:
        set_cache(cache_key, clean_results)
    return clean_results


# 🚀 FIXED: Normalizes tags to Title Case to prevent duplicates (e.g. "python" == "Python")
@router.get("/tags/")
async def get_user_tags(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Note.tags).where(Note.owner_id == current_user.id)
    results = session.exec(statement).all()
    tag_counter = Counter()
    for tag_str in results:
        if tag_str:
            # 🎨 Split, Strip, and Title Case every tag
            tags = [t.strip().title() for t in tag_str.split(",")]
            tag_counter.update(tags)
    return [tag for tag, count in tag_counter.most_common()]


@router.put("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: str,
    note_data: NoteUpdate, 
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        n_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    note = session.get(Note, n_uuid)
    if not note or note.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")

    if note_data.title is not None:
        note.title = note_data.title
    if note_data.language is not None:
        note.language = note_data.language
    if note_data.project_id is not None:
        note.project_id = uuid.UUID(note_data.project_id) if note_data.project_id != "global" else None

    if note_data.code_snippet is not None:
        note.code_snippet = note_data.code_snippet
        note.tags = generate_tags(note.code_snippet, note.language)
    
    if note_data.title is not None or note_data.code_snippet is not None:
        note.embedding = get_vector(f"{note.title} \n {note.code_snippet}")

    session.add(note)
    session.commit()
    session.refresh(note)
    clear_user_search_cache(current_user.id)
    return note


@router.patch("/{note_id}/pin")
async def toggle_pin(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        n_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    note = session.get(Note, n_uuid)
    if not note or note.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    
    note.is_pinned = not note.is_pinned
    session.add(note)
    session.commit()
    return {"message": "Toggled", "is_pinned": note.is_pinned}


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    try:
        n_uuid = uuid.UUID(note_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    note = session.get(Note, n_uuid)
    if not note or note.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    
    session.delete(note)
    session.commit()
    clear_user_search_cache(current_user.id)
    return {"message": "Deleted"}


@router.post("/explain/")
@limiter.limit("5/minute")
async def explain_note(
    request: Request,
    body: ExplainRequest,
    current_user: User = Depends(get_current_user),
):
    snippet_hash = hashlib.md5(body.code_snippet.encode()).hexdigest()
    cache_key = f"explain:{snippet_hash}"
    cached_result = get_cache(cache_key)
    if cached_result:
        return cached_result
    
    explanation = explain_code_snippet(body.code_snippet, body.language)
    response_data = {"explanation": explanation}
    set_simple_cache(cache_key, response_data)
    return response_data


@router.post("/fix/")
@limiter.limit("5/minute")
async def fix_code(
    request: Request, body: FixRequest, current_user: User = Depends(get_current_user)
):
    request.state.user = current_user
    raw_data = f"{body.code_snippet}-{body.language}-{body.action}"
    snippet_hash = hashlib.md5(raw_data.encode()).hexdigest()
    cache_key = f"fix:{snippet_hash}"
    
    cached_result = get_cache(cache_key)
    if cached_result:
        return cached_result
    
    result_code = perform_ai_action(
        body.code_snippet, body.language, body.action, body.error_message
    )
    response_data = {"fixed_code": result_code}
    set_simple_cache(cache_key, response_data)
    return response_data