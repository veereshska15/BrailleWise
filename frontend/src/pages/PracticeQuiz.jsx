// src/pages/PracticeQuiz.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getQuizQuestions } from '../data/quizData';
import { recordQuizSubmission, recordQuestionAnswer, getLetterStreak, getUnmasteredLetters } from '../utils/learningProgress';
import voiceGuidance from '../utils/voiceGuidance';
import hardwareBridge from '../utils/hardwareBridge';
import './Learn.css';

const BrailleCell = ({ activeDots = [] }) => {
  const dots = [1, 4, 2, 5, 3, 6];
  return (
    <div style={{ textAlign: 'center' }}>
      <span className="level-meta-label" style={{ display: 'block', marginBottom: '12px' }}>Braille Visualization</span>
      <div className="braille-cell-grid" aria-label="Interactive 6-dot Braille cell representation">
        {dots.map((dotNum) => {
          const isActive = activeDots.includes(dotNum);
          return <div key={dotNum} className={`braille-dot ${isActive ? 'active' : ''}`} />;
        })}
      </div>
    </div>
  );
};

const BRAILLE_DOTS = {
  'A': [1], 'B': [1,2], 'C': [1,4], 'D': [1,4,5], 'E': [1,5], 'F': [1,2,4],
  'G': [1,2,4,5], 'H': [1,2,5], 'I': [2,4], 'J': [2,4,5], 'K': [1,3], 'L': [1,2,3],
  'M': [1,3,4], 'N': [1,3,4,5], 'O': [1,3,5], 'P': [1,2,3,4], 'Q': [1,2,3,4,5], 'R': [1,2,3,5],
  'S': [2,3,4], 'T': [2,3,4,5], 'U': [1,3,6], 'V': [1,2,3,6], 'W': [2,4,5,6],
  'X': [1,3,4,6], 'Y': [1,3,4,5,6], 'Z': [1,3,5,6]
};

const getActiveDots = (letter) => BRAILLE_DOTS[letter?.toUpperCase()] || [];

