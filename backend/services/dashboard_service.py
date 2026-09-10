from datetime import datetime
from database import get_collection
from services.session_manager_service import start_learning_session, get_session_progress
from services.adaptive_learning_service import get_adaptive_summary
from services.lesson_service import start_lesson
from services.learning_content_service import get_lesson
from services.learning_intelligence_service import calculate_mastery
from services.voice_guidance_service import generate_welcome_message
from services.assessment_service import get_assessment_summary

def get_dashboard(user_id):
    """
    Return a complete personalized dashboard, gathering information dynamically
    from all existing modules.
    """
    # 1. Lesson & session details
    session = start_learning_session(user_id)
    current_lesson = session.get("current_lesson", 1)
    todays_session_type = session.get("session_type", "Learn Session")
    todays_target_letters = session.get("letters", [])
    recommended_next_action = session.get("next_action", "Complete quizzes")
    estimated_session_time = session.get("estimated_time", "0 minutes")

    # 2. Adaptive learning summary & intelligence
    adaptive_summary = get_adaptive_summary(user_id)
    current_learning_mode = adaptive_summary.get("mode", "learn")
    weak_letters = adaptive_summary.get("weak_letters", [])
    practice_letters = adaptive_summary.get("practice_letters", [])
    mastered_letters = adaptive_summary.get("mastered_letters", [])

    mastery_stats = calculate_mastery(user_id)
    current_mastery_percentage = mastery_stats.get("mastery_percentage", 0.0)

    # 3. Lesson progress
    progress_res = start_lesson(user_id)
    completed_lessons = []
    if progress_res.get("success"):
        completed_lessons = progress_res["progress"].get("completed_lessons", [])

    # 4. Voice message
    voice_welcome_message = generate_welcome_message(user_id)

    # 5. Assessment summary
    assess_summary = get_assessment_summary(user_id)
    learning_readiness = assess_summary.get("learning_readiness", "Not Evaluated")
    assessment_status = assess_summary.get("assessment_status", "not_started")

    return {
        "current_lesson": current_lesson,
        "current_learning_mode": current_learning_mode,
        "todays_session_type": todays_session_type,
        "todays_target_letters": todays_target_letters,
        "completed_lessons": completed_lessons,
        "current_mastery_percentage": current_mastery_percentage,
        "weak_letters": weak_letters,
        "practice_letters": practice_letters,
        "mastered_letters": mastered_letters,
        "recommended_next_action": recommended_next_action,
        "estimated_session_time": estimated_session_time,
        "voice_welcome_message": voice_welcome_message,
        "learning_readiness": learning_readiness,
        "assessment_status": assessment_status
    }

def get_learning_statistics(user_id):
    """
    Return user's overall learning metrics and statistics dynamically.
    """
    # 1. Total quiz stats from DB
    quiz_col = get_collection("quiz")
    attempts = list(quiz_col.find({"user_id": str(user_id)}))
    total_quiz_attempts = len(attempts)
    correct_answers = sum(1 for a in attempts if a.get("is_correct", False))
    wrong_answers = total_quiz_attempts - correct_answers
    overall_accuracy = round((correct_answers / total_quiz_attempts) * 100, 2) if total_quiz_attempts > 0 else 0.0

    # 2. Letter counts from adaptive summary
    adaptive_summary = get_adaptive_summary(user_id)
    weak_letters_count = len(adaptive_summary.get("weak_letters", []))
    practice_letters_count = len(adaptive_summary.get("practice_letters", []))
    mastered_letters_count = len(adaptive_summary.get("mastered_letters", []))

    # 3. Completed lessons count
    progress_res = start_lesson(user_id)
    completed_lessons_count = 0
    if progress_res.get("success"):
        completed_lessons_count = len(progress_res["progress"].get("completed_lessons", []))

    from services.learning_intelligence_service import calculate_mastery
    mastery = calculate_mastery(user_id)

    return {
        "overall_accuracy": overall_accuracy,
        "total_quiz_attempts": total_quiz_attempts,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "mastered_letters_count": mastered_letters_count,
        "weak_letters_count": weak_letters_count,
        "practice_letters_count": practice_letters_count,
        "completed_lessons_count": completed_lessons_count,
        "mastery_percentage": mastery["mastery_percentage"]
    }

