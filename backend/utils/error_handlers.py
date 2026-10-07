"""
BrailleWise Centralized Error Handlers
========================================
Provides Flask error handler registrations for common HTTP error codes
and application-specific exceptions. Ensures consistent JSON error
response structure across all API endpoints.

Usage:
    from utils.error_handlers import register_error_handlers
    register_error_handlers(app)
"""

from flask import jsonify
from utils.logger import get_logger

logger = get_logger(__name__)


class ValidationError(Exception):
    """
    Custom exception for input validation failures.
    Carries a list of human-readable error messages.
    """

    def __init__(self, message: str, errors: list = None, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.errors = errors or []
        self.status_code = status_code


class NotFoundError(Exception):
    """
    Custom exception for resource-not-found scenarios.
    """

    def __init__(self, resource: str = "Resource", identifier: str = ""):
        self.message = f"{resource} not found"
        if identifier:
            self.message = f"{resource} '{identifier}' not found"
        super().__init__(self.message)
        self.status_code = 404


class AuthenticationError(Exception):
    """
    Custom exception for authentication and authorization failures.
    """

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message)
        self.message = message
        self.status_code = 401


def register_error_handlers(app):
    """
    Register centralized error handlers with a Flask application instance.
    Ensures all API errors return consistent JSON structure:

        {
            "success": false,
            "message": "Human-readable error description",
            "errors": []   // optional, for validation errors
        }

    Args:
        app: The Flask application instance.
    """

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        logger.warning("Validation error: %s | Details: %s", error.message, error.errors)
        response = {
            "success": False,
            "message": error.message,
        }
        if error.errors:
            response["errors"] = error.errors
        return jsonify(response), error.status_code

    @app.errorhandler(NotFoundError)
    def handle_not_found_error(error):
        logger.info("Not found: %s", error.message)
        return jsonify({
            "success": False,
            "message": error.message
        }), error.status_code

    @app.errorhandler(AuthenticationError)
    def handle_auth_error(error):
        logger.warning("Authentication error: %s", error.message)
        return jsonify({
            "success": False,
            "message": error.message
        }), error.status_code

    @app.errorhandler(400)
    def handle_bad_request(error):
        logger.warning("Bad request: %s", error.description)
        return jsonify({
            "success": False,
            "message": error.description or "Bad request"
        }), 400

    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({
            "success": False,
            "message": "The requested endpoint was not found"
        }), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        return jsonify({
            "success": False,
            "message": "HTTP method not allowed for this endpoint"
        }), 405

    @app.errorhandler(429)
    def handle_rate_limit(error):
        logger.warning("Rate limit exceeded: %s", error.description)
        return jsonify({
            "success": False,
            "message": "Too many requests. Please try again later."
        }), 429

    @app.errorhandler(500)
    def handle_internal_error(error):
        logger.error("Internal server error: %s", error, exc_info=True)
        return jsonify({
            "success": False,
            "message": "An internal server error occurred. Please try again later."
        }), 500

    logger.info("Centralized error handlers registered")
