from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional
import uuid

# 1. Base Schema
class NoteBase(SQLModel):
    title: str
    code_snippet: str
    language: str

# 2. Create Schema
class NoteCreate(NoteBase):
    pass

# 3. Read Schema
class NoteRead(NoteBase):
    id: uuid.UUID
    tags: Optional[str] = None
    created_at: datetime
    owner_id: uuid.UUID

# 4. Explain Request Schema
class ExplainRequest(SQLModel):
    code_snippet: str
    language: str

# --- ADD THESE NEW SCHEMAS ---

# 5. Chat Request Schema (For RAG)
class ChatRequest(SQLModel):
    message: str

# 6. Fix Request Schema (For Auto-Fixer)
class FixRequest(SQLModel):
    code_snippet: str
    language: str
    error_message: Optional[str] = None