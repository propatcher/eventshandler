import logging
import os

from dotenv import load_dotenv

load_dotenv()

_DEFAULT_SECRET_KEY = "dev-secret-change-me-in-production"
SECRET_KEY: str = os.getenv("SECRET_KEY", _DEFAULT_SECRET_KEY)
if SECRET_KEY == _DEFAULT_SECRET_KEY:
    logging.getLogger("app.config").warning(
        "SECRET_KEY использует небезопасное значение по умолчанию — "
        "задайте надёжный SECRET_KEY в .env перед публикацией на хостинг!"
    )
JWT_ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
)

ADMIN_EMAILS: list[str] = [
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()
]

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://events:events@localhost:5432/events",
)

CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:4173,http://127.0.0.1:4173,"
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

REDIS_URL: str = os.getenv("REDIS_URL", "")
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
