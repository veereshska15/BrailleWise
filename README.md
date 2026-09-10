<div align="center">

# ⠃⠗⠁⠊⠇⠇⠑⠺⠊⠎⠑
# BrailleWise
### *Next-Generation Assistive Braille Learning & Tactile IoT Ecosystem*

[![Python 3.13+](https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask Backend](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![ESP32](https://img.shields.io/badge/ESP32-WROOM--32-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://espressif.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

**BrailleWise** is an intelligent, multi-modal assistive learning platform designed to empower visually impaired learners, educators, and enthusiasts. By bridging modern web technologies with physical IoT hardware, BrailleWise synchronizes real-time tactile solenoid actuation, physical Perkins-style keyboard chording, audio guidance, and adaptive analytics into a seamless educational experience.

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Hardware Specifications](#-hardware-specifications) • [Quickstart](#-quickstart-guide) • [REST API](#-rest-api-reference) • [Circuit Pinout](#-circuit-pinout--schematics)

</div>

---

## 🌟 Key Features

| Feature | Description |
| :--- | :--- |
| 🖐 **Tactile Solenoid Cell** | Real-time physical actuation of 6-dot Braille cells via electromagnetic solenoids / micro-servos for authentic haptic tactile touch. |
| ⌨️ **Perkins Chording Input** | 6-key multi-touch Perkins keyboard engine with debounce algorithms and chord-to-character bitmask decoding (Dots 1–6 + Space, Backspace, Enter). |
| 🌐 **Zero-Config mDNS (`braillewise.local`)** | Automatic local domain name resolution and auto-announcement handshake between the ESP32 and the laptop backend — no manual IP hunting required. |
| 📶 **Dual Operation Modes** | Seamlessly toggle between **Wi-Fi REST Mode** (interactive sync with web lessons) and **Bluetooth Low Energy (BLE)** (wireless HID keyboard). |
| 🎙 **Multi-Modal Audio Guidance** | Web Speech synthesis engine providing step-by-step spoken feedback, letter phonetics, and audio buzzer cues for tactile learners. |
| 📚 **Adaptive Learning Pathways** | Structured curriculum covering English Braille Alphabet, numbers, punctuation, contractions, and interactive practice challenges. |
| 📊 **Real-Time Analytics & Scoring** | MongoDB-backed performance tracking recording response times, accuracy percentages, mastery milestones, and error trends. |

---

## 🏗 System Architecture

BrailleWise employs a tripartite architecture linking the web interface, application services, and physical embedded controllers:

```text
  +-------------------------------------------------------------------------+
  |                          CLIENT TIER (React 19 + Vite)                   |
  |  - Interactive Lesson Player         - Perkins Virtual Keypad           |
  |  - Audio / Speech Guidance Engine     - Hardware Settings (mDNS Bridge)  |
  +------------------------------------+------------------------------------+
                                       |
                                       | HTTP REST / JSON (Port 5000)
                                       v
  +-------------------------------------------------------------------------+
  |                        BACKEND API TIER (Flask + Python 3.13)            |
  |  - Authentication & JWT Sessions     - Hardware Communication Proxy      |
  |  - Dynamic Lesson / Quiz Engine      - Braille Bitmask Translation       |
  |  - MongoDB Atlas Cloud Persistence   - Active Device Registry            |
  +------------------------------------+------------------------------------+
                                       |
                   +-------------------+-------------------+
                   | (Wi-Fi REST / mDNS)                   | (BLE HID Mode)
                   v                                       v
  +----------------------------------+   +----------------------------------+
  |     ESP32 REST WEB SERVER        |   |    BLUETOOTH LOW ENERGY (BLE)    |
  |  Host: http://braillewise.local  |   |    "BrailleWise Keyboard" HID    |
  |  Endpoints:                      |   |    - Types decoded chords        |
  |    - POST /set-pattern           |   |      directly into laptop input  |
  |    - GET  /read-buttons          |   |      fields as standard keyboard |
  +----------------+-----------------+   +----------------+-----------------+
                   |                                      |
                   +------------------+-------------------+
                                      |
                                      v
  +-------------------------------------------------------------------------+
  |                        PHYSICAL EMBEDDED HARDWARE                       |
  |  [6x Actuator Solenoids]   [6x Perkins Push Buttons]   [Action Keys]     |
  |  [Active Piezo Buzzer]     [SSD1306 0.96" OLED]        [Mode Switch]     |
  +-------------------------------------------------------------------------+
```

---

## 🔌 Hardware Specifications

### Bill of Materials (BOM)

* **Microcontroller**: ESP32 WROOM-32 Dev Module (Dual-core 240 MHz, Wi-Fi & BLE 4.2)
* **Tactile Actuators**: 6× 5V Push-Pull Solenoids or Linear Micro-Servos
* **Actuator Driver**: ULN2003 / Darlington Transistor Array or MOSFET Module (IRLZ44N)
* **Perkins Keys**: 6× Tactile Momentary Push Buttons (Dots 1–6, internal pull-ups)
* **System Keys**: 3× Push Buttons (Space, Backspace, Enter / Submit)
* **Mode Switch**: 1× SPST Toggle Switch (Wi-Fi Server vs. BLE Keyboard Mode)
* **Audio Feedback**: 1× Active Piezo Buzzer Module (PWM tone generation)
* **Visual Display**: *(Optional)* 0.96" I2C SSD1306 OLED Display ($128 \times 64$)
* **Power**: 5V 2A external DC power supply / USB connection

---

## ⚡ Circuit Pinout & Schematics

```text
                           +---------------------------------------+
                           |             ESP32 WROOM               |
                           +---------------------------------------+
   Dot 1 Push Button  ---> | GPIO 32 (In, Pullup)                  |
   Dot 2 Push Button  ---> | GPIO 33 (In, Pullup)                  |
   Dot 3 Push Button  ---> | GPIO 05 (In, Pullup)                  |
   Dot 4 Push Button  ---> | GPIO 18 (In, Pullup)                  |
   Dot 5 Push Button  ---> | GPIO 19 (In, Pullup)                  |
   Dot 6 Push Button  ---> | GPIO 15 (In, Pullup)                  |
                           |                                       |
   Space Action Key   ---> | GPIO 04 (In, Pullup)                  |
   Backspace Key      ---> | GPIO 16 (In, Pullup)                  |
   Enter / Submit Key ---> | GPIO 17 (In, Pullup)                  |
   Mode Toggle Switch ---> | GPIO 35 (Input Only)                  |
                           |                                       |
   Solenoid Dot 1 M1A <--- | GPIO 13 (Output)                      |
   Solenoid Dot 2 M1B <--- | GPIO 12 (Output)                      |
   Solenoid Dot 3 M2A <--- | GPIO 14 (Output)                      |
   Solenoid Dot 4 M2B <--- | GPIO 27 (Output)                      |
   Solenoid Dot 5 M3A <--- | GPIO 26 (Output)                      |
   Solenoid Dot 6 M3B <--- | GPIO 25 (Output)                      |
                           |                                       |
   Audio Buzzer Signal<--- | GPIO 23 (Output)                      |
   OLED Display SDA   <--- | GPIO 21 (I2C SDA)                     |
   OLED Display SCL   <--- | GPIO 22 (I2C SCL)                     |
                           +---------------------------------------+
```

> **Note on Pin Assignments**: Dot 6 button is mapped to **GPIO 15** to eliminate hardware resource contention with the I2C OLED display line on **GPIO 21 (SDA)**.

---

## 🚀 Quickstart Guide

### 1. Prerequisites

* **Python**: 3.10 to 3.13
* **Node.js**: 18+ and npm
* **Arduino CLI** or **Arduino IDE** (with ESP32 board core v3.x installed)
* **MongoDB**: Local MongoDB community instance or free MongoDB Atlas URI

---

### 2. Backend Setup

```bash
# Clone the repository
git clone https://github.com/veereshska15/BrailleWise.git
cd BrailleWise/backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (or copy template)
cp ../.env.example ../.env

# Launch the Flask API server
python app.py
```
Backend API will be live at: `http://127.0.0.1:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Frontend interface will be live at: `http://localhost:5173`

---

### 4. ESP32 Hardware Firmware Setup

1. Open `backend/hardware/esp32_braille_device/esp32_braille_device.ino` in Arduino IDE or compile via Arduino CLI.
2. Ensure the partition scheme is set to **Huge APP (3MB No OTA / 1MB SPIFFS)**:
   ```bash
   arduino-cli compile --fqbn esp32:esp32:esp32:PartitionScheme=huge_app backend/hardware/esp32_braille_device
   ```
3. Connect your ESP32 via USB and upload:
   ```bash
   arduino-cli upload -p COM5 --fqbn esp32:esp32:esp32:PartitionScheme=huge_app backend/hardware/esp32_braille_device
   ```
4. In your browser, navigate to [http://localhost:5173/settings](http://localhost:5173/settings) and click **Test Connection**.

---

## 📡 REST API Reference

### Hardware IoT Endpoints (`/api/hardware`)

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/hardware/esp32/set-pattern` | Actuate physical 6-dot solenoid cell | `{"dots": [1, 0, 1, 0, 0, 1], "ip": "braillewise.local"}` |
| `GET` | `/api/hardware/esp32/read-buttons` | Poll states of 6 physical Perkins keys | `?ip=braillewise.local` |
| `POST` | `/api/hardware/input` | Ingest stream from ESP32 chording engine | `{"device_id": "esp32_01", "character": "b", "dots_mask": 3}` |
| `GET` | `/api/hardware/pattern/<char>` | Get binary mask and dot indices for letter | *None* |
| `GET` | `/api/hardware/status` | Retrieve status of connected devices | *None* |

### Core Learning & Assessment Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student or educator profile |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token |
| `GET` | `/api/lessons` | Retrieve all structured Braille curriculum modules |
| `GET` | `/api/lessons/<id>` | Fetch step-by-step interactive lesson exercises |
| `POST` | `/api/assessments/submit` | Record quiz attempt, compute accuracy, and persist score |
| `GET` | `/api/dashboard/stats` | Aggregate user progress, streak days, and mastery badges |

---

## 📂 Repository Structure

```text
BrailleWise/
├── .env.example                     # Environment template configuration
├── .gitignore                       # Production git exclusion rules
├── README.md                        # Master project documentation
├── backend/
│   ├── app.py                       # Application factory & Blueprint loader
│   ├── config.py                    # MongoDB & JWT configuration
│   ├── requirements.txt             # Python package dependencies
│   ├── hardware/                    # Embedded microcode & schematics
│   │   ├── esp32_braille_device/    # Complete client, mDNS, & BLE firmware
│   │   ├── esp32_solenoid_server.ino# Lightweight REST server
│   │   └── pi_braille_keyboard.py   # Raspberry Pi USB HID controller
│   ├── models/                      # MongoDB schema & data abstractions
│   ├── routes/                      # REST API blueprints
│   └── services/                    # Business logic & translation layers
├── frontend/
│   ├── index.html                   # HTML entrypoint
│   ├── package.json                 # Node scripts & dependencies
│   ├── vite.config.js               # Vite bundler configuration
│   └── src/
│       ├── components/              # Reusable UI components
│       ├── pages/                   # Lesson Player, Quiz, Settings, Dashboard
│       └── utils/
│           └── hardwareBridge.js    # Direct React-to-ESP32 client bridge
└── docs/
    └── hardware_setup.md            # In-depth electronic wiring manual
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository (`git fork`).
2. Create your feature branch (`git checkout -b feature/BrailleEnhancement`).
3. Commit your changes (`git commit -m "Add new feature"`).
4. Push to the branch (`git push origin feature/BrailleEnhancement`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with ❤️ for accessible education and digital inclusion.</sub>
</div>
