from database import get_collection

# Configurable Thresholds
MASTERED_THRESHOLD = 90
GOOD_THRESHOLD = 75
WEAK_THRESHOLD = 60
MIN_ATTEMPTS = 5

def get_current_lesson_progress(user_id):
    """
    Retrieve progress information for the user's current lesson based on performance records.
    """
    from services.lesson_service import get_current_active_lesson
    current_lesson = get_current_active_lesson(user_id)

    content_col = get_collection("learning_content")
    try:
        lesson_int = int(current_lesson)
        query = {"lesson_number": {"$in": [lesson_int, str(current_lesson)]}}
    except ValueError:
        lesson_int = 1
        query = {"lesson_number": str(current_lesson)}

    content_cursor = content_col.find(query)
    lesson_letters = []
    for doc in content_cursor:
        letter = doc.get("letter")
        if letter and letter not in lesson_letters:
            lesson_letters.append(letter)

    if not lesson_letters:
        lesson_letters_map = {
            1: ["A", "B", "C", "D", "E", "F"],
            2: ["G", "H", "I", "J", "K", "L"],
            3: ["M", "N", "O", "P", "Q", "R"],
            4: ["S", "T", "U", "V", "W", "X", "Y", "Z"]
        }
        lesson_letters = lesson_letters_map.get(lesson_int, ["A", "B", "C", "D", "E", "F"])

    perf_col = get_collection("performance")
    cursor = perf_col.find({"user_id": str(user_id)})
    records = list(cursor)

    # Retrieve mastered letters for that lesson only
    mastered_letters = []
    for r in records:
        l_num = r.get("lesson_number")
        if l_num is not None:
            try:
                l_num_int = int(l_num)
            except (ValueError, TypeError):
                continue
            if l_num_int == current_lesson and r.get("mastered", False) is True:
                letter = r.get("letter")
                if letter and letter in lesson_letters and letter not in mastered_letters:
                    mastered_letters.append(letter)

    # Calculate mastery percentage
    if len(lesson_letters) > 0:
        mastery = round((len(mastered_letters) / len(lesson_letters)) * 100, 2)
    else:
        mastery = 0.0

    return {
        "lesson_number": current_lesson,
        "lesson_letters": lesson_letters,
        "mastered_letters": mastered_letters,
        "performance_records": records,
        "mastery_percentage": mastery
    }

def get_weak_letters(user_id):
    """
    Analyze every performance record belonging to the given user.
    A letter is considered WEAK only if attempts >= MIN_ATTEMPTS and accuracy < WEAK_THRESHOLD.
    Returns a dynamically generated list of weak letters (strings).
    """
    perf_col = get_collection("performance")
    cursor = perf_col.find({"user_id": str(user_id)})
    
    weak_letters = []
    for doc in cursor:
        attempts = doc.get("attempts", 0)
        accuracy = doc.get("accuracy", 0.0)
        if attempts >= MIN_ATTEMPTS and accuracy < WEAK_THRESHOLD:
            weak_letters.append(doc.get("letter"))
            
    return weak_letters

def get_strong_letters(user_id):
    """
    Return a dynamically generated list of letters where mastered == True.
    """
    perf_col = get_collection("performance")
    cursor = perf_col.find({
        "user_id": str(user_id),
        "mastered": True
    })
    
    strong_letters = [doc.get("letter") for doc in cursor]
    return strong_letters

def calculate_mastery(user_id):
    """
    Calculate:
    - Total unique letters attempted
    - Total mastered letters
    - Overall mastery percentage (rounded to 2 decimal places)
    """
    progress = get_current_lesson_progress(user_id)
    return {
        "letters_attempted": len(progress["performance_records"]),
        "letters_mastered": len(progress["mastered_letters"]),
        "mastery_percentage": progress["mastery_percentage"]
    }

def should_unlock_next_lesson(user_id):
    """
    Decision Rules:
    - IF there exists ANY weak letter: Return False.
    - ELSE IF every attempted letter is mastered (and at least one letter is attempted): Return True.
    - Otherwise: Return False.
    """
    progress = get_current_lesson_progress(user_id)
    records = progress["performance_records"]
    
    if not records:
        return False
        
    # Check for any weak letters
    weak_exists = False
    for r in records:
        attempts = r.get("attempts", 0)
        accuracy = r.get("accuracy", 0.0)
        if attempts >= MIN_ATTEMPTS and accuracy < WEAK_THRESHOLD:
            weak_exists = True
            break
            
    if weak_exists:
        return False
        
    # Check if every letter in the current lesson is mastered
    if len(progress["mastered_letters"]) == len(progress["lesson_letters"]) and len(progress["lesson_letters"]) > 0:
        return True
        
    return False

def recommend_learning_mode(user_id):
    """
    Decision Rules:
    - IF no letters in the current lesson have been attempted: Return {"mode": "learn"}
    - ELSE IF Weak letters exist: Return {"mode": "revision"}
    - ELSE IF Not every attempted letter is mastered: Return {"mode": "practice"}
    - ELSE: Return {"mode": "learn"}
    """
    progress = get_current_lesson_progress(user_id)
    lesson_letters = progress["lesson_letters"]
    
    # Check if any letters in the current lesson have been attempted
    current_perf_records = [
        r for r in progress["performance_records"]
        if r.get("letter") in lesson_letters
    ]
    has_attempts = any(r.get("attempts", 0) > 0 for r in current_perf_records)
    
    if not has_attempts:
        return {"mode": "learn"}

    weak_letters = get_weak_letters(user_id)
    if len(weak_letters) > 0:
        return {"mode": "revision"}
        
    if len(progress["mastered_letters"]) == len(progress["lesson_letters"]) and len(progress["lesson_letters"]) > 0:
        return {"mode": "learn"}
        
    return {"mode": "practice"}

def generate_today_plan(user_id):
    """
    Aggregates all previous calculations and returns a structured today's plan.
    """
    weak_letters = get_weak_letters(user_id)
    strong_letters = get_strong_letters(user_id)
    mastery = calculate_mastery(user_id)
    unlock_next = should_unlock_next_lesson(user_id)
    rec = recommend_learning_mode(user_id)
    mode = rec["mode"]
    
    if mode == "revision":
        message = "Revise weak letters before continuing."
    elif mode == "practice":
        message = "Practice the remaining letters in the current lesson before unlocking the next lesson."
    else:
        message = "Great work! You have completed the current lesson. You can now begin the next lesson."
        
    return {
        "mode": mode,
        "weak_letters": weak_letters,
        "strong_letters": strong_letters,
        "mastery": mastery,
        "unlock_next_lesson": unlock_next,
        "message": message
    }
