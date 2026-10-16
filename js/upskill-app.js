/* ===== UPSKILL APP — render + progress storage (logic ล้วน, content อยู่ใน upskill-data.js) ===== */
(function () {
  'use strict';
  var KEY = 'et1cruel.upskill.v1';
  var STATUS = ['WISHLIST', 'EXPLORING', 'LEARNING', 'PRACTICING', 'PROJECT', 'MASTERED', 'PAUSED'];
  var ST_TH = { WISHLIST: 'อยากเรียน', EXPLORING: 'กำลังสำรวจ', LEARNING: 'กำลังเรียน', PRACTICING: 'กำลังฝึก', PROJECT: 'ทำโปรเจกต์', MASTERED: 'เชี่ยวชาญแล้ว', PAUSED: 'หยุดพัก' };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function skills() { return (window.ET1UPSKILL_DATA && window.ET1UPSKILL_DATA.skills) || []; }
  function bySlug(slug) { return skills().filter(function (s) { return s.slug === slug; })[0] || null; }

  function blankStore() { return { status: {}, minutes: {}, updated: {}, sessions: [], reflections: [], projectLinks: [], bookmarks: [], target: null }; }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankStore();
      var o = JSON.parse(raw);
      if (!o || typeof o !== 'object' || !o.status) return blankStore();
      ['minutes', 'updated', 'sessions', 'reflections', 'projectLinks', 'bookmarks'].forEach(function (k) {
        if (!o[k]) o[k] = blankStore()[k];
      });
      return o;
    } catch (e) { return blankStore(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load();

  function stOf(slug) { return S.status[slug] || ''; }
  function hrsOf(slug) { return Math.round(((+S.minutes[slug] || 0) / 60) * 10) / 10; }
  function totalHours() { var t = 0; Object.keys(S.minutes).forEach(function (k) { t += +S.minutes[k] || 0; }); return Math.round((t / 60) * 10) / 10; }
  function tracked() { return Object.keys(S.status).filter(function (k) { return S.status[k]; }); }
  function fmtDate(ts) { try { return new Date(ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function params() { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; } }; } }

  /* ---------- dashboard (คำนวณจากข้อมูลจริง) ---------- */
  function paintStats() {
    var tr = tracked();
    var cnt = function (st) { return tr.filter(function (k) { return S.status[k] === st; }).length; };
    $('stTotal').textContent = tr.length;
    $('stLearning').textContent = cnt('LEARNING') + cnt('EXPLORING');
    $('stPracticing').textContent = cnt('PRACTICING') + cnt('PROJECT');
    $('stProjects').textContent = S.projectLinks.length;
    $('stHours').textContent = totalHours();
    var t = S.target && bySlug(S.target) ? bySlug(S.target).nameTh : '–';
    $('stTarget').textContent = t;
  }

  /* ---------- NEXT MOVE (กฎจากข้อมูลจริง, ไม่ใช้ AI) ---------- */
  function nextMoves() {
    var out = [];
    var act = tracked().filter(function (k) { return ['EXPLORING', 'LEARNING', 'PRACTICING', 'PROJECT'].indexOf(S.status[k]) >= 0; });
    act.sort(function (a, b) { return (S.updated[a] || 0) - (S.updated[b] || 0); });
    if (act[0]) { var s = bySlug(act[0]); if (s) out.push({ t: 'กลับไปเรียนต่อ', d: s.nameTh + ' — ค้างไว้นานสุด (' + ST_TH[S.status[act[0]]] + ')', slug: act[0] }); }
    var now = Date.now(), stale = act.filter(function (k) { return !S.updated[k] || now - S.updated[k] > 14 * 864e5; })[0];
    if (stale && stale !== act[0]) { var s2 = bySlug(stale); if (s2) out.push({ t: 'ทบทวน', d: s2.nameTh + ' — ไม่ได้แตะเกิน 14 วัน', slug: stale }); }
    var noproj = tracked().filter(function (k) { return S.status[k] === 'PROJECT' && !S.projectLinks.some(function (p) { return p.skill === k; }); })[0];
    if (noproj) { var s3 = bySlug(noproj); if (s3) out.push({ t: 'ส่งงานชิ้นแรก', d: s3.nameTh + ' — แนบลิงก์ผลงานเพื่อพิสูจน์ฝีมือ', slug: noproj }); }
    if (!act.length) {
      var w = tracked().filter(function (k) { return S.status[k] === 'WISHLIST'; })[0] || 'web-app';
      var s4 = bySlug(w); if (s4) out.push({ t: 'เริ่มสำรวจ', d: s4.nameTh + ' — เริ่มจาก level EXPLORER', slug: w });
    }
    return out.slice(0, 3);
  }

  /* ---------- skill card ---------- */
  function cardHTML(sk) {
    var st = stOf(sk.slug);
    var deep = sk.detail ? '<span class="pill deep">เนื้อหาลึก</span>' : '<span class="pill todo">รอเติมเนื้อหา</span>';
    return '<button class="scard ' + sk.kingdom + '" data-go="' + esc(sk.slug) + '">' +
      '<div class="dhead"><b>' + esc(sk.nameTh) + '</b><small>' + esc(sk.nameEn.toUpperCase()) + '</small></div>' +
      '<div class="sum">' + esc(sk.summary) + '</div>' +
      '<div class="meta">' + deep + (st ? '<span class="pill st">' + esc(ST_TH[st] || st) + '</span>' : '') +
      (S.target === sk.slug ? '<span class="pill st">⭐ เป้าแรก</span>' : '') + '</div></button>';
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s_]+/g, ''); }
  function filterSkills(list) {
    var q = norm(($('q').value || '').trim());
    var fs = $('fStatus').value || '';
    return list.filter(function (sk) {
      if (fs && stOf(sk.slug) !== fs) return false;
      if (!q) return true;
      var hay = norm(sk.slug + ' ' + sk.nameTh + ' ' + sk.nameEn + ' ' + sk.summary + ' ' + (sk.tags || []).join(' '));
      return hay.indexOf(q) >= 0;
    });
  }

  /* ---------- views ---------- */
  /* ---------- weekly review (ข้อมูลจริง 7 วันย้อนหลัง) ---------- */
  function vWeekly() {
    var since = Date.now() - 7 * 864e5;
    var wk = S.sessions.filter(function (s) { return s.ts >= since; });
    var mins = wk.reduce(function (t, s) { return t + (+s.minutes || 0); }, 0);
    var by = {};
    wk.forEach(function (s) { by[s.skill] = (by[s.skill] || 0) + (+s.minutes || 0); });
    var top = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; })[0];
    var topSk = top && bySlug(top);
    var stale = tracked().filter(function (k) {
      return ['LEARNING', 'PRACTICING', 'PROJECT'].indexOf(S.status[k]) >= 0 && (!S.updated[k] || Date.now() - S.updated[k] > 7 * 864e5);
    }).map(function (k) { var sk = bySlug(k); return sk ? sk.nameTh : k; });
    if (!wk.length && !tracked().length) return '<section class="card"><h2><span class="em">📊</span> สรุปสัปดาห์นี้</h2><div class="empty">ยังไม่มีข้อมูล — เริ่มติดตามทักษะแล้วสรุปจะขึ้นตรงนี้</div></section>';
    return '<section class="card"><h2><span class="em">📊</span> สรุปสัปดาห์นี้</h2><div class="kv">' +
      '<div class="kbox"><b>⏱️ ฝึกไป ' + mins + ' นาที / ' + wk.length + ' session</b><small>ทักษะที่ซ้อมมากสุด: ' + esc(topSk ? topSk.nameTh : '—') + '</small></div>' +
      '<div class="kbox"><b>⚠️ ค้างเกิน 7 วัน (' + stale.length + ')</b><small>' + esc(stale.join(' · ') || 'ไม่มี — ดีมาก') + '</small></div>' +
      '<div class="kbox"><b>🎯 แผนสัปดาห์หน้า</b><small>' + esc(stale.length ? 'กลับไปแตะ ' + stale[0] + ' ก่อน' : 'เพิ่มชั่วโมงทักษะเป้า หรือเริ่มโปรเจกต์ใหม่') + '</small></div>' +
      '</div></section>';
  }

  function vOverview() {
    var act = tracked().filter(function (k) { return S.status[k] !== 'PAUSED'; })
      .sort(function (a, b) { return (S.updated[b] || 0) - (S.updated[a] || 0); }).slice(0, 3);
    var cont = act.length ? act.map(function (slug) {
      var sk = bySlug(slug); if (!sk) return '';
      return '<div class="kbox"><b>' + esc(sk.nameTh) + '</b><small>' + esc(ST_TH[S.status[slug]]) +
        ' · สะสม ' + hrsOf(slug) + ' ชม.</small><div class="rowbtns"><a class="btn small ghost" href="?skill=' + esc(slug) + '">เรียนต่อ →</a></div></div>';
    }).join('') : '<div class="empty">ยังไม่เริ่มติดตามทักษะไหน — <a href="?tab=tech">เลือกทักษะแรก</a> (แนะนำ Web App)</div>';
    var moves = nextMoves().map(function (m) {
      return '<div class="kbox"><b>👉 ' + esc(m.t) + '</b><small>' + esc(m.d) + '</small><div class="rowbtns"><a class="btn small ghost" href="?skill=' + esc(m.slug) + '">ไปเลย →</a></div></div>';
    }).join('') || '<div class="empty">เพิ่มทักษะที่อยากเรียน แล้วคำแนะนำจะขึ้นตรงนี้</div>';
    var j = S.reflections.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 3);
    var jh = j.length ? j.map(function (r) {
      var sk = bySlug(r.skill); return '<div class="kbox"><b>' + esc(sk ? sk.nameTh : r.skill) + '</b><small>' + esc(fmtDate(r.ts)) + '</small><div>' + esc(r.text).slice(0, 140) + '</div></div>';
    }).join('') : '<div class="empty">ยังไม่มีบันทึก — เขียน reflection แรกจากหน้าทักษะได้เลย</div>';
    return '<section class="card"><h2><span class="em">▶️</span> เรียนค้างไว้</h2><div class="kv">' + cont + '</div></section>' +
      vWeekly() +
      '<section class="card"><h2><span class="em">🧭</span> NEXT MOVE</h2><p class="sub">แนะนำจากข้อมูลจริงของเธอ</p><div class="kv">' + moves + '</div></section>' +
      '<section class="card"><h2><span class="em">📓</span> บันทึกล่าสุด</h2><div class="kv">' + jh + '</div></section>';
  }

  function vGrid(kingdom) {
    var list = filterSkills(skills().filter(function (s) { return s.kingdom === kingdom; }));
    var title = kingdom === 'tech' ? '🔧 TECHNOLOGY' : '🎨 ART & ENTERTAINMENT';
    var g = list.length ? list.map(cardHTML).join('') : '<div class="empty">ไม่เจอทักษะที่ค้นหา — ลองล้างคำค้น</div>';
    return '<section class="card"><h2><span class="em">' + (kingdom === 'tech' ? '🔧' : '🎨') + '</span> ' + title + '</h2>' +
      '<p class="sub">กดการ์ดเพื่อเข้าหน้าทักษะ</p><div class="grid">' + g + '</div></section>';
  }

  function vMine() {
    var tr = filterSkills(tracked().map(bySlug).filter(Boolean));
    var g = tr.length ? tr.map(function (sk) {
      return '<div class="kbox"><b>' + esc(sk.nameTh) + ' ' + (S.target === sk.slug ? '⭐' : '') + '</b>' +
        '<small>' + esc(ST_TH[S.status[sk.slug]] || '') + ' · สะสม ' + hrsOf(sk.slug) + ' ชม.</small>' +
        '<div class="rowbtns"><a class="btn small ghost" href="?skill=' + esc(sk.slug) + '">เปิด →</a>' +
        '<button class="btn small blue" data-target="' + esc(sk.slug) + '">ตั้งเป็นเป้าแรก</button></div></div>';
    }).join('') : '<div class="empty">ยังไม่ติดตามทักษะไหน — ไปเลือกจากหมวด Technology / Art ได้เลย</div>';
    var opts = STATUS.map(function (s) { return '<option value="' + s + '">' + s + ' — ' + ST_TH[s] + '</option>'; }).join('');
    var skOpts = skills().map(function (s) { return '<option value="' + s.slug + '">' + esc(s.nameTh) + '</option>'; }).join('');
    return '<section class="card"><h2><span class="em">🧭</span> การเรียนของฉัน</h2><div class="kv">' + g + '</div>' +
      '<div class="form"><label>➕ ติดตามทักษะใหม่<select id="addSk">' + skOpts + '</select></label>' +
      '<label>สถานะ<select id="addSt">' + opts + '</select></label>' +
      '<div><button class="btn small" id="addBtn">เพิ่มเข้าลิสต์</button></div></div></section>';
  }

  function vTree() {
    var web = bySlug('web-app');
    var inner = '';
    if (web && web.detail && web.detail.tree) {
      inner += '<h3 style="color:#fff;margin:6px 0">🌐 Web App — แผนที่ทักษะย่อย</h3><div class="kv">' + web.detail.tree.nodes.map(function (n) {
        return '<div class="kbox"><b>' + esc(n.label) + '</b><small>ต้องผ่านก่อน: ' + esc((n.requires || []).join(', ') || '—เริ่มได้เลย') +
          '<br>🔓 ปลดล็อกด้วย: ' + esc(n.unlockHint || '—') + '</small></div>';
      }).join('') + '</div>';
    } else {
      inner += '<div class="note todo">🌳 <b>Skill Tree อยู่ระหว่างสร้าง</b></div>';
    }
    var links = (window.ET1UPSKILL_DATA && window.ET1UPSKILL_DATA.crossLinks) || [];
    inner += '<h3 style="color:#fff;margin:16px 0 6px">🔗 ทักษะข้ามสาย (รวมกันเป็นความเชี่ยวชาญเฉพาะตัว)</h3><div class="kv">' +
      links.map(function (c) {
        var a = bySlug(c.a), b = bySlug(c.b);
        return '<div class="kbox"><b>' + esc(a ? a.nameTh : c.a) + ' × ' + esc(b ? b.nameTh : c.b) + '</b><small>' + esc(c.why) + '</small></div>';
      }).join('') + '</div>';
    return '<section class="card"><h2><span class="em">🌳</span> Skill Tree</h2><p class="sub">ทักษะย่อยโยงกันยังไง + ปลดล็อกขั้นสูงด้วยผลงาน (ไม่ใช่แค่นับคลิก)</p>' + inner + '</section>';
  }

  function vProjects() {
    var mine = S.projectLinks.slice().sort(function (a, b) { return b.ts - a.ts; });
    var mh = mine.length ? mine.map(function (p) {
      var sk = bySlug(p.skill); return '<div class="kbox"><b>' + esc(p.name) + '</b><small>' + esc(sk ? sk.nameTh : p.skill) + ' · ' + esc(fmtDate(p.ts)) + '</small><div><a href="' + esc(p.url) + '" target="_blank" rel="noopener">เปิดผลงาน ↗</a></div></div>';
    }).join('') : '<div class="empty">ยังไม่มีผลงานที่ส่ง — ทำเสร็จแล้วแนบลิงก์จากหน้าทักษะได้เลย</div>';
    var ideas = [];
    skills().forEach(function (sk) {
      (sk.detail && sk.detail.projects || []).forEach(function (pr) {
        ideas.push('<div class="kbox"><b>' + esc(pr.name) + ' <small>(' + esc(sk.nameTh) + ' · ' + esc(pr.level) + ')</small></b><small>' + esc((pr.steps || []).join(' → ')).slice(0, 120) + '</small></div>');
      });
    });
    return '<section class="card"><h2><span class="em">🏆</span> ผลงานของฉัน</h2><div class="kv">' + mh + '</div></section>' +
      '<section class="card"><h2><span class="em">💡</span> ไอเดียโปรเจกต์น่าลอง</h2><div class="kv">' + (ideas.join('') || '<div class="empty">ว่าง</div>') + '</div></section>';
  }

  function vJournal() {
    var j = S.reflections.slice().sort(function (a, b) { return b.ts - a.ts; });
    var h = j.length ? j.map(function (r) {
      var sk = bySlug(r.skill);
      return '<div class="kbox"><b>' + esc(sk ? sk.nameTh : r.skill) + '</b><small>' + esc(fmtDate(r.ts)) + (r.minutes ? ' · ฝึก ' + r.minutes + ' นาที' : '') + '</small><div>' + esc(r.text) + '</div>' +
        (r.url ? '<div><a href="' + esc(r.url) + '" target="_blank" rel="noopener">ลิงก์ประกอบ ↗</a></div>' : '') + '</div>';
    }).join('') : '<div class="empty">ยังไม่มีบันทึก</div>';
    return '<section class="card"><h2><span class="em">📓</span> Learning Journal</h2><p class="sub">เรียงใหม่สุดก่อน · เขียนจากหน้าทักษะ (section ความคืบหน้า)</p><div class="kv">' + h + '</div></section>';
  }

  function vResources() {
    var h = '';
    skills().forEach(function (sk) {
      var rs = (sk.detail && sk.detail.resources || []).concat(sk.links || []);
      if (!rs.length) return;
      h += '<div class="kbox"><b>' + esc(sk.nameTh) + '</b>' + rs.map(function (r) {
        return '<div><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.label) + ' ↗</a></div>';
      }).join('') + '</div>';
    });
    return '<section class="card"><h2><span class="em">📚</span> คลังความรู้</h2><p class="sub">ลิงก์ของจริงทั้งหมดในระบบ</p><div class="kv">' + (h || '<div class="empty">ว่าง</div>') + '</div></section>';
  }

  /* ---------- detail ---------- */
  var SECTIONS = [
    ['identity', '🪪', 'Skill Identity'], ['history', '📜', 'History & Evolution'],
    ['fundamentals', '📖', 'Knowledge Fundamentals'], ['roadmap', '🗺️', 'Learning Roadmap'],
    ['practice', '🏋️', 'How to Learn & Practice'], ['tools', '🧰', 'Tools & Resources'],
    ['projects', '🛠️', 'Project-Based Learning'], ['careers', '💼', 'Career & Monetization'],
    ['people', '🌟', 'Famous People'], ['progress', '📈', 'My Progress'], ['references', '🔗', 'References']
  ];
  function secWrap(id, no, title, inner) {
    return '<div class="sec" id="sec-' + id + '"><h3><span class="no">' + no + '</span>' + esc(title) + '</h3>' + inner + '</div>';
  }
  function vDetail(sk) {
    var d = sk.detail;
    var toc = '<div class="toc">' + SECTIONS.map(function (s, i) {
      return '<button data-jump="sec-' + s[0] + '">' + s[1] + ' ' + s[2] + '</button>';
    }).join('') + '</div>';
    var head = '<section class="card"><a class="btn small ghost" href="?tab=' + sk.kingdom + '">← กลับหมวด</a> ' +
      '<h2 style="margin-top:10px"><span class="em">' + (sk.kingdom === 'tech' ? '🔧' : '🎨') + '</span> ' + esc(sk.nameTh) + '</h2>' +
      '<p class="sub">' + esc(sk.nameEn) + ' · ' + esc(sk.summary) + '</p>' + toc;
    if (!d) {
      return head + '<div class="note todo">🚧 <b>เนื้อหาส่วนนี้อยู่ระหว่างค้นคว้า</b><br>' + esc(sk.todoNote || '') +
        '<br><br>หัวข้อที่จะมี: ประวัติศาสตร์ · พื้นฐาน · Roadmap L0–L5 · วิธีฝึก · เครื่องมือ · โปรเจกต์ · อาชีพ · บุคคลต้นแบบ · แหล่งอ้างอิง</div>' +
        progressHTML(sk) + '</section>';
    }
    var h = '';
    var idt = d.identity;
    h += secWrap('identity', '01', 'Skill Identity',
      '<p>' + esc(idt.about) + '</p><ul><li>แก้ปัญหาอะไร: ' + esc(idt.solves) + '</li><li>พื้นฐานที่ต้องมี: ' + esc(idt.basics.join(' · ')) + '</li><li>บทบาท: ' + esc(idt.roles.join(' · ')) + '</li><li>เชื่อมศาสตร์: ' + esc(idt.connects) + '</li><li>เหมาะกับ: ' + esc(idt.fits.join(' · ')) + '</li><li>เรียนคู่กับ: ' + esc(idt.related.join(' · ')) + '</li></ul>');
    h += secWrap('history', '02', 'History & Evolution',
      '<ul class="tl">' + d.history.map(function (e) {
        return '<li><b class="yr num">' + esc(e.year) + '</b><b>' + esc(e.title) + '</b><br>' + esc(e.text) +
          (e.ref ? '<br><span class="ref">อ้างอิง: <a href="' + esc(e.ref) + '" target="_blank" rel="noopener">' + esc(e.ref) + ' ↗</a></span>' : '') + '</li>';
      }).join('') + '</ul>');
    h += secWrap('fundamentals', '03', 'Knowledge Fundamentals',
      '<div class="kv">' + d.fundamentals.map(function (f) {
        return '<div class="kbox"><b>📘 ' + esc(f.term) + '</b><small>' + esc(f.simple) + '</small><div style="font-size:14px">' + esc(f.deep) + '</div><div class="ex">ตัวอย่าง: ' + esc(f.example) + '</div><small>⚠️ มือใหม่มัก: ' + esc(f.mistake) + '</small></div>';
      }).join('') + '</div>');
    h += secWrap('roadmap', '04', 'Learning Roadmap L0–L5',
      Object.keys(d.roadmap).map(function (lv) {
        var r = d.roadmap[lv];
        return '<div class="lvl"><b class="lv num">' + esc(lv) + ' — ' + esc(r.name) + '</b><ul><li>เป้าหมาย: ' + esc(r.goals.join(' · ')) + '</li><li>แบบฝึก: ' + esc(r.exercises.join(' · ')) + '</li><li>โปรเจกต์: ' + esc(r.project) + '</li><li>ผ่านเมื่อ: ' + esc(r.doneWhen) + '</li></ul></div>';
      }).join(''));
    var pr = d.practice;
    h += secWrap('practice', '05', 'How to Learn & Practice',
      '<ul><li>วิธีเรียน: ' + esc(pr.methods.join(' · ')) + '</li><li>มือใหม่: ' + esc(pr.novice.join(' · ')) + '</li><li>ระดับกลาง: ' + esc(pr.intermediate.join(' · ')) + '</li><li>ขั้นสูง: ' + esc(pr.advanced.join(' · ')) + '</li><li>ตารางสัปดาห์: ' + esc(pr.weekly) + '</li><li>ทบทวน: ' + esc(pr.review) + '</li><li>รับ feedback: ' + esc(pr.feedback) + '</li><li>แก้บั๊ก: ' + esc(pr.debug) + '</li><li>เช็คว่าเป็นจริง: ' + esc(pr.selftest) + '</li></ul>');
    h += secWrap('tools', '06', 'Tools & Resources',
      '<div class="kv">' + d.tools.map(function (t) {
        return '<div class="kbox"><b>🧰 ' + esc(t.name) + '</b><small>' + esc(t.use) + ' · เหมาะกับ: ' + esc(t.for) + '</small><div class="ex">ค่าใช้จ่าย: ' + esc(t.cost) + '</div></div>';
      }).join('') + '</div>');
    h += secWrap('projects', '07', 'Project-Based Learning',
      d.projects.map(function (p) {
        return '<div class="lvl"><b class="lv">' + esc(p.name) + ' <small>(' + esc(p.level) + ')</small></b><ul><li>ขั้นตอน: ' + esc(p.steps.join(' → ')) + '</li><li>เสร็จเมื่อ: ' + esc(p.doneWhen) + '</li></ul></div>';
      }).join(''));
    h += secWrap('careers', '08', 'Career & Monetization (ไม่รับประกันรายได้)',
      '<ul>' + d.careers.map(function (c) {
        return '<li><b>' + esc(c.path) + '</b> — ต้องมี: ' + esc(c.needs) + ' · พอร์ต: ' + esc(c.portfolio) + ' · เริ่ม: ' + esc(c.start) + ' · ระวัง: ' + esc(c.watch) + '</li>';
      }).join('') + '</ul>');
    h += secWrap('people', '09', 'Famous People & Case Studies',
      d.people.map(function (p) {
        return '<div class="person"><div class="av">' + esc(p.name.charAt(0)) + '</div><div><b>' + esc(p.name) + '</b><br><small>จุดเริ่ม: ' + esc(p.start) + '</small><br>' + esc(p.skill) + '<br>' + esc(p.work) + '<br><span class="ex">บทเรียน: ' + esc(p.lesson) + '</span><br><span class="ref">อ้างอิง: <a href="' + esc(p.ref) + '" target="_blank" rel="noopener">' + esc(p.ref) + ' ↗</a></span></div></div>';
      }).join(''));
    h += secWrap('progress', '10', 'My Progress & Reflection', progressHTML(sk, false));
    h += secWrap('references', '11', 'References & Further Reading',
      '<ul>' + d.resources.map(function (r) {
        return '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.label) + ' ↗</a><br><span class="ref">' + esc(r.url) + '</span></li>';
      }).join('') + '</ul>');
    return head + h + '</section>';
  }

  function progressHTML(sk, wrapCard) {
    var st = stOf(sk.slug);
    var opts = STATUS.map(function (s) {
      return '<option value="' + s + '"' + (st === s ? ' selected' : '') + '>' + s + ' — ' + ST_TH[s] + '</option>';
    }).join('');
    var my = S.reflections.filter(function (r) { return r.skill === sk.slug; }).slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 3);
    var myh = my.length ? my.map(function (r) {
      return '<div class="kbox"><small>' + esc(fmtDate(r.ts)) + (r.minutes ? ' · ' + r.minutes + ' นาที' : '') + '</small><div>' + esc(r.text) + '</div></div>';
    }).join('') : '<div class="empty">ยังไม่มีบันทึกของทักษะนี้</div>';
    var inner = '<p>สถานะตอนนี้: <b>' + esc(ST_TH[st] || 'ยังไม่ติดตาม') + '</b> · สะสม ' + hrsOf(sk.slug) + ' ชม.' + (S.target === sk.slug ? ' · ⭐ เป้าแรก' : '') + '</p>' +
      '<div class="form"><label>เปลี่ยนสถานะ<select id="pStatus">' + opts + '</select></label>' +
      '<label>➕ ชั่วโมงฝึก (นาที)<input id="pMin" type="number" min="1" step="1" placeholder="เช่น 45"></label>' +
      '<label>✍️ reflection<input id="pText" maxlength="500" placeholder="วันนี้ฝึกอะไร ติดอะไร"></label>' +
      '<label>🔗 ลิงก์ผลงาน (ถ้ามี)<input id="pUrl" placeholder="https://…"></label>' +
      '<div class="rowbtns"><button class="btn small" id="pSave">💾 บันทึกความคืบหน้า</button> ' +
      '<button class="btn small blue" id="pTarget">⭐ ตั้งเป็นเป้าแรก</button></div></div>' +
      '<div class="kv" style="margin-top:10px">' + myh + '</div>';
    return wrapCard === false ? inner : '<section class="card"><h2><span class="em">📈</span> ความคืบหน้าของฉัน</h2>' + inner + '</section>';
  }

  /* ---------- router ---------- */
  function render() {
    paintStats();
    var p = params();
    var slug = p.get('skill');
    var view = $('view');
    if (slug) {
      var sk = bySlug(slug);
      view.innerHTML = sk ? vDetail(sk) : '<div class="empty">ไม่เจอทักษะนี้ — <a href="?tab=tech">กลับไปเลือกทักษะ</a></div>';
      bindDetail(slug);
      return;
    }
    var tab = p.get('tab') || 'overview';
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-tab') === tab);
    });
    if (tab === 'tech' || tab === 'art') view.innerHTML = vGrid(tab);
    else if (tab === 'mine') { view.innerHTML = vMine(); bindMine(); }
    else if (tab === 'tree') view.innerHTML = vTree();
    else if (tab === 'projects') view.innerHTML = vProjects();
    else if (tab === 'journal') view.innerHTML = vJournal();
    else if (tab === 'resources') view.innerHTML = vResources();
    else view.innerHTML = vOverview();
    bindCards();
  }

  function bindCards() {
    document.querySelectorAll('[data-go]').forEach(function (el) {
      el.addEventListener('click', function () { location.search = '?skill=' + el.getAttribute('data-go'); });
    });
  }
  function bindMine() {
    bindCards();
    var add = $('addBtn');
    if (add) add.addEventListener('click', function () {
      var sk = $('addSk').value, st = $('addSt').value;
      if (!sk || !st) return;
      S.status[sk] = st; S.updated[sk] = Date.now(); save(S); render();
    });
    document.querySelectorAll('[data-target]').forEach(function (b) {
      b.addEventListener('click', function () { S.target = b.getAttribute('data-target'); save(S); render(); });
    });
  }
  function bindDetail(slug) {
    bindCards();
    document.querySelectorAll('[data-jump]').forEach(function (b) {
      b.addEventListener('click', function () {
        var el = document.getElementById(b.getAttribute('data-jump'));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
    var sv = $('pSave');
    if (sv) sv.addEventListener('click', function () {
      var st = $('pStatus').value;
      if (st) { S.status[slug] = st; S.updated[slug] = Date.now(); }
      var mins = parseInt(($('pMin').value || '').replace(/[^0-9]/g, ''), 10);
      var txt = ($('pText').value || '').trim();
      var url = ($('pUrl').value || '').trim();
      if (mins > 0) {
        S.minutes[slug] = (+S.minutes[slug] || 0) + mins;
        S.sessions.push({ skill: slug, minutes: mins, ts: Date.now() });
      }
      if (txt) S.reflections.push({ skill: slug, text: txt, minutes: mins > 0 ? mins : 0, url: url, ts: Date.now() });
      if (url && !txt && mins <= 0) S.projectLinks.push({ skill: slug, name: 'ผลงาน ' + slug, url: url, ts: Date.now() });
      if (txt && url && /github|vercel|netlify|youtu|drive\.google|notion/i.test(url)) S.projectLinks.push({ skill: slug, name: txt.slice(0, 40), url: url, ts: Date.now() });
      S.updated[slug] = Date.now();
      save(S); render();
    });
    var tg = $('pTarget');
    if (tg) tg.addEventListener('click', function () { S.target = slug; save(S); render(); });
  }

  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { location.search = '?tab=' + b.getAttribute('data-tab'); });
  });
  $('q').addEventListener('input', function () {
    var p = params();
    if (!p.get('skill')) render();
  });
  $('fStatus').addEventListener('change', render);

  render();
})();
