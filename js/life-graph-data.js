/* ET1CRUEL LIFE GRAPH V2 — canonical taxonomies + seeded life events.
 * กฎของไฟล์นี้: ทุก record ต้องมีที่มา (sourceReference) · ห้ามแต่งเหตุการณ์/ปีขึ้นเอง
 * ปีที่ไม่มีหลักฐานให้เป็น null + datePrecision:'unknown' ไม่ใช่เดา
 * seed ทุกตัว selfAssessmentScore = null เสมอ (คะแนนชีวิตเป็นของผู้ใช้เท่านั้น) */
(function () {
  'use strict';

  function mk(o) {
    var r = {
      id: '', title: '', description: '',
      category: 'Personal', chapterId: 'childhood',
      type: 'milestone', status: 'user-reported', importance: 2,
      startDate: null, endDate: null,
      startYearCE: null, endYearCE: null,
      startMonthCE: null, endMonthCE: null,
      datePrecision: 'unknown', dateStatus: 'unknown', dateSource: 'user_reported',
      sourceReference: null, conflictNote: null,
      narrativeLevel: null, selfAssessmentScore: null,
      isCurrent: false, isFuture: false, isAnchor: false,
      relatedProjectIds: [], relatedSkills: [],
      whatChanged: '', reflection: '',
      tags: [], notes: '', userEdited: false,
      createdAt: null, updatedAt: null
    };
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = o[k];
    return r;
  }

  var categories = ['Personal', 'Football', 'Music', 'Education', 'Work', 'Finance', 'Technology', 'Coding', 'AI', 'Robotics', 'Content Creation', 'Business', 'Personal Growth', 'Future Goals'];

  var categoryNames = {
    Personal: 'ส่วนตัว', Football: 'ฟุตบอล', Music: 'ดนตรี', Education: 'การศึกษา', Work: 'งาน',
    Finance: 'การเงิน', Technology: 'เทคโนโลยี', Coding: 'โค้ด/เขียนโปรแกรม', AI: 'AI', Robotics: 'หุ่นยนต์',
    'Content Creation': 'งานคอนเทนต์', Business: 'ธุรกิจ', 'Personal Growth': 'การเติบโตส่วนบุคคล', 'Future Goals': 'เป้าหมายอนาคต'
  };

  var chapters = [
    { id: 'childhood', title: 'Childhood', titleTh: 'จุดเริ่มต้น / วัยเด็ก', category: 'Personal', description: 'ช่วงต้นชีวิตในชลบุรี/ศรีราชา และการย้ายมาบางใหญ่ นนทบุรี — ปี 2004–2017 เป็นช่วงวัยเด็ก ไม่ใช่ช่องว่างข้อมูล' },
    { id: 'football', title: 'Football', titleTh: 'ฟุตบอล', category: 'Football', description: 'ช่วงที่เล่นฟุตบอล (เล่นกับพ่อ) ก่อนเลิกตอน ม.2 เพื่อไปทำเพลง' },
    { id: 'music-origin', title: 'Music Origin', titleTh: 'จุดกำเนิดดนตรี', category: 'Music', description: 'จุดเปลี่ยนจากฟุตบอลสู่ดนตรี การตั้งวงกับเพื่อน และการปล่อยเพลงแรกของวง' },
    { id: 'learning-struggle', title: 'Learning Through Struggle', titleTh: 'เรียนรู้ผ่านข้อจำกัด', category: 'Personal Growth', description: 'ช่วงวัยรุ่นที่มีข้อจำกัดด้านเงินและความรู้ และการเรียนรู้ผ่านการลงมือทำ' },
    { id: 'education', title: 'Education', titleTh: 'การศึกษา', category: 'Education', description: 'เส้นทางการศึกษาหลายทางที่ทดลองและหยุดพัก — แต่ละเส้นทางมีสถานะของตัวเอง' },
    { id: 'work', title: 'Work Experience', titleTh: 'ประสบการณ์ทำงาน', category: 'Work', description: 'งานที่เคยทำเพื่อเก็บเงินและสร้างรายได้ — ช่วงเวลาส่วนใหญ่ยังไม่ยืนยัน' },
    { id: 'music-production', title: 'Music Production', titleTh: 'การผลิตดนตรี', category: 'Music', description: 'การฝึกทำบีท แบรนด์ prod.et1cruel การขายผลงาน และการสอนทำเพลง' },
    { id: 'coding-software', title: 'Coding & Software', titleTh: 'โค้ดและซอฟต์แวร์', category: 'Coding', description: 'การเขียนโปรแกรม เครื่องมือพัฒนา และการสร้างเว็บ/ระบบของตัวเอง' },
    { id: 'ai-automation', title: 'AI & Automation', titleTh: 'AI และระบบอัตโนมัติ', category: 'AI', description: 'การทดลองสร้าง AI Agent และระบบอัตโนมัติ — สถานะคือการทดลอง ไม่ใช่ทักษะที่ยืนยันแล้ว' },
    { id: 'robotics', title: 'Robotics', titleTh: 'หุ่นยนต์', category: 'Robotics', description: 'ความสนใจและเป้าหมายระยะยาวด้านวิศวกรรมหุ่นยนต์และระบบอัตโนมัติ' },
    { id: 'current-life', title: 'Current Life', titleTh: 'ชีวิตปัจจุบัน', category: 'Technology', description: 'ช่วงปัจจุบัน ปี 2026 — งานสร้างสรรค์ เทคโนโลยี การเงิน และการบันทึกชีวิตไปพร้อมกัน' },
    { id: 'future-goals', title: 'Future Goals', titleTh: 'เป้าหมายอนาคต', category: 'Future Goals', description: 'เป้าหมายที่ยังไม่เกิดขึ้น — แสดงด้วยเส้นประและวงกลมโปร่ง ยังไม่กำหนดปีจนกว่าเจ้าของจะเลือกเอง' }
  ];

  var seeds = [

    /* ---------- ช่วงต้นชีวิต (2004–2017) ---------- */
    mk({
      id: 'birth', title: 'เกิด — 17 ธันวาคม 2004',
      description: 'เกิดเมื่อวันที่ 17 ธันวาคม 2004 เวลา 08:58 น. ในพื้นที่ชลบุรี/ศรีราชา ตามข้อมูลเดิม ใช้เป็นจุดอ้างอิงอายุ ไม่ใช่เหตุการณ์ที่ให้คะแนนชีวิต',
      category: 'Personal', chapterId: 'childhood', status: 'user-reported', importance: 1, isAnchor: true,
      startDate: '2004-12-17', startYearCE: 2004, startMonthCE: 12, endMonthCE: null,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §1, §2 (ตารางประวัติส่วนตัว)',
      tags: ['จุดเริ่มต้น', 'วันเกิด'], notes: 'เวลาเกิด 08:58 น. ตามข้อมูลเดิม'
    }),
    mk({
      id: 'childhood-chonburi', title: 'วัยเด็ก — เติบโตที่ชลบุรี/ศรีราชา',
      description: 'ช่วงต้นชีวิตมีความเชื่อมโยงกับพื้นที่จังหวัดชลบุรีและศรีราชา ปีและรายละเอียดของแต่ละเหตุการณ์ในวัยเด็กยังไม่ครบ',
      category: 'Personal', chapterId: 'childhood', importance: 1,
      sourceReference: 'timeline.html §1 ("เติบโตช่วงแรกในจังหวัดชลบุรี"), §2',
      tags: ['ชลบุรี', 'ศรีราชา'], notes: 'ปีไม่ระบุ — ไม่สร้างปีสมมติ'
    }),
    mk({
      id: 'move-bangyai', title: 'ย้ายมาอยู่บางใหญ่ นนทบุรี (ตั้งแต่ ป.1)',
      description: 'มีข้อมูลว่าเคยย้ายมาอยู่บางใหญ่ จังหวัดนนทบุรี ตั้งแต่ชั้นประถมศึกษาปีที่ 1 ไม่กำหนดวันหรือปีที่แน่นอน',
      category: 'Personal', chapterId: 'childhood', importance: 2,
      datePrecision: 'school_period', dateStatus: 'needs_confirmation',
      sourceReference: 'timeline.html §1, §2',
      tags: ['บางใหญ่', 'นนทบุรี', 'ป.1'], notes: 'ปีคำนวณจากช่วงอายุและเส้นทางการเรียนได้ แต่ยังต้องยืนยัน'
    }),

    /* ---------- ฟุตบอล ---------- */
    mk({
      id: 'football-age11', title: 'เล่นฟุตบอล (เล่นกับพ่อ)',
      description: 'เคยเล่นฟุตบอลช่วงวัยเด็กถึงวัยรุ่น และเลิกเล่นตอน ม.2 เพื่อไปทำเพลง จึงเป็นจุดเปลี่ยนของเส้นทางชีวิต',
      category: 'Football', chapterId: 'football', status: 'completed', importance: 2,
      startYearCE: 2015, datePrecision: 'exact_year', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'brief PART 2B (Master Prompt V2) + timeline.html §8 (เล่นฟุตบอลกับคุณพ่อ)',
      tags: ['ฟุตบอล', 'เล่นกับพ่อ'], relatedProjectIds: ['music-start'],
      notes: 'เจ้าของยืนยันปี 18 ต.ค. 2026 ว่าคือ 2015 · ปีที่เลิกเล่นผูกกับ ม.2 (ดู music-start) จึงยังไม่ระบุ'
    }),

    /* ---------- จุดกำเนิดดนตรี ---------- */
    mk({
      id: 'music-start', title: 'เริ่มทำเพลง หลังเลิกเล่นฟุตบอลตอน ม.2',
      description: 'เริ่มทำเพลงหลังจากเลิกเล่นฟุตบอลตอนชั้นมัธยมศึกษาปีที่ 2 — จุดเปลี่ยนสำคัญของเส้นทางชีวิต ต่อมาช่วงนี้มีการตั้งวงดนตรีแนว shoegaze กับเพื่อน มีข้อมูลว่าปล่อยเพลงแรกของวงและเล่นงานมากกว่า 10 งาน',
      category: 'Music', chapterId: 'music-origin', status: 'in-progress', importance: 3,
      startYearCE: 2018, endYearCE: 2021,
      datePrecision: 'estimated_range', dateStatus: 'needs_confirmation', dateSource: 'user_reported',
      sourceReference: 'brief PART 2B (ม.2) + timeline.html §1, §2 ("ปี 2021 ตอน ม.4 ตั้งวง shoegaze ปล่อยเพลงแรก 1 หมื่นวิว เล่นงานกว่า 10 งาน")',
      conflictNote: 'สองเวอร์ชันยังไม่ตรงกัน: (1) เริ่มทำเพลงหลังเลิกฟุตบอลตอน ม.2 — ประมาณปีการศึกษา 2561 / 2018 (2) "ปี 2021 ตอน ม.4 ตั้งวง" — ถ้าเกิด 17 ธ.ค. 2004 ปี 2021 ควรเป็น ม.5 ไม่ใช่ ม.4 ข้อมูลคลาดกันประมาณ 1 ปี จึงยังไม่เลือกปีเดียว ต้องยืนยัน',
      tags: ['TURNING POINT', 'ม.2', 'shoegaze', 'ต้องยืนยันปี'],
      relatedProjectIds: ['band-breakup-post-m6'],
      notes: 'ใช้เป็น estimated_range 2018–2021 ตามที่เจ้าของเลือกให้รวมเป็นเหตุการณ์เดียว'
    }),
    mk({
      id: 'band-breakup-post-m6', title: 'วงแตกแยกย้ายกันไป หลังจบ ม.6',
      description: 'ข้อมูลเดิมระบุว่าหลังจบ ม.6 วงที่ตั้งไว้กับเพื่อนก็แยกย้ายกันไป จากนั้นเข้าศึกษาต่อในมหาวิทยาลัยแล้วออก',
      category: 'Music', chapterId: 'music-origin', status: 'completed', importance: 2,
      datePrecision: 'school_period', dateStatus: 'needs_confirmation',
      sourceReference: 'timeline.html §1 ("จบ ม.6 แล้ววงก็แตกแยกย้ายกัน จากนั้นเข้ามหาลัยแล้วก็ออก")',
      tags: ['วงดนตรี', 'หลังจบ ม.6'], relatedProjectIds: ['music-start'],
      notes: 'ไม่มีวันที่ยืนยัน — ไม่ผูกกับปีที่เดาเอง'
    }),

    /* ---------- เรียนรู้ผ่านข้อจำกัด ---------- */
    mk({
      id: 'teen-struggle', title: 'วัยรุ่น — ไม่มีเงินและไม่มีความรู้เพียงพอ',
      description: 'ช่วงวัยรุ่นที่มีข้อจำกัดด้านเงินและความรู้ ผ่านช่วงนั้นด้วยการสู้ พยายาม ศึกษา ทดลอง แก้ไข และเรียนรู้',
      category: 'Personal Growth', chapterId: 'learning-struggle', importance: 2,
      sourceReference: 'brief PART 2C (Master Prompt V2)',
      tags: ['วัยรุ่น', 'การเรียนรู้'], notes: 'ปีเริ่มต้นและปีสิ้นสุดยังไม่มีข้อมูล และไม่ยืนยันว่าเป็นปีเดียวกับการเริ่มทำเพลง'
    }),

    /* ---------- ประสบการณ์ทำงาน ---------- */
    mk({
      id: 'work-kfc-tops-2022', title: 'หางานทำ KFC / TOPS เก็บเงินซื้ออุปกรณ์ทำเพลง',
      description: 'ทำงานร้านอาหาร KFC และร้านค้าปลีก Tops เพื่อเก็บเงินซื้ออุปกรณ์ทำเพลง',
      category: 'Work', chapterId: 'work', status: 'completed', importance: 2,
      startYearCE: 2022, datePrecision: 'exact_year', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §1, §2 (งานและประสบการณ์ที่เคยมี)',
      tags: ['KFC', 'Tops', 'เก็บเงิน'], notes: 'วันเริ่ม–วันสิ้นสุดของงานยังไม่มีข้อมูล'
    }),
    mk({
      id: 'work-milk-sales', title: 'ขายนมเปรี้ยว',
      description: 'มีประสบการณ์งานขายผลิตภัณฑ์นมหมัก (นมเปรี้ยว)',
      category: 'Work', chapterId: 'work', status: 'completed', importance: 1,
      sourceReference: 'timeline.html §2 + brief PART 2E',
      tags: ['ขายนมเปรี้ยว'], notes: 'ช่วงเวลายังไม่ระบุ'
    }),
    mk({
      id: 'work-busking', title: 'เล่นดนตรีเปิดหมวก',
      description: 'เล่นดนตรีเปิดหมวกเพื่อสร้างรายได้จากงานดนตรี',
      category: 'Work', chapterId: 'work', status: 'completed', importance: 1,
      sourceReference: 'timeline.html §2 + brief PART 2E',
      tags: ['เปิดหมวก', 'ดนตรี'], notes: 'ช่วงเวลายังไม่ระบุ'
    }),
    mk({
      id: 'work-tattoo-design', title: 'ออกแบบรอยสัก / ฝึกงานด้านรอยสัก',
      description: 'ฝึกและทำงานด้านการออกแบบลายสัก มีข้อมูลงบอุปกรณ์ฝึกสักประมาณ 2,200 บาท',
      category: 'Work', chapterId: 'work', status: 'in-progress', importance: 1,
      sourceReference: 'timeline.html §2, §9 + brief PART 2E',
      tags: ['รอยสัก', 'ออกแบบ'], notes: 'ช่วงเวลายังไม่ระบุ · 2,200 บาทเป็นงบที่เคยระบุ ไม่ยืนยันว่าซื้อแล้ว'
    }),

    /* ---------- การศึกษา ---------- */
    mk({
      id: 'grad-m6', title: 'จบ ม.6 — โรงเรียนราชวินิตบางเขน',
      description: 'เรียนจบชั้นมัธยมศึกษาปีที่ 6 ที่โรงเรียนราชวินิตบางเขน',
      category: 'Education', chapterId: 'education', status: 'completed', importance: 2,
      datePrecision: 'school_period', dateStatus: 'needs_confirmation', dateSource: 'user_reported',
      sourceReference: 'brief PART 2D + timeline.html §1, §2',
      tags: ['ราชวินิตบางเขน', 'ม.6'], notes: 'ปีที่จบยังไม่มีข้อมูลยืนยัน — ไม่กำหนดปีจากระดับชั้นเอง'
    }),
    mk({
      id: 'uni-ramkhamhaeng-english', title: 'เรียนมนุษยศาสตร์ เอกภาษาอังกฤษ — มหาวิทยาลัยรามคำแหง',
      description: 'มีข้อมูลว่าเคยเข้าศึกษาสาขามนุษยศาสตร์ เอกภาษาอังกฤษ ที่มหาวิทยาลัยรามคำแหง วันเริ่มและวันสิ้นสุดยังไม่มีข้อมูลยืนยัน',
      category: 'Education', chapterId: 'education', importance: 2,
      sourceReference: 'brief PART 2D + timeline.html §2',
      tags: ['รามคำแหง', 'ภาษาอังกฤษ'], notes: 'ห้ามตีความเป็นวันจบหรือวันลาออก — ไม่มีข้อมูล'
    }),
    mk({
      id: 'uni-biotech-paused', title: 'เรียนเทคโนโลยีชีวภาพ รามคำแหง แล้วพักเส้นทาง',
      description: 'มีข้อมูลว่าเคยเรียนด้านเทคโนโลยีชีวภาพที่มหาวิทยาลัยรามคำแหง และพักเส้นทางดังกล่าวไว้',
      category: 'Education', chapterId: 'education', importance: 2,
      sourceReference: 'brief PART 2D + timeline.html §2',
      tags: ['เทคโนโลยีชีวภาพ', 'พักการเรียน'], notes: 'วันเริ่มและวันที่พักไม่ทราบ'
    }),
    mk({
      id: 'piscine-42bkk', title: 'เข้าร่วม 42 Bangkok Piscine แล้วหยุดเส้นทาง',
      description: 'เข้าร่วมหลักสูตร Piscine ของ 42 Bangkok ในเดือนกรกฎาคม 2025 และหยุดเส้นทางนั้นในภายหลัง โดยไม่มีวันที่หยุดที่ยืนยัน',
      category: 'Coding', chapterId: 'education', status: 'completed', importance: 2,
      startYearCE: 2025, startMonthCE: 7,
      datePrecision: 'exact_month', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'brief PART 2D + timeline.html §1, §2',
      tags: ['42 Bangkok', 'Piscine', 'Coding'], notes: 'วันสิ้นสุดไม่ระบุ'
    }),

    /* ---------- การผลิตดนตรี / ตัวตนศิลปิน ---------- */
    mk({
      id: 'music-et1cruel-identity', title: 'สร้างตัวตนศิลปิน et1cruel และแบรนด์ที่เกี่ยวข้อง',
      description: 'พัฒนาตัวตนศิลปินและโปรดิวเซอร์ภายใต้ชื่อ et1cruel โดย et1 เชื่อมโยงกับแนวคิด eternal oneness งานเกี่ยวข้องกับ Cloud Rap, Ambient, Emo Trap และซาวด์ที่เน้นบรรยากาศ นอกจากนี้มีตัวตน/แบรนด์ที่เกี่ยวข้อง ได้แก่ prod.et1cruel, dir.et1cruel และ akase001e8',
      category: 'Music', chapterId: 'music-production', status: 'in-progress', importance: 3,
      sourceReference: 'timeline.html §3 (Timeline ดนตรีและตัวตนออนไลน์)',
      tags: ['et1cruel', 'prod.et1cruel', 'dir.et1cruel', 'akase001e8'],
      notes: 'วันที่เริ่มใช้ชื่อแต่ละแบรนด์ยังไม่มีข้อมูล — ห้ามใช้วันที่แก้ไขเว็บไซต์แทน'
    }),
    mk({
      id: 'release-blow-myself', title: 'ปล่อยเพลง "blow my self"',
      description: 'ปล่อยเพลงชื่อ "blow my self" เมื่อวันที่ 16 ตุลาคม 2023',
      category: 'Music', chapterId: 'music-production', status: 'completed', importance: 3,
      startDate: '2023-10-16', startYearCE: 2023, startMonthCE: 10,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §1, §2 ("16 ตุลาคม 2023 — ปล่อยเพลงแรกชื่อ blow my self")',
      conflictNote: 'มีข้อมูลที่ระบุว่าเป็น "เพลงแรก" สองครั้ง — ครั้งหนึ่งอยู่ในช่วง 2018–2021 ตอนตั้งวง และอีกครั้งคือ 16 ต.ค. 2023 ต้องยืนยันว่าเป็นคนละผลงานหรือข้อมูลซ้ำกัน',
      tags: ['เพลงแรก', '2023'], notes: 'ไม่ยืนยันว่าเป็นผลงานเดี่ยวชิ้นแรกหรือเพลงแรกของวง'
    }),
    mk({
      id: 'prod-et1cruel-2024', title: 'ฝึกทำบีท — เริ่มเส้นทาง prod.et1cruel',
      description: 'ฝึกทำบีทและเดินเส้นทางภายใต้ชื่อ prod.et1cruel โดยขายบีท/เพลง และสอนทำบีท',
      category: 'Business', chapterId: 'music-production', status: 'in-progress', importance: 3,
      startYearCE: 2024, datePrecision: 'exact_year', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §1, §3 ("2024 — ฝึกทำบีท เดินเส้นทาง prod.et1cruel ขายบีท/เพลง และสอนทำบีท")',
      tags: ['prod.et1cruel', 'ขายบีท', 'สอนทำบีท'], notes: 'ยอดขาย/รายได้ยังไม่มีข้อมูลยืนยัน'
    }),
    mk({
      id: 'thai-beat-academy', title: 'แนวคิด Thai Beat Academy',
      description: 'แนวคิดเว็บไซต์สอนทำบีทและสร้างชุมชนผู้ผลิตเพลง มีแนวคิดคอร์ส 990 บาท ระบบสมาชิก และระบบภาคี',
      category: 'Business', chapterId: 'music-production', status: 'exploring', importance: 2,
      sourceReference: 'timeline.html §4 + brief PART 2F',
      tags: ['Thai Beat Academy', 'สอนทำบีท', 'planned'],
      notes: 'เป็นแนวคิด/แผน ยังไม่ยืนยันว่าเปิดใช้งานจริง · thaibeatacademy.pages.dev'
    }),
    mk({
      id: 'gear-guitar-repair', title: 'ซ่อมกีตาร์ SG / สายเบส / แอมป์',
      description: 'มีการพูดถึงการซ่อมกีตาร์ SG และเปลี่ยนสาย รวมถึงสายเบสและแอมป์ โดยมียอดที่เคยจดไว้ 150 บาท และ 1,900 บาท',
      category: 'Music', chapterId: 'music-production', importance: 1,
      sourceReference: 'timeline.html §9 (ทรัพย์สิน อุปกรณ์)',
      tags: ['กีตาร์ SG', 'อุปกรณ์'], notes: 'ช่วงเวลายังไม่ระบุ · ยอดเป็นรายการที่เคยจดไว้'
    }),

    /* ---------- โค้ดและซอฟต์แวร์ ---------- */
    mk({
      id: 'learn-programming', title: 'เรียนรู้การเขียนโปรแกรมและเครื่องมือพัฒนา',
      description: 'อยู่ในเส้นทางการเรียนรู้ด้านการเขียนโปรแกรมและเครื่องมือพัฒนา โดยมีข้อมูลว่าศึกษา Python และ C++ รวมถึง HTML, CSS, JavaScript, React, Vite, Node.js, Express, Supabase, SQL, Git, GitHub, VS Code, Vercel และ Cloudflare Pages',
      category: 'Coding', chapterId: 'coding-software', status: 'in-progress', importance: 2,
      sourceReference: 'brief PART 2G + timeline.html §4 (ตารางเครื่องมือและทักษะ)',
      relatedSkills: ['Python', 'C++', 'HTML', 'CSS', 'JavaScript', 'React', 'Vite', 'Node.js', 'Express', 'Supabase', 'SQL', 'Git', 'GitHub', 'VS Code', 'Vercel', 'Cloudflare Pages'],
      tags: ['Programming', 'Web Development'],
      notes: 'วันเริ่มเรียนแต่ละเทคโนโลยีไม่ทราบ — รายการนี้หมายถึงเคยศึกษา/ทำงานด้วย ไม่ได้แปลว่าชำนาญแล้ว'
    }),
    mk({
      id: 'tech-exploration', title: 'ทดลองเส้นทางดนตรี ซอฟต์แวร์ AI และวิศวกรรมควบคู่กัน',
      description: 'ขยับจากการใช้เทคโนโลยีมาเป็นการพยายามสร้างระบบของตัวเองมากขึ้น ทั้งด้านดนตรี ซอฟต์แวร์ AI และความสนใจด้านวิศวกรรม',
      category: 'Coding', chapterId: 'coding-software', status: 'in-progress', importance: 2,
      startYearCE: 2025, endYearCE: 2026,
      datePrecision: 'estimated_range', dateStatus: 'estimated', dateSource: 'user_reported',
      sourceReference: 'timeline.html §2, §4 ("ช่วงปี 2025–2026 ... เริ่มขยับจากการใช้เทคโนโลยี มาเป็นการพยายามสร้างระบบของตัวเองมากขึ้น")',
      tags: ['2025–2026', 'Building'], notes: 'ระบุเป็นช่วงปีตามข้อมูลเดิม ไม่ใช่วันที่แน่นอน'
    }),
    mk({
      id: 'portfolio-tracker', title: 'อยากได้ระบบติดตามพอร์ตที่ใช้งานสะดวก',
      description: 'ต้องการตารางเปรียบเทียบหุ้น ผลตอบแทนย้อนหลัง กำไรขาดทุน และเว็บไซต์ติดตามพอร์ตที่ใช้งานสะดวกคล้าย Dime',
      category: 'Technology', chapterId: 'coding-software', status: 'exploring', importance: 2,
      startDate: '2026-10-08', startYearCE: 2026, startMonthCE: 10,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §6 (ขั้นที่ 5)',
      tags: ['Portfolio Tracker', 'Dime'], notes: 'เป็นความต้องการที่บันทึกไว้ ยังไม่ยืนยันว่าสร้างเสร็จ'
    }),
    mk({
      id: 'windows10-decision', title: 'ยืนยันใช้ Windows 10 ต่อไป ไม่ข้ามไป 11',
      description: 'ยืนยันว่าจะใช้ Windows 10 ต่อไป และไม่อัปเกรดเป็น Windows 11 ณ วันที่บันทึกข้อมูล',
      category: 'Technology', chapterId: 'coding-software', status: 'completed', importance: 1,
      startDate: '2026-10-06', startYearCE: 2026, startMonthCE: 10,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §4 (สเปกคอมพิวเตอร์ที่เคยระบุ)',
      tags: ['Windows 10'], notes: 'เป็นสถานะ ณ วันที่ 6 ต.ค. 2026'
    }),
    mk({
      id: 'pc-workstation', title: 'เครื่อง PC ที่ใช้ทำงาน (i5-12400 / RTX 4060 8GB / 32GB RAM)',
      description: 'ใช้ Intel Core i5-12400, GPU RTX 4060 8GB, RAM 32GB และพื้นที่จัดเก็บประมาณ 1TB สำหรับทำเพลง ตัดต่อวิดีโอ เขียนโค้ด ทดลอง Local AI และระบบอัตโนมัติ',
      category: 'Technology', chapterId: 'current-life', importance: 2,
      startYearCE: 2026, startMonthCE: 10,
      datePrecision: 'estimated_year', dateStatus: 'estimated', dateSource: 'user_reported',
      sourceReference: 'timeline.html §4 (ข้อมูล ณ ช่วงตุลาคม 2026)',
      tags: ['PC', 'RTX 4060'], notes: 'เป็นข้อมูลสเปก ณ ช่วง ต.ค. 2026 ไม่ใช่วันที่ซื้อ'
    }),
    mk({
      id: 'life-os-build', title: 'พัฒนา ET1CRUEL LIFE OS',
      description: 'พัฒนาเว็บไซต์ Life OS เพื่อรวมดนตรี งานสร้างสรรค์ งานโค้ด AI การเงิน และการบันทึกชีวิตไว้ในระบบเดียว',
      category: 'Technology', chapterId: 'current-life', status: 'in-progress', importance: 3, isCurrent: true,
      startYearCE: 2026, datePrecision: 'exact_year', dateStatus: 'confirmed', dateSource: 'project_record',
      sourceReference: 'timeline.html §4 (Life OS) + index.html (เว็บไซต์นี้)',
      relatedProjectIds: ['life-os-build'],
      tags: ['CURRENT', 'Life OS', 'Building'],
      notes: 'ตำแหน่งปัจจุบัน ปี 2026 / พ.ศ. 2569 · ไม่ใช่วันเริ่มต้นของแบรนด์ et1cruel'
    }),

    /* ---------- AI ---------- */
    mk({
      id: 'ai-agents-exploration', title: 'ทดลองสร้าง AI Agent และระบบอัตโนมัติ',
      description: 'เริ่มสร้างระบบ AI Agent เพื่อช่วยงานเขียนโค้ด คอนเทนต์ และการวิเคราะห์ข้อมูล มีการศึกษาสิ่งที่เกี่ยวข้อง เช่น Local LLM, Vision, Prompt Engineering และเครื่องมืออัตโนมัติ (n8n, Docker, Hermes)',
      category: 'AI', chapterId: 'ai-automation', status: 'exploring', importance: 2,
      sourceReference: 'brief PART 2G + timeline.html §4 (ตารางเครื่องมือ AI/Automation)',
      relatedSkills: ['AI Agent', 'Local LLM', 'Vision', 'Prompt Engineering', 'n8n', 'Docker'],
      tags: ['AI Agent', 'Automation', 'Exploring'],
      notes: 'สถานะเป็นแนวคิด/การทดลอง ไม่ได้ถือว่าเสร็จสมบูรณ์ · วันเริ่มไม่ทราบ'
    }),

    /* ---------- หุ่นยนต์ ---------- */
    mk({
      id: 'robotics-planning', title: 'สนใจและวางแผนเส้นทางวิศวกรรมหุ่นยนต์',
      description: 'สนใจ Embedded Systems, อิเล็กทรอนิกส์ และ Robotics มากขึ้น มีการพิจารณาการเรียน Robotics & Automation Engineering ที่สถาบันปัญญาภิวัฒน์ และตั้งเป้าหมายไปสู่การสร้างหุ่นยนต์อัจฉริยะ',
      category: 'Robotics', chapterId: 'robotics', status: 'exploring', importance: 2,
      sourceReference: 'brief PART 2G + timeline.html §9 (เส้นทางวิศวกรรมหุ่นยนต์)',
      relatedSkills: ['Arduino', 'Raspberry Pi', 'ESP32', 'STM32', 'Sensors', 'Motor Control'],
      tags: ['Robotics', 'Embedded', 'Future Goal'],
      notes: 'เป็นความสนใจ/แผน ยังไม่ยืนยันว่าลงทะเบียนเรียน'
    }),

    /* ---------- ชีวิตปัจจุบัน 2026 ---------- */
    mk({
      id: 'lucky-adopted', title: 'รับหนูสีขาวชื่อ Lucky มาเลี้ยง',
      description: 'รับหนูสีขาวชื่อ Lucky มาเลี้ยงเมื่อวันที่ 31 มีนาคม 2025',
      category: 'Personal', chapterId: 'current-life', status: 'completed', importance: 2,
      startDate: '2025-03-31', startYearCE: 2025, startMonthCE: 3,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §8',
      tags: ['Lucky', 'สัตว์เลี้ยง'], notes: 'มีแนวคิดใช้เป็นมาสคอตในงานสร้างสรรค์ด้วย'
    }),
    mk({
      id: 'weight-74kg', title: 'น้ำหนัก 74 กก.',
      description: 'มีข้อมูลว่าน้ำหนักอยู่ที่ 74 กิโลกรัม ในเดือนมีนาคม 2026',
      category: 'Personal', chapterId: 'current-life', importance: 1,
      startYearCE: 2026, startMonthCE: 3,
      datePrecision: 'exact_month', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §8',
      tags: ['สุขภาพ'], notes: 'เป็นค่าที่เคยระบุ ไม่ใช่ค่าล่าสุดที่ยืนยันแล้ว'
    }),
    mk({
      id: 'height-187', title: 'ส่วนสูงประมาณ 187 ซม.',
      description: 'มีข้อมูลว่าส่วนสูงประมาณ 187 เซนติเมตร',
      category: 'Personal', chapterId: 'current-life', importance: 1,
      sourceReference: 'timeline.html §8',
      tags: ['สุขภาพ'], notes: 'ช่วงเวลาที่วัดไม่ทราบ'
    }),
    mk({
      id: 'family-loss-inheritance', title: 'สูญเสียคนในครอบครัว และต้องติดตามเรื่องมรดก',
      description: 'เผชิญเหตุการณ์สูญเสียคนในครอบครัวและต้องติดตามเรื่องมรดก ช่วงเดือนสิงหาคมถึงตุลาคม 2026 ตามข้อมูลเดิม',
      category: 'Personal', chapterId: 'current-life', importance: 3,
      startYearCE: 2026, startMonthCE: 8, endYearCE: 2026, endMonthCE: 10,
      datePrecision: 'estimated_range', dateStatus: 'estimated', dateSource: 'user_reported',
      sourceReference: 'timeline.html §1 ("สิงหาคม–ตุลาคม 2026")',
      tags: ['ครอบครัว', 'มรดก'], notes: 'ไม่ระบุวัน — เรื่องส่วนตัว ใช้ข้อความเท่าที่บันทึกไว้'
    }),
    /* ---------- การเงิน ---------- */
    mk({
      id: 'finance-baseline', title: 'วางรากฐานการเงิน — บันทึกยอดรวมที่ใช้เป็นฐานวางแผน',
      description: 'มีการบันทึกยอดเงินรวมที่ใช้เป็นฐานวางแผนประมาณ 585,000 บาท พร้อมแยกเงินฝาก เงินสด หุ้นสหรัฐฯ และ Bitcoin',
      category: 'Finance', chapterId: 'current-life', status: 'completed', importance: 3,
      startDate: '2026-10-06', startYearCE: 2026, startMonthCE: 10,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §6 (จุดเปลี่ยนในช่วงตุลาคม 2026 ขั้นที่ 1)',
      tags: ['การเงิน', 'ฐานวางแผน'], notes: 'ยอด 585,000 บาทเป็นยอดที่บันทึกไว้ ณ วันนั้น ไม่ใช่ยอดปัจจุบัน'
    }),
    mk({
      id: 'finance-deposit-vs-etf', title: 'เปรียบเทียบเงินฝากกับ ETF',
      description: 'ศึกษา Kept, e-Savings, JEPQ, JEPI, QQQI, SCHD และ VOO เพื่อเปรียบเทียบดอกเบี้ย เงินปันผล ความเสี่ยง และความสะดวกในการใช้เงิน',
      category: 'Finance', chapterId: 'current-life', status: 'completed', importance: 2,
      startDate: '2026-10-07', startYearCE: 2026, startMonthCE: 10,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §6 (ขั้นที่ 2)',
      tags: ['ETF', 'เงินฝาก', 'การศึกษา'], notes: 'เป็นการศึกษา ไม่ใช่คำแนะนำการลงทุน'
    }),
    mk({
      id: 'finance-cashflow-plan', title: 'วางแผนกระแสเงินสด และตั้งเป้าพอร์ต 5 ล้านบาท',
      description: 'ทดลองคำนวณว่าพอร์ต 500,000–600,000 บาทจะสร้างรายได้จากเงินปันผลได้เท่าไร และวางเป้าหมายพอร์ต 5 ล้านบาท',
      category: 'Finance', chapterId: 'current-life', status: 'in-progress', importance: 3,
      startDate: '2026-10-07', startYearCE: 2026, startMonthCE: 10,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §6 (ขั้นที่ 3)',
      tags: ['กระแสเงินสด', 'พอร์ต 5 ล้าน'], relatedProjectIds: ['goal-portfolio-5m'],
      notes: 'ผลตอบแทนที่คาดหวังไม่ใช่ผลตอบแทนที่รับประกัน'
    }),
    mk({
      id: 'finance-ai-stocks', title: 'วิเคราะห์หุ้นห่วงโซ่ AI และเซมิคอนดักเตอร์',
      description: 'เริ่มวิเคราะห์บริษัทในห่วงโซ่ AI และเซมิคอนดักเตอร์ เปรียบเทียบพื้นฐานธุรกิจ ความสามารถในการแข่งขัน การเติบโต และความเสี่ยง',
      category: 'Finance', chapterId: 'current-life', status: 'in-progress', importance: 2,
      startDate: '2026-10-07', endDate: '2026-10-08', startYearCE: 2026, endYearCE: 2026, startMonthCE: 10, endMonthCE: 10,
      datePrecision: 'exact_range', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §6 (ขั้นที่ 4)',
      tags: ['AI Stocks', 'Semiconductor'], notes: 'เป็นการวิเคราะห์ส่วนตัว ไม่ใช่คำแนะนำการลงทุน'
    }),

    /* ---------- คอนเทนต์และอุปกรณ์ ---------- */
    mk({
      id: 'gear-camera-instaz', title: 'Insta360 Ace Pro 2 และชุดอุปกรณ์ถ่ายทำ',
      description: 'มีข้อมูลเกี่ยวกับกล้อง Insta360 Ace Pro 2 และการจัดชุดอุปกรณ์ถ่ายทำ รวมถึงเมมโมรี่การ์ด SanDisk Extreme และขาตั้ง โดยงบที่เคยระบุรวม 15,489 บาท',
      category: 'Content Creation', chapterId: 'current-life', status: 'in-progress', importance: 2,
      startYearCE: 2026, datePrecision: 'estimated_year', dateStatus: 'estimated', dateSource: 'user_reported',
      sourceReference: 'timeline.html §5 (Timeline กล้อง คอนเทนต์)',
      tags: ['Insta360', 'กล้อง', 'คอนเทนต์'],
      notes: 'งบ 13,699 + 1,490 + 300 = 15,489 บาทเป็นบทที่ระบุไว้ ไม่ใช่หลักฐานว่าซื้อครบทุกรายการ'
    }),
    mk({
      id: 'content-affiliate', title: 'Shopee Affiliate ผ่านการอนุมัติ และศึกษาการทำ TikTok Affiliate',
      description: 'ผ่านการอนุมัติ Shopee Affiliate และเคยศึกษาการทำ TikTok Affiliate โดยสนใจหมวดพาวเวอร์แบงก์',
      category: 'Content Creation', chapterId: 'current-life', status: 'in-progress', importance: 1,
      startYearCE: 2026, datePrecision: 'estimated_year', dateStatus: 'estimated', dateSource: 'user_reported',
      sourceReference: 'timeline.html §5',
      tags: ['Affiliate', 'Shopee', 'TikTok'], notes: 'ยังไม่มีข้อมูลรายได้จากช่องทางนี้'
    }),

    /* ---------- ช่วงที่ยังต้องยืนยัน ---------- */
    mk({
      id: 'inheritance-deadline', title: 'กำหนดการเรื่องมรดก',
      description: 'มีกำหนดการที่เกี่ยวข้องกับเรื่องมรดกในวันที่ 26 ตุลาคม 2026 — เป็นเหตุการณ์ที่ยังไม่เกิดขึ้น ณ วันบันทึกข้อมูล',
      category: 'Personal', chapterId: 'current-life', importance: 3, isFuture: true,
      startDate: '2026-10-26', startYearCE: 2026, startMonthCE: 10,
      datePrecision: 'exact_date', dateStatus: 'confirmed', dateSource: 'user_reported',
      sourceReference: 'timeline.html §12 ("ความคืบหน้าของเรื่องมรดกหลังวันที่ 26 ตุลาคม 2026")',
      tags: ['มรดก', 'กำหนดการ'], notes: 'เป็นวันที่ที่มีข้อมูล ไม่ใช่เป้าหมาย — แยกจากเป้าหมายอนาคตเพราะมีวันจริง'
    }),

    /* ---------- เป้าหมายอนาคต (ยังไม่เกิดขึ้น) ---------- */
    mk({
      id: 'goal-music-artist', title: 'เติบโตในฐานะ Music Artist และ Producer',
      description: 'พัฒนาผลงานเพลง แบรนด์ et1cruel และงานโปรดิวซ์อย่างต่อเนื่อง',
      category: 'Future Goals', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 3, isFuture: true,
      sourceReference: 'brief PART 2J + timeline.html §10',
      tags: ['Future Goal', 'Music'], notes: 'ยังไม่กำหนดปี — ตั้งได้เองภายหลัง'
    }),
    mk({
      id: 'goal-software-engineer', title: 'เป็น Software Engineer และสร้างผลิตภัณฑ์ของตัวเอง',
      description: 'พัฒนาไปสู่สาย Software Engineering, Full-Stack และ Backend และสร้างผลิตภัณฑ์ที่ใช้งานได้จริง',
      category: 'Future Goals', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 3, isFuture: true,
      sourceReference: 'brief PART 2G, PART 2J',
      tags: ['Future Goal', 'Software'], notes: 'ยังไม่กำหนดปี'
    }),
    mk({
      id: 'goal-ai-own', title: 'สร้าง AI Agents และระบบ AI ของตัวเอง',
      description: 'สร้างระบบ AI ของตัวเองให้ช่วยงานจริง ทั้งการเขียนโค้ด คอนเทนต์ และการวิเคราะห์',
      category: 'Future Goals', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 3, isFuture: true,
      sourceReference: 'brief PART 2G, PART 2I, PART 2J',
      tags: ['Future Goal', 'AI'], notes: 'ยังไม่กำหนดปี'
    }),
    mk({
      id: 'goal-robotics', title: 'พัฒนาทักษะ Robotics Engineering',
      description: 'สร้างพื้นฐานคณิตศาสตร์ ฟิสิกส์ อิเล็กทรอนิกส์ และการเขียนโปรแกรม เพื่อต่อยอดไปสู่ Embedded Systems และหุ่นยนต์',
      category: 'Future Goals', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 2, isFuture: true,
      sourceReference: 'brief PART 2J + timeline.html §10 (ระยะที่ 3)',
      tags: ['Future Goal', 'Robotics'], notes: 'ยังไม่กำหนดปี'
    }),
    mk({
      id: 'goal-stable-income', title: 'มีรายได้มั่นคงจากงานและผลงานของตัวเอง',
      description: 'สร้างรายได้ที่มั่นคงจากทักษะและผลงานของตัวเอง โดยไม่ทิ้งงานเพลง การเดินทาง และการบันทึกชีวิต',
      category: 'Future Goals', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 3, isFuture: true,
      sourceReference: 'brief PART 2I, PART 2J',
      tags: ['Future Goal', 'รายได้'], notes: 'ยังไม่กำหนดปี'
    }),
    mk({
      id: 'goal-portfolio-5m', title: 'พอร์ตลงทุน 5 ล้านบาท และกระแสเงินสด 25,000–30,000 บาท/เดือน',
      description: 'เป้าหมายพอร์ตลงทุนระยะยาว 5 ล้านบาท พร้อมกระแสเงินสดจากเงินปันผล 25,000–30,000 บาทต่อเดือน',
      category: 'Future Goals', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 2, isFuture: true,
      sourceReference: 'timeline.html §6 (เป้าหมายทางการเงิน)',
      tags: ['Future Goal', 'การเงิน'], notes: 'ยังไม่กำหนดปี · ผลตอบแทนที่คาดหวังไม่ใช่การรับประกัน'
    }),
    mk({
      id: 'goal-beat-academy-business', title: 'Thai Beat Academy เป็นแพลตฟอร์มที่สร้างรายได้จริง',
      description: 'พัฒนา Thai Beat Academy ให้เป็นแพลตฟอร์มที่มีผู้ใช้และสร้างรายได้ได้จริง',
      category: 'Business', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 2, isFuture: true,
      sourceReference: 'timeline.html §10 (ระยะที่ 2) + brief PART 2F',
      tags: ['Future Goal', 'Business'], notes: 'ยังไม่กำหนดปี'
    }),
    mk({
      id: 'goal-freedom', title: 'อิสระในการใช้ชีวิต ทำเพลง เดินทาง และบันทึกชีวิต',
      description: 'รักษาอิสระในการทำเพลง การเดินทาง และการบันทึกชีวิต ไว้ควบคู่กับการสร้างรายได้',
      category: 'Future Goals', chapterId: 'future-goals', type: 'goal', status: 'planned', importance: 3, isFuture: true,
      sourceReference: 'brief PART 2F, PART 2J',
      tags: ['Future Goal', 'อิสระ'], notes: 'ยังไม่กำหนดปี'
    })
  ];

  window.ET1LIFE_DATA = {
    version: 2,
    categories: categories,
    categoryNames: categoryNames,
    chapters: chapters,
    seeds: seeds,
    yearRange: [2004, 2026],
    childhoodRange: [2004, 2017],
    futureYearKey: 'future',
    birthDate: '2004-12-17',
    birthTime: '08:58',
    nowYearCE: 2026,
    v1ChapterMap: {
      childhood: 'childhood', 'turning-point': 'music-origin', 'learning-struggle': 'learning-struggle',
      'education-experiments': 'education', 'music-artist': 'music-production', 'creative-technology': 'coding-software',
      'ai-builder': 'ai-automation', 'robotics-future': 'robotics', 'life-os': 'current-life'
    },
    v1CategoryMap: {
      Life: 'Personal', Education: 'Education', Work: 'Work', Music: 'Music', Business: 'Business',
      Art: 'Content Creation', Technology: 'Technology', AI: 'AI', Robotics: 'Robotics', Finance: 'Finance',
      'Health & Fitness': 'Personal', Relationships: 'Personal', Travel: 'Personal',
      Spirituality: 'Personal Growth', Learning: 'Coding', 'Personal Growth': 'Personal Growth',
      'Future Goals': 'Future Goals'
    },
    v1CategoryTag: {
      'Health & Fitness': 'health', Relationships: 'relationships', Travel: 'travel',
      Spirituality: 'spirituality', Art: 'from-art'
    }
  };
})();
