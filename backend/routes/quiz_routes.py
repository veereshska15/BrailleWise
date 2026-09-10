from flask import Blueprint, request, jsonify
from services.quiz_service import get_question, submit_answer, get_quiz_history

# Create Blueprint for Quiz Engine
quiz_bp = Blueprint("quiz_bp", __name__, url_prefix="/api/quiz")

@quiz_bp.route("/question/<letter>", methods=["GET"])
def get_letter_question(letter):
    """
    GET /api/quiz/question/<letter>
    
    Generates and returns a single MCQ for the specified Braille letter.
    """
    try:
        if not letter or not letter.strip():
            return jsonify({
                "success": False,
                "message": "letter parameter is required"
            }), 400
            
        q_details = get_question(letter)
        if q_details is None:
            return jsonify({
                "success": False,
                "message": f"Letter '{letter}' not found in learning content"
            }), 404
            
        return jsonify(q_details), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating question: {str(e)}"
        }), 400

@quiz_bp.route("/submit", methods=["POST"])
def submit_quiz_answer():
    """
    POST /api/quiz/submit
    
    Evaluates one answer submission. Expects JSON payload:
    {
        "user_id": "...",
        "letter": "A",
        "selected_answer": "1"
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
        required_fields = ["user_id", "letter", "selected_answer"]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Field '{field}' is required"
                }), 400
                
        user_id = data.get("user_id")
        letter = data.get("letter")
        selected_answer = data.get("selected_answer")
        
        # Validate types
        if not isinstance(user_id, str) or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id must be a non-empty string"
            }), 400
            
        if not isinstance(letter, str) or not letter.strip():
            return jsonify({
                "success": False,
                "message": "letter must be a non-empty string"
            }), 400
            
        # Submit and evaluate answer
        try:
            result = submit_answer(data)
            return jsonify(result), 200
        except ValueError as val_err:
            message = str(val_err)
            if "not found in learning content" in message:
                return jsonify({
                    "success": False,
                    "message": message
                }), 404
            return jsonify({
                "success": False,
                "message": message
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error submitting answer: {str(e)}"
        }), 400

@quiz_bp.route("/history/<user_id>", methods=["GET"])
def get_user_quiz_history(user_id):
    """
    GET /api/quiz/history/<user_id>
    
    Returns the complete quiz history for a student.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
            
        history = get_quiz_history(user_id)
        return jsonify({
            "success": True,
            "history": history
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error fetching history: {str(e)}"
        }), 400
