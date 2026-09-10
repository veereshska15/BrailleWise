import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Assessment.css';

const BRAILLE_DOTS = {
  'A': [1], 'B': [1,2], 'C': [1,4], 'D': [1,4,5], 'E': [1,5], 'F': [1,2,4],
  'G': [1,2,4,5], 'H': [1,2,5], 'I': [2,4], 'J': [2,4,5], 'K': [1,3], 'L': [1,2,3],
  'M': [1,3,4], 'N': [1,3,4,5], 'O': [1,3,5], 'P': [1,2,3,4], 'Q': [1,2,3,4,5], 'R': [1,2,3,5],
  'S': [2,3,4], 'T': [2,3,4,5], 'U': [1,3,6], 'V': [1,2,3,6], 'W': [2,4,5,6],
  'X': [1,3,4,6], 'Y': [1,3,4,5,6], 'Z': [1,3,5,6]
};

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    letter: "A",
    question: "Which dot position represents the letter 'A' in standard English Braille?",
    activeDots: [1],
    options: [
      { key: "A", text: "Dot 1 (Top-left)", dots: "1" },
      { key: "B", text: "Dot 2 (Middle-left)", dots: "2" },
      { key: "C", text: "Dots 1 and 2", dots: "1,2" },
      { key: "D", text: "Dots 1 and 4", dots: "1,4" }
    ]
  },
  {
    id: 2,
    letter: "B",
    question: "What dot configuration represents the letter 'B'?",
    activeDots: [1, 2],
    options: [
      { key: "A", text: "Dots 1 and 2 (Top-left and Middle-left)", dots: "1,2" },
      { key: "B", text: "Dot 1 (Top-left)", dots: "1" },
      { key: "C", text: "Dots 1 and 4 (Top-left and Top-right)", dots: "1,4" },
      { key: "D", text: "Dots 1, 2, and 3", dots: "1,2,3" }
    ]
  },
  {
    id: 3,
    letter: "C",
    question: "How is the letter 'C' represented in Braille?",
    activeDots: [1, 4],
    options: [
      { key: "A", text: "Dots 1 and 4 (Top-left and Top-right)", dots: "1,4" },
      { key: "B", text: "Dots 1 and 3 (Top-left and Bottom-left)", dots: "1,3" },
      { key: "C", text: "Dots 1 and 2", dots: "1,2" },
      { key: "D", text: "Dots 2 and 4", dots: "2,4" }
    ]
  },
  {
    id: 4,
    letter: "D",
    question: "Which dot configuration is used for the letter 'D'?",
    activeDots: [1, 4, 5],
    options: [
      { key: "A", text: "Dots 1, 4, and 5 (Top-left, Top-right, and Middle-right)", dots: "1,4,5" },
      { key: "B", text: "Dots 1, 2, and 4", dots: "1,2,4" },
      { key: "C", text: "Dots 1, 3, and 5", dots: "1,3,5" },
      { key: "D", text: "Dots 1, 2, and 3", dots: "1,2,3" }
    ]
  },
  {
    id: 5,
    letter: "E",
    question: "Which dots make up the character for the letter 'E'?",
    activeDots: [1, 5],
    options: [
      { key: "A", text: "Dots 1 and 5 (Top-left and Middle-right)", dots: "1,5" },
      { key: "B", text: "Dots 1 and 2", dots: "1,2" },
      { key: "C", text: "Dots 1, 3, and 5", dots: "1,3,5" },
      { key: "D", text: "Dots 2 and 4", dots: "2,4" }
    ]
  },
  {
    id: 6,
    letter: "F",
    question: "What dot configuration is used to identify the letter 'F'?",
    activeDots: [1, 2, 4],
    options: [
      { key: "A", text: "Dots 1, 2, and 4 (Top-left, Middle-left, and Top-right)", dots: "1,2,4" },
      { key: "B", text: "Dots 1, 2, and 5", dots: "1,2,5" },
      { key: "C", text: "Dots 1, 3, and 4", dots: "1,3,4" },
      { key: "D", text: "Dots 2, 4, and 5", dots: "2,4,5" }
    ]
  }
];

