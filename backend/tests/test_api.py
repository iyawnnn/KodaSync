from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select, SQLModel, text
from app.main import app
from app.models import User, Note, ChatMessage, ChatSession, Project
from app.services.auth_service import get_password_hash
from app.config import settings
import uuid
import pytest
import time
from unittest.mock import patch

client = TestClient(app)

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
    
    # 1. Enable Vector Extension (Crucial for CI)
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

# FIX 2: Mock the 'generate_tags' function so it doesn't hit the real API
@patch("app.routers.notes.generate_tags") 
def test_create_note(mock_tags, auth_headers):
    # Setup mock return value
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
    assert "id" in data

def test_search_note(auth_headers):
    # We don't mock here because search usually uses local DB vector search, 
    # but if embedding generation hits API, we might need a mock. 
    # For now, let's assume embedding is generated in create_note (which we'll call).
    
    with patch("app.routers.notes.generate_tags") as mock_tags:
        mock_tags.return_value = []
        payload = {
            "title": "Search Me",
            "code_snippet": "def find_me(): pass",
            "language": "python"
        }
        client.post("/notes/", json=payload)
    
    # Search
    response = client.get("/notes/search/?q=find_me")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert results[0]["title"] == "Search Me"

def test_delete_lifecycle(auth_headers):
    with patch("app.routers.notes.generate_tags") as mock_tags:
        mock_tags.return_value = []
        payload = {"title": "To Delete", "code_snippet": "x=1", "language": "python"}
        create_res = client.post("/notes/", json=payload)
        note_id = create_res.json()["id"]
    
    del_res = client.delete(f"/notes/{note_id}")
    assert del_res.status_code == 200
    assert del_res.json() == {"message": "Deleted"} 

@patch("app.routers.notes.perform_ai_action")
def test_auto_fix_endpoint(mock_ai, auth_headers):
    mock_ai.return_value = "def add(a,b): return a+b"
    
    payload = {
        "code_snippet": "def add(a,b): return a+b", 
        "language": "python"
    }
    response = client.post("/notes/fix/", json=payload)
    assert response.status_code == 200
    assert "fixed_code" in response.json()

@patch("app.routers.chat.chat_with_notes")
def test_chat_rag(mock_chat, auth_headers):
    mock_chat.return_value = "The Key is TEST-123-ABC"

    with patch("app.routers.notes.generate_tags") as mock_tags:
        mock_tags.return_value = []
        client.post("/notes/", json={
            "title": "Secret Key", 
            "code_snippet": "KEY = 'TEST-123-ABC'", 
            "language": "python"
        })
    
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]

    response = client.post(f"/chat/{session_id}", json={"message": "What is the KEY?"})
    assert response.status_code == 200
    answer = response.json()["reply"]
    assert len(answer) > 0

@patch("app.routers.chat.chat_with_notes")
def test_chat_memory(mock_chat, auth_headers):
    mock_chat.return_value = "Hello KodaUser" 
    
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]

    client.post(f"/chat/{session_id}", json={"message": "My name is KodaUser."})
    
    hist_res = client.get(f"/chat/sessions/{session_id}/messages")
    assert hist_res.status_code == 200
    msgs = hist_res.json()
    assert len(msgs) >= 1