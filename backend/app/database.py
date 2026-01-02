from sqlmodel import SQLModel, create_engine, Session
import os

# 1. Get the DB URL from the .env file (via Docker environment)
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Create the engine (The connection factory)
# echo=True prints the SQL queries to your terminal (useful for debugging)
engine = create_engine(DATABASE_URL, echo=True)

# 3. Create a helper for getting a session
def get_session():
    with Session(engine) as session:
        yield session

# 4. A function to create tables on startup
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)