import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress, { LESSON_LETTERS } from '../utils/learningProgress';
import voiceGuidance from '../utils/voiceGuidance';
import './Dashboard.css';

// ── Static notification data (future: replace with backend event stream) ──────
const NOTIFICATIONS = [
  { id: 1, text: "Lesson unlocked: Lesson 2 is now available.", time: "2h ago", unread: true },
  { id: 2, text: "Achievement earned: 'First Steps' badge.", time: "Yesterday", unread: false },
  { id: 3, text: "Daily reminder: Keep your learning streak active!", time: "2 days ago", unread: false },
  { id: 4, text: "Quiz available: Lesson 1 practice quiz is ready.", time: "3 days ago", unread: false }
];

// ── All possible achievement definitions — unlocked state is read from state ──
const ACHIEVEMENT_DEFS = [
  {
    id: 'login',
    name: "First Login",
    desc: "Welcome to BrailleWise!",
    condition: "Log into your account for the first time.",
    icon: "🚪",
    // Always unlocked once they're in the app
    isUnlocked: () => true,
    date: "Auto"
  },
  {
    id: 'lesson1',
    name: "First Lesson",
    desc: "Mastered your first Braille letter",
    condition: "Complete Lesson 1 successfully.",
    icon: "⭐",
    isUnlocked: (state) => state.lessons["1"]?.state === 'MASTERED'
  },
  {
    id: 'letterExplorer',
    name: "Letter Explorer",
    desc: "Passed your first practice quiz",
    condition: "Pass any practice quiz with ≥ 80%.",
    icon: "🧭",
    isUnlocked: (state) => (state.badges || []).includes('letterExplorer')
  },
  {
    id: 'perfectQuiz',
    name: "Perfect Quiz",
    desc: "Scored 100% in a quiz",
    condition: "Get all correct answers on any quiz.",
    icon: "💯",
    isUnlocked: (state) => (state.badges || []).includes('perfectQuiz')
  },
  {
    id: 'lesson2',
    name: "Perseverance",
    desc: "Mastered Lesson 2",
    condition: "Complete and master Lesson 2.",
    icon: "💪",
    isUnlocked: (state) => state.lessons["2"]?.state === 'MASTERED'
  },
  {
    id: 'halfAlphabet',
    name: "Half the Alphabet",
    desc: "Mastered 13 or more letters",
    condition: "Reach 13+ letters mastered.",
    icon: "🔤",
    isUnlocked: (state) => Object.values(state.letterStreaks || {}).filter(c => c >= 5).length >= 13
  },
  {
    id: 'courseComplete',
    name: "Course Complete",
    desc: "Mastered all 4 alphabet lessons",
    condition: "Master all lessons.",
    icon: "🏆",
    isUnlocked: (state) => Object.values(state.lessons).every(l => l.state === 'MASTERED')
  }
];

// ── Lesson path configuration (labels only — no status hardcoded) ─────────────
const LESSON_PATH_DEFS = [
  { id: '1', label: "Lesson 1: Letters A–F", desc: "Master letters A to F" },
  { id: '2', label: "Lesson 2: Letters G–L", desc: "Master letters G to L" },
  { id: '3', label: "Lesson 3: Letters M–R", desc: "Master letters M to R" },
  { id: '4', label: "Lesson 4: Letters S–Z", desc: "Master letters S to Z" }
];

// ── Format relative timestamp ─────────────────────────────────────────────────
function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

const NotificationDropdown = ({ onClose }) => (
  <div className="glass-dropdown">
    <div className="dropdown-header">Notifications</div>
    {NOTIFICATIONS.map((notif) => (
      <div
        key={notif.id}
        className={`notification-item ${notif.unread ? 'unread' : ''}`}
        onClick={() => { alert(`Clicked notification: ${notif.text}`); onClose(); }}
      >
        {notif.unread && <span className="notification-dot-indicator" />}
        <div className="notification-content">
          <span className="notification-text">{notif.text}</span>
          <span className="notification-time">{notif.time}</span>
        </div>
      </div>
    ))}
  </div>
);

