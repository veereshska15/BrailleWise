import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError

# Ensure environment variables are loaded by importing our configuration
from config import Config

# Global database client and database references (singleton pattern)
_client = None
_db = None

def init_db():
    """
    Initialize the MongoDB connection client using the URI from Config.
    Verifies the connection with a ping and sets the global references.
    If the connection fails, prints a clear error and exits gracefully.
    """
    global _client, _db
    
    # Read the URI from the Config class (which reads it from the environment variable loaded via dotenv)
    mongo_uri = getattr(Config, 'MONGO_URI', None)
    
    # If Config doesn't have it or it is empty, check directly in the environment as a fallback
    if not mongo_uri:
        mongo_uri = os.getenv("MONGO_URI")
        
    if not mongo_uri:
        print("Error: MONGO_URI is not set in config or environment. Please check your .env file.", file=sys.stderr)
        sys.exit(1)
        
    try:
        # Create a reusable MongoClient instance
        # PyMongo handles connection pooling automatically
        _client = MongoClient(mongo_uri)
        
        # Verify the connection using MongoClient.admin.command("ping")
        _client.admin.command("ping")
        
        # Get the database named "braillewise"
        _db = _client.get_database("braillewise")
        
        print("MongoDB Atlas Connected Successfully")
        return _db
        
    except ConnectionFailure as e:
        print(f"Error: Failed to connect to MongoDB Atlas: {e}", file=sys.stderr)
        sys.exit(1)
    except ConfigurationError as e:
        print(f"Error: MongoDB URI configuration is invalid: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: An unexpected database error occurred: {e}", file=sys.stderr)
        sys.exit(1)

def get_database():
    """
    Return the initialized MongoDB database instance.
    Initializes the database connection if it is not already established.
    """
    global _db
    if _db is None:
        return init_db()
    return _db

def get_collection(name):
    """
    Return a specific MongoDB collection by name.
    """
    db = get_database()
    return db[name]
