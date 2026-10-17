/* ===== MUSIC ROOM DATA — seed + คำถาม (content ล้วน) =====
 * origins 3 ข้อ = ข้อความจริงของเจ้าของ (จากรูปที่ส่งมา) — ห้ามแต่งเพิ่ม */
(function () {
  'use strict';

  var ORIGINS = [
    { id: 'first-sound', no: '01', title: 'The First Sound', prompt: 'ความทรงจำแรกที่ทำให้รู้สึกว่าดนตรีมีความหมาย', answer: 'ฟัง shoegaze รู้สึกมันไม่ทำให้รู้สึกแย่', userProvided: true },
    { id: 'reason-create', no: '02', title: 'The Reason I Create', prompt: 'ช่วงเวลาที่คุณรู้ว่าการทำเพลงเป็นสิ่งที่คุณอยากทำจริงๆ', answer: 'ตอนที่รู้สึกแย่', userProvided: true },
    { id: 'future-me', no: '03', title: 'A Message to Future Me', prompt: 'ข้อความถึงตัวเองในวันที่ท้อ อย่าลืมดนตรี', answer: 'ยิ้มสู้ไว้', userProvided: true }
  ];

  var TAGS = ['Ambient', 'Cloud Rap', 'Dreamlike', 'Distorted', 'Melancholic', 'Ethereal', 'Experimental', 'Spacious', 'Intimate'];

  var COMPASS_QS = [
    'ฉันอยากสร้างเพลงที่ทำให้ผู้ฟังรู้สึกอย่างไร',
    'ฉันอยากให้เสียงดนตรีของฉันมีลักษณะแบบใด',
    'ถ้าไม่มีใครตัดสินผลงาน ฉันอยากสร้างอะไร',
    'ความสำเร็จทางดนตรีในแบบของฉันหมายถึงอะไร',
    'ฉันอยากให้ชีวิตประจำวันของคนทำเพลงเป็นแบบไหน',
    'สิ่งใดสำคัญกว่าตัวเลขสำหรับฉัน',
    'ฉันอยากสร้างผลงานแบบใดเมื่อมองย้อนกลับไปอีก 5 ปี',
    'ฉันอยากให้ดนตรีเป็นส่วนหนึ่งของชีวิตอย่างไร',
    'มีสิ่งใดเกี่ยวกับดนตรีที่ฉันยังไม่ได้สำรวจ',
    'ตอนนี้ฉันอยากทำเพลงจริงๆ หรือเพียงรู้สึกผิดที่ไม่ได้ทำเพลง'
  ];

  var RETURN_OPTIONS = [
    { id: 'listen', label: 'ฉันอยากฟังเพลงที่ชอบ', go: 'listening' },
    { id: 'old', label: 'ฉันอยากเปิดโปรเจกต์เก่า', go: 'archive' },
    { id: 'beat', label: 'ฉันอยากสร้าง Beat ใหม่', go: 'sanctuary' },
    { id: 'sound', label: 'ฉันอยากทดลอง Sound Design', go: 'sanctuary' },
    { id: 'write', label: 'ฉันอยากเขียนบันทึกถึงดนตรี', go: 'notes' },
    { id: 'stay', label: 'ฉันแค่อยากอยู่ในห้องนี้สักพัก', go: 'hall' },
    { id: 'idk', label: 'ฉันยังไม่รู้ว่าอยากทำอะไร', go: 'idk' }
  ];

  var DAILY_QS = [
    'วันนี้ได้ฟังอะไร',
    'วันนี้มีเสียงแบบไหนที่สะดุดใจ',
    'วันนี้สร้างอะไร แม้จะเป็นสิ่งเล็กน้อย',
    'วันนี้รู้สึกอย่างไรกับดนตรี',
    'มีไอเดียอะไรอยากกลับมาทดลอง',
    'วันนี้ต้องการพักหรือสร้างสรรค์'
  ];

  window.ET1MUSIC_DATA = {
    origins: ORIGINS, tags: TAGS, compassQs: COMPASS_QS,
    returnOptions: RETURN_OPTIONS, dailyQs: DAILY_QS
  };
})();
