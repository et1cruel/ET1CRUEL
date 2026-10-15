"""EP3 beatmaking audio: voiceover (edge-tts try-once -> gTTS fallback) + real
synthesized drum demos (90 BPM, grid-accurate) + ducked lo-fi bed + mix + SRT.
Run: python gen_beat_audio.py  ->  mix.wav + subtitles.srt + timing.json"""
import asyncio
import os
import subprocess
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VO = os.path.join(HERE, "voiceover")
SR = 44100
BPM = 90.0
STEP = 60.0 / BPM / 4.0  # 16th at 90 BPM
EDGE_VOICE = "th-TH-NiwatNeural"

# (sub_text, tts_text or None) — sub keeps standard written forms
CUES = [
    ("อยากทำบีทเป็น แต่ไม่รู้จะเริ่มตรงไหน? เริ่มตรงนี้เลย",
     "อยากทำบีทเป็น แต่ไม่รู้จะเริ่มตรงไหน? เริ่มตรงนี้เลย"),
    ("นี่คือ FL Studio โปรแกรมทำเพลงยอดฮิต",
     "นี่คือ เอฟแอล สตูดิโอ โปรแกรมทำเพลงยอดฮิต"),
    ("สามหน้าต่างหลัก Channel Rack F6, Piano Roll F7, Playlist F5",
     "สามหน้าต่างหลัก แชนแนลแร็ก เอฟหก เปียโนโรล เอฟเจ็ด เพลย์ลิสต์ เอฟห้า"),
    ("BPM คือจังหวะต่อนาที เลขมาก เพลงยิ่งเร็ว",
     "บี พี เอ็ม คือจังหวะต่อนาที เลขมาก เพลงยิ่งเร็ว"),
    ("ฮิปฮอปช้าๆ ใช้ 90 ตั้งเลย แล้วกด Spacebar ฟัง",
     "ฮิปฮอปช้าๆ ใช้เก้าสิบ ตั้งเลย แล้วกดสเปซบาร์ฟัง"),
    ("Channel Rack คือตารางกลอง แถวคือเสียง ช่องคือ Step",
     "แชนแนลแร็กคือตารางกลอง แถวคือเสียง ช่องคือสเต็ป"),
    ("คลิกซ้ายเปิด ขวาปิด เริ่มที่ Kick วาง 1, 5, 9, 13",
     "คลิกซ้ายเปิด ขวาปิด เริ่มที่คิก วางหนึ่ง ห้า เก้า สิบสาม"),
    ("นี่คือจังหวะตรงทุกบีท ฟังดู",
     "นี่คือจังหวะตรงทุกบีท ฟังดู"),
    ("เติม Snare ที่ 5 กับ 13 กลางระหว่าง Kick พอดี",
     "เติมสแนร์ที่ห้ากับสิบสาม กลางระหว่างคิกพอดี"),
    ("Hi-hat ทุกสองช่อง เติมความลื่นไหล",
     "ไฮแฮตทุกสองช่อง เติมความลื่นไหล"),
    ("กด Play ฟัง แล้วขยับ ไม่ต้องกลัวผิด",
     "กดเพลย์ ฟัง แล้วขยับ ไม่ต้องกลัวผิด"),
    ("ย้าย Snare ทีละช่อง ฟังความต่าง นี่แหละ Groove",
     "ย้ายสแนร์ทีละช่อง ฟังความต่าง นี่แหละกรูฟ"),
    ("พอใจแล้ว กด Ctrl+S บันทึกงาน",
     "พอใจแล้ว กดคอนโทรลเอส บันทึกงาน"),
    ("เซฟเป็น .flp เซฟบ่อยๆ กันงานหาย",
     "เซฟเป็นดอทเอฟแอลพี เซฟบ่อยๆ กันงานหาย"),
    ("ทบทวน BPM, Pattern กลอง ฟังปรับ แล้วบันทึก",
     "ทบทวน บีเอ็ม แพทเทิร์นกลอง ฟังปรับ แล้วบันทึก"),
    ("เริ่มจากบีทง่ายๆ แล้วค่อยสร้างเสียงในแบบของตัวเอง ET1CRUEL",
     "เริ่มจากบีทง่ายๆ แล้วค่อยสร้างเสียงในแบบของตัวเอง อีทีวันครูเอล"),
]
# demo bars appended after voice cue index: (pattern, bars)
DEMOS = {7: ("kick", 1), 8: ("kick-snare", 1), 9: ("full", 2)}
GAP = 0.35  # silence after each voice cue (tight pacing)


