# งาน GLM 5.3 Flash (via CodeGPT) — เขียนเกร็ดความรู้จากข้อมูลจริงในเว็บ
# วิธีใช้: ก็อป BLOCK ระหว่างเส้น --- ไปวางใน CodeGPT Chat แล้วกด Enter
# ได้โค้ดกลับมาแล้ว: เซฟเป็นไฟล์ `js/knowledge-data.js` ในโฟลเดอร์เว็บ แล้วบอก Muse ว่าเสร็จ

--- COPY ตั้งแต่บรรทัดนี้ ---
เขียนไฟล์ข้อมูลเดียว `js/knowledge-data.js` ให้เว็บ ET1CRUEL (static HTML ไม่มี build)

สเปกไฟล์ (ห้ามผิด):
1. สร้างไฟล์ใหม่ไฟล์เดียว ห้ามแก้ไฟล์อื่น
2. เนื้อไฟล์คือ JS ล้วน บรรทัดแรก `window.ET1KNOWLEDGE = [` ปิดท้าย `];` ไม่มี import/export ไม่ต้องมี HTML
3. array มี object อย่างละ 7 ชิ้น รวม 28 ชิ้น ครบ 4 หมวด `cat` = 'stocks' | 'music' | 'art' | 'tech'
4. ฟิลด์แต่ละชิ้น: `{cat:'stocks', title:'...', body:'...', tag:'...'}` เท่านั้น
   - title ภาษาไทย สั้น ≤ 40 ตัวอักษร
   - body ภาษาไทย 1-3 ประโยค ≤ 220 ตัวอักษร อ่านสนุกแบบเล่าให้เพื่อนฟัง
   - tag คือป้ายที่มา เช่น 'พอร์ต DIME', 'บีท 22 เพลง', 'ห้องสัก', 'Living Forest'
5. กฎเหล็ก: ตัวเลข ชื่อหุ้น ราคา จำนวน ต้องเอาจาก "วัตถุดิบ" ด้านล่างเท่านั้น ห้ามแต่งตัวเลขใหม่เด็ดขาด
   เกร็ดความรู้ทั่วไป (เช่น P/E คืออะไร, cloud rap คืออะไร) ใส่ได้ แต่ต้องเป็นเรื่องจริงสากลและ tag ลงท้ายว่า '(ทั่วไป)'
6. ผ่าน `node --check` (ไฟล์ JS ธรรมดา ไม่มี syntax ผิด)

