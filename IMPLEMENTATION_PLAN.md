# ET1CRUEL AI AGENCY OS — IMPLEMENTATION PLAN

> เอกสารติดตามงานหลัก (ใช้แทน todo list) · อัปเดตทุกครั้งที่จบงาน

## 0. สถาปัตยกรรมปัจจุบัน (ตรวจจากโค้ดจริง 2026-10-14)

- **Static multi-page ล้วน**: HTML ธรรมดาที่ root + `prod/` — ไม่มี framework, bundler, ไม่มี backend · รูปอยู่ `assets/img/` · draft/final render อยู่ `drafts/` (gitignored) · สคริปต์เครื่องมืออยู่ `tools/` (`gen-neo.py`, `render.mjs`) · เอกสารรองอยู่ `docs/` (หลัก `IMPLEMENTATION_PLAN.md` อยู่ root ต่อ)
- **Routing**: ลิงก์ไฟล์ตรง (`./banks.html`) + anchor (`#treasury`) — ไม่มี router
- **Styles/Scripts**: `css/*.css` 6 ไฟล์ (รวม `neo-brutal.css` ธีมกลาง โหลดท้ายสุดทุกหน้า) + inline `<style>` ต่อหน้า · `js/*.js` + `fx/*.js` แบบ vanilla
- **Deploy**: GitHub Pages ผ่าน `.github/workflows/pages.yml` (upload ทั้ง repo root ทุก push `main`)
- **SW + Sitemap**: `sw.js` cache list แบบ manual (`et1cruel-v42`, 62 ไฟล์ ตรวจแล้วไม่ขาด) · `sitemap.xml` ต้องเพิ่ม URL เอง (มี agency/music/lucky-income แล้ว)
- **หน้าใหม่ (untracked รอ commit)**: `agency.html` + `js/agency|provider|chat|office.js`, `music.html`, `lucky-income.html` (light theme เพจเดียว), GenPic, video EP3/EP4
- **Design tokens**: NEO-BRUTALISM ทั้งเว็บ — ครีม `#FFF4D6` + ขอบดำ `#131313` + เหลือง `#FFC900` / ชมพู `#FF90E8` / มิ้นต์ `#00E5A0`, ฟอนต์ Chakra Petch + IBM Plex Sans Thai
- **Git**: branch `main`, remote `github.com/et1cruel/ET1CRUEL` · ห้ามแตะ `video/*` ที่กำลังแก้ค้าง · ห้าม push อัตโนมัติ

## 1. การตัดสินใจโครงสร้าง (my call)

- หน้า Agency เป็นไฟล์ใหม่ **`agency.html`** ที่ root (ไม่ยัดใส่ `index.html` ที่ใหญ่ 297KB อยู่แล้ว)
- Sub-views ทั้ง 11 หมวดเป็น **tabs ในไฟล์เดียว** (SPA ย่อมๆ ด้วย vanilla JS) — เข้ากับ stack เดิม, ไม่เพิ่ม dependency
- State เก็บใน **localStorage key `et1cruel.agency.v1`** (export/import JSON ได้) — รองรับ GitHub Pages ทันที, สถานะ Not Connected สำหรับ AI provider
- Backend/SQLite/provider จริง = Phase 4–5 (local runtime แยก) — หน้านี้เตรียม Adapter interface + Mock provider ที่ติดป้ายชัดเจน
- เชื่อมเว็บเดิม: เพิ่มลิงก์ใน `#nav` + แถบ explore + `sitemap.xml` + `sw.js` (bump v31)

## 2. สถานะงาน

