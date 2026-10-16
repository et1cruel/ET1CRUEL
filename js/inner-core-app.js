/* ===== INNER CORE APP — render + storage (logic ล้วน) ===== */
(function () {
  'use strict';
  var KEY = 'et1cruel.innercore.v1';
  var TABS = ['overview', 'interests', 'desires', 'skills', 'projects', 'values', 'direction', 'archive'];

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function D() { return window.ET1INNER_DATA || { interests: [], values: [], questions: { adaptive: [], daily: [], weekly: [], monthly: [], desire: [] }, projectSeeds: [], skillSeeds: [] }; }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }

  function blankStore() {
    return { v: 1, statement: { text: '', status: 'HYPOTHESIS', updatedAt: null }, interests: {}, skills: {}, projects: {}, values: {}, direction: {}, journal: [], quests: {}, focus: { main: '', subs: [] }, archive: [] };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankStore();
      var o = JSON.parse(raw);
      if (!isObj(o)) return blankStore();
      var b = blankStore();
      ['interests', 'skills', 'projects', 'values', 'direction', 'quests', 'focus'].forEach(function (k) { if (!isObj(o[k])) o[k] = b[k]; });
      if (!Array.isArray(o.journal)) o.journal = [];
      if (!Array.isArray(o.archive)) o.archive = [];
      if (!Array.isArray(o.customs)) o.customs = [];
      if (!isObj(o.desires)) o.desires = {};
      if (!isObj(o.statement)) o.statement = b.statement;
      return o;
    } catch (e) { return blankStore(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load();

  function params() { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; } }; } }
  function fmtDate(ts) { try { return new Date(ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function statusTag(st) {
    var m = { CONFIRMED: ['confirmed', '✓ ยืนยันแล้ว'], SIGNAL: ['signal', '◉ สัญญาณที่พบ'], HYPOTHESIS: ['hypo', '? สมมติฐาน'], UNKNOWN: ['unknown', '? ยังไม่ทราบ'] };
    var x = m[st] || m.UNKNOWN;
    return '<span class="tag ' + x[0] + '">' + x[1] + '</span>';
  }
  function intById(id) { return allInterests().filter(function (x) { return x.id === id; })[0] || null; }
  function userStatus(id) { return (S.interests[id] && S.interests[id].status) || (intById(id) ? intById(id).seedStatus : 'UNKNOWN'); }

  function paintStats() {
    var conf = 0, sig = 0;
    D().interests.forEach(function (s) {
      var st = userStatus(s.id);
      if (st === 'CONFIRMED') conf++; else if (st === 'SIGNAL') sig++;
    });
    Object.keys(S.interests).forEach(function (k) {
      if (!intById(k) && S.interests[k].status === 'CONFIRMED') conf++;
    });
    var open = D().interests.filter(function (s) { return userStatus(s.id) !== 'CONFIRMED'; }).length;
    $('stConf').textContent = conf;
    $('stSig').textContent = sig;
    $('stOpen').textContent = open;
    $('stJrn').textContent = S.journal.length;
  }

  /* ---------- overview ---------- */
  function defaultStatement() {
    return 'คนที่กำลังสร้างสะพานระหว่างโลกของเสียง งานศิลปะ และเทคโนโลยี พร้อมทดลองเปลี่ยนสิ่งที่สนใจให้กลายเป็นผลงานและระบบที่ใช้งานได้จริง';
  }
  function vOverview() {
    var st = S.statement.text || defaultStatement();
    var isDefault = !S.statement.text;
    var top = D().interests.slice(0, 6).map(function (s) {
      return '<div class="kbox"><b>' + esc(s.name) + '</b>' + statusTag(userStatus(s.id)) + '<small>' + esc(s.evidence).slice(0, 90) + '</small></div>';
    }).join('');
    var f = S.focus;
    var focusH = (f.main || f.subs.length)
      ? '<div class="kbox"><b>🎯 ' + esc(f.main || '—') + '</b><small>รอง: ' + esc(f.subs.join(' · ') || '—') + '</small></div>'
      : '<div class="empty">ยังไม่ตั้งโฟกัส — เลือกโฟกัสหลัก 1 + รองไม่เกิน 2 ได้ด้านล่าง</div>';
    var unknowns = D().interests.filter(function (s) { return userStatus(s.id) !== 'CONFIRMED'; }).slice(0, 4).map(function (s) {
      return '<div class="kbox"><b>?' + esc(s.name) + '</b><small>' + esc(s.unknown).slice(0, 90) + '</small><div class="rowbtns"><a class="btn small ghost" href="?tab=interests&open=' + esc(s.id) + '">สำรวจ →</a></div></div>';
    }).join('');
    return '<section class="card"><h2><span class="em">◈</span> THE CORE — ฉันเป็นใคร (จากหลักฐาน)</h2>' +
      '<div class="stmt">“' + esc(st) + '”<br>' + statusTag(S.statement.status || 'HYPOTHESIS') + ' <span class="ev">อัปเดต ' + esc(S.statement.updatedAt ? fmtDate(S.statement.updatedAt) : 'ยังไม่เคย') + '</span></div>' +
      '<div class="rowbtns"><button class="btn small" data-act="st-confirm">✓ ยืนยัน</button>' +
      '<button class="btn small ghost" data-act="st-edit">✎ แก้ไข</button>' +
      '<button class="btn small ghost" data-act="st-no">✕ ไม่เห็นด้วย</button>' +
      '<button class="btn small vio" data-act="st-ev">🔍 ดูหลักฐาน</button></div>' +
      '<div id="stmtBox"></div>' +
      (isDefault ? '<p class="ev" style="margin-top:8px">ประโยคนี้เป็นร่างสมมติฐานจากบริบทที่เจ้าของเล่าไว้ — ยืนยัน/แก้ไขได้เสมอ ไม่ใช่คำตัดสิน</p>' : '') + '</section>' +
      '<section class="card"><h2><span class="em">📸</span> ภาพรวมตอนนี้</h2><div class="kv">' + top + '</div></section>' +
      '<section class="card"><h2><span class="em">🎯</span> โฟกัสตอนนี้</h2><div class="kv">' + focusH + '</div>' +
      '<div class="form"><label>โฟกัสหลัก<input id="fMain" value="' + esc(f.main) + '" maxlength="80" placeholder="เช่น จบเพลงแรก"></label>' +
      '<label>โฟกัสรอง (คั่นด้วย ,)<input id="fSubs" value="' + esc(f.subs.join(', ')) + '" maxlength="160"></label>' +
      '<div><button class="btn small" id="fSave">บันทึกโฟกัส</button></div></div></section>' +
      '<section class="card"><h2><span class="em">🔭</span> เรื่องที่ยังต้องค้นพบ</h2><div class="kv">' + unknowns + '</div></section>';
  }

  function bindOverview() {
    document.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var box = $('stmtBox'), act = b.getAttribute('data-act');
        if (act === 'st-confirm') { S.statement.status = 'CONFIRMED'; if (!S.statement.text) S.statement.text = defaultStatement(); S.statement.updatedAt = Date.now(); save(S); render(); }
        else if (act === 'st-no') { S.statement.status = 'UNKNOWN'; S.statement.updatedAt = Date.now(); save(S); render(); }
        else if (act === 'st-edit') {
          box.innerHTML = '<div class="form"><label>ประโยคตัวตนของฉัน<textarea id="stText" rows="3">' + esc(S.statement.text || defaultStatement()) + '</textarea></label><div><button class="btn small" id="stGo">บันทึก (เป็นข้อยืนยันของฉัน)</button></div></div>';
          $('stGo').addEventListener('click', function () {
            S.statement.text = ($('stText').value || '').trim() || defaultStatement();
            S.statement.status = 'CONFIRMED'; S.statement.updatedAt = Date.now(); save(S); render();
          });
        }
        else if (act === 'st-ev') {
          box.innerHTML = '<div class="drawer"><b>หลักฐานที่ใช้สร้างร่างนี้</b><br>· บริบทที่เจ้าของเล่าไว้ (ดนตรี/เทค/AI/หุ่นยนต์/ภาพ/ธุรกิจ/สอน)<br>· ห้องจริงในเว็บ (เพลง, Agency, วิดีโอ, UPSKILL)<br><b>ข้อจำกัด:</b> เป็นสมมติฐานจนกว่าเจ้าของจะยืนยัน — กดยืนยัน/แก้ไข/ไม่เห็นด้วยได้เลย<br><b>สถานะ:</b> ' + esc(S.statement.status || 'HYPOTHESIS') + '</div>';
        }
      });
    });
    var fs = $('fSave');
    if (fs) fs.addEventListener('click', function () {
      S.focus.main = ($('fMain').value || '').trim();
      S.focus.subs = ($('fSubs').value || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 2);
      save(S); render();
    });
  }

  function interestCard(s, withLink) {
    return '<div class="kbox"><b>' + esc(s.name) + '</b>' + statusTag(userStatus(s.id)) +
      '<small>' + esc(s.evidence).slice(0, 110) + '</small>' +
      (withLink ? '<div class="rowbtns"><a class="btn small ghost" href="?tab=interests&open=' + esc(s.id) + '">เปิดดู →</a></div>' : '') + '</div>';
  }
  function norm(x) { return String(x || '').toLowerCase().replace(/[\s_]+/g, ''); }

  function vInterests() {
    var p = params(), openId = p.get('open');
    var h = '';
    if (openId) h += interestDetail(openId);
    var groups = ['CREATE', 'BUILD', 'EXPLORE', 'SHARE', 'LIVE'];
    h += groups.map(function (g) {
      var list = allInterests().filter(function (x) { return x.group === g; });
      return '<section class="card"><h2><span class="em">🗂️</span> ' + g + ' <span class="ev">(' + list.length + ')</span></h2><div class="kv">' +
        list.map(function (x) { return interestCard(x, true); }).join('') + '</div></section>';
    }).join('');
    h += priorityBlock();
    h += '<section class="card"><h2><span class="em">➕</span> เพิ่มความสนใจของฉัน</h2>' +
      '<div class="form"><label>ชื่อ<input id="niName" maxlength="60" placeholder="เช่น ทำซาวด์ประกอบเกม"></label>' +
      '<label>กลุ่ม<select id="niGroup"><option>CREATE</option><option>BUILD</option><option>EXPLORE</option><option>SHARE</option><option>LIVE</option></select></label>' +
      '<label>หลักฐาน/ที่มา<input id="niEv" maxlength="200" placeholder="เคยทำ/เจอมาจากไหน"></label>' +
      '<div><button class="btn small" id="niAdd">เพิ่ม</button></div></div></section>';
    return h;
  }

  function interestDetail(openId) {
    var s = allInterests().filter(function (x) { return x.id === openId; })[0];
    if (!s) return '<div class="empty">ไม่เจอหัวข้อนี้ — <a href="?tab=interests">กลับรายการ</a></div>';
    var u = S.interests[openId] || {};
    var st = u.status || s.seedStatus || 'UNKNOWN';
    var r = u.ratings || {};
    var opts = STATUS_LIST.map(function (x) {
      return '<option value="' + x + '"' + (st === x ? ' selected' : '') + '>' + x + ' — ' + ST_TH[x] + '</option>';
    }).join('');
    var axes = AXES.map(function (a) {
      var v = +r[a[0]] || 0;
      var o = '<option value="0">ยังไม่ทราบ</option>' + [1, 2, 3, 4, 5].map(function (n) {
        return '<option value="' + n + '"' + (v === n ? ' selected' : '') + '>' + n + '</option>';
      }).join('');
      return '<label>' + a[1] + '<select data-ax="' + a[0] + '">' + o + '</select></label>';
    }).join('');
    var isCustom = (S.customs || []).some(function (x) { return x.id === openId; });
    return '<section class="card"><a class="btn small ghost" href="?tab=interests">← กลับรายการ</a>' +
      '<h2 style="margin-top:10px"><span class="em">💜</span> ' + esc(s.name) + '</h2>' +
      '<p class="sub">' + statusTag(st) + '</p>' +
      '<div class="drawer"><b>🔎 สัญญาณที่พบ</b><br>' + esc(s.evidence || '—') +
      '<br><br><b>? ยังไม่ทราบ</b><br>' + esc(s.unknown || '—') +
      '<br><br><b>💬 คำถามสำรวจ</b><br>' + esc(s.question || '—') + '</div>' +
      '<div class="form"><label>สถานะ<select id="iStatus">' + opts + '</select></label>' + axes +
      '<label>✎ โน้ต<textarea id="iNotes" rows="2">' + esc(u.notes || '') + '</textarea></label>' +
      '<div class="rowbtns"><button class="btn small" id="iSave">💾 บันทึก</button>' +
      (isCustom ? '<button class="btn small ghost" id="iDel">ลบ (ยืนยัน)</button>' : '') + '</div></div></section>';
  }

  function priorityBlock() {
    function avgFor(id, keys) {
      var r = (S.interests[id] || {}).ratings || {};
      var vs = keys.map(function (k) { return +r[k] || 0; }).filter(function (v) { return v > 0; });
      if (!vs.length) return null;
      return Math.round((vs.reduce(function (a, b) { return a + b; }, 0) / vs.length) * 10) / 10;
    }
    var love = allInterests().map(function (s) { return { s: s, v: avgFor(s.id, ['enjoyment', 'meaning']) }; }).filter(function (x) { return x.v !== null; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
    var strat = allInterests().map(function (s) { return { s: s, v: avgFor(s.id, ['practical', 'longterm']) }; }).filter(function (x) { return x.v !== null; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
    var li = love.length ? love.map(function (x) { return '<div class="kbox"><b>' + esc(x.s.name) + '</b><small>รัก ' + x.v + '/5 (จาก enjoyment+meaning)</small></div>'; }).join('') : '<div class="empty">ให้คะแนน enjoyment/meaning ก่อน อันดับจะขึ้นตรงนี้ (ไม่เดาแทน)</div>';
    var si = strat.length ? strat.map(function (x) { return '<div class="kbox"><b>' + esc(x.s.name) + '</b><small>กลยุทธ์ ' + x.v + '/5 (จาก practical+longterm)</small></div>'; }).join('') : '<div class="empty">ให้คะแนน practical/longterm ก่อน</div>';
    var overlap = love.map(function (x) { return x.s.id; }).filter(function (id) { return strat.some(function (y) { return y.s.id === id; }); });
    var ov = overlap.length ? overlap.map(function (id) { var s = allInterests().filter(function (x) { return x.id === id; })[0]; return esc(s ? s.name : id); }).join(' · ') : '— (ยังไม่มีจุดร่วม ต้องเก็บคะแนนเพิ่ม)';
    return '<section class="card"><h2><span class="em">⚖️</span> จัดอันดับจากข้อมูลของฉัน</h2>' +
      '<p class="sub">คำนวณเฉพาะแกนที่ให้คะแนนแล้ว — ช่องไหนว่างแสดงว่าไม่พอ ไม่ใส่ศูนย์แทน</p>' +
      '<h3 style="color:#fff;margin:8px 0">❤️ รักที่สุด</h3><div class="kv">' + li + '</div>' +
      '<h3 style="color:#fff;margin:12px 0 8px">🎯 สำคัญเชิงกลยุทธ์</h3><div class="kv">' + si + '</div>' +
      '<div class="note" style="margin-top:12px">🔗 <b>จุดตัด:</b> ' + ov + '</div></section>';
  }

  function bindInterests() {
    var sv = document.querySelector('#iSave');
    if (sv) sv.addEventListener('click', function () {
      var p = params(), id = p.get('open');
      if (!id) return;
      var cur = S.interests[id] || {};
      cur.status = document.querySelector('#iStatus').value;
      cur.ratings = cur.ratings || {};
      document.querySelectorAll('[data-ax]').forEach(function (el) {
        var v = +el.value || 0;
        if (v > 0) cur.ratings[el.getAttribute('data-ax')] = v;
        else delete cur.ratings[el.getAttribute('data-ax')];
      });
      cur.notes = (document.querySelector('#iNotes').value || '').trim();
      S.interests[id] = cur;
      save(S); render();
    });
    var del = document.querySelector('#iDel');
    if (del) del.addEventListener('click', function () {
      var p = params(), id = p.get('open');
      if (!id || !confirm('ลบ “' + id + '” ออกจากลิสต์ใช่ไหม? (กู้ไม่ได้)')) return;
      delete S.interests[id];
      S.customs = (S.customs || []).filter(function (x) { return x.id !== id; });
      save(S); location.search = '?tab=interests';
    });
    var add = document.querySelector('#niAdd');
    if (add) add.addEventListener('click', function () {
      var nm = (document.querySelector('#niName').value || '').trim();
      if (!nm) return;
      var id = 'u' + Date.now();
      (S.customs = S.customs || []).push({ id: id, name: nm, group: document.querySelector('#niGroup').value, seedStatus: 'UNKNOWN', evidence: (document.querySelector('#niEv').value || '').trim() || 'ผู้ใช้เพิ่มเอง', unknown: 'รอสำรวจ', question: 'อะไรคือสิ่งแรกที่อยากลองกับเรื่องนี้?' });
      save(S); render();
    });
  }

  function vDesires() {
    var cats = [['A', 'สิ่งที่รัก/ชอบทำ'], ['B', 'สิ่งที่อยากสร้าง'], ['C', 'ประสบการณ์ที่อยากมี'], ['D', 'คนที่อยากเป็น'], ['E', 'สิ่งที่อยากมอบให้โลก'], ['F', 'สิ่งที่อยากเลิกทำ']];
    var ds = S.desires || {};
    var h = cats.map(function (c) {
      var items = ds[c[0]] || [];
      var li = items.length ? '<ul>' + items.map(function (t, i) {
        return '<li>' + esc(t) + ' <button class="btn small ghost" data-ddel="' + c[0] + ':' + i + '">ลบ</button></li>';
      }).join('') + '</ul>' : '<div class="empty">ยังว่าง — เพิ่มข้อแรกได้เลย ไม่ต้องครบ</div>';
      return '<section class="card"><h2><span class="em">🔥</span> ' + c[0] + ' · ' + c[1] + '</h2>' + li +
        '<div class="form"><label>เพิ่ม<input id="din-' + c[0] + '" maxlength="140"></label><div><button class="btn small" data-dadd="' + c[0] + '">เพิ่ม</button></div></div></section>';
    }).join('');
    h += '<section class="card"><h2><span class="em">❓</span> คำถามช่วยแยกแยะ</h2><ul>' +
      D().questions.desire.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul></section>';
    return h;
  }

  function bindDesires() {
    document.querySelectorAll('[data-dadd]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-dadd');
        var inp = document.querySelector('#din-' + k);
        var v = (inp.value || '').trim();
        if (!v) return;
        S.desires = S.desires || {};
        S.desires[k] = S.desires[k] || [];
        S.desires[k].push(v);
        save(S); render();
      });
    });
    document.querySelectorAll('[data-ddel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var parts = b.getAttribute('data-ddel').split(':');
        if (!confirm('ลบข้อนี้ใช่ไหม?')) return;
        S.desires[parts[0]].splice(+parts[1], 1);
        save(S); render();
      });
    });
  }
  function searchBlock() {
    var q = norm(($('q').value || '').trim());
    if (!q) return '';
    var hits = D().interests.filter(function (s) {
      return norm((s.th || '') + ' ' + s.name + ' ' + s.evidence + ' ' + s.id).indexOf(q) >= 0;
    }).slice(0, 12);
    if (!hits.length) return '<section class="card"><div class="empty">ไม่เจอ “' + esc($('q').value) + '” — ลองคำอื่น</div></section>';
    return '<section class="card"><h2><span class="em">🔍</span> ผลการค้นหา (' + hits.length + ')</h2><div class="kv">' +
      hits.map(function (s) { return interestCard(s, true); }).join('') + '</div></section>';
  }
  function todoShell(name) {
    return '<section class="card"><h2><span class="em">🚧</span> ' + esc(name) + '</h2><div class="empty">โมดูลนี้อยู่ในแผน Task ถัดไป — โครงมาแล้ว เนื้อหาตามมา (ไม่แสดงของปลอม)</div></section>';
  }

  var AXES = [['curiosity', 'ความอยากรู้'], ['enjoyment', 'ความสุขตอนทำ'], ['persistence', 'ความเต็มใจฝึก'], ['longterm', 'อยากทำระยะยาว'], ['energy', 'พลังที่ได้'], ['meaning', 'ความหมายต่อชีวิต'], ['practical', 'ใช้ได้จริง'], ['evidence', 'หลักฐานลงมือ']];
  var STATUS_LIST = ['WISHLIST', 'EXPLORING', 'LEARNING', 'PRACTICING', 'PROJECT', 'MASTERED', 'PAUSED', 'CONFIRMED', 'SIGNAL', 'HYPOTHESIS', 'UNKNOWN'];
  var ST_TH = { WISHLIST: 'อยากเรียน', EXPLORING: 'กำลังสำรวจ', LEARNING: 'กำลังเรียน', PRACTICING: 'กำลังฝึก', PROJECT: 'ทำโปรเจกต์', MASTERED: 'เชี่ยวชาญแล้ว', PAUSED: 'หยุดพัก', CONFIRMED: 'ยืนยันแล้ว', SIGNAL: 'สัญญาณที่พบ', HYPOTHESIS: 'สมมติฐาน', UNKNOWN: 'ยังไม่ทราบ' };
  function allInterests() { return D().interests.concat(S.customs || []); }
  function allInterests() { return D().interests.concat(S.customs || []); }
  function avgRated(r) {
    var vs = AXES.map(function (a) { return +((r || {})[a[0]]) || 0; }).filter(function (v) { return v > 0; });
    if (vs.length < 2) return null;
    return Math.round((vs.reduce(function (a, b) { return a + b; }, 0) / vs.length) * 10) / 10;
  }

  /* ---------- router ---------- */
  function render() {
    paintStats();
    var p = params();
    var tab = p.get('tab') || 'overview';
    if (TABS.indexOf(tab) < 0) {
      $('view').innerHTML = '<div class="empty">ไม่เจอแท็บนี้ — <a href="?tab=overview">กลับภาพรวม</a></div>';
      return;
    }
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-tab') === tab);
    });
    var view = $('view');
    if (tab === 'overview') { view.innerHTML = searchBlock() + vOverview(); bindOverview(); return; }
    if (tab === 'interests') { view.innerHTML = vInterests(); bindInterests(); return; }
    if (tab === 'desires') { view.innerHTML = vDesires(); bindDesires(); return; }
    var titles = { interests: 'ความสนใจ', desires: 'อยากทำที่สุด', skills: 'ทักษะ', projects: 'โปรเจกต์', values: 'ค่านิยม', direction: 'ทิศชีวิต', archive: 'คลังตัวตน' };
    view.innerHTML = todoShell(titles[tab] || tab);
  }

  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { location.search = '?tab=' + b.getAttribute('data-tab'); });
  });
  $('q').addEventListener('input', render);

  render();
})();
