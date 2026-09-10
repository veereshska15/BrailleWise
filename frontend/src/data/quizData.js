// src/data/quizData.js
// Quiz question generators using unmastered-letter-aware personalized filtering.

import learningProgress, { LESSON_LETTERS, getUnmasteredLetters, getLetterStreak } from '../utils/learningProgress';

const BRAILLE_MAP = {
  'A': { braille: '⠁', dots: [1] },
  'B': { braille: '⠃', dots: [1, 2] },
  'C': { braille: '⠉', dots: [1, 4] },
  'D': { braille: '⠙', dots: [1, 4, 5] },
  'E': { braille: '⠑', dots: [1, 5] },
  'F': { braille: '⠋', dots: [1, 2, 4] },
  'G': { braille: '⠛', dots: [1, 2, 4, 5] },
  'H': { braille: '⠓', dots: [1, 2, 5] },
  'I': { braille: '⠊', dots: [2, 4] },
  'J': { braille: '⠚', dots: [2, 4, 5] },
  'K': { braille: '⠅', dots: [1, 3] },
  'L': { braille: '⠇', dots: [1, 2, 3] },
  'M': { braille: '⠍', dots: [1, 3, 4] },
  'N': { braille: '⠝', dots: [1, 3, 4, 5] },
  'O': { braille: '⠕', dots: [1, 3, 5] },
  'P': { braille: '⠏', dots: [1, 2, 3, 4] },
  'Q': { braille: '⠟', dots: [1, 2, 3, 4, 5] },
  'R': { braille: '⠗', dots: [1, 2, 3, 5] },
  'S': { braille: '⠎', dots: [2, 3, 4] },
  'T': { braille: '⠞', dots: [2, 3, 4, 5] },
  'U': { braille: '⠥', dots: [1, 3, 6] },
  'V': { braille: '⠧', dots: [1, 2, 3, 6] },
  'W': { braille: '⠺', dots: [2, 4, 5, 6] },
  'X': { braille: '⠭', dots: [1, 3, 4, 6] },
  'Y': { braille: '⠽', dots: [1, 3, 4, 5, 6] },
  'Z': { braille: '⠵', dots: [1, 3, 5, 6] }
};

/**
 * Build a single question object for a letter.
 * @param {string} letter 
 * @param {string[]} allLessonLetters 
 * @returns {object} question object
 */
export function buildQuestionForLetter(letter, allLessonLetters) {
  const correctData = BRAILLE_MAP[letter];
  if (!correctData) return null;

  const distractorPool = allLessonLetters.filter(l => l !== letter);
  const shuffledPool = [...distractorPool].sort(() => 0.5 - Math.random());
  const distractors = shuffledPool.slice(0, 3).map(l => `${BRAILLE_MAP[l].braille} (Letter ${l})`);

  const correctOption = `${correctData.braille} (Letter ${letter})`;
  const options = [correctOption, ...distractors].sort(() => 0.5 - Math.random());
  const correctIdx = options.indexOf(correctOption);

  return {
    id: `${letter}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    letter: letter,
    question: `Which Braille pattern represents the letter ${letter}?`,
    options: options,
    correctIdx: correctIdx,
    brailleVis: letter
  };
}

/**
 * Build questions for a given set of target letters.
 * @param {string[]} targetLetters
 * @param {string[]} allLessonLetters
 * @returns {object[]} question objects
 */
function buildQuestions(targetLetters, allLessonLetters) {
  const questions = [];
  targetLetters.forEach((letter) => {
    const q = buildQuestionForLetter(letter, allLessonLetters);
    if (q) questions.push(q);
  });
  return questions;
}

/**
 * Generate personalized quiz questions for a lesson prioritized by lowest streak.
 * @param {string} lessonId
 * @returns {object[]} list of quiz question objects
 */
export function getQuizQuestions(lessonId) {
  const allLessonLetters = LESSON_LETTERS[lessonId] || [];

  if (allLessonLetters.length === 0) {
    return [];
  }

  const unmasteredLetters = getUnmasteredLetters(lessonId);
  if (unmasteredLetters.length === 0) {
    return [];
  }

  // Sort by lowest streak first, with random tie-breaking
  const sortedUnmastered = [...unmasteredLetters].sort((a, b) => {
    const streakA = getLetterStreak ? getLetterStreak(a) : (learningProgress?.getLetterStreak ? learningProgress.getLetterStreak(a) : 0);
    const streakB = getLetterStreak ? getLetterStreak(b) : (learningProgress?.getLetterStreak ? learningProgress.getLetterStreak(b) : 0);
    if (streakA !== streakB) return streakA - streakB;
    return 0.5 - Math.random();
  });

  return buildQuestions(sortedUnmastered, allLessonLetters);
}
