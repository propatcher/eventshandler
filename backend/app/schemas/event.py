from datetime import date as date_type
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


_MAX_DURATION_MINUTES = 30 * 24 * 60


class EventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    date: date_type
    time: str | None = Field(default=None, max_length=5)
    duration_minutes: int | None = Field(default=None, ge=1, le=_MAX_DURATION_MINUTES)
    description: str | None = None
    status: str = Field(default="Планируется", max_length=50)
    location: str | None = Field(default=None, max_length=255)


class EventCreate(EventBase):
    """Данные для создания мероприятия."""


class EventUpdate(BaseModel):
    """Частичное обновление мероприятия (все поля опциональны)."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    date: date_type | None = None
    time: str | None = Field(default=None, max_length=5)
    duration_minutes: int | None = Field(default=None, ge=1, le=_MAX_DURATION_MINUTES)
    description: str | None = None
    status: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=255)


class EventRead(EventBase):
    """Мероприятие, отдаваемое клиенту."""

    id: int
    owner_id: int
    owner_username: str | None = None
    is_owner: bool = True
    participants_count: int = 0
    ends_at: datetime | None = None
    is_past: bool = False

    model_config = ConfigDict(from_attributes=True)


class InviteRequest(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=255)


class RespondRequest(BaseModel):
    accept: bool


class ParticipantRead(BaseModel):
    user: UserPublic
    status: str
    invited_by_id: int | None = None


class EventMessageCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class EventMessageRead(BaseModel):
    id: int
    text: str
    created_at: datetime
    author: UserPublic

    model_config = ConfigDict(from_attributes=True)
