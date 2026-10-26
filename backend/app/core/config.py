from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Global Era Finance"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Database (defaults to local SQLite for instant zero-config dev/test, or PostgreSQL URI)
    DATABASE_URL: str = "sqlite:///./global_era_finance.db"
    
    # Security
    SECRET_KEY: str = "globalera-finance-enterprise-secret-key-2026-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://globalera.vercel.app"
    ]
    
    # Company Profile
    COMPANY_NAME: str = "Global Era Multi Service Pvt. Ltd."
    COMPANY_CODE: str = "GETS"
    LOCATION: str = "Jorpati-05, Gokarneshwor, Kathmandu, Nepal"
    CURRENCY: str = "NPR"
    
    model_config = SettingsConfigDict(extra="ignore", env_file=".env")

settings = Settings()
