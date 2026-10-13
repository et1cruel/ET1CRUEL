/* ============================================================
   ET1CRUEL KNOWLEDGE DATA — เกร็ดความรู้จากของจริงในเว็บนี้
   schema: {cat:'stocks'|'music'|'art'|'tech', title (<=40), body (<=220), tag}
   ตัวเลข/ชื่อทั้งหมดดึงจากไฟล์จริงใน repo — ห้ามแก้ตัวเลขโดยไม่เช็กไฟล์ต้นทาง
   ============================================================ */
window.ET1KNOWLEDGE = [
/* ---------- หุ้น/การเงิน (7) ---------- */
{cat:'stocks', title:'พอร์ต DIME หุ้น 11 ตัวสาย AI', body:'NVDA AVGO CRWD ASML PLTR AMD MRVL PENG LITE COST และ NTAP น้องใหม่ที่เพิ่งซื้อ 12 ต.ค. 69 ด้วยเงิน ~1,000 บาท เน้นโครงสร้างพื้นฐาน AI ล้วน', tag:'พอร์ต DIME'},
{cat:'stocks', title:'671,600 จากเป้า 1,000,000', body:'MainQuest PROJECT 1M ผ่าน milestone 500k แล้ว เหลืออีก 328,400 ต้นไม้การเงินขยับตามขั้น เป้าถัดไป 750k', tag:'PROJECT 1M'},
{cat:'stocks', title:'แผน 300K โตเป็น 385K ยังไง', body:'กอง Income QQQI +10% กอง Growth AMD/MU/DELL/MRVL +45% กอง AI Core NVDA/ASML/AMAT/VRT/TSM +30% รวมโต +85,000 (+28.3%)', tag:'MasterPlan 300K'},
{cat:'stocks', title:'LITE +607% ใน 1 ปี', body:'Watchlist AI Infra 17 ตัวรอบ ต.ค.25-ต.ค.26 นำโดย LITE +607% MU +485.9% DELL +283.8% รั้งท้าย VST -16.5% กับ CEG -16.4%', tag:'Watchlist AI Infra'},
{cat:'stocks', title:'S&P500 75 ตัว +13.97% YTD', body:'ตั้งแต่ 31 ธ.ค.25-7 ต.ค.26 ท็อปคือ Sandisk +613.09% รั้งท้าย Oracle -26.35% เขียว 54 แดง 21 ตลาดยังเป็นขาขึ้น', tag:'S&P 500'},
{cat:'stocks', title:'เงิน 11 ที่ DCA เดือนละพันกว่า', body:'กระจาย KTB KBank BBL SCB PayPal TrueMoney TTB Dime! Webull ShopeePay Kept ตั้งเป้า DCA 1,200-2,000 บาทต่อเดือน', tag:'เงิน 11 ธนาคาร'},
{cat:'stocks', title:'CAGR คือความเร็วเฉลี่ยต่อปี', body:'สูตร (1+R)^(1/3)-1 เช่น LITE โต 3 ปีรวมมหาศาล แต่เฉลี่ยแล้ว 178.1% ต่อปี ใช้เทียบหุ้นที่ช่วงเวลาไม่เท่ากัน', tag:'CAGR (ทั่วไป)'},
/* ---------- ดนตรี (7) ---------- */
{cat:'music', title:'บีท 22 เพลงสายดาร์ก', body:'ตั้งแต่ A18 Maoricore ถึง A126 shining river สไตล์ดาร์ก cloud rap ผสม ambient ตัวเด่น A42 wavelove A109 firstlove A119 oversoul', tag:'บีท 22 เพลง'},
{cat:'music', title:'บีทขายจริง 700-900 สอน 2,500', body:'งานบีท Ambient 800-900 Regalia 700 รับทำบีท 900 สอนตัวต่อตัวครั้งละ 1,000-2,500 รายได้เข้ากระเป๋าตรงไม่ผ่านค่าย', tag:'ราคาบีท'},
{cat:'music', title:'ห้องอัด 96,500 จากแสน', body:'คอม 15,200 Focusrite 2,300 AT2020 1,500 ชุด Avantone 4,000 รวม 96.5% ของงบแสนบาท ขาดอีกนิดเดียวครบเซ็ต', tag:'ห้องอัด 96.5%'},
{cat:'music', title:'เริ่มจากวง shoegaze ม.4', body:'ปี 2021 ตั้งวง shoegaze เพลงแรกทะลุ 1 หมื่นวิว ทำมาแล้วกว่า 10 งาน ก่อนกลายร่างเป็น prod.et1cruel ขายบีทปี 2024', tag:'จุดเริ่ม 2021'},
{cat:'music', title:'ช่องบีท 5,158 ฟอล', body:'prod.et1cruel 5,158 et1cruel 612 dir.et1cruel 255 รวม 7 ช่อง 25K หัวหอกคือช่อง Lucky 18.7K', tag:'ช่องเพลง'},
{cat:'music', title:'อัลบั้มค้าง 2 ชุด', body:'Folk-Ambient 10 เพลงสายฮีลิ่ง กับ HIMORIYACORE 10 เพลงที่เสร็จแล้ว 60% จบสองชุดนี้คือเลเวลอัพครั้งใหญ่', tag:'เควสค้าง'},
{cat:'music', title:'เรทเอาตัวรอดสายบีท', body:'ขายบีท 300-500 ตัดคลิป 300-500 preset/drumkit 200-300 ราคาจับต้องได้ ขายออกเรื่อยๆ ดีกว่ารอขายแพง', tag:'เรทเอาตัวรอด'},
/* ---------- ศิลปะ (7) ---------- */
{cat:'art', title:'8 หลัก 4 หลัก 4 อดิเรก', body:'หลักคือ บีท วีดีโอ เพลง สัก อดิเรกคือ คอนเท้น เสื้อผ้า เอไอ ทำเว็บ อาวุธคุ้มสุดคือคอมเครื่องเดียวทำได้ 5 งาน', tag:'8 หลัก'},
{cat:'art', title:'เครื่องสัก 2,200 งานแรก เม.ย.26', body:'ซื้อเครื่องสัก 2,200 เริ่มชิ้นแรกเมษายน 2026 รับออกแบบลาย 1,500 ช่อง art.et1cruel 248 ฟอลรอดู', tag:'ห้องสัก'},
{cat:'art', title:'กล้อง 3 ตัวถึง 8K', body:'Nikon D5200 4,700 iPhone 5,000 และ Insta360 Ace Pro2 ถ่าย 8K ราคารวมหมื่นห้า พร้อมถ่าย Food Cinematic', tag:'กล้องคอนเทนต์'},
{cat:'art', title:'เปิดหมวกมีรูปเป็นหลักฐาน', body:'ภาพ busk-guitar 27 ม.ค. กับทิป busk-cash เรทเปิดหมวก 2,000 ดนตรีสด 400 เล่นจริงได้เงินจริง', tag:'เปิดหมวก'},
{cat:'art', title:'ข้าวมันไก่ 50 บาท 5 ดาว', body:'เมนูสุดรักข้าวมันไก่บางใหญ่ 50 บาท 5 ดาวกินมา 12 ครั้ง buff ข้าว+30HP เป้า Rank นักชิมสูงสุด 30 ร้าน', tag:'ห้องอาหาร'},
{cat:'art', title:'หนู Lucky กับ LV21', body:'มาสคอตหนูขาว Lucky เกิด 31 มี.ค.25 เจ้าของ LV21 ARTIST EXP 96,500/100,000 เควส CLEAR 60 ACTIVE 8', tag:'มาสคอต'},
{cat:'art', title:'5 ร่าง et1cruelverse', body:'et1cruel prod. dir. Cruelmanblack himoriyacore-tana จากมนุษย์สู่ศิลปิน ครีเอเตอร์ โปรแกรมเมอร์ วิศวกร นักประดิษฐ์', tag:'5 ร่าง'},
/* ---------- เทคโนโลยี (7) ---------- */
{cat:'tech', title:'ป่าโตตามวินัย ~14 วัน', body:'Living Forest วาด procedural โตจากไดอารี่วันละนิดกับ XP โตเต็มใน 14 วัน มี 4 พาเลตต์เช้าสายเย็นคืน', tag:'Living Forest'},
{cat:'tech', title:'หนูลัคกี้เดินบนเว็บได้', body:'หนู canvas เดินบนพื้นจอและขอบการ์ด จำชื่อลัคกี้ไมซ์ได้ คลิกแล้วจี๊ด ดับเบิลคลิกถือเหรียญ', tag:'หนูลัคกี้'},
{cat:'tech', title:'เสียง 9 ชั้นโดรน 528Hz', body:'Sound Garden ผสมฝนคลื่นป่ากลางคืนไฟธารฟ้าร้อง มี preset 6 แบบ sleep timer 15/30/60 นาที', tag:'Sound Garden'},
{cat:'tech', title:'12 keys ไม่ส่งออกเน็ต', body:'ทุกอย่างเก็บใน localStorage 12 keys ไดอารี่พอร์ตป่าเสียงอยู่แค่เครื่องนี้ Export ได้ไม่ผูกเซิร์ฟเวอร์', tag:'ความเป็นส่วนตัว'},
{cat:'tech', title:'เว็บนี้ออฟไลน์ได้', body:'PWA แบบ standalone หน้า HTML ใช้เน็ตก่อนแคชทีหลัง ไฟล์ static ใช้แคชก่อน อัปเดตผ่าน service worker', tag:'PWA'},
{cat:'tech', title:'i5+4060 แรม 32 ทำทุกอย่าง', body:'สเปก i5-12400 RTX4060 แรม 32GB สแต็ก React Vite Express Supabase อยู่ Win10 ไม่ไป Win11', tag:'สเปก+สแต็ก'},
{cat:'tech', title:'PAKJAI กับโรงเรียนบีท', body:'โปรเจกต์ PAKJAI React/Express/Supabase กับ Thai Beat Academy คอร์ส 990 และระบบ AI STOCK', tag:'โปรเจกต์'}
];
