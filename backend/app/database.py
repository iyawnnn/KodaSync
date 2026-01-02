from sqlmodel import SQLModel, create_engine, Session, text
import os

# 1. Get the DB URL
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Create the engine
engine = create_engine(DATABASE_URL, echo=True)

# 3. Helper for getting a session
def get_session():
    with Session(engine) as session:
        yield session

# 4. Initialization Function (Matches main.py import)
def init_db():
    # A. Enable Vector Extension (Critical for AI Search)
    with Session(engine) as session:
        session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
        session.commit()
    
    # B. Create Tables
    SQLModel.metadata.create_all(engine)