import random
from database import get_collection
from services.session_manager_service import start_learning_session
from services.lesson_service import start_lesson
from services.learning_content_service import get_lesson, get_letter
from services.learning_intelligence_service import calculate_mastery
from services.adaptive_learning_service import should_unlock_next_lesson

def generate_welcome_message(user_id):
    """
    Generate a personalized welcome message based on the student's status.
    Determines if they are a new student or retrieves their active mode details.
    """
    # 1. Determine if the student is a "New Student" (no performance records)
    perf_col = get_collection("performance")
    attempts_count = perf_col.count_documents({"user_id": str(user_id)})

    if attempts_count == 0:
        # Get progress to find current lesson
        progress_res = start_lesson(user_id)
        current_lesson = 1
        if progress_res.get("success"):
            current_lesson = int(progress_res["progress"].get("current_lesson", 1))

        # Get letters for current lesson
        lesson_res = get_lesson(current_lesson)
        lesson_content = lesson_res.get("content", [])
        letters = [item["letter"] for item in lesson_content if "letter" in item]
        letters_str = ", ".join(letters)

        return (
            f"Welcome to BrailleWise! Today you will start your first learning journey with Lesson {current_lesson}. "
            f"We will learn the Braille patterns for letters: {letters_str}."
        )

    # 2. Existing student: retrieve session details from Session Manager
    session = start_learning_session(user_id)
    session_type = session.get("session_type", "Learn Session")
    current_lesson = session.get("current_lesson", 1)
    letters = session.get("letters", [])
    letters_str = ", ".join(letters) if letters else "None"

    if "Revision" in session_type:
        return (
            f"Welcome back to BrailleWise! Today's session is a Revision Session for Lesson {current_lesson}. "
            f"Our goal is to revise the letters you found challenging: {letters_str}."
        )
    elif "Practice" in session_type:
        return (
            f"Welcome back to BrailleWise! Today's session is a Practice Session for Lesson {current_lesson}. "
            f"Our goal is to practice and improve your accuracy for these letters: {letters_str}."
        )
    else:
        return (
            f"Welcome back to BrailleWise! Today we are starting a new Learn Session for Lesson {current_lesson}. "
            f"We will introduce the Braille dot patterns for: {letters_str}."
        )

def generate_letter_instruction(user_id, letter):
    """
    Retrieve the requested letter from Learning Content and build a spoken tutorial.
    """
    res = get_letter(letter)
    if not res.get("success"):
        return {
            "letter": letter,
            "instruction": f"Letter {letter} was not found in the learning content."
        }

    content = res["content"]
    dots = content.get("braille_dots", [])
    
    # Format dots string list nicely (e.g. [1, 2] -> "1 and 2")
    if len(dots) > 1:
        dots_str = " and ".join([", ".join(map(str, dots[:-1])), str(dots[-1])])
    elif len(dots) == 1:
        dots_str = str(dots[0])
    else:
        dots_str = "no dots"

    braille_pattern = content.get("braille_pattern", "")
    word = content.get("word", "")
    sentence = content.get("sentence", "")

    instruction = (
        f"To form the Braille letter {letter}, you need to press dots: {dots_str}. "
        f"The Braille symbol looks like this: {braille_pattern}. "
        f"An example word is '{word}'"
    )
    if sentence:
        instruction += f", and the example sentence is: '{sentence}'"
    instruction += "."

    return {
        "letter": letter,
        "instruction": instruction
    }

def generate_quiz_feedback(user_id, is_correct):
    """
    Generate personalized positive or supportive feedback that naturally varies.
    """
    correct_templates = [
        "Awesome! That is correct.",
        "Fantastic! You got it right.",
        "Perfect! Keep up the great work.",
        "Spot on! Excellent answer.",
        "That is correct! You are doing amazing."
    ]

    incorrect_templates = [
        "Not quite correct, but keep going! Let's try again.",
        "That wasn't the right dot pattern. Give it another shot!",
        "Almost! Take another look and try again.",
        "Don't worry, mistakes help us learn. Try once more!",
        "Incorrect dot configuration. No problem, let's try it again."
    ]

    # Retrieve overall letters mastered count for personalization
    mastery_stats = calculate_mastery(user_id)
    mastered_count = mastery_stats.get("letters_mastered", 0)

    if is_correct:
        base_message = random.choice(correct_templates)
        # Occasionally append mastery progress (20% of the time)
        if random.random() < 0.3:
            base_message += f" You have mastered {mastered_count} letters in total!"
    else:
        base_message = random.choice(incorrect_templates)

    return base_message

def generate_session_completion_message(user_id):
    """
    Generate a personalized session completion message with mastery information.
    """
    session = start_learning_session(user_id)
    session_type = session.get("session_type", "Learn Session")
    current_lesson = session.get("current_lesson", 1)

    mastery_stats = calculate_mastery(user_id)
    mastery_pct = mastery_stats.get("mastery_percentage", 0.0)

    if "Revision" in session_type:
        return (
            f"Congratulations! You have completed today's Revision Session for Lesson {current_lesson}. "
            f"You worked hard to review your challenging letters, and your current overall mastery is {mastery_pct}%."
        )
    elif "Practice" in session_type:
        return (
            f"Congratulations! You have completed today's Practice Session for Lesson {current_lesson}. "
            f"You are successfully reinforcing your skills, and your current overall mastery is {mastery_pct}%."
        )
    else:
        # Check if they have mastered the lesson and unlocked the next
        unlocked_next = should_unlock_next_lesson(user_id)
        if unlocked_next:
            return (
                f"Congratulations! You have completed and fully mastered Lesson {current_lesson}! "
                f"The next lesson has been unlocked. Your current overall mastery is {mastery_pct}%."
            )
        else:
            return (
                f"Congratulations! You have completed today's Learn Session for Lesson {current_lesson}. "
                f"Keep completing quizzes to achieve full mastery of this lesson. Your current overall mastery is {mastery_pct}%."
            )

def generate_daily_journey(user_id):
    """
    Generate a spoken overview of today's learning journey details.
    """
    session = start_learning_session(user_id)
    session_type = session.get("session_type", "Learn Session")
    current_lesson = session.get("current_lesson", 1)
    letters = session.get("letters", [])
    letters_str = ", ".join(letters) if letters else "None"
    num_letters = len(letters)
    next_action = session.get("next_action", "Complete quizzes")
    estimated_time = session.get("estimated_time", "0 minutes")

    journey_message = (
        f"Here is your daily journey overview. Today you are in a {session_type} for Lesson {current_lesson}. "
        f"We will focus on {num_letters} letters: {letters_str}. "
        f"Your next step is to {next_action.lower()} "
        f"This session is estimated to take about {estimated_time}. Let's succeed together!"
    )

    return {
        "journey_message": journey_message
    }
