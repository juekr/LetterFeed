import uuid
import xml.etree.ElementTree as ET

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

    # Parse the feed XML to verify content
    root = ET.fromstring(feed_xml)
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    # Check for top-level elements
    assert root.find("atom:title", ns).text == newsletter.name
    assert root.find("atom:id", ns).text == f"urn:letterfeed:newsletter:{newsletter.id}"
    assert root.find("atom:logo", ns).text.endswith("/logo.png")
    assert root.find("atom:icon", ns).text.endswith("/favicon.ico")

    # Check for the alternate link
    links = root.findall("atom:link", ns)
    assert any(link.get("rel") == "alternate" and link.get("href") for link in links)

    # Check for entries
    entry_titles = [
        entry.find("atom:title", ns).text for entry in root.findall("atom:entry", ns)
    ]
    assert "First Entry" in entry_titles
    assert "Second Entry" in entry_titles

    # Check content of one entry
    first_entry_element = root.find(".//atom:title[.='First Entry']/..", ns)
    assert (
        first_entry_element.find("atom:content", ns).text
        == "<p>This is the first entry.</p>"
    )


def test_generate_feed_nonexistent_newsletter(db_session: Session):
    """Test feed generation for a non-existent newsletter."""
    feed_xml = generate_feed(db_session, "nonexistent-id")
    assert feed_xml is None
