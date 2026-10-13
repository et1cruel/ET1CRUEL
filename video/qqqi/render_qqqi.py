"""QQQI EP1 renderer: college-art collage (PIL, Latin/digits only) + Thai via
libass + lo-fi music + edge-tts voiceover. Output: qqqi-ep1.mp4 1080x1920 30fps.
Run: python render_qqqi.py"""
import math, os, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, DUR = 1080, 1920, 30, 105
NFR = FPS * DUR
INK, COBALT, MINT = (30, 26, 22), (29, 78, 216), (5, 150, 105)
RED, HL, TAPE = (220, 38, 38), (253, 224, 71), (210, 180, 140)
ARIAL = "C:/Windows/Fonts/arialbd.ttf"
ARIAL_R = "C:/Windows/Fonts/arial.ttf"


def F(s, bold=True):
    return ImageFont.truetype(ARIAL if bold else ARIAL_R, s)


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


rng = np.random.default_rng(21)
fib = (rng.random((H, W)) * 14 - 7).astype(np.int32)
BG = np.ones((H, W, 3), np.int32) * np.array([242, 234, 216], np.int32)
BG += fib[:, :, None]
gy, gx = np.mgrid[0:H, 0:W]
BG = np.clip(BG - ((gx - W/2) ** 2 / (2 * 700 ** 2) * 22)[:, :, None], 0, 255)
BG = np.clip(BG.astype(np.int32), 0, 255).astype(np.uint8)


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
    layer.alpha_composite(t.rotate(ang, expand=True, resample=Image.BICUBIC),
                          (int(x), int(y)))


def arrow(d, x0, y0, x1, y1, col, w=6, wob=10):
    n = 16
    pts = []
    for i in range(n + 1):
        f = i / n
        off = math.sin(f * 9) * wob * (1 - abs(f - 0.5) * 2 + 0.4)
        pts.append((x0 + (x1 - x0) * f - off * (y1 - y0) / 400,
                    y0 + (y1 - y0) * f + off * (x1 - x0) / 400))
    d.line(pts, fill=col + (255,), width=w, joint="curve")
    ang = math.atan2(y1 - y0, x1 - x0)
    for da in (2.6, -2.6):
        d.line([(x1, y1), (x1 - 34 * math.cos(ang + da), y1 - 34 * math.sin(ang + da))],
               fill=col + (255,), width=w)


def hl(d, box):
    d.rounded_rectangle(box, radius=8, fill=HL + (170,))


def center(d, y, s, font, fill):
    bb = d.textbbox((0, 0), s, font=font)
    ink = fill if len(fill) == 4 else fill + (255,)
    d.text(((W - (bb[2] - bb[0])) / 2, y), s, font=font, fill=ink)


def doodle_curve(d, pts, frac, col, w=7):
    n = max(2, int(len(pts) * frac))
    seg = pts[:n]
    wob = [(x + math.sin(i * 1.7) * 6, y + math.cos(i * 2.3) * 6)
           for i, (x, y) in enumerate(seg)]
    d.line(wob, fill=col + (255,), width=w, joint="curve")


def base():
    img = Image.fromarray(BG.copy()).convert("RGBA")
    d = ImageDraw.Draw(img)
    for x in range(0, W + 1, 135):
        d.line([(x, 0), (x, H)], fill=(120, 150, 200, 40), width=1)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return img, d, layer


