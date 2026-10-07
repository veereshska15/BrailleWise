from datetime import datetime

class ProgressModel:
    """
    Represent a user's progress through the learning lessons in BrailleWise.
    """
    def __init__(self, user_id, current_lesson=1, current_letter_index=0, 
                 lesson_status="learning", completed_lessons=None,
                 letter_streaks=None, xp=0, badges=None, activity_log=None,
                 practice_state=None, lessons=None,
                 created_at=None, updated_at=None, _id=None):
        """
        Initialize the ProgressModel instance.
        """
        self._id = _id
        self.user_id = str(user_id)
        self.current_lesson = current_lesson
        self.current_letter_index = current_letter_index
        self.lesson_status = lesson_status  # e.g., 'learning', 'completed'
        self.completed_lessons = completed_lessons if completed_lessons is not None else []
        self.letter_streaks = letter_streaks if letter_streaks is not None else {}
        self.xp = xp
        self.badges = badges if badges is not None else []
        self.activity_log = activity_log if activity_log is not None else []
        self.practice_state = practice_state if practice_state is not None else {"sessionsCompleted": 0, "lastResult": None}
        self.lessons = lessons if lessons is not None else {}
        self.created_at = created_at if created_at is not None else datetime.utcnow()
        self.updated_at = updated_at if updated_at is not None else datetime.utcnow()

    def to_dict(self):
        """
        Serialize the ProgressModel instance to a dictionary for MongoDB insertion or updates.
        """
        progress_dict = {
            "user_id": self.user_id,
            "current_lesson": self.current_lesson,
            "current_letter_index": self.current_letter_index,
            "lesson_status": self.lesson_status,
            "completed_lessons": self.completed_lessons,
            "letter_streaks": self.letter_streaks,
            "xp": self.xp,
            "badges": self.badges,
            "activity_log": self.activity_log,
            "practice_state": self.practice_state,
            "lessons": self.lessons,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
        if self._id is not None:
            progress_dict["_id"] = self._id
        return progress_dict

    @classmethod
    def from_dict(cls, data):
        """
        Deserialize a dictionary into a ProgressModel instance.
        """
        if not data:
            return None
        return cls(
            user_id=data.get("user_id"),
            current_lesson=data.get("current_lesson", 1),
            current_letter_index=data.get("current_letter_index", 0),
            lesson_status=data.get("lesson_status", "learning"),
            completed_lessons=data.get("completed_lessons", []),
            letter_streaks=data.get("letter_streaks") if "letter_streaks" in data else data.get("letterStreaks", {}),
            xp=data.get("xp", 0),
            badges=data.get("badges", []),
            activity_log=data.get("activity_log") if "activity_log" in data else data.get("activityLog", []),
            practice_state=data.get("practice_state") if "practice_state" in data else data.get("practiceState", {"sessionsCompleted": 0, "lastResult": None}),
            lessons=data.get("lessons", {}),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            _id=data.get("_id")
        )

