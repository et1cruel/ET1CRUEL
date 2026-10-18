# LIFE GRAPH V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** อัปเกรด `#life-graph` ในหน้า Home ของ ET1CRUEL Life OS ให้เป็นไทม์ไลน์ชีวิตรายปี 2004–2026 + Stock-Style Life Graph ที่ใช้ข้อมูลชุดเดียวกัน โดยไม่แต่งประวัติขึ้นเอง และไม่ทำลาย Dashboard เดิม

**Architecture:** แยก 2 ไฟล์ตาม pattern เดียวกับห้องอื่น: `js/life-graph-data.js` = taxonomies + seed จริง (~45 เหตุการณ์) เป็นข้อมูลล้วน และ `js/life-graph.js` = ตรรกะบริสุทธิ์ที่ทดสอบได้ (`window.ET1LIFE_CORE`) + ชั้น DOM/render ที่ทำงานเฉพาะเมื่อเจอ `#life-graph` เก็บข้อมูลที่ `localStorage['et1cruel.life-graph.v2']` พร้อม migrate จาก `.v1` แบบไม่ทำข้อมูลผู้ใช้หาย ไม่มี dependency ใหม่ ไม่มี backend

**Tech Stack:** Static HTML + vanilla ES5-style JS + inline/external CSS (ไม่มี build step) + Playwright 1.64 (ติดตั้งแล้ว) สำหรับตรวจผลบนเบราว์เซอร์จริง + node สำหรับ unit test

**Spec:** `docs/superpowers/specs/2026-10-18-life-graph-v2-design.md` — แผนนี้อ้างจากสเปก ผู้ทำต้องอ่านทั้งคู่ (ตาราง seed inventory และกฎกันข้อมูลหายอยู่ในสเปก)

## Global Constraints

- Static multi-page ล้วน ไม่มี framework/bundler/backend — deploy GitHub Pages ผ่าน push main
- localStorage เท่านั้น; key ใหม่ `et1cruel.life-graph.v2`; ห้ามแตะ/ลบ key อื่น (ดูรายการ key ห้ามชน: `et1cruel.life-graph.v1`, `et1cruel.life-graph.v1.focus`, `et1cruel.innercore.v1`, `et1cruel.upskill.v1`, `et1cruel.musicroom.v1`, `et1cruel_diary_v1`)
- **ห้ามลบ/ทับข้อมูลที่ผู้ใช้สร้างหรือแก้** (`createdAt != null` หรือ `userEdited === true`) ทุกกรณี
- 14 categories canonical: `Personal, Football, Music, Education, Work, Finance, Technology, Coding, AI, Robotics, Content Creation, Business, Personal Growth, Future Goals` — ห้ามเพิ่ม/เปลี่ยนชื่อ
- 12 chapters canonical: `childhood, football, music-origin, learning-struggle, education, work, music-production, coding-software, ai-automation, robotics, current-life, future-goals` — ห้ามเพิ่ม/เปลี่ยน
- `datePrecision` ∈ `exact_date|exact_year|estimated_year|estimated_range|school_period|age_based|unknown`
- `dateStatus` ∈ `confirmed|estimated|needs_confirmation|unknown` · `dateSource` ∈ `user_reported|project_record|imported_record|derived_estimate`
- `selfAssessmentScore` = 1–10 (ผู้ใช้กรอกเองเท่านั้น, ห้าม seed) · ค่า > 10 จาก V1 → ติด `legacyScale:true` ห้ามแปลงเงียบ
- `importance` (1–3) และ `narrativeLevel` (0–100) = การจัดวางเชิงภาพ ต้องมี label กำกับว่าของจริงใน UI ทุกที่
- ห้ามใช้รายได้/ผู้ติดตาม/จำนวนโปรเจกต์เป็นตัวแทนคุณภาพชีวิต
- ปี 2004–2017 = ช่วงวัยเด็ก ใช้ถ้อยคำ "ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้ — ช่วงวัยเด็ก"; ห้ามระบบชวนเติมเหตุการณ์ให้ปีวัยเด็ก
- วันที่แสดงคู่กันเสมอ: `พ.ศ. (ค.ศ.)`
- ภาษาไทยหลัก + ศัพท์ EN; ความแม่นยำของวันที่ต้องมีป้ายกำกับทุกที่ที่แสดง; เคารพ `prefers-reduced-motion`
- ห้ามแตะ `timeline.html` · ห้ามเปลี่ยนธีมเว็บ · ห้าม push อัตโนมัติ

## Review Focus

1. **localStorage ถูกยัดค่าขยะ/ผิด نوع** (ไม่ใช่ JSON, `records` ไม่ใช่ array, record ไม่มี `id`) → ต้องไม่ crash ไม่จอขาว และ **ไม่ลบข้อมูลเดิม**; คาดหวัง: เริ่มจาก seed + แสดง notice
2. **ข้อมูล V1 จริงในเครื่องผู้ใช้** (`date` เป็น string, `status`, `storyLevel`, `importance`, category/chapter ชุดเก่า) → migrate แล้ว **จำนวน record ที่ผู้ใช้สร้างเองต้องไม่ลดลงแม้แต่รายการเดียว**
3. **ไฟล์ import ที่ schema ผิด / id ซ้ำ / ก้อนใหญ่ผิดปกติ** → ปฏิเสธพร้อมบอกเหตุผล และ **ห้ามเขียนทับข้อมูลเดิมก่อนผู้ใช้ยืนยัน**
4. **record ที่ไม่มีปี หรือเป็น future** → ต้องไม่ถูกวาดบนแกนเวลาเหมือนมีวันที่ (ต้องไปอยู่ Undated / อนาคตเท่านั้น)
5. **จอ 360px + คีย์บอร์ดล้วน** → ชิปปี/label บนกราฟไม่ทับกันจนอ่านไม่ได้, Tab ถึงทุกปุ่ม, focus มองเห็น, ข้อความไทยไม่ล้นกล่อง

---

### Task 1: ไฟล์ข้อมูล `js/life-graph-data.js` + ตัวตรวจข้อมูล

**Files:**
- Create: `js/life-graph-data.js`
- Create: `tools/life-graph-data-check.mjs`
- Read (แหล่งข้อมูล ไม่แก้): `docs/superpowers/specs/2026-10-18-life-graph-v2-design.md` (ตาราง Seed inventory + §Data audit), `timeline.html`

