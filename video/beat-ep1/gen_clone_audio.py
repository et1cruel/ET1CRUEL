"""EP3 voiceover v2: VachaSpeech clone of user's voice (ref.wav) + gTTS fallback.
Writes voiceover_v2/cueXX.wav + new mix.wav/subtitles.srt/timing.json (v1 backed up).
Run: python gen_clone_audio.py"""
import os
import shutil
import subprocess
import wave

import numpy as np

from gen_beat_audio import (CUES, DEMOS, GAP, STEP, KICK_STEPS, SNARE_STEPS,
                            HAT_STEPS, render_pattern, lofi_bed, kick, snare, hat,
                            SR, BPM)

HERE = os.path.dirname(os.path.abspath(__file__))
VO2 = os.path.join(HERE, "voiceover_v2")
REF = os.path.join(HERE, "..", "voice-clone", "ref.wav")
REF2 = os.path.join(HERE, "..", "voice-clone", "ref2.wav")
TAKES = 3


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


def main():
    os.makedirs(VO2, exist_ok=True)
    os.chdir(HERE)
    for f in ("mix.wav", "timing.json", "subtitles.srt"):
        if os.path.exists(f) and not os.path.exists(f.replace(".wav", "_v1.wav").replace(".json", "_v1.json").replace(".srt", "_v1.srt")):
            b = f.replace(".wav", "_v1.wav").replace(".json", "_v1.json").replace(".srt", "_v1.srt")
            shutil.copy(f, b)
            print(f"backup {f} -> {b}", flush=True)
    from vachaspeech import VachaSpeech
    print("loading VachaSpeech...", flush=True)
    tts = VachaSpeech()
    print("model loaded", flush=True)
    ref = REF2 if os.path.exists(REF2) else REF
    print(f"ref voice: {os.path.basename(ref)}", flush=True)
    from faster_whisper import WhisperModel
    import shutil
    import difflib
    wmodel = WhisperModel("large-v3", device="cpu", compute_type="int8")

    def transcribe(p):
        import subprocess as _sp
        q = os.path.join(VO2, "_score.wav")
        _sp.run(["ffmpeg", "-y", "-v", "error", "-i", p, "-ar", "16000", "-ac", "1", q], check=True)
        segs, _ = wmodel.transcribe(q, language="th", beam_size=3)
        return "".join(s.text for s in segs).strip()

    def score_take(p, expected):
        try:
            tx = transcribe(p)
        except Exception:
            return -1, ""
        a, b = expected.replace(" ", ""), tx.replace(" ", "")
        return difflib.SequenceMatcher(None, a, b).ratio(), tx

    clips = []
    for i, (sub, txt) in enumerate(CUES):
        wav = os.path.join(VO2, f"cue{i:02d}.wav")
        if not (os.path.exists(wav) and wav_dur(wav) > 0.5):
            best, best_score = None, -1
            for take in range(TAKES):
                tmp = wav + f".t{take}.wav"
                try:
                    codes = tts.generate(txt, gender="male", temperature=0.5)
                    tts.decode(codes, ref_audio=ref, output=tmp)
                    sc, tx = score_take(to_sr_wav(tmp), sub)
                    print(f"cue{i:02d} take{take} score={sc:.2f} :: {tx[:50]}", flush=True)
                except Exception as e:
                    print(f"cue{i:02d} take{take} FAIL ({str(e)[:80]})", flush=True)
                    continue
                if sc > best_score:
                    if best and os.path.exists(best):
                        os.remove(best)
                    best, best_score = tmp, sc
                elif os.path.exists(tmp):
                    os.remove(tmp)
            if best is None:
                print(f"cue{i:02d} all takes FAIL -> gTTS", flush=True)
                from gtts import gTTS
                mp3 = wav + ".mp3"
                gTTS(txt, lang="th").save(mp3)
                wav = to_sr_wav(mp3)
            else:
                if os.path.exists(wav):
                    os.remove(wav)
                shutil.move(best, wav)
                print(f"cue{i:02d} picked score={best_score:.2f}", flush=True)
        else:
            print(f"cue{i:02d} cached", flush=True)
        wav = to_sr_wav(wav) if wav.endswith(".wav") and not wav.endswith(".c.wav") else wav
        d = wav_dur(wav)
        clips.append((sub, wav, d, "clone" if "voiceover_v2" in wav and not wav.endswith(".mp3.c.wav") else "gtts"))
        print(f"cue{i:02d} dur={d:.2f}s", flush=True)
    t = 0.8
    events, srt = [], []
    for i, (sub, wav, d, eng) in enumerate(clips):
        events.append(("voice", i, t, t + d))
        srt.append((t, t + d, sub))
        t += d + GAP
        if i in DEMOS:
            kind, bars = DEMOS[i]
            dd = bars * 16 * STEP + 0.3
            events.append(("demo", kind, t, t + dd))
            t += dd + 0.4
    total = t + 1.2
    engs = sorted(set(e for _, _, _, e in clips))
    print(f"total={total:.1f}s engines={engs}", flush=True)
    voice = np.zeros(int(total * SR))
    for kind, i, a, b in events:
        if kind != "voice":
            continue
        a_sig = read_trim(clips[i][1])
        i0 = int(a * SR)
        i1 = min(len(voice), i0 + len(a_sig))
        voice[i0:i1] += a_sig[:i1 - i0]
    voice *= 0.89 / max(1e-6, np.abs(voice).max())

    def centroid(x):
        sp = np.abs(np.fft.rfft(x * np.hanning(len(x))))
        fr = np.fft.rfftfreq(len(x), 1 / SR)
        return float((sp * fr).sum() / max(1e-9, sp.sum()))

    print(f"voice pre-clarity centroid={centroid(voice):.0f}Hz", flush=True)
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
    print(f"voice post-clarity centroid={centroid(voice):.0f}Hz peak={float(np.abs(voice).max()):.3f}", flush=True)
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
    vmask = (np.abs(voice) > 0.02).astype(float)
    k = np.ones(int(0.25 * SR)) / int(0.25 * SR)
    vmask = np.convolve(vmask, k, mode="same")
    music *= 1.0 - 0.65 * np.minimum(1, vmask * 3)
    mix = voice + drums * 0.9 + music
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
    json.dump({"bpm": BPM, "total": round(total, 2), "engines": engs,
               "voice": "vachaspeech-clone(ref.wav)",
               "cues": [{"i": i, "start": round(a, 3), "end": round(b, 3), "text": tx} for i, (a, b, tx) in enumerate(srt)],
               "demos": [{"pattern": kk, "start": round(a, 3), "end": round(b, 3)} for k, kk, a, b in events if k == "demo"]},
              open("timing.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote mix.wav subtitles.srt timing.json", flush=True)


if __name__ == "__main__":
    main()
