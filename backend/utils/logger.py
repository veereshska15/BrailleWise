"""
BrailleWise Structured Logging Utility
=======================================
Provides a centralized, configurable logging framework for the BrailleWise backend.
Replaces raw print() statements with structured log output that includes
timestamps, log levels, module names, and consistent formatting.

Usage:
    from utils.logger import get_logger
    logger = get_logger(__name__)

    logger.info("Server started")
    logger.warning("Slow response detected")
    logger.error("Database connection failed", exc_info=True)
    logger.debug("Request payload: %s", data)
"""

import os
import sys
import logging
from datetime import datetime


# ---------------------------------------------------------------------------
# Configuration constants (overridable via environment variables)
# ---------------------------------------------------------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()
LOG_FORMAT = os.getenv(
    "LOG_FORMAT",
    "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s"
)
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Optional: log to file in addition to console
LOG_FILE = os.getenv("LOG_FILE", None)


def get_logger(name: str) -> logging.Logger:
    """
    Create and return a configured logger instance for the given module name.

    Args:
        name: Typically ``__name__`` of the calling module, which produces
              a dotted path like ``services.auth_service``.

    Returns:
        A ``logging.Logger`` configured with console (and optional file) handlers.
    """
    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers if get_logger is called multiple times
    if logger.handlers:
        return logger

    logger.setLevel(getattr(logging, LOG_LEVEL, logging.DEBUG))
    logger.propagate = False  # Prevent duplicate output from root logger

    # Console handler → stdout
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, LOG_LEVEL, logging.DEBUG))
    console_formatter = logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    # Optional file handler
    if LOG_FILE:
        try:
            file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
            file_handler.setLevel(logging.DEBUG)
            file_handler.setFormatter(console_formatter)
            logger.addHandler(file_handler)
        except (OSError, IOError) as e:
            logger.warning("Could not create log file '%s': %s", LOG_FILE, e)

    return logger


def configure_flask_logging(app):
    """
    Integrate the BrailleWise logger with a Flask application.
    Adjusts Werkzeug's default logger to use the same formatting.

    Args:
        app: The Flask application instance.
    """
    # Quieten Werkzeug's default request logging to WARNING
    werkzeug_logger = logging.getLogger("werkzeug")
    werkzeug_logger.setLevel(logging.WARNING)

    # Set Flask's own logger to use our configuration
    app.logger.handlers.clear()
    app_logger = get_logger("braillewise.app")
    for handler in app_logger.handlers:
        app.logger.addHandler(handler)
    app.logger.setLevel(getattr(logging, LOG_LEVEL, logging.DEBUG))
