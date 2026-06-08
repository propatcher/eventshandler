from fastapi import APIRouter

from app.api.v1 import admin, auth, chat, events, notifications, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(events.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
api_router.include_router(chat.router)
