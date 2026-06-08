"""Тонкая обёртка над Redis. Если Redis недоступен/не настроен —
все операции тихо превращаются в no-op, приложение продолжает работать.
"""
import json
from typing import Any

from app.core.config import CACHE_TTL_SECONDS, REDIS_URL

try:
    from redis import asyncio as aioredis
except ImportError:
    aioredis = None

_client = None


def get_client():
    """Ленивая инициализация клиента Redis (или None, если выключен)."""
    global _client
    if not REDIS_URL or aioredis is None:
        return None
    if _client is None:
        _client = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _client


async def cache_get_json(key: str) -> Any | None:
    client = get_client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


async def cache_set_json(key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> None:
    client = get_client()
    if client is None:
        return
    try:
        await client.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass


async def cache_delete(key: str) -> None:
    client = get_client()
    if client is None:
        return
    try:
        await client.delete(key)
    except Exception:
        pass


async def close_client() -> None:
    global _client
    if _client is not None:
        try:
            await _client.aclose()
        except Exception:
            pass
        _client = None
