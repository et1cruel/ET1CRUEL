/* ET1CRUEL Agency OS — Web Chat (สั่งงานด้วยภาษาธรรมชาติ + tools จริง)
 * key อยู่ memory เท่านั้น · ประวัติแชทเก็บ local (ล้างได้) · tool loop สูงสุด 3 รอบ */
(function () {
'use strict';

var CHAT_KEY = 'et1cruel.agency.chat';
var MAX_ROUNDS = 3, KEEP = 30;

var TOOLS = [
  { type: 'function', function: { name: 'create_task',
    description: 'สร้าง task ใหม่ในโปรเจกต์ที่มีอยู่',
    parameters: { type: 'object', properties: {
      project: { type: 'string', description: 'ชื่อโปรเจกต์ (ตรงหรือใกล้เคียง)' },
      title: { type: 'string' }, agent: { type: 'string', description: 'director/research/developer/music/content/reviewer หรือชื่อสมาชิก' },
      desc: { type: 'string' }, priority: { type: 'string', description: 'P0-P3' } },
      required: ['project', 'title', 'agent'] } } },
  { type: 'function', function: { name: 'create_project',
    description: 'สร้างโปรเจกต์ใหม่',
    parameters: { type: 'object', properties: {
      name: { type: 'string' }, ptype: { type: 'string' }, type: { type: 'string' }, brief: { type: 'string' } },
      required: ['name'] } } },
  { type: 'function', function: { name: 'set_task_status',
    description: 'เปลี่ยนสถานะ task',
    parameters: { type: 'object', properties: {
      title: { type: 'string' }, status: { type: 'string' }, project: { type: 'string' } },
      required: ['title', 'status'] } } },
  { type: 'function', function: { name: 'list_work',
    description: 'ดูสรุปโปรเจกต์และงานค้างทั้งหมด',
    parameters: { type: 'object', properties: {} } } }
];

function A() { return window.AgencyOS; }
function $(id) { return document.getElementById(id); }
function esc(s) { try { return A().esc(s); } catch (e) { return String(s == null ? '' : s); } }
function load() { try { var m = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; return Array.isArray(m) ? m.slice(-KEEP) : []; } catch (e) { return []; } }
function save(m) { try { localStorage.setItem(CHAT_KEY, JSON.stringify(m.slice(-KEEP))); } catch (e) {} }
function todayUsed() {
  try {
    var day = new Date().toISOString().slice(0, 10);
    return window.Provider.usage().filter(function (u) { return u.ok && (u.ts || '').slice(0, 10) === day; }).length;
  } catch (e) { return 0; }
}
function sysPrompt() {
  var ags = A().allAgents().map(function (a) { return a.id + '(' + a.name + ': ' + a.role + ')'; }).join(', ');
  return 'You are the DIRECTOR of ET1CRUEL AI Agency. Answer in Thai, concise. ' +
    'Members: ' + ags + '. ' +
    'When the user asks to create/change work, CALL the matching tool instead of just describing. ' +
    'After tools run, summarize what was done in one short paragraph. ' +
    'If a project/task name is unclear, ask one short question instead of guessing. ' +
    'Never invent file paths, costs, or results.';
}

function render(el) {
  var msgs = load(), c = window.Provider ? window.Provider.cfg() : { model: 'openrouter/free' };
  el.innerHTML =
    '<div class="panel"><div class="chat-head"><b>💬 Agency Chat</b>' +
    '<small> · ใช้ไปวันนี้ ~' + todayUsed() + ' ครั้ง (free ~50/วัน) · key อยู่แค่ใน memory</small></div>' +
    '<div class="chat-form">' +
    '<input id="ch-model" value="' + esc(c.model || 'openrouter/free') + '" placeholder="model">' +
    '<input id="ch-key" type="password" placeholder="session key (memory only)" autocomplete="off">' +
    '<button id="ch-clear">ล้างแชท</button></div>' +
    '<div id="ch-log" class="chat-log"></div>' +
    '<div class="chat-form"><input id="ch-in" placeholder="สั่งงานเลย เช่น “สร้าง task ออกแบบปกเพลงให้ MUSE ในโปรเจกต์ Beat EP” · /help ดูคำสั่งลัด" autocomplete="off">' +
    '<button id="ch-send">ส่ง</button></div>' +
    '<p class="muted">/task โปรเจกต์ | ชื่องาน | agent · /project ชื่อ · /help</p></div>';
  paint();
  $('#ch-send').onclick = send;
  $('#ch-in').onkeydown = function (e) { if (e.key === 'Enter') send(); };
  $('#ch-clear').onclick = function () { save([]); paint(); };
  try {
    var d = localStorage.getItem('et1cruel.agency.chatdraft');
    if (d) { localStorage.removeItem('et1cruel.agency.chatdraft'); var i = $('ch-in'); if (i) { i.value = d; i.focus(); } }
  } catch (e) {}
  var k = $('#ch-key');
  k.onchange = function () { if (k.value && window.Provider) { window.Provider.setKey(k.value); k.value = ''; k.placeholder = 'key พร้อมใช้ (memory)'; toast('จำ key ไว้ใน memory แล้ว'); } };
}
function toast(m, c) { try { A().toast(m, c); } catch (e) {} }
function paint() {
  var box = document.getElementById('ch-log'); if (!box) return;
  var msgs = load();
  box.innerHTML = msgs.length ? msgs.map(function (m) {
    if (m.role === 'user') return '<div class="msg user">' + esc(m.content) + '</div>';
    if (m.role === 'tool') return '<div class="msg tool">🔧 ' + esc(m.content) + '</div>';
    return '<div class="msg ai">' + esc(m.content) + '</div>';
  }).join('') : '<p class="muted">— เริ่มสั่งงานได้เลย —</p>';
  box.scrollTop = box.scrollHeight;
}

function doSlash(text) {
  var msgs = load();
  var parts = text.slice(1).split('|').map(function (s) { return s.trim(); });
  var cmd = (parts[0] || '').split(' ')[0].toLowerCase();
  var rest = (parts[0] || '').slice(cmd.length).trim();
  var out = null;
  if (cmd === 'task' && parts.length >= 3) {
    out = A().tools.create_task({ project: parts[0].slice(4).trim(), title: parts[1], agent: parts[2], desc: parts[3] || '' });
  } else if (cmd === 'project' && rest) {
    out = A().tools.create_project({ name: rest });
  } else if (cmd === 'help') {
    return { handled: true, reply: '/task โปรเจกต์ | ชื่องาน | agent(เช่น developer) — สร้าง task\n/project ชื่อ — สร้างโปรเจกต์\nพิมพ์ธรรมดาก็ได้ AI จะเรียก tools ให้เอง' };
  } else {
    return { handled: true, reply: 'คำสั่งไม่ถูก — ลอง /help' };
  }
  msgs.push({ role: 'user', content: text });
  msgs.push({ role: 'tool', content: (out.ok ? '✅ ' : '❌ ') + (out.result || out.error) });
  save(msgs); paint();
  return { handled: true };
}

async function send() {
  var inp = document.getElementById('ch-in'); if (!inp) return;
  var text = inp.value.trim(); if (!text) return;
  inp.value = '';
  if (text[0] === '/') { doSlash(text); return; }
  if (!window.Provider) { toast('provider module ไม่โหลด', 'err'); return; }
  var model = (document.getElementById('ch-model') || {}).value || 'openrouter/free';
  var msgs = load();
  msgs.push({ role: 'user', content: text }); save(msgs); paint();
  var hist = [{ role: 'system', content: sysPrompt() }]
    .concat(msgs.filter(function (m) { return m.role !== 'tool'; }).slice(-10).map(function (m) { return { role: m.role, content: m.content }; }));
  paintTyping(true);
  try {
    for (var round = 0; round < MAX_ROUNDS; round++) {
      var r = await window.Provider.chat(model, hist, TOOLS, 800);
      if (!r.ok) { msgs.push({ role: 'ai', content: '❌ [' + r.cls + '] ' + r.error }); break; }
      var m = r.message || { content: '' };
      var calls = m.tool_calls || [];
      if (!calls.length) { if (m.content) msgs.push({ role: 'ai', content: m.content + (r.mocked ? '\n(MOCK)' : '') }); break; }
      hist.push({ role: 'assistant', content: m.content || '', tool_calls: calls });
      var results = [];
      for (var i = 0; i < calls.length; i++) {
        var tc = calls[i], fn = (tc.function || {}).name, args = {};
        try { args = JSON.parse((tc.function || {}).arguments || '{}'); } catch (e) { args = {}; }
        var fnImpl = A().tools[fn];
        var out = fnImpl ? fnImpl(args) : { ok: false, error: 'ไม่มี tool ชื่อ ' + fn };
        results.push({ tc: tc, out: out });
        msgs.push({ role: 'tool', content: (out.ok ? '✅ ' : '❌ ') + fn + ' → ' + (out.result || out.error) });
      }
      hist.push.apply(hist, results.map(function (x) {
        return { role: 'tool', tool_call_id: x.tc.id, content: x.out.ok ? x.out.result : ('ERROR: ' + x.out.error) };
      }));
      save(msgs); paint();
    }
  } catch (e) {
    msgs.push({ role: 'ai', content: '❌ ผิดพลาด: ' + String((e && e.message) || e).slice(0, 160) });
  }
  save(msgs); paintTyping(false); paint();
}
function paintTyping(on) {
  var box = document.getElementById('ch-log'); if (!box) return;
  var t = document.getElementById('ch-typing');
  if (on && !t) { var d = document.createElement('div'); d.id = 'ch-typing'; d.className = 'msg ai'; d.textContent = '…'; box.appendChild(d); box.scrollTop = box.scrollHeight; }
  if (!on && t) t.remove();
}

window.ChatUI = { render: render };
window.ChatAPI = { send: send, slash: doSlash, load: load, save: save };
})();
