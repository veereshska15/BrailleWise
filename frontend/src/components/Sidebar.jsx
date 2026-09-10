import React from 'react';
import { useNavigate } from 'react-router-dom';
import learningProgress from '../utils/learningProgress';

const MENU_ITEMS = [
  { id: 'dashboard', label: "Dashboard", icon: "grid" },
  { id: 'learn', label: "Learn Braille", icon: "book" },
  { id: 'quiz', label: "Practice Quiz", icon: "edit" },
  { id: 'performance', label: "Performance", icon: "bar-chart" },
  { id: 'achievements', label: "Achievements", icon: "award" },
  { id: 'voice', label: "Voice Guidance", icon: "mic" },
  { id: 'profile', label: "Profile", icon: "user" },
  { id: 'settings', label: "Settings", icon: "settings" }
];

const Sidebar = ({ activeTab }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    learningProgress.clearLocalState();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenuClick = (itemId) => {
    if (itemId === 'dashboard') {
      navigate('/dashboard');
    } else if (itemId === 'learn') {
      navigate('/learn');
    } else if (itemId === 'quiz') {
      navigate('/practice');
    } else if (itemId === 'performance') {
      navigate('/performance');
    } else if (itemId === 'achievements') {
      navigate('/achievements');
    } else if (itemId === 'profile') {
      navigate('/profile');
    } else if (itemId === 'settings') {
      navigate('/settings');
    } else if (itemId === 'voice') {
      navigate('/voice');
    } else {
      navigate(`/dashboard?tab=${itemId}`);
    }
  };

  const renderMenuIcon = (iconName) => {
    switch (iconName) {
      case 'grid':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'book':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'edit':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        );
      case 'bar-chart':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'award':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
        );
      case 'mic':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
          </svg>
        );
      case 'user':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'settings':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="sidebar-nav" aria-label="Main sidebar navigation">
      <div className="sidebar-logo-container" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <svg className="sidebar-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" stroke="#60A5FA" strokeWidth="3" fill="none" />
          <circle cx="30" cy="35" r="7" fill="#60A5FA" />
          <circle cx="70" cy="35" r="7" fill="#60A5FA" />
          <circle cx="30" cy="65" r="7" fill="#60A5FA" />
          <circle cx="70" cy="65" r="7" fill="rgba(255, 255, 255, 0.1)" />
        </svg>
        <span className="sidebar-brand-name">BrailleWise</span>
      </div>

      <div className="sidebar-menu">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-item ${activeTab === item.id ? 'menu-item-active' : ''}`}
            onClick={() => handleMenuClick(item.id)}
            aria-label={`Open ${item.label}`}
          >
            {renderMenuIcon(item.icon)}
            <span>{item.label}</span>
          </button>
        ))}

        <button
          type="button"
          className="menu-item menu-item-logout"
          onClick={handleLogout}
          aria-label="Logout of application"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
