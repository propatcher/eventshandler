from fastapi import APIRouter, Depends, HTTPException, status
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
        # Пользователь явно указал @username — проверяем занятость.
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

    # Первый пользователь в системе или адрес из ADMIN_EMAILS → админ.
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
    await session.flush()  # получаем user.id

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
    session: AsyncSession = Depends(get_session),
) -> Token:
    """Аутентификация по email ИЛИ @username и паролю."""
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
