# gen-beat-slides.py — สไลด์สอนทำบีท FL Studio 10 รูป (1920x1080) สไตล์ 3D + iso
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1920, 1080
BG = "#101018"
INK = "#0B0B10"
CREAM = "#F5F1E8"
GREEN, ORANGE, YELLOW, CYAN, PINK, PURPLE = "#00E676", "#FF6D00", "#FFEA00", "#40C4FF", "#FF4081", "#7C4FFF"

def F(size, bold=True):
    p = r"C:\Windows\Fonts\\" + ("tahomabd.ttf" if bold else "tahoma.ttf")
    return ImageFont.truetype(p, size)

def base():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 64):
        for y in range(0, H, 64):
            d.ellipse([x, y, x + 3, y + 3], fill="#23232e")
    return img, d

def chip(d, xy, text, fill, size=34):
    f = F(size)
    bb = d.textbbox((0, 0), text, font=f)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    x, y = xy
    pad_x, pad_y = 26, 14
    boxw, boxh = tw + pad_x * 2, th + pad_y * 2
    d.rectangle([x + 7, y + 7, x + boxw + 7, y + boxh + 7], fill=INK)
    d.rectangle([x, y, x + boxw, y + boxh], fill=fill, outline=INK, width=5)
    d.text((x + pad_x - bb[0], y + pad_y - bb[1]), text, font=f, fill=INK if fill in (YELLOW, GREEN, CYAN) else CREAM)
    return boxw

def text3d(d, xy, s, size, face=CREAM, depth=10, anchor_left=True):
    f = F(size)
    x, y = xy
    for i in range(depth, 0, -1):
        d.text((x + i, y + i), s, font=f, fill="#000000")
    d.text((x, y), s, font=f, fill=face)

def center3d(d, yc, s, size, face=CREAM, depth=10):
    f = F(size)
    bb = d.textbbox((0, 0), s, font=f)
    text3d(d, ((W - (bb[2] - bb[0])) / 2, yc), s, size, face, depth)

def bullets(d, x, y, items, size=40, gap=78, color=CREAM, dot=GREEN):
    f = F(size)
    for t in items:
        d.rectangle([x, y + 12, x + 26, y + 38], fill=dot, outline=INK, width=4)
        d.text((x + 44, y), t, font=f, fill=color)
        y += gap
    return y

def footer(d, n):
    f = F(30)
    d.text((80, H - 78), "FL STUDIO BEAT COURSE", font=f, fill="#8b8b96")
    t = "%02d/10" % n
    bb = d.textbbox((0, 0), t, font=f)
    d.text((W - 80 - (bb[2] - bb[0]), H - 78), t, font=f, fill="#8b8b96")
    d.text((80, 36), "ET1CRUEL • BEAT LAB", font=f, fill=GREEN)

def panel(d, box, fill="#1A1A24"):
    x0, y0, x1, y1 = box
    d.rectangle([x0 + 8, y0 + 8, x1 + 8, y1 + 8], fill=INK)
    d.rectangle(box, fill=fill, outline=CREAM, width=4)