def scene(t, img, d, layer):
    if t < 10:  # S1 hook
        p = ease(t / 4)
        n = int(30000 * p)
        torn(d, (140, 620, 940, 1000), (255, 255, 255), seed=3)
        tape(layer, 180, 590)
        tape(layer, 760, 940, ang=14)
        center(d, 700, "THB", F(60), (120, 110, 95))
        center(d, 770, f"{n:,}", F(140), MINT)
        if t > 4:
            q = ease((t - 4) / 1.5)
            d.ellipse([200, 560, 880, 1080], outline=RED + (int(255 * q),), width=10)
    elif t < 25:  # S2 three strips
        items = [("NASDAQ-100", COBALT), ("OPTIONS", MINT), ("MONTHLY", (180, 120, 20))]
        for i, (lab, col) in enumerate(items):
            yy = 560 + i * 260
            q = ease((t - 10 - i * 3) / 2)
            if q <= 0:
                continue
            ww = int(800 * q)
            d.rectangle([W/2 - ww/2, yy, W/2 + ww/2, yy + 150], fill=(255, 255, 255, 255),
                        outline=col + (255,), width=5)
            if q > 0.7:
                f = F(64)
                bb = d.textbbox((0, 0), lab, font=f)
                d.text(((W-(bb[2]-bb[0]))/2, yy + 38), lab, font=f, fill=(30, 26, 22, 255))
            tape(layer, W/2 - 320 * q, yy - 26, ang=-12 + i * 8)
        if t > 20:
            arrow(d, 840, 1250, 960, 1420, RED)
    elif t < 45:  # S3 three papers flow
        labs = [("STOCKS", 500), ("OPTIONS", 800), ("PAYOUT", 1100)]
        for i, (lab, yy) in enumerate(labs):
            q = ease((t - 25 - i * 4) / 2.5)
            if q <= 0:
                continue
            torn(d, (180, yy, 900, yy + 170), (255, 255, 255), seed=10 + i)
            f = F(58)
            bb = d.textbbox((0, 0), lab, font=f)
            d.text(((W-(bb[2]-bb[0]))/2, yy + 52), lab, font=f, fill=(30, 26, 22, 255))
            tape(layer, 200, yy - 24, ang=-8 + i * 6)
            if i < 2 and q > 0.8:
                arrow(d, 540, yy + 175, 540, yy + 235, COBALT, w=7)
        if t > 40:
            hl(d, (250, 1330, 830, 1410))
    elif t < 65:  # S4 split doodles
        d.line([(W/2, 420), (W/2, 1500)], fill=(120, 100, 80, 255), width=4)
        p = ease((t - 45) / 14)
        up = [(140 + 380 * i / 40, 1250 - 600 * (i / 40) ** 1.5) for i in range(41)]
        dn = [(560 + 380 * i / 40, 700 + 550 * (i / 40) ** 1.4) for i in range(41)]
        doodle_curve(d, up, p, COBALT, 8)
        doodle_curve(d, dn, p, RED, 8)
        if p > 0.9:
            arrow(d, 420, 700, 480, 600, COBALT)
            d.ellipse([620, 1150, 900, 1290], outline=RED + (255,), width=6)
    elif t < 90:  # S5 ledger
        torn(d, (120, 420, 960, 1500), (255, 255, 255), seed=30)
        tape(layer, 150, 390)
        tape(layer, 780, 1450, ang=12)
        p = ease((t - 65) / 5)
        rows = [("IN", 0.85, MINT), ("PRICE", 0.4 + 0.2 * math.sin((t-65)), COBALT),
                ("FEE", 0.12, RED), ("TOTAL", 0.7, (30, 26, 22))]
        f = F(46)
        for i, (lab, fr, col) in enumerate(rows):
            yy = 600 + i * 200
            d.text((190, yy), lab, font=f, fill=(30, 26, 22, 255))
            bw = 560 * fr * (1 if i else p)
            d.rectangle([420, yy + 8, 420 + bw, yy + 58], fill=col + (255,))
        if t > 82:
            d.ellipse([180, 1290, 900, 1440], outline=RED + (255,), width=8)
    else:  # S6 notebook calm
        torn(d, (200, 500, 880, 1300), (255, 253, 245), seed=44)
        tape(layer, 230, 470, ang=-6)
        p = ease((t - 90) / 4)
        nb = [(260 + 560 * i / 30, 1150 - 300 * (i / 30) + math.sin(i) * 8)
              for i in range(31)]
        doodle_curve(d, nb, p, MINT, 7)
        d.line([(760, 1350), (880, 1350)], fill=(30, 26, 22, 255), width=9)  # pen
        d.line([(880, 1350), (860, 1400)], fill=(30, 26, 22, 255), width=9)
        if t > 100:
            q = ease((t - 100) / 2)
            center(d, 1450, "ET1CRUEL", F(80), (30, 26, 22, int(255 * q)))
        if t > 103.5:
            a = int(235 * (t - 103.5) / 1.5)
            d.rectangle([0, 0, W, H], fill=(242, 234, 216, min(235, a)))


