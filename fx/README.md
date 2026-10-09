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

## Phase 3 — เลเยอร์ลม + parallax + ฉลอง

- **scroll parallax**: ชั้นไกล/หมอกขยับตาม scroll (lerp นุ่ม, overscan กันขอบโผล่)
- **pointer parallax**: เมาส์ขยับชั้นไกลนิดหน่อย + ต้นใกล้เคอร์เซอร์โยกแรงขึ้นในรัศมี 260px
- **toast → ฉลอง**: `MutationObserver` เฝ้า `#os-toasts` อย่างเดียว (ไม่แตะโค้ดเดิม) — toast ใหม่ = ใบไม้ร่วงพรู + แสงทองวูบ + ลมแรงชั่วครู่ · เรียกมือได้ด้วย `ET1FOREST.celebrate(n)`
- **พาเลตต์ crossfade**: ผสมสีตามเวลาจริง (dawn/day/dusk/night) คีย์ปัดเป็นขั้นกัน rebuild บ่อย
- ทั้งหมดปิดเมื่อ `prefers-reduced-motion`

## Phase 4 — หนูลัคกี้ (`mouse.js`)

- วาด vector บน canvas เต็มจอใบเดียว (`#mouse-layer` z:45, โปร่งใสทั้งชั้น)
- **ไม่บังของเดิม**: รับคลิกด้วย hit-test ระดับ document (รัศมี 48px รอบตัวหนู) ไม่ใช่ overlay
- เดินบนพื้นจอ + ขอบบนการ์ด (`section.card/.treasury/.hero/.cover` ผ่าน getBoundingClientRect, เก็บใหม่ตอน scroll/resize/ทุก 5 วิ)
- state: walk/run/curious/sit/sniff/groom/look/dig/sleep/hide/fall/jump + หนี/สนใจเคอร์เซอร์
- คลิก = จี๊ด (Web Audio เบามาก) + กระโดด + หัวใจ · ดับเบิลคลิก = ถือเหรียญ 5 วิ (ไม่แตะยอดเหรียญต้นไม้)
- จำชื่อ/เปิด-ปิด/ขนาด (`et1_mouse_v1`, ชื่อเริ่มต้น "ลัคกี้ไมซ์") · reduced-motion = นั่งนิ่ง
- ปรับ: ความเร็วเดิน `walkTo` (52/150), ขนาด `S.size` (0.8/1/1.3), รัศมีสนใจ 120px

## Phase 5 — Sound Garden (`audio.js`)

- อัปเกรดแผง 🌧️ เดิม (ID เดิมครบ) · `js/ambient.js` หลีกทางให้เมื่อ `ET1SOUND_V2` ขึ้น (guard 2 จุด)
- 12 ชั้น: rain/waves/forest/night/wind/fire/stream/thunder + pad/flute/bowl/pluck
- ดนตรีสเกลเพนทาโทนิก A เดียวกัน จูนอิง A4=432Hz (สเปกเสียง ไม่ใช่สรรพคุณรักษา)
- master + per-layer slider + fade (setTargetAtTime) · preset 6 แบบ · sleep timer 15/30/60 (fade 9 วิ)
- ย้ายค่าเก่าจาก `et1cruel-ambient-v1` ครั้งเดียว (ไม่ลบ key เก่า) → จำใหม่ `et1_sound_v1`
- เปิดฝน/ลมแล้วสั่ง `ET1FOREST.setWeather` ให้ป่าตอบสนอง (guard ถ้าไม่มีป่า)
- ปิดหมดแล้ว suspend AudioContext ประหยัดเครื่อง · ไม่ autoplay
- ปรับ: `TUNE` (สเกล/จูน), `PRESETS`, ความถี่ฟิลเตอร์ใน builder แต่ละตัว

## หมายเหตุ

- canvas `z-index:0` เท่า galaxy เดิม (ไม่ใช้ -1 เพราะ body ทึบบังหาย) อยู่ใต้ `.wrap:1`
- การ์ดคง glass เดิม + มี `#forest-veil` ช่วยอ่านหนังสือ
- `prefers-reduced-motion` → วาดนิ่งเฟรมเดียว ไม่รัน loop
