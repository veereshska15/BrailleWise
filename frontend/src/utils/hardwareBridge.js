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
 * Converts an array of dot numbers like [1, 2] to a 6-element binary array [1, 1, 0, 0, 0, 0]
 */
export const dotsToBinaryArray = (dots = []) => {
  const binary = [0, 0, 0, 0, 0, 0];
  dots.forEach(dotNum => {
    if (dotNum >= 1 && dotNum <= 6) {
      binary[dotNum - 1] = 1;
    }
  });
  return binary;
};

/**
 * Actuates 6 physical solenoids for a given dots list (e.g. [1, 2])
 */
export const actuateDots = async (dots = []) => {
  if (!isHardwareEnabled()) return { success: false, disabled: true };
  const binaryArray = dotsToBinaryArray(dots);
  const ip = getHardwareIp();

  try {
    const response = await fetch(`${API_BASE}/api/hardware/esp32/set-pattern`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, dots: binaryArray })
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
  const dots = BRAILLE_MAP[letter.toUpperCase()] || [];
  return await actuateDots(dots);
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
 * Tests connection to ESP32 by pulsing Dot 1 (Solenoid 1)
 */
export const testHardwareConnection = async () => {
  const ip = getHardwareIp();
  try {
    const res = await actuateDots([1]);
    if (res.success) {
      setTimeout(() => clearTactileCell(), 1000);
      return { connected: true, message: `Connected to ESP32 at ${ip}!` };
    }
    return { connected: false, message: res.error || `Could not reach ESP32 at ${ip}` };
  } catch (err) {
    return { connected: false, message: err.message };
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
  testHardwareConnection
};
