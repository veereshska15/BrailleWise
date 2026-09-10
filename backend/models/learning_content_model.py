from datetime import datetime

class LearningContentModel:
    """
    Represent a unit of learning content (such as a Braille letter or lesson item)
    in the BrailleWise system.
    """
    def __init__(self, lesson_number, lesson_name, type, letter, braille_dots, braille_pattern,
                 word, sentence, difficulty, audio_text, unlock_order, created_at=None, _id=None):
        """
        Initialize a learning content model instance.
        """
        self._id = _id
        self.lesson_number = lesson_number
        self.lesson_name = lesson_name
        self.type = type
        self.letter = letter
        self.braille_dots = braille_dots          # e.g., list of dot numbers [1, 2]
        self.braille_pattern = braille_pattern    # e.g., Unicode braille pattern "⠃"
        self.word = word
        self.sentence = sentence
        self.difficulty = difficulty
        self.audio_text = audio_text
        self.unlock_order = unlock_order
        self.created_at = created_at if created_at is not None else datetime.utcnow()

    def to_dict(self):
        """
        Serialize the LearningContentModel instance into a dictionary.
        """
        content_dict = {
            "lesson_number": self.lesson_number,
            "lesson_name": self.lesson_name,
            "type": self.type,
            "letter": self.letter,
            "braille_dots": self.braille_dots,
            "braille_pattern": self.braille_pattern,
            "word": self.word,
            "sentence": self.sentence,
            "difficulty": self.difficulty,
            "audio_text": self.audio_text,
            "unlock_order": self.unlock_order,
            "created_at": self.created_at
        }
        if self._id is not None:
            content_dict["_id"] = self._id
        return content_dict

    @classmethod
    def from_dict(cls, data):
        """
        Deserialize a dictionary into a LearningContentModel instance.
        """
        if not data:
            return None
        return cls(
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
            unlock_order=data.get("unlock_order"),
            created_at=data.get("created_at"),
            _id=data.get("_id")
        )