**Interfaces:**
- Produces: `window.ET1LIFE_DATA = { version:2, categories:[string x14], categoryNames:{[category]:string}, chapters:[{id,title,titleTh,category,description} x12], seeds:[record x~45], yearRange:[2004,2026], childhoodRange:[2004,2017], futureYearKey:'future', birthDate:'2004-12-17', birthTime:'08:58', nowYearCE:2026, v1ChapterMap:{[v1id]:v2id}, v1CategoryMap:{[v1cat]:v2cat}, v1CategoryTag:{[v1cat]:tag} }`
- Produces: ทุก record ใน `seeds` ใช้รูปทรงตาม §Data model ของสเปก (คีย์ครบทุกตัว; ค่าที่ไม่มี = `null`/`''`/`[]`)

- [ ] **Step 1: เขียนด่านตรวจก่อน (ยังไม่มีไฟล์ข้อมูล ให้ FAIL)**

สร้าง `tools/life-graph-data-check.mjs`:

```js
import { readFileSync } from 'node:fs';
const src = readFileSync('js/life-graph-data.js', 'utf8');
const window = {}; eval(src);
const D = window.ET1LIFE_DATA;
const errs = [];
const CATS = ['Personal','Football','Music','Education','Work','Finance','Technology','Coding','AI','Robotics','Content Creation','Business','Personal Growth','Future Goals'];
const CH = ['childhood','football','music-origin','learning-struggle','education','work','music-production','coding-software','ai-automation','robotics','current-life','future-goals'];
const PREC = ['exact_date','exact_year','estimated_year','estimated_range','school_period','age_based','unknown'];
const DST = ['confirmed','estimated','needs_confirmation','unknown'];
const DSRC = ['user_reported','project_record','imported_record','derived_estimate'];
if (!D) errs.push('no ET1LIFE_DATA');
else {
  if (D.categories.join('|') !== CATS.join('|')) errs.push('categories mismatch');
  if (D.chapters.map(c => c.id).join('|') !== CH.join('|')) errs.push('chapters mismatch');
  const ids = new Set();
  for (const r of D.seeds) {
    const tag = r.id || '(no id)';
    if (ids.has(r.id)) errs.push('duplicate id ' + tag); ids.add(r.id);
    if (!CATS.includes(r.category)) errs.push(tag + ' bad category');
    if (!CH.includes(r.chapterId)) errs.push(tag + ' bad chapterId');
    if (!PREC.includes(r.datePrecision)) errs.push(tag + ' bad datePrecision');
    if (!DST.includes(r.dateStatus)) errs.push(tag + ' bad dateStatus');
    if (!DSRC.includes(r.dateSource)) errs.push(tag + ' bad dateSource');
    if (typeof r.importance !== 'number' || r.importance < 1 || r.importance > 3) errs.push(tag + ' bad importance');
    if (r.selfAssessmentScore !== null) errs.push(tag + ' seeded selfAssessmentScore (must be null)');
    if (r.isFuture && r.dateStatus === 'confirmed') errs.push(tag + ' future marked confirmed');
    if (r.dateStatus === 'confirmed' && !r.startDate && r.startYearCE === null) errs.push(tag + ' confirmed without a date');
    if (r.startYearCE !== null && (r.startYearCE < 1900 || r.startYearCE > 2200)) errs.push(tag + ' year out of range');
  }
}
const goals = (D?.seeds || []).filter(r => r.isFuture);
if (!goals.every(g => g.startYearCE === null && g.endYearCE === null)) errs.push('future goals must have null years until owner sets them');
if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
console.log('OK data: ' + D.seeds.length + ' seeds, ' + goals.length + ' goals');
```

- [ ] **Step 2: รันให้เห็นว่า FAIL**

Run: `node tools/life-graph-data-check.mjs`
Expected: FAIL — `ENOENT` (ยังไม่มี `js/life-graph-data.js`)

- [ ] **Step 3: เขียน `js/life-graph-data.js`**

โครงไฟล์: `(function(){ 'use strict'; window.ET1LIFE_DATA = { ... }; })();`

- `categories` ตาม Global Constraints (เรียงตามลำดับนี้เป๊ะ)
- `categoryNames` แปลไทย: `{Personal:'ส่วนตัว', Football:'ฟุตบอล', Music:'ดนตรี', Education:'การศึกษา', Work:'งาน', Finance:'การเงิน', Technology:'เทคโนโลยี', Coding:'โค้ด/เขียนโปรแกรม', AI:'AI', Robotics:'หุ่นยนต์', 'Content Creation':'งานคอนเทนต์', Business:'ธุรกิจ', 'Personal Growth':'การเติบโตส่วนบุคคล', 'Future Goals':'เป้าหมายอนาคต'}`
- `chapters` 12 ตัวตามลำดับ Global Constraints โดย `title` = EN จากสเปก (ตาราง 12 Life Chapters) และ `titleTh` = ชื่อไทยในตารางเดียวกัน; `category` = หมวดหลักของบทนั้น
- `seeds` = **ทุกแถวในตาราง "Seed inventory" ของสเปก** (~45 รายการ) ตัวเลข/ปี/เดือน ต้องคัดจากตารางเท่านั้น **ห้ามเพิ่มเหตุการณ์เอง ห้ามปรับปีเอง**
  - record ที่ยกมาจากตารางมี `dateSource:'user_reported'` และ `sourceReference` ชี้ส่วนของ `timeline.html` หรือ `index.html` ที่ข้อมูลนั้นอยู่
  - `music-start`: `startYearCE:2018, endYearCE:2021, datePrecision:'estimated_range', dateStatus:'needs_confirmation'` + `conflictNote` ที่บอกทั้งสองเวอร์ชัน (ม.2 vs 2021 ม.4) ตามสเปก
  - `release-blow-myself`: `startDate:'2023-10-16', datePrecision:'exact_date', dateStatus:'confirmed'`
  - `football-age11`: `startYearCE:2015, endYearCE:null, datePrecision:'exact_year', dateStatus:'confirmed'`
  - `music-start` และ `release-blow-myself` ต้องมี `conflictNote` เรื่อง "ปล่อยเพลงแรก" ซ้ำสองครั้ง
  - ทุกแถวที่คอลัมน์ปีเป็น `—`: `startYearCE:null, endYearCE:null, datePrecision:'unknown', dateStatus:'unknown'`
  - แถวในกลุ่ม "เป้าหมายอนาคต": `type:'goal', isFuture:true, status:'planned', startYearCE:null, endYearCE:null`
  - `birth`: `isAnchor:true, startDate:'2004-12-17', datePrecision:'exact_date', dateStatus:'confirmed'`
  - `life-os-build` และ `current-life` ตัวที่ใช้แทนปัจจุบัน: `isCurrent:true`
  - ทุก record: `selfAssessmentScore:null, narrativeLevel:null, importance` 1–3 (3 = จุดเปลี่ยนสำคัญ เช่น `music-start`, `release-blow-myself`, `finance-baseline`; 1 = รายละเอียดประกอบ)
