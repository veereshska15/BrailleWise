// src/data/practiceQuizData.js
// READ-ONLY revision question generator.
// NEVER writes to learningProgress.
// Uses ONLY letters from MASTERED lessons.

import { LESSON_LETTERS } from '../utils/learningProgress';

// ── Braille reference map ──────────────────────────────────────────────────────
export const BRAILLE_MAP = {
  'A': { braille: '⠁', dots: [1], unicode: 'A' },
  'B': { braille: '⠃', dots: [1, 2], unicode: 'B' },
  'C': { braille: '⠉', dots: [1, 4], unicode: 'C' },
  'D': { braille: '⠙', dots: [1, 4, 5], unicode: 'D' },
  'E': { braille: '⠑', dots: [1, 5], unicode: 'E' },
  'F': { braille: '⠋', dots: [1, 2, 4], unicode: 'F' },
  'G': { braille: '⠛', dots: [1, 2, 4, 5], unicode: 'G' },
  'H': { braille: '⠓', dots: [1, 2, 5], unicode: 'H' },
  'I': { braille: '⠊', dots: [2, 4], unicode: 'I' },
  'J': { braille: '⠚', dots: [2, 4, 5], unicode: 'J' },
  'K': { braille: '⠅', dots: [1, 3], unicode: 'K' },
  'L': { braille: '⠇', dots: [1, 2, 3], unicode: 'L' },
  'M': { braille: '⠍', dots: [1, 3, 4], unicode: 'M' },
  'N': { braille: '⠝', dots: [1, 3, 4, 5], unicode: 'N' },
  'O': { braille: '⠕', dots: [1, 3, 5], unicode: 'O' },
  'P': { braille: '⠏', dots: [1, 2, 3, 4], unicode: 'P' },
  'Q': { braille: '⠟', dots: [1, 2, 3, 4, 5], unicode: 'Q' },
  'R': { braille: '⠗', dots: [1, 2, 3, 5], unicode: 'R' },
  'S': { braille: '⠎', dots: [2, 3, 4], unicode: 'S' },
  'T': { braille: '⠞', dots: [2, 3, 4, 5], unicode: 'T' },
  'U': { braille: '⠥', dots: [1, 3, 6], unicode: 'U' },
  'V': { braille: '⠧', dots: [1, 2, 3, 6], unicode: 'V' },
  'W': { braille: '⠺', dots: [2, 4, 5, 6], unicode: 'W' },
  'X': { braille: '⠭', dots: [1, 3, 4, 6], unicode: 'X' },
  'Y': { braille: '⠽', dots: [1, 3, 4, 5, 6], unicode: 'Y' },
  'Z': { braille: '⠵', dots: [1, 3, 5, 6], unicode: 'Z' }
};

