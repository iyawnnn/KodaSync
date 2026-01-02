from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime
import uuid

# --- Base Model (Shared ID logic) ---
class BaseIdModel(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- USER TABLE ---
class User(BaseIdModel, table=True):
    __tablename__ = "users"

    email: str = Field(unique=True, index=True)
    password_hash: str
    
    # Relationship: One user has many notes
    notes: List["Note"] = Relationship(back_populates="owner")

# --- NOTE TABLE ---
class Note(BaseIdModel, table=True):
    title: str
    code_snippet: str  # The actual code content
    language: str = "javascript" # e.g., python, js, ts
    tags: Optional[str] = None # Stores AI tags like "auth, loop, api"
    
    # Foreign Key: Links back to a User
    owner_id: uuid.UUID = Field(foreign_key="users.id")
    owner: User = Relationship(back_populates="notes")