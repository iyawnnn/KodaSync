from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    # REQUIRED FIELDS (The app will crash if these are missing)
    DATABASE_URL: str
    REDIS_URL: str
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    
    # DEFAULTS (Safe to default for dev, but override in prod)
    SECRET_KEY: str = "dev_secret_key_change_me_in_prod" 
    GROQ_API_KEY: str = "missing_api_key" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENVIRONMENT: str = "development"

    # This tells Pydantic to read from .env in the SAME folder
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Security Check
if settings.ENVIRONMENT == "production" and settings.SECRET_KEY == "dev_secret_key_change_me_in_prod":
    raise ValueError("🚨 FATAL: Attempting to start PRODUCTION with default SECRET_KEY.")