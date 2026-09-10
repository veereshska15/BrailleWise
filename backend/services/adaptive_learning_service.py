from database import get_collection

# Configurable constants
REVISION_THRESHOLD = 60
MASTERY_THRESHOLD = 90
MIN_ATTEMPTS_FOR_MASTERY = 5

def _get_user_current_lesson(user_id):
    """
    Helper function to retrieve the user's active lesson number using single source of truth.
    """
    from services.lesson_service import get_current_active_lesson
    return get_current_active_lesson(user_id)

def _get_letters_for_lesson(lesson_number):
    """
    Helper function to query learning content letters associated with the lesson number.
    Fallback to standard curriculum letters if learning_content table isn't populated.
    """
    content_col = get_collection("learning_content")
    try:
        lesson_int = int(lesson_number)
        query = {"lesson_number": {"$in": [lesson_int, str(lesson_number)]}}
    except ValueError:
        lesson_int = 1
        query = {"lesson_number": str(lesson_number)}
        
    cursor = content_col.find(query)
    letters = [doc.get("letter") for doc in cursor if doc.get("letter")]
    if not letters:
        lesson_letters_map = {
            1: ["A", "B", "C", "D", "E", "F"],
            2: ["G", "H", "I", "J", "K", "L"],
            3: ["M", "N", "O", "P", "Q", "R"],
            4: ["S", "T", "U", "V", "W", "X", "Y", "Z"]
        }
        letters = lesson_letters_map.get(lesson_int, ["A", "B", "C", "D", "E", "F"])
    return letters

def _get_lesson_performance(user_id, lesson_letters):
    """
    Helper function to get performance documents for user and specific letters.
    """
    if not lesson_letters:
        return {}
        
    perf_col = get_collection("performance")
    cursor = perf_col.find({
        "user_id": str(user_id),
        "letter": {"$in": lesson_letters}
    })
    
    return {doc.get("letter"): doc for doc in cursor}

def get_revision_letters(user_id):
    """
    Return a list of letters in the student's current lesson that require revision.
    A letter is considered weak if attempts >= 1 and accuracy < REVISION_THRESHOLD.
    """
    current_lesson = _get_user_current_lesson(user_id)
    lesson_letters = _get_letters_for_lesson(current_lesson)
    perf_map = _get_lesson_performance(user_id, lesson_letters)
    
    revision_letters = []
    for letter in lesson_letters:
        perf = perf_map.get(letter)
        if perf:
            attempts = perf.get("attempts", 0)
            accuracy = perf.get("accuracy", 0.0)
            if attempts >= 1 and accuracy < REVISION_THRESHOLD:
                revision_letters.append(letter)
                
    return revision_letters

def get_practice_letters(user_id):
    """
    Return a list of letters in the student's current lesson that require practice.
    A letter needs practice if it is attempted but neither weak nor mastered.
    """
    from services.learning_intelligence_service import (
        recommend_learning_mode,
        get_current_lesson_progress
    )

    mode = recommend_learning_mode(user_id)["mode"]

    if mode == "practice":
        progress = get_current_lesson_progress(user_id)
        lesson_letters = progress["lesson_letters"]
        mastered_letters = progress["mastered_letters"]

        practice_letters = [
            letter
            for letter in lesson_letters
            if letter not in mastered_letters
        ]
        return practice_letters

    current_lesson = _get_user_current_lesson(user_id)
    lesson_letters = _get_letters_for_lesson(current_lesson)
    perf_map = _get_lesson_performance(user_id, lesson_letters)
    
    practice_letters = []
    for letter in lesson_letters:
        perf = perf_map.get(letter)
        if perf:
            attempts = perf.get("attempts", 0)
            accuracy = perf.get("accuracy", 0.0)
            is_weak = attempts >= 1 and accuracy < REVISION_THRESHOLD
            is_mastered = attempts >= MIN_ATTEMPTS_FOR_MASTERY and accuracy >= MASTERY_THRESHOLD
            if attempts >= 1 and not is_weak and not is_mastered:
                practice_letters.append(letter)
                
    return practice_letters

