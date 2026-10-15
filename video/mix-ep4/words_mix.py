"""EP4 word timings: faster-whisper word_timestamps per cue -> words.json.
Karaoke sync = cue slot start + (word time - trim offset). Run after gen_mix_audio.
Usage: python words_mix.py"""
import glob
import json
import os
import subprocess
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100


def load16(f):
    w = os.path.join(HERE, "qw.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f, "-ar", "16000",
                    "-ac", "1", w], check=True)
    with wave.open(w, "rb") as x:
        n = x.getnframes()
        raw = x.readframes(n)
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def trim_offset(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(float) / 32768.0
    m = np.abs(a) > 0.02
    if not m.any():
        return 0.0
    idx = m.argmax()
    return idx / w.getframerate()


def main():
    os.chdir(HERE)
    from faster_whisper import WhisperModel
    m = WhisperModel("large-v3", device="cpu", compute_type="int8")
    timing = json.load(open("timing.json", encoding="utf-8"))
    out = []
    for c in timing["cues"]:
        f = os.path.join(HERE, "voiceover", f"cue{c['i']:02d}.wav.c.wav")
        if not os.path.exists(f):
            f = os.path.join(HERE, "voiceover", f"cue{c['i']:02d}.wav.mp3.c.wav")
        off = trim_offset(f)
        segs, _ = m.transcribe(load16(f), language="th", beam_size=5, word_timestamps=True)
        words = []
        for s in segs:
            for w in (s.words or []):
                words.append({"w": w.word.strip(), "a": round(c["start"] + max(0, w.start - off), 3),
                              "b": round(c["start"] + max(0, w.end - off), 3)})
        words = [x for x in words if x["w"]]
        out.append({"i": c["i"], "words": words})
        print(f"cue{c['i']:02d} words={len(words)}", flush=True)
    json.dump(out, open("words.json", "w", encoding="utf-8"), ensure_ascii=False)
    print("wrote words.json", flush=True)


if __name__ == "__main__":
    main()
