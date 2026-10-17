# UPSKILL ROOM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างห้อง UPSKILL (อัพสกิล) ใน ET1CRUEL Life OS: โครงระบบครบ + ทักษะ Web App ลึก 1 ตัว + เปลือก 10 ทักษะ + เชื่อมของเดิม

**Architecture:** ไฟล์ใหม่ที่ root `upskill.html` (tab-SPA แบบ agency.html) + `js/upskill-data.js` (content ล้วน) + `js/upskill-app.js` (render/storage) เก็บความคืบหน้าใน localStorage `et1cruel.upskill.v1` ไม่เพิ่ม dependency ไม่ใช้ backend/API เสียเงิน

**Tech Stack:** Static HTML + vanilla JS + inline `<style>` + neo-brutal tokens เดิม (`css/neo-brutal.css`)

**Spec:** `docs/superpowers/specs/2026-10-16-upskill-design.md` + บรีฟต้นฉบับในแชท (MASTER PROMPT)

## Global Constraints

- Static multi-page ล้วน ไม่มี framework/bundler/backend — deploy ผ่าน push main (GitHub Pages)
- ห้ามทับ/ลบระบบเดิม ห้ามลบข้อมูลหรือฟังก์ชันที่มีอยู่
- Reuse `css/neo-brutal.css` tokens (ครีม `#FFF4D6` / หมึก `#131313` / เหลือง `#FFC900`) ก่อนสร้างใหม่
- งบ 0 บาท ห้าม paid API ห้ามฝัง API keys
- ไทยหลัก + ศัพท์ EN ควบคู่ ข้อความไทยห้ามล้น/ทับกัน
- Level L0–L5 เป็นกรอบเรียนรู้ ไม่ใช่ใบรับรอง ห้ามอ้าง expert จากเวลาเรียน
- ไม่แต่งประวัติศาสตร์ บุคคล รายได้ ลิงก์ สถิติ — verify ไม่ได้ให้ติดป้าย `TODO:` ชัดเจน
- Safety notes ไฟฟ้าแรงสูง/แบต (03) และการลงเข็มบนคน (09) ห้ามชวนทดลองเสี่ยง
- ปุ่มทุกปุ่มทำงานจริงหรือติดป้ายไม่พร้อมอย่างชัดเจน
- ห้าม push อัตโนมัติ

## Review Focus

- หน้าจอ 400px ข้อความไทยใน skill map/tree ไม่ล้นหรือทับกัน — คาดหวัง: ตัดคำ/เลื่อนดูได้ครบ
- เปิด `?skill=ชื่อผิด` หรือ slug ไม่มี — คาดหวัง: เจอ empty state + ลิงก์กลับ ไม่ใช่จอขาว
- localStorage มี schema เก่า/ข้อมูลเสีย — คาดหวัง: กันพังแล้วเริ่มค่าว่างได้ ไม่ crash
- ค้นหาภาษาไทยคำผสม (เช่น "เว็บแอป") — คาดหวัง: substring match เจอ web-app
- รีเฟรชหลังบันทึกสถานะ/ชั่วโมง/journal — คาดหวัง: ข้อมูลอยู่ครบ dashboard คำนวณตรง

---

### Task 1: ข้อมูล `js/upskill-data.js` (11 ทักษะ + Web App ลึก)

**Files:**
- Create: `js/upskill-data.js`
- Test: run `node --check` + one-off node shape assertion (no new test file; repo has no test runner)

**Interfaces:**
- Consumes: taxonomy + 7 statuses + dashboard cards จาก design doc (คงที่)
- Produces: `window.ET1UPSKILL_DATA = { skills: [...], Thus: {...} }` โดย skill 1 ตัว = `{ id, slug, nameTh, nameEn, kingdom: 'tech'|'art', summary, objectives[], tags[], links[]:{label,url}, detail: null | { identity, history[{year,title,text,ref?}], fundamentals[{term,simple,deep,example,mistake}], roadmap{L0..L5:{goals,exercises,project,doneWhen}}, practice, tools[{name,use,for,cost}], projects[{name,level,steps,doneWhen}], careers[], people[{name,why,lesson,ref}], resources[{label,url}] } }` — 10 ทักษะ non-exemplar มี `detail: null` + `todoNote` ระบุว่าขาดอะไร

