"""EP4 renderer: college-art mixer scenes + karaoke Thai subs (word pop gold).
Reads timing.json + words.json + mix.wav. Output: mix-ep4.mp4 1080x1920 30fps.
Run: python render_mix.py"""
import json, math, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
INK, COBALT, MINT = (30, 26, 22), (29, 78, 216), (5, 150, 105)
RED, HL, GOLD = (220, 38, 38), (253, 224, 71), (250, 204, 21)
ARIAL = "C:/Windows/Fonts/arialbd.ttf"
ARIAL_R = "C:/Windows/Fonts/arial.ttf"


def F(s, bold=True):
    return ImageFont.truetype(ARIAL if bold else ARIAL_R, s)


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


rng = np.random.default_rng(9)
fib = (rng.random((H, W)) * 14 - 7).astype(np.int32)
BG = np.ones((H, W, 3), np.int32) * np.array([242, 234, 216], np.int32)
BG += fib[:, :, None]
BG = np.clip(BG.astype(np.int32), 0, 255).astype(np.uint8)
HT = Image.new("RGBA", (W, H), (0, 0, 0, 0))
_hd = ImageDraw.Draw(HT)
for _y in range(0, H, 26):
    for _x in range(0, W, 26):
        _hd.ellipse([_x, _y, _x + 5, _y + 5], fill=(30, 26, 22, 22))


def torn(d, box, fill, jag=14, seed=1):
    x0, y0, x1, y1 = box
    r = np.random.default_rng(seed)
    pts, n = [], 14
    for i in range(n + 1):
        pts.append((x0 + (x1 - x0) * i / n, y0 + r.integers(-jag, jag + 1)))
    for i in range(n + 1):
        pts.append((x1 + r.integers(-jag, jag + 1), y0 + (y1 - y0) * i / n))
    for i in range(n + 1):
        pts.append((x1 - (x1 - x0) * i / n, y1 + r.integers(-jag, jag + 1)))
    for i in range(n + 1):
        pts.append((x0 + r.integers(-jag, jag + 1), y1 - (y1 - y0) * i / n))
    d.polygon(pts, fill=fill + (255,), outline=(120, 100, 80, 255))


def tape(layer, x, y, w=150, ang=-18):
    t = Image.new("RGBA", (w, 56), (210, 180, 140, 110))
    td = ImageDraw.Draw(t)
    td.line([(0, 28), (w, 28)], fill=(255, 255, 255, 60), width=2)
    layer.alpha_composite(t.rotate(ang, expand=True, resample=Image.BICUBIC), (int(x), int(y)))


def arrow(d, x0, y0, x1, y1, col, w=6):
    n = 16
    pts = []
    for i in range(n + 1):
        f = i / n
        off = math.sin(f * 9) * 8 * (1 - abs(f - 0.5) * 2 + 0.4)
        pts.append((x0 + (x1 - x0) * f - off * (y1 - y0) / 400,
                    y0 + (y1 - y0) * f + off * (x1 - x0) / 400))
    d.line(pts, fill=col + (255,), width=w, joint="curve")
    ang = math.atan2(y1 - y0, x1 - x0)
    for da in (2.6, -2.6):
        d.line([(x1, y1), (x1 - 34 * math.cos(ang + da), y1 - 34 * math.sin(ang + da))],
               fill=col + (255,), width=w)


def center(d, y, s, font, fill):
    bb = d.textbbox((0, 0), s, font=font)
    ink = fill if len(fill) == 4 else fill + (255,)
    d.text(((W - (bb[2] - bb[0])) / 2, y), s, font=font, fill=ink)


def burst(d, cx, cy, r, col, n=12):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else r * 0.78
        a = math.pi * i / n
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=col + (255,), outline=(30, 26, 22, 255))


def base():
    img = Image.fromarray(BG.copy()).convert("RGBA")
    d = ImageDraw.Draw(img)
    for x in range(0, W + 1, 135):
        d.line([(x, 0), (x, H)], fill=(120, 150, 200, 40), width=1)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return img, d, layer


