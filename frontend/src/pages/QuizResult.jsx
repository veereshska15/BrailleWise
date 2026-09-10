// src/pages/QuizResult.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress, { LESSON_LETTERS, getUnmasteredLetters } from '../utils/learningProgress';
import './Learn.css';

const MASTERY_THRESHOLD = 5;

const QuizResult = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); }
  }, [navigate]);

  if (!user) return null;

  const result = learningProgress.getLastResult(lessonId);

  if (!result) {
    return (
      <div className="dashboard-layout">
        <Sidebar activeTab="learn" />
        <div className="dashboard-workspace">
          <div className="learn-content" style={{ marginTop: '40px', alignItems: 'center' }}>
            <div className="sidebar-summary-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
              <h2 className="section-title" style={{ color: '#EF4444' }}>No Quiz Result Found</h2>
              <p style={{ color: '#E2E8F0', margin: '20px 0' }}>Please complete the practice quiz first to see your results.</p>
              <button className="nav-btn btn-primary" onClick={() => navigate(`/learn/${lessonId}/quiz`)}>
                Go to Practice Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { score, total, percent, timeSec, earned, badgesAwarded, userAnswers, questions, streakChanges } = result;

  // Check current mastery status (reflects post-quiz state)
  const unmasteredLetters = getUnmasteredLetters(lessonId);
  const lessonMastered = learningProgress.getState().lessons[lessonId]?.state === 'MASTERED';
  const state = learningProgress.getState();
  const allLessonLetters = LESSON_LETTERS[lessonId] || [];

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="learn" />

      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">Lesson {lessonId}</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>{lessonMastered ? 'Lesson Completed!' : 'Progress Summary'}</h1>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          <div className="learn-main-grid">
            <div className="learn-left-column">

              {/* ── Summary card ── */}
              <div className="sidebar-summary-card" style={{ padding: '34px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '64px', display: 'block', marginBottom: '16px' }} aria-hidden="true">
                    {lessonMastered ? '🏆' : '💪'}
                  </span>
                  <h2 className="section-title" style={{ fontSize: '28px', color: lessonMastered ? '#34D399' : '#F59E0B' }}>
                    {lessonMastered ? 'Lesson Mastered!' : 'Practice Round Complete!'}
                  </h2>
                  <p style={{ color: '#E2E8F0', fontSize: '15px', marginTop: '8px' }}>
                    {lessonMastered
                      ? 'Every letter reached 5/5 consecutive correct answers. The next lesson is now unlocked!'
                      : unmasteredLetters.length > 0
                        ? `${unmasteredLetters.length} letter${unmasteredLetters.length !== 1 ? 's' : ''} still need consecutive practice: ${unmasteredLetters.join(', ')}`
                        : 'Great progress! Keep studying to reach 5/5 on all letters.'
                    }
                  </p>
                </div>

                <div className="complete-rewards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
                  <div className="reward-stat-box">
                    <span className="reward-stat-icon">🎯</span>
                    <span className="reward-stat-val">{score} / {total}</span>
                    <span className="reward-stat-label">Score</span>
                  </div>
                  <div className="reward-stat-box">
                    <span className="reward-stat-icon">📈</span>
                    <span className="reward-stat-val">{percent}%</span>
                    <span className="reward-stat-label">Accuracy</span>
                  </div>
                  <div className="reward-stat-box">
                    <span className="reward-stat-icon">⚡</span>
                    <span className="reward-stat-val">+{earned} XP</span>
                    <span className="reward-stat-label">XP Gained</span>
                  </div>
                  <div className="reward-stat-box">
                    <span className="reward-stat-icon">⏱️</span>
                    <span className="reward-stat-val">{timeSec}s</span>
                    <span className="reward-stat-label">Time Taken</span>
                  </div>
                </div>
              </div>

              {/* ── Detailed question review with streak info ── */}
              <div className="sidebar-summary-card" style={{ padding: '30px' }}>
                <h3 className="section-title" style={{ fontSize: '20px', marginBottom: '20px' }}>Question Review</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(questions || []).map((q, idx) => {
                    const userAnswerIdx = userAnswers ? userAnswers[idx] : null;
                    const isCorrect = userAnswerIdx === q.correctIdx;
                    const userAnswerText = (userAnswerIdx !== null && userAnswerIdx !== undefined)
                      ? q.options[userAnswerIdx]
                      : 'Not answered';
                    const correctAnswerText = q.options[q.correctIdx];
                    const change = streakChanges ? streakChanges[idx] : null;

                    return (
                      <div
                        key={q.id || idx}
                        style={{
                          padding: '18px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.02)',
                          border: `1.5px solid ${isCorrect ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        }}
                      >
                        {/* Question header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: '#60A5FA' }}>
                            Letter {q.letter}
                          </span>
                          <span style={{ fontSize: '22px', color: isCorrect ? '#34D399' : '#EF4444', fontWeight: 'bold' }}>
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        </div>

                        {/* Question text */}
                        <p style={{ margin: '0 0 10px 0', color: '#FFFFFF', fontWeight: '600', fontSize: '14px' }}>
                          {q.question}
                        </p>

                        {/* Streak info block */}
                        {change && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '8px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.04)',
                            marginBottom: '10px'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>
                                PREVIOUS STREAK
                              </div>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#94A3B8' }}>
                                {change.prevStreak}/5
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>
                                ANSWER
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: '700', color: isCorrect ? '#34D399' : '#F87171' }}>
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>
                                NEW STREAK
                              </div>
                              <div style={{
                                fontSize: '16px', fontWeight: '700',
                                color: change.newStreak >= MASTERY_THRESHOLD ? '#34D399' : isCorrect ? '#60A5FA' : '#EF4444'
                              }}>
                                {change.newStreak}/5
                                {change.newStreak >= MASTERY_THRESHOLD && <span style={{ fontSize: '13px', marginLeft: '4px' }}>✓</span>}
                                {!isCorrect && <span style={{ fontSize: '11px', marginLeft: '4px' }}>↺ Reset</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Answer detail */}
                        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {!isCorrect && (
                            <span style={{ color: '#FCA5A5' }}>Your answer: {userAnswerText}</span>
                          )}
                          <span style={{ color: '#94A3B8' }}>Correct answer: {correctAnswerText}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="learn-right-column">
              {/* ── Letter mastery sidebar ── */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Letter Mastery Progress</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allLessonLetters.map(l => {
                    const streak = state.letterStreaks[l] || 0;
                    const isMastered = streak >= MASTERY_THRESHOLD;
                    // Was this letter tested in this quiz session?
                    const testedInSession = (questions || []).some(q => q.letter === l);
                    return (
                      <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span style={{ color: isMastered ? '#34D399' : '#FFFFFF', fontWeight: testedInSession ? '700' : '400' }}>
                            Letter {l} {testedInSession ? '●' : ''}
                          </span>
                          <span style={{ fontWeight: 'bold', color: isMastered ? '#34D399' : '#94A3B8', fontSize: '13px' }}>
                            {streak}/{MASTERY_THRESHOLD} {isMastered ? '✓' : ''}
                          </span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(streak / MASTERY_THRESHOLD, 1) * 100}%`,
                            height: '100%',
                            background: isMastered ? '#34D399' : '#60A5FA',
                            borderRadius: '3px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 0' }}>
                    ● = tested this session
                  </p>
                </div>
              </div>

              {/* ── Badges ── */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Badges Unlocked</h3>
                {badgesAwarded && badgesAwarded.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {badgesAwarded.map((badge) => {
                      let icon = '🏅', name = badge;
                      if (badge === 'letterExplorer') { icon = '🧭'; name = 'Letter Explorer'; }
                      else if (badge === 'perfectQuiz') { icon = '💯'; name = 'Perfect Quiz'; }
                      return (
                        <div key={badge} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.05))',
                          border: '1.5px solid rgba(245,158,11,0.3)',
                          padding: '12px 16px', borderRadius: '12px'
                        }}>
                          <span style={{ fontSize: '24px' }}>{icon}</span>
                          <div>
                            <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '13px' }}>{name}</div>
                            <div style={{ color: '#F59E0B', fontSize: '11px', fontWeight: '600' }}>Badge Earned!</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0' }}>
                    No new badges this round. Try getting a perfect score!
                  </p>
                )}
              </div>

              {/* ── Actions ── */}
              <div className="sidebar-summary-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 className="level-meta-label">Next Steps</h3>

                {lessonMastered ? (
                  <button
                    className="nav-btn btn-primary"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={() => navigate(`/learn/lesson/${lessonId}/complete`)}
                  >
                    🏆 View Lesson Completion
                  </button>
                ) : (
                  <button
                    className="nav-btn btn-primary"
                    style={{ width: '100%', padding: '12px', background: '#3B82F6', borderColor: '#3B82F6' }}
                    onClick={() => navigate(`/learn/${lessonId}/quiz`)}
                  >
                    🔄 Continue Practice ({unmasteredLetters.length} Letters Remaining)
                  </button>
                )}

                <button
                  className="nav-btn"
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onClick={() => navigate('/learn')}
                >
                  Return to Library
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default QuizResult;
