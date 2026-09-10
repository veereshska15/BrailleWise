from datetime import datetime

class AssessmentModel:
    """
    Represent a student's diagnostic assessment session in BrailleWise.
    It tracks the student's accuracy, weak/strong letters, learning readiness,
    and the recommended starting lesson.
    """
    def __init__(self, user_id, assessment_started_at=None, assessment_completed_at=None,
                 questions_attempted=0, correct_answers=0, wrong_answers=0, accuracy=0.0,
                 recommended_start_lesson=1, weak_letters=None, strong_letters=None,
                 learning_readiness="Not Evaluated", assessment_status="started",
                 created_at=None, updated_at=None, _id=None):
        self._id = _id
        self.user_id = str(user_id)
        self.assessment_started_at = assessment_started_at if assessment_started_at is not None else datetime.utcnow()
        self.assessment_completed_at = assessment_completed_at
        self.questions_attempted = int(questions_attempted)
        self.correct_answers = int(correct_answers)
        self.wrong_answers = int(wrong_answers)
        self.accuracy = float(accuracy)
        self.recommended_start_lesson = int(recommended_start_lesson)
        self.weak_letters = weak_letters if weak_letters is not None else []
        self.strong_letters = strong_letters if strong_letters is not None else []
        self.learning_readiness = learning_readiness
        self.assessment_status = assessment_status  # e.g., 'started', 'completed'
        self.created_at = created_at if created_at is not None else datetime.utcnow()
        self.updated_at = updated_at if updated_at is not None else datetime.utcnow()

    def to_dict(self, serializable=False):
        """
        Serialize the AssessmentModel instance to a dictionary for MongoDB.
        """
        assessment_dict = {
            "user_id": self.user_id,
            "assessment_started_at": self.assessment_started_at,
            "assessment_completed_at": self.assessment_completed_at,
            "questions_attempted": self.questions_attempted,
            "correct_answers": self.correct_answers,
            "wrong_answers": self.wrong_answers,
            "accuracy": self.accuracy,
            "recommended_start_lesson": self.recommended_start_lesson,
            "weak_letters": self.weak_letters,
            "strong_letters": self.strong_letters,
            "learning_readiness": self.learning_readiness,
            "assessment_status": self.assessment_status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        
        if self._id is not None:
            assessment_dict["_id"] = str(self._id) if serializable else self._id

        if serializable:
            for field in ["assessment_started_at", "assessment_completed_at", "created_at", "updated_at"]:
                if isinstance(assessment_dict[field], datetime):
                    assessment_dict[field] = assessment_dict[field].isoformat()
        return assessment_dict

    @classmethod
    def from_dict(cls, data):
        """
        Deserialize a dictionary into an AssessmentModel instance.
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
            assessment_started_at=parse_dt(data.get("assessment_started_at")),
            assessment_completed_at=parse_dt(data.get("assessment_completed_at")),
            questions_attempted=data.get("questions_attempted", 0),
            correct_answers=data.get("correct_answers", 0),
            wrong_answers=data.get("wrong_answers", 0),
            accuracy=data.get("accuracy", 0.0),
            recommended_start_lesson=data.get("recommended_start_lesson", 1),
            weak_letters=data.get("weak_letters"),
            strong_letters=data.get("strong_letters"),
            learning_readiness=data.get("learning_readiness", "Not Evaluated"),
            assessment_status=data.get("assessment_status", "started"),
            created_at=parse_dt(data.get("created_at")),
            updated_at=parse_dt(data.get("updated_at")),
            _id=data.get("_id")
        )
