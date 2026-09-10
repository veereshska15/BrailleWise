import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

import learningProgress from '../utils/learningProgress';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const emailInputRef = useRef(null);

  // Check if session already exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Auto-focus on email field when page loads
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        learningProgress.clearLocalState();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        await learningProgress.loadStateFromBackend();
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to the server. Please try again.');
    }
  };

  return (
    <div className="login-container" role="main">
      <div className="login-card">
        
        {/* Left Section - Branding */}
        <section className="login-left" aria-label="BrailleWise Overview">
          {/* Logo */}
          <div className="brand-logo-container" aria-hidden="true">
            <svg className="braille-logo-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" className="logo-hexagon" />
              <line x1="30" y1="20" x2="30" y2="50" className="logo-connection" />
              <line x1="30" y1="50" x2="30" y2="80" className="logo-connection" />
              <line x1="30" y1="20" x2="70" y2="20" className="logo-connection" />
              <line x1="30" y1="50" x2="70" y2="50" className="logo-connection" />
              <line x1="30" y1="80" x2="70" y2="80" className="logo-connection" />
              <circle cx="30" cy="20" r="8" className="logo-dot logo-dot-active" />
              <circle cx="30" cy="50" r="8" className="logo-dot logo-dot-active logo-dot-delay-1" />
              <circle cx="30" cy="80" r="8" className="logo-dot logo-dot-inactive" />
              <circle cx="70" cy="20" r="8" className="logo-dot logo-dot-active logo-dot-delay-1" />
              <circle cx="70" cy="50" r="8" className="logo-dot logo-dot-inactive" />
              <circle cx="70" cy="80" r="8" className="logo-dot logo-dot-active logo-dot-delay-2" />
            </svg>
          </div>

          {/* Typography */}
          <h1 className="brand-title">BrailleWise</h1>
          <p className="brand-tagline">Empowering Every Touch to Read the World.</p>
          <p className="brand-desc">
            BrailleWise is an intelligent Braille learning platform designed to help visually impaired learners master Braille through adaptive lessons, voice guidance, and personalized progress tracking.
          </p>

          {/* Abstract SVG Accessibility Graphic representing Hands reading Braille */}
          <div className="brand-illustration-container" aria-hidden="true">
            <svg className="illust-graphic" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="neuralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Glow Backdrop */}
              <circle cx="100" cy="75" r="55" fill="url(#glowGrad)" />

              {/* Connected Neural Grid Lines representing adaptive intelligence */}
              <path d="M40,75 Q70,45 100,75 T160,75" fill="none" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" />
              <path d="M40,50 Q100,105 160,50" fill="none" stroke="rgba(96, 165, 250, 0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
              
              {/* Tactile Connected Braille Grid nodes */}
              <g stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5">
                <line x1="85" y1="45" x2="115" y2="45" />
                <line x1="85" y1="75" x2="115" y2="75" />
                <line x1="85" y1="105" x2="115" y2="105" />
                
                <line x1="85" y1="45" x2="85" y2="105" />
                <line x1="115" y1="45" x2="115" y2="105" />
                
                <line x1="85" y1="45" x2="115" y2="75" strokeDasharray="3 2" />
                <line x1="85" y1="75" x2="115" y2="105" strokeDasharray="3 2" />
              </g>

              {/* Glowing Tactile dots (representing F coordinate nodes) */}
              <circle cx="85" cy="45" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="115" cy="45" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="85" cy="75" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="115" cy="75" r="3" fill="rgba(255, 255, 255, 0.2)" />
              <circle cx="85" cy="105" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="115" cy="105" r="3" fill="rgba(255, 255, 255, 0.2)" />

              {/* Stylized Touch Pulse Waves */}
              <circle cx="85" cy="45" r="16" fill="none" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1" strokeDasharray="4 2" />
              <circle cx="85" cy="75" r="14" fill="none" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" strokeDasharray="4 2" />
              
              {/* Hand Tactile Gesture Path outlines */}
              <path d="M30,120 Q50,110 75,70 Q80,60 85,45" fill="none" stroke="url(#neuralGrad)" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 4px rgba(96,165,250,0.5))" />
              <path d="M170,120 Q150,110 125,75 Q120,68 115,45" fill="none" stroke="url(#neuralGrad)" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 4px rgba(96,165,250,0.5))" />
            </svg>
          </div>
        </section>

        {/* Subtle Panel Divider */}
        <div className="login-divider" aria-hidden="true" />

        {/* Right Section - Login Form */}
        <section className="login-right" aria-label="Sign In Panel">
          <div className="login-form-container">
            <h2 className="login-heading">Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue your learning journey.</p>
            
            {error && (
              <div style={{ color: '#F87171', fontSize: '13.5px', marginBottom: '14px', textAlign: 'center', fontWeight: '500' }}>
                ✖ {error}
              </div>
            )}
            
            <form onSubmit={handleLoginSubmit} noValidate>
              
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ref={emailInputRef}
                    required
                    aria-required="true"
                    aria-describedby="email-hint"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Options Custom Checkbox */}
              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark" />
                  Remember Me
                </label>
              </div>

              {/* Login Submit Button */}
              <button type="submit" className="login-btn">
                Login
              </button>

            </form>

            {/* Registration Helper Footer */}
            <div className="register-text">
              Don't have an account?
              <Link to="/register" className="register-link">
                Create Account
              </Link>
            </div>

          </div>
        </section>

        {/* Subtle Footer inside Container */}
        <footer className="login-footer">
          © 2026 BrailleWise • Empowering Accessible Learning
        </footer>

      </div>
    </div>
  );
};

export default Login;