- `v1ChapterMap` / `v1CategoryMap` / `v1CategoryTag` ตามสเปก §Taxonomies เป๊ะ (ทั้ง 9 chapter เก่า และ 17 category เก่าต้องมีปลายทางครบ)

- [ ] **Step 4: รันให้ผ่าน**

Run: `node tools/life-graph-data-check.mjs`
Expected: `OK data: ~45 seeds, 8 goals` (ตัวเลขต้องตรงกับจำนวนแถวจริงในตารางสเปก)

- [ ] **Step 5: ตรวจพ้องกับสเปกด้วยตา 1 รอบ**

เปิดตาราง Seed inventory เทียบทีละแถวว่ามี record ครบ ห้ามขาด ห้ามเกิน
Expected: จำนวนแถวในตาราง == `D.seeds.length`

- [ ] **Step 6: Commit**

```bash
git add js/life-graph-data.js tools/life-graph-data-check.mjs
git commit -m "feat(life-graph): v2 seed data - 14 categories, 12 chapters, real timeline events with honest date precision"
```

---

### Task 2: ตรรกะบริสุทธิ์ `window.ET1LIFE_CORE` + unit test

**Files:**
- Modify: `js/life-graph.js` (เขียนใหม่ทั้งไฟล์; คงชื่อไฟล์เดิมเพื่อไม่ให้ `src` ใน index.html พัง)
- Create: `tools/life-graph-core-test.mjs`

**Interfaces:**
- Consumes: `window.ET1LIFE_DATA` (Task 1)
- Produces: `window.ET1LIFE_CORE = { KEY_V2, KEY_V1, normalizeRecord, migrateV1Record, readState, mergeSeeds, validateImport, importIntoState, sortChronological, recordsForYear, undatedRecords, futureRecords, formatYear, formatDateRange, graphLayout }`
  - `normalizeRecord(raw) -> record` — เติมคีย์ที่ขาด, บังคับ enum ที่ผิดให้เป็นค่าปลอดภัย (`category`→`Personal`, `datePrecision`→`unknown`), และ **ต้องรักษา `legacyScale`, `migratedFrom`, `userEdited`, `createdAt`, `updatedAt`, `deletedSeedIds` ไว้เสมอ** (ข้อมูลผู้ใช้ห้ามหาย) ส่วนคีย์ที่ไม่รู้จักให้เก็บรวมไว้ใน `legacy:{...}` ไม่ทิ้ง
  - `migrateV1Record(v1) -> record` — map `date`(string)→`startDate/startYearCE/datePrecision`, `status` คงไว้, `storyLevel`→`narrativeLevel`, `importance` คงไว้, `chapterId`/`category` ผ่าน v1 map, `selfAssessmentScore>10`→`legacyScale:true`, ใส่ `migratedFrom:'v1'`
  - `readState(rawV2, rawV1, data) -> {records, deletedSeedIds, meta, notice}` — อ่าน v2 ก่อน; ถ้าไม่มี อ่าน v1 แล้ว migrate **ทั้งก้อน** ผ่าน `migrateV1Record`; ถ้าพังทั้งคู่ → seed; ห้าม throw
  - `mergeSeeds(records, seeds, deletedSeedIds) -> records` — เพิ่ม seed ที่ยังไม่มี; **ไม่แตะ** record ที่ `userEdited || createdAt`; ข้าม `deletedSeedIds`
  - `validateImport(text) -> {ok:true,payload} | {ok:false,reason:string}` — ต้องเช็ค: parse ได้, `records` เป็น array, `records.length <= 5000`, ทุก record มี `id` เป็น string และ `title` เป็น string
  - `importIntoState(state, payload) -> {state, added, updated}` — merge, record ที่ id ตรงกับ seed → `userEdited:true`
  - `recordsForYear(records, yearCE) -> record[]` — ครอบทั้งปีเดียวและช่วงปี (`startYearCE <= y <= endYearCE`) และไม่รวม `isFuture`
  - `undatedRecords(records) -> record[]` — `startYearCE === null && !isFuture && !isAnchor`? **ไม่ใช่** — anchor (วันเกิด) มีปี ให้อยู่บนเส้น; undated = `startYearCE === null && !isFuture`
  - `formatYear(y) -> string` — `(y+543) + ' (' + y + ')'`
  - `formatDateRange(record) -> string` — ตาม `datePrecision`; `unknown` → `'ปีไม่ระบุ'`; `estimated_*` → ขึ้นต้น `'ประมาณ '`; `school_period` → `'ช่วงระดับชั้น (ปีไม่ระบุ)'`
  - `graphLayout(records, opts{ mode:'narrative'|'self', minYear, maxYear }) -> { points:[{id,x,y,labelSide}], segments:[[id,...]], futurePoints:[...], years:[{x,label}], width, height, hiddenLabelCount }`

- [ ] **Step 1: เขียน unit test ที่ยังไม่ผ่าน**

สร้าง `tools/life-graph-core-test.mjs` — โหลด `js/life-graph-data.js` + `js/life-graph.js` ด้วย shim (`globalThis.window = {}`, ไม่มี `document`) แล้วทดสอบผ่าน `window.ET1LIFE_CORE`:

