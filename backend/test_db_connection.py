import sys
from database import get_database, get_collection

def main():
    print("Attempting to initialize database connection...")
    try:
        # get_database() will run init_db() lazily
        db = get_database()
        
        # Test collection retrieval
        test_col = get_collection("test_connection")
        print(f"Database instance: {db.name}")
        print(f"Successfully retrieved collection: {test_col.name}")
        
    except SystemExit as e:
        print(f"Connection test terminated with code {e.code}")
        sys.exit(e.code)
    except Exception as e:
        print(f"Error during testing: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
