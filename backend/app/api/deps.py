from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.security import decode_token
from app.models.user import User

_bearer = HTTPBearer(auto_error=False)

_credentials_exc = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Недействительные учётные данные",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Достаёт текущего пользователя из JWT в заголовке Authorization."""
    if credentials is None:
        raise _credentials_exc

    subject = decode_token(credentials.credentials)
    if subject is None:
        raise _credentials_exc

    try:
        user_id = int(subject)
    except ValueError:
        raise _credentials_exc

    user = await session.get(User, user_id)
    if user is None:
        raise _credentials_exc
    return user


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Доступ только для администраторов."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора",
        )
    return current_user