| Phase | งาน | สถานะ |
|---|---|---|
| 0 Inspect | ตรวจ repo/env/git/deploy | DONE |
| 1 Foundation | `agency.html` + `js/agency.js` + nav/sitemap/SW | DONE (v1, 2026-10-14) |
| 2 Dashboard | Overview cards, timeline, project cards (localStorage จริง) | DONE (v1) |
| 3 Agent Network | 2D node grid + agent detail + pause/resume/cancel | DONE (v3: handoff lines + completion chime + project rooms, 2026-10-14) |
| 4 Backend | REST + SQLite + event log (local runtime) | NOT STARTED (BLOCKED: ต้องมีเครื่อง/เซิร์ฟเวอร์ก่อน) |
| 5 Runtime | Task queue + provider adapter + checkpoints | PARTIAL (v5: web chat + AI tools สร้าง/เปลี่ยนงานได้จริง; queue อัตโนมัติรอ local runtime) |
| 6 Approvals/Security | Approval Center + allowlist (UI พร้อม, enforce ฝั่ง server รอ Phase 4) | PARTIAL |
| 7 First workflow | Web-dev workflow wizard + manifest + attempt cap 3 | DONE (v1: wizard สร้าง 5 tasks + ขออนุมัติ plan อัตโนมัติ) |
| 8 Expand | Music/Content/BI workspaces | DONE (EP3 v2-3 · ห้อง GenMusic · EP4 มิกซ์บีท 38s ส่งมอบ 2026-10-14 · lucky-income 5,672฿ · GenPic) |
| 8b Hygiene | .gitignore กันไฟล์ยักษ์, theme-color กลับ dark, ลบขยะ root | DONE (2026-10-14) |
| 8c Contrast | ฟิกซ์ตัวอักษรจางบนการ์ดขาว (formula/know-card/masterplan) + neo-brutal v2 + SW v35 | DONE (2026-10-14) |
| 8d Contrast2 | ฟิกซ์ list หุ้น (port-scroll/wbox เทา, ชื่อย่อ/ชื่อบริษัท/ป้ายจาง) + v3 + SW v36 | DONE (2026-10-14) |
| 8e Reorg | เก็บ render ค้าง root (draft/final 6 ไฟล์) → `drafts/`, สคริปต์ → `tools/`, เพิ่ม `README.md` แผนที่ไฟล์ | DONE (2026-10-14) |
| 8f PillarsContrast | หัวข้อ pillars มองไม่ชัด (h2 ขาวบนการ์ดขาว 1.0:1) → ฟิกซ์ใน `neo-brutal.css` (h2/small/chev/h1-span/stat-span → หมึก, วัดจริง ≥13:1, poker ได้อานิสงส์ด้วย) | DONE (2026-10-14) |
| 8g HeroText | H1 hero ขาวบนตั๋วเหลือง (.ph direct rule ชนะ inherited !important, 1.6:1) → บังคับหมึก · ชิป `<b>` ตัดคำขาดขอบ → `box-decoration-break:clone` แต่ละท่อนเป็นชิปสวย | DONE (2026-10-14) |
| 8h HeroChipBreak | ชิป "ทำเพลง+..." ตัดหลังคำ "ทำ" ค้างบรรทัดบน (ตำแหน่งตัดขึ้นกับความกว้างจอ/ฟอนต์) → ใส่ `<br>` หน้าชิป เริ่มบรรทัดใหม่ชัวร์ทุกจอ ยืนยันจอ 800 + 400 | DONE (2026-10-14) |
| 8i TrackerText | ตัวหนังสือ Quest Tracker เล็ก (13.5/12px) → ขยาย 15.5/13.5px + แผงกว้าง 284px + ระยะบรรทัด 1.75 (แก้เฉพาะไซส์ ไม่แตะสี ปลอดภัยทั้งสองธีม) | DONE (2026-10-14) |
| 8j TrackerColors | ใส่เหลือง (หัวข้อ + ปุ่ม –/✕ ชิปเหลืองขอบดำ) + เขียว (ป้ายจำนวนพื้นมิ้นต์, เส้นข้างเควส #16a34a 4px) ถ่ายจอ 1280 ยืนยัน | DONE (2026-10-14) |
| 8k Know80 | เกร็ดความรู้ 28 → 80 (หมวดละ 20) เนื้อหาใหม่ยึดของจริงใน repo + (ทั่วไป) ตามกฎไฟล์เดิม bump data?v2 + SW v42 เทส 5 แท็บ + สุ่ม 10 ครั้งผ่าน | DONE (2026-10-14) |
| 9 Reliability | recovery/backup/security tests | NOT STARTED |

## 3. เกณฑ์ซื่อสัตย์ (บังคับทุก Phase)

- ตัวเลขธุรกิจที่ไม่มี = `N/A` · ตัวอย่างติดป้าย `DEMO` · mock ติดป้าย `MOCK`
- สถานะ agent เปลี่ยนเฉพาะเมื่อมี event จริง (user action / demo seed) — ห้ามสุ่ม
- ปุ่มทุกปุ่มต้องทำงานจริงหรือ disabled พร้อมเหตุผล
- ห้ามอ้างผลทดสอบที่ไม่ได้รัน

## 4. วิธีรัน/ทดสอบ (ปัจจุบัน)

- เปิด `agency.html` ผ่าน local server (`python -m http.server` หรือ VS Code Live Server) หรือตรงจาก Pages หลัง push
- ตรวจ syntax: `node --check js/agency.js` (ผ่านทั้ง 28 ไฟล์ js/fx 2026-10-14)
- ตรวจ regression: เปิด `index.html` ยืนยัน nav เดิมครบ + ไม่มี console error จากไฟล์ใหม่ (แยก scope เต็มที่)
- ตรวจก่อน commit: `git check-ignore` กับไฟล์ยักษ์ + `git diff --numstat` ต้องไม่มีวิดีโอ/wav หลุดเข้า diff

## 5. ข้อจำกัดที่รู้แล้ว

- GitHub Pages = static เท่านั้น — Node/SQLite รันบน Pages ไม่ได้ (ต้อง local runtime)
- ไม่รับ API keys บนหน้าเว็บ (ไม่มีที่เก็บปลอดภัย) — provider แสดง Not Connected
- ห้าม push/deploy อัตโนมัติ — ส่งไฟล์ให้เจ้าของกดเอง
- ห้าม commit ไฟล์ยักษ์: `*.wav`, draft/silent/voiceover/mp4 intermediates, workspaces (DimeVideo/EditVid/GenVideo), `.env`, `node_modules` — ดู `.gitignore`
- theme-color: หน้า dark ใช้ `#08090E` · หน้า light (`lucky-income.html`) ใช้ `#FFF4D6` — ห้าม blanket เปลี่ยนทุกไฟล์
- `fx/knowledge-orbit.js` (1200 facts ทั่วไป) ยังไม่มีหน้าไหนเรียก — เก็บไฟล์ไว้ก่อน รอเจ้าของตัดสินใจตำแหน่ง (ห้าม auto-เสียบใส่ index เพราะชน know-card)
- `rpg-levelup.html` คือ render-stage preview (viewport 1080 ตายตัว) — ตั้งใจไม่ใส่ sitemap