def fader(d, x, y, h, frac, col, label):
    d.text((x - 10, y - 70), label, font=F(40), fill=(30, 26, 22, 255))
    d.rectangle([x, y, x + 26, y + h], outline=(30, 26, 22, 255), width=4)
    fy = y + h - int(h * frac)
    d.rectangle([x - 16, fy - 14, x + 42, fy + 14], fill=col + (255,), outline=(30, 26, 22, 255), width=4)


def knob(d, cx, cy, ang, label, sub):
    d.ellipse([cx - 60, cy - 60, cx + 60, cy + 60], fill=(255, 255, 255, 255), outline=(30, 26, 22, 255), width=5)
    a = math.radians(ang)
    d.line([(cx, cy), (cx + 44 * math.cos(a), cy + 44 * math.sin(a))], fill=RED + (255,), width=8)
    center(d, cy + 72, label, F(44), (30, 26, 22))
    center(d, cy + 122, sub, F(36), (120, 110, 95))


def scene(t, S, img, d, layer):
    sid = S["id"](t)
    if sid == 0:
        torn(d, (140, 600, 940, 1050), (255, 255, 255), seed=3)
        tape(layer, 180, 570)
        tape(layer, 760, 990, ang=14)
        center(d, 690, "MIX ?", F(150), (30, 26, 22))
        if t > 2:
            q = ease((t - 2) / 1.5)
            d.ellipse([220, 620, 860, 1030], outline=RED + (int(255 * q),), width=10)
        center(d, 1120, "FIX IT", F(70), COBALT)
        burst(d, 895, 330, 95, HL)
        d.text((815, 292), "GO!", font=F(64), fill=INK + (255,))
    elif sid == 1:
        d.line([(200, 500), (880, 500)], fill=(30, 26, 22, 255), width=8)
        p = ease((t - S["t0"]) / 2)
        d.line([(540, 500), (540 - 200 * p, 700)], fill=(30, 26, 22, 255), width=8)
        d.line([(540, 500), (540 + 200 * p, 700)], fill=(30, 26, 22, 255), width=8)
        torn(d, (180, 760, 460, 1000), (255, 255, 255), seed=5)
        torn(d, (620, 760, 900, 1000), (255, 255, 255), seed=6)
        center(d, 830, "SOFT", F(56), (30, 26, 22))
        center(d, 830 + 440, "LOUD", F(56), (30, 26, 22))
        center(d, 1120, "BALANCE", F(70), MINT)
    elif sid == 2:
        fader(d, 300, 500, 700, 0.95, MINT, "KICK")
        fader(d, 500, 500, 700, 0.6, COBALT, "SNARE")
        fader(d, 700, 500, 700, 0.45, (180, 120, 20), "HAT")
        center(d, 1300, "KICK FIRST", F(60), (30, 26, 22))
        tape(layer, 250, 440, ang=-6)
    elif sid == 3:
        p = ease((t - S["t0"]) / 2)
        pts = [(150 + i * 26, 900 - 260 * math.exp(-((i - 8) / 9) ** 2) * p) for i in range(31)]
        d.line(pts, fill=COBALT + (255,), width=9, joint="curve")
        d.line([(150, 950), (950, 950)], fill=(120, 110, 95, 255), width=3)
        center(d, 1050, "LOW-CUT", F(64), RED)
        arrow(d, 350, 1000, 300, 700, RED, w=7)
        tape(layer, 160, 560, ang=-8)
    elif sid == 4:
        torn(d, (200, 560, 880, 860), (255, 255, 255), seed=15)
        tape(layer, 230, 530, ang=-6)
        center(d, 620, "HAT", F(90), (30, 26, 22))
        p = ease((t - S["t0"]) / 2)
        for i in range(6):
            w = 500 * (1 - 0.12 * i * p)
            d.arc([540 - w / 2, 950 + i * 55, 540 + w / 2, 990 + i * 55], 0, 180, fill=RED + (255,), width=6)
        arrow(d, 800, 700, 850, 850, MINT, w=7)
        center(d, 1360, "SOFTER", F(60), MINT)
    elif sid == 5:
        knob(d, 270, 800, -120, "L", "perc")
        knob(d, 540, 800, -90, "C", "kick+snare")
        knob(d, 810, 800, -60, "R", "hats")
        center(d, 1150, "GIVE SPACE", F(60), COBALT)
        arrow(d, 270, 1000, 200, 1120, MINT, w=6)
        arrow(d, 810, 1000, 880, 1120, MINT, w=6)
    elif sid == 6:
        center(d, 560, "REVERB", F(80), (30, 26, 22))
        p = ease((t - S["t0"]) / 2.5)
        for i in range(4):
            r = (60 + i * 70) * p
            if r > 4:
                d.ellipse([540 - r, 850 - r, 540 + r, 850 + r], outline=MINT + (255,), width=6)
        center(d, 700, "o", F(90), COBALT)
        torn(d, (250, 1150, 830, 1330), (255, 255, 255), seed=25)
        center(d, 1195, "SMALL, NOT HALL", F(52), RED)
    elif sid == 7:
        torn(d, (200, 600, 880, 1000), (255, 255, 255), seed=31)
        tape(layer, 230, 570, ang=-6)
        center(d, 680, ".WAV", F(110), COBALT)
        center(d, 830, "EXPORT", F(80), MINT)
        for i, txt in enumerate(["LISTEN", "SAVE", "BACKUP"]):
            yy = 1080 + i * 130
            d.ellipse([230, yy, 290, yy + 60], outline=MINT + (255,), width=6)
            d.line([(242, yy + 30), (258, yy + 46), (282, yy + 14)], fill=MINT + (255,), width=7)
            d.text((320, yy - 6), txt, font=F(54), fill=(30, 26, 22, 255))
    else:
        items = ["1 BALANCE", "2 EQ + PAN", "3 SPACE", "4 EXPORT"]
        for i, txt in enumerate(items):
            q = ease((t - S["t0"] - i * 1.0) / 1.0)
            if q <= 0:
                continue
            yy = 480 + i * 170
            d.rounded_rectangle([180, yy, 180 + int(720 * q), yy + 120], radius=14,
                                fill=(255, 255, 255, 255), outline=COBALT + (255,), width=4)
            if q > 0.7:
                d.text((230, yy + 22), txt, font=F(56), fill=(30, 26, 22, 255))
        if t > S["t1"] - 8:
            q = ease((t - (S["t1"] - 8)) / 2)
            d.rectangle([0, 0, W, H], fill=(30, 26, 22, int(235 * q)))
            if q > 0.4:
                center(d, 800, "ET1CRUEL", F(120), (242, 234, 216, int(255 * q)))
                center(d, 960, "MIX SMART", F(60), MINT + (int(255 * q),))


