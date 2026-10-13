"""JEPQ EP1 renderer: PIL motion graphics (Latin/digits only) + Thai text via
libass burn-in + numpy ambient music bed. Output: jepq-ep1.mp4 1080x1920 30fps.
Run: python render.py  (needs ffmpeg with libx264+libass, PIL, numpy)"""
import math, os, re, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, DUR = 1080, 1920, 30, 85
NFR = FPS * DUR
GREEN, CYAN, WHITE = (74, 222, 128), (94, 234, 212), (244, 246, 251)
MUT, DIM = (170, 180, 204), (43, 50, 72)
ARIAL = "C:/Windows/Fonts/arialbd.ttf"
ARIAL_R = "C:/Windows/Fonts/arial.ttf"


def F(size, bold=True):
    return ImageFont.truetype(ARIAL if bold else ARIAL_R, size)


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


# static background: vertical gradient + top glow
ys = np.linspace(0, 1, H)[:, None, None]
BG = (np.array([5, 7, 12])[None, None, :] * (1 - ys * 0.4) +
      np.array([9, 15, 34])[None, None, :] * (ys * 0.4))
BG = np.repeat(BG, W, axis=1)
gy, gx = np.mgrid[0:H, 0:W]
glow = np.exp(-((gx - W / 2) ** 2 / (2 * 420 ** 2) + gy ** 2 / (2 * 500 ** 2)))
BG = np.clip(BG + glow[:, :, None] * np.array([10, 26, 20]), 0, 255).astype(np.uint8)
rng = np.random.default_rng(7)
PARTS = [{"x": rng.random() * W, "y": rng.random() * H,
          "s": rng.random() * 2.2 + 0.6, "v": rng.random() * 10 + 3} for _ in range(55)]
GRAIN = None


def base(t):
    img = Image.fromarray(BG.copy())
    d = ImageDraw.Draw(img)
    for x in range(0, W + 1, 120):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 14), width=1)
    for y in range(0, H + 1, 120):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 10), width=1)
    for p in PARTS:
        y = (p["y"] - t * p["v"]) % H
        a = int(60 + 60 * math.sin(t * 2 + p["x"]))
        d.ellipse([p["x"] - p["s"], y - p["s"], p["x"] + p["s"], y + p["s"]],
                  fill=(94, 234, 212, max(20, a)))
    return img, d


def center_text(d, y, s, font, fill):
    bb = d.textbbox((0, 0), s, font=font)
    d.text(((W - (bb[2] - bb[0])) / 2, y), s, font=font, fill=fill)


