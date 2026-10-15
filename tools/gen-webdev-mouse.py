# gen-webdev-mouse.py — เด็กหนุ่ม 21 (ผมดำ + แว่นดำน้ำ) ปั้นเว็บกับหนูขาวคู่หู (Pillow ล้วน)
from PIL import Image, ImageDraw, ImageFont
import random, math

S = 1024
img = Image.new("RGB", (S, S), "#0d1226")
d = ImageDraw.Draw(img, "RGBA")
rng = random.Random(21)

def F(size, bold=True):
    return ImageFont.truetype(r"C:\Windows\Fonts\\" + ("tahomabd.ttf" if bold else "tahoma.ttf"), size)

# --- wall + floor ---
for y in range(S):
    t = y / S
    c = (int(16 + 8 * t), int(20 + 8 * t), int(44 + 10 * t))
    d.line([(0, y), (S, y)], fill=c + (255,))
d.rectangle([0, 800, S, S], fill=(13, 14, 26, 255))
d.line([(0, 800), (S, 800)], fill=(60, 60, 90, 255), width=3)

# --- stars ---
for _ in range(120):
    x, y = rng.randrange(S), rng.randrange(500)
    r = rng.choice([1, 1, 2])
    d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, rng.randint(90, 220)))

# --- window with moon ---
d.rectangle([618, 88, 956, 428], fill=(8, 10, 24, 255), outline=(120, 130, 170, 255), width=6)
d.line([(787, 88), (787, 428)], fill=(120, 130, 170, 255), width=4)
d.line([(618, 258), (956, 258)], fill=(120, 130, 170, 255), width=4)
for rr, al in ((70, 30), (55, 60)):
    d.ellipse([860 - rr, 160 - rr, 860 + rr, 160 + rr], fill=(253, 246, 216, al))
d.ellipse([830, 130, 890, 190], fill=(253, 246, 216, 255))
for _ in range(40):
    x, y = rng.randrange(630, 945), rng.randrange(100, 415)
    d.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(255, 255, 255, 200))

# --- poster ---
d.rectangle([70, 88, 330, 330], fill=(255, 201, 0, 255), outline=(10, 10, 14, 255), width=6)
d.text((100, 108), "WEB APP", font=F(52), fill=(12, 12, 16))
for i, (w, col) in enumerate([(150, (12, 12, 16)), (190, (12, 12, 16)), (120, (200, 40, 40)), (170, (12, 12, 16))]):
    d.rectangle([100, 190 + i * 30, 100 + w, 208 + i * 30], fill=col + (255,))

# --- lamp (left, warm) ---
d.ellipse([20, 300, 260, 540], fill=(255, 190, 90, 26))
d.rectangle([86, 420, 112, 640], fill=(30, 30, 40, 255))
d.polygon([(60, 420), (140, 420), (120, 350), (80, 350)], fill=(255, 201, 0, 255), outline=(10, 10, 14, 255))
d.ellipse([70, 400, 130, 440], fill=(255, 230, 160, 220))

# --- desk ---
d.rectangle([40, 640, 984, 700], fill=(90, 60, 34, 255), outline=(10, 10, 14, 255), width=5)
d.rectangle([40, 640, 984, 662], fill=(120, 82, 46, 255))
d.rectangle([80, 700, 130, 800], fill=(50, 34, 20, 255))
d.rectangle([894, 700, 944, 800], fill=(50, 34, 20, 255))

# --- screen glow on wall/desk ---
d.ellipse([230, 330, 640, 700], fill=(64, 196, 255, 30))

# --- man: hoodie body ---
d.polygon([(250, 800), (270, 560), (330, 520), (560, 520), (620, 560), (640, 800)], fill=(30, 58, 138, 255), outline=(10, 10, 14, 255))
d.polygon([(330, 520), (380, 520), (360, 610), (320, 600)], fill=(20, 40, 100, 255))  # hood fold L
d.polygon([(510, 520), (560, 520), (570, 600), (530, 610)], fill=(20, 40, 100, 255))  # hood fold R
d.rectangle([400, 690, 490, 740], fill=(18, 32, 84, 255), outline=(10, 10, 14, 255), width=3)  # pocket

