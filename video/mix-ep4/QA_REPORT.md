# QA REPORT · EP4 มิกซ์บีทหลังทำเสร็จ (14 ต.ค. 2026)

## ไฟล์ส่งมอบ (มีอยู่จริง)

- `video/mix-ep4/mix-ep4.mp4` — 38s · 1080×1920 · 30fps · h264+aac · faststart
- `video/mix-ep4/subtitles.srt` — 9 cues จาก duration เสียงจริง
- `SCRIPT.md` + `STORYBOARD.md` + `BRIEF.md` + `thumb-mix.jpg`
- ต้นฉบับ: `gen_mix_audio.py` + `words_mix.py` + `qa_words.py` + `render_mix.py` + `mix.wav` + `timing.json` + `words.json`

## Voice QA (โคลนเจ้าของ + Whisper audit ทุก cue)

| cue | match | หมายเหตุ |
|---|---|---|
| 0–5,7 | 0.87–0.97 | ผ่าน (ส่วนต่างเป็น transliteration ของ Whisper: บิด/บีท, แสนว์/สแนร์) |
| 1,6 | 0.83–0.90 | ผ่านหลังแก้คำ (สมดุล→ลงตัว, โถง→ใหญ่) |
| 8 | 0.73 | ผ่านแบบมีเงื่อนไข — ตัดชื่อแบรนด์ออกจากเสียง (โคลนอ่าน E-T-1 เพี้ยน) ชื่ออยู่บน end card แทน |

- ซับคาราโอเกะใช้**คำจากสคริปต์** (ไม่ใช้คำ Whisper) — จอไม่มีวันโชว์คำผิด
- [!] ต้องมีเจ้าของฟังจริงก่อนเผยแพร่

## Audio QA (hyperframes-audio: carve + clarity)

- [x] carve max-cut -19.8dB min-gain 0.102 (ไม่ติดลบ — แก้บั๊กแล้ว)
- [x] voice chain: highpass + presence + loudnorm · duck หลบเสียงพูด
- [x] ดนตรี compose เอง (genmusic-chill) · peak 0.95 ไม่แตก

## Visual QA

- [x] ฉากมิกเซอร์ 9 ฉากตรง cue · karaoke ทองเด้งตามคำ (ดูเฟรมจริง)
- [x] ป้าย honesty โผล่แค่ hook · end card ET1CRUEL/MIX SMART
- [ ] NOT TESTED: เปิดบนมือถือจริง · ปุ่มส่งเข้า Agency บนเบราว์เซอร์จริง

## License

- สร้างใหม่ทั้งหมด · ฟอนต์ระบบ · หลักมิกซ์พื้นฐานสากล
