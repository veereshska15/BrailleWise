from flask_jwt_extended import jwt_required, get_jwt_identity

def get_current_user_id():
    """
    Helper function to retrieve the logged-in user's ID from the JWT token.
    Must be used in an active request context with @jwt_required().
    
    Returns:
        str: The user's ID string.
    """
    return get_jwt_identity()