# --- arms to keyboard ---
d.line([(300, 600), (400, 690)], fill=(30, 58, 138, 255), width=52)
d.line([(590, 600), (500, 690)], fill=(30, 58, 138, 255), width=52)

# --- head ---
d.ellipse([355, 330, 535, 510], fill=(242, 194, 151, 255), outline=(10, 10, 14, 255), width=4)
# black hair: cap + fringe
d.pieslice([350, 300, 540, 470], start=180, end=360, fill=(18, 18, 24, 255))
for fx in (365, 395, 425, 455, 485):
    d.polygon([(fx, 380), (fx + 28, 380), (fx + 14, 415)], fill=(18, 18, 24, 255))
d.ellipse([350, 300, 540, 400], fill=(18, 18, 24, 255))
d.ellipse([375, 330, 515, 395], fill=(242, 194, 151, 255))  # forehead skin back
# diving goggles on forehead: strap + twin lenses
d.rectangle([348, 352, 542, 372], fill=(15, 15, 20, 255))
for lx in (362, 462):
    d.rectangle([lx, 336, lx + 66, 392], fill=(14, 34, 46, 255), outline=(200, 220, 235, 255), width=4)
    d.line([(lx + 12, 384), (lx + 40, 344)], fill=(160, 220, 240, 255), width=5)  # glass shine
d.rectangle([428, 356, 462, 368], fill=(15, 15, 20, 255))  # bridge
# face: eyes + smile + blush
for ex in (405, 480):
    d.ellipse([ex - 9, 440 - 9, ex + 9, 440 + 9], fill=(12, 12, 16, 255))
    d.ellipse([ex - 3, 440 - 5, ex + 3, 440 + 1], fill=(255, 255, 255, 255))
d.arc([415, 455, 475, 495], start=10, end=170, fill=(120, 40, 40, 255), width=5)
d.ellipse([372, 458, 398, 474], fill=(250, 140, 140, 160))
d.ellipse([492, 458, 518, 474], fill=(250, 140, 140, 160))

# --- laptop (screen lowered so face stays visible) ---
d.polygon([(330, 640), (600, 640), (630, 700), (300, 700)], fill=(40, 42, 58, 255), outline=(10, 10, 14, 255))  # base
d.rectangle([345, 485, 615, 640], fill=(12, 14, 26, 255), outline=(10, 10, 14, 255), width=5)  # bezel
d.rectangle([357, 497, 603, 628], fill=(10, 22, 40, 255))  # screen
d.ellipse([345, 485, 615, 640], fill=(64, 196, 255, 26))  # screen light
# title bar
d.rectangle([357, 497, 603, 522], fill=(24, 32, 56, 255))
for i, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
    d.ellipse([367 + i * 22, 503, 381 + i * 22, 517], fill=col + (255,))
d.text((440, 500), "</> web-21", font=F(20, False), fill=(150, 200, 255))
# code lines
code = [(380, 534, 150, (0, 230, 118)), (380, 556, 200, (64, 196, 255)), (400, 578, 120, (255, 213, 79)),
        (380, 600, 180, (255, 64, 129))]
for x, y, w, col in code:
    d.rectangle([x, y, x + w, y + 13], fill=col + (255,))
d.rectangle([380, 616, 388, 626], fill=(255, 255, 255, 255))  # cursor

# --- keyboard + hands on top ---
d.rectangle([360, 700, 540, 736], fill=(16, 16, 24, 255), outline=(120, 130, 170, 255), width=3)
for r in range(2):
    for c in range(8):
        d.rectangle([370 + c * 21, 706 + r * 14, 386 + c * 21, 716 + r * 14], fill=(50, 54, 70, 255))
d.ellipse([376, 668, 424, 712], fill=(242, 194, 151, 255), outline=(10, 10, 14, 255), width=3)  # hand L
d.ellipse([476, 668, 524, 712], fill=(242, 194, 151, 255), outline=(10, 10, 14, 255), width=3)  # hand R

