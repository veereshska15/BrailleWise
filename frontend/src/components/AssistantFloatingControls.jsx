import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import voiceAssistant from '../js/voiceAssistant';
import cameraAssistant from '../js/cameraAssistant';
import AssistantDebugOverlay from './AssistantDebugOverlay';
import '../css/assistant.css';

const AssistantFloatingControls = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [cameraState, setCameraState] = useState({ isOpen: false, isScanning: false, text: '' });
  const videoRef = useRef(null);

  useEffect(() => {
    // Connect React Router navigate & Voice Assistant
    voiceAssistant.init({
      navigate: navigate,
      onStatusChange: (status) => setIsListening(status),
      onTranscript: (txt) => {
        setTranscript(txt);
        setTimeout(() => setTranscript(''), 3500);
      }
    });

    // Connect Camera Assistant state listener
    cameraAssistant.init((state) => {
      setCameraState((prev) => ({ ...prev, ...state }));
    });
  }, [navigate]);

  // REQUIREMENT: Automatically re-scan DOM whenever route changes
  useEffect(() => {
    voiceAssistant.scanDOM();
  }, [location.pathname]);

  useEffect(() => {
    if (cameraState.isOpen && videoRef.current && !cameraAssistant.stream) {
      cameraAssistant.openCamera(videoRef.current);
    }
  }, [cameraState.isOpen]);

  const handleMicToggle = () => {
    voiceAssistant.toggleListening();
  };

  const handleCameraToggle = () => {
    if (cameraState.isOpen) {
      cameraAssistant.closeCamera();
    } else {
      setCameraState((prev) => ({ ...prev, isOpen: true }));
    }
  };

  const handleCapture = () => {
    cameraAssistant.captureAndScan();
  };

  const handleCloseCamera = () => {
    cameraAssistant.closeCamera();
  };

  return (
    <>
      {/* Floating Controls Layer */}
      <div className="assistant-floating-container">
        {/* Live Recognized Command Badge */}
        {transcript && (
          <div className="assistant-transcript-badge" aria-live="polite">
            🗣️ "{transcript}"
          </div>
        )}

        <div className="assistant-buttons-group">
          {/* Camera Assistant Button */}
          <button
            className="assistant-btn camera-btn"
            onClick={handleCameraToggle}
            aria-label="Open Camera Assistant"
            title="Open Camera OCR Assistant (Voice: 'Open camera')"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          {/* Voice Assistant Microphone Button */}
          <button
            className={`assistant-btn mic-btn ${isListening ? 'active' : ''}`}
            onClick={handleMicToggle}
            aria-label={isListening ? 'Pause Voice Assistant' : 'Activate Voice Assistant'}
            title={isListening ? 'Voice Assistant Active (Click to Pause)' : 'Activate Voice Assistant (Continuous Listening)'}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera OCR Assistant Overlay Modal */}
      {cameraState.isOpen && (
        <div className="camera-modal-backdrop" onClick={(e) => e.target.classList.contains('camera-modal-backdrop') && handleCloseCamera()}>
          <div className="camera-modal-card" role="dialog" aria-labelledby="camera-modal-title">
            <div className="camera-modal-header">
              <h3 id="camera-modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                BrailleWise Camera OCR Scanner
              </h3>
              <button className="camera-close-btn" onClick={handleCloseCamera} aria-label="Close Camera Modal">
                ✕
              </button>
            </div>

            <div className="camera-preview-box">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video-stream"
              />
            </div>

            {/* Extracted Text Display */}
            {(cameraState.isScanning || cameraState.text) && (
              <div className="ocr-result-container">
                <div className="ocr-result-header">
                  {cameraState.isScanning ? '🔍 Recognizing Text...' : '📄 Detected Text Result:'}
                </div>
                <div className="ocr-result-text">
                  {cameraState.text || 'Processing image with Tesseract OCR...'}
                </div>
              </div>
            )}

            <div className="camera-modal-footer">
              <button
                className="camera-action-btn capture"
                onClick={handleCapture}
                disabled={cameraState.isScanning}
              >
                📸 {cameraState.isScanning ? 'Scanning...' : 'Capture & Scan Text'}
              </button>
              <button className="camera-action-btn cancel" onClick={handleCloseCamera}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Debug Overlay Inspector */}
      <AssistantDebugOverlay />
    </>
  );
};

export default AssistantFloatingControls;
