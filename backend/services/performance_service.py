from datetime import datetime
from database import get_collection
from models.performance_model import PerformanceModel

# Configuration thresholds
MASTERED_THRESHOLD = 90
GOOD_THRESHOLD = 75
WEAK_THRESHOLD = 60
MIN_ATTEMPTS = 5

def update_performance(user_id, lesson_number, letter, is_correct):
    """
    Update the performance record for a specific user, lesson, and letter.
    If it's the user's first attempt, a new performance document is created.
    
    Args:
        user_id (str): The user's unique ID.
        lesson_number (int): The current lesson number.
        letter (str): The Braille letter being practiced.
        is_correct (bool): Whether the user's attempt was correct.
        
    Returns:
        dict: The updated performance document serialized to a dictionary suitable for JSON.
    """
    perf_col = get_collection("performance")
    
    # Query for an existing performance document for this user and letter
    doc = perf_col.find_one({
        "user_id": str(user_id),
        "letter": str(letter)
    })
    
    if not doc:
        # First attempt for the letter: create a new model instance
        perf = PerformanceModel(
            user_id=user_id,
            lesson_number=lesson_number,
            letter=letter,
            attempts=0,
            correct=0,
            wrong=0,
            accuracy=0.0,
            mastered=False
        )
    else:
        # Load the existing document into the model
        perf = PerformanceModel.from_dict(doc)
        # Update lesson number in case it changed (e.g. review in a later lesson)
        perf.lesson_number = int(lesson_number)
        
    # Update performance fields
    perf.attempts += 1
    if is_correct:
        perf.correct += 1
    else:
        perf.wrong += 1
        
    # Recalculate accuracy (rounded to two decimal places)
    perf.accuracy = round((perf.correct / perf.attempts) * 100, 2)
    
    # Update attempt history and keep only the most recent 5 attempts
    perf.attempt_history.append(is_correct)
    perf.attempt_history = perf.attempt_history[-5:]
    
    # Calculate last 5 attempts accuracy
    last_5_accuracy = (perf.attempt_history.count(True) / len(perf.attempt_history)) * 100 if perf.attempt_history else 0.0
    
    # Determine mastery
    if perf.attempts < MIN_ATTEMPTS:
        perf.mastered = False
    else:
        perf.mastered = (last_5_accuracy >= MASTERED_THRESHOLD)
        
    # Update practice and modification timestamps
    perf.last_practiced = datetime.utcnow()
    perf.updated_at = datetime.utcnow()
    
    # Convert model to dict for database storage
    perf_dict = perf.to_dict(serializable=False)
    
    # Save back to MongoDB
    if perf._id is None:
        result = perf_col.insert_one(perf_dict)
        perf._id = result.inserted_id
        perf_dict["_id"] = result.inserted_id
    else:
        perf_col.replace_one({"_id": perf._id}, perf_dict)
        
    # Update model _id and return serialized version
    perf._id = perf_dict["_id"]
    return perf.to_dict(serializable=True)

def get_performance(user_id):
    """
    Retrieve all performance documents for a specific user.
    
    Args:
        user_id (str): The user's unique ID.
        
    Returns:
        list: A list of serialized performance documents for the user.
    """
    perf_col = get_collection("performance")
    cursor = perf_col.find({"user_id": str(user_id)})
    
    performances = []
    for doc in cursor:
        perf = PerformanceModel.from_dict(doc)
        performances.append(perf.to_dict(serializable=True))
        
    return performances

def get_letter_performance(user_id, letter):
    """
    Retrieve the performance document for a specific user and letter.
    
    Args:
        user_id (str): The user's unique ID.
        letter (str): The Braille letter.
        
    Returns:
        dict: The serialized performance document, or None if not found.
    """
    perf_col = get_collection("performance")
    doc = perf_col.find_one({
        "user_id": str(user_id),
        "letter": str(letter)
    })
    
    if not doc:
        return None
        
    perf = PerformanceModel.from_dict(doc)
    return perf.to_dict(serializable=True)
