from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
import uuid
from datetime import datetime
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    notes: List["Note"] = Relationship(back_populates="owner")
    projects: List["Project"] = Relationship(back_populates="owner")
    chat_sessions: List["ChatSession"] = Relationship(back_populates="user") # <--- New

class Project(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    owner_id: uuid.UUID = Field(foreign_key="users.id")
    owner: User = Relationship(back_populates="projects")
    notes: List["Note"] = Relationship(back_populates="project")

class Note(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    code_snippet: str
    language: str
    tags: Optional[str] = None
    is_pinned: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    embedding: List[float] = Field(sa_column=Column(Vector(384))) 
    owner_id: uuid.UUID = Field(foreign_key="users.id")
    owner: User = Relationship(back_populates="notes")
    project_id: Optional[uuid.UUID] = Field(default=None, foreign_key="project.id")
    project: Optional[Project] = Relationship(back_populates="notes")

# --- NEW CHAT ARCHITECTURE ---
class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_sessions"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = "New Chat"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: uuid.UUID = Field(foreign_key="users.id")
    user: User = Relationship(back_populates="chat_sessions")
    messages: List["ChatMessage"] = Relationship(back_populates="session", sa_relationship_kwargs={"cascade": "all, delete"})

class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role: str 
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Link to Session instead of just User
    session_id: uuid.UUID = Field(foreign_key="chat_sessions.id")
    session: ChatSession = Relationship(back_populates="messages")