from sqlmodel import SQLModel
from datetime import datetime
from typing import Optional
import uuid # <--- 1. Import UUID

# 1. Base Schema (Shared properties)
class NoteBase(SQLModel):
    title: str
    code_snippet: str
    language: str

# 2. Create Schema (What user sends)
class NoteCreate(NoteBase):
    pass

# 3. Read Schema (What API returns)
class NoteRead(NoteBase):
    id: uuid.UUID # <--- 2. Changed from str to uuid.UUID
    tags: Optional[str] = None
    created_at: datetime
    owner_id: uuid.UUID # <--- 3. Changed from int to uuid.UUID (Critical Fix)

# 4. Explain Request Schema (For the AI Tutor)
class ExplainRequest(SQLModel):
    code_snippet: str
    language: str