"""
BrailleWise ESP32 Bridge - Standalone Flask Server & Test Script
================================================================
A lightweight standalone Flask application to test sending Braille
patterns to the ESP32 Solenoid Server and reading button states.

Usage:
    python backend/hardware/test_esp32_bridge.py

Endpoints:
    POST /send-char        - Converts a letter (e.g. 'b') to 6 dots & sends to ESP32
    POST /send-pattern     - Directly sends a [1,0,0,0,0,0] array to ESP32
    GET  /read-buttons     - Polls button states from ESP32
"""

from flask import Flask, request, jsonify
import urllib.request
import json

app = Flask(__name__)

# Default IP address of your ESP32 (change to match your Serial Monitor output)
DEFAULT_ESP32_IP = "192.168.1.50"

# Standard 6-dot Braille alphabet dictionary
BRAILLE_MAP = {
    'a': [1, 0, 0, 0, 0, 0],
    'b': [1, 1, 0, 0, 0, 0],
    'c': [1, 0, 0, 1, 0, 0],
    'd': [1, 0, 0, 1, 1, 0],
    'e': [1, 0, 0, 0, 1, 0],
    'f': [1, 1, 0, 1, 0, 0],
    'g': [1, 1, 0, 1, 1, 0],
    'h': [1, 1, 0, 0, 1, 0],
    'i': [0, 1, 0, 1, 0, 0],
    'j': [0, 1, 0, 1, 1, 0],
    'k': [1, 0, 1, 0, 0, 0],
    'l': [1, 1, 1, 0, 0, 0],
    'm': [1, 0, 1, 1, 0, 0],
    'n': [1, 0, 1, 1, 1, 0],
    'o': [1, 0, 1, 0, 1, 0],
    'p': [1, 1, 1, 1, 0, 0],
    'q': [1, 1, 1, 1, 1, 0],
    'r': [1, 1, 1, 0, 1, 0],
    's': [0, 1, 1, 1, 0, 0],
    't': [0, 1, 1, 1, 1, 0],
    'u': [1, 0, 1, 0, 0, 1],
    'v': [1, 1, 1, 0, 0, 1],
    'w': [0, 1, 0, 1, 1, 1],
    'x': [1, 0, 1, 1, 0, 1],
    'y': [1, 0, 1, 1, 1, 1],
    'z': [1, 0, 1, 0, 1, 1],
    ' ': [0, 0, 0, 0, 0, 0]
}

def post_to_esp32(esp32_ip: str, dots: list):
    """Sends JSON array {"dots": [1,0,0,0,0,0]} to the ESP32."""
    url = f"http://{esp32_ip.replace('http://', '').rstrip('/')}/set-pattern"
    payload = json.dumps({"dots": dots}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=3) as response:
        return json.loads(response.read().decode("utf-8"))

def get_from_esp32(esp32_ip: str):
    """Fetches button states {"dots": [1,0,...]} from the ESP32."""
    url = f"http://{esp32_ip.replace('http://', '').rstrip('/')}/read-buttons"
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=3) as response:
        return json.loads(response.read().decode("utf-8"))

@app.route("/send-char", methods=["POST"])
def send_char():
    """
    POST /send-char
    Body: {"character": "b", "ip": "192.168.1.50"}
    """
    data = request.get_json(silent=True) or {}
    char = str(data.get("character", "a")).lower()
    esp32_ip = data.get("ip", DEFAULT_ESP32_IP)

    if char not in BRAILLE_MAP:
        return jsonify({"status": "error", "message": f"Character '{char}' not supported"}), 400

    dots = BRAILLE_MAP[char]

    try:
        esp32_resp = post_to_esp32(esp32_ip, dots)
        return jsonify({
            "status": "success",
            "character": char,
            "dots_sent": dots,
            "esp32_response": esp32_resp
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to connect to ESP32 at {esp32_ip}: {str(e)}"}), 502

@app.route("/send-pattern", methods=["POST"])
def send_pattern():
    """
    POST /send-pattern
    Body: {"dots": [1, 1, 0, 0, 0, 0], "ip": "192.168.1.50"}
    """
    data = request.get_json(silent=True) or {}
    dots = data.get("dots", [0, 0, 0, 0, 0, 0])
    esp32_ip = data.get("ip", DEFAULT_ESP32_IP)

    try:
        esp32_resp = post_to_esp32(esp32_ip, dots)
        return jsonify({
            "status": "success",
            "dots_sent": dots,
            "esp32_response": esp32_resp
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to connect to ESP32 at {esp32_ip}: {str(e)}"}), 502

@app.route("/read-buttons", methods=["GET"])
def read_buttons():
    """
    GET /read-buttons?ip=192.168.1.50
    """
    esp32_ip = request.args.get("ip", DEFAULT_ESP32_IP)
    try:
        esp32_resp = get_from_esp32(esp32_ip)
        return jsonify({
            "status": "success",
            "data": esp32_resp
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to read from ESP32 at {esp32_ip}: {str(e)}"}), 502

if __name__ == "__main__":
    print("\n" + "="*50)
    print(" BrailleWise ESP32 Bridge Server Running on http://localhost:5001")
    print("="*50 + "\n")
    app.run(host="0.0.0.0", port=5001, debug=True)
