/* CREATE AI app — hash router, progress, search, quiz (vanilla, v1) */
(function () {
'use strict';
var D = window.CAIDATA;
var KEY = 'createai-v1';
function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
var S = load();
if (!S.done) S.done = {}; if (!S.marks) S.marks = [];
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function $(id) { return document.getElementById(id); }
function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2200); }

var LESSON_MODS = [['m01', '01 · AI Universe'], ['m05', '05 · สมอง AI'], ['m02', '02 · ประวัติศาสตร์'], ['m03', '03 · คณิตศาสตร์'], ['m04', '04 · โปรแกรมมิ่ง'], ['m09', '09 · ฝึก LLM'], ['m10', '10 · Infra'], ['m11', '11 · Agents'], ['m12', '12 · Multimodal'], ['m14', '14 · Safety'], ['m15', '15 · ธุรกิจ']];
function allLessons() {
  var out = [];
  LESSON_MODS.forEach(function (mm) {
    (D[mm[0]] || []).forEach(function (l) { out.push({ id: l.id, mod: mm[0], modTh: mm[1], title: l.title }); });
  });
  return out;
}
function progress() {
  var ids = allLessons().map(function (l) { return l.id; });
  var n = ids.filter(function (id) { return S.done[id]; }).length;
  return { n: n, total: ids.length, pct: ids.length ? Math.round(n / ids.length * 100) : 0 };
}
function paintBar() {
  var p = progress();
  $('pbar').style.width = p.pct + '%';
  $('ptxt').textContent = 'ความคืบหน้า ' + p.pct + '% (' + p.n + '/' + p.total + ' บท)';
}
function toggleDone(id) {
  if (S.done[id]) delete S.done[id]; else S.done[id] = 1;
  save(S); paintBar(); renderNav();
  var b = document.querySelector('[data-donebtn="' + id + '"]');
  if (b) b.innerHTML = doneLabel(id);
}
function doneLabel(id) { return S.done[id] ? '✓ เรียนแล้ว — กดเพื่อยกเลิก' : '○ มาร์คว่าเรียนจบ'; }
function toggleMark(id) {
  var i = S.marks.indexOf(id);
  if (i >= 0) S.marks.splice(i, 1); else S.marks.push(id);
  save(S); toast(i >= 0 ? 'เอาที่คั่นออกแล้ว' : 'คั่นหน้าไว้แล้ว ★');
  renderNav();
}

/* ---------- nav ---------- */
function renderNav() {
  var p = progress();
  $('navMain').innerHTML = '<h4>ห้องเรียน</h4>' + D.modules.map(function (m) {
    return '<button class="sbtn" data-go="' + m.id + '"><span class="dot"></span><span><b>' + m.no + ' · ' + esc(m.th) + '</b><small>' + esc(m.en) + '</small></span></button>';
  }).join('');
  $('navBots').innerHTML = '<h4>หุ่นยนต์ผู้ช่วย</h4>' + D.bots.map(function (b) {
    return '<button class="sbtn" data-go="bot-' + b.id + '"><span class="dot"></span><span><b>' + b.face + ' ' + b.name + '</b><small>' + esc(b.role.split('—')[0]) + '</small></span></button>';
  }).join('') + '<button class="sbtn" data-go="glossary"><span class="dot"></span><span><b>Aa · คลังศัพท์</b><small>' + D.glossary.length + ' คำ</small></span></button>';
  $('navTools').innerHTML = '<h4>เครื่องมือแล็บ</h4>' +
    '<button class="sbtn" data-go="m05" data-lab="neuron"><span class="dot"></span><span><b>Neuron Lab</b><small>สมการจริง</small></span></button>' +
    '<button class="sbtn" data-go="m05" data-lab="train"><span class="dot"></span><span><b>Training Lab</b><small>GD จริง</small></span></button>' +
    '<button class="sbtn" data-go="m05" data-lab="attn"><span class="dot"></span><span><b>Attention Lab</b><small>softmax จริง</small></span></button>' +
    '<button class="sbtn" data-go="m05" data-lab="tok"><span class="dot"></span><span><b>Token Lab</b><small>SIMULATION</small></span></button>' +
    '<button class="sbtn" data-go="m03" data-scroll="tool-matrix"><span class="dot"></span><span><b>Matrix Calc</b><small>M03</small></span></button>' +
    '<button class="sbtn" data-go="m03" data-scroll="tool-bayes"><span class="dot"></span><span><b>Bayes Calc</b><small>M03</small></span></button>' +
    '<button class="sbtn" data-go="m09" data-scroll="tool-vram"><span class="dot"></span><span><b>VRAM Est.</b><small>M09</small></span></button>' +
    '<button class="sbtn" data-go="m09" data-scroll="tool-cost"><span class="dot"></span><span><b>Cost Calc</b><small>M09</small></span></button>' +
    '<button class="sbtn" data-go="m07" data-scroll="tool-compare"><span class="dot"></span><span><b>Compare</b><small>M07</small></span></button>' +
    '<button class="sbtn" data-go="m13" data-scroll="tool-arm"><span class="dot"></span><span><b>Arm Sim</b><small>M13</small></span></button>' +
    '<button class="sbtn" data-go="m15" data-scroll="tool-unitecon"><span class="dot"></span><span><b>Unit Econ</b><small>M15</small></span></button>' +
    '<button class="sbtn" data-go="kg"><span class="dot"></span><span><b>Knowledge Graph</b><small>แผนที่โยง</small></span></button>';
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.onclick = function () {
      location.hash = '#/' + b.dataset.go + (b.dataset.lab ? '?lab=' + b.dataset.lab : '');
      if (b.dataset.scroll) setTimeout(function () { var t = document.getElementById(b.dataset.scroll); if (t) t.scrollIntoView(); }, 200);
    };
  });
  // mark done lessons in sidebar? sidebar shows modules; progress bar covers it
  paintBar();
}