def parse_srt(path):
    cues, cur = [], []
    for ln in open(path, encoding="utf-8").read().split("\n") + [""]:
        ln = ln.strip()
        if not ln:
            if len(cur) >= 3:
                def ts(s):
                    h, m, r = s.split(":")
                    sec, ms = r.split(",")
                    return int(h)*3600 + int(m)*60 + int(sec) + int(ms)/1000
                a, b = cur[1].split(" --> ")
                cues.append((ts(a), ts(b), " ".join(cur[2:])))
            cur = []
        else:
            cur.append(ln)
    return cues


def fmt(t):
    h, r = divmod(t, 3600)
    m, r = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{int(r):02d}.{int(round((r % 1)*100)):02d}"


OVERLAYS = [
    (0.5, 4.5, "Head", "รับเงินทุกเดือน..."),
    (10.5, 16.5, "Head", "QQQI — คิวคิวคิวไอ"),
    (17.5, 24.5, "Sub2", "หุ้น + ออปชันแบบใช้ข้อมูล"),
    (25.5, 32.5, "Sub2", "เงินที่จ่ายออกมา ≠ กำไรสุทธิเสมอไป"),
    (33.5, 44.5, "Src", "อัตราจ่าย 14.28%/ปี ณ ก.ย. 2026 · NEOS"),
    (45.5, 54.5, "Sub2", "ตลาดขึ้นแรง ≠ ได้ขึ้นเต็มเสมอ"),
    (55.5, 64.5, "Sub2", "ตลาดลง = ยังขาดทุนได้"),
    (45.0, 65.0, "Src", "ตัวอย่างเพื่ออธิบายเท่านั้น"),
    (65.5, 74.5, "Sub2", "ส่วนจ่ายอาจมีคืนเงินต้น — ดู 19a-1"),
    (75.5, 82.0, "Head", "TOTAL RETURN"),
    (82.0, 89.5, "Sub2", "เงินได้ + ราคา + ภาษี + ค่าธรรมเนียม"),
    (90.5, 94.0, "Sub2", "เข้าใจเงินที่ได้รับ"),
    (94.0, 97.5, "Sub2", "เข้าใจความเสี่ยงที่รับ"),
    (97.5, 99.5, "Sub2", "แล้วค่อยตัดสินใจลงทุน"),
    (90.0, 105.0, "Src", "ไม่ใช่คำแนะนำการลงทุน"),
]


def write_ass(path, cues):
    L = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920",
         "ScaledBorderAndShadow: yes", "", "[V4+ Styles]",
         "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, "
         "BorderStyle, Outline, Shadow, Alignment, MarginV",
         "Style: Sub,Tahoma,62,&H001A141E,&H00FFFDF5,1,2.5,0,2,150",
         "Style: Head,Tahoma,88,&H001A141E,&H00FFFDF5,1,3,0,8,500",
         "Style: Sub2,Tahoma,46,&H001D4ED8,&H00FFFDF5,1,2,0,8,320",
         "Style: Src,Tahoma,36,&H006E625A,&H00FFFDF5,1,1.5,0,8,210",
         "", "[Events]",
         "Format: Layer, Start, End, Style, Text"]
    for a, b, txt in cues:
        L.append(f"Dialogue: 0,{fmt(a)},{fmt(b)},Sub,{txt}")
    for a, b, st, txt in OVERLAYS:
        L.append(f"Dialogue: 0,{fmt(a)},{fmt(b)},{st},{{\\fad(300,300)}}{txt}")
    open(path, "w", encoding="utf-8").write("\n".join(L) + "\n")


