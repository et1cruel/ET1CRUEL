"""Thai voiceover (edge-tts Premwadee) + soothing music bed, mixed to SRT slots.
Run: python gen_audio.py  ->  mix.wav (44.1k stereo) + prints fit table."""
import asyncio
import os
import subprocess
import wave

import numpy as np

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = "th-TH-PremwadeeNeural"
SR = 44100

# (start_sec, text) — matches subtitles.srt
CUES = [
    (0.0, "เห็น ETF ที่จ่ายเงินทุกเดือน แล้วคิดว่าเป็นเครื่องผลิตเงินเหรอ?"),
    (3.5, "มาดู JEPQ กันก่อน ว่ามันคืออะไรกันแน่"),
    (7.0, "JEPQ คือ ETF ของ JPMorgan เริ่มปี 2022 ลงทุนหุ้นแนสแดก 100"),
    (13.5, "เป้าหมายคือรายได้รายเดือน ที่ผันผวนน้อยกว่าตลาด"),
    (20.0, "รายได้มาจากสองทาง ปันผลหุ้น กับค่าพรีเมียมจากออปชัน"),
    (27.5, "ย้อนหลัง พรีเมียมเฉลี่ยปีละ 10.29% ปันผล 0.61% ยอดจ่ายเปลี่ยนได้ทุกเดือน"),
    (35.0, "ข้อแลกคือ ตลาดขึ้นแรง กองทุนอาจขึ้นไม่เต็ม เพราะขายสิทธิบางส่วนไปแล้ว"),
    (43.5, "ไตรมาส 2 ปี 2026 กองทุนบวก 14% ขณะที่ตลาดบวก 28% และขาลงก็ยังขาดทุนได้"),
    (52.0, "อย่าดูแค่เงินที่ได้ ต้องดูผลตอบแทนรวมทั้งก้อน"),
    (61.0, "ค่าธรรมเนียม 0.35% ต่อปี บวกภาษีเงินปันผล อย่าลืมหักออก"),
    (70.0, "JEPQ คือเครื่องมือสร้างรายได้ที่มีความเสี่ยง ไม่ใช่เงินเดือนการันตี "
            "ศึกษาข้อมูลกองทุนก่อนลงทุนเสมอ ET1CRUEL"),
]
ENDS = [3.5, 7.0, 13.5, 20.0, 27.5, 35.0, 43.5, 52.0, 61.0, 70.0, 85.0]


async def make_clip(i, text):
    out = os.path.join(HERE, f"cue{i:02d}.mp3")
    if os.path.exists(out) and os.path.getsize(out) > 1024:
        return out
    for attempt in range(8):
        try:
            if os.path.exists(out):
                os.remove(out)
            pr = await asyncio.create_subprocess_exec(
                "python", "-m", "edge_tts", "--voice", VOICE,
                "--text", text, "--write-media", out)
            await pr.wait()
            if os.path.exists(out) and os.path.getsize(out) > 1024:
                await asyncio.sleep(15)
                return out
        except Exception:
            pass
        await asyncio.sleep(15 * (attempt + 1))
    raise RuntimeError(f"TTS failed for cue {i} after retries")


def mp3_to_wav(mp3):
    wav = mp3.replace(".mp3", ".wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", mp3, "-ar", str(SR),
                    "-ac", "1", wav], check=True)
    return wav


def wav_dur(path):
    with wave.open(path, "rb") as w:
        return w.getnframes() / w.getframerate()


def read_mono(path):
    with wave.open(path, "rb") as w:
        n, sr = w.getnframes(), w.getframerate()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.int16).astype(float) / 32768.0
    if sr != SR:  # resample fallback (should not happen)
        a = np.interp(np.linspace(0, len(a), int(len(a) * SR / sr)),
                      np.arange(len(a)), a)
    # trim leading/trailing silence
    m = np.abs(a) > 0.02
    if m.any():
        a = a[m.argmax():len(a) - m[::-1].argmax()]
    return a


def atempo(wav_in, factor):
    wav_out = wav_in.replace(".wav", "_t.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", wav_in,
                    "-filter:a", f"atempo={factor:.3f}", wav_out], check=True)
    return wav_out


def soothing_music(dur=85.0):
    """Warm Am-F-C-G pad, slow attack, mellow highs. Peak ~-21dB."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    chords = [  # (start, [freqs])
        (0, [110.0, 164.81, 220.0, 261.63]),     # Am
        (21, [87.31, 130.81, 174.61, 220.0]),    # F
        (42, [98.0, 130.81, 164.81, 196.0]),     # C/G
        (63, [98.0, 146.83, 196.0, 246.94]),     # G
        (77, [110.0, 164.81, 220.0, 261.63]),    # Am outro
    ]
    sig = np.zeros(n)
    for ci, (st, fr) in enumerate(chords):
        en = chords[ci + 1][0] if ci + 1 < len(chords) else dur
        i0, i1 = int(st * SR), int(en * SR)
        seg = np.arange(i1 - i0) / SR
        tone = np.zeros_like(seg)
        for k, f in enumerate(fr):
            tone += (0.30 / (k + 1)) * np.sin(2 * np.pi * f * seg)
        fade = np.minimum(1, seg / 2.5) * np.minimum(1, (len(seg) - np.arange(len(seg))) / (2.5 * SR))
        fade = np.minimum(fade, 1.0)
        tone *= fade
        sig[i0:i1] += tone[:i1 - i0]
    sig *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t)  # slow breathing swell
    sig *= 0.09 / max(1e-6, np.abs(sig).max())
    return np.stack([sig, sig], 1)


async def main():
    os.chdir(HERE)
    clips = []
    for i, (st, tx) in enumerate(CUES):
        mp3 = await make_clip(i, tx)
        wav = mp3_to_wav(mp3)
        d = wav_dur(wav)
        slot = ENDS[i] - st - 0.15
        print(f"cue{i:02d} dur={d:.2f}s slot={slot:.2f}s "
              f"{'OK' if d <= slot else 'OVERFLOW'}", flush=True)
        if d > slot:
            wav = atempo(wav, min(1.15, d / slot))
            print(f"  -> atempo {min(1.15, d / slot):.3f}, new={wav_dur(wav):.2f}s",
                  flush=True)
        clips.append((st, wav))
    total = int(85.0 * SR)
    voice = np.zeros((total, 2))
    for st, wav in clips:
        a = read_mono(wav)
        i0 = int(st * SR)
        i1 = min(total, i0 + len(a))
        voice[i0:i1, 0] += a[:i1 - i0]
        voice[i0:i1, 1] += a[:i1 - i0]
    voice *= 0.89 / max(1e-6, np.abs(voice).max())
    music = soothing_music()
    mix = voice + music
    mix *= 0.95 / max(1e-6, np.abs(mix).max())
    out = wave.open("mix.wav", "wb")
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(SR)
    out.writeframes((mix * 32767).astype(np.int16).tobytes())
    out.close()
    print("wrote mix.wav", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
