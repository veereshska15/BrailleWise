#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ESPmDNS.h>

WebServer server(80);

// Wi-Fi Credentials - Configured for BrailleWise hardware network
const char* WIFI_SSID = ".";
const char* WIFI_PASS = "12345677";

// Backend API URL for auto-announcing IP
const char* BACKEND_URL = "http://172.27.81.38:5000/api/hardware";

// =====================================================
// SIX SOLENOIDS (Tactile Braille Cell Output)
// =====================================================
// Solenoid 1 / M1A = GPIO 15 (ESP32 D15)
// Solenoid 2 / M1B = GPIO 2  (ESP32 D2)
// Solenoid 3 / M2A = GPIO 4  (ESP32 D4)
// Solenoid 4 / M2B = GPIO 18 (ESP32 D18)
// Solenoid 5 / M3A = GPIO 19 (ESP32 D19)
// Solenoid 6 / M3B = GPIO 23 (ESP32 D23)

const int solenoidPins[6] = { 15, 2, 4, 18, 19, 23 };

// Coil Protection Watchdog
unsigned long solenoidActiveStartTime = 0;
const unsigned long SOLENOID_SAFETY_MAX_MS = 2500; // Auto-release after 2.5s to prevent overheating
bool anySolenoidActive = false;

// =====================================================
// CORS HELPER
// =====================================================
void sendCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() {
  sendCorsHeaders();
  server.send(204);
}

// =====================================================
// TURN ALL SOLENOIDS OFF
// =====================================================
void allSolenoidsOff() {
  for (int i = 0; i < 6; i++) {
    digitalWrite(solenoidPins[i], LOW);
  }
  anySolenoidActive = false;
  solenoidActiveStartTime = 0;
}

// =====================================================
// LOG GPIO STATES (Both section 9 and diagnostic formats)
// =====================================================
void logGpioStates(const int dots[6]) {
  int activeCount = 0;
  for (int i = 0; i < 6; i++) {
    if (dots[i]) activeCount++;
  }

  Serial.println();
  Serial.println("[ESP32]");
  Serial.printf("Pattern: [%d, %d, %d, %d, %d, %d]\n", dots[0], dots[1], dots[2], dots[3], dots[4], dots[5]);
  Serial.printf("Active solenoids: %d\n", activeCount);
  Serial.printf("GPIO15: %s\n", dots[0] ? "HIGH" : "LOW");
  Serial.printf("GPIO2: %s\n", dots[1] ? "HIGH" : "LOW");
  Serial.printf("GPIO4: %s\n", dots[2] ? "HIGH" : "LOW");
  Serial.printf("GPIO18: %s\n", dots[3] ? "HIGH" : "LOW");
  Serial.printf("GPIO19: %s\n", dots[4] ? "HIGH" : "LOW");
  Serial.printf("GPIO23: %s\n", dots[5] ? "HIGH" : "LOW");

  Serial.printf("GPIO15 = %s\n", dots[0] ? "HIGH" : "LOW");
  Serial.printf("GPIO2 = %s\n", dots[1] ? "HIGH" : "LOW");
  Serial.printf("GPIO4 = %s\n", dots[2] ? "HIGH" : "LOW");
  Serial.printf("GPIO18 = %s\n", dots[3] ? "HIGH" : "LOW");
  Serial.printf("GPIO19 = %s\n", dots[4] ? "HIGH" : "LOW");
  Serial.printf("GPIO23 = %s\n", dots[5] ? "HIGH" : "LOW");

  Serial.printf("15=%s\n", dots[0] ? "HIGH" : "LOW");
  Serial.printf("2=%s\n", dots[1] ? "HIGH" : "LOW");
  Serial.printf("4=%s\n", dots[2] ? "HIGH" : "LOW");
  Serial.printf("18=%s\n", dots[3] ? "HIGH" : "LOW");
  Serial.printf("19=%s\n", dots[4] ? "HIGH" : "LOW");
  Serial.printf("23=%s\n", dots[5] ? "HIGH" : "LOW");
}

