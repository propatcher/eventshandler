"""event time

Revision ID: 0005_event_time
Revises: 0004_event_location
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_event_time"
down_revision: Union[str, None] = "0004_event_location"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("events", sa.Column("time", sa.String(length=5), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "time")
