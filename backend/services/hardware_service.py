"""
BrailleWise Hardware Service
=============================
Handles hardware input parsing, Braille chord translation validation,
and cell state generation for physical Braille displays.
"""
import os
import json
import urllib.request

BRAILLE_DOT_MAP = {
    (1,): 'a',
    (1, 2): 'b',
    (1, 4): 'c',
    (1, 4, 5): 'd',
    (1, 5): 'e',
    (1, 2, 4): 'f',
    (1, 2, 4, 5): 'g',
    (1, 2, 5): 'h',
    (2, 4): 'i',
    (2, 4, 5): 'j',
    (1, 3): 'k',
    (1, 2, 3): 'l',
    (1, 3, 4): 'm',
    (1, 3, 4, 5): 'n',
    (1, 3, 5): 'o',
    (1, 2, 3, 4): 'p',
    (1, 2, 3, 4, 5): 'q',
    (1, 2, 3, 5): 'r',
    (2, 3, 4): 's',
    (2, 3, 4, 5): 't',
    (1, 3, 6): 'u',
    (1, 2, 3, 6): 'v',
    (2, 4, 5, 6): 'w',
    (1, 3, 4, 6): 'x',
    (1, 3, 4, 5, 6): 'y',
    (1, 3, 5, 6): 'z'
}

REVERSE_BRAILLE_MAP = {v: k for k, v in BRAILLE_DOT_MAP.items()}

# In-memory hardware device states
ACTIVE_DEVICES = {}

def process_hardware_input(device_id: str, character: str, dots_mask: int = 0, ip: str = None):
    """
    Processes character or raw dot mask received from hardware.
    """
    device_data = {
        "status": "online",
        "last_char": character,
        "dots_mask": dots_mask
    }
    if ip:
        device_data["ip"] = ip
    ACTIVE_DEVICES[device_id] = device_data

    dots_list = []
    if dots_mask > 0:
        for bit in range(6):
            if (dots_mask & (1 << bit)):
                dots_list.append(bit + 1)
        dots_tuple = tuple(sorted(dots_list))
        translated_char = BRAILLE_DOT_MAP.get(dots_tuple, character)
    else:
        translated_char = character

    return {
        "success": True,
        "device_id": device_id,
        "input_character": character,
        "translated_character": translated_char,
        "dots": dots_list
    }

def get_braille_cell_pattern(character: str):
    """
    Converts a single character into a 6-dot Braille bitmask for tactile output hardware.
    """
    char_lower = character.lower()
    dots = REVERSE_BRAILLE_MAP.get(char_lower, ())
    
    dots_mask = 0
    for dot in dots:
        dots_mask |= (1 << (dot - 1))

    return {
        "success": True,
        "character": character,
        "dots": list(dots),
        "dots_mask": dots_mask,
        "binary_mask": bin(dots_mask)
    }

def get_hardware_status(device_id: str = None):
    """
    Returns active hardware status for connected devices.
    """
    if device_id:
        device_info = ACTIVE_DEVICES.get(device_id, {"status": "offline"})
        return {"success": True, "device": device_info}
    return {"success": True, "devices": ACTIVE_DEVICES}

def get_resolved_esp32_ip(provided_ip: str = None):
    """
    Returns the target ESP32 host/IP:
    1. If user provided a specific host/IP (and not empty / localhost / legacy placeholder), use it.
    2. Otherwise, prefer an auto-announced live IP from ACTIVE_DEVICES.
    3. Fall back to ESP32_HOST environment variable or "braillewise.local" (mDNS).
    """
    if provided_ip:
        cleaned = str(provided_ip).strip()
        if cleaned and cleaned not in ["10.92.41.10", "127.0.0.1", "localhost", ""]:
            return cleaned

    for dev_id, dev_info in ACTIVE_DEVICES.items():
        if dev_info.get("ip"):
            return dev_info["ip"]

    return os.getenv("ESP32_HOST", "braillewise.local")

def normalize_dots_pattern(dots):
    """
    Normalizes any dot representation into a standardized 6-element binary array:
    [Dot1, Dot2, Dot3, Dot4, Dot5, Dot6] where 1 = active, 0 = inactive.
    Supports:
    - 6-element binary list: [1, 0, 0, 1, 0, 0] -> [1, 0, 0, 1, 0, 0]
    - List of 1-indexed dot numbers: [1, 4] -> [1, 0, 0, 1, 0, 0]
    - Empty list [] -> [0, 0, 0, 0, 0, 0]
    """
    if not dots or not isinstance(dots, (list, tuple)):
        return [0, 0, 0, 0, 0, 0]

    # If it is already a 6-element list where all elements are 0 or 1
    if len(dots) == 6 and all(d in (0, 1, True, False) for d in dots):
        return [1 if d else 0 for d in dots]

    # Otherwise, treat as active dot numbers (1 to 6)
    arr = [0, 0, 0, 0, 0, 0]
    for d in dots:
        try:
            val = int(d)
            if 1 <= val <= 6:
                arr[val - 1] = 1
        except (ValueError, TypeError):
            pass
    return arr

