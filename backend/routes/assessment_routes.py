from flask import Blueprint, request, jsonify
from services.assessment_service import (
    start_assessment,
    get_next_question,
    submit_assessment_answer,
    finish_assessment,
    get_assessment_summary
)

# Create Blueprint for Assessment Mode
assessment_bp = Blueprint("assessment_bp", __name__, url_prefix="/api/assessment")

@assessment_bp.route("/start/<user_id>", methods=["POST"])
def start(user_id):
    """
    POST /api/assessment/start/<user_id>
    
    Start a new diagnostic assessment session for the student.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = start_assessment(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error starting assessment: {str(e)}"
        }), 400

@assessment_bp.route("/question/<user_id>", methods=["GET"])
def next_question(user_id):
    """
    GET /api/assessment/question/<user_id>
    
    Retrieve the next unanswered question for the student's active assessment.
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
                "message": "No remaining unanswered questions.",
                "question": None
            }), 200
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error fetching next question: {str(e)}"
        }), 400

@assessment_bp.route("/submit", methods=["POST"])
def submit_answer():
    """
    POST /api/assessment/submit
    
    Submit an answer to a question in the student's active assessment session.
    Expects JSON body:
    {
        "user_id": "user123",
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
        question_id = data.get("question_id")
        selected_answer = data.get("selected_answer")

        if not user_id or not isinstance(user_id, str) or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required and must be a non-empty string"
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

        result = submit_assessment_answer(user_id, question_id, selected_answer)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error submitting answer: {str(e)}"
        }), 400

@assessment_bp.route("/finish/<user_id>", methods=["POST"])
def finish(user_id):
    """
    POST /api/assessment/finish/<user_id>
    
    Complete the student's active assessment session, updating starting lesson progress.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = finish_assessment(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error finishing assessment: {str(e)}"
        }), 400

@assessment_bp.route("/summary/<user_id>", methods=["GET"])
def summary(user_id):
    """
    GET /api/assessment/summary/<user_id>
    
    Retrieve the status and scores summary of the student's latest assessment.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_assessment_summary(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error fetching assessment summary: {str(e)}"
        }), 400
