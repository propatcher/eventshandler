from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BroadcastRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1, max_length=4000)


class BroadcastResult(BaseModel):
    sent: int


class AdminUserRead(BaseModel):
    id: int
    email: EmailStr
    username: str | None = None
    full_name: str | None = None
    avatar: str | None = None
    role: str
    events_count: int = 0

    model_config = ConfigDict(from_attributes=True)
