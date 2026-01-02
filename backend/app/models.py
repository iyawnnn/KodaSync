from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime
import uuid
from pgvector.sqlalchemy import Vector # <--- NEW IMPORT
from sqlalchemy import Column          # <--- NEW IMPORT

# --- Base Model (Shared ID logic) ---
class BaseIdModel(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- USER TABLE ---
class User(BaseIdModel, table=True):
    __tablename__ = "users"

    email: str = Field(unique=True, index=True)
    password_hash: str
    
    notes: List["Note"] = Relationship(back_populates="owner")

# --- NOTE TABLE ---
class Note(BaseIdModel, table=True):
    title: str
    code_snippet: str
    language: str = "javascript"
    tags: Optional[str] = None
    
    # --- NEW: THE BRAIN COLUMN ---
    # We use 384 dimensions because that is what 'fastembed' produces
    embedding: List[float] = Field(sa_column=Column(Vector(384)), default=None)

    owner_id: uuid.UUID = Field(foreign_key="users.id")
    owner: User = Relationship(back_populates="notes")

class ChatRequest(SQLModel):
    message: str