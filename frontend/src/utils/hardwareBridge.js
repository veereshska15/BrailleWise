// src/utils/hardwareBridge.js
/**
 * BrailleWise Hardware Bridge Client
 * ===================================
 * Connects React UI components directly to the ESP32 physical Braille cell
 * (tactile solenoids and Perkins push buttons) via the Flask backend proxy.
 */

const DEFAULT_ESP32_IP = "braillewise.local";
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const BRAILLE_MAP = {
  'A': [1], 'B': [1, 2], 'C': [1, 4], 'D': [1, 4, 5], 'E': [1, 5], 'F': [1, 2, 4],
  'G': [1, 2, 4, 5], 'H': [1, 2, 5], 'I': [2, 4], 'J': [2, 4, 5], 'K': [1, 3], 'L': [1, 2, 3],
  'M': [1, 3, 4], 'N': [1, 3, 4, 5], 'O': [1, 3, 5], 'P': [1, 2, 3, 4], 'Q': [1, 2, 3, 4, 5], 'R': [1, 2, 3, 5],
  'S': [2, 3, 4], 'T': [2, 3, 4, 5], 'U': [1, 3, 6], 'V': [1, 2, 3, 6], 'W': [2, 4, 5, 6],
  'X': [1, 3, 4, 6], 'Y': [1, 3, 4, 5, 6], 'Z': [1, 3, 5, 6]
};

export const getHardwareIp = () => {
  const stored = localStorage.getItem('esp32_hardware_ip');
  if (stored && stored !== '10.92.41.10') return stored;
  return DEFAULT_ESP32_IP;
};

export const setHardwareIp = (ip) => {
  localStorage.setItem('esp32_hardware_ip', (ip || '').trim());
};

export const isHardwareEnabled = () => {
  const val = localStorage.getItem('esp32_hardware_enabled');
  return val === null ? true : val === 'true'; // Enabled by default
};

export const setHardwareEnabled = (enabled) => {
  localStorage.setItem('esp32_hardware_enabled', enabled ? 'true' : 'false');
};

/**
 * Converts an array of dot numbers like [1, 2] or an existing 6-dot binary array
 * to a standardized 6-element binary array [d1, d2, d3, d4, d5, d6]
 */
export const dotsToBinaryArray = (dots = []) => {
  // If already a 6-element binary array of 0s and 1s, return sanitized copy
  if (Array.isArray(dots) && dots.length === 6 && dots.every(x => x === 0 || x === 1 || x === true || x === false)) {
    return dots.map(x => (x === 1 || x === true) ? 1 : 0);
  }
  // Otherwise treat as a list of 1-indexed active dot numbers: e.g. [1, 4] -> [1, 0, 0, 1, 0, 0]
  const binary = [0, 0, 0, 0, 0, 0];
  if (Array.isArray(dots)) {
    dots.forEach(dotNum => {
      const num = parseInt(dotNum, 10);
      if (num >= 1 && num <= 6) {
        binary[num - 1] = 1;
      }
    });
  }
  return binary;
};

/**
 * Actuates 6 physical solenoids for a given dots list (e.g. [1, 2] or [1, 1, 0, 0, 0, 0])
 */
export const actuateDots = async (dots = [], letterContext = "") => {
  if (!isHardwareEnabled()) return { success: false, disabled: true };
  const binaryArray = dotsToBinaryArray(dots);
  const ip = getHardwareIp();

  console.log(`[FRONTEND HARDWARE TRACE] Letter: '${letterContext || 'DIRECT'}' | Dots: ${JSON.stringify(dots)} | Binary: ${JSON.stringify(binaryArray)} | Target: ${ip}`);

  try {
    const response = await fetch(`${API_BASE}/api/hardware/esp32/set-pattern`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, dots: binaryArray, letter: letterContext })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('[hardwareBridge] Actuation failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Actuates physical solenoids for an English letter ('A', 'B', etc.)
 */
export const actuateLetter = async (letter) => {
  if (!letter) return clearTactileCell();
  const upper = letter.toUpperCase();
  const dots = BRAILLE_MAP[upper] || [];
  console.log(`[FRONTEND HARDWARE TRACE] actuateLetter called for '${upper}' -> Mapped dots: ${JSON.stringify(dots)}`);
  return await actuateDots(dots, upper);
};

/**
 * Lowers all 6 solenoids
 */
export const clearTactileCell = async () => {
  return await actuateDots([]);
};

/**
 * Reads the 6 button states from the ESP32
 */
export const readButtons = async () => {
  const ip = getHardwareIp();
  try {
    const response = await fetch(`${API_BASE}/api/hardware/esp32/read-buttons?ip=${encodeURIComponent(ip)}`);
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Tests physical solenoids by pulsing ALL SIX solenoids together for 800 ms,
 * then safely releasing all solenoids simultaneously.
 */
export const testHardwareConnection = async () => {
  const ip = getHardwareIp();
  try {
    const response = await fetch(`${API_BASE}/api/hardware/esp32/test-solenoids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip })
    });
    const res = await response.json();
    if (res.success) {
      return { connected: true, message: `Pulsed ALL 6 solenoids simultaneously on ESP32 at ${ip} (800ms test)` };
    }
    // Fallback: actuate ALL 6 solenoids simultaneously for 800ms
    const fallbackRes = await actuateDots([1, 2, 3, 4, 5, 6]);
    if (fallbackRes.success) {
      setTimeout(async () => {
        await clearTactileCell();
      }, 800);
      return { connected: true, message: `Pulsed ALL 6 solenoids on ESP32 at ${ip} (800ms test)` };
    }
    return { connected: false, message: res.error || res.message || `Could not reach ESP32 at ${ip}` };
  } catch (err) {
    // If backend endpoint fails, fallback to direct actuateDots
    try {
      const fallbackRes = await actuateDots([1, 2, 3, 4, 5, 6]);
      if (fallbackRes.success) {
        setTimeout(async () => {
          await clearTactileCell();
        }, 800);
        return { connected: true, message: `Pulsed ALL 6 solenoids on ESP32 at ${ip} (800ms test)` };
      }
    } catch (_) {}
    return { connected: false, message: err.message };
  }
};

/**
 * Tests an individual physical solenoid (Dot 1 to Dot 6) for 800 ms
 */
export const testSingleDot = async (dotNumber) => {
  const num = parseInt(dotNumber, 10);
  if (num < 1 || num > 6) return { success: false, error: 'Invalid dot number (expected 1-6)' };
  try {
    const res = await actuateDots([num]);
    if (res.success) {
      setTimeout(async () => {
        await clearTactileCell();
      }, 800);
    }
    return res;
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export default {
  getHardwareIp,
  setHardwareIp,
  isHardwareEnabled,
  setHardwareEnabled,
  dotsToBinaryArray,
  actuateDots,
  actuateLetter,
  clearTactileCell,
  readButtons,
  testHardwareConnection,
  testSingleDot
};
