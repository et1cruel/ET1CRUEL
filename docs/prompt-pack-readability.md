# Prompt Pack — แก้จุดไม่ชัด ตัวเล็ก สีไม่เด่น (RPG CARD / NEO-BRUTAL)

วิธีใช้: ก็อป prompt ข้อที่ตรงกับงาน ส่งให้ AI พร้อมแนบภาพScreenshot + ชื่อไฟล์หน้าเว็บ
ทุก prompt ออกแบบจากบัคจริงที่เคยเจอ: การ์ดโดนย้อมพื้นขาวแต่ตัวหนังสือยังเป็นสีธีมดาร์ก,
inline style แพ้ `!important`, placeholder จาง, แคชเก่าค้าง (`?v=`)

---

## P1 — ค้นหาจุดไม่ชัดทั้งหน้า (audit)

```
ช่วย audit หน้า [ชื่อไฟล์ เช่น pillars.html] หาจุดที่อ่านยาก
1. หากฎ CSS ที่ย้อมพื้นการ์ดเป็นสีขาว/ครีม (เช่น .card, section.card, .treasury)
   แล้วลิสต์ตัวหนังสือที่ยังเป็นสีธีมดาร์ก (ขาว #fff, เขียวนีออน #4ADE80,
   เทา #AAB4CC/#5a5a58/#3d3d3b/#555) บนพื้นนั้น
2. หา inline style="color:..." ที่จะแพ้ !important ใน css/neo-brutal.css
3. หา placeholder / small 11–13px / font-weight 500–600 (ตัวไทยเล็กจะดูจางกว่าตัวเลข)
4. คำนวณ contrast ratio ทุกคู่ (สูตร WCAG: (L1+0.05)/(L2+0.05))
   เกณฑ์: เนื้อความ ≥ 4.5:1, หัวข้อ ≥ 7:1
5. สรุปเป็นตาราง: selector | สีตัวอักษร | สีพื้น | ค่า contrast | ผ่าน/ตก
ห้ามแก้ไฟล์ในขั้นตอนนี้ — ส่งตารางให้ดูก่อน
```

## P2 — ตัวอักษรเล็กไป (แก้ไซส์)

```
ขยายตัวอักษรที่เล็กเกินไปใน [ไฟล์/selector] ตามขั้นต่ำนี้ ห้ามต่ำกว่านี้:
- เนื้อความบรรยาย (item small, persona p, zone p, know-text): ≥ 15.5px, weight ≥ 600, line-height 1.9
- ป้ายกำกับ (shead p, kpi/stat/vault small, tre biomarker): ≥ 14px, weight 700
- จิ๋วสุด (wname, wbar-sym, tag): ≥ 12.5px, weight 700
- quote small: 14.5px weight 700 ใส่ป้ายครีมขอบดำแถบสีซ้าย + เงาแข็ง 2px
- placeholder ใน input: สี #6b675f ขึ้นไป (ห้ามใช้ #9AA3C2 บนพื้นขาว)
แก้ใน css/neo-brutal.css ท้ายไฟล์เท่านั้น ใช้ selector ขึ้นต้น body + !important
เช่น body .item .txt small{...} เพื่อชนะกฎเดิม แล้วเช็คว่า braces สมดุล
```

## P3 — สีไม่โดดเด่น (แก้คอนทราสต์ + ความเด้ง)

```
เปลี่ยนสี [selector/หัวข้อ] ให้อ่านชัดและเด้งแบบนีโอ-บรูทัล โดยใช้โทเคนนี้เท่านั้น:
--br-ink:#131313, --br-yellow:#FFC900, --br-cream:#FFF9EC,
--br-mint:#00E5A0, --br-pink:#FF90E8, --br-lav:#B8A9FF
กฎ:
- พื้นขาว/ครีม → ตัวหนังสือหมึก #131313–#2e2c28 (ห้ามเทากลาง #8a8a86/#9AA3C2)
- พื้นเข้ม (pillar/eq/chip/footer) → ล็อกพื้นเข้มไว้ + ตัวหนังสือขาว/ทอง
- หัวข้อหลักเติมเงาแข็ง: text-shadow:2px 2px 0 rgba(255,201,0,.6)
- ป้ายเติมเงาแข็ง: box-shadow:2px 2px 0 var(--br-ink) + ขอบ 2–3px solid var(--br-ink)
- ลบ glow ฟุ้ง text-shadow สีเขียวบนพื้นสว่างทิ้งให้หมด (text-shadow:none)
- เขียว #4ADE80 / เหลือง #FBBF24 ห้ามใช้เป็นสีตัวหนังสือบนพื้นขาว (1.4–1.7:1)
  ให้ใช้เป็นสีพื้นป้าย + ตัวหนังสือหมึกแทน
ห้ามแตะองค์ประกอบพื้นเข้มตัวขาวอยู่แล้ว: footer.site-foot, .count, .money-hud,
.nav::before, .photo-tag, .qtag (เช็คก่อนทุกครั้ง)
```

## P4 — ตรวจงานหลังแก้ (verify)

```
ตรวจงานแก้สี/ฟอนต์ที่เพิ่งทำ:
1. node เช็คว่า css/neo-brutal.css braces { } สมดุล
2. เรนเดอร์หน้าด้วย playwright chromium (viewport 1280) แคป fullPage
   แล้วอ่านค่า computed color/background/font-size ของ selector ที่แก้
   คำนวณ contrast ซ้ำ ต้องผ่านเกณฑ์ P1
3. เทียบภาพก่อน/หลัง ถ้าตัวไหนยังจางให้บอก selector + ค่าใหม่ที่เสนอ
4. ส่งสรุปสั้น ๆ: จุดที่แก้ | ค่า contrast ก่อน→หลัง | ไฟล์ที่แตะ
```

## P5 — กันพัง + ล้างแคช (ทุกครั้งที่แก้ CSS)

```
หลังแก้ css/neo-brutal.css:
1. bump version ?v=N → ?v=N+1 ในทุกไฟล์ .html และ sw.js (ตอนนี้มี 18 จุด)
   สั่งทีเดียว ห้ามแก้ทีละไฟล์
2. git diff ดูว่าติดไฟล์อื่นที่ไม่ตั้งใจมาหรือไม่
3. ย้ำผู้ใช้กด hard refresh (Ctrl+Shift+R) หนึ่งครั้ง
```

---

## แบบฟอร์มแจ้งบัค (ผู้ใช้กรอกก่อนส่ง P1)

```
หน้าที่เจอ: [...]
ส่วนที่จาง (แคปภาพมาด้วย): [...]
อุปกรณ์/เบราว์เซอร์: [...]
ซูมกี่ %: [...]
```

## สคริปต์อ้างอิง

**contrast (python):**
```python
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c:c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    r,g,b=map(f,(r,g,b)); return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    l1,l2=sorted([lum(a),lum(b)],reverse=True); return (l1+0.05)/(l2+0.05)
```

**เรนเดอร์+ดึงค่าสี (node + playwright, รันด้วย NODE_PATH=node_modules):**
```js
const { chromium } = require('playwright');
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:900} });
await p.goto('file:///.../pillars.html', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.screenshot({ path:'after.png', fullPage:true });
const rows = await p.evaluate(() => ['.ptop h3','.shead p'].map(s => {
  const el = document.querySelector(s), cs = getComputedStyle(el);
  return s + ' txt=' + cs.color + ' fs=' + cs.fontSize + ' fw=' + cs.fontWeight;
}));
console.log(rows.join('\n')); await b.close();
```
