"""EP3 beatmaking renderer: college-art collage (PIL Latin/digits) + Thai via
libass + grid-accurate drum playhead + mix.wav. Output: beat-ep1.mp4 1080x1920.
Run: python render_beat.py"""
import json, math, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
INK, COBALT, MINT = (30, 26, 22), (29, 78, 216), (5, 150, 105)
RED, HL = (220, 38, 38), (253, 224, 71)
ARIAL = "C:/Windows/Fonts/arialbd.ttf"
ARIAL_R = "C:/Windows/Fonts/arial.ttf"
STEP = 60.0 / 90.0 / 4.0
KICK = [0, 4, 8, 12]
SNARE = [4, 12]
HAT = list(range(0, 16, 2))


def F(s, bold=True):
    return ImageFont.truetype(ARIAL if bold else ARIAL_R, s)


def ease(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


rng = np.random.default_rng(7)
fib = (rng.random((H, W)) * 14 - 7).astype(np.int32)
BG = np.ones((H, W, 3), np.int32) * np.array([242, 234, 216], np.int32)
BG += fib[:, :, None]
gy, gx = np.mgrid[0:H, 0:W]
BG = np.clip(BG - ((gx - W / 2) ** 2 / (2 * 700 ** 2) * 22)[:, :, None], 0, 255)
BG = np.clip(BG.astype(np.int32), 0, 255).astype(np.uint8)

# halftone dot screen (deterministic decor)
HT = Image.new("RGBA", (W, H), (0, 0, 0, 0))
_hd = ImageDraw.Draw(HT)
for _y in range(0, H, 26):
    for _x in range(0, W, 26):
        _hd.ellipse([_x, _y, _x + 5, _y + 5], fill=(30, 26, 22, 22))

DUST = [(float((k * 397) % W), float((k * 631) % H), 20 + (k * 13) % 40) for k in range(36)]

ENV = None


def load_env():
    global ENV
    if ENV is not None:
        return ENV
    try:
        import wave as _w
        with _w.open(os.path.join(HERE, "mix.wav"), "rb") as w:
            n, sr, ch = w.getnframes(), w.getframerate(), w.getnchannels()
            raw = w.readframes(n)
        a = np.frombuffer(raw, dtype=np.int16).astype(float).reshape(-1, ch).mean(1) / 32768.0
        per = max(1, int(sr / FPS))
        e = np.array([np.abs(a[i:i + per]).mean() for i in range(0, len(a), per)])
        e = e / max(1e-6, e.max())
        k = np.ones(6) / 6
        ENV = np.convolve(e, k, mode="same")
    except Exception:
        ENV = np.zeros(10)
    return ENV


def meters(d, t):
    e = load_env()
    fi = int(t * FPS)
    for side, x0 in ((0, 8), (1, W - 28)):
        for b in range(24):
            v = e[min(len(e) - 1, max(0, fi - 12 + b))] if len(e) > 1 else 0
            bh = int(4 + v * 120)
            y1 = 1500 - b * 44
            d.rectangle([x0, y1 - bh, x0 + 20, y1], fill=(29, 78, 216, 200))


def dust(d, t):
    for x0, y0, sp in DUST:
        x = (x0 + t * sp) % W
        y = (y0 - t * sp * 0.3) % H
        d.ellipse([x, y, x + 5, y + 5], fill=(255, 255, 255, 50))


def burst(d, cx, cy, r, col, n=12):
    pts = []
    for i in range(n * 2):
        rr = r if i % 2 == 0 else r * 0.78
        a = math.pi * i / n
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=col + (255,), outline=(30, 26, 22, 255))


def wipe(d, layer, p):
    ld = ImageDraw.Draw(layer)
    x = W * (1 - p)
    ld.rectangle([x, 0, x + 90, H], fill=(255, 253, 245, 235))
    d.line([(x, 0), (x, H)], fill=RED + (255,), width=10)


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


def base():
    img = Image.fromarray(BG.copy()).convert("RGBA")
    d = ImageDraw.Draw(img)
    for x in range(0, W + 1, 135):
        d.line([(x, 0), (x, H)], fill=(120, 150, 200, 40), width=1)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return img, d, layer


GX, GW, COLW = 60, 960, 60
ROWS = [("KICK", KICK, 700, MINT), ("SNARE", SNARE, 900, COBALT), ("HAT", HAT, 1100, (180, 120, 20))]


def grid(d, t, lit_rows, play_step):
    for c in range(16):
        d.text((GX + c * COLW + 14, 660), str(c + 1), font=F(30), fill=(120, 110, 95, 255))
    for lab, steps, yy, col in ROWS:
        d.text((GX, yy - 62), lab, font=F(44), fill=(30, 26, 22, 255))
        for c in range(16):
            x = GX + c * COLW
            on = c in steps and lab in lit_rows
            fill = col + (255,) if on else (255, 255, 255, 200)
            d.rounded_rectangle([x + 4, yy, x + COLW - 4, yy + 110], radius=10,
                                fill=fill, outline=(30, 26, 22, 255), width=3)
    if play_step is not None:
        x = GX + play_step * COLW
        d.rectangle([x, 640, x + COLW, 1250], outline=RED + (255,), width=6)
        d.rectangle([x + 4, 644, x + COLW - 4, 1246], fill=(220, 38, 38, 30))


