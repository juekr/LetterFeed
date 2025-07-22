import email
import html
import imaplib
from email.header import decode_header, make_header
from email.message import Message

import trafilatura
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.crud.entries import create_entry, get_entry_by_message_id
from app.crud.newsletters import create_newsletter, get_newsletters
from app.crud.settings import get_settings
from app.models.newsletters import Newsletter
from app.schemas.entries import EntryCreate
from app.schemas.newsletters import NewsletterCreate
from app.schemas.settings import Settings

logger = get_logger(__name__)


def _is_configured(settings: Settings | None) -> bool:
    """Check if IMAP settings are configured."""
    if (
        not settings
        or not settings.imap_server
        or not settings.imap_username
        or not settings.imap_password
    ):
        logger.warning("IMAP settings are not configured. Skipping email processing.")
        return False
    return True


def _connect_to_imap(settings: Settings) -> imaplib.IMAP4_SSL | None:
    """Connect to the IMAP server and select the mailbox."""
    try:
        logger.info(f"Connecting to IMAP server: {settings.imap_server}")
        mail = imaplib.IMAP4_SSL(settings.imap_server)
        mail.login(settings.imap_username, settings.imap_password)
        mail.select(settings.search_folder)
        logger.info(f"Selected mailbox: {settings.search_folder}")
        return mail
    except Exception as e:
        logger.error(f"Failed to connect to IMAP server: {e}", exc_info=True)
        return None


def _fetch_unread_email_ids(mail: imaplib.IMAP4_SSL) -> list[str]:
    """Fetch IDs of unread emails."""
    status, messages = mail.search(None, "(UNSEEN)")
    if status != "OK":
        logger.error(f"Failed to search for unseen emails, status: {status}")
        return []
    return messages[0].split()


def _get_email_body(msg: Message) -> str:
    """Extract body from an email message."""
    body = ""
    for part in msg.walk():
        ctype = part.get_content_type()
        cdispo = str(part.get("Content-Disposition"))
        if "attachment" in cdispo:
            continue
        if ctype in ["text/plain", "text/html"]:
            try:
                payload = part.get_payload(decode=True)
                charset = part.get_content_charset() or "utf-8"
                body = payload.decode(charset, "ignore")
            except Exception:
                pass
    return html.unescape(body)


def _auto_add_newsletter(
    db: Session, sender: str, msg: Message, settings: Settings
) -> Newsletter:
    """Automatically add a new newsletter."""
    logger.info(f"Auto-adding new newsletter for sender: {sender}")
    newsletter_name = email.utils.parseaddr(msg["From"])[0] or sender
    new_newsletter_schema = NewsletterCreate(
        name=newsletter_name, sender_emails=[sender]
    )
    return create_newsletter(db, new_newsletter_schema)


def _process_single_email(
    num: str,
    mail: imaplib.IMAP4_SSL,
    db: Session,
    sender_map: dict[str, Newsletter],
    settings: Settings,
) -> None:
    """Process a single email message."""
    status, data = mail.fetch(num, "(BODY.PEEK[])")
    if status != "OK":
        logger.warning(f"Failed to fetch email with id={num}")
        return

    msg = email.message_from_bytes(data[0][1])
    sender = email.utils.parseaddr(msg["From"])[1]
    message_id = msg.get("Message-ID")

    if not message_id:
        logger.warning(
            f"Email from {sender} with subject '{msg['Subject']}' has no Message-ID, skipping."
        )
        return

    if get_entry_by_message_id(db, message_id):
        logger.info(f"Email with Message-ID {message_id} already processed, skipping.")
        return

    logger.debug(f"Processing email from {sender} with subject '{msg['Subject']}'")

    newsletter = sender_map.get(sender)
    if not newsletter and settings.auto_add_new_senders:
        newsletter = _auto_add_newsletter(db, sender, msg, settings)
        sender_map[sender] = newsletter

    if not newsletter:
        return

    subject = str(make_header(decode_header(msg["Subject"])))
    final_body = _get_email_body(msg)

    if newsletter.extract_content:
        extracted_body = trafilatura.extract(final_body)
        if extracted_body:
            final_body = extracted_body

    entry_schema = EntryCreate(subject=subject, body=final_body, message_id=message_id)
    new_entry = create_entry(db, entry_schema, newsletter.id)

    if not new_entry:
        logger.error(
            f"Failed to create entry for newsletter '{newsletter.name}' from sender {sender}, email will not be marked as read or moved."
        )
        return

    logger.info(
        f"Created new entry for newsletter '{newsletter.name}' from sender {sender}"
    )

    if settings.mark_as_read:
        logger.debug(f"Marking email with id={num} as read")
        mail.store(num, "+FLAGS", "\\Seen")

    move_folder = newsletter.move_to_folder or settings.move_to_folder
    if move_folder:
        logger.debug(f"Moving email with id={num} to {move_folder}")
        mail.copy(num, move_folder)
        mail.store(num, "+FLAGS", "\\Deleted")


def process_emails(db: Session) -> None:
    """Process unread emails, add them as entries, and manage newsletters."""
    logger.info("Starting email processing...")
    settings = get_settings(db, with_password=True)
    if not _is_configured(settings):
        return

    newsletters = get_newsletters(db)
    sender_map = {sender.email: nl for nl in newsletters for sender in nl.senders}
    logger.info(f"Processing emails for {len(newsletters)} newsletters.")

    mail = _connect_to_imap(settings)
    if not mail:
        return

    try:
        email_ids = _fetch_unread_email_ids(mail)
        logger.info(f"Found {len(email_ids)} unseen emails.")
        for num in email_ids:
            _process_single_email(num, mail, db, sender_map, settings)

        if settings.move_to_folder:
            logger.info("Expunging deleted emails")
            mail.expunge()

    except Exception as e:
        logger.error(f"Error processing emails: {e}", exc_info=True)
    finally:
        mail.logout()
        logger.info("Email processing finished successfully.")
