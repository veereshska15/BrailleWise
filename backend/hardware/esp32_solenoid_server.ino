#include <WiFi.h>
#include <WebServer.h>

WebServer server(80);

// Wi-Fi Credentials - Replace with your network credentials
const char* WIFI_SSID = "your-ssid";
const char* WIFI_PASS = "your-password";

// =====================================================
// SIX SOLENOIDS (Tactile Braille Cell Output)
// =====================================================
// Solenoid 1 → M1A → D13
// Solenoid 2 → M1B → D12
// Solenoid 3 → M2A → D14
// Solenoid 4 → M2B → D27
// Solenoid 5 → M3A → D26
// Solenoid 6 → M3B → D25

int solenoidPins[6] = {
  13, 12, 14, 27, 26, 25
};

// Input Pins: 6 Push Buttons (Perkins Keyboard layout)
int buttonPins[6] = {
  32, 33, 5, 18, 19, 21
};

// =====================================================
// CORS HELPER (Allows browser & frontend direct fetch)
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
}

// =====================================================
// SET BRAILLE PATTERN
// =====================================================
//
// Flask sends:
//
// {"dots":[1,0,0,0,0,0]}
//
// 1 = raise solenoid
// 0 = keep solenoid down
//
// Example B:
//
// {"dots":[1,1,0,0,0,0]}
//
// → Solenoid 1 ON
// → Solenoid 2 ON
//
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
  Serial.println("================================");
  Serial.println("New Braille pattern received");
  Serial.println(body);
  Serial.println("================================");

  // First turn everything OFF
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

  if (elementCount == 6) {
    for (int i = 0; i < 6; i++) {
      if (elements[i] == 1) {
        digitalWrite(solenoidPins[i], HIGH);
        Serial.printf("Solenoid %d -> ON\n", i + 1);
      } else {
        digitalWrite(solenoidPins[i], LOW);
        Serial.printf("Solenoid %d -> OFF\n", i + 1);
      }
    }
  } else if (elementCount > 0) {
    for (int i = 0; i < elementCount; i++) {
      int dotNum = elements[i];
      if (dotNum >= 1 && dotNum <= 6) {
        digitalWrite(solenoidPins[dotNum - 1], HIGH);
        Serial.printf("Solenoid %d -> ON\n", dotNum);
      }
    }
  }

  server.send(
    200,
    "application/json",
    "{\"status\":\"ok\"}"
  );
}

// =====================================================
// READ BUTTON STATES (Optional Perkins input polling)
// =====================================================
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

// =====================================================
// ROOT STATUS ENDPOINT
// =====================================================
void handleRoot() {
  sendCorsHeaders();
  String info = "{\"name\":\"BrailleWise ESP32\",\"status\":\"online\",\"endpoints\":[\"POST /set-pattern\",\"GET /read-buttons\"]}";
  server.send(200, "application/json", info);
}

// =====================================================
// WIFI + SERVER SETUP
// =====================================================
void setup() {
  Serial.begin(115200);

  Serial.println();
  Serial.println("================================");
  Serial.println("BrailleWise ESP32 Solenoid Server");
  Serial.println("================================");

  // ---------------------------------------------
  // Configure six solenoid pins
  // ---------------------------------------------
  for (int i = 0; i < 6; i++) {
    pinMode(
      solenoidPins[i],
      OUTPUT
    );
    digitalWrite(
      solenoidPins[i],
      LOW
    );
  }

  // ---------------------------------------------
  // Configure six button pins (Pull-Up)
  // ---------------------------------------------
  for (int i = 0; i < 6; i++) {
    pinMode(
      buttonPins[i],
      INPUT_PULLUP
    );
  }

  // ---------------------------------------------
  // Connect to Wi-Fi
  // ---------------------------------------------
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(
    WIFI_SSID,
    WIFI_PASS
  );

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi connected!");
  Serial.print("ESP32 IP Address: http://");
  Serial.println(
    WiFi.localIP()
  );

  // ---------------------------------------------
  // API Routes
  // ---------------------------------------------
  server.on("/", HTTP_GET, handleRoot);
  server.on("/set-pattern", HTTP_OPTIONS, handleOptions);
  server.on("/set-pattern", HTTP_POST, handleSetPattern);
  server.on("/read-buttons", HTTP_OPTIONS, handleOptions);
  server.on("/read-buttons", HTTP_GET, handleReadButtons);

  // ---------------------------------------------
  // Start server
  // ---------------------------------------------
  server.begin();
  Serial.println("Web server started on port 80.");
  Serial.println("Waiting for Braille patterns...");
}

// =====================================================
// LOOP
// =====================================================
void loop() {
  server.handleClient();
}
