from datetime import datetime
from database import get_collection
from models.progress_model import ProgressModel

def get_current_active_lesson(user_id):
    """
    Single Source of Truth for current active lesson.
    Iterates lessons 1 to 4:
    - Always returns the first lesson whose state is NOT MASTERED.
    - If Lesson 1 is MASTERED -> returns 2
    - If Lesson 2 is MASTERED -> returns 3
    - If Lesson 3 is MASTERED -> returns 4
    - If all 4 are MASTERED -> returns 4
    Automatically updates 'current_lesson' and 'completed_lessons' in MongoDB progress collection if out of sync.
    """
    progress_col = get_collection("progress")
    user_progress = progress_col.find_one({"user_id": str(user_id)})
    if not user_progress:
        return 1

    completed_lessons = user_progress.get("completed_lessons", [])
    if not isinstance(completed_lessons, list):
        completed_lessons = []

    perf_col = get_collection("performance")
    records = list(perf_col.find({"user_id": str(user_id)}))
    
    lesson_letters_map = {
        1: ["A", "B", "C", "D", "E", "F"],
        2: ["G", "H", "I", "J", "K", "L"],
        3: ["M", "N", "O", "P", "Q", "R"],
        4: ["S", "T", "U", "V", "W", "X", "Y", "Z"]
    }

    active_lesson = 1
    for les in range(1, 5):
        letters = lesson_letters_map[les]
        mastered_count = 0
        for l in letters:
            rec = next((r for r in records if r.get("letter") == l), None)
            if rec and rec.get("mastered") is True:
                mastered_count += 1

        is_lesson_mastered = (mastered_count == len(letters)) or (les in completed_lessons)
        
        if is_lesson_mastered:
            if les not in completed_lessons:
                completed_lessons.append(les)
            active_lesson = min(les + 1, 4)
        else:
            active_lesson = les
            break

    current_db_lesson = int(user_progress.get("current_lesson", 1))
    if current_db_lesson != active_lesson or user_progress.get("completed_lessons") != completed_lessons:
        progress_col.update_one(
            {"user_id": str(user_id)},
            {
                "$set": {
                    "current_lesson": active_lesson,
                    "completed_lessons": completed_lessons,
                    "updated_at": datetime.utcnow()
                }
            }
        )

    return active_lesson

def start_lesson(user_id):
    """
    Start a lesson for the given user.
    Uses get_current_active_lesson to determine and persist active lesson.
    """
    try:
        progress_col = get_collection("progress")
        user_progress = progress_col.find_one({"user_id": str(user_id)})
        
        if not user_progress:
            new_progress = ProgressModel(
                user_id=user_id,
                current_lesson=1,
                current_letter_index=0,
                lesson_status="learning"
            )
            progress_col.insert_one(new_progress.to_dict())
            user_progress = progress_col.find_one({"user_id": str(user_id)})
        
        active_lesson = get_current_active_lesson(user_id)
        user_progress = progress_col.find_one({"user_id": str(user_id)})
        user_progress["_id"] = str(user_progress["_id"])
        
        return {
            "success": True,
            "progress": user_progress
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error starting lesson: {str(e)}"
        }

def get_current_letter(user_id):
    """
    Retrieve the details of the current letter for the user's active lesson.
    
    Returns:
        dict: The details of the current letter if available, or completion details.
    """
    try:
        progress_col = get_collection("progress")
        user_progress = progress_col.find_one({"user_id": str(user_id)})
        
        # If no progress exists, start/initialize the lesson first
        if not user_progress:
            start_res = start_lesson(user_id)
            if not start_res["success"]:
                return start_res
            user_progress = start_res["progress"]
            
        lesson_num = user_progress.get("current_lesson")
        letter_idx = user_progress.get("current_letter_index")
        
        # Access learning content collection
        content_col = get_collection("learning_content")
        
        # Trigger seeding if DB content is empty
        from services.learning_content_service import seed_if_empty
        seed_if_empty()
        
        # Query by lesson number (accept either integer or string representations)
        try:
            lesson_num_int = int(lesson_num)
            query = {"lesson_number": {"$in": [lesson_num_int, str(lesson_num)]}}
        except (ValueError, TypeError):
            lesson_num_int = 1
            query = {"lesson_number": str(lesson_num)}
            
        content_list = list(content_col.find(query).sort("unlock_order", 1))
        
        if not content_list:
            lesson_letters_map = {
                1: ["A", "B", "C", "D", "E", "F"],
                2: ["G", "H", "I", "J", "K", "L"],
                3: ["M", "N", "O", "P", "Q", "R"],
                4: ["S", "T", "U", "V", "W", "X", "Y", "Z"]
            }
            letters = lesson_letters_map.get(lesson_num_int, [])
            content_list = [
                {
                    "lesson_number": lesson_num_int,
                    "letter": l,
                    "braille_dots": [1],
                    "braille_pattern": "⠁",
                    "word": f"Word for {l}",
                    "sentence": f"Sentence for {l}",
                    "audio_text": f"Letter {l}"
                }
                for l in letters
            ]

        if not content_list:
            return {
                "success": False,
                "message": f"No content found for lesson {lesson_num}"
            }
            
        # If index points beyond available items, return completed state
        if letter_idx >= len(content_list):
            return {
                "success": True,
                "lesson_completed": True,
                "next_step": "practice"
            }
            
        current_item = content_list[letter_idx]
        return {
            "success": True,
            "letter": current_item.get("letter"),
            "braille_dots": current_item.get("braille_dots"),
            "braille_pattern": current_item.get("braille_pattern"),
            "word": current_item.get("word"),
            "sentence": current_item.get("sentence"),
            "audio_text": current_item.get("audio_text"),
            "lesson_number": lesson_num,
            "current_letter_index": letter_idx
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error fetching current letter: {str(e)}"
        }

