from datetime import date as date_type
from datetime import datetime, timedelta

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Event(Base):
    """Мероприятие."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    # Время в формате "HH:MM" (опционально).
    time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    # Длительность мероприятия в минутах (опционально).
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="Планируется"
    )
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Отправлено ли напоминание о наступающем мероприятии.
    reminder_sent: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    @property
    def starts_at(self) -> datetime | None:
        """Момент начала (дата + время). None, если время не задано."""
        if not self.time:
            return None
        try:
            hh, mm = (int(part) for part in self.time.split(":"))
            return datetime(self.date.year, self.date.month, self.date.day, hh, mm)
        except (ValueError, TypeError):
            return None

    @property
    def ends_at(self) -> datetime | None:
        """Момент окончания (начало + длительность). None, если время не задано."""
        start = self.starts_at
        if start is None:
            return None
        if self.duration_minutes:
            return start + timedelta(minutes=self.duration_minutes)
        return start

    @property
    def is_past(self) -> bool:
        """Прошло ли мероприятие к текущему моменту.

        Если задано время — ориентируемся на момент окончания (с учётом
        длительности); иначе — на конец суток выбранной даты.
        """
        end = self.ends_at
        now = datetime.now()
        if end is not None:
            return now >= end
        end_of_day = datetime(
            self.date.year, self.date.month, self.date.day, 23, 59, 59
        )
        return now > end_of_day

    @property
    def is_ongoing(self) -> bool:
        """Идёт ли мероприятие прямо сейчас (только если есть время и длительность)."""
        start = self.starts_at
        end = self.ends_at
        if start is None or end is None or end == start:
            return False
        now = datetime.now()
        return start <= now < end
