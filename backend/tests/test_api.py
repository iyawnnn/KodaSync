from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from app.main import app
from app.models import User, Note
from app.services.auth_service import get_password_hash
from app.config import settings
import uuid
import pytest
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
    
    with Session(engine) as session:
        # A. Create User
        user = create_test_user(session)
        
        # B. Override Auth
        app.dependency_overrides = {} 
        from app.routers.notes import get_current_user
        app.dependency_overrides[get_current_user] = lambda: user
        
        yield user # <--- Run the test
        
        # C. CLEANUP (Fixes the IntegrityError)
        app.dependency_overrides = {}
        
        # We must re-fetch the user to attach to this session
        user_to_delete = session.get(User, user.id)
        if user_to_delete:
            # 1. Delete all notes belonging to this user first!
            # This prevents the "NotNullViolation" error.
            notes_stmt = select(Note).where(Note.owner_id == user.id)
            user_notes = session.exec(notes_stmt).all()
            for note in user_notes:
                session.delete(note)
            
            # 2. Now we can safely delete the user
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
    # Removed 'return' to silence Pytest warning

def test_search_note(auth_headers):
    # 1. Create
    payload = {
        "title": "Search Me",
        "code_snippet": "def find_me(): pass",
        "language": "python"
    }
    client.post("/notes/", json=payload)
    time.sleep(0.5) # Let DB index

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
    
    # FIX: Matches the actual API response "Deleted"
    assert del_res.json() == {"message": "Deleted"} 

def test_auto_fix_endpoint(auth_headers):
    payload = {
        "code_snippet": "def add(a,b): return a+b", 
        "language": "python"
    }
    response = client.post("/notes/fix/", json=payload)
    assert response.status_code == 200
    assert "fixed_code" in response.json()

def test_chat_rag(auth_headers):
    # 1. Context
    client.post("/notes/", json={
        "title": "Secret Key", 
        "code_snippet": "KEY = 'TEST-123-ABC'", 
        "language": "python"
    })
    
    # 2. Chat
    response = client.post("/notes/chat/", json={"message": "What is the KEY?"})
    assert response.status_code == 200
    answer = response.json()["reply"]
    assert isinstance(answer, str)
    assert len(answer) > 0