const ProfileDropdown = ({ userName, onLogout, onClose, navigate }) => (
  <div className="glass-dropdown" style={{ minWidth: '200px' }}>
    <div className="dropdown-header">{userName}</div>
    <button type="button" className="dropdown-action-item" onClick={() => { onClose(); navigate('/profile'); }}>
      <span>My Profile</span>
    </button>
    <button type="button" className="dropdown-action-item" onClick={() => { onClose(); navigate('/settings'); }}>
      <span>Settings</span>
    </button>
    <button type="button" className="dropdown-action-item logout-action" onClick={() => { onClose(); onLogout(); }}>
      <span>Logout</span>
    </button>
  </div>
);

const DashboardHeader = ({ greeting, userName, dateStr, onLogout, navigate }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <span className="welcome-title-desc">Learning Platform</span>
        <h1 className="header-welcome">{greeting}, {userName} 👋</h1>
      </div>
      <div className="header-right">
        <span className="header-date">{dateStr}</span>

        <div className="icon-button-container" ref={notificationRef}>
          <button type="button" className="notification-bell" aria-label="Open notifications dropdown" onClick={() => setShowNotifications(!showNotifications)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-badge" />
          </button>
          {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
        </div>

        <div className="icon-button-container" ref={profileRef}>
          <button type="button" className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)} aria-label="Open profile settings menu">
            <div className="profile-avatar">{getInitials(userName)}</div>
          </button>
          {showProfileMenu && (
            <ProfileDropdown userName={userName} onLogout={onLogout} onClose={() => setShowProfileMenu(false)} navigate={navigate} />
          )}
        </div>
      </div>
    </header>
  );
};

const WelcomeCard = ({ userLevel, onCardClick, progressState }) => {
  const completedLessons = Object.values(progressState.lessons).filter(l => l.state === 'MASTERED').length;
  const totalLessons = Object.keys(progressState.lessons).length;
  const xp = progressState.xp || 0;

  // Determine current stage label
  const { lessonId } = learningProgress.getCurrentUnfinishedLesson();
  const { title: currentLessonTitle } = learningProgress.getLessonMetadata(lessonId);

  return (
    <div className="dashboard-welcome-card" onClick={onCardClick}>
      <div className="welcome-info">
        <span className="welcome-title-desc">Overview</span>
        <h2 className="welcome-main-text">Welcome back! Continue your personalized Braille learning journey.</h2>
        <div className="welcome-level-row">
          <div className="level-meta-item">
            <span className="level-meta-label">Current Level</span>
            <span className="level-meta-val">{userLevel}</span>
          </div>
          <div className="level-meta-item">
            <span className="level-meta-label">Current Lesson</span>
            <span className="level-meta-val">{currentLessonTitle}</span>
          </div>
          <div className="level-meta-item">
            <span className="level-meta-label">Total XP</span>
            <span className="level-meta-val">{xp} XP</span>
          </div>
          <div className="level-meta-item">
            <span className="level-meta-label">Lessons Mastered</span>
            <span className="level-meta-val">{completedLessons} / {totalLessons}</span>
          </div>
        </div>
      </div>
    </div>
  );
};



const CircularProgress = ({ percent, size = 50, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="circular-progress-wrapper">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#60A5FA" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      </svg>
      <span className="circular-progress-text">{percent}%</span>
    </div>
  );
};