// ── Known word list — used for word-based questions ───────────────────────────
// Every word here is the FULL uppercase word; the generator checks that
// every character is in the "known letters" pool before including it.
const ALL_KNOWN_WORDS = [
  // 2-letter
  'AB', 'AD', 'AE', 'AF', 'BE', 'CA', 'DA', 'DE', 'ED', 'EF',
  'FA', 'FE', 'HI', 'ID', 'IF', 'IN', 'JO', 'KI', 'LO', 'ME',
  'MO', 'NO', 'OF', 'OH', 'OK', 'ON', 'OR', 'PI', 'RH', 'SO',
  'TO', 'UP', 'US', 'WE', 'YE',
  // 3-letter
  'ACE', 'AGO', 'AID', 'AIM', 'AIR', 'ALL', 'AND', 'ANT', 'APE', 'ARE',
  'ART', 'ASK', 'ATE', 'BAD', 'BAG', 'BAN', 'BAR', 'BED', 'BIG', 'BIT',
  'BOB', 'BOG', 'BOX', 'BUD', 'BUG', 'BUN', 'BUS', 'BUT', 'CAB', 'CAD',
  'CAN', 'CAP', 'CAR', 'CAT', 'COD', 'COG', 'COP', 'COT', 'COW', 'CRY',
  'CUB', 'CUP', 'CUT', 'DAB', 'DAD', 'DAM', 'DEN', 'DEW', 'DID', 'DIG',
  'DIM', 'DIN', 'DIP', 'DOT', 'DRY', 'DUB', 'DUG', 'DUN', 'EAR', 'EEL',
  'EGG', 'ELK', 'EMU', 'END', 'ERA', 'EWE', 'EYE', 'FAD', 'FAN', 'FAR',
  'FAT', 'FAX', 'FED', 'FEW', 'FIG', 'FIN', 'FIT', 'FIX', 'FLY', 'FOB',
  'FOE', 'FOG', 'FUN', 'FUR', 'GAB', 'GAG', 'GAP', 'GAS', 'GAY', 'GEL',
  'GEM', 'GIN', 'GNU', 'GOB', 'GOD', 'GOT', 'GUM', 'GUN', 'GUT', 'HAD',
  'HAM', 'HAS', 'HAT', 'HEN', 'HER', 'HIM', 'HIP', 'HIS', 'HIT', 'HOB',
  'HOG', 'HOP', 'HOT', 'HOW', 'HUB', 'HUG', 'HUM', 'HUT', 'ICE', 'ILL',
  'INN', 'ION', 'JAB', 'JAG', 'JAM', 'JAR', 'JAW', 'JET', 'JIG', 'JOB',
  'JOG', 'JOY', 'JUG', 'JUT', 'KEG', 'KID', 'KIN', 'KIT', 'LAB', 'LAD',
  'LAP', 'LAW', 'LAX', 'LAY', 'LED', 'LEG', 'LET', 'LID', 'LIP', 'LIT',
  'LOG', 'LOT', 'LOW', 'MAP', 'MAR', 'MAT', 'MEN', 'MET', 'MID', 'MIX',
  'MOB', 'MOD', 'MOP', 'MUD', 'MUG', 'MUM', 'NAB', 'NAP', 'NET', 'NIB',
  'NIP', 'NOB', 'NOD', 'NOR', 'NOT', 'NUN', 'NUT', 'OAK', 'OAT', 'ODD',
  'ODE', 'OFT', 'OIL', 'OLD', 'OPT', 'ORE', 'OUR', 'OUT', 'OWE', 'OWL',
  'OWN', 'PAD', 'PAN', 'PAR', 'PAT', 'PAW', 'PAY', 'PEA', 'PEG', 'PEN',
  'PET', 'PIE', 'PIG', 'PIN', 'PIT', 'PLY', 'POD', 'POP', 'POT', 'POW',
  'PRY', 'PUB', 'PUN', 'PUP', 'PUS', 'PUT', 'RAG', 'RAN', 'RAP', 'RAT',
  'RAW', 'RAY', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD', 'ROT',
  'ROW', 'RUB', 'RUG', 'RUN', 'RUT', 'SAP', 'SAT', 'SAW', 'SAY', 'SET',
  'SIT', 'SIX', 'SOB', 'SOD', 'SON', 'SOP', 'SOT', 'SOW', 'SOY', 'SPY',
  'STY', 'SUB', 'SUM', 'SUN', 'SUP', 'TAB', 'TAD', 'TAN', 'TAP', 'TAR',
  'TAT', 'TAX', 'TON', 'TOP', 'TOT', 'TOW', 'TOY', 'TUB', 'TUG', 'TUN',
  'TWO', 'URN', 'USE', 'VAN', 'VAT', 'VIA', 'VIE', 'VOW', 'WAD', 'WAR',
  'WAX', 'WAY', 'WEB', 'WED', 'WET', 'WHO', 'WHY', 'WIG', 'WIN', 'WIT',
  'WOE', 'WOK', 'WON', 'WOO', 'WOW', 'YAK', 'YAM', 'YAP', 'YAW', 'YEA',
  'YEN', 'YEP', 'YET', 'YEW', 'YOU', 'ZAG', 'ZAP', 'ZEN', 'ZIP', 'ZIT',
  // 4-letter
  'ACID', 'ACRE', 'AGED', 'AGES', 'AIDE', 'AIMS', 'AIRS', 'ALSO', 'AMID',
  'ANTE', 'ARCH', 'AREA', 'ARIA', 'ARMY', 'ARTS', 'ATOM', 'AVID', 'AWAY',
  'AXES', 'BACK', 'BALD', 'BAND', 'BANK', 'BARE', 'BARK', 'BARN', 'BASE',
  'BATH', 'BEAK', 'BEAN', 'BEAR', 'BEAT', 'BECK', 'BEEF', 'BEEN', 'BELL',
  'BEST', 'BIKE', 'BILL', 'BIND', 'BIRD', 'BITE', 'BLUE', 'BOAT', 'BODY',
  'BOLD', 'BONE', 'BOOK', 'BORE', 'BORN', 'BOTH', 'BULL', 'BUMP', 'BURN',
  'CAGE', 'CAKE', 'CALL', 'CALM', 'CAME', 'CAMP', 'CARD', 'CARE', 'CART',
  'CASE', 'CAVE', 'CELL', 'CHIP', 'CLAM', 'CLAP', 'CLAY', 'CLUB', 'CLUE',
  'COAL', 'COAT', 'CODE', 'COIL', 'COLD', 'COME', 'COPE', 'CORD', 'CORE',
  'CORN', 'COST', 'COZY', 'CREW', 'CROP', 'CUBE', 'CURB', 'CURE', 'CURL',
  'DAMP', 'DARK', 'DART', 'DASH', 'DATA', 'DAWN', 'DAYS', 'DEAD', 'DEAL',
  'DEAR', 'DEBT', 'DECK', 'DEED', 'DEEM', 'DEEP', 'DEER', 'DELL', 'DENY',
  'DESK', 'DIAL', 'DIET', 'DISC', 'DISH', 'DISK', 'DIVE', 'DOCK', 'DOES',
  'DOME', 'DONE', 'DOOR', 'DOWN', 'DRAG', 'DRAW', 'DREW', 'DRIP', 'DROP',
  'DRUM', 'DUAL', 'DULL', 'DUMB', 'DUNE', 'DUSK', 'DUST', 'DUTY', 'EACH',
  'EARN', 'EASE', 'EAST', 'EDGE', 'EDIT', 'EPIC', 'EVEN', 'EVER', 'EVIL',
  'EXAM', 'FACE', 'FACT', 'FADE', 'FAIL', 'FAIR', 'FAKE', 'FAME', 'FARM',
  'FAST', 'FATE', 'FEAT', 'FEEL', 'FELL', 'FILE', 'FILL', 'FILM', 'FIND',
  'FIRE', 'FIRM', 'FISH', 'FIST', 'FIVE', 'FLAG', 'FLAW', 'FLED', 'FLEW',
  'FLIP', 'FLOW', 'FOAM', 'FOLD', 'FOLK', 'FOND', 'FOOD', 'FOOL', 'FOOT',
  'FORD', 'FORE', 'FORK', 'FORM', 'FORT', 'FOUL', 'FOUR', 'FREE', 'FROM',
  'FUEL', 'FULL', 'FUND', 'FUSE', 'GAIN', 'GALE', 'GAME', 'GANG', 'GAVE',
  'GAZE', 'GEAR', 'GIVE', 'GLAD', 'GLOB', 'GLOW', 'GLUE', 'GOAL', 'GOES',
  'GOLD', 'GOLF', 'GOOD', 'GOWN', 'GRAB', 'GRAY', 'GREW', 'GRIN', 'GRIP',
  'GREW', 'GROW', 'GRUB', 'GULF', 'GURU', 'GUST', 'GUYS', 'HACK', 'HAIR',
  'HALF', 'HALL', 'HALT', 'HAND', 'HANG', 'HARD', 'HARM', 'HARP', 'HASH',
  'HAZE', 'HEAD', 'HEAL', 'HEAP', 'HEAR', 'HEAT', 'HEEL', 'HELM', 'HELP',
  'HERB', 'HERE', 'HERO', 'HIGH', 'HIKE', 'HILL', 'HINT', 'HIRE', 'HOLE',
  'HOME', 'HOOD', 'HOOK', 'HORN', 'HOUR', 'HUGE', 'HULK', 'HULL', 'HUNG',
  'HUNT', 'HURT', 'HUSK', 'ICON', 'IDEA', 'IDLE', 'INCH', 'INFO', 'IRON',
  'ITEM', 'JACK', 'JADE', 'JARS', 'JAVA', 'JAZZ', 'JERK', 'JEST', 'JOBS',
  'JOIN', 'JOKE', 'JUMP', 'JURY', 'JUST', 'KEEN', 'KEEP', 'KEPT', 'KICK',
  'KIND', 'KING', 'KNEE', 'KNEW', 'KNOB', 'KNOW', 'LACK', 'LAKE', 'LAMP',
  'LAND', 'LANE', 'LARK', 'LAST', 'LATE', 'LAWN', 'LEAD', 'LEAF', 'LEAN',
  'LEAP', 'LEFT', 'LENS', 'LIFT', 'LIKE', 'LIME', 'LINK', 'LION', 'LIST',
  'LIVE', 'LOAD', 'LOAN', 'LOCK', 'LOFT', 'LONE', 'LONG', 'LOOK', 'LOOM',
  'LORD', 'LORE', 'LOSE', 'LOSS', 'LOST', 'LOVE', 'LUCK', 'LUMP', 'LUNG',
  'LURE', 'LURK', 'LUST'
];

