import os

from dotenv import load_dotenv

# Загружаем переменные окружения из backend/.env (если файл есть).
load_dotenv()

# --- Безопасность / JWT ---
# В продакшене ОБЯЗАТЕЛЬНО задайте свой SECRET_KEY через переменную окружения.
SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-me-in-production")
JWT_ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")  # 24 часа
)

# Email-адреса, которые при регистрации получают роль администратора.
# Плюс: самый первый зарегистрированный пользователь тоже становится админом.
ADMIN_EMAILS: list[str] = [
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()
]

# Настройки приложения.
# По умолчанию используется локальная SQLite-база (через aiosqlite),
# чтобы проект запускался без поднятия PostgreSQL.
# Для PostgreSQL задайте переменную окружения, например:
#   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/events
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./events.db",
)

# Источники, которым разрешён доступ к API (CORS).
# Фронтенд на Vite по умолчанию работает на портах 5173/4173.
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:4173,http://127.0.0.1:4173,"
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

# --- ИИ-поддержка (DeepSeek, OpenAI-совместимый API) ---
DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# --- Redis (кэш) ---
# Пустая строка = кэш отключён (приложение работает и без Redis).
# В Docker задаётся как redis://redis:6379/0
REDIS_URL: str = os.getenv("REDIS_URL", "")
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
