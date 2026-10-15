"""EP4 audio: VachaSpeech clone (9 cues) + chill bed + spectral carve + duck + mix.
Carve mirrors hyperframes-audio voiceover carve: cut bed where voice lives
(~250Hz-2.5kHz, deepest ~1.6kHz) instead of only ducking the whole bed.
Run: python gen_mix_audio.py  ->  mix.wav + subtitles.srt + timing.json"""
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "beat-ep1"))
sys.path.insert(0, os.path.join(HERE, "..", "..", "music"))
VO = os.path.join(HERE, "voiceover")
SR = 44100
GAP = 0.4
REF = os.path.join(HERE, "..", "voice-clone", "ref.wav")

CUES = [
    ("ทำบีทเสร็จแล้ว แต่เสียงยังไม่เพราะ? ปัญหาอยู่ที่มิกซ์",
     "ทำบีทเสร็จแล้ว แต่เสียงยังไม่เพราะ? ปัญหาอยู่ที่มิกซ์"),
    ("มิกซ์คือจัดเสียงให้ลงตัว ไม่ใช่เร่งให้ดัง",
     "มิกซ์คือจัดเสียงให้ลงตัว ไม่ใช่เร่งให้ดัง"),
    ("เริ่มที่วอลลุ่ม ตั้งคิกดังสุด แล้ววางขึ้นชิ้นอื่นตามลงมา",
     "เริ่มที่วอลลุ่ม ตั้งคิกดังสุด แล้ววางขึ้นชิ้นอื่นตามลงมา"),
    ("อีคิว ตัดเสียงอู้ต่ำๆ ออกจากชิ้นที่ไม่ใช่เบส",
     "อีคิว ตัดเสียงอู้ต่ำๆ ออกจากชิ้นที่ไม่ใช่เบส"),
    ("ไฮแฮตแหลมบาดหู ลดย่านแหลมลงนิดเดียว",
     "ไฮแฮตแหลมบาดหู ลดย่านแหลมลงนิดเดียว"),
    ("แพน วางคิกกับสแนร์ไว้กลาง โยนชิ้นอื่นซ้ายขวา",
     "แพน วางคิกกับสแนร์ไว้กลาง โยนชิ้นอื่นซ้ายขวา"),
    ("รีเวิร์บใส่นิดเดียวพอ ให้มีมิติ ไม่ใช่ห้องใหญ่",
     "รีเวิร์บใส่นิดเดียวพอ ให้มีมิติ ไม่ใช่ห้องใหญ่"),
    ("เสร็จแล้วฟังเทียบ ส่งออกเป็นไฟล์เวฟ เก็บโปรเจกต์ด้วย",
     "เสร็จแล้วฟังเทียบ ส่งออกเป็นไฟล์เวฟ เก็บโปรเจกต์ด้วย"),
    ("มิกซ์ดี บีทเดิมดีขึ้นทันที เริ่มมิกซ์กันเลย",
     "มิกซ์ดี บีทเดิมดีขึ้นทันที เริ่มมิกซ์กันเลย"),
]


def to_sr_wav(path):
    out = path + ".c.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-ar", str(SR),
                    "-ac", "1", out], check=True)
    return out


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


def carve_bed(bed):
    """Spectral carve in dB domain: -7dB @400/1k/2.5k, -14dB @1.6k (Q~2)."""
    spec = np.fft.rfft(bed)
    fr = np.fft.rfftfreq(len(bed), 1 / SR)
    db = np.zeros_like(fr)
    for f0, cut in ((400, -7), (1000, -7), (1600, -14), (2500, -7)):
        db += cut * np.exp(-0.5 * ((np.log2(fr + 1) - np.log2(f0)) / 0.5) ** 2)
    resp = 10.0 ** (db / 20.0)
    out = np.fft.irfft(spec * np.clip(resp, 0.02, 1.0), len(bed))
    print(f"carve max-cut={db.min():.1f}dB min-gain={resp.min():.3f}", flush=True)
    return out


