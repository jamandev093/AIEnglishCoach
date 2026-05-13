import sys
from pathlib import Path

import pytest
from fastapi import HTTPException


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from admin_security import validate_admin_key  # noqa: E402


def test_admin_api_unavailable_when_key_not_configured():
    with pytest.raises(HTTPException) as error:
        validate_admin_key(provided_key="anything", configured_key="")

    assert error.value.status_code == 503
    assert error.value.detail == "Admin API is not configured."


def test_admin_key_required_when_missing():
    with pytest.raises(HTTPException) as error:
        validate_admin_key(provided_key=None, configured_key="secret-admin-key")

    assert error.value.status_code == 401
    assert error.value.detail == "Admin key is required."


def test_wrong_admin_key_is_rejected():
    with pytest.raises(HTTPException) as error:
        validate_admin_key(
            provided_key="wrong-key",
            configured_key="secret-admin-key",
        )

    assert error.value.status_code == 403
    assert error.value.detail == "Invalid admin key."


def test_correct_admin_key_is_allowed():
    result = validate_admin_key(
        provided_key="secret-admin-key",
        configured_key="secret-admin-key",
    )

    assert result is True
