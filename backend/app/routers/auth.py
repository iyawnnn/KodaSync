from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from pydantic import BaseModel
import httpx 

from ..database import get_session
from ..models import User
from ..schemas.user import UserCreate, UserRead
from ..services.auth_service import (
    get_password_hash, verify_password, 
    create_access_token, create_refresh_token, decode_token
)
from ..config import settings
from ..limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshRequest(BaseModel):
    refresh_token: str

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user_id = payload.get("sub")
    user = session.get(User, user_id)
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/signup", response_model=UserRead)
@limiter.limit("5/minute")
async def signup(request: Request, user_data: UserCreate, session: Session = Depends(get_session)):
    # 🛡️ SECURITY: Password Strength Check
    if len(user_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")

    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email, 
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        provider="local"
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.password_hash:
        raise HTTPException(status_code=400, detail="Please log in with GitHub")

    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

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
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    user = session.get(User, user_id)
    if not user or user.refresh_token != body.refresh_token:
        raise HTTPException(status_code=401, detail="Token revoked")

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

@router.get("/github/login")
async def github_login():
    return RedirectResponse(
        f"https://github.com/login/oauth/authorize?client_id={settings.GITHUB_CLIENT_ID}&scope=user:email"
    )

@router.get("/github/callback")
async def github_callback(code: str, session: Session = Depends(get_session)):
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            params={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code
            }
        )
        token_data = token_res.json()
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=f"GitHub Login Failed: {token_data.get('error_description')}")
        
        access_token = token_data["access_token"]
        
        user_res = await client.get("https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}"})
        user_github_data = user_res.json()
        
        email_res = await client.get("https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"})
        emails = email_res.json()
        
        primary_email = next((e["email"] for e in emails if e["primary"] and e["verified"]), None)
        if not primary_email:
             raise HTTPException(status_code=400, detail="No verified email found.")

    user = session.exec(select(User).where(User.email == primary_email)).first()
    
    if not user:
        user = User(
            email=primary_email,
            full_name=user_github_data.get("name") or user_github_data.get("login"),
            avatar_url=user_github_data.get("avatar_url"),
            password_hash=None,
            provider="github"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        if user.provider == "local":
             user.provider = "github_linked" 
        user.avatar_url = user_github_data.get("avatar_url")
        user.full_name = user_github_data.get("name") or user_github_data.get("login")
        session.add(user)
        session.commit()
        session.refresh(user)

    access_token_jwt = create_access_token(data={"sub": str(user.id)})
    refresh_token_jwt = create_refresh_token(data={"sub": str(user.id)})
    
    user.refresh_token = refresh_token_jwt
    session.add(user)
    session.commit()

    frontend_url = f"{settings.FRONTEND_URL}/auth/callback?access_token={access_token_jwt}&refresh_token={refresh_token_jwt}"
    return RedirectResponse(url=frontend_url)