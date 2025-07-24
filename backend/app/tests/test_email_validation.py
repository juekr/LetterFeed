from fastapi.testclient import TestClient


def test_create_newsletter_with_invalid_email(client: TestClient):
    """Test creating a newsletter with an invalid sender email."""
    newsletter_data = {
        "name": "Invalid Email Test",
        "sender_emails": ["not-an-email"],
    }
    response = client.post("/newsletters", json=newsletter_data)
    assert response.status_code == 422  # Unprocessable Entity
    data = response.json()
    assert "value is not a valid email address" in data["detail"][0]["msg"]


def test_create_newsletter_with_valid_and_invalid_emails(client: TestClient):
    """Test creating a newsletter with a mix of valid and invalid emails."""
    newsletter_data = {
        "name": "Mixed Emails Test",
        "sender_emails": ["valid@example.com", "invalid-email"],
    }
    response = client.post("/newsletters", json=newsletter_data)
    assert response.status_code == 422
    data = response.json()
    assert data["detail"][0]["loc"] == ["body", "sender_emails", 1]


def test_update_newsletter_with_invalid_email(client: TestClient):
    """Test updating a newsletter with an invalid sender email."""
    # First, create a valid newsletter
    create_response = client.post(
        "/newsletters",
        json={
            "name": "Update Test",
            "sender_emails": ["initial@example.com"],
        },
    )
    assert create_response.status_code == 200
    newsletter_id = create_response.json()["id"]

    # Now, try to update it with an invalid email
    update_data = {
        "name": "Updated Name",
        "sender_emails": ["not-a-valid-email"],
    }
    response = client.put(f"/newsletters/{newsletter_id}", json=update_data)
    assert response.status_code == 422
