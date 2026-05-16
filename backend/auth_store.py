import json
from pathlib import Path
from typing import Iterable

from auth_schemas import AuthAccount


AUTH_ACCOUNT_STORE_PATH = Path(__file__).resolve().parent / "auth_data" / "auth_accounts.json"


def normalize_phone_number(phone_number: str) -> str:
    """Normalize a phone number for lookup.

    This foundation keeps only digits.
    Later we can add country-code rules if needed.
    """

    return "".join(char for char in phone_number if char.isdigit())


def _dump_model(account: AuthAccount) -> dict:
    if hasattr(account, "model_dump"):
        return account.model_dump()

    return account.dict()


def load_auth_accounts(path: Path | str = AUTH_ACCOUNT_STORE_PATH) -> list[AuthAccount]:
    store_path = Path(path)

    if not store_path.exists():
        return []

    raw_text = store_path.read_text(encoding="utf-8-sig").strip()

    if not raw_text:
        return []

    raw_data = json.loads(raw_text)

    if not isinstance(raw_data, list):
        raise ValueError("Auth account store must contain a list.")

    return [AuthAccount(**item) for item in raw_data]


def save_auth_accounts(
    accounts: Iterable[AuthAccount],
    path: Path | str = AUTH_ACCOUNT_STORE_PATH,
) -> None:
    store_path = Path(path)
    store_path.parent.mkdir(parents=True, exist_ok=True)

    data = [_dump_model(account) for account in accounts]

    store_path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def find_auth_account_by_phone(
    phone_number: str,
    path: Path | str = AUTH_ACCOUNT_STORE_PATH,
) -> AuthAccount | None:
    normalized_target = normalize_phone_number(phone_number)

    for account in load_auth_accounts(path):
        if normalize_phone_number(account.phoneNumber) == normalized_target:
            return account

    return None


def find_auth_account_by_user_id(
    user_id: str,
    path: Path | str = AUTH_ACCOUNT_STORE_PATH,
) -> AuthAccount | None:
    for account in load_auth_accounts(path):
        if account.userId == user_id:
            return account

    return None


def create_auth_account(
    account: AuthAccount,
    path: Path | str = AUTH_ACCOUNT_STORE_PATH,
) -> AuthAccount:
    accounts = load_auth_accounts(path)

    if find_auth_account_by_phone(account.phoneNumber, path):
        raise ValueError("Auth account with this phone number already exists.")

    if find_auth_account_by_user_id(account.userId, path):
        raise ValueError("Auth account with this userId already exists.")

    accounts.append(account)
    save_auth_accounts(accounts, path)

    return account
