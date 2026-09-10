from flask import Blueprint, request, jsonify
from services.lesson_service import start_lesson, get_current_letter, next_letter, get_user_state, save_user_state

# Create Blueprint for lesson engine
lesson_bp = Blueprint("lesson_bp", __name__, url_prefix="/api/lesson")

@lesson_bp.route("/start", methods=["POST"])
def start():
    """
    POST /api/lesson/start
    
    Initialize or retrieve the lesson progress for a specific user.
    Expects JSON body: {"user_id": "<user_id>"}
    """
    try:
        data = request.get_json(silent=True)
        if not data or "user_id" not in data:
            return jsonify({
                "success": False,
                "message": "user_id is required in JSON body"
            }), 400
            
        user_id = data.get("user_id")
        result = start_lesson(user_id)
        if result.get("success"):
            return jsonify(result), 200
        return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@lesson_bp.route("/current/<user_id>", methods=["GET"])
def current(user_id):
    """
    GET /api/lesson/current/<user_id>
    
    Retrieve details of the user's current letter.
    """
    try:
        result = get_current_letter(user_id)
        if result.get("success"):
            return jsonify(result), 200
        return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@lesson_bp.route("/next/<user_id>", methods=["POST"])
def next(user_id):
    """
    POST /api/lesson/next/<user_id>
    
    Advance progress to the next letter in the lesson.
    """
    try:
        result = next_letter(user_id)
        if result.get("success"):
            return jsonify(result), 200
        return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@lesson_bp.route("/state/<user_id>", methods=["GET", "POST"])
def user_state(user_id):
    """
    GET /api/lesson/state/<user_id>
    POST /api/lesson/state/<user_id>
    
    Fetch or update complete user progress state in MongoDB.
    """
    try:
        if request.method == "GET":
            res = get_user_state(user_id)
            return jsonify(res), 200 if res.get("success") else 400
        else:
            data = request.get_json(silent=True) or {}
            res = save_user_state(user_id, data)
            return jsonify(res), 200 if res.get("success") else 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

