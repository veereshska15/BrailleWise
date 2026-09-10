import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Learn.css';
import learningProgress, { LESSON_LETTERS } from '../utils/learningProgress';
import voiceGuidance from '../utils/voiceGuidance';

// ── Static course structure (labels, icons, metadata only — NO status) ───────
// Lessons 1–4 are the mastery-based alphabet lessons wired to learningProgress.
// Lessons 5+ are future content (permanently locked until backend adds them).
const SECTIONS = [
  {
    id: 1,
    title: "Section 1: Alphabet Fundamentals",
    icon: "🅰️",
    lessons: [
      { id: 1, number: "Lesson 1", title: "Letters A–F", difficulty: "Beginner", duration: "8 min", icon: "🅰️" },
      { id: 2, number: "Lesson 2", title: "Letters G–L", difficulty: "Beginner", duration: "10 min", icon: "🅶" },
      { id: 3, number: "Lesson 3", title: "Letters M–R", difficulty: "Beginner", duration: "12 min", icon: "Ⓜ️" },
      { id: 4, number: "Lesson 4", title: "Letters S–Z", difficulty: "Beginner", duration: "11 min", icon: "🆂" }
    ]
  },
  {
    id: 2,
    title: "Section 2: Basic Words",
    icon: "👨‍👩",
    lessons: [
      { id: 5, number: "Lesson 5", title: "Family Words", difficulty: "Intermediate", duration: "15 min", icon: "👨‍👩‍👧" },
      { id: 6, number: "Lesson 6", title: "Food Words", difficulty: "Intermediate", duration: "14 min", icon: "🍎" }
    ]
  },
  {
    id: 3,
    title: "Section 3: Common Sentences",
    icon: "💬",
    lessons: [
      { id: 7, number: "Lesson 7", title: "Greeting Phrases", difficulty: "Intermediate", duration: "18 min", icon: "💬" },
      { id: 8, number: "Lesson 8", title: "Direction Phrases", difficulty: "Advanced", duration: "20 min", icon: "🧭" }
    ]
  },
  {
    id: 4,
    title: "Section 4: Reading Practice",
    icon: "📖",
    lessons: [
      { id: 9, number: "Lesson 9", title: "Short Paragraphs", difficulty: "Advanced", duration: "25 min", icon: "📖" },
      { id: 10, number: "Lesson 10", title: "Interactive Dialogs", difficulty: "Advanced", duration: "22 min", icon: "👥" }
    ]
  },
  {
    id: 5,
    title: "Section 5: Advanced Reading",
    icon: "🎖️",
    lessons: [
      { id: 11, number: "Lesson 11", title: "Literary Braille Contractions", difficulty: "Advanced", duration: "30 min", icon: "🎖️" },
      { id: 12, number: "Lesson 12", title: "Complex Punctuation Symbols", difficulty: "Advanced", duration: "28 min", icon: "❓" }
    ]
  }
];

const NOTIFICATIONS = [
  { id: 1, text: "Lesson unlocked: Lesson 2 is now available.", time: "2h ago", unread: true },
  { id: 2, text: "Achievement earned: 'First Steps' badge.", time: "Yesterday", unread: false },
  { id: 3, text: "Daily reminder: Keep your learning streak active!", time: "2 days ago", unread: false }
];