/* ---------- shared bits ---------- */
function crumbs(modTh, title) { return '<div class="crumbs">CREATE AI / <b>' + esc(modTh) + '</b>' + (title ? ' / ' + esc(title) : '') + '</div>'; }
function quizHtml(quiz, qid) {
  return '<div class="quiz" data-quiz="' + qid + '"><h3>📝 แบบทดสอบ (' + quiz.length + ' ข้อ)</h3>' +
    quiz.map(function (q, i) {
      return '<div class="q">' + (i + 1) + '. ' + esc(q.q) + '</div>' +
        q.c.map(function (c, j) { return '<label><input type="radio" name="' + qid + i + '" value="' + j + '"> ' + esc(c) + '</label>'; }).join('') +
        '<div class="fb" id="' + qid + '-fb' + i + '"></div>';
    }).join('') +
    '<div style="margin-top:8px"><button class="primary" data-grade="' + qid + '">ตรวจคำตอบ</button></div><div class="fb" id="' + qid + '-sum"></div></div>';
}
function bindQuiz(quiz, qid) {
  var btn = document.querySelector('[data-grade="' + qid + '"]');
  if (!btn) return;
  btn.onclick = function () {
    var score = 0;
    quiz.forEach(function (q, i) {
      var sel = document.querySelector('input[name="' + qid + i + '"]:checked');
      var fb = $('' + qid + '-fb' + i);
      if (!sel) { fb.innerHTML = '<span style="color:var(--warn)">ยังไม่ตอบข้อนี้</span>'; return; }
      if (+sel.value === q.a) { score++; fb.innerHTML = '<span style="color:var(--ok)">✓ ถูก</span>'; }
      else fb.innerHTML = '<span style="color:var(--bad)">✗ คำตอบที่ถูก: ' + esc(q.c[q.a]) + '</span>';
    });
    $('' + qid + '-sum').innerHTML = '<b>ได้ ' + score + '/' + quiz.length + '</b>' + (score === quiz.length ? ' — ผ่าน! กดมาร์คเรียนจบได้เลย' : ' — ทบทวนบทเรียนแล้วลองใหม่');
  };
}
function lessonBlock(l, modTh) {
  return '<article class="lesson" id="L-' + l.id + '">' + crumbs(modTh, l.title) +
    '<h3>' + esc(l.title) + ' <span class="pill info">~' + l.mins + ' นาที</span>' +
    (S.done[l.id] ? ' <span class="pill ok">เรียนแล้ว</span>' : '') + '</h3>' + l.body +
    '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
    '<button data-donebtn="' + l.id + '">' + doneLabel(l.id) + '</button>' +
    '<button class="ghost" data-mark="' + l.id + '">' + (S.marks.indexOf(l.id) >= 0 ? '★ คั่นไว้แล้ว' : '☆ คั่นหน้า') + '</button></div></article>';
}
function bindLessonBtns() {
  document.querySelectorAll('[data-donebtn]').forEach(function (b) { b.onclick = function () { toggleDone(b.dataset.donebtn); render(); }; });
  document.querySelectorAll('[data-mark]').forEach(function (b) { b.onclick = function () { toggleMark(b.dataset.mark); b.textContent = S.marks.indexOf(b.dataset.mark) >= 0 ? '★ คั่นไว้แล้ว' : '☆ คั่นหน้า'; }; });
}

