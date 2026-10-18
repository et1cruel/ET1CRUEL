/* tools/life-graph-check.mjs — ชิมความเข้ากันได้ (compatibility shim)
 *
 * เดิมไฟล์นี้เป็นฮาร์เนส V1 ที่ export `run(page)` และตรวจ DOM แบบ 9 เหตุการณ์/4 จุดกราฟ
 * ซึ่งล้าสมัยแล้ว (V1 ถูกแทนที่ด้วย V2 ที่มี 47 seed, ไทม์ไลน์รายปี และกราฟจริง)
 *
 * ตอนนี้ชุดตรวจทั้งหมดย้ายไปที่ tools/verify-life-graph.mjs ซึ่งยัง export `run(page)`
 * ในรูปแบบเดิม (เรียกกับ page ที่เปิด index.html ไว้แล้วได้เลย) จึงคงไฟล์นี้ไว้เป็นทางเข้าเดิม
 * สำหรับสคริปต์ที่ import ชื่อนี้อยู่
 *
 * วิธีรันชุดตรวจจริง:  node tools/verify-life-graph.mjs
 */
export { run, run as default, runStatic, createChecker, main } from './verify-life-graph.mjs';
