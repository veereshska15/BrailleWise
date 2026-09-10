from datetime import datetime
from database import get_collection
from models.assessment_model import AssessmentModel
from services.learning_content_service import get_all_learning_content, seed_if_empty
from services.quiz_service import get_question
from models.quiz_model import QuizModel
from services.performance_service import update_performance
from models.progress_model import ProgressModel

# Configurable thresholds
BEGINNER_THRESHOLD = 50.0
INTERMEDIATE_THRESHOLD = 80.0
ADVANCED_THRESHOLD = 95.0

def start_assessment(user_id):
    """
    Create a new assessment session.
    Retrieves questions dynamically across multiple lessons from learning content.
    Returns: Assessment ID, Current Question details, and number of Remaining Questions.
    """
    # 1. Clear any existing active assessments for this user
    col = get_collection("assessment")
    col.delete_many({"user_id": str(user_id)})

    # 2. Retrieve all learning content
    seed_if_empty()
    content_res = get_all_learning_content()
    content = content_res.get("content", [])

    # Group content by lesson to ensure multi-lesson coverage
    lesson_map = {}
    for item in content:
        les = int(item.get("lesson_number", 1))
        if les not in lesson_map:
            lesson_map[les] = []
        lesson_map[les].append(item)

    # Pick up to 3 letters from each lesson in order
    selected_items = []
    sorted_lessons = sorted(lesson_map.keys())
    for les in sorted_lessons:
        items_in_lesson = lesson_map[les]
        selected_items.extend(items_in_lesson[:3])

    # Cap total questions to a reasonable length (e.g. 6 questions)
    selected_items = selected_items[:6]

    # Generate MCQ questions dynamically via the Quiz Engine
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

    # Create Assessment Model
    assessment = AssessmentModel(
        user_id=user_id,
        assessment_status="started",
        questions_attempted=0,
        correct_answers=0,
        wrong_answers=0,
        accuracy=0.0,
        recommended_start_lesson=1,
        weak_letters=[],
        strong_letters=[],
        learning_readiness="Not Evaluated"
    )

    assessment_dict = assessment.to_dict()
    # Add questions array to the stored document
    assessment_dict["questions"] = questions
    
    res = col.insert_one(assessment_dict)
    assessment_id = str(res.inserted_id)

    # Prepare first question response (excluding correct_answer to prevent client-side inspection)
    current_q = questions[0] if questions else None
    formatted_current_q = None
    if current_q:
        formatted_current_q = {
            "letter": current_q["letter"],
            "question": current_q["question"],
            "options": current_q["options"]
        }

    return {
        "assessment_id": assessment_id,
        "current_question": formatted_current_q,
        "remaining_questions": len(questions) - 1 if questions else 0
    }

def get_next_question(user_id):
    """
    Return the next unanswered assessment question dynamically.
    """
    col = get_collection("assessment")
    doc = col.find_one({"user_id": str(user_id), "assessment_status": "started"})
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

def submit_assessment_answer(user_id, question_id, selected_answer):
    """
    Validate the answer, store the attempt in quiz history, update assessment
    statistics (attempted, correct, wrong, accuracy), and dynamically update weak/strong letters.
    """
    col = get_collection("assessment")
    doc = col.find_one({"user_id": str(user_id), "assessment_status": "started"})
    if not doc:
        raise ValueError("No active assessment session found for this user.")

    questions = doc.get("questions", [])
    target_q = None
    for q in questions:
        # Match using the unique letter identifier
        if q["letter"] == str(question_id).upper():
            target_q = q
            break

    if not target_q:
        raise ValueError(f"Question for letter '{question_id}' not found in this assessment session.")

    # Validate the answer
    correct_ans = target_q["correct_answer"]
    is_correct = str(selected_answer).strip() == str(correct_ans).strip()
    
    target_q["selected_answer"] = str(selected_answer)
    target_q["is_correct"] = is_correct

    # Store every attempt in the Quiz collection
    quiz_col = get_collection("quiz")
    quiz_attempt = QuizModel(
        user_id=user_id,
        lesson_number=target_q["lesson_number"],
        letter=target_q["letter"],
        question_type="multiple-choice",
        question=target_q["question"],
        options=target_q["options"],
        correct_answer=correct_ans,
        selected_answer=str(selected_answer),
        is_correct=is_correct,
        difficulty="Beginner",
        score=1 if is_correct else 0
    )
    quiz_col.insert_one(quiz_attempt.to_dict(serializable=False))

    # Recalculate statistics and weak/strong lists on the fly
    attempted = 0
    correct = 0
    wrong = 0
    weak_letters = list(doc.get("weak_letters", []))
    strong_letters = list(doc.get("strong_letters", []))

    for q in questions:
        if q.get("selected_answer") is not None:
            attempted += 1
            letter = q["letter"]
            if q.get("is_correct"):
                correct += 1
                if letter in weak_letters:
                    weak_letters.remove(letter)
                if letter not in strong_letters:
                    strong_letters.append(letter)
            else:
                wrong += 1
                if letter in strong_letters:
                    strong_letters.remove(letter)
                if letter not in weak_letters:
                    weak_letters.append(letter)

    accuracy = round((correct / attempted) * 100, 2) if attempted > 0 else 0.0

    # Save updates back to database
    col.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "questions": questions,
            "questions_attempted": attempted,
            "correct_answers": correct,
            "wrong_answers": wrong,
            "accuracy": accuracy,
            "weak_letters": weak_letters,
            "strong_letters": strong_letters,
            "updated_at": datetime.utcnow()
        }}
    )

    return {
        "success": True,
        "is_correct": is_correct,
        "correct_answer": correct_ans,
        "selected_answer": str(selected_answer)
    }

