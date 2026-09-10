/*
  =================================================================================
  BrailleWise ESP32 Smart Braille Controller & Tactile Display Server
  =================================================================================
  Features:
  - Built-in HTTP REST Web Server on port 80 (/set-pattern & /read-buttons)
  - 6-Dot Tactile Braille Solenoid Actuator Driver (Motor driver M1A-M3B)
  - 6-Dot Perkins Braille Chording Keyboard Input (Active LOW with internal pullups)
  - 3 Navigation / Action Buttons (Space, Backspace, Enter/Submit)
  - Wi-Fi HTTP Client & Server integration with BrailleWise Flask Backend
  - Bluetooth Low Energy (BLE) Keyboard emulation mode
  - Optional SSD1306 OLED Display status reporting & Audio Buzzer feedback
  =================================================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESPmDNS.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <BleKeyboard.h>

// =================================================================================
// 1. CONFIGURATION & PIN MAPPINGS
// =================================================================================

// Wi-Fi Credentials & Backend API URL
const char* WIFI_SSID = ".";
const char* WIFI_PASS = "12345677";
// Automatically points to your PC's active Wi-Fi IP and Flask backend port 5000:
const char* BACKEND_URL = "http://10.26.213.38:5000/api/hardware";

// Web Server instance on port 80
WebServer server(80);

// ---------------------------------------------------------------------------------
// OUTPUT PINS: 6 Tactile Solenoid Actuators (Dots 1-6)
// ---------------------------------------------------------------------------------
// Standard Wiring (Motor Driver M1A-M3B / ULN2003 / MOSFETs):
// Solenoid 1 (Dot 1) → M1A → GPIO 13
// Solenoid 2 (Dot 2) → M1B → GPIO 12
// Solenoid 3 (Dot 3) → M2A → GPIO 14
// Solenoid 4 (Dot 4) → M2B → GPIO 27
// Solenoid 5 (Dot 5) → M3A → GPIO 26
// Solenoid 6 (Dot 6) → M3B → GPIO 25
const int solenoidPins[6] = { 13, 12, 14, 27, 26, 25 };

// (Alternate Schematic from docs/hardware_setup.md Section 3.A:
//  const int solenoidPins[6] = { 15, 2, 4, 16, 17, 5 }; )

// ---------------------------------------------------------------------------------
// INPUT PINS: 6 Perkins Keyboard Buttons (Dots 1-6, Active LOW with internal pullups)
// ---------------------------------------------------------------------------------
// Note: Dot 6 is assigned to GPIO 15 (instead of GPIO 21) to prevent conflict
// with the I2C OLED Display SDA line on GPIO 21.
// Dot 1 → GPIO 32
// Dot 2 → GPIO 33
// Dot 3 → GPIO 5
// Dot 4 → GPIO 18
// Dot 5 → GPIO 19
// Dot 6 → GPIO 15
const int buttonPins[6] = { 32, 33, 5, 18, 19, 15 };

// (Alternate Schematic from docs/hardware_setup.md Section 3.A:
//  const int buttonPins[6] = { 13, 12, 14, 27, 26, 25 }; )

// ---------------------------------------------------------------------------------
// ACTION BUTTONS & FEEDBACK PINS
// ---------------------------------------------------------------------------------
const int PIN_SPACE     = 4;   // Space key (Active LOW)
const int PIN_BACKSPACE = 16;  // Backspace key (Active LOW)
const int PIN_ENTER     = 17;  // Enter / Submit key (Active LOW)
const int PIN_MODE_SW   = 35;  // Toggle WiFi vs BLE mode (Input only)
const int PIN_BUZZER    = 23;  // Piezo Buzzer audio output (PWM/Tone)

// OLED Display Config (I2C)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
bool hasDisplay = false;

// BLE Keyboard Name
BleKeyboard bleKeyboard("BrailleWise Keyboard", "BrailleWise Inc.", 100);

// Operating Mode: true = Wi-Fi Server/API Mode, false = BLE HID Mode
bool isWifiMode = true;

// =================================================================================
// 2. BRAILLE CHORD TRANSLATION TABLE (6-DOT)
// =================================================================================
struct BrailleMapping {
  uint8_t chordMask; // Bitmask: Bit 0=Dot1, Bit 1=Dot2, ..., Bit 5=Dot6
  char character;
};

const BrailleMapping BRAILLE_TABLE[] = {
  { 0b000001, 'a' }, { 0b000011, 'b' }, { 0b001001, 'c' }, { 0b011001, 'd' },
  { 0b010001, 'e' }, { 0b001011, 'f' }, { 0b011011, 'g' }, { 0b010011, 'h' },
  { 0b001010, 'i' }, { 0b011010, 'j' }, { 0b000101, 'k' }, { 0b000111, 'l' },
  { 0b001101, 'm' }, { 0b011101, 'n' }, { 0b010101, 'o' }, { 0b001111, 'p' },
  { 0b011111, 'q' }, { 0b010111, 'r' }, { 0b001110, 's' }, { 0b011110, 't' },
  { 0b100101, 'u' }, { 0b100111, 'v' }, { 0b011100, 'w' }, { 0b101101, 'x' },
  { 0b111101, 'y' }, { 0b100110, 'z' }
};
const size_t BRAILLE_TABLE_SIZE = sizeof(BRAILLE_TABLE) / sizeof(BRAILLE_TABLE[0]);

// Chording state tracking
uint8_t currentChordMask = 0;
bool isChording = false;

// =================================================================================
// 3. SOLENOID CONTROL FUNCTIONS
// =================================================================================
void allSolenoidsOff() {
  for (int i = 0; i < 6; i++) {
    digitalWrite(solenoidPins[i], LOW);
  }
}

void applySolenoidPattern(bool dots[6]) {
  for (int i = 0; i < 6; i++) {
    digitalWrite(solenoidPins[i], dots[i] ? HIGH : LOW);
  }
}

void playTone(int frequency, int durationMs) {
  tone(PIN_BUZZER, frequency, durationMs);
}

void updateDisplay(const char* title, const char* message) {
  if (!hasDisplay) return;
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(title);
  display.println("--------------------");
  display.setTextSize(2);
  display.setCursor(0, 24);
  display.println(message);
  display.display();
}

// =================================================================================
// 4. REST WEB SERVER HANDLERS (for incoming Flask / Web App calls)
// =================================================================================
void sendCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() {
  sendCorsHeaders();
  server.send(204, "text/plain", "");
}

void handleRoot() {
  sendCorsHeaders();
  String info = "{\"name\":\"BrailleWise ESP32\",\"status\":\"online\",\"ip\":\"" + WiFi.localIP().toString() + "\",\"endpoints\":[\"POST /set-pattern\",\"GET /read-buttons\"]}";
  server.send(200, "application/json", info);
}

void handleSetPattern() {
  sendCorsHeaders();

  // Retrieve request body with fallbacks for different Content-Types / args
  String body = "";
  if (server.hasArg("plain") && server.arg("plain").length() > 0) {
    body = server.arg("plain");
  } else if (server.hasArg("dots")) {
    body = server.arg("dots");
  } else if (server.hasArg("pattern")) {
    body = server.arg("pattern");
  } else if (server.args() > 0) {
    body = server.arg(0);
  }
  body.trim();

  Serial.println();
  Serial.println("================================");
  Serial.println("[HTTP] New Braille Pattern Received:");
  Serial.println(body);
  Serial.println("================================");

  // First turn all solenoids OFF
  allSolenoidsOff();

  bool dots[6] = { false, false, false, false, false, false };
  bool parsed = false;

  int start = body.indexOf('[');
  int end = (start != -1) ? body.indexOf(']', start) : -1;

  if (start != -1 && end != -1 && end > start) {
    // Array notation: e.g. [1, 0, 1, 0, 0, 1], [1, 4], ["1", "0", ...], or booleans
    String arrContent = body.substring(start + 1, end);
    arrContent.trim();

    int elements[6] = { 0 };
    int elementCount = 0;
    int cur = 0;

    while (cur <= arrContent.length() && elementCount < 6) {
      int nextComma = arrContent.indexOf(',', cur);
      String token;
      if (nextComma == -1) {
        token = arrContent.substring(cur);
        cur = arrContent.length() + 1;
      } else {
        token = arrContent.substring(cur, nextComma);
        cur = nextComma + 1;
      }
      token.trim();
      token.replace("\"", "");
      token.replace("'", "");

      if (token.length() > 0) {
        if (token == "1" || token.equalsIgnoreCase("true")) {
          elements[elementCount] = 1;
        } else if (token == "0" || token.equalsIgnoreCase("false")) {
          elements[elementCount] = 0;
        } else {
          elements[elementCount] = token.toInt();
        }
        elementCount++;
      }
    }

    if (elementCount == 6) {
      // 6-dot full binary mask: [d1, d2, d3, d4, d5, d6]
      for (int i = 0; i < 6; i++) {
        dots[i] = (elements[i] == 1);
      }
      parsed = true;
    } else if (elementCount > 0) {
      // List of active dot numbers: e.g. [1, 4] -> dots 1 and 4
      for (int i = 0; i < elementCount; i++) {
        int dotNum = elements[i];
        if (dotNum >= 1 && dotNum <= 6) {
          dots[dotNum - 1] = true;
        }
      }
      parsed = true;
    } else {
      // Empty array [] -> all solenoids remain off
      parsed = true;
    }
  } else {
    // Check if a character or letter was sent: {"character": "a"} or {"letter": "a"} or "a"
    char targetChar = '\0';
    int charIdx = body.indexOf("\"character\":");
    if (charIdx == -1) charIdx = body.indexOf("\"char\":");
    if (charIdx == -1) charIdx = body.indexOf("\"letter\":");

    if (charIdx != -1) {
      int valStart = body.indexOf('"', charIdx + 8);
      if (valStart != -1) {
        int valEnd = body.indexOf('"', valStart + 1);
        if (valEnd != -1 && valEnd > valStart) {
          String cStr = body.substring(valStart + 1, valEnd);
          cStr.trim();
          if (cStr.length() > 0) targetChar = tolower(cStr[0]);
        }
      }
    } else if (body.length() == 1 && isalpha(body[0])) {
      targetChar = tolower(body[0]);
    }

    if (targetChar >= 'a' && targetChar <= 'z') {
      for (size_t t = 0; t < BRAILLE_TABLE_SIZE; t++) {
        if (BRAILLE_TABLE[t].character == targetChar) {
          uint8_t mask = BRAILLE_TABLE[t].chordMask;
          for (int d = 0; d < 6; d++) {
            dots[d] = (mask & (1 << d)) != 0;
          }
          parsed = true;
          break;
        }
      }
    }
  }

  if (!parsed) {
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Invalid pattern JSON. Expected [d1..d6] or character\"}");
    return;
  }

  // Apply pattern to physical solenoids
  applySolenoidPattern(dots);
  for (int i = 0; i < 6; i++) {
    Serial.printf("  Solenoid %d (GPIO %d) -> %s\n", i + 1, solenoidPins[i], dots[i] ? "ON" : "OFF");
  }

  playTone(1000, 50);
  updateDisplay("Tactile Output", "Pattern Set");
  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void handleReadButtons() {
  sendCorsHeaders();
  String json = "{\"dots\":[";
  for (int i = 0; i < 6; i++) {
    bool isPressed = (digitalRead(buttonPins[i]) == LOW);
    json += isPressed ? "1" : "0";
    if (i < 5) json += ",";
  }
  json += "]}";

  server.send(200, "application/json", json);
}

// =================================================================================
// 5. BUTTON & CHORD PROCESSING LOGIC (Local Perkins Typing)
// =================================================================================
char decodeChord(uint8_t mask) {
  for (size_t i = 0; i < BRAILLE_TABLE_SIZE; i++) {
    if (BRAILLE_TABLE[i].chordMask == mask) {
      return BRAILLE_TABLE[i].character;
    }
  }
  return '\0';
}

void sendBackendApi(String character, uint8_t mask) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String endpoint = String(BACKEND_URL) + "/input";
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"character\":\"" + character + "\",\"dots_mask\":" + String(mask) + ",\"device_id\":\"esp32_braille_01\"}";
  int httpResponseCode = http.POST(jsonPayload);
  http.end();
}

void sendCharacter(char c) {
  if (isWifiMode) {
    sendBackendApi(String(c), currentChordMask);
  } else {
    if (bleKeyboard.isConnected()) {
      bleKeyboard.write(c);
    }
  }
}

void handleActionButtons() {
  if (digitalRead(PIN_SPACE) == LOW) {
    playTone(600, 50);
    sendCharacter(' ');
    updateDisplay("Action", "SPACE");
    delay(200);
  }
  else if (digitalRead(PIN_BACKSPACE) == LOW) {
    playTone(400, 50);
    if (isWifiMode) sendBackendApi("\b", 0);
    else if (bleKeyboard.isConnected()) bleKeyboard.write(KEY_BACKSPACE);
    updateDisplay("Action", "BACKSPACE");
    delay(200);
  }
  else if (digitalRead(PIN_ENTER) == LOW) {
    playTone(1200, 100);
    if (isWifiMode) sendBackendApi("\n", 0);
    else if (bleKeyboard.isConnected()) bleKeyboard.write(KEY_RETURN);
    updateDisplay("Action", "ENTER");
    delay(200);
  }
}

void handleChordingInput() {
  uint8_t currentTickMask = 0;

  for (int i = 0; i < 6; i++) {
    if (digitalRead(buttonPins[i]) == LOW) {
      currentTickMask |= (1 << i);
    }
  }

  if (currentTickMask > 0) {
    isChording = true;
    currentChordMask |= currentTickMask;
  } 
  else if (isChording) {
    char matchedChar = decodeChord(currentChordMask);

    if (matchedChar != '\0') {
      Serial.printf("[Chord] Mask: 0b%06b -> Char: '%c'\n", currentChordMask, matchedChar);
      playTone(900, 60);

      // Actuate solenoids to echo back typed letter
      for (int i = 0; i < 6; i++) {
        digitalWrite(solenoidPins[i], (currentChordMask & (1 << i)) ? HIGH : LOW);
      }
      sendCharacter(matchedChar);

      String statusMsg = "Char: '";
      statusMsg += matchedChar;
      statusMsg += "'";
      updateDisplay("Braille Input", statusMsg.c_str());
    } else {
      playTone(300, 150);
      updateDisplay("Braille Input", "Unknown");
    }

    currentChordMask = 0;
    isChording = false;
  }
}

// =================================================================================
// 6. SETUP & INITIALIZATION
// =================================================================================
void connectWifi() {
  Serial.printf("\n[Wi-Fi] Connecting to '%s'...\n", WIFI_SSID);
  updateDisplay("Wi-Fi Mode", "Connecting...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected!");
    Serial.print("[Wi-Fi] IP Address: http://");
    Serial.println(WiFi.localIP());
    updateDisplay("Wi-Fi Ready", WiFi.localIP().toString().c_str());

    // 1. Start mDNS Domain Name: http://braillewise.local
    if (MDNS.begin("braillewise")) {
      MDNS.addService("http", "tcp", 80);
      Serial.println("[mDNS] Device reachable at: http://braillewise.local");
    }

    // 2. Announce IP to Laptop Backend so user doesn't need to manually type IP
    HTTPClient http;
    String endpoint = String(BACKEND_URL) + "/input";
    if (http.begin(endpoint)) {
      http.addHeader("Content-Type", "application/json");
      String payload = "{\"device_id\":\"esp32_braille_01\",\"ip\":\"" + WiFi.localIP().toString() + "\",\"status\":\"online\"}";
      int code = http.POST(payload);
      if (code > 0) {
        Serial.printf("[Backend] Auto-registered IP with Laptop: %s (code %d)\n", WiFi.localIP().toString().c_str(), code);
      }
      http.end();
    }
  } else {
    Serial.println("\n[Wi-Fi] Connection failed. Running in offline hardware mode.");
    updateDisplay("Wi-Fi Status", "Offline Mode");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   BrailleWise ESP32 Smart Hardware Controller   ");
  Serial.println("=================================================");

  // Initialize Solenoids (OUTPUT, default LOW)
  for (int i = 0; i < 6; i++) {
    pinMode(solenoidPins[i], OUTPUT);
    digitalWrite(solenoidPins[i], LOW);
  }

  // Initialize Perkins Buttons (INPUT_PULLUP)
  for (int i = 0; i < 6; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }

  pinMode(PIN_SPACE, INPUT_PULLUP);
  pinMode(PIN_BACKSPACE, INPUT_PULLUP);
  pinMode(PIN_ENTER, INPUT_PULLUP);
  pinMode(PIN_MODE_SW, INPUT); // GPIO 35 is input-only (no internal pullup)
  pinMode(PIN_BUZZER, OUTPUT);

  // Initialize OLED Display
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    hasDisplay = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("BrailleWise System");
    display.println("Initializing...");
    display.display();
  }

  // Operating Mode: Default to Wi-Fi HTTP Server (or BLE if PIN_MODE_SW is pulled LOW)
  isWifiMode = (digitalRead(PIN_MODE_SW) != LOW);

  if (isWifiMode) {
    connectWifi();

    // Start Web Server Routes
    server.on("/", HTTP_GET, handleRoot);
    server.on("/set-pattern", HTTP_OPTIONS, handleOptions);
    server.on("/set-pattern", HTTP_POST, handleSetPattern);
    server.on("/read-buttons", HTTP_OPTIONS, handleOptions);
    server.on("/read-buttons", HTTP_GET, handleReadButtons);
    server.begin();
    Serial.println("[HTTP Server] REST API started on port 80");
  } else {
    Serial.println("[Mode] Starting BLE Keyboard Server...");
    bleKeyboard.begin();
    updateDisplay("BLE Mode", "Advertising...");
  }

  playTone(800, 150); // Welcome beep
}

// =================================================================================
// 7. MAIN LOOP
// =================================================================================
void loop() {
  if (isWifiMode) {
    server.handleClient();
  }

  // Process Action Buttons
  handleActionButtons();

  // Process Perkins Chords
  handleChordingInput();

  delay(10);
}