def next_letter(user_id):
    """
    Advance the user's progress to the next letter in the current lesson.
    If the lesson finishes, updates the status and completes the lesson without unlocking Lesson 2.
    
    Returns:
        dict: The next letter details or a completion message.
    """
    try:
        progress_col = get_collection("progress")
        user_progress = progress_col.find_one({"user_id": str(user_id)})
        
        # Initialize progress if it doesn't exist
        if not user_progress:
            start_res = start_lesson(user_id)
            if not start_res["success"]:
                return start_res
            user_progress = start_res["progress"]
            
        lesson_num = user_progress.get("current_lesson")
        letter_idx = user_progress.get("current_letter_index")
        
        # Query learning content count for this lesson
        content_col = get_collection("learning_content")
        from services.learning_content_service import seed_if_empty
        seed_if_empty()
        
        try:
            lesson_num_int = int(lesson_num)
            query = {"lesson_number": {"$in": [lesson_num_int, str(lesson_num)]}}
        except (ValueError, TypeError):
            lesson_num_int = 1
            query = {"lesson_number": str(lesson_num)}
            
        content_list = list(content_col.find(query).sort("unlock_order", 1))
        
        if not content_list:
            lesson_letters_map = {
                1: ["A", "B", "C", "D", "E", "F"],
                2: ["G", "H", "I", "J", "K", "L"],
                3: ["M", "N", "O", "P", "Q", "R"],
                4: ["S", "T", "U", "V", "W", "X", "Y", "Z"]
            }
            letters = lesson_letters_map.get(lesson_num_int, [])
            content_list = [
                {
                    "lesson_number": lesson_num_int,
                    "letter": l,
                    "braille_dots": [1],
                    "braille_pattern": "⠁",
                    "word": f"Word for {l}",
                    "sentence": f"Sentence for {l}",
                    "audio_text": f"Letter {l}"
                }
                for l in letters
            ]

        if not content_list:
            return {
                "success": False,
                "message": f"No content found for lesson {lesson_num}"
            }
            
        next_idx = letter_idx + 1
        
        # If there are more letters in this lesson
        if next_idx < len(content_list):
            progress_col.update_one(
                {"user_id": str(user_id)},
                {
                    "$set": {
                        "current_letter_index": next_idx,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            # Retrieve and return details of the newly updated current letter
            return get_current_letter(user_id)
        else:
            # Lesson finished. Complete the lesson but DO NOT unlock Lesson 2.
            completed_lessons = user_progress.get("completed_lessons", [])
            if lesson_num not in completed_lessons:
                completed_lessons.append(lesson_num)
                
            progress_col.update_one(
                {"user_id": str(user_id)},
                {
                    "$set": {
                        "lesson_status": "completed",
                        "completed_lessons": completed_lessons,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return {
                "success": True,
                "lesson_completed": True,
                "next_step": "practice"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error advancing to next letter: {str(e)}"
        }

def get_user_state(user_id):
    """
    Retrieve full user state dictionary from MongoDB progress collection.
    """
    try:
        progress_col = get_collection("progress")
        doc = progress_col.find_one({"user_id": str(user_id)})
        if not doc:
            # Initialize
            start_res = start_lesson(user_id)
            if start_res.get("success"):
                doc = progress_col.find_one({"user_id": str(user_id)})
            else:
                doc = {}
        
        progress = ProgressModel.from_dict(doc) if doc else None
        state_dict = progress.to_dict() if progress else {}
        if "_id" in state_dict:
            state_dict["_id"] = str(state_dict["_id"])
        
        return {
            "success": True,
            "state": state_dict
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error fetching state: {str(e)}"
        }

def save_user_state(user_id, state_data):
    """
    Save or merge state data into user's progress document in MongoDB.
    Ensures completed_lessons and current_lesson are derived consistently.
    """
    try:
        progress_col = get_collection("progress")
        update_fields = {}
        
        for key in ["current_lesson", "current_letter_index", "lesson_status", "completed_lessons", "letter_streaks", "xp", "badges", "activity_log", "practice_state", "lessons"]:
            if key in state_data:
                update_fields[key] = state_data[key]

        # Derive mastered lessons from lessons dict if provided
        lessons_dict = update_fields.get("lessons", {})
        completed_lessons = update_fields.get("completed_lessons", [])
        if not isinstance(completed_lessons, list):
            completed_lessons = []

        if isinstance(lessons_dict, dict):
            for les_id_str, les_info in lessons_dict.items():
                if isinstance(les_info, dict) and les_info.get("state") == "MASTERED":
                    try:
                        les_num = int(les_id_str)
                        if les_num not in completed_lessons:
                            completed_lessons.append(les_num)
                    except ValueError:
                        pass

        # Calculate active lesson (first lesson 1..4 whose state is NOT MASTERED)
        active_lesson = 1
        for les in range(1, 5):
            if les in completed_lessons or (isinstance(lessons_dict, dict) and lessons_dict.get(str(les), {}).get("state") == "MASTERED"):
                active_lesson = min(les + 1, 4)
            else:
                active_lesson = les
                break

        update_fields["completed_lessons"] = completed_lessons
        update_fields["current_lesson"] = active_lesson
        update_fields["updated_at"] = datetime.utcnow()
        
        progress_col.update_one(
            {"user_id": str(user_id)},
            {"$set": update_fields},
            upsert=True
        )
        return {
            "success": True,
            "message": "State updated successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error updating state: {str(e)}"
        }

