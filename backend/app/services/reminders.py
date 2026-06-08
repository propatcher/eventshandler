from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event
from app.models.notification import Notification
from app.models.participant import EventParticipant


async def send_due_reminders(session: AsyncSession) -> int:
    """Создаёт напоминания для мероприятий, наступающих сегодня или завтра.

    Получатели — владелец и принявшие приглашение участники.
    Каждое мероприятие напоминается один раз (флаг reminder_sent).
    Возвращает число обработанных мероприятий.
    """
    today = date.today()
    horizon = today + timedelta(days=1)

    result = await session.execute(
        select(Event).where(
            Event.reminder_sent.is_(False),
            Event.date >= today,
            Event.date <= horizon,
            Event.status != "Завершено",
        )
    )
    events = result.scalars().all()

    sent = 0
    for ev in events:
        if ev.is_past:
            continue
        recipients = {ev.owner_id}
        prows = await session.execute(
            select(EventParticipant.user_id).where(
                EventParticipant.event_id == ev.id,
                EventParticipant.status == "accepted",
            )
        )
        recipients.update(uid for (uid,) in prows.all())

        when = ev.date.isoformat() + (f" в {ev.time}" if ev.time else "")
        place = f" · {ev.location}" if ev.location else ""
        for uid in recipients:
            session.add(
                Notification(
                    user_id=uid,
                    type="reminder",
                    title=f"Скоро мероприятие: {ev.title}",
                    body=f"Состоится {when}{place}.",
                    event_id=ev.id,
                )
            )
        ev.reminder_sent = True
        sent += 1

    if sent:
        await session.commit()
    return sent
