import uuid

from sqlalchemy.orm import Session

from app.crud.entries import create_entry
from app.crud.newsletters import create_newsletter
from app.schemas.entries import EntryCreate
from app.schemas.newsletters import NewsletterCreate
from app.services.feed_generator import generate_feed


def test_generate_feed(db_session: Session):
    """Test the feed generation for a newsletter with entries."""
    # Create a newsletter
    newsletter_data = NewsletterCreate(
        name="Feed Test Newsletter", sender_emails=["feed@example.com"]
    )
    newsletter = create_newsletter(db_session, newsletter_data)

    # Create entries for the newsletter
    entry1_data = EntryCreate(
        subject="First Entry",
        body="<p>This is the first entry.</p>",
        message_id=f"<{uuid.uuid4()}@test.com>",
    )
    create_entry(db_session, entry1_data, newsletter.id)

    entry2_data = EntryCreate(
        subject="Second Entry",
        body="<p>This is the second entry.</p>",
        message_id=f"<{uuid.uuid4()}@test.com>",
    )
    create_entry(db_session, entry2_data, newsletter.id)

    # Generate the feed
    feed_xml = generate_feed(db_session, newsletter.id)
    assert feed_xml is not None

    # Parse the feed XML to verify content (simplified check)
    # In a real scenario, you'd use an XML parser to validate structure and content more thoroughly
    assert f"<title>{newsletter.name}</title>" in feed_xml.decode()
    assert f"<id>urn:letterfeed:newsletter:{newsletter.id}</id>" in feed_xml.decode()
    assert '<link href="http://localhost:8000/" rel="alternate"/>' in feed_xml.decode()
    assert "<logo>http://localhost:8000/logo.png</logo>" in feed_xml.decode()
    assert "<icon>http://localhost:8000/favicon.ico</icon>" in feed_xml.decode()
    assert "<title>First Entry</title>" in feed_xml.decode()
    assert "<title>Second Entry</title>" in feed_xml.decode()
    assert (
        '<content type="html">&lt;p&gt;This is the first entry.&lt;/p&gt;</content>'
        in feed_xml.decode()
    )


def test_generate_feed_nonexistent_newsletter(db_session: Session):
    """Test feed generation for a non-existent newsletter."""
    feed_xml = generate_feed(db_session, 999)  # Non-existent newsletter ID
    assert feed_xml is None