def scene(t, S, img, d, layer):
    sid = S["id"](t)
    if sid == 0:  # hook
        p = ease(t / 3)
        torn(d, (140, 600, 940, 1050), (255, 255, 255), seed=3)
        tape(layer, 180, 570)
        tape(layer, 760, 990, ang=14)
        center(d, 680, "BEAT ?", F(150), (30, 26, 22))
        if t > 2:
            q = ease((t - 2) / 1.5)
            d.ellipse([220, 620, 860, 1030], outline=RED + (int(255 * q),), width=10)
        center(d, 1120, "START HERE", F(70), COBALT)
        burst(d, 895, 330, 95, HL)
        d.text((815, 292), "GO!", font=F(64), fill=INK + (255,))
    elif sid == 1:  # FL windows
        cards = [("CHANNEL RACK", "F6", COBALT), ("PIANO ROLL", "F7", MINT), ("PLAYLIST", "F5", (180, 120, 20))]
        for i, (lab, key, col) in enumerate(cards):
            yy = 480 + i * 300
            q = ease((t - S["t0"] - i * 1.2) / 1.5)
            if q <= 0:
                continue
            ww = int(820 * q)
            d.rectangle([W / 2 - ww / 2, yy, W / 2 + ww / 2, yy + 190], fill=(255, 255, 255, 255),
                        outline=col + (255,), width=6)
            if q > 0.7:
                f = F(62)
                bb = d.textbbox((0, 0), lab, font=f)
                d.text(((W - (bb[2] - bb[0])) / 2, yy + 30), lab, font=f, fill=(30, 26, 22, 255))
                center(d, yy + 110, key, F(56), col)
            tape(layer, W / 2 - 320 * q, yy - 26, ang=-10 + i * 7)
        if t > S["t0"] + 4:
            arrow(d, 850, 1300, 950, 1450, RED)
    elif sid == 2:  # BPM
        torn(d, (180, 480, 900, 900), (255, 255, 255), seed=11)
        tape(layer, 210, 450, ang=-8)
        burst(d, 185, 300, 85, MINT)
        d.text((118, 272), "NEW", font=F(54), fill=(255, 255, 255, 255))
        n = int(90 * ease((t - S["t0"]) / 3))
        center(d, 560, f"{n}", F(220), COBALT)
        center(d, 800, "BPM", F(80), (30, 26, 22))
        beat = (t * 90 / 60) % 1.0
        r = 26 + 10 * max(0, 1 - beat * 3)
        d.ellipse([W / 2 - r, 1000 - r, W / 2 + r, 1000 + r], fill=RED + (255,))
        center(d, 1080, "SLOW  <  90  >  FAST", F(52), (30, 26, 22))
        d.rectangle([190, 1180, 890, 1230], outline=(30, 26, 22, 255), width=4)
        d.rectangle([190, 1180, 190 + 700 * 0.35, 1230], fill=MINT + (255,))
        d.ellipse([190 + 700 * 0.35 - 16, 1164, 190 + 700 * 0.35 + 16, 1246], fill=RED + (255,))
    elif sid == 3:  # grid build + demos
        lit = {"KICK"} if t < S["snare_on"] else ({"KICK", "SNARE"} if t < S["hat_on"] else {"KICK", "SNARE", "HAT"})
        step = None
        for dm in S["demos"]:
            if dm["start"] <= t < dm["end"]:
                step = int((t - dm["start"]) / STEP) % 16
        grid(d, t, lit, step)
        meters(d, t)
        if step is None:
            center(d, 1330, "CLICK = ON", F(54), MINT)
        else:
            center(d, 1330, "LISTEN", F(54), RED)
        tape(layer, 120, 560, ang=-6)
    elif sid == 4:  # groove compare
        torn(d, (150, 520, 930, 900), (255, 255, 255), seed=21)
        tape(layer, 180, 490)
        center(d, 580, "SIMPLE", F(72), (30, 26, 22))
        p = ease((t - S["t0"]) / 3)
        torn(d, (150, 1000, 930, 1380), (255, 253, 245), seed=22)
        if p > 0.3:
            center(d, 1060, "GROOVE +", F(72), COBALT)
        arrow(d, 540, 920, 540, 990, RED, w=7)
        d.line([(200, 1450), (880, 1450)], fill=MINT + (255,), width=8)
    elif sid == 5:  # save
        p = ease((t - S["t0"]) / 2)
        torn(d, (200, 600, 880, 1000), (255, 255, 255), seed=31)
        tape(layer, 230, 570, ang=-6)
        center(d, 680, "CTRL + S", F(110), COBALT)
        center(d, 830, ".FLP", F(80), MINT)
        if p > 0.5:
            for i, txt in enumerate(["SAVE", "VERSION", "BACKUP"]):
                yy = 1080 + i * 130
                d.ellipse([230, yy, 290, yy + 60], outline=MINT + (255,), width=6)
                d.line([(242, yy + 30), (258, yy + 46), (282, yy + 14)], fill=MINT + (255,), width=7)
                d.text((320, yy - 6), txt, font=F(54), fill=(30, 26, 22, 255))
    else:  # recap + end
        items = ["1 BPM", "2 DRUM GRID", "3 LISTEN + TWEAK", "4 SAVE .FLP"]
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
                center(d, 960, "START SIMPLE", F(60), MINT + (int(255 * q),))


