"""event duration

Revision ID: 0008_event_duration
Revises: 0007_event_messages
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_event_duration"
down_revision: Union[str, None] = "0007_event_messages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("events", "duration_minutes")
