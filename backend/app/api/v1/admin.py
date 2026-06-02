from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user
from app.core.database import get_session
from app.models.event import Event
from app.models.notification import Notification
from app.models.user import User
from app.schemas.admin import AdminUserRead, BroadcastRequest, BroadcastResult

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserRead])
async def list_all_users(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_admin_user),
):
    """Все пользователи системы с количеством их мероприятий."""
    counts = await session.execute(
        select(Event.owner_id, func.count()).group_by(Event.owner_id)
    )
    count_map = {oid: c for oid, c in counts.all()}

    users = await session.execute(select(User).order_by(User.id))
    result = []
    for u in users.scalars().all():
        item = AdminUserRead.model_validate(u)
        item.events_count = count_map.get(u.id, 0)
        result.append(item)
    return result


@router.post("/broadcast", response_model=BroadcastResult)
async def broadcast(
    payload: BroadcastRequest,
    session: AsyncSession = Depends(get_session),
    admin: User = Depends(get_admin_user),
):
    """Массовая рассылка уведомления всем пользователям."""
    ids = await session.execute(select(User.id))
    user_ids = [uid for (uid,) in ids.all()]

    for uid in user_ids:
        session.add(
            Notification(
                user_id=uid,
                type="broadcast",
                title=payload.title,
                body=payload.body,
                actor_id=admin.id,
            )
        )
    await session.commit()
    return BroadcastResult(sent=len(user_ids))
