import datetime

from pydantic import BaseModel, ConfigDict


class EntryBase(BaseModel):
    """Base schema for an entry."""

    subject: str
    body: str
    message_id: str


class EntryCreate(EntryBase):
    """Schema for creating a new entry."""

    pass


class Entry(EntryBase):
    """Schema for retrieving an entry with its ID and newsletter ID."""

    id: int
    newsletter_id: int
    received_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
