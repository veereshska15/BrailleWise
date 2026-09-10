#!/usr/bin/env python3
"""
BrailleWise Perkins Chording Keyboard Controller for Raspberry Pi
=================================================================
This script reads 9 physical push buttons connected to the Pi's GPIO pins:
- 6 Braille dot keys (Dots 1-6)
- Spacebar
- Backspace
- Enter

It handles chording: when multiple buttons are held down and then released, 
it decodes the combination to a letter/character and prints or types it.
"""

import time
import sys

try:
    from gpiozero import Button
except ImportError:
    print("Error: The 'gpiozero' library is required to run this script.")
    print("Please install it on your Raspberry Pi by running: pip install gpiozero")
    sys.exit(1)

# --- CONFIGURATION: GPIO PINS (BOARD/BCM NUMBERING) ---
# Each pin connects to one leg of the button; the other leg connects to Ground (GND).
PIN_MAPPINGS = {
    1: 17,          # Dot 1 -> GPIO 17 (Pin 11)
    2: 27,          # Dot 2 -> GPIO 27 (Pin 13)
    3: 22,          # Dot 3 -> GPIO 22 (Pin 15)
    4: 23,          # Dot 4 -> GPIO 23 (Pin 16)
    5: 24,          # Dot 5 -> GPIO 24 (Pin 18)
    6: 25,          # Dot 6 -> GPIO 25 (Pin 22)
    'space': 5,     # Space -> GPIO 5  (Pin 29)
    'backspace': 6, # Backspace -> GPIO 6 (Pin 31)
    'enter': 26     # Enter -> GPIO 26 (Pin 37)
}

# --- BRAILLE ALPHABET CHORD MAP ---
# Keys are sorted tuples of dots, values are the characters they represent
BRAILLE_ALPHABET = {
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

# USB HID Keycodes (if running in Keyboard Gadget mode)
HID_KEYCODES = {
    'a': 0x04, 'b': 0x05, 'c': 0x06, 'd': 0x07, 'e': 0x08, 'f': 0x09, 'g': 0x0a,
    'h': 0x0b, 'i': 0x0c, 'j': 0x0d, 'k': 0x0e, 'l': 0x0f, 'm': 0x10, 'n': 0x11,
    'o': 0x12, 'p': 0x13, 'q': 0x14, 'r': 0x15, 's': 0x16, 't': 0x17, 'u': 0x18,
    'v': 0x19, 'w': 0x1a, 'x': 0x1b, 'y': 0x1c, 'z': 0x1d,
    ' ': 0x2c, '\n': 0x28, '\b': 0x2a
}

class BrailleKeyboard:
    def __init__(self, use_hid=False):
        self.use_hid = use_hid
        self.buttons = {}
        
        # Initialize Buttons with pull-up resistors enabled (active low wiring)
        for label, pin in PIN_MAPPINGS.items():
            self.buttons[label] = Button(pin, pull_up=True)
            
        self.active_dots = set()
        self.chording = False
        print("Initialization completed.")
        if self.use_hid:
            print("Running in USB HID keyboard emulation mode (/dev/hidg0).")
        else:
            print("Running in terminal display mode (prints letters to screen).")

    def write_hid_report(self, keycode):
        """Sends USB HID keyboard press and release reports."""
        try:
            with open('/dev/hidg0', 'rb+', buffering=0) as hid_device:
                # Key press report: modifier (0), reserved (0), keycode, 0, 0, 0, 0, 0
                hid_device.write(bytes([0, 0, keycode, 0, 0, 0, 0, 0]))
                # Key release report: all zeros
                hid_device.write(bytes([0, 0, 0, 0, 0, 0, 0, 0]))
        except PermissionError:
            print("Permission Error: Cannot write to /dev/hidg0. Run script with sudo.")
        except FileNotFoundError:
            print("Error: /dev/hidg0 not found. Make sure USB Gadget mode is enabled in boot config.")

    def handle_keypress(self, char):
        """Handles keyboard output (print or USB HID)."""
        if self.use_hid:
            keycode = HID_KEYCODES.get(char)
            if keycode:
                self.write_hid_report(keycode)
        else:
            # Print representation to screen
            if char == '\n':
                print("[ENTER]")
            elif char == '\b':
                print("[BACKSPACE]")
            elif char == ' ':
                print("[SPACE]")
            else:
                print(char, end='', flush=True)

    def run(self):
        print("\nBrailleWise physical keyboard active! Press buttons to type...")
        print("Standard chording rules apply: Hold down dots and release them all to type.")
        
        while True:
            # 1. Check control keys (they react immediately, not chorded)
            if not self.buttons['space'].is_pressed:
                self.handle_keypress(' ')
                time.sleep(0.2) # Debounce/repeat limit
                continue
                
            if not self.buttons['backspace'].is_pressed:
                self.handle_keypress('\b')
                time.sleep(0.2)
                continue
                
            if not self.buttons['enter'].is_pressed:
                self.handle_keypress('\n')
                time.sleep(0.2)
                continue

            # 2. Check the 6 dot buttons
            pressed_this_tick = []
            for dot in range(1, 7):
                # active_low=True (pull_up=True): is_pressed is True when button connects to GND
                if self.buttons[dot].is_pressed:
                    pressed_this_tick.append(dot)

            if pressed_this_tick:
                # User is holding down keys
                self.chording = True
                for dot in pressed_this_tick:
                    self.active_dots.add(dot)
            elif self.chording:
                # User just released all keys -> Process the finished chord!
                chord_tuple = tuple(sorted(self.active_dots))
                letter = BRAILLE_ALPHABET.get(chord_tuple)
                
                if letter:
                    self.handle_keypress(letter)
                else:
                    # Inform user which dots they pressed if it is not mapped
                    if not self.use_hid:
                        print(f"\n[Unrecognized Chord: Dots {list(chord_tuple)}]")
                
                # Reset states
                self.active_dots.clear()
                self.chording = False

            # Keep CPU usage low
            time.sleep(0.01)

if __name__ == '__main__':
    # Defaulting to false for desktop logging. Turn to True if USB gadget is configured.
    enable_usb_hid = False
    if len(sys.argv) > 1 and sys.argv[1] == '--hid':
        enable_usb_hid = True
        
    kb = BrailleKeyboard(use_hid=enable_usb_hid)
    try:
        kb.run()
    except KeyboardInterrupt:
        print("\nExiting BrailleKeyboard...")
