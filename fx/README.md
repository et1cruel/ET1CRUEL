# fx/ — Living Forest (Phase 2)

ไฟล์เอฟเฟกต์ป่า แยกจากโค้ดหลักเพื่อไม่ให้ `index.html` รก โหลดแบบ `defer` + `link` ธรรมดา ไม่มี build step

## ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `forest.js` | canvas ป่า procedural + เติบโต + ลม + persistence + แผงสถานะ |
| `fx.css` | canvas/veil/ปุ่ม/แผงป่า (ทุก selector ขึ้นต้น `forest-`) |

## วิธีปรับ

- **จำนวนต้น/คุณภาพ**: `QUALITY` ใน `forest.js` (`low/medium/high`: trees, ferns, motes, dpr, mist, rays)
- **ความเร็วโต**: `t.g += dt*0.03*(1-g)` และ catch-up `elapsedH/336` (~14 วันโตเต็ม)
- **สูตร growth**: `growthOf()` — base 0.1 + ไดอารี่วันละ 0.03 (สูงสุด 15 วัน) + XP/100000*0.3 + อายุวันละ 0.005 (สูงสุด 30 วัน)
- **พาเลตต์เวลา**: `PALETTES` (dawn/day/dusk/night) + `paletteFor(h)`
- **ปิดป่า**: ปุ่ม 🌲 → ปิดแอนิเมชัน (ซ่อน canvas) หรือ `ET1FOREST.setEnabled(false)`
- **API ให้เฟสเสียง**: `ET1FOREST.setWeather({rain:0..1, wind:0..1})`, `ET1FOREST.status()`, `ET1FOREST.refresh()`

## ข้อมูลที่เก็บ (`et1_forest_v1`)

`{seed, bornAt, updatedAt, quality, enabled, trees:[{x,layer,type,g,phase,glow,h}]}` — อ่านจำนวนวันไดอารี่จาก `et1cruel_diary_v1` และ XP จาก `et1cruel_lifeos_v1` แบบกันพัง (key เดิมไม่ถูกแตะ)

## หมายเหตุ

- canvas `z-index:0` เท่า galaxy เดิม (ไม่ใช้ -1 เพราะ body ทึบบังหาย) อยู่ใต้ `.wrap:1`
- การ์ดคง glass เดิม + มี `#forest-veil` ช่วยอ่านหนังสือ
- `prefers-reduced-motion` → วาดนิ่งเฟรมเดียว ไม่รัน loop
