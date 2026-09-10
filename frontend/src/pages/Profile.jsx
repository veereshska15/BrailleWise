// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress from '../utils/learningProgress';
import './Learn.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    
    try { 
      let parsedUser = JSON.parse(storedUser);
      if (!parsedUser.createdAt) {
        parsedUser.createdAt = new Date().toISOString();
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      setUser(parsedUser); 
      setEditName(parsedUser.name || 'Student');
    } catch (e) { navigate('/login'); }

    const fetchBackendProfile = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || '';
        const profileRes = await fetch(`${API}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          setUser(prev => ({ ...prev, ...profileData.user }));
        }

        const state = await learningProgress.loadStateFromBackend();
        updateMetricsWithState(state);
      } catch (err) {
        console.error("Profile backend load error:", err);
      }
    };

    const updateMetricsWithState = (state) => {
      const lessons = Object.values(state.lessons || {});
      
      const lessonsCompleted = lessons.filter(l => l.state === 'COMPLETED' || l.state === 'MASTERED').length;
      const lessonsMastered = lessons.filter(l => l.state === 'MASTERED').length;
      const lettersMastered = learningProgress.getMasteredLettersCount(state);
      const overallProgress = learningProgress.getOverallProgressPercent(state);
      
      let currentLesson = "1";
      for (let i = 1; i <= 4; i++) {
        if (state.lessons[i.toString()]?.state !== 'MASTERED') {
          currentLesson = i.toString();
          break;
        }
      }

      let adaptiveTotalScore = 0;
      let adaptiveTotalMax = 0;
      let adaptiveQuizCount = 0;
      
      lessons.forEach(l => {
        if (l.lastResult) {
          adaptiveTotalScore += l.lastResult.score || 0;
          adaptiveTotalMax += l.lastResult.total || 0;
          adaptiveQuizCount++;
        }
      });
      
      const pLast = (state.practiceState && state.practiceState.lastResult) || null;
      const practiceTotalScore = pLast ? pLast.score : 0;
      const practiceTotalMax = pLast ? pLast.total : 0;
      const practiceSessions = (state.practiceState && state.practiceState.sessionsCompleted) || 0;

      const totalCorrect = adaptiveTotalScore + practiceTotalScore;
      const totalQuestions = adaptiveTotalMax + practiceTotalMax;
      
      const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const adaptiveAccuracy = adaptiveQuizCount > 0 && adaptiveTotalMax > 0 ? Math.round((adaptiveTotalScore / adaptiveTotalMax) * 100) : 0;
      const practiceAccuracy = pLast ? pLast.percent : 0;
      
      let highestAccuracy = Math.max(adaptiveAccuracy, practiceAccuracy);
      
      let unlockedAchievements = 0;
      const totalAchievements = 18; 
      
      if (lessonsCompleted >= 1) unlockedAchievements++;
      if (lessonsMastered >= 2) unlockedAchievements++;
      if (lessonsMastered >= 4) unlockedAchievements++;
      
      if (lettersMastered >= 1) unlockedAchievements++;
      if (lettersMastered >= 10) unlockedAchievements++;
      if (lettersMastered >= 20) unlockedAchievements++;
      if (lettersMastered >= 26) unlockedAchievements++;
      
      if (practiceSessions >= 1) unlockedAchievements++;
      if (practiceSessions >= 5) unlockedAchievements++;
      if (practiceSessions >= 10) unlockedAchievements++;
      
      if (adaptiveQuizCount >= 1) unlockedAchievements++;
      if (highestAccuracy >= 90) unlockedAchievements++;
      if (highestAccuracy >= 100) unlockedAchievements++;
      if (adaptiveQuizCount >= 4) unlockedAchievements++;
      
      if (overallProgress >= 25) unlockedAchievements++;
      if (overallProgress >= 50) unlockedAchievements++;
      if (overallProgress >= 75) unlockedAchievements++;
      if (overallProgress >= 100) unlockedAchievements++;

      const achievementCompletion = Math.round((unlockedAchievements / totalAchievements) * 100);

      let learningLevelText = "Beginner";
      let learningLevelNum = "Level 1";
      if (overallProgress > 70) {
        learningLevelText = "Advanced Learner";
        learningLevelNum = "Level 3";
      } else if (overallProgress > 30) {
        learningLevelText = "Intermediate Learner";
        learningLevelNum = "Level 2";
      } else {
        learningLevelText = "Beginner Learner";
      }

      const startedLearning = state.activityLog && state.activityLog.length > 0 
        ? new Date(state.activityLog[state.activityLog.length - 1].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
        : "Not Started";
        
      const lastActive = state.activityLog && state.activityLog.length > 0 
        ? new Date(state.activityLog[0].timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
        : "Not Started";

      const isResumeAvailable = lessons.some(l => l.state === 'IN_PROGRESS' || l.state === 'COMPLETED');
      const currentLearningMode = isResumeAvailable ? "Resume" : (overallProgress >= 100 ? "Review" : "Learning");

      setMetrics({
        overallProgress,
        lessonsCompleted,
        lessonsMastered,
        lettersMastered,
        currentLesson,
        overallAccuracy,
        adaptiveAccuracy,
        practiceAccuracy,
        unlockedAchievements,
        totalAchievements,
        achievementCompletion,
        learningLevelNum,
        learningLevelText,
        startedLearning,
        lastActive,
        currentLearningMode,
        isResumeAvailable,
        adaptiveQuizCount,
        practiceSessions,
        highestAccuracy,
        totalWordsPracticed: 0
      });
    };

    const updateMetrics = () => {
      const state = learningProgress.getState();
      updateMetricsWithState(state);
    };

    fetchBackendProfile();

    const handleStorage = (e) => {
      if (e.key === 'braillewise_state') updateMetrics();
      if (e.key === 'user') {
        try { setUser(JSON.parse(localStorage.getItem('user'))); } catch(e){}
      }
    };
    window.addEventListener('storage', handleStorage);
    const intervalId = setInterval(updateMetrics, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, [navigate]);

  const handleSaveProfile = () => {
    if (!user) return;
    const updatedUser = { ...user, name: editName };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        const updatedUser = { ...user, profilePic: base64String };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user || !metrics) return null;

  const defaultAvatar = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name || "Student") + "&background=34D399&color=fff";

  const renderValue = (val, emptyMsg = "Not Started") => {
    return val > 0 || (typeof val === 'string' && val !== '0' && val !== 'Not Started') ? val : emptyMsg;
  };

  const renderPercentage = (val) => {
    return val > 0 ? `${val}%` : "Not Started";
  };

  const formatUserId = (id) => {
    if (!id || id.length < 5) return 'N/A';
    const short = id.substring(id.length - 4).toUpperCase();
    return `BW-${short}`;
  };

  const formattedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="profile" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">Learner Identity</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>My Profile</h1>
          </div>
          <div className="header-right">
            <span className="header-date" style={{ color: '#34D399', fontWeight: '700' }}>
              Live Sync Active
            </span>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', paddingBottom: '40px' }}>
            
            {/* LEFT COLUMN: Main Stats & Profile Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* PROFILE HEADER CARD */}
              <div className="sidebar-summary-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={user.profilePic || defaultAvatar} 
                      alt="Profile Avatar" 
                      style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(52,211,153,0.3)' }}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: 'absolute', bottom: '0', right: '0', background: '#34D399', border: 'none',
                        width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', color: '#0F172A'
                      }}
                      aria-label="Upload new profile picture"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ 
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(96,165,250,0.5)', 
                              color: '#FFF', fontSize: '24px', fontWeight: '700', padding: '4px 12px', borderRadius: '6px',
                              marginBottom: '8px', outline: 'none', width: '220px'
                            }}
                            autoFocus
                          />
                        ) : (
                          <h2 style={{ fontSize: '28px', color: '#FFF', margin: '0 0 4px 0', fontWeight: '800' }}>
                            {user.name || 'Student'}
                          </h2>
                        )}
                        <p style={{ fontSize: '15px', color: '#94A3B8', margin: '0 0 8px 0' }}>{user.email || 'No email provided'}</p>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFFFFF' }}>
                            {metrics.learningLevelNum}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#60A5FA', background: 'rgba(96,165,250,0.1)', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {metrics.learningLevelText}
                          </span>
                        </div>
                      </div>

                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Cancel</button>
                          <button onClick={handleSaveProfile} style={{ background: '#34D399', border: 'none', color: '#0F172A', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>Save</button>
                        </div>
                      ) : (
                        <button onClick={() => setIsEditing(true)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* LEARNING SUMMARY METRICS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="sidebar-summary-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Overall Progress</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#60A5FA' }}>{renderPercentage(metrics.overallProgress)}</div>
                </div>
                <div className="sidebar-summary-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Letters Mastered</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#34D399' }}>{metrics.lettersMastered > 0 ? `${metrics.lettersMastered} / 26` : 'Not Started'}</div>
                </div>
                <div className="sidebar-summary-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>Overall Accuracy</div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#A78BFA' }}>{renderPercentage(metrics.overallAccuracy)}</div>
                </div>
              </div>

              {/* PERSONAL STATISTICS (Detailed Grid) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Learning Stats */}
                <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '20px', fontWeight: '700' }}>Learning Statistics</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { label: "Lessons Completed", value: renderValue(metrics.lessonsCompleted) },
                      { label: "Lessons Mastered", value: metrics.lessonsMastered > 0 ? `${metrics.lessonsMastered} / 4` : 'Not Started' },
                      { label: "Letters Mastered", value: metrics.lettersMastered > 0 ? `${metrics.lettersMastered} / 26` : 'Not Started' },
                      { label: "Words Practiced", value: renderValue(metrics.totalWordsPracticed, "No practice completed yet.") }
                    ].map((stat, i) => (
                      <div key={`lrn-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>{stat.label}</span>
                        <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: '700' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiz Stats */}
                <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '20px', fontWeight: '700' }}>Quiz Statistics</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { label: "Adaptive Quizzes Completed", value: renderValue(metrics.adaptiveQuizCount) },
                      { label: "Practice Quizzes Completed", value: renderValue(metrics.practiceSessions) },
                      { label: "Adaptive Quiz Accuracy", value: renderPercentage(metrics.adaptiveAccuracy) },
                      { label: "Practice Quiz Accuracy", value: renderPercentage(metrics.practiceAccuracy) },
                      { label: "Highest Accuracy", value: renderPercentage(metrics.highestAccuracy) }
                    ].map((stat, i) => (
                      <div key={`qz-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>{stat.label}</span>
                        <span style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: '700' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: Sidebar Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* LEARNING JOURNEY */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Learning Journey</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Current Lesson</span>
                    <span style={{ fontSize: '13px', color: '#60A5FA', fontWeight: '700' }}>Lesson {metrics.currentLesson}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Current Mode</span>
                    <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '600' }}>{metrics.currentLearningMode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Resume Available</span>
                    <span style={{ fontSize: '13px', color: metrics.isResumeAvailable ? '#34D399' : '#64748B', fontWeight: '600' }}>
                      {metrics.isResumeAvailable ? "Yes" : "No"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Last Active</span>
                    <span style={{ fontSize: '13px', color: '#E2E8F0' }}>{metrics.lastActive}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Started Learning</span>
                    <span style={{ fontSize: '13px', color: '#E2E8F0' }}>{metrics.startedLearning}</span>
                  </div>
                </div>
              </div>

              {/* ACHIEVEMENT SUMMARY */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Achievements</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px', color: '#34D399', fontWeight: '800' }}>
                    {metrics.unlockedAchievements} / {metrics.totalAchievements}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unlocked</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${metrics.achievementCompletion}%`, height: '100%', background: '#F59E0B', borderRadius: '3px' }}></div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', textAlign: 'right', marginBottom: '20px' }}>
                  {metrics.achievementCompletion}% Completed
                </div>
                <button 
                  onClick={() => navigate('/achievements')}
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  View Achievements
                </button>
              </div>

              {/* ACCOUNT INFORMATION */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Account Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Name</span>
                    <span style={{ fontSize: '14px', color: '#E2E8F0' }}>{user.name}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Email</span>
                    <span style={{ fontSize: '14px', color: '#E2E8F0' }}>{user.email}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Registered On</span>
                    <span style={{ fontSize: '14px', color: '#E2E8F0' }}>{formattedDate}</span>
                  </div>
                  {formatUserId(user.id) !== 'N/A' && (
                    <div>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Learner ID</span>
                      <span style={{ fontSize: '14px', color: '#94A3B8', fontFamily: 'monospace' }}>{formatUserId(user.id)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => navigate('/learn')}
                  style={{ width: '100%', padding: '14px', background: '#60A5FA', border: 'none', color: '#0F172A', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Continue Learning
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Return to Dashboard
                </button>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '12px' }}
                >
                  Edit Profile
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
