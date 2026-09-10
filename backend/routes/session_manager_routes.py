from flask import Blueprint, jsonify
from services.session_manager_service import (
    start_learning_session,
    get_session_progress,
    complete_learning_session
)

# Create Blueprint for Session Manager
session_bp = Blueprint("session_bp", __name__, url_prefix="/api/session")

@session_bp.route("/start/<user_id>", methods=["GET"])
def start_session(user_id):
    """
    GET /api/session/start/<user_id>
    
    Retrieve/prepare today's personalized learning session for the student.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = start_learning_session(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error starting learning session: {str(e)}"
        }), 400

@session_bp.route("/progress/<user_id>", methods=["GET"])
def session_progress(user_id):
    """
    GET /api/session/progress/<user_id>
    
    Retrieve the user's progress for today's session.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_session_progress(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error fetching session progress: {str(e)}"
        }), 400

@session_bp.route("/complete/<user_id>", methods=["POST"])
def complete_session(user_id):
    """
    POST /api/session/complete/<user_id>
    
    Complete today's learning session and get a recommendation summary.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = complete_learning_session(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error completing learning session: {str(e)}"
        }), 400