def fmt(t):
    h, r = divmod(t, 3600)
    m, r = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{int(r):02d}.{int(round((r % 1) * 100)):02d}"


import re as _re
_COMB = _re.compile(r'^[\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]+$')


def merge_words(words):
    chunks = []
    for w in words:
        if chunks and (_COMB.match(w["w"]) or (w["b"] - w["a"]) < 0.05):
            chunks[-1]["w"] += w["w"]
            chunks[-1]["b"] = w["b"]
        else:
            chunks.append(dict(w))
    merged = []
    for c in chunks:
        if merged and (c["b"] - c["a"]) < 0.22:
            merged[-1]["w"] += c["w"]
            merged[-1]["b"] = c["b"]
        else:
            merged.append(c)
    return merged


def karaoke_line(words):
    parts = []
    for w in merge_words(words):
        cs = max(1, int(round((w["b"] - w["a"]) * 100)))
        parts.append("{\\k%d}%s " % (cs, w["w"]))
    return "".join(parts).strip()


def write_ass(path, cues, words, S):
    L = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920",
         "ScaledBorderAndShadow: yes", "", "[V4+ Styles]",
         "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
         "BorderStyle, Outline, Shadow, Alignment, MarginV",
         "Style: Ksub,Tahoma,58,&H00F4F6FB,&H0021CCFA,&H001A141E,1,2.5,0,2,150",
         "Style: Head,Tahoma,88,&H001A141E,&H00FFFDF5,1,3,0,8,500",
         "Style: Sub2,Tahoma,46,&H001D4ED8,&H00FFFDF5,1,2,0,8,420",
         "Style: Src,Tahoma,36,&H006E625A,&H00FFFDF5,1,1.5,0,8,210",
         "", "[Events]",
         "Format: Layer, Start, End, Style, Text"]
    wmap = {x["i"]: x["words"] for x in words}
    for c in cues:
        # คำแสดงใช้สคริปต์จริง (Whisper ไทยเพี้ยนได้) — timing เฉลี่ยต่อคำ
        ws = c["text"].split()
        per = (c["end"] - c["start"]) / max(1, len(ws))
        parts = ["{\\k%d}%s " % (max(1, int(round(per * 100))), w) for w in ws]
        L.append(f"Dialogue: 0,{fmt(c['start'])},{fmt(c['end'])},Ksub," + "".join(parts).strip())
    for a, b, st, txt in S["overlays"]:
        L.append(f"Dialogue: 0,{fmt(a)},{fmt(b)},{st},{{\\fad(300,300)}}{txt}")
    open(path, "w", encoding="utf-8").write("\n".join(L) + "\n")


