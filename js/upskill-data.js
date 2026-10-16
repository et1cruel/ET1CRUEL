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
          { year: '1993', title: 'Mosaic: เบราว์เซอร์กราฟิกตัวแรกที่แพร่หลาย', text: 'NCSA Mosaic แสดงรูปภาพในหน้าเว็บได้ ทำให้คนทั่วไปเริ่มใช้เว็บ — จุดเริ่มเว็บเชิงพาณิชย์', ref: 'https://www.ncsa.illinois.edu/' },
          { year: '1995', title: 'JavaScript เกิดใน 10 วัน', text: 'Brendan Eich สร้างภาษาสคริปต์ให้ Netscape เพื่อให้หน้าเว็บโต้ตอบได้ — ภาษาที่เคยถูกดูแคลนกลายเป็นภาษากลางของเว็บ', ref: 'https://brendaneich.com/' },
          { year: '1996', title: 'CSS แยกหน้าตาออกจากเนื้อหา', text: 'CSS Level 1 ให้สไตล์ (สี ฟอนต์ เลย์เอาต์) แยกจากโครงสร้าง HTML — งานออกแบบเว็บกลายเป็นวิชาชีพ', ref: 'https://www.w3.org/' },
          { year: '2005', title: 'Git: ระบบเวอร์ชันของ Linus Torvalds', text: 'Torvalds เขียน Git มาดูแลเคอร์เนลลินุกซ์ — กลายเป็นมาตรฐานเก็บโค้ดของโลก ร่วมงานกันได้โดยไม่เหยียบเท้ากัน', ref: 'https://git-scm.com/' },
          { year: '2009', title: 'Node.js: JavaScript ฝั่งเซิร์ฟเวอร์', text: 'Ryan Dahl เอา V8 engine มารันนอกเบราว์เซอร์ — ภาษาเดียวเขียนได้ทั้งหน้าบ้านหลังบ้าน เกิดยุค full-stack JS', ref: 'https://nodejs.org/' },
          { year: '2010', title: 'Responsive Web Design', text: 'Ethan Marcotte เสนอออกแบบเว็บให้ยืดหยุ่นตามขนาดจอ — ยุคมือถือทำให้ "รองรับทุกจอ" เป็นข้อบังคับ', ref: 'https://alistapart.com/article/responsive-web-design/' },
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
      detail: {
        identity: {
          about: 'สายงานออกแบบเครื่องแต่งกายตั้งแต่สเกตช์จนถึงเสื้อที่คนใส่ได้จริง: วาดแบบ เลือกผ้า ทำแพทเทิร์น ตัดเย็บ ทำคอลเลกชัน สร้างแบรนด์และขาย',
          solves: 'แก้ปัญหาเสื้อผ้าที่ใส่ได้จริง สวย และขายได้: จากชุดใส่เอง ชุดรับงาน จนถึงแบรนด์ที่มีลูกค้าประจำ',
          basics: ['รสนิยมการแต่งตัว + สังเกตคน', 'วาดเบื้องต้น', 'เย็บมือพื้นฐาน'],
          roles: ['Fashion Designer', 'Pattern Maker', 'Stylist', 'ช่างตัดเย็บ', 'เจ้าของแบรนด์'],
          connects: 'ศิลปะ (ลายเส้น/สี) + วัสดุศาสตร์ (ผ้า) + ธุรกิจ (ต้นทุน/ขาย) + ภาพถ่าย (lookbook)',
          fits: ['อาชีพประจำ', 'ฟรีแลนซ์/รับตัด', 'ธุรกิจแบรนด์ของตัวเอง', 'งานอดิเรกจริงจัง'],
          related: ['visual-art (ลายเส้น/สี)', 'design-visual (branding)', 'book-publishing (lookbook)']
        },
        history: [
          { year: '1858', title: 'Haute couture ถือกำเนิดที่ปารีส', text: 'Charles Worth ตั้งห้องเสื้อป้ายชื่อตัวเองเป็นคนแรก เปลี่ยนช่างตัดผ้าให้เป็น "ดีไซเนอร์" — จุดเริ่มแฟชั่นในฐานะวิชาชีพ', ref: 'https://www.vam.ac.uk/' },
          { year: '1920s', title: 'Chanel ปลดปล่อยร่างกายผู้หญิง', text: 'Coco Chanel เอาผ้าเจอร์ซีย์ (ผ้าชุดชั้นในชาย) มาตัดเป็นเดรส ใส่สบาย เคลื่อนไหวได้ — แฟชั่นเริ่มรับใช้ชีวิตจริงไม่ใช่พิธีการ', ref: 'https://www.chanel.com/' },
          { year: '1947', title: 'New Look ของ Dior', text: 'Christian Dior เปิดตัวซิลูเอตเอวคอดกระโปรงบานหลังสงคราม — คืนความหรูหราให้ปารีสและกำหนดทิศทางแฟชั่นทั้งทศวรรษ', ref: 'https://www.dior.com/' },
          { year: '1966', title: 'Ready-to-wear เกิด: Rive Gauche', text: 'Yves Saint Laurent เปิดร้านเสื้อสำเร็จรูปดีไซเนอร์เจ้าแรก — แฟชั่นชั้นสูงไหลลงมาถึงคนทั่วไป เกิดอุตสาหกรรมเสื้อผ้าสมัยใหม่', ref: 'https://www.vam.ac.uk/' },
          { year: '1967', title: 'Ralph Lauren เริ่มจากเนกไท', text: 'ขายเนกไทกว้างสวนกระแสจากลิ้นชักในตึก Empire State — สร้างอาณาจักรไลฟ์สไตล์อเมริกันจากสินค้าชิ้นเดียว', ref: 'https://www.ralphlauren.com/' },
          { year: '1970s', title: 'Punk: แฟชั่นต่อต้าน', text: 'Vivienne Westwood + Malcolm McLaren ใช้เสื้อผ้าฉีกขาด หมุดย้ำ เป็นภาษาประท้วง — พิสูจน์ว่าแฟชั่นคือจุดยืน ไม่ใช่แค่ความสวย', ref: 'https://www.vam.ac.uk/' },
          { year: '1981', title: 'ญี่ปุ่นบุกปารีส', text: 'Rei Kawakubo และ Yohji Yamamoto เอาความไม่สมมาตร สีดำ รูปทรงทำลายสัดส่วนขึ้นรันเวย์ — ขยายนิยามความงามของแฟชั่นตะวันตก', ref: 'https://www.metmuseum.org/' },
          { year: '2010s', title: 'อีคอมเมิร์ซ + แฟชั่นยั่งยืน', text: 'ขายเสื้อออนไลน์ทั่วโลกได้จากห้องนอน ขณะเดียวกันกระแส slow fashion ถามหาต้นทุนสิ่งแวดล้อม — คนทำแบรนด์เล็กได้เปรียบเรื่องความโปร่งใส', ref: 'https://www.businessoffashion.com/' }
        ],
        fundamentals: [
          { term: 'Silhouette', simple: 'เงาร่างของชุดทั้งตัว มองไกลๆ แล้วรู้ว่าทรงอะไร', deep: 'โครง A/H/X/Oversize กำหนดอารมณ์ก่อนเห็นรายละเอียด; ซิลูเอตชัด = จำแบรนด์ได้', example: 'เดรสเอวคอดกระโปรงบาน = ซิลูเอต X แบบ New Look', mistake: 'ยัดดีเทลเยอะจนมองไกลแล้วไม่รู้ว่าทรงอะไร' },
          { term: 'Proportion', simple: 'สัดส่วนบนล่างยาวสั้นของชุด', deep: 'กฎสัดส่วน (เช่น 1:2 ช่วงบนล่าง) หลอกตาให้สูง/เตี้ยได้; ผิดสัดส่วนนิดเดียวชุดดู "ไม่ใช่"', example: 'เสื้อครอป + กางเกงเอวสูง = ขายาวขึ้นด้วยสายตา', mistake: 'วาดหุ่นยาว 9 หัวแต่ตัดจริงให้คนสัดส่วนปกติโดยไม่ปรับ' },
          { term: 'Textile (ผ้า)', simple: 'ผ้าแต่ละชนิดทิ้งตัวและยืดต่างกัน', deep: 'weave/knit, GSM, grainline, การหดตัว — ผ้าผิด ชุดพังไม่ว่ารูปวาดจะสวยแค่ไหน', example: 'ผ้าชีฟองเหมาะกับระบายพลิ้ว ไม่เหมาะกับสูททรงแข็ง', mistake: 'ซื้อผ้าเพราะลายสวยโดยไม่เช็คการทิ้งตัว' },
          { term: 'Pattern making', simple: 'แปลรูปวาด 3 มิติบนตัวคนให้เป็นชิ้นผ้า 2 มิติ', deep: 'dart/seam allowance/grainline คือไวยากรณ์; แพทเทิร์นดี = ใส่ซ้ำกี่ตัวก็เหมือนเดิม', example: 'เสื้อเชิ้ต 1 ตัวแตกเป็นแพทเทิร์นหน้า หลัง แขน ปก สาบ', mistake: 'ตัดผ้าจริงเลยโดยไม่ทำ toile (ชุดลองผ้าดิบ) ก่อน' },
          { term: 'Seam & construction', simple: 'ตะเข็บและการประกอบที่ทำให้ชุดอยู่ทรง', deep: 'ชนิดตะเข็บ (plain/french/flat-felled) เลือกตามผ้าและตำแหน่ง; เย็บในเรียบ = งานแพง', example: 'ตะเข็บฝรั่งเศสซ่อนรุ่ย เหมาะกับผ้าบางโปร่ง', mistake: 'เย็บตะเข็บตรงอย่างเดียวกับทุกผ้าทุกจุด' },
          { term: 'Fit & drape', simple: 'ชุดแนบตัวหรือทิ้งตัวแค่ไหน', deep: 'fitting บนหุ่น/ตัวจริงคือขั้นตอนบังคับ ไม่ใช่ทางเลือก; จุดวัดมาตรฐาน (อก เอว สะโพก ไหล่) ต้องนิ่ง', example: 'สูทต้องลองแก้ไหล่และแขนอย่างน้อย 1 รอบก่อนส่ง', mistake: 'วัดครั้งเดียวแล้วเชื่อว่าพอ' },
          { term: 'Color & styling', simple: 'สีและการจับคู่ทั้งชุดรวมเครื่องประดับ', deep: ' undertone ผิว vs สีผ้า; color story ต่อคอลเลกชันทำให้ขายเป็นเซ็ตได้', example: 'คอลเลกชันทะเลทราย: ทราย ดินเผา มะกอก ดำ — ขายแยกชิ้นก็เข้าเซ็ต', mistake: 'แต่ละชิ้นสวยแต่รวมเป็นคอลเลกชันแล้วไม่เข้าพวก' },
          { term: 'Moodboard', simple: 'บอร์ดรวมภาพอ้างอิงก่อนลงมือ', deep: 'research ที่กันงานหลงทาง: อารมณ์ สี texture reference ยุค — กลับมาดูทุกครั้งที่ลังเล', example: 'ก่อนออกแบบคอลเลกชัน ปักภาพถ่าย ตลาด ผ้าเก่า สีที่ชอบลงบอร์ดเดียว', mistake: 'ข้ามบอร์ดแล้วออกแบบตามอารมณ์วันนั้น วันต่อมาไม่ต่อกัน' }
        ],
        roadmap: {
          L0: { name: 'EXPLORER', goals: ['รู้ว่าชอบแฟชั่นสายไหน', 'จับผ้า/ดูทรงเป็น'], exercises: ['รวม moodboard ธีมที่ชอบ 1 บอร์ด', 'ไปจับผ้าที่ร้าน สังเกตการทิ้งตัว 10 ชนิด'], project: 'Moodboard + สเกตช์ชุดในฝัน 3 ชุด', doneWhen: 'บอกได้ว่าชอบสไตล์ไหนเพราะอะไร' },
          L1: { name: 'BEGINNER', goals: ['วาด fashion figure ได้', 'เย็บมือ + จักรเบื้องต้น'], exercises: ['วาดหุ่น 9 หัว 20 ท่า', 'เย็บตะเข็บตรง/ซิกแซก/สอย', 'แก้ทรงเสื้อผ้าตัวเอง 3 ตัว'], project: 'กระโปรง/กางเกงเอวยาง 1 ตัวใส่ได้จริง', doneWhen: 'ใส่ของที่ตัดเองออกจากบ้านได้' },
          L2: { name: 'PRACTITIONER', goals: ['ทำแพทเทิร์นเองได้', 'ตัดเย็บชุดสมบูรณ์ได้'], exercises: ['แตกแพทเทิร์นเสื้อเชิ้ต 1 ตัว', 'ทำ toile ก่อนตัดจริงทุกครั้ง', 'ลองผ้า 3 ชนิดกับแบบเดียวแล้วเทียบ'], project: 'เสื้อ 1 ตัวพร้อม tech pack (แพทเทิร์น + วิธีเย็บ + ผ้า)', doneWhen: 'มีคนอื่นสั่งตัดตามแบบเราได้' },
          L3: { name: 'ADVANCED', goals: ['ออกแบบเป็นคอลเลกชัน', 'คุมต้นทุน/ราคาได้'], exercises: ['ออกแบบ mini collection 6 ชุดมี color story', 'คำนวณต้นทุนผ้า+แรง+เผื่อเสีย', 'ถ่าย lookbook เอง'], project: 'Mini collection + lookbook พร้อมขาย', doneWhen: 'ขายได้จริงอย่างน้อย 1 ชิ้น' },
          L4: { name: 'PROFESSIONAL', goals: ['รับงานลูกค้า/ผลิตเป็นล็อตได้', 'มีระบบไซซ์และ QC'], exercises: ['รับตัดชุดลูกค้าจริง 3 เจ้า', 'ทำ size chart + grading', 'คุยโรงงาน/ช่างเย็บนอก'], project: 'รับงานหรือออกดรอปขายจริง 1 รอบ', doneWhen: 'มีรายได้จากงานเสื้อผ้า' },
          L5: { name: 'EXPERT / INNOVATOR', goals: ['มีภาษาดีไซน์ของตัวเอง', 'สร้างแบรนด์ยั่งยืนได้'], exercises: ['เขียน brand book (ตัวตน/ลูกค้า/ราคา)', 'ทดลองวัสดุยั่งยืนหรือเทคนิคใหม่', 'สอน/ถ่ายทอด'], project: 'แบรนด์ของตัวเองที่มีลูกค้าประจำ', doneWhen: 'คนจำงานเราได้โดยไม่ต้องดูป้าย' }
        },
        practice: {
          methods: ['วาดทุกวันแม้วันละ 15 นาที', 'จับผ้าจริงก่อนวาดเสมอ', 'แกะชุดเก่าดูงานข้างใน'],
          novice: ['วาดหุ่นท่าเดิมซ้ำจนมือจำ', 'เย็บเส้นตรงบนผ้าเศษวันละ 10 เส้น'],
          intermediate: ['เลียนแบบชุดแบรนด์ดัง 1 ชุดเพื่อเรียนวิธีประกอบ', 'ทำแพทเทิร์นเดิมด้วยผ้า 3 แบบ'],
          advanced: ['ตั้งโจทย์จำกัด (ผ้า 2 เมตร/งบจำกัด) แล้วออกแบบ', 'ให้เพื่อนติงานแบบไม่ปกป้อง'],
          weekly: 'จ–ศ วาด/เย็บวันละ 45 นาที · ส–อา ลงมือชิ้นงาน · สิ้นสัปดาห์ถ่ายรูปเทียบกับสัปดาห์ก่อน',
          review: 'เก็บภาพทุกชิ้นพร้อมโน้ตว่าพังตรงไหน — พอร์ตความล้มเหลวสอนเร็วกว่าคำชม',
          feedback: 'ถามช่างเย็บ/คนใส่จริง ไม่ใช่แค่เพื่อนชม; เอาไปแก้แล้วถ่าย before/after',
          debug: 'ชุดพังให้ไล่ย้อน: ฟิตติ้ง → แพทเทิร์น → ผ้า → แบบวาด — อย่าโทษจักร',
          selftest: 'วาดแบบแล้วตัดให้เสร็จโดยไม่เปิดดูวิธีทำ — ถ้าจบได้ = เป็นจริง'
        },
        tools: [
          { name: 'สมุดสเกตช์ + ดินสอ', use: 'วาดแบบและ moodboard', for: 'ทุกคน (เริ่มวันที่ 1)', cost: 'ราคาประหยัด' },
          { name: 'อุปกรณ์วัด/ตัด/เย็บมือ', use: 'สายวัด ชอล์ก กรรไกรผ้า เข็มด้าย', for: 'ตั้งแต่ L1', cost: 'ราคาประหยัด' },
          { name: 'จักรเย็บผ้า', use: 'เย็บตะเข็บจริง งานเร็วและแข็งแรง', for: 'ตั้งแต่ L1 จริงจัง', cost: 'ลงทุน (มีหลายระดับราคา)' },
          { name: 'Valentina', use: 'ทำแพทเทิร์นดิจิทัล', for: 'คนทำแพทเทิร์นบ่อย', cost: 'ฟรี open source' },
          { name: 'โปรแกรม 3D/Garment (เช่น CLO)', use: 'จำลองชุดบนหุ่น 3 มิติก่อนตัดจริง', for: 'มืออาชีพ/แบรนด์', cost: 'มืออาชีพ (มีค่าใช้จ่าย)' }
        ],
        projects: [
          { name: 'เสื้อ 1 ตัวใส่เอง', level: 'L1', steps: ['เลือกแบบ', 'เลือกผ้า', 'ตัดเย็บ', 'ลองใส่+แก้'], doneWhen: 'ใส่ออกจากบ้านได้' },
          { name: 'Tech pack ชุดแรก', level: 'L2', steps: ['สเกตช์', 'แพทเทิร์น', 'ผ้าและอุปกรณ์', 'ขั้นตอนเย็บ'], doneWhen: 'คนอื่นตัดตามได้' },
          { name: 'Mini collection + แบรนด์ทดลอง', level: 'L3', steps: ['moodboard', 'ออกแบบ 6 ชุด', 'ผลิต', 'ถ่าย lookbook + ตั้งราคา'], doneWhen: 'ขายได้ชิ้นแรก' }
        ],
        careers: [
          { path: 'ดีไซเนอร์ประจำแบรนด์/โรงงาน', needs: 'L3+ + พอร์ตคอลเลกชัน', portfolio: 'สเกตช์ + งานจริง + tech pack', start: 'ฝึกงาน/ผู้ช่วยดีไซเนอร์พร้อมพอร์ต', watch: 'เงินขึ้นกับขนาดบริษัทและเมือง — เทียบประกาศรับสมัครจริงหลายที่' },
          { path: 'รับตัด/รับออกแบบเฉพาะตัว', needs: 'L2–L3 + ฟิตติ้งแม่น', portfolio: 'งานจริงบนตัวคน + รีวิวลูกค้า', start: 'รับจากคนรอบตัวแล้วขยับไปออนไลน์', watch: 'มัดจำก่อนตัด + เผื่อเวลาแก้ทรงในราคา' },
          { path: 'แบรนด์ของตัวเอง', needs: 'L4 + เลขต้นทุน', portfolio: 'คอลเลกชัน + lookbook + ยอดขาย', start: 'ดรอปเล็กขายเพื่อนก่อน', watch: 'สต็อกคือเงินจม — เริ่ม pre-order ดีกว่า' },
          { path: 'สไตลิสต์/คอนเทนต์แฟชั่น', needs: 'L2 + ตากล้อง/โซเชียล', portfolio: 'ลุคที่จัด + ยอดติดตาม', start: 'แต่งตัว/รีวิวสม่ำเสมอ', watch: 'รายได้ผันผวนตามแพลตฟอร์ม' }
        ],
        people: [
          { name: 'Coco Chanel', start: 'เด็กกำพร้าที่โตมาในคอนแวนต์ หัดเย็บผ้าจากแม่ชี', skill: 'ตัดสิ่งไม่จำเป็นออกจนเหลือแต่ความใส่สบาย', work: 'Chanel: เดรสเจอร์ซีย์ สูทกระโปรง น้ำหอม No.5', lesson: 'หรูหราที่แท้คือตัดทอน ไม่ใช่เพิ่มเติม', ref: 'https://www.chanel.com/' },
          { name: 'Christian Dior', start: 'อยากเป็นสถาปนิกแต่บ้านล้มละลาย หันมาขายสเกตช์ชุด', skill: 'เข้าใจสรีระและวาดฝันให้เป็นทรงผ้า', work: 'New Look 1947 + บ้าน Dior', lesson: 'วิกฤตคือช่องว่างให้คนกล้าออกแบบใหม่', ref: 'https://www.dior.com/' },
          { name: 'Ralph Lauren', start: 'เซลส์ขายเนกไทที่เชื่อว่าคนอยากได้ชีวิตแบบหนังเก่า', skill: 'ขายไลฟ์สไตล์ทั้งชุด ไม่ได้ขายแค่เสื้อ', work: 'Polo Ralph Lauren อาณาจักรไลฟ์สไตล์อเมริกัน', lesson: 'เริ่มจากสินค้าชิ้นเดียวที่เชื่อสุดใจก็พอ', ref: 'https://www.ralphlauren.com/' },
          { name: 'Jim Thompson', start: 'อดีตสายลับอเมริกันที่หลงใหลผ้าไหมไทย', skill: 'เห็นคุณค่าของหัตถกรรมที่คนท้องถิ่นมองข้าม', work: 'ปลุกผ้าไหมไทยสู่ตลาดโลก + บ้านจิม ทอมป์สัน', lesson: 'ของดีใกล้ตัวที่เล่าเรื่องเป็นคือทอง', ref: 'https://www.jimthompson.com/' }
        ],
        resources: [
          { label: 'V&A Museum — คลังแฟชั่นและสิ่งทอ', url: 'https://www.vam.ac.uk/' },
          { label: 'The Met — Costume Institute', url: 'https://www.metmuseum.org/' },
          { label: 'Business of Fashion — ข่าวอุตสาหกรรม', url: 'https://www.businessoffashion.com/' },
          { label: 'Seamwork — แพทเทิร์นและบทเรียนเย็บผ้า', url: 'https://www.seamwork.com/' }
        ]
      }
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
