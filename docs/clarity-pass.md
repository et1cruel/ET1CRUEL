# Clarity Pass — มองไม่ชัด / ไม่เด่น → ชัด + เด่น

Skills: impeccable (refine: clarify/polish/bolder) + web-design-guidelines (audit)
Brief: หาจุดที่มองไม่ชัด ไม่เด่น ทั้งเว็บ แล้วปรับให้ชัดและเด่นขึ้น
Constraint: NEO-BRUTALISM tokens เดิม (ครีม #FFF4D6 / หมึก #131313 / เหลือง #FFC900) · static multi-page · ห้าม push อัตโนมัติ

## Targets (priority)
1. index.html (homepage 297KB — hero, nav, cards, tracker)
2. banks.html / music.html / video.html / agency.html / pillars.html (rooms)
3. stocks-daily.html (เพิ่งเพิ่ม 15 ต.ค. — verify ไม่เสีย)
4. css/neo-brutal.css (central theme — fix once, benefit all)

## Method
- [ ] A: snapshot + screenshot 5 หน้าหลัก (desktop 1280 + mobile 400) หาจุดจาง/กลืน
- [ ] B: grep หา pattern เสี่ยง: #fff บนการ์ดขาว, muted gray (#AAB4CC/#8a8fa3/opacity .6) บนพื้นอ่อน, ตัวเล็ก <14px, ปุ่มไม่มี hover/focus
- [ ] C: batch fix ใน neo-brutal.css เป็นหลัก (เลี่ยงแก้ inline ทีละหน้า)
- [ ] D: verify ด้วย browser.mjs — console 0 error, cards count, contrast ด้วยตา
- [ ] E: รายงาน file:line สั้นๆ

## Log
- 2026-10-16: start audit
