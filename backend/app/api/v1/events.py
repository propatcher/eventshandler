from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.cache import cache_delete, cache_get_json, cache_set_json
from app.core.database import get_session
from app.models.event import Event
from app.models.event_message import EventMessage
from app.models.notification import Notification
from app.models.participant import EventParticipant
from app.models.user import User
from app.schemas.event import (
    EventCreate,
    EventMessageCreate,
    EventMessageRead,
    EventRead,
    EventUpdate,
    InviteRequest,
    ParticipantRead,
    RespondRequest,
)
from app.schemas.user import UserPublic

router = APIRouter(prefix="/events", tags=["events"])


def _cache_key(user_id: int) -> str:
    return f"events:user:{user_id}"


async def _invalidate_event_caches(session: AsyncSession, event: Event) -> None:
    """Сбрасывает кэш списка у владельца и всех участников события."""
    ids = {event.owner_id}
    rows = await session.execute(
        select(EventParticipant.user_id).where(
            EventParticipant.event_id == event.id
        )
    )
    ids.update(r for (r,) in rows.all())
    for uid in ids:
        await cache_delete(_cache_key(uid))


async def _build_payload(session: AsyncSession, events: list[Event], me_id: int):
    """Сериализует события с владельцем, флагом is_owner и числом участников."""
    if not events:
        return []
    owner_ids = {e.owner_id for e in events}
    owners = await session.execute(
        select(User.id, User.username).where(User.id.in_(owner_ids))
    )
    owner_map = {uid: uname for uid, uname in owners.all()}

    event_ids = [e.id for e in events]
    counts = await session.execute(
        select(EventParticipant.event_id, func.count())
        .where(
            EventParticipant.event_id.in_(event_ids),
            EventParticipant.status == "accepted",
        )
        .group_by(EventParticipant.event_id)
    )
    count_map = {eid: c for eid, c in counts.all()}

    payload = []
    for e in events:
        ends_at = e.ends_at
        payload.append(
            {
                "id": e.id,
                "title": e.title,
                "date": e.date.isoformat(),
                "time": e.time,
                "duration_minutes": e.duration_minutes,
                "description": e.description,
                "status": e.status,
                "location": e.location,
                "owner_id": e.owner_id,
                "owner_username": owner_map.get(e.owner_id),
                "is_owner": e.owner_id == me_id,
                "participants_count": count_map.get(e.id, 0),
                "ends_at": ends_at.isoformat() if ends_at else None,
                "is_past": e.is_past,
            }
        )
    payload.sort(key=lambda x: x["id"], reverse=True)
    return payload


