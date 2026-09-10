import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import voiceGuidance from '../utils/voiceGuidance';
import learningProgress from '../utils/learningProgress';
import './VoiceGuidance.css';

const VoiceGuidance = () => {
  const [status, setStatus] = useState('Idle');
  const [voices, setVoices] = useState([]);
  const [settings, setSettings] = useState(voiceGuidance.settings);
  const [testText, setTestText] = useState('Hello BrailleWise');
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    voiceGuidance.init();
    if (!voiceGuidance.synth) {
      setUnsupported(true);
      return;
    }

    const updateState = () => {
      setStatus(voiceGuidance.getStatus());
      setVoices(voiceGuidance.voices);
      setSettings({ ...voiceGuidance.settings });
    };

    updateState();
    const unsubscribe = voiceGuidance.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  const handleSettingChange = (key, value) => {
    voiceGuidance.updateSettings({ [key]: value });
  };

  const handleReadLesson = () => voiceGuidance.readCurrentLesson();
  const handleReadProgress = () => voiceGuidance.readLearningProgress();

  if (unsupported) {
    return (
      <div className="dashboard-layout">
        <Sidebar activeTab="voice" />
        <div className="dashboard-workspace" style={{ padding: '40px', color: '#FFF' }}>
          <h2>Voice Guidance</h2>
          <p>Voice Guidance is not supported on this browser. Please try Chrome, Edge, or Safari.</p>
        </div>
      </div>
    );
  }

  const Toggle = ({ label, checked, onChange }) => (
    <div className="voice-toggle-row">
      <span className="voice-toggle-label">{label}</span>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
        <span style={{
          width: '44px', height: '24px', background: checked ? '#3B82F6' : 'rgba(255,255,255,0.1)',
          borderRadius: '12px', position: 'relative', transition: '.3s', display: 'inline-block'
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

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab="voice" />
      <div className="dashboard-workspace">
        <header className="dashboard-header">
          <div className="header-left">
            <span className="welcome-title-desc">Accessibility Settings</span>
            <h1 className="header-welcome" style={{ fontSize: '26px' }}>Voice Guidance</h1>
          </div>
        </header>

        <main className="learn-content" style={{ padding: '30px 40px' }}>
          <div className="voice-guidance-container">
            
            <div className="voice-guidance-grid">
              {/* SECTION 1: Status */}
              <section className="voice-card">
                <h3 className="voice-card-title">Voice Status</h3>
                <div className="voice-status-row">
                  <span className="voice-status-label">Voice Engine</span>
                  <span className="voice-status-value success">Web Speech API</span>
                </div>
                <div className="voice-status-row">
                  <span className="voice-status-label">Voice Ready</span>
                  <span className="voice-status-value success">{voices.length > 0 ? 'Yes' : 'Loading...'}</span>
                </div>
                <div className="voice-status-row">
                  <span className="voice-status-label">Speech Status</span>
                  <span className={`voice-status-value ${status.toLowerCase()}`}>{status}</span>
                </div>
              </section>

              {/* SECTION 2: Controls */}
              <section className="voice-card">
                <h3 className="voice-card-title">Voice Controls</h3>
                <div className="voice-controls-grid">
                  <button 
                    className="voice-btn" 
                    onClick={() => voiceGuidance.speak("Voice guidance started.")}
                    disabled={status === 'Speaking'}
                    style={{ opacity: status === 'Speaking' ? 0.5 : 1, cursor: status === 'Speaking' ? 'not-allowed' : 'pointer' }}
                  >
                    Start
                  </button>
                  <button 
                    className="voice-btn" 
                    onClick={() => voiceGuidance.pause()}
                    disabled={status === 'Idle' || status === 'Paused'}
                    style={{ opacity: (status === 'Idle' || status === 'Paused') ? 0.5 : 1, cursor: (status === 'Idle' || status === 'Paused') ? 'not-allowed' : 'pointer' }}
                  >
                    Pause
                  </button>
                  <button 
                    className="voice-btn" 
                    onClick={() => voiceGuidance.resume()}
                    disabled={status === 'Idle' || status === 'Speaking'}
                    style={{ opacity: (status === 'Idle' || status === 'Speaking') ? 0.5 : 1, cursor: (status === 'Idle' || status === 'Speaking') ? 'not-allowed' : 'pointer' }}
                  >
                    Resume
                  </button>
                  <button 
                    className="voice-btn" 
                    onClick={() => voiceGuidance.stop()} 
                    style={{ color: '#F87171', opacity: status === 'Idle' ? 0.5 : 1, cursor: status === 'Idle' ? 'not-allowed' : 'pointer' }}
                    disabled={status === 'Idle'}
                  >
                    Stop
                  </button>
                  <button className={`voice-btn ${settings.muted ? 'active' : ''}`} onClick={() => voiceGuidance.toggleMute()}>
                    {settings.muted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
              </section>

              {/* SECTION 3: Speech Settings */}
              <section className="voice-card" style={{ gridColumn: '1 / -1' }}>
                <h3 className="voice-card-title">Speech Settings</h3>
                <select 
                  className="voice-select"
                  value={settings.voiceURI || ''}
                  onChange={(e) => handleSettingChange('voiceURI', e.target.value)}
                >
                  <option value="">Default Browser Voice</option>
                  {voices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                  ))}
                </select>

                <div className="voice-guidance-grid">
                  <div className="voice-slider-group">
                    <div className="voice-slider-header">
                      <span className="voice-slider-label">Speech Rate</span>
                      <span className="voice-slider-value">{settings.rate.toFixed(1)}x</span>
                    </div>
                    <input type="range" className="voice-slider" min="0.5" max="2" step="0.1" value={settings.rate} onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))} />
                  </div>

                  <div className="voice-slider-group">
                    <div className="voice-slider-header">
                      <span className="voice-slider-label">Pitch</span>
                      <span className="voice-slider-value">{settings.pitch.toFixed(1)}</span>
                    </div>
                    <input type="range" className="voice-slider" min="0" max="2" step="0.1" value={settings.pitch} onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))} />
                  </div>

                  <div className="voice-slider-group">
                    <div className="voice-slider-header">
                      <span className="voice-slider-label">Volume</span>
                      <span className="voice-slider-value">{Math.round(settings.volume * 100)}%</span>
                    </div>
                    <input type="range" className="voice-slider" min="0" max="1" step="0.1" value={settings.volume} onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))} />
                  </div>
                </div>
              </section>

              {/* SECTION 4: Test Voice */}
              <section className="voice-card">
                <h3 className="voice-card-title">Test Voice</h3>
                <textarea 
                  className="voice-textarea"
                  value={testText}
                  onChange={e => setTestText(e.target.value)}
                  placeholder="Type here to test voice..."
                />
                <button className="voice-full-btn" onClick={() => voiceGuidance.speak(testText)}>Speak</button>
              </section>

              {/* SECTION 5 & 6: Read Data */}
              <section className="voice-card">
                <h3 className="voice-card-title">Read Application Data</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <button className="voice-full-btn" onClick={handleReadLesson}>Read Current Lesson</button>
                  <button className="voice-full-btn" onClick={handleReadProgress}>Read My Progress</button>
                </div>
              </section>

              {/* SECTION 7: Auto Announcements */}
              <section className="voice-card">
                <h3 className="voice-card-title">Automatic Announcements</h3>
                <Toggle label="Automatically Read Page Heading" checked={settings.autoReadPageHeading} onChange={v => handleSettingChange('autoReadPageHeading', v)} />
                <Toggle label="Speak Achievements" checked={settings.autoAchievements} onChange={v => handleSettingChange('autoAchievements', v)} />
                <Toggle label="Speak Lesson Completion" checked={settings.autoLessonComplete} onChange={v => handleSettingChange('autoLessonComplete', v)} />
                <Toggle label="Speak Letter Mastered" checked={settings.autoLetterMastered} onChange={v => handleSettingChange('autoLetterMastered', v)} />
                <Toggle label="Speak Quiz Result" checked={settings.autoQuizResult} onChange={v => handleSettingChange('autoQuizResult', v)} />
                <Toggle label="Speak Progress Updates" checked={settings.autoProgressUpdate} onChange={v => handleSettingChange('autoProgressUpdate', v)} />
              </section>

              {/* SECTION 8: Keyboard Accessibility */}
              <section className="voice-card">
                <h3 className="voice-card-title">Keyboard Shortcuts</h3>
                <Toggle label="Keyboard Shortcuts Enabled" checked={settings.keyboardEnabled} onChange={v => handleSettingChange('keyboardEnabled', v)} />
                
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  <div className="keyboard-shortcut">
                    <span className="key-badge">Space</span>
                    <span className="key-desc">Pause / Resume</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <span className="key-badge">Esc</span>
                    <span className="key-desc">Stop Speech</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <span className="key-badge">Ctrl + R</span>
                    <span className="key-desc">Read Current Page</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <span className="key-badge">Ctrl + L</span>
                    <span className="key-desc">Read Current Lesson</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <span className="key-badge">Ctrl + P</span>
                    <span className="key-desc">Read Progress</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <span className="key-badge">Ctrl + M</span>
                    <span className="key-desc">Mute / Unmute</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <span className="key-badge">Ctrl + Shift + V</span>
                    <span className="key-desc">Open Voice Guidance</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default VoiceGuidance;
