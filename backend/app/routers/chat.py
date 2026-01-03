from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse 
from sqlmodel import Session, select
from ..database import get_session
from ..models import ChatSession, ChatMessage, User, Note, Project
from ..routers.notes import get_current_user
from ..services.ai_service import stream_chat_with_notes 
from ..services.vector_service import get_vector
from ..services.cache_service import get_cache, set_simple_cache # <--- IMPORT CACHE
from ..limiter import limiter
import uuid
import hashlib # <--- IMPORT HASHLIB
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    project_id: Optional[str] = None 

# 1. Create Session: Cheap (Database only) -> 20/min
@router.post("/sessions", response_model=ChatSession)
@limiter.limit("20/minute") 
async def create_session(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_session = ChatSession(user_id=current_user.id, title="New Conversation")
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    return new_session

# 2. Get Sessions: Cheap -> 50/min
@router.get("/sessions", response_model=list[ChatSession])
@limiter.limit("50/minute")
async def get_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(
        ChatSession.is_pinned.desc(),
        ChatSession.created_at.desc()
    )
    return session.exec(statement).all()

# 3. Get Messages: Cheap -> 100/min (Chatty UI)
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

# 4. Send Message: EXPENSIVE (AI Costs Money) -> 10/min
# --- 🚀 UPDATED WITH REDIS CACHING ---
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

    # 1. Validate Session
    chat_session = session.get(ChatSession, s_uuid)
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404)

    # --- ⚡ CACHE CHECK START ---
    # Create a unique fingerprint: UserID + ProjectID + MessageHash
    # This ensures "Project A" answers don't leak into "Project B"
    msg_hash = hashlib.md5(body.message.strip().lower().encode()).hexdigest()
    cache_key = f"chat:{current_user.id}:{body.project_id or 'global'}:{msg_hash}"
    
    cached_data = get_cache(cache_key)

    if cached_data:
        print(f"⚡ CACHE HIT: {cache_key}")
        
        # Generator for instant response
        async def cached_generator():
            # We assume cached_data is {"response": "..."}
            content = cached_data.get("response", "")
            yield content
            
            # Even if cached, we save the interaction to history so the chat log is complete
            try:
                user_msg = ChatMessage(role="user", content=body.message, session_id=s_uuid)
                ai_msg = ChatMessage(role="assistant", content=content, session_id=s_uuid)
                session.add(user_msg)
                session.add(ai_msg)
                session.commit()
            except: pass

        return StreamingResponse(cached_generator(), media_type="text/plain")
    # --- ⚡ CACHE CHECK END ---


    # 2. Update Title if New (Simple heuristic)
    if chat_session.title == "New Conversation":
        chat_session.title = body.message[:30] + "..."
        session.add(chat_session)

    # 3. Retrieve Context (RAG) WITH PROJECT FILTERING
    query_vector = get_vector(body.message)
    
    # Start Query: "Find notes owned by me..."
    stmt = select(Note).where(Note.owner_id == current_user.id)
    
    # 🔍 FILTER: If project_id is provided, restrict search to that project
    project_name = None
    if body.project_id:
        try:
            p_uuid = uuid.UUID(body.project_id)
            stmt = stmt.where(Note.project_id == p_uuid)
            
            # Fetch project name for the AI System Prompt
            proj = session.get(Project, p_uuid)
            if proj:
                project_name = proj.name
        except:
            pass # Invalid project ID, ignore filter

    # Finish Query: "...sorted by similarity, limit 3"
    stmt = stmt.order_by(Note.embedding.cosine_distance(query_vector)).limit(3)
    
    relevant_notes = session.exec(stmt).all()
    
    context_str = "\n".join([f"Note: {n.title} ({n.language})\n{n.code_snippet}" for n in relevant_notes])
    if not context_str: context_str = "No relevant code found."

    # 4. Save USER message to DB
    user_msg = ChatMessage(role="user", content=body.message, session_id=s_uuid)
    session.add(user_msg)
    session.commit()

    # 5. Prepare History
    history = [{"role": m.role, "content": m.content} for m in chat_session.messages]

    # 6. Stream Generator
    async def response_generator():
        full_response = ""
        
        # Pass 'project_name' to the AI service
        for chunk in stream_chat_with_notes(context_str, body.message, history, project_name=project_name):
            full_response += chunk
            yield chunk

        try:
            # A) Save to Database
            ai_msg = ChatMessage(role="assistant", content=full_response, session_id=s_uuid)
            session.add(ai_msg)
            session.commit()

            # B) Save to Redis Cache (Expires in 1 hour) 💾
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