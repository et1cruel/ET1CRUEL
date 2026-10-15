/* ET1CRUEL Agency Office — pixel-art virtual office (canvas, zero deps)
 * อ่าน state จริงจาก localStorage เท่านั้น · วาดใหม่เมื่อมี event · ไม่มี loop/animation หลอก */
(function () {
'use strict';

var BUB = { RUNNING: ['busy', '#2f9e44'], IDLE: ['idle', '#1971c2'], COMPLETED: ['done', '#0c8599'],
  FAILED: ['fail!', '#e03131'], BLOCKED: ['stuck', '#e03131'], WAITING: ['wait', '#e67700'],
  REVIEWING: ['review', '#0c8599'], PLANNING: ['plan', '#1971c2'], PAUSED: ['paused', '#7048e8'] };
var SHIRT = { director: '#A78BFA', research: '#22D3EE', developer: '#4ADE80', music: '#F472B6', content: '#FBBF24', reviewer: '#E9ECEF' };
var HAIR = { director: '#2b2118', research: '#101114', developer: '#5B3A1E', music: '#8a5a00', content: '#0b7285', reviewer: '#495057' };
var SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#f0c08c'];
var CELL_W = 300, CELL_H = 272, COLS = 3, TOP = 56;

function A() { return window.AgencyOS; }
function loadStore() {
  try {
    var s = JSON.parse(localStorage.getItem((A() && A().LS_KEY) || 'et1cruel.agency.v1')) || {};
    ['projects', 'tasks', 'approvals', 'knowledge', 'events', 'customAgents'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    return s;
  } catch (e) { return { projects: [], tasks: [], approvals: [], knowledge: [], events: [], customAgents: [] }; }
}
function esc(s) { try { return A().esc(s); } catch (e) { return String(s == null ? '' : s); } }

function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); }
function txt(g, s, x, y, font, c, align) {
  g.font = font; g.fillStyle = c; g.textAlign = align || 'left'; g.textBaseline = 'top';
  g.fillText(s, x, y);
}
function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

function screenColor(st) {
  return st === 'RUNNING' ? '#40c057' : st === 'IDLE' ? '#4dabf7' :
    st === 'COMPLETED' ? '#66d9e8' : (st === 'FAILED' || st === 'BLOCKED') ? '#ff6b6b' :
    (st === 'WAITING' || st === 'PAUSED') ? '#ffd43b' : '#99e9f2';
}

function drawFloor(g, W, H) {
  px(g, 0, 0, W, H, '#0d0f16');
  px(g, 8, TOP - 14, W - 16, H - TOP + 4, '#3a2a1a'); // wall frame
  px(g, 14, TOP - 8, W - 28, H - TOP - 8, '#6b4a2c'); // wood base
  // planks
  for (var y = TOP - 8; y < H - 16; y += 14) {
    px(g, 14, y, W - 28, 2, (y / 14) % 2 ? '#5c3d24' : '#75522f');
    for (var x = 14 + ((y / 14) % 2) * 40; x < W - 14; x += 80) px(g, x, y, 2, 14, '#4e3420');
  }
}

function drawPlant(g, x, y) {
  px(g, x + 8, y + 26, 16, 12, '#8a4b2a'); // pot
  px(g, x, y, 32, 8, '#2f9e44'); px(g, x + 4, y - 8, 24, 10, '#37b24d'); px(g, x + 10, y - 14, 12, 8, '#40c057');
}
function drawCoffee(g, x, y) {
  px(g, x, y, 64, 40, '#4a3b28'); px(g, x + 4, y + 4, 56, 32, '#2b2118');
  px(g, x + 8, y + 10, 16, 14, '#111'); px(g, x + 28, y + 10, 20, 14, '#868e96'); // machine + paper
  px(g, x + 8, y + 28, 8, 6, '#f8f9fa'); // cup
}

function drawAgentCell(g, a, st, cur, ox, oy, idx) {
  var cx = ox + CELL_W / 2;
  var shirt = SHIRT[a.id] || '#94d82d', hair = HAIR[a.id] || '#212529';
  var skin = SKIN[idx % SKIN.length];
  // rug
  g.globalAlpha = 0.25; px(g, ox + 34, oy + 208, CELL_W - 68, 48, shirt); g.globalAlpha = 1;
  // name plate
  px(g, cx - 72, oy + 30, 144, 22, '#141824');
  px(g, cx - 72, oy + 30, 144, 3, shirt);
  txt(g, trunc(a.name + (a.custom ? ' ★' : ''), 16), cx, oy + 34, '700 12px "Chakra Petch",monospace', '#fff', 'center');
  // chair
  px(g, cx - 18, oy + 168, 36, 10, '#343a40'); px(g, cx - 14, oy + 178, 28, 26, '#495057'); px(g, cx - 3, oy + 204, 6, 12, '#212529');
  // agent (back view)
  px(g, cx - 12, oy + 118, 24, 22, skin);            // head
  px(g, cx - 13, oy + 112, 26, 16, hair);           // hair back
  px(g, cx - 13, oy + 124, 5, 10, hair); px(g, cx + 8, oy + 124, 5, 10, hair);
  px(g, cx - 15, oy + 140, 30, 30, shirt);          // body
  px(g, cx - 15, oy + 140, 30, 4, 'rgba(0,0,0,.25)');
  px(g, cx - 12, oy + 170, 9, 20, '#2b2118'); px(g, cx + 3, oy + 170, 9, 20, '#2b2118'); // legs
  // desk (covers lower body)
  px(g, cx - 72, oy + 176, 144, 14, '#8a5a2b'); px(g, cx - 72, oy + 176, 144, 3, '#a06a35');
  px(g, cx - 66, oy + 190, 8, 26, '#5c3d24'); px(g, cx + 58, oy + 190, 8, 26, '#5c3d24');
  // monitor
  var sc = screenColor(st);
  px(g, cx - 5, oy + 158, 10, 18, '#343a40');
  px(g, cx - 26, oy + 120, 52, 38, '#212529');
  if (st === 'RUNNING') { g.shadowColor = sc; g.shadowBlur = 14; }
  px(g, cx - 23, oy + 123, 46, 32, sc);
  g.shadowBlur = 0;
  px(g, cx - 23, oy + 123, 46, 5, 'rgba(255,255,255,.35)'); // glare
  // keyboard + mug
  px(g, cx - 20, oy + 180, 40, 5, '#dee2e6'); px(g, cx + 34, oy + 177, 9, 8, '#e03131');
  // progress bar (real)
  if (cur && (cur.progress || 0) > 0 && st !== 'COMPLETED') {
    px(g, cx - 60, oy + 222, 120, 8, '#141824');
    px(g, cx - 60, oy + 222, 120 * Math.min(100, cur.progress) / 100, 8, sc);
    txt(g, (cur.progress | 0) + '%', cx + 64, oy + 219, '700 10px "Chakra Petch",monospace', '#AAB4CC');
  }
  // speech bubble
  var bw = 208, bx = Math.max(ox + 4, Math.min(ox + CELL_W - bw - 4, cx - bw / 2)), by = oy + 56;
  var b = BUB[st] || BUB.IDLE;
  px(g, bx, by, bw, 40, '#f8f9fa');
  px(g, bx, by, bw, 3, b[1]);
  px(g, cx - 5, by + 40, 10, 8, '#f8f9fa'); // tail
  txt(g, '● ' + b[0] + (cur && cur.progress ? ' ' + (cur.progress | 0) + '%' : ''), bx + 8, by + 4, '700 12px "Chakra Petch",monospace', b[1]);
  txt(g, trunc(cur ? cur.title : a.role, 26), bx + 8, by + 21, '12px "IBM Plex Sans Thai",monospace', '#495057');
}

function kindTasks(store, aid) {
  var open = store.tasks.filter(function (t) { return t.agent === aid && t.status !== 'COMPLETED' && t.status !== 'FAILED'; });
  var all = store.tasks.filter(function (t) { return t.agent === aid; });
  function rank(s) { return { RUNNING: 0, REVIEWING: 1, WAITING: 2, BLOCKED: 3, FAILED: 3, PLANNING: 4, PAUSED: 5 }[s] || 9; }
  open.sort(function (a, b) { return rank(a.status) - rank(b.status); });
  var st = 'IDLE';
  if (all.length) {
    if (open.some(function (t) { return t.status === 'FAILED'; })) st = 'FAILED';
    else if (open.some(function (t) { return t.status === 'BLOCKED'; })) st = 'BLOCKED';
    else if (open.some(function (t) { return t.status === 'RUNNING'; })) st = 'RUNNING';
    else if (open.some(function (t) { return t.status === 'REVIEWING'; })) st = 'REVIEWING';
    else if (open.some(function (t) { return t.status === 'WAITING'; })) st = 'WAITING';
    else if (open.some(function (t) { return t.status === 'PAUSED'; })) st = 'PAUSED';
    else if (open.some(function (t) { return t.status === 'PLANNING'; })) st = 'PLANNING';
    else st = 'COMPLETED';
  }
  return { st: st, cur: open[0] || null };
}

function draw() {
  var cv = document.getElementById('office'); if (!cv || !A()) return;
  var store = loadStore();
  var agents = A().allAgents();
  var rows = Math.ceil(agents.length / COLS);
  var W = COLS * CELL_W + 32, H = TOP + rows * CELL_H + 76;
  cv.width = W; cv.height = H;
  var g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  drawFloor(g, W, H);
  var posOf = {};
  agents.forEach(function (a, i) { posOf[a.id] = { x: 16 + (i % COLS) * CELL_W + CELL_W / 2, y: TOP + Math.floor(i / COLS) * CELL_H + 130 }; });
  var pairs = handoffPairs(store, posOf);
  txt(g, 'AGENCY FLOOR · ' + agents.length + ' members', 22, 12, '700 15px "Chakra Petch",monospace', '#F4F6FB');
  txt(g, '■ busy ■ idle ■ done ■ stuck', 22, 31, '11px "Chakra Petch",monospace', '#AAB4CC');
  txt(g, 'state จริง · handoffs ' + pairs.length + (pairs.length > 12 ? ' (โชว์ 12)' : ''), W - 22, 12, '11px "IBM Plex Sans Thai",monospace', '#AAB4CC', 'right');
  var sy = TOP + rows * CELL_H + 12;
  px(g, 14, sy, W - 28, 56, '#241a10');
  txt(g, 'PANTRY', 26, sy + 8, '700 12px "Chakra Petch",monospace', '#AAB4CC');
  drawCoffee(g, 110, sy + 10); drawPlant(g, 230, sy + 16); drawPlant(g, W - 70, sy + 16);
  drawHandoffs(g, pairs.slice(0, 12));
  Office._hits = [];
  agents.forEach(function (a, i) {
    var ox = 16 + (i % COLS) * CELL_W, oy = TOP + Math.floor(i / COLS) * CELL_H;
    var r = kindTasks(store, a.id);
    drawAgentCell(g, a, r.st, r.cur, ox, oy, i);
    Office._hits.push({ x: ox, y: oy, w: CELL_W, h: CELL_H, id: a.id });
  });
  renderCalls(store); renderRoster(store); renderRooms(store);
  wire(store);
}

function handoffPairs(store, posOf) {
  var byId = {}; store.tasks.forEach(function (t) { byId[t.id] = t; });
  var out = [];
  store.tasks.forEach(function (t) {
    (t.deps || []).forEach(function (d) {
      var dep = byId[d];
      if (!dep || dep.agent === t.agent || !posOf[dep.agent] || !posOf[t.agent]) return;
      out.push({ from: posOf[dep.agent], to: posOf[t.agent],
        done: dep.status === 'COMPLETED' && t.status === 'COMPLETED' });
    });
  });
  return out;
}
function drawHandoffs(g, pairs) {
  g.lineWidth = 3;
  pairs.forEach(function (p) {
    var mx = (p.from.x + p.to.x) / 2, my = Math.min(p.from.y, p.to.y) - 46;
    g.strokeStyle = p.done ? 'rgba(102,217,232,.55)' : 'rgba(251,191,36,.85)';
    if (g.setLineDash) g.setLineDash([7, 6]);
    g.beginPath(); g.moveTo(p.from.x, p.from.y); g.quadraticCurveTo(mx, my, p.to.x, p.to.y); g.stroke();
    if (g.setLineDash) g.setLineDash([]);
    var ang = Math.atan2(p.to.y - my, p.to.x - mx);
    g.fillStyle = g.strokeStyle;
    g.beginPath(); g.moveTo(p.to.x, p.to.y);
    g.lineTo(p.to.x - 10 * Math.cos(ang - 0.4), p.to.y - 10 * Math.sin(ang - 0.4));
    g.lineTo(p.to.x - 10 * Math.cos(ang + 0.4), p.to.y - 10 * Math.sin(ang + 0.4));
    g.closePath(); g.fill();
  });
}

var ROOMS = ['Development Lab', 'Music Studio', 'Content Studio', 'Business Intelligence', 'Other'];
function renderRooms(store) {
  var box = document.getElementById('orooms'); if (!box) return;
  box.innerHTML = '<div class="rooms">' + ROOMS.map(function (rt) {
    var ps = store.projects.filter(function (p) { return (p.ptype || 'Other') === rt && p.status !== 'cancelled'; });
    var h = '<div class="room"><b>' + esc(rt) + ' <small>(' + ps.length + ')</small></b>';
    h += ps.length ? ps.map(function (p) {
      var ts = store.tasks.filter(function (t) { return t.projectId === p.id; });
      var dn = ts.filter(function (t) { return t.status === 'COMPLETED'; }).length;
      var pct = ts.length ? Math.round(dn / ts.length * 100) : 0;
      var seen = {};
      ts.forEach(function (t) { seen[t.agent] = 1; });
      var names = Object.keys(seen).map(function (id) { return esc(A().agentName(id)); }).join(' · ');
      return '<button class="rproj" data-open="' + p.id + '"><b>' + esc(p.name) + '</b>' +
        '<small>' + esc(p.status) + ' · ' + dn + '/' + ts.length + ' tasks' + (names ? ' · ' + names : '') + '</small>' +
        '<span class="rbar"><i style="width:' + pct + '%"></i></span></button>';
    }).join('') : '<p class="muted">— ว่าง —</p>';
    return h + '</div>';
  }).join('') + '</div>';
  Array.prototype.forEach.call(box.querySelectorAll('[data-open]'), function (btn) {
    btn.onclick = function () { A().openProject(btn.dataset.open); };
  });
}

function renderCalls(store) {
  var box = document.getElementById('ocalls'); if (!box) return;
  var evs = store.events.slice(0, 3);
  box.innerHTML = evs.length ? evs.map(function (e) {
    return '<div class="call"><b>[' + esc(e.kind) + ']</b> ' + esc(e.text) +
      '<small>' + A().fmtDate(e.ts) + '</small></div>';
  }).join('') : '<p class="muted">— ยังไม่มี event; ทุก callout มาจาก log จริง —</p>';
}
function renderRoster(store) {
  var box = document.getElementById('oros'); if (!box) return;
  box.innerHTML = A().allAgents().map(function (a) {
    var r = kindTasks(store, a.id), b = BUB[r.st] || BUB.IDLE;
    return '<div class="ros"><span class="dot" style="background:' + b[1] + '"></span><b>' + esc(a.name) + '</b> ' +
      '<small>' + esc(a.role) + ' · ' + r.st + '</small>' +
      (a.custom ? ' <button class="link" data-fire="' + a.id + '">ให้ออก</button>' : '') + '</div>';
  }).join('');
  Array.prototype.forEach.call(box.querySelectorAll('[data-fire]'), function (btn) {
    btn.onclick = function () { if (confirm('ให้ ' + btn.dataset.fire + ' ออก?')) A().removeAgent(btn.dataset.fire); };
  });
}
function wire() {
  var cv = document.getElementById('office'); if (!cv || cv._wired) return; cv._wired = true;
  cv.addEventListener('click', function (e) {
    var r = cv.getBoundingClientRect(), sx = cv.width / r.width, sy = cv.height / r.height;
    var x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sy;
    var hit = (Office._hits || []).find(function (h) { return x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h; });
    if (hit) A().selectAgent(hit.id);
  });
  var h = document.getElementById('h-add');
  if (h) h.onclick = function () {
    var n = document.getElementById('h-name'), ro = document.getElementById('h-role');
    if (A().hireAgent({ name: n.value, role: ro.value })) { n.value = ''; ro.value = ''; }
  };
  var s = document.getElementById('snd');
  if (s && window.OfficeSound) {
    s.textContent = '🔔 sound: ' + (window.OfficeSound.on ? 'on' : 'off');
    s.onclick = function () { s.textContent = '🔔 sound: ' + (window.OfficeSound.toggle() ? 'on' : 'off'); };
  }
}

window.OfficeSound = (function () {
  var KEY = 'et1cruel.agency.sound', on = true, ac = null;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}
  function tone(f, t0, dur) {
    var o = ac.createOscillator(), gn = ac.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn); gn.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function play() {
    if (!on) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!ac) ac = new Ctx();
      if (ac.state === 'suspended' && ac.resume) ac.resume();
      var t = ac.currentTime;
      tone(659.25, t, 0.18); tone(880, t + 0.14, 0.3);
    } catch (e) {}
  }
  function toggle() { on = !on; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} return on; }
  return { play: play, toggle: toggle, get on() { return on; } };
})();

window.Office = { draw: draw, _hits: [] };
})();
