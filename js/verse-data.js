/* ============================================================
   ET1CRUELVERSE — data layer
   7 identities · one universe
   เพิ่มตัวตนใหม่ = เพิ่ม object ใน VERSE_IDENTITIES
   UI จะสร้างการ์ด/แผนที่/แฟ้มตัวตนให้อัตโนมัติ
   ============================================================ */
window.VERSE_DIVISIONS = [
  { id: 'creative',   label: 'Creative',   labelTH: 'สายสร้างสรรค์', color: '#FF5C4D' },
  { id: 'personal',   label: 'Personal',   labelTH: 'สายชีวิต',      color: '#FF90E8' },
  { id: 'technology', label: 'Technology', labelTH: 'สายเทคโนโลยี',  color: '#00E5A0' },
  { id: 'fashion',    label: 'Fashion',    labelTH: 'สายแฟชั่น',     color: '#FFB38A' }
];

window.VERSE_IDENTITIES = [
  {
    id: 'et1cruel',
    index: '01',
    name: 'et1cruel',
    roleTH: 'ศิลปิน',
    roleEN: 'The Artist',
    category: 'Artist / Creative Identity',
    division: 'creative',
    divisionLabel: 'Creative',
    rank: 'A',
    status: '',
    tagline: 'Art, Sound, Vision.',
    lead: 'ศิลปินหลักที่เชื่อมทุกแขนงเข้าด้วยกัน — ดนตรี ศิลปะ การวาด และแนวคิดทดลอง',
    core: 'ตัวตนศิลปินหลักและศูนย์กลางความคิดสร้างสรรค์ ถ่ายทอดอารมณ์ ความคิด และประสบการณ์ผ่านดนตรี ศิลปะ และการทดลองทางความคิด เป็นจุดเชื่อมโยงระหว่างตัวตนทั้งหมดในจักรวาล',
    focus: [
      'Music & Artistic Expression',
      'Creative Experiments & Original Concepts',
      'Drawing & Personal Art',
      'Visual Concepts & Branding',
      'Creative Collaboration',
      'Connecting Sound, Vision, Mood and Emotion'
    ],
    personality: 'เป็นตัวของตัวเอง ช่างสังเกต ชอบทดลองสิ่งใหม่ และใช้ความคิดสร้างสรรค์เพื่อสำรวจความรู้สึกและประสบการณ์ของมนุษย์',
    visual: ['Experimental Art', 'Dark Aesthetic', 'Emotional Visuals', 'Futuristic Elements', 'Abstract Symbols'],
    role: 'เป็นตัวตนศิลปินหลักที่เชื่อมโยงงานสร้างสรรค์ทุกแขนงเข้าด้วยกัน โดยมีช่องทางเฉพาะทางสำหรับดนตรี ภาพยนตร์ ศิลปะ และแฟชั่น',
    keywords: ['Music', 'Drawing', 'Visual Concepts'],
    color: '#FF5C4D',
    sigil: 'artist',
    links: ['prod.et1cruel', 'dir.et1cruel', 'art.et1cruel']
  },
  {
    id: 'prod.et1cruel',
    index: '02',
    name: 'prod.et1cruel',
    roleTH: 'โปรดิวเซอร์',
    roleEN: 'The Sound Architect',
    category: 'Music Producer / Sound Designer / Audio Engineer',
    division: 'creative',
    divisionLabel: 'Creative',
    rank: 'S',
    status: '',
    tagline: 'Sculpting Sound Into Emotion.',
    lead: 'เปลี่ยนไอเดียและอารมณ์ให้เป็นผลงานเสียง — ตั้งแต่บีทจนถึงมาสเตอร์',
    core: 'ตัวตนด้านการผลิตดนตรีและออกแบบเสียง เปลี่ยนไอเดีย อารมณ์ และบรรยากาศให้กลายเป็นผลงานเสียงที่มีเอกลักษณ์ ครอบคลุมตั้งแต่การสร้างบีทไปจนถึงการมิกซ์และมาสเตอร์',
    focus: [
      'Beatmaking & Music Production',
      'Sound Design & Sound Selection',
      'Arrangement & Composition',
      'Mixing & Mastering',
      'DAW Workflow & Music Production Education',
      'Beat Licensing & Sample Packs',
      'Music Production Services',
      'Producer Community & Knowledge Sharing'
    ],
    personality: 'ละเอียดกับเสียง ชอบค้นหาซาวด์ใหม่ ๆ ให้ความสำคัญกับอารมณ์ของเพลง และมองการผลิตดนตรีเป็นทั้งศิลปะและกระบวนการทางเทคนิค',
    visual: ['Digital Audio Workstations', 'Sound Waves', 'Abstract Audio Visuals', 'Experimental Typography', 'Creative Studio Aesthetic'],
    role: 'ศูนย์กลางด้านเสียง การผลิตเพลง การขายบีท การให้บริการด้านเสียง และการแบ่งปันความรู้ด้าน Music Production',
    keywords: ['Beatmaking', 'Sound Design', 'Mix / Master'],
    color: '#FFC900',
    sigil: 'producer',
    links: ['dir.et1cruel', 'et1cruel']
  },
  {
    id: 'dir.et1cruel',
    index: '03',
    name: 'dir.et1cruel',
    roleTH: 'ผู้กำกับ',
    roleEN: 'The Visual Director',
    category: 'Film Director / Video Producer / Visual Storyteller',
    division: 'creative',
    divisionLabel: 'Creative',
    rank: 'A',
    status: '',
    tagline: 'Every Frame Tells a Story.',
    lead: 'ผู้กำกับนักเล่าเรื่องด้วยภาพ — แสง สี จังหวะ และการตัดต่อ',
    core: 'ตัวตนผู้กำกับและนักเล่าเรื่องด้วยภาพ สร้างประสบการณ์ผ่านการตัดต่อ แสง สี การเคลื่อนไหว และองค์ประกอบภาพ เพื่อเปลี่ยนไอเดียให้เป็นเรื่องราวที่มีอารมณ์และทิศทางชัดเจน',
    focus: [
      'Video Production & Film Direction',
      'Music Videos & Cinematic Content',
      'Video Editing & Color Grading',
      'Lighting & Composition',
      'Motion Graphics & Visual Effects',
      'Storytelling & Creative Direction',
      'Visual Experiments & Short Films'
    ],
    personality: 'คิดเป็นภาพ ใส่ใจบรรยากาศ จังหวะการเล่าเรื่อง และความสัมพันธ์ระหว่างภาพกับเสียง',
    visual: ['Cinematic Frames', 'Atmospheric Lighting', 'Film Grain', 'Experimental Editing', 'Bold Composition'],
    role: 'เปลี่ยนเพลง แนวคิด และประสบการณ์ให้กลายเป็นมิวสิกวิดีโอ ภาพยนตร์สั้น คอนเทนต์ภาพเคลื่อนไหว และผลงานเชิงภาพยนตร์',
    keywords: ['Music Video', 'Color', 'Storytelling'],
    color: '#87D6FF',
    sigil: 'director',
    links: ['prod.et1cruel', 'et1cruel', 'himoriyacore']
  },
  {
    id: 'himoriyacore',
    index: '04',
    name: 'himoriyacore',
    roleTH: 'ตัวจริง',
    roleEN: 'The Living Archive',
    category: 'Personal Identity / Lifestyle Creator / Visual Storyteller',
    division: 'personal',
    divisionLabel: 'Personal',
    rank: 'S',
    status: '',
    tagline: 'A Life Becoming Art.',
    lead: 'บันทึกชีวิตจริงและเบื้องหลังศิลปิน — พื้นที่ของความเป็นมนุษย์ในจักรวาลนี้',
    core: 'ตัวตนที่บันทึกชีวิตจริง ความคิด การเติบโต และประสบการณ์ของมนุษย์เบื้องหลังศิลปิน เป็นพื้นที่สำหรับสำรวจตัวเองและถ่ายทอดชีวิตผ่านวิดีโอ เสียง ภาพถ่าย และเรื่องเล่าส่วนตัว',
    focus: [
      'Cinematic Life Vlogs',
      'Aesthetic Storytelling & Personal Voice-over',
      'Daily Mood Diary',
      'Personal Reflections & Self-Discovery',
      'Mini Art & Micro Stories',
      'Nature Exploration & Eco Challenges',
      'Documenting Personal Growth',
      'Everyday Life as Creative Material'
    ],
    personality: 'ช่างสังเกต จริงใจ ชอบค้นหาความหมายของชีวิต และให้คุณค่ากับประสบการณ์จริง ความรู้สึก และการเติบโตในแต่ละช่วงเวลา',
    visual: ['Natural Light', 'Intimate Cinematography', 'Atmospheric Landscapes', 'Quiet Moments', 'Personal Documentary'],
    role: 'เป็นรากฐานความเป็นมนุษย์ของจักรวาล บันทึกชีวิต ความคิด และเบื้องหลังการสร้างสรรค์ โดยไม่จำเป็นต้องทำให้ทุกช่วงเวลาดูสมบูรณ์แบบ',
    keywords: ['Life Vlog', 'Mood Diary', 'Voice-over'],
    color: '#FF90E8',
    sigil: 'archive',
    alias: 'tana pawarinpong',
    links: ['dir.et1cruel', 'et1cruel']
  },
  {
    id: 'art.et1cruel',
    index: '05',
    name: 'art.et1cruel',
    roleTH: 'ศิลปินภาพ',
    roleEN: 'The Visual Artist',
    category: 'Visual Artist / Tattoo Artist / Illustrator',
    division: 'creative',
    divisionLabel: 'Creative',
    rank: 'A',
    status: '',
    tagline: 'Art That Becomes Part of You.',
    lead: 'งานวาด งานสัก และผลงานต้นฉบับ — ภาษาศิลปะที่ฝังลงบนร่างกายและความทรงจำ',
    core: 'ตัวตนด้านศิลปะที่เน้นการวาดภาพ งานสัก และการสร้างผลงานต้นฉบับ ถ่ายทอดความคิดผ่านลายเส้น รูปทรง สัญลักษณ์ และองค์ประกอบภาพ พร้อมพัฒนาภาษาทางศิลปะที่เป็นเอกลักษณ์ของตัวเอง',
    focus: [
      'Tattoo Design & Tattoo Art',
      'Drawing & Illustration',
      'Original Artwork',
      'Visual Experimentation',
      'Linework, Symbols & Composition',
      'Art Portfolio & Commissions',
      'Tattoo Flash & Custom Designs'
    ],
    personality: 'รักการทดลอง ใส่ใจรายละเอียด สนใจการแสดงออกผ่านภาพ และต้องการพัฒนาลายเซ็นทางศิลปะของตัวเอง',
    visual: ['Original Drawings', 'Tattoo Flash Sheets', 'Sketchbook Aesthetic', 'Experimental Linework', 'Symbolic Artwork'],
    role: 'เป็นช่องทางด้าน Visual Art โดยเฉพาะ แยกจากบทบาทศิลปินหลัก เพื่อจัดแสดงผลงาน รับงานสัก และพัฒนาพอร์ตโฟลิโอ',
    keywords: ['Tattoo', 'Illustration', 'Original Art'],
    color: '#B8A9FF',
    sigil: 'art',
    links: ['et1cruel', 'hizoe']
  },
  {
    id: 'akase001e8',
    index: '06',
    name: 'akase001e8',
    roleTH: 'วิศวกรจักรวาล',
    roleEN: 'The Cosmic Technologist',
    category: 'AI Engineer / Robotics & Software Developer / Technology Explorer',
    division: 'technology',
    divisionLabel: 'Technology',
    rank: 'S',
    status: 'Aspirational',
    tagline: 'Imagine Beyond Human. Engineer the Impossible.',
    lead: 'AI หุ่นยนต์ และซอฟต์แวร์ — เปลี่ยนจินตนาการให้เป็นระบบที่ใช้งานได้จริง',
    core: 'ตัวตนด้านเทคโนโลยี วิศวกรรม และการประดิษฐ์ ผสานความคิดสร้างสรรค์เข้ากับ AI ซอฟต์แวร์ หุ่นยนต์ และระบบอัตโนมัติ เพื่อเปลี่ยนจินตนาการให้กลายเป็นระบบและสิ่งประดิษฐ์ที่ใช้งานได้จริง',
    focus: [
      'AI Engineering & AI Agents',
      'Robotics, Humanoid Robots & Automation',
      'Software Engineering & Application Development',
      'Full-Stack & Backend Development',
      'IoT & Embedded Systems',
      'Game Development & Virtual Worlds',
      'Science, Engineering & Experimental Technology'
    ],
    personality: 'ช่างทดลอง ชอบแก้ปัญหา สนใจระบบที่ซับซ้อน และมองเทคโนโลยีเป็นเครื่องมือในการขยายขีดความสามารถของมนุษย์',
    visual: ['Cosmic Technology', 'Cybernetic Forms', 'Alien-Inspired Interfaces', 'Futuristic Engineering', 'Minimal Techwear'],
    role: 'เป็นศูนย์กลางด้านเทคโนโลยีและวิศวกรรม เชื่อมต่อ AI เข้ากับงานสร้างสรรค์ เว็บไซต์ เครื่องมืออัตโนมัติ และประสบการณ์ดิจิทัล',
    keywords: ['AI Agents', 'Robotics', 'Software'],
    color: '#00E5A0',
    sigil: 'tech',
    links: ['et1cruel', 'prod.et1cruel']
  },
  {
    id: 'hizoe',
    index: '07',
    name: 'hizoexora',
    roleTH: 'แฟชั่นอิสระ',
    roleEN: 'The Independent Fashion Identity',
    category: 'Independent Fashion Identity',
    division: 'fashion',
    divisionLabel: 'Fashion',
    rank: '—',
    status: 'Style definition in progress',
    tagline: 'Wear Your Own Identity.',
    lead: 'ตัวตนแฟชั่นอิสระที่ยังนิยามตัวเองอยู่ — เสื้อผ้า รูปทรง วัสดุ และอัตลักษณ์',
    core: 'ตัวตนด้านแฟชั่นอิสระที่กำลังนิยามสไตล์และอัตลักษณ์ของตัวเอง เป็นพื้นที่สำหรับสำรวจเสื้อผ้า รูปทรง วัสดุ ลวดลาย และการออกแบบ โดยไม่ต้องรีบสรุปว่าภาพลักษณ์สุดท้ายจะเป็นอย่างไร',
    focus: [
      'Clothing & Silhouette Exploration',
      'Original Garments',
      'Graphic Design for Apparel',
      'Material & Texture Studies',
      'Visual Identity Exploration',
      'Experimental Fashion Concepts',
      'Style Definition in Progress'
    ],
    personality: 'Independent, Expressive, Experimental, Identity-Driven',
    visual: ['Silhouette', 'Material & Texture', 'Graphic Language', 'Open Direction', 'Style in Progress'],
    role: 'เป็นตัวตนด้านแฟชั่นอิสระที่เชื่อมโยงกับดนตรี งานศิลปะ และภาพยนตร์ได้ โดยยังเปิดพื้นที่ให้นิยามสไตล์และทิศทางของตัวเองต่อไป',
    keywords: ['Garments', 'Graphics', 'Identity'],
    color: '#FFB38A',
    sigil: 'fashion',
    links: ['art.et1cruel', 'et1cruel']
  }
];

window.VERSE_COLLABS = [
  {
    a: 'prod.et1cruel',
    b: 'dir.et1cruel',
    title: 'Music Video / Visual Album',
    desc: 'เสียงและภาพที่ถูกออกแบบไปพร้อมกัน — จากบีทสู่เฟรม'
  },
  {
    a: 'hizoe',
    b: 'art.et1cruel',
    title: 'Apparel Graphics / Print',
    desc: 'ลายเส้นจากงานศิลปะ สู่เสื้อผ้าและงานกราฟิก'
  },
  {
    a: 'akase001e8',
    b: 'et1cruel',
    title: 'AI Tools / Web / Systems',
    desc: 'ระบบที่ขยายงานสร้างสรรค์ให้ทำงานได้จริง'
  }
];
