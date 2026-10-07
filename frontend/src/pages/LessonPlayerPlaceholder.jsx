import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress from '../utils/learningProgress';
import voiceGuidance from '../utils/voiceGuidance';
import hardwareBridge from '../utils/hardwareBridge';
import './Learn.css';

// Reusable Lessons Database Array
const LESSONS_CONTENT = {
  "1": [
    {
      id: 1,
      type: "intro",
      title: "Introduction",
      description: "Welcome to Lesson 1. In this lesson, we will focus on learning Letters A, B, C, D, E, and F in English Braille. We will inspect their cell structures, practice with interactive visualization grids, and test our skills with quick checks."
    },
    {
      id: 2,
      type: "letter",
      letter: "A",
      braille: "⠁",
      dots: [1],
      words: ["CAB", "BABA", "ABBA"],
      description: "The letter A is formed using dot 1. Dot 1 is in the top-left corner of the Braille cell.",
      tip: "💡 Tip: This is the simplest Braille cell, consisting of a single dot.",
      check: {
        question: "Which dot pattern represents the letter A?",
        options: ["Dot 1", "Dots 1, 2", "Dots 1, 4", "Dots 1, 5"],
        correctIdx: 0
      }
    },
    {
      id: 3,
      type: "letter",
      letter: "B",
      braille: "⠃",
      dots: [1, 2],
      words: ["CAB", "ABBA", "BABA"],
      description: "The letter B is formed using dots 1 and 2. Dot 1 is top-left, and dot 2 is middle-left.",
      tip: "💡 Tip: Letter B forms a vertical line on the left side of the cell.",
      check: {
        question: "Which dot pattern represents the letter B?",
        options: ["Dot 1", "Dots 1, 2", "Dots 1, 4", "Dots 1, 2, 3"],
        correctIdx: 1
      }
    },
    {
      id: 4,
      type: "letter",
      letter: "C",
      braille: "⠉",
      dots: [1, 4],
      words: ["CAB", "ABBA", "BABA"],
      description: "The letter C is formed using dots 1 and 4. Dot 1 is top-left, and dot 4 is top-right.",
      tip: "💡 Tip: Letter C forms a horizontal line across the top of the cell.",
      check: {
        question: "Which dot pattern represents the letter C?",
        options: ["Dot 1", "Dots 1, 2", "Dots 1, 4", "Dots 1, 5"],
        correctIdx: 2
      }
    },
    {
      id: 5,
      type: "letter",
      letter: "D",
      braille: "⠙",
      dots: [1, 4, 5],
      words: ["BAD", "FED", "FAD"],
      description: "The letter D is formed using dots 1, 4, and 5. Dot 1 is top-left, dot 4 is top-right, and dot 5 is middle-right.",
      tip: "💡 Tip: Feel the triangular structure on the upper portion of the cell.",
      check: {
        question: "Which dot pattern represents the letter D?",
        options: ["Dots 1, 4, 5", "Dots 1, 5", "Dots 1, 2, 4", "Dots 2, 4, 5"],
        correctIdx: 0
      }
    },
    {
      id: 6,
      type: "letter",
      letter: "E",
      braille: "⠑",
      dots: [1, 5],
      words: ["BED", "BEAD", "FEED"],
      description: "The letter E is formed using dots 1 and 5. Dot 1 is top-left, and dot 5 is middle-right.",
      tip: "💡 Tip: Imagine a diagonal line descending from top-left to middle-right.",
      check: {
        question: "Which dot pattern represents the letter E?",
        options: ["Dots 1, 2", "Dots 1, 5", "Dots 2, 4", "Dots 1, 4"],
        correctIdx: 1
      }
    },
    {
      id: 7,
      type: "letter",
      letter: "F",
      braille: "⠋",
      dots: [1, 2, 4],
      words: ["FAD", "FADE", "FED"],
      description: "The letter F is formed using dots 1, 2, and 4. Dot 1 is top-left, dot 2 is middle-left, and dot 4 is top-right.",
      tip: "💡 Tip: Letter F forms a backwards 'L' shape on the upper side of the cell.",
      check: {
        question: "Which dot pattern represents the letter F?",
        options: ["Dots 1, 4, 5", "Dots 1, 2, 4", "Dots 1, 2, 5", "Dots 1, 5"],
        correctIdx: 1
      }
    },
    {
      id: 8,
      type: "review",
      title: "Quick Review",
      description: "Superb! You've gone through Letters A, B, C, D, E, and F. Let's do a quick recap:\n\n• Letter A: Dot 1\n• Letter B: Dots 1, 2\n• Letter C: Dots 1, 4\n• Letter D: Dots 1, 4, 5\n• Letter E: Dots 1, 5\n• Letter F: Dots 1, 2, 4\n\nClick 'Finish Lesson' below to complete this section and earn your rewards!"
    }
  ],
  "2": [
    {
      id: 1,
      type: "intro",
      title: "Introduction",
      description: "Welcome to Lesson 2. In this lesson, we will focus on learning Letters G, H, I, J, K, and L in English Braille. We will inspect their cell structures, practice with interactive visualization grids, and test our skills with quick checks."
    },
    {
      id: 2,
      type: "letter",
      letter: "G",
      braille: "⠛",
      dots: [1, 2, 4, 5],
      words: ["CAGE", "EGG", "BEG"],
      description: "The letter G is formed using dots 1, 2, 4, and 5. Dot 1 is top-left, dot 2 is middle-left, dot 4 is top-right, and dot 5 is middle-right.",
      tip: "💡 Tip: Letter G forms a solid square on the upper portion of the cell.",
      check: {
        question: "Which dot pattern represents the letter G?",
        options: ["Dots 1, 2, 4, 5", "Dots 1, 2, 5", "Dots 2, 4", "Dots 1, 4"],
        correctIdx: 0
      }
    },
    {
      id: 3,
      type: "letter",
      letter: "H",
      braille: "⠓",
      dots: [1, 2, 5],
      words: ["HIDE", "HEAD", "CHIEF"],
      description: "The letter H is formed using dots 1, 2, and 5. Dot 1 is top-left, dot 2 is middle-left, and dot 5 is middle-right.",
      tip: "💡 Tip: Think of an L-shape shifted or an upright corner.",
      check: {
        question: "Which dot pattern represents the letter H?",
        options: ["Dots 1, 2, 4", "Dots 1, 2, 5", "Dots 1, 4, 5", "Dots 2, 4, 5"],
        correctIdx: 1
      }
    },
    {
      id: 4,
      type: "letter",
      letter: "I",
      braille: "⠊",
      dots: [2, 4],
      words: ["ICE", "FIG", "HIDE"],
      description: "The letter I is formed using dots 2 and 4. Dot 2 is middle-left, and dot 4 is top-right.",
      tip: "💡 Tip: Imagine a diagonal line rising from middle-left to top-right.",
      check: {
        question: "Which dot pattern represents the letter I?",
        options: ["Dots 1, 2", "Dots 1, 5", "Dots 2, 4", "Dots 1, 4"],
        correctIdx: 2
      }
    },
    {
      id: 5,
      type: "letter",
      letter: "J",
      braille: "⠚",
      dots: [2, 4, 5],
      words: ["JAY", "JOB", "JUG"],
      description: "The letter J is formed using dots 2, 4, and 5. Dot 2 is middle-left, dot 4 is top-right, and dot 5 is middle-right.",
      tip: "💡 Tip: Think of a corner bracket shape on the right-hand side.",
      check: {
        question: "Which dot pattern represents the letter J?",
        options: ["Dots 2, 4, 5", "Dots 1, 2, 4", "Dots 1, 4, 5", "Dots 2, 4"],
        correctIdx: 0
      }
    },
    {
      id: 6,
      type: "letter",
      letter: "K",
      braille: "⠅",
      dots: [1, 3],
      words: ["KID", "KEY", "KEG"],
      description: "The letter K is formed using dots 1 and 3. Dot 1 is top-left, and dot 3 is bottom-left.",
      tip: "💡 Tip: This letter skips dot 2, forming a top and bottom dot on the left side.",
      check: {
        question: "Which dot pattern represents the letter K?",
        options: ["Dots 1, 2", "Dots 1, 3", "Dots 1, 4", "Dots 1, 5"],
        correctIdx: 1
      }
    },
    {
      id: 7,
      type: "letter",
      letter: "L",
      braille: "⠇",
      dots: [1, 2, 3],
      words: ["LEG", "LID", "LOG"],
      description: "The letter L is formed using dots 1, 2, and 3. These form a full vertical column on the left side.",
      tip: "💡 Tip: A solid line of three dots on the left side.",
      check: {
        question: "Which dot pattern represents the letter L?",
        options: ["Dots 1, 2", "Dots 1, 2, 3", "Dots 1, 3, 4", "Dots 1, 4"],
        correctIdx: 1
      }
    },
    {
      id: 8,
      type: "review",
      title: "Quick Review",
      description: "Superb! You've gone through Letters G, H, I, J, K, and L. Let's do a quick recap:\n\n• Letter G: Dots 1, 2, 4, 5\n• Letter H: Dots 1, 2, 5\n• Letter I: Dots 2, 4\n• Letter J: Dots 2, 4, 5\n• Letter K: Dots 1, 3\n• Letter L: Dots 1, 2, 3\n\nClick 'Finish Lesson' below to complete this section and earn your rewards!"
    }
  ],
  "3": [
    {
      id: 1,
      type: "intro",
      title: "Introduction",
      description: "Welcome to Lesson 3. In this lesson, we will focus on learning Letters M, N, O, P, Q, and R in English Braille. We will inspect their cell structures, practice with interactive visualization grids, and test our skills with quick checks."
    },
    {
      id: 2,
      type: "letter",
      letter: "M",
      braille: "⠍",
      dots: [1, 3, 4],
      words: ["MAP", "MUG", "MAN"],
      description: "The letter M is formed using dots 1, 3, and 4. Dot 1 is top-left, dot 3 is bottom-left, and dot 4 is top-right.",
      tip: "💡 Tip: Imagine a triangle spanning the top-left, bottom-left, and top-right of the cell.",
      check: {
        question: "Which dot pattern represents the letter M?",
        options: ["Dots 1, 3", "Dots 1, 3, 4", "Dots 1, 4", "Dots 1, 4, 5"],
        correctIdx: 1
      }
    },
    {
      id: 3,
      type: "letter",
      letter: "N",
      braille: "⠝",
      dots: [1, 3, 4, 5],
      words: ["NET", "NIP", "NUN"],
      description: "The letter N is formed using dots 1, 3, 4, and 5. Dot 1 is top-left, dot 3 is bottom-left, dot 4 is top-right, and dot 5 is middle-right.",
      tip: "💡 Tip: Similar to letter M but adds dot 5 in the middle right.",
      check: {
        question: "Which dot pattern represents the letter N?",
        options: ["Dots 1, 3, 4, 5", "Dots 1, 3, 5", "Dots 1, 4, 5", "Dots 2, 3, 4"],
        correctIdx: 0
      }
    },
    {
      id: 4,
      type: "letter",
      letter: "O",
      braille: "⠕",
      dots: [1, 3, 5],
      words: ["OWL", "OAR", "OLD"],
      description: "The letter O is formed using dots 1, 3, and 5. Dot 1 is top-left, dot 3 is bottom-left, and dot 5 is middle-right.",
      tip: "💡 Tip: Skip dot 4, forming a vertical diagonal angle.",
      check: {
        question: "Which dot pattern represents the letter O?",
        options: ["Dots 1, 3", "Dots 1, 3, 4", "Dots 1, 3, 5", "Dots 1, 5"],
        correctIdx: 2
      }
    },
    {
      id: 5,
      type: "letter",
      letter: "P",
      braille: "⠏",
      dots: [1, 2, 3, 4],
      words: ["PEN", "PIN", "PEG"],
      description: "The letter P is formed using dots 1, 2, 3, and 4. This occupies the upper-left cluster and bottom-left.",
      tip: "💡 Tip: A vertical line of three dots on the left, plus a single dot at the top-right.",
      check: {
        question: "Which dot pattern represents the letter P?",
        options: ["Dots 1, 2, 3", "Dots 1, 2, 3, 4", "Dots 1, 3, 4", "Dots 1, 4, 5"],
        correctIdx: 1
      }
    },
    {
      id: 6,
      type: "letter",
      letter: "Q",
      braille: "⠟",
      dots: [1, 2, 3, 4, 5],
      words: ["QUEEN", "QUICK", "QUIZ"],
      description: "The letter Q is formed using dots 1, 2, 3, 4, and 5. This fills almost all dots except dot 6.",
      tip: "💡 Tip: This letter occupies five dots, leaving only the bottom-right empty.",
      check: {
        question: "Which dot pattern represents the letter Q?",
        options: ["Dots 1, 2, 3, 4, 5", "Dots 1, 2, 3, 5", "Dots 1, 2, 4, 5", "Dots 2, 3, 4, 5"],
        correctIdx: 0
      }
    },
    {
      id: 7,
      type: "letter",
      letter: "R",
      braille: "⠗",
      dots: [1, 2, 3, 5],
      words: ["RAT", "RED", "RUN"],
      description: "The letter R is formed using dots 1, 2, 3, and 5. This forms a vertical column on the left and a middle-right dot.",
      tip: "💡 Tip: Similar to letter L but adds dot 5 in the middle right.",
      check: {
        question: "Which dot pattern represents the letter R?",
        options: ["Dots 1, 2, 3", "Dots 1, 2, 3, 5", "Dots 1, 2, 5", "Dots 1, 3, 5"],
        correctIdx: 1
      }
    },
    {
      id: 8,
      type: "review",
      title: "Quick Review",
      description: "Superb! You've gone through Letters M, N, O, P, Q, and R. Let's do a quick recap:\n\n• Letter M: Dots 1, 3, 4\n• Letter N: Dots 1, 3, 4, 5\n• Letter O: Dots 1, 3, 5\n• Letter P: Dots 1, 2, 3, 4\n• Letter Q: Dots 1, 2, 3, 4, 5\n• Letter R: Dots 1, 2, 3, 5\n\nClick 'Finish Lesson' below to complete this section and earn your rewards!"
    }
  ],
  "4": [
    {
      id: 1,
      type: "intro",
      title: "Introduction",
      description: "Welcome to Lesson 4. In this lesson, we will focus on learning Letters S, T, U, V, W, X, Y, and Z in English Braille. We will inspect their cell structures, practice with interactive visualization grids, and test our skills with quick checks."
    },
    {
      id: 2,
      type: "letter",
      letter: "S",
      braille: "⠎",
      dots: [2, 3, 4],
      words: ["SUN", "SAD", "SOAP"],
      description: "The letter S is formed using dots 2, 3, and 4. Dot 2 is middle-left, dot 3 is bottom-left, and dot 4 is top-right.",
      tip: "💡 Tip: An upward diagonal from bottom-left to top-right.",
      check: {
        question: "Which dot pattern represents the letter S?",
        options: ["Dots 1, 2, 3", "Dots 2, 3, 4", "Dots 2, 4, 5", "Dots 1, 4"],
        correctIdx: 1
      }
    },
    {
      id: 3,
      type: "letter",
      letter: "T",
      braille: "⠞",
      dots: [2, 3, 4, 5],
      words: ["TAP", "TOY", "TEN"],
      description: "The letter T is formed using dots 2, 3, 4, and 5. Dot 2 is middle-left, dot 3 is bottom-left, dot 4 is top-right, and dot 5 is middle-right.",
      tip: "💡 Tip: Similar to letter S but adds dot 5 in the middle right.",
      check: {
        question: "Which dot pattern represents the letter T?",
        options: ["Dots 2, 3, 4, 5", "Dots 2, 3, 5", "Dots 1, 2, 3, 4", "Dots 1, 4, 5"],
        correctIdx: 0
      }
    },
    {
      id: 4,
      type: "letter",
      letter: "U",
      braille: "⠥",
      dots: [1, 3, 6],
      words: ["URN", "USE", "UP"],
      description: "The letter U is formed using dots 1, 3, and 6. Dot 1 is top-left, dot 3 is bottom-left, and dot 6 is bottom-right.",
      tip: "💡 Tip: Think of a cup shape at the bottom of the cell.",
      check: {
        question: "Which dot pattern represents the letter U?",
        options: ["Dots 1, 3", "Dots 1, 3, 6", "Dots 1, 5, 6", "Dots 1, 4, 6"],
        correctIdx: 1
      }
    },
    {
      id: 5,
      type: "letter",
      letter: "V",
      braille: "⠧",
      dots: [1, 2, 3, 6],
      words: ["VAN", "VET", "VOW"],
      description: "The letter V is formed using dots 1, 2, 3, and 6. It has a vertical column on the left and a bottom-right dot.",
      tip: "💡 Tip: Similar to letter L but adds dot 6 at the bottom right.",
      check: {
        question: "Which dot pattern represents the letter V?",
        options: ["Dots 1, 2, 3", "Dots 1, 2, 3, 6", "Dots 1, 3, 6", "Dots 2, 3, 4, 6"],
        correctIdx: 1
      }
    },
    {
      id: 6,
      type: "letter",
      letter: "W",
      braille: "⠺",
      dots: [2, 4, 5, 6],
      words: ["WET", "WIG", "WIN"],
      description: "The letter W is formed using dots 2, 4, 5, and 6. Note that W does not follow the standard French pattern because W was not in the French alphabet originally.",
      tip: "💡 Tip: Think of a backward 'J' or an asymmetric right-side focus.",
      check: {
        question: "Which dot pattern represents the letter W?",
        options: ["Dots 2, 4, 5, 6", "Dots 2, 4, 5", "Dots 1, 2, 4, 5", "Dots 2, 5, 6"],
        correctIdx: 0
      }
    },
    {
      id: 7,
      type: "letter",
      letter: "X",
      braille: "⠭",
      dots: [1, 3, 4, 6],
      words: ["BOX", "FOX", "AXE"],
      description: "The letter X is formed using dots 1, 3, 4, and 6. Dot 1 is top-left, dot 3 is bottom-left, dot 4 is top-right, and dot 6 is bottom-right.",
      tip: "💡 Tip: Imagine a cross or frame containing the four corners of the cell.",
      check: {
        question: "Which dot pattern represents the letter X?",
        options: ["Dots 1, 3, 4", "Dots 1, 3, 4, 6", "Dots 1, 4, 6", "Dots 1, 3, 5, 6"],
        correctIdx: 1
      }
    },
    {
      id: 8,
      type: "letter",
      letter: "Y",
      braille: "⠽",
      dots: [1, 3, 4, 5, 6],
      words: ["YAK", "YES", "TOY"],
      description: "The letter Y is formed using dots 1, 3, 4, 5, and 6. It fills almost all dots except dot 2.",
      tip: "💡 Tip: Similar to letter X but adds dot 5 in the middle right.",
      check: {
        question: "Which dot pattern represents the letter Y?",
        options: ["Dots 1, 3, 4, 5, 6", "Dots 1, 3, 4, 6", "Dots 1, 3, 5, 6", "Dots 2, 3, 4, 5, 6"],
        correctIdx: 0
      }
    },
    {
      id: 9,
      type: "letter",
      letter: "Z",
      braille: "⠵",
      dots: [1, 3, 5, 6],
      words: ["ZOO", "ZIP", "ZAP"],
      description: "The letter Z is formed using dots 1, 3, 5, and 6. Dot 1 is top-left, dot 3 is bottom-left, dot 5 is middle-right, and dot 6 is bottom-right.",
      tip: "💡 Tip: It skips dot 2 and dot 4, forming a zig-zag alignment.",
      check: {
        question: "Which dot pattern represents the letter Z?",
        options: ["Dots 1, 3, 5", "Dots 1, 3, 5, 6", "Dots 1, 3, 6", "Dots 1, 4, 5, 6"],
        correctIdx: 1
      }
    },
    {
      id: 10,
      type: "review",
      title: "Quick Review",
      description: "Superb! You've gone through Letters S, T, U, V, W, X, Y, and Z. Let's do a quick recap:\n\n• Letter S: Dots 2, 3, 4\n• Letter T: Dots 2, 3, 4, 5\n• Letter U: Dots 1, 3, 6\n• Letter V: Dots 1, 2, 3, 6\n• Letter W: Dots 2, 4, 5, 6\n• Letter X: Dots 1, 3, 4, 6\n• Letter Y: Dots 1, 3, 4, 5, 6\n• Letter Z: Dots 1, 3, 5, 6\n\nClick 'Finish Lesson' below to complete this section and earn your rewards!"
    }
  ]
};