def make_music(path, dur=105.0, sr=44100):
    n = int(dur * sr)
    t = np.arange(n) / sr
    chords = [(0, [110.0, 164.81, 220.0, 261.63, 329.63]),
              (26, [87.31, 130.81, 174.61, 220.0, 261.63]),
              (52, [98.0, 130.81, 164.81, 196.0, 246.94]),
              (78, [98.0, 146.83, 196.0, 246.94, 293.66]),
              (96, [110.0, 164.81, 220.0, 261.63, 329.63])]
    sig = np.zeros(n)
    for ci, (st, fr) in enumerate(chords):
        en = chords[ci + 1][0] if ci + 1 < len(chords) else dur
        i0, i1 = int(st * sr), int(en * sr)
        seg = np.arange(i1 - i0) / sr
        tone = np.zeros_like(seg)
        for k, f in enumerate(fr):
            tone += (0.30 / (k + 1) ** 1.4) * np.sin(2 * np.pi * f * seg)
        fade = np.minimum(1, seg / 3.0) * np.minimum(
            1, (len(seg) - np.arange(len(seg))) / (3.0 * sr))
        sig[i0:i1] += tone * np.minimum(fade, 1.0)
    sig *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.06 * t)
    crack = (rng.random(n) < 0.0004).astype(float) * rng.standard_normal(n) * 0.05
    sig = sig + crack
    sig *= 0.085 / max(1e-6, np.abs(sig).max())
    st = np.stack([sig, sig], 1)
    wv = wave.open(path, "wb")
    wv.setnchannels(2)
    wv.setsampwidth(2)
    wv.setframerate(sr)
    wv.writeframes((st * 32767).astype(np.int16).tobytes())
    wv.close()


def main():
    os.chdir(HERE)
    cues = parse_srt("subtitles.srt")
    write_ass("subs.ass", cues)
    make_music("music.wav")
    ff = ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
          "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "-",
          "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
          "-pix_fmt", "yuv420p", "silent.mp4"]
    pr = subprocess.Popen(ff, stdin=subprocess.PIPE,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for f in range(NFR):
        t = f / FPS
        img, d, layer = base()
        scene(t, img, d, layer)
        img = Image.alpha_composite(img, layer).convert("RGB")
        arr = np.asarray(img).astype(np.int32)
        gr = rng.integers(-5, 6, size=(H, W, 1)).astype(np.int32)
        pr.stdin.write(np.clip(arr + gr, 0, 255).astype(np.uint8).tobytes())
        if f % 400 == 0:
            print(f"frame {f}/{NFR}", flush=True)
    pr.stdin.close()
    pr.wait()
    subprocess.run(["ffmpeg", "-y", "-i", "silent.mp4", "-i", "music.wav",
                    "-filter_complex", "[0:v]subtitles=subs.ass:fontsdir='assets'[v]",
                    "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium",
                    "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
                    "-ar", "44100", "-ac", "2", "-movflags", "+faststart",
                    "-shortest", "qqqi-ep1.mp4"], check=True)
    for ss, out in [("5", "f1.jpg"), ("50", "f2.jpg"), ("95", "f3.jpg"),
                    ("95", "thumb-qqqi.jpg")]:
        subprocess.run(["ffmpeg", "-y", "-ss", ss, "-i", "qqqi-ep1.mp4",
                        "-frames:v", "1", out],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    ims = [Image.open(f"f{i}.jpg").resize((360, 640)) for i in (1, 2, 3)]
    sheet = Image.new("RGB", (1080, 640), (242, 234, 216))
    for i, im in enumerate(ims):
        sheet.paste(im, (i * 360, 0))
    sheet.save("contact.jpg")
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration:stream=width,height,r_frame_rate,codec_name",
                        "-of", "default=noprint_wrappers=1", "qqqi-ep1.mp4"],
                       capture_output=True, text=True, check=True)
    print("VERIFY:\n" + r.stdout)


if __name__ == "__main__":
    main()
