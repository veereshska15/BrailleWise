import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

import learningProgress from '../utils/learningProgress';

const Register = () => {
  const navigate = useNavigate();

  // Form Field States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [experience, setExperience] = useState('Beginner');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Field Focus Reference
  const nameInputRef = useRef(null);

  // Check if session already exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Auto-focus on Full Name field when page loads
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Email format validation helper
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);

  // Password requirements calculators
  const passRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  const isPasswordValid = Object.values(passRequirements).every(req => req === true);

  // Confirm password matching calculator
  const isConfirmPasswordValid = confirmPassword.length > 0 && confirmPassword === password;

  // Total Form Validation Status
  const isFormValid = 
    name.trim().length > 0 &&
    isEmailValid &&
    isPasswordValid &&
    isConfirmPasswordValid &&
    agreeTerms &&
    experience !== '';

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError('');

    try {
      const API = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, experience })
      });

      const data = await res.json();

      if (data.success) {
        // Auto-login: store session details
        learningProgress.clearLocalState();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect directly to the Initial Assessment page
        navigate('/assessment');
      } else {
        if (res.status === 409 || data.message === 'Email already registered') {
          setError('This account already exists. Please sign in.');
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to connect to the server. Please try again.');
    }
  };

  return (
    <div className="login-container" role="main">
      <div className="login-card">
        
        {/* Left Section - Branding */}
        <section className="login-left" aria-label="Create Journey Details">
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

          <h1 className="brand-title">Create Your Learning Journey</h1>
          <p className="brand-tagline">Join BrailleWise and begin mastering Braille through adaptive learning.</p>

          {/* Abstract SVG connected neural mesh illustration */}
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
              <circle cx="100" cy="75" r="55" fill="url(#glowGrad)" />
              <path d="M40,75 Q70,45 100,75 T160,75" fill="none" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5" />
              <path d="M40,50 Q100,105 160,50" fill="none" stroke="rgba(96, 165, 250, 0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
              <g stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1.5">
                <line x1="85" y1="45" x2="115" y2="45" />
                <line x1="85" y1="75" x2="115" y2="75" />
                <line x1="85" y1="105" x2="115" y2="105" />
                <line x1="85" y1="45" x2="85" y2="105" />
                <line x1="115" y1="45" x2="115" y2="105" />
                <line x1="85" y1="45" x2="115" y2="75" strokeDasharray="3 2" />
                <line x1="85" y1="75" x2="115" y2="105" strokeDasharray="3 2" />
              </g>
              <circle cx="85" cy="45" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="115" cy="45" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="85" cy="75" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="115" cy="75" r="3" fill="rgba(255, 255, 255, 0.2)" />
              <circle cx="85" cy="105" r="7" fill="#60A5FA" filter="drop-shadow(0 0 7px #60A5FA)" />
              <circle cx="115" cy="105" r="3" fill="rgba(255, 255, 255, 0.2)" />
              <circle cx="85" cy="45" r="16" fill="none" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1" strokeDasharray="4 2" />
              <circle cx="85" cy="75" r="14" fill="none" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1" strokeDasharray="4 2" />
              <path d="M30,120 Q50,110 75,70 Q80,60 85,45" fill="none" stroke="url(#neuralGrad)" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 4px rgba(96,165,250,0.5))" />
              <path d="M170,120 Q150,110 125,75 Q120,68 115,45" fill="none" stroke="url(#neuralGrad)" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0 0 4px rgba(96,165,250,0.5))" />
            </svg>
          </div>
        </section>

        {/* Panel Divider separator */}
        <div className="login-divider" aria-hidden="true" />

        {/* Right Section - Form Inputs */}
        <section className="login-right" aria-label="Registration Inputs Panel">
          <div className="login-form-container">
            <h2 className="login-heading">Create Account</h2>
            <p className="login-subtitle">Fill in your details to get started.</p>

            {error && (
              <div className="validation-msg error" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                ✖ {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} noValidate>
              
              {/* Full Name input */}
              <div className="form-group">
                <label htmlFor="fullname" className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <input
                    id="fullname"
                    type="text"
                    className="form-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    ref={nameInputRef}
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              {/* Email Address input */}
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
                    required
                    aria-required="true"
                    aria-describedby="email-validation-hint"
                  />
                </div>
                {/* Inline Email format validation checks */}
                {email.length > 0 && (
                  <div id="email-validation-hint" className={`validation-msg ${isEmailValid ? 'success' : 'error'}`}>
                    {isEmailValid ? '✓ Valid email' : '✖ Invalid email format'}
                  </div>
                )}
              </div>

              {/* Password input */}
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

                {/* Password strength checklist */}
                {password.length > 0 && (
                  <div className="password-requirements" aria-live="polite">
                    <span className={`requirement-item ${passRequirements.length ? 'valid' : 'invalid'}`}>
                      {passRequirements.length ? '✓' : '✖'} Min 8 chars
                    </span>
                    <span className={`requirement-item ${passRequirements.uppercase ? 'valid' : 'invalid'}`}>
                      {passRequirements.uppercase ? '✓' : '✖'} One uppercase
                    </span>
                    <span className={`requirement-item ${passRequirements.lowercase ? 'valid' : 'invalid'}`}>
                      {passRequirements.lowercase ? '✓' : '✖'} One lowercase
                    </span>
                    <span className={`requirement-item ${passRequirements.number ? 'valid' : 'invalid'}`}>
                      {passRequirements.number ? '✓' : '✖'} One number
                    </span>
                    <span className={`requirement-item ${passRequirements.special ? 'valid' : 'invalid'}`}>
                      {passRequirements.special ? '✓' : '✖'} One special char
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password input */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-required="true"
                    aria-describedby="confirm-password-validation-hint"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
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
                {/* Confirm password matches check */}
                {confirmPassword.length > 0 && (
                  <div id="confirm-password-validation-hint" className={`validation-msg ${isConfirmPasswordValid ? 'success' : 'error'}`}>
                    {isConfirmPasswordValid ? '✓ Passwords match' : '✖ Passwords do not match'}
                  </div>
                )}
              </div>

              {/* Experience Level Dropdown */}
              <div className="form-group">
                <label htmlFor="experience" className="form-label">Experience Level</label>
                <div className="select-wrapper">
                  <select
                    id="experience"
                    className="form-select"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <span className="select-helper-text">
                  Your experience level helps personalize your learning path.
                </span>
              </div>

              {/* Custom Checkbox Agreement */}
              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="checkmark" />
                  I agree to the Terms and Privacy Policy.
                </label>
              </div>

              {/* Register Primary Action Submit Button */}
              <button 
                type="submit" 
                className="login-btn"
                disabled={!isFormValid}
              >
                Create Account
              </button>

            </form>

            {/* Back to Login Links */}
            <div className="register-text">
              Already have an account?
              <Link to="/login" className="register-link">
                Sign In
              </Link>
            </div>

          </div>
        </section>

        {/* Card Absolute Footer */}
        <footer className="login-footer">
          © 2026 BrailleWise • Empowering Accessible Learning
        </footer>

      </div>
    </div>
  );
};

export default Register;
