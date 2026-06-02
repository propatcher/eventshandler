from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationRead(BaseModel):
    id: int
    type: str
    title: str
    body: str | None = None
    is_read: bool
    event_id: int | None = None
    actor_id: int | None = None
    actor_username: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCount(BaseModel):
    count: int


class ReplyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