def main():
    os.chdir(HERE)
    timing = json.load(open("timing.json", encoding="utf-8"))
    words = json.load(open("words.json", encoding="utf-8"))
    cues = timing["cues"]
    total = timing["total"]
    cs = [c["start"] for c in cues]
    bounds = cs + [total]

    def sid(t):
        for i in range(9):
            if t < bounds[i + 1]:
                return i
        return 8

    S = {"id": sid, "t0": 0, "t1": total,
         "overlays": [
             (cs[0], cs[0] + 4, "Head", "มิกซ์ไม่ดี?"),
             (cs[1], cs[2], "Sub2", "สมดุลก่อนความดัง"),
             (cs[2], cs[3], "Sub2", "คิกดังสุด แล้ววางตาม"),
             (cs[5], cs[6], "Sub2", "กลางไว้ ซ้ายขวาแบ่งกัน"),
             (cs[7], cs[8], "Sub2", "ฟังเทียบก่อนส่งออก"),
             (cs[0], cs[0] + 4, "Src", "ภาพประกอบเพื่อการสอน"),
         ]}
    write_ass("subs.ass", cues, words, S)
    NFR = int(total * FPS) + 1
    ff = ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
          "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "-",
          "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
          "-pix_fmt", "yuv420p", "silent.mp4"]
    pr = subprocess.Popen(ff, stdin=subprocess.PIPE,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    import time
    t0 = time.time()
    for f in range(NFR):
        t = f / FPS
        for i in range(9):
            if bounds[i] <= t < bounds[i + 1] or (i == 8 and t >= bounds[8]):
                S["t0"] = bounds[i]
                break
        img, d, layer = base()
        scene(t, S, img, d, layer)
        img = Image.alpha_composite(img, layer)
        img = Image.alpha_composite(img, HT)
        img = img.convert("RGB")
        pr.stdin.write(np.asarray(img).astype(np.uint8).tobytes())
        if f % 400 == 0:
            el = time.time() - t0
            print(f"frame {f}/{NFR}", flush=True)
    pr.stdin.close()
    pr.wait()
    subprocess.run(["ffmpeg", "-y", "-i", "silent.mp4", "-i", "mix.wav",
                    "-filter_complex", "[0:v]subtitles=subs.ass:fontsdir='assets'[v]",
                    "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium",
                    "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
                    "-ar", "44100", "-ac", "2", "-movflags", "+faststart",
                    "-shortest", "mix-ep4.mp4"], check=True)
    subprocess.run(["ffmpeg", "-y", "-ss", "30", "-i", "mix-ep4.mp4",
                    "-frames:v", "1", "thumb-mix.jpg"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration,size:stream=width,height,r_frame_rate,codec_name",
                        "-of", "default=noprint_wrappers=1", "mix-ep4.mp4"],
                       capture_output=True, text=True, check=True)
    print("VERIFY:\n" + r.stdout)


if __name__ == "__main__":
    main()
