import secrets
from typing import Optional

from fastapi import Header, HTTPException, status

from settings import ADMIN_API_KEY


def validate_admin_key(
    provided_key: Optional[str],
    configured_key: Optional[str] = None,
) -> bool:
    """Validate admin API access without exposing secrets.

    Rules:
    - If backend ADMIN_API_KEY is not configured, admin APIs are unavailable.
    - Missing X-Admin-Key returns 401.
    - Wrong X-Admin-Key returns 403.
    - Correct X-Admin-Key returns True.
    """

    expected_key = (configured_key if configured_key is not None else ADMIN_API_KEY).strip()

    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin API is not configured.",
        )

    if not provided_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin key is required.",
        )

    if not secrets.compare_digest(provided_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin key.",
        )

    return True


def require_admin_key(
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> bool:
    """FastAPI dependency for protected admin endpoints."""

    return validate_admin_key(x_admin_key)
