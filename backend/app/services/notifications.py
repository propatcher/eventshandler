from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


def make_notification(
    *,
    user_id: int,
    type: str,
    title: str,
    body: str | None = None,
    event_id: int | None = None,
    actor_id: int | None = None,
) -> Notification:
    return Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        event_id=event_id,
        actor_id=actor_id,
    )


async def notify(session: AsyncSession, **kwargs) -> Notification:
    n = make_notification(**kwargs)
    session.add(n)
    return n