def main():
    os.makedirs(VO, exist_ok=True)
    os.chdir(HERE)
    from vachaspeech import VachaSpeech
    print("loading VachaSpeech...", flush=True)
    tts = VachaSpeech()
    print("model loaded", flush=True)
    clips = []
    for i, (sub, txt) in enumerate(CUES):
        wav = os.path.join(VO, f"cue{i:02d}.wav")
        if not (os.path.exists(wav) and wav_dur(wav) > 0.5):
            try:
                codes = tts.generate(txt, gender="male", temperature=0.5)
                tts.decode(codes, ref_audio=REF, output=wav)
                print(f"cue{i:02d} cloned codes={len(codes)}", flush=True)
            except Exception as e:
                print(f"cue{i:02d} clone FAIL ({str(e)[:100]}) -> gTTS", flush=True)
                from gtts import gTTS
                mp3 = wav + ".mp3"
                gTTS(txt, lang="th").save(mp3)
                wav = to_sr_wav(mp3)
        else:
            print(f"cue{i:02d} cached", flush=True)
        if wav.endswith(".wav") and not wav.endswith(".c.wav"):
            wav = to_sr_wav(wav)
        d = wav_dur(wav)
        clips.append((sub, wav, d))
        print(f"cue{i:02d} dur={d:.2f}s", flush=True)
    t = 0.8
    srt = []
    for i, (sub, wav, d) in enumerate(clips):
        srt.append((t, t + d, sub))
        t += d + GAP
    total = t + 1.2
    print(f"total={total:.1f}s", flush=True)
    voice = np.zeros(int(total * SR))
    for i, (sub, wav, d) in enumerate(clips):
        a_sig = read_trim(wav)
        i0 = int(srt[i][0] * SR)
        i1 = min(len(voice), i0 + len(a_sig))
        voice[i0:i1] += a_sig[:i1 - i0]
    voice *= 0.89 / max(1e-6, np.abs(voice).max())
    with wave.open("voice_raw.wav", "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes((voice * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "voice_raw.wav", "-af",
                    "highpass=f=75,equalizer=f=3000:t=q:w=1:g=4,loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-ar", str(SR), "-ac", "1", "voice.wav"], check=True)
    with wave.open("voice.wav", "rb") as w:
        n = w.getnframes()
        voice = np.frombuffer(w.readframes(n), dtype=np.int16).astype(float) / 32768.0
    if len(voice) != int(total * SR):
        voice = np.interp(np.linspace(0, len(voice), int(total * SR)), np.arange(len(voice)), voice)
    voice *= 0.95 / max(1e-6, np.abs(voice).max())
    from gen_music import compose
    bed = compose("chill", 96, total, seed=5)[:, 0]
    bed = carve_bed(bed)
    bed *= 0.10 / max(1e-6, np.abs(bed).max())
    vmask = (np.abs(voice) > 0.02).astype(float)
    k = np.ones(int(0.25 * SR)) / int(0.25 * SR)
    vmask = np.convolve(vmask, k, mode="same")
    bed *= 1.0 - 0.65 * np.minimum(1, vmask * 3)
    mix = voice + bed
    mix *= 0.95 / max(1e-6, np.abs(mix).max())
    stereo = np.stack([mix, mix], 1)
    with wave.open("mix.wav", "wb") as out:
        out.setnchannels(2)
        out.setsampwidth(2)
        out.setframerate(SR)
        out.writeframes((stereo * 32767).astype(np.int16).tobytes())
    print(f"mix peak={float(np.abs(mix).max()):.3f} rms={float(np.sqrt((mix**2).mean())):.3f}", flush=True)

    def srt_ts(x):
        h, r = divmod(x, 3600)
        m, r = divmod(r, 60)
        s, ms = divmod(r, 1)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(ms*1000):03d}"

    with open("subtitles.srt", "w", encoding="utf-8") as f:
        for i, (a, b, tx) in enumerate(srt, 1):
            f.write(f"{i}\n{srt_ts(a)} --> {srt_ts(b)}\n{tx}\n\n")
    import json
    json.dump({"total": round(total, 2), "voice": "vachaspeech-clone", "music": "genmusic-chill",
               "cues": [{"i": i, "start": round(a, 3), "end": round(b, 3), "text": tx} for i, (a, b, tx) in enumerate(srt)]},
              open("timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote mix.wav subtitles.srt timing.json", flush=True)


if __name__ == "__main__":
    main()