```js
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
globalThis.window = {};
eval(readFileSync('js/life-graph-data.js', 'utf8'));
eval(readFileSync('js/life-graph.js', 'utf8'));
const C = window.ET1LIFE_CORE, D = window.ET1LIFE_DATA;
assert.ok(C, 'ET1LIFE_CORE must exist without a DOM');

// ขยะเข้า ต้องไม่ throw และไม่ทำข้อมูลหาย
const junk = C.readState('{{{not json', null, D);
assert.ok(Array.isArray(junk.records) && junk.records.length >= D.seeds.length);
assert.ok(junk.notice, 'ต้องมี notice เมื่ออ่านข้อมูลเดิมไม่ได้');

// v1 → v2: record ที่ผู้ใช้สร้างเองต้องรอด 100%
const v1user = JSON.stringify({ version:1, records:[{ id:'user-1', title:'ของฉัน', description:'x', category:'Art', chapterId:'music-artist', date:'2024-05-05', endDate:null, datePrecision:'exact', status:'in-progress', type:'milestone', importance:2, evidenceNote:'note', tags:['a'], createdAt:'2024-06-01T00:00:00.000Z', updatedAt:null, storyLevel:80, selfAssessmentScore:40 }] });
const st = C.readState(null, v1user, D);
const mine = st.records.find(r => r.id === 'user-1');
assert.ok(mine, 'user record must survive migration');
assert.equal(mine.category, 'Content Creation');      // Art → Content Creation
assert.equal(mine.chapterId, 'music-production');      // music-artist → music-production
assert.equal(mine.startDate, '2024-05-05');
assert.equal(mine.narrativeLevel, 80);                 // storyLevel → narrativeLevel
assert.equal(mine.selfAssessmentScore, 40);
assert.equal(mine.legacyScale, true);                  // >10 ห้ามแปลงเงียบ
assert.equal(mine.createdAt, '2024-06-01T00:00:00.000Z');

// seed merge ห้ามทับของที่ผู้ใช้แก้
const edited = st.records.map(r => r.id === 'release-blow-myself' ? { ...r, title:'แก้เอง', userEdited:true } : r);
const merged = C.mergeSeeds(edited, D.seeds, []);
assert.equal(merged.find(r => r.id === 'release-blow-myself').title, 'แก้เอง');
assert.equal(C.mergeSeeds(merged, D.seeds, []).length, merged.length, 'merge ต้อง idempotent');

// import แย่ ๆ ต้องถูกปฏิเสธพร้อมเหตุผล
assert.equal(C.validateImport('{"records":"nope"}').ok, false);
assert.equal(C.validateImport('{"records":[{"title":"no id"}]}').ok, false);
assert.equal(C.validateImport('{"records":[{"id":"a","title":"t"}]}').ok, true);

// ปีในอดีต + ช่วงปี + undated + future
assert.ok(C.recordsForYear(D.seeds, 2015).some(r => r.id === 'football-age11'));
assert.ok(C.recordsForYear(D.seeds, 2019).some(r => r.id === 'music-start'), 'ช่วงปีต้องครอบปีในกลางช่วง');
assert.ok(!C.recordsForYear(D.seeds, 2019).some(r => r.isFuture));
assert.ok(C.undatedRecords(D.seeds).every(r => r.startYearCE === null && !r.isFuture));
assert.equal(C.formatYear(2026), '2569 (2026)');

// กราฟ: ไม่มีปี = ห้ามอยู่บนเส้น · mode self ต้องไม่เชื่อมข้ามช่องที่ไม่มีคะแนน
const L = C.graphLayout(D.seeds, { mode:'narrative', minYear:2004, maxYear:2026 });
assert.ok(L.points.every(p => p.x >= 0 && p.x <= L.width));
assert.equal(L.points.length + L.futurePoints.length + C.undatedRecords(D.seeds).length, D.seeds.filter(r => !r.isFuture).length);
const S = C.graphLayout(D.seeds, { mode:'self', minYear:2004, maxYear:2026 });
assert.equal(S.points.length, 0, 'ไม่มีใครกรอกคะแนน = ไม่มีจุด');
assert.equal(S.hiddenLabelCount >= 0, true);
console.log('OK core');
```

- [ ] **Step 2: รันให้เห็นว่า FAIL**

Run: `node tools/life-graph-core-test.mjs`
Expected: FAIL — `ET1LIFE_CORE must exist without a DOM`

- [ ] **Step 3: เขียน `js/life-graph.js` ส่วน core**

โครงไฟล์: `(function(){ 'use strict'; ...core...; if(typeof window!=='undefined') window.ET1LIFE_CORE = {...}; if(typeof document==='undefined') return; var root=document.getElementById('life-graph'); if(!root) return; ...DOM code (Task 3-5) ... })();`
สำคัญ: `if(typeof document==='undefined') return;` ต้องมาก่อนการอ้าง `document` ทุกบรรทัด เพื่อให้โหลดใน node ได้

ค่า Mode A ที่ต้องใช้เป๊ะ (deterministic, อธิบายได้):

```js
var CH_BASE = { childhood:0.18, football:0.26, 'music-origin':0.40, 'learning-struggle':0.34,
  education:0.44, work:0.50, 'music-production':0.58, 'coding-software':0.66,
  'ai-automation':0.74, robotics:0.82, 'current-life':0.72, 'future-goals':0.88 };
// y = CH_BASE[chapterId] + (importance - 2) * 0.02  → clamp 0.05..0.95
// ถ้า narrativeLevel != null → y = narrativeLevel / 100
// screenY = bottom - y * (bottom - top)
```

- [ ] **Step 4: รันให้ผ่าน**

Run: `node tools/life-graph-core-test.mjs`
Expected: `OK core`

- [ ] **Step 5: ยืนยันว่ายังโหลดในเบราว์เซอร์ได้จริง**

Run: `node --check js/life-graph.js`
Expected: ไม่มี output (syntax ผ่าน)

- [ ] **Step 6: Commit**

```bash
git add js/life-graph.js tools/life-graph-core-test.mjs
git commit -m "feat(life-graph): v2 pure core - v1 migration that never drops user records, seed merge with tombstones, import validation, year index, graph layout"
```

---

### Task 3: โครงหน้าใหม่ + แถบปี + ไทม์ไลน์รายปี

**Files:**
- Modify: `index.html` (section `#life-graph` บรรทัด ~742-786 + script/link บรรทัด 660-661)
- Modify: `css/life-graph.css`
- Modify: `js/life-graph.js` (ส่วน DOM: Year navigation + timeline view)

**Interfaces:**
- Consumes: `ET1LIFE_CORE` (Task 2), `ET1LIFE_DATA` (Task 1)
- Produces: DOM contract ที่ Task 4/5/7 พึ่งพา: `#lg-years` (ชิปปี `<button data-lg-year="2004">` / `data-lg-year="future"`), `.lg-year-chip.is-active/.is-empty`, `[data-all-years] [data-today] [data-prev-year] [data-next-year]`, `[data-lg-view="timeline|graph|chapters|map"]`, `#lg-content .lg-year-group[data-year]` + `.lg-event`, `#lg-content .lg-chapter-card` (12 ใบ), `.lg-map` (ของเดิม), `#lg-year-detail`, `#lg-notice`

- [ ] **Step 1: วางแท็ก + id ใหม่ใน `index.html`**

