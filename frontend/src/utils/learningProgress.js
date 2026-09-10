// src/utils/learningProgress.js
// Single source of truth for progression, state management, and quiz validation using localStorage.
// Uses CONSECUTIVE MASTERY logic: each letter needs 5 correct answers IN A ROW.
// A wrong answer resets ONLY that letter's streak to 0.

const STORAGE_KEY = 'braillewise_state';

const DEFAULT_STATE = {
  lessons: {
    "1": { state: "NOT_STARTED", lastStepIdx: 0 },
    "2": { state: "NOT_STARTED", lastStepIdx: 0 },
    "3": { state: "NOT_STARTED", lastStepIdx: 0 },
    "4": { state: "NOT_STARTED", lastStepIdx: 0 }
  },
  letterStreaks: {
    "A": 0, "B": 0, "C": 0, "D": 0, "E": 0, "F": 0,
    "G": 0, "H": 0, "I": 0, "J": 0, "K": 0, "L": 0,
    "M": 0, "N": 0, "O": 0, "P": 0, "Q": 0, "R": 0,
    "S": 0, "T": 0, "U": 0, "V": 0, "W": 0, "X": 0, "Y": 0, "Z": 0
  },
  xp: 0,
  badges: [],
  activityLog: [],
  practiceState: {
    sessionsCompleted: 0,
    lastResult: null
  }
};

const LESSON_METADATA = {
  "1": { title: "Lesson 1: Letters A–F", totalSteps: 8 },
  "2": { title: "Lesson 2: Letters G–L", totalSteps: 8 },
  "3": { title: "Lesson 3: Letters M–R", totalSteps: 8 },
  "4": { title: "Lesson 4: Letters S–Z", totalSteps: 10 }
};

export const LESSON_LETTERS = {
  "1": ["A", "B", "C", "D", "E", "F"],
  "2": ["G", "H", "I", "J", "K", "L"],
  "3": ["M", "N", "O", "P", "Q", "R"],
  "4": ["S", "T", "U", "V", "W", "X", "Y", "Z"]
};

const MASTERY_THRESHOLD = 5;

export function getLessonMetadata(lessonId) {
  return LESSON_METADATA[lessonId] || { title: `Lesson ${lessonId}`, totalSteps: 5 };
}

