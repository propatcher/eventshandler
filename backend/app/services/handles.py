import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


def _slugify(value: str) -> str:
    """Латиница/цифры из строки; транслитерация базовой кириллицы."""
    table = str.maketrans(
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
        "abvgdeejziyklmnoprstufhccss_y_eua",
    )
    value = value.lower().translate(table)
    value = re.sub(r"[^a-z0-9_]+", "", value)
    return value[:30]


async def generate_unique_username(
    session: AsyncSession, email: str, desired: str | None = None
) -> str:
    """Возвращает уникальный @username.

    Берёт желаемый (если задан) либо local-part из email,
    при коллизии добавляет числовой суффикс.
    """
    base = _slugify(desired or email.split("@")[0]) or "user"
    candidate = base
    suffix = 0
    while True:
        exists = await session.execute(
            select(User.id).where(User.username == candidate)
        )
        if exists.scalar_one_or_none() is None:
            return candidate
        suffix += 1
        candidate = f"{base}{suffix}"
