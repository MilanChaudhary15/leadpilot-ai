from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    gemini_api_key: str
    gemini_model: str = "gemini-3.8-flash"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "sqlite:///./leadpilot.db"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