def iso_box(d, x, y, w, hh, dep, top, left, right):
    # front face
    d.polygon([(x, y), (x + w, y), (x + w, y + hh), (x, y + hh)], fill=left, outline=INK)
    # top face
    d.polygon([(x, y), (x + dep, y - dep // 2), (x + w + dep, y - dep // 2), (x + w, y)], fill=top, outline=INK)
    # side face
    d.polygon([(x + w, y), (x + w + dep, y - dep // 2), (x + w + dep, y + hh - dep // 2), (x + w, y + hh)], fill=right, outline=INK)

def piano_roll(d, x, y, w, h, notes, cols=16, rows=8):
    d.rectangle([x, y, x + w, y + h], fill="#0c0c12", outline=CREAM, width=4)
    cw, rh = w / cols, h / rows
    for c in range(1, cols):
        d.line([x + c * cw, y, x + c * cw, y + h], fill="#2a2a36", width=2)
    for r in range(1, rows):
        d.line([x, y + r * rh, x + w, y + r * rh], fill="#2a2a36", width=2)
    for (c, r, ln, col) in notes:
        d.rectangle([x + c * cw + 3, y + r * rh + 5, x + (c + ln) * cw - 3, y + (r + 1) * rh - 5], fill=col, outline=INK, width=3)

def steps16(d, x, y, rows):
    # rows: [(label, [0/1 x16], color)]
    f = F(30)
    cw = 44
    for i, (lab, pat, col) in enumerate(rows):
        yy = y + i * 74
        d.text((x, yy + 6), lab, font=f, fill=CREAM)
        for c, on in enumerate(pat):
            xx = x + 170 + c * (cw + 6)
            fill = col if on else "#22222c"
            d.rectangle([xx, yy, xx + cw, yy + 52], fill=fill, outline=INK, width=4)

def faders(d, x, y, n, levels, labels, color=GREEN):
    f = F(28)
    for i in range(n):
        xx = x + i * 120
        d.rectangle([xx, y, xx + 54, y + 300], fill="#0c0c12", outline=CREAM, width=4)
        lv = levels[i]
        fy = y + 300 - int(280 * lv)
        d.rectangle([xx - 14, fy - 12, xx + 68, fy + 12], fill=color, outline=INK, width=4)
        d.text((xx - 8, y + 312), labels[i], font=f, fill=CREAM)

SLIDES = []

# 1 cover
def s1(img, d):
    chip(d, (80, 110), "BEAT COURSE · 10 STEPS", GREEN)
    center3d(d, 250, "ทำบีทบน FL STUDIO", 150, CREAM, 14)
    center3d(d, 430, "จากศูนย์ถึงเพลงแรก", 84, YELLOW, 10)
    iso_box(d, 560, 800, 220, 130, 70, GREEN, "#00a653", "#00753c")
    iso_box(d, 850, 800, 220, 130, 70, ORANGE, "#b34d00", "#7d3600")
    iso_box(d, 1140, 800, 220, 130, 70, CYAN, "#2b8ab5", "#1d607f")
    d.text((560, 960), "DRUMS", font=F(34), fill=GREEN)
    d.text((850, 960), "MELODY", font=F(34), fill=ORANGE)
    d.text((1140, 960), "MIX", font=F(34), fill=CYAN)
SLIDES.append(("01-pok", s1))

# 2 five windows
def s2(img, d):
    chip(d, (80, 110), "STEP 01 · MAP", CYAN)
    text3d(d, (80, 210), "5 หน้าต่างต้องรู้จัก", 104, CREAM, 12)
    wins = [("Channel Rack", "วางเสียงกลอง", GREEN), ("Piano Roll", "เขียนเมโลดี้", ORANGE),
            ("Playlist", "ต่อเพลง", YELLOW), ("Mixer", "ปรับเสียง", CYAN), ("Browser", "คลังเสียง", PINK)]
    x = 80
    for name, desc, col in wins:
        panel(d, (x, 480, x + 320, 820))
        d.rectangle([x + 24, 504, x + 296, 560], fill=col, outline=INK, width=4)
        d.text((x + 24, 580), name, font=F(36), fill=CREAM)
        d.text((x + 24, 640), desc, font=F(32), fill="#b9b9c4")
        d.text((x + 24, 720), "Toolbar ด้านบน", font=F(28), fill=col)
        x += 352
SLIDES.append(("02-map", s2))

# 3 channel rack drums
def s3(img, d):
    chip(d, (80, 110), "STEP 02 · DRUMS", GREEN)
    text3d(d, (80, 210), "Channel Rack — วางกลอง", 96, CREAM, 12)
    panel(d, (80, 400, 1840, 900))
    steps16(d, 140, 450, [
        ("KICK ", [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], GREEN),
        ("SNARE", [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], ORANGE),
        ("HAT  ", [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1], YELLOW),
        ("808  ", [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0], CYAN),
    ])
SLIDES.append(("03-drums", s3))

# 4 piano roll
def s4(img, d):
    chip(d, (80, 110), "STEP 03 · MELODY", ORANGE)
    text3d(d, (80, 210), "Piano Roll — เขียนเมโลดี้", 96, CREAM, 12)
    piano_roll(d, 80, 400, 1080, 500,
               [(0,2,3,GREEN),(4,3,2,GREEN),(6,4,2,YELLOW),(8,5,3,ORANGE),(12,4,2,GREEN),(14,2,2,CYAN)])
    bullets(d, 1220, 430, ["อยู่ใน Scale เดียวกัน", "Ghost notes ช่วย", "Velocity ไม่เท่ากัน", "Slide สำหรับ 808"], 36, 92)
SLIDES.append(("04-melody", s4))

# 5 playlist arrangement blocks
def s5(img, d):
    chip(d, (80, 110), "STEP 04 · PLAYLIST", YELLOW)
    text3d(d, (80, 210), "Playlist — ต่อเป็นเพลง", 96, CREAM, 12)
    panel(d, (80, 400, 1840, 900))
    pats = [("INTRO", GREEN, 2), ("VERSE", ORANGE, 4), ("HOOK", PINK, 3), ("VERSE", ORANGE, 4), ("OUTRO", CYAN, 2)]
    x = 130
    f = F(30)
    for name, col, ln in pats:
        wpx = ln * 100
        d.rectangle([x, 520, x + wpx - 12, 640], fill=col, outline=INK, width=4)
        d.text((x + 12, 556), name, font=f, fill=INK)
        x += wpx
    d.text((130, 700), "Pattern ซ้ำ = ท่อนเพลง · ลากวางยาวตามบาร์", font=F(38), fill=CREAM)
    bullets(d, 130, 780, ["เริ่มจาก 4-8 บาร์แล้ววน"], 36, 80)
SLIDES.append(("05-playlist", s5))

# 6 mixer
def s6(img, d):
    chip(d, (80, 110), "STEP 05 · MIXER", CYAN)
    text3d(d, (80, 210), "Mixer — ปรับเสียงให้ชัด", 96, CREAM, 12)
    faders(d, 120, 420, 6, [0.8, 0.65, 0.7, 0.55, 0.6, 0.75],
           ["KICK", "SNARE", "HAT", "808", "MELO", "MST"], CYAN)
    bullets(d, 900, 450, ["Kick ดังสุด ที่เหลือตาม", "EQ ตัดย่านที่ชนกัน", "Reverb/Delay ส่ง Send", "Master ห้ามแดง"], 38, 96)
SLIDES.append(("06-mixer", s6))

# 7 808 bass
def s7(img, d):
    chip(d, (80, 110), "STEP 06 · 808", PINK)
    text3d(d, (80, 210), "808 & Bass — เอาให้กระแทก", 96, CREAM, 12)
    piano_roll(d, 80, 400, 1080, 500,
               [(0,5,4,PINK),(4,5,1,PINK),(5,4,3,PINK),(8,3,4,PINK),(12,2,4,PINK)])
    bullets(d, 1220, 430, ["Slide โน้ตให้ไหล", "จูน 808 ตรงคีย์เพลง", "Kick กับ 808 อย่าชน", "สั้น-ยาวมีจังหวะ"], 36, 92)
SLIDES.append(("07-808", s7))

# 8 song structure
def s8(img, d):
    chip(d, (80, 110), "STEP 07 · STRUCTURE", PURPLE)
    text3d(d, (80, 210), "โครงเพลงมาตรฐาน", 104, CREAM, 12)
    parts = [("INTRO", "4 บาร์", GREEN), ("VERSE", "16 บาร์", ORANGE),
             ("HOOK", "8 บาร์", PINK), ("VERSE 2", "16 บาร์", ORANGE),
             ("HOOK", "8 บาร์", PINK), ("OUTRO", "4 บาร์", CYAN)]
    x = 80
    for name, bars, col in parts:
        d.rectangle([x, 480, x + 270, 640], fill=col, outline=INK, width=5)
        d.text((x + 20, 510), name, font=F(40), fill=INK)
        d.text((x + 20, 570), bars, font=F(32), fill=INK)
        x += 292
    bullets(d, 80, 720, ["Hook ต้องจำง่ายสุด", "เอา Element ออกบ้าง = โปร่ง"], 38, 90)
SLIDES.append(("08-structure", s8))

# 9 mix master export
def s9(img, d):
    chip(d, (80, 110), "STEP 08 · FINISH", YELLOW)
    text3d(d, (80, 210), "Mix & Export — ดังชัดไม่แตก", 92, CREAM, 12)
    panel(d, (80, 400, 900, 900))
    d.text((120, 440), "MASTER", font=F(40), fill=YELLOW)
    d.rectangle([120, 520, 860, 580], fill="#0c0c12", outline=CREAM, width=4)
    d.rectangle([120, 520, 700, 580], fill=GREEN, outline=INK, width=3)
    d.rectangle([700, 520, 770, 580], fill=YELLOW, outline=INK, width=3)
    d.text((120, 610), "Ceiling -1 dB · ไม่แดง", font=F(36), fill=CREAM)
    d.text((120, 680), "ฟังมือถือ + หูฟัง + รถ", font=F(36), fill=CREAM)
    d.text((120, 750), "Export WAV + MP3 320", font=F(36), fill=GREEN)
    bullets(d, 980, 450, ["Level เสียงก่อนใส่ Effect", "เทียบกับเพลงอ้างอิง", "พักหูแล้วกลับมาฟัง"], 38, 100)
SLIDES.append(("09-master", s9))

# 10 checklist
def s10(img, d):
    chip(d, (80, 110), "FINAL · CHECKLIST", GREEN)
    center3d(d, 200, "ส่งงานได้หรือยัง?", 110, CREAM, 12)
    items = ["กลองกระแทก ฟังชัด", "เมโลดี้อยู่ใน Scale", "มี Intro / Hook ครบ", "Master ไม่แตก ไม่เบา", "ตั้งชื่อ + แท็กบีท"]
    y = 400
    f = F(44)
    for t in items:
        d.rectangle([287, y + 7, 1632 + 7, y + 93 + 7], fill=INK)
        d.rectangle([280, y, 1632, y + 93], fill="#1A1A24", outline=GREEN, width=5)
        d.rectangle([310, y + 22, 354, y + 66], fill=GREEN, outline=INK, width=4)
        d.text((330, y + 30), "✓", font=F(36), fill=INK)
        d.text((390, y + 18), t, font=f, fill=CREAM)
        y += 112
SLIDES.append(("10-checklist", s10))

os.makedirs("slides", exist_ok=True)
for i, (name, fn) in enumerate(SLIDES, 1):
    img, d = base()
    fn(img, d)
    footer(d, i)
    out = "slides/beat-%s.png" % name
    img.save(out)
    print("saved", out)
