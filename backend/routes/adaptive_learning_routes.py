from flask import Blueprint, jsonify
from services.adaptive_learning_service import (
    get_revision_letters,
    get_practice_letters,
    should_unlock_next_lesson,
    get_next_learning_step,
    get_adaptive_summary
)

# Create Blueprint for Adaptive Learning Engine
adaptive_bp = Blueprint("adaptive_bp", __name__, url_prefix="/api/adaptive")

@adaptive_bp.route("/next/<user_id>", methods=["GET"])
def get_user_next_step(user_id):
    """
    GET /api/adaptive/next/<user_id>
    
    Returns the student's next recommended learning step/mode.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        step = get_next_learning_step(user_id)
        return jsonify(step), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error determining next learning step: {str(e)}"
        }), 400

@adaptive_bp.route("/revision/<user_id>", methods=["GET"])
def get_user_revision_letters(user_id):
    """
    GET /api/adaptive/revision/<user_id>
    
    Returns weak letters that require revision.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        weak = get_revision_letters(user_id)
        return jsonify({
            "weak_letters": weak
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error fetching revision letters: {str(e)}"
        }), 400

@adaptive_bp.route("/practice/<user_id>", methods=["GET"])
def get_user_practice_letters(user_id):
    """
    GET /api/adaptive/practice/<user_id>
    
    Returns letters requiring additional practice.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        practice = get_practice_letters(user_id)
        return jsonify({
            "practice_letters": practice
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error fetching practice letters: {str(e)}"
        }), 400

@adaptive_bp.route("/unlock/<user_id>", methods=["GET"])
def get_user_unlock_status(user_id):
    """
    GET /api/adaptive/unlock/<user_id>
    
    Returns whether the next lesson is unlocked.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        unlock = should_unlock_next_lesson(user_id)
        return jsonify({
            "unlock_next_lesson": unlock
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error checking unlock capability: {str(e)}"
        }), 400

@adaptive_bp.route("/summary/<user_id>", methods=["GET"])
def get_user_adaptive_summary(user_id):
    """
    GET /api/adaptive/summary/<user_id>
    
    Returns a complete adaptive learning summary report.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        summary = get_adaptive_summary(user_id)
        return jsonify(summary), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating summary: {str(e)}"
        }), 400
