from flask import Blueprint, request, jsonify
from services.hardware_service import (
    process_hardware_input,
    get_braille_cell_pattern,
    get_hardware_status,
    send_pattern_to_esp32,
    read_buttons_from_esp32
)

hardware_bp = Blueprint("hardware_bp", __name__, url_prefix="/api/hardware")


# ----------------------------------------------------------------------
# 1. RECEIVE HARDWARE INPUT STREAM
# ----------------------------------------------------------------------
@hardware_bp.route("/input", methods=["POST"])
def hardware_input():
    """
    POST /api/hardware/input

    Receive character or raw dot mask from ESP32 / Raspberry Pi hardware.

    Body:
    {
        "device_id": "esp32_01",
        "character": "a",
        "dots_mask": 1
    }
    """
    try:
        data = request.get_json(silent=True) or {}

        device_id = data.get("device_id", "default_device")
        character = data.get("character", "")
        dots_mask = data.get("dots_mask", 0)
        ip = data.get("ip") or request.remote_addr

        result = process_hardware_input(
            device_id,
            character,
            dots_mask,
            ip
        )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


# ----------------------------------------------------------------------
# 2. GET CELL PATTERN FOR A CHARACTER
# ----------------------------------------------------------------------
@hardware_bp.route("/pattern/<character>", methods=["GET"])
def cell_pattern(character):
    """
    GET /api/hardware/pattern/<character>

    Retrieve the 6-dot Braille pattern for a character.
    """
    try:
        result = get_braille_cell_pattern(character)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


# ----------------------------------------------------------------------
# 3. GET HARDWARE STATUS
# ----------------------------------------------------------------------
@hardware_bp.route("/status", methods=["GET"])
def status():
    """
    GET /api/hardware/status

    Check connected hardware status.
    """
    try:
        device_id = request.args.get("device_id")

        result = get_hardware_status(device_id)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


# ----------------------------------------------------------------------
# 4. SEND SOLENOID PATTERN TO ESP32
# ----------------------------------------------------------------------
@hardware_bp.route("/esp32/set-pattern", methods=["POST"])
def esp32_set_pattern():
    """
    POST /api/hardware/esp32/set-pattern

    Sends a 6-dot Braille pattern from Flask to ESP32.

    Body:
    {
        "dots": [1, 0, 1, 0, 0, 1]
    }

    ESP32 IP:
    10.92.41.10
    """
    try:
        data = request.get_json(silent=True) or {}

        # Your currently connected ESP32
        esp32_ip = data.get("ip", "10.92.41.10")

        # Six-dot binary pattern
        dots = data.get(
            "dots",
            [0, 0, 0, 0, 0, 0]
        )

        result = send_pattern_to_esp32(
            esp32_ip,
            dots
        )

        return jsonify(result), 200 if result.get("success") else 502

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400


# ----------------------------------------------------------------------
# 5. READ BUTTON STATES FROM ESP32
# ----------------------------------------------------------------------
@hardware_bp.route("/esp32/read-buttons", methods=["GET"])
def esp32_read_buttons():
    """
    GET /api/hardware/esp32/read-buttons

    Reads the six physical button states from ESP32.

    ESP32 IP:
    10.92.41.10
    """
    try:
        # Use the connected ESP32 by default
        esp32_ip = request.args.get(
            "ip",
            "10.92.41.10"
        )

        result = read_buttons_from_esp32(
            esp32_ip
        )

        return jsonify(result), 200 if result.get("success") else 502

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 400
