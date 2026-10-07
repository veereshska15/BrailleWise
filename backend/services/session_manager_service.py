from datetime import datetime
from utils.logger import get_logger
from database import get_collection
from services.adaptive_learning_service import (
    get_next_learning_step,
    get_revision_letters,
    get_practice_letters
)
from services.lesson_service import start_lesson
from services.learning_content_service import get_lesson
from services.learning_intelligence_service import get_current_lesson_progress

def start_learning_session(user_id):
    """
    Prepare today's personalized learning session for a student.
    Coordinates between adaptive learning, lesson progress, and content services.
    """
    # 1. Retrieve the student's adaptive learning result
    step = get_next_learning_step(user_id)
    mode = step.get("mode", "learn")

    # 2. Retrieve the student's current active lesson using single source of truth
    from services.lesson_service import get_current_active_lesson
    start_lesson(user_id)
    current_lesson = get_current_active_lesson(user_id)

    # 3. Handle modes and retrieve appropriate letters
    if mode == "revision":
        session_type = "Revision Session"
        letters = get_revision_letters(user_id)
        lesson_to_use = current_lesson
    elif mode == "practice":
        session_type = "Practice Session"
        letters = get_practice_letters(user_id)
        lesson_to_use = current_lesson
    else:
        session_type = "Learn Session"
        lesson_to_use = current_lesson
        
        # Retrieve lesson content details
        lesson_res = get_lesson(lesson_to_use)
        lesson_content = lesson_res.get("content", [])
        letters = [item["letter"] for item in lesson_content if "letter" in item]

    # Ensure letters list is unique and maintains order
    letters = list(dict.fromkeys(letters))

    logger = get_logger(__name__)
    logger.debug("Session context | user=%s lesson=%s step=%s using=%s",
                 user_id, current_lesson, step, lesson_to_use)

    # 4. Generate dynamic properties
    estimated_time = f"{len(letters) * 2} minutes"
    letters_str = ", ".join(letters) if letters else "None"

    if mode == "revision":
        voice_message = f"Hello! Let's revise the letters you found challenging in Lesson {lesson_to_use}: {letters_str}."
        next_action = f"Review the Braille patterns for {letters_str} and attempt quizzes to improve your accuracy."
    elif mode == "practice":
        voice_message = f"Great to see you! Today, we will practice and reinforce these letters: {letters_str}."
        next_action = f"Take quiz attempts for {letters_str} to master them and improve your score."
    else:
        voice_message = f"Welcome! Today, let's learn new Braille letters for Lesson {lesson_to_use}: {letters_str}."
        next_action = f"Study the Braille patterns for letters {letters_str} and complete the quizzes to master them."

    return {
        "session_type": session_type,
        "current_lesson": lesson_to_use,
        "letters": letters,
        "estimated_time": estimated_time,
        "next_action": next_action,
        "voice_message": voice_message
    }

def get_session_progress(user_id):
    """
    Calculate and return the student's progress for today's session dynamically.
    """
    progress = get_current_lesson_progress(user_id)
    
    completed_letters = progress["mastered_letters"]
    
    remaining_letters = [
        letter for letter in progress["lesson_letters"]
        if letter not in progress["mastered_letters"]
    ]
    
    completion_percentage = progress["mastery_percentage"]
    
    return {
        "completed_letters": completed_letters,
        "remaining_letters": remaining_letters,
        "completion_percentage": completion_percentage
    }

def complete_learning_session(user_id):
    """
    Generate a summary of the completed learning session without modifying lesson progress.
    """
    # 1. Get current status to describe what was completed
    progress_res = start_lesson(user_id)
    current_lesson = 1
    if progress_res.get("success"):
        current_lesson = int(progress_res["progress"].get("current_lesson", 1))

    step_before = get_next_learning_step(user_id)
    mode = step_before.get("mode", "learn")

    # Map the session modes to friendly strings
    session_names = {
        "revision": "Revision Session",
        "practice": "Practice Session",
        "learn": "Learn Session"
    }
    session_name = session_names.get(mode, "Learning Session")

    message = f"Congratulations! You have completed today's {session_name} for Lesson {current_lesson}."

    # 2. Get the recommendations based on current/subsequent state
    step_after = get_next_learning_step(user_id)
    next_mode = step_after.get("mode", "learn")
    
    if next_mode == "revision":
        weak_letters = get_revision_letters(user_id)
        next_recommendation = f"Please continue to revise your weak letters: {', '.join(weak_letters)}."
    elif next_mode == "practice":
        practice_letters = get_practice_letters(user_id)
        next_recommendation = f"Please continue to practice your letters: {', '.join(practice_letters)}."
    else:
        if step_after.get("next_lesson"):
            next_recommendation = f"Congratulations! You have mastered the current lesson and can now start Lesson {step_after.get('lesson')}."
        else:
            next_recommendation = "Please continue learning your current lesson."

    return {
        "success": True,
        "message": message,
        "next_recommendation": next_recommendation
    }
