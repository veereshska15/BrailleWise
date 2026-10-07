import learningProgress, { LESSON_LETTERS } from './learningProgress';

class VoiceGuidanceController {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.settings = {
      voiceURI: null,
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      muted: false,
      autoAchievements: true,
      autoLessonComplete: true,
      autoLetterMastered: true,
      autoQuizResult: true,
      autoProgressUpdate: true,
      autoReadPageHeading: true,
      keyboardEnabled: true
    };
    
    this.listeners = new Set();
    this.initialized = false;
    this.navigate = null;
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleFocus = this._handleFocus.bind(this);
  }

  setNavigate(navFn) {
    this.navigate = navFn;
  }

  init() {
    if (this.initialized) return;
    
    // Load voices
    const populateVoices = () => {
      this.voices = this.synth.getVoices();
      this.notifyListeners();
    };
    populateVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = populateVoices;
    }

    // Attempt to load settings from localStorage/user object
    this.loadSettings();

    // Attach global keyboard listeners
    window.addEventListener('keydown', this._handleKeydown);
    window.addEventListener('focusin', this._handleFocus);
    
    this.initialized = true;
  }
  
  _handleFocus(e) {
    if (!this.synth || this.settings.muted) return;
    
    const target = e.target;
    // Announce if it's a button or has role button
    if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
      const label = target.getAttribute('aria-label') || target.innerText;
      if (label && label.trim().length > 0) {
        // Read button name
        this.speak(label.trim());
      }
    }
  }
  
  _handleKeydown(e) {
    if (!this.settings.keyboardEnabled) return;
    
    // Don't trigger if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Handle shortcuts
    if (e.code === 'Space') {
      e.preventDefault();
      if (this.synth.speaking) {
        if (this.synth.paused) {
          this.resume();
        } else {
          this.pause();
        }
      }
    } else if (e.code === 'Escape') {
      e.preventDefault();
      this.stop();
    } else if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
      e.preventDefault();
      if (this.navigate) this.navigate('/voice');
    } else if (e.ctrlKey && e.code === 'KeyR') {
      e.preventDefault();
      this.readCurrentPage();
    } else if (e.ctrlKey && e.code === 'KeyL') {
      e.preventDefault();
      this.readCurrentLesson();
    } else if (e.ctrlKey && e.code === 'KeyP') {
      e.preventDefault();
      this.readLearningProgress();
    } else if (e.ctrlKey && e.code === 'KeyM') {
      e.preventDefault();
      this.toggleMute();
    }
  }

  loadSettings() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.voice_settings) {
          this.settings = { ...this.settings, ...user.voice_settings };
        }
      }
    } catch (e) {
      console.error("Failed to load voice settings", e);
    }
  }

  async saveSettings() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      user.voice_settings = this.settings;
      localStorage.setItem('user', JSON.stringify(user));

      const token = localStorage.getItem('token');
      if (token) {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        await fetch(`${apiBase}/api/auth/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ voice_settings: this.settings })
        });
      }
    } catch (e) {
      console.error("Failed to save voice settings to backend", e);
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.notifyListeners();
  }

  speak(text) {
    if (!this.synth || this.settings.muted) return;
    
    // As per user instructions: "Before speaking: speechSynthesis.cancel() then start the new utterance."
    this.synth.cancel(); 
    
    this._speakRaw(text);
  }

  // Internal raw speak for queueing multiple sentences without cancelling previous in the queue
  _speakRaw(text) {
    if (!this.synth || this.settings.muted) return;
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (this.settings.voiceURI) {
      const voice = this.voices.find(v => v.voiceURI === this.settings.voiceURI);
      if (voice) utterance.voice = voice;
    }
    
    utterance.lang = this.settings.language;
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;

    utterance.onstart = () => this.notifyListeners();
    utterance.onend = () => this.notifyListeners();
    utterance.onpause = () => this.notifyListeners();
    utterance.onresume = () => this.notifyListeners();

    this.synth.speak(utterance);
    this.notifyListeners();
  }

  // Speak a queue of phrases back to back (creating natural pauses)
  speakQueue(phrases) {
    if (!this.synth || this.settings.muted) return;
    this.synth.cancel();
    phrases.forEach(phrase => {
      if (phrase && phrase.trim()) {
        this._speakRaw(phrase);
      }
    });
  }



  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      console.log("Speech paused");
      this.synth.pause();
      this.notifyListeners();
    }
  }

  resume() {
    if (this.synth.paused) {
      console.log("Speech resumed");
      this.synth.resume();
      this.notifyListeners();
    }
  }

  stop() {
    console.log("Speech stopped");
    this.synth.cancel();
    this.notifyListeners();
  }
  
  toggleMute() {
    this.settings.muted = !this.settings.muted;
    if (this.settings.muted) {
      this.stop();
    }
    this.saveSettings();
    this.notifyListeners();
  }

  // --- Smart Context Reading ---

  readSelectedText() {
    const selected = window.getSelection().toString().trim();
    if (selected) {
      this.speak(selected);
    } else {
      this.speak("No text selected.");
    }
  }

  readPageHeading(title) {
    if (this.settings.autoReadPageHeading) {
      // Don't interrupt if currently speaking 
      // (Actually, the user requirement: "Do not interrupt speech that is already playing."
      // when a page automatically announces itself.)
      if (this.synth && this.synth.speaking) return;

      this.speak(`${title} loaded.`);
    }
  }

  readCurrentPage() {
    console.log("Reading page...");
    
    // Collect all visible headings, labels, buttons, and important content
    const elements = document.querySelectorAll('h1, h2, h3, button, .summary-stat-label, .summary-stat-value, .check-option-btn, .header-welcome, p');
    
    const texts = [];
    elements.forEach(el => {
      // Basic visibility check
      if (el.offsetParent !== null) {
        const text = el.innerText.trim();
        if (text && !texts.includes(text)) {
          texts.push(text);
        }
      }
    });

    if (texts.length > 0) {
      const sentence = texts.join('. ');
      this.speak(`Current page contains: ${sentence}`);
    } else {
      this.speak("Current page is empty or loading.");
    }
  }

  readCurrentLesson() {
    console.log("Reading lesson...");
    const state = learningProgress.getState();
    const lesson = state.lessons[state.currentLesson];
    if (lesson) {
      const lessonName = lesson.name || `Lesson ${state.currentLesson}`;
      const lettersInLesson = LESSON_LETTERS[state.currentLesson] || [];
      const totalLetters = lettersInLesson.length;
      const masteredCount = lettersInLesson.filter(char => (state.letterStreaks[char] || 0) >= 5).length;
      const remainingCount = totalLetters - masteredCount;
      const progressPercent = Math.round((masteredCount / totalLetters) * 100) || 0;
      
      this.speakQueue([
        `Lesson ${state.currentLesson}.`,
        `${lessonName}.`,
        `Current letter is ${state.currentLetter || 'A'}.`,
        `You have mastered ${masteredCount} out of ${totalLetters} letters in this lesson.`,
        `${remainingCount} letters remain.`,
        `Current progress is ${progressPercent} percent.`
      ]);
    } else {
      this.speak('No active lesson found.');
    }
  }

  readLearningProgress() {
    console.log("Reading progress...");
    const state = learningProgress.getState();
    const xp = state.xp || 0;
    const progress = state.progress || 0;
    const accuracy = state.overallAccuracy || 0;
    
    const masteredLessons = Object.values(state.lessons).filter(l => l.state === 'MASTERED').length;
    const masteredLetters = Object.values(state.letterStreaks || {}).filter(c => c >= 5).length;
    const remainingLetters = 26 - masteredLetters;
    
    this.speak(`Your overall progress is ${progress} percent. You are currently on lesson ${state.currentLesson}. You have mastered ${masteredLetters} letters. You have ${remainingLetters} letters remaining. You have mastered ${masteredLessons} lessons. You have earned ${xp} Experience Points with an overall accuracy of ${accuracy} percent.`);
  }

  announceAchievement(badgeName) {
    if (!this.settings.autoAchievements) return;
    this.speakQueue([
      "Achievement unlocked.",
      badgeName
    ]);
  }

  // --- Intelligent Braille Tutor Methods ---
  
  teachLessonIntro(title, description) {
    this.speakQueue([
      `Welcome to ${title}.`,
      description
    ]);
  }

  teachLetter(letter, dots) {
    this.speakQueue([
      `Letter ${letter}.`,
      `Braille pattern.`,
      `Dots ${dots.join(' ')}.`,
      `Please enter Letter ${letter}.`
    ]);
  }

  teachWord(word, letterDotsMap) {
    const queue = [`Word.`, `${word}.`];
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const dots = letterDotsMap[char] || [];
      queue.push(`Letter ${char}.`);
      if (dots.length === 1) {
        queue.push(`Dot ${dots[0]}.`);
      } else if (dots.length > 1) {
        queue.push(`Dots ${dots.join(' ')}.`);
      }
    }
    queue.push(`Now type the complete word.`);
    this.speakQueue(queue);
  }

  gradeAnswer(isCorrect, letter, dots, correctOpt) {
    if (isCorrect) {
      this.speakQueue([
        `Correct.`,
        `Letter ${letter} mastered.`
      ]);
    } else {
      if (dots) {
        this.speakQueue([
          `Incorrect.`,
          `Remember.`,
          `Letter ${letter} uses Dots ${dots.join(' ')}.`
        ]);
      } else if (correctOpt) {
        this.speakQueue([
          `Incorrect.`,
          `The correct answer is ${correctOpt}.`
        ]);
      }
    }
  }

  teachQuizQuestion(qNum, question, options) {
    const queue = [
      `Question ${qNum}.`,
      question
    ];
    
    const optionNames = ["One", "Two", "Three", "Four", "Five"];
    options.forEach((opt, idx) => {
      queue.push(`Option ${optionNames[idx] || (idx+1)}.`);
      queue.push(opt);
    });
    
    this.speakQueue(queue);
  }

  // Observers for React components
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getStatus() {
    if (!this.synth) return 'Unsupported';
    if (this.synth.paused) return 'Paused';
    if (this.synth.speaking) return 'Speaking';
    return 'Idle';
  }
}

const voiceGuidance = new VoiceGuidanceController();
export default voiceGuidance;