def scene(t, img, d):
    if t < 7:  # S1 counter
        p = ease(t / 4.5)
        n = int(30000 * p)
        center_text(d, 780, "THB", F(64), MUT + (255,))
        center_text(d, 860, f"{n:,}", F(150), GREEN + (255,))
        for i in range(3):
            rr = 120 + ((t * 260 + i * 130) % 700)
            al = max(0, 200 - int(rr * 0.28))
            d.ellipse([W/2-rr, 950-rr, W/2+rr, 950+rr], outline=GREEN + (al,), width=3)
    elif t < 20:  # S2 ticker card + nodes
        p = ease((t - 7) / 2)
        cw, chh = int(700 * p), int(420 * p)
        if cw > 10:
            d.rounded_rectangle([W/2-cw/2, 700-chh/2, W/2+cw/2, 700+chh/2],
                                radius=36, outline=GREEN + (255,), width=5,
                                fill=(11, 13, 20, 235))
        if p > 0.6:
            center_text(d, 600, "JEPQ", F(170), WHITE + (255,))
        q = ease((t - 9) / 9)
        for i, (lab, yy) in enumerate([("NASDAQ-100", 1150), ("OPTIONS", 1350)]):
            xe = W/2 - 300 + 600 * (i == 1)
            x0, x1 = W/2, W/2 + (xe - W/2) * q
            d.line([(x0, 920), (x1, yy)], fill=CYAN + (255,), width=4)
            if q > 0.85:
                f = F(46)
                bb = d.textbbox((0, 0), lab, font=f)
                d.rounded_rectangle([x1 - 20, yy - 45, x1 + (bb[2]-bb[0]) + 20, yy + 45],
                                    radius=20, outline=CYAN + (255,), width=3)
                d.text((x1, yy - 32), lab, font=f, fill=WHITE + (255,))
    elif t < 35:  # S3 two-layer flow
        p1, p2 = ease((t - 20) / 6), ease((t - 24) / 6)
        for i, (lab, yy, frac, col) in enumerate(
                [("EQUITY", 700, p1, GREEN), ("OPTIONS", 950, p2, CYAN)]):
            d.rounded_rectangle([140, yy - 60, 940, yy + 60], radius=24,
                                outline=col + (255,), width=4)
            d.rounded_rectangle([146, yy - 54, 146 + 788 * frac, yy + 54], radius=20,
                                fill=col + (90,))
            f = F(52)
            bb = d.textbbox((0, 0), lab, font=f)
            d.text(((W - (bb[2]-bb[0]))/2, yy - 36), lab, font=f, fill=WHITE + (255,))
        q = ease((t - 29) / 4)
        for ax in (340, 740):
            y0, y1 = 1010, 1010 + (1180 - 1010) * q
            for yy in range(int(y0), int(y1), 26):
                d.line([(ax, yy), (ax, yy + 14)], fill=WHITE + (255,), width=5)
        if q > 0.9:
            pu = 0.5 + 0.5 * math.sin(t * 4)
            d.rounded_rectangle([240, 1200, 840, 1330], radius=26,
                                outline=GREEN + (255,), width=5,
                                fill=(74, 222, 128, int(20 + 30 * pu)))
            center_text(d, 1232, "MONTHLY PAYOUT", F(56), WHITE + (255,))
    elif t < 52:  # S4 split curves (ILLUSTRATIVE)
        p = ease((t - 35) / 14)
        d.line([(90, 1400), (990, 1400)], fill=DIM + (255,), width=3)
        idx = [(90 + 900 * i / 60, 1350 - 750 * (i / 60) ** 1.6) for i in range(61)]
        fun = [(90 + 900 * i / 60, 1350 - 750 * min(i / 60, 0.55) - 120 * max(0, i/60 - 0.55))
               for i in range(61)]
        n = max(2, int(61 * p))
        d.line(idx[:n], fill=CYAN + (255,), width=7, joint="curve")
        d.line(fun[:n], fill=GREEN + (255,), width=7, joint="curve")
        if p > 0.95:
            f = F(54)
            d.text((880, 480), "27.74%", font=f, fill=CYAN + (255,))
            d.text((880, 880), "14.08%", font=f, fill=GREEN + (255,))
            d.line([(90, 940), (990, 940)], fill=(251, 191, 36, 200), width=3)
    elif t < 70:  # S5 balance bars
        p = ease((t - 52) / 4)
        ph = 500 * p
        d.rectangle([250, 1400 - ph, 430, 1400], fill=GREEN + (255,))
        osc = 250 + 120 * math.sin((t - 52) * 1.1)
        vh = max(60, osc)
        d.rectangle([650, 1400 - vh, 830, 1400], fill=CYAN + (255,))
        d.line([(120, 1400), (960, 1400)], fill=DIM + (255,), width=4)
        f = F(44)
        for lab, xx in (("PAYOUT", 340), ("VALUE", 740)):
            bb = d.textbbox((0, 0), lab, font=f)
            d.text((xx - (bb[2]-bb[0])/2, 1430), lab, font=f, fill=MUT + (255,))
        for m in range(1, 5):
            mx = 120 + m * 60 * min(1, (t - 56) / 8)
            if mx < 960:
                d.line([(mx, 200), (mx, 1400)], fill=(255, 255, 255, 30), width=2)
    else:  # S6 converge + end card
        p = ease((t - 70) / 5)
        rr = 500 - 380 * p
        d.ellipse([W/2-rr, 900-rr, W/2+rr, 900+rr], outline=GREEN + (255,), width=6)
        if t > 77.5:
            q = ease((t - 77.5) / 2)
            d.ellipse([W/2-120, 780, W/2+120, 1020], outline=CYAN + (int(255*q),), width=5)
            if q > 0.5:
                center_text(d, 880, "ET1CRUEL", F(84), WHITE + (255,))
        if t > 84:  # fade to black
            a = int(255 * (t - 84))
            d.rectangle([0, 0, W, H], fill=(0, 0, 0, a))


def parse_srt(path):
    cues = []
    raw = open(path, encoding="utf-8").read().strip().split("\n\n")
    for b in raw:
        ln = b.strip().split("\n")
        tc, txt = ln[1], " ".join(ln[2:])
        def ts(s):
            h, m, rest = s.split(":")
            sec, ms = rest.split(",")
            return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
        a, bb = tc.split(" --> ")
        cues.append((ts(a), ts(bb), txt))
    return cues


def fmt(t):
    h, r = divmod(t, 3600)
    m, r = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{int(r):02d}.{int(round((r % 1) * 100)):02d}"


OVERLAYS = [  # (start, end, style, text)
    (0.5, 6.5, "Head", "เงินปันผลสูง = รวยเร็ว จริงไหม?"),
    (7.5, 12.0, "Head", "JEPQ"),
    (12.0, 19.5, "Sub2", "หุ้น + กลยุทธ์ออปชัน"),
    (20.5, 27.0, "Sub2", "หุ้น + กลยุทธ์ออปชัน"),
    (28.0, 34.5, "Sub2", "รายรับไม่เท่ากับกำไรสุทธิ"),
    (27.5, 35.0, "Src", "ที่มา: JPMorgan Fund Story 30 มิ.ย. 2026"),
    (35.5, 43.0, "Sub2", "ตลาดขึ้นแรง ≠ ได้ขึ้นเต็มเสมอ"),
    (44.0, 51.5, "Sub2", "ตลาดลง = ยังขาดทุนได้"),
    (35.0, 52.0, "Src", "ILLUSTRATIVE — กราฟจำลอง ไม่ใช่ผลจริง"),
    (52.5, 56.5, "Sub2", "อย่าดูแค่เงินที่ได้รับ"),
    (57.0, 61.0, "Sub2", "ดู Total Return ด้วย"),
    (61.5, 69.5, "Sub2", "ค่าธรรมเนียม 0.35% ต่อปี + ภาษี"),
    (70.5, 77.0, "Head", "เครื่องมือสร้างรายได้ที่มีความเสี่ยง"),
    (78.0, 84.5, "Head", "ET1CRUEL | INVEST WITH UNDERSTANDING"),
    (70.0, 85.0, "Src", "ไม่ใช่คำแนะนำการลงทุน"),
]


