/* ET1CRUEL AI AGENCY OS v1 — local-first runtime (no backend, no deps)
 * Store: localStorage "et1cruel.agency.v1" · ทุก state เปลี่ยนจาก event จริงเท่านั้น */
(function () {
'use strict';

var LS_KEY = 'et1cruel.agency.v1';
var MAX_ATTEMPTS = 3;

var AGENTS = [
  { id: 'director', name: 'DIRECTOR', role: 'Orchestrator', desc: 'รับโจทย์ วิเคราะห์ สร้างแผน แบ่ง task ติดตามสถานะ สรุปผล',
    tools: ['plan.create', 'task.assign', 'task.read', 'checkpoint.write'],
    instructions: 'ห้ามข้าม security policy · งานเสี่ยงสูงต้องขออนุมัติมนุษย์ก่อน · retry มีขอบเขต' },
  { id: 'research', name: 'SCOUT', role: 'Research & Strategy', desc: 'ค้นคว้า วิเคราะห์ตลาด/คู่แข่ง วางกลยุทธ์ ประเมินความเสี่ยง',
    tools: ['web.read', 'note.write', 'task.read'],
    instructions: 'ห้ามสร้างแหล่งอ้างอิงปลอม · ข้อมูลไม่พอต้องบอกตรงๆ · แยก fact / assumption / suggestion' },
  { id: 'developer', name: 'BUILDER', role: 'Developer', desc: 'ออกแบบ เขียนโค้ด เทสต์ debug ส่ง deliverable ใน workspace ที่กำหนด',
    tools: ['file.read', 'file.write(workspace)', 'test.run(allowlist)', 'git.branch'],
    instructions: 'ทำงานใน workspace โปรเจกต์เท่านั้น · ห้ามรันคำสั่งนอก allowlist · ทุกงานต้องมี test/หลักฐาน' },
  { id: 'music', name: 'MAESTRO', role: 'Music', desc: 'วิเคราะห์แนวเพลง ช่วย beat/sound design วางแผนขายบีท จัดการ metadata',
    tools: ['audio.read', 'note.write', 'file.write(workspace)'],
    instructions: 'ห้ามอ้างว่า process เสียงสำเร็จถ้าไม่ได้ทำไฟล์จริง · เปิดเผยข้อจำกัดเครื่องมือเสียง' },
  { id: 'content', name: 'MUSE', role: 'Content & Creative', desc: 'คิดไอเดีย เขียนสคริปต์ เตรียม workflow ภาพ/เสียง/วิดีโอ captions/SEO',
    tools: ['note.write', 'file.write(workspace)', 'task.read'],
    instructions: 'งานเผยแพร่/ใช้บริการภายนอกต้องผ่าน approval · เคารพ license ภาพ/เสียง' },
  { id: 'reviewer', name: 'JUDGE', role: 'Reviewer / QA', desc: 'ตรวจ requirement deliverable code test ข้อมูล license security ราคา',
    tools: ['task.read', 'test.read', 'qa.verdict', 'file.read'],
    instructions: 'รายงานพร้อมหลักฐาน ไม่ใช่แค่ PASS · อนุมัติได้เฉพาะขั้นเสี่ยงต่ำ · เสี่ยงสูงส่งมนุษย์' }
];

var TASK_STATUS = ['PLANNING', 'RUNNING', 'WAITING', 'REVIEWING', 'BLOCKED', 'PAUSED', 'COMPLETED', 'FAILED'];
function allAgents() { return AGENTS.concat(store.customAgents || []); }
var PTYPES = ['Music Studio', 'Development Lab', 'Content Studio', 'Business Intelligence', 'Other'];

/* ---------- utils ---------- */
function uid(p) { return (p || 'id') + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e4).toString(36); }
function now() { return new Date().toISOString(); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmtDate(iso) { try { return new Date(iso).toLocaleString('th-TH', { hour12: false }); } catch (e) { return iso; } }
function hash(s) { var h = 5381, i; for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); }
function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

/* ---------- store ---------- */
function blank() { return { projects: [], tasks: [], approvals: [], knowledge: [], events: [], customAgents: [], seq: 0 }; }
function load() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (!raw) return blank();
    var s = JSON.parse(raw);
    ['projects', 'tasks', 'approvals', 'knowledge', 'events'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    if (!Array.isArray(s.customAgents)) s.customAgents = [];
    return s;
  } catch (e) { return blank(); }
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) { toast('บันทึกไม่ได้: storage เต็มหรือถูกบล็อก', 'err'); } }
var store = load();

