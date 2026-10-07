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
                     | GPIO 13 (Out) --> Solenoid 1 / Dot 1  |
                     | GPIO 12 (Out) --> Solenoid 2 / Dot 2  |
                     | GPIO 14 (Out) --> Solenoid 3 / Dot 3  |
                     | GPIO 27 (Out) --> Solenoid 4 / Dot 4  |
                     | GPIO 26 (Out) --> Solenoid 5 / Dot 5  |
                     | GPIO 25 (Out) --> Solenoid 6 / Dot 6  |
                     |                                       |
                     | GPIO 32 (In)  <-- Dot 1 Push Button   |
                     | GPIO 33 (In)  <-- Dot 2 Push Button   |
                     | GPIO 05 (In)  <-- Dot 3 Push Button   |
                     | GPIO 18 (In)  <-- Dot 4 Push Button   |
                     | GPIO 19 (In)  <-- Dot 5 Push Button   |
                     | GPIO 15 (In)  <-- Dot 6 Push Button   |
                     |                                       |
                     | GPIO 04 (In)  <-- Space Button        |
                     | GPIO 16 (In)  <-- Backspace Button    |
                     | GPIO 17 (In)  <-- Enter Button        |
                     | GPIO 35 (In)  <-- Mode Switch (WiFi/BLE)|
                     |                                       |
                     | GPIO 23 (Out) --> Buzzer Audio Output |
                     | GPIO 21 (SDA) --> OLED Display I2C SDA|
                     | GPIO 22 (SCL) --> OLED Display I2C SCL|
                     +---------------------------------------+
```

### B. Standalone Solenoid Web Server Mode (`esp32_solenoid_server.ino`)

```text
                     +-------------------------------------------------+
                     |             ESP32 REST Web Server               |
                     +-------------------------------------------------+
                     | GPIO 4  (Out) --> Solenoid 1 / M1A Driver       |
                     | GPIO 16 (Out) --> Solenoid 2 / M1B Driver       |
                     | GPIO 17 (Out) --> Solenoid 3 / M2A Driver       |
                     | GPIO 18 (Out) --> Solenoid 4 / M2B Driver       |
                     | GPIO 19 (Out) --> Solenoid 5 / M3A Driver       |
                     | GPIO 23 (Out) --> Solenoid 6 / M3B Driver       |
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

1. Open Arduino IDE, PlatformIO, or Arduino CLI.
2. Select your sketch:
   - For standalone solenoid / button Web Server: open [`backend/hardware/esp32_solenoid_server.ino`](file:///c:/Users/Administrator/Documents/braille%20git/BrailleWise/backend/hardware/esp32_solenoid_server.ino).
   - For full Perkins keyboard chording & BLE: open [`backend/hardware/esp32_braille_device.ino`](file:///c:/Users/Administrator/Documents/braille%20git/BrailleWise/backend/hardware/esp32_braille_device.ino).
3. Update `WIFI_SSID` and `WIFI_PASS` with your Wi-Fi credentials.
4. Select Board: **ESP32 Dev Module**, select the COM Port, and click **Upload**.

---

## 7. Safe Power Architecture & Solenoid Drive Requirements

### A. Critical Power Rules
1. **Never Power Solenoids Directly from ESP32 GPIO Pins:** ESP32 GPIO pins can only deliver ~12 mA to 20 mA at 3.3V, whereas a single micro-solenoid requires 250 mA to 500 mA. Direct connection will damage the ESP32 chip.
2. **Control Signals Only:** The ESP32 GPIO pins (13, 12, 14, 27, 26, 25) are logic-level control signals only.
3. **Dedicated Driver Stage:** Always use a driver stage (ULN2003 Darlington Transistor Array, discrete N-Channel MOSFETs, or dedicated motor driver) between ESP32 GPIOs and the solenoids.
4. **Appropriate External Power Supply:** Solenoids MUST be powered by a dedicated external regulated DC power supply with adequate current capacity.
5. **Common Ground Connection:** The negative terminal (GND) of the external power supply MUST be connected to the ESP32 GND pin to establish a common reference voltage for logic switching.
6. **Voltage Matching:** The external supply voltage MUST match the physical solenoid's specified voltage rating. Do NOT assume 5V is correct unless the solenoids are confirmed to be 5V rated. If the solenoids are 12V rated, an appropriate 12V supply must be used.
7. **Simultaneous Current Capacity:** The power supply must have enough current capacity to drive multiple solenoids simultaneously (e.g. letters D, G, Q which energize 3 to 5 solenoids at once).
8. **Isolation:** Never route the external solenoid supply voltage (+V) into any ESP32 GPIO pin.

### B. Safe Power Architecture Diagram

```text
ESP32 GPIO (3.3V Logic)
       │
       ▼
   Driver Input (IN1 - IN6)
       │
       ▼
ULN2003 / MOSFET Driver Stage
       │
       ▼
Solenoid Coils (Dot 1 - Dot 6)

External DC Power Supply:
   +V (5V or 12V DC) ─────────► Driver / Solenoid Power Input (COM / V+ / VM)
   GND ───────────────────────► Driver Module GND
   GND ───────────────────────► ESP32 GND (COMMON GROUND)
```

### C. Solenoid Power Rating Verification & Sizing Calculations

| Parameter | 5V Solenoids (Typical) | 12V Solenoids (Typical) |
| :--- | :--- | :--- |
| **Typical Solenoid Models** | JF-0530B (5V), ZYE1-0530 (5V), 5V Micro-push | JF-0530B (12V), ZYE1-0530 (12V) |
| **Coil Resistance ($R$)** | ~10 Ω – 15 Ω | ~40 Ω – 60 Ω |
| **Current per Solenoid ($I = V/R$)** | ~350 mA – 450 mA | ~250 mA – 300 mA |
| **Single Solenoid Power (Letter A)** | ~2 W | ~3.6 W |
| **2 Solenoids (Letter C: Dots 1, 4)** | ~700 mA – 900 mA | ~500 mA – 600 mA |
| **3 Solenoids (Letter D: Dots 1, 4, 5)** | ~1.05 A – 1.35 A | ~750 mA – 900 mA |
| **6 Solenoids (Test Solenoids / Full Cell)** | ~2.1 A – 2.7 A | ~1.5 A – 1.8 A |
| **Recommended External Supply** | **5V DC, 3A Regulated (min. 2.5A)** | **12V DC, 2.5A Regulated (min. 2A)** |

> **Note on Verification:** Inspect the label on the physical solenoid body or measure coil resistance with a multimeter across its two leads:
> - If coil resistance is **~10 Ω to 15 Ω**, it is a **5V solenoid** ($I \approx 400\text{ mA}$).
> - If coil resistance is **~40 Ω to 60 Ω**, it is a **12V solenoid** ($I \approx 250\text{ mA}$).
> - If coil resistance is **~120 Ω to 150 Ω**, it is a **24V solenoid** ($I \approx 180\text{ mA}$).


