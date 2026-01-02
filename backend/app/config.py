from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # REQUIRED: App will crash if these are missing and have no default
    DATABASE_URL: str
    REDIS_URL: str
    
    # WITH DEFAULTS: Safe for local dev/testing
    SECRET_KEY: str = "dev_secret_key_change_me_in_prod" 
    GROQ_API_KEY: str = "missing_api_key" # Prevent crash, but AI will fail if not set
    
    # Defaults
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # New Pydantic V2 Config Syntax (Removes the warnings)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Initialize
settings = Settings()