import email
import imaplib

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.crud.entries import create_entry
from app.crud.newsletters import create_newsletter, get_newsletters
from app.crud.settings import get_settings
from app.schemas.entries import EntryCreate
from app.schemas.newsletters import NewsletterCreate

logger = get_logger(__name__)


def process_emails(db: Session):
    """Process unread emails, add them as entries, and manage newsletters."""
    logger.info("Starting email processing...")
    settings = get_settings(db, with_password=True)
    if (
        not settings
        or not settings.imap_server
        or not settings.imap_username
        or not settings.imap_password
    ):
        logger.warning("IMAP settings are not configured. Skipping email processing.")
        return

    newsletters = get_newsletters(db)
    sender_map = {}
    for nl in newsletters:
        for sender in nl.senders:
            sender_map[sender.email] = nl
    logger.info(f"Processing emails for {len(newsletters)} newsletters.")

    try:
        logger.info(f"Connecting to IMAP server: {settings.imap_server}")
        mail = imaplib.IMAP4_SSL(settings.imap_server)
        mail.login(settings.imap_username, settings.imap_password)
        mail.select(settings.search_folder)
        logger.info(f"Selected mailbox: {settings.search_folder}")

        status, messages = mail.search(None, "(UNSEEN)")
        if status != "OK":
            logger.error(f"Failed to search for unseen emails, status: {status}")
            return

        email_ids = messages[0].split()
        logger.info(f"Found {len(email_ids)} unseen emails.")

        for num in email_ids:
            status, data = mail.fetch(num, "(RFC822)")
            if status != "OK":
                logger.warning(f"Failed to fetch email with id={num}")
                continue

            msg = email.message_from_bytes(data[0][1])
            sender = email.utils.parseaddr(msg["From"])[1]
            logger.debug(
                f"Processing email from {sender} with subject '{msg['Subject']}'"
            )

            newsletter = sender_map.get(sender)
            if not newsletter and settings.auto_add_new_senders:
                logger.info(f"Auto-adding new newsletter for sender: {sender}")
                newsletter_name = email.utils.parseaddr(msg["From"])[0] or sender
                new_newsletter_schema = NewsletterCreate(
                    name=newsletter_name, sender_emails=[sender]
                )
                newsletter = create_newsletter(db, new_newsletter_schema)
                sender_map[sender] = newsletter

            if newsletter:
                subject = msg["Subject"]

                body = ""
                html = ""

                for part in msg.walk():
                    ctype = part.get_content_type()
                    cdispo = str(part.get("Content-Disposition"))

                    if "attachment" in cdispo:
                        continue

                    if ctype == "text/plain":
                        try:
                            payload = part.get_payload(decode=True)
                            charset = part.get_content_charset() or "utf-8"
                            body = payload.decode(charset, "ignore")
                        except Exception:
                            pass
                    elif ctype == "text/html":
                        try:
                            payload = part.get_payload(decode=True)
                            charset = part.get_content_charset() or "utf-8"
                            html = payload.decode(charset, "ignore")
                        except Exception:
                            pass

                final_body = html or body

                entry = EntryCreate(subject=subject, body=final_body)
                create_entry(db, entry, newsletter.id)
                logger.info(
                    f"Created new entry for newsletter '{newsletter.name}' from sender {sender}"
                )

                if settings.mark_as_read:
                    logger.debug(f"Marking email with id={num} as read")
                    mail.store(num, "+FLAGS", "\\Seen")

                if settings.move_to_folder:
                    logger.debug(
                        f"Moving email with id={num} to {settings.move_to_folder}"
                    )
                    mail.copy(num, settings.move_to_folder)
                    mail.store(num, "+FLAGS", "\\Deleted")

        if settings.move_to_folder:
            logger.info("Expunging deleted emails")
            mail.expunge()

        mail.logout()
        logger.info("Email processing finished successfully.")

    except Exception as e:
        logger.error(f"Error processing emails: {e}", exc_info=True)
