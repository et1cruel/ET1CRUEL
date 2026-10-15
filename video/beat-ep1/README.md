# EP3 · เริ่มทำบีทใน FL Studio จากศูนย์

วิดีโอสอนทำบีท ~2 นาที (1080×1920 30fps) — พากย์ไทย + ซับไทย + ดนตรี lo-fi ที่ compose เอง + เสียงกลอง synth ตรง grid ทุก step

## วิธีสร้างซ้ำ

```
python gen_beat_audio.py   # TTS + กลอง + ดนตรี + mix.wav + subtitles.srt + timing.json
python render_beat.py      # PIL scenes + burn subs + beat-ep1.mp4 + thumb
```

- TTS: VachaSpeech โคลนเสียงเจ้าของ (ref.wav) — edge-tts โดนบล็อก 403, gTTS เป็น fallback ในโค้ด
- เครื่องมือ: Python + numpy + pillow + edge-tts/gTTS + ffmpeg (libass)
- ฟอนต์: PIL = Arial (เลข/อังกฤษ), ซับ burn = Tahoma

## ไฟล์ส่งมอบ

`beat-ep1.mp4` · `subtitles.srt` · `SCRIPT_TH.md` · `thumb-beat.jpg` · `QA_REPORT.md`

## ข้อจำกัดที่รู้

- เสียงพากย์ gTTS (โมโนโทน) — ต้องมีคนฟังจริงก่อนเผยแพร่
- ภาพ FL Studio เป็นแผนภาพประกอบ ไม่ใช่ screenshots จริง
- ข้อเท็จจริงตรวจจาก FL Studio Online Manual (Image-Line) แล้ว