แทนบล็อก toolbar/markup เดิมใน `#life-graph` (คง `#lg-today`, `#lg-age`, `#lg-milestones`, `#lg-chapters`, `#lg-active`, `#lg-stat-years`, `#lg-notice`, `#lg-category`, `#lg-search`, `#lg-result-count`, `#lg-content`, `#lg-detail`, `#lg-dialog`, `#lg-form`, `[data-add]`, `[data-export]` ไว้ครบ เพื่อไม่ให้ของเดิมพัง) แล้วเพิ่ม:
- แถบปี: `<div id="lg-years" class="lg-years" role="group" aria-label="เลือกปี"></div>` + ปุ่ม `[data-prev-year] [data-next-year] [data-today] [data-all-years]`
- toggle `[data-lg-labels]` (aria-pressed) สำหรับ "แสดง Label ทั้งหมด"
- `<section id="lg-year-detail" hidden aria-live="polite"></section>`
- แท็บมุมมอง: `data-lg-view="timeline"|"graph"|"chapters"|"map"` (เพิ่ม `chapters`, คง `map` ของเดิม)
- `<button type="button" data-import>นำเข้า JSON</button>` + `<input type="file" id="lg-import-file" accept="application/json" hidden>`
- เปลี่ยน `<script defer src="js/life-graph.js">` เป็น:
  `<script defer src="js/life-graph-data.js?v=2"></script>` แล้วตามด้วย `<script defer src="js/life-graph.js?v=2"></script>` และ `<link rel="stylesheet" href="css/life-graph.css?v=2">`

- [ ] **Step 2: เขียนสไตล์สำหรับของใหม่ใน `css/life-graph.css`**

เพิ่มต่อท้าย (ห้ามรื้อของเดิม): `.lg-years` (flex wrap, scroll แนวนอนบนจอเล็ก), `.lg-year-chip` + `.is-active` + `.is-empty` (จาง), `.lg-chapter-band` (แถบพื้นหลังจางสำหรับ childhood 2004–2017), `.lg-year-group`, `.lg-empty-year`, `.lg-graph-note`, `.lg-legend`, `.lg-import-row` — โทนมืดเดิม (`#0d1016`, `#171c26`, stroke `#30394a`) + accent เดิม (`#398fe5` ฟ้า, `#14b88a` เขียว, dashed สำหรับอนาคต)
ต้องมี `@media(max-width:560px)` ให้ชิปปีเลื่อนแนวนอนได้และข้อความไม่ล้น และ `@media(prefers-reduced-motion:reduce)` ปิด transition

- [ ] **Step 3: เขียน DOM code — แถบปี + ไทม์ไลน์รายปี + มุมมอง Chapters + Life Map**

```
render() ประกอบ: แถบปีทุกปี 2004..2026 (23 ชิป) + ชิป 'future'
  - ปีใน childhoodRange ที่ไม่มีเหตุการณ์ → .is-empty + ถ้อยคำวัยเด็ก
  - ปีที่มีเหตุการณ์ → .is-active เมื่อเลือก
คลิกปี → state.year = y; วาด #lg-year-detail (สรุปปี: จำนวนเหตุการณ์, หมวดที่มี, ปีที่ดำเนินต่อจากปีก่อน)
  - เหตุการณ์ที่คร่อมหลายปีต้องขึ้นในปีนั้นด้วย + ป้าย 'ต่อเนื่องจาก <ปีเริ่ม>'
  - ปีไม่มีเหตุการณ์: '<p class="lg-empty-year">ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้ — ช่วงวัยเด็ก</p>' (หรือถ้อยคำกลาง ๆ ถ้าอยู่นอกช่วงวัยเด็ก)
  - ปุ่ม ‹ ปีก่อนหน้า › / ปีถัดไป › / วันนี้ / ทุกปี ต้องทำงานกับ state.year
  - ทุกปี + 'future' ต้องเลือกได้ (ปีที่ไม่มีเหตุการณ์ต้องไม่ถูกซ่อนหรือปิดใช้งาน)
ไทม์ไลน์: จัดกลุ่มตามปีเป็น .lg-year-group[data-year] ภายใน #lg-content พร้อม .lg-event เดิม (การ์ดเดิมใช้ต่อ)
มุมมอง chapters (Level 2 ของบรีฟ): การ์ดบทชีวิตครบ 12 บทเรียงตามลำดับ canonical
  - แต่ละบทแสดงชื่อ EN + ไทย, ช่วงปีที่ครอบ (จากเหตุการณ์ที่ผูกอยู่, ถ้าไม่มีปีให้ขึ้น 'ปีไม่ระบุ'), จำนวนเหตุการณ์, และรายการเหตุการณ์ย่อที่กดเข้าไปดูได้
  - ต้องแสดงข้อความกำกับว่าบทชีวิตเป็น 'หมวดจัดระเบียบ ไม่ใช่ข้ออ้างว่ามีวันเริ่ม–สิ้นสุดที่แน่นอน'
มุมมอง map: คง Life Map ของเดิมไว้ทำงานเหมือนเดิม (ไม่ลบของเดิม) โดยอัปเดตป้ายว่าเป็น 'แผนที่แนวคิด ไม่ใช่ลำดับความสำเร็จหรือสถานะทักษะ'
```

- [ ] **Step 4: ตรวจบนเบราว์เซอร์จริง**

Run: `node tools/verify-life-graph.mjs` — **ยังไม่มีไฟล์นี้ ให้สร้างสคริปต์ชั่วคราวก่อน** (ดู Step 5 ของ Task 7 สำหรับของถาวร):
```js
// tools/_tmp-check.mjs
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:900} });
const errs=[]; p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
p.on('pageerror',e=>errs.push(String(e)));
await p.goto(pathToFileURL(path.resolve('index.html')).href);
await p.waitForSelector('#lg-years .lg-year-chip');
const st = await p.evaluate(() => ({
  chips: document.querySelectorAll('#lg-years .lg-year-chip').length,
  first: document.querySelector('#lg-years .lg-year-chip').textContent,
  emptyChild: (() => { const c=[...document.querySelectorAll('#lg-years .lg-year-chip')].find(x=>x.dataset.lgYear==='2007'); c.click(); return document.querySelector('#lg-year-detail').innerText; })(),
  yearsGroups: document.querySelectorAll('#lg-content .lg-year-group').length,
  allYears: (() => { document.querySelector('[data-all-years]').click(); return document.querySelector('#lg-year-detail').hidden; })(),
  chaptersView: (() => { document.querySelector('[data-lg-view="chapters"]').click(); return document.querySelectorAll('#lg-content .lg-chapter-card').length; })(),
  mapView: (() => { document.querySelector('[data-lg-view="map"]').click(); return !!document.querySelector('.lg-map'); })()
}));
if (st.chips !== 24) errs.push('expected 23 years + future chip, got ' + st.chips);
if (!/^2547/.test(st.first)) errs.push('first chip must be พ.ศ. 2547, got ' + st.first);
if (!/ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้ — ช่วงวัยเด็ก/.test(st.emptyChild)) errs.push('childhood empty copy wrong: ' + st.emptyChild);
if (!st.yearsGroups) errs.push('timeline has no year groups');
if (!st.allYears) errs.push('every-years button must hide the year detail');
if (st.chaptersView !== 12) errs.push('chapters view must show 12 chapters, got ' + st.chaptersView);
if (!st.mapView) errs.push('life map view must keep working');
if (errs.length) { console.error('FAIL ' + errs.join(' | ')); process.exit(1); }
console.log('OK shell'); await b.close();
```
Run: `node tools/_tmp-check.mjs`
Expected: `OK shell` (ไม่มี console error) — ตรวจด้วยตาเพิ่ม 1 รอบที่ความกว้าง 390px ว่าชิปปีและข้อความไม่ทับกัน

