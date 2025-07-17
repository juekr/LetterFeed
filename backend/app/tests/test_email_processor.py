import imaplib
from email.message import Message
from unittest.mock import MagicMock

from sqlalchemy.orm import Session

from app.crud.newsletters import create_newsletter
from app.crud.settings import create_or_update_settings
from app.schemas.newsletters import NewsletterCreate
from app.schemas.settings import SettingsCreate
from app.services.email_processor import _process_single_email


def test_process_single_email_with_newsletter_move_folder(db_session: Session):
    """Test that the per-newsletter move_to_folder is used when set, overriding the global setting."""
    # 1. ARRANGE
    # Global settings with a move folder
    settings_data = SettingsCreate(
        imap_server="test.com",
        imap_username="test",
        imap_password="password",
        move_to_folder="GlobalArchive",
    )
    settings = create_or_update_settings(db_session, settings_data)

    # Newsletter with a specific move folder
    newsletter_data = NewsletterCreate(
        name="Test Newsletter",
        sender_emails=["test@example.com"],
    )
    newsletter = create_newsletter(db_session, newsletter_data)
    newsletter.move_to_folder = "NewsletterArchive"
    db_session.commit()

    # Mock IMAP mail object
    mock_mail = MagicMock(spec=imaplib.IMAP4_SSL)

    # Mock email message
    msg = Message()
    msg["From"] = "test@example.com"
    msg["Subject"] = "Test Email"
    msg["Message-ID"] = "<test-message-id>"

    # Mock mail.fetch to return the message
    mock_mail.fetch.return_value = ("OK", [(b"1 (RFC822)", msg.as_bytes())])

    sender_map = {"test@example.com": newsletter}

    # 2. ACT
    _process_single_email("1", mock_mail, db_session, sender_map, settings)

    # 3. ASSERT
    # Check that the email was moved to the newsletter-specific folder
    mock_mail.copy.assert_called_once_with("1", "NewsletterArchive")
    mock_mail.store.assert_any_call("1", "+FLAGS", "\\Deleted")


def test_process_single_email_with_global_move_folder(db_session: Session):
    """Test that the global move_to_folder is used when the per-newsletter setting is not set."""
    # 1. ARRANGE
    # Global settings with a move folder
    settings_data = SettingsCreate(
        imap_server="test.com",
        imap_username="test",
        imap_password="password",
        move_to_folder="GlobalArchive",
    )
    settings = create_or_update_settings(db_session, settings_data)

    # Newsletter without a specific move folder
    newsletter_data = NewsletterCreate(
        name="Test Newsletter",
        sender_emails=["test@example.com"],
    )
    newsletter = create_newsletter(db_session, newsletter_data)

    # Mock IMAP mail object
    mock_mail = MagicMock(spec=imaplib.IMAP4_SSL)

    # Mock email message
    msg = Message()
    msg["From"] = "test@example.com"
    msg["Subject"] = "Test Email"
    msg["Message-ID"] = "<test-message-id-2>"

    # Mock mail.fetch to return the message
    mock_mail.fetch.return_value = ("OK", [(b"1 (RFC822)", msg.as_bytes())])

    sender_map = {"test@example.com": newsletter}

    # 2. ACT
    _process_single_email("1", mock_mail, db_session, sender_map, settings)

    # 3. ASSERT
    # Check that the email was moved to the global folder
    mock_mail.copy.assert_called_once_with("1", "GlobalArchive")
    mock_mail.store.assert_any_call("1", "+FLAGS", "\\Deleted")
