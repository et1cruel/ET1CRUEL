# MUSIC ROOM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างห้องดนตรีส่วนตัว (music-room.html) ให้กลับมาสนุกกับเพลงได้ทันที พร้อม archive/จดหมาย/compass และการบันทึก local-first

**Architecture:** `music-room.html` (gate + tabs/rooms) + `js/music-room-data.js` (seed 3 ข้อความจริง + tags + คำถาม) + `js/music-room-app.js` (render/storage) เก็บใน localStorage `et1cruel.musicroom.v1` ไม่เพิ่ม dependency ไม่ใช้ backend/API เสียเงิน

**Tech Stack:** Static HTML + vanilla JS + Web Audio API (drone generator) + HTML audio

**Spec:** `docs/superpowers/specs/2026-10-16-music-room-design.md` + MASTER PROMPT ในแชท

## Global Constraints

- Static multi-page ล้วน ไม่มี framework/bundler/backend — deploy ผ่าน push main
- ห้ามทับ/ลบระบบเดิม; ห้ามเปิดเสียงอัตโนมัติ; ห้ามใช้ไมค์; เคารพ prefers-reduced-motion; ข้าม intro ได้
- ไม่แต่งความทรงจำ/เพลงแทนเจ้าของ; ไฟล์เสียงใหญ่ห้ามลง localStorage; เตือนข้อมูลเบราว์เซอร์หายได้
- ไม่มี streak/ลงโทษ/เปรียบเทียบ; ลบมี confirm; ไทยหลัก + EN
- งบ 0 บาท; ห้าม push อัตโนมัติ

## Review Focus

- เปิดเสียงเองเท่านั้น — คาดหวัง: โหลดหน้าเงียบเสมอ ไม่มี autoplay (test: เปิดหน้า + ฟัง console/network ว่าไม่มี audio request)
- ไฟล์เสียงที่ไม่มี — คาดหวัง: ไม่โชว์ปุ่มเล่น (test: track ไร้ไฟล์ไร้ลิงก์ไม่มี player)
- storage เสีย — คาดหวัง: เริ่มว่างได้ ไม่ crash
- จดหมายวันเปิดอ่าน — คาดหวัง: แสดง Asia/Bangkok ถูกต้อง + เปิดเองได้ก่อนถึงวัน
- จอ 400px — คาดหวัง: ไม่ล้น

---

### Task 1: ข้อมูล `js/music-room-data.js` + ประตูเข้า + โครงห้อง

**Files:**
- Create: `js/music-room-data.js`, `music-room.html` (gate + shell + tabs)
- Test: `node --check` + shape assertion + browser gate/message check

**Interfaces:**
- Consumes: seed 3 ข้อความจริงจากรูปเจ้าของ, tracks.json (อ่านอย่างเดียว)
- Produces: `window.ET1MUSIC_DATA = { origins[3]{id,title,desc,answer,userProvided:true}, tags[], compassQs[10], returnOptions[7], connections[] }`, gate `et1cruel.musicroom.seen`

- [ ] **Step 1: เขียน shape assertion ชั่วคราว** — origins 3 ข้อ userProvided ทุกข้อ, tags ≥ 8, compassQs 10, returnOptions 7
- [ ] **Step 2: รันแล้วยืนยัน FAIL** — คาดหวัง: FAIL ไฟล์ไม่มี
- [ ] **Step 3: สร้าง data + html gate** (ข้อความแรก/รอง/ปุ่ม ENTER/LISTEN ตรงสเปก, จำ seen, reduced-motion)
- [ ] **Step 4: เบราว์เซอร์ตรวจ** — ข้อความตรง, กด ENTER เข้าห้อง, โหลดเงียบ (ไม่มี audio request), console 0 — คาดหวัง: ครบ
- [ ] **Step 5: Commit**

### Task 2: Origin + Sound Universe + Archive + Sanctuary + Notes

**Files:**
- Create: `js/music-room-app.js` (v1: rooms เหล่านี้ + storage)
- Test: browser CRUD/persist/timer

**Interfaces:**
- Consumes: DATA Task 1
- Produces: storage `et1cruel.musicroom.v1 = { origins{}, universe{artists[],tracks[],sounds[],tags[],searching[]}, archive[], sanctuary{ideas[],diary[]}, notes[] }`, rooms render + forms

- [ ] **Step 1: `node --check` ไฟล์ที่ยังไม่มี** — คาดหวัง: FAIL
- [ ] **Step 2: สร้าง app.js** (origin ฟอร์มทีละข้อ + จดหมายสำคัญ, universe tags CRUD + searching, archive CRUD + สถานะ Idea/Demo/WIP/Finished/Released + Timeline + filter/search + LISTEN TO WHO I WAS, sanctuary (one-sound prompt, timer 15 นาที optional, diary, imperfect 5 สถานะ), notes) — ไฟล์เสียง: เล่นได้เฉพาะมีไฟล์/ลิงก์จริง
- [ ] **Step 3: เบราว์เซอร์ตรวจ** — CRUD ทุกห้อง, timer ดัง/หยุดได้, รีโหลดข้อมูลอยู่, track ไร้ไฟล์ไม่มี player — คาดหวัง: ครบ + console 0
- [ ] **Step 4: Commit**

### Task 3: Letters + Connections + Compass + Listening + Return + Daily + Export + Integration

**Files:**
- Modify: `js/music-room-app.js`, `index.html`, `sitemap.xml`, `sw.js`
- Test: browser full flow + honesty grep

**Interfaces:**
- Consumes: ทุกอย่างจาก Task 1–2
- Produces: letters (เขียน+วันเปิด+Asia/Bangkok+เปิดเองได้), connections (ผู้ใช้เขียนเอง), compass (ตอบ 10 + สรุปภาพชั่วคราว), listening (playlist tracks.json+เพิ่มเอง + drone generator มีสวิตช์), return overlay 7 ทาง, daily 6 ข้อ (พักได้), export JSON/MD + import, nav/explore/sitemap/SW

- [ ] **Step 1: ตรวจว่ายังไม่มี** — คาดหวัง: ยืนยันช่องว่าง
- [ ] **Step 2: เพิ่มทั้งหมด + integration**
- [ ] **Step 3: เบราว์เซอร์ตรวจ full flow + acceptance 18 ข้อของสเปกเท่าที่ทำได้ headless** (เว้นฟังเสียงจริงด้วยหู) — คาดหวัง: ผ่าน + console 0
- [ ] **Step 4: Commit** — ไม่ push จนกว่าเจ้าของสั่ง
