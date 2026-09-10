from datetime import datetime

class PerformanceModel:
    """
    Represent a user's learning performance for a specific Braille letter.
    
    This class defines the schema for a performance document stored in MongoDB.
    It tracks attempts, accuracy, mastery status, and practice timestamps.
    """
    
    def __init__(self, user_id, lesson_number, letter, attempts=0, correct=0, wrong=0, 
                 accuracy=0.0, mastered=False, last_practiced=None, attempt_history=None,
                 created_at=None, updated_at=None, _id=None):
        """
        Initialize a new PerformanceModel instance.
        """
        self._id = _id
        self.user_id = str(user_id)
        self.lesson_number = int(lesson_number)
        self.letter = str(letter)
        self.attempts = int(attempts)
        self.correct = int(correct)
        self.wrong = int(wrong)
        self.accuracy = float(accuracy)
        self.mastered = bool(mastered)
        self.last_practiced = last_practiced
        self.attempt_history = list(attempt_history) if attempt_history is not None else []
        
        # Default created_at and updated_at to current UTC time if not provided
        self.created_at = created_at if created_at is not None else datetime.utcnow()
        self.updated_at = updated_at if updated_at is not None else datetime.utcnow()

    def to_dict(self, serializable=False):
        """
        Convert the PerformanceModel instance into a dictionary.
        
        If serializable=True, it converts ObjectId and datetime objects to strings 
        to ensure suitability for JSON responses. Otherwise, it keeps database-native types.
        """
        perf_dict = {
            "user_id": self.user_id,
            "lesson_number": self.lesson_number,
            "letter": self.letter,
            "attempts": self.attempts,
            "correct": self.correct,
            "wrong": self.wrong,
            "accuracy": self.accuracy,
            "mastered": self.mastered,
            "last_practiced": self.last_practiced,
            "attempt_history": self.attempt_history,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        
        if self._id is not None:
            if serializable:
                perf_dict["_id"] = str(self._id)
            else:
                perf_dict["_id"] = self._id
                
        if serializable:
            if isinstance(perf_dict["last_practiced"], datetime):
                perf_dict["last_practiced"] = perf_dict["last_practiced"].isoformat()
            if isinstance(perf_dict["created_at"], datetime):
                perf_dict["created_at"] = perf_dict["created_at"].isoformat()
            if isinstance(perf_dict["updated_at"], datetime):
                perf_dict["updated_at"] = perf_dict["updated_at"].isoformat()
                
        return perf_dict

    @classmethod
    def from_dict(cls, data):
        """
        Create a PerformanceModel instance from a dictionary retrieved from MongoDB or other source.
        """
        if not data:
            return None
            
        # Parse datetime strings to datetime objects if needed (e.g. from JSON deserialization)
        last_practiced = data.get("last_practiced")
        if isinstance(last_practiced, str):
            try:
                last_practiced = datetime.fromisoformat(last_practiced)
            except ValueError:
                pass
                
        created_at = data.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at)
            except ValueError:
                pass
                
        updated_at = data.get("updated_at")
        if isinstance(updated_at, str):
            try:
                updated_at = datetime.fromisoformat(updated_at)
            except ValueError:
                pass

        attempt_history = data.get("attempt_history")
        if attempt_history is None:
            attempt_history = []

        return cls(
            user_id=data.get("user_id"),
            lesson_number=data.get("lesson_number"),
            letter=data.get("letter"),
            attempts=data.get("attempts", 0),
            correct=data.get("correct", 0),
            wrong=data.get("wrong", 0),
            accuracy=data.get("accuracy", 0.0),
            mastered=data.get("mastered", False),
            last_practiced=last_practiced,
            attempt_history=attempt_history,
            created_at=created_at,
            updated_at=updated_at,
            _id=data.get("_id")
        )
