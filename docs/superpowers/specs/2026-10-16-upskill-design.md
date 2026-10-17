# UPSKILL ROOM — Design (2026-10-16)

## Intent & why
เจ้าของ ET1CRUEL อยากเก่ง **เว็บแอป**ที่สุด เพราะต่อยอดง่าย (จากงานโค้ด/AI agency ที่ทำอยู่ → ฟรีแลนซ์/โปรดักต์/รายได้).
ห้อง UPSKILL จึงเป็น Personal Skill Intelligence System: เปลี่ยนความสนใจ → ทักษะ → ผลงาน → โอกาส/รายได้
เริ่มด้วย **โครงระบบครบ + ทักษะตัวอย่างลึก 1 ตัว (Web & Application Development)** แล้วขยายทักษะอื่นทีละตัว
(ตัดสินใจแล้วกับเจ้าของ: ไม่ทำ 11 ทักษะพร้อมกันเพราะเนื้อหาจะตื้น)

## Goals
- เข้าห้อง UPSKILL จาก Life OS เดิมได้ (nav + explore + sitemap + SW)
- ดูทักษะ 11 รายการ (2 อาณาจักร) + ค้นหา/กรองได้จริง
- หน้าทักษะ Web App ลึกครบ 11 sections ตามบรีฟ (identity, history timeline, fundamentals,
  roadmap L0–L5, practice, tools, projects, career, people, progress, references)
- สถานะการเรียน 7 สถานะ + ชั่วโมงฝึก + reflection + ลิงก์ผลงาน, รีเฟรชไม่หาย
- Dashboard ตัวเลขคำนวณจากข้อมูลจริง, NEXT MOVE จากกฎข้อมูลจริง (ไม่ใช้ AI API เสียเงิน)
- เชื่อมของเดิม: Web App → agency/create-ai/index, Music → music/beat-select/prod,
  Video → video/GenVideo (ลิงก์จริงที่มีอยู่)
- 10 ทักษะที่เหลือ: โครง section ครบ + เนื้อหาเปิด + ป้าย TODO ชัดเจน ไม่แต่งข้อมูล

## Non-goals / Anti-goals
- ไม่ใช่ใบรับรองวิชาชีพ: level เป็นกรอบเรียนรู้ ห้ามอ้างความเป็น expert จากเวลาเรียน
- ไม่แต่งประวัติศาสตร์ บุคคล รายได้ ลิงก์อ้างอิง ตัวเลขใดๆ (กฎเดียวกับงานหุ้น: verify หรือติดป้าย TODO)
- Gamification ห้ามเป็นแต้มลอยๆ: XP/คะแนนต้องผูกกับกิจกรรมที่บันทึกจริง
- สำเร็จแต่หน้าสวยกดไม่ได้ = ล้มเหลว

## Constraints (ของเดิม, ห้ามแหก)
- Static multi-page ล้วน, ไม่มี framework/bundler/backend; deploy GitHub Pages ผ่าน push main
- ห้ามทับ/ลบระบบเดิม; reuse tokens/components เดิมก่อนสร้างใหม่
- เก็บข้อมูลผู้ใช้ใน localStorage (key ใหม่ `et1cruel.upskill.v1`), แยก data ออกจาก UI
- งบ 0 บาท: ห้าม paid API; ห้ามฝัง API keys
- ไทยหลัก + ศัพท์ EN; responsive desktop/tablet/mobile; ข้อความไทยห้ามล้น/ทับ
- Safety notes: ไฟฟ้าแรงสูง/แบตเตอรี่ (03), ลงเข็มจริงบนคน (09) — ห้ามชวนทดลองเสี่ยง
- ห้าม push อัตโนมัติ

## Decided (เจ้าของตัดสินใจแล้ว)
- Scope: โครงครบ + exemplar ลึก 1 ตัว → ขยายทีหลัง
- Exemplar: 02 Web & Application Development
- Integration: เชื่อมลิงก์ห้องเดิมที่มีอยู่จริง
- 11 ทักษะ canonical (จากบรีฟ §2 — ห้ามเปลี่ยน taxonomy):  A TECHNOLOGY: 01 coding-robotics (Coding & Robotics · เขียนโค้ดและหุ่นยนต์),
  02 web-app (Web & Application Development · เว็บและแอป), 03 electricity-energy
  (Electricity & Energy · ไฟฟ้า/พลังงาน), 04 materials (Materials Science · วัสดุ);
  B ART & ENTERTAINMENT: 05 music-audio (Music & Audio · ดนตรีและเสียง),
  06 visual-art (Visual Art & Image · ศิลปะและภาพ), 07 video-motion (Video & Motion ·
  วิดีโอ/Motion), 08 fashion (Fashion & Clothing · แฟชั่น), 09 tattoo (Tattoo Art ·
  สัก), 10 design-visual (Design & Visual Communication · ออกแบบสื่อภาพ),
  11 book-publishing (Book & Publishing · หนังสือ/สิ่งพิมพ์)
