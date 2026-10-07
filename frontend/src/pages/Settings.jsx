// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import learningProgress from '../utils/learningProgress';
import hardwareBridge, { 
  getHardwareIp, 
  setHardwareIp, 
  isHardwareEnabled, 
  setHardwareEnabled, 
  testHardwareConnection, 
  clearTactileCell,
  testSingleDot
} from '../utils/hardwareBridge';
import './Learn.css';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 'medium',
  highContrast: false,
  reduceAnimations: false,
  defaultLearningMode: 'learning',
  resumeAutomatically: true,
  showHints: true,
  autoContinue: false,
  learningReminders: true,
  achievementNotifications: true,
  dailyGoalReminder: false,
  rememberLogin: true,
  showProfile: true,
  shareStats: false
};

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [editName, setEditName] = useState('');

  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Hardware ESP32 state
  const [hardwareIp, setHardwareIpState] = useState(getHardwareIp());
  const [hardwareEnabled, setHardwareEnabledState] = useState(isHardwareEnabled());
  const [hardwareTestStatus, setHardwareTestStatus] = useState('');
  const [isTestingHardware, setIsTestingHardware] = useState(false);

  const handleUpdateHardwareIp = (val) => {
    setHardwareIpState(val);
    setHardwareIp(val);
  };

  const handleToggleHardware = (val) => {
    setHardwareEnabledState(val);
    setHardwareEnabled(val);
  };

  const handleTestHardware = async () => {
    setIsTestingHardware(true);
    setHardwareTestStatus('Connecting to ESP32...');
    const res = await testHardwareConnection();
    setHardwareTestStatus(res.connected ? `✓ ${res.message}` : `✗ ${res.message}`);
    setIsTestingHardware(false);
  };

  const handleClearCell = async () => {
    await clearTactileCell();
    setHardwareTestStatus('Solenoids cleared.');
  };

  const handleTestDot = async (dotNum) => {
    setIsTestingHardware(true);
    setHardwareTestStatus(`Testing Dot ${dotNum}...`);
    const res = await testSingleDot(dotNum);
    if (res.success) {
      setHardwareTestStatus(`✓ Dot ${dotNum} pulsed for ~1s`);
    } else {
      setHardwareTestStatus(`✗ Dot ${dotNum} failed: ${res.error || 'Connection error'}`);
    }
    setIsTestingHardware(false);
  };

  // Load User and Settings
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) { navigate('/login'); return; }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditName(parsedUser.name || 'Student');
    } catch (e) { navigate('/login'); }

    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      } catch(e) {}
    }
  }, [navigate]);

  // Apply visual settings to document body
  useEffect(() => {
    document.body.classList.toggle('high-contrast', settings.highContrast);
    document.body.classList.toggle('reduce-animations', settings.reduceAnimations);
    document.body.classList.toggle('theme-light', settings.theme === 'light');
    
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${settings.fontSize}`);
  }, [settings.highContrast, settings.reduceAnimations, settings.theme, settings.fontSize]);

  const updateSetting = (key, value) => {
    setIsSaving(true);
    setSaveMessage('Saving...');
    
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('userSettings', JSON.stringify(updated));

    try {
      const token = localStorage.getItem('token');
      const API = import.meta.env.VITE_API_URL || '';
      if (token) {
        fetch(`${API}/api/auth/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ voice_settings: updated })
        }).catch(err => console.error('Settings sync error:', err));
      }
    } catch(e) {}
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('✓ Auto Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    }, 400);
  };

  const handleSaveName = () => {
    if (!user || editName.trim() === '') return;
    setIsSaving(true);
    setSaveMessage('Saving...');
    const updatedUser = { ...user, name: editName };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('✓ Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    }, 400);
  };

  const handleExport = () => {
    const state = learningProgress.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `braillewise_progress_export.json`);
    dlAnchorElem.click();
  };

  const handleReset = () => {
    localStorage.removeItem('braillewise_state');
    learningProgress.getState(); // Resets internally by generating new default state
    setShowResetModal(false);
    window.dispatchEvent(new Event('storage'));
    
    setSaveMessage('✓ Progress Reset');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim() === 'DELETE') {
      localStorage.clear();
      navigate('/login');
    }
  };

  if (!user) return null;

  const formatUserId = (id) => {
    if (!id || id.length < 5) return 'N/A';
    const short = id.substring(id.length - 4).toUpperCase();
    return `BW-${short}`;
  };

  // ── REUSABLE UI COMPONENTS ──

  const ToggleSwitch = ({ label, checked, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: '500' }}>{label}</span>
      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: checked ? '#34D399' : 'rgba(255,255,255,0.1)',
          transition: '.3s', borderRadius: '24px'
        }}>
          <span style={{
            position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
            backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
            transform: checked ? 'translateX(20px)' : 'translateX(0)'
          }}/>
        </span>
      </label>
    </div>
  );

  const SelectDropdown = ({ label, value, options, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: '500' }}>{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)',
          padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', cursor: 'pointer'
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#1E293B' }}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="settings" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">App Configuration</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Settings</h1>
          </div>
          <div className="header-right">
            <span style={{ 
              color: isSaving ? '#60A5FA' : '#34D399', 
              fontWeight: '700', 
              fontSize: '14px',
              transition: 'opacity 0.2s',
              opacity: saveMessage ? 1 : 0 
            }}>
              {saveMessage}
            </span>
          </div>
        </header>

        <main className="learn-content" style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', paddingBottom: '60px' }}>
            
            {/* COLUMN 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Account Settings */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Account Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Name</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                      />
                      <button onClick={handleSaveName} style={{ background: '#60A5FA', border: 'none', color: '#0F172A', padding: '0 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                        Save
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address (Read Only)</label>
                    <input type="text" value={user.email || 'N/A'} disabled style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748B', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'not-allowed' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Learner ID (Read Only)</label>
                    <input type="text" value={formatUserId(user.id)} disabled style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748B', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', cursor: 'not-allowed', fontFamily: 'monospace' }} />
                  </div>

                </div>
              </div>

              {/* Appearance & Accessibility */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Appearance & Accessibility</h2>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <SelectDropdown label="Theme" value={settings.theme} onChange={(v) => updateSetting('theme', v)} options={[{label: 'Dark (Default)', value: 'dark'}, {label: 'Light', value: 'light'}]} />
                  <SelectDropdown label="Font Size" value={settings.fontSize} onChange={(v) => updateSetting('fontSize', v)} options={[{label: 'Small', value: 'small'}, {label: 'Medium', value: 'medium'}, {label: 'Large', value: 'large'}]} />
                  <ToggleSwitch label="High Contrast Mode" checked={settings.highContrast} onChange={(v) => updateSetting('highContrast', v)} />
                  <ToggleSwitch label="Reduce Animations" checked={settings.reduceAnimations} onChange={(v) => updateSetting('reduceAnimations', v)} />
                </div>
              </div>

              {/* Privacy */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Privacy</h2>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <ToggleSwitch label="Remember Login" checked={settings.rememberLogin} onChange={(v) => updateSetting('rememberLogin', v)} />
                  <ToggleSwitch label="Show Profile to Others" checked={settings.showProfile} onChange={(v) => updateSetting('showProfile', v)} />
                  <ToggleSwitch label="Share Anonymous Learning Statistics" checked={settings.shareStats} onChange={(v) => updateSetting('shareStats', v)} />
                </div>
              </div>

            </div>

            {/* COLUMN 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Tactile Hardware Cell (ESP32) */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: '700', margin: 0 }}>
                    Tactile Hardware Cell (ESP32)
                  </h2>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontWeight: '700',
                    background: hardwareEnabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: hardwareEnabled ? '#34D399' : '#F87171' 
                  }}>
                    {hardwareEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <ToggleSwitch 
                    label="Enable Physical Tactile Solenoids" 
                    checked={hardwareEnabled} 
                    onChange={handleToggleHardware} 
                  />

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ESP32 IP Address
                    </label>
                    <input 
                      type="text" 
                      value={hardwareIp} 
                      onChange={(e) => handleUpdateHardwareIp(e.target.value)}
                      placeholder="e.g. 10.92.41.10"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleTestHardware} 
                      disabled={isTestingHardware || !hardwareEnabled}
                      style={{ 
                        flex: 1, 
                        padding: '10px 14px', 
                        background: '#3B82F6', 
                        color: '#FFF', 
                        border: 'none', 
                        borderRadius: '8px', 
                        fontSize: '13px', 
                        fontWeight: '700', 
                        cursor: hardwareEnabled ? 'pointer' : 'not-allowed',
                        opacity: hardwareEnabled ? 1 : 0.5
                      }}
                    >
                      {isTestingHardware ? 'Testing...' : '⚡ Test Solenoids (All 6)'}
                    </button>
                    <button 
                      onClick={handleClearCell} 
                      disabled={!hardwareEnabled}
                      style={{ 
                        padding: '10px 14px', 
                        background: 'rgba(255,255,255,0.05)', 
                        color: '#FFF', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '8px', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        cursor: hardwareEnabled ? 'pointer' : 'not-allowed' 
                      }}
                    >
                      Clear Cell
                    </button>
                  </div>

                  <div style={{ marginTop: '4px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Test Individual Dots (1s Pulse)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                      {[1, 2, 3, 4, 5, 6].map((dot) => (
                        <button
                          key={dot}
                          onClick={() => handleTestDot(dot)}
                          disabled={isTestingHardware || !hardwareEnabled}
                          title={`Test Solenoid Dot ${dot}`}
                          style={{
                            padding: '8px 0',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#E2E8F0',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: hardwareEnabled ? 'pointer' : 'not-allowed',
                            opacity: hardwareEnabled ? 1 : 0.5,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Dot {dot}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hardwareTestStatus && (
                    <div style={{ 
                      padding: '10px 12px', 
                      borderRadius: '8px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      background: hardwareTestStatus.startsWith('✓') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: hardwareTestStatus.startsWith('✓') ? '#34D399' : '#FCA5A5'
                    }}>
                      {hardwareTestStatus}
                    </div>
                  )}

                  {/* Hardware Power & Safe Architecture Guide */}
                  <div style={{
                    marginTop: '8px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    fontSize: '12px',
                    color: '#CBD5E1',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}>
                      <span>⚡</span> Hardware Power Architecture & Requirements
                    </div>
                    <ul style={{ margin: '0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <li><strong>Control Signals Only:</strong> ESP32 GPIO pins (4, 16, 17, 18, 19, 23) are logic signals only; never power solenoids directly from GPIOs.</li>
                      <li><strong>Driver Stage Required:</strong> Use the ULN2003 / MOSFET driver between ESP32 GPIO pins and solenoids.</li>
                      <li><strong>External Power Supply:</strong> Solenoids require an appropriate external DC power supply with adequate current capacity for simultaneous multi-solenoid actuation (min. 2A–3A).</li>
                      <li><strong>Voltage Matching:</strong> Verify physical solenoid rating (5V vs 12V); do not assume 5V unless confirmed. Use matching voltage on driver power rail.</li>
                      <li><strong>Common Ground:</strong> External power supply GND must be tied to ESP32 GND.</li>
                      <li><strong>Safety Isolation:</strong> Never route external solenoid supply voltage into an ESP32 GPIO.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Learning Preferences */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Learning Preferences</h2>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <SelectDropdown label="Default Learning Mode" value={settings.defaultLearningMode} onChange={(v) => updateSetting('defaultLearningMode', v)} options={[{label: 'Learning', value: 'learning'}, {label: 'Practice', value: 'practice'}, {label: 'Review', value: 'review'}]} />
                  <ToggleSwitch label="Resume Last Lesson Automatically" checked={settings.resumeAutomatically} onChange={(v) => updateSetting('resumeAutomatically', v)} />
                  <ToggleSwitch label="Show Lesson Hints" checked={settings.showHints} onChange={(v) => updateSetting('showHints', v)} />
                  <ToggleSwitch label="Auto Continue to Next Letter" checked={settings.autoContinue} onChange={(v) => updateSetting('autoContinue', v)} />
                </div>
              </div>

              {/* Notifications */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Notifications</h2>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <ToggleSwitch label="Learning Reminders" checked={settings.learningReminders} onChange={(v) => updateSetting('learningReminders', v)} />
                  <ToggleSwitch label="Achievement Notifications" checked={settings.achievementNotifications} onChange={(v) => updateSetting('achievementNotifications', v)} />
                  <ToggleSwitch label="Daily Goal Reminder" checked={settings.dailyGoalReminder} onChange={(v) => updateSetting('dailyGoalReminder', v)} />
                </div>
              </div>

              {/* Data Management */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Data Management</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={handleExport} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                    Export Learning Data <span>↓</span>
                  </button>
                  <button onClick={() => setShowResetModal(true)} style={{ width: '100%', padding: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                    Reset Learning Progress
                  </button>
                </div>
              </div>

              {/* Account Management */}
              <div className="sidebar-summary-card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '16px', fontWeight: '700' }}>Account</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                    Logout
                  </button>
                  <button onClick={() => setShowDeleteModal(true)} style={{ width: '100%', padding: '12px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                    Delete Account
                  </button>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>

      {/* RESET MODAL */}
      {showResetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '90%', maxWidth: '400px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', color: '#FFF', margin: '0 0 12px 0', fontWeight: '700' }}>Reset Progress?</h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to completely reset all learning progress, quizzes, and achievements? This action <strong>cannot be undone</strong>.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button onClick={handleReset} style={{ background: '#F87171', border: 'none', color: '#FFF', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Yes, Reset Data</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '90%', maxWidth: '400px', padding: '32px' }}>
            <h2 style={{ fontSize: '20px', color: '#F87171', margin: '0 0 12px 0', fontWeight: '700' }}>Delete Account</h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>
              This will permanently delete your account and all associated data. Type <strong>DELETE</strong> below to confirm.
            </p>
            <input 
              type="text" 
              placeholder="DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '24px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              <button 
                onClick={handleDeleteAccount} 
                disabled={deleteConfirmText.trim() !== 'DELETE'}
                style={{ background: deleteConfirmText.trim() === 'DELETE' ? '#F87171' : 'rgba(248,113,113,0.3)', border: 'none', color: '#FFF', padding: '8px 16px', borderRadius: '8px', cursor: deleteConfirmText.trim() === 'DELETE' ? 'pointer' : 'not-allowed', fontWeight: '700' }}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