// ── Compute dynamic lesson data from learningProgress state ──────────────────
//
// Returns a lesson object enriched with:
//   status:          'locked' | 'unlocked' | 'in_progress' | 'completed' | 'mastered'
//   masteredCount:   number of mastered letters
//   totalLetters:    total letters in this lesson (0 for future lessons)
//   masteryPercent:  0–100
//   lessonState:     raw state from learningProgress ('NOT_STARTED' etc.)
//
function computeLessonStatus(lessonId, progressState) {
  const idStr = lessonId.toString();
  const lessonLetters = LESSON_LETTERS[idStr] || [];
  const totalLetters = lessonLetters.length;

  // Future lessons (5+) have no letter data — always locked
  if (totalLetters === 0) {
    return {
      status: 'locked',
      masteredCount: 0,
      totalLetters: 0,
      masteryPercent: 0,
      lessonState: 'NOT_STARTED'
    };
  }

  const lessonRecord = progressState.lessons[idStr];
  const rawState = lessonRecord?.state || 'NOT_STARTED';

  // Count how many letters in this lesson have streak >= 5
  const masteredCount = lessonLetters.filter(
    l => (progressState.letterStreaks[l] || 0) >= 5
  ).length;
  const masteryPercent = totalLetters > 0 ? Math.round((masteredCount / totalLetters) * 100) : 0;

  const isMastered = rawState === 'MASTERED' || (totalLetters > 0 && masteredCount === totalLetters);

  // Check previous lesson mastery
  const prevId = (parseInt(idStr, 10) - 1).toString();
  const prevLetters = LESSON_LETTERS[prevId] || [];
  const prevMasteredCount = prevLetters.filter(l => (progressState.letterStreaks[l] || 0) >= 5).length;
  const prevIsMastered = progressState.lessons[prevId]?.state === 'MASTERED' || (prevLetters.length > 0 && prevMasteredCount === prevLetters.length);

  // Determine display status
  let status;
  if (isMastered) {
    status = 'mastered';
  } else if (rawState === 'COMPLETED') {
    // Content finished but quiz loop still running
    status = 'completed';
  } else if (rawState === 'IN_PROGRESS') {
    status = 'in_progress';
  } else {
    const isUnlocked = idStr === '1' || prevIsMastered;
    status = isUnlocked ? 'unlocked' : 'locked';
  }

  return { status, masteredCount, totalLetters, masteryPercent, lessonState: rawState };
}

// ── Status icon renderer ─────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === 'mastered') {
    return (
      <svg className="status-icon-completed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (status === 'in_progress' || status === 'unlocked' || status === 'completed') {
    return (
      <svg className="status-icon-current" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    );
  }
  // locked default
  return (
    <svg className="status-icon-locked" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
};