- [ ] **Step 5: Commit**

```bash
git add index.html css/life-graph.css js/life-graph.js
git commit -m "feat(life-graph): v2 shell - year navigation 2004-2026 + childhood band, per-year timeline groups, honest empty-year copy"
```

---

### Task 4: Stock-Style Life Graph

**Files:**
- Modify: `js/life-graph.js` (view `graph`)
- Modify: `css/life-graph.css`

**Interfaces:**
- Consumes: `graphLayout` (Task 2), DOM contract (Task 3)
- Produces: `.lg-trajectory` + `svg.lg-stock-chart`, `.lg-history-line`, `.lg-chart-point.is-current`, `.lg-future-line/.lg-future-dot`, `.lg-chapter-band`, `.lg-undated`, `.lg-legend`, `.lg-score-notice`, `[data-lg-labels]` toggle

- [ ] **Step 1: เขียน view graph**

Pin ค่าที่ต้องเป๊ะ:
- แกน X = เวลา 2004→2026 (สเกลเชิงเส้นตามปีจริง) · แกน label ใช้ `formatYear` → แสดง **พ.ศ. (ค.ศ.)** เช่น `2569 (2026)`
- อดีต: เส้น `#398fe5` + จุดทึบ · ปัจจุบัน (`isCurrent`): จุด `#14b88a` · อนาคต: `stroke-dasharray` + วงกลมโปร่ง (`fill:none`) ตามสเปก
- วันที่รู้แค่ปี → วาดที่กลางปี (x ของ 1 ก.ค.) และ tooltip ต้องกำกับ "ระบุเป็นปี"
- Record ที่ `startYearCE === null && !isFuture` → **ห้ามอยู่บนเส้นแกนเวลา** ไปอยู่ `.lg-undated` (มีหัวข้อ "ปีไม่ระบุ · Undated Milestones" และเป็นปุ่มเปิดรายละเอียดได้)
- Legend ต้องมีข้อความ: ฟ้า=เหตุการณ์ในอดีต, เขียว=ปัจจุบัน, เส้นประ=เป้าหมายอนาคต (ยังไม่เกิดขึ้น), แถบจาง=ช่วงวัยเด็ก
- คำเตือนถาวรใต้กราฟ: "ตำแหน่งแนวตั้งเป็นการจัดวางเชิงภาพ ไม่ใช่คะแนนชีวิตที่วัดจริง"
- Mode B: ถ้าไม่มี record ใดมี `selfAssessmentScore` → แสดง `.lg-score-notice` ว่า "ยังไม่มีคะแนนประเมินตนเอง — กรอกได้ที่ปุ่มแก้ไข" และ **วาดเฉพาะจุดที่มีคะแนน** (เสร็จแล้วต้องไม่มีการเดาคะแนน) · เส้นต้อง **ขาด** ตรงช่วงที่ไม่มีคะแนน ห้ามลากเชื่อม
- Mode A/B สลับด้วยปุ่มในกราฟ (เพิ่ม `[data-lg-mode="narrative"|"self"]`) โดยค่าเริ่มต้น = `narrative` และต้องแสดง label ว่ากำลังใช้โหมดไหน
- Label anti-overlap: เรียงตาม x; กล่อง label กว้างประมาณ `min(150, ข้อความ*7)`; ถ้าทับกับกล่องก่อน → สลับบน/ล่าง; ถ้ายังทับ → `labelSide:'hidden'`; toggle `[data-lg-labels]` บังคับแสดงทั้งหมด (aria-pressed) และรายงาน `hiddenLabelCount` เป็นข้อความ "ซ่อน label อีก N จุด"
- Keyboard: คงพฤติกรรมเดิมของ `.lg-hit-wrap` (`tabindex="0"`, `role="button"`, `aria-label` มีชื่อเหตุการณ์ + วันที่, เปิดด้วย Enter/Space) และต้องใช้ได้กับจุดอนาคตกับรายการ Undated ด้วย; `:focus-visible` ต้องมองเห็นชัดบนพื้นมืด

- [ ] **Step 2: ตรวจบนเบราว์เซอร์จริง**

เพิ่มใน `tools/_tmp-check.mjs` แล้ว Run: `node tools/_tmp-check.mjs`
Expected: ผ่านและพิมพ์บรรทัด OK ของสคริปต์ (ไม่มี FAIL) — ตรวจว่า: มี `.lg-trajectory`, จำนวน `.lg-chart-point` เท่ากับจำนวนเหตุการณ์ที่มีปีและไม่ใช่ future, จุด `is-current` มี 1, `.lg-future-dot` มีเท่าจำนวน goal, `.lg-undated-item` มีเท่าจำนวน record ที่ไม่มีปี, และ `#lg-content` มีคำเตือน "ไม่ใช่คะแนนชีวิต" อยู่จริง

- [ ] **Step 3: เช็ค 360px**

Run: เดิมที่ viewport `{width:360,height:800}`
Expected: ไม่มี horizontal overflow ของทั้งหน้า (`document.documentElement.scrollWidth <= 360 + 1`) และป้ายปีบนแกนยังอ่านออก

- [ ] **Step 4: Commit**

```bash
git add js/life-graph.js css/life-graph.css
git commit -m "feat(life-graph): v2 stock-style graph - time axis in พ.ศ./ค.ศ., childhood band, green current node, dashed future, honest undated + no-score states"
```