def get_mastered_letters(user_id):
    """
    Return a list of mastered letters in the student's current lesson.
    A letter is mastered if accuracy >= MASTERY_THRESHOLD or attempts >= 1 with accuracy >= 75.
    """
    current_lesson = _get_user_current_lesson(user_id)
    lesson_letters = _get_letters_for_lesson(current_lesson)
    perf_map = _get_lesson_performance(user_id, lesson_letters)
    
    mastered_letters = []
    for letter in lesson_letters:
        perf = perf_map.get(letter)
        if perf:
            attempts = perf.get("attempts", 0)
            accuracy = perf.get("accuracy", 0.0)
            if attempts >= 1 and accuracy >= 75.0:
                mastered_letters.append(letter)
                
    return mastered_letters

def should_unlock_next_lesson(user_id):
    """
    Return True if current lesson is completed/mastered under Option A progression.
    """
    from services.lesson_service import get_current_active_lesson
    current_lesson = _get_user_current_lesson(user_id)
    active_lesson = get_current_active_lesson(user_id)
    return active_lesson > current_lesson

def get_next_learning_step(user_id):
    """
    Determine and return the student's next recommended learning step.
    Priority: Revision -> Practice -> Learn.
    """
    from services.learning_intelligence_service import recommend_learning_mode
    mode = recommend_learning_mode(user_id)["mode"]

    current_lesson = _get_user_current_lesson(user_id)
    lesson_letters = _get_letters_for_lesson(current_lesson)
    
    weak_letters = get_revision_letters(user_id)
    practice_letters = get_practice_letters(user_id)
    mastered_letters = get_mastered_letters(user_id)
    
    if len(weak_letters) > 0:
        msg = "Revise weak letters before continuing."
        if mode == "practice":
            msg = "Continue practicing the remaining letters in your current lesson."
        return {
            "mode": mode,
            "weak_letters": weak_letters,
            "next_lesson": False,
            "message": msg
        }
    elif len(practice_letters) > 0:
        msg = "Practice these letters before continuing."
        if mode == "practice":
            msg = "Continue practicing the remaining letters in your current lesson."
        return {
            "mode": mode,
            "practice_letters": practice_letters,
            "next_lesson": False,
            "message": msg
        }
    else:
        # Check if all letters in current lesson are mastered to unlock next lesson
        all_mastered = (len(mastered_letters) == len(lesson_letters)) and (len(lesson_letters) > 0)
        if all_mastered:
            next_lesson_num = current_lesson + 1
            msg = "Congratulations! The next lesson has been unlocked."
            if mode == "practice":
                msg = "Continue practicing the remaining letters in your current lesson."
            return {
                "mode": mode,
                "lesson": next_lesson_num,
                "next_lesson": True,
                "message": msg
            }
        else:
            # Under Rule 5: User has never attempted any quiz (or some unattempted letters exist)
            msg = "Start learning your current lesson."
            if mode == "practice":
                msg = "Continue practicing the remaining letters in your current lesson."
            return {
                "mode": mode,
                "lesson": current_lesson,
                "next_lesson": False,
                "message": msg
            }

def get_adaptive_summary(user_id):
    """
    Generate a full adaptive learning summary for a student.
    """
    current_lesson = _get_user_current_lesson(user_id)
    lesson_letters = _get_letters_for_lesson(current_lesson)
    
    weak_letters = get_revision_letters(user_id)
    practice_letters = get_practice_letters(user_id)
    mastered_letters = get_mastered_letters(user_id)
    
    from services.learning_intelligence_service import recommend_learning_mode
    mode = recommend_learning_mode(user_id)["mode"]
    next_lesson_bool = should_unlock_next_lesson(user_id)
    
    if len(lesson_letters) > 0:
        mastery_percentage = round((len(mastered_letters) / len(lesson_letters)) * 100, 2)
    else:
        mastery_percentage = 0.0
        
    return {
        "current_lesson": current_lesson,
        "mode": mode,
        "weak_letters": weak_letters,
        "practice_letters": practice_letters,
        "mastered_letters": mastered_letters,
        "mastery_percentage": mastery_percentage,
        "next_lesson": next_lesson_bool
    }
