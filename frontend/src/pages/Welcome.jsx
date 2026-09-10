import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const hasSpokenRef = useRef(false);

  useEffect(() => {
    // Session handling check
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      navigate('/dashboard');
      return;
    }

    const welcomeText = "Welcome to BrailleWise. Choose Sign In if you already have an account. Choose Create Account if you are new to BrailleWise.";

    const speakGuidance = () => {
      if (!('speechSynthesis' in window) || hasSpokenRef.current) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(welcomeText);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(voice => voice.lang.startsWith('en-') || voice.lang === 'en');
        if (enVoice) {
          utterance.voice = enVoice;
        }

        utterance.onstart = () => {
          hasSpokenRef.current = true;
          setShowPrompt(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Speech synthesis error:', e);
      }
    };

    // Attempt autoplay speech synthesis
    speakGuidance();

    const handleInteraction = () => {
      speakGuidance();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    };
  }, [navigate]);

  return (
    <div className="welcome-container" role="main" aria-live="polite">
      {/* Floating Particles Layer */}
      <div className="particles-layer" aria-hidden="true">
        <div className="particle" style={{ left: '15%', animationDelay: '0s', animationDuration: '24s', width: '5px', height: '5px' }} />
        <div className="particle" style={{ left: '35%', animationDelay: '3s', animationDuration: '32s', width: '6px', height: '6px' }} />
        <div className="particle" style={{ left: '60%', animationDelay: '1.5s', animationDuration: '28s', width: '4px', height: '4px' }} />
        <div className="particle" style={{ left: '82%', animationDelay: '5s', animationDuration: '36s', width: '7px', height: '7px' }} />
      </div>

      {/* Glassmorphic Splash Container */}
      <div className="welcome-card">
        
        {/* Stylized Glowing Network Logo */}
        <div className="logo-container" aria-hidden="true">
          <svg className="braille-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" className="logo-hexagon" />
            <line x1="30" y1="20" x2="30" y2="50" className="logo-connection" />
            <line x1="30" y1="50" x2="30" y2="80" className="logo-connection" />
            <line x1="30" y1="20" x2="70" y2="20" className="logo-connection" />
            <line x1="30" y1="50" x2="70" y2="50" className="logo-connection" />
            <line x1="30" y1="80" x2="70" y2="80" className="logo-connection" />
            <line x1="70" y1="20" x2="70" y2="50" className="logo-connection" />
            <line x1="70" y1="50" x2="70" y2="80" className="logo-connection" />

            <circle cx="30" cy="20" r="8" className="logo-dot logo-dot-active" />
            <circle cx="30" cy="50" r="8" className="logo-dot logo-dot-active logo-dot-delay-1" />
            <circle cx="30" cy="80" r="8" className="logo-dot logo-dot-inactive" />
            <circle cx="70" cy="20" r="8" className="logo-dot logo-dot-active logo-dot-delay-1" />
            <circle cx="70" cy="50" r="8" className="logo-dot logo-dot-inactive" />
            <circle cx="70" cy="80" r="8" className="logo-dot logo-dot-active logo-dot-delay-2" />
          </svg>
        </div>

        {/* Brand Header */}
        <h1 className="welcome-title">BrailleWise</h1>
        <p className="welcome-subtitle">Empowering Every Touch to Read the World</p>
        
        {/* Accessible Navigation Action Buttons */}
        <div className="welcome-actions" role="region" aria-label="Account Options">
          <button
            type="button"
            className="welcome-btn welcome-btn-primary"
            onClick={() => {
              try { window.speechSynthesis.cancel(); } catch (e) {}
              navigate('/login');
            }}
            aria-label="Sign In to your existing account"
          >
            <svg className="welcome-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className="welcome-btn welcome-btn-secondary"
            onClick={() => {
              try { window.speechSynthesis.cancel(); } catch (e) {}
              navigate('/register');
            }}
            aria-label="Create a new BrailleWise account"
          >
            <svg className="welcome-btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="17" y1="11" x2="23" y2="11" />
            </svg>
            <span>Create Account</span>
          </button>
        </div>

        {/* Accessibility Autoplay Fallback Prompt */}
        {showPrompt && (
          <div className="interaction-prompt" role="alert">
            Press any key or click anywhere to begin voice guidance.
          </div>
        )}

      </div>
    </div>
  );
};

export default Welcome;