// Default fallback lesson structure
const DEFAULT_STEPS = [
  { id: 1, type: "intro", title: "Introduction", description: "This is a custom Braille learning lesson page." },
  { id: 2, type: "review", title: "Review", description: "Review lesson completed." }
];

// ==========================================
// SUB-COMPONENTS (LESSON PLAYER ENGINE)
// ==========================================

const LessonHeader = ({ lessonId, currentStepTitle }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span className="welcome-title-desc">Lesson {lessonId}</span>
      <h1 className="header-welcome" style={{ fontSize: '26px' }}>{currentStepTitle}</h1>
    </div>
  );
};

const LessonProgress = ({ currentStep, totalSteps }) => {
  const percent = Math.round((currentStep / totalSteps) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0 20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{percent}%</span>
      </div>
      <div className="progress-bar-track" style={{ height: '8px' }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Current lesson progression bar"
        />
      </div>
    </div>
  );
};

const BrailleCell = ({ activeDots = [] }) => {
  const dots = [1, 4, 2, 5, 3, 6];

  return (
    <div style={{ textAlign: 'center' }}>
      <span className="level-meta-label" style={{ display: 'block', marginBottom: '12px' }}>Braille Visualization</span>
      <div className="braille-cell-grid" aria-label="Interactive 6-dot Braille cell representation">
        {dots.map((dotNum) => {
          const isActive = activeDots.includes(dotNum);
          return (
            <div
              key={dotNum}
              className={`braille-dot ${isActive ? 'active' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
};

const LetterCard = ({ step }) => {
  return (
    <div className="sidebar-summary-card" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="section-title" style={{ margin: '0', fontSize: '24px' }}>Letter {step.letter}</h2>
        <span style={{ fontSize: '32px', color: '#60A5FA', fontWeight: '700' }}>{step.braille}</span>
      </div>
      <p style={{ color: '#E2E8F0', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
        {step.description}
      </p>
      <div style={{ fontSize: '14px', marginBottom: '20px', color: '#94A3B8' }}>
        Dots: {step.dots.join(', ')}
      </div>

      {/* Example Words */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="level-meta-label">Example Words</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          {step.words.map((w, idx) => (
            <span
              key={idx}
              className="example-word-chip"
            >
              {w}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const KnowledgeCheck = ({ check, questionKey, letter, dots }) => {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    setSelectedIdx(null);
    setIsAnswered(false);
  }, [questionKey]);

  if (!check) return null;

  const handleOptionClick = (idx) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    
    const isCorrect = idx === check.correctIdx;
    voiceGuidance.gradeAnswer(isCorrect, letter, dots, check.options[check.correctIdx]);
  };

  const isCorrect = selectedIdx === check.correctIdx;

  return (
    <div className="knowledge-check-card">
      <h3 className="check-question">💡 Quick Check: {check.question}</h3>
      <div className="check-options-grid">
        {check.options.map((opt, idx) => {
          let btnClass = "";
          if (isAnswered) {
            if (idx === check.correctIdx) btnClass = "correct";
            else if (idx === selectedIdx) btnClass = "wrong";
          }
          return (
            <button
              key={idx}
              type="button"
              className={`check-option-btn ${btnClass}`}
              onClick={() => handleOptionClick(idx)}
              disabled={isAnswered}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className={`check-feedback-banner ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? "Correct! Excellent mastery." : "Try Again on the next review!"}
        </div>
      )}
    </div>
  );
};

const TipCard = ({ tipText }) => {
  if (!tipText) return null;
  return (
    <div className="learning-tip-card">
      <span className="tip-emoji" style={{ fontSize: '24px' }} aria-hidden="true">💡</span>
      <p className="tip-text">{tipText}</p>
    </div>
  );
};

const VoiceGuidance = () => {
  return (
    <button
      type="button"
      className="voice-guidance-btn"
      onClick={() => alert("Auditory voice support will read letters and explanations aloud in future updates.")}
      aria-label="Toggle voice guidance assistance"
    >
      <svg className="voice-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
      </svg>
      <span>🔊 Read Aloud</span>
    </button>
  );
};

const LessonSidebar = ({ currentStepIdx, steps, lessonId }) => {
  const letterSteps = steps.filter(s => s.type === 'letter');

  return (
    <section className="sidebar-summary-card" aria-label="Lesson metadata summary panel">
      <h2 className="section-title">Lesson Info</h2>
      <div className="summary-stats-list" style={{ marginTop: '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#94A3B8' }}>Lesson:</span>
            <span style={{ color: '#FFFFFF', fontWeight: '700' }}>Lesson {lessonId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#94A3B8' }}>Difficulty:</span>
            <span style={{ color: '#34D399', fontWeight: '700' }}>Beginner</span>
          </div>
        </div>

        <h3 className="level-meta-label" style={{ marginBottom: '8px' }}>Lesson Objectives</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {letterSteps.map((step) => {
            const globalIdx = steps.findIndex(s => s.id === step.id);
            const isCompleted = currentStepIdx > globalIdx;
            const isActive = currentStepIdx === globalIdx;

            return (
              <div
                key={step.id}
                className={`objective-sidebar-item ${isActive ? 'active' : ''}`}
              >
                <span className={`objective-icon ${isCompleted ? 'checked' : ''}`}>
                  {isCompleted ? '✔' : '•'}
                </span>
                <span>Learn Letter {step.letter}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const BottomNavigation = ({ onPrev, onNext, onSave, onFinish, isFirst, isLast }) => {
  return (
    <div className="lesson-bottom-nav">
      <div className="bottom-nav-left">
        <button
          type="button"
          className="nav-btn"
          onClick={onPrev}
          disabled={isFirst}
          style={{ opacity: isFirst ? 0.4 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>
      </div>

      <div className="bottom-nav-right">
        <button
          id="save-progress-btn"
          type="button"
          className="nav-btn"
          onClick={onSave}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Save Progress
        </button>

        {isLast ? (
          <button
            type="button"
            className="nav-btn btn-primary"
            onClick={onFinish}
            style={{ minWidth: '140px' }}
          >
            Finish Lesson
          </button>
        ) : (
          <button
            type="button"
            className="nav-btn btn-primary"
            onClick={onNext}
            style={{ minWidth: '100px' }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

const LessonComplete = ({ onContinue }) => {
  return (
    <div className="lesson-complete-overlay">
      <div className="lesson-complete-card">
        <span style={{ fontSize: '64px', display: 'block', marginBottom: '20px' }} aria-hidden="true">🎉</span>
        <h1 className="complete-title-celebrate">Lesson Complete!</h1>
        <p className="complete-desc-info">Great job! You mastered Letters D, E, and F.</p>

        <div className="complete-rewards-row">
          <div className="reward-stat-box">
            <span className="reward-stat-icon" aria-hidden="true">🔥</span>
            <span className="reward-stat-val">+100 XP</span>
            <span className="reward-stat-label">Experience Points</span>
          </div>
          <div className="reward-stat-box">
            <span className="reward-stat-icon" aria-hidden="true">🏆</span>
            <span className="reward-stat-val">Letter Explorer</span>
            <span className="reward-stat-label">New Badge Earned</span>
          </div>
        </div>

        <button
          type="button"
          className="nav-btn btn-primary"
          onClick={onContinue}
          style={{ minWidth: '220px', padding: '16px 36px', fontSize: '16px' }}
        >
          Continue to Practice
        </button>
      </div>
    </div>
  );
};

// ==========================================
// MAIN INTERACTIVE LESSON PLAYER
// ==========================================

const LessonPlayer = () => {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  // Removed isFinished state; navigation handled via quiz route
  const [fade, setFade] = useState(false);

  const steps = LESSONS_CONTENT[lessonId] || DEFAULT_STEPS;
  const currentStep = steps[currentStepIdx] || steps[0];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  // Restore step position and start lesson on lesson change
  useEffect(() => {
    // Use getState() so migration/validation runs first before reading step
    const state = learningProgress.getState();
    let savedStep = 0;
    if (state.lessons[lessonId] && state.lessons[lessonId].lastStepIdx !== undefined) {
      savedStep = state.lessons[lessonId].lastStepIdx;
    }
    if (savedStep >= steps.length) savedStep = 0;
    setCurrentStepIdx(savedStep);
    // Mark this as the active lesson for resume tracking
    localStorage.setItem('lastActiveLessonId', lessonId);
    // Transition state from NOT_STARTED → IN_PROGRESS (idempotent)
    learningProgress.startLesson(lessonId);
  }, [lessonId, steps.length]);

  // Save step index every time it changes (auto-save, no manual button needed)
  useEffect(() => {
    if (lessonId) {
      learningProgress.saveLessonStep(lessonId, currentStepIdx);
    }
  }, [currentStepIdx, lessonId]);

  useEffect(() => {
    setFade(true);
    const timer = setTimeout(() => setFade(false), 300);
    
    // Trigger automated tutor & physical tactile cell
    if (currentStep) {
      if (currentStep.type === 'intro' || currentStep.type === 'review') {
        voiceGuidance.teachLessonIntro(currentStep.title || "Review", currentStep.description);
        hardwareBridge.clearTactileCell();
      } else if (currentStep.type === 'letter') {
        voiceGuidance.teachLetter(currentStep.letter, currentStep.dots);
        hardwareBridge.actuateDots(currentStep.dots);
      }
    }
    
    return () => clearTimeout(timer);
  }, [currentStep]);

  // Lower solenoids when leaving lesson
  useEffect(() => {
    return () => {
      hardwareBridge.clearTactileCell();
    };
  }, []);

  useEffect(() => {
    // For lesson 1, always unlocked; otherwise check unlock status
    if (lessonId !== '1' && !learningProgress.isLessonUnlocked(lessonId)) {
      navigate('/learn');
    }
  }, [lessonId, navigate]);

  if (!user) return null;

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleSaveProgress = () => {
    // Progress is already saved automatically on every step change.
    // This is kept as a user-facing feedback button.
    if (lessonId) {
      learningProgress.saveLessonStep(lessonId, currentStepIdx);
    }
    // Brief visual confirmation without blocking alert
    const btn = document.getElementById('save-progress-btn');
    if (btn) {
      const original = btn.textContent;
      btn.textContent = '✓ Saved!';
      setTimeout(() => { btn.textContent = original; }, 1200);
    }
  };

  const handleFinish = () => {
    // Mark lesson content as completed before heading to quiz
    learningProgress.completeLessonContent(lessonId);
    navigate(`/learn/${lessonId}/quiz`);
  };

  const handleContinue = () => {
    navigate('/learn');
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="learn" />

      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <LessonHeader 
              lessonId={lessonId} 
              currentStepTitle={
                currentStep.title || 
                (currentStep.type === 'letter' ? `Letter ${currentStep.letter}` : `Lesson ${lessonId}`)
              } 
            />
          </div>
          <div className="header-right">
            <VoiceGuidance />
          </div>
        </header>

        <div className="lesson-player-workspace">
          <main className={`learn-content ${fade ? 'fade-in' : ''}`} style={{ marginTop: '20px' }}>
            <LessonProgress currentStep={currentStepIdx + 1} totalSteps={steps.length} />

            <div className="learn-main-grid" style={{ marginTop: '10px' }}>
              <div className="learn-left-column">
                {currentStep.type === 'intro' && (
                  <div className="sidebar-summary-card" style={{ padding: '34px' }}>
                    <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '14px' }}>Alphabet Fundamentals</h2>
                    <p style={{ color: '#E2E8F0', fontSize: '15px', lineHeight: '1.6', margin: '0' }}>
                      {currentStep.description}
                    </p>
                  </div>
                )}

                {currentStep.type === 'letter' && (
                  <>
                    <LetterCard step={currentStep} />
                    <TipCard tipText={currentStep.tip} />
                    <KnowledgeCheck
                      check={currentStep.check}
                      questionKey={currentStep.id}
                      letter={currentStep.letter}
                      dots={currentStep.dots}
                    />
                  </>
                )}

                {currentStep.type === 'review' && (
                  <div className="sidebar-summary-card" style={{ padding: '34px' }}>
                    <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '14px' }}>Review & Complete</h2>
                    <p style={{ color: '#E2E8F0', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-line', margin: '0' }}>
                      {currentStep.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="learn-right-column">
                <BrailleCell activeDots={currentStep.dots || []} />
                <LessonSidebar
                  currentStepIdx={currentStepIdx}
                  steps={steps}
                  lessonId={lessonId}
                />
              </div>
            </div>
          </main>

          <BottomNavigation
            onPrev={handlePrev}
            onNext={handleNext}
            onSave={handleSaveProgress}
            onFinish={handleFinish}
            isFirst={currentStepIdx === 0}
            isLast={currentStepIdx === steps.length - 1}
          />
        </div>
      </div>

      {/* LessonComplete overlay now shown after passing quiz on result page */}
    </div>
  );
};

export default LessonPlayer;
