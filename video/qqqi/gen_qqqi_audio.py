"""QQQI Thai voiceover (edge-tts Premwadee, slow pacing) + mix under lo-fi bed.
Run: python gen_qqqi_audio.py  ->  mix.wav + fit table."""
import asyncio
import os
import subprocess
import wave

import numpy as np

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = "th-TH-NiwatNeural"
SR = 44100

CUES = [
    (0.0, "รับเงินทุกเดือน... แล้วเงินต้นล่ะ?"),
    (5.0, "QQQI หรือคิวคิวคิวไอ คืออะไร มาดูกัน"),
    (10.0, "QQQI คือ ETF ของ NEOS เริ่มปี 2024 ลงทุนหุ้นแนสแดก 100"),
    (17.0, "บวกกลยุทธ์ออปชันแบบใช้ข้อมูล ทั้งขายและซื้อ เพื่อลุ้นตลาดขึ้นด้วย"),
    (25.0, "รายได้มาจากหุ้น ออปชัน และส่วนที่อาจเป็นการคืนเงินต้น"),
    (33.0, "อัตราจ่าย 14.28% ต่อปี ณ กันยายน 2026 แต่ยอดเปลี่ยนทุกเดือน ไม่ใช่กำไรการันตี"),
    (45.0, "ข้อแลกคือ ตลาดขึ้นแรงอาจได้ไม่เต็ม 1 ปีกองทุนบวก 18% ตลาดบวก 24%"),
    (55.0, "ตลาดลงก็ขาดทุนได้ แถมค่าธรรมเนียม 0.68% ต่อปี"),
    (65.0, "เงินที่จ่ายอาจมีส่วนคืนเงินต้น ต้องดูเอกสารแยกประเภททุกเดือน"),
    (75.0, "อย่าดูแค่อัตราจ่าย ดูผลตอบแทนรวม ราคา ค่าธรรมเนียม และภาษีของตัวเอง"),
    (90.0, "เข้าใจเงินที่ได้รับ เข้าใจความเสี่ยงที่รับ แล้วค่อยตัดสินใจลงทุน"),
    (100.0, "ET1CRUEL invest with understanding"),
]
ENDS = [5.0, 10.0, 17.0, 25.0, 33.0, 45.0, 55.0, 65.0, 75.0, 90.0, 100.0, 105.0]


# TTS-only respellings (subs keep standard written forms)
TTS_OVERRIDE = {
    2: "คิวคิวคิวไอ คืออะไร มาดูกัน",
    3: "คิวคิวคิวไอ คือ อีทีเอฟ ของ นีออส เริ่มปี สองพันยี่สิบสี่ ลงทุนหุ้นแนสแดก หนึ่งร้อย",
    6: "อัตราจ่าย สิบสี่จุดสองแปดเปอร์เซ็นต์ ต่อปี ณ กันยายน สองพันยี่สิบหก แต่ยอดเปลี่ยนทุกเดือน ไม่ใช่กำไรการันตี",
    7: "ข้อแลกคือ ตลาดขึ้นแรงอาจได้ไม่เต็ม หนึ่งปีกองทุนบวก สิบแปดเปอร์เซ็นต์ ตลาดบวก ยี่สิบสี่เปอร์เซ็นต์",
    8: "ตลาดลงก็ขาดทุนได้ แถมค่าธรรมเนียม ศูนย์จุดหกแปดเปอร์เซ็นต์ ต่อปี",
}


async def make_clip(i, text):
    text = TTS_OVERRIDE.get(i, text)
    out = os.path.join(HERE, f"qcue{i:02d}.mp3")
    if os.path.exists(out) and os.path.getsize(out) > 1024:
        return out
    for attempt in range(6):
        try:
            if os.path.exists(out):
                os.remove(out)
            pr = await asyncio.create_subprocess_exec(
                "python", "-m", "edge_tts", "--voice", VOICE,
                "--text", text, "--write-media", out)
            await pr.wait()
            if os.path.exists(out) and os.path.getsize(out) > 1024:
                await asyncio.sleep(20)
                return out
        except Exception:
            pass
        await asyncio.sleep(20 * (attempt + 1))
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
        n = w.getnframes()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.int16).astype(float) / 32768.0
    m = np.abs(a) > 0.02
    if m.any():
        a = a[m.argmax():len(a) - m[::-1].argmax()]
    return a


def atempo(wav_in, factor):
    wav_out = wav_in.replace(".wav", "_t.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", wav_in,
                    "-filter:a", f"atempo={factor:.3f}", wav_out], check=True)
    return wav_out


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
            print(f"  -> atempo, new={wav_dur(wav):.2f}s", flush=True)
        clips.append((st, wav))
    total = int(105.0 * SR)
    voice = np.zeros((total, 2))
    for st, wav in clips:
        a = read_mono(wav)
        i0 = int(st * SR)
        i1 = min(total, i0 + len(a))
        voice[i0:i1, 0] += a[:i1 - i0]
        voice[i0:i1, 1] += a[:i1 - i0]
    voice *= 0.89 / max(1e-6, np.abs(voice).max())
    with wave.open("music.wav", "rb") as w:
        n = w.getnframes()
        music = np.frombuffer(w.readframes(n), dtype=np.int16).astype(float) / 32768.0
    music = music.reshape(-1, 2)[:total]
    if len(music) < total:
        music = np.pad(music, ((0, total - len(music)), (0, 0)))
    music *= 0.5  # duck under voice
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
