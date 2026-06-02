from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_session
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import (
    EmailChange,
    PasswordChange,
    ProfileUpdate,
    UserPublic,
    UserRead,
)
from app.services.handles import _slugify

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/search", response_model=list[UserPublic])
async def search_users(
    q: str = Query(..., min_length=1, max_length=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Поиск пользователей по @username, имени или email (кроме себя)."""
    pattern = f"%{q.lstrip('@')}%"
    result = await session.execute(
        select(User)
        .where(
            User.id != current_user.id,
            or_(
                User.username.ilike(pattern),
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
            ),
        )
        .order_by(User.username)
        .limit(10)
    )
    return list(result.scalars().all())


@router.patch("/me", response_model=UserRead)
async def update_profile(
    payload: ProfileUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> User:
    """Обновление профиля: имя, @username, аватар."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    if payload.avatar is not None:
        avatar = payload.avatar.strip()
        if avatar and not avatar.startswith("data:image/"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Неверный формат изображения",
            )
        current_user.avatar = avatar or None

    if payload.username is not None:
        new_username = _slugify(payload.username)
        if len(new_username) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Username: минимум 3 латинских символа/цифры",
            )
        if new_username != current_user.username:
            taken = await session.execute(
                select(User.id).where(
                    User.username == new_username, User.id != current_user.id
                )
            )
            if taken.scalar_one_or_none() is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Этот @username уже занят",
                )
            current_user.username = new_username

    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.post("/me/email", response_model=UserRead)
async def change_email(
    payload: EmailChange,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> User:
    """Смена email (требует текущий пароль)."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=403, detail="Неверный текущий пароль")

    new_email = str(payload.new_email).lower()
    if new_email != current_user.email.lower():
        taken = await session.execute(
            select(User.id).where(User.email == new_email, User.id != current_user.id)
        )
        if taken.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="Этот email уже занят")
        current_user.email = new_email

    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: PasswordChange,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    """Смена пароля (требует текущий пароль)."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=403, detail="Неверный текущий пароль")
    current_user.hashed_password = hash_password(payload.new_password)
    await session.commit()
