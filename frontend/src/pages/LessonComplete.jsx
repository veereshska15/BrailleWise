// src/pages/LessonComplete.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress, { LESSON_LETTERS } from '../utils/learningProgress';
import voiceGuidance from '../utils/voiceGuidance';
import './Learn.css'; // Leverage existing dashboard styles

const LessonComplete = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const result = learningProgress.getLastResult(lessonId);
  const state = learningProgress.getState();

  const lessonState = state.lessons[lessonId]?.state;

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

  useEffect(() => {
    if (user && lessonState === 'MASTERED') {
      const lettersInLesson = LESSON_LETTERS[lessonId]?.length || 6;
      voiceGuidance.speakQueue([
        "Congratulations.",
        `You mastered ${lettersInLesson} out of ${lettersInLesson} letters.`
      ]);
    }
  }, [user, lessonState, lessonId]);

  if (!user) return null;

  const lessonNames = {
    "1": "Letters A–F",
    "2": "Letters G–L",
    "3": "Letters M–R",
    "4": "Letters S–Z"
  };
  const lessonName = lessonNames[lessonId] || `Lesson ${lessonId}`;
  const nextLessonId = (parseInt(lessonId, 10) + 1).toString();
  const nextUnlocked = learningProgress.isLessonUnlocked(nextLessonId);

  // Only show completion screen when lesson is fully MASTERED (all letters 5/5)
  if (lessonState !== 'MASTERED') {
    return (
      <div className="dashboard-layout">
        <Sidebar activeTab="learn" />
        <div className="dashboard-workspace">
          <div className="learn-content" style={{ marginTop: '40px', alignItems: 'center' }}>
            <div className="sidebar-summary-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
              <h2 className="section-title" style={{ color: '#F59E0B' }}>Keep Practicing!</h2>
              <p style={{ color: '#E2E8F0', margin: '20px 0' }}>Master all letters in this lesson (5/5 each) to unlock the completion rewards and the next lesson.</p>
              <button
                className="nav-btn btn-primary"
                onClick={() => navigate(`/learn/${lessonId}/quiz`)}
              >
                Continue Practicing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { score = 0, total = 0, percent = 0, earned = 0, badgesAwarded = [] } = result || {};

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="learn" />

      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">BrailleWise Academy</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Lesson Completed!</h1>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          <div className="learn-main-grid">
            <div className="learn-left-column">
              {/* Celebration Panel overlay-style card */}
              <div 
                className="sidebar-summary-card" 
                style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.3) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.45)',
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.3), 0 0 30px rgba(16, 185, 129, 0.15)'
                }}
              >
                <span style={{ fontSize: '72px', display: 'block', marginBottom: '20px' }} aria-hidden="true">🎉</span>
                <h2 className="section-title" style={{ fontSize: '32px', color: '#FFFFFF', marginBottom: '8px' }}>
                  Lesson Complete
                </h2>
                <h3 style={{ fontSize: '20px', color: '#A7F3D0', fontWeight: '600', margin: '0 0 24px 0' }}>
                  {lessonName}
                </h3>
                
                <p style={{ color: '#E2E8F0', fontSize: '15px', maxWidth: '480px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
                  Fantastic work! You successfully mastered the learning objectives, answered the questions correctly, and updated your progression path.
                </p>

                <div className="complete-rewards-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', maxWidth: '500px', margin: '0 auto 36px auto' }}>
                  <div className="reward-stat-box">
                    <span className="reward-stat-icon">🎯</span>
                    <span className="reward-stat-val">{percent}%</span>
                    <span className="reward-stat-label">Accuracy</span>
                  </div>
                  <div className="reward-stat-box">
                    <span className="reward-stat-icon">🔥</span>
                    <span className="reward-stat-val">+{earned} XP</span>
                    <span className="reward-stat-label">Total XP</span>
                  </div>
                  <div className="reward-stat-box">
                    <span className="reward-stat-icon">🔓</span>
                    <span className="reward-stat-val">{nextUnlocked ? "Yes" : "No"}</span>
                    <span className="reward-stat-label">Next Unlocked</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <button 
                    className="nav-btn btn-primary" 
                    style={{ minWidth: '200px', padding: '14px 28px', opacity: nextUnlocked ? 1 : 0.7 }}
                    onClick={() => {
                      if (nextUnlocked) {
                        navigate(`/learn/lesson/${nextLessonId}`);
                      } else {
                        alert("The next lesson is locked. Master all letters in this lesson to unlock it!");
                      }
                    }}
                  >
                    Continue to Next Lesson
                  </button>
                  <button 
                    className="nav-btn" 
                    style={{ minWidth: '160px', padding: '14px 28px', background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                    onClick={() => navigate('/learn')}
                  >
                    Lesson Library
                  </button>
                </div>
              </div>
            </div>

            <div className="learn-right-column">
              {/* Badges card */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '14px' }}>Unlocked Badges</h3>
                {badgesAwarded && badgesAwarded.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {badgesAwarded.map((badge) => {
                      let badgeIcon = '🏅';
                      let badgeName = badge;
                      if (badge === 'letterExplorer') {
                        badgeIcon = '🧭';
                        badgeName = 'Letter Explorer';
                      } else if (badge === 'perfectQuiz') {
                        badgeIcon = '💯';
                        badgeName = 'Perfect Quiz';
                      }
                      return (
                        <div 
                          key={badge}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            border: '1.5px solid rgba(245, 158, 11, 0.3)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            animation: 'scaleUpComplete 0.4s ease forwards'
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>{badgeIcon}</span>
                          <div>
                            <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '13px' }}>{badgeName}</div>
                            <div style={{ color: '#F59E0B', fontSize: '11px', fontWeight: '600' }}>Unlocked!</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#94A3B8', fontSize: '13px', margin: '0' }}>
                    No badges earned this round. Try getting a perfect score!
                  </p>
                )}
              </div>

              {/* Letter Mastery Progress */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 className="level-meta-label" style={{ marginBottom: '12px' }}>Letter Mastery Progress</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(LESSON_LETTERS[lessonId] || []).map(l => {
                      const count = state.letterStreaks[l] || 0;
                      const isLetterMastered = count >= 5;
                      return (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: isLetterMastered ? '#34D399' : '#FFFFFF' }}>
                          <span>Letter {l}</span>
                          <span style={{ fontWeight: 'bold', color: isLetterMastered ? '#34D399' : '#94A3B8' }}>
                            {count}/5 {isLetterMastered ? '✓ Mastered' : ''}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Go to Dashboard button */}
              <button 
                className="nav-btn" 
                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonComplete;
