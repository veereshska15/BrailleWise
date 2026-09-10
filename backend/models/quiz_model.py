from datetime import datetime

class QuizModel:
    """
    Represent a user's quiz attempt for a Braille letter.
    
    This class defines the schema for a quiz document stored in MongoDB,
    including fields for question text, multiple choice options, correctness status,
    and timestamps.
    """
    
    def __init__(self, user_id, lesson_number, letter, question_type, question, options,
                 correct_answer, selected_answer, is_correct, difficulty, score=0, created_at=None, _id=None):
        """
        Initialize a new QuizModel instance.
        """
        self._id = _id
        self.user_id = str(user_id)
        self.lesson_number = int(lesson_number)
        self.letter = str(letter)
        self.question_type = str(question_type)
        self.question = str(question)
        self.options = list(options)
        self.correct_answer = str(correct_answer)
        self.selected_answer = str(selected_answer)
        self.is_correct = bool(is_correct)
        self.difficulty = str(difficulty)
        self.score = int(score)
        
        # Default created_at to current UTC time if not provided
        self.created_at = created_at if created_at is not None else datetime.utcnow()

    def to_dict(self, serializable=False):
        """
        Convert the QuizModel instance into a dictionary.
        
        If serializable=True, it converts ObjectId and datetime objects to strings 
        suitable for JSON response payloads.
        """
        quiz_dict = {
            "user_id": self.user_id,
            "lesson_number": self.lesson_number,
            "letter": self.letter,
            "question_type": self.question_type,
            "question": self.question,
            "options": self.options,
            "correct_answer": self.correct_answer,
            "selected_answer": self.selected_answer,
            "is_correct": self.is_correct,
            "difficulty": self.difficulty,
            "score": self.score,
            "created_at": self.created_at
        }
        
        if self._id is not None:
            if serializable:
                quiz_dict["_id"] = str(self._id)
            else:
                quiz_dict["_id"] = self._id
                
        if serializable:
            if isinstance(quiz_dict["created_at"], datetime):
                quiz_dict["created_at"] = quiz_dict["created_at"].isoformat()
                
        return quiz_dict

    @classmethod
    def from_dict(cls, data):
        """
        Create a QuizModel instance from a dictionary retrieved from MongoDB.
        """
        if not data:
            return None
            
        created_at = data.get("created_at")
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at)
            except ValueError:
                pass

        return cls(
            user_id=data.get("user_id"),
            lesson_number=data.get("lesson_number"),
            letter=data.get("letter"),
            question_type=data.get("question_type"),
            question=data.get("question"),
            options=data.get("options", []),
            correct_answer=data.get("correct_answer"),
            selected_answer=data.get("selected_answer"),
            is_correct=data.get("is_correct", False),
            difficulty=data.get("difficulty"),
            score=data.get("score", 0),
            created_at=created_at,
            _id=data.get("_id")
        )
