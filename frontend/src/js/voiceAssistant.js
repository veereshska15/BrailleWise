/**
 * BrailleWise Universal Application-Aware Voice Command Controller
 * ================================================================
 * React-aware DOM MutationObserver Scanner, Fuse.js Fuzzy Match Engine,
 * Carrier Phrase Stripper, Hidden UI Auto-Expansion, Disambiguation Prompting,
 * Echo Suppression Guard, and Real-Time Debug Inspector.
 */

import Fuse from 'fuse.js';

// Synonym Dictionary for Natural Language Intent Expansion
const SYNONYM_MAP = {
  performance: ["performance", "progress", "statistics", "analytics", "stats", "bar-chart", "charts"],
  achievements: ["achievements", "achievement", "certificates", "badges", "rewards", "award", "trophies"],
  voice: ["voice guidance", "voice guide", "guidance", "voice assistant", "voice", "audio guidance", "speech"],
  profile: ["profile", "my profile", "user profile", "account", "user info", "user details"],
  dashboard: ["dashboard", "home", "overview", "main page"],
  learn: ["learn", "learn braille", "learning", "lessons", "courses", "modules"],
  quiz: ["quiz", "practice quiz", "practice", "test", "exercise", "revision"],
  continue: ["continue", "continue lesson", "resume", "resume lesson", "next lesson", "keep learning"],
  settings: ["settings", "preferences", "config", "options"],
  logout: ["logout", "sign out", "log out", "exit"]
};

class UniversalVoiceController {
  constructor() {
    this.recognition = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isListening = false;
    this.isSpeaking = false;
    this.navigate = null;
    this.cameraAssistant = null;

    // Observers & Listeners
    this.onStatusChange = null;
    this.onTranscript = null;
    this.debugListeners = new Set();
    this.mutationObserver = null;
    this.scanTimeout = null;

    // Registry & Deduplication State
    this.commandRegistry = [];
    this.fuseInstance = null;
    this.lastCommand = "";
    this.lastCommandTime = 0;
    this.cooldownMs = 3000;

    // Speech Output Guard
    this.lastSpokenMessage = "";
    this.lastSpokenTime = 0;

    // Debug Inspector State
    this.debugLog = {
      currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
      elementsCount: 0,
      recognizedSpeech: "-",
      matchedElement: "-",
      confidenceScore: "0%",
      executedAction: "-",
      rejectedReason: "-"
    };
  }

  setNavigate(navFn) {
    this.navigate = navFn;
  }

  setCameraAssistant(cameraInstance) {
    this.cameraAssistant = cameraInstance;
  }

  // =========================================================================
  // DEBUG OBSERVER SYSTEM
  // =========================================================================
  subscribeDebug(listener) {
    this.debugListeners.add(listener);
    listener(this.debugLog);
    return () => this.debugListeners.delete(listener);
  }

  updateDebugLog(fields) {
    this.debugLog = { ...this.debugLog, ...fields };
    this.debugListeners.forEach(listener => listener(this.debugLog));
  }

