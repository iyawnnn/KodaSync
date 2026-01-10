from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse 
from sqlmodel import Session, select, delete, col
from ..database import get_session
from ..models import ChatSession, ChatMessage, User, Note, Project
from ..routers.notes import get_current_user
from ..services.ai_service import stream_chat_with_notes, generate_chat_title
from ..services.vector_service import get_vector
from ..services.cache_service import get_cache, set_simple_cache 
from ..limiter import limiter
import uuid
import hashlib 
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    project_id: Optional[str] = None 

# --- HELPER: Delete Empty Sessions ---
def cleanup_empty_sessions(session: Session, user_id: uuid.UUID, exclude_id: Optional[uuid.UUID] = None):
    try:
        active_session_ids = select(ChatMessage.session_id).distinct()
        statement = delete(ChatSession).where(
            ChatSession.user_id == user_id,
            col(ChatSession.id).notin_(active_session_ids)
        )
        if exclude_id:
            statement = statement.where(ChatSession.id != exclude_id)
        session.exec(statement)
        session.commit()
    except Exception as e:
        print(f"Cleanup warning: {e}")

@router.post("/sessions", response_model=ChatSession)
@limiter.limit("20/minute") 
async def create_session(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cleanup_empty_sessions(session, current_user.id)
    new_session = ChatSession(user_id=current_user.id, title="New Conversation")
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    return new_session

@router.get("/sessions", response_model=list[ChatSession])
@limiter.limit("50/minute")
async def get_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cleanup_empty_sessions(session, current_user.id)
    statement = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(
        ChatSession.is_pinned.desc(),
        ChatSession.created_at.desc()
    )
    return session.exec(statement).all()

@router.get("/sessions/{session_id}/messages")
@limiter.limit("100/minute")
async def get_session_messages(
    request: Request,
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try: s_uuid = uuid.UUID(session_id)
    except: raise HTTPException(status_code=400)
    
    chat_session = session.get(ChatSession, s_uuid)
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return chat_session.messages

@router.post("/{session_id}")
@limiter.limit("10/minute") 
async def send_message(
    request: Request,
    session_id: str,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try: s_uuid = uuid.UUID(session_id)
    except: raise HTTPException(status_code=400)

    chat_session = session.get(ChatSession, s_uuid)
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404)

    # --- Cache Logic ---
    msg_hash = hashlib.md5(body.message.strip().lower().encode()).hexdigest()
    cache_key = f"chat:{current_user.id}:{body.project_id or 'global'}:{msg_hash}"
    if cached := get_cache(cache_key):
        async def cached_gen():
            yield cached.get("response", "")
        return StreamingResponse(cached_gen(), media_type="text/plain")

    # AI TITLE GENERATION (Async) 
    if chat_session.title in ["New Conversation", "New Chat"]:
        try:
            # AWAIT the async generator
            new_title = await generate_chat_title(body.message)
            chat_session.title = new_title
            session.add(chat_session)
        except Exception as e:
            print(f"Title generation error: {e}")

    # Context Retrieval
    query_vector = get_vector(body.message)
    stmt = select(Note).where(Note.owner_id == current_user.id)
    
    project_name = None
    if body.project_id:
        try:
            stmt = stmt.where(Note.project_id == uuid.UUID(body.project_id))
            proj = session.get(Project, uuid.UUID(body.project_id))
            if proj: project_name = proj.name
        except: pass

    stmt = stmt.order_by(Note.embedding.cosine_distance(query_vector)).limit(3)
    relevant_notes = session.exec(stmt).all()
    context_str = "\n".join([f"Note: {n.title} ({n.language})\n{n.code_snippet}" for n in relevant_notes])

    # Save User Message
    user_msg = ChatMessage(role="user", content=body.message, session_id=s_uuid)
    session.add(user_msg)
    session.commit()

    history = [{"role": m.role, "content": m.content} for m in chat_session.messages]

    async def response_generator():
        full_response = ""
        # ASYNC ITERATION OVER STREAM
        async for chunk in stream_chat_with_notes(context_str, body.message, history, project_name=project_name):
            full_response += chunk
            yield chunk

        try:
            ai_msg = ChatMessage(role="assistant", content=full_response, session_id=s_uuid)
            session.add(ai_msg)
            session.commit()
            set_simple_cache(cache_key, {"response": full_response}, expire=3600)
        except Exception as e:
            print(f"Error saving chat history: {e}")

    return StreamingResponse(response_generator(), media_type="text/plain")

class SessionUpdate(BaseModel):
    title: str | None = None
    is_pinned: bool | None = None

@router.patch("/sessions/{session_id}")
@limiter.limit("20/minute")
async def update_session(
    request: Request,
    session_id: str,
    update_data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try: s_uuid = uuid.UUID(session_id)
    except: raise HTTPException(status_code=400)

    chat_session = session.get(ChatSession, s_uuid)
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404)
    
    if update_data.title is not None: chat_session.title = update_data.title
    if update_data.is_pinned is not None: chat_session.is_pinned = update_data.is_pinned
        
    session.add(chat_session)
    session.commit()
    return chat_session

@router.delete("/sessions/{session_id}")
@limiter.limit("20/minute")
async def delete_session(
    request: Request,
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try: s_uuid = uuid.UUID(session_id)
    except: raise HTTPException(status_code=400)

    chat_session = session.get(ChatSession, s_uuid)
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404)
        
    session.delete(chat_session)
    session.commit()
    return {"ok": True}