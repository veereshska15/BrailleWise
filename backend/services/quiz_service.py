import random
from database import get_collection
from models.quiz_model import QuizModel
from services.performance_service import update_performance

def get_question(letter):
    """
    Retrieve learning content for the requested letter and dynamically generate a Multiple-Choice Question (MCQ).
    
    Args:
        letter (str): The Braille letter to generate a question for.
        
    Returns:
        dict: The MCQ details, or None if the letter is not found in the database.
    """
    content_col = get_collection("learning_content")
    
    # Query for the requested letter
    item = content_col.find_one({"letter": str(letter).upper()})
    if not item:
        return None
        
    # Correct dots string representation (e.g. "1,2")
    correct_dots_str = ",".join(map(str, item.get("braille_dots", [])))
    
    # Gather other unique dot configurations from the curriculum as incorrect choices
    all_items = list(content_col.find({}))
    other_dots = set()
    for other in all_items:
        if other.get("letter") != item.get("letter"):
            dots = other.get("braille_dots", [])
            if dots:
                other_dots.add(",".join(map(str, dots)))
                
    # Fallback dot configurations to ensure we have enough options if the database has few letters
    fallback_dots = ["1", "1,2", "1,4", "1,4,5", "1,5", "1,2,4", "2", "2,3"]
    for f in fallback_dots:
        if f != correct_dots_str:
            other_dots.add(f)
            
    # Draw 3 unique incorrect options
    incorrect_options = list(other_dots)
    # Filter out correct option if it slipped in
    incorrect_options = [o for o in incorrect_options if o != correct_dots_str]
    
    # Randomly select 3 incorrect options
    selected_incorrect = random.sample(incorrect_options, min(3, len(incorrect_options)))
    
    # Form option pool of exactly 4 choices
    options = [correct_dots_str] + selected_incorrect
    
    # Pad options if we still have fewer than 4 (safety fallback)
    while len(options) < 4:
        random_comb = ",".join(map(str, sorted(random.sample(range(1, 7), random.randint(1, 3)))))
        if random_comb not in options:
            options.append(random_comb)
            
    # Shuffle options so correct answer is at a random position
    random.shuffle(options)
    
    question_text = f"Which Braille dots represent Letter {item.get('letter')}?"
    question_type = "multiple-choice"
    
    return {
        "question": question_text,
        "options": options,
        "correct_answer": correct_dots_str,
        "letter": item.get("letter"),
        "lesson_number": item.get("lesson_number"),
        "difficulty": item.get("difficulty"),
        "question_type": question_type
    }

def submit_answer(data):
    """
    Submit a student's answer to a quiz question, evaluate it, record the attempt,
    and update their performance metrics.
    
    Args:
        data (dict): Dictionary containing 'user_id', 'letter', and 'selected_answer'.
        
    Returns:
        dict: Evaluation results, or raises ValueError if validation fails.
    """
    user_id = data.get("user_id")
    letter = data.get("letter")
    selected_answer = data.get("selected_answer")
    
    if not user_id or not letter or selected_answer is None:
        raise ValueError("user_id, letter, and selected_answer are required")
        
    # Get the MCQ question details to fetch correct answer and other metadata
    q_details = get_question(letter)
    if not q_details:
        raise ValueError(f"Letter '{letter}' not found in learning content")
        
    correct_answer = q_details["correct_answer"]
    lesson_number = q_details["lesson_number"]
    difficulty = q_details["difficulty"]
    question = q_details["question"]
    options = q_details["options"]
    question_type = q_details["question_type"]
    
    # Clean inputs for matching
    is_correct = str(selected_answer).strip() == str(correct_answer).strip()
    
    # Create the quiz attempt model
    quiz_attempt = QuizModel(
        user_id=user_id,
        lesson_number=lesson_number,
        letter=letter,
        question_type=question_type,
        question=question,
        options=options,
        correct_answer=correct_answer,
        selected_answer=str(selected_answer),
        is_correct=is_correct,
        difficulty=difficulty,
        score=1 if is_correct else 0
    )
    
    # Store attempt in the 'quiz' collection
    quiz_col = get_collection("quiz")
    quiz_col.insert_one(quiz_attempt.to_dict(serializable=False))
    
    # Call the Performance Service to update overall metrics
    perf_res = update_performance(user_id, lesson_number, letter, is_correct)
    current_accuracy = perf_res.get("accuracy", 0.0)
    
    return {
        "success": True,
        "is_correct": is_correct,
        "correct_answer": correct_answer,
        "selected_answer": str(selected_answer),
        "current_accuracy": current_accuracy
    }

def get_quiz_history(user_id):
    """
    Return all quiz attempts of the student sorted by newest first.
    
    Args:
        user_id (str): The user's ID.
        
    Returns:
        list: A list of serialized quiz attempt records.
    """
    quiz_col = get_collection("quiz")
    cursor = quiz_col.find({"user_id": str(user_id)}).sort("created_at", -1)
    
    history = []
    for doc in cursor:
        attempt = QuizModel.from_dict(doc)
        history.append(attempt.to_dict(serializable=True))
        
    return history
