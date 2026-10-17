# MUSIC ROOM — Design (2026-10-16)

## Intent & why
เจ้าของ (et1cruel: เทค + ศิลปินอิสระสาย ambient/cloud rap) อยากมีห้องที่ "กลับมาสนุกกับเพลงได้ทันที" โดยไม่มีอะไรมารอทวง — ไม่ใช่ศาลความทรงจำ ไม่ใช่แดชบอร์ดยอดวิว
(เจ้าของตัดสินใจ: ไม่ต้องการอะไรรออยู่ แค่อยากสนุกอีกครั้ง + ย้ายบันทึก 3 ข้อจากรูปเข้าเป็นข้อมูลจริงตั้งต้น)

## Goals
- ประตูเข้า: ENTER MY MUSIC ROOM / I JUST WANT TO LISTEN (ไม่มีเสียงออโต้ ข้าม intro ได้ จำว่าเคยเข้าแล้ว)
- Origin Archive: ฟอร์มแก้ไขได้ทีละคำถาม + จดหมายสำคัญ + seed 3 ข้อความจริงจากรูปเจ้าของ
- Sound Universe: ศิลปิน/เพลง/เสียงที่ชอบ + tags เพิ่มลบได้ + THE SOUND I AM SEARCHING FOR
- Music Archive: งานจริงเท่านั้น (ดึง tracks.json ที่มี + เพิ่มลิงก์/ไฟล์; ไฟล์เสียงเล่นผ่าน audio tag ถ้ามี ไม่มีห้ามโชว์ว่าเล่นได้) + Timeline + LISTEN TO WHO I WAS
- Sanctuary: One Sound prompt + ตัวจับเวลา 15 นาที (optional) + sound diary + imperfect ideas (Resting/Maybe Later/Still Curious/Needs Another Day/Archived with Love) — ห้าม streak/ลงโทษ
- Letters: เขียน + วันเปิดอ่าน + เวลา Asia/Bangkok + เปิดเองได้เสมอ
- Compass: คำถาม 10 ข้อ + สรุปภาพสะท้อน (ระบุว่าเป็นภาพชั่วคราว)
- Listening Space: playlist (tracks.json + เพิ่มเอง) + เครื่องเล่นเรียบง่าย + ambient drone generator (Web Audio, มีปุ่มเปิดปิดชัด, ไม่ใช่เพลงเจ้าของ)
- Return: ปุ่มลอยในห้อง + เมนู 7 ทางตามสเปก (ข้อ 7 มีข้อความปลอบ)
- Notes/Daily: daily entry 6 ข้อ + วันพักได้ไม่มีผลลบ
- Connections: ผู้ใช้เขียนเองว่าแต่ละด้านสนับสนุนกันอย่างไร (ไม่ตัดสิน)
- Export JSON/MD + import + ลบมี confirm; ปิดท้ายด้วยประโยค allowed-to-become + ปุ่ม OPEN A SOUND
- เชื่อม index nav/explore + sitemap + SW

## Non-goals / Anti-goals
- ไม่มีคะแนน streak อันดับ เปรียบเทียบศิลปิน
- ไม่มีข้อความกดดัน/ทวงบุญคุณ ("ทิ้งฝัน", "เสียเวลา")
- ไม่แต่งความทรงจำ/เพลง/เหตุการณ์แทนเจ้าของ — ว่างคือว่าง
- ไม่เปิดเสียงอัตโนมัติ ไม่ใช้ไมค์ ไม่ใช้เพลงคนอื่นโดยไม่มีสิทธิ์

## Constraints (ของเดิม)
- Static + vanilla + localStorage (`et1cruel.musicroom.v1`), งบ 0, ไม่ส่งข้อมูลออก, ห้าม push อัตโนมัติ
- ไฟล์เสียงใหญ่ห้ามลง localStorage (เก็บ metadata + object URL ชั่วคราว); เตือนว่าข้อมูลเบราว์เซอร์หายได้ถ้าล้างเว็บ
- ปุ่ม Return ทุกหน้าเว็บ = ไม่ทำ (แตะทุกไฟล์เสี่ยง); ทดแทนด้วยลิงก์ nav + ปุ่มลอยในห้อง (my call — ค้านได้)

## Builder calls
- ไฟล์: `music-room.html` + `js/music-room-data.js` (seed 3 ข้อความจริง + tags + คำถาม) + `js/music-room-app.js`
- ธีม dark intimate (ดำ/ม่วงฝุ่น/เงิน) + grain เบา (CSS) + reduced-motion respected
- Seed 3 ข้อความถอดจากรูปเจ้าของตามตัวอักษรที่อ่านได้ ติดป้าย user-provided
