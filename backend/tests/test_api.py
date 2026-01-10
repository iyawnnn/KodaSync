from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select, SQLModel, text
from app.main import app
from app.models import User, Note, ChatMessage, ChatSession, Project
from app.services.auth_service import get_password_hash
from app.config import settings
import uuid
import pytest
from unittest.mock import patch, MagicMock

client = TestClient(app)

# --- 🚀 NEW HELPER CLASS ---
# This mimics the behavior of the AI Stream for tests
class AsyncIterator:
    def __init__(self, items):
        self.items = iter(items)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self.items)
        except StopIteration:
            raise StopAsyncIteration

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

@pytest.fixture(autouse=True)
def mock_redis():
    with patch("app.services.cache_service.redis_client") as mock:
        mock.scan_iter.return_value = []
        mock.get.return_value = None
        mock.set.return_value = True
        mock.setex.return_value = True
        yield mock

@pytest.fixture(name="auth_headers")
def auth_headers_fixture():
    engine = get_test_engine()
    with Session(engine) as session:
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
        session.commit()
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        user = create_test_user(session)
        app.dependency_overrides = {} 
        from app.routers.notes import get_current_user
        app.dependency_overrides[get_current_user] = lambda: user
        yield user 
        
        app.dependency_overrides = {}
        user_to_delete = session.get(User, user.id)
        if user_to_delete:
            # Cleanup logic...
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
    # NOTE: generate_tags is likely async in your code now too. 
    # If it is, use: mock_tags.return_value = "mock, tag" (if awaited)
    # But for now assuming it handles the return value correctly or is mocked higher up.
    # Ideally, patch the Service, not the Router function if possible, or use AsyncMock.
    mock_tags.return_value = "mock, tag" 
    
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
        mock_tags.return_value = "tag"
        client.post("/notes/", json={"title": "Search Me", "code_snippet": "pass", "language": "python"})
    
    response = client.get("/notes/search/?q=Search")
    assert response.status_code == 200

def test_delete_lifecycle(auth_headers):
    with patch("app.routers.notes.generate_tags") as mock_tags:
        mock_tags.return_value = "tag"
        create_res = client.post("/notes/", json={"title": "Del", "code_snippet": "x=1", "language": "py"})
    
    note_id = create_res.json()["id"]
    del_res = client.delete(f"/notes/{note_id}")
    assert del_res.status_code == 200

@patch("app.routers.notes.perform_ai_action")
def test_auto_fix_endpoint(mock_ai, auth_headers):
    # If perform_ai_action is async, we mock the return value directly 
    # because FastApi handles the await when calling the controller
    mock_ai.return_value = "fixed"
    response = client.post("/notes/fix/", json={"code_snippet": "bug", "language": "python"})
    assert response.status_code == 200
    assert response.json()["fixed_code"] == "fixed"

@patch("app.routers.chat.stream_chat_with_notes")
def test_chat_rag(mock_stream, auth_headers):
    # 🚀 FIX: Use AsyncIterator so 'async for' works in the router
    mock_stream.return_value = AsyncIterator(["Mock Answer"])
    
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]

    response = client.post(f"/chat/{session_id}", json={"message": "Hi"})
    
    assert response.status_code == 200
    assert response.text == "Mock Answer"

@patch("app.routers.chat.stream_chat_with_notes")
def test_chat_memory(mock_stream, auth_headers):
    # 🚀 FIX: Use AsyncIterator here too
    mock_stream.return_value = AsyncIterator(["Memory Answer"])
    
    sess_res = client.post("/chat/sessions")
    session_id = sess_res.json()["id"]
    
    client.post(f"/chat/{session_id}", json={"message": "Test"})
    
    hist_res = client.get(f"/chat/sessions/{session_id}/messages")
    assert hist_res.status_code == 200
    messages = hist_res.json()
    
    assert len(messages) >= 2 
    assert messages[-1]["content"] == "Memory Answer"