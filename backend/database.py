import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError
from utils.logger import get_logger

logger = get_logger(__name__)

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
        
    is_placeholder = bool(mongo_uri and ("YOUR_REAL_MONGODB" in mongo_uri or "your_real_mongodb" in mongo_uri.lower()))
    
    if mongo_uri and not is_placeholder:
        try:
            _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
            _client.admin.command("ping")
            _db = _client.get_database("braillewise")
            logger.info("MongoDB Atlas connected successfully")
            return _db
        except Exception as e:
            logger.warning("Configured MongoDB URI failed (%s). Trying local MongoDB...", e)
            
    # Connect to local MongoDB instance
    try:
        _client = MongoClient("mongodb://127.0.0.1:27017", serverSelectionTimeoutMS=2000)
        _client.admin.command("ping")
        _db = _client.get_database("braillewise")
        logger.info("Connected to local MongoDB (127.0.0.1:27017)")
        return _db
    except Exception as e:
        logger.error("Failed to connect to local MongoDB: %s", e)
        raise ConnectionFailure(f"Failed to connect to MongoDB: {e}")

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
