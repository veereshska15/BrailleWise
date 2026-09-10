from flask import Blueprint, jsonify
from services.learning_intelligence_service import (
    get_weak_letters,
    get_strong_letters,
    calculate_mastery,
    should_unlock_next_lesson,
    recommend_learning_mode,
    generate_today_plan
)

# Create Blueprint for learning intelligence
intelligence_bp = Blueprint("intelligence_bp", __name__, url_prefix="/api/intelligence")

@intelligence_bp.route("/weak/<user_id>", methods=["GET"])
def get_user_weak_letters(user_id):
    """
    GET /api/intelligence/weak/<user_id>
    
    Returns a list of weak letters for the user:
    {
        "weak_letters": ["B", "D"]
    }
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        weak = get_weak_letters(user_id)
        return jsonify({
            "weak_letters": weak
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving weak letters: {str(e)}"
        }), 400

@intelligence_bp.route("/strong/<user_id>", methods=["GET"])
def get_user_strong_letters(user_id):
    """
    GET /api/intelligence/strong/<user_id>
    
    Returns a list of mastered/strong letters for the user:
    {
        "strong_letters": ["A", "C"]
    }
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        strong = get_strong_letters(user_id)
        return jsonify({
            "strong_letters": strong
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving strong letters: {str(e)}"
        }), 400

@intelligence_bp.route("/mastery/<user_id>", methods=["GET"])
def get_user_mastery_stats(user_id):
    """
    GET /api/intelligence/mastery/<user_id>
    
    Returns mastery statistics for the user:
    {
        "letters_attempted": 6,
        "letters_mastered": 4,
        "mastery_percentage": 66.67
    }
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        mastery = calculate_mastery(user_id)
        return jsonify(mastery), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error calculating mastery stats: {str(e)}"
        }), 400

@intelligence_bp.route("/unlock/<user_id>", methods=["GET"])
def get_user_unlock_decision(user_id):
    """
    GET /api/intelligence/unlock/<user_id>
    
    Returns whether the user is eligible to unlock the next lesson:
    {
        "unlock_next_lesson": true
    }
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

@intelligence_bp.route("/mode/<user_id>", methods=["GET"])
def get_user_recommended_mode(user_id):
    """
    GET /api/intelligence/mode/<user_id>
    
    Returns the recommended learning mode for the user:
    {
        "mode": "revision"
    }
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        mode = recommend_learning_mode(user_id)
        return jsonify(mode), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error determining recommended mode: {str(e)}"
        }), 400

@intelligence_bp.route("/plan/<user_id>", methods=["GET"])
def get_user_daily_plan(user_id):
    """
    GET /api/intelligence/plan/<user_id>
    
    Returns today's complete learning plan.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        plan = generate_today_plan(user_id)
        return jsonify(plan), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating daily plan: {str(e)}"
        }), 400