// ── LessonCard ───────────────────────────────────────────────────────────────
const LessonCard = ({ lesson, onSelect, shakingCardId }) => {
  const isShaking = shakingCardId === lesson.id;
  const { status, masteredCount, totalLetters, masteryPercent } = lesson;

  // Map internal status to CSS class that drives existing card styles
  const cssStatus = status === 'mastered' ? 'completed'
    : (status === 'in_progress' || status === 'unlocked' || status === 'completed') ? 'current'
    : 'locked';

  // Button label
  const buttonLabel =
    status === 'mastered' ? 'Review Lesson'
    : status === 'locked' ? 'Locked'
    : status === 'completed' ? 'Continue Practice'
    : 'Continue Learning';

  const isNavigable = status !== 'locked';

  return (
    <div
      className={`lesson-selection-card ${cssStatus} ${isShaking ? 'shake' : ''}`}
      onClick={() => onSelect(lesson)}
      aria-label={`${lesson.number} ${lesson.title}, Status: ${status}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px', position: 'relative' }}
    >
      {/* Locked tooltip */}
      {isShaking && (
        <div style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          background: '#EF4444', color: '#FFFFFF', padding: '6px 12px', borderRadius: '6px',
          fontSize: '12px', fontWeight: '600', boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          zIndex: 10, whiteSpace: 'nowrap'
        }}>
          Complete the previous lesson to unlock.
        </div>
      )}

      {/* Top row: icon + meta + status icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="lesson-card-left">
          <div className="lesson-card-icon-box" aria-hidden="true">{lesson.icon}</div>
          <div className="lesson-card-meta">
            <div className="lesson-card-number-row">
              <span className="lesson-card-number">{lesson.number}</span>
              <span className={`lesson-diff-label ${lesson.difficulty.toLowerCase()}`}>{lesson.difficulty}</span>
            </div>
            <span className="lesson-card-title">{lesson.title}</span>
          </div>
        </div>
        <div className="lesson-card-right">
          <span className="lesson-card-duration">{lesson.duration}</span>
          <div className="lesson-status-indicator">
            <StatusIcon status={status} />
          </div>
        </div>
      </div>

      {/* Mastery progress row — shown for lessons with letter data that are not locked */}
      {totalLetters > 0 && status !== 'locked' && (
        <div style={{ padding: '0 2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8', marginBottom: '5px' }}>
            <span>
              Letters Mastered: <strong style={{ color: status === 'mastered' ? '#34D399' : '#FFFFFF' }}>
                {masteredCount} / {totalLetters}
              </strong>
            </span>
            <span style={{ color: status === 'mastered' ? '#34D399' : '#60A5FA', fontWeight: '600' }}>
              {masteryPercent}%
            </span>
          </div>
          <div className="progress-bar-track" style={{ height: '5px', marginBottom: '6px' }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${masteryPercent}%`, background: status === 'mastered' ? '#34D399' : undefined }}
              role="progressbar"
              aria-valuenow={masteryPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${lesson.title} mastery progress`}
            />
          </div>
        </div>
      )}

      {/* Bottom action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Status pill */}
        <span style={{
          fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
          padding: '3px 8px', borderRadius: '6px',
          background: status === 'mastered' ? 'rgba(52,211,153,0.15)'
            : status === 'completed' ? 'rgba(251,191,36,0.15)'
            : status === 'in_progress' ? 'rgba(96,165,250,0.15)'
            : status === 'unlocked' ? 'rgba(167,243,208,0.12)'
            : 'rgba(255,255,255,0.06)',
          color: status === 'mastered' ? '#34D399'
            : status === 'completed' ? '#FCD34D'
            : status === 'in_progress' ? '#60A5FA'
            : status === 'unlocked' ? '#A7F3D0'
            : '#64748B'
        }}>
          {status === 'mastered' ? '✓ Mastered'
            : status === 'completed' ? '🔄 Practice'
            : status === 'in_progress' ? '▶ In Progress'
            : status === 'unlocked' ? '🔓 Unlocked'
            : '🔒 Locked'}
        </span>

        {/* CTA button */}
        {isNavigable && (
          <button
            type="button"
            className={`nav-btn ${status === 'mastered' ? '' : 'btn-primary'}`}
            style={{
              padding: '6px 14px', fontSize: '12px', fontWeight: '600',
              background: status === 'mastered' ? 'rgba(52,211,153,0.12)' : undefined,
              border: status === 'mastered' ? '1px solid rgba(52,211,153,0.3)' : undefined,
              color: status === 'mastered' ? '#34D399' : undefined
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(lesson); }}
          >
            {buttonLabel}
          </button>
        )}

        {/* Locked explanation */}
        {status === 'locked' && (
          <span className="lesson-locked-explanation" aria-live="polite" style={{ fontSize: '11px' }}>
            🔒 Complete Lesson {lesson.id - 1} to unlock.
          </span>
        )}
      </div>
    </div>
  );
};

// ── SectionAccordion ─────────────────────────────────────────────────────────
const SectionAccordion = ({ section, searchTerm, filterStatus, onSelectLesson, shakingCardId, isExpanded, onToggle }) => {
  const filteredLessons = section.lessons.filter(lesson => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.status.toLowerCase().includes(searchTerm.toLowerCase());

    // Map filter dropdown values to status values
    let matchesFilter = filterStatus === 'all';
    if (!matchesFilter) {
      if (filterStatus === 'current') matchesFilter = ['in_progress', 'unlocked', 'completed'].includes(lesson.status);
      else if (filterStatus === 'completed') matchesFilter = lesson.status === 'mastered';
      else if (filterStatus === 'locked') matchesFilter = lesson.status === 'locked';
      else matchesFilter = lesson.status === filterStatus;
    }
    return matchesSearch && matchesFilter;
  });

  if (filteredLessons.length === 0) return null;

  // Use mastered count for section progress
  const masteredCount = section.lessons.filter(l => l.status === 'mastered').length;
  const sectionProgressPercent = Math.round((masteredCount / section.lessons.length) * 100);

  return (
    <div className="accordion-section-card">
      <div
        className="accordion-header"
        onClick={onToggle}
        aria-expanded={isExpanded}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div className="accordion-header-left">
          <div className="accordion-icon-box" aria-hidden="true">{section.icon}</div>
          <div className="accordion-title-meta">
            <div className="accordion-title-row">
              <h2 className="accordion-title">{section.title}</h2>
              <span className="accordion-completed-badge">
                {masteredCount} / {section.lessons.length} Mastered
              </span>
            </div>
            <div className="accordion-progress-bar-track">
              <div
                className="accordion-progress-bar-fill"
                style={{ width: `${sectionProgressPercent}%` }}
                role="progressbar"
                aria-valuenow={sectionProgressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${section.title} section progress`}
              />
            </div>
          </div>
        </div>

        <div className="accordion-header-right">
          <svg className={`chevron-icon ${isExpanded ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <div className={`accordion-content-panel ${isExpanded ? 'expanded' : ''}`}>
        {isExpanded && (
          <div className="accordion-content-inner">
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onSelect={onSelectLesson}
                shakingCardId={shakingCardId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── CurrentLessonCard (unchanged from previous session) ──────────────────────
const CurrentLessonCard = ({ onResume }) => {
  const state = learningProgress.getState();
  const { lessonId, stepIdx } = learningProgress.getCurrentUnfinishedLesson();
  const { title, totalSteps } = learningProgress.getLessonMetadata(lessonId);
  const lessonState = state.lessons[lessonId]?.state;
  const unmasteredLetters = learningProgress.getUnmasteredLetters(lessonId);

  let progressLabel, estimateText, percent;
  if (lessonState === 'COMPLETED') {
    const allLetters = LESSON_LETTERS[lessonId] || [];
    const unmastered = unmasteredLetters.length;
    const mastered = allLetters.length - unmastered;
    progressLabel = `${unmastered} letter${unmastered !== 1 ? 's' : ''} left to master`;
    estimateText = `Keep practicing to unlock the next lesson!`;
    percent = allLetters.length > 0 ? Math.round((mastered / allLetters.length) * 100) : 0;
  } else {
    percent = Math.round((stepIdx / Math.max(1, totalSteps - 1)) * 100);
    progressLabel = `Step ${stepIdx + 1} of ${totalSteps}`;
    estimateText = `Pick up where you left off!`;
  }

  return (
    <section className="learn-featured-card" aria-label="Continue learning featured lesson" onClick={onResume}>
      <div className="learning-details">
        <div className="learning-details-header">
          <div className="learning-icon-box" aria-hidden="true">{lessonState === 'COMPLETED' ? '🔄' : '📚'}</div>
          <span className="learning-tag">{lessonState === 'COMPLETED' ? 'Practice Session' : 'Resume Learning'}</span>
          <span className="learning-diff-badge">Beginner</span>
        </div>
        <h2 className="learning-title">{title}</h2>
        <p className="learning-progress-label">{progressLabel}</p>
        <div className="progress-bar-track" style={{ height: '8px', marginBottom: '10px' }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Current lesson progress"
          />
        </div>
        <p className="learning-estimate">{estimateText}</p>
      </div>
      <div className="resume-btn-wrapper">
        <button type="button" className="resume-btn" onClick={(e) => { e.stopPropagation(); onResume(); }}>
          <span>Resume Learning</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </section>
  );
};

// ── FilterBar (unchanged UI, filter values now map to new status names) ──────
const FilterBar = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: "all", label: "All Lessons" },
    { value: "current", label: "Active / In Progress" },
    { value: "completed", label: "Mastered" },
    { value: "locked", label: "Locked" }
  ];

  const currentLabel = options.find(o => o.value === filterStatus)?.label || "All Lessons";

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleKeyDown = (e, optionValue) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFilterStatus(optionValue);
      setIsOpen(false);
    }
  };

  return (
    <div className="filter-search-bar">
      <div className="search-input-wrapper">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search lessons (by title, number, status, section)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search lessons"
        />
      </div>
      <div className="custom-select-container" ref={dropdownRef}>
        <button
          type="button"
          className="custom-select-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Filter lessons selection"
        >
          <span>{currentLabel}</span>
          <svg className={`chevron-icon ${isOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isOpen && (
          <div className="custom-options-dropdown" role="listbox" aria-label="Filter options">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`custom-option-item ${filterStatus === option.value ? 'selected' : ''}`}
                onClick={() => { setFilterStatus(option.value); setIsOpen(false); }}
                onKeyDown={(e) => handleKeyDown(e, option.value)}
                role="option"
                aria-selected={filterStatus === option.value}
                tabIndex={0}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── ProgressCard ─────────────────────────────────────────────────────────────
const ProgressCard = () => {
  const overallProgress = learningProgress.getOverallProgressPercent();
  const completedLessons = learningProgress.getCompletedLessonsCount();

  return (
    <section className="sidebar-summary-card" aria-label="Course overall progress status">
      <h2 className="section-title">Course Progress</h2>
      <div className="summary-stats-list" style={{ marginTop: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
          <span style={{ color: '#94A3B8' }}>Overall Completion</span>
          <span style={{ color: '#60A5FA' }}>{overallProgress}%</span>
        </div>
        <div className="progress-bar-track" style={{ height: '10px', marginBottom: '14px' }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${overallProgress}%` }}
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course completion progress"
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8' }}>
          <span>Lessons Mastered:</span>
          <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{completedLessons} / 4</span>
        </div>
      </div>
    </section>
  );
};

// ── MilestoneCard ─────────────────────────────────────────────────────────────
const MilestoneCard = () => {
  const completedLessons = learningProgress.getCompletedLessonsCount();
  const masteredLetters = learningProgress.getMasteredLettersCount();

  return (
    <section className="sidebar-summary-card" aria-label="Course learning milestones summary">
      <h2 className="section-title">Milestones</h2>
      <div className="summary-stats-list">
        <div className="summary-stat-row">
          <span className="summary-stat-icon" aria-hidden="true">✔</span>
          <div className="summary-stat-info">
            <span className="summary-stat-label">Mastered Lessons</span>
            <span className="summary-stat-value">{completedLessons} {completedLessons === 1 ? 'Lesson' : 'Lessons'}</span>
          </div>
        </div>
        <div className="summary-stat-row">
          <span className="summary-stat-icon" aria-hidden="true">🔡</span>
          <div className="summary-stat-info">
            <span className="summary-stat-label">Letters Mastered</span>
            <span className="summary-stat-value">{masteredLetters} / 26</span>
          </div>
        </div>
        <div className="summary-stat-row">
          <span className="summary-stat-icon" aria-hidden="true">⏱</span>
          <div className="summary-stat-info">
            <span className="summary-stat-label">Learning Time</span>
            <span className="summary-stat-value">1 hr 20 mins</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── MAIN LESSON LIBRARY COMPONENT ────────────────────────────────────────────
const LessonLibrary = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Live progress state — re-read whenever localStorage changes (mastery updates)
  const [progressState, setProgressState] = useState(() => learningProgress.getState());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedSectionId, setExpandedSectionId] = useState(1);
  const [shakingCardId, setShakingCardId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // ── Auth check & backend state sync ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    try { setUser(JSON.parse(storedUser)); } catch (e) { navigate('/login'); }
    
    // Read page heading
    voiceGuidance.readPageHeading("Learn Braille");

    learningProgress.loadStateFromBackend().then(st => {
      if (st) setProgressState(st);
    });
  }, [navigate]);

  // ── Auto-sync: listen for storage changes so mastery updates reflect immediately ──
  useEffect(() => {
    const syncState = () => setProgressState(learningProgress.getState());

    // Fires when another tab writes to localStorage
    window.addEventListener('storage', syncState);

    // Also poll every 2 s as a fallback for same-tab updates
    // (same-tab localStorage writes don't fire the 'storage' event)
    const interval = setInterval(syncState, 2000);

    return () => {
      window.removeEventListener('storage', syncState);
      clearInterval(interval);
    };
  }, []);

  // ── Click outside dropdowns ──
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    learningProgress.clearLocalState();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleResume = () => navigate(learningProgress.getResumePath());

  // ── Build dynamic sections: enrich every lesson with computed status ──────
  const dynamicSections = SECTIONS.map(section => ({
    ...section,
    lessons: section.lessons.map(lesson => {
      const computed = computeLessonStatus(lesson.id, progressState);
      return { ...lesson, ...computed };
    })
  }));

  const handleSelectLesson = (lesson) => {
    if (lesson.status === 'locked') {
      // Shake animation feedback
      setShakingCardId(lesson.id);
      setTimeout(() => setShakingCardId(null), 500);
      return;
    }

    // Mastered lesson → review mode: navigate to lesson player (mastery not affected)
    if (lesson.status === 'mastered') {
      localStorage.setItem('lastActiveLessonId', lesson.id.toString());
      navigate(`/learn/lesson/${lesson.id}`);
      return;
    }

    // COMPLETED (quiz practice loop) → go to quiz
    if (lesson.status === 'completed') {
      navigate(`/learn/${lesson.id}/quiz`);
      return;
    }

    // Unlocked or in_progress → lesson player
    localStorage.setItem('lastActiveLessonId', lesson.id.toString());
    navigate(`/learn/lesson/${lesson.id}`);
  };

  const handleSectionToggle = (sectionId) => {
    setExpandedSectionId(expandedSectionId === sectionId ? null : sectionId);
  };

  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0][0].toUpperCase();
  };

  const hasMatches = dynamicSections.some(section => {
    return section.lessons.some(lesson => {
      const matchesSearch =
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.status.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesFilter = filterStatus === 'all';
      if (!matchesFilter) {
        if (filterStatus === 'current') matchesFilter = ['in_progress', 'unlocked', 'completed'].includes(lesson.status);
        else if (filterStatus === 'completed') matchesFilter = lesson.status === 'mastered';
        else if (filterStatus === 'locked') matchesFilter = lesson.status === 'locked';
        else matchesFilter = lesson.status === filterStatus;
      }
      return matchesSearch && matchesFilter;
    });
  });

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="learn" />

      <div className="dashboard-workspace">
        {/* HEADER BAR */}
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">BrailleWise</span>
            <h1 className="header-welcome">Lesson Library</h1>
            <p className="welcome-title-desc" style={{ marginTop: '4px', textTransform: 'none', fontSize: '13px', color: '#93C5FD', fontWeight: '500' }}>
              Continue your personalized Braille learning journey.
            </p>
          </div>

          <div className="header-right">
            <span className="header-date">English Braille Fundamentals</span>

            {/* Notification Bell */}
            <div className="icon-button-container" ref={notificationRef}>
              <button type="button" className="notification-bell" aria-label="Open notifications dropdown" onClick={() => setShowNotifications(!showNotifications)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="notification-badge" />
              </button>
              {showNotifications && (
                <div className="glass-dropdown">
                  <div className="dropdown-header">Alerts</div>
                  {NOTIFICATIONS.map((notif) => (
                    <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`} onClick={() => alert(`Alert detail: ${notif.text}`)}>
                      {notif.unread && <span className="notification-dot-indicator" />}
                      <div className="notification-content">
                        <span className="notification-text">{notif.text}</span>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="icon-button-container" ref={profileRef}>
              <button type="button" className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)} aria-label="Open profile settings menu">
                <div className="profile-avatar">{getInitials(user.name)}</div>
              </button>
              {showProfileMenu && (
                <div className="glass-dropdown" style={{ minWidth: '200px' }}>
                  <div className="dropdown-header">{user.name}</div>
                  <button type="button" className="dropdown-action-item" onClick={() => { setShowProfileMenu(false); navigate('/dashboard?tab=profile'); }}>
                    <span>My Profile</span>
                  </button>
                  <button type="button" className="dropdown-action-item" onClick={() => { setShowProfileMenu(false); navigate('/dashboard?tab=settings'); }}>
                    <span>Settings</span>
                  </button>
                  <button type="button" className="dropdown-action-item logout-action" onClick={handleLogout}>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <main className="learn-content">
          <div className="learn-main-grid">
            {/* Left column */}
            <div className="learn-left-column">
              <CurrentLessonCard onResume={handleResume} />

              <FilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
              />

              {hasMatches ? (
                <div className="accordion-wrapper" role="list" aria-label="Course sections accordion">
                  {dynamicSections.map((section) => (
                    <SectionAccordion
                      key={section.id}
                      section={section}
                      searchTerm={searchTerm}
                      filterStatus={filterStatus}
                      onSelectLesson={handleSelectLesson}
                      shakingCardId={shakingCardId}
                      isExpanded={expandedSectionId === section.id}
                      onToggle={() => handleSectionToggle(section.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state-panel" aria-live="assertive">
                  <div className="empty-state-icon" aria-hidden="true">🔍</div>
                  <h2 className="empty-state-title">No lessons found.</h2>
                  <p className="empty-state-desc">Try another search or filter criteria.</p>
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="learn-right-column">
              <ProgressCard />
              <MilestoneCard />
              <button
                type="button"
                className="voice-guidance-btn"
                onClick={() => alert("Auditory voice guidance will be connected in future backend integration.")}
                style={{ width: '100%' }}
                aria-label="Toggle voice guidance (not functional yet)"
              >
                <svg className="voice-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
                </svg>
                <span>Voice Guidance</span>
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="dashboard-footer-wrapper">
            <footer className="dashboard-footer">
              <span className="footer-left">BrailleWise v1.0</span>
              <div className="footer-links">
                <a href="#accessibility" className="footer-link" onClick={() => alert("Accessibility policy.")}>Accessibility</a>
                <a href="#privacy" className="footer-link" onClick={() => alert("Privacy policy.")}>Privacy Policy</a>
                <a href="#help" className="footer-link" onClick={() => alert("Help and support.")}>Help &amp; Support</a>
                <a href="#about" className="footer-link" onClick={() => alert("About BrailleWise.")}>About</a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LessonLibrary;
