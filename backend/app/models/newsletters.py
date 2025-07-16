from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Newsletter(Base):
    """Represents a newsletter, which can have multiple senders and entries."""

    __tablename__ = "newsletters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    is_active = Column(Boolean, default=True)

    senders = relationship(
        "Sender", back_populates="newsletter", cascade="all, delete-orphan"
    )
    entries = relationship(
        "Entry", back_populates="newsletter", cascade="all, delete-orphan"
    )


class Sender(Base):
    """Represents an email sender associated with a newsletter."""

    __tablename__ = "senders"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), nullable=False)

    newsletter = relationship("Newsletter", back_populates="senders")
