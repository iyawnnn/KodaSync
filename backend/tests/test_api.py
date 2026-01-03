from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select, SQLModel, text
from app.main import app
# Import all models to ensure tables are registered
from app.models import User, Note, ChatMessage, ChatSession, Project
from app.services.auth_service import get_password_hash
from app.config import settings
import uuid
import pytest
import time
from unittest.mock import patch

client = TestClient(app)

def get_test_engine():
    # Use the Env Var URL forced in the workflow
    return create_engine(settings.DATABASE_URL)

def create_test_user(session: Session):
    user_id = uuid.uuid4()
    email = f"tester_{user_id}@kodasync.com"
    user = User(
        id=user_id,
        email=email,
        password_hash=get_password_hash("secret123")
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture(name="auth_headers")
def auth_headers_fixture():
    engine = get_test_engine()
    
    # 1. FIX: Force Enable Vector Extension
    # GitHub Actions creates a blank DB, so we must enable extensions manually
    with Session(engine) as session:
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
        session.commit()

    # 2. Create Tables
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        user = create_test_user(session)
        
        # Override Auth
        app.dependency_overrides = {} 
        from app.routers.notes import get_current_user
        app.dependency_overrides[get_current_user] = lambda: user
        
        yield user 
        
        # Cleanup
        app.dependency_overrides = {}
        user_to_delete = session.get(User, user.id)
        if user_to_delete:
            notes = session.exec(select(Note).where(Note.owner_id == user.id)).all()
            for note in notes: session.delete(note)

            projects = session.exec(select(Project).where(Project.owner_id == user.id)).all()
            for proj in projects: session.delete(proj)

            sessions = session.exec(select(ChatSession).where(ChatSession.user_id == user.id)).all()
            for s in sessions: session.delete(s)
            
            session.delete(user_to_delete)
            session.commit()

# --- THE TESTS ---

@patch("app.routers.notes.generate_tags") 
def test_create_note(mock_tags, auth_headers):
    mock_tags.return_value = ["mock", "tag"]
    payload = {
        "title": "Integration Test Note",
        "code_snippet": "print('Hello World')",
        "language": "python"
    }
    response = client.post("/notes/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Integration Test Note"

def test_search_note(auth_headers):
    with patch("app.routers.notes.generate_tags") as mock_tags:
        mock_tags.return_value = []
        client.post("/notes/", json={"title": "Search Me", "code_snippet": "pass", "language": "python"})
    
    response = client.get("/notes/search/?q=Search")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_delete_lifecycle(auth_headers):
    with patch("app.routers.notes.generate_tags") as mock_tags:
        mock_tags.return_value = []
        create_res = client.post("/notes/", json={"title": "Del", "code_snippet": "x=1", "language": "py"})
    
    note_id = create_res.json()["id"]
    del_res = client.delete(f"/notes/{note_id}")
    assert del_res.status_code == 200

@patch("app.routers.notes.perform_ai_action")
def test_auto_fix_endpoint(mock_ai, auth_headers):
    mock_ai.return_value = "fixed"
    response = client.post("/notes/fix/", json={"code_snippet": "bug", "language": "python"})
    assert response.status_code == 200

@patch("app.routers.chat.chat_with_notes")
def test_chat_rag(mock_chat, auth_headers):
    mock_chat.return_value = "Mock Answer"
    
    # 1. Start Session
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]

    # 2. Chat
    response = client.post(f"/chat/{session_id}", json={"message": "Hi"})
    assert response.status_code == 200
    assert response.json()["reply"] == "Mock Answer"

def test_chat_memory(auth_headers):
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]
    
    client.post(f"/chat/{session_id}", json={"message": "Test"})
    hist_res = client.get(f"/chat/sessions/{session_id}/messages")
    assert len(hist_res.json()) >= 1