const Assessment = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Navigation & Answers State
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(Array(DEFAULT_QUESTIONS.length).fill(''));

  // Authenticate session & initialize backend assessment on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    let parsedUser;
    try {
      parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (e) {
      navigate('/login');
      return;
    }

    // Initialize Assessment on backend
    const initAssessment = async () => {
      try {
        const userId = parsedUser.id || parsedUser._id;
        const API = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API}/api/assessment/start/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.current_question) {
          // Keep questions in state
        }
      } catch (err) {
        console.error("Backend assessment init error:", err);
      }
    };
    initAssessment();
  }, [navigate]);

  const handleSelectOption = (optionKey) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = optionKey;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = async () => {
    const currentQ = questions[currentIndex];
    const sel = selectedAnswers[currentIndex];
    const userId = user?.id || user?._id;
    const token = localStorage.getItem('token');

    if (userId && currentQ && sel) {
      try {
        const selectedOption = currentQ.options?.find(o => o.key === sel);
        const submissionAnswer = selectedOption?.dots || sel;
        const API = import.meta.env.VITE_API_URL || '';
        await fetch(`${API}/api/assessment/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: userId,
            question_id: currentQ.letter || currentQ.id.toString(),
            selected_answer: submissionAnswer
          })
        });
      } catch (e) {
        console.error("Error submitting answer to backend:", e);
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finish assessment on backend and save user progress
      let finishData = null;
      if (userId) {
        try {
          const API = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${API}/api/assessment/finish/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          finishData = await res.json();
        } catch (e) {
          console.error("Error finishing assessment:", e);
        }
      }

      if (user) {
        const updatedUser = { 
          ...user, 
          assessment_completed: true, 
          proficiency_level: finishData?.learning_readiness || "Beginner" 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      navigate('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation support for options
  const handleKeyDown = (e, optionKey) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectOption(optionKey);
    }
  };

  const currentQuestion = questions[currentIndex] || DEFAULT_QUESTIONS[0];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const currentSelection = selectedAnswers[currentIndex];

  return (
    <div className="assessment-container" role="main">
      {/* Calm subtle particles background layer matching Welcome style */}
      <div className="particles-layer" aria-hidden="true">
        <div className="particle" style={{ left: '15%', animationDelay: '0s', animationDuration: '24s', width: '5px', height: '5px' }} />
        <div className="particle" style={{ left: '35%', animationDelay: '3s', animationDuration: '32s', width: '6px', height: '6px' }} />
        <div className="particle" style={{ left: '60%', animationDelay: '1.5s', animationDuration: '28s', width: '4px', height: '4px' }} />
        <div className="particle" style={{ left: '82%', animationDelay: '5s', animationDuration: '36s', width: '7px', height: '7px' }} />
      </div>

      <div className="assessment-card-wrapper">
        <div className="assessment-card">
          
          {/* Logo Section */}
          <div className="logo-container" aria-hidden="true">
            <svg className="braille-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" className="logo-hexagon" />
              <line x1="30" y1="20" x2="30" y2="50" className="logo-connection" />
              <line x1="30" y1="50" x2="30" y2="80" className="logo-connection" />
              <line x1="30" y1="20" x2="70" y2="20" className="logo-connection" />
              <line x1="30" y1="50" x2="70" y2="50" className="logo-connection" />
              <line x1="30" y1="80" x2="70" y2="80" className="logo-connection" />
              <line x1="70" y1="20" x2="70" y2="50" className="logo-connection" />
              <line x1="70" y1="50" x2="70" y2="80" className="logo-connection" />

              <circle cx="30" cy="20" r="8" className="logo-dot logo-dot-active" />
              <circle cx="30" cy="50" r="8" className="logo-dot logo-dot-active logo-dot-delay-1" />
              <circle cx="30" cy="80" r="8" className="logo-dot logo-dot-inactive" />
              <circle cx="70" cy="20" r="8" className="logo-dot logo-dot-active logo-dot-delay-1" />
              <circle cx="70" cy="50" r="8" className="logo-dot logo-dot-inactive" />
              <circle cx="70" cy="80" r="8" className="logo-dot logo-dot-active logo-dot-delay-2" />
            </svg>
          </div>

            <>
              {/* Header Texts */}
              <h1 className="assessment-title">Initial Braille Assessment</h1>
              <p className="assessment-subtitle">
                This short assessment helps us understand your current Braille knowledge so we can personalize your learning experience.
              </p>

              {/* Progress System */}
              <div className="progress-section" aria-live="polite">
                <div className="progress-label-row">
                  <span className="progress-question-indicator">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="progress-step-indicator">
                    Step {currentIndex + 1} / {questions.length}
                  </span>
                  <span className="progress-percent-indicator">
                    {Math.round(progressPercent)}% Complete
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={currentIndex + 1}
                    aria-valuemin="1"
                    aria-valuemax={questions.length}
                    aria-label="Assessment progress"
                  />
                </div>
              </div>

              {/* Visual Braille Cell Preview rendering 6 dots */}
              <div className="braille-cell-preview" aria-label="Visual configuration of Braille dots for this question">
                {[1, 4, 2, 5, 3, 6].map((dotNum) => (
                  <div 
                    key={dotNum} 
                    className={`braille-dot ${(currentQuestion.activeDots || BRAILLE_DOTS[currentQuestion.letter] || [1]).includes(dotNum) ? 'active' : ''}`} 
                  />
                ))}
              </div>

              {/* Question Text */}
              <div className="question-display-area">
                <h2 className="question-text">{currentQuestion.question}</h2>
              </div>

              {/* Options Grid */}
              <div className="options-grid" role="radiogroup" aria-label="Answer options">
                {currentQuestion.options.map((option) => {
                  const isSelected = currentSelection === option.key;
                  return (
                    <div
                      key={option.key}
                      className={`option-card ${isSelected ? 'option-selected' : ''}`}
                      onClick={() => handleSelectOption(option.key)}
                      onKeyDown={(e) => handleKeyDown(e, option.key)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      <div className="option-indicator-circle">
                        {isSelected && <div className="option-indicator-inner" />}
                      </div>
                      <span className="option-text-content">{option.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="navigation-controls">
                <button
                  type="button"
                  className="nav-btn btn-secondary"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  aria-label="Go to the previous question"
                >
                  Previous
                </button>

                {/* Voice Guidance Microphone/Speaker Icon Premium Button */}
                <button
                  type="button"
                  className="voice-guidance-btn"
                  aria-label="Toggle voice guidance"
                  onClick={() => alert("Auditory voice guidance active.")}
                >
                  <svg className="voice-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
                  </svg>
                  <span>Voice Guidance</span>
                </button>

                <button
                  type="button"
                  className="nav-btn btn-primary"
                  onClick={handleNext}
                  disabled={!currentSelection}
                  aria-label={currentIndex === questions.length - 1 ? "Finish assessment" : "Go to the next question"}
                >
                  {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </>

        </div>
      </div>
    </div>
  );
};

export default Assessment;

