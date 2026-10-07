from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from database import get_collection
from services.auth_service import register_user, login_user
from utils.auth_decorator import jwt_required, get_current_user_id
from utils.validators import validate_registration, validate_email



# Create Blueprint
auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Register a new user
    Endpoint: POST /api/auth/register
    """


    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "success": False,
            "message": "Request body must be valid JSON"
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    # Validate all registration fields
    validation = validate_registration(data)
    if not validation["valid"]:
        return jsonify({
            "success": False,
            "message": "; ".join(validation["errors"])
        }), 400

    result = register_user(name, email, password)

    if result.get("success"):
        # Auto-login newly registered user
        users_collection = get_collection("users")
        user_data = users_collection.find_one({"email": email.strip().lower()})
        user_id = str(user_data["_id"])
        
        # Save initial assessment_completed and experience level
        experience = data.get("experience", "Beginner").strip()
        users_collection.update_one(
            {"_id": user_data["_id"]},
            {"$set": {
                "assessment_completed": False,
                "experience_level": experience
            }}
        )
        
        from flask_jwt_extended import create_access_token
        token = create_access_token(identity=user_id)
        
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email.strip().lower(),
                "role": "user",
                "assessment_completed": False
            }
        }), 201

    if result.get("message") == "Email already registered":
        return jsonify({
            "success": False,
            "message": "Email already registered"
        }), 409

    return jsonify({
        "success": False,
        "message": result.get("message", "Registration failed")
    }), 400


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Login an existing user
    Endpoint: POST /api/auth/login
    """
    try:
        # Read the JSON body from the request
        data = request.get_json(silent=True)
        
        if data is None:
            return jsonify({
                "success": False,
                "message": "Request body must be valid JSON"
            }), 400
            
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        
        # Validate that email and password are not missing or empty
        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required"
            }), 400

        if not validate_email(email):
            return jsonify({
                "success": False,
                "message": "Invalid email address format"
            }), 400
            
        # Authenticate the user via the auth service
        result = login_user(email, password)
        
        # If login is successful, return the exact object with 200 OK
        if result.get("success"):
            users_col = get_collection("users")
            user_data = users_col.find_one({"email": email.strip().lower()})
            assess_col = get_collection("assessment")
            completed_assess = assess_col.find_one({"user_id": str(user_data["_id"]), "assessment_status": "completed"})
            assessment_completed = user_data.get("assessment_completed", False) or (completed_assess is not None)
            
            if assessment_completed and not user_data.get("assessment_completed"):
                users_col.update_one(
                    {"_id": user_data["_id"]},
                    {"$set": {"assessment_completed": True}}
                )
            result["user"]["assessment_completed"] = bool(assessment_completed)
            result["user"]["proficiency_level"] = user_data.get("proficiency_level", user_data.get("experience_level", "Beginner"))
            if "voice_settings" in user_data:
                result["user"]["voice_settings"] = user_data["voice_settings"]
            return jsonify(result), 200
            
        # If login fails because of invalid credentials, return 401 Unauthorized
        if result.get("message") == "Invalid email or password":
            return jsonify(result), 401
            
        # Return 400 Bad Request for any other failure
        return jsonify(result), 400
        
    except Exception as e:
        # Handle unexpected errors and return 400
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    """
    GET /api/auth/profile
    
    Get current logged-in user profile. Protected endpoint.
    """
    try:
        # Get current user ID from the JWT token
        user_id = get_current_user_id()
        
        # Get users collection from MongoDB
        users_collection = get_collection("users")
        
        # Convert string ID to ObjectId if possible (standard MongoDB format)
        try:
            query_id = ObjectId(user_id)
        except Exception:
            # Fallback if id is stored as string in database
            query_id = user_id
            
        # Find user in the database
        user_data = users_collection.find_one({"_id": query_id})
        
        if not user_data:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404
            
        # Return user profile details with self-healing checks
        assess_col = get_collection("assessment")
        completed_assess = assess_col.find_one({"user_id": str(user_data["_id"]), "assessment_status": "completed"})
        assessment_completed = user_data.get("assessment_completed", False) or (completed_assess is not None)
        
        if assessment_completed and not user_data.get("assessment_completed"):
            users_collection.update_one(
                {"_id": user_data["_id"]},
                {"$set": {"assessment_completed": True}}
            )

        response_data = {
            "success": True,
            "user": {
                "id": str(user_data["_id"]),
                "name": user_data.get("name"),
                "email": user_data.get("email"),
                "role": user_data.get("role", "user"),
                "assessment_completed": bool(assessment_completed),
                "proficiency_level": user_data.get("proficiency_level", user_data.get("experience_level", "Beginner"))
            }
        }
        if "voice_settings" in user_data:
            response_data["user"]["voice_settings"] = user_data["voice_settings"]

        return jsonify(response_data), 200
        
    except Exception as e:
        # Handle unexpected errors and return 400
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


@auth_bp.route("/settings", methods=["PUT"])
@jwt_required()
def update_settings():
    """
    PUT /api/auth/settings
    
    Update current logged-in user settings (e.g. voice_settings).
    """
    try:
        user_id = get_current_user_id()
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "message": "Request body must be JSON"}), 400

        try:
            query_id = ObjectId(user_id)
        except Exception:
            query_id = user_id
            
        users_collection = get_collection("users")
        update_fields = {}
        
        if "voice_settings" in data:
            update_fields["voice_settings"] = data["voice_settings"]
            
        if not update_fields:
            return jsonify({"success": True, "message": "No settings updated"}), 200
            
        users_collection.update_one(
            {"_id": query_id},
            {"$set": update_fields}
        )
        
        return jsonify({"success": True, "message": "Settings updated successfully"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400