def send_pattern_to_esp32(esp32_ip: str, dots: list):
    """
    Sends a standardized 6-element binary list (e.g. [1, 0, 1, 0, 0, 1]) to the ESP32 REST server.
    """
    target_ip = get_resolved_esp32_ip(esp32_ip)
    clean_dots = normalize_dots_pattern(dots)
    print(f"[BACKEND HARDWARE TRACE] Sending pattern to ESP32 | Target IP: {target_ip} | Clean Dots: {clean_dots}")
    url = f"http://{target_ip.replace('http://', '').rstrip('/')}/set-pattern"
    payload = json.dumps({"dots": clean_dots}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            print(f"[BACKEND HARDWARE TRACE] ESP32 Response: {resp_data}")
            return {
                "success": True,
                "status": "ok",
                "esp32_response": resp_data,
                "dots_sent": clean_dots,
                "target_host": target_ip
            }
    except Exception as e:
        # If mDNS failed and an announced IP is available, retry with it
        if target_ip == "braillewise.local":
            for dev_id, dev_info in ACTIVE_DEVICES.items():
                if dev_info.get("ip") and dev_info["ip"] != target_ip:
                    return send_pattern_to_esp32(dev_info["ip"], clean_dots)
        print(f"[BACKEND HARDWARE TRACE] ESP32 Request Failed: {e}")
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "message": str(e),
            "target_host": target_ip
        }

def test_hardware_gpio(esp32_ip: str, test_name: str):
    """
    Directly invokes dedicated hardware test (C: GPIO13+27, D: GPIO13+27+26, F: GPIO13+12+27)
    bypassing all A-Z mappings.
    """
    target_ip = get_resolved_esp32_ip(esp32_ip)
    print(f"[BACKEND HARDWARE TRACE] Running Direct Hardware Test: '{test_name}' on {target_ip}")
    url = f"http://{target_ip.replace('http://', '').rstrip('/')}/test-hardware?test={test_name.upper()}"
    req = urllib.request.Request(url, data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            return {
                "success": True,
                "status": "ok",
                "test": test_name.upper(),
                "esp32_response": resp_data,
                "target_host": target_ip
            }
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "test": test_name.upper(),
            "error": str(e),
            "target_host": target_ip
        }

def test_hardware_channel(esp32_ip: str, channel: int):
    """
    Directly activates an individual channel 1..6 for isolation testing.
    """
    target_ip = get_resolved_esp32_ip(esp32_ip)
    print(f"[BACKEND HARDWARE TRACE] Testing Individual Channel Dot {channel} on {target_ip}")
    url = f"http://{target_ip.replace('http://', '').rstrip('/')}/test-channel?ch={channel}"
    req = urllib.request.Request(url, data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            return {
                "success": True,
                "status": "ok",
                "channel": channel,
                "esp32_response": resp_data,
                "target_host": target_ip
            }
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "channel": channel,
            "error": str(e),
            "target_host": target_ip
        }

def test_solenoids_on_esp32(esp32_ip: str):
    """
    Sends a test request to ESP32 to pulse all 6 solenoids for 800ms.
    """
    target_ip = get_resolved_esp32_ip(esp32_ip)
    url = f"http://{target_ip.replace('http://', '').rstrip('/')}/test-solenoids"
    req = urllib.request.Request(url, data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            return {
                "success": True,
                "status": "ok",
                "esp32_response": resp_data,
                "target_host": target_ip
            }
    except Exception as e:
        # Fallback to sending [1, 1, 1, 1, 1, 1] via set-pattern
        return send_pattern_to_esp32(esp32_ip, [1, 1, 1, 1, 1, 1])

def read_buttons_from_esp32(esp32_ip: str):
    """
    Reads the 6 button states from the ESP32 REST server and maps them to Braille.
    """
    target_ip = get_resolved_esp32_ip(esp32_ip)
    url = f"http://{target_ip.replace('http://', '').rstrip('/')}/read-buttons"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            dots_raw = resp_data.get("dots", [])
            dots_pressed = [i + 1 for i, v in enumerate(dots_raw) if int(v) == 1]
            dots_tuple = tuple(sorted(dots_pressed))
            char = BRAILLE_DOT_MAP.get(dots_tuple, "")
            return {
                "success": True,
                "status": "ok",
                "dots": dots_raw,
                "dots_pressed": dots_pressed,
                "translated_character": char,
                "target_host": target_ip
            }
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "message": str(e),
            "target_host": target_ip
        }


