from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import auth, notes
from .database import init_db
from .limiter import limiter
from slowapi.errors import RateLimitExceeded

app = FastAPI(title="KodaSync API", version="1.0.0")

# 1. Register the Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda r, e: JSONResponse(status_code=429, content={"detail": "Too many requests. Slow down!"}))

# 2. GLOBAL Error Handler (Prevents crashes)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 CRITICAL ERROR: {exc}") 
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

# 3. CORS SECURITY (The Fix for 'Network Error')
# We explicitly allow localhost:3000 to send requests
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], # Allow GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"], # Allow Authorization headers (Tokens)
)

@app.on_event("startup")
def on_startup():
    init_db()

# 4. Register Routes
app.include_router(auth.router)
app.include_router(notes.router)

@app.get("/")
def read_root():
    return {"status": "active", "system": "KodaSync Neural Core"}