// ── Utility helpers ────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle (returns a new array) */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick n random items from arr */
function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

/**
 * Given the current learningProgress state, collect every letter
 * from MASTERED lessons.
 * @param {object} progressState - result of learningProgress.getState()
 * @returns {string[]} sorted array of known letters
 */
export function getKnownLetters(progressState) {
  const knownSet = new Set();
  const completedList = progressState.completed_lessons || progressState.completedLessons || [];
  if (Array.isArray(completedList)) {
    completedList.forEach(lNum => {
      const letters = LESSON_LETTERS[lNum.toString()] || [];
      letters.forEach(l => knownSet.add(l));
    });
  }
  Object.entries(progressState.lessons || {}).forEach(([lessonId, record]) => {
    if (record && record.state === 'MASTERED') {
      const letters = LESSON_LETTERS[lessonId] || [];
      letters.forEach(l => knownSet.add(l));
    }
  });
  return Array.from(knownSet).sort();
}

/**
 * Build words that use ONLY known letters.
 * @param {string[]} knownLetters
 * @param {number} maxWords - maximum words to return
 * @returns {string[]}
 */
export function getKnownWords(knownLetters, maxWords = 40) {
  const knownSet = new Set(knownLetters.map(l => l.toUpperCase()));
  return ALL_KNOWN_WORDS.filter(word =>
    word.split('').every(ch => knownSet.has(ch))
  ).slice(0, maxWords);
}

