# INNER CORE Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างห้อง INNER CORE (แผนที่ตัวตนที่มีชีวิต) ใน ET1CRUEL Life OS ให้สำรวจตัวตน ความสนใจ ทักษะ โปรเจกต์ ค่านิยม ทิศทาง บันทึก Quest ได้จริงโดยแยกข้อเท็จจริง/สมมติฐาน/สิ่งที่ไม่รู้

**Architecture:** ไฟล์ใหม่ที่ root `inner-core.html` (tab-SPA แบบ upskill/agency) + `js/inner-core-data.js` (seed + คำถาม + เทมเพลต) + `js/inner-core-app.js` (render/storage) เก็บใน localStorage `et1cruel.innercore.v1` ไม่เพิ่ม dependency ไม่ใช้ backend/API เสียเงิน ไม่ส่งข้อมูลออกนอกเครื่อง

**Tech Stack:** Static HTML + vanilla JS + inline `<style>` + โทเคนเดิม (ฐาน dark #08090E + accent violet/cyan/green ตามสเปก ปรับให้เข้าธีมเดิม)

**Spec:** MASTER PROMPT ในแชท (PART 01–21) — ไม่มี design doc แยก (เจ้าของยกเว้นขั้นตอนถาม) สเปกเดินทางมากับแผนนี้ ผู้ทำอ่านทั้งคู่

## Global Constraints

- Static multi-page ล้วน ไม่มี framework/bundler/backend — deploy ผ่าน push main (GitHub Pages)
- ห้ามทับ/ลบระบบเดิม ห้ามลบข้อมูลหรือฟังก์ชันที่มีอยู่
- ห้ามวินิจฉัยสุขภาพจิต ห้ามตีความฝัน/ความสนใจเป็นอาการ ห้ามใช้ทฤษฎีบุคลิกภาพเป็นข้อสรุปตายตัว
- ห้ามอ้างอ่านใจผู้ใช้ ห้ามทึกทักความต้องการที่ยังไม่ยืนยัน ห้ามตีกรอบอาชีพเดียว
- ทุกข้อสรุปต้องมีที่มา/วันที่/สถานะยืนยัน; ห้ามสร้างคะแนนความมั่นใจที่ดูเหมือนวัดวิทยาศาสตร์โดยไม่มีวิธีคำนวณ
- ห้ามใส่คะแนน/ระดับ/เป้าหมายที่ผู้ใช้ไม่เคยยืนยันเพื่อให้หน้าดูเต็ม; ไม่รู้ให้แสดงว่าไม่รู้
- ห้ามสร้างเหตุการณ์อดีตขึ้นเอง; Timeline ต้องมีวันที่+ที่มา
- ห้ามส่ง Reflection ออกนอกเครื่อง; ห้ามฝัง API keys; ห้ามอ้างเข้ารหัสโดยไม่มีระบบรองรับ
- ห้ามกดดันให้ทุกอย่างเป็นธุรกิจ; มีพื้นที่ให้เรื่องที่ไม่ต้องสร้างผลผลิต
- งบ 0 บาท; ไทยหลัก + ศัพท์ EN; เคารพ prefers-reduced-motion; ไม่มี intro บังคับรอ
- ห้าม push อัตโนมัติ

## Review Focus

- localStorage เสีย/ผิด type — คาดหวัง: เริ่มค่าว่างได้ ไม่ crash (test: ยัดขยะแล้วโหลด)
- `?tab=`/`?open=` ผิด — คาดหวัง: empty state + ลิงก์กลับ ไม่จอขาว
- Export ภาษาไทย — คาดหวัง: เปิดไฟล์แล้วไทยไม่เพี้ยน (JSON UTF-8 ตรง, Markdown อ่านได้)
- Import ไฟล์มั่ว — คาดหวัง: ตรวจ schema ก่อน ปฏิเสธไฟล์ผิดพร้อมเหตุผล ไม่ทับของเดิม
- จอ 400px + คีย์บอร์ดล้วน — คาดหวัง: ไม่ล้น, Tab ถึงทุกปุ่ม, focus มองเห็น

---

### Task 1: ข้อมูล `js/inner-core-data.js` (seed + คำถาม + เทมเพลต)

**Files:**
- Create: `js/inner-core-data.js`
- Test: `node --check` + shape assertion script ชั่วคราว

**Interfaces:**
- Consumes: หมวด/รายละเอียดจากสเปก PART 03, 06, 18 (คงที่)
- Produces: `window.ET1INNER_DATA = { interests[30]{id,name,group,seedStatus:'SIGNAL',evidence,unknown,question}, values[15], questions{adaptive[],reflection{daily[5],weekly[5],monthly[6]},desire[8]}, questTemplate, projectSeeds[{name,url}], skillSeeds }` — seed ทุกตัวเป็น SIGNAL ทั้งหมด ห้ามมีคะแนน/ระดับของผู้ใช้

- [ ] **Step 1: เขียน shape assertion ชั่วคราว** — assert interests 30 ตัว 5 กลุ่ม CREATE/BUILD/EXPLORE/SHARE/LIVE, ทุกตัวมี evidence+unknown+question, values 15 ตัว, คำถามครบ daily5/weekly5/monthly6/desire8, ไม่มีฟิลด์คะแนนของผู้ใช้
- [ ] **Step 2: รัน assertion ยืนยัน FAIL** — คาดหวัง: FAIL ว่าไฟล์ไม่มี
- [ ] **Step 3: สร้าง `js/inner-core-data.js`** — seed จาก PART 03/18 ตรงๆ (music/tech/AI/robotics/visual/business/teaching แยก SIGNAL vs UNKNOWN), projectSeeds ลิงก์ห้องจริงที่มี (agency/music/video/upskill/stocks-daily/pillars)
- [ ] **Step 4: รัน assertion ยืนยัน PASS** — คาดหวัง: PASS
- [ ] **Step 5: Commit**

### Task 2: เปลือก `inner-core.html` + Overview/Core + storage

**Files:**
- Create: `inner-core.html`, `js/inner-core-app.js`
- Test: browser via `browser.mjs` + `node --check`

**Interfaces:**
- Consumes: `window.ET1INNER_DATA` จาก Task 1
- Produces: tabs `overview|interests|desires|skills|projects|values|direction|archive`, deep-link `?tab=` + `?open=<id>`, storage `et1cruel.innercore.v1 = { v:1, statement{text,updatedAt}, interests:{id:{ratings{},status,notes}}, skills{}, projects{}, values{}, direction{}, journal[], quests{}, focus{main,subs[]}, archive[] }`, jump menu (top tabs + TOC ในหน้า)

- [ ] **Step 1: `node --check` ไฟล์ที่ยังไม่มี** — คาดหวัง: FAIL (ไฟล์ไม่มี)
- [ ] **Step 2: สร้าง `inner-core.html`** (hero + statement + snapshot + focus + exploration + 8 tabs + search) + **`js/inner-core-app.js`** (render/overview/statement ยืนยัน-แก้ไข-ไม่เห็นด้วย + evidence drawer + storage กันพัง + empty states)
- [ ] **Step 3: เบราว์เซอร์ตรวจ** — tabs 8, statement แก้ไขแล้วยังอยู่หลังรีโหลด, ยัด storage เสียแล้วไม่ crash, `?tab=nope` เจอ empty state — คาดหวัง: ครบ + console error 0
- [ ] **Step 4: จอ 400px + Tab คีย์บอร์ด** — คาดหวัง: ไม่ล้น, focus มองเห็นทุกปุ่ม
- [ ] **Step 5: Commit**

### Task 3: Interests + Desires + Values + Direction + Working style

**Files:**
- Modify: `js/inner-core-app.js`
- Test: browser eval

**Interfaces:**
- Consumes: DATA + storage จาก Task 1–2
- Produces: CRUD interest (เพิ่ม/แก้/ลบพร้อมยืนยัน), เรตติง 8 แกน (1–5/ไม่ทราบ, ห้ามใส่ 0 แทนข้อมูลขาด), สถานะ 4 แบบ, desires A–F + คำถาม 8 ข้อ, values จัดอันดับ + trade-off explorer, direction 11 ด้าน (5 ระดับ), working style profile

- [ ] **Step 1: ตรวจว่ายังไม่มี** (tab interests แสดง seed อย่างเดียว แก้ไขไม่ได้) — คาดหวัง: ยืนยันช่องว่าง
- [ ] **Step 2: เพิ่มฟังก์ชันทั้งหมด** (CRUD + ratings + statuses + desires + values + direction + style + มุมมองจัดอันดับ interest/goal จากข้อมูลผู้ใช้ล้วน (ขาด=ไม่ทราบ) + แผนที่จุดตัด love/master/create/build-now/support-life)
- [ ] **Step 3: เบราว์เซอร์ตรวจ** — เพิ่ม/แก้/ลบ interest (ลบมี confirm), ให้คะแนนแล้วอันดับเปลี่ยน, export ยังไม่ต้อง — คาดหวัง: ครบ + console error 0
- [ ] **Step 4: Commit**

### Task 4: Skills + Projects + Quests/ONE THING + Journal + Archive

**Files:**
- Modify: `js/inner-core-app.js`
- Test: browser eval

**Interfaces:**
- Consumes: DATA + storage จาก Task 1–2 (อ่านสถานะ UPSKILL `et1cruel.upskill.v1` แบบกันพังเพื่อเติม evidence ทักษะ — อ่านอย่างเดียว ไม่เขียนทับ)
- Produces: skill records (L0–5/Not Assessed + desired mastery), project CRUD 6 สถานะ + ความสัมพันธ์, quest (hypothesis/action/time/evidence/reflection, 24h/7d/30d/90d) + ONE THING, journal daily/weekly/monthly + timeline, archive timeline (มีวันที่+ที่มา)

- [ ] **Step 1: ตรวจว่ายังไม่มี** — คาดหวัง: ยืนยันช่องว่าง
- [ ] **Step 2: เพิ่มฟังก์ชันทั้งหมด** (รวมอ่าน UPSKILL storage แบบ try/catch)
- [ ] **Step 3: เบราว์เซอร์ตรวจ** — สร้าง quest → ทำสำเร็จ → reflection, เขียน journal → timeline ขึ้น, รีโหลดข้อมูลอยู่ — คาดหวัง: ครบ + console error 0
- [ ] **Step 4: Commit**

### Task 5: Discovery + Export/Import + Search + Integration

**Files:**
- Modify: `js/inner-core-app.js`, `index.html` (nav 2 จุด), `sitemap.xml`, `sw.js` (bump + CORE)
- Test: browser + `node --check sw.js` + grep honesty

**Interfaces:**
- Consumes: ทุกอย่างจาก Task 1–4
- Produces: adaptive question (ทีละข้อ + ข้ามได้), contradiction surfacing เป็นคำถาม (ไม่ตัดสิน), provenance labels, export Markdown + JSON (UTF-8), import (ตรวจ schema + preview + ยืนยันก่อนทับ), search ข้าม entity, ลิงก์ nav/explore/sitemap/SW

- [ ] **Step 1: grep หาสัญญาณ hallucination** (คะแนน/ระดับที่ไม่มีที่มา, เหตุการณ์อดีตไร้วันที่) — คาดหวัง: เจอแต่ seed SIGNAL ที่ตั้งใจ
- [ ] **Step 2: เพิ่ม discovery + export/import + search + integration**
- [ ] **Step 3: เบราว์เซอร์ตรวจ full flow** (ตอบคำถาม → สถานะเปลี่ยน, export เปิดอ่านไทยไม่เพี้ยน, import ไฟล์มั่วถูกปฏิเสธ, nav ไป–กลับ) — คาดหวัง: ครบ + console error 0
- [ ] **Step 4: Commit** — ไม่ push จนกว่าเจ้าของสั่ง
