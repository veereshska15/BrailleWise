# BrailleWise Hardware Integration Guide

This guide details the hardware implementations available for the **BrailleWise** assistive system, including ESP32 C++ firmware sketches, Raspberry Pi Python Perkins keyboard controller, component wiring schematics, and backend REST API endpoints.

---

## 1. Supported Hardware Platforms & ESP32 Modes

| Platform | Firmware File | Primary Use Case | Output Device Support |
| :--- | :--- | :--- | :--- |
| **ESP32 (Full Client & BLE)** | [`backend/hardware/esp32_braille_device.ino`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/esp32_braille_device.ino) | Perkins Keyboard Chording Input, BLE HID Keyboard, OLED Display, Buzzer, Auto Backend Sync | Solenoids, Vibration Motors, SSD1306 OLED, Buzzer |
| **ESP32 (Standalone Web Server)** | [`backend/hardware/esp32_solenoid_server.ino`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/esp32_solenoid_server.ino) | Direct REST API Server for Solenoid Pattern Actuation (`/set-pattern`) and Button State Polling (`/read-buttons`) | 6 Solenoids / Actuators, 6 Tactile Buttons |
| **Raspberry Pi** | [`backend/hardware/pi_braille_keyboard.py`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/pi_braille_keyboard.py) | USB HID Emulation Keyboard & Desktop Direct Terminal Interface | GPIO Push Buttons, USB HID (`/dev/hidg0`) |

---

## 2. Hardware Architecture & Components (BOM)

### Required Components for ESP32 Build:
1. **ESP32 Development Board** (NodeMCU-32S / ESP32 Dev Module)
2. **6 Push Buttons** (Tactile switches for Perkins Braille Dots 1–6)
3. **3 Push Buttons** (Space, Backspace, Enter/Submit)
4. **6 5V Push-Pull Solenoids or Linear Micro-Servos** (Tactile Braille Cell Pin Actuators)
5. **NPN Transistors / MOSFET Modules (ULN2003 / 2N2222 / IRLZ44N)** (Solenoid drive circuits)
6. **1 Active Buzzer Module** (Audio feedback for chord recognition & prompts)
7. **0.96" SSD1306 I2C OLED Display** (128x64 pixels - optional visual status)
8. **10kΩ Pull-Up Resistors** (Optional, internal ESP32 pull-ups enabled)
9. **5V 2A Power Supply / LiPo Battery Shield**

---

## 3. Circuit Schematics & Pinout Tables

### A. Full Perkins Client & BLE Mode (`esp32_braille_device.ino`)

```text
                     +---------------------------------------+
                     |             ESP32 WROOM               |
                     +---------------------------------------+
                     | GPIO 13 (In)  <-- Dot 1 Push Button    |
                     | GPIO 12 (In)  <-- Dot 2 Push Button    |
                     | GPIO 14 (In)  <-- Dot 3 Push Button    |
                     | GPIO 27 (In)  <-- Dot 4 Push Button    |
                     | GPIO 26 (In)  <-- Dot 5 Push Button    |
                     | GPIO 25 (In)  <-- Dot 6 Push Button    |
                     |                                       |
                     | GPIO 32 (In)  <-- Space Button         |
                     | GPIO 33 (In)  <-- Backspace Button     |
                     | GPIO 34 (In)  <-- Enter Button         |
                     | GPIO 35 (In)  <-- Mode Switch (WiFi/BLE)|
                     |                                       |
                     | GPIO 15 (Out) --> Solenoid Dot 1 Driver|
                     | GPIO 02 (Out) --> Solenoid Dot 2 Driver|
                     | GPIO 04 (Out) --> Solenoid Dot 3 Driver|
                     | GPIO 16 (Out) --> Solenoid Dot 4 Driver|
                     | GPIO 17 (Out) --> Solenoid Dot 5 Driver|
                     | GPIO 05 (Out) --> Solenoid Dot 6 Driver|
                     |                                       |
                     | GPIO 18 (Out) --> Buzzer Audio Output  |
                     | GPIO 21 (SDA) --> OLED Display I2C SDA |
                     | GPIO 22 (SCL) --> OLED Display I2C SCL |
                     +---------------------------------------+
```

### B. Standalone Solenoid Web Server Mode (`esp32_solenoid_server.ino`)

