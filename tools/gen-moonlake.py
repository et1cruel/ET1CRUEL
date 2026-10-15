# gen-moonlake.py — ทะเลสาบพระจันทร์ 1024x1024 (Pillow ล้วน, ไม่พึ่ง AI)
from PIL import Image, ImageDraw
import random

S = 1024
img = Image.new("RGB", (S, S), "#0b1026")
d = ImageDraw.Draw(img, "RGBA")
rng = random.Random(20261014)

# --- sky gradient ---
top = (11, 16, 38); mid = (43, 42, 85); hor = (78, 90, 120)
for y in range(660):
    k = y / 660
    if k < 0.55:
        t = k / 0.55
        c = tuple(int(top[i] + (mid[i] - top[i]) * t) for i in range(3))
    else:
        t = (k - 0.55) / 0.45
        c = tuple(int(mid[i] + (hor[i] - mid[i]) * t) for i in range(3))
    d.line([(0, y), (S, y)], fill=c + (255,))

# --- stars ---
for _ in range(240):
    x, y = rng.randrange(S), rng.randrange(600)
    r = rng.choice([1, 1, 1, 2, 2, 3])
    c = rng.choice([(255, 255, 255), (255, 255, 255), (190, 210, 255), (255, 240, 200)])
    d.ellipse([x - r, y - r, x + r, y + r], fill=c + (rng.randint(120, 255),))

# --- moon + glow ---
mx, my, mr = 700, 250, 105
for rr, al in ((190, 28), (160, 45), (135, 70)):
    d.ellipse([mx - rr, my - rr, mx + rr, my + rr], fill=(253, 246, 216, al))
d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(253, 246, 216, 255))
for _ in range(9):
    cx, cy, cr = mx + rng.randint(-60, 60), my + rng.randint(-60, 60), rng.randint(8, 22)
    d.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=(232, 222, 182, 255))

# --- mountains ---
d.polygon([(0, 640), (140, 480), (260, 600), (400, 450), (560, 610), (720, 500), (880, 620), (1024, 540), (1024, 660), (0, 660)], fill=(35, 35, 68, 255))
d.polygon([(0, 660), (180, 560), (340, 650), (520, 560), (700, 655), (880, 580), (1024, 650), (1024, 690), (0, 690)], fill=(23, 23, 43, 255))

# --- lake ---
for y in range(660, S):
    t = (y - 660) / (S - 660)
    c = (int(20 + 30 * t), int(30 + 40 * t), int(70 + 50 * t))
    d.line([(0, y), (S, y)], fill=c + (255,))

# moon reflection column
for i in range(26):
    y = 665 + i * 14
    w = 130 - i * 4 + rng.randint(-8, 8)
    d.rectangle([mx - w // 2, y, mx + w // 2, y + 7], fill=(253, 240, 190, 150 - i * 4))
# ripples
for _ in range(70):
    y = rng.randrange(670, S)
    w = rng.randint(20, 130)
    x = rng.randrange(S - w)
    d.line([(x, y), (x + w, y)], fill=(160, 190, 230, rng.randint(30, 90)), width=2)

# --- lotus pads + flowers ---
for (px, py, pr) in ((250, 830, 70), (820, 880, 90), (560, 930, 60), (120, 940, 55)):
    d.ellipse([px - pr, py - pr // 2, px + pr, py + pr // 2], fill=(24, 90, 60, 255))
    d.ellipse([px - pr, py - pr // 2, px + pr, py + pr // 2], outline=(10, 50, 34, 255), width=3)

def lotus(cx, cy, s, petal=(244, 150, 190), core=(255, 220, 130)):
    for k in range(8):
        import math
        a = math.pi * k / 4
        ex, ey = cx + math.cos(a) * s, cy + math.sin(a) * s * 0.55
        d.ellipse([ex - s * 0.42, ey - s * 0.3, ex + s * 0.42, ey + s * 0.3], fill=petal + (255,))
    d.ellipse([cx - s * 0.3, cy - s * 0.22, cx + s * 0.3, cy + s * 0.22], fill=core + (255,))

lotus(250, 800, 46)
lotus(820, 845, 58)

# --- fireflies ---
for _ in range(28):
    x, y = rng.randrange(S), rng.randrange(560, S)
    d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(220, 255, 150, 50))
    d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(240, 255, 180, 230))

# --- grain ---
for _ in range(9000):
    x, y = rng.randrange(S), rng.randrange(S)
    v = rng.randint(0, 255)
    d.point((x, y), fill=(v, v, v, 14))

img.convert("RGB").save("assets/img/genpic-moonlake.png")
print("saved assets/img/genpic-moonlake.png", img.size)
