#!/usr/bin/env python3
"""
split_into_quadrant_spritesheet.py

Loads an input image, splits it into 4 equal quadrants,
and arranges them clockwise (top-left → top-right → bottom-right → bottom-left)
into a single horizontal sprite sheet.
The output directory is hard-coded; the output filename is based on the input.
"""

import os
from PIL import Image

# ─── Configuration ─────────────────────────────────────────────────────────────

# Path to the source image you want to split
INPUT_IMAGE = "C:/Users/mmulq/Downloads/boldjumper.png"

# Hard-coded output directory (must already exist)
OUTPUT_DIR = "C:/Users/mmulq/Projects/inat-battle-images"

# ─── End Configuration ─────────────────────────────────────────────────────────

def split_and_pack(input_path: str, output_dir: str) -> None:
    # derive base name and build output path
    base, ext = os.path.splitext(os.path.basename(input_path))
    out_name = f"{base}_quadrants_spritesheet.png"
    output_path = os.path.join(output_dir, out_name)

    # Load source image
    img = Image.open(input_path)
    w, h = img.size

    # Verify we can split evenly
    if w % 2 != 0 or h % 2 != 0:
        raise ValueError("Image dimensions must be even to split into quadrants.")

    half_w, half_h = w // 2, h // 2

    # Define the boxes for each quadrant
    boxes = {
        "TL": (0,         0,          half_w,   half_h),    # top-left
        "TR": (half_w,    0,          w,        half_h),    # top-right
        "BR": (half_w,    half_h,     w,        h),         # bottom-right
        "BL": (0,         half_h,     half_w,   h),         # bottom-left
    }

    # Crop each quadrant
    quads = { name: img.crop(box) for name, box in boxes.items() }

    # Order them clockwise starting at top-left
    order = ["TL", "TR", "BR", "BL"]

    # Create the output sheet (horizontal strip of 4 quads)
    sheet_w = half_w * 4
    sheet_h = half_h
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))

    # Paste quadrants in order
    for idx, name in enumerate(order):
        sheet.paste(quads[name], (idx * half_w, 0))

    # Save result
    sheet.save(output_path)
    print(f"Saved sprite sheet with quadrants to '{output_path}'")

if __name__ == "__main__":
    if not os.path.isfile(INPUT_IMAGE):
        print(f"Error: input image not found at '{INPUT_IMAGE}'")
    elif not os.path.isdir(OUTPUT_DIR):
        print(f"Error: output directory not found at '{OUTPUT_DIR}'")
    else:
        split_and_pack(INPUT_IMAGE, OUTPUT_DIR)
