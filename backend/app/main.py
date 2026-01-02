from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from .database import create_db_and_tables
from .routers import auth, notes
from .limiter import limiter # <--- 1. Import the limiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 KodaSync Brain is starting up...")
    create_db_and_tables()
    print("✅ Database Tables Checked/Created")
    yield
    print("💤 KodaSync Brain is shutting down...")

app = FastAPI(
    title="KodaSync API",
    version="0.1.0",
    lifespan=lifespan
)

# --- 2. Attach Limiter to App ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# --------------------------------

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(notes.router)

@app.get("/")
async def root():
    return {"message": "KodaSync Systems Online", "status": "active"}

@app.get("/health")
async def health_check():
    return {"database": "connected", "mode": "mvp"}