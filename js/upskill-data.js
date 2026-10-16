/* ===== UPSKILL DATA — คลังทักษะ 11 รายการ (content ล้วน, ไม่มี logic) =====
 * Exemplar ลึก 1 ตัว: web-app (ความรู้เว็บทั่วไป L0–L5 + ลิงก์อ้างอิงของจริง)
 * อีก 10 ทักษะเป็นเปลือก detail:null + todoNote — ห้ามแต่งประวัติ/บุคคล/รายได้ */
(function () {
  'use strict';

  var SKILLS = [
    {
      id: 'coding-robotics', slug: 'coding-robotics', kingdom: 'tech',
      nameTh: 'การเขียนโค้ดและหุ่นยนต์', nameEn: 'Coding & Robotics',
      summary: 'เขียนโปรแกรมสั่งงานตั้งแต่แอปยันหุ่นยนต์: logic, embedded, เซนเซอร์, control',
      objectives: ['คิดเชิงคำนวณ', 'เขียนโปรแกรมได้', 'ต่อหุ่นยนต์ทำงานจริงได้'],
      prerequisites: ['คณิตพื้นฐาน', 'คอม 1 เครื่อง'],
      tags: ['python', 'embedded', 'ros', 'ai'],
      links: [{ label: 'AI Agency (โค้ด + AI)', url: 'agency.html' }],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์, พื้นฐาน, roadmap L0–L5, เครื่องมือ, โปรเจกต์, อาชีพ, บุคคลต้นแบบ + refs'
    },
    {
      id: 'web-app', slug: 'web-app', kingdom: 'tech',
      nameTh: 'การพัฒนาเว็บและแอปพลิเคชัน', nameEn: 'Web & Application Development',
      summary: 'สร้างเว็บและแอปให้คนใช้จริง: ตั้งแต่ HTML หน้าเดียว จนถึงระบบมีสมาชิก ฐานข้อมูล และ AI',
      objectives: ['ทำเว็บใช้เองได้', 'รับงานฟรีแลนซ์ได้', 'สร้างโปรดักต์ของตัวเองได้'],
      prerequisites: ['คอม + อินเทอร์เน็ต', 'ภาษาอังกฤษอ่าน docs ได้บ้าง'],
      tags: ['html', 'css', 'javascript', 'react', 'node', 'deploy', 'เว็บแอป', 'ทำเว็บ'],
      links: [
        { label: 'AI Agency (โค้ด + AI)', url: 'agency.html' },
        { label: 'CREATE AI', url: 'create-ai.html' },
        { label: 'LIFE OS (หน้าแรก)', url: 'index.html' }
      ],
      detail: {
        identity: {
          about: 'สายงานสร้างสิ่งที่คนเปิดใช้ผ่านเบราว์เซอร์หรือมือถือ: เว็บไซต์ เว็บแอป ระบบหลังบ้าน API ฐานข้อมูล ระบบสมาชิก การจ่ายเงิน',
          solves: 'แก้ปัญหาการเข้าถึงบริการและข้อมูล: ร้านค้าขายของออนไลน์ได้ องค์กรจัดการข้อมูลได้ คนทั่วไปใช้เครื่องมือผ่านเน็ตได้',
          basics: ['ตรรกะและการแก้ปัญหา', 'ภาษาอังกฤษเชิงเทคนิค', 'พื้นฐานอินเทอร์เน็ต (HTTP/URL)'],
          roles: ['Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'DevOps', 'UI Engineer'],
          connects: 'ออกแบบ (Design) + ธุรกิจ (ค้าขาย/คอนเทนต์) + ข้อมูล (db/analytics) + AI',
          fits: ['อาชีพประจำ', 'ฟรีแลนซ์', 'ธุรกิจ/โปรดักต์ของตัวเอง'],
          related: ['coding-robotics (logic + embedded)', 'design-visual (UI)', 'book-publishing (docs)']
        },
        history: [
          { year: '1989–1990', title: 'World Wide Web ถือกำเนิดที่ CERN', text: 'Tim Berners-Lee เสนอระบบเอกสารเชื่อมโยงกันผ่านอินเทอร์เน็ต แล้วสร้างเบราว์เซอร์ + เซิร์ฟเวอร์ตัวแรก — เว็บจึงเริ่มเป็นเอกสารอ่านได้อย่างเดียว', ref: 'https://home.web.cern.ch/' },
          { year: '1993', title: 'Mosaic: เบราว์เซอร์กราฟิกตัวแรกที่แพร่หลาย', text: 'NCSA Mosaic แสดงรูปภาพในหน้าเว็บได้ ทำให้คนทั่วไปเริ่มใช้เว็บ — จุดเริ่มเว็บเชิงพาณิชย์', ref: '' },
          { year: '1995', title: 'JavaScript เกิดใน 10 วัน', text: 'Brendan Eich สร้างภาษาสคริปต์ให้ Netscape เพื่อให้หน้าเว็บโต้ตอบได้ — ภาษาที่เคยถูกดูแคลนกลายเป็นภาษากลางของเว็บ', ref: 'https://brendaneich.com/' },
          { year: '1996', title: 'CSS แยกหน้าตาออกจากเนื้อหา', text: 'CSS Level 1 ให้สไตล์ (สี ฟอนต์ เลย์เอาต์) แยกจากโครงสร้าง HTML — งานออกแบบเว็บกลายเป็นวิชาชีพ', ref: 'https://www.w3.org/' },
          { year: '2005', title: 'Git: ระบบเวอร์ชันของ Linus Torvalds', text: 'Torvalds เขียน Git มาดูแลเคอร์เนลลินุกซ์ — กลายเป็นมาตรฐานเก็บโค้ดของโลก ร่วมงานกันได้โดยไม่เหยียบเท้ากัน', ref: 'https://git-scm.com/' },
          { year: '2009', title: 'Node.js: JavaScript ฝั่งเซิร์ฟเวอร์', text: 'Ryan Dahl เอา V8 engine มารันนอกเบราว์เซอร์ — ภาษาเดียวเขียนได้ทั้งหน้าบ้านหลังบ้าน เกิดยุค full-stack JS', ref: 'https://nodejs.org/' },
          { year: '2010', title: 'Responsive Web Design', text: 'Ethan Marcotte เสนอออกแบบเว็บให้ยืดหยุ่นตามขนาดจอ — ยุคมือถือทำให้ "รองรับทุกจอ" เป็นข้อบังคับ', ref: '' },
          { year: '2013', title: 'React: UI แบบ component', text: 'ทีม Facebook เปิด React ให้คิด UI เป็นชิ้นส่วนประกอบกันได้ — วิธีสร้างเว็บแอปสมัยใหม่เปลี่ยนถาวร', ref: 'https://react.dev/' }
        ],
        fundamentals: [
          { term: 'HTML element', simple: 'โครงกระดูกของหน้าเว็บ: ส่วนหัว เนื้อความ ปุ่ม รูป', deep: 'DOM tree ที่เบราว์เซอร์ parse จาก markup; semantic tags (header/main/article) ช่วย SEO และ screen reader', example: 'บทความนี้ใช้ <article> ครอบเนื้อหา <h2> เป็นหัวข้อ', mistake: 'ใช้ <div> กับทุกอย่างจนโปรแกรมอ่านจอไม่รู้โครงสร้าง' },
          { term: 'CSS box model', simple: 'ทุกกล่องมี content + padding + border + margin', deep: 'layout ล่มส่วนใหญ่มาจาก margin collapse และ box-sizing; ใช้ border-box จะคำนวณขนาดตรงใจ', example: 'การ์ดกว้าง 300px แต่ล้นเพราะ padding บวกเพิ่ม — แก้ด้วย box-sizing:border-box', mistake: 'ยัด !important แก้สไตล์จนทับกันมั่ว' },
          { term: 'DOM + JavaScript', simple: 'สะพานสั่งให้หน้าเว็บขยับตามคนกด', deep: 'event-driven: ฟัง event → เปลี่ยน state → render ใหม่; แยก data ออกจาก UI จะดีบั๊กง่าย', example: 'กดปุ่มบันทึก → เก็บลง localStorage → วาดรายการใหม่', mistake: 'แก้ innerHTML ทั้งก้อนทุกครั้งจน state หาย + ช้า' },
          { term: 'HTTP request/response', simple: 'เบราว์เซอร์ขอ — เซิร์ฟเวอร์ตอบ ผ่าน method GET/POST', deep: 'stateless: จำสถานะด้วย session/token; status code บอกผล (200/404/500); HTTPS เข้ารหัสระหว่างทาง', example: 'ฟอร์มล็อกอินส่ง POST → ได้ token กลับมาเก็บใช้ครั้งต่อไป', mistake: 'ส่งรหัสผ่านผ่าน GET (โผล่ใน URL/log)' },
          { term: 'Responsive design', simple: 'จอไหนก็อ่านได้ ไม่ต้องซูมเลื่อนซ้ายขวา', deep: 'fluid grid + flexible media + media queries; ออกแบบ mobile-first แล้วขยายขึ้น', example: 'ตารางหุ้นบนมือถือยุบเป็นแนวนอนเลื่อนได้', mistake: 'ฟิกซ์ความกว้างเป็น px ทั้งหน้า' },
          { term: 'API + JSON', simple: 'ประตูให้โปรแกรมคุยกัน ส่งข้อมูลเป็น JSON', deep: 'REST: resource + method; ออกแบบ contract ก่อนเขียนโค้ด; versioning กัน breaking change', example: 'เว็บนี้ดึงราคาหุ้นจาก TradingView scanner API ตรงจากเบราว์เซอร์', mistake: 'ฝัง API key ลับไว้ในโค้ดฝั่ง frontend' },
          { term: 'Database', simple: 'ลิ้นชักเก็บข้อมูลอย่างเป็นระเบียบ ค้นหาได้', deep: 'SQL vs NoSQL; normalize กันข้อมูลซ้ำ; index ให้ค้นเร็ว; backup ก่อนพังไม่ใช่หลังพัง', example: 'เก็บออเดอร์ร้านค้า: ตาราง orders + customers เชื่อมด้วย id', mistake: 'เก็บทุกอย่างในไฟล์เดียวแล้วค้นด้วยตา' },
          { term: 'Auth (ยืนยันตัวตน)', simple: 'รู้ว่าใครกำลังใช้อยู่', deep: 'hash รหัสผ่าน (ห้ามเก็บ plain text); session vs token; 2FA สำหรับของสำคัญ', example: 'ล็อกอินด้วยอีเมล+รหัสผ่าน ได้ session กลับมา', mistake: 'เก็บรหัสผ่านเป็นตัวหนังสือธรรมดาในฐานข้อมูล' }
        ],
        roadmap: {
          L0: { name: 'EXPLORER', goals: ['รู้ว่าเว็บทำงานยังไง', 'ลองแก้หน้าเว็บเล่นได้'], exercises: ['เปิด DevTools ดูโครงเว็บโปรด', 'แก้ข้อความ/สีหน้าเว็บตัวเองผ่าน inspector'], project: 'หน้าแนะนำตัวเอง 1 หน้า (HTML ล้วน)', doneWhen: 'อธิบายได้ว่าไฟล์ไหนทำหน้าที่อะไร' },
          L1: { name: 'BEGINNER', goals: ['HTML/CSS/JS พื้นฐาน', 'ใช้ Git เก็บงานได้'], exercises: ['จัดเลย์เอาต์การ์ด 3 แบบ', 'ทำปุ่มนับคลิก + เซฟค่าลง localStorage', 'push งานขึ้น GitHub'], project: 'Personal Dashboard หน้าเดียว (เว็บนี้ทั้งเว็บคือตัวอย่าง)', doneWhen: 'ทำเว็บ 1 หน้าจบเองได้โดยไม่ลอกทั้งดุ้น' },
          L2: { name: 'PRACTITIONER', goals: ['แยก frontend/backend ได้', 'ต่อ API + ฐานข้อมูลได้'], exercises: ['ดึง API จริงมาแสดง (เช่น ราคาหุ้น)', 'ทำ CRUD ครบสร้าง/อ่าน/แก้/ลบ', 'ออกแบบ schema 1 ระบบ'], project: 'เว็บแอปมีฐานข้อมูล + ระบบสมาชิก', doneWhen: 'มีผู้ใช้คนอื่นลองใช้ได้โดยไม่ต้องอธิบาย' },
          L3: { name: 'ADVANCED', goals: ['ใช้ React/framework ได้', 'auth + testing + security พื้นฐาน'], exercises: ['ย้ายเว็บ vanilla เป็น React', 'เขียน test ให้ฟังก์ชันเงินๆ ทองๆ', 'อุดช่องโหว่ XSS/CSRF ในงานตัวเอง'], project: 'AI-powered Web App (เรียก AI API แบบคุมต้นทุน)', doneWhen: 'แก้บั๊ก/รับ requirement เปลี่ยนกลางคันได้' },
          L4: { name: 'PROFESSIONAL', goals: ['deploy/CI-CD/domain ได้', 'perf + a11y + SEO ผ่านเกณฑ์'], exercises: ['ตั้ง pipeline deploy อัตโนมัติ', 'วัด Lighthouse แล้วแก้ให้เขียว', 'ทำ accessibility ให้ใช้คีย์บอร์ดล้วนได้'], project: 'งานลูกค้าจริง 1 ชิ้น (มี deadline + feedback)', doneWhen: 'ส่งงานให้ลูกค้าจ่ายเงินได้' },
          L5: { name: 'EXPERT / INNOVATOR', goals: ['ออกแบบสถาปัตยกรรมเองได้', 'ถ่ายทอด/นำทีมได้'], exercises: ['เขียน ADR (บันทึกตัดสินใจสถาปัตยกรรม)', 'รีวิวโค้ดคนอื่น', 'สร้าง starter/library ของตัวเอง'], project: 'โปรดักต์ของตัวเองที่มีผู้ใช้จริง', doneWhen: 'คนอื่นอ้างอิงงาน/วิธีคิดของเรา' }
        },
        practice: {
          methods: ['อ่าน docs แล้วพิมพ์ตาม (ไม่ copy-paste)', 'ทำโจทย์เล็กทุกวันดีกว่าอัดวันเดียว', 'ดีบั๊กเองก่อนถาม: อ่าน error message ให้จบ'],
          novice: ['ทบทวน HTML tags 20 ตัวด้วยเว็บ 1 หน้า', 'CSS: จัดการ์ดเดิม 3 สไตล์'],
          intermediate: ['JS: ตะกร้าสินค้าคำนวณเงินถูก', 'ต่อ API จริง + แสดง loading/error/empty state'],
          advanced: ['ทำฟีเจอร์เดียวกันด้วย 2 วิธีแล้วเทียบข้อดีข้อเสีย', 'จำลอง traffic แล้วแก้คอขวด'],
          weekly: 'จ–ศ วันละ 45–60 นาที (ทฤษฎี 20 + ลงมือ 40) · ส–อา 1 โปรเจกต์ย่อย · สิ้นสัปดาห์เขียน reflection 5 บรรทัด',
          review: 'กลับมาอ่านโค้ดเดือนก่อนแล้วรีไรต์ให้สั้นลงครึ่งหนึ่ง',
          feedback: 'ขอรีวิวจากคนที่เก่งกว่า (PR บน GitHub) + อ่านโค้ด open source วันละ 1 ไฟล์',
          debug: 'ทวนสอบ input → หาจุดพังด้วย console/network → แก้ที่ต้นเหตุ ไม่ใช่ที่อาการ',
          selftest: 'ปิด docs แล้วทำซ้ำจากความจำ — ถ้าทำได้ = เป็นจริง ถ้าต้องเปิดทุกขั้น = แค่จำได้'
        },
        tools: [
          { name: 'VS Code', use: 'เขียนโค้ด + debug', for: 'มือใหม่ถึงมืออาชีพ', cost: 'ฟรี' },
          { name: 'Git + GitHub', use: 'เก็บเวอร์ชัน + ร่วมงาน + โชว์ผลงาน', for: 'ทุกคน (เริ่มวันที่ 1)', cost: 'ฟรี (repo สาธารณะ)' },
          { name: 'Node.js', use: 'รัน JS ฝั่งเซิร์ฟเวอร์ + เครื่องมือ build', for: 'ตั้งแต่ L2', cost: 'ฟรี open source' },
          { name: 'GitHub Pages / Netlify / Vercel', use: 'เอางานขึ้นเน็ตให้คนเปิดได้', for: 'ตั้งแต่ L1', cost: 'มีแผนฟรี (เว็บนี้ใช้ GitHub Pages)' },
          { name: 'Figma', use: 'ออกแบบหน้าตาก่อนเขียนโค้ด', for: 'คนทำ UI', cost: 'มีแผนฟรี' }
        ],
        projects: [
          { name: 'หน้าแนะนำตัวเอง + ผลงาน', level: 'L1', steps: ['ร่างเนื้อหา', 'เขียน HTML', 'แต่ง CSS', 'deploy ขึ้นเน็ต'], doneWhen: 'ส่งลิงก์ให้คนอื่นเปิดได้' },
          { name: 'ระบบจดบันทึกรายรับรายจ่าย', level: 'L2', steps: ['ออกแบบ schema', 'ทำ CRUD', 'สรุปยอด + กราฟ', 'backup/restore ได้'], doneWhen: 'ใช้เองจริง 1 เดือน' },
          { name: 'เว็บพอร์ตรับงานฟรีแลนซ์', level: 'L4', steps: ['เลือกงานโชว์ 3 ชิ้น', 'เขียน case study สั้น', 'ช่องทางติดต่อ + เรทราคา', 'SEO พื้นฐาน'], doneWhen: 'มีคนทักมาจ้าง/ถามงาน' }
        ],
        careers: [
          { path: 'งานประจำ (frontend/backend/full-stack)', needs: 'L3+ + portfolio + สัมภาษณ์โค้ด', portfolio: 'โปรเจกต์จบ 2–3 ชิ้น + GitHub มี commit สม่ำเสมอ', start: 'สมัคร junior / internship พร้อมลิงก์งาน', watch: 'เงินเดือนขึ้นกับตลาดและเมือง — เทียบประกาศรับสมัครจริงหลายที่ อย่าเชื่อเลขลอย' },
          { path: 'ฟรีแลนซ์รายโปรเจกต์', needs: 'L2–L3 + สื่อสาร + ประเมินราคาเป็น', portfolio: 'เว็บตัวอย่าง 3 แบบ + รีวิวลูกค้า', start: 'แพลตฟอร์มงานฟรีแลนซ์ไทย + บอกต่อ', watch: 'มัดจำก่อนเริ่มงาน + สัญญาขอบเขตงานกันบานปลาย' },
          { path: 'โปรดักต์/ธุรกิจของตัวเอง', needs: 'L4 + เข้าใจลูกค้า', portfolio: 'โปรดักต์ที่มีผู้ใช้จริง', start: 'แก้ปัญหาของตัวเองก่อนแล้วขายวิธีแก้', watch: 'ต้นทุนเซิร์ฟเวอร์/API เติบโตตามผู้ใช้ — คำนวณ unit economics ก่อน scale' },
          { path: 'สอน/ทำคอร์ส/คอนเทนต์', needs: 'L3 + อธิบายเป็น', portfolio: 'บทความ/คลิปสอนที่คนตาม', start: 'สอนสิ่งที่เพิ่งผ่านมา 1 level', watch: 'รายได้ผันผวนตามแพลตฟอร์ม — กระจายช่องทาง' }
        ],
        people: [
          { name: 'Tim Berners-Lee', start: 'นักวิจัย CERN ที่อยากให้เอกสารวิจัยเชื่อมถึงกันได้', skill: 'ออกแบบระบบเปิด (URL/HTTP/HTML) ให้ใครก็ใช้ต่อได้', work: 'World Wide Web + ตั้ง W3C ดูแลมาตรฐานเว็บ', lesson: 'ของที่เปลี่ยนโลกมักเริ่มจากแก้ปัญหาของตัวเองให้คนอื่นใช้ต่อได้', ref: 'https://www.w3.org/' },
          { name: 'Brendan Eich', start: 'วิศวกร Netscape ที่ต้องสร้างภาษาสคริปต์ใน ~10 วัน', skill: 'ออกแบบภาษาให้คนธรรมดาเขียนได้ + ต่อยอดได้ไกล', work: 'JavaScript + ต่อมาร่วมก่อตั้ง Mozilla', lesson: 'งานเร่งๆ ถ้าออกแบบแกนดีก็อยู่ได้ 30 ปี', ref: 'https://brendaneich.com/' },
          { name: 'Evan You', start: 'วิศวกรที่ทำโปรเจกต์ส่วนตัวหลังเลิกงาน', skill: 'ฟังเสียงคนใช้ + ออกแบบให้เริ่มง่าย', work: 'Vue.js framework ที่คนทั่วโลกใช้', lesson: 'เริ่มเล็กจากปัญหาจริง สะสมผู้ใช้ทีละคนก็เป็นโปรดักต์โลกได้', ref: 'https://evanyou.me/' }
        ],
        resources: [
          { label: 'MDN Web Docs (เอกสารหลัก HTML/CSS/JS)', url: 'https://developer.mozilla.org/' },
          { label: 'web.dev (แนวทางเว็บสมัยใหม่จาก Google)', url: 'https://web.dev/' },
          { label: 'React docs', url: 'https://react.dev/' },
          { label: 'Node.js', url: 'https://nodejs.org/' },
          { label: 'Git docs', url: 'https://git-scm.com/doc' },
          { label: 'freeCodeCamp (ฝึกฟรี)', url: 'https://www.freecodecamp.org/' }
        ],
        tree: {
          nodes: [
            { id: 'html', label: 'HTML โครงสร้าง', requires: [], unlockHint: 'ทำหน้าแนะนำตัวเอง 1 หน้าจบ' },
            { id: 'css', label: 'CSS สไตล์ + เลย์เอาต์', requires: ['html'], unlockHint: 'จัด card เดิม 3 สไตล์ + กล่องไม่ล้น' },
            { id: 'js', label: 'JavaScript + DOM', requires: ['html'], unlockHint: 'ปุ่มโต้ตอบ + เซฟ localStorage ได้' },
            { id: 'responsive', label: 'Responsive ทุกจอ', requires: ['css'], unlockHint: 'เปิดจอ 400px แล้วไม่ล้น/ทับ (self-check)' },
            { id: 'git', label: 'Git + GitHub', requires: [], unlockHint: 'push งานขึ้น repo ตัวเอง' },
            { id: 'ts', label: 'TypeScript', requires: ['js'], unlockHint: 'แปลงไฟล์ JS เป็น type-safe ผ่าน' },
            { id: 'react', label: 'React components', requires: ['js'], unlockHint: 'ย้ายเว็บ 1 หน้าเป็น components' },
            { id: 'api', label: 'API + HTTP', requires: ['js'], unlockHint: 'ดึง API จริงมาแสดงพร้อม loading/error state' },
            { id: 'db', label: 'Database', requires: ['api'], unlockHint: 'CRUD ครบ + อธิบาย schema ได้' },
            { id: 'auth', label: 'Auth + Security', requires: ['db', 'api'], unlockHint: 'ล็อกอินได้ + ไม่มีรหัส plain text' },
            { id: 'deploy', label: 'Deploy + CI/CD', requires: ['html', 'git'], unlockHint: 'ส่งลิงก์ให้คนอื่นเปิดได้จริง' }
          ]
        }
      }
    },
    {
      id: 'electricity-energy', slug: 'electricity-energy', kingdom: 'tech',
      nameTh: 'ไฟฟ้า อิเล็กทรอนิกส์ และพลังงาน', nameEn: 'Electricity & Energy',
      summary: 'เข้าใจไฟ วงจร แบตเตอรี่ และพลังงาน — ต่อยอดหุ่นยนต์และบ้านประหยัดไฟ',
      objectives: ['อ่านวงจรเป็น', 'วัดและซ่อมเบื้องต้นได้', 'ทำระบบพลังงานเล็กๆ ได้'],
      prerequisites: ['คณิต/ฟิสิกส์พื้นฐาน'],
      tags: ['circuit', 'solar', 'battery'],
      links: [],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์, พื้นฐาน SI/โอห์ม/เคอร์ชอฟฟ์, roadmap L0–L5, safety notes ไฟบ้าน/แบต, เครื่องมือวัด, โปรเจกต์, อาชีพ, บุคคล + refs'
    },
    {
      id: 'materials', slug: 'materials', kingdom: 'tech',
      nameTh: 'วิทยาศาสตร์และวิศวกรรมวัสดุ', nameEn: 'Materials Science',
      summary: 'เลือกวัสดุให้เหมาะงาน: แข็ง เบา ทน ร้อน นำไฟ — พื้นฐานงานหุ่นยนต์และโปรดักต์',
      objectives: ['อ่านสมบัติวัสดุเป็น', 'เลือกวัสดุออกแบบชิ้นงานได้'],
      prerequisites: ['เคมี/ฟิสิกส์พื้นฐาน'],
      tags: ['metals', 'polymers', 'composites'],
      links: [],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์, โครงสร้าง-สมบัติ, roadmap L0–L5, ตารางเลือกวัสดุ, โปรเจกต์, อาชีพ, บุคคล + refs'
    },
    {
      id: 'music-audio', slug: 'music-audio', kingdom: 'art',
      nameTh: 'ดนตรีและเสียง', nameEn: 'Music & Audio',
      summary: 'ทำบีท มิกซ์ มาสเตอร์ และธุรกิจเพลง — แยก creation/engineering/business ชัดเจน',
      objectives: ['ทำบีทจบ 1 เพลง', 'มิกซ์เสียงร้องได้', 'มีพอร์ตรับงาน'],
      prerequisites: ['หู + คอม + หูฟัง'],
      tags: ['beatmaking', 'mixing', 'daw'],
      links: [
        { label: 'ห้องเพลง', url: 'music.html' },
        { label: 'ฟังบีท', url: 'beat-select.html' },
        { label: 'ห้องโปรดิวเซอร์', url: 'prod/index.html' }
      ],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์, ทฤษฎีดนตรี, roadmap L0–L5, แบบฝึกหู/มือ, เครื่องมือ DAW, โปรเจกต์, อาชีพ, บุคคล + refs (เชื่อม teacher-mixing ได้)'
    },
    {
      id: 'visual-art', slug: 'visual-art', kingdom: 'art',
      nameTh: 'ศิลปะและภาพ', nameEn: 'Visual Art & Image',
      summary: 'วาด ถ่าย แต่งภาพ — เส้น สี แสง องค์ประกอบ จนมีลายเส้นของตัวเอง',
      objectives: ['วาดจากสังเกตได้', 'มี visual style ของตัวเอง'],
      prerequisites: ['สมุด/กล้องมือถือก็เริ่มได้'],
      tags: ['drawing', 'photo', 'digital-painting'],
      links: [{ label: 'GenPic (หน้าแรก)', url: 'index.html#genpic' }],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์ศิลป์, พื้นฐานเส้นสีแสง, roadmap L0–L5, โปรเจกต์ชุดภาพ, อาชีพ, บุคคล + refs'
    },
    {
      id: 'video-motion', slug: 'video-motion', kingdom: 'art',
      nameTh: 'วิดีโอ ภาพยนตร์ และ Motion Graphics', nameEn: 'Video & Motion',
      summary: 'เล่าเรื่องด้วยภาพเคลื่อนไหว: ถ่าย ตัด เกรดสี โมชัน ตั้งแต่พรีถึงโพสต์',
      objectives: ['ตัดวิดีโอจบ 1 ชิ้น', 'ทำ motion graphic ได้'],
      prerequisites: ['มือถือถ่ายได้ก็เริ่มได้'],
      tags: ['editing', 'color', 'motion'],
      links: [{ label: 'ห้อง Genvideo', url: 'video.html' }],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์หนัง, shot/camera, roadmap L0–L5, workflow pre-post, โปรเจกต์, อาชีพ, บุคคล + refs'
    },
    {
      id: 'fashion', slug: 'fashion', kingdom: 'art',
      nameTh: 'แฟชั่นและการออกแบบเสื้อผ้า', nameEn: 'Fashion & Clothing',
      summary: 'จากสเกตช์ถึงแบรนด์เสื้อ: ผ้า แพทเทิร์น เย็บ คอลเลกชัน ต้นทุน',
      objectives: ['ออกแบบเสื้อ 1 ตัว', 'ทำ tech pack ได้'],
      prerequisites: ['สนใจการแต่งตัว + วาดเบื้องต้น'],
      tags: ['styling', 'textile', 'brand'],
      links: [],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์แฟชั่น, ผ้า/แพทเทิร์น, roadmap L0–L5, โปรเจกต์, ต้นทุน/ราคา, บุคคล + refs'
    },
    {
      id: 'tattoo', slug: 'tattoo', kingdom: 'art',
      nameTh: 'ศิลปะการสัก', nameEn: 'Tattoo Art',
      summary: 'เส้น น้ำหนัก แสงเงา บนผิวโค้ง — ฝึกบนวัสดุจำลองก่อน เน้นสุขอนามัย',
      objectives: ['มี flash sheet ชุดแรก', 'ออกแบบตามสรีระได้'],
      prerequisites: ['พื้นฐานวาดเส้น'],
      tags: ['flash', 'linework', 'hygiene'],
      links: [],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์การสัก, เส้น/เงา/composition บนผิว, roadmap L0–L5, safety สุขอนามัย (ห้ามฝึกกับคนจริงโดยไม่พร้อม), โปรเจกต์, บุคคล + refs'
    },
    {
      id: 'design-visual', slug: 'design-visual', kingdom: 'art',
      nameTh: 'การออกแบบและการสื่อสารด้วยภาพ', nameEn: 'Design & Visual Communication',
      summary: 'สื่อสารด้วยภาพ: type, grid, สี, hierarchy — โปสเตอร์ แบรนด์ UI อินโฟกราฟิก',
      objectives: ['ออกแบบโปสเตอร์ได้', 'มี identity 1 ชุด'],
      prerequisites: ['โปรแกรมออกแบบฟรี 1 ตัว'],
      tags: ['typography', 'branding', 'ui'],
      links: [],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์ออกแบบ, type/grid/color, roadmap L0–L5, โปรเจกต์, ลิขสิทธิ์ภาพ, บุคคล + refs'
    },
    {
      id: 'book-publishing', slug: 'book-publishing', kingdom: 'art',
      nameTh: 'หนังสือ การจัดหน้า และการเผยแพร่', nameEn: 'Book & Publishing',
      summary: 'จากต้นฉบับถึงหนังสือเล่ม: เขียน จัดหน้า ปก prepress และ self-publishing',
      objectives: ['ทำ zine 1 เล่ม', 'เตรียมไฟล์พร้อมพิมพ์ได้'],
      prerequisites: ['เรื่องที่อยากเล่า'],
      tags: ['editorial', 'typography', 'self-publishing'],
      links: [],
      detail: null,
      todoNote: 'TODO: ประวัติศาสตร์หนังสือ, โครงสร้าง/grid/pagination, roadmap L0–L5, โปรเจกต์, ISBN/ลิขสิทธิ์, บุคคล + refs'
    }
  ];

  var CROSS = [
    { a: 'coding-robotics', b: 'web-app', why: 'แดชบอร์ดควบคุมหุ่นยนต์ผ่านเว็บ' },
    { a: 'coding-robotics', b: 'electricity-energy', why: 'วงจร + เซนเซอร์คือร่างกายหุ่นยนต์' },
    { a: 'materials', b: 'coding-robotics', why: 'เลือกวัสดุให้เบา+แข็งสำหรับโครงหุ่นยนต์' },
    { a: 'music-audio', b: 'video-motion', why: 'เสียง + ภาพ = มิวสิกวิดีโอ/สกอร์หนัง' },
    { a: 'visual-art', b: 'fashion', why: 'ลายเส้น + สี = คอลเลกชันเสื้อผ้า' },
    { a: 'design-visual', b: 'book-publishing', why: 'กริด + type = หนังสือสวยทั้งเล่ม' },
    { a: 'music-audio', b: 'web-app', why: 'เว็บฟังเพลง/ขายบีทของตัวเอง' }
  ];

  window.ET1UPSKILL_DATA = { skills: SKILLS, crossLinks: CROSS };
})();
