# งานของ GLM 5.3 Flash (via CodeGPT) — Gold Rain Animation
# วิธีใช้: ก็อป BLOCK ด้านล่างทั้งก้อนไปวางใน CodeGPT Chat แล้วกด Enter

--- COPY ตั้งแต่บรรทัดนี้ ---
สร้างไฟล์เดียว `fx/gold-rain.js` สำหรับเว็บ ET1CRUEL (static HTML/CSS/JS ไม่มี build)

สเปก:
1. สร้างไฟล์ใหม่ไฟล์เดียว ห้ามแก้ไฟล์อื่น (ห้ามแตะ index.html, sw.js, js/level-up.js)
2. Self-contained: ฉีด <style> เอง + canvas `#goldrain-cv` (position:fixed inset:0 z-index:65 pointer-events:none)
3. วาดเหรียญทองร่วง (วงกลมสี #FBBF24/#FDE68A มีตัวอักษร ฿) ร่วงจากบนลงล่าง + ส่ายซ้ายขวา หายที่ขอบล่าง
4. API: `window.ET1GOLDRAIN = { burst(n), test() }` — test() คือ burst(60) ทดสอบได้ใน console
5. Auto-hook: MutationObserver เฝ้า `#os-toasts` ถ้า toast ใหม่มีคำว่า ฿ / GOLD / เหรียญ / สำเร็จ ให้ burst อัตโนมัติ (เบาๆ 30 ชิ้น)
6. ประหยัดเครื่อง: ถ้า prefers-reduced-motion / saveData / จอ <520px ให้ลดจำนวนครึ่งนึงหรือไม่ร่วงเลย เหลือแค่ toast
7. Guard ทุกจุด (try/catch, เช็ค document.body) ไม่มี dependency นอก ผ่าน `node --check`
8. ส่งกลับเป็นโค้ดไฟล์เต็มๆ ไฟล์เดียวพร้อมคำอธิบายสั้นๆ ว่าเรียก test ยังไง

บริบท: อีกเอเจนต์ทำ `js/level-up.js` (จอ LEVEL UP) ไปแล้ว ไฟล์นี้ต้องชื่อ/ID ไม่ซ้ำกับเขา (ใช้ prefix goldrain- และ ET1GOLDRAIN เท่านั้น)
--- COPY ถึงบรรทัดนี้ ---
