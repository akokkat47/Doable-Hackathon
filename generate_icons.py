#!/usr/bin/env python3
"""
generate_icons.py
Creates placeholder PNG icons for the Chrome extension.
Run once: python generate_icons.py
Requires: pip install Pillow
"""
import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Install Pillow: pip install Pillow")
    raise SystemExit(1)

ICONS_DIR = os.path.join(os.path.dirname(__file__), "extension", "public", "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

SIZES = [16, 48, 128]
BG_COLOR    = (26, 26, 46)       # #1a1a2e
GRAD_START  = (167, 139, 250)    # #a78bfa (violet)
GRAD_END    = (96,  165, 250)    # #60a5fa (blue)

for size in SIZES:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rect background
    margin = max(1, size // 10)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=max(2, size // 6),
        fill=BG_COLOR,
    )

    # Letter "T" centred
    font_size = max(8, int(size * 0.55))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "T"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1]
    draw.text((tx, ty), text, font=font, fill=GRAD_START)

    out_path = os.path.join(ICONS_DIR, f"icon{size}.png")
    img.save(out_path)
    print(f"  ✓ {out_path}")

print("Icons generated successfully.")
