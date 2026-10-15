# QA REPORT · EP3 เริ่มทำบีทใน FL Studio จากศูนย์ (14 ต.ค. 2026, v3 กระชับ+ชัด)

## ไฟล์ส่งมอบ (มีอยู่จริง)

- `video/beat-ep1/beat-ep1.mp4` — 93.21s · 1080×1920 · 30fps · h264+aac · ~15MB · faststart
- `video/beat-ep1/subtitles.srt` — 16 cues ต่อเนื่อง ไม่ทับซ้อน สร้างจาก duration เสียงจริง
- `video/beat-ep1/SCRIPT_TH.md` · `thumb-beat.jpg` · `QA_REPORT.md`
- ต้นฉบับ: `gen_clone_audio.py` + `render_beat.py` + `mix.wav` + `timing.json` + `subs.ass` (+ `_v1` backup ของรอบ gTTS)

## Voice v2 — เสียงโคลนเจ้าของ (VachaSpeech + ref.wav 32s)

- [x] clone สำเร็จ 16/16 cues (engines=['clone'], fallback 0 ครั้ง) · test 1 ประโยค peak 0.8/RMS ปกติ
- [x] v3: สคริปต์ตัดสั้น 10 cues + GAP 0.35 + temperature 0.6 (total 111→93s)
- [x] clarity chain: highpass 75Hz + presence 3kHz + loudnorm -16 LUFS (centroid เสียง 1434→1678Hz)
- [!] prosody = ลักษณะเสียงตาม ref — **ต้องมีเจ้าของฟังจริงก่อนเผยแพร่** (ความตื่นเต้น/จังหวะฟังแล้วค่อยตัดสิน)

## Motion v2 (ดูเฟรมจริง: wipe @12s, grid+meters @50s, groove/save/recap/end รอบก่อน)

- [x] wipe เปลี่ยนซีน (แถบกระดาษขอบแดง) · halftone dots · dust · สติกเกอร์ดาว
- [x] waveform meters ขอบจอเต้นตาม energy เสียงจริง (ไม่ใช่ลูปหลอก)
- [x] แก้บั๊ก scene เลื่อน + ทับซ้อนครบ (ตรวจเฟรมยืนยันรอบก่อน)

## ไฟล์ส่งมอบ (มีอยู่จริง)

- `video/beat-ep1/beat-ep1.mp4` — 111.29s · 1080×1920 · 30fps · h264+aac · ~20MB · faststart
- `video/beat-ep1/subtitles.srt` — 16 cues ต่อเนื่อง ไม่ทับซ้อน สร้างจาก duration เสียงจริง
- `video/beat-ep1/SCRIPT_TH.md` — สคริปต์ + storyboard
- `video/beat-ep1/thumb-beat.jpg` — poster (ดึงจากวิดีโอจริง @60s)
- `video/beat-ep1/mix.wav` + `timing.json` + `subs.ass` — ต้นฉบับสร้างซ้ำได้

## Visual QA (ดูเฟรมจริง 8 จุด: 4/20/40/75/90/100/108/118/119)

- [x] สะกดถูก, college-art คุมโทนครีม/ดำ/น้ำเงิน/เหลือง/แดงเฉพาะจุด
- [x] Grid ตรงเสียง: kick [1,5,9,13] / snare [5,13] / hat คู่ — playhead วิ่งตามเสียงจริง
- [x] ไม่มี UI ปลอมเป็น FL Studio — มีป้าย "แผนภาพกริด ไม่ใช่หน้าจอจริง" + "ภาพประกอบเพื่อการสอน"
- [x] แก้บั๊ก scene เลื่อน (groove/save/recap เคยโผล่ผิดช่วง) + ทับซ้อน STEP/KICK + overlay ทับการ์ด — ตรวจเฟรมยืนยันแล้ว
- [x] End card ET1CRUEL + fade ถูกต้อง

## Voice QA (วิเคราะห์ไฟล์ ไม่ได้ฟังด้วยหู)

- [x] 16 cues ครบ, peak 0.95 (ไม่แตก), RMS 0.073, slot ตรงเสียงจริงทุก cue
- [x] ศัพท์ดนตรี respell สำหรับ TTS (เอฟแอลสตูดิโอ/บี-พี-เอ็ม/คิก/สแนร์/ไฮแฮต…)
- [!] engine = VachaSpeech clone เสียงเจ้าของ (edge-tts โดน Microsoft บล็อก 403) — **ต้องมีเจ้าของฟังจริงก่อนเผยแพร่**

## Subtitle QA

- [x] ตรงสคริปต์เสียงทุก cue · timestamp จากเสียงจริง (ไม่ใช่สุ่ม) · ซับฝัง + ไฟล์แยก
- [x] ฟอนต์ Tahoma ตัดขอบ อ่านชัดบนกระดาษครีม (ดูจากเฟรมจริง)

## Audio QA

- [x] ดนตรี lo-fi compose เอง (Fmaj7–Em7–Dm7–Cmaj7 + vinyl) — ไม่มีปัญหาลิขสิทธิ์
- [x] ducking หลบเสียงพูด · fade หัวท้าย · ไม่มี vocal ชน
- [x] กลอง synth เอง 90 BPM ตรง grid

## Final Render QA

- [x] เปิดเล่นได้ · 111.29s · เสียงภาพตรง (voice slot = SRT = ASS)
- [x] ห้อง Genvideo มีการ์ด EP3 + ปุ่ม Agency · sitemap อัปเดต · Agency นำเข้า EP3 ได้
- [ ] **NOT TESTED**: ฟังเสียงพากย์ด้วยหู · เปิดบนมือถือจริง · เทสต์ปุ่มส่งเข้า Agency บนเบราว์เซอร์จริง

## License

- โค้ด/เสียง/ดนตรี/ภาพ: สร้างใหม่ทั้งหมดในรอบนี้ (ไม่มี asset ภายนอก) · ฟอนต์ระบบ Tahoma/Arial
- เนื้อหา FL Studio: ตรวจจาก FL Studio Online Manual (Image-Line) แล้ว
