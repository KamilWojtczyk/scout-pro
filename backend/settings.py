# app/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    db_host: str
    db_port: int = 3306
    db_user: str
    db_pass: str
    db_name: str

    class Config:
        env_file = ".env"

settings = Settings()        # import this anywhere
