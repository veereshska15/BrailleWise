import bcrypt
from database import get_collection
from models.user_model import UserModel
from flask_jwt_extended import create_access_token


def hash_password(password):
    """
    Accept a plain text password, hash it using bcrypt, and return it as a UTF-8 string.
    
    Args:
        password (str): The plain text password to hash.
        
    Returns:
        str: The hashed password string.
    """
    try:
        # Generate a salt and hash the password
        salt = bcrypt.gensalt()
        # hashpw expects bytes, so we encode the password to utf-8
        hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
        # Convert bytes back to a UTF-8 string for DB storage
        return hashed_bytes.decode('utf-8')
    except Exception as e:
        raise RuntimeError(f"Error occurred while hashing password: {str(e)}")

def verify_password(password, hashed_password):
    """
    Compare a plain text password with a stored bcrypt hash.
    
    Args:
        password (str): The plain text password to check.
        hashed_password (str): The stored hashed password (UTF-8 string).
        
    Returns:
        bool: True if passwords match, False otherwise.
    """
    try:
        # Encode both plain password and hashed password string to bytes for bcrypt comparison
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        # If comparison fails or arguments are invalid, return False
        return False

def register_user(name, email, password):
    """
    Register a new user by checking for duplicates, hashing the password,
    and inserting the new user record into the MongoDB collection.
    
    Args:
        name (str): Full name of the user.
        email (str): Email address of the user.
        password (str): Plain text password of the user.
        
    Returns:
        dict: A dictionary containing 'success' (bool) and 'message' (str).
    """
    try:
        # Normalize email address to avoid case duplicates
        normalized_email = email.strip().lower()
        
        # Get users collection from MongoDB
        users_collection = get_collection("users")
        
        # Check if a user with the same email already exists
        existing_user = users_collection.find_one({"email": normalized_email})
        if existing_user:
            return {
                "success": False,
                "message": "Email already registered"
            }
            
        # Hash the plain text password
        hashed_pw = hash_password(password)
        
        # Create a new UserModel object
        new_user = UserModel(
            name=name.strip(),
            email=normalized_email,
            password=hashed_pw
        )
        
        # Insert the serialized user dictionary into MongoDB
        users_collection.insert_one(new_user.to_dict())
        
        return {
            "success": True,
            "message": "User registered successfully"
        }
        
    except Exception as e:
        # Fallback error handling for database connection errors or database execution issues
        return {
            "success": False,
            "message": f"An error occurred during registration: {str(e)}"
        }

def login_user(email, password):
    """
    Authenticate a user by checking their email and verifying their password.
    """

    try:
        # Normalize email
        normalized_email = email.strip().lower()

        # Get users collection
        users_collection = get_collection("users")

        # Find user
        user_data = users_collection.find_one({"email": normalized_email})

        if not user_data:
            print("User not found.")
            return {
                "success": False,
                "message": "Invalid email or password"
            }

        # Get stored hash
        stored_hash = user_data.get("password")


        # Verify password
        if not verify_password(password, stored_hash):
            return {
                "success": False,
                "message": "Invalid email or password"
            }

        # Generate JWT token
        user_id = str(user_data["_id"])
        token = create_access_token(identity=user_id)

        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user_id,
                "name": user_data.get("name"),
                "email": user_data.get("email"),
                "role": user_data.get("role", "user")
            }
        }

    except Exception as e:
        print("\n========== LOGIN ERROR ==========")
        print(e)
        print("=================================\n")

        return {
            "success": False,
            "message": str(e)
        }