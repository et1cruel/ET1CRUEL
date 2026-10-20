# ET1CRUEL · QUEST LOG RPG

เว็บระบบชีวิตสายเกม (static multi-page ล้วน ไม่มี framework) — ดูแผนงานฉบับเต็มที่
`IMPLEMENTATION_PLAN.md`

## เปิดดูเว็บ

```bash
python -m http.server 8000
# แล้วเปิด http://localhost:8000/index.html
```

## แผนที่ไฟล์ (อยู่ตรงไหน หาอย่างไร)

| อยากหา | ไปที่ |
|---|---|
| หน้าเว็บทุกหน้า (`index`, `banks`, `music`, `video`, `agency` …) | root ตรงๆ (`*.html`) |
| รูปปก/รูปประกอบเว็บ | `assets/img/` |
| วิดีโอหน้าแรก | `tweet.mp4` (root — ห้ามย้าย `index.html` อ้างถึงอยู่) |
| CSS / JS / เอฟเฟกต์ | `css/` · `js/` · `fx/` |
| โลโก้ธนาคาร/แอป | `logos/` |
| เพลงที่ทำเอง (ไฟล์จริง `.mp3`) | `music/` |
| งานวิดีโอรายตอน (สคริปต์ + เสียง + mp4) | `video/<ตอน>/` |
| สคริปต์เครื่องมือ (gen ภาพ/สไลด์, `render.mjs` ถ่ายเว็บเป็น MP4) | `tools/` |
| รูปหุ้นรายวัน (ตั้งต้น 8/10/12/14/15/16/19 ต.ค. 69) | `stocks/` |
| ล็อกเวอร์ชัน agent skills (ไฟล์เครื่องมือ ห้ามลบ) | `skills-lock.json` |
| แผนที่ไฟล์ `js/` (ไฟล์ไหนห้องไหนเรียก) | `js/README.md` |
| เอกสาร (audit, บันทึกงาน, แผนรอง) | `docs/` |
| ไฟล์ render ร่าง/ไฟล์กลาง (`draft-*`, `final-*`) | `drafts/` (local only ไม่ขึ้น git) |
| งานย่อยห้องโปรดิวเซอร์ | `prod/` |

## กฎกันรก (ห้ามเอาของกลับมากองที่ root)

- render เสร็จโยนลง `drafts/` ทันที — `.gitignore` กัน `draft-*.mp4` / `final-*.mp4` / `drafts/` ไว้แล้ว
- ไฟล์เสียงกลาง `.wav` ไม่ขึ้น git (gen ใหม่ได้จาก `music/gen_music.py`)
- `DimeVideo/` `EditVid/` `GenVideo/` `voice/` `node_modules/` ไม่ขึ้น git (งาน local)
- หน้าเว็บใหม่วางที่ root (ลิงก์ `./ชื่อ.html` + `sitemap.xml` + `sw.js` อ้างถึงแบบนี้อยู่) แล้วเพิ่ม URL ใน `sitemap.xml` เอง
- ห้าม push อัตโนมัติ — ส่งไฟล์ให้เจ้าของกดเอง