// ── Question generators (READ-ONLY, no side effects) ─────────────────────────

/**
 * Braille → Letter: show a Braille char, pick correct letter
 */
function makeBrailleToLetterQuestion(letter, pool) {
  const correctData = BRAILLE_MAP[letter];
  const distractors = sample(pool.filter(l => l !== letter), 3);
  const correctOpt = letter;
  const opts = shuffle([correctOpt, ...distractors]);
  return {
    id: `btl-${letter}-${Math.random()}`,
    type: 'braille_to_letter',
    letter,
    question: `What letter does this Braille pattern represent?`,
    brailleDisplay: correctData.braille,
    brailleDots: correctData.dots,
    options: opts,
    correctIdx: opts.indexOf(correctOpt),
    hint: `Look at the raised dots carefully.`
  };
}

/**
 * Letter → Braille: show a letter, pick correct Braille char
 */
function makeLetterToBrailleQuestion(letter, pool) {
  const correctData = BRAILLE_MAP[letter];
  const distractors = sample(pool.filter(l => l !== letter), 3)
    .map(l => BRAILLE_MAP[l].braille);
  const correctOpt = correctData.braille;
  const opts = shuffle([correctOpt, ...distractors]);
  return {
    id: `ltb-${letter}-${Math.random()}`,
    type: 'letter_to_braille',
    letter,
    question: `Which Braille pattern represents the letter ${letter}?`,
    brailleDisplay: correctData.braille,
    brailleDots: correctData.dots,
    options: opts,
    correctIdx: opts.indexOf(correctOpt),
    hint: `Think about the dot positions for ${letter}.`
  };
}

/**
 * Word Recognition: show a word in Braille chars, choose the correct word
 */
function makeWordRecognitionQuestion(word, knownWords) {
  const brailleWord = word.split('').map(ch => BRAILLE_MAP[ch]?.braille || ch).join(' ');
  const distractors = sample(
    knownWords.filter(w => w !== word && w.length === word.length),
    3
  );
  // If not enough same-length distractors, pick any
  const extra = distractors.length < 3
    ? sample(knownWords.filter(w => w !== word && !distractors.includes(w)), 3 - distractors.length)
    : [];
  const allDistractors = [...distractors, ...extra].slice(0, 3);
  const opts = shuffle([word, ...allDistractors]);
  return {
    id: `wr-${word}-${Math.random()}`,
    type: 'word_recognition',
    word,
    question: `Which word does this Braille sequence spell?`,
    brailleDisplay: brailleWord,
    brailleDots: null,
    options: opts,
    correctIdx: opts.indexOf(word),
    hint: `Each symbol represents one letter.`
  };
}