const PracticeQuiz = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Quiz content
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // answers[i] = option index the user selected for question i (null = not selected yet)
  const [answers, setAnswers] = useState([]);
  // submittedAnswers[i] = true after "Submit Answer" is clicked for question i
  const [submittedAnswers, setSubmittedAnswers] = useState([]);

  // streakChanges[i] = { letter, prevStreak, newStreak, isCorrect } — captured on submission
  const [streakChanges, setStreakChanges] = useState([]);

  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); }
  }, [navigate]);

  useEffect(() => {
    const qList = getQuizQuestions(lessonId);
    setQuestions(qList);
    setAnswers(Array(qList.length).fill(null));
    setSubmittedAnswers(Array(qList.length).fill(false));
    setStreakChanges(Array(qList.length).fill(null));
    setCurrentIdx(0);
    setScore(0);
    setStartTime(Date.now());
  }, [lessonId]);

  useEffect(() => {
    if (questions.length > 0 && !submittedAnswers[currentIdx]) {
      const q = questions[currentIdx];
      voiceGuidance.teachQuizQuestion(currentIdx + 1, q.question, q.options);

      // Actuate ESP32 physical Braille solenoids
      const targetChar = q.brailleVis || q.letter;
      if (targetChar) {
        hardwareBridge.actuateLetter(targetChar);
      }
    }
  }, [currentIdx, questions]);

  // Lower solenoids when leaving quiz
  useEffect(() => {
    return () => {
      hardwareBridge.clearTactileCell();
    };
  }, []);

  if (!user) return null;

  const total = questions.length;

  // All letters already mastered — redirect immediately
  if (total === 0) {
    return (
      <div className="dashboard-layout">
        <Sidebar activeTab="learn" />
        <div className="dashboard-workspace">
          <div className="learn-content" style={{ marginTop: '40px', alignItems: 'center' }}>
            <div className="sidebar-summary-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
              <h2 className="section-title">All Letters Mastered!</h2>
              <p style={{ color: '#E2E8F0', margin: '20px 0' }}>
                You have already mastered all the letters in this lesson.
              </p>
              <button
                className="nav-btn btn-primary"
                onClick={() => navigate(`/learn/lesson/${lessonId}/complete`)}
              >
                View Lesson Completion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSelect = (optionIdx) => {
    if (submittedAnswers[currentIdx]) return;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  const goPrev = () => {
    if (currentIdx > 0 && !submittedAnswers[currentIdx]) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitAnswer = () => {
    const selectedIdx = answers[currentIdx];
    if (selectedIdx === null || selectedIdx === undefined) return;

    const q = questions[currentIdx];
    const isCorrect = selectedIdx === q.correctIdx;

    voiceGuidance.gradeAnswer(isCorrect, q.letter, null, q.options[q.correctIdx]);

    if (isCorrect) setScore(prev => prev + 1);

    // Capture streak BEFORE update, then apply update
    // recordQuestionAnswer returns { prevStreak, newStreak, isCorrect, isMastered }
    const streakResult = recordQuestionAnswer(lessonId, q.letter, isCorrect);

    // Store streak change for this question (for the result page)
    const newStreakChanges = [...streakChanges];
    newStreakChanges[currentIdx] = {
      letter: q.letter,
      prevStreak: streakResult.prevStreak,
      newStreak: streakResult.newStreak,
      isCorrect
    };
    setStreakChanges(newStreakChanges);

    const newSubmitted = [...submittedAnswers];
    newSubmitted[currentIdx] = true;
    setSubmittedAnswers(newSubmitted);
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // End of current practice round: compute round results
      const finalScore = answers.reduce((acc, selectedIdx, i) => {
        return acc + (selectedIdx === questions[i]?.correctIdx ? 1 : 0);
      }, 0);
      const timeSec = Math.round((Date.now() - startTime) / 1000);

      recordQuizSubmission(
        lessonId,
        finalScore,
        questions.length,
        timeSec,
        [...answers],
        questions,
        [...streakChanges]
      );

      const unmastered = getUnmasteredLetters(lessonId);
      if (unmastered.length === 0) {
        // All letters 5/5 mastered -> final celebration screen
        navigate(`/learn/lesson/${lessonId}/complete`);
      } else {
        // Intermediate progress summary screen
        navigate(`/learn/${lessonId}/quiz/result`);
      }
    }
  };

  const q = questions[currentIdx];
  const unmasteredCount = getUnmasteredLetters(lessonId).length;
  const isAllMastered = unmasteredCount === 0;
  const percentProgress = total > 0 ? Math.round(((currentIdx + 1) / total) * 100) : 0;
  const currentStreak = q ? getLetterStreak(q.letter) : 0;

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="learn" />

      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">Lesson {lessonId}</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Practice Quiz</h1>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0 20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>
              <span id="practice-quiz-progress">Question {currentIdx + 1} of {total}</span>
              <span>{percentProgress}% Completed</span>
            </div>
            <div className="progress-bar-track" style={{ height: '8px' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${percentProgress}%` }}
                role="progressbar"
                aria-valuenow={percentProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Quiz progression bar"
              />
            </div>
          </div>

          <div className="learn-main-grid">
            <div className="learn-left-column">
              <div className="sidebar-summary-card" style={{ padding: '34px' }}>
                {/* Show current streak for this letter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>
                    Letter {q.letter} — Streak before answer
                  </span>
                  <span style={{
                    fontSize: '13px', fontWeight: '700',
                    color: currentStreak >= 5 ? '#34D399' : currentStreak >= 3 ? '#60A5FA' : '#F59E0B',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '4px 10px', borderRadius: '8px'
                  }}>
                    {currentStreak}/5 {currentStreak >= 5 ? '✓' : ''}
                  </span>
                </div>

                <h2 id="practice-quiz-question" className="section-title" style={{ fontSize: '22px', marginBottom: '24px' }}>
                  {q.question}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {q.options.map((opt, i) => {
                    const isSelected = answers[currentIdx] === i;
                    const isSubmitted = submittedAnswers[currentIdx];
                    const isCorrectOption = i === q.correctIdx;

                    let optionStyle = {
                      textAlign: 'left', padding: '16px 20px', fontSize: '15px',
                      borderRadius: '12px', cursor: isSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.2s ease', width: '100%'
                    };

                    if (isSubmitted) {
                      if (isCorrectOption) {
                        optionStyle = { ...optionStyle, background: 'rgba(16,185,129,0.15)', border: '2.5px solid #10B981', color: '#A7F3D0' };
                      } else if (isSelected) {
                        optionStyle = { ...optionStyle, background: 'rgba(239,68,68,0.15)', border: '2.5px solid #EF4444', color: '#FCA5A5' };
                      } else {
                        optionStyle = { ...optionStyle, background: 'rgba(255,255,255,0.01)', border: '1.5px solid rgba(255,255,255,0.04)', color: '#64748B' };
                      }
                    } else {
                      optionStyle = {
                        ...optionStyle,
                        background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '2.5px solid #3B82F6' : '1.5px solid rgba(255,255,255,0.08)',
                        color: '#FFFFFF'
                      };
                    }

                    return (
                      <button
                        key={i}
                        className="check-option-btn"
                        onClick={() => handleSelect(i)}
                        style={optionStyle}
                        disabled={isSubmitted}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback banner shown after submission */}
                {submittedAnswers[currentIdx] && (() => {
                  const change = streakChanges[currentIdx];
                  const isCorrect = answers[currentIdx] === q.correctIdx;
                  return (
                    <div
                      style={{
                        marginTop: '24px', padding: '16px', borderRadius: '12px',
                        fontSize: '14px', fontWeight: '600',
                        background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1.5px solid ${isCorrect ? '#10B981' : '#EF4444'}`,
                        color: isCorrect ? '#34D399' : '#F87171'
                      }}
                    >
                      {isCorrect ? (
                        <>✓ Correct! Streak: {change?.prevStreak || 0} → {change?.newStreak || 0}/5 {change?.newStreak >= 5 ? '🎉 MASTERED!' : ''}</>
                      ) : (
                        <>✗ Incorrect — streak reset to 0/5. Correct: {q.options[q.correctIdx]}</>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="learn-right-column">
              {q.brailleVis && <BrailleCell activeDots={getActiveDots(q.brailleVis)} />}

              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Quiz Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Letters in session:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Correct so far:</span>
                    <span style={{ color: '#34D399', fontWeight: 'bold' }}>{score}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Answered:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                      {submittedAnswers.filter(Boolean).length} / {total}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sidebar-summary-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {!submittedAnswers[currentIdx] ? (
                    <button
                      className="nav-btn btn-primary"
                      style={{ width: '100%', padding: '12px' }}
                      onClick={handleSubmitAnswer}
                      disabled={answers[currentIdx] === null || answers[currentIdx] === undefined}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      className="nav-btn btn-primary"
                      style={{ width: '100%', padding: '12px', background: '#10B981', borderColor: '#10B981' }}
                      onClick={handleNextQuestion}
                    >
                      {isAllMastered ? 'View Results 🏆' : 'Next Question ▶'}
                    </button>
                  )}

                  {currentIdx > 0 && !submittedAnswers[currentIdx] && (
                    <button
                      className="nav-btn"
                      style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                      onClick={goPrev}
                    >
                      Previous
                    </button>
                  )}
                </div>
                <button
                  className="nav-btn"
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to quit? Your mastery progress so far is already saved.')) {
                      navigate('/learn');
                    }
                  }}
                >
                  Quit Quiz
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PracticeQuiz;