function log(kind, text) {
  store.events.unshift({ ts: now(), kind: kind, text: text });
  if (store.events.length > 500) store.events.length = 500;
}
function toast(msg, cls) {
  var t = $('#toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast show ' + (cls || '');
  clearTimeout(t._h); t._h = setTimeout(function () { t.className = 'toast'; }, 3200);
}
function download(name, text, type) {
  var b = new Blob([text], { type: type || 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

/* ---------- derived ---------- */
function tasksOf(pid) { return store.tasks.filter(function (t) { return t.projectId === pid; }); }
function agentTasks(aid) { return store.tasks.filter(function (t) { return t.agent === aid && t.status !== 'COMPLETED' && t.status !== 'FAILED'; }); }
function agentStatus(aid) {
  var ts = store.tasks.filter(function (t) { return t.agent === aid; });
  var open = ts.filter(function (t) { return t.status !== 'COMPLETED' && t.status !== 'FAILED'; });
  if (!ts.length) return 'IDLE';
  if (open.some(function (t) { return t.status === 'FAILED'; })) return 'FAILED';
  if (open.some(function (t) { return t.status === 'BLOCKED'; })) return 'BLOCKED';
  if (open.some(function (t) { return t.status === 'RUNNING'; })) return 'RUNNING';
  if (open.some(function (t) { return t.status === 'REVIEWING'; })) return 'REVIEWING';
  if (open.some(function (t) { return t.status === 'WAITING'; })) return 'WAITING';
  if (open.some(function (t) { return t.status === 'PAUSED'; })) return 'PAUSED';
  if (open.some(function (t) { return t.status === 'PLANNING'; })) return 'PLANNING';
  if (ts.every(function (t) { return t.status === 'COMPLETED'; })) return 'COMPLETED';
  return 'IDLE';
}
function agentCurrent(aid) {
  var order = { RUNNING: 0, REVIEWING: 1, WAITING: 2, BLOCKED: 3, PLANNING: 4, PAUSED: 5 };
  var open = agentTasks(aid).sort(function (a, b) { return (order[a.status] || 9) - (order[b.status] || 9); });
  return open[0] || null;
}
function metrics() {
  var tasks = store.tasks, projs = store.projects;
  var done = tasks.filter(function (t) { return t.status === 'COMPLETED'; }).length;
  var failed = tasks.filter(function (t) { return t.status === 'FAILED'; }).length;
  var pending = tasks.filter(function (t) { return ['PLANNING', 'WAITING', 'PAUSED'].indexOf(t.status) >= 0; }).length;
  var runningAgents = allAgents().filter(function (a) { return agentStatus(a.id) === 'RUNNING'; }).length;
  var approvals = store.approvals.filter(function (a) { return a.status === 'pending'; }).length;
  var rev = 0, cost = 0, revKnown = false, costKnown = false;
  projs.forEach(function (p) {
    if (typeof p.revenue === 'number' && !isNaN(p.revenue)) { rev += p.revenue; revKnown = true; }
    if (typeof p.costActual === 'number' && !isNaN(p.costActual)) { cost += p.costActual; costKnown = true; }
  });
  var reviewed = tasks.filter(function (t) { return t.qa === 'pass' || t.qa === 'fail'; });
  var firstPass = reviewed.filter(function (t) { return t.qa === 'pass' && (t.attempts || 1) <= 1; }).length;
  return {
    activeProjects: projs.filter(function (p) { return p.status !== 'done' && p.status !== 'cancelled'; }).length,
    pending: pending, runningAgents: runningAgents, done: done, failed: failed, approvals: approvals,
    revenue: revKnown ? rev : null, cost: costKnown ? cost : null,
    profit: (revKnown && costKnown) ? rev - cost : null,
    qa: reviewed.length ? Math.round(firstPass / reviewed.length * 100) : null
  };
}

/* ---------- mutations (ทุกครั้งมี event จริง) ---------- */
function addProject(d) {
  var p = { id: uid('proj'), name: d.name, type: d.type, client: d.client || '', brief: d.brief || '',
    ptype: d.ptype, status: 'active', priority: d.priority || 'P2', deadline: d.deadline || '',
    agentIds: d.agentIds || [], revenue: d.revenue, costEst: d.costEst, costActual: d.costActual,
    revisions: 0, deliverables: [], createdAt: now(), updatedAt: now(), demo: !!d.demo };
  store.projects.unshift(p); log('project', 'สร้างโปรเจกต์ ' + p.name); save(); return p;
}
function addTask(d) {
  var t = { id: uid('task'), projectId: d.projectId, title: d.title, desc: d.desc || '', agent: d.agent,
    status: 'PLANNING', priority: d.priority || 'P2', deps: d.deps || [], createdAt: now(), updatedAt: now(),
    attempts: 0, progress: 0, error: '', output: '', qa: 'pending', demo: !!d.demo };
  store.tasks.unshift(t); log('task', 'สร้าง task ' + t.title + ' → ' + agentName(t.agent)); save(); return t;
}
function setTaskStatus(id, st, extra) {
  var t = store.tasks.find(function (x) { return x.id === id; }); if (!t) return;
  if (TASK_STATUS.indexOf(st) < 0) { toast('สถานะไม่ถูกต้อง', 'err'); return; }
  var prev = t.status;
  t.status = st; t.updatedAt = now();
  if (extra && extra.output != null) t.output = extra.output;
  if (extra && extra.error != null) t.error = extra.error;
  if (st === 'COMPLETED') t.progress = 100;
  log('task', 'task ' + t.title + ' → ' + st); save(); render();
  if (st === 'COMPLETED' && prev !== 'COMPLETED') notifyCompleted(t);
}
function retryTask(id) {
  var t = store.tasks.find(function (x) { return x.id === id; }); if (!t) return;
  t.attempts = (t.attempts || 0) + 1;
  if (t.attempts >= MAX_ATTEMPTS) { t.status = 'BLOCKED'; t.error = 'เกิน ' + MAX_ATTEMPTS + ' รอบ — รอ human review'; log('task', 'task ' + t.title + ' BLOCKED (ครบ ' + MAX_ATTEMPTS + ' รอบ)'); }
  else { t.status = 'PLANNING'; t.error = ''; log('task', 'ส่ง task ' + t.title + ' กลับไปแก้ (รอบ ' + t.attempts + ')'); }
  t.updatedAt = now(); save(); render();
}
function agentName(aid) { var a = allAgents().find(function (x) { return x.id === aid; }); return a ? a.name : aid; }

function requestApproval(d) {
  var a = { id: uid('appr'), kind: d.kind, title: d.title, detail: d.detail || '', impact: d.impact || '',
    files: d.files || '', risk: d.risk || 'medium', requestedBy: d.requestedBy || 'director',
    createdAt: now(), status: 'pending', note: '' };
  store.approvals.unshift(a); log('approval', 'ขออนุมัติ: ' + a.title + ' [' + a.risk + ']'); save(); return a;
}
function decideApproval(id, verdict, note) {
  var a = store.approvals.find(function (x) { return x.id === id; }); if (!a) return;
  if (['approved', 'rejected', 'changes'].indexOf(verdict) < 0) return;
  a.status = verdict; a.note = note || ''; log('approval', (verdict === 'approved' ? 'อนุมัติ' : verdict === 'rejected' ? 'ปฏิเสธ' : 'ขอแก้เพิ่ม') + ': ' + a.title);
  save(); render();
}
function addKnowledge(d) {
  var k = { id: uid('know'), title: d.title, body: d.body, source: d.source || '', scope: d.scope || 'global', tags: d.tags || '', createdAt: now() };
  store.knowledge.unshift(k); log('knowledge', 'บันทึกความรู้: ' + k.title); save(); return k;
}
function addDeliverable(pid, d) {
  var p = store.projects.find(function (x) { return x.id === pid; }); if (!p) return null;
  if (!/^(agency-work|video|audio|music)\/[A-Za-z0-9._\/-]+$/.test(d.path) || d.path.indexOf('..') >= 0) { toast('path ต้องอยู่ใต้ agency-work/ video/ audio/ music/ และห้ามมี ..', 'err'); return null; }
  var v = { name: d.name, type: d.type, path: d.path, by: d.by, qa: 'pending', version: (p.deliverables.filter(function (x) { return x.name === d.name; }).length + 1), createdAt: now(), hash: hash(d.name + d.path + now()) };
  p.deliverables.push(v); p.updatedAt = now();
  log('deliver', 'ส่งมอบ ' + v.name + ' v' + v.version + ' @ ' + v.path); save(); return v;
}

/* ---------- demo seed (ติดป้าย DEMO ชัดเจน) ---------- */
function seedDemo() {
  if (store.projects.some(function (p) { return p.demo; })) { toast('มี demo data อยู่แล้ว', 'err'); return; }
  var p = addProject({ name: '[DEMO] Portfolio Site', type: 'personal', brief: 'เว็บพอร์ตโฟลิโอตัวอย่าง', ptype: 'Development Lab', priority: 'P2', revenue: 15000, costEst: 4000, demo: true });
  var t1 = addTask({ projectId: p.id, title: '[DEMO] เขียน requirement', agent: 'director', demo: true });
  var t2 = addTask({ projectId: p.id, title: '[DEMO] สร้างหน้าเว็บ', agent: 'developer', demo: true }); t2.deps = [t1.id]; t2.status = 'RUNNING'; t2.progress = 40;
  var t3 = addTask({ projectId: p.id, title: '[DEMO] ตรวจ QA', agent: 'reviewer', demo: true }); t3.deps = [t2.id];
  save(); render(); toast('โหลด demo data แล้ว (ป้าย DEMO)');
}
function clearDemo() {
  var ids = store.projects.filter(function (p) { return p.demo; }).map(function (p) { return p.id; });
  store.projects = store.projects.filter(function (p) { return !p.demo; });
  store.tasks = store.tasks.filter(function (t) { return ids.indexOf(t.projectId) < 0; });
  log('project', 'ล้าง demo data'); save(); render();
}
function mockTick() {
  var changed = 0, finished = [];
  store.tasks.forEach(function (t) {
    if (t.status === 'RUNNING') {
      t.progress = Math.min(100, (t.progress || 0) + 20); t.updatedAt = now(); changed++;
      if (t.progress >= 100) { t.status = 'COMPLETED'; finished.push(t); log('task', '[MOCK] task ' + t.title + ' → COMPLETED'); }
    }
  });
  if (!changed) toast('ไม่มี task RUNNING ให้ขยับ', 'err');
  else { log('task', '[MOCK] tick — ขยับ ' + changed + ' task'); save(); render(); finished.forEach(notifyCompleted); }
}

/* ---------- first workflow wizard ---------- */
function createWebWorkflow(name, brief) {
  var p = addProject({ name: name, type: 'personal', brief: brief, ptype: 'Development Lab', priority: 'P1' });
  var plan = addTask({ projectId: p.id, title: 'Director: สร้าง task plan', agent: 'director' });
  var rev = addTask({ projectId: p.id, title: 'Reviewer: ตรวจ plan', agent: 'reviewer' }); rev.deps = [plan.id];
  var dev = addTask({ projectId: p.id, title: 'Developer: สร้างไฟล์ใน workspace', agent: 'developer' }); dev.deps = [rev.id];
  var qa = addTask({ projectId: p.id, title: 'Reviewer: ตรวจผลลัพธ์ + QA', agent: 'reviewer' }); qa.deps = [dev.id];
  var del = addTask({ projectId: p.id, title: 'Director: สรุป + manifest ส่งมอบ', agent: 'director' }); del.deps = [qa.id];
  requestApproval({ kind: 'plan', title: 'อนุมัติ plan: ' + name, detail: brief, impact: 'เริ่มงาน 5 tasks ตาม plan', risk: 'low', requestedBy: 'director' });
  save(); render(); location.hash = '#/projects';
  toast('สร้าง workflow แล้ว + ส่งขออนุมัติ plan');
}

/* ---------- render ---------- */
var TABS = [
  ['dashboard', '◈ Command'], ['chat', '💬 Chat'], ['agents', '◉ Agents'], ['projects', '▣ Projects'],
  ['tasks', '☰ Tasks'], ['approvals', '✔ Approvals'], ['knowledge', '✎ Knowledge'],
  ['analytics', '◍ Business'], ['activity', '≋ Activity'], ['settings', '⚙ Settings']
];
var curTab = 'dashboard', curAgent = null, curProject = null, actFilter = 'all';

function badgeDemo(x) { return x ? ' <span class="demo">DEMO</span>' : ''; }
function badgeMock() { return ' <span class="demo">MOCK</span>'; }

function renderNav() {
  $('#tabs').innerHTML = TABS.map(function (t) {
    return '<button data-tab="' + t[0] + '" class="' + (curTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>';
  }).join('');
  $all('#tabs button').forEach(function (b) { b.onclick = function () { go(b.dataset.tab); }; });
}
function go(tab) { curTab = tab; if (location.hash !== '#/' + tab) location.hash = '#/' + tab; render(); window.scrollTo(0, 0); }

function render() {
  renderNav();
  var el = $('#view');
  ({ dashboard: vDashboard, chat: vChat, agents: vAgents, projects: vProjects, tasks: vTasks, approvals: vApprovals,
    knowledge: vKnowledge, analytics: vAnalytics, activity: vActivity, settings: vSettings })[curTab](el);
  refreshPill();
  if (curTab === 'agents' && window.Office) { try { window.Office.draw(); } catch (e) {} }
}

function vDashboard(el) {
  var m = metrics();
  var num = function (v) { return v == null ? 'N/A' : v.toLocaleString('th-TH'); };
  el.innerHTML =
    '<div class="grid cards">' +
    card('Active Projects', num(m.activeProjects)) + card('Pending Tasks', num(m.pending)) +
    card('Agents Working', num(m.runningAgents)) + card('Tasks Completed', num(m.done)) +
    card('Tasks Failed', num(m.failed)) + card('Pending Approvals', num(m.approvals)) +
    card('Revenue (฿)', m.revenue == null ? 'N/A' : '฿' + num(m.revenue)) +
    card('Cost (฿)', m.cost == null ? 'N/A' : '฿' + num(m.cost)) +
    card('Gross Profit (฿)', m.profit == null ? 'N/A' : '฿' + num(m.profit)) +
    card('QA First-Pass', m.qa == null ? 'N/A' : m.qa + '%') +
    '</div>' +
    '<div class="row2"><div class="panel"><h3>Quick Actions</h3><div class="btns">' +
    '<button id="q1">+ New Project</button><button id="q2">+ Web Workflow</button>' +
    '<button id="q3">→ Pending approvals (' + m.approvals + ')</button>' +
    '<button id="q4">+ Request approval</button></div></div>' +
    '<div class="panel"><h3>Data Source</h3><p class="muted">localStorage บนเครื่องนี้ · ' +
    (store.projects.length + store.tasks.length + store.approvals.length === 0
      ? 'ยังไม่มีข้อมูล — เริ่มจาก Quick Actions หรือโหลด <button id="q5" class="link">demo data (DEMO)</button>'
      : 'ข้อมูลจริงจากการใช้งาน' + (store.projects.some(function (p) { return p.demo; }) ? ' + มี DEMO ปนอยู่' : '')) +
    ' · AI provider: <b>Not Connected</b></p></div></div>' +
    '<div class="panel"><h3>Activity Timeline</h3>' + timeline(store.events.slice(0, 20)) + '</div>';
  $('#q1').onclick = function () { go('projects'); };
  $('#q2').onclick = wizard;
  $('#q3').onclick = function () { go('approvals'); };
  $('#q4').onclick = function () { go('approvals'); setTimeout(formApproval, 50); };
  var q5 = $('#q5'); if (q5) q5.onclick = seedDemo;
}
function card(k, v) { return '<div class="stat"><small>' + k + '</small><b>' + v + '</b></div>'; }
function timeline(evs) {
  if (!evs.length) return '<p class="muted">— ยังไม่มี event —</p>';
  return '<ul class="tl">' + evs.map(function (e) {
    return '<li><span class="k ' + esc(e.kind) + '">' + esc(e.kind) + '</span> ' + esc(e.text) +
      '<small>' + fmtDate(e.ts) + '</small></li>';
  }).join('') + '</ul>';
}

function vChat(el) {
  if (window.ChatUI) window.ChatUI.render(el);
  else el.innerHTML = '<p class="muted">chat module ไม่โหลด (js/chat.js)</p>';
}
function vAgents(el) {
  el.innerHTML = '<div class="office-wrap"><div class="office-main"><canvas id="office" width="960" height="600"></canvas>' +
    '<p class="muted">คลิกตัวละครเพื่อดูรายละเอียด · สถานะผูกกับ task จริงทุกตัว · ไม่มีการขยับหลอก · ไม่มี runtime ภายนอก (Not Connected) · <button id="snd" class="link">🔔 sound: on</button> · <button id="mock" class="link">run mock tick (MOCK)</button></p></div>' +
    '<div class="office-side"><div class="panel"><h3>◈ Event Callouts (จริง)</h3><div id="ocalls"></div></div>' +
    '<div class="panel"><h3>◈ ทีม self-growing</h3><div id="oros"></div>' +
    '<div class="form"><input id="h-name" placeholder="ชื่อ เช่น INTERN" maxlength="14"><input id="h-role" placeholder="หน้าที่ เช่น Helper">' +
    '<div><button id="h-add">+ Hire (จ้างจริง)</button></div></div>' +
    '<p class="muted">จ้าง = เพิ่มสมาชิกพร้อมมอบ task ได้ทันที · ลบได้เมื่อไม่มีงานค้าง</p></div></div></div>' +
    '<div class="panel"><h3>◈ Project Rooms (ตามประเภทงาน)</h3><div id="orooms"></div></div>' +
    '<div id="adetail"></div>';
  $('#mock').onclick = mockTick;
  if (curAgent) agentDetail();
}
function agentDetail() {
  var a = allAgents().find(function (x) { return x.id === curAgent; }); if (!a) return;
  var cur = agentCurrent(a.id), q = agentTasks(a.id);
  var done = store.tasks.filter(function (t) { return t.agent === a.id && t.status === 'COMPLETED'; }).slice(0, 5);
  var errs = store.tasks.filter(function (t) { return t.agent === a.id && t.error; }).slice(0, 5);
  $('#adetail').innerHTML = '<div class="panel"><h3>' + a.name + ' · ' + esc(a.role) + ' — ' + agentStatus(a.id) + '</h3>' +
    '<p>' + esc(a.desc) + '</p>' +
    '<p><b>Instructions:</b> ' + esc(a.instructions) + '</p>' +
    '<p><b>Tools:</b> ' + a.tools.map(esc).join(', ') + '</p>' +
    '<p><b>Current:</b> ' + (cur ? esc(cur.title) + ' [' + cur.status + ' ' + (cur.progress || 0) + '%]' + badgeDemo(cur.demo) : '—') + '</p>' +
    '<p><b>Queue (' + q.length + '):</b> ' + (q.map(function (t) { return esc(t.title); }).join(' · ') || '—') + '</p>' +
    '<p><b>ล่าสุด:</b> ' + (done.map(function (t) { return esc(t.title); }).join(' · ') || '—') + '</p>' +
    '<p><b>Errors:</b> ' + (errs.map(function (t) { return esc(t.title + ': ' + t.error); }).join(' · ') || '—') + '</p>' +
    (cur ? '<div class="btns"><button data-s="PAUSED">Pause</button><button data-s="RUNNING">Resume</button>' +
      '<button data-s="COMPLETED">Complete</button><button data-s="FAILED">Fail</button><button id="cancel">Cancel task</button></div>'
      : '<p class="muted">ไม่มีงานค้าง — ปุ่มควบคุมจะขึ้นเมื่อมี current task</p>') + '</div>';
  $all('#adetail [data-s]').forEach(function (b) { b.onclick = function () { setTaskStatus(cur.id, b.dataset.s); }; });
  var c = $('#cancel');
  if (c) c.onclick = function () {
    if (!confirm('ยกเลิก task นี้?')) return;
    setTaskStatus(cur.id, 'FAILED', { error: 'ยกเลิกโดยมนุษย์' });
  };
}

function vProjects(el) {
  var h = '<div class="panel"><h3>New Project</h3><div class="form">' +
    '<input id="p-name" placeholder="ชื่อโปรเจกต์ *">' +
    '<select id="p-ptype">' + PTYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>' +
    '<select id="p-type"><option value="personal">Personal</option><option value="client">Client</option></select>' +
    '<select id="p-pri"><option>P0</option><option selected>P1</option><option>P2</option><option>P3</option></select>' +
    '<input id="p-client" placeholder="ลูกค้า (ถ้ามี)"><input id="p-dead" type="date">' +
    '<input id="p-rev" type="number" min="0" placeholder="Revenue ฿ (ว่าง = N/A)">' +
    '<input id="p-cost" type="number" min="0" placeholder="ต้นทุนจริง ฿ (ว่าง = N/A)">' +
    '<textarea id="p-brief" placeholder="brief"></textarea>' +
    '<div><button id="p-add">สร้างโปรเจกต์</button> <button id="p-wiz">+ ใช้ Web Workflow wizard</button></div>' +
    '<div><select id="p-ep"><option value="ep1">EP1 · JEPQ</option><option value="ep2">EP2 · QQQI</option><option value="ep3">EP3 · Beatmaking</option><option value="ep4">EP4 · Mix</option></select>' +
    '<button id="p-import">🎬 นำเข้า EP จาก Genvideo (ตรวจไฟล์จริง)</button></div></div></div>';
  h += '<div class="list">' + (store.projects.length ? store.projects.map(function (p) {
    var ts = tasksOf(p.id), open = ts.filter(function (t) { return t.status !== 'COMPLETED' && t.status !== 'FAILED'; }).length;
    return '<button class="item" data-p="' + p.id + '"><b>' + esc(p.name) + '</b>' + badgeDemo(p.demo) +
      '<small>' + esc(p.ptype) + ' · ' + esc(p.type) + ' · ' + esc(p.status) + ' · ' + esc(p.priority) +
      ' · tasks ' + ts.length + ' (ค้าง ' + open + ')' +
      (p.deadline ? ' · ⏰ ' + esc(p.deadline) : '') +
      ' · rev ' + (p.revenue != null && p.revenue !== '' ? '฿' + Number(p.revenue).toLocaleString() : 'N/A') + '</small></button>';
  }).join('') : '<p class="muted">— ยังไม่มีโปรเจกต์ —</p>') + '</div><div id="pdetail"></div>';
  el.innerHTML = h;
  $('#p-add').onclick = function () {
    var name = $('#p-name').value.trim(); if (!name) { toast('ต้องมีชื่อโปรเจกต์', 'err'); return; }
    var rev = $('#p-rev').value === '' ? undefined : Number($('#p-rev').value);
    var cost = $('#p-cost').value === '' ? undefined : Number($('#p-cost').value);
    addProject({ name: name, ptype: $('#p-ptype').value, type: $('#p-type').value, priority: $('#p-pri').value, client: $('#p-client').value.trim(), deadline: $('#p-dead').value, revenue: rev, costActual: cost, brief: $('#p-brief').value.trim() });
    render(); toast('สร้างโปรเจกต์แล้ว');
  };
  $('#p-wiz').onclick = wizard;
  $('#p-import').onclick = function () { importEpisode($('#p-ep').value); };
  $all('.item', el).forEach(function (b) { b.onclick = function () { curProject = b.dataset.p; projectDetail(); }; });
  if (curProject) projectDetail();
}
function projectDetail() {
  var p = store.projects.find(function (x) { return x.id === curProject; }); if (!p) return;
  var ts = tasksOf(p.id);
  var h = '<div class="panel"><h3>' + esc(p.name) + badgeDemo(p.demo) + '</h3>' +
    '<p class="muted">' + esc(p.ptype) + ' · ' + esc(p.type) + (p.client ? ' · ลูกค้า: ' + esc(p.client) : '') +
    ' · ' + esc(p.status) + ' · ' + esc(p.priority) + (p.deadline ? ' · ⏰ ' + esc(p.deadline) : '') + '</p>' +
    (p.brief ? '<p>' + esc(p.brief) + '</p>' : '') +
    '<p>rev ' + (p.revenue != null && p.revenue !== '' ? '฿' + Number(p.revenue).toLocaleString() : 'N/A') +
    ' · cost ' + (p.costActual != null && p.costActual !== '' ? '฿' + Number(p.costActual).toLocaleString() : 'N/A') +
    ' · revisions ' + p.revisions + '</p>' +
    '<h4>Tasks (' + ts.length + ')</h4>' + (ts.length ? '<ul class="tl">' + ts.map(function (t) {
      return '<li><span class="k task">' + t.status + '</span> ' + esc(t.title) + ' → ' + agentName(t.agent) +
        (t.attempts ? ' · รอบแก้ ' + t.attempts + '/' + MAX_ATTEMPTS : '') + badgeDemo(t.demo) + '</li>';
    }).join('') + '</ul>' : '<p class="muted">— ไม่มี task —</p>') +
    '<h4>Deliverables (' + p.deliverables.length + ')</h4>' +
    (p.deliverables.length ? '<ul class="tl">' + p.deliverables.map(function (d) {
      return '<li>' + esc(d.name) + ' v' + d.version + ' · ' + esc(d.type) + ' · <code>' + esc(d.path) + '</code> · QA ' + d.qa + ' · #' + d.hash + '</li>';
    }).join('') + '</ul>' : '<p class="muted">— ยังไม่มีไฟล์ส่งมอบ —</p>') +
    '<div class="form"><b>เพิ่ม deliverable (ไฟล์ต้องมีอยู่จริงใน path)</b>' +
    '<input id="d-name" placeholder="ชื่อไฟล์ *"><input id="d-type" placeholder="ประเภท (pdf/zip/mp3/...)">' +
    '<input id="d-path" placeholder="agency-work/... *"><input id="d-by" placeholder="agent ผู้สร้าง">' +
    '<div><button id="d-add">บันทึก manifest</button> <button id="d-dl">ดาวน์โหลด manifest (JSON)</button> ' +
    '<button id="p-del">ลบโปรเจกต์</button></div></div></div>';
  $('#pdetail').innerHTML = h;
  $('#d-add').onclick = function () {
    var name = $('#d-name').value.trim(), path = $('#d-path').value.trim();
    if (!name || !path) { toast('ต้องมีชื่อไฟล์และ path', 'err'); return; }
    if (addDeliverable(p.id, { name: name, type: $('#d-type').value.trim() || 'file', path: path, by: $('#d-by').value.trim() || 'human' })) { render(); projectDetail(); toast('บันทึกแล้ว'); }
  };
  $('#d-dl').onclick = function () { download(p.id + '-manifest.json', JSON.stringify({ project: p.name, at: now(), files: p.deliverables }, null, 2)); };
  $('#p-del').onclick = function () {
    if (!confirm('ลบโปรเจกต์ + tasks ทั้งหมด? (กู้ไม่ได้ถ้าไม่ export ไว้)')) return;
    store.projects = store.projects.filter(function (x) { return x.id !== p.id; });
    store.tasks = store.tasks.filter(function (t) { return t.projectId !== p.id; });
    log('project', 'ลบโปรเจกต์ ' + p.name); curProject = null; save(); render();
  };
}
function wizard() {
  var name = prompt('ชื่อโปรเจกต์เว็บ:', 'My Web Project');
  if (!name) return;
  var brief = prompt('Requirement สั้นๆ:', '') || '';
  createWebWorkflow(name.trim(), brief.trim());
}

function vTasks(el) {
  var h = '<div class="panel"><h3>New Task</h3><div class="form">' +
    '<select id="t-proj">' + store.projects.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('') + '</select>' +
    '<input id="t-title" placeholder="ชื่องาน *">' +
    '<select id="t-agent">' + allAgents().map(function (a) { return '<option value="' + a.id + '">' + a.name + ' · ' + esc(a.role) + '</option>'; }).join('') + '</select>' +
    '<select id="t-pri"><option>P0</option><option selected>P1</option><option>P2</option><option>P3</option></select>' +
    '<textarea id="t-desc" placeholder="รายละเอียด"></textarea>' +
    '<input id="t-deps" placeholder="depends on: ชื่อ task ในโปรเจกต์เดียวกัน คั่นด้วย ,">' +
    '<div><button id="t-add">สร้าง task</button></div></div>' +
    (store.projects.length ? '' : '<p class="muted">ต้องมีโปรเจกต์ก่อน — <button class="link" id="t-gp">ไปสร้างโปรเจกต์</button></p>') + '</div>';
  h += '<div class="list">' + (store.tasks.length ? store.tasks.map(function (t) {
    var p = store.projects.find(function (x) { return x.id === t.projectId; });
    return '<div class="item"><b>' + esc(t.title) + '</b>' + badgeDemo(t.demo) +
      '<small>' + esc(p ? p.name : '(โปรเจกต์ถูกลบ)') + ' → ' + agentName(t.agent) + ' · ' + t.status +
      ' · ' + t.priority + ' · ' + (t.progress || 0) + '%' +
      (t.attempts ? ' · แก้ ' + t.attempts + '/' + MAX_ATTEMPTS : '') +
      (t.error ? ' · ⚠ ' + esc(t.error) : '') + '</small>' +
      '<div class="btns"><select data-st="' + t.id + '">' + TASK_STATUS.map(function (s) {
        return '<option' + (t.status === s ? ' selected' : '') + '>' + s + '</option>';
      }).join('') + '</select>' +
      '<button data-qa="' + t.id + '">QA ' + (t.qa === 'pending' ? '⏳' : t.qa === 'pass' ? '✅' : '❌') + '</button>' +
      '<button data-ai="' + t.id + '">✨ AI</button>' +
      '<button data-re="' + t.id + '">ส่งกลับแก้</button>' +
      '<button data-del="' + t.id + '">ลบ</button></div></div>';
  }).join('') : '<p class="muted">— ยังไม่มี task —</p>') + '</div>';
  el.innerHTML = h;
  var gp = $('#t-gp'); if (gp) gp.onclick = function () { go('projects'); };
  $('#t-add').onclick = function () {
    var title = $('#t-title').value.trim();
    if (!$('#t-proj').value) { toast('ต้องมีโปรเจกต์ก่อน', 'err'); return; }
    if (!title) { toast('ต้องมีชื่องาน', 'err'); return; }
    var pid = $('#t-proj').value;
    var deps = [], missing = 0;
    $('#t-deps').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (n) {
      var f = store.tasks.find(function (x) { return x.projectId === pid && x.title === n; });
      if (f) deps.push(f.id); else missing++;
    });
    if (missing) toast('หา task ไม่เจอ ' + missing + ' ชื่อ (ข้ามไป)', 'err');
    addTask({ projectId: pid, title: title, agent: $('#t-agent').value, priority: $('#t-pri').value, desc: $('#t-desc').value.trim(), deps: deps });
    render(); toast('สร้าง task แล้ว');
  };
  $all('[data-st]', el).forEach(function (s) { s.onchange = function () { setTaskStatus(s.dataset.st, s.value); }; });
  $all('[data-qa]', el).forEach(function (b) {
    b.onclick = function () {
      var t = store.tasks.find(function (x) { return x.id === b.dataset.qa; }); if (!t) return;
      t.qa = t.qa === 'pending' ? 'pass' : t.qa === 'pass' ? 'fail' : 'pending';
      if (t.qa === 'pass') t.status = 'COMPLETED';
      t.updatedAt = now(); log('task', 'QA ' + t.title + ' → ' + t.qa); save(); render();
      if (t.qa === 'pass') notifyCompleted(t);
    };
  });
  $all('[data-re]', el).forEach(function (b) { b.onclick = function () { retryTask(b.dataset.re); }; });
  $all('[data-ai]', el).forEach(function (b) { b.onclick = function () { runAIAssist(b.dataset.ai); }; });
  $all('[data-del]', el).forEach(function (b) {
    b.onclick = function () {
      var t = store.tasks.find(function (x) { return x.id === b.dataset.del; });
      if (!t || !confirm('ลบ task นี้?')) return;
      store.tasks = store.tasks.filter(function (x) { return x.id !== t.id; });
      log('task', 'ลบ task ' + t.title); save(); render();
    };
  });
}

function vApprovals(el) {
  var kinds = ['plan', 'scope', 'quotation', 'external-service', 'deployment', 'publishing', 'destructive', 'data-transfer'];
  var h = '<div class="panel"><h3>Request Approval</h3><div class="form" id="fa" style="display:none">' +
    '<select id="a-kind">' + kinds.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select>' +
    '<select id="a-risk"><option value="low">risk: low</option><option value="medium" selected>risk: medium</option><option value="high">risk: high</option></select>' +
    '<input id="a-title" placeholder="เรื่อง *"><textarea id="a-detail" placeholder="รายละเอียด + เหตุผล + ผลกระทบ"></textarea>' +
    '<input id="a-files" placeholder="ไฟล์/ทรัพยากรที่เกี่ยวข้อง">' +
    '<div><button id="a-add">ส่งขออนุมัติ</button></div></div>' +
    '<div><button id="a-show">+ ขออนุมัติใหม่</button></div></div>';
  h += '<div class="list">' + (store.approvals.length ? store.approvals.map(function (a) {
    return '<div class="item"><b>[' + esc(a.kind) + '/' + esc(a.risk) + '] ' + esc(a.title) + '</b>' +
      '<small>ขอโดย ' + esc(a.requestedBy) + ' · ' + fmtDate(a.createdAt) + ' · สถานะ <b>' + a.status + '</b>' +
      (a.detail ? '<br>' + esc(a.detail) : '') + (a.files ? '<br>files: ' + esc(a.files) : '') +
      (a.note ? '<br>note: ' + esc(a.note) : '') + '</small>' +
      (a.status === 'pending' ? '<div class="btns"><button data-ok="' + a.id + '">Approve</button>' +
        '<button data-no="' + a.id + '">Reject</button><button data-ch="' + a.id + '">Request changes</button></div>'
        : '') + '</div>';
  }).join('') : '<p class="muted">— ไม่มีรายการรออนุมัติ —</p>') + '</div>' +
    '<p class="muted">L4 (deploy / ลบข้อมูล / ส่งข้อมูลลูกค้าออก / เผยแพร่ / ซื้อบริการ) ต้องได้รับอนุมัติที่นี่ก่อน — การอนุมัติครั้งเดียวไม่ครอบคลุม action เสี่ยงสูงครั้งต่อไป</p>';
  el.innerHTML = h;
  $('#a-show').onclick = function () { $('#fa').style.display = ''; };
  $('#a-add').onclick = function () {
    var title = $('#a-title').value.trim(); if (!title) { toast('ต้องมีเรื่อง', 'err'); return; }
    requestApproval({ kind: $('#a-kind').value, risk: $('#a-risk').value, title: title, detail: $('#a-detail').value.trim(), files: $('#a-files').value.trim() });
    render(); toast('ส่งขออนุมัติแล้ว');
  };
  $all('[data-ok]', el).forEach(function (b) { b.onclick = function () { decideApproval(b.dataset.ok, 'approved'); }; });
  $all('[data-no]', el).forEach(function (b) {
    b.onclick = function () { var n = prompt('เหตุผลที่ปฏิเสธ:', '') || ''; decideApproval(b.dataset.no, 'rejected', n); };
  });
  $all('[data-ch]', el).forEach(function (b) {
    b.onclick = function () { var n = prompt('สิ่งที่ต้องแก้:', '') || ''; decideApproval(b.dataset.ch, 'changes', n); };
  });
}
function formApproval() { var f = $('#fa'); if (f) f.style.display = ''; }

function vKnowledge(el) {
  var h = '<div class="panel"><h3>New Entry</h3><div class="form">' +
    '<input id="k-title" placeholder="หัวข้อ *"><input id="k-source" placeholder="แหล่งที่มา">' +
    '<select id="k-scope"><option value="global">global</option><option value="client">client-specific (ต้องได้รับอนุญาตก่อนแชร์)</option></select>' +
    '<input id="k-tags" placeholder="tags คั่นด้วย ,">' +
    '<textarea id="k-body" placeholder="เนื้อหา"></textarea>' +
    '<div><button id="k-add">บันทึก</button></div></div></div>';
  h += '<div class="list">' + (store.knowledge.length ? store.knowledge.map(function (k) {
    return '<div class="item"><b>' + esc(k.title) + '</b><small>[' + esc(k.scope) + '] ' + esc(k.source || '—') +
      ' · ' + fmtDate(k.createdAt) + (k.tags ? ' · #' + esc(k.tags) : '') + '<br>' + esc(k.body) + '</small>' +
      '<div class="btns"><button data-kd="' + k.id + '">ลบ</button></div></div>';
  }).join('') : '<p class="muted">— ยังไม่มีความรู้ที่บันทึก —</p>') + '</div>';
  el.innerHTML = h;
  $('#k-add').onclick = function () {
    var title = $('#k-title').value.trim(); if (!title) { toast('ต้องมีหัวข้อ', 'err'); return; }
    addKnowledge({ title: title, source: $('#k-source').value.trim(), scope: $('#k-scope').value, tags: $('#k-tags').value.trim(), body: $('#k-body').value.trim() });
    render(); toast('บันทึกแล้ว');
  };
  $all('[data-kd]', el).forEach(function (b) {
    b.onclick = function () {
      store.knowledge = store.knowledge.filter(function (k) { return k.id !== b.dataset.kd; });
      log('knowledge', 'ลบ entry'); save(); render();
    };
  });
}

function vAnalytics(el) {
  var m = metrics();
  var num = function (v) { return v == null ? 'N/A' : v.toLocaleString('th-TH'); };
  var margin = (m.revenue != null && m.cost != null && m.revenue > 0) ? Math.round((m.revenue - m.cost) / m.revenue * 100) + '%' : 'N/A';
  var doneProj = store.projects.filter(function (p) { return p.status === 'done'; });
  var onTime = doneProj.length ? doneProj.filter(function (p) { return p.deadline && p.updatedAt.slice(0, 10) <= p.deadline; }).length + '/' + doneProj.length : 'N/A';
  el.innerHTML = '<div class="grid cards">' +
    card('Projects Completed', num(doneProj.length)) + card('Tasks Completed', num(m.done)) +
    card('On-Time', onTime) + card('QA First-Pass', m.qa == null ? 'N/A' : m.qa + '%') +
    card('Revenue (actual)', m.revenue == null ? 'N/A' : '฿' + num(m.revenue)) +
    card('Direct Costs (actual)', m.cost == null ? 'N/A' : '฿' + num(m.cost)) +
    card('Gross Profit', m.profit == null ? 'N/A' : '฿' + num(m.profit)) +
    card('Gross Margin', margin) + '</div>' +
    '<div class="panel"><h3>สูตร (คำนวณจากข้อมูลจริงเท่านั้น)</h3>' +
    '<p class="muted">Gross Profit = Revenue − Direct Costs · Margin % = Profit ÷ Revenue × 100 (เมื่อ Revenue &gt; 0) · ' +
    'On-Time = โปรเจกต์ส่งทัน deadline ÷ โปรเจกต์ที่ส่งแล้ว · QA First-Pass = deliverable ผ่านครั้งแรก ÷ ที่ตรวจครั้งแรกทั้งหมด · ' +
    'รายได้ที่ยังไม่ได้รับจริงจะไม่ถูกนับ · Time Saved เป็นค่าประมาณ — ยังไม่มีข้อมูลพอจึงไม่แสดง</p></div>';
}

function vActivity(el) {
  var kinds = ['all', 'project', 'task', 'approval', 'knowledge', 'deliver'];
  var list = actFilter === 'all' ? store.events : store.events.filter(function (e) { return e.kind === actFilter; });
  el.innerHTML = '<div class="btns">' + kinds.map(function (k) {
    return '<button data-f="' + k + '" class="' + (actFilter === k ? 'on' : '') + '">' + k + '</button>';
  }).join('') + '</div><div class="panel">' + timeline(list.slice(0, 100)) + '</div>';
  $all('[data-f]', el).forEach(function (b) { b.onclick = function () { actFilter = b.dataset.f; render(); }; });
}

function vSettings(el) {
  el.innerHTML =
    '<div class="panel"><h3>AI Provider — <span id="pv-state">…</span></h3>' +
    '<p class="muted">key อยู่ใน memory เท่านั้น — หายเมื่อปิด/รีเฟรชหน้า · ไม่ถูกบันทึก ไม่ถูก log · free tier มีโควต้าจำกัด <button class="link" id="pv-limits">เช็กโควต้า</button></p>' +
    '<div class="form">' +
    '<select id="pv-active"><option value="mock">mock (ไม่เรียกจริง)</option><option value="openrouter">openrouter — :free, OpenAI-compatible</option><option value="gemini">gemini — free tier</option></select>' +
    '<input id="pv-model" placeholder="model เช่น openrouter/free">' +
    '<input id="pv-fallback" placeholder="fallback model (ว่างได้)">' +
    '<input id="pv-key" type="password" placeholder="session key — ใส่แล้วหายเมื่อปิดหน้า" autocomplete="off">' +
    '<input id="pv-retries" type="number" min="0" max="4" placeholder="retries 0–4">' +
    '<input id="pv-timeout" type="number" min="5000" step="5000" placeholder="timeout ms">' +
    '<div class="btns"><button id="pv-save">บันทึก config</button><button id="pv-test">Test call</button><button id="pv-clear">ล้าง key</button></div></div>' +
    '<h4>Usage ล่าสุด (token เป็นค่าประมาณ ~ตัวอักษร/4)</h4><div id="pv-use"></div></div>' +
    '<table class="perm"><tr><th>Level</th><th>ขอบเขต</th><th>ต้องอนุมัติ</th></tr>' +
    '<tr><td>L0</td><td>อ่านไฟล์/ข้อมูลที่อนุญาต</td><td>—</td></tr>' +
    '<tr><td>L1</td><td>เขียนไฟล์ใน workspace โปรเจกต์</td><td>—</td></tr>' +
    '<tr><td>L2</td><td>รันคำสั่งใน allowlist</td><td>—</td></tr>' +
    '<tr><td>L3</td><td>git branch/diff/commit</td><td>—</td></tr>' +
    '<tr><td>L4</td><td>deploy / ลบข้อมูล / ส่งข้อมูลออก / เผยแพร่ / ซื้อบริการ</td><td>มนุษย์ทุกครั้ง</td></tr></table></div>' +
    '<div class="panel"><h3>Demo / Mock</h3><div class="btns">' +
    '<button id="s-seed">โหลด demo data (DEMO)</button><button id="s-clear">ล้าง demo data</button>' +
    '<button id="s-tick">run mock tick (MOCK)</button></div></div>' +
    '<div class="panel"><h3>Backup / Restore</h3><div class="btns">' +
    '<button id="s-exp">Export JSON</button><button id="s-imp">Import JSON</button>' +
    '<button id="s-wipe">ล้างข้อมูลทั้งหมด</button></div>' +
    '<input type="file" id="s-file" accept=".json" style="display:none"></div>' +
    '<div class="panel"><h3>ข้อจำกัด</h3><p class="muted">static hosting — ไม่มี backend/SQLite บน Pages · secrets ห้ามใส่ในหน้านี้ · ' +
    'deploy/prod ต้องอนุมัติมนุษย์ · งบ 0 บาท: ใช้ local-first + free tier ที่ตรวจสอบแล้วเท่านั้น</p></div>';
  $('#s-seed').onclick = seedDemo;
  $('#s-clear').onclick = clearDemo;
  $('#s-tick').onclick = mockTick;
  $('#s-exp').onclick = function () { download('agency-backup-' + Date.now() + '.json', JSON.stringify(store, null, 2)); toast('export แล้ว'); };
  $('#s-imp').onclick = function () { $('#s-file').click(); };
  $('#s-file').onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = JSON.parse(r.result);
        if (!s || !Array.isArray(s.projects) || !Array.isArray(s.tasks)) throw new Error('bad file');
        store = s; save(); log('project', 'restore จากไฟล์ ' + f.name); save(); render(); toast('restore แล้ว');
      } catch (err) { toast('ไฟล์ไม่ถูกต้อง', 'err'); }
    };
    r.readAsText(f);
  };
  $('#s-wipe').onclick = function () {
    if (!confirm('ล้างข้อมูล agency ทั้งหมด? (export ไว้ก่อนถ้าต้องการ)')) return;
    store = blank(); save(); log('project', 'ล้างข้อมูลทั้งหมด'); save(); render();
  };
  wireProvider();
}
function wireProvider() {
  if (!window.Provider) return;
  var c = window.Provider.cfg();
  $('#pv-active').value = c.active; $('#pv-model').value = c.model;
  $('#pv-fallback').value = c.fallback || ''; $('#pv-retries').value = c.retries; $('#pv-timeout').value = c.timeoutMs;
  $('#pv-state').textContent = c.active === 'mock' ? 'MOCK' : (c.active + (window.Provider.hasKey() ? ' · key พร้อม' : ' · ไม่มี key'));
  renderUse();
  $('#pv-save').onclick = function () {
    window.Provider.saveCfg({ active: $('#pv-active').value, model: $('#pv-model').value.trim() || 'openrouter/free',
      fallback: $('#pv-fallback').value.trim(), retries: Number($('#pv-retries').value || 2), timeoutMs: Number($('#pv-timeout').value || 45000) });
    var k = $('#pv-key').value; if (k) { window.Provider.setKey(k); $('#pv-key').value = ''; }
    save(); render(); toast('บันทึก provider config แล้ว (key ไม่ถูกบันทึก)');
  };
  $('#pv-test').onclick = async function () {
    toast('🤖 test call…');
    var r = await window.Provider.test();
    toast(r.ok ? '✅ ต่อได้ (' + r.model + ' · ' + r.ms + 'ms)' : '❌ [' + r.cls + '] ' + r.error, r.ok ? '' : 'err');
    render();
  };
  $('#pv-clear').onclick = function () { window.Provider.clearKey(); render(); toast('ล้าง key จาก memory แล้ว'); };
  $('#pv-limits').onclick = async function () {
    toast('กำลังเช็กโควต้า…');
    var q = await window.Provider.quota();
    toast(q.ok ? '✅ ' + q.text : '❌ ' + q.error, q.ok ? '' : 'err');
  };
}
function renderUse() {
  var box = $('#pv-use'); if (!box || !window.Provider) return;
  var u = window.Provider.usage().slice(0, 10);
  box.innerHTML = u.length ? '<ul class="tl">' + u.map(function (x) {
    return '<li><span class="k ' + (x.ok ? 'task' : 'approval') + '">' + (x.ok ? 'ok' : esc(x.err || 'fail')) + '</span>' +
      esc(x.provider) + ' · ' + esc(x.model) + ' · ' + x.ms + 'ms' +
      (x.ok ? ' · in~' + x.inEst + ' out~' + x.outEst : '') + '<small>' + fmtDate(x.ts) + '</small></li>';
  }).join('') + '</ul>' : '<p class="muted">— ยังไม่มีการเรียก —</p>';
}

/* ---------- Genvideo bridge (catalog + นำเข้า EP พร้อมตรวจไฟล์จริง) ---------- */
var EPISODES = [
  { id: 'ep1', code: 'EP1', title: 'JEPQ คืออะไร? ทำไมจ่ายรายเดือนสูง', desc: 'ETF JPMorgan จ่ายรายเดือน · 85 วิ 1080×1920 ซับไทย+พากย์ไทย+ดนตรี', dur: '85 วิ',
    assets: [{ name: 'jepq-ep1.mp4', type: 'mp4', path: 'video/jepq/jepq-ep1.mp4' }, { name: 'subtitles.srt', type: 'srt', path: 'video/jepq/subtitles.srt' }, { name: 'SCRIPT_TH.md', type: 'md', path: 'video/jepq/SCRIPT_TH.md' }] },
  { id: 'ep2', code: 'EP2', title: 'QQQI เงินปันผลทุกเดือน แลกกับอะไรบ้าง?', desc: 'ETF NEOS Nasdaq-100 + ออปชัน · 105 วิ พากย์ไทย lo-fi', dur: '105 วิ',
    assets: [{ name: 'qqqi-ep1.mp4', type: 'mp4', path: 'video/qqqi/qqqi-ep1.mp4' }, { name: 'subtitles.srt', type: 'srt', path: 'video/qqqi/subtitles.srt' }, { name: 'SCRIPT_TH.md', type: 'md', path: 'video/qqqi/SCRIPT_TH.md' }] },
  { id: 'ep3', code: 'EP3', title: 'เริ่มทำบีทใน FL Studio จากศูนย์', desc: 'สอนวางดรัมแพทเทิร์นแรกทีละขั้น · พากย์โคลน+ซับไทย+ดนตรี lo-fi', dur: '93 วิ',
    assets: [{ name: 'beat-ep1.mp4', type: 'mp4', path: 'video/beat-ep1/beat-ep1.mp4' }, { name: 'subtitles.srt', type: 'srt', path: 'video/beat-ep1/subtitles.srt' }, { name: 'SCRIPT_TH.md', type: 'md', path: 'video/beat-ep1/SCRIPT_TH.md' }] }
  ,{ id: 'ep4', code: 'EP4', title: 'มิกซ์บีทหลังทำเสร็จ', desc: 'สอนมิกซ์เบื้องต้น balance/EQ/pan/reverb · ซับคาราโอเกะ', dur: '38 วิ',
    assets: [{ name: 'mix-ep4.mp4', type: 'mp4', path: 'video/mix-ep4/mix-ep4.mp4' }, { name: 'subtitles.srt', type: 'srt', path: 'video/mix-ep4/subtitles.srt' }, { name: 'SCRIPT.md', type: 'md', path: 'video/mix-ep4/SCRIPT.md' }] }
];
async function importEpisode(epId) {
  var ep = EPISODES.find(function (e) { return e.id === epId; });
  if (!ep) { toast('ไม่รู้จัก EP นี้', 'err'); return false; }
  if (store.projects.some(function (p) { return p.videoEp === epId; })) { toast('นำเข้า ' + ep.code + ' แล้ว (ไม่ทำซ้ำ)', 'err'); return false; }
  toast('กำลังตรวจไฟล์จริงของ ' + ep.code + '…');
  var found = [];
  for (var i = 0; i < ep.assets.length; i++) {
    try { var r = await fetch(ep.assets[i].path, { method: 'HEAD' }); if (r && r.ok) found.push(ep.assets[i]); } catch (e) {}
  }
  var p = addProject({ name: '[' + ep.code + '] ' + ep.title, ptype: 'Content Studio', type: 'personal', priority: 'P2', brief: ep.desc + ' · ' + ep.dur });
  p.videoEp = epId;
  found.forEach(function (a) { addDeliverable(p.id, { name: a.name, type: a.type, path: a.path, by: 'video-engine' }); });
  var t1 = addTask({ projectId: p.id, title: 'MUSE: สคริปต์+สตอรี่บอร์ด', agent: 'content' });
  var t2 = addTask({ projectId: p.id, title: 'MAESTRO: พากย์ไทย+ดนตรี', agent: 'music' }); t2.deps = [t1.id];
  var t3 = addTask({ projectId: p.id, title: 'MUSE: ตัดต่อ+ซับไตเติล', agent: 'content' }); t3.deps = [t2.id];
  var t4 = addTask({ projectId: p.id, title: 'JUDGE: QA+factcheck', agent: 'reviewer' }); t4.deps = [t3.id];
  save(); curProject = p.id; go('projects');
  toast('นำเข้า ' + ep.code + ' แล้ว — ไฟล์จริง ' + found.length + '/' + ep.assets.length);
  return true;
}

/* ---------- GenMusic bridge ---------- */
async function importMusic(trackId) {
  var tracks = [];
  try { tracks = await (await fetch('music/tracks.json')).json(); } catch (e) {}
  var tr = tracks.find(function (x) { return x.id === trackId; });
  if (!tr) { toast('ไม่เจอเพลง ' + trackId, 'err'); return false; }
  if (store.projects.some(function (p) { return p.musicId === trackId; })) { toast('นำเข้าเพลงนี้แล้ว', 'err'); return false; }
  var okFile = false;
  try { var r = await fetch(tr.file, { method: 'HEAD' }); okFile = !!(r && r.ok); } catch (e) {}
  var p = addProject({ name: '[MUSIC] ' + tr.id, ptype: 'Music Studio', type: 'personal', priority: 'P2', brief: tr.desc + ' · ' + tr.mood + ' ' + tr.bpm + 'BPM' });
  p.musicId = trackId;
  if (okFile) addDeliverable(p.id, { name: tr.id + '.mp3', type: 'mp3', path: tr.file, by: 'genmusic-engine' });
  var t1 = addTask({ projectId: p.id, title: 'MAESTRO: compose/arrange', agent: 'music' });
  var t2 = addTask({ projectId: p.id, title: 'MAESTRO: mix + master', agent: 'music' }); t2.deps = [t1.id];
  var t3 = addTask({ projectId: p.id, title: 'JUDGE: QA + license check', agent: 'reviewer' }); t3.deps = [t2.id];
  save(); curProject = p.id; go('projects');
  toast('นำเข้าเพลงแล้ว' + (okFile ? ' (ไฟล์จริง)' : ' (ไม่เจอไฟล์ — มีแค่โปรเจกต์)'));
  return true;
}
function requestMusic(mood, dur) {
  var p = addProject({ name: '[MUSIC-REQ] ' + mood + ' ' + dur + 's', ptype: 'Music Studio', type: 'personal', priority: 'P2', brief: 'ขอเพลงใหม่: ' + mood + ' ยาว ' + dur + ' วินาที (compose รอบถัดไป)' });
  addTask({ projectId: p.id, title: 'MAESTRO: compose เพลงใหม่ (' + mood + ')', agent: 'music' });
  save(); curProject = p.id; go('projects');
  toast('ส่งคำขอเพลงใหม่เข้า Agency แล้ว');
}

/* ---------- public API (ให้ office.js เรียก) ---------- */
function selectAgent(id) { curAgent = id; agentDetail(); }
function openProject(id) { curProject = id; go('projects'); }
function notifyCompleted(t) {
  try { if (window.OfficeSound) window.OfficeSound.play(); } catch (e) {}
  toast('✅ เสร็จ: ' + t.title);
}
async function runAIAssist(id) {
  if (!window.Provider) { toast('provider module ไม่โหลด', 'err'); return; }
  var t = store.tasks.find(function (x) { return x.id === id; }); if (!t) return;
  var p = store.projects.find(function (x) { return x.id === t.projectId; });
  var ag = allAgents().find(function (a) { return a.id === t.agent; });
  toast('🤖 ' + agentName(t.agent) + ' กำลังขอ AI ช่วย…');
  var r = await window.Provider.call({
    system: 'You are ' + agentName(t.agent) + ' (' + ((ag && ag.role) || 'agent') + ') in a small AI agency run by ET1CRUEL. Answer in Thai, concise and actionable.',
    user: 'Project: ' + (p ? p.name + ' — ' + (p.brief || '(no brief)') : '(none)') +
      '\nTask: ' + t.title + '\nDetail: ' + (t.desc || '(none)') +
      '\n\nGive a concrete draft or step-by-step plan for this task. If info is insufficient, list exactly what is missing.',
    maxTokens: 600 });
  if (r.ok) {
    t.output = '[AI-DRAFT · ' + r.model + (r.mocked ? ' · MOCK' : '') + ' · ' + r.ms + 'ms]\n' + r.text;
    t.updatedAt = now(); log('task', 'AI ช่วย task ' + t.title + ' (' + r.model + ')'); save(); render(); toast('AI ตอบแล้ว — ผลอยู่ใน task output');
  } else {
    t.error = 'AI fail (' + r.cls + '): ' + r.error; t.updatedAt = now();
    log('task', 'AI ล้มเหลว task ' + t.title + ' [' + r.cls + ']'); save(); render();
    toast('AI ล้มเหลว [' + r.cls + ']: ' + r.error, 'err');
  }
}
function refreshPill() {
  try {
    var p = document.getElementById('aipill'); if (!p || !window.Provider) return;
    var c = window.Provider.cfg();
    if (c.active === 'mock') { p.textContent = 'AI: MOCK'; p.className = 'pill'; }
    else if (window.Provider.hasKey()) { p.textContent = 'AI: READY (' + c.active + ')'; p.className = 'pill'; }
    else { p.textContent = 'AI: NOT CONNECTED'; p.className = 'pill nc'; }
  } catch (e) {}
}
function hireAgent(d) {
  var name = String(d.name || '').trim().toUpperCase().slice(0, 14);
  if (!name) { toast('ต้องมีชื่อ', 'err'); return false; }
  if (allAgents().some(function (a) { return a.name === name; })) { toast('ชื่อซ้ำ', 'err'); return false; }
  var a = { id: uid('agent'), name: name, role: String(d.role || '').trim() || 'Helper',
    desc: 'สมาชิกที่จ้างเพิ่ม', tools: ['task.read', 'note.write'],
    instructions: 'ทำตาม task ที่ได้รับ · งานเสี่ยงสูงต้องผ่าน approval', custom: true };
  store.customAgents.push(a); log('project', 'จ้างสมาชิกใหม่: ' + name); save(); render(); toast('จ้าง ' + name + ' แล้ว');
  return true;
}
function removeAgent(id) {
  var i = store.customAgents.findIndex(function (a) { return a.id === id; }); if (i < 0) return;
  if (store.tasks.some(function (t) { return t.agent === id && t.status !== 'COMPLETED' && t.status !== 'FAILED'; })) { toast('ยังมีงานค้าง — ลบไม่ได้', 'err'); return; }
  var n = store.customAgents[i].name; store.customAgents.splice(i, 1);
  log('project', 'ให้ออก: ' + n); save(); render();
}
function findProjectByName(nm) {
  var q = String(nm || '').trim().toLowerCase(); if (!q) return null;
  var ex = store.projects.find(function (p) { return p.name.toLowerCase() === q; });
  if (ex) return ex;
  var c = store.projects.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0; });
  return c.length === 1 ? c[0] : (c.length ? 'ambiguous' : null);
}
function findTaskByTitle(pid, title) {
  var q = String(title || '').trim().toLowerCase(); if (!q) return null;
  var pool = store.tasks.filter(function (t) { return !pid || t.projectId === pid; });
  var ex = pool.find(function (t) { return t.title.toLowerCase() === q; });
  if (ex) return ex;
  var c = pool.filter(function (t) { return t.title.toLowerCase().indexOf(q) >= 0; });
  return c.length === 1 ? c[0] : (c.length ? 'ambiguous' : null);
}
function resolveAgent(a) {
  var q = String(a || '').trim().toLowerCase(); if (!q) return allAgents()[2];
  return allAgents().find(function (x) { return x.id === q || x.name.toLowerCase() === q; }) || null;
}
/* tools ให้ AI ในแชทเรียก — ใช้ mutation เดียวกับ UI (มี event/log เหมือนกัน) */
var chatTools = {
  create_task: function (a) {
    var p = findProjectByName(a.project);
    if (!p) return { ok: false, error: 'ไม่เจอโปรเจกต์ "' + a.project + '"' };
    if (p === 'ambiguous') return { ok: false, error: 'ชื่อโปรเจกต์ซ้ำหลายอัน ระบุให้ชัดกว่านี้' };
    if (!a.title) return { ok: false, error: 'ต้องมี title' };
    var ag = resolveAgent(a.agent);
    if (!ag) return { ok: false, error: 'ไม่เจอ agent "' + a.agent + '" (director/research/developer/music/content/reviewer)' };
    var t = addTask({ projectId: p.id, title: String(a.title).slice(0, 120), agent: ag.id, priority: a.priority || 'P2', desc: String(a.desc || '').slice(0, 500) });
    render();
    return { ok: true, result: 'สร้าง task "' + t.title + '" → ' + ag.name + ' ในโปรเจกต์ ' + p.name };
  },
  create_project: function (a) {
    if (!a.name) return { ok: false, error: 'ต้องมี name' };
    var p = addProject({ name: String(a.name).slice(0, 80), ptype: a.ptype || 'Other', type: a.type === 'client' ? 'client' : 'personal', priority: 'P2', brief: String(a.brief || '').slice(0, 500) });
    render();
    return { ok: true, result: 'สร้างโปรเจกต์ ' + p.name + ' (' + p.ptype + ')' };
  },
  set_task_status: function (a) {
    var p = a.project ? findProjectByName(a.project) : null;
    if (p === 'ambiguous') return { ok: false, error: 'ชื่อโปรเจกต์ซ้ำ ระบุให้ชัด' };
    var t = findTaskByTitle(p ? p.id : null, a.title);
    if (!t) return { ok: false, error: 'ไม่เจอ task "' + a.title + '"' };
    if (t === 'ambiguous') return { ok: false, error: 'ชื่อ task ซ้ำ ระบุโปรเจกต์ด้วย' };
    if (TASK_STATUS.indexOf(a.status) < 0) return { ok: false, error: 'status ต้องเป็นหนึ่งใน ' + TASK_STATUS.join(',') };
    setTaskStatus(t.id, a.status);
    return { ok: true, result: 'task "' + t.title + '" → ' + a.status };
  },
  list_work: function (a) {
    var ps = store.projects.filter(function (p) { return p.status !== 'cancelled'; }).slice(0, 15);
    if (!ps.length) return { ok: true, result: 'ยังไม่มีโปรเจกต์' };
    return { ok: true, result: ps.map(function (p) {
      var ts = tasksOf(p.id);
      var open = ts.filter(function (t) { return t.status !== 'COMPLETED' && t.status !== 'FAILED'; });
      return '- ' + p.name + ' [' + p.ptype + '/' + p.status + '] tasks:' + ts.length + ' ค้าง:' + open.length +
        (open.length ? ' (' + open.slice(0, 5).map(function (t) { return t.title + '→' + agentName(t.agent) + ':' + t.status; }).join('; ') + ')' : '');
    }).join('\n') };
  }
};
window.AgencyOS = { allAgents: allAgents, agentStatus: agentStatus, agentCurrent: agentCurrent,
  agentName: agentName, metrics: metrics, selectAgent: selectAgent, openProject: openProject, hireAgent: hireAgent,
  removeAgent: removeAgent, toast: toast, mockTick: mockTick, LS_KEY: LS_KEY, esc: esc, fmtDate: fmtDate, tools: chatTools };