/**
 * Word → Braille: show a plain word, pick the correct Braille representation
 */
function makeWordToBrailleQuestion(word, knownWords) {
  const correctBraille = word.split('').map(ch => BRAILLE_MAP[ch]?.braille || ch).join(' ');
  const distractors = sample(
    knownWords.filter(w => w !== word),
    3
  ).map(w => w.split('').map(ch => BRAILLE_MAP[ch]?.braille || ch).join(' '));
  const opts = shuffle([correctBraille, ...distractors]);
  return {
    id: `wtb-${word}-${Math.random()}`,
    type: 'word_to_braille',
    word,
    question: `Which Braille sequence spells the word "${word}"?`,
    brailleDisplay: null,
    brailleDots: null,
    options: opts,
    correctIdx: opts.indexOf(correctBraille),
    hint: `Convert each letter to its Braille pattern.`
  };
}

/**
 * Missing Letter: complete the word by choosing the missing letter
 */
function makeMissingLetterQuestion(word, pool) {
  if (word.length < 2) return null;
  const missingIdx = Math.floor(Math.random() * word.length);
  const correctLetter = word[missingIdx];
  const masked = word.split('').map((ch, i) => (i === missingIdx ? '_' : ch)).join('');
  const distractors = sample(pool.filter(l => l !== correctLetter), 3);
  const opts = shuffle([correctLetter, ...distractors]);
  return {
    id: `ml-${word}-${missingIdx}-${Math.random()}`,
    type: 'missing_letter',
    word,
    missingIdx,
    letter: correctLetter,
    question: `Fill in the missing letter: "${masked}"`,
    brailleDisplay: null,
    brailleDots: BRAILLE_MAP[correctLetter]?.dots || [],
    options: opts,
    correctIdx: opts.indexOf(correctLetter),
    hint: `Think about what letter fits in the blank.`
  };
}

// ── Main export: generate a full practice session ─────────────────────────────

/**
 * Generate a randomized set of practice questions from known letters only.
 * READ-ONLY: never touches learningProgress.
 *
 * @param {object} progressState - from learningProgress.getState()
 * @param {number} count - number of questions (default 10)
 * @returns {{ questions: object[], knownLetters: string[], knownWords: string[] }}
 */
export function generatePracticeSession(progressState, count = 10) {
  const knownLetters = getKnownLetters(progressState);
  if (knownLetters.length === 0) {
    return { questions: [], knownLetters: [], knownWords: [] };
  }

  const knownWords = getKnownWords(knownLetters, 60);

  const pool = [];

  // 1. Braille → Letter questions (pick up to 3 random letters)
  const lettersForBTL = sample(knownLetters, Math.min(3, knownLetters.length));
  lettersForBTL.forEach(l => pool.push(makeBrailleToLetterQuestion(l, knownLetters)));

  // 2. Letter → Braille questions (pick up to 3 different random letters)
  const usedBTL = new Set(lettersForBTL);
  const lettersForLTB = sample(knownLetters.filter(l => !usedBTL.has(l)), Math.min(3, knownLetters.length));
  lettersForLTB.forEach(l => pool.push(makeLetterToBrailleQuestion(l, knownLetters)));

  // 3. Word recognition (if words available)
  if (knownWords.length >= 2) {
    const wordsForWR = sample(knownWords, Math.min(2, knownWords.length));
    wordsForWR.forEach(w => pool.push(makeWordRecognitionQuestion(w, knownWords)));
  }

  // 4. Word → Braille (if words available)
  if (knownWords.length >= 2) {
    const wordsForWTB = sample(knownWords, Math.min(2, knownWords.length));
    wordsForWTB.forEach(w => pool.push(makeWordToBrailleQuestion(w, knownWords)));
  }

  // 5. Missing letter (if words available with length >= 3)
  const longWords = knownWords.filter(w => w.length >= 3);
  if (longWords.length >= 1) {
    const wordsForML = sample(longWords, Math.min(2, longWords.length));
    wordsForML.forEach(w => {
      const q = makeMissingLetterQuestion(w, knownLetters);
      if (q) pool.push(q);
    });
  }

  // Remove nulls, shuffle, trim to count
  const finalQuestions = shuffle(pool.filter(Boolean)).slice(0, count);

  return { questions: finalQuestions, knownLetters, knownWords };
}
