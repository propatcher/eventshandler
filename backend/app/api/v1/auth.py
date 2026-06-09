import time
from collections import deque

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import ADMIN_EMAILS
from app.core.database import get_session
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserRead
from app.services.handles import generate_unique_username
from app.services.notifications import notify

router = APIRouter(prefix="/auth", tags=["auth"])

_LOGIN_ATTEMPTS: dict[str, deque[float]] = {}
_LOGIN_LIMIT = 10
_LOGIN_WINDOW = 60.0


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_login_rate(ip: str) -> None:
    """Простая защита от перебора пароля: не более 10 попыток в минуту с одного IP."""
    now = time.monotonic()
    attempts = _LOGIN_ATTEMPTS.setdefault(ip, deque())
    while attempts and now - attempts[0] > _LOGIN_WINDOW:
        attempts.popleft()
    if len(attempts) >= _LOGIN_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много попыток входа. Подождите минуту и попробуйте снова",
        )
    attempts.append(now)
    if len(_LOGIN_ATTEMPTS) > 2048:
        for key in [k for k, v in _LOGIN_ATTEMPTS.items() if not v]:
            del _LOGIN_ATTEMPTS[key]


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    session: AsyncSession = Depends(get_session),
) -> Token:
    """Регистрация: создаёт пользователя, @username, роль и приветствие."""
    existing = await session.execute(
        select(User).where(User.email == payload.email)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email уже существует",
        )

    if payload.username:
        desired = payload.username.lower()
        taken = await session.execute(
            select(User.id).where(func.lower(User.username) == desired)
        )
        if taken.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Это имя пользователя уже занято",
            )
        username = desired
    else:
        username = await generate_unique_username(session, payload.email)

    total_users = await session.scalar(select(func.count()).select_from(User))
    is_admin = (total_users == 0) or (payload.email.lower() in ADMIN_EMAILS)

    user = User(
        email=payload.email,
        username=username,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role="admin" if is_admin else "user",
    )
    session.add(user)
    await session.flush()

    await notify(
        session,
        user_id=user.id,
        type="welcome",
        title=f"Добро пожаловать, @{user.username}!",
        body=(
            "Рады видеть вас на платформе Evently. Создавайте мероприятия, "
            "приглашайте коллег и следите за уведомлениями здесь. Удачи!"
        ),
    )

    await session.commit()
    await session.refresh(user)
    return Token(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=Token)
async def login(
    payload: UserLogin,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> Token:
    """Аутентификация по email ИЛИ @username и паролю."""
    _check_login_rate(_client_ip(request))
    ident = payload.login.strip().lstrip("@")
    result = await session.execute(
        select(User).where(
            or_(
                func.lower(User.email) == ident.lower(),
                func.lower(User.username) == ident.lower(),
            )
        )
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )
    return Token(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    """Профиль текущего пользователя."""
    return current_user