// ── ProgressCards — fully dynamic from learningProgress ──────────────────────
const ProgressCards = ({ progressState, onCardSelect }) => {
  const overallProgress = learningProgress.getOverallProgressPercent();
  const completedLessons = learningProgress.getCompletedLessonsCount();
  const masteredLetters = learningProgress.getMasteredLettersCount();
  const totalLessons = Object.keys(progressState.lessons).length;

  // Real average accuracy from stored quiz results
  let totalAcc = 0;
  let resultCount = 0;
  Object.values(progressState.lessons).forEach(l => {
    if (l.lastResult) { totalAcc += l.lastResult.percent; resultCount++; }
  });
  const avgAcc = resultCount > 0 ? Math.round(totalAcc / resultCount) : null;

  const statsData = [
    {
      id: 'progress', label: "Overall Progress",
      value: `${overallProgress}%`, desc: `${masteredLetters} / 26 letters mastered`,
      icon: "📈", circular: true, percent: overallProgress
    }
  ];

  return (
    <section className="stats-grid" aria-label="Statistics progress overview">
      {statsData.map((stat) => (
        <div key={stat.id} className="stat-glass-card" onClick={() => onCardSelect(stat.id)}>
          <div className="stat-left">
            <div className="stat-icon-wrapper" aria-hidden="true">{stat.icon}</div>
            <div className="stat-info">
              {!stat.circular && <span className="stat-value">{stat.value}</span>}
              <span className="stat-label">{stat.label}</span>
              <span className="stat-desc">{stat.desc}</span>
            </div>
          </div>
          {stat.circular && <CircularProgress percent={stat.percent} />}
        </div>
      ))}
    </section>
  );
};

// ── ContinueLearningCard — context-aware CTA ─────────────────────────────────
const ContinueLearningCard = ({ onResume, progressState }) => {
  const { lessonId, stepIdx } = learningProgress.getCurrentUnfinishedLesson();
  const { title, totalSteps } = learningProgress.getLessonMetadata(lessonId);
  const lessonState = progressState.lessons[lessonId]?.state;
  const unmasteredLetters = learningProgress.getUnmasteredLetters(lessonId);
  const allLessons = Object.keys(progressState.lessons);
  const allMastered = allLessons.every(id => progressState.lessons[id]?.state === 'MASTERED');

  let progressLabel, estimateText, percent, ctaLabel, icon, tag;

  if (allMastered) {
    // All lessons finished
    icon = '🏆';
    tag = 'All Complete';
    progressLabel = 'All 4 lessons mastered!';
    estimateText = 'You have completed the full Braille alphabet course.';
    percent = 100;
    ctaLabel = 'Review Lessons';
  } else if (lessonState === 'MASTERED') {
    // This lesson done but next exists
    const nextId = allLessons.find(id => progressState.lessons[id]?.state !== 'MASTERED');
    const { title: nextTitle } = learningProgress.getLessonMetadata(nextId || lessonId);
    icon = '🔓';
    tag = 'Next Lesson';
    progressLabel = nextTitle;
    estimateText = 'Start the next lesson!';
    percent = 0;
    ctaLabel = 'Start Next Lesson';
  } else if (lessonState === 'COMPLETED') {
    const allLetters = LESSON_LETTERS[lessonId] || [];
    const unmastered = unmasteredLetters.length;
    const mastered = allLetters.length - unmastered;
    icon = '🔄';
    tag = 'Practice Session';
    progressLabel = `${mastered} / ${allLetters.length} letters mastered`;
    estimateText = `${unmastered} letter${unmastered !== 1 ? 's' : ''} still need practice.`;
    percent = allLetters.length > 0 ? Math.round((mastered / allLetters.length) * 100) : 0;
    ctaLabel = 'Continue Practice';
  } else {
    icon = '📚';
    tag = 'Resume Learning';
    percent = Math.round((stepIdx / Math.max(1, totalSteps - 1)) * 100);
    progressLabel = `Step ${stepIdx + 1} of ${totalSteps}`;
    estimateText = 'Pick up where you left off!';
    ctaLabel = 'Continue Lesson';
  }

  return (
    <section className="continue-learning-card" aria-label="Resume learning lesson" onClick={onResume}>
      <div className="learning-details">
        <div className="learning-details-header">
          <div className="learning-icon-box" aria-hidden="true">{icon}</div>
          <span className="learning-tag">{tag}</span>
          <span className="learning-diff-badge">Beginner</span>
        </div>
        <h2 className="learning-title">{allMastered ? 'Congratulations! 🎉' : title}</h2>
        <p className="learning-progress-label">{progressLabel}</p>
        <div className="progress-bar-track" style={{ height: '8px' }}>
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress" />
        </div>
        <p className="learning-estimate">{estimateText}</p>
      </div>
      <div className="resume-btn-wrapper">
        <button type="button" className="resume-btn" onClick={(e) => { e.stopPropagation(); onResume(); }}>
          <span>{ctaLabel}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </section>
  );
};

