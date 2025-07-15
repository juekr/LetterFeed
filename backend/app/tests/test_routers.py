import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("app.core.imap.imaplib.IMAP4_SSL")
def test_update_imap_settings(mock_imap, client: TestClient):
    """Test updating IMAP settings."""
    mock_imap.return_value.login.return_value = (None, None)
    mock_imap.return_value.logout.return_value = (None, None)

    settings_data = {
        "imap_server": "imap.example.com",
        "imap_username": "test@example.com",
        "imap_password": "password",
        "search_folder": "INBOX",
        "move_to_folder": "Processed",
        "mark_as_read": True,
    }
    response = client.post("/imap/settings", json=settings_data)
    assert response.status_code == 200
    assert response.json()["imap_server"] == "imap.example.com"
    assert response.json()["imap_username"] == "test@example.com"
    assert response.json()["search_folder"] == "INBOX"
    assert response.json()["move_to_folder"] == "Processed"
    assert response.json()["mark_as_read"]


@patch("app.core.imap.imaplib.IMAP4_SSL")
def test_get_imap_settings(mock_imap, client: TestClient):
    """Test getting IMAP settings."""
    mock_imap.return_value.login.return_value = (None, None)
    mock_imap.return_value.logout.return_value = (None, None)

    settings_data = {
        "imap_server": "imap.example.com",
        "imap_username": "test@example.com",
        "imap_password": "password",
        "search_folder": "INBOX",
        "move_to_folder": "Processed",
        "mark_as_read": True,
    }
    client.post("/imap/settings", json=settings_data)

    response = client.get("/imap/settings")
    assert response.status_code == 200
    assert response.json()["imap_server"] == "imap.example.com"
    assert response.json()["imap_username"] == "test@example.com"


@patch("app.core.imap.imaplib.IMAP4_SSL")
def test_test_imap_connection(mock_imap, client: TestClient):
    """Test the IMAP connection."""
    mock_imap.return_value.login.return_value = (None, None)
    mock_imap.return_value.logout.return_value = (None, None)

    settings_data = {
        "imap_server": "imap.example.com",
        "imap_username": "test@example.com",
        "imap_password": "password",
        "search_folder": "INBOX",
        "move_to_folder": "Processed",
        "mark_as_read": True,
    }
    client.post("/imap/settings", json=settings_data)

    response = client.post("/imap/test")
    assert response.status_code == 200
    assert response.json() == {"message": "Connection successful"}


@patch("app.core.imap.imaplib.IMAP4_SSL")
def test_get_imap_folders(mock_imap, client: TestClient):
    """Test getting IMAP folders."""
    mock_imap.return_value.login.return_value = (None, None)
    mock_imap.return_value.logout.return_value = (None, None)
    mock_imap.return_value.list.return_value = (
        "OK",
        [b'(NOCONNECT NOSELECT) "/" "INBOX"', b'(NOCONNECT NOSELECT) "/" "Processed"'],
    )

    settings_data = {
        "imap_server": "imap.example.com",
        "imap_username": "test@example.com",
        "imap_password": "password",
        "search_folder": "INBOX",
        "move_to_folder": "Processed",
        "mark_as_read": True,
    }
    client.post("/imap/settings", json=settings_data)

    response = client.get("/imap/folders")
    assert response.status_code == 200
    assert response.json() == ["INBOX", "Processed"]


def test_create_newsletter(client: TestClient):
    """Test creating a newsletter."""
    unique_email = f"newsletter_{uuid.uuid4()}@example.com"
    newsletter_data = {"name": "Example Newsletter", "sender_emails": [unique_email]}
    response = client.post("/newsletters", json=newsletter_data)
    assert response.status_code == 200
    assert response.json()["name"] == "Example Newsletter"
    assert response.json()["is_active"]
    assert len(response.json()["senders"]) == 1
    assert response.json()["senders"][0]["email"] == unique_email


def test_get_newsletters(client: TestClient):
    """Test getting all newsletters."""
    unique_email = f"newsletter_{uuid.uuid4()}@example.com"
    newsletter_data = {"name": "Another Newsletter", "sender_emails": [unique_email]}
    client.post("/newsletters", json=newsletter_data)

    response = client.get("/newsletters")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert any(
        unique_email in [s["email"] for s in nl["senders"]] for nl in response.json()
    )


def test_get_single_newsletter(client: TestClient):
    """Test getting a single newsletter."""
    unique_email = f"newsletter_{uuid.uuid4()}@example.com"
    newsletter_data = {"name": "Third Newsletter", "sender_emails": [unique_email]}
    create_response = client.post("/newsletters/", json=newsletter_data)
    newsletter_id = create_response.json()["id"]

    response = client.get(f"/newsletters/{newsletter_id}")
    assert response.status_code == 200
    assert response.json()["senders"][0]["email"] == unique_email


def test_get_nonexistent_newsletter(client: TestClient):
    """Test getting a nonexistent newsletter."""
    response = client.get("/newsletters/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Newsletter not found"}
