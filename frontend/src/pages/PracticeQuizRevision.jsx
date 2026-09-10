// src/pages/PracticeQuizRevision.jsx
// READ-ONLY revision practice quiz. NEVER writes to learningProgress.
// Reads only MASTERED lesson letters to build question pool.
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress from '../utils/learningProgress';
import voiceGuidance from '../utils/voiceGuidance';
import { generatePracticeSession, BRAILLE_MAP } from '../data/practiceQuizData';
import './Learn.css';

// ── Braille cell renderer ──────────────────────────────────────────────────────
const BrailleCell = ({ dots = [], label = '' }) => {
  // Standard 6-dot layout: left col = 1,2,3 / right col = 4,5,6
  const DOT_POSITIONS = [1, 4, 2, 5, 3, 6];
  return (
    <div style={{ textAlign: 'center' }}>
      {label && <span className="level-meta-label" style={{ display: 'block', marginBottom: '10px' }}>{label}</span>}
      <div className="braille-cell-grid" aria-label="Braille dot pattern">
        {DOT_POSITIONS.map(d => (
          <div key={d} className={`braille-dot ${dots.includes(d) ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
};

// ── No mastered lessons screen ─────────────────────────────────────────────────
const NoMasteredLessons = () => (
  <div className="dashboard-layout">
    <Sidebar activeTab="quiz" />
    <div className="dashboard-workspace">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="welcome-title-desc">BrailleWise</span>
          <h1 className="header-welcome" style={{ fontSize: '26px' }}>Practice Quiz</h1>
        </div>
      </header>
      <main className="learn-content" style={{ marginTop: '40px' }}>
        <div className="sidebar-summary-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h2 className="section-title" style={{ marginBottom: '16px' }}>Practice Quiz Locked</h2>
          <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.7', margin: '0' }}>
            No mastered letters available for practice yet.<br /><br />
            Practice Quiz unlocks automatically after you master your first letters.
          </p>
        </div>
      </main>
    </div>
  </div>
);

// ── Practice home (lobby) screen ───────────────────────────────────────────────
const PracticeHome = ({ knownLetters, knownWords, onStart, navigate }) => {
  const masteredCount = knownLetters.length;
  const totalAlphabet = 26;

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="quiz" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">BrailleWise</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Practice Quiz</h1>
            <p className="welcome-title-desc" style={{ marginTop: '4px', textTransform: 'none', fontSize: '13px', color: '#93C5FD', fontWeight: '500' }}>
              Revision mode — no progress will be affected.
            </p>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          <div className="learn-main-grid">
            {/* Left: session info */}
            <div className="learn-left-column">
              <section className="learn-featured-card" style={{ cursor: 'default' }}>
                <div className="learning-details">
                  <div className="learning-details-header">
                    <div className="learning-icon-box" aria-hidden="true">🔄</div>
                    <span className="learning-tag">Revision Session</span>
                    <span className="learning-diff-badge">Read Only</span>
                  </div>
                  <h2 className="learning-title">Revise Your Mastered Letters</h2>
                  <p className="learning-progress-label">
                    {masteredCount} / {totalAlphabet} letters available for practice
                  </p>
                  <div className="progress-bar-track" style={{ height: '8px', marginBottom: '10px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.round((masteredCount / totalAlphabet) * 100)}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round((masteredCount / totalAlphabet) * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <p className="learning-estimate">
                    This session will NOT affect your mastery streaks or lesson progress.
                  </p>
                </div>
                <div className="resume-btn-wrapper">
                  <button type="button" className="resume-btn" onClick={onStart}>
                    <span>Start Practice</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </button>
                </div>
              </section>

              {/* Known letters display */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="section-title" style={{ marginBottom: '14px', fontSize: '16px' }}>Available Letter Pool</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {knownLetters.map(l => (
                    <span key={l} style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.3)',
                      color: '#34D399', fontWeight: '700', fontSize: '14px'
                    }}>
                      {l}
                    </span>
                  ))}
                </div>
                <p style={{ marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
                  {knownWords.length} practice words available from these letters.
                </p>
              </div>
            </div>

            {/* Right: session details */}
            <div className="learn-right-column">
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '16px' }}>Session Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  {[
                    { label: 'Questions', value: '10 questions' },
                    { label: 'Question types', value: '5 types mixed' },
                    { label: 'Letters in pool', value: `${knownLetters.length} letters` },
                    { label: 'Words available', value: `${knownWords.length} words` },
                    { label: 'Affects mastery?', value: 'No — read only' },
                    { label: 'Affects streaks?', value: 'No — read only' },
                    { label: 'Affects unlocks?', value: 'No — read only' }
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94A3B8' }}>{label}</span>
                      <span style={{
                        color: value.startsWith('No') ? '#34D399' : '#FFFFFF',
                        fontWeight: '600'
                      }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-summary-card" style={{ padding: '20px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Question Types</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#94A3B8' }}>
                  {[
                    { icon: '⠿', label: 'Braille → Letter' },
                    { icon: 'A', label: 'Letter → Braille' },
                    { icon: '📖', label: 'Word Recognition' },
                    { icon: '✍️', label: 'Word → Braille' },
                    { icon: '❓', label: 'Missing Letter' }
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ width: '20px', textAlign: 'center', fontWeight: '700', color: '#60A5FA' }}>{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// ── Main quiz screen ───────────────────────────────────────────────────────────
const QuizScreen = ({ questions, navigate }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(Array(questions.length).fill(false));
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const resultRef = useRef(null);

  const q = questions[currentIdx];
  const total = questions.length;
  const percentProgress = Math.round(((currentIdx + 1) / total) * 100);
  const answeredCount = submitted.filter(Boolean).length;

  const handleSelect = (optIdx) => {
    if (submitted[currentIdx]) return;
    const next = [...answers];
    next[currentIdx] = optIdx;
    setAnswers(next);
  };

  useEffect(() => {
    if (questions.length > 0 && !submitted[currentIdx]) {
      const q = questions[currentIdx];
      voiceGuidance.teachQuizQuestion(currentIdx + 1, q.question, q.options);
    }
  }, [currentIdx, questions]);

  const handleSubmit = () => {
    if (answers[currentIdx] === null || answers[currentIdx] === undefined) return;
    const isCorrect = answers[currentIdx] === q.correctIdx;
    
    // Grade answer
    voiceGuidance.gradeAnswer(isCorrect, q.letter, null, q.options[q.correctIdx]);
    
    if (isCorrect) setScore(s => s + 1);
    const next = [...submitted];
    next[currentIdx] = true;
    setSubmitted(next);
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Session complete — build result data, store in sessionStorage (NOT localStorage)
      const finalScore = answers.filter((a, i) => a === questions[i].correctIdx).length;
      const timeSec = Math.round((Date.now() - startTime) / 1000);
      const lettersUsed = [...new Set(questions.map(q => q.letter || (q.word ? q.word[0] : '')).filter(Boolean))];
      const wordsUsed = [...new Set(questions.filter(q => q.word).map(q => q.word))];
      const result = {
        score: finalScore,
        total,
        percent: Math.round((finalScore / total) * 100),
        timeSec,
        lettersUsed,
        wordsUsed,
        questionTypes: [...new Set(questions.map(q => q.type))]
      };
      
      // Add answers for analytics recording
      result.answers = answers;
      learningProgress.recordPracticeSession(result, questions);
      learningProgress.logActivity('practice', `Completed Practice Quiz: ${result.percent}%`, '🔄');

      // Store in sessionStorage only (not localStorage — read-only module)
      sessionStorage.setItem('practiceResult', JSON.stringify(result));
      navigate('/practice/result');
    }
  };

  const isSubmitted = submitted[currentIdx];
  const isCorrect = isSubmitted && answers[currentIdx] === q.correctIdx;
  const brailleDots = q.brailleDots || (q.letter ? BRAILLE_MAP[q.letter]?.dots : null);

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="quiz" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">Practice Quiz — Revision Mode</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Practice Session</h1>
          </div>
          <div className="header-right">
            <span className="header-date" style={{ color: '#34D399', fontWeight: '700' }}>
              Read Only — No progress affected
            </span>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0 20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>
              <span id="practice-quiz-progress">Question {currentIdx + 1} of {total}</span>
              <span style={{ display: 'flex', gap: '16px' }}>
                <span>✓ {score} correct</span>
                <span>{percentProgress}% through</span>
              </span>
            </div>
            <div className="progress-bar-track" style={{ height: '8px' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${percentProgress}%` }}
                role="progressbar"
                aria-valuenow={percentProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Practice session progress"
              />
            </div>
          </div>

          <div className="learn-main-grid">
            {/* Question panel */}
            <div className="learn-left-column">
              <div className="sidebar-summary-card" style={{ padding: '34px' }}>
                {/* Question type badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '4px 10px', borderRadius: '6px',
                    background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', color: '#60A5FA'
                  }}>
                    {{
                      'braille_to_letter': '⠿ Braille → Letter',
                      'letter_to_braille': 'A → Braille',
                      'word_recognition': '📖 Word Recognition',
                      'word_to_braille': '✍️ Word → Braille',
                      'missing_letter': '❓ Missing Letter'
                    }[q.type] || q.type}
                  </span>
                  {q.letter && (
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Letter: <strong style={{ color: '#FFFFFF' }}>{q.letter}</strong></span>
                  )}
                </div>

                {/* Braille display for relevant types */}
                {q.type === 'braille_to_letter' && (
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '72px', lineHeight: 1 }}>{q.brailleDisplay}</span>
                  </div>
                )}
                {q.type === 'word_recognition' && (
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '8px' }}>Braille sequence:</p>
                    <span style={{ fontSize: '48px', letterSpacing: '8px', lineHeight: 1 }}>{q.brailleDisplay}</span>
                  </div>
                )}

                <h2 id="practice-quiz-question" className="section-title" style={{ fontSize: '20px', marginBottom: '24px' }}>
                  {q.question}
                </h2>

                {/* Hint */}
                <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '16px', fontStyle: 'italic' }}>
                  💡 {q.hint}
                </p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt, i) => {
                    const isSelected = answers[currentIdx] === i;
                    const isCorrectOpt = i === q.correctIdx;
                    let style = {
                      textAlign: 'left', padding: '14px 18px', fontSize: '15px',
                      borderRadius: '12px', cursor: isSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.2s ease', width: '100%',
                      fontFamily: (q.type === 'letter_to_braille' || q.type === 'word_to_braille') ? 'inherit' : 'inherit'
                    };
                    if (isSubmitted) {
                      if (isCorrectOpt) {
                        style = { ...style, background: 'rgba(16,185,129,0.15)', border: '2.5px solid #10B981', color: '#A7F3D0' };
                      } else if (isSelected) {
                        style = { ...style, background: 'rgba(239,68,68,0.15)', border: '2.5px solid #EF4444', color: '#FCA5A5' };
                      } else {
                        style = { ...style, background: 'rgba(255,255,255,0.01)', border: '1.5px solid rgba(255,255,255,0.04)', color: '#64748B' };
                      }
                    } else {
                      style = {
                        ...style,
                        background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '2.5px solid #3B82F6' : '1.5px solid rgba(255,255,255,0.08)',
                        color: '#FFFFFF'
                      };
                    }
                    // Braille options use large font
                    const optLabel = (q.type === 'letter_to_braille' || q.type === 'word_to_braille')
                      ? <span style={{ fontSize: '28px' }}>{opt}</span>
                      : opt;
                    return (
                      <button key={i} className="check-option-btn" onClick={() => handleSelect(i)} style={style} disabled={isSubmitted}>
                        {optLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback after submission */}
                {isSubmitted && (
                  <div style={{
                    marginTop: '20px', padding: '14px', borderRadius: '12px',
                    fontSize: '14px', fontWeight: '600',
                    background: isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1.5px solid ${isCorrect ? '#10B981' : '#EF4444'}`,
                    color: isCorrect ? '#34D399' : '#F87171'
                  }}>
                    {isCorrect
                      ? '✓ Correct! Well done.'
                      : `✗ Incorrect. The correct answer was: ${q.options[q.correctIdx]}`}
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748B', fontWeight: '400' }}>
                      Practice mode — your mastery streaks are not affected.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: Braille dot visual + controls */}
            <div className="learn-right-column">
              {/* Braille dot visualization */}
              {brailleDots && brailleDots.length > 0 && (
                <div className="sidebar-summary-card" style={{ padding: '24px', textAlign: 'center' }}>
                  <BrailleCell
                    dots={brailleDots}
                    label={q.type === 'missing_letter' ? `Correct letter: ${q.letter}` : 'Braille Visualization'}
                  />
                  {q.letter && (
                    <p style={{ marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>
                      Letter <strong style={{ color: '#FFFFFF' }}>{q.letter}</strong>
                      {' — '}
                      Dots: {(BRAILLE_MAP[q.letter]?.dots || []).join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Session stats */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Session Stats</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Answered:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{answeredCount} / {total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Correct:</span>
                    <span style={{ color: '#34D399', fontWeight: 'bold' }}>{score}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Incorrect:</span>
                    <span style={{ color: '#F87171', fontWeight: 'bold' }}>{answeredCount - score}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Accuracy:</span>
                    <span style={{ color: '#60A5FA', fontWeight: 'bold' }}>
                      {answeredCount > 0 ? `${Math.round((score / answeredCount) * 100)}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="sidebar-summary-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {!isSubmitted ? (
                  <button
                    className="nav-btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={handleSubmit}
                    disabled={answers[currentIdx] === null || answers[currentIdx] === undefined}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    className="nav-btn btn-primary"
                    style={{ width: '100%', padding: '12px', background: '#10B981', borderColor: '#10B981' }}
                    onClick={handleNext}
                  >
                    {currentIdx < total - 1 ? 'Next Question →' : 'View Results'}
                  </button>
                )}

                <button
                  className="nav-btn"
                  style={{
                    width: '100%', padding: '10px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
                  }}
                  onClick={() => {
                    if (window.confirm('Quit this practice session?')) {
                      navigate('/practice');
                    }
                  }}
                >
                  Quit Practice
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// ── Root component ─────────────────────────────────────────────────────────────
const PracticeQuizRevision = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('home'); // 'home' | 'quiz'
  const [sessionData, setSessionData] = useState(null);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); }
  }, [navigate]);

  if (!user) return null;

  // READ-ONLY: we only read state, never write it
  const progressState = learningProgress.getState();
  const { questions, knownLetters, knownWords } = sessionData ||
    generatePracticeSession(progressState, 10);

  if (knownLetters.length === 0) {
    return <NoMasteredLessons navigate={navigate} />;
  }

  const handleStart = () => {
    // Generate a fresh session on each "Start Practice"
    const fresh = generatePracticeSession(progressState, 10);
    setSessionData(fresh);
    setScreen('quiz');
  };

  if (screen === 'quiz' && sessionData && sessionData.questions.length > 0) {
    return <QuizScreen questions={sessionData.questions} navigate={navigate} />;
  }

  return (
    <PracticeHome
      knownLetters={knownLetters}
      knownWords={knownWords}
      onStart={handleStart}
      navigate={navigate}
    />
  );
};

export default PracticeQuizRevision;
