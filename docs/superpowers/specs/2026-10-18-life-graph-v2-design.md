# LIFE GRAPH V2 — Life Timeline & Stock-Style Life Graph — Design (2026-10-18)

## Intent & why

เจ้าของ ET1CRUEL ต้องการเห็น **ประวัติชีวิตของตัวเองทั้งเส้น** ในหน้า Home ของ Life OS ไม่ใช่แค่บันทึกไม่กี่รายการ
ปัจจุบันมี Life Graph V1 (#life-graph ใน index.html) ที่มี 9 chapters + 10 seeded events แต่:
- ข้อมูลจริงส่วนใหญ่ **อยู่ที่ `timeline.html` และยังไม่ถูกนำเข้า graph** (บล็อกข้อมูล 12 ส่วน)
- ยังไม่มี **ไทม์ไลน์รายปี 2004–2026** ที่เลือกดูทีละปีได้
- ยังไม่มี **แผนนำทางปี (year navigation)**, ยังไม่มีตัวแยกความแม่นยำของวันที่เป็นระบบ
- กราฟยังจัดวางจุดตาม heuristic ตายตัว ไม่ผูกกับปีจริงแบบหุ้น

เป้าหมาย: อัปเกรด `#life-graph` ให้เป็น Life Timeline รายปีที่ละเอียด + Stock-Style Life Graph ที่ใช้ข้อมูลชุดเดียวกัน
โดย **ไม่แต่งประวัติขึ้นเอง** และ **ไม่ทำลาย Dashboard เดิม**

## Goals

1. ไทม์ไลน์รายปี 2004 → 2026 (+ FUTURE) เลือกดูทีละปีได้จริง · ปีที่ไม่มีเหตุการณ์แสดงข้อความตรงไปตรงมา (ช่วงวัยเด็กใช้ถ้อยคำ "ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้ — ช่วงวัยเด็ก") ไม่เติมให้เต็ม และไม่ทำตัวเป็นระบบไล่ถามให้เติมช่องว่าง
2. Stock-Style Life Graph: แกน X = เวลา (พ.ศ./ค.ศ.), เส้นอดีตฟ้า-ฟ้าเขียว, จุดปัจจุบันเขียว, เป้าหมายอนาคตเส้นประ + วงกลมโปร่ง
3. Year Navigation: chip ปี, ปุ่ม Previous / Next / Today / All Years
4. Milestone Detail Panel ครบทุกช่องตามบรีฟ (What Changed / Reflection ว่างได้ แต่ต้องเป็น "ยังไม่ได้บันทึก" ไม่ใช่คำที่ผมแต่ง)
5. 3 ระดับข้อมูล: Year Overview → Life Chapters → Event Details
6. แยก **Undated Events** และ **Future Goals** ออกจากเส้นเวลาเสมอ
7. CRUD เพิ่ม/แก้/ลบ (ลบต้อง confirm) + คงอยู่หลัง Refresh
8. นำเข้าข้อมูลจริงทั้งหมดจาก `timeline.html` เป็น seed แบบมีป้ายที่มาและความแม่นยำ
9. Filters 14 หมวด + Search
10. Responsive + Keyboard + Reduced-motion ตามมาตรฐานเดิมของโปรเจกต์

## Non-goals / Anti-goals

- **ไม่สร้างเว็บไซต์ใหม่** ไม่ทำ `life-graph.html` แยก (เจ้าของเลือกอัปเกรดใน Home ที่เดียว)
- **ไม่แตะ `timeline.html`** — ปล่อยให้ทำงานเหมือนเดิม
- **ไม่เปลี่ยนธีมเว็บ** ไม่แตะ CSS ส่วนอื่นของ index.html
- **ไม่ใช้ Supabase / backend / paid API** — โปรเจกต์เป็น static, งบ 0 บาท
- **ห้ามเดาปี**: เหตุการณ์ที่ไม่มีหลักฐานต้องเป็น `unknown` หรือ `needs_confirmation` เสมอ ไม่มี `confirmed` โดยอัตโนมัติ
- **ห้ามใช้รายได้ / ผู้ติดตาม / จำนวนโปรเจกต์ เป็นแกน Y แทนคุณภาพชีวิต**
- **ห้ามตั้ง `selfAssessmentScore` ให้ผู้ใช้** — เป็น `null` จนกว่าเจ้าของจะกรอกเอง
- **ห้ามแต่ง What Changed / Reflection / แรงจูงใจ** ที่เจ้าของไม่เคยพูด
- **ห้ามลบความขัดแย้งของข้อมูล** (ดู §Data audit) — เก็บไว้ให้เจ้าของตรวจ
- ไม่ push อัตโนมัติ

## Constraints (ของเดิม ห้ามแหก)

- Static multi-page HTML + vanilla JS (ES5-compatible style ตาม `js/life-graph.js` เดิม), ไม่มี framework/bundler
- Deploy GitHub Pages ผ่าน push main
- localStorage เท่านั้น แยก data ออกจาก UI (`js/life-graph-data.js` + `js/life-graph.js`)
- `index.html` เป็นไฟล์ 2,828 บรรทัด — แก้แบบเจาะจง (section `#life-graph`, dialog, script tag) ห้ามรื้อ
- ไทยหลัก + ศัพท์ EN; เคารพ `prefers-reduced-motion`; ลำดับชั้น heading ห้ามข้าม
- ไฟล์ใหม่ต้องถูกเพิ่มใน `sw.js` cache list ถ้าจำเป็น (ตรวจก่อน) และไม่ทำ 404

## Decided (เจ้าของตัดสินใจแล้ว — 18 ต.ค. 2026)

1. **Seed data**: นำเข้าข้อมูลจริงทั้งหมดจาก `timeline.html` เป็นเหตุการณ์ตั้งต้น พร้อมป้ายแหล่งที่มา "จากบันทึกบทสนทนาเดิม"
2. **Storage**: คีย์ใหม่ `et1cruel.life-graph.v2` + migrate ของเดิมจาก v1 + ปุ่ม Export/Import JSON (สำรองข้อมูล)
3. **ความขัดแย้งปี**: รวม "ม.2 เริ่มทำเพลง" กับ "2021 ตอน ม.4 ตั้งวง" เป็น **เหตุการณ์เดียวแบบ range (2018–2021)** พร้อมป้าย "ข้อมูลขัดแย้ง — ต้องยืนยัน"
4. **ขอบเขตหน้า**: อัปเกรด `#life-graph` ใน `index.html` ที่เดียว

## Taxonomies (คงที่ — ห้ามเปลี่ยน อาจารย์)

**12 Life Chapters** (จากบรีฟ PART 3 LEVEL 2, canonical):
| id | title (EN) | title ไทย |
|---|---|---|
| `childhood` | Childhood | จุดเริ่มต้น / วัยเด็ก |
| `football` | Football | ฟุตบอล |
| `music-origin` | Music Origin | จุดกำเนิดดนตรี |
| `learning-struggle` | Learning Through Struggle | เรียนรู้ผ่านข้อจำกัด |
| `education` | Education | การศึกษา |
| `work` | Work Experience | ประสบการณ์ทำงาน |
| `music-production` | Music Production | การผลิตดนตรี |
| `coding-software` | Coding & Software | โค้ดและซอฟต์แวร์ |
| `ai-automation` | AI & Automation | AI และระบบอัตโนมัติ |
| `robotics` | Robotics | หุ่นยนต์ |
| `current-life` | Current Life | ชีวิตปัจจุบัน |
| `future-goals` | Future Goals | เป้าหมายอนาคต |

**14 Categories** (จากบรีฟ PART 9, canonical — ตัวกรองและฟิลด์ `category` ใช้ชุดนี้เท่านั้น):
`Personal`, `Football`, `Music`, `Education`, `Work`, `Finance`, `Technology`, `Coding`, `AI`, `Robotics`, `Content Creation`, `Business`, `Personal Growth`, `Future Goals`

Chapters เป็น **ค่าคงที่ในโค้ด** (`js/life-graph-data.js`) ไม่ใช่ record ที่ลบได้ — แต่ละ chapter แสดงจำนวน event ที่ผูกอยู่และเข้าไปดูได้
(เหตุการณ์ที่ผูก chapter ได้หลายบท ให้เลือกบทหลัก 1 บท แล้วใส่บทอื่นใน `tags`)

**V1 → V2 chapter mapping** (migrate): `childhood`→`childhood`, `turning-point`→`music-origin`, `learning-struggle`→`learning-struggle`, `education-experiments`→`education`, `music-artist`→`music-production`, `creative-technology`→`coding-software`, `ai-builder`→`ai-automation`, `robotics-future`→`robotics`, `life-os`→`current-life`

**V1 → V2 category mapping** (migrate): `Life`→`Personal`, `Education`→`Education`, `Work`→`Work`, `Music`→`Music`, `Business`→`Business`, `Art`→`Content Creation`, `Technology`→`Technology`, `AI`→`AI`, `Robotics`→`Robotics`, `Finance`→`Finance`, `Health & Fitness`→`Personal` + tag `health`, `Relationships`→`Personal` + tag `relationships`, `Travel`→`Personal` + tag `travel`, `Spirituality`→`Personal Growth` + tag `spirituality`, `Learning`→`Coding` ถ้ามี tag programming/coding/web ไม่เช่นนั้น `Personal Growth`, `Personal Growth`→`Personal Growth`, `Future Goals`→`Future Goals`
ค่า category ที่ map ไม่ได้ → `Personal` + tag `migrated-unknown` (ห้ามทิ้ง record)

## Builder calls (my call — ค้านได้ตอนรีวิว)

- แยก seed เป็น `js/life-graph-data.js` (pattern เดียวกับ `js/upskill-data.js`, `js/inner-core-data.js`) — `js/life-graph.js` เหลือหน้าที่ app/storage/render
- **Seed merge policy**: seed ผูกด้วย `id` คงที่; ถ้าเจ้าของแก้ seed event ใด จะติด `userEdited:true` และ seed รอบใหม่ **ห้ามทับ**; ถ้าลบ seed จะเก็บ `deletedSeedIds` (tombstone) ไม่ให้กลับมาเอง
- **Anti-overlap ของ label บนกราฟ**: เรียงตาม x แล้วข้าม label ที่กล่องทับกัน + สลับบน/ล่าง + มี toggle "แสดง Label ทั้งหมด"
- **Mode A เป็นค่าเริ่มต้น** (จัดวางเชิงภาพ) — Y คำนวณจาก `chapterId` + `importance` + `narrativeLevel` แบบ deterministic และอธิบายได้; **Mode B** ใช้ `selfAssessmentScore` (1–10) และถ้าไม่มีข้อมูลเลยต้องขึ้น "ยังไม่มีคะแนนประเมินตนเอง — กรอกได้ที่ปุ่มแก้ไข" ไม่ใช่เส้นแบนที่ดูเหมือนคะแนนจริง
- โหมด **Life Map** ของ V1 เก็บไว้เป็นแท็บเล็ก (ไม่ลบของเดิม) แต่ไม่ใช่จุดสนใจหลัก
- วันที่ที่มีแค่ปี (2022, 2023, 2024) วางบนกราฟที่กลางปีเพื่อไม่ให้ทับเส้นปี (ระบุใน tooltip ว่า "ระบุเป็นปี")
- `<dialog>` เดิมต่อยอด ไม่สร้างใหม่; เพิ่มฟิลด์ตาม data model V2
- Search: substring match ไทย+EN จาก title/description/tags/notes (ไม่ทำ tokenizer)
- ไม่มี test framework ใน repo → ใช้ `node --check` + สคริปต์ assertion ชั่วคราว + ตรวจ DOM บนเบราว์เซอร์จริง (Playwright)

## Data model (ขยายจากบรีฟ PART 7)

```js
{
  id: 'stable-id',
  title: 'เริ่มทำเพลง หลังเลิกเล่นฟุตบอล',
  description: '...',
  category: 'Music',              // 1 ใน 14 หมวด canonical
  chapterId: 'music-origin',      // 1 ใน 12 chapters
  type: 'milestone',              // milestone | chapter | goal
  status: 'user-reported',        // lifecycle: verified|user-reported|planned|exploring|in-progress|completed
  importance: 2,                  // 1–3 ใช้จัดวาง Mode A (ไม่ใช่คะแนนชีวิต)
  startDate: null,                // 'YYYY-MM-DD' ถ้ามี
  endDate: null,
  startYearCE: null,              // null เมื่อไม่มีปีที่ยืนยัน
  endYearCE: null,
  startMonthCE: null,             // 1–12 เมื่อความแม่นยำเป็นระดับเดือน/ช่วง
  endMonthCE: null,
  datePrecision: 'estimated_range',// exact_date|exact_month|exact_year|exact_range|estimated_year|estimated_range|school_period|age_based|unknown
  dateStatus: 'needs_confirmation',// confirmed|estimated|needs_confirmation|unknown
  dateSource: 'user_reported',     // user_reported|project_record|imported_record|derived_estimate
  sourceReference: 'timeline.html §2', // อ้างไฟล์/ส่วนที่มา
  conflictNote: null,              // ข้อความอธิบายเมื่อข้อมูลขัดกัน
  narrativeLevel: null,            // 0–100 การจัดวางเชิงภาพ ไม่ใช่คะแนนชีวิต (migrate จาก storyLevel)
  selfAssessmentScore: null,       // 1–10 ผู้ใช้กรอกเองเท่านั้น
  isCurrent: false,
  isFuture: false,
  isAnchor: false,                 // วันเกิด ใช้เป็นจุดอ้างอิงอายุ ไม่ให้คะแนน
  relatedProjectIds: [],
  relatedSkills: [],               // ทักษะที่เกี่ยวข้อง (ว่างได้)
  whatChanged: '',                 // ว่าง = 'ยังไม่ได้บันทึก' ห้ามแต่ง
  reflection: '',                  // Personal Reflection — ห้ามแต่ง
  tags: [],
  notes: '',                       // User Notes
  userEdited: false,
  createdAt: null,
  updatedAt: null
}
```

**สองสถานะ ห้ามสับสน:** `status` = สถานะรายการ/เป้าหมาย (กำลังทำ/เสร็จ/วางแผน) · `dateStatus` = ความน่าเชื่อถือของ*วันที่*เท่านั้น
`status` ต้อง migrate จาก V1 ครบ (ชุดค่าเดียวกัน) เพราะมันขับ stat "เป้าหมายที่กำลังดำเนินการ" และ badge บนการ์ด

**สเกล `selfAssessmentScore` = 1–10** ตามบรีฟ PART 4 MODE B
ของเดิมจาก V1 (form เดิม min 0 max 100): ค่า ≤ 10 เก็บเดิม; ค่า > 10 ติด `legacyScale:true` + แสดง "ค่าที่บันทึกไว้ใช้สเกลเดิม 0–100 — กรุณายืนยัน/กรอกใหม่" **ห้ามแปลงเงียบ ๆ**

`importance` (1–3) และ `narrativeLevel` เป็น**ข้อมูลจัดวางเชิงภาพเท่านั้น** ต้องมี label กำกับใน UI ทุกที่ที่แสดง

Storage envelope: `{ version:2, records:[...], deletedSeedIds:[], meta:{focus:'...'} }`

**กฎกันข้อมูลหาย (สำหรับ builder check ข้อ 3):**
- record ที่ `createdAt != null` (ผู้ใช้สร้างเองผ่านฟอร์ม) หรือ `userEdited === true` → **ห้ามลบ ห้ามทับเด็ดขาด** migrate มาทั้งหมด
- seed เดิมของ V1 (ที่ `createdAt == null` และไม่ถูกแก้) เป็น seed ของผมเอง ไม่ใช่ข้อมูลเจ้าของ → แทนที่ด้วย seed V2 ที่ละเอียดกว่าได้
- record ที่ migrate มาซ้ำกับ seed V2 (เทียบ title/ปี) → **ไม่ลบ** แต่ติด badge "อาจซ้ำกับ <ชื่อ seed ที่เกี่ยวข้อง>" ให้เจ้าของตัดสิน
- **Import semantics**: merge เข้าเป็นค่าเริ่มต้น + ถามยืนยันก่อนเขียนทับ; ไฟล์ที่ schema ไม่ถูกต้องต้องถูกปฏิเสธพร้อมบอกเหตุผล; record ที่ import และมี id ตรงกับ seed → ถือเป็น `userEdited:true` (กัน seed รอบใหม่ทับ)

## Data audit — สิ่งที่พบจริง (STEP 1–2)

**แหล่งข้อมูลที่เข้าถึงได้จริง:** `index.html` (§life-graph), `timeline.html` (12 sections), `js/life-graph.js` (V1 seed), `README`, `IMPLEMENTATION_PLAN.md`, git history
**แหล่งที่เข้าถึงไม่ได้:** ประวัติแชทเต็มของ ChatGPT/other — ข้อมูลที่มีคือสิ่งที่ถูกบันทึกไว้ในไฟล์ของโปรเจกต์เท่านั้น

### ระดับความแม่นยำ

| ระดับ | รายการ |
|---|---|
| exact_date | 17 ธ.ค. 2004 เกิด 08:58 (ชลบุรี/ศรีราชา) · 31 มี.ค. 2025 รับ Lucky · 6 ต.ค. 2026 บันทึกฐานการเงิน ~585,000 · 6 ต.ค. 2026 ตัดสินใจใช้ Windows 10 ต่อ · 7 ต.ค. 2026 เทียบเงินฝาก/ETF · 7 ต.ค. 2026 ตั้งเป้ากระแสเงินสด · 8 ต.ค. 2026 ระบบติดตามพอร์ต · **16 ต.ค. 2023 ปล่อยเพลง "blow my self"** |
| exact_range | 7–8 ต.ค. 2026 วิเคราะห์หุ้น AI/เซมิคอนดักเตอร์ · ส.ค.–ต.ค. 2026 การสูญเสียและเรื่องมรดก |
| exact_month | ก.ค. 2025 42 Bangkok Piscine (วันสิ้นสุดไม่ทราบ) · มี.ค. 2026 น้ำหนัก 74 กก. |
| exact_year | 2022 หางาน KFC/TOPS · 2024 ฝึกทำบีท prod.et1cruel |
| estimated_year | ~2015–2016 ฟุตบอล อายุ 11 · 2026 อุปกรณ์กล้อง/คอนเทนต์/affiliate (ระบุปีจากบริบทบทสนทนา) |
| estimated_range | 2018–2021 เริ่มทำเพลง+ตั้งวง (merged, needs_confirmation) · 2025–2026 ทดลองดนตรี/ซอฟต์แวร์/AI |
| school_period | ป.1 ย้ายบางใหญ่ · มัธยม ราชวินิตบางเขน · จบ ม.6 |
| age_based | ฟุตบอล อายุ ~11 |
| unknown | ช่วงวัยรุ่นขาดเงิน/ความรู้ · งาน KFC/TOPS/ขายนมเปรี้ยว/รอยสัก/เปิดหมวก (ช่วงเวลา) · เริ่ม Python/C++/React/Node/Supabase/AI · เรียนรามคำแหง (อังกฤษ, ชีวภาพ) · หลักสูตรบ้านสมเด็จ · ซ่อมกีตาร์/อุปกรณ์สัก · ส่วนสูง 187 · เป้าหมาย Robotics ที่ปัญญาภิวัฒน์ |

### ⚠️ ความขัดแย้ง 3 จุด (เก็บไว้ให้เจ้าของตรวจ ห้ามผมเลือก)

1. **"ปี 2021 ตอน ม.4" ขัดกับวันเกิด** — เกิด 17 ธ.ค. 2004 → ม.1 = 2017, ม.2 = 2018, ม.3 = 2019, ม.4 = 2020, ม.6 ≈ 2022 (จบ มี.ค. 2023) → ปี 2021 ควรเป็น ม.5 ไม่ใช่ ม.4 (คลาด ~1 ปี) → เก็บเป็น `conflictNote` บน event ที่ merge แล้ว
2. **"เริ่มทำเพลง" 2 เวอร์ชัน** — บรีฟว่า ม.2 (หลังเลิกฟุตบอล) vs `timeline.html` ว่า "2021 ตอน ม.4 ตั้งวง" → **merge เป็น estimated_range 2018–2021** ตามที่เจ้าของเลือก พร้อม conflictNote
3. **"ปล่อยเพลงแรก" ซ้ำสองครั้ง** — 2021 (วง shoegaze) และ 16 ต.ค. 2023 ("blow my self") → เก็บทั้งสองเหตุการณ์ แต่ติด `needs_confirmation` พร้อม note ว่า "มี 2 รายการที่ระบุว่าเป็นเพลงแรก ต้องยืนยันว่าเป็นคนละผลงานหรือข้อมูลซ้ำ"

### ช่วงวัยเด็ก 2004–2017 — ไม่ใช่ช่องว่างข้อมูล

เจ้าของยืนยัน 18 ต.ค. 2026: ปี 2005 อายุ 1 ขวบ · 2014 อายุ 9 ขวบ · 2017 อายุ ~11–12 ขวบ
→ ช่วงนี้เป็น **วัยเด็กตามปกติ ไม่มีเหตุการณ์ที่ต้องบันทึก** ไม่ใช่ข้อมูลที่ขาด

วิธีจัดการ (ห้ามทำตัวเป็นระบบที่ไล่ถามให้เติมช่องว่าง):
- ปี 2004–2017 แสดงเป็น **Childhood band/chapter เดียว** บนไทม์ไลน์และบนกราฟ (แถบพื้นหลังจาง ๆ) เพื่อให้เห็นว่าเป็นช่วงชีวิตหนึ่ง ไม่ใช่รูโหว่ 6 รู
- ทุกปียังคง **เลือกได้** ตามบรีฟ PART 3 ข้อ 1 แต่ปีที่ไม่มีเหตุการณ์แสดงด้วยสีจาง (muted) และข้อความ: **"ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้ — ช่วงวัยเด็ก"** (ไม่ใช้ถ้อยคำที่สื่อว่าข้อมูลขาด หรือชวนเติมให้เต็ม)
- ห้าม veto/ซ่อนปีเปล่า และห้ามเสนอ "ช่วยเติมเหตุการณ์ให้ไหม" กับปีวัยเด็ก
- Years ที่ยังไม่มีข้อมูลจริงหลังวัยเด็ก (ถ้ามีในอนาคต) ใช้ข้อความกลาง ๆ ว่า "ยังไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้"

### Seed inventory (~45 เหตุการณ์ ที่จะนำเข้า)

| id | เหตุการณ์ | ปี/วันที่ | precision | chapter | category |
|---|---|---|---|---|---|
| `birth` | เกิด 08:58 น. ชลบุรี/ศรีราชา | 2004-12-17 | exact_date | childhood | Personal |
| `childhood-chonburi` | เติบโตช่วงแรกที่ชลบุรี/ศรีราชา | — | unknown | childhood | Personal |
| `move-bangyai` | ย้ายมาบางใหญ่ นนทบุรี ตั้งแต่ ป.1 | — | school_period | childhood | Personal |
| `football-age11` | เล่นฟุตบอล (เล่นกับพ่อ) เลิกตอน ม.2 เพื่อไปทำเพลง | 2015 (เจ้าของยืนยันปี) | exact_year | football | Football |
| `music-start` | เริ่มทำเพลงหลังเลิกฟุตบอล (ม.2) + ตั้งวง shoegaze ม.4 | 2018–2021 | estimated_range | music-origin | Music |
| `teen-struggle` | วัยรุ่น: ไม่มีเงิน/ไม่มีความรู้ ผ่านด้วยการสู้ | — | unknown | learning-struggle | Personal Growth |
| `work-kfc-tops-2022` | หางานทำ KFC / TOPS เก็บเงินซื้ออุปกรณ์ทำเพลง | 2022 | exact_year | work | Work |
| `release-blow-myself` | ปล่อยเพลง "blow my self" | 2023-10-16 | exact_date | music-production | Music |
| `grad-m6` | จบ ม.6 โรงเรียนราชวินิตบางเขน | — | school_period | education | Education |
| `uni-ramkhamhaeng-english` | เรียนมนุษยศาสตร์ เอกภาษาอังกฤษ รามคำแหง | — | unknown | education | Education |
| `uni-biotech-paused` | เรียนเทคโนโลยีชีวภาพ รามคำแหง แล้วพักเส้นทาง | — | unknown | education | Education |
| `band-breakup-post-m6` | จบ ม.6 แล้ววงแตกย้ายกันไป | — | school_period | music-origin | Music |
| `prod-et1cruel-2024` | ฝึกทำบีท · prod.et1cruel · ขายบีท/สอนทำบีท | 2024 | exact_year | music-production | Business |
| `lucky-adopted` | รับหนูสีขาวชื่อ Lucky มาเลี้ยง | 2025-03-31 | exact_date | current-life | Personal |
| `piscine-42bkk` | เข้า 42 Bangkok Piscine แล้วหยุดเส้นทาง | 2025-07 | exact_month | education | Coding |
| `tech-exploration` | ทดลองดนตรี/ซอฟต์แวร์/AI/วิศวกรรมควบคู่กัน | 2025–2026 | estimated_range | coding-software | Coding |
| `learn-programming` | Python, C++, HTML/CSS/JS, React, Node, Express, Supabase, Git, VS Code, Vercel | — | unknown | coding-software | Coding |
| `ai-agents-exploration` | สร้าง/ทดลอง AI Agent, Local LLM, Automation (n8n, Docker, Hermes) | — | unknown | ai-automation | AI |
| `robotics-planning` | สนใจ Embedded/อิเล็กทรอนิกส์/หุ่นยนต์ · พิจารณาเรียน Robotics ที่ปัญญาภิวัฒน์ | — | unknown | robotics | Robotics |
| `work-milk-sales` | ขายนมเปรี้ยว | — | unknown | work | Work |
| `work-busking` | เล่นดนตรีเปิดหมวก | — | unknown | work | Work |
| `work-tattoo-design` | ออกแบบรอยสัก + งบอุปกรณ์ฝึกสัก 2,200 | — | unknown | work | Work |
| `weight-74kg` | น้ำหนัก 74 กก. | 2026-03 | exact_month | current-life | Personal |
| `height-187` | ส่วนสูง ~187 ซม. | — | unknown | current-life | Personal |
| `family-loss-inheritance` | สูญเสียคนในครอบครัว + เรื่องมรดก | 2026-08→10 | estimated_range | current-life | Personal |
| `inheritance-deadline` | กำหนดการเรื่องมรดก | 2026-10-26 | exact_date (future) | future-goals | Personal |
| `finance-baseline` | วางฐานการเงิน ~585,000 (เงินฝาก/เงินสด/หุ้น US/BTC) | 2026-10-06 | exact_date | current-life | Finance |
| `finance-deposit-vs-etf` | เทียบเงินฝากกับ JEPQ/JEPI/QQQI/SCHD/VOO | 2026-10-07 | exact_date | current-life | Finance |
| `finance-cashflow-plan` | วางแผนกระแสเงินสด + เป้าพอร์ต 5 ล้าน | 2026-10-07 | exact_date | current-life | Finance |
| `finance-ai-stocks` | วิเคราะห์หุ้นห่วงโซ่ AI/เซมิคอนดักเตอร์ | 2026-10-07→08 | exact_range | current-life | Finance |
| `portfolio-tracker` | อยากได้ระบบติดตามพอร์ตแบบ Dime | 2026-10-08 | exact_date | coding-software | Technology |
| `windows10-decision` | ยืนยันใช้ Windows 10 ต่อ ไม่ข้ามไป 11 | 2026-10-06 | exact_date | coding-software | Technology |
| `pc-workstation` | PC i5-12400 / RTX 4060 8GB / 32GB RAM | 2026-10 | estimated_year | current-life | Technology |
| `gear-camera-instaz` | Insta360 Ace Pro 2 + ชุดอุปกรณ์ (งบรวม 15,489) | 2026 | estimated_year | current-life | Content Creation |
| `content-affiliate` | Shopee Affiliate ผ่าน · ศึกษา TikTok Affiliate | 2026 | estimated_year | current-life | Content Creation |
| `gear-guitar-repair` | ซ่อมกีตาร์ SG / สายเบส / แอมป์ | — | unknown | music-production | Music |
| `music-et1cruel-identity` | ตัวตน et1cruel / prod.et1cruel / dir.et1cruel / akase001e8 | — | unknown | music-production | Music |
| `thai-beat-academy` | แนวคิด Thai Beat Academy (คอร์ส 990 · สมาชิก · ภาคี) | — | unknown | music-production | Business |
| `life-os-build` | พัฒนา ET1CRUEL LIFE OS | 2026 | exact_year | current-life | Technology |
| **เป้าหมายอนาคต (isFuture)** | | | | | |
| `goal-music-artist` | เติบโตเป็น Music Artist & Producer | — | unknown | future-goals | Future Goals |
| `goal-software-engineer` | เป็น Software Engineer + สร้างผลิตภัณฑ์ของตัวเอง | — | unknown | future-goals | Future Goals |
| `goal-ai-own` | สร้าง AI Agents และระบบ AI ของตัวเอง | — | unknown | future-goals | Future Goals |
| `goal-robotics` | พัฒนาทักษะ Robotics Engineering → humanoid | — | unknown | future-goals | Future Goals |
| `goal-stable-income` | รายได้มั่นคงจากงาน/ผลงานของตัวเอง | — | unknown | future-goals | Future Goals |
| `goal-portfolio-5m` | พอร์ต 5 ล้าน + กระแสเงินสด 25,000–30,000/เดือน | — | unknown | future-goals | Future Goals |
| `goal-beat-academy-business` | Thai Beat Academy เป็นแพลตฟอร์มที่สร้างรายได้จริง | — | unknown | future-goals | Business |
| `goal-freedom` | อิสระในการใช้ชีวิต ทำงานเพลง เดินทาง บันทึกชีวิต | — | unknown | future-goals | Future Goals |

เหตุการณ์ที่ผูกหลาย chapter ให้เลือกบทหลักแล้วใส่บทอื่นใน `tags`

หมายเหตุ: `football-age11` — เจ้าของยืนยันปี 18 ต.ค. 2026 ว่าคือ **2015** จึงเป็น `exact_year` / `confirmed` (เดิมเคยประมาณ 2015–2016 จากอายุ) ส่วนปีที่เลิกเล่นผูกกับ "ม.2" ให้คงเป็น `unknown` แล้วโยงด้วย `relatedProjectIds`/note ไปที่ `music-start`
และ `music-start` ที่ merge เป็น 2018–2021 ต้องมี `conflictNote` บอกทั้งสองเวอร์ชัน (ม.2 vs 2021 ม.4) ห้ามเลือกข้าง

## Left to builder

- รายละเอียดตำแหน่ง Y ของ Mode A (heuristic) — ขอให้ deterministic และอธิบายได้
- จำนวน label ที่แสดงพร้อมกันในแต่ละ zoom — ขอให้ label ไม่ทับกันจริงบนจอ 360px
- โครง markup ภายใน `#life-graph` — ขอให้คง id ที่ JS เดิมอ้างถึง หรืออัปเดต JS ให้ตรงกันทั้งหมด
- วิธีแนบ tag `health`/`from-art` ตอน migrate v1 — ขอให้ข้อมูลไม่หายและตรวจย้อนได้