// ── LearningPath — fully dynamic from progressState ──────────────────────────
const LearningPath = ({ progressState }) => {
  // Compute status for each lesson node
  const pathStages = LESSON_PATH_DEFS.map((def, idx) => {
    const lessonRecord = progressState.lessons[def.id];
    const rawState = lessonRecord?.state || 'NOT_STARTED';

    // Mastery counts for this lesson
    const letters = LESSON_LETTERS[def.id] || [];
    const masteredCount = letters.filter(l => (progressState.letterStreaks[l] || 0) >= 5).length;
    const masteryPercent = letters.length > 0 ? Math.round((masteredCount / letters.length) * 100) : 0;

    let status;
    if (rawState === 'MASTERED') status = 'completed';
    else if (rawState === 'COMPLETED' || rawState === 'IN_PROGRESS') status = 'active';
    else {
      const isUnlocked = def.id === '1' ||
        (progressState.lessons[(parseInt(def.id, 10) - 1).toString()]?.state === 'MASTERED');
      status = isUnlocked ? 'active' : 'locked';
    }

    return { ...def, status, masteredCount, totalLetters: letters.length, masteryPercent, rawState };
  });

  return (
    <section className="learning-path-panel" aria-label="Learning Journey Path">
      <h2 className="section-title">Braille Learning Journey</h2>
      <div className="path-stages-container">
        <div className="path-connector-line" />
        <div className="path-connector-line-active" style={{ height: '25%' }} />

        {pathStages.map((stage, idx) => (
          <div key={stage.id} className={`path-stage-item ${stage.status}`}>
            <div className="stage-step-indicator">
              {stage.status === 'completed' ? '✓' : idx + 1}
            </div>
            <div className="stage-details">
              <div className="stage-label-row">
                <span className="stage-title">{stage.label}</span>
                {stage.status === 'active' && (
                  <span className="stage-status-pill active">
                    {stage.rawState === 'MASTERED' ? 'Mastered' : stage.rawState === 'COMPLETED' ? 'Practice' : 'Active'}
                  </span>
                )}
                {stage.status === 'completed' && (
                  <span className="stage-status-pill active" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }}>
                    100%
                  </span>
                )}
              </div>
              <span className="stage-desc">
                {stage.status === 'locked'
                  ? `🔒 ${stage.desc}`
                  : stage.status === 'completed'
                    ? `✓ All ${stage.totalLetters} letters mastered`
                    : stage.totalLetters > 0
                      ? `${stage.masteredCount} / ${stage.totalLetters} letters mastered (${stage.masteryPercent}%)`
                      : stage.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Achievement Summary — fully dynamic from progressState ───────────────────
const AchievementSummary = ({ progressState }) => {
  const navigate = useNavigate();

  const lessons = Object.values(progressState.lessons || {});
  const lessonsCompleted = lessons.filter(l => l.state === 'COMPLETED' || l.state === 'MASTERED').length;
  const lessonsMastered = lessons.filter(l => l.state === 'MASTERED').length;
  const lettersMastered = Object.values(progressState.letterStreaks || {}).filter(s => s >= 5).length;
  const overallProgress = learningProgress.getOverallProgressPercent();

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
  
  const pLast = (progressState.practiceState && progressState.practiceState.lastResult) || null;
  const practiceSessions = (progressState.practiceState && progressState.practiceState.sessionsCompleted) || 0;
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
  const lockedAchievements = totalAchievements - unlockedAchievements;

  return (
    <section className="sidebar-summary-card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Achievement Summary</h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px', color: '#34D399', fontWeight: '800' }}>
          {unlockedAchievements} / {totalAchievements}
        </span>
        <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unlocked</span>
      </div>
      
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ width: `${achievementCompletion}%`, height: '100%', background: '#F59E0B', borderRadius: '3px' }}></div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '16px', color: '#34D399', fontWeight: '700' }}>{unlockedAchievements}</span>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unlocked</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '16px', color: '#64748B', fontWeight: '700' }}>{lockedAchievements}</span>
          <span style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Locked</span>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/achievements')}
        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        View Achievements <span>→</span>
      </button>
    </section>
  );
};


// MAIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Live progress state — refreshed by storage events + polling
  const [progressState, setProgressState] = useState(() => learningProgress.getState());

  useEffect(() => {
    // Read page heading on mount
    voiceGuidance.readPageHeading("Dashboard");
  }, []);

  const [currentDateStr, setCurrentDateStr] = useState('');
  const [timeGreeting, setTimeGreeting] = useState('Good Morning');



  // ── Auth & MongoDB State Load ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); }

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateStr(new Date().toLocaleDateString('en-US', dateOptions));

    const hours = new Date().getHours();
    if (hours < 12) setTimeGreeting('Good Morning');
    else if (hours < 18) setTimeGreeting('Good Afternoon');
    else setTimeGreeting('Good Evening');

    // Fetch user profile & full progress from MongoDB
    const loadBackendData = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || '';
        const profileRes = await fetch(`${API}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (profileData.success && profileData.user) {
          setUser(profileData.user);
          localStorage.setItem('user', JSON.stringify(profileData.user));
        }

        const latestState = await learningProgress.loadStateFromBackend();
        if (latestState) setProgressState(latestState);
      } catch (err) {
        console.error("Dashboard backend load error:", err);
      }
    };
    loadBackendData();
  }, [navigate]);

  // ── Auto-sync: storage event + 2s polling ──
  useEffect(() => {
    const syncState = () => {
      setProgressState(learningProgress.getState());
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch (e) {}
      }
    };
    
    window.addEventListener('storage', syncState);
    const interval = setInterval(syncState, 2000);
    return () => {
      window.removeEventListener('storage', syncState);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    learningProgress.clearLocalState();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleCardSelect = (cardId) => {
    if (cardId === 'progress' || cardId === 'lessons') navigate('/learn');
    else if (cardId === 'accuracy') navigate('/learn');
    else navigate('/dashboard');
  };

  if (!user) return null;

  return (
    <div className={`dashboard-layout`}>
      <Sidebar activeTab="dashboard" />

      <div className="dashboard-workspace">
        <DashboardHeader
          greeting={timeGreeting}
          userName={user.name || 'Student'}
          dateStr={currentDateStr}
          onLogout={handleLogout}
          navigate={navigate}
        />

        <main className="dashboard-content">
          {/* TOP ROW: Welcome */}
          <div className="top-row-grid" style={{ gridTemplateColumns: '1fr' }}>
            <WelcomeCard
              userLevel={user.proficiency_level || user.experience_level || 'Beginner'}
              onCardClick={() => navigate('/profile')}
              progressState={progressState}
            />
          </div>

          {/* STATS GRID */}
          <ProgressCards progressState={progressState} onCardSelect={handleCardSelect} />

          {/* MAIN CONTENT STACK */}
          <div className="dashboard-main-stack">
            <ContinueLearningCard
              onResume={() => {
                learningProgress.logActivity('resume', 'Resumed learning', '▶');
                navigate(learningProgress.getResumePath());
              }}
              progressState={progressState}
            />
            <LearningPath progressState={progressState} />
            <AchievementSummary progressState={progressState} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
