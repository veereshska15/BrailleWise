import React, { useState, useEffect, useRef } from 'react';
import voiceGuidance from '../utils/voiceGuidance';
import './FloatingAccessibility.css';

const FloatingAccessibility = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setUnsupported(true);
    }

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (unsupported) return null;

  return (
    <div className="floating-a11y-container" ref={menuRef}>
      {isOpen && (
        <div className="floating-a11y-menu">
          <button className="a11y-menu-btn" onClick={() => { setIsOpen(false); voiceGuidance.readCurrentPage(); }}>
            Read This Page
          </button>
          <button className="a11y-menu-btn" onClick={() => { setIsOpen(false); voiceGuidance.readCurrentLesson(); }}>
            Read Current Lesson
          </button>
          <button className="a11y-menu-btn" onClick={() => { setIsOpen(false); voiceGuidance.readLearningProgress(); }}>
            Read My Progress
          </button>
          <button className="a11y-menu-btn" onClick={() => { setIsOpen(false); voiceGuidance.readSelectedText(); }}>
            Read Selected Text
          </button>
          <div className="a11y-menu-divider"></div>
          <div className="a11y-menu-controls">
            <button className="a11y-icon-btn" title="Pause" onClick={() => voiceGuidance.pause()}>⏸</button>
            <button className="a11y-icon-btn" title="Resume" onClick={() => voiceGuidance.resume()}>▶</button>
            <button className="a11y-icon-btn stop" title="Stop" onClick={() => { setIsOpen(false); voiceGuidance.stop(); }}>⏹</button>
          </div>
        </div>
      )}
      
      <button 
        className={`floating-a11y-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility Voice Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingAccessibility;
