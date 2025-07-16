from typing import List

from pydantic import BaseModel, ConfigDict


class SenderBase(BaseModel):
    """Base schema for a sender."""

    email: str


class SenderCreate(SenderBase):
    """Schema for creating a new sender."""

    pass


class Sender(SenderBase):
    """Schema for retrieving a sender with its ID and newsletter ID."""

    id: int
    newsletter_id: int

    model_config = ConfigDict(from_attributes=True)


class NewsletterBase(BaseModel):
    """Base schema for a newsletter."""

    name: str
    extract_content: bool = False


class NewsletterCreate(NewsletterBase):
    """Schema for creating a new newsletter."""

    sender_emails: List[str]


class NewsletterUpdate(NewsletterBase):
    """Schema for updating an existing newsletter."""

    sender_emails: List[str]


class Newsletter(NewsletterBase):
    """Schema for retrieving a newsletter with its ID, active status, senders, and entries count."""

    id: int
    is_active: bool
    senders: List[Sender] = []
    entries_count: int

    model_config = ConfigDict(from_attributes=True)