// =====================================================
// SET BRAILLE PATTERN
// =====================================================
void handleSetPattern() {
  sendCorsHeaders();

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
  Serial.println("==================================================");
  Serial.println("[ESP32] Received raw HTTP body:");
  Serial.println(body);
  Serial.println("==================================================");

  // Turn all solenoids OFF first
  allSolenoidsOff();

  int start = body.indexOf('[');
  int end = (start != -1) ? body.indexOf(']', start) : -1;

  if (start == -1 || end == -1 || end <= start) {
    server.send(
      400,
      "application/json",
      "{\"status\":\"error\",\"message\":\"Invalid pattern JSON. Expected [d1..d6]\"}"
    );
    return;
  }

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

  int finalDots[6] = { 0, 0, 0, 0, 0, 0 };

  if (elementCount == 6) {
    for (int i = 0; i < 6; i++) {
      finalDots[i] = (elements[i] == 1) ? 1 : 0;
    }
  } else if (elementCount > 0) {
    for (int i = 0; i < elementCount; i++) {
      int dotNum = elements[i];
      if (dotNum >= 1 && dotNum <= 6) {
        finalDots[dotNum - 1] = 1;
      }
    }
  }

  Serial.printf("[ESP32] Parsed six values: [%d, %d, %d, %d, %d, %d]\n",
    finalDots[0], finalDots[1], finalDots[2], finalDots[3], finalDots[4], finalDots[5]);

  // Set every required GPIO simultaneously without delay() between individual writes
  for (int i = 0; i < 6; i++) {
    digitalWrite(solenoidPins[i], finalDots[i] ? HIGH : LOW);
  }

  anySolenoidActive = (finalDots[0] || finalDots[1] || finalDots[2] || finalDots[3] || finalDots[4] || finalDots[5]);
  if (anySolenoidActive) {
    solenoidActiveStartTime = millis();
  }

  logGpioStates(finalDots);

  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

// =====================================================
// DEDICATED HARDWARE GPIO TESTS (Bypasses A-Z mappings)
// =====================================================
// Test 1 (C): GPIO15 + GPIO18 for 1000ms
// Test 2 (D): GPIO15 + GPIO18 + GPIO19 for 1000ms
// Test 3 (F): GPIO15 + GPIO2 + GPIO18 for 1000ms
// =====================================================
void runHardwareTest(char testId) {
  // Before every test: turn all solenoids OFF
  allSolenoidsOff();
  delay(50);

  if (testId == 'C' || testId == 'c') {
    Serial.println();
    Serial.println("TEST C HARDWARE");
    Serial.println("GPIO15 HIGH");
    Serial.println("GPIO18 HIGH");

    // Set required GPIO HIGH without delay() between writes
    digitalWrite(15, HIGH);
    digitalWrite(18, HIGH);

    delay(1000);

    // Turn every GPIO LOW
    allSolenoidsOff();
    Serial.println("TEST C COMPLETE - ALL LOW");
  } 
  else if (testId == 'D' || testId == 'd') {
    Serial.println();
    Serial.println("TEST D HARDWARE");
    Serial.println("GPIO15 HIGH");
    Serial.println("GPIO18 HIGH");
    Serial.println("GPIO19 HIGH");

    // Set required GPIO HIGH without delay() between writes
    digitalWrite(15, HIGH);
    digitalWrite(18, HIGH);
    digitalWrite(19, HIGH);

    delay(1000);

    // Turn every GPIO LOW
    allSolenoidsOff();
    Serial.println("TEST D COMPLETE - ALL LOW");
  } 
  else if (testId == 'F' || testId == 'f') {
    Serial.println();
    Serial.println("TEST F HARDWARE");
    Serial.println("GPIO15 HIGH");
    Serial.println("GPIO2 HIGH");
    Serial.println("GPIO18 HIGH");

    // Set required GPIO HIGH without delay() between writes
    digitalWrite(15, HIGH);
    digitalWrite(2, HIGH);
    digitalWrite(18, HIGH);

    delay(1000);

    // Turn every GPIO LOW
    allSolenoidsOff();
    Serial.println("TEST F COMPLETE - ALL LOW");
  }
}

void handleHardwareTest() {
  sendCorsHeaders();
  String testArg = "C";
  if (server.hasArg("test")) {
    testArg = server.arg("test");
  } else if (server.hasArg("plain")) {
    String p = server.arg("plain");
    if (p.indexOf("\"test\":\"D\"") != -1 || p.indexOf("\"test\": \"D\"") != -1) testArg = "D";
    else if (p.indexOf("\"test\":\"F\"") != -1 || p.indexOf("\"test\": \"F\"") != -1) testArg = "F";
    else testArg = "C";
  }

  char t = testArg.charAt(0);
  runHardwareTest(t);

  String resp = "{\"status\":\"ok\",\"test\":\"" + String(t) + "\",\"duration_ms\":1000}";
  server.send(200, "application/json", resp);
}

// =====================================================
// INDIVIDUAL CHANNEL ISOLATION TEST (1..6)
// Driver channel labels: M1A, M1B, M2A, M2B, M3A, M3B
// =====================================================
void handleTestChannel() {
  sendCorsHeaders();
  int ch = 1;
  if (server.hasArg("ch")) {
    ch = server.arg("ch").toInt();
  } else if (server.hasArg("plain")) {
    String body = server.arg("plain");
    int idx = body.indexOf("\"ch\"");
    if (idx != -1) {
      int colon = body.indexOf(':', idx);
      if (colon != -1) {
        String val = body.substring(colon + 1);
        val.trim();
        ch = val.toInt();
      }
    }
  }
  if (ch < 1 || ch > 6) ch = 1;

  // Driver channel label lookup
  const char* driverChannels[6] = { "M1A", "M1B", "M2A", "M2B", "M3A", "M3B" };

  allSolenoidsOff();
  delay(50);

  int pin = solenoidPins[ch - 1];
  const char* drv = driverChannels[ch - 1];

  Serial.println();
  Serial.println("==================================================");
  Serial.println("[CHANNEL TEST]");
  Serial.printf("Commanded GPIO: %d\n", pin);
  Serial.printf("Expected driver channel: %s\n", drv);
  Serial.printf("Expected solenoid: %d\n", ch);
  Serial.println("GPIO state: HIGH");

  digitalWrite(pin, HIGH);
  delay(800);
  digitalWrite(pin, LOW);

  Serial.println("GPIO LOW");
  Serial.printf("[CHANNEL TEST DONE] GPIO%d / %s / Solenoid %d\n", pin, drv, ch);
  Serial.println("==================================================");

  String resp = "{\"status\":\"ok\",\"channel\":" + String(ch) + ",\"pin\":" + String(pin) + ",\"driver\":\"" + String(drv) + "\",\"duration_ms\":800}";
  server.send(200, "application/json", resp);
}

// =====================================================
// TEST SOLENOIDS (All 6 simultaneously for 800ms)
// =====================================================
void handleTestSolenoids() {
  sendCorsHeaders();
  Serial.println();
  Serial.println("==================================================");
  Serial.println("[TEST] Testing ALL 6 Solenoids simultaneously (800ms)");
  Serial.println("==================================================");

  allSolenoidsOff();
  delay(50);

  for (int i = 0; i < 6; i++) {
    digitalWrite(solenoidPins[i], HIGH);
    Serial.printf("Solenoid %d (GPIO %d) -> HIGH\n", i + 1, solenoidPins[i]);
  }

  delay(800);

  allSolenoidsOff();

  Serial.println("[TEST] Solenoids test complete. All OFF.");
  server.send(200, "application/json", "{\"status\":\"ok\",\"tested\":6,\"duration_ms\":800}");
}

// =====================================================
// READ BUTTON STATES (Dedicated Solenoid Server)
// =====================================================
void handleReadButtons() {
  sendCorsHeaders();
  server.send(200, "application/json", "{\"dots\":[0,0,0,0,0,0]}");
}

// =====================================================
// ROOT STATUS ENDPOINT
// =====================================================
void handleRoot() {
  sendCorsHeaders();
  String info = "{\"name\":\"BrailleWise ESP32\",\"status\":\"online\",\"ip\":\"" + WiFi.localIP().toString() + "\",\"endpoints\":[\"POST /set-pattern\",\"GET /read-buttons\",\"POST /test-solenoids\",\"POST /test-hardware\",\"POST /test-channel\"]}";
  server.send(200, "application/json", info);
}

// =====================================================
// WIFI + SERVER SETUP
// =====================================================
void setup() {
  Serial.begin(115200);

  Serial.println();
  Serial.println("==================================================");
  Serial.println("BRAILLEWISE ESP32");
  Serial.println("Solenoid GPIO Mapping:");
  Serial.println("Dot 1 = GPIO15");
  Serial.println("Dot 2 = GPIO2");
  Serial.println("Dot 3 = GPIO4");
  Serial.println("Dot 4 = GPIO18");
  Serial.println("Dot 5 = GPIO19");
  Serial.println("Dot 6 = GPIO23");
  Serial.println("==================================================");

  // Configure six solenoid pins
  for (int i = 0; i < 6; i++) {
    pinMode(solenoidPins[i], OUTPUT);
    digitalWrite(solenoidPins[i], LOW);
  }

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("Wi-Fi connected!");
    Serial.print("ESP32 IP Address: http://");
    Serial.println(WiFi.localIP());

    // Start mDNS Domain Name: http://braillewise.local
    if (MDNS.begin("braillewise")) {
      MDNS.addService("http", "tcp", 80);
      Serial.println("[mDNS] Device reachable at: http://braillewise.local");
    }

    // Auto-announce IP to Laptop Backend
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
    Serial.println();
    Serial.println("Wi-Fi connection failed. Running offline.");
  }

  // API Routes
  server.on("/", HTTP_GET, handleRoot);
  server.on("/set-pattern", HTTP_OPTIONS, handleOptions);
  server.on("/set-pattern", HTTP_POST, handleSetPattern);
  server.on("/test-solenoids", HTTP_OPTIONS, handleOptions);
  server.on("/test-solenoids", HTTP_GET, handleTestSolenoids);
  server.on("/test-solenoids", HTTP_POST, handleTestSolenoids);
  server.on("/test-hardware", HTTP_OPTIONS, handleOptions);
  server.on("/test-hardware", HTTP_GET, handleHardwareTest);
  server.on("/test-hardware", HTTP_POST, handleHardwareTest);
  server.on("/test-channel", HTTP_OPTIONS, handleOptions);
  server.on("/test-channel", HTTP_GET, handleTestChannel);
  server.on("/test-channel", HTTP_POST, handleTestChannel);
  server.on("/read-buttons", HTTP_OPTIONS, handleOptions);
  server.on("/read-buttons", HTTP_GET, handleReadButtons);

  // Start server
  server.begin();
  Serial.println("Web server started on port 80.");
  Serial.println("Ready for Braille patterns & hardware tests.");
}

// =====================================================
// LOOP
// =====================================================
void loop() {
  server.handleClient();

  // Coil protection auto-release watchdog
  if (anySolenoidActive && (millis() - solenoidActiveStartTime >= SOLENOID_SAFETY_MAX_MS)) {
    allSolenoidsOff();
    Serial.println("[Safety] Solenoids auto-released after 2.5s (coils protected).");
  }
}