---

### Task 5: Detail Panel + CRUD + Filters + Import/Export

**Files:**
- Modify: `js/life-graph.js`
- Modify: `index.html` (ฟิลด์ใน `#lg-form`)
- Modify: `css/life-graph.css`

**Interfaces:**
- Consumes: `ET1LIFE_CORE` ทั้งชุด, DOM contract (Task 3/4)
- Produces: ฟอร์ม/แผงรายละเอียดที่ครบคีย์ตาม §Data model; `ET1LIFE_CORE.saveState(state)` + `loadState()`

- [ ] **Step 1: ขยาย `#lg-form` ให้ตรง §Data model**

เพิ่ม/แก้ฟิลด์: `startDate` (date), `endDate` (date), `startYearCE` (number), `endYearCE` (number), `datePrecision` (7 ตัวเลือก), `dateStatus` (4), `dateSource` (4), `status` (6 เดิม), `type`, `importance` (1–3), `narrativeLevel` (0–100, label "ตำแหน่งเชิงเรื่องราว — ไม่ใช่คะแนนชีวิต"), `selfAssessmentScore` (min 1 max 10, label "ประเมินตนเอง 1–10"), `chapterId` (12 บท), `category` (14), `relatedSkills`, `relatedProjectIds`, `whatChanged`, `reflection`, `notes`, `tags`, `conflictNote` (อ่านอย่างเดียว/แก้ได้)
ป้ายกำกับต้องบอกชัดว่า `importance`/`narrativeLevel` เป็นการจัดวาง และ `selfAssessmentScore` เป็น 1–10

- [ ] **Step 2: Detail panel ตามบรีฟ PART 6**

Order: ชื่อเหตุการณ์ · ปี พ.ศ. · ปี ค.ศ. · วัน/ช่วงเวลา · Date Precision · Life Chapter · Event Category · Description · What Changed · Related Skills · Related Projects · Personal Reflection · Evidence/Source · User Notes
ช่องที่ว่าง **ต้องขึ้น `ยังไม่ได้บันทึก`** ห้ามแต่ง. ถ้า `conflictNote` มี → แสดงกล่องเตือน "ข้อมูลขัดแย้ง — ต้องยืนยัน" นำหน้าฟิลด์วันที่. ถ้า `legacyScale` → แสดงข้อความให้กรอกคะแนนใหม่
ปุ่ม: `[data-edit]`, `[data-delete]` (ลบต้อง `window.confirm` เท่านั้น)

- [ ] **Step 3: Filters/Search/Import-Export/CRUD ต่อกับ storage v2**

- `saveState()` เขียน `localStorage['et1cruel.life-graph.v2']`; ถ้าพังต้อง `notice` และ **ไม่ทำให้ข้อมูลในหน่วยความจำหาย**
- ตัวกรองหมวด 14 ตัว + ช่องค้นหา (substring จาก `title + description + tags + notes` ไทย/EN) + `#lg-result-count`
- `[data-export]` → ดาวน์โหลด JSON `{version:2, exportedAt, records, deletedSeedIds, meta}` ชื่อไฟล์ `et1cruel-life-graph-<YYYY-MM-DD>.json`
- `[data-import]` → เปิด file dialog → `validateImport` → ถ้าไม่ผ่านแสดงเหตุผล **ห้ามเขียนทับ**; ถ้าผ่านให้ `window.confirm('นำเข้าข้อมูลจะรวมกับข้อมูลเดิม — ยืนยัน?')` แล้ว `importIntoState` + save + render
- ลบ seed → push id เข้า `deletedSeedIds`; เพิ่ม/แก้ → ตั้ง `updatedAt` และ `userEdited:true` ถ้าเป็น seed

- [ ] **Step 4: ตรวจ end-to-end**

เพิ่มใน `tools/_tmp-check.mjs` แล้ว Run: `node tools/_tmp-check.mjs`
Expected: ผ่านและพิมพ์บรรทัด OK ของสคริปต์ (ไม่มี FAIL) — ตรวจว่า: สร้าง record ใหม่ได้และขึ้นในไทม์ไลน์ปีที่เลือก; **reload แล้วยังอยู่**; แก้ seed แล้ว `mergeSeeds` ไม่ทับ; ลบแล้วหายและไม่กลับมาหลัง reload; export ได้ blob ที่ parse กลับเป็น JSON ได้; import ไฟล์ขยะถูกปฏิเสธและจำนวน record ไม่เปลี่ยน

- [ ] **Step 5: Commit**

```bash
git add js/life-graph.js index.html css/life-graph.css
git commit -m "feat(life-graph): v2 panel + CRUD - full milestone detail, conflict badges, 1-10 self assessment, import/export with validation"
```

---

### Task 6: เชื่อมระบบเดิม (sw.js, script tags, README)

**Files:**
- Modify: `sw.js` (CORE list + `CACHE` version)
- Modify: `js/README.md` (ตารางเจ้าของไฟล์)

**Interfaces:**
- Consumes: ชื่อไฟล์จาก Task 1–5
- Produces: ไฟล์ถูก precache ด้วยสตริงที่ตรงกับ `src` ใน HTML เป๊ะ

- [ ] **Step 1: เพิ่มไฟล์เข้า CORE**

ใน `sw.js` แก้ `var CACHE = 'et1cruel-v65';` → `'et1cruel-v66';` และเพิ่มเข้า `CORE` (สตริงต้องตรงกับที่ HTML เรียก เป๊ะ ๆ): `'css/life-graph.css?v=2', 'js/life-graph-data.js?v=2', 'js/life-graph.js?v=2'`
(ตอนนี้ไฟล์ life-graph ไม่ถูก precache เลย — การเพิ่มนี้คือการแก้ที่ถูกต้อง)

- [ ] **Step 2: อัปเดต `js/README.md`**

เพิ่มแถว `| \`life-graph-data.js\` | index.html | ข้อมูลไทม์ไลน์ชีวิต v2 — 14 หมวด, 12 บท, seed เหตุการณ์จริง + mapping v1 |` และแก้แถว `life-graph.js` ให้ตรงหน้าที่ใหม่

- [ ] **Step 3: ตรวจว่า precache ครบและไม่ 404**

Run:
```bash
node -e "const s=require('fs').readFileSync('sw.js','utf8');const need=['css/life-graph.css?v=2','js/life-graph-data.js?v=2','js/life-graph.js?v=2'];const miss=need.filter(n=>!s.includes(n));if(miss.length){console.error('missing in CORE: '+miss.join(', '));process.exit(1)}if(!s.includes(\"et1cruel-v66\")){console.error('cache version not bumped');process.exit(1)}console.log('OK sw')"
```
Expected: `OK sw`