def fmt(t):
    h, r = divmod(t, 3600)
    m, r = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{int(r):02d}.{int(round((r % 1) * 100)):02d}"


def write_ass(path, cues, S):
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
    for a, b, st, txt in S["overlays"]:
        L.append(f"Dialogue: 0,{fmt(a)},{fmt(b)},{st},{{\\fad(300,300)}}{txt}")
    open(path, "w", encoding="utf-8").write("\n".join(L) + "\n")


def main():
    os.chdir(HERE)
    timing = json.load(open("timing.json", encoding="utf-8"))
    cues = [(c["start"], c["end"], c["text"]) for c in timing["cues"]]
    demos = timing["demos"]
    total = timing["total"]
    cs, ce = [c["start"] for c in timing["cues"]], [c["end"] for c in timing["cues"]]
    snare_on = cs[8]
    hat_on = cs[9]
    bounds = [cs[0], cs[1], cs[3], cs[5], cs[10], cs[12], cs[14], total]

    def sid(t):
        for i in range(7):
            if t < bounds[i + 1]:
                return i
        return 6

    S = {"id": sid, "t0": 0, "t1": total, "snare_on": snare_on, "hat_on": hat_on, "demos": demos,
         "overlays": [
             (cs[0], ce[0], "Head", "อยากทำบีทเป็น?"),
             (cs[1], ce[2], "Sub2", "สามหน้าต่างหลักของ FL Studio"),
             (cs[1], ce[2], "Src", "ภาพประกอบเพื่อการสอน"),
             (cs[3], ce[4], "Head", "BPM = จังหวะต่อนาที"),
             (cs[5], ce[6], "Sub2", "คลิกซ้ายเปิด · คลิกขวาปิด"),
             (cs[5], ce[9] + 6, "Src", "แผนภาพกริด ไม่ใช่หน้าจอจริง"),
             (cs[10], ce[11], "Sub2", "ย้ายทีละช่อง หาความต่าง"),
             (cs[12], ce[13], "Sub2", "Ctrl+S · เซฟเป็น .flp"),
             (total - 6, total, "Src", "ET1CRUEL · BEAT LAB"),
         ]}
    write_ass("subs.ass", cues, S)
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
        for i in range(7):
            if bounds[i] <= t < bounds[i + 1] or (i == 6 and t >= bounds[6]):
                S["t0"] = bounds[i]
                break
        img, d, layer = base()
        scene(t, S, img, d, layer)
        _wp = (t - S["t0"]) / 0.4
        if 0 < _wp < 1 and t > 2:
            wipe(d, layer, _wp)
        img = Image.alpha_composite(img, layer)
        img = Image.alpha_composite(img, HT)
        _d2 = ImageDraw.Draw(img)
        dust(_d2, t)
        img = img.convert("RGB")
        arr = np.asarray(img).astype(np.int32)
        gr = rng.integers(-5, 6, size=(H, W, 1)).astype(np.int32)
        pr.stdin.write(np.clip(arr + gr, 0, 255).astype(np.uint8).tobytes())
        if f % 400 == 0:
            el = time.time() - t0
            print(f"frame {f}/{NFR} ({el:.0f}s, ~{el / max(1, f) * NFR:.0f}s total)", flush=True)
    pr.stdin.close()
    pr.wait()
    subprocess.run(["ffmpeg", "-y", "-i", "silent.mp4", "-i", "mix.wav",
                    "-filter_complex", "[0:v]subtitles=subs.ass:fontsdir='assets'[v]",
                    "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium",
                    "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
                    "-ar", "44100", "-ac", "2", "-movflags", "+faststart",
                    "-shortest", "beat-ep1.mp4"], check=True)
    subprocess.run(["ffmpeg", "-y", "-ss", "60", "-i", "beat-ep1.mp4",
                    "-frames:v", "1", "thumb-beat.jpg"],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration,size:stream=width,height,r_frame_rate,codec_name",
                        "-of", "default=noprint_wrappers=1", "beat-ep1.mp4"],
                       capture_output=True, text=True, check=True)
    print("VERIFY:\n" + r.stdout)


if __name__ == "__main__":
    main()
