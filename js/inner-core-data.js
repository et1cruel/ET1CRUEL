/* ===== INNER CORE DATA — seed + คำถาม + เทมเพลต (content ล้วน) =====
 * กฎเหล็ก: seed ทุกตัวคือ SIGNAL (สัญญาณที่พบ) — ห้ามมีคะแนน ระดับ หรือเป้าหมายของผู้ใช้ */
(function () {
  'use strict';

  var INTERESTS = [
    // CREATE
    { id: 'music-prod', seedStatus: 'SIGNAL', name: 'Music Production', th: 'ทำเพลง โปรดักชัน', group: 'CREATE', evidence: 'วางแนวคิดโปรเจกต์เพลง himoriyacore ออกแบบคอร์สผลิตเพลง', unknown: 'ยังไม่รู้ว่าอยากทุ่มให้สร้างเพลง แต่งบีทขาย หรือสอนมากที่สุด', question: 'ถ้าต้องเลือกสร้างผลงานดนตรีหนึ่งอย่างในเดือนนี้ อะไรคือสิ่งที่อยากทำจริงมากที่สุด?' },
    { id: 'beatmaking', seedStatus: 'SIGNAL', name: 'Beatmaking', th: 'บีท ทำบีท', group: 'CREATE', evidence: 'ทำบีท วางแผนขายบีทและ Sample Pack', unknown: 'ยังไม่รู้ว่าอยากทำบีทแนวไหนเป็นหลัก', question: 'บีทแบบไหนที่ทำแล้วลืมเวลา?' },
    { id: 'mix-master', seedStatus: 'SIGNAL', name: 'Mixing and Mastering', th: 'มิกซ์ มาสเตอร์', group: 'CREATE', evidence: 'ออกแบบคอร์ส Mix/Mastering มีห้อง Teacher ในเว็บ', unknown: 'ยังไม่รู้ว่าชอบมิกซ์ให้คนอื่นหรือมิกซ์งานตัวเองมากกว่า', question: 'งานมิกซ์ชิ้นไหนที่ภูมิใจที่สุดเพราะอะไร?' },
    { id: 'sound-design', seedStatus: 'SIGNAL', name: 'Sound Design', th: 'ออกแบบเสียง', group: 'CREATE', evidence: 'สนใจเสียงบรรยากาศ ดิจิทัล และการทดลองเสียง', unknown: 'ยังไม่รู้ว่าอยากทำเสียงให้หนัง เกม หรือเพลง', question: 'เสียงแบบไหนที่ได้ยินแล้วอยากรู้ว่าทำมาอย่างไร?' },
    { id: 'artist-dev', seedStatus: 'SIGNAL', name: 'Music Artist Development', th: 'ศิลปิน', group: 'CREATE', evidence: 'สร้างตัวตนศิลปิน et1cruel ปั้นบรรยากาศเฉพาะตัว', unknown: 'ยังไม่รู้ว่าอยากเป็นศิลปินเบื้องหน้าหรือเบื้องหลัง', question: 'ถ้าไม่มีใครเห็นหน้าคุณ ยังอยากปล่อยเพลงอยู่ไหม?' },
    { id: 'content', seedStatus: 'SIGNAL', name: 'Content Creation', th: 'คอนเทนต์', group: 'CREATE', evidence: 'ทำวิดีโอ คอนเทนต์หลายรูปแบบในเว็บ', unknown: 'ยังไม่รู้ว่าคอนเทนต์แบบไหนที่ทำแล้วไม่หมดไฟ', question: 'คอนเทนต์ชิ้นไหนที่ทำแล้วอยากทำอีก?' },
    // BUILD
    { id: 'sw-eng', seedStatus: 'SIGNAL', name: 'Software Engineering', th: 'เขียนโปรแกรม ซอฟต์แวร์', group: 'BUILD', evidence: 'สร้าง Life OS/Agency ด้วยโค้ดจริง ชอบคำอธิบายทำตามได้', unknown: 'ยังไม่รู้ว่าชอบ frontend หรือ backend มากกว่า', question: 'ตอนเขียนโค้ด ส่วนไหนที่สนุกจนลืมเวลา?' },
    { id: 'fullstack', seedStatus: 'SIGNAL', name: 'Full-Stack Development', th: 'ฟูลสแตก', group: 'BUILD', evidence: 'ทำเว็บครบทั้งหน้าบ้านหลังบ้านในโปรเจกต์ตัวเอง', unknown: 'ยังไม่รู้ว่าอยากลึกฝั่งไหนเป็นพิเศษ', question: 'ถ้าต้องเลือกเก่งด้านเดียวในปีนี้ จะเลือกฝั่งไหน?' },
    { id: 'backend', seedStatus: 'SIGNAL', name: 'Backend Development', th: 'หลังบ้าน เซิร์ฟเวอร์', group: 'BUILD', evidence: 'สนใจ API Database Auth และสถาปัตยกรรม', unknown: 'ยังไม่รู้ว่าชอบออกแบบระบบหรือลงมือเขียนมากกว่า', question: 'งาน backend แบบไหนที่ทำแล้วรู้สึกมีพลัง?' },
    { id: 'ai-dev', seedStatus: 'SIGNAL', name: 'Artificial Intelligence', th: 'เอไอ ปัญญาประดิษฐ์', group: 'BUILD', evidence: 'พูดถึง AI Chatbot Agents Neural Networks และเอา AI ใส่โปรเจกต์ตัวเอง', unknown: 'ยังไม่รู้ว่าชอบฝึกโมเดลเองหรือสร้างแอปจากโมเดลที่มีอยู่', question: 'ระหว่างสร้างโมเดลเอง สร้าง AI App และออกแบบ AI Agents อยากลงมือเรื่องไหนสุดตอนนี้?' },
    { id: 'ml', seedStatus: 'SIGNAL', name: 'Machine Learning', th: 'แมชชีนเลิร์นนิง', group: 'BUILD', evidence: 'สนใจ ML อยู่ในแผนเรียนรู้', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'อะไรคือสิ่งแรกที่อยากให้ ML ทำให้ได้?' },
    { id: 'nn', seedStatus: 'SIGNAL', name: 'Neural Networks', th: 'โครงข่ายประสาท', group: 'BUILD', evidence: 'สนใจ Neural Core และโครงข่ายประสาท', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'อยากเข้าใจ NN ระดับใช้เป็น หรือระดับสร้างเอง?' },
    { id: 'ai-agents', seedStatus: 'SIGNAL', name: 'AI Agents', th: 'เอเจนต์', group: 'BUILD', evidence: 'สร้าง AI Agency แบบ multi-agent ในเว็บจริง', unknown: 'ยังไม่รู้ว่าชอบออกแบบ agent หรือ workflow รอบตัวมัน', question: 'agent ตัวไหนที่อยากสร้างให้ตัวเองใช้ทุกวัน?' },
    { id: 'robotics', seedStatus: 'SIGNAL', name: 'Robotics', th: 'หุ่นยนต์', group: 'BUILD', evidence: 'แสดงความสนใจเส้นทาง Robotics/Automation เรียน Python/C++', unknown: 'ยังไม่รู้ว่าชอบอิเล็กทรอนิกส์ ควบคุม หรือซอฟต์แวร์หุ่นยนต์ที่สุด', question: 'ถ้าวันนี้ได้สร้างหุ่นยนต์หนึ่งชิ้น อยากเริ่มจากส่วนไหน?' },
    { id: 'automation', seedStatus: 'SIGNAL', name: 'Automation Engineering', th: 'อัตโนมัติ', group: 'BUILD', evidence: 'ทำ workflow อัตโนมัติใน Agency', unknown: 'ยังไม่รู้ว่าอยากทำ automation ให้ตัวเองหรือขายเป็นบริการ', question: 'งานน่าเบื่ออะไรที่อยากให้ระบบทำให้แทน?' },
    // EXPLORE
    { id: 'motion', seedStatus: 'SIGNAL', name: 'Motion Graphics', th: 'โมชัน', group: 'EXPLORE', evidence: 'สนใจ motion สำหรับงานเพลงและคอนเทนต์', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'โมชันแบบไหนที่เห็นแล้วอยากทำได้บ้าง?' },
    { id: 'video', seedStatus: 'SIGNAL', name: 'Video Production', th: 'วิดีโอ', group: 'EXPLORE', evidence: 'มีห้อง Genvideo และงานวิดีโอในเว็บ', unknown: 'ยังไม่รู้ว่าชอบถ่าย ตัด หรือกำกับ', question: 'ส่วนไหนของงานวิดีโอที่เวลาผ่านไปเร็วสุด?' },
    { id: 'cinematic', seedStatus: 'SIGNAL', name: 'Cinematic Storytelling', th: 'หนัง ภาพยนตร์', group: 'EXPLORE', evidence: 'สนใจเล่าเรื่องแบบภาพยนตร์', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'หนังเรื่องไหนที่ดูแล้วอยากเล่าแบบนั้นบ้าง?' },
    { id: 'photo', seedStatus: 'SIGNAL', name: 'Photography', th: 'ถ่ายภาพ', group: 'EXPLORE', evidence: 'สนใจถ่ายภาพและ GenPic', unknown: 'ยังไม่รู้ว่าชอบถ่ายคน วิว หรือสตรีท', question: 'รูปแบบไหนที่ถ่ายแล้วภูมิใจที่สุด?' },
    { id: 'webdesign', seedStatus: 'SIGNAL', name: 'Web Design', th: 'ออกแบบเว็บ', group: 'EXPLORE', evidence: 'ออกแบบเว็บ Life OS เองทั้งหมด', unknown: 'ยังไม่รู้ว่าชอบออกแบบหรือเขียนโค้ดตามแบบมากกว่า', question: 'ตอนทำเว็บ ส่วนออกแบบกับส่วนโค้ดชอบอะไรมากกว่า?' },
    { id: '3d', seedStatus: 'SIGNAL', name: 'Interactive 3D', th: '3มิติ', group: 'EXPLORE', evidence: 'สนใจ 3D เกม RPG เชื่อมชีวิตประจำวัน', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'โลก 3D แบบไหนที่อยากเดินเข้าไปอยู่?' },
    { id: 'gamedev', seedStatus: 'SIGNAL', name: 'Game Development', th: 'เกม', group: 'EXPLORE', evidence: 'มีแนวคิดเกม 3D และระบบ RPG ในเว็บ', unknown: 'ยังไม่รู้ว่าชอบเล่น สร้าง หรือออกแบบระบบ', question: 'ถ้าทำเกมของตัวเองได้ 1 เกม จะเป็นเกมแบบไหน?' },
    { id: 'travel', seedStatus: 'SIGNAL', name: 'Travel and Life Documentation', th: 'ท่องเที่ยว บันทึก', group: 'EXPLORE', evidence: 'บันทึกเรื่องราวตัวเองและการเดินทางในเว็บ', unknown: 'ยังไม่รู้ว่าชอบเที่ยวหรือชอบบันทึกมากกว่ากัน', question: 'ทริปไหนที่จำได้แม่นที่สุดเพราะอะไร?' },
    // SHARE
    { id: 'teaching', seedStatus: 'SIGNAL', name: 'Teaching and Education', th: 'สอน การศึกษา', group: 'SHARE', evidence: 'วางแผน Thai Beat Academy และคอร์สหลายตัว', unknown: 'ยังไม่รู้ว่าชอบสอนจริงหรือแค่ชอบทำหลักสูตร — ต้องสำรวจ', question: 'ตอนอธิบายอะไรให้คนอื่นแล้วเขาร้องอ๋อ รู้สึกอย่างไร?' },
    { id: 'creative-biz', seedStatus: 'SIGNAL', name: 'Creative Business', th: 'ธุรกิจ', group: 'SHARE', evidence: 'วางแผนขายบีท คอร์ส สินค้าดิจิทัล', unknown: 'ยังไม่รู้ว่าอยากขายของเองหรือรับจ้างทำ', question: 'ถ้าต้องมีรายได้ทางเดียวจากงานสร้างสรรค์ จะเลือกทางไหน?' },
    { id: 'community', seedStatus: 'SIGNAL', name: 'Community Building', th: 'ชุมชน', group: 'SHARE', evidence: 'อยากสร้างชุมชนโปรดิวเซอร์และนักเรียน', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'ชุมชนแบบไหนที่อยากเป็นสมาชิกเอง?' },
    // LIVE
    { id: 'tattoo', seedStatus: 'SIGNAL', name: 'Tattoo Art', th: 'สัก', group: 'LIVE', evidence: 'สนใจศิลปะการสักและออกแบบรอยสัก', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'ลายแบบไหนที่เห็นแล้วอยากอยู่บนผิว?' },
    { id: 'clothing', seedStatus: 'SIGNAL', name: 'Clothing and Brand Design', th: 'เสื้อผ้า แบรนด์', group: 'LIVE', evidence: 'สนใจเสื้อผ้าและแบรนด์', unknown: 'ยังไม่มีหลักฐานการลงมือ — สถานะรอสำรวจ', question: 'เสื้อผ้าแบบไหนที่ใส่แล้วรู้สึกเป็นตัวเองที่สุด?' },
    { id: 'pkm', seedStatus: 'SIGNAL', name: 'Personal Knowledge Management', th: 'จดโน้ต จัดการความรู้', group: 'LIVE', evidence: 'สร้าง Life OS เก็บความรู้ตัวเองเป็นระบบ', unknown: 'ยังไม่รู้ว่าชอบเก็บหรือชอบค้นมากกว่ากัน', question: 'โน้ตแบบไหนที่กลับมาอ่านแล้วช่วยชีวิต?' },
    { id: 'finance', seedStatus: 'SIGNAL', name: 'Finance and Investing', th: 'การเงิน ลงทุน หุ้น', group: 'LIVE', evidence: 'ติดตามหุ้น US/คริปโต มีห้องหุ้นในเว็บ', unknown: 'ยังไม่รู้ว่าชอบวิเคราะห์หรือชอบความตื่นเต้น', question: 'ถ้าตลาดปิด 1 ปี จะยังติดตามเรื่องเงินอยู่ไหม?' }
  ];

  var VALUES = [
    { id: 'freedom', seedStatus: 'SIGNAL', name: 'Creative Freedom', desc: 'ได้เลือกงานและวิธีทำเอง' },
    { id: 'independence', seedStatus: 'SIGNAL', name: 'Independence', desc: 'พึ่งตัวเองได้' },
    { id: 'stability', seedStatus: 'SIGNAL', name: 'Financial Stability', desc: 'รายได้มั่นคงพอใช้ชีวิต' },
    { id: 'learning', seedStatus: 'SIGNAL', name: 'Learning', desc: 'ได้เรียนรู้สิ่งใหม่เสมอ' },
    { id: 'mastery', seedStatus: 'SIGNAL', name: 'Mastery', desc: 'เก่งจริงในสิ่งที่ทำ' },
    { id: 'exploration', seedStatus: 'SIGNAL', name: 'Exploration', desc: 'ได้สำรวจสิ่งที่ไม่รู้' },
    { id: 'authenticity', seedStatus: 'SIGNAL', name: 'Artistic Authenticity', desc: 'งานซื่อสัตย์กับตัวเอง' },
    { id: 'curiosity', seedStatus: 'SIGNAL', name: 'Technological Curiosity', desc: 'ได้เล่นของใหม่' },
    { id: 'meaning', seedStatus: 'SIGNAL', name: 'Meaningful Work', desc: 'งานมีความหมาย' },
    { id: 'expression', seedStatus: 'SIGNAL', name: 'Self-Expression', desc: 'ได้เป็นตัวเองผ่านงาน' },
    { id: 'flexibility', seedStatus: 'SIGNAL', name: 'Flexibility', desc: 'ยืดหยุ่นเวลาและสถานที่' },
    { id: 'connection', seedStatus: 'SIGNAL', name: 'Connection', desc: 'มีคนร่วมทาง' },
    { id: 'contribution', seedStatus: 'SIGNAL', name: 'Contribution', desc: 'ได้ให้คนอื่น' },
    { id: 'growth', seedStatus: 'SIGNAL', name: 'Personal Growth', desc: 'เติบโตขึ้นทุกปี' },
    { id: 'time', seedStatus: 'SIGNAL', name: 'Time Freedom', desc: 'มีเวลาของตัวเอง' }
  ];

  var QUESTIONS = {
    adaptive: [
      { when: 'no-love', text: 'ถ้ามีเวลาว่าง 1 ชม.โดยไม่มีใครเห็น คุณจะหยิบอะไรขึ้นมาทำ?' },
      { when: 'many-interests', text: 'ถ้าต้องตัดความสนใจออกครึ่งหนึ่ง จะเก็บอะไรไว้?' },
      { when: 'stuck-choice', text: 'ระหว่างสิ่งที่รักกับสิ่งที่ได้เงิน ตอนนี้อะไรกดดันกว่ากัน?' },
      { when: 'no-evidence', text: 'เรื่องไหนที่คุณพูดถึงบ่อยแต่ยังไม่เคยลงมือเลย?' },
      { when: 'conflict', text: 'มีเรื่องไหนที่บอกว่าสำคัญแต่แทบไม่มีเวลาทำบ้าง?' },
      { when: 'direction', text: 'ถ้าอีก 1 ปีต้องเก่งขึ้น 1 อย่าง จะเลือกอะไร?' }
    ],
    daily: [
      'วันนี้สนุกกับการทำอะไรที่สุด?',
      'อยากกลับไปทำอะไรอีก?',
      'วันนี้มีอะไรที่ทำให้หมดพลัง?',
      'ได้เรียนรู้อะไรเกี่ยวกับตัวเอง?',
      'มีอะไรอยากทดลองในวันต่อไป?'
    ],
    weekly: [
      'สัปดาห์นี้ใช้เวลากับเรื่องอะไรมากที่สุด?',
      'เรื่องที่ทำ กับเรื่องที่บอกว่าสำคัญ ตรงกันหรือไม่?',
      'มีเรื่องไหนอยากทำต่อมากที่สุด?',
      'มีเรื่องไหนควรลดความสำคัญชั่วคราว?',
      'สัปดาห์หน้าอยากสร้างหรือเรียนรู้อะไรให้เห็นเป็นรูปธรรม?'
    ],
    monthly: [
      'ความสนใจใดเพิ่มขึ้น?',
      'ความสนใจใดลดลง?',
      'ทักษะใดมีหลักฐานความก้าวหน้าจริง?',
      'โปรเจกต์ใดสร้างความหมายให้ชีวิต?',
      'กำลังเดินไปในทิศทางที่ต้องการหรือไม่?',
      'มีเป้าหมายใดควรเปลี่ยน เพราะข้อมูลใหม่บอกว่าไม่เหมาะ?'
    ],
    desire: [
      'ถ้าไม่มีใครเห็นผลงาน คุณยังอยากสร้างสิ่งนี้อยู่ไหม?',
      'ถ้าสิ่งนี้ไม่มีรายได้ในช่วงแรก คุณยังอยากเรียนรู้มันหรือไม่?',
      'คุณชอบกระบวนการทำสิ่งนี้ หรือชอบภาพของการเป็นคนที่ทำสิ่งนี้ได้?',
      'ถ้าต้องทำซ้ำและเจอปัญหาเป็นเวลาหกเดือน คุณยังอยากพยายามต่อไหม?',
      'คุณอยากทำสิ่งนี้จริงๆ หรือรู้สึกว่าควรทำเพราะคนอื่นทำสำเร็จ?',
      'ถ้าต้องตัดกิจกรรมออกไปหนึ่งอย่าง คุณอยากรักษากิจกรรมไหนไว้มากที่สุด?',
      'เรื่องใดที่คุณกลับมาสนใจซ้ำ แม้จะหยุดไปช่วงหนึ่ง?',
      'ผลงานแบบไหนที่ทำให้คุณรู้สึกว่าการใช้เวลาของตัวเองคุ้มค่า?'
    ]
  };

  var QUEST_TPL = { title: '', hypothesis: '', action: '', timeframe: '7d', expected: '', evidence: '', status: 'planned' };

  var PROJECT_SEEDS = [
    { name: 'ET1CRUEL Website / Life OS', url: 'index.html' },
    { name: 'AI Agency', url: 'agency.html' },
    { name: 'ห้องเพลง + Teacher', url: 'music.html' },
    { name: 'Genvideo', url: 'video.html' },
    { name: 'UPSKILL', url: 'upskill.html' },
    { name: 'หุ้นรายวัน', url: 'stocks-daily.html' },
    { name: 'CREATE AI', url: 'create-ai.html' },
    { name: 'Pillars', url: 'pillars.html' }
  ];

  var SKILL_SEEDS = [
    { name: 'Beatmaking', upskill: 'music-audio' },
    { name: 'Mixing', upskill: 'music-audio' },
    { name: 'JavaScript', upskill: 'web-app' },
    { name: 'Python', upskill: 'coding-robotics' },
    { name: 'Video Editing', upskill: 'video-motion' }
  ];

  window.ET1INNER_DATA = {
    interests: INTERESTS, values: VALUES, questions: QUESTIONS,
    questTemplate: QUEST_TPL, projectSeeds: PROJECT_SEEDS, skillSeeds: SKILL_SEEDS
  };
})();
