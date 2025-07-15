from fastapi import APIRouter

from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/health")
def health_check():
    """Perform a health check of the API."""
    logger.info("Health check endpoint called")
    return {"status": "ok"}