  // =========================================================================
  // INITIALIZATION & MUTATIONOBSERVER SETUP
  // =========================================================================
  init(options = {}) {
    if (options.navigate) this.navigate = options.navigate;
    if (options.onStatusChange) this.onStatusChange = options.onStatusChange;
    if (options.onTranscript) this.onTranscript = options.onTranscript;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API (SpeechRecognition) is not supported in this browser.");
      return false;
    }

    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStatusChange) this.onStatusChange(true);
    };

    this.recognition.onend = () => {
      if (this.isListening && !this.isSpeaking) {
        try {
          this.recognition.start();
        } catch (e) {
          if (e.name !== 'InvalidStateError') {
            console.warn("[VoiceController] Restart notice:", e.message);
          }
        }
      } else {
        if (!this.isListening && this.onStatusChange) {
          this.onStatusChange(false);
        }
      }
    };

    this.recognition.onresult = (event) => {
      if (this.isSpeaking) return;

      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      finalTranscript = finalTranscript.trim();
      if (finalTranscript) {
        this.handleRecognizedCommand(finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      console.warn("[VoiceController] Recognition error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.isListening = false;
        if (this.onStatusChange) this.onStatusChange(false);
        this.speak("Microphone permission denied.");
      }
    };

    // Attach MutationObserver to dynamically rebuild registry when React renders changes
    this.setupMutationObserver();

    // Initial DOM Scan
    this.scanDOM();

    return true;
  }

  setupMutationObserver() {
    if (typeof document === 'undefined' || this.mutationObserver) return;

    this.mutationObserver = new MutationObserver(() => {
      // Debounce DOM re-scans by 150ms to prevent performance lag
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = setTimeout(() => {
        this.scanDOM();
      }, 150);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'aria-expanded']
    });
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  startListening() {
    if (!this.recognition && !this.init()) {
      this.speak("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      this.isListening = true;
      if (!this.isSpeaking) {
        this.recognition.start();
      }
      this.speak("Voice Assistant active.");
    } catch (e) {
      if (e.name !== 'InvalidStateError') {
        console.warn("[VoiceController] Start error:", e);
      }
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn("[VoiceController] Stop error:", e);
      }
    }
    this.speak("Voice Assistant paused.");
  }

  // =========================================================================
  // FEEDBACK LOOP PREVENTION & SPEECH SYNTHESIS
  // =========================================================================
  speak(text, callback) {
    if (!this.synth) return;

    const now = Date.now();
    // Prevent duplicate speech messages within 5 seconds
    if (this.lastSpokenMessage === text && (now - this.lastSpokenTime < 5000)) {
      console.log(`[VoiceController] Suppressed duplicate speech message: '${text}'`);
      return;
    }

    this.lastSpokenMessage = text;
    this.lastSpokenTime = now;

    // Mark isSpeaking = true & abort microphone recognition temporarily
    this.isSpeaking = true;
    if (this.recognition) {
      try { this.recognition.abort(); } catch (e) {}
    }

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const resetSpeakingState = () => {
      this.isSpeaking = false;
      if (callback) callback();

      // Buffer delay before resuming microphone recognition
      setTimeout(() => {
        if (this.isListening && !this.isSpeaking) {
          try {
            this.recognition.start();
          } catch (e) {
            if (e.name !== 'InvalidStateError') {
              console.warn("[VoiceController] Recognition restart notice:", e.message);
            }
          }
        }
      }, 400);
    };

    utterance.onend = resetSpeakingState;
    utterance.onerror = resetSpeakingState;

    this.synth.speak(utterance);
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  // =========================================================================
  // UNIVERSAL REACT-AWARE DOM SCANNER (scanDOM)
  // =========================================================================
  isElementVisible(el) {
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    const style = window.getComputedStyle(el);
    return (
      el.offsetParent !== null &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      el.offsetWidth > 0 &&
      el.offsetHeight > 0
    );
  }

  scanDOM() {
    if (typeof document === 'undefined') return [];

    const selectors = [
      'button', 'a', 'input[type="button"]', 'input[type="submit"]', 'input[type="reset"]',
      'select', 'textarea', 'summary', 'details',
      '[role="button"]', '[role="menuitem"]', '[role="tab"]', '[role="link"]', '[role="option"]',
      '[data-action]', '[data-testid]',
      '.card', '.nav-item', '.sidebar-link', '.sidebar-item', '.menu-item', '.tab', '.dropdown-item',
      '.MuiButton-root', '.chakra-button', '.btn', '.card-btn'
    ];

    const raw = Array.from(document.querySelectorAll(selectors.join(',')));
    const registry = [];

    for (const el of raw) {
      if (el.closest('.assistant-floating-container') || el.closest('.assistant-debug-overlay')) continue;

      const visible = this.isElementVisible(el);

      const innerText = (el.innerText || el.textContent || '').trim();
      const ariaLabel = (el.getAttribute('aria-label') || '').trim();
      const ariaLabelledBy = el.getAttribute('aria-labelledby') ? (document.getElementById(el.getAttribute('aria-labelledby'))?.innerText || '') : '';
      const title = (el.getAttribute('title') || '').trim();
      const alt = (el.getAttribute('alt') || '').trim();
      const placeholder = (el.getAttribute('placeholder') || '').trim();
      const name = (el.getAttribute('name') || '').trim();
      const id = (el.id || '').trim();
      const dataAction = (el.getAttribute('data-action') || '').trim();
      const dataTestId = (el.getAttribute('data-testid') || '').trim();
      const value = (el.value || '').trim();

      const svgAlt = Array.from(el.querySelectorAll('svg title, svg aria-label')).map(s => s.textContent).join(' ');

      // Find associated synonym tags
      const primaryText = (innerText || ariaLabel || ariaLabelledBy || title || id).toLowerCase();
      let synonyms = [];
      for (const [key, synList] of Object.entries(SYNONYM_MAP)) {
        if (synList.some(s => primaryText.includes(s))) {
          synonyms.push(...synList);
        }
      }

      const combinedText = `${innerText} ${ariaLabel} ${ariaLabelledBy} ${title} ${alt} ${placeholder} ${name} ${id} ${dataAction} ${dataTestId} ${value} ${svgAlt} ${synonyms.join(' ')}`
        .toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();

      if (combinedText.length > 0) {
        registry.push({
          element: el,
          innerText,
          ariaLabel: ariaLabel || ariaLabelledBy,
          title,
          id,
          dataAction,
          combinedText,
          synonymsText: synonyms.join(' '),
          visible
        });
      }
    }

    this.commandRegistry = registry;

    // Initialize Fuse.js index over live command registry
    this.fuseInstance = new Fuse(registry, {
      keys: [
        { name: 'innerText', weight: 0.4 },
        { name: 'ariaLabel', weight: 0.3 },
        { name: 'title', weight: 0.2 },
        { name: 'combinedText', weight: 0.1 }
      ],
      includeScore: true,
      threshold: 0.5,
      ignoreLocation: true
    });

    this.updateDebugLog({
      currentPage: window.location.pathname,
      elementsCount: registry.length
    });

    return registry;
  }

  // =========================================================================
  // NATURAL LANGUAGE CARRIER PHRASE STRIPPER
  // =========================================================================
  cleanSpokenCommand(transcript) {
    // Strip trailing punctuation
    let cmd = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();

    const prefixes = [
      "take me to the ", "take me to ", "go to the ", "go to ",
      "open the ", "open ", "show me the ", "show me ", "show ",
      "click on the ", "click on ", "click ", "please ",
      "navigate to ", "my "
    ];

    for (const prefix of prefixes) {
      if (cmd.startsWith(prefix) && cmd.length > prefix.length + 1) {
        cmd = cmd.substring(prefix.length).trim();
        break;
      }
    }

    return cmd;
  }

  // =========================================================================
  // FUSE.JS FUZZY SEARCH & ACTION RESOLUTION
  // =========================================================================
  executeVoiceCommand(spokenCommand) {
    this.scanDOM();
    const cleanedQuery = this.cleanSpokenCommand(spokenCommand);

    console.log(`[VoiceController] Executing command: '${spokenCommand}' (Cleaned: '${cleanedQuery}')`);

    this.updateDebugLog({
      recognizedSpeech: spokenCommand,
      matchedElement: "-",
      confidenceScore: "0%",
      executedAction: "Searching Registry...",
      rejectedReason: "-"
    });

    // 1. Direct Fuse.js Fuzzy Search
    const fuseResults = this.fuseInstance ? this.fuseInstance.search(cleanedQuery) : [];

    let bestCandidate = null;
    let confidenceScore = 0;

    if (fuseResults.length > 0) {
      const topResult = fuseResults[0];
      bestCandidate = topResult.item;
      // Fuse.js score: 0 is exact match, 1 is total mismatch
      confidenceScore = Math.max(0, 1 - topResult.score);
    }

    // 2. Fallback Manual Synonym & Token Overlap Scorer if Fuse score is low
    if (confidenceScore < 0.45) {
      for (const candidate of this.commandRegistry) {
        const text = candidate.combinedText;
        if (text.includes(cleanedQuery)) {
          bestCandidate = candidate;
          confidenceScore = 0.85;
          break;
        }
        for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
          if (syns.includes(cleanedQuery) && syns.some(s => text.includes(s))) {
            bestCandidate = candidate;
            confidenceScore = 0.88;
            break;
          }
        }
        if (confidenceScore >= 0.85) break;
      }
    }

    // AUTO-EXPANSION: If matched candidate exists but is currently hidden
    if (bestCandidate && !bestCandidate.visible) {
      console.log(`[VoiceController] Matched element is hidden. Attempting menu auto-expansion...`);
      const menuToggles = Array.from(document.querySelectorAll('.sidebar-toggle, .menu-toggle, summary, details, button[aria-expanded="false"]'));
      for (const toggle of menuToggles) {
        if (this.isElementVisible(toggle)) {
          toggle.click();
          break;
        }
      }
      this.scanDOM();
    }

    // EXECUTION DISPATCH IF CONFIDENCE THRESHOLD MET
    if (bestCandidate && confidenceScore >= 0.40) {
      const displayLabel = bestCandidate.innerText || bestCandidate.ariaLabel || bestCandidate.title || cleanedQuery;
      const cleanLabel = displayLabel.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const confidencePct = Math.round(confidenceScore * 100) + "%";

      this.updateDebugLog({
        matchedElement: displayLabel,
        confidenceScore: confidencePct,
        executedAction: `Clicked <${bestCandidate.element.tagName.toLowerCase()}> "${cleanLabel}"`,
        rejectedReason: "None (Successfully Executed)"
      });

      // Single confirmation output
      this.speak(`Opening ${cleanLabel || cleanedQuery}.`);

      try {
        bestCandidate.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        bestCandidate.element.focus();

        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        });
        bestCandidate.element.dispatchEvent(clickEvent);

        if (typeof bestCandidate.element.click === 'function') {
          bestCandidate.element.click();
        }
      } catch (err) {
        console.error("[VoiceController] Click execution error:", err);
        bestCandidate.element.click();
      }

      return true;
    }

    // DISAMBIGUATION PROMPT IF CONFIDENCE IS CLOSE / AMBIGUOUS (between 0.25 and 0.40)
    if (fuseResults.length >= 2 && confidenceScore >= 0.25 && confidenceScore < 0.40) {
      const opt1 = (fuseResults[0].item.innerText || fuseResults[0].item.ariaLabel || '').trim();
      const opt2 = (fuseResults[1].item.innerText || fuseResults[1].item.ariaLabel || '').trim();
      if (opt1 && opt2 && opt1 !== opt2) {
        const promptText = `Did you mean ${opt1} or ${opt2}?`;
        this.updateDebugLog({
          matchedElement: "Ambiguous Match",
          confidenceScore: Math.round(confidenceScore * 100) + "%",
          executedAction: "Disambiguation Prompt",
          rejectedReason: `Ambiguous match between "${opt1}" and "${opt2}".`
        });
        this.speak(promptText);
        return false;
      }
    }

    // NO MATCHING ELEMENT FOUND
    console.warn(`[VoiceController] No matching element found for: '${spokenCommand}'`);
    this.updateDebugLog({
      matchedElement: "None",
      confidenceScore: "0%",
      executedAction: "None",
      rejectedReason: "No visible element matched confidence threshold (0.40)."
    });

    this.speak("I couldn't find that option on this page.");
    return false;
  }

  // =========================================================================
  // DEDUPLICATION & RECOGNITION COMMAND HANDLER
  // =========================================================================
  handleRecognizedCommand(rawCommand) {
    const command = rawCommand.toLowerCase().trim();
    if (!command || this.isSpeaking) return;

    // Filter out assistant's own synthesized phrases if heard by microphone
    const selfPhrases = [
      "couldn't find",
      "option on this page",
      "voice assistant active",
      "voice assistant paused",
      "opening",
      "continuing your lesson",
      "starting lesson",
      "submitting",
      "retrying",
      "finishing",
      "camera opened",
      "text detected",
      "reading extracted text",
      "reading page",
      "stopped reading",
      "did you mean"
    ];

    for (const phrase of selfPhrases) {
      if (command.includes(phrase)) {
        console.log(`[VoiceController] Filtered out self-spoken phrase: '${command}'`);
        return;
      }
    }

    const now = Date.now();
    const timeSinceLast = now - this.lastCommandTime;

    if (command === this.lastCommand && timeSinceLast < this.cooldownMs) {
      console.log(`[VoiceController] Suppressed duplicate command: '${command}' (${timeSinceLast}ms < ${this.cooldownMs}ms).`);
      return;
    }

    this.lastCommand = command;
    this.lastCommandTime = now;

    if (this.onTranscript) {
      this.onTranscript(command);
    }

    this.processCommand(command);
  }

  // =========================================================================
  // UNIVERSAL COMMAND ROUTER
  // =========================================================================
  processCommand(command) {
    console.log("[VoiceController] Processing Universal Command:", command);

    if (command.startsWith("search ")) {
      const query = command.replace("search ", "").trim();
      this.handleSearch(query);
      return;
    }

    if (command === "read page" || command.includes("read page")) {
      this.speak("Reading page.");
      this.readPageContent();
      return;
    }

    if (command === "stop reading" || command === "stop") {
      this.stopSpeaking();
      this.speak("Stopped reading.");
      return;
    }

    if (command.includes("open camera")) {
      this.speak("Camera opened.");
      if (this.cameraAssistant) {
        this.cameraAssistant.openCamera();
      }
      return;
    }

    if (command.includes("capture") || command.includes("scan text")) {
      if (this.cameraAssistant) {
        this.cameraAssistant.captureAndScan();
      } else {
        this.speak("Camera is not active.");
      }
      return;
    }

    if (command === "click") {
      this.speak("Clicking focused element.");
      if (document.activeElement && typeof document.activeElement.click === 'function') {
        document.activeElement.click();
      }
      return;
    }

    if (command === "cancel") {
      this.triggerCancel();
      return;
    }

    this.executeVoiceCommand(command);
  }

  handleSearch(query) {
    this.speak(`Searching for ${query}.`);
    const searchInput = document.querySelector('input[type="search"], input[type="text"], input[name*="search"], input[placeholder*="search" i]');
    if (searchInput) {
      searchInput.focus();
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));

      const searchBtn = searchInput.closest('form')?.querySelector('button[type="submit"]') ||
                        document.querySelector('button[aria-label*="search" i], .search-btn');
      if (searchBtn) {
        searchBtn.click();
      }
    }
  }

  triggerCancel() {
    if (this.cameraAssistant && this.cameraAssistant.isOpen) {
      this.cameraAssistant.closeCamera();
      this.speak("Camera closed.");
      return;
    }
    const cancelBtn = document.querySelector('.btn-cancel, .cancel-btn, button[aria-label*="close" i], .modal-close');
    if (cancelBtn) {
      this.speak("Cancelled.");
      cancelBtn.click();
    }
  }

  readPageContent() {
    const elements = document.querySelectorAll('h1, h2, h3, p, button, .card-title, .lesson-text');
    const texts = [];

    elements.forEach(el => {
      if (this.isElementVisible(el)) {
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt && !texts.includes(txt) && txt.length < 300) {
          texts.push(txt);
        }
      }
    });

    if (texts.length > 0) {
      const fullText = texts.join('. ');
      this.speak(`Page content: ${fullText}`);
    } else {
      this.speak("Current page has no readable text.");
    }
  }
}

const voiceAssistant = new UniversalVoiceController();

export const findClickableElements = () => voiceAssistant.scanDOM();
export const clickByVoice = (command) => voiceAssistant.executeVoiceCommand(command);

export default voiceAssistant;