@router.get("", response_model=list[EventRead])
async def list_events(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Свои мероприятия + те, куда приглашён и принял приглашение."""
    key = _cache_key(current_user.id)
    cached = await cache_get_json(key)
    if cached is not None:
        return cached

    owned = await session.execute(
        select(Event).where(Event.owner_id == current_user.id)
    )
    events = {e.id: e for e in owned.scalars().all()}

    shared = await session.execute(
        select(Event)
        .join(EventParticipant, EventParticipant.event_id == Event.id)
        .where(
            EventParticipant.user_id == current_user.id,
            EventParticipant.status == "accepted",
        )
    )
    for e in shared.scalars().all():
        events.setdefault(e.id, e)

    payload = await _build_payload(session, list(events.values()), current_user.id)
    await cache_set_json(key, payload)
    return payload


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    event = Event(**payload.model_dump(), owner_id=current_user.id)
    session.add(event)
    await session.commit()
    await session.refresh(event)
    await cache_delete(_cache_key(current_user.id))
    result = await _build_payload(session, [event], current_user.id)
    return result[0]


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: int,
    payload: EventUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Редактирование мероприятия (только владелец)."""
    event = await session.get(Event, event_id)
    if event is None or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(event, key, value)
    await session.commit()
    await session.refresh(event)
    await _invalidate_event_caches(session, event)

    result = await _build_payload(session, [event], current_user.id)
    return result[0]


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    event = await session.get(Event, event_id)
    if event is None or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    await _invalidate_event_caches(session, event)
    await session.delete(event)
    await session.commit()


@router.delete("/{event_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_event(
    event_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    """Покинуть чужое мероприятие (удалить своё участие)."""
    row = await session.execute(
        select(EventParticipant).where(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == current_user.id,
        )
    )
    participant = row.scalar_one_or_none()
    if participant is None:
        raise HTTPException(status_code=404, detail="Вы не участник этого мероприятия")

    event = await session.get(Event, event_id)
    await session.delete(participant)
    await session.commit()
    await cache_delete(_cache_key(current_user.id))
    if event is not None:
        await cache_delete(_cache_key(event.owner_id))


@router.post("/{event_id}/invite", response_model=ParticipantRead)
async def invite_user(
    event_id: int,
    payload: InviteRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Пригласить пользователя в мероприятие (по @username или email)."""
    event = await session.get(Event, event_id)
    if event is None or event.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")

    ident = payload.identifier.strip().lstrip("@")
    found = await session.execute(
        select(User).where(or_(User.username == ident, User.email == ident))
    )
    target = found.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя пригласить самого себя")

    dup = await session.execute(
        select(EventParticipant).where(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == target.id,
        )
    )
    if dup.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Пользователь уже приглашён")

    participant = EventParticipant(
        event_id=event_id,
        user_id=target.id,
        invited_by_id=current_user.id,
        status="invited",
    )
    session.add(participant)
    session.add(
        Notification(
            user_id=target.id,
            type="invite",
            title=f"@{current_user.username} приглашает вас",
            body=f"Мероприятие «{event.title}» ({event.date.isoformat()}).",
            event_id=event_id,
            actor_id=current_user.id,
        )
    )
    await session.commit()
    await cache_delete(_cache_key(target.id))
    return ParticipantRead(user=target, status="invited", invited_by_id=current_user.id)


@router.get("/{event_id}/participants", response_model=list[ParticipantRead])
async def list_participants(
    event_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Участники мероприятия (для владельца и приглашённых)."""
    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")

    rows = await session.execute(
        select(EventParticipant, User)
        .join(User, User.id == EventParticipant.user_id)
        .where(EventParticipant.event_id == event_id)
    )
    pairs = rows.all()

    allowed = event.owner_id == current_user.id or any(
        p.user_id == current_user.id for p, _ in pairs
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Нет доступа")

    return [
        ParticipantRead(user=u, status=p.status, invited_by_id=p.invited_by_id)
        for p, u in pairs
    ]


@router.post("/{event_id}/respond", response_model=EventRead)
async def respond_invite(
    event_id: int,
    payload: RespondRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Принять или отклонить приглашение."""
    row = await session.execute(
        select(EventParticipant).where(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == current_user.id,
        )
    )
    participant = row.scalar_one_or_none()
    if participant is None:
        raise HTTPException(status_code=404, detail="Приглашение не найдено")

    participant.status = "accepted" if payload.accept else "declined"

    # Помечаем связанные уведомления-приглашения прочитанными.
    notes = await session.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.event_id == event_id,
            Notification.type == "invite",
        )
    )
    for n in notes.scalars().all():
        n.is_read = True

    event = await session.get(Event, event_id)
    # Уведомляем владельца о решении.
    if event is not None:
        verb = "принял(а)" if payload.accept else "отклонил(а)"
        session.add(
            Notification(
                user_id=event.owner_id,
                type="system",
                title=f"@{current_user.username} {verb} приглашение",
                body=f"Мероприятие «{event.title}».",
                event_id=event_id,
                actor_id=current_user.id,
            )
        )

    await session.commit()
    await cache_delete(_cache_key(current_user.id))
    if event is not None:
        await cache_delete(_cache_key(event.owner_id))
        result = await _build_payload(session, [event], current_user.id)
        return result[0]
    raise HTTPException(status_code=404, detail="Мероприятие не найдено")


async def _get_accessible_event(
    session: AsyncSession, event_id: int, user: User
) -> Event:
    """Возвращает событие, если пользователь — владелец или принявший участник."""
    event = await session.get(Event, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")
    if event.owner_id == user.id:
        return event
    row = await session.execute(
        select(EventParticipant).where(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == user.id,
            EventParticipant.status == "accepted",
        )
    )
    if row.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=403, detail="Чат доступен только участникам мероприятия"
        )
    return event


@router.get("/{event_id}/messages", response_model=list[EventMessageRead])
async def list_messages(
    event_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """История чата мероприятия (для владельца и принявших участников)."""
    await _get_accessible_event(session, event_id, current_user)
    rows = await session.execute(
        select(EventMessage, User)
        .join(User, User.id == EventMessage.user_id)
        .where(EventMessage.event_id == event_id)
        .order_by(EventMessage.created_at.asc(), EventMessage.id.asc())
        .limit(300)
    )
    return [
        EventMessageRead(
            id=m.id, text=m.text, created_at=m.created_at,
            author=UserPublic.model_validate(u),
        )
        for m, u in rows.all()
    ]


@router.post(
    "/{event_id}/messages",
    response_model=EventMessageRead,
    status_code=status.HTTP_201_CREATED,
)
async def post_message(
    event_id: int,
    payload: EventMessageCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Отправить сообщение в чат мероприятия."""
    await _get_accessible_event(session, event_id, current_user)
    msg = EventMessage(
        event_id=event_id, user_id=current_user.id, text=payload.text.strip()
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return EventMessageRead(
        id=msg.id, text=msg.text, created_at=msg.created_at,
        author=UserPublic.model_validate(current_user),
    )
