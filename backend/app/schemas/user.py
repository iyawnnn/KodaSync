from pydantic import BaseModel, EmailStr
import uuid

# What the user sends during Sign Up
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# What we send back (NEVER send the password back)
class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr