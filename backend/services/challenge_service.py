import random
from datetime import datetime
from bson import ObjectId
from database import get_collection
from models.challenge_model import ChallengeModel
from services.learning_content_service import get_all_learning_content, seed_if_empty
from services.quiz_service import get_question

def start_challenge(user_id):
    """
    Generate a new independent challenge dynamically.
    Randomly selects 5 letters from entire Learning Content.
    Returns: Challenge ID, Question list (excluding correct answers), Difficulty, and Estimated Time.
    """
    col = get_collection("challenge")
    # Clean up any existing active/unfinished challenges for the user
    col.delete_many({"user_id": str(user_id), "completion_status": "started"})

    # Seed and fetch learning content
    seed_if_empty()
    content_res = get_all_learning_content()
    content = content_res.get("content", [])

    if not content:
        raise ValueError("No learning content available to generate a challenge.")

    # Randomly select up to 5 items
    sample_size = min(len(content), 5)
    selected_items = random.sample(content, sample_size)

    # Generate MCQ questions using the Quiz Engine
    questions = []
    for item in selected_items:
        letter = item.get("letter")
        q_details = get_question(letter)
        if q_details:
            questions.append({
                "letter": letter,
                "lesson_number": int(item.get("lesson_number", 1)),
                "question": q_details["question"],
                "options": q_details["options"],
                "correct_answer": q_details["correct_answer"],
                "selected_answer": None,
                "is_correct": None
            })

    # Create new Challenge model record
    challenge = ChallengeModel(
        user_id=user_id,
        difficulty="Medium",
        questions=questions,
        questions_attempted=0,
        correct_answers=0,
        wrong_answers=0,
        score=0,
        accuracy=0.0,
        time_taken=0.0,
        completion_status="started"
    )

    res = col.insert_one(challenge.to_dict())
    challenge_id = str(res.inserted_id)

    # Format questions to exclude correct answer
    formatted_questions = []
    for q in questions:
        formatted_questions.append({
            "letter": q["letter"],
            "question": q["question"],
            "options": q["options"]
        })

    return {
        "challenge_id": challenge_id,
        "questions": formatted_questions,
        "difficulty": "Medium",
        "estimated_time": f"{len(questions) * 90} seconds"
    }

def get_next_question(user_id):
    """
    Return the next unanswered challenge question for the user's active session.
    """
    col = get_collection("challenge")
    doc = col.find_one({"user_id": str(user_id), "completion_status": "started"})
    if not doc:
        return None

    questions = doc.get("questions", [])
    for q in questions:
        if q.get("selected_answer") is None:
            return {
                "letter": q["letter"],
                "question": q["question"],
                "options": q["options"]
            }
    return None

def submit_challenge_answer(user_id, challenge_id, question_id, selected_answer):
    """
    Validate the selected answer, record stats (attempted, correct, wrong, accuracy, score),
    and save without modifying the student's normal lesson progress or performance data.
    """
    col = get_collection("challenge")
    # Fetch active challenge by ID and user
    doc = col.find_one({
        "_id": ObjectId(challenge_id),
        "user_id": str(user_id),
        "completion_status": "started"
    })
    if not doc:
        raise ValueError("No active challenge session found matching this ID.")

    questions = doc.get("questions", [])
    target_q = None
    for q in questions:
        if q["letter"] == str(question_id).upper():
            target_q = q
            break

    if not target_q:
        raise ValueError(f"Question for letter '{question_id}' not found in this challenge session.")

    # Validate answer
    correct_ans = target_q["correct_answer"]
    is_correct = str(selected_answer).strip() == str(correct_ans).strip()

    target_q["selected_answer"] = str(selected_answer)
    target_q["is_correct"] = is_correct

    # Recalculate stats
    attempted = sum(1 for q in questions if q.get("selected_answer") is not None)
    correct = sum(1 for q in questions if q.get("is_correct") is True)
    wrong = attempted - correct
    accuracy = round((correct / attempted) * 100, 2) if attempted > 0 else 0.0
    
    # 10 points per correct answer
    score = correct * 10

    # Save to MongoDB
    col.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "questions": questions,
            "questions_attempted": attempted,
            "correct_answers": correct,
            "wrong_answers": wrong,
            "accuracy": accuracy,
            "score": score,
            "updated_at": datetime.utcnow()
        }}
    )

    return {
        "success": True,
        "is_correct": is_correct,
        "correct_answer": correct_ans,
        "selected_answer": str(selected_answer)
    }

def finish_challenge(user_id):
    """
    Finalize the active challenge session.
    Calculates final score, overall accuracy, time taken, and assigns a performance grade.
    """
    col = get_collection("challenge")
    doc = col.find_one({"user_id": str(user_id), "completion_status": "started"})
    if not doc:
        raise ValueError("No active challenge session found for this user.")

    # Calculate duration in seconds
    started_at = doc.get("challenge_started_at")
    completed_at = datetime.utcnow()
    time_taken = round((completed_at - started_at).total_seconds(), 2)

    # Calculate final grading
    accuracy = doc.get("accuracy", 0.0)
    if accuracy >= 90.0:
        grade = "A"
    elif accuracy >= 80.0:
        grade = "B"
    elif accuracy >= 70.0:
        grade = "C"
    elif accuracy >= 60.0:
        grade = "D"
    else:
        grade = "F"

    # Mark as completed
    col.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "completion_status": "completed",
            "challenge_completed_at": completed_at,
            "time_taken": time_taken,
            "performance_grade": grade,
            "updated_at": datetime.utcnow()
        }}
    )

    return {
        "success": True,
        "final_score": doc.get("score", 0),
        "accuracy": accuracy,
        "time_taken": f"{time_taken} seconds",
        "performance_grade": grade
    }

def get_challenge_history(user_id):
    """
    Return all completed challenge logs for the student, newest first.
    """
    col = get_collection("challenge")
    cursor = col.find({"user_id": str(user_id), "completion_status": "completed"}).sort("challenge_completed_at", -1)
    
    history = []
    for doc in cursor:
        completed_at = doc.get("challenge_completed_at")
        history.append({
            "challenge_id": str(doc["_id"]),
            "score": doc.get("score", 0),
            "accuracy": doc.get("accuracy", 0.0),
            "time_taken": doc.get("time_taken", 0.0),
            "completion_date": completed_at.isoformat() if isinstance(completed_at, datetime) else completed_at,
            "difficulty": doc.get("difficulty", "Medium"),
            "performance_grade": doc.get("performance_grade", "")
        })
    return history

def get_challenge_statistics(user_id):
    """
    Calculate and return cumulative challenge mode statistics dynamically.
    """
    col = get_collection("challenge")
    completed_runs = list(col.find({"user_id": str(user_id), "completion_status": "completed"}))

    total_challenges = len(completed_runs)
    if total_challenges == 0:
        return {
            "total_challenges": 0,
            "average_score": 0.0,
            "highest_score": 0,
            "average_accuracy": 0.0,
            "total_correct": 0,
            "total_wrong": 0
        }

    total_score = sum(doc.get("score", 0) for doc in completed_runs)
    highest_score = max(doc.get("score", 0) for doc in completed_runs)
    total_accuracy = sum(doc.get("accuracy", 0.0) for doc in completed_runs)
    total_correct = sum(doc.get("correct_answers", 0) for doc in completed_runs)
    total_wrong = sum(doc.get("wrong_answers", 0) for doc in completed_runs)

    return {
        "total_challenges": total_challenges,
        "average_score": round(total_score / total_challenges, 2),
        "highest_score": highest_score,
        "average_accuracy": round(total_accuracy / total_challenges, 2),
        "total_correct": total_correct,
        "total_wrong": total_wrong
    }
