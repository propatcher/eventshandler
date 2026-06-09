import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.cache import close_client
from app.core.config import CORS_ORIGINS
from app.core.database import async_session_factory
from app.services.reminders import send_due_reminders

logger = logging.getLogger("app")

_REMINDER_INTERVAL = 3600


async def _reminder_loop():
    """Фоновая задача: периодически рассылает напоминания о событиях."""
    while True:
        try:
            async with async_session_factory() as session:
                await send_due_reminders(session)
        except Exception:
            logger.exception("Сбой в фоновом цикле напоминаний")
        await asyncio.sleep(_REMINDER_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_reminder_loop())
    yield
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    await close_client()


app = FastAPI(
    title="Eventlys API",
    description="Программный интерфейс платформы управления мероприятиями Eventlys",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1024)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault(
        "Permissions-Policy", "camera=(), microphone=(), geolocation=()"
    )
    return response

app.include_router(api_router)


@app.exception_handler(RequestValidationError)
async def on_validation_error(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Единый, аккуратный формат ошибок валидации.

    - убираем технический префикс «Value error, » из сообщений;
    - не возвращаем поле `input` (туда мог бы попасть присланный пароль);
    - отдаём имя поля и стабильный код ошибки для клиента.
    """
    errors = []
    for err in exc.errors():
        msg = err.get("msg") or "Некорректное значение"
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, ") :]
        loc = [
            str(part)
            for part in err.get("loc", ())
            if part not in ("body", "query", "path")
        ]
        errors.append(
            {"field": loc[-1] if loc else None, "type": err.get("type"), "msg": msg}
        )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": errors},
    )


@app.get("/")
async def root():
    return {"status": "ok", "message": "Сервер успешно запущен"}


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
