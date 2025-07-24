import re


def sanitize_slug(slug: str | None) -> str | None:
    """Sanitize a string to be used as a URL slug.

    - Converts to lowercase
    - Replaces spaces and underscores with hyphens
    - Removes characters that are not alphanumeric or hyphens
    - Removes leading/trailing hyphens
    """
    if not slug:
        return None
    slug = slug.lower()
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    slug = slug.strip("-")
    return slug or None
