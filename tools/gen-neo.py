# Neo-brutalist poster v2, pure Pillow, no downloads.
from PIL import Image, ImageDraw, ImageFont
import math, os
from pathlib import Path

W = H = 1600
YELLOW, PINK, BLUE, GREEN, CREAM, BLACK, WHITE, RED, PURPLE = (
    "#FFDE00", "#FF90E8", "#3E63DD", "#00A651", "#FFFDF5",
    "#111111", "#FFFFFF", "#FF4911", "#7B5CFF")

img = Image.new("RGB", (W, H), CREAM)
d = ImageDraw.Draw(img)

def font(size):
    for c in ("arialbd.ttf", "tahomabd.ttf", "arial.ttf", "tahoma.ttf"):
        p = os.path.join(r"C:\Windows\Fonts", c)
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def hard_rect(box, fill, border=10, shadow=22):
    x0, y0, x1, y1 = box
    d.rectangle([x0 + shadow, y0 + shadow, x1 + shadow, y1 + shadow], fill=BLACK)
    d.rectangle(box, fill=fill, outline=BLACK, width=border)

def starburst(cx, cy, r_out, r_in, n=16, fill=PINK):
    pts = []
    for i in range(n * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.pi * i / n - math.pi / 2
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon([(x + 18, y + 18) for x, y in pts], fill=BLACK)
    d.polygon(pts, fill=fill, outline=BLACK)

def bolt(cx, cy, s, fill=YELLOW):
    pts = [(cx, cy - 2 * s), (cx - 1.3 * s, cy + 0.6 * s), (cx - 0.3 * s, cy + 0.6 * s),
           (cx - 0.6 * s, cy + 2 * s), (cx + 1.3 * s, cy - 0.6 * s),
           (cx + 0.3 * s, cy - 0.6 * s)]
    d.polygon([(x + 12, y + 12) for x, y in pts], fill=BLACK)
    d.polygon(pts, fill=fill, outline=BLACK)

def plus(cx, cy, s):
    d.rectangle([cx - s, cy - s // 3, cx + s, cy + s // 3], fill=BLACK)
    d.rectangle([cx - s // 3, cy - s, cx + s // 3, cy + s], fill=BLACK)

# --- top marquee ---
hard_rect([0, 0, W, 150], BLACK, border=0, shadow=0)
d.text((40, 38), "GENPIC ROOM * 100% CODE * NO AI *", font=font(64), fill=YELLOW)

# --- checker strip ---
sq = 50
for i in range(W // sq + 1):
    for j in range(2):
        if (i + j) % 2 == 0:
            d.rectangle([i * sq, 150 + j * sq, i * sq + sq, 150 + (j + 1) * sq], fill=BLACK)

# --- hero title card ---
hard_rect([90, 330, W - 90, 740], WHITE)
d.text((150, 350), "GENPIC", font=font(225), fill=BLACK)
d.rectangle([150, 605, 1160, 685], fill=GREEN, outline=BLACK, width=8)
d.text((175, 603), "DRAWN WITH CODE", font=font(68), fill=WHITE)

# --- shapes row ---
# red circle sticker
d.ellipse([130 + 26, 820 + 26, 470 + 26, 1160 + 26], fill=BLACK)
d.ellipse([130, 820, 470, 1160], fill=RED, outline=BLACK, width=10)
d.text((168, 905), "100%", font=font(88), fill=WHITE)
d.text((160, 995), "CODE", font=font(88), fill=BLACK)
# blue tilted card (shadow FIRST, then card on top)
d.rectangle([600, 900, 1060, 1180], fill=BLACK)
card = Image.new("RGBA", (440, 260), BLUE)
cd = ImageDraw.Draw(card)
cd.rectangle([0, 0, 439, 259], outline=BLACK, width=10)
cd.text((36, 30), "NEO-", font=font(62), fill=WHITE)
cd.text((36, 105), "BRUTAL", font=font(62), fill=YELLOW)
cd.text((36, 180), "ISM!", font=font(62), fill=WHITE)
card = card.rotate(-7, expand=True, resample=Image.BICUBIC)
img.paste(card, (590, 850), card)
# starburst (fully inside)
starburst(1300, 990, 185, 132, fill=PINK)
d.text((1216, 950), "WOW", font=font(74), fill=BLACK)
# lightning + plus confetti
bolt(560, 1250, 55)
bolt(1120, 1290, 38, fill=WHITE)
plus(90, 1250, 26)
plus(1500, 760, 26)
plus(1180, 800, 20)

# --- mid ticker strip ---
hard_rect([0, 1330, W, 1410], BLACK, border=0, shadow=0)
d.text((30, 1342), "PYTHON * PILLOW * 1600PX * BOLD * LOUD * RAW *", font=font(44), fill=YELLOW)

# --- bottom band ---
hard_rect([0, H - 190, W, H], PURPLE, border=0, shadow=0)
d.text((40, H - 150), "BOLD BORDERS * HARD SHADOWS * FLAT COLORS", font=font(56), fill=WHITE)
d.rectangle([0, 0, W - 1, H - 1], outline=BLACK, width=14)

OUT = Path(__file__).resolve().parent.parent / "assets" / "img" / "genpic-neo-brutalism.png"
OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT)
print("saved v2", img.size, "->", OUT)
