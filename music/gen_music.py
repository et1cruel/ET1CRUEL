"""GenMusic local engine: tag-driven numpy composer (original, no license issues).
moods: lofi / chill / traplite. Run: python gen_music.py  ->  music/*.mp3 + tracks.json"""
import json
import os
import subprocess
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100


def env_ad(n, a=0.01, r=0.08):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1 / SR)) * np.exp(-t / max(r, 1 / SR))


def kick(dur=0.3):
    t = np.arange(int(dur * SR)) / SR
    f = 55 + 100 * np.exp(-t * 30)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.exp(-t * 10)


def hat808(dur=0.05):
    t = np.arange(int(dur * SR)) / SR
    n = np.random.default_rng(21).standard_normal(len(t))
    return (n - np.concatenate([[0], n[:-1]])) * np.exp(-t * 90) * 0.35


def bass808(freq, dur=0.4):
    t = np.arange(int(dur * SR)) / SR
    f = freq * (1 + 0.8 * np.exp(-t * 25))
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.exp(-t * 5) * 0.8


def pad_chord(freqs, n, attack=2.0):
    s = np.arange(n) / SR
    tone = sum((0.3 / (k + 1)) * np.sin(2 * np.pi * f * s) for k, f in enumerate(freqs))
    fade = np.minimum(1, s / attack) * np.minimum(1, (n / SR - s) / attack)
    return tone * fade


def vinyl(n, seed=5):
    crack = (np.random.default_rng(seed).random(n) < 0.0004).astype(float)
    return crack * np.random.default_rng(seed + 1).standard_normal(n) * 0.05


def compose(mood, bpm, dur, seed=1):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    sig = np.zeros(n)
    beat = 60.0 / bpm

    def add(smp, sec):
        i0 = int(sec * SR)
        i1 = min(n, i0 + len(smp))
        if i0 < n:
            sig[i0:i1] += smp[:i1 - i0]

    if mood == "lofi":
        prog = [[87.31, 130.81, 164.81, 220.0], [82.41, 123.47, 164.81, 196.0],
                [73.42, 146.83, 174.61, 220.0], [65.41, 130.81, 164.81, 196.0]]
        seg = dur / 4
        for ci, fr in enumerate(prog):
            m = int(min(dur, (ci + 1) * seg) * SR) - int(ci * seg * SR)
            add(pad_chord(fr, m), ci * seg)
        hh = hat808()
        i = 0
        while i < n:
            add(hh * 0.7, i / SR)
            i += int(beat / 2 * SR)
        add(vinyl(n), 0)
        sig *= 0.12 / max(1e-6, np.abs(sig).max())
    elif mood == "chill":
        prog = [[110.0, 164.81, 220.0, 261.63], [87.31, 130.81, 174.61, 220.0],
                [98.0, 146.83, 196.0, 246.94], [98.0, 130.81, 164.81, 196.0]]
        seg = dur / 4
        for ci, fr in enumerate(prog):
            m = int(min(dur, (ci + 1) * seg) * SR) - int(ci * seg * SR)
            add(pad_chord(fr, m, attack=1.2), ci * seg)
        penta = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0]
        nb = int(dur / beat)
        for b in range(nb):
            if rng.random() < 0.6:
                f = penta[rng.integers(len(penta))]
                t = np.arange(int(0.5 * SR)) / SR
                pluck = np.sin(2 * np.pi * f * t) * np.exp(-t * 6) * 0.5
                add(pluck, b * beat + (0.5 * beat if rng.random() < 0.3 else 0))
        sig *= 0.12 / max(1e-6, np.abs(sig).max())
    elif mood == "traplite":
        roots = [55.0, 55.0, 65.41, 49.0]
        seg = dur / 4
        for ci, fr in enumerate(roots):
            for b in range(int(seg / beat)):
                if b % 2 == 0:
                    add(bass808(fr, 0.45), ci * seg + b * beat)
                if b % 4 == 3:
                    add(bass808(fr * 1.5, 0.2), ci * seg + b * beat + beat / 2)
        hh = hat808()
        step = beat / 2
        i, k = 0, 0
        while i < n:
            add(hh * (1.4 if k % 7 == 6 else 0.8), i / SR)
            k += 1
            i += int(step * SR)
        add(pad_chord([110.0, 130.81, 164.81], n, attack=3.0) * 0.5, 0)
        sig *= 0.14 / max(1e-6, np.abs(sig).max())
    else:
        raise ValueError("mood must be lofi/chill/traplite")
    # fade in/out 1.5s
    f = int(1.5 * SR)
    sig[:f] *= np.linspace(0, 1, f)
    sig[-f:] *= np.linspace(1, 0, f)
    return np.stack([sig, sig], 1)


STARTERS = [
    ("lofi-night-60", "lofi", 84, 60, "Lo-fi กลางคืน โฟกัส/อ่านหนังสือ", 11),
    ("chill-morning-60", "chill", 96, 60, "ชิลยามเช้า สดใส เมโลดี้เพนตา", 22),
    ("traplite-dark-60", "traplite", 140, 60, "แทรปดาร์ก 808 หนัก เหมาะทำบีทท็อป", 33),
]


def main():
    os.makedirs(HERE, exist_ok=True)
    os.chdir(HERE)
    tracks = []
    for name, mood, bpm, dur, desc, seed in STARTERS:
        wav, mp3 = name + ".wav", name + ".mp3"
        if not os.path.exists(mp3):
            st = compose(mood, bpm, dur, seed)
            with wave.open(wav, "wb") as out:
                out.setnchannels(2)
                out.setsampwidth(2)
                out.setframerate(SR)
                out.writeframes((st * 32767).astype(np.int16).tobytes())
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", wav,
                            "-c:a", "libmp3lame", "-b:a", "128k", mp3], check=True)
            print(f"made {mp3}", flush=True)
        tracks.append({"id": name, "mood": mood, "bpm": bpm, "dur": dur,
                       "desc": desc, "file": "music/" + mp3, "engine": "genmusic-numpy"})
    json.dump(tracks, open("tracks.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote tracks.json", flush=True)


if __name__ == "__main__":
    main()