def write_ass(path, cues):
    L = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920",
         "ScaledBorderAndShadow: yes", "",
         "[V4+ Styles]",
         "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, "
         "BorderStyle, Outline, Shadow, Alignment, MarginV",
         "Style: Sub,Tahoma,64,&H00FFFFFF,&HCC000000,1,2.5,0,2,150",
         "Style: Head,Tahoma,92,&H004ADE74,&HCC000000,1,2.5,0,8,480",
         "Style: Sub2,Tahoma,46,&H00EAF85E,&HCC000000,1,2,0,8,300",
         "Style: Src,Tahoma,36,&H00CCB4AA,&HCC000000,1,1.5,0,8,200",
         "", "[Events]",
         "Format: Layer, Start, End, Style, Text"]
    for a, b, txt in cues:
        L.append(f"Dialogue: 0,{fmt(a)},{fmt(b)},Sub,{txt}")
    for a, b, st, txt in OVERLAYS:
        L.append(f"Dialogue: 0,{fmt(a)},{fmt(b)},{st},{{\\fad(300,300)}}{txt}")
    open(path, "w", encoding="utf-8").write("\n".join(L) + "\n")


def make_music(path, dur=85, sr=44100):
    n = dur * sr
    t = np.arange(n) / sr
    sig = np.zeros(n)
    for f, a in [(110, .30), (164.81, .22), (220, .18), (277.18, .12)]:
        sig += a * np.sin(2 * np.pi * f * t)
    sig *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.1 * t))
    atk = np.minimum(1, np.arange(n) / (3 * sr))
    rel = np.minimum(1, (n - np.arange(n)) / (5 * sr))
    sig *= np.minimum(atk, rel)
    sig *= 0.25 / max(1e-6, np.abs(sig).max())
    st = np.stack([sig, sig], 1)
    wav = wave.open(path, "wb")
    wav.setnchannels(2)
    wav.setsampwidth(2)
    wav.setframerate(sr)
    wav.writeframes((st * 32767).astype(np.int16).tobytes())
    wav.close()


def main():
    os.chdir(HERE)
    cues = parse_srt("subtitles.srt")
    write_ass("subs.ass", cues)
    make_music("music.wav")
    ff = ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
          "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "-",
          "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
          "-pix_fmt", "yuv420p", "silent.mp4"]
    pr = subprocess.Popen(ff, stdin=subprocess.PIPE,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for f in range(NFR):
        t = f / FPS
        img, d = base(t)
        scene(t, img, d)
        arr = np.asarray(img).astype(np.int32)
        gr = rng.integers(-6, 7, size=(H, W, 1)).astype(np.int32)
        pr.stdin.write(np.clip(arr + gr, 0, 255).astype(np.uint8).tobytes())
        if f % 300 == 0:
            print(f"frame {f}/{NFR}", flush=True)
    pr.stdin.close()
    pr.wait()
    subprocess.run(["ffmpeg", "-y", "-i", "silent.mp4", "-i", "music.wav",
                    "-filter_complex", "[0:v]subtitles=subs.ass:fontsdir='assets'[v]",
                    "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium",
                    "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
                    "-ar", "44100", "-ac", "2", "-movflags", "+faststart",
                    "-shortest", "jepq-ep1.mp4"], check=True)
    for ss, out in [("3", "f1.jpg"), ("40", "f2.jpg"), ("80", "f3.jpg"), ("80", "thumb-jepq.jpg")]:
        subprocess.run(["ffmpeg", "-y", "-ss", ss, "-i", "jepq-ep1.mp4",
                        "-frames:v", "1", out],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    ims = [Image.open(f"f{i}.jpg").resize((360, 640)) for i in (1, 2, 3)]
    sheet = Image.new("RGB", (1080, 640), (0, 0, 0))
    for i, im in enumerate(ims):
        sheet.paste(im, (i * 360, 0))
    sheet.save("contact.jpg")
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration:stream=width,height,r_frame_rate,codec_name",
                        "-of", "default=noprint_wrappers=1", "jepq-ep1.mp4"],
                       capture_output=True, text=True, check=True)
    print("VERIFY:\n" + r.stdout)


if __name__ == "__main__":
    main()
