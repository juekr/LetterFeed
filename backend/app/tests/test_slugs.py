import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.slug import sanitize_slug


@pytest.mark.parametrize(
    "input_slug, expected_slug",
    [
        ("Hello World", "hello-world"),
        ("  leading and trailing spaces  ", "leading-and-trailing-spaces"),
        ("!@#$%^&*()", None),
        ("a-b_c d", "a-b-c-d"),
        ("SLUG IN CAPS", "slug-in-caps"),
        (None, None),
        ("", None),
    ],
)
def test_sanitize_slug(input_slug, expected_slug):
    """Test the slug sanitization function with various inputs."""
    assert sanitize_slug(input_slug) == expected_slug


def test_create_newsletter_with_slug(client: TestClient, db_session: Session):
    """Test creating a newsletter with a custom slug."""
    newsletter_data = {
        "name": "My Test Newsletter",
        "slug": "my-custom-slug",
        "sender_emails": ["test@example.com"],
    }
    response = client.post("/newsletters", json=newsletter_data)
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "my-custom-slug"

    # Verify the feed URL uses the slug
    feed_response = client.get(f"/feeds/{data['slug']}")
    assert feed_response.status_code == 200


def test_create_newsletter_with_sanitization(client: TestClient, db_session: Session):
    """Test creating a newsletter with a slug that needs sanitization."""
    newsletter_data = {
        "name": "Another Test",
        "slug": "  Another Slug With Spaces!  ",
        "sender_emails": ["test2@example.com"],
    }
    response = client.post("/newsletters", json=newsletter_data)
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "another-slug-with-spaces"


def test_create_newsletter_without_slug(client: TestClient, db_session: Session):
    """Test creating a newsletter without a slug, expecting it to be None."""
    newsletter_data = {
        "name": "No Slug Newsletter",
        "sender_emails": ["no-slug@example.com"],
    }
    response = client.post("/newsletters", json=newsletter_data)
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] is None

    # Verify the feed URL uses the ID
    feed_response = client.get(f"/feeds/{data['id']}")
    assert feed_response.status_code == 200


def test_create_newsletter_with_conflicting_slug(
    client: TestClient, db_session: Session
):
    """Test creating a newsletter with a slug that already exists."""
    # Create the first newsletter
    client.post(
        "/newsletters",
        json={
            "name": "First",
            "slug": "conflict-slug",
            "sender_emails": ["first@example.com"],
        },
    )

    # Attempt to create a second one with the same slug
    response = client.post(
        "/newsletters",
        json={
            "name": "Second",
            "slug": "conflict-slug",
            "sender_emails": ["second@example.com"],
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"] == "Slug already in use"


def test_update_newsletter_with_conflicting_slug(
    client: TestClient, db_session: Session
):
    """Test updating a newsletter to a slug that is already in use by another newsletter."""
    # Create two newsletters
    response1 = client.post(
        "/newsletters",
        json={"name": "First", "slug": "first-slug", "sender_emails": ["1@test.com"]},
    )
    newsletter1_id = response1.json()["id"]

    client.post(
        "/newsletters",
        json={"name": "Second", "slug": "second-slug", "sender_emails": ["2@test.com"]},
    )

    # Try to update the first newsletter to use the second's slug
    update_data = {
        "name": "First Updated",
        "slug": "second-slug",
        "sender_emails": ["1@test.com"],
    }
    response = client.put(f"/newsletters/{newsletter1_id}", json=update_data)
    assert response.status_code == 409
    assert response.json()["detail"] == "Slug already in use"