def tts_edge(text, out):
    async def go():
        pr = await asyncio.create_subprocess_exec(
            "python", "-m", "edge_tts", "--voice", EDGE_VOICE,
            "--text", text, "--write-media", out,
            stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        try:
            await asyncio.wait_for(pr.wait(), timeout=90)
        except asyncio.TimeoutError:
            pr.kill()
            return False
        return pr.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 1024
    try:
        return asyncio.run(go())
    except Exception:
        return False


def tts_gtts(text, out):
    from gtts import gTTS
    gTTS(text, lang="th").save(out)
    return os.path.exists(out) and os.path.getsize(out) > 1024


def to_wav(mp3):
    wav = mp3 + ".wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ar", str(SR),
                    "-ac", "1", wav], check=True)
    return wav


def wav_dur(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


def read_trim(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.int16).astype(float) / 32768.0
    m = np.abs(a) > 0.02
    if m.any():
        a = a[m.argmax():len(a) - m[::-1].argmax()]
    return a


def kick(dur=0.32):
    t = np.arange(int(dur * SR)) / SR
    f = 50 + 110 * np.exp(-t * 28)
    ph = np.cumsum(2 * np.pi * f / SR)
    return np.sin(ph) * np.exp(-t * 9) * 0.95


def snare(dur=0.22):
    t = np.arange(int(dur * SR)) / SR
    n = np.random.default_rng(7).standard_normal(len(t))
    env = np.exp(-t * 22)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    return (n * 0.55 + tone) * env


def hat(dur=0.07, open_=False):
    t = np.arange(int(dur * SR)) / SR
    n = np.random.default_rng(11).standard_normal(len(t))
    hp = n - np.concatenate([[0], n[:-1]])
    return hp * np.exp(-t * (28 if open_ else 70)) * 0.4


KICK_STEPS = [0, 4, 8, 12]
SNARE_STEPS = [4, 12]
HAT_STEPS = list(range(0, 16, 2))


def render_pattern(kind, bars):
    total = int(bars * 16 * STEP * SR) + int(0.3 * SR)
    sig = np.zeros(total)
    K, S, Hh = kick(), snare(), hat()

    def add(smp, step, bar):
        i0 = int((bar * 16 + step) * STEP * SR)
        i1 = min(total, i0 + len(smp))
        sig[i0:i1] += smp[:i1 - i0]

    for b in range(bars):
        for s in KICK_STEPS:
            add(K, s, b)
        if kind in ("kick-snare", "full"):
            for s in SNARE_STEPS:
                add(S, s, b)
        if kind == "full":
            for s in HAT_STEPS:
                add(Hh, s, b)
    sig *= 0.85 / max(1e-6, np.abs(sig).max())
    return sig


def lofi_bed(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    prog = [  # Fmaj7 Em7 Dm7 Cmaj7 (rhodes-ish)
        [87.31, 130.81, 164.81, 220.0],
        [82.41, 123.47, 164.81, 196.0],
        [73.42, 146.83, 174.61, 220.0],
        [65.41, 130.81, 164.81, 196.0],
    ]
    seg = dur / 4
    sig = np.zeros(n)
    for ci, fr in enumerate(prog):
        i0, i1 = int(ci * seg * SR), int(min(dur, (ci + 1) * seg) * SR)
        s = np.arange(i1 - i0) / SR
        tone = sum((0.30 / (k + 1)) * np.sin(2 * np.pi * f * s) * (0.8 + 0.2 * np.sin(2 * np.pi * 4.5 * s)) for k, f in enumerate(fr))
        f = np.minimum(1, s / 2.0) * np.minimum(1, (len(s) - np.arange(len(s))) / (2.0 * SR))
        sig[i0:i1] += tone * f
    # soft hats on 8ths, very low
    hh = hat(0.05)
    e8 = 60.0 / BPM / 2
    i = 0
    while i < n:
        j = min(n, i + len(hh))
        sig[i:j] += hh[:j - i] * 0.25
        i += int(e8 * SR)
    crack = (np.random.default_rng(3).random(n) < 0.00035).astype(float)
    crack *= np.random.default_rng(4).standard_normal(n) * 0.06
    sig = sig + crack
    sig *= 0.10 / max(1e-6, np.abs(sig).max())
    return sig


def main():
    os.makedirs(VO, exist_ok=True)
    os.chdir(HERE)
    print("engine order: edge-tts(1 try) -> gTTS", flush=True)
    clips, engine_used = [], set()
    for i, (sub, tts) in enumerate(CUES):
        mp3 = os.path.join(VO, f"cue{i:02d}.mp3")
        if not (os.path.exists(mp3) and os.path.getsize(mp3) > 1024):
            if os.path.exists(mp3):
                os.remove(mp3)
            if tts_edge(tts, mp3):
                engine_used.add("edge-tts")
                print(f"cue{i:02d} edge-tts OK", flush=True)
            else:
                tts_gtts(tts, mp3)
                engine_used.add("gTTS")
                print(f"cue{i:02d} gTTS fallback", flush=True)
        wav = to_wav(mp3)
        d = wav_dur(wav)
        clips.append((sub, wav, d))
        print(f"cue{i:02d} dur={d:.2f}s", flush=True)
    # sequential layout
    t = 0.8
    events, srt = [], []
    for i, (sub, wav, d) in enumerate(clips):
        events.append(("voice", i, t, t + d))
        srt.append((t, t + d, sub))
        t += d + GAP
        if i in DEMOS:
            kind, bars = DEMOS[i]
            dd = bars * 16 * STEP + 0.3
            events.append(("demo", kind, t, t + dd))
            t += dd + 0.4
    total = t + 1.2
    print(f"total={total:.1f}s engines={sorted(engine_used)}", flush=True)
    # voice bed
    voice = np.zeros(int(total * SR))
    for kind, i, a, b in events:
        if kind != "voice":
            continue
        a_sig = read_trim(clips[i][1])
        i0 = int(a * SR)
        i1 = min(len(voice), i0 + len(a_sig))
        voice[i0:i1] += a_sig[:i1 - i0]
    voice *= 0.89 / max(1e-6, np.abs(voice).max())
    # drums bed (voice ducks music, drums sit above music)
    drums = np.zeros(int(total * SR))
    for kind, k2, a, b in events:
        if kind != "demo":
            continue
        bars = DEMOS[[kk for kk, vv in DEMOS.items() if vv[0] == k2][0]][1]
        sig = render_pattern(k2, bars)
        i0 = int(a * SR)
        i1 = min(len(drums), i0 + len(sig))
        drums[i0:i1] += sig[:i1 - i0]
    music = lofi_bed(total)
    # duck music where voice active (0.35 dip, smoothed)
    vmask = (np.abs(voice) > 0.02).astype(float)
    k = np.ones(int(0.25 * SR)) / int(0.25 * SR)
    vmask = np.convolve(vmask, k, mode="same")
    duck = 1.0 - 0.65 * np.minimum(1, vmask * 3)
    music *= duck
    mix = voice + drums * 0.9 + music
    mix *= 0.95 / max(1e-6, np.abs(mix).max())
    stereo = np.stack([mix, mix], 1)
    with wave.open("mix.wav", "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes((stereo * 32767).astype(np.int16).tobytes())
    # peak/RMS report
    peak = float(np.abs(mix).max())
    rms = float(np.sqrt((mix ** 2).mean()))
    print(f"mix peak={peak:.3f} rms={rms:.3f}", flush=True)

    def srt_ts(x):
        h, r = divmod(x, 3600)
        m, r = divmod(r, 60)
        s, ms = divmod(r, 1)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(ms*1000):03d}"

    with open("subtitles.srt", "w", encoding="utf-8") as f:
        for i, (a, b, tx) in enumerate(srt, 1):
            f.write(f"{i}\n{srt_ts(a)} --> {srt_ts(b)}\n{tx}\n\n")
    import json
    timing = {"bpm": BPM, "total": round(total, 2), "engines": sorted(engine_used),
              "cues": [{"i": i, "start": round(a, 3), "end": round(b, 3), "text": tx} for i, (a, b, tx) in enumerate(srt)],
              "demos": [{"pattern": kk, "start": round(a, 3), "end": round(b, 3)} for k, kk, a, b in events if k == "demo"]}
    json.dump(timing, open("timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote mix.wav subtitles.srt timing.json", flush=True)


if __name__ == "__main__":
    main()