```text
                     +-------------------------------------------------+
                     |             ESP32 REST Web Server               |
                     +-------------------------------------------------+
                     | GPIO 13 (Out) --> Solenoid 1 / M1A Driver       |
                     | GPIO 12 (Out) --> Solenoid 2 / M1B Driver       |
                     | GPIO 14 (Out) --> Solenoid 3 / M2A Driver       |
                     | GPIO 27 (Out) --> Solenoid 4 / M2B Driver       |
                     | GPIO 26 (Out) --> Solenoid 5 / M3A Driver       |
                     | GPIO 25 (Out) --> Solenoid 6 / M3B Driver       |
                     |                                                 |
                     | GPIO 32 (In)  <-- Dot 1 Push Button (Pullup)    |
                     | GPIO 33 (In)  <-- Dot 2 Push Button (Pullup)    |
                     | GPIO 05 (In)  <-- Dot 3 Push Button (Pullup)    |
                     | GPIO 18 (In)  <-- Dot 4 Push Button (Pullup)    |
                     | GPIO 19 (In)  <-- Dot 5 Push Button (Pullup)    |
                     | GPIO 21 (In)  <-- Dot 6 Push Button (Pullup)    |
                     +-------------------------------------------------+
```

---

## 4. Hardware Files Location

- **ESP32 Firmware (Full Client & BLE)**: [`backend/hardware/esp32_braille_device.ino`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/esp32_braille_device.ino)
- **ESP32 Firmware (REST Web Server)**: [`backend/hardware/esp32_solenoid_server.ino`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/esp32_solenoid_server.ino)
- **Raspberry Pi Controller**: [`backend/hardware/pi_braille_keyboard.py`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/pi_braille_keyboard.py)
- **Backend Service**: [`backend/services/hardware_service.py`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/services/hardware_service.py)
- **API Endpoint Blueprint**: [`backend/routes/hardware_routes.py`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/routes/hardware_routes.py)

---

## 5. REST API Specifications

### 1. ESP32 Direct REST API (when running `esp32_solenoid_server.ino`)

- **Actuate Solenoid Pins**: `POST http://<ESP32_IP>/set-pattern`
  ```json
  {
    "dots": [1, 0, 1, 0, 0, 1]
  }
  ```
  *Response*: `{"status":"ok"}`

- **Read Push Button States**: `GET http://<ESP32_IP>/read-buttons`
  *Response*: `{"dots":[1,0,0,0,0,0]}`

### 2. Flask Backend API Endpoints

- **Forward Pattern to ESP32**: `POST /api/hardware/esp32/set-pattern`
  ```json
  {
    "ip": "192.168.1.50",
    "dots": [1, 0, 1, 0, 0, 1]
  }
  ```

- **Poll ESP32 Buttons via Backend**: `GET /api/hardware/esp32/read-buttons?ip=192.168.1.50`
  ```json
  {
    "success": true,
    "dots": ["1", "0", "0", "0", "0", "0"],
    "dots_pressed": [1],
    "translated_character": "a"
  }
  ```

- **Hardware Input Stream (Client Mode)**: `POST /api/hardware/input`
  ```json
  {
    "device_id": "esp32_braille_01",
    "character": "a",
    "dots_mask": 1
  }
  ```

- **Braille Tactile Cell Pattern Query**: `GET /api/hardware/pattern/<character>`
  ```json
  {
    "success": true,
    "character": "b",
    "dots": [1, 2],
    "dots_mask": 3,
    "binary_mask": "0b11"
  }
  ```

- **Device Status Monitor**: `GET /api/hardware/status`

---

## 6. How to Flash ESP32 Firmware

1. Open Arduino IDE or PlatformIO.
2. Select your sketch:
   - For standalone solenoid / button Web Server: open [`backend/hardware/esp32_solenoid_server.ino`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/esp32_solenoid_server.ino).
   - For full Perkins keyboard chording & BLE: open [`backend/hardware/esp32_braille_device.ino`](file:///c:/Users/Administrator/Documents/BrailleWise_version3-main/BrailleWise_version3-main/backend/hardware/esp32_braille_device.ino).
3. Update `WIFI_SSID` and `WIFI_PASS` with your Wi-Fi credentials.
4. Select Board: **ESP32 Dev Module**, select the COM Port, and click **Upload**.

