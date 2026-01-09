from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # REQUIRED
    DATABASE_URL: str
    REDIS_URL: str
    
    # GITHUB OAUTH
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    
    # Defaults
    SECRET_KEY: str = "dev_secret_key_change_me_in_prod" 
    GROQ_API_KEY: str = "missing_api_key" 
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()