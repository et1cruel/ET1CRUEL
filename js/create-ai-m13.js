/* CREATE AI — M13 humanoid tracker (PARTIAL data only, v1) */
window.CAIDATA = window.CAIDATA || {};
window.CAIDATA.modules.push(
  { id: 'm13', no: '13', th: 'หุ่นยนต์ Humanoid', en: 'Humanoid Robotics', desc: 'ตารางเทียบ + เส้นทางเรียนรู้ + แขนกลจำลอง', shipped: true },
  { id: 'kg', no: '◈', th: 'แผนที่ความรู้', en: 'Knowledge Graph', desc: 'กราฟโยงทุกแนวคิด + เส้นทางเรียน', shipped: true }
);
function caiRobot(co, model, rel, status, refs, note) {
  return { co: co, model: model, rel: rel, status: status, h: 'UNKNOWN', w: 'UNKNOWN', dof: 'UNKNOWN', pay: 'UNKNOWN', bat: 'UNKNOWN', spd: 'UNKNOWN', senses: 'UNKNOWN', compute: 'UNKNOWN', autonomy: 'UNKNOWN', price: 'NOT DISCLOSED', refs: refs, vstatus: 'PARTIAL', retrieved: '15 ต.ค. 2569', note: note };
}
window.CAIDATA.m13robots = [
caiRobot('Boston Dynamics', 'Atlas', '2024', 'R&D / demo unit', [{l:'Boston Dynamics',u:'https://www.bostondynamics.com'}], 'Atlas รุ่นไฟฟ้าเปิดตัว 2024 เป็นหน่วย R&D/เดโม สเปกละเอียดไม่เปิดเผยบนเว็บทางการ'),
caiRobot('Tesla', 'Optimus', 'UNKNOWN', 'R&D / demo unit', [{l:'Tesla',u:'https://www.tesla.com'}], 'หน่วยเดโมจาก Tesla สเปกไม่เปิดเผยบนเว็บทางการ'),
caiRobot('Figure', 'Figure 02', 'UNKNOWN', 'pilot deployments reported', [{l:'Figure',u:'https://www.figure.ai'}], 'มีรายงานการทดลองใช้ภาคสนาม สเปกละเอียดควรตรวจเว็บทางการ'),
caiRobot('Agility Robotics', 'Digit', 'UNKNOWN', 'pilot deployments reported', [{l:'Agility Robotics',u:'https://agilityrobotics.com'}], 'หุ่นสองขาสายคลังสินค้า มีรายงานการทดลองใช้ภาคสนาม'),
caiRobot('Unitree', 'G1', 'UNKNOWN', 'announced', [{l:'Unitree',u:'https://www.unitree.com'}], 'ฮิวแมนนอยด์ขนาดเล็ก ไม่ใส่สเปกเพื่อเลี่ยงตัวเลขไม่ยืนยัน'),
caiRobot('Unitree', 'H1', 'UNKNOWN', 'announced', [{l:'Unitree',u:'https://www.unitree.com'}], 'ฮิวแมนนอยด์ขนาดเต็ม ไม่ใส่สเปกเพื่อเลี่ยงตัวเลขไม่ยืนยัน'),
caiRobot('1X', 'NEO', 'UNKNOWN', 'announced', [{l:'1X',u:'https://www.1x.tech'}], 'ฮิวแมนนอยด์สายบ้าน สเปกละเอียดไม่เปิดเผยบนเว็บทางการ'),
caiRobot('UBTECH', 'Walker S', 'UNKNOWN', 'pilot deployments reported', [{l:'UBTECH',u:'https://www.ubtrobotics.com'}], 'ฮิวแมนนอยด์อุตสาหกรรม มีรายงานการทดลองใช้ภาคสนาม'),
caiRobot('Apptronik', 'Apollo', 'UNKNOWN', 'announced', [{l:'Apptronik',u:'https://www.apptronik.com'}], 'ฮิวแมนนอยด์อเนกประสงค์ สเปกละเอียดไม่เปิดเผยบนเว็บทางการ'),
caiRobot('Sanctuary AI', 'Phoenix', 'UNKNOWN', 'announced', [{l:'Sanctuary AI',u:'https://www.sanctuary.ai'}], 'แพลตฟอร์ม R&D ฮิวแมนนอยด์ สเปกไม่เปิดเผยบนเว็บทางการ')
];
window.CAIDATA.m13learn = [
{ t:'Kinematics: ท่าและตำแหน่ง', d:'แนวคิดมุมข้อต่อกับตำแหน่งปลายแขน ลองขยับในสนามแขนกลด้านล่าง' },
{ t:'Control: สมดุลและแรง', d:'แนวคิด PID และการทรงตัวแบบคอนเซปต์ ไม่ลงรายละเอียด API' },
{ t:'Perception: เซนเซอร์และการรับรู้', d:'แนวคิดกล้อง depth และ sensor fusion แบบคอนเซปต์' },
{ t:'Learning: เรียนรู้จากข้อมูล', d:'แนวคิด imitation/reinforcement สำหรับหุ่นยนต์แบบคอนเซปต์' },
{ t:'ROS 2: การสื่อสารระหว่างโมดูล', d:'แนวคิด node/topic/service แบบคอนเซปต์' },
{ t:'VLA: ภาพ-ภาษา-การกระทำ', d:'แนวคิดเชื่อมการมองเห็น คำสั่ง และการขยับ' }
];
window.CAIDATA.m13quiz = [
{ q:'Atlas รุ่นไฟฟ้า (2024) อยู่ในสถานะใด?', c:['R&D / demo unit','วางขายทั่วไปพร้อมสเปกเปิดเผยครบ','ยกเลิกโครงการแล้ว'], a:0 },
{ q:'สถานะข้อมูลของทุกระเบียนในชุดนี้คืออะไร?', c:['COMPLETE','PARTIAL','VERIFIED FULL SPEC'], a:1 },
{ q:'ถ้าสเปกไม่เปิดเผยบนเว็บทางการ ควรบันทึกค่าอะไร?', c:['UNKNOWN','ค่าประมาณ','ตัวเลขจากข่าวลือ'], a:0 },
{ q:'VLA สำหรับ humanoid หมายถึงแนวคิดใด?', c:['เชื่อมภาพ-ภาษา-การกระทำ','แบตเตอรี่ชนิดใหม่','วัสดุโครงสร้าง'], a:0 }
];
window.CAIDATA.kgraph = {
nodes: [
  { id:'linalg', l:'Linear Algebra', g:'math' }, { id:'prob', l:'Probability', g:'math' },
  { id:'python', l:'Python', g:'code' }, { id:'pytorch', l:'PyTorch', g:'code' },
  { id:'neuron', l:'Neuron', g:'net' }, { id:'backprop', l:'Backprop', g:'net' },
  { id:'transformer', l:'Transformer', g:'net' }, { id:'llm', l:'LLM', g:'model' },
  { id:'finetune', l:'Fine-tune', g:'model' }, { id:'rag', l:'RAG', g:'model' },
  { id:'agent', l:'AI Agent', g:'app' }, { id:'serve', l:'Serving/Infra', g:'app' },
  { id:'vision', l:'Vision', g:'sense' }, { id:'robot', l:'Humanoid', g:'sense' },
  { id:'safety', l:'Safety', g:'biz' }, { id:'biz', l:'AI Business', g:'biz' }
],
links: [['linalg','neuron'],['prob','neuron'],['python','pytorch'],['pytorch','neuron'],['neuron','backprop'],['backprop','transformer'],['transformer','llm'],['llm','finetune'],['llm','rag'],['rag','agent'],['finetune','agent'],['llm','serve'],['vision','robot'],['llm','robot'],['agent','biz'],['safety','biz'],['serve','biz'],['safety','agent']]
};
