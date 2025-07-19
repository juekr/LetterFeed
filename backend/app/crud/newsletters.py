from nanoid import generate
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.entries import Entry
from app.models.newsletters import Newsletter, Sender
from app.schemas.newsletters import NewsletterCreate, NewsletterUpdate

logger = get_logger(__name__)


def get_newsletter(db: Session, newsletter_id: str):
    """Retrieve a single newsletter by its ID."""
    logger.debug(f"Querying for newsletter with id={newsletter_id}")
    result = (
        db.query(Newsletter, func.count(Entry.id))
        .outerjoin(Entry, Newsletter.id == Entry.newsletter_id)
        .filter(Newsletter.id == newsletter_id)
        .group_by(Newsletter.id)
        .first()
    )
    if result:
        newsletter, count = result
        newsletter.entries_count = count
        return newsletter
    return None


def get_newsletters(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve a list of newsletters."""
    logger.debug(f"Querying for newsletters with skip={skip}, limit={limit}")
    results = (
        db.query(Newsletter, func.count(Entry.id))
        .outerjoin(Entry, Newsletter.id == Entry.newsletter_id)
        .group_by(Newsletter.id)
        .order_by(Newsletter.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    newsletters_with_count = []
    for newsletter, count in results:
        newsletter.entries_count = count
        newsletters_with_count.append(newsletter)

    return newsletters_with_count


def create_newsletter(db: Session, newsletter: NewsletterCreate):
    """Create a new newsletter."""
    logger.info(f"Creating new newsletter with name '{newsletter.name}'")
    db_newsletter = Newsletter(
        id=generate(size=10),
        name=newsletter.name,
        extract_content=newsletter.extract_content,
        move_to_folder=newsletter.move_to_folder,
    )
    db.add(db_newsletter)
    db.commit()
    db.refresh(db_newsletter)

    for email in newsletter.sender_emails:
        db_sender = Sender(id=generate(), email=email, newsletter_id=db_newsletter.id)
        db.add(db_sender)

    db.commit()
    db.refresh(db_newsletter)

    logger.info(f"Successfully created newsletter with id={db_newsletter.id}")
    db_newsletter.entries_count = 0
    return db_newsletter


def update_newsletter(
    db: Session, newsletter_id: str, newsletter_update: NewsletterUpdate
):
    """Update an existing newsletter."""
    logger.info(f"Updating newsletter with id={newsletter_id}")
    db_newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
    if not db_newsletter:
        return None

    db_newsletter.name = newsletter_update.name
    db_newsletter.move_to_folder = newsletter_update.move_to_folder
    db_newsletter.extract_content = newsletter_update.extract_content

    # More efficient sender update
    existing_emails = {sender.email for sender in db_newsletter.senders}
    new_emails = set(newsletter_update.sender_emails)

    # Remove senders that are no longer in the list
    for sender in db_newsletter.senders:
        if sender.email not in new_emails:
            db.delete(sender)

    # Add new senders
    for email in new_emails:
        if email not in existing_emails:
            db_sender = Sender(
                id=generate(), email=email, newsletter_id=db_newsletter.id
            )
            db.add(db_sender)

    db.commit()
    db.refresh(db_newsletter)

    logger.info(f"Successfully updated newsletter with id={db_newsletter.id}")
    return get_newsletter(db, newsletter_id)


def delete_newsletter(db: Session, newsletter_id: str):
    """Delete a newsletter by its ID."""
    logger.info(f"Deleting newsletter with id={newsletter_id}")
    db_newsletter = get_newsletter(db, newsletter_id)
    if not db_newsletter:
        return None

    db.delete(db_newsletter)
    db.commit()
    logger.info(f"Successfully deleted newsletter with id={newsletter_id}")
    return db_newsletter
