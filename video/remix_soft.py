"""Remix voice + NEW softer music bed. No TTS needed (uses existing cue wavs).
Run: python remix_soft.py  ->  mix2.wav per video folder."""
import os
import wave

import numpy as np

SR = 44100
BASE = os.path.dirname(os.path.abspath(__file__))

JEPQ = dict(dur=85.0, clips=[
    (0.0, "cue00_t"), (3.5, "cue01_t"), (7.0, "cue02"), (13.5, "cue03"),
    (20.0, "cue04"), (27.5, "cue05"), (35.0, "cue06"), (43.5, "cue07"),
    (52.0, "cue08"), (61.0, "cue09"), (70.0, "cue10_t")])
QQQI = dict(dur=105.0, clips=[
    (0.0, "qcue00"), (5.0, "qcue01"), (10.0, "qcue02"), (17.0, "qcue03"),
    (25.0, "qcue04"), (33.0, "qcue05"), (45.0, "qcue06"), (55.0, "qcue07"),
    (65.0, "qcue08"), (75.0, "qcue09"), (90.0, "qcue10"), (100.0, "qcue11")])


def read_mono(path):
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.int16).astype(float) / 32768.0
    m = np.abs(a) > 0.02
    if m.any():
        a = a[m.argmax():len(a) - m[::-1].argmax()]
    return a


def soft_music(dur):
    """Warm root+fifth pad, 4s fades, one-pole softening, very low level."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    chords = [(0, [110.0, 164.81, 220.0]),
              (21, [87.31, 130.81, 174.61]),
              (42, [98.0, 147.0, 196.0]),
              (63, [98.0, 146.83, 196.0])]
    if dur > 100:
        chords.append((84, [110.0, 164.81, 220.0]))
    sig = np.zeros(n)
    for ci, (st, fr) in enumerate(chords):
        en = chords[ci + 1][0] if ci + 1 < len(chords) else dur
        i0, i1 = int(st * SR), min(n, int(en * SR))
        seg = np.arange(i1 - i0) / SR
        tone = np.zeros_like(seg)
        for k, f in enumerate(fr):
            tone += (0.34 / (k + 1) ** 1.6) * np.sin(2 * np.pi * f * seg)
        fade = np.minimum(1, seg / 4.0) * np.minimum(
            1, (len(seg) - np.arange(len(seg))) / (4.0 * SR))
        sig[i0:i1] += tone * np.minimum(fade, 1.0)
    # one-pole lowpass soften
    y = np.zeros_like(sig)
    a = 0.06
    for i in range(1, len(sig)):
        y[i] = y[i - 1] + a * (sig[i] - y[i - 1])
    sig = 0.6 * y + 0.4 * sig
    sig *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.05 * t)
    sig *= 0.075 / max(1e-6, np.abs(sig).max())
    return np.stack([sig, sig], 1)


def remix(folder, spec):
    d = os.path.join(BASE, folder)
    total = int(spec["dur"] * SR)
    voice = np.zeros((total, 2))
    for st, name in spec["clips"]:
        a = read_mono(os.path.join(d, name + ".wav"))
        i0 = int(st * SR)
        i1 = min(total, i0 + len(a))
        voice[i0:i1, 0] += a[:i1 - i0]
        voice[i0:i1, 1] += a[:i1 - i0]
    voice *= 0.89 / max(1e-6, np.abs(voice).max())
    mix = voice + soft_music(spec["dur"])
    mix *= 0.95 / max(1e-6, np.abs(mix).max())
    out = wave.open(os.path.join(d, "mix2.wav"), "wb")
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(SR)
    out.writeframes((mix * 32767).astype(np.int16).tobytes())
    out.close()
    print(folder, "mix2.wav wrote", flush=True)


if __name__ == "__main__":
    remix("jepq", JEPQ)
    remix("qqqi", QQQI)