# --- white mouse buddy (right of laptop, sitting) ---
mx = 770
d.ellipse([mx - 90, 660, mx + 10, 700], fill=(200, 200, 210, 120))  # shadow
d.line([(mx + 62, 630), (mx + 122, 612), (mx + 138, 560)], fill=(235, 235, 240, 255), width=9)  # tail curl up
d.ellipse([mx - 70, 500, mx + 70, 660], fill=(245, 245, 250, 255), outline=(10, 10, 14, 255), width=4)  # body
d.ellipse([mx - 55, 440, mx + 55, 550], fill=(245, 245, 250, 255), outline=(10, 10, 14, 255), width=4)  # head
for exx, eyy in ((mx - 52, 445), (mx + 52, 445)):  # ears
    d.ellipse([exx - 26, eyy - 26, exx + 26, eyy + 26], fill=(245, 245, 250, 255), outline=(10, 10, 14, 255), width=4)
    d.ellipse([exx - 12, eyy - 12, exx + 12, eyy + 12], fill=(250, 170, 190, 255))
for ex in (mx - 22, mx + 22):  # eyes
    d.ellipse([ex - 8, 478 - 8, ex + 8, 478 + 8], fill=(12, 12, 16, 255))
    d.ellipse([ex - 2, 478 - 4, ex + 4, 478 + 2], fill=(255, 255, 255, 255))
d.ellipse([mx - 9, 512, mx + 9, 526], fill=(240, 110, 140, 255), outline=(10, 10, 14, 255), width=2)  # nose
d.arc([mx - 16, 520, mx + 16, 544], start=10, end=170, fill=(120, 60, 70, 255), width=4)  # smile
d.ellipse([mx - 62, 500, mx - 40, 516], fill=(250, 150, 160, 140))  # blush L
d.ellipse([mx + 40, 500, mx + 62, 516], fill=(250, 150, 160, 140))  # blush R
d.ellipse([mx - 45, 600, mx - 5, 640], fill=(235, 235, 240, 255), outline=(10, 10, 14, 255), width=3)  # paw raised
d.ellipse([mx + 5, 610, mx + 45, 645], fill=(235, 235, 240, 255), outline=(10, 10, 14, 255), width=3)  # paw rest
# tiny party hat for the buddy
d.polygon([(mx - 5, 425), (mx + 35, 425), (mx + 15, 365)], fill=(124, 77, 255, 255), outline=(10, 10, 14, 255))
d.ellipse([mx + 6, 356, mx + 24, 374], fill=(255, 201, 0, 255), outline=(10, 10, 14, 255), width=2)

# --- coffee + sticky notes (desk left) ---
d.rectangle([120, 560, 180, 640], fill=(240, 240, 245, 255), outline=(10, 10, 14, 255), width=4)
d.ellipse([120, 610, 150, 650], fill=(240, 240, 245, 255), outline=(10, 10, 14, 255), width=4)  # handle
d.text((132, 588), "</>", font=F(26, False), fill=(200, 40, 40))
for i, col in enumerate([(255, 235, 130), (170, 230, 255)]):
    d.rectangle([205 + i * 62, 580, 258 + i * 62, 640], fill=col + (255,), outline=(10, 10, 14, 255), width=3)
    d.line([(213 + i * 62, 596), (250 + i * 62, 596)], fill=(60, 60, 60, 255), width=3)
    d.line([(213 + i * 62, 610), (250 + i * 62, 610)], fill=(60, 60, 60, 255), width=3)

# --- caption bar ---
d.rectangle([0, 906, S, S], fill=(8, 9, 18, 255))
d.line([(0, 906), (S, 906)], fill=(0, 230, 118, 255), width=4)
d.text((40, 918), "เด็กหนุ่ม 21 ขยันปั้นเว็บ + หนูขาวคู่หู", font=F(40), fill=(245, 241, 232))
d.text((40, 968), "ผมดำ + แว่นดำน้ำ — ดึกแค่ไหนก็ไม่หยุดโค้ด", font=F(30, False), fill=(150, 170, 200))
d.text((790, 930), "100% CODE", font=F(34), fill=(0, 230, 118))

# --- grain ---
for _ in range(9000):
    x, y = rng.randrange(S), rng.randrange(S)
    v = rng.randint(0, 255)
    d.point((x, y), fill=(v, v, v, 12))

img.convert("RGB").save("assets/img/genpic-webdev-21-mouse.png")
print("saved assets/img/genpic-webdev-21-mouse.png", img.size)
