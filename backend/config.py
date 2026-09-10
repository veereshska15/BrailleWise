# BrailleWise Backend Configuration
import os
from dotenv import load_dotenv

# Load environment variables from a .env file if it exists
load_dotenv()

class Config:
    """
    Base configuration class.
    Define shared/default configuration variables.
    """
    DEBUG = False
    TESTING = False
    
    # MongoDB Atlas Connection URI
    MONGO_URI = os.getenv("MONGO_URI")
    
    # JWT Configuration Secret Key
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key-for-development")


class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    # Enforce strict production settings
    pass

class TestingConfig(Config):
    TESTING = True

