import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic_core import PydanticCustomError

PASSWORD_RULES = "Пароль должен быть не короче 8 символов и содержать хотя бы одну букву и одну цифру"
USERNAME_RULES = "Имя пользователя: 3–30 символов, только латинские буквы, цифры и подчёркивание"

_USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")


def validate_password(v: str) -> str:
    # PydanticCustomError даёт чистое сообщение без префикса «Value error,»
    # и стабильный код ошибки для клиента.
    if len(v) < 8 or not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
        raise PydanticCustomError("weak_password", PASSWORD_RULES)
    return v


def validate_username(v: str | None) -> str | None:
    if v is None:
        return v
    if not _USERNAME_RE.fullmatch(v):
        raise PydanticCustomError("invalid_username", USERNAME_RULES)
    return v


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=50)

    _vp = field_validator("password")(validate_password)
    _vu = field_validator("username")(validate_username)


class UserLogin(BaseModel):
    # Вход по email ИЛИ по @username.
    login: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    username: str | None = None
    avatar: str | None = None
    role: str = "user"

    model_config = ConfigDict(from_attributes=True)


class UserPublic(BaseModel):
    id: int
    username: str | None = None
    full_name: str | None = None
    email: EmailStr
    avatar: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=50)
    avatar: str | None = Field(default=None, max_length=700_000)

    _vu = field_validator("username")(validate_username)


class EmailChange(BaseModel):
    new_email: EmailStr
    current_password: str = Field(..., min_length=1)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., max_length=128)

    _vp = field_validator("new_password")(validate_password)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