- 7 สถานะ canonical (จากบรีฟ §8): WISHLIST อยากเรียน, EXPLORING กำลังสำรวจ,
  LEARNING กำลังเรียน, PRACTICING กำลังฝึก, PROJECT กำลังทำโปรเจกต์,
  MASTERED บรรลุเป้าหมายที่ตั้งไว้, PAUSED หยุดพักชั่วคราว
- Dashboard cards (จากบรีฟ §4.1): ทักษะที่ติดตามทั้งหมด / กำลังเรียน / กำลังฝึก /
  โปรเจกต์สำเร็จ / ชั่วโมงฝึกสะสม / ทักษะเป้าเชี่ยวชาญอันดับแรก — ทุกค่าคำนวณจากข้อมูลจริง
- เนื้อหา exemplar (เจ้าของตัดสินใจ 16 ต.ค.): ความรู้เว็บทั่วไป ลึกถึงระดับปรมาจารย์
  (L0–L5 ครบ) + แนบลิงก์อ้างอิงของจริงทุก section สำคัญ (MDN, web.dev ฯลฯ);
  จุดใด verify ไม่ได้ให้ติดป้าย TODO แทนการแต่ง

## Builder calls (my call — ค้านได้ตอนรีวิวเอกสาร)
- ไฟล์ใหม่ที่ root: `upskill.html` (tab-SPA แบบ agency.html) + `js/upskill-data.js`
  (content 11 ทักษะ) + `js/upskill-app.js` (logic/storage/render) — ไม่เพิ่ม dependency
- Search/กรอง (my call): ค้นชื่อไทย+EN, summary, tags, ศัพท์ glossary, ชื่อบุคคล;
  ฟิลเตอร์ kingdom + สถานะ 7 แบบ + level L0–L5; ไม่ทำ Thai tokenization พิเศษ
  (substring match ภาษาไทยใช้งานได้จริง)
- ธีม: neo-brutal tokens เดิม (`css/neo-brutal.css` โหลดท้าย) + section accent ต่อหมวด
  (Tech = blueprint/circuit vibe, Art = film-strip/waveform vibe ด้วย CSS/SVG ล้วน)
- Skill detail: ไฟล์เดียว render ตาม `?skill=web-app` (deep-link ได้) + TOC ในหน้า
- PLAN/IDENTITY: ตรวจสอบของจริงใน index ก่อน — ถ้าไม่มี task API ใช้วิธีซื่อสัตย์
  (Add to Plan = export ข้อความ/JSON ไปวางใน PLAN เอง + ลิงก์กลับ; ห้ามปุ่มหลอกว่าเชื่อมสำเร็จ)
- Seed: ไม่มีประวัติจริงของผู้ใช้ — dashboard เริ่มว่าง + ชวนเพิ่มทักษะแรก (DEMO ติดป้ายถ้ามี)
- Nav: เติมลิงก์ `#nav` + explore nav + `sitemap.xml` + bump `sw.js` (ตรวจ cache list ไม่ขาด)

## Left to builder
- ผูก selector nav จริงใน index (บรรทัด ~773–823, 1894–1895) ให้เนียนกับของเดิม
- ดีไซน์ skill map (grid/tree/constellation) ให้เหมาะกับข้อมูลจริง
- เกณฑ์ unlock level ที่ผูกผลงาน/แบบทดสอบ (ไม่ใช่แค่นับคลิก)
- กฎ NEXT MOVE จากข้อมูลจริง (ค้างเรียน/ฝึกไม่ผ่าน/โปรเจกต์ค้าง/ทบทวน)
- รายการ TODO เนื้อหาต่อทักษะ (10 ทักษะ) ให้ชัดว่าขาดอะไร
- ตรวจ console 0 error, ปุ่ม/ฟิลเตอร์/บันทึกทำงานจริง, responsive 1280 + 400
