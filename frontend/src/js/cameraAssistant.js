/**
 * BrailleWise Camera Assistant Module
 * ====================================
 * Uses getUserMedia() for camera access and Tesseract.js for OCR.
 * Displays extracted text and speaks it aloud using SpeechSynthesis API.
 */

import { createWorker } from 'tesseract.js';
import voiceAssistant from './voiceAssistant.js';

class CameraAssistant {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.isOpen = false;
    this.isScanning = false;
    this.extractedText = '';
    this.onStateChange = null;
    this.worker = null;
  }

  init(onStateChange) {
    this.onStateChange = onStateChange;
    voiceAssistant.setCameraAssistant(this);
  }

  async openCamera(videoElementRef) {
    if (videoElementRef) {
      this.videoElement = videoElementRef;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play();
      }

      this.isOpen = true;
      this.extractedText = '';
      voiceAssistant.speak("Camera opened.");

      if (this.onStateChange) {
        this.onStateChange({ isOpen: true, isScanning: false, text: '' });
      }
    } catch (err) {
      console.error("[CameraAssistant] Error opening camera:", err);
      voiceAssistant.speak("Unable to access camera. Please check permissions.");
    }
  }

  closeCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isOpen = false;
    this.isScanning = false;

    if (this.onStateChange) {
      this.onStateChange({ isOpen: false, isScanning: false, text: '' });
    }
  }

  async captureAndScan() {
    if (!this.isOpen || !this.videoElement) {
      voiceAssistant.speak("Camera is not active.");
      return;
    }

    this.isScanning = true;
    voiceAssistant.speak("Capturing image. Processing text recognition.");

    if (this.onStateChange) {
      this.onStateChange({ isOpen: true, isScanning: true, text: 'Scanning text...' });
    }

    try {
      // Draw current video frame to hidden canvas
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth || 640;
      canvas.height = this.videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL('image/png');

      // Process OCR using Tesseract.js
      if (!this.worker) {
        this.worker = await createWorker('eng');
      }

      const ret = await this.worker.recognize(imageDataUrl);
      const text = ret.data.text ? ret.data.text.trim() : '';

      this.isScanning = false;
      this.extractedText = text;

      if (text.length > 0) {
        voiceAssistant.speak("Text detected.");
        if (this.onStateChange) {
          this.onStateChange({ isOpen: true, isScanning: false, text: text });
        }

        // Read extracted text after short pause
        setTimeout(() => {
          voiceAssistant.speak(`Reading extracted text: ${text}`);
        }, 1200);
      } else {
        voiceAssistant.speak("No text detected in the image. Please try again.");
        if (this.onStateChange) {
          this.onStateChange({ isOpen: true, isScanning: false, text: "No text detected." });
        }
      }
    } catch (err) {
      console.error("[CameraAssistant] OCR Processing Error:", err);
      this.isScanning = false;
      voiceAssistant.speak("Text extraction failed. Please try capturing again.");
      if (this.onStateChange) {
        this.onStateChange({ isOpen: true, isScanning: false, text: "Failed to extract text." });
      }
    }
  }
}

const cameraAssistant = new CameraAssistant();
export default cameraAssistant;
