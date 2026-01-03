from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional
import uuid

class NoteBase(SQLModel):
    title: str
    code_snippet: str
    language: str

# FIX: Added project_id here
class NoteCreate(NoteBase):
    project_id: Optional[uuid.UUID] = None 

class NoteRead(NoteBase):
    id: uuid.UUID
    tags: Optional[str] = None
    created_at: datetime
    owner_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None

class ExplainRequest(SQLModel):
    code_snippet: str
    language: str

class ChatRequest(SQLModel):
    message: str
    session_id: Optional[str] = None # <--- Added for Chat Sessions

class FixRequest(SQLModel):
    code_snippet: str
    language: str
    error_message: Optional[str] = None
    action: str = "fix"