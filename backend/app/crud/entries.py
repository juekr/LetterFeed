from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.entries import Entry
from app.schemas.entries import EntryCreate

logger = get_logger(__name__)


def get_entries_by_newsletter(
    db: Session, newsletter_id: int, skip: int = 0, limit: int = 100
):
    """Retrieve entries for a specific newsletter."""
    logger.debug(
        f"Querying entries for newsletter_id={newsletter_id}, skip={skip}, limit={limit}"
    )
    return (
        db.query(Entry)
        .filter(Entry.newsletter_id == newsletter_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_entry(db: Session, entry: EntryCreate, newsletter_id: int):
    """Create a new entry for a newsletter."""
    logger.info(
        f"Creating new entry for newsletter_id={newsletter_id} with subject '{entry.subject}'"
    )
    db_entry = Entry(**entry.model_dump(), newsletter_id=newsletter_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    logger.info(f"Successfully created entry with id={db_entry.id}")
    return db_entry
