from flask import Blueprint, request, jsonify
from services.challenge_service import (
    start_challenge,
    get_next_question,
    submit_challenge_answer,
    finish_challenge,
    get_challenge_history,
    get_challenge_statistics
)

# Create Blueprint for Challenge Module
challenge_bp = Blueprint("challenge_bp", __name__, url_prefix="/api/challenge")

@challenge_bp.route("/start/<user_id>", methods=["POST"])
def start(user_id):
    """
    POST /api/challenge/start/<user_id>
    
    Initiate a new dynamic challenge session.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = start_challenge(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error starting challenge: {str(e)}"
        }), 400

@challenge_bp.route("/question/<user_id>", methods=["GET"])
def next_question(user_id):
    """
    GET /api/challenge/question/<user_id>
    
    Fetch the next unanswered question from the active challenge session.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_next_question(user_id)
        if result is None:
            return jsonify({
                "success": True,
                "message": "No remaining unanswered questions in this challenge.",
                "question": None
            }), 200
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error fetching next question: {str(e)}"
        }), 400

@challenge_bp.route("/submit", methods=["POST"])
def submit():
    """
    POST /api/challenge/submit
    
    Submit an answer to a question in the student's active challenge session.
    Expects JSON body:
    {
        "user_id": "user123",
        "challenge_id": "challenge_obj_id",
        "question_id": "A",
        "selected_answer": "1"
    }
    """
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body must be valid JSON"
            }), 400

        user_id = data.get("user_id")
        challenge_id = data.get("challenge_id")
        question_id = data.get("question_id")
        selected_answer = data.get("selected_answer")

        if not user_id or not isinstance(user_id, str) or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required and must be a non-empty string"
            }), 400

        if not challenge_id or not isinstance(challenge_id, str) or not challenge_id.strip():
            return jsonify({
                "success": False,
                "message": "challenge_id is required and must be a non-empty string"
            }), 400

        if not question_id or not isinstance(question_id, str) or not question_id.strip():
            return jsonify({
                "success": False,
                "message": "question_id is required and must be a non-empty string"
            }), 400

        if selected_answer is None:
            return jsonify({
                "success": False,
                "message": "selected_answer is required"
            }), 400

        result = submit_challenge_answer(user_id, challenge_id, question_id, selected_answer)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error submitting answer: {str(e)}"
        }), 400

@challenge_bp.route("/finish/<user_id>", methods=["POST"])
def finish(user_id):
    """
    POST /api/challenge/finish/<user_id>
    
    Complete the student's active challenge session.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = finish_challenge(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error finishing challenge: {str(e)}"
        }), 400

@challenge_bp.route("/history/<user_id>", methods=["GET"])
def history(user_id):
    """
    GET /api/challenge/history/<user_id>
    
    Retrieve completed challenge logs for the student, newest first.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_challenge_history(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving challenge history: {str(e)}"
        }), 400

@challenge_bp.route("/statistics/<user_id>", methods=["GET"])
def statistics(user_id):
    """
    GET /api/challenge/statistics/<user_id>
    
    Retrieve cumulative challenge mode statistics dynamically.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_challenge_statistics(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving challenge statistics: {str(e)}"
        }), 400
