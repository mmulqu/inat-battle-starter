from PIL import Image

# load your sprite sheet
img = Image.open("C:/Users/mmulq/Projects/inat-battle-starter/src/assets/sprites/rockfish_idle_strip.png")

# how many frames across?
frames = 4

# overall sheet dimensions
sheet_w, sheet_h = img.size
print(f"Sheet size: {sheet_w}×{sheet_h}")

# per-frame dimensions
frame_w = sheet_w // frames
frame_h = sheet_h
print(f"Frame size: {frame_w}×{frame_h}")