- [ ] **Step 1: เขียน shape assertion script ชั่วคราว** (`C:\Users\PC\AppData\Local\Temp\opencode\upskill-shape.cjs`): require โหลดไฟล์แล้ว assert 11 skills, slug ตรง canonical 11 ตัว, web-app มีครบทุก section key, people ทุกคนมี ref, ไม่มีสตริงรายได้ที่ไม่มีแหล่งที่มา
- [ ] **Step 2: รัน assertion ยืนยันว่า FAIL** (`node <script>`) — คาดหวัง: FAIL ว่าไฟล์ไม่มี
- [ ] **Step 3: สร้าง `js/upskill-data.js`** — web-app ลึกครบ L0–L5 (ความรู้เว็บทั่วไป: HTML/CSS/JS/TS, responsive, React, backend/API/Node, SQL/auth, git, testing/security, deploy/CI-CD, perf/a11y/SEO, AI API cost) + ลิงก์จริง (MDN, web.dev, react.dev, nodejs.dev, git-scm) + อีก 10 ทักษะเป็นเปลือก `detail:null` + `todoNote` + links ไปห้องเดิมที่มีจริง (music→music.html/beat-select.html, video→video.html)
- [ ] **Step 4: รัน assertion ยืนยันว่า PASS** — คาดหวัง: PASS ทุกข้อ
- [ ] **Step 5: Commit** (`git add js/upskill-data.js` + message `feat: upskill data - 11 skills, web-app deep`)

### Task 2: เปลือก `upskill.html` + `js/upskill-app.js` (dashboard/map/tabs/detail/progress)

**Files:**
- Create: `upskill.html`, `js/upskill-app.js`
- Test: browser via `browser.mjs` + `node --check js/upskill-app.js`

**Interfaces:**
- Consumes: `window.ET1UPSKILL_DATA` จาก Task 1
- Produces: tabs `overview|tech|art|mine|tree|projects|journal|resources`, deep-link `?skill=<slug>`, storage key `et1cruel.upskill.v1 = { status:{skillId}, hours:{skillId:minutes}, sessions[], reflections[], bookmarks[], projects[] }`, jump menu (top tabs + ในหน้า detail มี TOC ปุ่มโดด 11 sections)

- [ ] **Step 1: `node --check` บนโครงเปล่า** — คาดหวัง: FAIL (ไฟล์ยังไม่มี)
- [ ] **Step 2: สร้าง `upskill.html`** (hero "BUILD YOURSELF. ONE SKILL AT A TIME.", 6 dashboard cards, skill universe 2 kingdoms grid, tabs, search/filter bar, `#detail` + TOC jump menu, journal/project forms) + **`js/upskill-app.js`** (render จาก DATA, ค้นหา substring ไทย/EN, ฟิลเตอร์ kingdom+status+level, เปลี่ยนสถานะ 7 แบบ, บันทึกชั่วโมง/session/reflection/ลิงก์ผลงาน, NEXT MOVE จากกฎข้อมูลจริง 5 ข้อ, seed ว่าง + ชวนเพิ่มทักษะแรก, กันพัง storage เสีย)
- [ ] **Step 3: เปิดเบราว์เซอร์ตรวจ** — `browser.mjs http://localhost:8100/upskill.html --eval` นับ cards=6, skills=11, ลองค้น "เว็บแอป" เจอ web-app, เปลี่ยนสถานะแล้วรีโหลดยังอยู่, ใส่ขยะใน localStorage แล้วโหลดใหม่ต้องไม่ crash — คาดหวัง: ครบ + console error 0
- [ ] **Step 4: ตรวจจอ 400px + `?skill=nope`** — คาดหวัง: ไม่ล้น/ทับ, slug ผิดเจอ empty state + ลิงก์กลับ
- [ ] **Step 5: Commit** (`git add upskill.html js/upskill-app.js`)

