"""event location

Revision ID: 0004_event_location
Revises: 0003_avatar
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_event_location"
down_revision: Union[str, None] = "0003_avatar"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("events", sa.Column("location", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "location")
