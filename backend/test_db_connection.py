import sys
from utils.logger import get_logger
from database import get_database, get_collection

logger = get_logger(__name__)

def main():
    logger.info("Attempting to initialize database connection...")
    try:
        # get_database() will run init_db() lazily
        db = get_database()
        
        # Test collection retrieval
        test_col = get_collection("test_connection")
        logger.info("Database instance: %s", db.name)
        logger.info("Successfully retrieved collection: %s", test_col.name)
        
    except SystemExit as e:
        logger.error("Connection test terminated with code %s", e.code)
        sys.exit(e.code)
    except Exception as e:
        logger.error("Error during testing: %s", e)
        sys.exit(1)

if __name__ == "__main__":
    main()