def get_progress_summary(user_id):
    """
    Return progress details for both the current lesson and active session.
    """
    from services.learning_intelligence_service import get_current_lesson_progress

    progress = get_current_lesson_progress(user_id)
    
    completed_letters = progress["mastered_letters"]
    remaining_letters = [letter for letter in progress["lesson_letters"] if letter not in progress["mastered_letters"]]
    completion_percentage = progress["mastery_percentage"]

    current_lesson_progress = {
        "completed_letters": completed_letters,
        "remaining_letters": remaining_letters,
        "completion_percentage": completion_percentage
    }

    # 3. Get session progress
    current_session_progress = get_session_progress(user_id)

    return {
        "current_lesson_progress": current_lesson_progress,
        "completed_letters": completed_letters,
        "remaining_letters": remaining_letters,
        "completion_percentage": completion_percentage,
        "current_session_progress": current_session_progress
    }

def get_recent_activity(user_id):
    """
    Return recent user activities (quizzes, sessions, assessments, adaptive decisions)
    sorted in descending order.
    """
    # 1. Recent Quiz attempts (limit 5)
    quiz_col = get_collection("quiz")
    quizzes_cursor = quiz_col.find({"user_id": str(user_id)}).sort("created_at", -1).limit(5)
    recent_quiz_attempts = []
    for doc in quizzes_cursor:
        recent_quiz_attempts.append({
            "letter": doc.get("letter"),
            "lesson_number": doc.get("lesson_number"),
            "is_correct": doc.get("is_correct"),
            "score": doc.get("score"),
            "timestamp": doc.get("created_at").isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at")
        })

    # 2. Recent Learning Sessions derived from Performance practices (limit 5)
    perf_col = get_collection("performance")
    perf_cursor = perf_col.find({"user_id": str(user_id), "last_practiced": {"$ne": None}}).sort("last_practiced", -1).limit(5)
    recent_learning_sessions = []
    for doc in perf_cursor:
        recent_learning_sessions.append({
            "letter": doc.get("letter"),
            "lesson_number": doc.get("lesson_number"),
            "attempts": doc.get("attempts"),
            "accuracy": doc.get("accuracy"),
            "timestamp": doc.get("last_practiced").isoformat() if isinstance(doc.get("last_practiced"), datetime) else doc.get("last_practiced")
        })

    # 3. Recent Adaptive Decisions (latest recommendation state)
    from services.learning_intelligence_service import recommend_learning_mode
    mode = recommend_learning_mode(user_id)["mode"]
    session = start_learning_session(user_id)
    recent_adaptive_decisions = [{
        "mode": mode,
        "recommendation": session.get("next_action"),
        "timestamp": datetime.utcnow().isoformat()
    }]

    # 4. Recent Assessment Results
    assess_col = get_collection("assessment")
    assess_cursor = assess_col.find({"user_id": str(user_id)}).sort("updated_at", -1).limit(5)
    recent_assessment_results = []
    for doc in assess_cursor:
        ts = doc.get("assessment_completed_at") or doc.get("updated_at")
        recent_assessment_results.append({
            "status": doc.get("assessment_status"),
            "accuracy": doc.get("accuracy"),
            "learning_readiness": doc.get("learning_readiness"),
            "recommended_start_lesson": doc.get("recommended_start_lesson"),
            "timestamp": ts.isoformat() if isinstance(ts, datetime) else ts
        })

    return {
        "recent_quiz_attempts": recent_quiz_attempts,
        "recent_learning_sessions": recent_learning_sessions,
        "recent_adaptive_decisions": recent_adaptive_decisions,
        "recent_assessment_results": recent_assessment_results
    }

def get_daily_overview(user_id):
    """
    Generate today's personalized daily overview.
    """
    from services.learning_intelligence_service import recommend_learning_mode
    session = start_learning_session(user_id)
    mode = recommend_learning_mode(user_id)["mode"]
    lesson = session.get("current_lesson", 1)

    if mode == "revision":
        goal = f"Revise your weak letters in Lesson {lesson} to improve accuracy."
    elif mode == "practice":
        goal = f"Practice and reinforce your letters in Lesson {lesson} to reach mastery."
    else:
        goal = f"Learn new Braille letter configurations for Lesson {lesson}."

    return {
        "todays_goal": goal,
        "todays_learning_mode": mode,
        "todays_target_letters": session.get("letters", []),
        "estimated_learning_time": session.get("estimated_time", "0 minutes"),
        "recommended_next_step": session.get("next_action", "Complete quizzes")
    }