/* ---------- views ---------- */
function vOverview(el) {
  var p = progress();
  var marked = S.marks.map(function (id) {
    var l = allLessons().filter(function (x) { return x.id === id; })[0];
    return l ? '<button class="cardx" data-jump="' + l.mod + '#' + l.id + '"><b>★ ' + esc(l.title) + '</b><small>' + esc(l.modTh) + '</small></button>' : '';
  }).join('');
  el.innerHTML = crumbs('ภาพรวมห้อง') +
    '<div class="hero"><h1>สร้าง <span class="ac">AI</span> ด้วยมือคุณเอง</h1>' +
    '<p class="sub">From Zero to Artificial Intelligence Architect · เรียน → เข้าใจ → สร้าง → ฝึก → ใช้งานจริง (อัปเดต ' + esc(D.updated) + ')</p>' +
    '<canvas id="brain" width="900" height="220" aria-label="ภาพจำลองโครงข่ายประสาท (2D, เพื่อการสอน)"></canvas>' +
    '<div class="hero-controls"><button id="brainPause">⏸ หยุดภาพ</button><span class="muted" style="font-size:13px">ภาพประกอบ 2D เพื่อการสอน (SIMULATION) · ปิดแล้วอ่านต่อได้ปกติ</span></div></div>' +
    '<div class="panel"><h2>◈ แผนที่ห้อง</h2><p class="desc">ความคืบหน้าของคุณ ' + p.n + '/' + p.total + ' บท (' + p.pct + '%) · จำในเครื่องนี้</p><div class="grid">' +
    D.modules.filter(function (m) { return m.id !== 'overview'; }).map(function (m) {
      return '<button class="cardx" data-go2="' + m.id + '"><span class="tag">' + m.no + '</span><b>' + esc(m.th) + '</b><small>' + esc(m.desc) + '</small></button>';
    }).join('') + '</div></div>' +
    (marked ? '<div class="panel"><h2>★ คั่นหน้าไว้ (' + S.marks.length + ')</h2><div class="grid">' + marked + '</div></div>' : '') +
    '<div class="panel"><h2>✅ ครบทั้ง 21 โมดูลแล้ว</h2><p class="desc">M01–M16 + แผนที่ความรู้ + หุ่นยนต์ + เส้นทาง + โปรเจกต์ — ทุกหมวดมีเนื้อหาและเครื่องมือใช้งานได้จริง ไม่มีหมวดเปล่า · ข้อมูลโมเดล/หุ่นยนต์ทุกเรคคอร์ดมีสถานะตรวจสอบ ไม่ประดิษฐ์ตัวเลข</p></div>';
  el.querySelectorAll('[data-go2]').forEach(function (b) { b.onclick = function () { location.hash = '#/' + b.dataset.go2; }; });
  el.querySelectorAll('[data-jump]').forEach(function (b) {
    b.onclick = function () { var a = b.dataset.jump.split('#'); location.hash = '#/' + a[0]; setTimeout(function () { var t = document.getElementById('L-' + a[1]); if (t) t.scrollIntoView(); }, 80); };
  });
  if (window.CAILAB) window.CAILAB.brain();
  var bp = $('brainPause');
  if (bp) bp.onclick = function () { var on = window.CAILAB.brainToggle(); bp.textContent = on ? '⏸ หยุดภาพ' : '▶ เล่นภาพ'; };
}
function vM01(el) {
  el.innerHTML = crumbs('01 · AI Universe') +
    '<div class="panel"><h2>01 · AI Universe — รู้จักโลก AI</h2><p class="desc">6 บท + แบบทดสอบ · จบแล้วจะเรียกชื่อทุกคำถูกแกน</p></div>' +
    D.m01.map(function (l) { return lessonBlock(l, '01 · AI Universe'); }).join('') +
    quizHtml(D.m01quiz, 'm01q');
  bindLessonBtns(); bindQuiz(D.m01quiz, 'm01q');
}
function vM05(el, lab) {
  el.innerHTML = crumbs('05 · สมอง AI ทำงานอย่างไร') +
    '<div class="panel"><h2>05 · สมอง AI ทำงานอย่างไร</h2><p class="desc">5 บท + 4 แล็บ · ตัวเลขในแล็บคำนวณจริงในเบราว์เซอร์คุณ ยกเว้นที่ติดป้าย SIMULATION</p></div>' +
    D.m05.map(function (l) { return lessonBlock(l, '05 · สมอง AI'); }).join('') +
    '<div id="labs"></div>' + quizHtml(D.m05quiz, 'm05q');
  bindLessonBtns(); bindQuiz(D.m05quiz, 'm05q');
  if (window.CAILAB) window.CAILAB.render($('labs'), lab);
}
function vBots(el, botId) {
  var list = D.bots.map(function (b) {
    return '<button class="cardx" data-bot="' + b.id + '"><b>' + b.face + ' ' + b.name + '</b><small>' + esc(b.role) + '</small></button>';
  }).join('');
  var b = D.bots.filter(function (x) { return x.id === botId; })[0];
  var detail = '';
  if (b) {
    detail = '<div class="panel"><h2>' + b.face + ' ' + b.name + '</h2><p class="desc">' + esc(b.role) + ' · <span class="pill">RULE-BASED · ไม่ใช่ AI จริง</span></p>' +
      '<div class="bot"><div class="face">' + b.face + '</div><div class="bubble">' + esc(b.intro) + '</div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      b.qa.map(function (q, i) { return '<button data-ask="' + i + '">' + esc(q[1].slice(0, 26)) + '…</button>'; }).join('') + '</div>' +
      '<div id="botAns"></div></div>';
  }
  el.innerHTML = crumbs('หุ่นยนต์ผู้ช่วย', b ? b.name : '') +
    '<div class="panel"><h2>◉ หุ่นยนต์ผู้ช่วย</h2><p class="desc">ไกด์ตอบตามสคริปต์ที่เขียนไว้ล่วงหน้า (rule-based) ถามด้วยปุ่มตัวอย่างได้เลย — ไม่ได้เชื่อมโมเดลจริง ไม่เก็บคำถาม</p><div class="grid">' + list + '</div></div>' + detail;
  el.querySelectorAll('[data-bot]').forEach(function (x) { x.onclick = function () { location.hash = '#/bot-' + x.dataset.bot; }; });
  if (b) el.querySelectorAll('[data-ask]').forEach(function (x) {
    x.onclick = function () {
      $('botAns').innerHTML = '<div class="bot"><div class="face">' + b.face + '</div><div class="bubble"><b>' + b.name + ':</b> ' + esc(b.qa[+x.dataset.ask][1]) + '</div></div>';
    };
  });
}
function vGlossary(el, q) {
  var items = D.glossary.filter(function (g) {
    if (!q) return true;
    q = q.toLowerCase();
    return (g.t + g.th + g.d).toLowerCase().indexOf(q) >= 0;
  });
  el.innerHTML = crumbs('คลังศัพท์ AI') +
    '<div class="panel"><h2>Aa · คลังศัพท์ (' + items.length + '/' + D.glossary.length + ')</h2>' +
    '<input class="search" id="gq" placeholder="ค้นหาศัพท์…" value="' + esc(q || '') + '">' +
    items.map(function (g) {
      return '<div class="lesson"><h3>' + esc(g.t) + ' <small style="color:var(--muted)">· ' + esc(g.th) + '</small></h3><p>' + esc(g.d) + '</p>' +
        '<p class="muted" style="font-size:13.5px">บทเรียนที่เกี่ยว: ' + g.rel.map(function (r) { return '<button class="ghost" data-goto="' + r + '" style="border:none;color:var(--lime);padding:0;text-decoration:underline">' + r + '</button>'; }).join(' · ') + '</p></div>';
    }).join('') + '</div>';
  var qi = $('gq');
  qi.oninput = function () { vGlossary(el, qi.value); var nq = $('gq'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); };
  el.querySelectorAll('[data-goto]').forEach(function (x) {
    x.onclick = function () {
      var id = x.dataset.goto, mod = id.indexOf('m05') === 0 ? 'm05' : 'm01';
      location.hash = '#/' + mod; setTimeout(function () { var t = document.getElementById('L-' + id); if (t) t.scrollIntoView(); }, 120);
    };
  });
}
function vPaths(el) {
  el.innerHTML = crumbs('เส้นทางการเรียน') +
    '<div class="panel"><h2>➤ เส้นทาง A–H</h2><p class="desc">เวลาคือประมาณการ ไม่รับประกันความเชี่ยวชาญ</p>' +
    D.paths.map(function (p) {
      return '<div class="lesson"><h3>Path ' + p.id + ' — ' + esc(p.name) + '</h3><p>' + esc(p.goal) + '</p><p class="muted">⏱ ' + esc(p.hours) + '</p><p style="font-size:14.5px">' +
        p.miles.map(function (m, i) { return (i + 1) + '. ' + esc(m); }).join('<br>') + '</p></div>';
    }).join('') + '</div>';
}
function vProjects(el) {
  el.innerHTML = crumbs('โรงงานโปรเจกต์') +
    '<div class="panel"><h2>▣ โรงงานโปรเจกต์ (ระดับเริ่มต้น)</h2><p class="desc">โค้ดรันได้จริงบนเครื่องคุณ (Python + numpy) พร้อมปุ่มคัดลอก · ระดับสูงกว่านี้มาตาม roadmap</p></div>' +
    D.projects.map(function (p) {
      return '<article class="lesson"><h3>' + esc(p.title) + ' <span class="pill info">' + p.lv + '</span></h3>' +
        '<p><b>เป้าหมาย:</b> ' + esc(p.goal) + '</p><p class="muted">Stack: ' + esc(p.stack) + ' · ฮาร์ดแวร์: ' + esc(p.hw) + ' · ต้นทุน: ' + esc(p.cost) + '</p>' +
        '<p><b>ขั้นตอน:</b><br>' + p.steps.map(function (s, i) { return (i + 1) + '. ' + esc(s); }).join('<br>') + '</p>' +
        '<pre class="code" id="code-' + p.id + '">' + esc(p.code) + '</pre>' +
        '<div style="display:flex;gap:8px"><button data-copy="code-' + p.id + '">📋 คัดลอกโค้ด</button></div>' +
        '<p style="margin-top:8px"><b>ผลที่ควรได้:</b> ' + esc(p.expect) + '</p><p><b>พังตรงไหน:</b> ' + esc(p.errors) + '</p><p><b>เก็บเข้าพอร์ต:</b> ' + esc(p.portfolio) + '</p></article>';
    }).join('');
  el.querySelectorAll('[data-copy]').forEach(function (b) {
    b.onclick = function () {
      var t = $(b.dataset.copy).textContent;
      var done = function () { toast('คัดลอกโค้ดแล้ว'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { toast('คัดลอกไม่ได้ ให้ลากคลุมเอง'); });
      else toast('คัดลอกไม่ได้ ให้ลากคลุมเอง');
    };
  });
}
function vSearch(el, q) {
  q = (q || '').toLowerCase();
  var hits = [];
  D.m01.forEach(function (l) { if ((l.title + l.body).toLowerCase().indexOf(q) >= 0) hits.push({ k: 'บทเรียน', t: l.title, go: 'm01#' + l.id, d: '01 · AI Universe' }); });
  D.m05.forEach(function (l) { if ((l.title + l.body).toLowerCase().indexOf(q) >= 0) hits.push({ k: 'บทเรียน', t: l.title, go: 'm05#' + l.id, d: '05 · สมอง AI' }); });
  D.glossary.forEach(function (g) { if ((g.t + g.th + g.d).toLowerCase().indexOf(q) >= 0) hits.push({ k: 'ศัพท์', t: g.t + ' · ' + g.th, go: 'glossary', d: g.d.slice(0, 90) + '…' }); });
  D.projects.forEach(function (p) { if ((p.title + p.goal).toLowerCase().indexOf(q) >= 0) hits.push({ k: 'โปรเจกต์', t: p.title, go: 'projects', d: p.goal }); });
  D.bots.forEach(function (b) { if ((b.name + b.role).toLowerCase().indexOf(q) >= 0) hits.push({ k: 'หุ่นยนต์', t: b.face + ' ' + b.name, go: 'bot-' + b.id, d: b.role }); });
  el.innerHTML = crumbs('ค้นหา: ' + q) + '<div class="panel"><h2>🔍 ผลการค้นหา (' + hits.length + ')</h2>' +
    (hits.length ? '<div class="searchres">' + hits.map(function (h) {
      return '<button class="cardx" data-sgo="' + h.go + '"><span class="tag">' + h.k + '</span><b>' + esc(h.t) + '</b><small>' + esc(h.d) + '</small></button>';
    }).join('') + '</div>' : '<p class="muted">ไม่เจอ — ลองคำอื่น เช่น neuron, token, loss</p>') + '</div>';
  el.querySelectorAll('[data-sgo]').forEach(function (b) {
    b.onclick = function () {
      var a = b.dataset.sgo.split('#');
      location.hash = '#/' + a[0];
      if (a[1]) setTimeout(function () { var t = document.getElementById('L-' + a[1]); if (t) t.scrollIntoView(); }, 120);
    };
  });
}

/* ---------- generic module views (Phase 2+) ---------- */
var MODVIEWS = {
  m02: { lessons: 'm02', quiz: 'm02quiz', qid: 'm02q', tools: ['timeline'] },
  m03: { lessons: 'm03', quiz: 'm03quiz', qid: 'm03q', tools: ['matrix', 'gd1d', 'bayes'] },
  m04: { lessons: 'm04', quiz: 'm04quiz', qid: 'm04q', tools: [] },
  m06: { custom: 'levels', quiz: 'm06quiz', qid: 'm06q', tools: [] },
  m07: { custom: 'models', quiz: 'm078quiz', qid: 'm078q', tools: ['compare'] },
  m08: { custom: 'open', tools: ['explorer'] },
  m09: { lessons: 'm09', quiz: 'm09quiz', qid: 'm09q', tools: ['vram', 'cost'] },
  m10: { lessons: 'm10', quiz: 'm10quiz', qid: 'm10q', tools: ['infra'] },
  m11: { lessons: 'm11', quiz: 'm11quiz', qid: 'm11q', tools: ['workflow'] },
  m12: { lessons: 'm12', quiz: 'm12quiz', qid: 'm12q', tools: [] },
  m13: { custom: 'robots', quiz: 'm13quiz', qid: 'm13q', tools: ['robots', 'arm'] },
  m14: { lessons: 'm14', quiz: 'm14quiz', qid: 'm14q', tools: ['checklist'] },
  m15: { lessons: 'm15', quiz: 'm15quiz', qid: 'm15q', tools: ['unitEcon'] },
  m16: { custom: 'frontier', quiz: 'm16quiz', qid: 'm16q' },
  kg: { custom: 'graph' }
};
var MODTH = { m02: '02 · ประวัติศาสตร์ AI', m03: '03 · คณิตศาสตร์', m04: '04 · โปรแกรมมิ่ง', m06: '06 · สร้าง AI เอง', m07: '07 · หอดูดาวโมเดล', m08: '08 · แล็บโอเพนเวต', m09: '09 · ฝึก LLM', m10: '10 · Infrastructure', m11: '11 · AI Agents', m12: '12 · Multimodal', m13: '13 · Humanoid', m14: '14 · Safety', m15: '15 · ธุรกิจ AI', m16: '16 · พรมแดนวิจัย', kg: 'แผนที่ความรู้' };
function mountTool(host, name) {
  var makers = { timeline: 'timeline', matrix: 'matrix', gd1d: 'gd1d', bayes: 'bayes', vram: 'vram', cost: 'cost', compare: 'compare', explorer: 'explorer', robots: 'robots', arm: 'arm', workflow: 'workflow', unitEcon: 'unitEcon', kgraph: 'kgraph' };
  if (!window.CAILAB2 || !makers[name] || !window.CAILAB2[makers[name]]) return;
  var wrap = document.createElement('div');
  wrap.id = 'tool-' + (name === 'unitEcon' ? 'unitecon' : name);
  host.appendChild(wrap);
  var T = window.CAILAB2[makers[name]]();
  wrap.innerHTML = T.html;
  T.bind(wrap);
}
function customBlock(kind) {
  var D = window.CAIDATA, h = '';
  if (kind === 'levels') {
    h = '<div class="panel"><h2>5 ระดับการสร้าง (อ่านก่อนลงมือ)</h2></div>' + D.m06levels.map(function (L) {
      return '<article class="lesson"><h3>' + esc(L.lv) + ' — ' + esc(L.title) + '</h3><p><b>เป้า:</b> ' + esc(L.goal) + '</p><p><b>ขั้น:</b><br>' +
        L.steps.map(function (s, i) { return (i + 1) + '. ' + esc(s); }).join('<br>') + '</p>' +
        (L.files ? '<p><b>แผนไฟล์:</b><br>' + L.files.map(function (f) { return '<code>' + esc(f.f) + '</code> — ' + esc(f.d); }).join('<br>') + '</p>' : '') +
        (L.code ? '<pre class="code">' + esc(L.code) + '</pre>' : '') +
        '<p><b>คำเตือน:</b> ' + L.warns.map(esc).join(' · ') + '</p></article>';
    }).join('');
  } else if (kind === 'models') {
    h = '<div class="panel"><h2>🔭 Frontier Observatory</h2><p class="desc">ทุกเรคคอร์ดมีสถานะตรวจสอบ (PARTIAL = รู้จักกว้างขวางแต่ควรตรวจซ้ำ) · bench เป็น UNKNOWN ทั้งหมดโดยตั้งใจ — ไม่ประดิษฐ์คะแนน · ตรวจเมื่อ ' + esc(D.updated) + '</p></div>';
  } else if (kind === 'open') {
    h = '<div class="panel"><h2>🔓 Open-Weight Lab</h2><p class="desc">กรองรุ่นที่โหลดมารันเองได้ · ตัวเลข VRAM คือประมาณการ (รวม overhead/KV cache เพิ่ม) · ภาษาไทย UNKNOWN = อย่าเคลม</p></div>';
  } else if (kind === 'robots') {
    h = '<div class="panel"><h2>🦾 Humanoid Research Center</h2><p class="desc">สเปกที่ไม่เปิดเผยบนเว็บทางการบันทึกเป็น UNKNOWN — ไม่เดา · เส้นทางเรียนรู้:</p><p style="font-size:14.5px">' +
      D.m13learn.map(function (x, i) { return (i + 1) + '. <b>' + esc(x.t) + '</b> — ' + esc(x.d); }).join('<br>') + '</p></div>';
  } else if (kind === 'frontier') {
    h = '<div class="panel"><h2>🔬 พรมแดนงานวิจัย</h2><p class="desc">ทุกหัวข้อแยก: ทำได้แล้ว / กำลังวิจัย / ยังไม่มีหลักฐาน / ความท้าทาย / ลองเองอย่างไร</p></div>' +
      D.m16.map(function (t) {
        return '<article class="lesson"><h3>' + esc(t.t) + '</h3><p>✅ <b>ทำได้แล้ว:</b> ' + esc(t.done) + '</p><p>🔄 <b>กำลังวิจัย:</b> ' + esc(t.doing) + '</p><p>❓ <b>ยังไม่มีหลักฐาน:</b> ' + esc(t.unknown) + '</p><p>⚠ <b>ความท้าทาย:</b> ' + esc(t.risk) + '</p><p>🧪 <b>ลองเอง:</b> ' + esc(t.try) + '</p></article>';
      }).join('');
  } else if (kind === 'graph') {
    h = '<div class="panel"><h2>🕸 แผนที่ความรู้ AI</h2><p class="desc">เส้น = ต้องเรียนก่อน → หลัง · คลิกโหนดดูเส้นทาง</p><div id="kg-host"></div></div>';
  } else if (kind === 'checklist') {
    h = '';
  }
  return h;
}
function vMod(el, id) {
  var D = window.CAIDATA, cfg = MODVIEWS[id];
  var mod = D.modules.filter(function (m) { return m.id === id; })[0];
  var title = mod ? mod.no + ' · ' + mod.th : id;
  var h = crumbs(MODTH[id] || id) + '<div class="panel"><h2>' + esc(title) + '</h2>' +
    (mod ? '<p class="desc">' + esc(mod.desc) + '</p>' : '') + '</div>';
  if (cfg.custom && cfg.custom !== 'checklist') h += customBlock(cfg.custom);
  if (cfg.lessons && D[cfg.lessons]) h += D[cfg.lessons].map(function (l) { return lessonBlock(l, MODTH[id]); }).join('');
  h += '<div id="mod-tools"></div>';
  if (cfg.custom === 'checklist' || id === 'm14') {
    h += '<div class="panel"><h2>✅ Security Checklist (10 ข้อ)</h2>' +
      D.m14check.map(function (c, i) { return '<label style="display:block;border:1px solid var(--line);border-radius:8px;padding:7px 12px;margin:5px 0;font-size:14.5px"><input type="checkbox" data-chk="' + i + '"> ' + esc(c) + '</label>'; }).join('') +
      '<p class="muted" id="chk-sum" style="font-size:14px"></p></div>';
  }
  if (id === 'm10') {
    h += '<div class="panel"><h2>🗺 แผนที่ Infrastructure (static)</h2><div style="overflow-x:auto"><svg width="900" height="150" role="img" aria-label="User to GPU map">' +
      [['User Request', 10], ['API Gateway', 190], ['Model Server', 370], ['GPU', 550], ['Output', 730]].map(function (b, i) {
        return (i ? '<line x1="' + (b[1] - 30) + '" y1="75" x2="' + b[1] + '" y2="75" stroke="#4ADE80" stroke-width="3"/>' : '') +
          '<rect x="' + b[1] + '" y="40" width="140" height="70" rx="10" fill="#0B0D14" stroke="#A78BFA" stroke-width="2"/><text x="' + (b[1] + 70) + '" y="80" fill="#F4F6FB" font-size="13" text-anchor="middle">' + b[0] + '</text>';
      }).join('') + '</svg></div><p class="muted" style="font-size:14px">3 ระดับ: <b>Local PC</b> (llama.cpp) → <b>Single-GPU</b> (vLLM+gateway) → <b>Multi-GPU Cluster</b> (ดูบท m10l5)</p></div>';
  }
  if (cfg.quiz && D[cfg.quiz]) h += quizHtml(D[cfg.quiz], cfg.qid);
  el.innerHTML = h;
  bindLessonBtns();
  if (cfg.quiz && D[cfg.quiz]) bindQuiz(D[cfg.quiz], cfg.qid);
  var host = $('mod-tools');
  (cfg.tools || []).forEach(function (t) {
    if (t === 'infra') return;
    mountTool(host, t);
  });
  if (cfg.custom === 'graph' && window.CAILAB2) {
    var T = window.CAILAB2.kgraph();
    $('kg-host').innerHTML = T.html;
    T.bind($('kg-host'));
  }
  var boxes = el.querySelectorAll('[data-chk]');
  function sumChk() {
    var n = el.querySelectorAll('[data-chk]:checked').length;
    var s = $('chk-sum');
    if (s) s.textContent = 'ติ๊กแล้ว ' + n + '/10 — เก็บในใจ ไม่ส่งออกไปไหน';
  }
  boxes.forEach(function (b) { b.onchange = sumChk; });
}

/* ---------- router ---------- */
function render() {
  renderNav();
  var h = (location.hash || '#/overview').replace('#/', '');
  var mod = h.split('?')[0], el = $('view');
  if (mod === 'overview') vOverview(el);
  else if (mod === 'm01') vM01(el);
  else if (mod === 'm05') {
    var lab = null, m = h.match(/lab=(\w+)/);
    if (m) lab = m[1];
    vM05(el, lab);
    if (lab) setTimeout(function () { var t = $('lab-' + lab); if (t) t.scrollIntoView(); }, 150);
  }
  else if (mod === 'glossary') vGlossary(el, '');
  else if (mod === 'paths') vPaths(el);
  else if (mod === 'projects') vProjects(el);
  else if (mod.indexOf('bot-') === 0) vBots(el, mod.slice(4));
  else if (mod === 'bots') vBots(el, null);
  else if (MODVIEWS[mod]) vMod(el, mod);
  else if (mod.indexOf('search/') === 0) vSearch(el, decodeURIComponent(mod.slice(7)));
  else vOverview(el);
  window.scrollTo(0, 0);
}
var qh = null;
document.addEventListener('DOMContentLoaded', function () {
  renderNav();
  var q = $('q');
  q.addEventListener('input', function () {
    clearTimeout(qh);
    qh = setTimeout(function () {
      var v = q.value.trim();
      if (v.length >= 2) location.hash = '#/search/' + encodeURIComponent(v);
    }, 450);
  });
  window.addEventListener('hashchange', render);
  if (!location.hash) location.hash = '#/overview';
  render();
});
})();
