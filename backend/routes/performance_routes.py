from flask import Blueprint, request, jsonify
from services.performance_service import update_performance, get_performance, get_letter_performance

# Create Blueprint for performance tracking
performance_bp = Blueprint("performance_bp", __name__, url_prefix="/api/performance")

@performance_bp.route("/update", methods=["POST"])
def update():
    """
    POST /api/performance/update
    
    Update or create a user's performance record for a specific letter.
    Expects JSON body:
    {
        "user_id": "user123",
        "lesson_number": 1,
        "letter": "A",
        "is_correct": true
    }
    """
    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({
                "success": False,
                "message": "Request body must be valid JSON"
            }), 400
            
        # Validate that all required fields are present
        required_fields = ["user_id", "lesson_number", "letter", "is_correct"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Field '{field}' is required"
                }), 400
                
        user_id = data.get("user_id")
        lesson_number = data.get("lesson_number")
        letter = data.get("letter")
        is_correct = data.get("is_correct")
        
        # Validate data types
        if not isinstance(user_id, str) or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id must be a non-empty string"
            }), 400
            
        try:
            lesson_number = int(lesson_number)
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "lesson_number must be an integer"
            }), 400
            
        if not isinstance(letter, str) or not letter.strip():
            return jsonify({
                "success": False,
                "message": "letter must be a non-empty string"
            }), 400
            
        if not isinstance(is_correct, bool):
            return jsonify({
                "success": False,
                "message": "is_correct must be a boolean"
            }), 400
            
        # Update/Create performance
        updated_perf = update_performance(user_id, lesson_number, letter, is_correct)
        
        return jsonify({
            "success": True,
            "performance": updated_perf
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error updating performance: {str(e)}"
        }), 400

@performance_bp.route("/user/<user_id>", methods=["GET"])
def get_user_performance(user_id):
    """
    GET /api/performance/user/<user_id>
    
    Retrieve all performance documents for a specific user.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        performances = get_performance(user_id)
        return jsonify({
            "success": True,
            "performance": performances
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving user performance: {str(e)}"
        }), 400

@performance_bp.route("/letter/<user_id>/<letter>", methods=["GET"])
def get_user_letter_performance(user_id, letter):
    """
    GET /api/performance/letter/<user_id>/<letter>
    
    Retrieve performance document for a specific user and letter.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        if not letter or not letter.strip():
            return jsonify({
                "success": False,
                "message": "letter is required"
            }), 400
            
        perf = get_letter_performance(user_id, letter)
        if perf is None:
            return jsonify({
                "success": False,
                "message": f"No performance record found for user {user_id} and letter {letter}"
            }), 404
            
        return jsonify({
            "success": True,
            "performance": perf
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving letter performance: {str(e)}"
        }), 400