def finish_assessment(user_id):
    """
    Calculate final scores, learning readiness, and recommend a personalized
    starting lesson by analyzing overall accuracy and letter-wise strengths/weaknesses.
    Updates the student's lesson progress and initializes performance.
    """
    col = get_collection("assessment")
    doc = col.find_one({"user_id": str(user_id), "assessment_status": "started"})
    if not doc:
        raise ValueError("No active assessment session found for this user.")

    questions = doc.get("questions", [])
    
    # Calculate performance metrics
    attempted = sum(1 for q in questions if q.get("selected_answer") is not None)
    correct = sum(1 for q in questions if q.get("is_correct") is True)
    wrong = attempted - correct
    accuracy = round((correct / attempted) * 100, 2) if attempted > 0 else 0.0

    # Collect weak and strong letters from all attempts
    weak_letters = []
    strong_letters = []
    for q in questions:
        if q.get("selected_answer") is not None:
            if q.get("is_correct"):
                strong_letters.append(q["letter"])
            else:
                weak_letters.append(q["letter"])

    # Determine learning readiness / proficiency level
    if accuracy < BEGINNER_THRESHOLD:
        learning_readiness = "Beginner"
    elif accuracy < INTERMEDIATE_THRESHOLD:
        learning_readiness = "Intermediate"
    else:
        learning_readiness = "Advanced"

    # Your project currently has only Lesson 1 content,
    # so always start from Lesson 1.
    recommended_start_lesson = 1

    # Save completed assessment
    col.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "assessment_completed_at": datetime.utcnow(),
            "assessment_status": "completed",
            "questions_attempted": attempted,
            "correct_answers": correct,
            "wrong_answers": wrong,
            "accuracy": accuracy,
            "weak_letters": weak_letters,
            "strong_letters": strong_letters,
            "learning_readiness": learning_readiness,
            "recommended_start_lesson": recommended_start_lesson,
            "updated_at": datetime.utcnow()
        }}
    )

    # Update assessment_completed and proficiency_level in users collection
    users_col = get_collection("users")
    try:
        from bson.objectid import ObjectId
        query_id = ObjectId(user_id)
    except Exception:
        query_id = user_id
    users_col.update_one(
        {"_id": query_id},
        {"$set": {
            "assessment_completed": True,
            "proficiency_level": learning_readiness,
            "experience_level": learning_readiness
        }}
    )

    
    # 1. Personalize starting lesson in student's progress collection
    progress_col = get_collection("progress")
    progress_doc = progress_col.find_one({"user_id": str(user_id)})
    if progress_doc:
        progress_col.update_one(
            {"user_id": str(user_id)},
            {"$set": {
                "current_lesson": recommended_start_lesson,
                "current_letter_index": 0,  # Reset letter index to starting point of the lesson
                "lesson_status": "learning",
                "updated_at": datetime.utcnow()
            }}
        )
    else:
        new_progress = ProgressModel(
            user_id=user_id,
            current_lesson=recommended_start_lesson,
            current_letter_index=0,
            lesson_status="learning"
        )
        progress_col.insert_one(new_progress.to_dict())

    # 2. Initialize student's performance database for identified strong/weak letters,
    # so that the Adaptive Learning Engine and Session Manager pick them up immediately.
    for letter in weak_letters:
        q_item = next((q for q in questions if q["letter"] == letter), None)
        les_num = q_item["lesson_number"] if q_item else 1
        # Insert a wrong attempt to mark it weak
        update_performance(user_id, les_num, letter, is_correct=False)
        
    for letter in strong_letters:
        q_item = next((q for q in questions if q["letter"] == letter), None)
        les_num = q_item["lesson_number"] if q_item else 1
        # Insert 5 correct attempts to satisfy MIN_ATTEMPTS for mastery
        for _ in range(5):
            update_performance(user_id, les_num, letter, is_correct=True)

    return {
        "success": True,
        "accuracy": accuracy,
        "learning_readiness": learning_readiness,
        "recommended_start_lesson": recommended_start_lesson,
        "weak_letters": weak_letters,
        "strong_letters": strong_letters
    }

def get_assessment_summary(user_id):
    """
    Retrieve details of the user's latest completed or active assessment.
    """
    col = get_collection("assessment")
    # Retrieve completed first, fallback to active
    doc = col.find_one({"user_id": str(user_id), "assessment_status": "completed"})
    if not doc:
        doc = col.find_one({"user_id": str(user_id), "assessment_status": "started"})

    if not doc:
        return {
            "assessment_status": "not_started",
            "questions_attempted": 0,
            "correct_answers": 0,
            "wrong_answers": 0,
            "accuracy": 0.0,
            "weak_letters": [],
            "strong_letters": [],
            "learning_readiness": "Not Evaluated",
            "recommended_start_lesson": 1
        }

    return {
        "assessment_status": doc.get("assessment_status"),
        "questions_attempted": doc.get("questions_attempted", 0),
        "correct_answers": doc.get("correct_answers", 0),
        "wrong_answers": doc.get("wrong_answers", 0),
        "accuracy": doc.get("accuracy", 0.0),
        "weak_letters": doc.get("weak_letters", []),
        "strong_letters": doc.get("strong_letters", []),
        "learning_readiness": doc.get("learning_readiness", "Not Evaluated"),
        "recommended_start_lesson": doc.get("recommended_start_lesson", 1)
    }
