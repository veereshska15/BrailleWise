// src/pages/Achievements.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress from '../utils/learningProgress';
import './Learn.css';

const Achievements = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [seenAchievements, setSeenAchievements] = useState([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); }

    // Load seen achievements array
    let storedSeen = [];
    try {
      const raw = localStorage.getItem('braillewise_seen_achievements');
      if (raw) storedSeen = JSON.parse(raw);
    } catch (err) {}
    setSeenAchievements(storedSeen);

    const updateMetrics = async () => {
      const state = await learningProgress.loadStateFromBackend();
      
      const lessons = Object.values(state.lessons || {});
      const lessonsCompleted = lessons.filter(l => l.state === 'COMPLETED' || l.state === 'MASTERED').length;
      const lessonsMastered = lessons.filter(l => l.state === 'MASTERED').length;
      
      const lettersMastered = Object.values(state.letterStreaks || {}).filter(s => s >= 5).length;
      
      const practiceSessions = (state.practiceState && state.practiceState.sessionsCompleted) || 0;
      
      const adaptiveQuizzesCompleted = lessons.filter(l => l.lastResult).length;
      
      let maxQuizAccuracy = 0;
      lessons.forEach(l => {
        if (l.lastResult && l.lastResult.percent > maxQuizAccuracy) maxQuizAccuracy = l.lastResult.percent;
      });
      if (state.practiceState && state.practiceState.lastResult && state.practiceState.lastResult.percent > maxQuizAccuracy) {
        maxQuizAccuracy = state.practiceState.lastResult.percent;
      }
      
      const overallProgress = learningProgress.getOverallProgressPercent();

      const activityLog = state.activityLog || [];
      const unlockDates = {};
      
      activityLog.forEach(log => {
        const titleLower = (log.title || '').toLowerCase();
        if (titleLower.includes('mastered letter')) unlockDates['bm1'] = log.timestamp;
        if (titleLower.includes('completed adaptive quiz')) unlockDates['qa1'] = log.timestamp;
        if (titleLower.includes('practice quiz')) unlockDates['pa1'] = log.timestamp;
        if (titleLower.includes('perfect quiz')) unlockDates['qa3'] = log.timestamp;
      });

      setMetrics({
        lessonsCompleted,
        lessonsMastered,
        lettersMastered,
        practiceSessions,
        adaptiveQuizzesCompleted,
        maxQuizAccuracy,
        overallProgress,
        unlockDates
      });
    };

    updateMetrics();

    const handleStorage = (e) => {
      if (e.key === 'braillewise_state') updateMetrics();
    };
    window.addEventListener('storage', handleStorage);
    const intervalId = setInterval(updateMetrics, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, [navigate]);

  // Handle first-time unlock logic
  useEffect(() => {
    if (!metrics) return;
    
    const currentUnlockedIds = [];
    categories.forEach(cat => {
      cat.achievements.forEach(ach => {
        if (ach.current >= ach.max) {
          currentUnlockedIds.push(ach.id);
        }
      });
    });

    const newUnlocks = currentUnlockedIds.filter(id => !seenAchievements.includes(id));
    
    if (newUnlocks.length > 0) {
      setNewlyUnlocked(prev => [...prev, ...newUnlocks]);
      const updatedSeen = [...seenAchievements, ...newUnlocks];
      setSeenAchievements(updatedSeen);
      localStorage.setItem('braillewise_seen_achievements', JSON.stringify(updatedSeen));

      // Clear the animation class after 2 seconds
      setTimeout(() => {
        setNewlyUnlocked(prev => prev.filter(id => !newUnlocks.includes(id)));
      }, 2000);
    }
  }, [metrics, seenAchievements]);

  if (!user || !metrics) return null;

  const getTierIcon = (tier) => {
    if (tier === 'Bronze') return '🏅 Bronze Badge';
    if (tier === 'Silver') return '🥈 Silver Badge';
    if (tier === 'Gold') return '🥇 Gold Badge';
    if (tier === 'Master') return '👑 Master Badge';
    return '';
  };

  // ── ACHIEVEMENT CONFIGURATION ──
  const categories = [
    {
      title: "Learning Milestones",
      achievements: [
        { id: "lm1", title: "First Lesson Completed", description: "Complete the content of your first lesson.", icon: "📚", current: metrics.lessonsCompleted, max: 1, unit: "lessons", verb: "Complete", tier: "Bronze" },
        { id: "lm2", title: "Two Lessons Mastered", description: "Master all letters in two different lessons.", icon: "⭐", current: metrics.lessonsMastered, max: 2, unit: "lessons", verb: "Master", tier: "Silver" },
        { id: "lm3", title: "All Lessons Mastered", description: "Achieve complete mastery across all lessons.", icon: "👑", current: metrics.lessonsMastered, max: 4, unit: "lessons", verb: "Master", tier: "Master" }
      ]
    },
    {
      title: "Braille Mastery",
      achievements: [
        { id: "bm1", title: "First Letter Mastered", description: "Score a 5-streak on any letter.", icon: "A", current: metrics.lettersMastered, max: 1, unit: "letters", verb: "Master", tier: "Bronze" },
        { id: "bm2", title: "10 Letters Mastered", description: "Master 10 different letters.", icon: "🔟", current: metrics.lettersMastered, max: 10, unit: "letters", verb: "Master", tier: "Silver" },
        { id: "bm3", title: "20 Letters Mastered", description: "Master 20 different letters.", icon: "🔥", current: metrics.lettersMastered, max: 20, unit: "letters", verb: "Master", tier: "Gold" },
        { id: "bm4", title: "Complete Alphabet Master", description: "Master the entire Braille alphabet.", icon: "🏆", current: metrics.lettersMastered, max: 26, unit: "letters", verb: "Master", tier: "Master" }
      ]
    },
    {
      title: "Practice Achievements",
      achievements: [
        { id: "pa1", title: "First Practice Quiz", description: "Complete your first Practice Session.", icon: "🔄", current: metrics.practiceSessions, max: 1, unit: "sessions", verb: "Complete", tier: "Bronze" },
        { id: "pa2", title: "5 Practice Sessions", description: "Complete 5 Practice Sessions.", icon: "⚡", current: metrics.practiceSessions, max: 5, unit: "sessions", verb: "Complete", tier: "Silver" },
        { id: "pa3", title: "10 Practice Sessions", description: "Complete 10 Practice Sessions.", icon: "🚀", current: metrics.practiceSessions, max: 10, unit: "sessions", verb: "Complete", tier: "Gold" }
      ]
    },
    {
      title: "Quiz Achievements",
      achievements: [
        { id: "qa1", title: "First Adaptive Quiz Completed", description: "Complete an adaptive lesson quiz.", icon: "🎯", current: metrics.adaptiveQuizzesCompleted, max: 1, unit: "quizzes", verb: "Complete", tier: "Bronze" },
        { id: "qa2", title: "90% Accuracy", description: "Achieve 90% accuracy in any quiz.", icon: "🎯", current: metrics.maxQuizAccuracy, max: 90, format: "%", unit: "accuracy", verb: "Achieve", tier: "Silver" },
        { id: "qa3", title: "100% Accuracy", description: "Achieve perfect accuracy in any quiz.", icon: "💯", current: metrics.maxQuizAccuracy, max: 100, format: "%", unit: "accuracy", verb: "Achieve", tier: "Gold" },
        { id: "qa4", title: "Quiz Champion", description: "Complete all 4 adaptive quizzes.", icon: "🏅", current: metrics.adaptiveQuizzesCompleted, max: 4, unit: "quizzes", verb: "Complete", tier: "Master" }
      ]
    },
    {
      title: "Progress Achievements",
      achievements: [
        { id: "pr1", title: "25% Course Complete", description: "Reach 25% overall course progress.", icon: "🌱", current: metrics.overallProgress, max: 25, format: "%", unit: "more course progress", verb: "Complete", tier: "Bronze" },
        { id: "pr2", title: "50% Course Complete", description: "Reach 50% overall course progress.", icon: "🌿", current: metrics.overallProgress, max: 50, format: "%", unit: "more course progress", verb: "Complete", tier: "Silver" },
        { id: "pr3", title: "75% Course Complete", description: "Reach 75% overall course progress.", icon: "🌳", current: metrics.overallProgress, max: 75, format: "%", unit: "more course progress", verb: "Complete", tier: "Gold" },
        { id: "pr4", title: "100% Course Complete", description: "Reach 100% overall course progress.", icon: "🌟", current: metrics.overallProgress, max: 100, format: "%", unit: "more course progress", verb: "Complete", tier: "Master" }
      ]
    }
  ];

  return (
    <div className="dashboard-layout">
      <style>{`
        .achv-card {
          padding: 20px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .achv-card:hover {
          transform: translateY(-2px);
        }
        .achv-card.unlocked:hover {
          box-shadow: 0 4px 20px rgba(52,211,153,0.15);
        }
        .achv-card.locked:hover {
          box-shadow: 0 4px 20px rgba(255,255,255,0.05);
        }
        
        .achv-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          animation: fadeIn 0.2s forwards;
        }
        .achv-modal-content {
          background: #1E293B;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 90%;
          max-width: 420px;
          padding: 32px;
          position: relative;
          transform: scale(0.95);
          animation: scaleUp 0.2s forwards;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes scaleUp { to { transform: scale(1); } }

        /* CELEBRATION ANIMATION */
        .celebrate {
          animation: celebrationGlow 1.5s ease-out;
        }
        
        @keyframes celebrationGlow {
          0% { box-shadow: 0 0 0 rgba(52,211,153,0); transform: scale(1); }
          50% { box-shadow: 0 0 30px rgba(52,211,153,0.6); transform: scale(1.03); }
          100% { box-shadow: 0 0 0 rgba(52,211,153,0); transform: scale(1); }
        }
      `}</style>
      
      <Sidebar activeTab="achievements" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">BrailleWise Analytics</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Achievements</h1>
          </div>
          <div className="header-right">
            <span className="header-date" style={{ color: '#34D399', fontWeight: '700' }}>
              Live Sync Active
            </span>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
            {categories.map((category, catIdx) => (
              <div key={catIdx}>
                <h2 style={{ fontSize: '20px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {category.title}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {category.achievements.map((ach) => {
                    const progressVal = Math.min(ach.current, ach.max);
                    const unlocked = progressVal >= ach.max;
                    const percent = Math.round((progressVal / ach.max) * 100);
                    const isCelebrating = newlyUnlocked.includes(ach.id);
                    
                    const bg = unlocked ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)';
                    const border = unlocked ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.05)';
                    const opacity = unlocked ? 1 : 0.6;

                    return (
                      <div 
                        key={ach.id} 
                        className={`achv-card ${unlocked ? 'unlocked' : 'locked'} ${isCelebrating ? 'celebrate' : ''}`}
                        style={{ background: bg, border, opacity }}
                        onClick={() => setSelectedAchievement({ ...ach, progressVal, percent, unlocked })}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: unlocked ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                            color: unlocked ? '#34D399' : '#64748B'
                          }}>
                            {ach.icon}
                          </div>
                          {unlocked && (
                            <span style={{
                              fontSize: '11px', fontWeight: '700', color: '#34D399',
                              background: 'rgba(52,211,153,0.1)', padding: '4px 8px', borderRadius: '4px',
                              textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                              Unlocked
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <h3 style={{ fontSize: '15px', color: unlocked ? '#FFFFFF' : '#E2E8F0', margin: '0 0 6px 0', fontWeight: '600' }}>
                            {ach.title}
                          </h3>
                          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                            {ach.description}
                          </p>
                        </div>
                        
                        {!unlocked && (
                          <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Progress</span>
                              <span style={{ fontSize: '12px', color: '#E2E8F0', fontWeight: '700' }}>
                                {progressVal} / {ach.max}{ach.format || ''}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${percent}%`, height: '100%', background: '#60A5FA', borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* MODAL */}
      {selectedAchievement && (
        <div className="achv-modal-overlay" onClick={() => setSelectedAchievement(null)}>
          <div className="achv-modal-content" onClick={e => e.stopPropagation()}>
            
            <button 
              onClick={() => setSelectedAchievement(null)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', color: '#94A3B8',
                cursor: 'pointer', padding: '4px', fontSize: '18px'
              }}
            >
              ×
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: selectedAchievement.unlocked ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
                border: selectedAchievement.unlocked ? '2px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                color: selectedAchievement.unlocked ? '#34D399' : '#64748B'
              }}>
                {selectedAchievement.icon}
              </div>

              <div>
                <h2 style={{ fontSize: '22px', color: '#FFFFFF', margin: '0 0 8px 0', fontWeight: '700' }}>
                  {selectedAchievement.title}
                </h2>
                
                {selectedAchievement.unlocked ? (
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#34D399', background: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Unlocked
                  </span>
                ) : selectedAchievement.progressVal > 0 ? (
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#60A5FA', background: 'rgba(96,165,250,0.1)', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    In Progress
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Locked
                  </span>
                )}
              </div>

              <p style={{ fontSize: '14px', color: '#94A3B8', margin: '4px 0 16px 0', lineHeight: 1.5 }}>
                {selectedAchievement.description}
              </p>

              <div style={{ width: '100%', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Reward Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>Reward Badge</span>
                  <span style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: '700' }}>
                    {getTierIcon(selectedAchievement.tier)}
                  </span>
                </div>

                {/* Progress Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>Current Progress</span>
                  <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '700' }}>
                    {selectedAchievement.progressVal} / {selectedAchievement.max}{selectedAchievement.format || ''}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ width: `${selectedAchievement.percent}%`, height: '100%', background: selectedAchievement.unlocked ? '#34D399' : '#60A5FA', borderRadius: '4px' }}></div>
                </div>
                
                {!selectedAchievement.unlocked ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>Next Target</span>
                    <span style={{ fontSize: '13px', color: '#60A5FA', fontWeight: '700' }}>
                      {selectedAchievement.verb} {selectedAchievement.max - selectedAchievement.progressVal}{selectedAchievement.format || ''} more {selectedAchievement.unit}.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600' }}>Status</span>
                    <span style={{ fontSize: '13px', color: '#34D399', fontWeight: '700' }}>
                      Requirements fulfilled.
                    </span>
                  </div>
                )}
              </div>

              {selectedAchievement.unlocked && metrics.unlockDates && metrics.unlockDates[selectedAchievement.id] && (
                <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '14px' }}>📅</span>
                  Unlocked on {new Date(metrics.unlockDates[selectedAchievement.id]).toLocaleDateString()}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Achievements;
