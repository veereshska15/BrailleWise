from flask import Blueprint, jsonify
from services.dashboard_service import (
    get_dashboard,
    get_learning_statistics,
    get_progress_summary,
    get_recent_activity,
    get_daily_overview
)

# Create Blueprint for Dashboard Module
dashboard_bp = Blueprint("dashboard_bp", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/overview/<user_id>", methods=["GET"])
def overview(user_id):
    """
    GET /api/dashboard/overview/<user_id>
    
    Retrieve the complete personalized dashboard overview for the student.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_dashboard(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving dashboard overview: {str(e)}"
        }), 400

@dashboard_bp.route("/statistics/<user_id>", methods=["GET"])
def statistics(user_id):
    """
    GET /api/dashboard/statistics/<user_id>
    
    Retrieve dynamically generated learning statistics for the student.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_learning_statistics(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving statistics: {str(e)}"
        }), 400

@dashboard_bp.route("/progress/<user_id>", methods=["GET"])
def progress(user_id):
    """
    GET /api/dashboard/progress/<user_id>
    
    Retrieve progress details for the current lesson and today's session.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_progress_summary(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving progress summary: {str(e)}"
        }), 400

@dashboard_bp.route("/activity/<user_id>", methods=["GET"])
def activity(user_id):
    """
    GET /api/dashboard/activity/<user_id>
    
    Retrieve logs of the user's recent learning activity sorted in descending order.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_recent_activity(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving recent activity: {str(e)}"
        }), 400

@dashboard_bp.route("/daily/<user_id>", methods=["GET"])
def daily(user_id):
    """
    GET /api/dashboard/daily/<user_id>
    
    Retrieve today's personalized daily overview and goals.
    """
    try:
        if not user_id or not user_id.strip():
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400

        result = get_daily_overview(user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error retrieving daily overview: {str(e)}"
        }), 400
