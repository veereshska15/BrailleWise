// src/pages/PracticeResult.jsx
// Displays revision-only statistics after a Practice Quiz session.
// NEVER reads from or writes to learningProgress.
// Data comes only from sessionStorage (set by PracticeQuizRevision).
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Learn.css';

function formatTime(sec) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

const QUESTION_TYPE_LABELS = {
  braille_to_letter: 'Braille → Letter',
  letter_to_braille: 'Letter → Braille',
  word_recognition: 'Word Recognition',
  word_to_braille: 'Word → Braille',
  missing_letter: 'Missing Letter'
};

const PracticeResult = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); }

    // Read result from sessionStorage (never from localStorage / learningProgress)
    const raw = sessionStorage.getItem('practiceResult');
    if (raw) {
      try { setResult(JSON.parse(raw)); } catch (_) { navigate('/practice'); }
    } else {
      navigate('/practice');
    }
  }, [navigate]);

  if (!user || !result) return null;

  const { score, total, percent, timeSec, lettersUsed, wordsUsed, questionTypes } = result;
  const incorrect = total - score;

  // Grade label
  const grade =
    percent >= 90 ? { label: 'Excellent!', color: '#34D399', icon: '🏆' } :
    percent >= 75 ? { label: 'Good Work!', color: '#60A5FA', icon: '⭐' } :
    percent >= 50 ? { label: 'Keep Practising', color: '#F59E0B', icon: '💪' } :
    { label: 'Needs More Practice', color: '#F87171', icon: '📚' };

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="quiz" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">Practice Quiz — Results</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Practice Result</h1>
          </div>
          <div className="header-right">
            <span className="header-date" style={{ color: '#34D399', fontWeight: '700' }}>
              Revision Mode — No progress affected
            </span>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          <div className="learn-main-grid">
            {/* Left: main result */}
            <div className="learn-left-column">
              {/* Score card */}
              <div className="sidebar-summary-card" style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '12px' }}>{grade.icon}</div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: grade.color, marginBottom: '6px' }}>
                  {grade.label}
                </h2>
                <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '28px' }}>
                  Practice session complete
                </p>

                {/* Accuracy ring — simple text-based */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '120px', height: '120px', borderRadius: '50%',
                  border: `6px solid ${grade.color}`,
                  background: 'rgba(255,255,255,0.02)',
                  marginBottom: '28px'
                }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: grade.color }}>{percent}%</span>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
                  {[
                    { label: 'Correct', value: score, color: '#34D399' },
                    { label: 'Incorrect', value: incorrect, color: '#F87171' },
                    { label: 'Total', value: total, color: '#FFFFFF' }
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Read-only notice */}
              <div className="sidebar-summary-card" style={{
                padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '14px',
                background: 'rgba(52,211,153,0.06)', border: '1.5px solid rgba(52,211,153,0.2)'
              }}>
                <span style={{ fontSize: '22px' }}>✓</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#34D399', marginBottom: '3px' }}>
                    No progress was affected
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>
                    This was a revision-only session. Your lesson mastery, streaks, and unlocks remain unchanged.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="nav-btn btn-primary"
                  style={{ flex: 1, padding: '14px', minWidth: '160px' }}
                  onClick={() => navigate('/practice')}
                >
                  🔄 New Practice Session
                </button>
                <button
                  className="nav-btn"
                  style={{
                    flex: 1, padding: '14px', minWidth: '160px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
                  }}
                  onClick={() => navigate('/learn')}
                >
                  📚 Back to Learn
                </button>
                <button
                  className="nav-btn"
                  style={{
                    flex: 1, padding: '14px', minWidth: '160px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
                  }}
                  onClick={() => navigate('/dashboard')}
                >
                  🏠 Dashboard
                </button>
              </div>
            </div>

            {/* Right: session breakdown */}
            <div className="learn-right-column">
              {/* Time and details */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '16px' }}>Session Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  {[
                    { label: 'Total Questions', value: total },
                    { label: 'Correct Answers', value: score, valueColor: '#34D399' },
                    { label: 'Incorrect Answers', value: incorrect, valueColor: '#F87171' },
                    { label: 'Accuracy', value: `${percent}%`, valueColor: grade.color },
                    { label: 'Practice Time', value: formatTime(timeSec), valueColor: '#60A5FA' },
                    { label: 'Letters Practised', value: lettersUsed.sort().join(', ') || '—' },
                    { label: 'Words Practised', value: wordsUsed.length > 0 ? `${wordsUsed.length} words` : 'None' }
                  ].map(({ label, value, valueColor }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#94A3B8', flexShrink: 0 }}>{label}</span>
                      <span style={{ color: valueColor || '#FFFFFF', fontWeight: '600', textAlign: 'right', wordBreak: 'break-word' }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question types used */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Question Types Practised</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(questionTypes || []).map(type => (
                    <div key={type} style={{
                      padding: '8px 12px', borderRadius: '8px',
                      background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)',
                      fontSize: '13px', color: '#60A5FA', fontWeight: '600'
                    }}>
                      {QUESTION_TYPE_LABELS[type] || type}
                    </div>
                  ))}
                </div>
              </div>

              {/* Letters practised */}
              {lettersUsed.length > 0 && (
                <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                  <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Letters Practised</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {lettersUsed.sort().map(l => (
                      <span key={l} style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '8px',
                        background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)',
                        color: '#34D399', fontWeight: '700', fontSize: '14px'
                      }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PracticeResult;
