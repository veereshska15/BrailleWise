import React, { useState, useEffect } from 'react';
import voiceAssistant from '../js/voiceAssistant';

const AssistantDebugOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugLog, setDebugLog] = useState({
    currentPage: '/',
    elementsCount: 0,
    recognizedSpeech: '-',
    matchedElement: '-',
    confidenceScore: '0%',
    executedAction: '-',
    rejectedReason: '-'
  });

  useEffect(() => {
    // Subscribe to voice engine real-time debug updates
    const unsubscribe = voiceAssistant.subscribeDebug((data) => {
      setDebugLog(data);
    });

    // Keyboard shortcut listener (Ctrl + Shift + D) to toggle debug overlay
    const handleKeydown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  return (
    <>
      {/* Toggle Button for Debug Inspector */}
      <button
        className="assistant-debug-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Voice Engine Debug Inspector (Shortcut: Ctrl+Shift+D)"
        aria-label="Toggle Voice Engine Debug Inspector"
      >
        🐞 {isOpen ? 'Close Debug' : 'Voice Debug'}
      </button>

      {/* Real-time Debug Inspector Panel */}
      {isOpen && (
        <div className="assistant-debug-overlay">
          <div className="assistant-debug-header">
            <h4>🛠️ Voice Engine Inspector</h4>
            <button className="assistant-debug-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="assistant-debug-body">
            <div className="debug-row">
              <span className="debug-label">Current Page:</span>
              <span className="debug-value highlight">{debugLog.currentPage}</span>
            </div>

            <div className="debug-row">
              <span className="debug-label">Indexed Elements:</span>
              <span className="debug-value">{debugLog.elementsCount} controls</span>
            </div>

            <div className="debug-row">
              <span className="debug-label">Recognized Speech:</span>
              <span className="debug-value speech">"{debugLog.recognizedSpeech}"</span>
            </div>

            <div className="debug-row">
              <span className="debug-label">Matched Element:</span>
              <span className="debug-value match">{debugLog.matchedElement}</span>
            </div>

            <div className="debug-row">
              <span className="debug-label">Confidence Score:</span>
              <span className="debug-value score">{debugLog.confidenceScore}</span>
            </div>

            <div className="debug-row">
              <span className="debug-label">Executed Action:</span>
              <span className="debug-value action">{debugLog.executedAction}</span>
            </div>

            <div className="debug-row">
              <span className="debug-label">Rejection Reason:</span>
              <span className="debug-value rejection">{debugLog.rejectedReason}</span>
            </div>
          </div>

          <div className="assistant-debug-footer">
            <button
              className="debug-rescan-btn"
              onClick={() => voiceAssistant.scanDOM()}
            >
              🔄 Re-scan DOM
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AssistantDebugOverlay;