- [ ] **Step 4: ยืนยันว่าโหลดไฟล์จริงได้ (ไม่มี 404)**

Run: `node tools/_tmp-check.mjs`
Expected: ผ่าน และ **ไม่มี** console error ประเภท `Failed to load resource` (สคริปต์เช็ค console error อยู่แล้ว)

- [ ] **Step 5: Commit**

```bash
git add sw.js js/README.md
git commit -m "chore(life-graph): precache v2 files (cache v66) + document new data file"
```

---

### Task 7: ตัวตรวจถาวร + ตรวจรับทั้งชุด

**Files:**
- Modify: `tools/life-graph-check.mjs` (แทนความคาดหวัง V1 ทั้งไฟล์)
- Create: `tools/verify-life-graph.mjs`
- Delete: `tools/_tmp-check.mjs`

**Interfaces:**
- Consumes: ทุก Task ก่อนหน้า
- Produces: `node tools/verify-life-graph.mjs` → exit 0 เมื่อผ่าน, exit 1 + รายการที่ไม่ผ่านเมื่อไม่ผ่าน
  (`tools/life-graph-check.mjs` คงรูปเดิม `export default async function run(page)` เพื่อให้ของที่เคยเรียกใช้ยังใช้ได้)

- [ ] **Step 1: เขียน runner**

`tools/verify-life-graph.mjs`:
```js
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import run from './life-graph-check.mjs';
const b = await chromium.launch();
const page = await b.newPage({ viewport:{ width:1280, height:900 } });
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
try {
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  const stats = await run(page);
  console.log(JSON.stringify(stats, null, 2));
} catch (e) { errs.push(e.message); }
await b.close();
if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
```

- [ ] **Step 2: เขียน `tools/life-graph-check.mjs` ใหม่ให้ตรง V2**

ต้องตรวจอย่างน้อย: **Dashboard เดิมยังอยู่** (`.hero` มี, `.hero + #life-graph` ยังอยู่, ข้อความ hero เดิมยังอยู่) · 23 ชิปปี + ชิป future (24) · ชิปปีแรกขึ้น `2547` · ปีวัยเด็กขึ้นถ้อยคำวัยเด็ก · เลือกปีแล้วไฮไลต์+ขึ้น detail · `‹/›` เลื่อนปีทำงาน · `วันนี้` กลับปี 2026 · `ทุกปี` กลับภาพรวม · มุมมอง chapters มีครบ 12 บท · มุมมอง map ยังทำงาน · โหมด graph มี `.lg-trajectory` + จุดปัจจุบันเขียว 1 จุด + อนาคตเป็นเส้นประ/วงโปร่ง · record ไม่มีปี **ไม่** อยู่บนเส้น · Undated section มีจำนวนเท่าที่ควร · โหมด self แสดง `.lg-score-notice` · สร้าง/แก้/ลบ + **reload แล้วยังอยู่** · ลบต้องผ่าน confirm (ตั้ง `window.confirm=()=>true` เหมือนเดิม) · import ไฟล์ผิดถูกปฏิเสธ · ค้นหา/ตัวกรองทำงาน
เพิ่มการตรวจคีย์บอร์ด: กด Tab จากจุดเริ่มของ `#life-graph` ต้องไปถึงปุ่มชิปปีและ `.lg-hit-wrap` ได้, กด Enter ที่ `.lg-hit-wrap` แล้ว `#lg-detail` เปิด, และ focus ring มองเห็น (`getComputedStyle(el).outlineStyle !== 'none'` บน `:focus-visible` อย่างน้อยต้องผ่าน `outline-width` ที่ไม่ใช่ 0 บน `.lg-year-chip`/`.lg-btn`)
ตัวเลขที่ assert ให้อ่านจาก `window.ET1LIFE_DATA` ในเพจ แทนการ hardcode ยกเว้นค่าที่สเปกตรึงไว้ (24 ชิป, `2547`, 1 จุดปัจจุบัน, 12 บท)

- [ ] **Step 3: รันตัวตรวจถาวร**

Run: `node tools/verify-life-graph.mjs`
Expected: `ALL CHECKS PASSED` + JSON ของ stats

- [ ] **Step 4: รันชุดตรวจข้อมูล/ตรรกะซ้ำอีกครั้ง**

Run: `node tools/life-graph-data-check.mjs && node tools/life-graph-core-test.mjs && node --check js/life-graph.js`
Expected: `OK data: …` → `OK core` → ไม่มี output

- [ ] **Step 5: ลบสคริปต์ชั่วคราว + commit**

```bash
rm tools/_tmp-check.mjs
git add tools/life-graph-check.mjs tools/verify-life-graph.mjs
git commit -m "test(life-graph): v2 permanent verifier + rewritten checks covering dashboard integrity, years, graph honesty, CRUD persistence, import rejection"
```

- [ ] **Step 6: ตรวจรับตามบรีฟ PART 10 แล้วรายงาน**

ไล่ทีละข้อใน Acceptance Test ของบรีฟ แล้วเขียนรายงาน STEP 8: เพิ่มไฟล์ใด แก้ไฟล์ใด พบเหตุการณ์กี่รายการ ปีใดยังขาด และอะไรผ่าน/ไม่ผ่าน — **ห้ามรายงานว่าผ่านถ้ายังไม่ได้รันจริง**

---

## Notes for the executor

- ลำดับพึ่งพา: Task 1 → 2 → (3,4,5 ต่อเนื่องกันเพราะใช้ไฟล์เดียวกัน) → 6 → 7
- `tools/_tmp-check.mjs` ถูกสร้างใน Task 3 และลบใน Task 7 — ระหว่างนั้นให้ใช้ไฟล์เดียวสะสมการตรวจไปเรื่อย ๆ
- ของเดิมที่ยังใช้ได้ต้องไม่พัง: `#lg-focus-text`, `[data-focus]`, `.lg-money`, `.lg-future`, `.lg-quote`, ปุ่ม `.lg-modes` (เพิ่มค่าใหม่เท่านั้น)
- ข้อบกพร่องเดิมที่พบและ **ไม่ให้แก้ในงานนี้** (แต่ให้เขียนไว้ในรายงาน): `index.html` โหลด `css/neo-brutal.css?v=18` แต่ `sw.js` precache `?v=17` — precache อาจค้างเวอร์ชันเก่า
