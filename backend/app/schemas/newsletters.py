from typing import List

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.core.slug import sanitize_slug


class SenderBase(BaseModel):
    """Base schema for a sender."""

    email: EmailStr


class SenderCreate(SenderBase):
    """Schema for creating a new sender."""

    pass


class Sender(SenderBase):
    """Schema for retrieving a sender with its ID and newsletter ID."""

    id: str
    newsletter_id: str

    model_config = ConfigDict(from_attributes=True)


class NewsletterBase(BaseModel):
    """Base schema for a newsletter."""

    name: str
    slug: str | None = None
    search_folder: str | None = None
    move_to_folder: str | None = None
    extract_content: bool = False

    @field_validator("slug")
    def sanitize_slug_field(cls, v: str | None) -> str | None:
        """Sanitize slug."""
        return sanitize_slug(v)


class NewsletterCreate(NewsletterBase):
    """Schema for creating a new newsletter."""

    sender_emails: List[EmailStr]


class NewsletterUpdate(NewsletterBase):
    """Schema for updating an existing newsletter."""

    sender_emails: List[EmailStr]


class Newsletter(NewsletterBase):
    """Schema for retrieving a newsletter with its ID, active status, senders, and entries count."""

    id: str
    is_active: bool
    senders: List[Sender] = []
    entries_count: int

    model_config = ConfigDict(from_attributes=True)
