from flask import Blueprint, request, jsonify
from services.learning_content_service import (
    add_learning_content,
    get_all_learning_content,
    get_lesson,
    get_letter
)

# Create Blueprint for learning content
learning_bp = Blueprint("learning_bp", __name__, url_prefix="/api/learning")

@learning_bp.route("/content", methods=["POST"])
def post_content():
    """
    POST /api/learning/content
    
    Add new learning content item.
    """
    try:
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({
                "success": False,
                "message": "Request body must be valid JSON"
            }), 400
            
        # Basic validation: ensure essential fields are present
        required_fields = [
            "lesson_number", "lesson_name", "type", "letter", 
            "braille_dots", "braille_pattern", "word", "sentence", 
            "difficulty", "audio_text", "unlock_order"
        ]
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "success": False,
                    "message": f"Field '{field}' is required"
                }), 400
                
        result = add_learning_content(data)
        if result.get("success"):
            return jsonify(result), 201
        return jsonify(result), 400
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@learning_bp.route("/content", methods=["GET"])
def get_content():
    """
    GET /api/learning/content
    
    Retrieve all learning content.
    """
    try:
        result = get_all_learning_content()
        if result.get("success"):
            return jsonify(result), 200
        return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@learning_bp.route("/lesson/<lesson_number>", methods=["GET"])
def get_lesson_route(lesson_number):
    """
    GET /api/learning/lesson/<lesson_number>
    
    Retrieve all content for a specific lesson.
    """
    try:
        result = get_lesson(lesson_number)
        if result.get("success"):
            return jsonify(result), 200
        return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400

@learning_bp.route("/letter/<letter>", methods=["GET"])
def get_letter_route(letter):
    """
    GET /api/learning/letter/<letter>
    
    Retrieve learning content details for a specific letter.
    """
    try:
        result = get_letter(letter)
        if result.get("success"):
            return jsonify(result), 200
        if "not found" in result.get("message", "").lower():
            return jsonify(result), 404
        return jsonify(result), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400