export function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  let state;
  if (!raw) {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  } else {
    try {
      state = JSON.parse(raw);
    } catch (e) {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  let modified = false;

  if (!state.lessons) { state.lessons = {}; modified = true; }
  Object.keys(DEFAULT_STATE.lessons).forEach(key => {
    if (!state.lessons[key]) {
      state.lessons[key] = { ...DEFAULT_STATE.lessons[key] };
      modified = true;
    }
  });

  if (!state.letterStreaks) {
    state.letterStreaks = {};
    const oldCounts = state.letterCorrectCounts || {};
    Object.keys(DEFAULT_STATE.letterStreaks).forEach(key => {
      state.letterStreaks[key] = Math.min(MASTERY_THRESHOLD, oldCounts[key] || 0);
    });
    delete state.letterCorrectCounts;
    modified = true;
  }
  Object.keys(DEFAULT_STATE.letterStreaks).forEach(key => {
    if (state.letterStreaks[key] === undefined) {
      state.letterStreaks[key] = 0;
      modified = true;
    }
  });

  if (state.xp === undefined) { state.xp = DEFAULT_STATE.xp; modified = true; }
  if (!state.badges) { state.badges = [...DEFAULT_STATE.badges]; modified = true; }
  if (!Array.isArray(state.activityLog)) { state.activityLog = []; modified = true; }
  
  if (!state.practiceState) { 
    state.practiceState = JSON.parse(JSON.stringify(DEFAULT_STATE.practiceState)); 
    modified = true; 
  }
  
  // Cleanup artificial stats/history objects from previous steps
  if (state.stats) { delete state.stats; modified = true; }
  if (state.history) { delete state.history; modified = true; }

  Object.keys(state.lessons).forEach(lid => {
    const letters = LESSON_LETTERS[lid];
    if (!letters) return;
    const allMastered = letters.every(l => (state.letterStreaks[l] || 0) >= MASTERY_THRESHOLD);
    const lesson = state.lessons[lid];
    if (allMastered && lesson.state !== 'MASTERED') {
      lesson.state = 'MASTERED';
      modified = true;
    }
  });

  const completedLessonsList = [];
  for (let id = 1; id <= 4; id++) {
    const idStr = id.toString();
    const letters = LESSON_LETTERS[idStr] || [];
    const masteredCount = letters.filter(l => (state.letterStreaks[l] || 0) >= MASTERY_THRESHOLD).length;
    if (state.lessons[idStr]?.state === 'MASTERED' || (letters.length > 0 && masteredCount === letters.length)) {
      completedLessonsList.push(id);
    }
  }
  let currentActiveNum = 1;
  for (let id = 1; id <= 4; id++) {
    if (completedLessonsList.includes(id)) {
      currentActiveNum = Math.min(id + 1, 4);
    } else {
      currentActiveNum = id;
      break;
    }
  }
  state.completed_lessons = completedLessonsList;
  state.current_lesson = currentActiveNum;

  if (modified) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  syncStateToBackend(state);
}

export async function syncStateToBackend(stateToSave) {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) return;
    const user = JSON.parse(userStr);
    const userId = user.id || user._id;
    if (!userId) return;

    const API = import.meta.env.VITE_API_URL || '';
    const st = stateToSave || getState();
    await fetch(`${API}/api/lesson/state/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(st)
    });
  } catch (err) {
    console.error('Failed to sync state to backend:', err);
  }
}

export function clearLocalState() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('lastActiveLessonId');
}

export async function loadStateFromBackend() {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) return getState();
    const user = JSON.parse(userStr);
    const userId = user.id || user._id;
    if (!userId) return getState();

    const API = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${API}/api/lesson/state/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.state) {
      const bState = data.state;
      const baseline = JSON.parse(JSON.stringify(DEFAULT_STATE));
      
      const updated = {
        ...baseline,
        ...bState,
        lessons: Object.keys(bState.lessons || {}).length > 0 
          ? { ...baseline.lessons, ...bState.lessons } 
          : baseline.lessons,
        letterStreaks: Object.keys(bState.letter_streaks || bState.letterStreaks || {}).length > 0
          ? { ...baseline.letterStreaks, ...(bState.letter_streaks || bState.letterStreaks || {}) }
          : baseline.letterStreaks,
        xp: bState.xp !== undefined ? bState.xp : baseline.xp,
        badges: bState.badges || baseline.badges,
        activityLog: bState.activity_log || bState.activityLog || baseline.activityLog,
        practiceState: bState.practice_state || bState.practiceState || baseline.practiceState
      };

      // Sync current_lesson & completed_lessons from MongoDB bState
      const completedList = bState.completed_lessons || bState.completedLessons || [];
      if (Array.isArray(completedList)) {
        completedList.forEach(cNum => {
          const cStr = cNum.toString();
          if (updated.lessons[cStr]) {
            updated.lessons[cStr].state = 'MASTERED';
          }
        });
      }

      if (bState.current_lesson) {
        const curNum = parseInt(bState.current_lesson, 10);
        for (let i = 1; i <= 4; i++) {
          const iStr = i.toString();
          if (i < curNum) {
            if (updated.lessons[iStr]) {
              updated.lessons[iStr].state = 'MASTERED';
            }
          } else if (i > curNum) {
            if (updated.lessons[iStr]) {
              updated.lessons[iStr].state = 'NOT_STARTED';
            }
          }
        }
        if (updated.lessons[curNum.toString()]) {
          // If the current lesson is not yet marked MASTERED by streaks/completion, set to IN_PROGRESS
          if (updated.lessons[curNum.toString()].state !== 'MASTERED') {
            updated.lessons[curNum.toString()].state = 'IN_PROGRESS';
          }
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
  } catch (err) {
    console.error('Failed to load state from backend:', err);
  }
  return getState();
}

// ── Internal Helper ──
function _calculateOverallProgress(state) {
  const masteredCount = getMasteredLettersList(state).length;
  return Math.round((masteredCount / 26) * 100);
}

// ── Letter streak helpers ──
export function getLetterStreak(letter) {
  const state = getState();
  return state.letterStreaks[letter] || 0;
}

export function getUnmasteredLetters(lessonId) {
  const state = getState();
  const letters = LESSON_LETTERS[lessonId] || [];
  return letters.filter(l => (state.letterStreaks[l] || 0) < MASTERY_THRESHOLD);
}

// ── Lesson-level helpers ──
export function isLessonUnlocked(lessonId) {
  if (lessonId === '1') return true;
  const state = getState();
  const prevId = (parseInt(lessonId, 10) - 1).toString();
  const prev = state.lessons[prevId];
  return prev && prev.state === 'MASTERED';
}

export function startLesson(lessonId) {
  const state = getState();
  if (state.lessons[lessonId] && state.lessons[lessonId].state === 'NOT_STARTED') {
    state.lessons[lessonId].state = 'IN_PROGRESS';
    saveState(state);
    const meta = LESSON_METADATA[lessonId];
    const title = meta ? meta.title : `Lesson ${lessonId}`;
    logActivity('lesson', `Started ${title}`, '📚', { lesson: lessonId });
  } else {
    saveState(state);
  }
}

export function completeLessonContent(lessonId) {
  const state = getState();
  if (state.lessons[lessonId] && state.lessons[lessonId].state !== 'MASTERED') {
    state.lessons[lessonId].state = 'COMPLETED';
    saveState(state);
    const meta = LESSON_METADATA[lessonId];
    const title = meta ? meta.title : `Lesson ${lessonId}`;
    logActivity('lesson', `Completed ${title}`, '✅', { lesson: lessonId });
  } else {
    saveState(state);
  }
}

export function saveLessonStep(lessonId, stepIdx) {
  const state = getState();
  if (state.lessons[lessonId]) {
    state.lessons[lessonId].lastStepIdx = stepIdx;
  }
  saveState(state);
  localStorage.setItem('lastActiveLessonId', lessonId);
}

export function getCurrentUnfinishedLesson() {
  const state = getState();
  for (let id = 1; id <= 4; id++) {
    const idStr = id.toString();
    const p = state.lessons[idStr];
    const letters = LESSON_LETTERS[idStr] || [];
    const masteredCount = letters.filter(l => (state.letterStreaks[l] || 0) >= MASTERY_THRESHOLD).length;
    const isMastered = (p && p.state === 'MASTERED') || (letters.length > 0 && masteredCount === letters.length);
    
    if (isMastered) continue;
    
    const stepIdx = (p && p.lastStepIdx !== undefined) ? p.lastStepIdx : 0;
    return { lessonId: idStr, stepIdx };
  }
  return { lessonId: "4", stepIdx: 0 };
}

export function getCurrentActiveLesson() {
  const { lessonId } = getCurrentUnfinishedLesson();
  return parseInt(lessonId, 10);
}

export function getResumePath() {
  const state = getState();
  const { lessonId } = getCurrentUnfinishedLesson();
  const p = state.lessons[lessonId];
  if (!p || p.state === 'NOT_STARTED' || p.state === 'IN_PROGRESS') {
    return `/learn/lesson/${lessonId}`;
  }
  if (p.state === 'COMPLETED') {
    if (p.lastResult) return `/learn/${lessonId}/quiz/result`;
    else return `/learn/${lessonId}/quiz`;
  }
  return `/learn/lesson/${lessonId}`;
}

// ── Core mastery recording ──
export function recordQuestionAnswer(lessonId, letter, isCorrect) {
  const state = getState();
  const prevStreak = state.letterStreaks[letter] || 0;
  let newStreak;

  if (isCorrect) {
    newStreak = Math.min(MASTERY_THRESHOLD, prevStreak + 1);
  } else {
    newStreak = 0; 
  }

  state.letterStreaks[letter] = newStreak;
  saveState(state);

  if (newStreak >= MASTERY_THRESHOLD && prevStreak < MASTERY_THRESHOLD) {
    logActivity('mastery', `Mastered letter ${letter} (5/5 streak)`, '🌟');
  }

  return { prevStreak, newStreak, isCorrect, isMastered: newStreak >= MASTERY_THRESHOLD };
}

export function recordQuizSubmission(lessonId, finalScore, total, timeSec, userAnswers, questions, streakChanges) {
  const state = getState();
  const percent = total > 0 ? Math.round((finalScore / total) * 100) : 0;
  const passed = percent >= 80;

  const wasMasteredBefore = state.lessons[lessonId]?.state === 'MASTERED';

  let earned = 0;
  if (passed) {
    earned += 50;
    if (percent === 100) earned += 20;
  }
  state.xp += earned;

  const badges = state.badges || [];
  if (passed && !badges.includes('letterExplorer')) badges.push('letterExplorer');
  if (percent === 100 && !badges.includes('perfectQuiz')) badges.push('perfectQuiz');
  state.badges = badges;

  const letters = LESSON_LETTERS[lessonId] || [];
  const allMastered = letters.length > 0 && letters.every(l => (state.letterStreaks[l] || 0) >= MASTERY_THRESHOLD);

  if (allMastered && !wasMasteredBefore) {
    state.lessons[lessonId].state = 'MASTERED';
    earned += 100;
    state.xp += 100;
  }

  state.lessons[lessonId].lastResult = {
    score: finalScore,
    total,
    percent,
    passed,
    timeSec,
    earned,
    badgesAwarded: badges,
    userAnswers,
    questions,
    streakChanges,
    timestamp: Date.now()
  };

  saveState(state);

  const meta = LESSON_METADATA[lessonId];
  const lessonTitle = meta ? meta.title : `Lesson ${lessonId}`;
  logActivity('quiz', `Completed adaptive quiz: ${lessonTitle} — ${percent}%`, '⚡', {
    lesson: lessonId,
    accuracy: percent,
    questionsAnswered: total
  });
  if (allMastered && !wasMasteredBefore) {
    logActivity('mastery', `Mastered ${lessonTitle}! 🏆`, '🏆', { lesson: lessonId });
    const nextId = (parseInt(lessonId, 10) + 1).toString();
    if (LESSON_METADATA[nextId]) {
      logActivity('unlock', `Unlocked ${LESSON_METADATA[nextId].title}`, '🔓', { lesson: nextId });
    }
  }
  const prevBadges = getState().badges;
  badges.forEach(b => {
    if (!prevBadges.includes(b)) {
      const name = b === 'letterExplorer' ? 'Letter Explorer' : b === 'perfectQuiz' ? 'Perfect Quiz' : b;
      logActivity('badge', `Earned badge: ${name}`, '🏅');
    }
  });

  return state.lessons[lessonId].lastResult;
}

export function getLastResult(lessonId) {
  const state = getState();
  return (state.lessons[lessonId] && state.lessons[lessonId].lastResult) || null;
}

export function resetQuizResult(lessonId) {
  const state = getState();
  if (state.lessons[lessonId]) delete state.lessons[lessonId].lastResult;
  saveState(state);
}

// ── Practice Session Recording ──
export function recordPracticeSession(result, questions) {
  const state = getState();
  
  const letters = [];
  const words = [];
  questions.forEach(q => {
    if (q.letter && !letters.includes(q.letter)) letters.push(q.letter);
    if (q.word && !words.includes(q.word)) words.push(q.word);
  });

  state.practiceState.sessionsCompleted += 1;
  state.practiceState.lastResult = {
    total: result.total,
    score: result.score,
    percent: result.percent || 0,
    letters,
    words,
    timeSec: result.timeSec || 0,
    timestamp: Date.now()
  };

  saveState(state);

  logActivity('practice', `Completed Practice Quiz — ${result.percent || 0}%`, '🔄', {
    accuracy: result.percent || 0,
    questionsAnswered: result.total || 0
  });
}

// ── Progress aggregates ──
export function getOverallProgressPercent(customState) {
  const state = customState || getState();
  return _calculateOverallProgress(state);
}

export function getMasteredLettersCount(customState) {
  return getMasteredLettersList(customState).length;
}

export function getCompletedLessonsCount(customState) {
  const state = customState || getState();
  return Object.values(state.lessons || {}).filter(l => l.state === 'MASTERED').length;
}

export function getMasteredLettersList(customState) {
  const state = customState || getState();
  const masteredSet = new Set();
  
  if (state.letterStreaks) {
    Object.keys(state.letterStreaks).forEach(l => {
      if (state.letterStreaks[l] >= MASTERY_THRESHOLD) {
        masteredSet.add(l);
      }
    });
  }

  if (state.lessons) {
    Object.entries(LESSON_LETTERS).forEach(([lessonId, letters]) => {
      if (state.lessons[lessonId]?.state === 'MASTERED') {
        letters.forEach(l => masteredSet.add(l));
      }
    });
  }

  return Array.from(masteredSet);
}

// ── Activity Log ──
export function logActivity(type, title, icon = '📌', extra = {}) {
  const state = getState();
  const entry = {
    id: Date.now(),
    type,
    title,
    icon,
    progress: _calculateOverallProgress(state),
    timestamp: new Date().toISOString(),
    ...extra
  };
  state.activityLog = [entry, ...(state.activityLog || [])].slice(0, 50);
  saveState(state);
}

export function getActivityLog() {
  const state = getState();
  return state.activityLog || [];
}

const learningProgress = {
  getState,
  saveState,
  loadStateFromBackend,
  syncStateToBackend,
  clearLocalState,
  isLessonUnlocked,
  getUnmasteredLetters,
  getLetterStreak,
  startLesson,
  completeLessonContent,
  saveLessonStep,
  getCurrentUnfinishedLesson,
  getCurrentActiveLesson,
  getResumePath,
  recordQuestionAnswer,
  recordQuizSubmission,
  getLastResult,
  resetQuizResult,
  getOverallProgressPercent,
  getMasteredLettersCount,
  getCompletedLessonsCount,
  getMasteredLettersList,
  getLessonMetadata,
  logActivity,
  getActivityLog,
  recordPracticeSession
};

export default learningProgress;
