from datetime import datetime

class ChallengeModel:
    """
    Represent an independent Challenge Mode session in BrailleWise.
    It tracks the user's score, questions attempted, correct/wrong answers,
    accuracy, difficulty, elapsed time, and completion status.
    """
    def __init__(self, user_id, challenge_started_at=None, challenge_completed_at=None,
                 difficulty="Medium", questions=None, questions_attempted=0,
                 correct_answers=0, wrong_answers=0, score=0, accuracy=0.0,
                 time_taken=0.0, completion_status="started", performance_grade="",
                 created_at=None, updated_at=None, _id=None):
        self._id = _id
        self.user_id = str(user_id)
        self.challenge_started_at = challenge_started_at if challenge_started_at is not None else datetime.utcnow()
        self.challenge_completed_at = challenge_completed_at
        self.difficulty = difficulty
        self.questions = questions if questions is not None else []
        self.questions_attempted = int(questions_attempted)
        self.correct_answers = int(correct_answers)
        self.wrong_answers = int(wrong_answers)
        self.score = int(score)
        self.accuracy = float(accuracy)
        self.time_taken = float(time_taken)
        self.completion_status = completion_status  # e.g., 'started', 'completed'
        self.performance_grade = performance_grade  # e.g., 'A', 'B', 'C', 'D', 'F'
        self.created_at = created_at if created_at is not None else datetime.utcnow()
        self.updated_at = updated_at if updated_at is not None else datetime.utcnow()

    def to_dict(self, serializable=False):
        """
        Serialize the ChallengeModel instance to a dictionary for MongoDB.
        """
        challenge_dict = {
            "user_id": self.user_id,
            "challenge_started_at": self.challenge_started_at,
            "challenge_completed_at": self.challenge_completed_at,
            "difficulty": self.difficulty,
            "questions": self.questions,
            "questions_attempted": self.questions_attempted,
            "correct_answers": self.correct_answers,
            "wrong_answers": self.wrong_answers,
            "score": self.score,
            "accuracy": self.accuracy,
            "time_taken": self.time_taken,
            "completion_status": self.completion_status,
            "performance_grade": self.performance_grade,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        
        if self._id is not None:
            challenge_dict["_id"] = str(self._id) if serializable else self._id

        if serializable:
            for field in ["challenge_started_at", "challenge_completed_at", "created_at", "updated_at"]:
                if isinstance(challenge_dict[field], datetime):
                    challenge_dict[field] = challenge_dict[field].isoformat()
        return challenge_dict

    @classmethod
    def from_dict(cls, data):
        """
        Deserialize a dictionary into a ChallengeModel instance.
        """
        if not data:
            return None

        def parse_dt(val):
            if isinstance(val, str):
                try:
                    return datetime.fromisoformat(val)
                except ValueError:
                    return None
            return val

        return cls(
            user_id=data.get("user_id"),
            challenge_started_at=parse_dt(data.get("challenge_started_at")),
            challenge_completed_at=parse_dt(data.get("challenge_completed_at")),
            difficulty=data.get("difficulty", "Medium"),
            questions=data.get("questions"),
            questions_attempted=data.get("questions_attempted", 0),
            correct_answers=data.get("correct_answers", 0),
            wrong_answers=data.get("wrong_answers", 0),
            score=data.get("score", 0),
            accuracy=data.get("accuracy", 0.0),
            time_taken=data.get("time_taken", 0.0),
            completion_status=data.get("completion_status", "started"),
            performance_grade=data.get("performance_grade", ""),
            created_at=parse_dt(data.get("created_at")),
            updated_at=parse_dt(data.get("updated_at")),
            _id=data.get("_id")
        )