วัตถุดิบ (ของจริงจากเว็บ — ดึงไปใช้ได้เลย):
[หุ้น/การเงิน]
- พอร์ต DIME 7 ตัว (15 ต.ค. 69 — ขาย AMD ASML MRVL LITE NTAP ออก + เข้า META 3,000฿ · อ้างอิงราคาสด TradingView 16 ต.ค. 69): NVDA 217.23x0.4533, AVGO 344.33x0.1716, CRWD 244.57x0.1529, PLTR 200.50x0.1531, PENG 61.86x1.1171, COST 978.01x0.0101, META 736.72x0.121 (มูลค่า ~$394 ต้นทุน ~$417)
- ค่าเงิน $1=33.53฿ (สแนปช็อต ER-API 16 ต.ค. 69), เป้าหมายพอร์ต 1M ตอนนี้ 671,600 (MainQuest milestones 500k/750k/1M/2M/10M), ต้นไม้การเงิน stages 🌱<25% 🌿25% 🌳50% 🌳✨75%
- MasterPlan 300K = Income QQQI +10%→110,000 / Growth AMD/MU/DELL/MRVL +45%→145,000 / AI Core NVDA/ASML/AMAT/VRT/TSM +30%→130,000 (รวม 385,000 +28.3%)
- Watchlist AI Infra 1Y: LITE +607%, MU +485.9%, DELL +283.8% ... CEG -16.4%, สูตร CAGR 3Y (1+R)^1/3-1 (LITE 178.1%)
- S&P500 75 ตัว YTD +13.97%, ท็อป Sandisk +613.09%, รั้งท้าย Oracle -26.35% (เขียว54 แดง21)
- เงิน 11 ธนาคาร (KTB/KBank/BBL/SCB/PayPal/TrueMoney/TTB/Dime!/Webull/ShopeePay/Kept), เป้า DCA 1,200-2,000/เดือน, กระแสเงินสด 25,000-30,000/เดือน
- ราคาสดจาก TradingView + CoinGecko + ER-API รีเฟรช 60 วิ
[ดนตรี]
- บีท 22 เพลง: A18 Maoricore, A23 Regalia Himoriya, A42 wavelove, A43 ambientworld, A50 spiritual, A80 swamp, A109 firstlove, A112 Stuck, A119 oversoul, A126 shining river (สไตล์ดาร์ก cloud rap + ambient)
- ราคาขายจริง: บีท Ambient 800-900, Regalia 700, สอนทำบีท 1,000-2,500, เรทเอาตัวรอดขายบีท 300-500
- สตูดิโอ 96,500/100,000 (96.5%): คอม 15,200, Focusrite 2,300, AT2020 1,500, Avantone CK-6+M-Audio Duo 4,000, กีตาร์โปร่ง+ไฟฟ้า, แอมป์เปิดหมวก 6,200
- ช่องเพลง prod.et1cruel 5,158 ฟอล, เริ่ม 2021 ม.4 วง shoegaze เพลงแรก 1 หมื่นวิว, เควสค้าง: อัลบั้ม Folk-Ambient 10 เพลง + HIMORIYACORE 10 เพลง 60%
[ศิลปะ]
- 8 หลัก: บีท/วีดีโอ/เพลง/สัก + คอนเท้น/เสื้อผ้า/เอไอ/ทำเว็บ, 5 ร่าง et1cruelverse (et1cruel/prod./dir./Cruelmanblack/himoriyacore-tana)
- งานสัก: เครื่องสัก 2,200 (เม.ย.2026 ชิ้นแรก), รับออกแบบสัก 1,500, ช่อง art.et1cruel 248 ฟอล
- กล้องคอนเทนต์ Nikon D5200 4,700 / iPhone 5,000 / Insta360 Ace Pro2 8K ~15,090, เปิดหมวกมีรูปหลักฐาน busk-guitar ทิป busk-cash
- ห้องอาหาร: ข้าวมันไก่บางใหญ่ 50฿ 5ดาว fav 12 ครั้ง, buff ข้าว+30HP เส้น+20MP, Rank นักชิม ≥30 👑 ≥10 ⚔️, สโลแกน FOOD IS KING
- มาสคอตหนูขาว Lucky (31 มี.ค.25), LV21 ARTIST EXP 96,500/100,000, CLEAR 60 ACTIVE 8
[เทคโนโลยี]
- Living Forest: canvas procedural ป่าโตตามไดอารี่+XP (โตเต็ม ~14 วัน), พาเลตต์ dawn/day/dusk/night, API ET1FOREST.setWeather/celebrate
- หนูลัคกี้: canvas เดินบนการ์ดได้ จำชื่อได้, Sound Garden 9 ชั้นเสียง + โดรน 528Hz + sleep timer
- Web Audio สังเคราะห์เสียงล้วน (ฝน/คลื่น/ป่า), เก็บข้อมูลใน localStorage 12 keys ไม่ส่งออกเน็ต, PWA offline (HTML network-first)
- สเปก PC i5-12400/RTX4060/RAM32GB, สแต็ก React/Vite/Express/Supabase, โปรเจกต์ PAKJAI + Thai Beat Academy + AI STOCK

ส่งกลับเป็นโค้ดไฟล์เต็มๆ ไฟล์เดียว (28 ชิ้น) พร้อมนับจำนวนให้ดูว่าครบ 7 ต่อหมวด
--- COPY ถึงบรรทัดนี้ ---
