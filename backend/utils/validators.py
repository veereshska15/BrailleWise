"""
BrailleWise Input Validation Utilities
=======================================
Provides reusable validation functions for sanitizing and verifying
user input across all API endpoints.

Usage:
    from utils.validators import validate_email, validate_password, sanitize_string

    errors = []
    if not validate_email(email):
        errors.append("Invalid email format")
    if not validate_password(password):
        errors.append("Password does not meet strength requirements")
"""

import re
from utils.logger import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Email Validation
# ---------------------------------------------------------------------------
# RFC 5322 simplified pattern: local-part @ domain
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]"
    r"(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)

# ---------------------------------------------------------------------------
# Password Policy Constants
# ---------------------------------------------------------------------------
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


def validate_email(email: str) -> bool:
    """
    Check whether a string is a valid email address.

    Args:
        email: The email string to validate.

    Returns:
        True if the email matches the expected format, False otherwise.
    """
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def validate_password(password: str) -> dict:
    """
    Validate password strength against BrailleWise security policy.

    Policy:
        - Minimum 8 characters
        - Maximum 128 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit

    Args:
        password: The plain-text password to validate.

    Returns:
        A dict with 'valid' (bool) and 'errors' (list of failure reasons).
    """
    errors = []

    if not password or not isinstance(password, str):
        return {"valid": False, "errors": ["Password is required"]}

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")

    if len(password) > PASSWORD_MAX_LENGTH:
        errors.append(f"Password must be at most {PASSWORD_MAX_LENGTH} characters")

    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter")

    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter")

    if not re.search(r"\d", password):
        errors.append("Password must contain at least one digit")

    return {"valid": len(errors) == 0, "errors": errors}


def sanitize_string(value: str, max_length: int = 255, field_name: str = "field") -> str:
    """
    Sanitize a string input by stripping whitespace and enforcing a max length.

    Args:
        value: The raw string input.
        max_length: Maximum allowed character length (default 255).
        field_name: Name of the field for logging purposes.

    Returns:
        The sanitized string.

    Raises:
        ValueError: If the value is empty after stripping or exceeds max_length.
    """
    if not value or not isinstance(value, str):
        raise ValueError(f"{field_name} is required and must be a string")

    cleaned = value.strip()

    if not cleaned:
        raise ValueError(f"{field_name} cannot be empty")

    if len(cleaned) > max_length:
        logger.warning(
            "Input for '%s' truncated from %d to %d characters",
            field_name, len(cleaned), max_length
        )
        cleaned = cleaned[:max_length]

    return cleaned


def validate_name(name: str) -> dict:
    """
    Validate a user display name.

    Policy:
        - Between 2 and 100 characters
        - No leading/trailing whitespace (auto-stripped)
        - Only letters, spaces, hyphens, and apostrophes

    Args:
        name: The name string to validate.

    Returns:
        A dict with 'valid' (bool) and 'errors' (list of failure reasons).
    """
    errors = []

    if not name or not isinstance(name, str):
        return {"valid": False, "errors": ["Name is required"]}

    cleaned = name.strip()

    if len(cleaned) < 2:
        errors.append("Name must be at least 2 characters")

    if len(cleaned) > 100:
        errors.append("Name must be at most 100 characters")

    if cleaned and not re.match(r"^[a-zA-Z\s\-'\.]+$", cleaned):
        errors.append("Name can only contain letters, spaces, hyphens, and apostrophes")

    return {"valid": len(errors) == 0, "errors": errors}


def validate_registration(data: dict) -> dict:
    """
    Validate all fields required for user registration.

    Args:
        data: Dictionary containing 'name', 'email', and 'password' keys.

    Returns:
        A dict with 'valid' (bool) and 'errors' (list of all validation failures).
    """
    all_errors = []

    # Validate name
    name_result = validate_name(data.get("name", ""))
    if not name_result["valid"]:
        all_errors.extend(name_result["errors"])

    # Validate email
    if not validate_email(data.get("email", "")):
        all_errors.append("Invalid email address format")

    # Validate password
    pw_result = validate_password(data.get("password", ""))
    if not pw_result["valid"]:
        all_errors.extend(pw_result["errors"])

    return {"valid": len(all_errors) == 0, "errors": all_errors}
