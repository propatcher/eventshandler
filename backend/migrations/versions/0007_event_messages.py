"""event chat messages

Revision ID: 0007_event_messages
Revises: 0006_event_reminder
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_event_messages"
down_revision: Union[str, None] = "0006_event_reminder"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "event_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_event_messages_event_id", "event_messages", ["event_id"])
    op.create_index("ix_event_messages_created_at", "event_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_event_messages_created_at", table_name="event_messages")
    op.drop_index("ix_event_messages_event_id", table_name="event_messages")
    op.drop_table("event_messages")
