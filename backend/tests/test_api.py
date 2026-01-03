import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
# FIX: Import 'text' to run raw SQL
from sqlmodel import Session, create_engine, select, SQLModel, text
from app.main import app
from app.models import User, Note, ChatMessage, ChatSession, Project
from app.services.auth_service import get_password_hash
from app.config import settings
import uuid
import time

client = TestClient(app)

# 1. Setup Test Database Connection
def get_test_engine():
    return create_engine(settings.DATABASE_URL)

# 2. Helper: Create a Real User
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

# 3. The "Logged In" Fixture
@pytest.fixture(name="auth_headers")
def auth_headers_fixture():
    engine = get_test_engine()
    
    # --- FIX START: Enable pgvector extension ---
    # This is required because CI creates a fresh DB that doesn't have it enabled yet
    with Session(engine) as session:
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
        session.commit()
    # --- FIX END ---

    # Now we can safely create tables containing Vector columns
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # A. Create User
        user = create_test_user(session)
        
        # B. Override Auth
        app.dependency_overrides = {} 
        from app.routers.notes import get_current_user
        app.dependency_overrides[get_current_user] = lambda: user
        
        yield user 
        
        # C. CLEANUP
        app.dependency_overrides = {}
        
        user_to_delete = session.get(User, user.id)
        if user_to_delete:
            # 1. Delete Notes
            notes = session.exec(select(Note).where(Note.owner_id == user.id)).all()
            for note in notes: session.delete(note)

            # 2. Delete Projects
            projects = session.exec(select(Project).where(Project.owner_id == user.id)).all()
            for proj in projects: session.delete(proj)

            # 3. Delete Chat Sessions
            sessions = session.exec(select(ChatSession).where(ChatSession.user_id == user.id)).all()
            for s in sessions: session.delete(s)
            
            # 4. Delete User
            session.delete(user_to_delete)
            session.commit()

# --- THE TESTS ---

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
    mock_ai.return_value = "def add(a,b): return a+b"
    
    payload = {
        "code_snippet": "def add(a,b) return a+b", 
        "language": "python"
    }
    response = client.post("/notes/fix/", json=payload)
    assert response.status_code == 200
    assert "fixed_code" in response.json()

# Mock Chat
@patch("app.routers.chat.chat_with_notes")
def test_chat_rag(mock_chat, auth_headers):
    mock_chat.return_value = "The Key is TEST-123-ABC"

    # 1. Create Data
    client.post("/notes/", json={
        "title": "Secret Key", 
        "code_snippet": "KEY = 'TEST-123-ABC'", 
        "language": "python"
    })
    
    # 2. Start Session
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]

    # 3. Chat
    response = client.post(f"/chat/{session_id}", json={"message": "What is the KEY?"})
    assert response.status_code == 200
    answer = response.json()["reply"]
    assert len(answer) > 0

# Update Memory Test
def test_chat_memory(auth_headers):
    # 1. Create Session
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]

    # 2. User says name
    client.post(f"/chat/{session_id}", json={"message": "My name is KodaUser."})
    
    # 3. Check History
    hist_res = client.get(f"/chat/sessions/{session_id}/messages")
    assert hist_res.status_code == 200
    msgs = hist_res.json()
    assert len(msgs) >= 1