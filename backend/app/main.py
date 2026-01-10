from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import auth, notes, chat, projects 
from .database import init_db
from .limiter import limiter
from slowapi.errors import RateLimitExceeded
from .config import settings

app = FastAPI(title="KodaSync API", version="1.0.0")

# 1. Register the Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda r, e: JSONResponse(status_code=429, content={"detail": "Too many requests. Slow down!"}))

# 2. GLOBAL Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {exc}") 
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

# 3. CORS SECURITY (Locked Down)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Allow Vercel Deployments (Wildcard for previews)
    "https://koda-sync.vercel.app", 
    "https://kodasync.iansebastian.dev",
    "https://www.kodasync.iansebastian.dev",
]

# If we are in dev, we can be slightly more permissive
if settings.ENVIRONMENT == "development":
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
    allow_headers=["*"], 
)

@app.on_event("startup")
def on_startup():
    init_db()

# 4. Register Routes
app.include_router(auth.router)
app.include_router(notes.router)
app.include_router(chat.router)    
app.include_router(projects.router) 

# --- RATE LIMITED ROOT ENDPOINT ---
@app.get("/")
@limiter.limit("5/minute") # Limits this specific endpoint to 5 requests per minute
def read_root(request: Request): # 'request' is REQUIRED for the limiter to identify the user
    return {"status": "active", "system": "KodaSync Neural Core", "env": settings.ENVIRONMENT}