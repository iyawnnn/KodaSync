from fastapi import APIRouter, HTTPException, Depends, Header
from sqlmodel import Session, select
from ..database import get_session
from ..models import User
from ..schemas.user import UserCreate, UserRead
from ..services.auth_service import (
    get_password_hash, verify_password, 
    create_access_token, create_refresh_token, decode_token
)
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/signup", response_model=UserRead)
async def signup(user_data: UserCreate, session: Session = Depends(get_session)):
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email, 
        password_hash=get_password_hash(user_data.password)
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Generate Both Tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Save Refresh Token
    user.refresh_token = refresh_token
    session.add(user)
    session.commit()

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest, session: Session = Depends(get_session)):
    # 1. Validate Token
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    
    # 2. Check DB
    user = session.get(User, user_id)
    if not user or user.refresh_token != body.refresh_token:
        raise HTTPException(status_code=401, detail="Token revoked")

    # 3. Rotate Tokens
    new_access = create_access_token(data={"sub": str(user.id)})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})

    user.refresh_token = new_refresh
    session.add(user)
    session.commit()

    return {
        "access_token": new_access, 
        "refresh_token": new_refresh,
        "token_type": "bearer"
    }