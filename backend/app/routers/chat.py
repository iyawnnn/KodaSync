from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from ..database import get_session
from ..models import ChatSession, ChatMessage, User, Note
from ..schemas.note import ChatRequest
from ..routers.notes import get_current_user
from ..services.ai_service import chat_with_notes
from ..services.vector_service import get_vector
import uuid

router = APIRouter(prefix="/chat", tags=["Chat"])

# 1. Create a New Session
@router.post("/sessions", response_model=ChatSession)
async def create_session(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_session = ChatSession(user_id=current_user.id, title="New Conversation")
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    return new_session

# 2. Get All Sessions (For Sidebar)
@router.get("/sessions", response_model=list[ChatSession])
async def get_sessions(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    statement = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc())
    return session.exec(statement).all()

# 3. Get Messages for a specific Session
@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify ownership
    chat_session = session.get(ChatSession, uuid.UUID(session_id))
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return chat_session.messages

# 4. Send Message (The main Chat Logic)
@router.post("/{session_id}")
async def send_message(
    session_id: str,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify Session
    s_uuid = uuid.UUID(session_id)
    chat_session = session.get(ChatSession, s_uuid)
    if not chat_session or chat_session.user_id != current_user.id:
        raise HTTPException(status_code=404)

    # 1. Update Title if it's the first message
    if chat_session.title == "New Conversation":
        chat_session.title = body.message[:30] + "..."
        session.add(chat_session)

    # 2. RAG Logic (Find relevant notes)
    query_vector = get_vector(body.message)
    statement = select(Note).where(Note.owner_id == current_user.id).order_by(
        Note.embedding.cosine_distance(query_vector)
    ).limit(3)
    relevant_notes = session.exec(statement).all()
    
    context_str = "\n".join([f"Note: {n.title}\n{n.code_snippet}" for n in relevant_notes])
    if not context_str: context_str = "No relevant code found."

    # 3. Get Chat History for Context
    history = [{"role": m.role, "content": m.content} for m in chat_session.messages]

    # 4. Save User Message
    user_msg = ChatMessage(role="user", content=body.message, session_id=s_uuid)
    session.add(user_msg)
    session.commit()

    # 5. Get AI Response
    ai_response = chat_with_notes(context_str, body.message, history)

    # 6. Save AI Message
    ai_msg = ChatMessage(role="assistant", content=ai_response, session_id=s_uuid)
    session.add(ai_msg)
    session.commit()

    return {"reply": ai_response, "sources": [n.title for n in relevant_notes]}