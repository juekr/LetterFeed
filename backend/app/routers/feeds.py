from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.services.feed_generator import generate_feed

logger = get_logger(__name__)
router = APIRouter()


@router.get("/feeds/{newsletter_id}")
def get_newsletter_feed(newsletter_id: int, db: Session = Depends(get_db)):
    """Generate an Atom feed for a specific newsletter."""
    logger.info(f"Generating feed for newsletter_id={newsletter_id}")
    feed = generate_feed(db, newsletter_id)
    if not feed:
        logger.warning(
            f"Newsletter with id={newsletter_id} not found, cannot generate feed."
        )
        raise HTTPException(status_code=404, detail="Newsletter not found")

    logger.info(f"Successfully generated feed for newsletter_id={newsletter_id}")
    return Response(content=feed, media_type="application/atom+xml")
