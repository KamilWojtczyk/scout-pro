# app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from settings import settings

DATABASE_URL = (
    f"mysql+pymysql://{settings.db_user}:{settings.db_pass}"
    f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    "?charset=utf8mb4"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
