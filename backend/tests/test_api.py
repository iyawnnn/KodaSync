import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select, SQLModel
from app.main import app
# FIX: Imported ChatSession and Project
from app.models import User, Note, ChatMessage, ChatSession, Project
from app.services.auth_service import get_password_hash
from app.config import settings
import uuid
import time

client = TestClient(app)

# Use SQLite for faster in-memory testing or the DB URL
def get_test_engine():
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
    
    with Session(engine) as session:
        user = create_test_user(session)
        
        # Override Auth Dependency
        app.dependency_overrides = {} 
        from app.routers.notes import get_current_user
        app.dependency_overrides[get_current_user] = lambda: user
        
        yield user 
        
        # --- CLEANUP (Updated for New Schema) ---
        app.dependency_overrides = {}
        
        user_to_delete = session.get(User, user.id)
        if user_to_delete:
            # 1. Delete Notes
            notes = session.exec(select(Note).where(Note.owner_id == user.id)).all()
            for note in notes: session.delete(note)

            # 2. Delete Projects
            projects = session.exec(select(Project).where(Project.owner_id == user.id)).all()
            for proj in projects: session.delete(proj)

            # 3. Delete Chat Sessions (Cascades to Messages)
            # FIX: We delete Sessions now, not Messages directly
            sessions = session.exec(select(ChatSession).where(ChatSession.user_id == user.id)).all()
            for s in sessions: session.delete(s)
            
            # 4. Delete User
            session.delete(user_to_delete)
            session.commit()

# --- TESTS ---

def test_create_note(auth_headers):
    payload = {
        "title": "Integration Test Note",
        "code_snippet": "print('Hello World')",
        "language": "python"
    }
    response = client.post("/notes/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Integration Test Note"
    assert "id" in data

def test_search_note(auth_headers):
    # 1. Create
    payload = {
        "title": "Search Me",
        "code_snippet": "def find_me(): pass",
        "language": "python"
    }
    client.post("/notes/", json=payload)
    
    # 2. Search
    response = client.get("/notes/search/?q=find_me")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert results[0]["title"] == "Search Me"

def test_delete_lifecycle(auth_headers):
    # 1. Create
    payload = {"title": "To Delete", "code_snippet": "x=1", "language": "python"}
    create_res = client.post("/notes/", json=payload)
    note_id = create_res.json()["id"]
    
    # 2. Delete
    del_res = client.delete(f"/notes/{note_id}")
    assert del_res.status_code == 200
    assert del_res.json() == {"message": "Deleted"} 

# Mock AI so tests don't fail without API Key
@patch("app.routers.notes.perform_ai_action")
def test_auto_fix_endpoint(mock_ai, auth_headers):
    mock_ai.return_value = "def add(a,b): return a+b" # Fake AI response
    
    payload = {
        "code_snippet": "def add(a,b) return a+b", 
        "language": "python"
    }
    response = client.post("/notes/fix/", json=payload)
    assert response.status_code == 200
    assert "fixed_code" in response.json()

# FIX: Updated to use new Session-based Chat
@patch("app.routers.chat.chat_with_notes")
def test_chat_flow(mock_chat, auth_headers):
    mock_chat.return_value = "I am a mock AI response."

    # 1. Create a Chat Session
    session_res = client.post("/chat/sessions")
    assert session_res.status_code == 200
    session_id = session_res.json()["id"]

    # 2. Send Message to that Session
    response = client.post(f"/chat/{session_id}", json={"message": "Hello AI"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "I am a mock AI response."

    # 3. Check History
    hist_res = client.get(f"/chat/sessions/{session_id}/messages")
    assert hist_res.status_code == 200
    messages = hist_res.json()
    assert len(messages) == 2 # 1 User message + 1 AI message