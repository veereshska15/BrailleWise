from flask import Blueprint, request, jsonify
from services.voice_guidance_service import (
    generate_welcome_message,
    generate_letter_instruction,
    generate_quiz_feedback,
    generate_session_completion_message,
    generate_daily_journey
)

# Create Blueprint for Voice Guidance
voice_bp = Blueprint("voice_bp", __name__, url_prefix="/api/voice")

@voice_bp.route("/welcome/<user_id>", methods=["GET"])
def welcome(user_id):
    """
    GET /api/voice/welcome/<user_id>
    
    Retrieve a personalized welcome message for the student.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        message = generate_welcome_message(user_id)
        return jsonify({
            "welcome_message": message
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating welcome message: {str(e)}"
        }), 400

@voice_bp.route("/letter/<user_id>/<letter>", methods=["GET"])
def letter_instruction(user_id, letter):
    """
    GET /api/voice/letter/<user_id>/<letter>
    
    Retrieve learning instructions for a specific letter.
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

        result = generate_letter_instruction(user_id, letter)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating letter instruction: {str(e)}"
        }), 400

@voice_bp.route("/journey/<user_id>", methods=["GET"])
def daily_journey(user_id):
    """
    GET /api/voice/journey/<user_id>
    
    Retrieve a spoken overview of today's learning journey.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = generate_daily_journey(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating daily journey message: {str(e)}"
        }), 400

@voice_bp.route("/completion/<user_id>", methods=["GET"])
def session_completion(user_id):
    """
    GET /api/voice/completion/<user_id>
    
    Retrieve a personalized session completion message.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        message = generate_session_completion_message(user_id)
        return jsonify({
            "completion_message": message
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating session completion message: {str(e)}"
        }), 400

@voice_bp.route("/feedback", methods=["POST"])
def quiz_feedback():
    """
    POST /api/voice/feedback
    
    Retrieve personalized quiz answer feedback.
    Expects JSON body: {"user_id": "...", "is_correct": true}
    """
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body must be valid JSON"
            }), 400

        user_id = data.get("user_id")
        is_correct = data.get("is_correct")

        if not user_id or not isinstance(user_id, str) or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required and must be a string"
            }), 400

        if is_correct is None or not isinstance(is_correct, bool):
            return jsonify({
                "success": False,
                "message": "is_correct is required and must be a boolean"
            }), 400

        feedback = generate_quiz_feedback(user_id, is_correct)
        return jsonify({
            "feedback": feedback
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating quiz feedback: {str(e)}"
        }), 400