/* ---------- boot ---------- */
function boot() {
  var h = location.hash.replace('#/', '');
  if (TABS.some(function (t) { return t[0] === h; })) curTab = h;
  window.addEventListener('hashchange', function () {
    var t = location.hash.replace('#/', '');
    if (TABS.some(function (x) { return x[0] === t; }) && t !== curTab) { curTab = t; render(); }
  });
  render();
  try {
    var raw = localStorage.getItem('et1cruel.agency.import');
    if (raw) {
      localStorage.removeItem('et1cruel.agency.import');
      var q = JSON.parse(raw);
      if (q && q.ep === 'ep3-idea') {
        try { localStorage.setItem('et1cruel.agency.chatdraft', 'อยากเสนอหัวข้อ EP3 (JEPI / DCA / …): '); } catch (e) {}
        location.hash = '#/chat'; curTab = 'chat'; render();
      } else if (q && q.kind === 'music') {
        setTimeout(function () { importMusic(q.track); }, 60);
      } else if (q && q.kind === 'music-req') {
        setTimeout(function () { requestMusic(q.mood || 'lofi', q.dur || '60'); }, 60);
      } else if (q && q.ep) {
        setTimeout(function () { importEpisode(q.ep); }, 60);
      }
    }
  } catch (e) {}
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