### Task 3: Skill Tree + cross-links + weekly review

**Files:**
- Modify: `js/upskill-app.js`, `js/upskill-data.js` (เติม `tree` ต่อทักษะ exemplar + `crossLinks[]`)
- Test: browser eval

**Interfaces:**
- Consumes: tab `tree` + DATA จาก Task 1–2
- Produces: tree render `{ nodes:[{id,label,requires[],unlockHint}], }` ต่อ web-app (HTML→CSS→JS→TS→React→API→DB→Deploy) + cross-links 7 คู่ตามบรีฟ (Robotics+Web, Music+Video ฯลฯ) — unlock ผูกหลักฐาน (project/quiz/self-check) ไม่นับคลิก

- [ ] **Step 1: ตรวจ tree ปัจจุบัน** — คาดหวัง: tab tree แสดง TODO/ว่าง (ยังไม่ทำ = หลักฐานก่อนแก้)
- [ ] **Step 2: เพิ่ม tree web-app + cross-links 7 คู่ + weekly review** (สรุปจากข้อมูลจริง: เรียนอะไร/ค้างอะไร/แนะนำอะไรต่อ)
- [ ] **Step 3: เบราว์เซอร์ตรวจ tree + กดโหนด** — คาดหวัง: แสดง requires/unlockHint ถูกต้อง + console error 0
- [ ] **Step 4: Commit**

### Task 4: เชื่อม Life OS (nav/sitemap/SW)

**Files:**
- Modify: `index.html` (`#nav` ~773–823 + explore nav ~1894–1895), `sitemap.xml`, `sw.js` (bump CACHE + เติมไฟล์ใหม่ใน CORE)
- Test: browser goto ทุกลิงก์ใหม่ + ตรวจ sw.js syntax

**Interfaces:**
- Consumes: `upskill.html` จาก Task 2
- Produces: ลิงก์ `🎓 UPSKILL` ใน nav หลัก + explore + sitemap URL + SW cache ใหม่

- [ ] **Step 1: `node --check sw.js`** — คาดหวัง: PASS (baseline ก่อนแก้)
- [ ] **Step 2: เติมลิงก์ 2 จุด + sitemap + SW bump** (CACHE version+1, CORE เพิ่ม upskill.html + 2 js)
- [ ] **Step 3: เบราว์เซอร์กดลิงก์จาก index ไป upskill กลับมา** + `node --check sw.js` — คาดหวัง: ไป–กลับได้ + PASS
- [ ] **Step 4: Commit**

### Task 5: ตรวจความซื่อสัตย์เนื้อหา + ส่งมอบ

**Files:**
- Modify: แก้เฉพาะจุดที่ตรวจเจอ (ถ้ามี)
- Test: `grep` + `webfetch` spot-check + browser full flow

- [ ] **Step 1: grep หาสัญญาณ hallucination** (`TODO` ครบทักษะ non-exemplar? ตัวเลขรายได้ไร้แหล่งที่มา? ลิงก์ปลอม?) — คาดหวัง: เจอแต่ TODO ที่ตั้งใจ
- [ ] **Step 2: webfetch เปิดลิงก์อ้างอิงหลัก 5 ลิงก์** (MDN/web.dev) — คาดหวัง: 200 ทั้งหมด
- [ ] **Step 3: Full flow test** (index → upskill → web-app detail → เปลี่ยนสถานะ → บันทึก journal → รีเฟรช → dashboard เปลี่ยน) — คาดหวัง: ผ่านทุกขั้น + console error 0
- [ ] **Step 4: เขียนสรุป 8 หัวข้อ** (overview/files/features/coverage/integration/testing/limitations/next) ลงท้ายแชท — ไม่ push จนกว่าเจ้าของสั่ง
