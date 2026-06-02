from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.api.deps import get_current_user
from app.core.database import get_session
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead, ReplyRequest, UnreadCount

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Все уведомления пользователя (новые сверху)."""
    actor = aliased(User)
    rows = await session.execute(
        select(Notification, actor.username)
        .outerjoin(actor, actor.id == Notification.actor_id)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(100)
    )
    result = []
    for n, actor_username in rows.all():
        item = NotificationRead.model_validate(n)
        item.actor_username = actor_username
        result.append(item)
    return result


@router.get("/unread-count", response_model=UnreadCount)
async def unread_count(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    count = await session.scalar(
        select(func.count())
        .select_from(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
    )
    return UnreadCount(count=count or 0)


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    notification_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    n = await session.get(Notification, notification_id)
    if n is None or n.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    n.is_read = True
    await session.commit()


@router.post("/{notification_id}/reply", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
async def reply_notification(
    notification_id: int,
    payload: ReplyRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Ответить на уведомление/новость — ответ уходит отправителю."""
    n = await session.get(Notification, notification_id)
    if n is None or n.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    if n.actor_id is None:
        raise HTTPException(status_code=400, detail="На это уведомление нельзя ответить")
    if n.actor_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя ответить самому себе")

    reply = Notification(
        user_id=n.actor_id,
        type="reply",
        title=f"@{current_user.username} ответил(а): {n.title}"[:255],
        body=payload.text,
        actor_id=current_user.id,
        event_id=n.event_id,
    )
    session.add(reply)
    n.is_read = True
    await session.commit()
    await session.refresh(reply)

    item = NotificationRead.model_validate(reply)
    item.actor_username = current_user.username
    return item


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    await session.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )
    await session.commit()
