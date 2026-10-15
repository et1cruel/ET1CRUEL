"""VachaSpeech clone test: 1 sentence in user's voice."""
import os
import wave

from vachaspeech import VachaSpeech

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "ref.wav")

print("loading model...", flush=True)
tts = VachaSpeech()
print("model loaded", flush=True)
text = "สวัสดีครับ ผมอีทีวันครูเอล"
codes = tts.generate(text, gender="male")
print(f"codes={len(codes)}", flush=True)
out = os.path.join(HERE, "clone-test.wav")
tts.decode(codes, ref_audio=REF, output=out)
with wave.open(out, "rb") as w:
    print(f"clone-test dur={w.getnframes() / w.getframerate():.2f}s", flush=True)
print("DONE", flush=True)
