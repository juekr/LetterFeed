from pydantic import BaseModel


class Token(BaseModel):
    """Schema for the access token."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for the data encoded in the JWT."""

    username: str | None = None
