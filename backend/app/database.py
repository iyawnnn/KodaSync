from sqlmodel import SQLModel, create_engine, Session, text
from .config import settings  # <--- IMPORT SETTINGS HERE

# 1. Create the engine using the URL from config (Pydantic loads the .env)
engine = create_engine(settings.DATABASE_URL, echo=True)

# 2. Helper for getting a session
def get_session():
    with Session(engine) as session:
        yield session

# 3. Initialization Function
def init_db():
    # A. Enable Vector Extension (Critical for AI Search)
    with Session(engine) as session:
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
        session.commit()
    
    # B. Create Tables
    SQLModel.metadata.create_all(engine)