from database import get_collection
from models.learning_content_model import LearningContentModel

def seed_if_empty():
    """
    Check if the learning_content collection is empty.
    If so, populate it with Lesson 1 seed data (A-F).
    """
    try:
        col = get_collection("learning_content")
        if col.count_documents({}) == 0:
            seed_data = [
                {
                    "lesson_number": 1,
                    "lesson_name": "Introduction to Braille (A-F)",
                    "type": "letter",
                    "letter": "A",
                    "braille_dots": [1],
                    "braille_pattern": "⠁",
                    "word": "Apple",
                    "sentence": "A is for Apple.",
                    "difficulty": "Beginner",
                    "audio_text": "Letter A. Braille dot 1. Example word: Apple. A is for Apple.",
                    "unlock_order": 1
                },
                {
                    "lesson_number": 1,
                    "lesson_name": "Introduction to Braille (A-F)",
                    "type": "letter",
                    "letter": "B",
                    "braille_dots": [1, 2],
                    "braille_pattern": "⠃",
                    "word": "Banana",
                    "sentence": "B is for Banana.",
                    "difficulty": "Beginner",
                    "audio_text": "Letter B. Braille dots 1 and 2. Example word: Banana. B is for Banana.",
                    "unlock_order": 2
                },
                {
                    "lesson_number": 1,
                    "lesson_name": "Introduction to Braille (A-F)",
                    "type": "letter",
                    "letter": "C",
                    "braille_dots": [1, 4],
                    "braille_pattern": "⠉",
                    "word": "Cat",
                    "sentence": "C is for Cat.",
                    "difficulty": "Beginner",
                    "audio_text": "Letter C. Braille dots 1 and 4. Example word: Cat. C is for Cat.",
                    "unlock_order": 3
                },
                {
                    "lesson_number": 1,
                    "lesson_name": "Introduction to Braille (A-F)",
                    "type": "letter",
                    "letter": "D",
                    "braille_dots": [1, 4, 5],
                    "braille_pattern": "⠙",
                    "word": "Dog",
                    "sentence": "D is for Dog.",
                    "difficulty": "Beginner",
                    "audio_text": "Letter D. Braille dots 1, 4, and 5. Example word: Dog. D is for Dog.",
                    "unlock_order": 4
                },
                {
                    "lesson_number": 1,
                    "lesson_name": "Introduction to Braille (A-F)",
                    "type": "letter",
                    "letter": "E",
                    "braille_dots": [1, 5],
                    "braille_pattern": "⠑",
                    "word": "Elephant",
                    "sentence": "E is for Elephant.",
                    "difficulty": "Beginner",
                    "audio_text": "Letter E. Braille dots 1 and 5. Example word: Elephant. E is for Elephant.",
                    "unlock_order": 5
                },
                {
                    "lesson_number": 1,
                    "lesson_name": "Introduction to Braille (A-F)",
                    "type": "letter",
                    "letter": "F",
                    "braille_dots": [1, 2, 4],
                    "braille_pattern": "⠋",
                    "word": "Frog",
                    "sentence": "F is for Frog.",
                    "difficulty": "Beginner",
                    "audio_text": "Letter F. Braille dots 1, 2, and 4. Example word: Frog. F is for Frog.",
                    "unlock_order": 6
                }
            ]
            for item in seed_data:
                model = LearningContentModel(
                    lesson_number=item["lesson_number"],
                    lesson_name=item["lesson_name"],
                    type=item["type"],
                    letter=item["letter"],
                    braille_dots=item["braille_dots"],
                    braille_pattern=item["braille_pattern"],
                    word=item["word"],
                    sentence=item["sentence"],
                    difficulty=item["difficulty"],
                    audio_text=item["audio_text"],
                    unlock_order=item["unlock_order"]
                )
                col.insert_one(model.to_dict())
            print("Successfully seeded database with Lesson 1 (A-F)")
    except Exception as e:
        print(f"Error seeding database: {e}")

def add_learning_content(data):
    """
    Insert a new learning content item into MongoDB.
    """
    try:
        seed_if_empty()
        col = get_collection("learning_content")
        model = LearningContentModel(
            lesson_number=data.get("lesson_number"),
            lesson_name=data.get("lesson_name"),
            type=data.get("type"),
            letter=data.get("letter"),
            braille_dots=data.get("braille_dots"),
            braille_pattern=data.get("braille_pattern"),
            word=data.get("word"),
            sentence=data.get("sentence"),
            difficulty=data.get("difficulty"),
            audio_text=data.get("audio_text"),
            unlock_order=data.get("unlock_order")
        )
        result = col.insert_one(model.to_dict())
        return {
            "success": True,
            "message": "Content added successfully",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error adding learning content: {str(e)}"
        }

def get_all_learning_content():
    """
    Retrieve all learning content from MongoDB, ordered by unlock_order.
    """
    try:
        seed_if_empty()
        col = get_collection("learning_content")
        cursor = col.find().sort("unlock_order", 1)
        results = []
        for doc in cursor:
            # Clean object ID to string for json serialization
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return {
            "success": True,
            "content": results
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error retrieving learning content: {str(e)}"
        }

def get_lesson(lesson_number):
    """
    Retrieve all learning content items for a specific lesson number.
    """
    try:
        seed_if_empty()
        col = get_collection("learning_content")
        
        # Support lesson number as string or int
        try:
            lesson_num_int = int(lesson_number)
            query = {"lesson_number": {"$in": [lesson_num_int, str(lesson_number)]}}
        except ValueError:
            query = {"lesson_number": str(lesson_number)}
            
        cursor = col.find(query).sort("unlock_order", 1)
        results = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
        return {
            "success": True,
            "content": results
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error retrieving lesson: {str(e)}"
        }

def get_letter(letter):
    """
    Retrieve learning content details for a specific letter.
    """
    try:
        seed_if_empty()
        col = get_collection("learning_content")
        normalized_letter = str(letter).strip().upper()
        
        doc = col.find_one({"letter": normalized_letter})
        if not doc:
            doc = col.find_one({"letter": letter})
            
        if not doc:
            return {
                "success": False,
                "message": f"Letter '{letter}' not found"
            }
            
        doc["_id"] = str(doc["_id"])
        return {
            "success": True,
            "content": doc
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error retrieving letter: {str(e)}"
        }
