import uuid
from unittest.mock import patch

from sqlalchemy.orm import Session

from app.crud.entries import create_entry, get_entries_by_newsletter
from app.crud.newsletters import create_newsletter, get_newsletter, get_newsletters
from app.crud.settings import create_or_update_settings, get_settings
from app.schemas.entries import EntryCreate
from app.schemas.newsletters import NewsletterCreate
from app.schemas.settings import SettingsCreate


def test_create_or_update_settings(db_session: Session):
    """Test creating or updating settings."""
    settings_data = SettingsCreate(
        imap_server="imap.test.com",
        imap_username="test@test.com",
        imap_password="password",
        search_folder="INBOX",
        move_to_folder="Archive",
        mark_as_read=True,
    )
    settings = create_or_update_settings(db_session, settings_data)
    assert settings.imap_server == "imap.test.com"
    assert settings.mark_as_read

    updated_settings_data = SettingsCreate(
        imap_server="imap.updated.com",
        imap_username="updated@test.com",
        imap_password="new_password",
        search_folder="Inbox",
        move_to_folder=None,
        mark_as_read=False,
    )
    updated_settings = create_or_update_settings(db_session, updated_settings_data)
    assert updated_settings.imap_server == "imap.updated.com"
    assert not updated_settings.mark_as_read
    assert updated_settings.move_to_folder is None


def test_get_settings(db_session: Session):
    """Test getting settings."""
    settings_data = SettingsCreate(
        imap_server="imap.get.com",
        imap_username="get@test.com",
        imap_password="get_password",
        search_folder="INBOX",
        move_to_folder=None,
        mark_as_read=False,
    )
    create_or_update_settings(db_session, settings_data)
    settings = get_settings(db_session)
    assert settings.imap_server == "imap.get.com"


def test_get_settings_with_env_override(db_session: Session):
    """Test getting settings with environment variable override."""
    # 1. Create initial settings in the database
    db_settings_data = SettingsCreate(
        imap_server="db.imap.com",
        imap_username="db_user",
        imap_password="db_pass",
        email_check_interval=15,
    )
    create_or_update_settings(db_session, db_settings_data)

    # 2. Patch the env_settings to simulate environment variables
    with patch("app.crud.settings.env_settings") as mock_env_settings:
        mock_env_settings.model_dump.return_value = {
            "imap_server": "env.imap.com",
            "imap_username": "env_user",
            "imap_password": "env_pass",
            "email_check_interval": 30,
        }
        mock_env_settings.imap_password = "env_pass"

        # 3. Call get_settings and assert the override
        settings = get_settings(db_session, with_password=True)
        assert settings.imap_server == "env.imap.com"
        assert settings.imap_username == "env_user"
        assert settings.imap_password == "env_pass"
        assert settings.email_check_interval == 30
        assert "imap_server" in settings.locked_fields
        assert "imap_username" in settings.locked_fields

        # 4. Call create_or_update_settings and assert that locked fields are not updated
        update_data = SettingsCreate(
            imap_server="new.imap.com",
            imap_username="new_user",
            imap_password="new_pass",
            email_check_interval=45,
        )
        updated_settings = create_or_update_settings(db_session, update_data)
        assert updated_settings.imap_server == "env.imap.com"  # Should not change
        assert updated_settings.imap_username == "env_user"  # Should not change
        assert updated_settings.email_check_interval == 30  # Should not change


def test_create_newsletter(db_session: Session):
    """Test creating a newsletter."""
    unique_email = f"sender_{uuid.uuid4()}@test.com"
    newsletter_data = NewsletterCreate(
        name="Test Newsletter 1", sender_emails=[unique_email]
    )
    newsletter = create_newsletter(db_session, newsletter_data)
    assert newsletter.name == "Test Newsletter 1"
    assert newsletter.is_active
    assert len(newsletter.senders) == 1
    assert newsletter.senders[0].email == unique_email


def test_get_newsletter(db_session: Session):
    """Test getting a single newsletter."""
    unique_email = f"sender_{uuid.uuid4()}@test.com"
    newsletter_data = NewsletterCreate(
        name="Test Newsletter 2", sender_emails=[unique_email]
    )
    created_newsletter = create_newsletter(db_session, newsletter_data)
    newsletter = get_newsletter(db_session, created_newsletter.id)
    assert newsletter.name == "Test Newsletter 2"
    assert len(newsletter.senders) == 1
    assert newsletter.senders[0].email == unique_email


def test_get_newsletters(db_session: Session):
    """Test getting multiple newsletters."""
    create_newsletter(
        db_session,
        NewsletterCreate(
            name="Test Newsletter 3", sender_emails=[f"sender_{uuid.uuid4()}@test.com"]
        ),
    )
    create_newsletter(
        db_session,
        NewsletterCreate(
            name="Test Newsletter 4", sender_emails=[f"sender_{uuid.uuid4()}@test.com"]
        ),
    )
    newsletters = get_newsletters(db_session)
    assert len(newsletters) >= 2


def test_create_entry(db_session: Session):
    """Test creating a newsletter entry."""
    unique_email = f"sender_{uuid.uuid4()}@test.com"
    newsletter_data = NewsletterCreate(
        name="Test Newsletter 5", sender_emails=[unique_email]
    )
    newsletter = create_newsletter(db_session, newsletter_data)
    entry_data = EntryCreate(subject="Test Subject", body="Test Body")
    entry = create_entry(db_session, entry_data, newsletter.id)
    assert entry.subject == "Test Subject"
    assert entry.newsletter_id == newsletter.id


def test_get_entries_by_newsletter(db_session: Session):
    """Test getting entries for a newsletter."""
    unique_email = f"sender_{uuid.uuid4()}@test.com"
    newsletter_data = NewsletterCreate(
        name="Test Newsletter 6", sender_emails=[unique_email]
    )
    newsletter = create_newsletter(db_session, newsletter_data)
    create_entry(
        db_session, EntryCreate(subject="Entry 1", body="Body 1"), newsletter.id
    )
    create_entry(
        db_session, EntryCreate(subject="Entry 2", body="Body 2"), newsletter.id
    )
    entries = get_entries_by_newsletter(db_session, newsletter.id)
    assert len(entries) == 2
    assert entries[0].subject == "Entry 1"
