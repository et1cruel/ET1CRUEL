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
    return { v: 1, statement: { text: '', status: 'HYPOTHESIS', updatedAt: null }, interests: {}, skills: {}, projects: {}, values: {}, direction: {}, journal: [], quests: {}, focus: { main: '', subs: [] }, archive: [], customs: [], desires: {}, style: {}, tradeoffs: [] };
  }
  /* ---- sanitize: กันข้อมูลเสีย/ไฟล์นำเข้าที่ผิดรูป (ไม่ให้ห้องว่างเปล่าหรือ throw) ---- */
  function strArr(a) { return (Array.isArray(a) ? a : []).filter(function (x) { return typeof x === 'string'; }); }
  function strMap(o) {
    var r = {};
    if (isObj(o)) Object.keys(o).forEach(function (k) { if (typeof o[k] === 'string') r[k] = o[k]; });
    return r;
  }
  function objMap(o) {
    var r = {};
    if (isObj(o)) Object.keys(o).forEach(function (k) { if (isObj(o[k])) r[k] = o[k]; });
    return r;
  }
  function itemArr(a, fields) {
    return (Array.isArray(a) ? a : []).filter(isObj).map(function (x) {
      var o = {};
      fields.forEach(function (f) {
        var v = x[f];
        if (f === 'ts') o.ts = (+v || 0);
        else o[f] = (v == null) ? '' : String(v);
      });
      return o;
    });
  }
  function sanitize(o) {
    if (!isObj(o)) return blankStore();
    var s = {};
    s.v = 1;
    s.statement = {
      text: (isObj(o.statement) && typeof o.statement.text === 'string') ? o.statement.text : '',
      status: (isObj(o.statement) && typeof o.statement.status === 'string') ? o.statement.status : 'HYPOTHESIS',
      updatedAt: (isObj(o.statement) && +o.statement.updatedAt) || null
    };
    s.focus = {
      main: (isObj(o.focus) && typeof o.focus.main === 'string') ? o.focus.main : '',
      subs: (isObj(o.focus) ? strArr(o.focus.subs) : []).slice(0, 2)
    };
    s.direction = strMap(o.direction);
    s.style = strMap(o.style);
    s.values = objMap(o.values);
    s.skills = objMap(o.skills);
    s.projects = objMap(o.projects);
    s.quests = objMap(o.quests);
    s.journal = itemArr(o.journal, ['type', 'text', 'ts']);
    s.archive = itemArr(o.archive, ['text', 'source', 'ts']);
    s.tradeoffs = itemArr(o.tradeoffs, ['a', 'b', 'note']);
    s.customs = (Array.isArray(o.customs) ? o.customs : []).filter(isObj).map(function (c) {
      return {
        id: String(c.id || ''), name: (c.name == null ? '' : String(c.name)),
        th: (c.th == null ? '' : String(c.th)), group: String(c.group || 'CREATE'),
        evidence: (c.evidence == null ? '' : String(c.evidence)),
        unknown: (c.unknown == null ? '' : String(c.unknown)),
        seedStatus: String(c.seedStatus || 'UNKNOWN'), custom: true
      };
    }).filter(function (c) { return c.id && c.name; });
    s.interests = {};
    if (isObj(o.interests)) Object.keys(o.interests).forEach(function (k) {
      var v = o.interests[k];
      if (!isObj(v)) return;
      var ratings = {};
      if (isObj(v.ratings)) Object.keys(v.ratings).forEach(function (ax) {
        var n = +v.ratings[ax];
        if (n > 0) ratings[ax] = n;
      });
      s.interests[k] = {
        status: typeof v.status === 'string' ? v.status : '',
        ratings: ratings,
        notes: typeof v.notes === 'string' ? v.notes : '',
        ts: +v.ts || 0
      };
    });
    var d = isObj(o.desires) ? o.desires : {};
    s.desires = {};
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(function (k) { s.desires[k] = strArr(d[k]); });
    return s;
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankStore();
      return sanitize(JSON.parse(raw));
    } catch (e) { return blankStore(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load();

  function params() { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; } }; } }
  var seq = 0;
  function uid(p) { seq++; return (p || 'x') + Date.now().toString(36) + seq.toString(36); }
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
      return '<div class="kbox"><b>' + esc(s.name) + '</b>' + statusTag(userStatus(s.id)) + '<small>' + esc(String(s.evidence || '').slice(0, 90)) + '</small></div>';
    }).join('');
    var f = S.focus;
    var focusH = (f.main || f.subs.length)
      ? '<div class="kbox"><b>🎯 ' + esc(f.main || '—') + '</b><small>รอง: ' + esc(f.subs.join(' · ') || '—') + '</small></div>'
      : '<div class="empty">ยังไม่ตั้งโฟกัส — เลือกโฟกัสหลัก 1 + รองไม่เกิน 2 ได้ด้านล่าง</div>';
    var unknowns = D().interests.filter(function (s) { return userStatus(s.id) !== 'CONFIRMED'; }).slice(0, 4).map(function (s) {
      return '<div class="kbox"><b>?' + esc(s.name) + '</b><small>' + esc(String(s.unknown || '').slice(0, 90)) + '</small><div class="rowbtns"><a class="btn small ghost" href="?tab=interests&open=' + esc(s.id) + '">สำรวจ →</a></div></div>';
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
      '<small>' + esc(String(s.evidence || '').slice(0, 110)) + '</small>' +
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
    var LIFE = ['WISHLIST', 'EXPLORING', 'LEARNING', 'PRACTICING', 'PROJECT', 'MASTERED', 'PAUSED'];
    var EVID = ['CONFIRMED', 'SIGNAL', 'HYPOTHESIS', 'UNKNOWN'];
    var opts = '<optgroup label="ขั้นของการลงมือ (เดินหน้าได้เรื่อยๆ)">' +
      LIFE.map(function (x) { return '<option value="' + x + '"' + (st === x ? ' selected' : '') + '>' + x + ' — ' + ST_TH[x] + '</option>'; }).join('') +
      '</optgroup><optgroup label="ระดับหลักฐาน (มีแค่หลักฐานเท่านั้นที่เลื่อนได้)">' +
      EVID.map(function (x) { return '<option value="' + x + '"' + (st === x ? ' selected' : '') + '>' + x + ' — ' + ST_TH[x] + '</option>'; }).join('') +
      '</optgroup>';
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
      var cur = isObj(S.interests[id]) ? S.interests[id] : {};
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
      if (!id) return;
      var nmShow = (intById(id) || {}).name || id;
      if (!confirm('ลบ “' + nmShow + '” ออกจากลิสต์ใช่ไหม? (กู้ไม่ได้)')) return;
      delete S.interests[id];
      S.customs = (S.customs || []).filter(function (x) { return x.id !== id; });
      save(S); location.search = '?tab=interests';
    });
    var add = document.querySelector('#niAdd');
    if (add) add.addEventListener('click', function () {
      var nm = (document.querySelector('#niName').value || '').trim();
      if (!nm) return;
      var id = uid('u');
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
    var hits = allInterests().filter(function (s) {
      return norm((s.th || '') + ' ' + s.name + ' ' + (s.evidence || '') + ' ' + s.id).indexOf(q) >= 0;
    }).slice(0, 12);
    if (!hits.length) return '<section class="card"><div class="empty">ไม่เจอ “' + esc($('q').value) + '” — ลองคำอื่น</div></section>';
    return '<section class="card"><h2><span class="em">🔍</span> ผลการค้นหา (' + hits.length + ')</h2><div class="kv">' +
      hits.map(function (s) { return interestCard(s, true); }).join('') + '</div></section>';
  }
  var AXES = [['curiosity', 'ความอยากรู้'], ['enjoyment', 'ความสุขตอนทำ'], ['persistence', 'ความเต็มใจฝึก'], ['longterm', 'อยากทำระยะยาว'], ['energy', 'พลังที่ได้'], ['meaning', 'ความหมายต่อชีวิต'], ['practical', 'ใช้ได้จริง'], ['evidence', 'หลักฐานลงมือ']];
  var ST_TH = { WISHLIST: 'อยากเรียน', EXPLORING: 'กำลังสำรวจ', LEARNING: 'กำลังเรียน', PRACTICING: 'กำลังฝึก', PROJECT: 'ทำโปรเจกต์', MASTERED: 'เชี่ยวชาญแล้ว', PAUSED: 'หยุดพัก', CONFIRMED: 'ยืนยันแล้ว', SIGNAL: 'สัญญาณที่พบ', HYPOTHESIS: 'สมมติฐาน', UNKNOWN: 'ยังไม่ทราบ' };
  function allInterests() { return D().interests.concat(S.customs || []); }

  var VLEVELS = ['สำคัญมาก', 'สำคัญ', 'กลางๆ', 'ไม่เกี่ยว', 'ยังไม่แน่ใจ'];
  function levelOpts(list, cur) {
    return '<option value="">— ยังไม่ระบุ</option>' + list.map(function (l) { return '<option' + (cur === l ? ' selected' : '') + '>' + l + '</option>'; }).join('');
  }
  function vValues() {
    var h = '<section class="card"><h2><span class="em">⚖️</span> ค่านิยมของฉัน</h2><p class="sub">เลือกเองทุกข้อ — ไม่เลือกคือไม่นับ ไม่เดาแทน</p><div class="kv">' +
      D().values.map(function (v) {
        var u = S.values[v.id] || {};
        return '<div class="kbox"><b>' + esc(v.name) + '</b><small>' + esc(v.desc) + '</small>' +
          '<div class="form"><label>ความสำคัญ<select data-vimp="' + esc(v.id) + '">' +
          levelOpts(VLEVELS, u.importance) + '</select></label>' +
          '<label style="flex-direction:row;align-items:center;gap:8px;display:flex"><input type="checkbox" data-vconf="' + esc(v.id) + '"' + (u.confirmed ? ' checked' : '') + ' style="width:auto"> นี่คือฉันจริงๆ</label></div></div>';
      }).join('') + '</div><div class="rowbtns"><button class="btn small" id="vSave">💾 บันทึกค่านิยม</button></div></section>';
    var to = (S.tradeoffs || []);
    var th = to.length ? '<ul>' + to.map(function (t, i) {
      return '<li><b>' + esc(t.a) + ' × ' + esc(t.b) + '</b> — ' + esc(t.note) + ' <button class="btn small ghost" data-tdel="' + i + '">ลบ</button></li>';
    }).join('') + '</ul>' : '<div class="empty">ยังไม่มีข้อขัดแย้งที่สำรวจ</div>';
    var vnames = D().values.map(function (v) { return '<option>' + esc(v.name) + '</option>'; }).join('');
    h += '<section class="card"><h2><span class="em">🔀</span> Trade-off Explorer</h2><p class="sub">ค่านิยม 2 ข้อที่ดึงกัน — ไม่ต้องเลือกข้างเดียว หาทางอยู่ด้วยกัน</p>' + th +
      '<div class="form"><label>ด้าน A<select id="tA">' + vnames + '</select></label><label>ด้าน B<select id="tB">' + vnames + '</select></label>' +
      '<label>อยู่ด้วยกันอย่างไร<input id="tN" maxlength="200" placeholder="เช่น รับงานประจำ 3 วัน อีก 2 วันให้เพลง"></label>' +
      '<div><button class="btn small" id="tAdd">บันทึก</button></div></div></section>';
    return h;
  }
  function bindValues() {
    var sv = document.querySelector('#vSave');
    if (sv) sv.addEventListener('click', function () {
      document.querySelectorAll('[data-vimp]').forEach(function (el) {
        var id = el.getAttribute('data-vimp');
        S.values[id] = S.values[id] || {};
        if (el.value) S.values[id].importance = el.value;
        else delete S.values[id].importance; // ไม่เลือก = ไม่นับ (ไม่เดาแทน)
      });
      document.querySelectorAll('[data-vconf]').forEach(function (el) {
        var id = el.getAttribute('data-vconf');
        S.values[id] = S.values[id] || {};
        S.values[id].confirmed = !!el.checked;
      });
      save(S); render();
    });
    var ta = document.querySelector('#tAdd');
    if (ta) ta.addEventListener('click', function () {
      var a = document.querySelector('#tA').value, b = document.querySelector('#tB').value;
      var n = (document.querySelector('#tN').value || '').trim();
      if (!n || a === b) return;
      S.tradeoffs = S.tradeoffs || [];
      S.tradeoffs.push({ a: a, b: b, note: n });
      save(S); render();
    });
    document.querySelectorAll('[data-tdel]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('ลบข้อนี้ใช่ไหม?')) return;
        S.tradeoffs.splice(+b.getAttribute('data-tdel'), 1);
        save(S); render();
      });
    });
  }

  var DAREAS = [['creative', 'ชีวิตสร้างสรรค์'], ['technical', 'ชีวิตเทคนิค'], ['work', 'งาน/ธุรกิจ'], ['money', 'มั่นคงการเงิน'], ['learn', 'การเรียนรู้'], ['freedom', 'อิสระ'], ['people', 'คน/ชุมชน'], ['travel', 'เที่ยว/สำรวจ'], ['health', 'สุขภาพ/รูทีน'], ['arttime', 'เวลาดนตรี/ศิลปะ'], ['longterm', 'โปรเจกต์ยาว']];
  var DLEVELS = ['สำคัญมาก', 'สำคัญ', 'กำลังทดลอง', 'ยังไม่แน่ใจ', 'ยังไม่เน้น'];
  var STYLEQ = [
    ['solo', 'ทำงานแบบไหน?', ['คนเดียว', 'มีเพื่อนร่วมทาง']],
    ['brief', 'เริ่มจากอะไร?', ['ไอเดียตัวเอง', 'โจทย์ชัดๆ']],
    ['mode', 'ชอบแบบไหน?', ['ลงมือเป็นโปรเจกต์', 'เรียนเป็นคอร์ส']],
    ['plan', 'สไตล์ไหน?', ['ลองก่อนค่อยปรับ', 'วางแผนละเอียดก่อน']],
    ['span', 'งานแบบไหน?', ['สั้นจบไว', 'ยาวลึก']],
    ['output', 'ชอบเห็นผลเป็นอะไร?', ['ภาพ', 'เสียง', 'โปรแกรม', 'ตัวหนังสือ']]
  ];
  function vDirection() {
    var h = '<section class="card"><h2><span class="em">🧭</span> ทิศชีวิต (11 ด้าน)</h2><p class="sub">พักผ่อนและใช้ชีวิตโดยไม่มีเป้าหมายก็มีที่อยู่ตรงนี้ — ไม่ต้อง optimize ทุกอย่าง</p><div class="kv">' +
      DAREAS.map(function (a) {
        var v = (S.direction || {})[a[0]] || '';
        return '<div class="kbox"><b>' + a[1] + '</b><div class="form"><label>ระดับ<select data-darea="' + a[0] + '">' +
          levelOpts(DLEVELS, v) + '</select></label></div></div>';
      }).join('') + '</div><div class="rowbtns"><button class="btn small" id="dSave">💾 บันทึกทิศชีวิต</button></div></section>';
    h += '<section class="card"><h2><span class="em">⚙️</span> สไตล์ทำงาน/เรียนรู้ของฉัน</h2><p class="sub">เปลี่ยนได้เสมอ ไม่ใช่ป้ายถาวร</p><div class="kv">' +
      STYLEQ.map(function (q) {
        var v = (S.style || {})[q[0]] || '';
        return '<div class="kbox"><b>' + q[1] + '</b><div class="form"><label>เลือก<select data-sq="' + q[0] + '"><option value="">—</option>' +
          q[2].map(function (o) { return '<option' + (v === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label></div></div>';
      }).join('') + '</div><div class="rowbtns"><button class="btn small" id="sSave">💾 บันทึกสไตล์</button></div></section>';
    return h;
  }
  function bindDirection() {
    var ds = document.querySelector('#dSave');
    if (ds) ds.addEventListener('click', function () {
      S.direction = S.direction || {};
      document.querySelectorAll('[data-darea]').forEach(function (el) {
        if (el.value) S.direction[el.getAttribute('data-darea')] = el.value;
        else delete S.direction[el.getAttribute('data-darea')];
      });
      save(S); render();
    });
    var ss = document.querySelector('#sSave');
    if (ss) ss.addEventListener('click', function () {
      S.style = S.style || {};
      document.querySelectorAll('[data-sq]').forEach(function (el) { if (el.value) S.style[el.getAttribute('data-sq')] = el.value; });
      save(S); render();
    });
  }

  var SKLV = ['Not Assessed', 'L0', 'L1', 'L2', 'L3', 'L4', 'L5'];
  var SKGOAL = ['อยากใช้เป็น', 'อยากทำได้อย่างอิสระ', 'อยากทำเป็นอาชีพ', 'อยากสร้างผลิตภัณฑ์', 'อยากสอนคนอื่น', 'อยากวิจัยระดับลึก'];
  function upskillEvidence(name) {
    try {
      var raw = localStorage.getItem('et1cruel.upskill.v1');
      if (!raw) return '';
      var u = JSON.parse(raw);
      var slug = (D().skillSeeds || []).filter(function (x) { return x.name === name; })[0];
      slug = slug && slug.upskill;
      if (slug && u.status && u.status[slug]) {
        var mins = (u.minutes && +u.minutes[slug]) || 0;
        return 'UPSKILL: ' + u.status[slug] + (mins ? ' · ' + Math.round(mins / 60 * 10) / 10 + ' ชม.' : '');
      }
    } catch (e) {}
    return '';
  }
  function vSkills() {
    var seeds = (D().skillSeeds || []).map(function (x) { return x.name; });
    var mine = Object.keys(S.skills || {});
    var all = seeds.concat(mine.filter(function (k) { return seeds.indexOf(k) < 0; }));
    var h = '<section class="card"><h2><span class="em">🌳</span> ทักษะของฉัน</h2><p class="sub">ระดับอิงหลักฐาน — ไม่มีหลักฐานคือ Not Assessed ไม่เดาให้</p><div class="kv">' +
      all.map(function (nm) {
        var r = (S.skills || {})[nm] || {};
        var ev = upskillEvidence(nm);
        return '<div class="kbox"><b>' + esc(nm) + '</b>' +
          (ev ? '<small>🔗 ' + esc(ev) + '</small>' : '') +
          '<small>ระดับ: ' + esc(r.level || 'Not Assessed') + (r.goal ? ' → เป้า: ' + esc(r.goal) : '') + '</small>' +
          '<div class="rowbtns"><button class="btn small ghost" data-sk="' + esc(nm) + '">ประเมิน →</button></div></div>';
      }).join('') + '</div>';
    var open = params().get('open');
    if (open && open.indexOf('skill:') === 0) {
      var nm = open.slice(6);
      var r = (S.skills || {})[nm];
      if (!r) {
        h += '<section class="card"><div class="empty">ไม่เจอทักษะ “' + esc(nm) + '” ในรายการที่ติดตาม — <a href="?tab=skills">กลับไปเลือกทักษะ</a></div></section>';
      } else {
      h += '<section class="card"><h2><span class="em">📝</span> ประเมิน: ' + esc(nm) + '</h2>' +
        '<div class="form"><label>ระดับตอนนี้<select id="skLevel">' + SKLV.map(function (l) { return '<option' + ((r.level || 'Not Assessed') === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></label>' +
        '<label>อยากไปถึง<select id="skGoal"><option value="">—</option>' + SKGOAL.map(function (l) { return '<option' + (r.goal === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></label>' +
        '<label>หลักฐาน (ทำอะไรมา)<textarea id="skEv" rows="2">' + esc(r.evidence || '') + '</textarea></label>' +
        '<label>ก้าวต่อไป<input id="skNext" maxlength="140" value="' + esc(r.next || '') + '"></label>' +
        '<div><button class="btn small" id="skSave">💾 บันทึก</button></div></div></section>';
      }
    }
    h += '<section class="card"><h2><span class="em">➕</span> เพิ่มทักษะ</h2><div class="form"><label>ชื่อทักษะ<input id="skName" maxlength="60"></label><div><button class="btn small" id="skAdd">เพิ่ม</button></div></div></section>';
    return h;
  }
  function bindSkills() {
    document.querySelectorAll('[data-sk]').forEach(function (b) {
      b.addEventListener('click', function () { location.search = '?tab=skills&open=skill:' + encodeURIComponent(b.getAttribute('data-sk')); });
    });
    var sv = document.querySelector('#skSave');
    if (sv) sv.addEventListener('click', function () {
      var nm = params().get('open').slice(6);
      S.skills = S.skills || {};
      S.skills[nm] = {
        level: document.querySelector('#skLevel').value,
        goal: document.querySelector('#skGoal').value,
        evidence: (document.querySelector('#skEv').value || '').trim(),
        next: (document.querySelector('#skNext').value || '').trim(),
        updatedAt: Date.now()
      };
      save(S); render();
    });
    var ad = document.querySelector('#skAdd');
    if (ad) ad.addEventListener('click', function () {
      var nm = (document.querySelector('#skName').value || '').trim();
      if (!nm) return;
      S.skills = S.skills || {};
      if (!S.skills[nm]) S.skills[nm] = { level: 'Not Assessed', updatedAt: Date.now() };
      save(S); render();
    });
  }

  var PST = ['CORE', 'SUPPORT', 'EXPERIMENT', 'ON HOLD', 'ARCHIVED', 'COMPLETED'];
  function vProjects() {
    var seeds = D().projectSeeds || [];
    var mine = S.projects || {};
    var seedH = '<div class="kv">' + seeds.map(function (s) {
      var has = !!mine[s.name];
      return '<div class="kbox"><b>' + esc(s.name) + '</b><small>ห้องจริงในเว็บ' + (has ? ' · ติดตามแล้ว' : '') + '</small><div class="rowbtns"><a class="btn small ghost" href="' + esc(s.url) + '">เปิดห้อง →</a> ' +
        (has ? '' : '<button class="btn small blue" data-padd="' + esc(s.name) + '">＋ ติดตาม</button>') + '</div></div>';
    }).join('') + '</div>';
    var keys = Object.keys(mine);
    var mh = keys.length ? '<div class="kv">' + keys.map(function (k) {
      var p = mine[k];
      return '<div class="kbox"><b>' + esc(k) + '</b><small>' + esc(p.status || 'EXPERIMENT') + (p.next ? ' · ต่อไป: ' + esc(p.next) : '') + '</small><div class="rowbtns"><button class="btn small ghost" data-pedit="' + esc(k) + '">แก้ →</button></div></div>';
    }).join('') + '</div>' : '<div class="empty">ยังไม่ติดตามโปรเจกต์ไหน — กด ＋ จากห้องจริงด้านบน หรือเพิ่มเอง</div>';
    var open = params().get('open');
    var eh = '';
    if (open && open.indexOf('proj:') === 0) {
      var nm = open.slice(5);
      var seedNames = {};
      (D().projectSeeds || []).forEach(function (s) { seedNames[s.name] = 1; });
      if (!mine[nm] && !seedNames[nm]) {
        eh = '<section class="card"><div class="empty">ไม่เจอโปรเจกต์ “' + esc(nm) + '” — <a href="?tab=projects">กลับไปหน้าโปรเจกต์</a></div></section>';
      } else {
      var p = mine[nm] || { status: 'EXPERIMENT' };
      eh = '<section class="card"><h2><span class="em">📝</span> ' + esc(nm) + '</h2><div class="form">' +
        '<label>คำอธิบาย<textarea id="pDesc" rows="2">' + esc(p.desc || '') + '</textarea></label>' +
        '<label>สถานะ<select id="pStatus">' + PST.map(function (s) { return '<option' + (p.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
        '<label>ก้าวต่อไป<input id="pNext" maxlength="140" value="' + esc(p.next || '') + '"></label>' +
        '<div class="rowbtns"><button class="btn small" id="pSave">💾 บันทึก</button> <button class="btn small ghost" id="pDel">ลบ</button></div></div></section>';
      }
    }
    var qs = S.quests || {}, qk = Object.keys(qs);
    var qh = qk.length ? '<ul class="tl">' + qk.map(function (k) {
      var q = qs[k];
      return '<li><b>' + esc(q.title) + '</b> <span class="tag ' + (q.status === 'done' ? 'confirmed' : 'hypo') + '">' + esc(q.status) + '</span><br><small>' + esc(q.timeframe) + (q.reflection ? ' · ' + esc(String(q.reflection).slice(0, 80)) : '') + '</small> ' +
        (q.status === 'done' ? '' : '<button class="btn small ghost" data-qdone="' + esc(k) + '">สำเร็จ ✓</button>') + '</li>';
    }).join('') + '</ul>' : '<div class="empty">ยังไม่มี quest — ตั้งการทดลองเล็กๆ ข้อแรกด้านล่าง</div>';
    return '<section class="card"><h2><span class="em">🛰️</span> โปรเจกต์</h2><p class="sub">ห้องจริงในเว็บ</p>' + seedH + '<p class="sub" style="margin-top:10px">ที่ฉันติดตาม</p>' + mh + eh +
      '<div class="form"><label>＋ เพิ่มโปรเจกต์เอง<input id="pName" maxlength="80"></label><div><button class="btn small" id="pAdd">เพิ่ม</button></div></div></section>' +
      '<section class="card"><h2><span class="em">🧪</span> ONE THING + Quests</h2><p class="sub">ทดลองเล็กๆ ทีละอย่าง — หยุดได้โดยไม่ใช่ความล้มเหลว</p>' + qh +
      '<div class="form"><label>การทดลอง<input id="qTitle" maxlength="120" placeholder="เช่น ทำบีท 8 ห้องใน 1 ชม."></label>' +
      '<label>สมมติฐาน<input id="qHyp" maxlength="200" placeholder="คิดว่าจะสนุกกว่าที่คิด"></label>' +
      '<label>กรอบเวลา<select id="qTime"><option value="24h">24 ชม.</option><option value="7d">7 วัน</option><option value="30d">30 วัน</option><option value="90d">90 วัน</option></select></label>' +
      '<label>จะรู้ว่าสำเร็จได้อย่างไร<input id="qEv" maxlength="200"></label>' +
      '<div><button class="btn small" id="qAdd">ตั้ง quest</button></div></div></section>';
  }
  function bindProjects() {
    document.querySelectorAll('[data-padd]').forEach(function (b) {
      b.addEventListener('click', function () {
        var nm = b.getAttribute('data-padd');
        S.projects = S.projects || {};
        S.projects[nm] = { status: 'EXPERIMENT', updatedAt: Date.now() };
        save(S); render();
      });
    });
    document.querySelectorAll('[data-pedit]').forEach(function (b) {
      b.addEventListener('click', function () { location.search = '?tab=projects&open=proj:' + encodeURIComponent(b.getAttribute('data-pedit')); });
    });
    var pa = document.querySelector('#pAdd');
    if (pa) pa.addEventListener('click', function () {
      var nm = (document.querySelector('#pName').value || '').trim();
      if (!nm) return;
      S.projects = S.projects || {};
      if (!S.projects[nm]) S.projects[nm] = { status: 'EXPERIMENT', updatedAt: Date.now() };
      save(S); render();
    });
    var ps = document.querySelector('#pSave');
    if (ps) ps.addEventListener('click', function () {
      var nm = params().get('open').slice(5);
      S.projects[nm] = {
        desc: (document.querySelector('#pDesc').value || '').trim(),
        status: document.querySelector('#pStatus').value,
        next: (document.querySelector('#pNext').value || '').trim(),
        updatedAt: Date.now()
      };
      save(S); render();
    });
    var pd = document.querySelector('#pDel');
    if (pd) pd.addEventListener('click', function () {
      var nm = params().get('open').slice(5);
      if (!confirm('ลบโปรเจกต์ “' + nm + '” ใช่ไหม?')) return;
      delete S.projects[nm];
      save(S); location.search = '?tab=projects';
    });
    var qa = document.querySelector('#qAdd');
    if (qa) qa.addEventListener('click', function () {
      var t = (document.querySelector('#qTitle').value || '').trim();
      if (!t) return;
      S.quests = S.quests || {};
      var id = 'q' + Date.now();
      S.quests[id] = {
        title: t, hypothesis: (document.querySelector('#qHyp').value || '').trim(),
        timeframe: document.querySelector('#qTime').value,
        evidence: (document.querySelector('#qEv').value || '').trim(),
        status: 'planned', createdAt: Date.now()
      };
      save(S); render();
    });
    document.querySelectorAll('[data-qdone]').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = S.quests[b.getAttribute('data-qdone')];
        if (!q) return;
        var r = prompt('ทดลองเสร็จแล้ว — สนุกกว่าที่คิดไหม? อยากทำต่อไหม? (1 บรรทัด)', '');
        q.status = 'done'; q.completedAt = Date.now();
        if (r) { q.reflection = r; S.journal.push({ type: 'quest', text: r, ts: Date.now() }); }
        save(S); render();
      });
    });
  }

  function vArchive() {
    var items = [];
    (S.journal || []).forEach(function (j) { items.push({ ts: j.ts, h: '📓 ' + (j.type || 'reflection'), t: j.text }); });
    (S.archive || []).forEach(function (a) { items.push({ ts: a.ts, h: '📌 ' + (a.source || 'บันทึก'), t: a.text }); });
    Object.keys(S.quests || {}).forEach(function (k) {
      var q = S.quests[k];
      if (q.status === 'done') items.push({ ts: q.completedAt || q.createdAt, h: '🧪 quest สำเร็จ: ' + q.title, t: q.reflection || '' });
    });
    items.sort(function (a, b) { return b.ts - a.ts; });
    var h = items.length ? '<ul class="tl">' + items.map(function (it) {
      return '<li><b class="yr num">' + esc(fmtDate(it.ts)) + '</b><b>' + esc(it.h) + '</b><br>' + esc(String(it.t || '').slice(0, 200)) + '</li>';
    }).join('') + '</ul>' : '<div class="empty">ยังว่างเปล่า — ทุกอย่างที่บันทึกจะกลายเป็น timeline ตรงนี้ (ไม่แก้ประวัติเก่า)</div>';
    var bank = (D().questions || {});
    var pickQ = function (kind, n) {
      var arr = (bank[kind] || []).map(function (q) { return (q && q.text) ? q.text : String(q || ''); }).filter(Boolean);
      if (!arr.length) return null;
      return arr[Math.floor(Date.now() / 864e5) % arr.length];
    };
    var qDaily = pickQ('daily'), qWeekly = pickQ('weekly'), qMonthly = pickQ('monthly');
    var promptH = '<div class="sec"><h3>🧭 คำถามชวนคิด (ไม่บังคับ — ข้ามได้)</h3>' +
      (qDaily ? '<div class="kbox"><b>วันนี้</b><small>' + esc(qDaily) + '</small></div>' : '') +
      (qWeekly ? '<div class="kbox"><b>สัปดาห์นี้</b><small>' + esc(qWeekly) + '</small></div>' : '') +
      (qMonthly ? '<div class="kbox"><b>เดือนนี้</b><small>' + esc(qMonthly) + '</small></div>' : '') +
      '<p class="ev">ใช้เป็นจุดเริ่มเขียน journal ได้ — ไม่ต้องตอบให้ครบ ไม่มีคะแนน</p></div>';
    return '<section class="card"><h2><span class="em">📓</span> Journal + Archive Timeline</h2>' + h + promptH +
      '<div class="form"><label>✍️ บันทึกสะท้อน<input id="jText" maxlength="500" placeholder="วันนี้ค้นพบอะไรเกี่ยวกับตัวเอง?"></label>' +
      '<div><button class="btn small" id="jAdd">บันทึก journal</button></div>' +
      '<label>📌 เหตุการณ์ตัวตน (มีวันที่)<input id="aText" maxlength="200" placeholder="เช่น เริ่มทำบีทแรก"></label>' +
      '<label>วันที่<input id="aDate" type="date"></label>' +
      '<div><button class="btn small ghost" id="aAdd">เพิ่มเหตุการณ์ (ต้องมีวันที่)</button></div>' +
      '<div class="rowbtns"><button class="btn small ghost" id="expJson">⬇ Export JSON (สำรองเต็ม)</button> ' +
      '<button class="btn small ghost" id="expMd">⬇ Export Markdown (อ่านง่าย ไม่ครบ)</button> ' +
      '<label class="btn small ghost" style="cursor:pointer">⬆ Import JSON<input id="impFile" type="file" accept=".json" hidden></label></div>' +
      '<p class="ev">ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น · JSON = สำรองเต็ม (ใช้กู้) · Markdown = สรุปสำหรับอ่าน · Import จะเขียนทับทั้งหมด (มีคำยืนยัน)</p></div></section>';
  }
  function bindArchive() {
    var ja = document.querySelector('#jAdd');
    if (ja) ja.addEventListener('click', function () {
      var t = (document.querySelector('#jText').value || '').trim();
      if (!t) return;
      S.journal.push({ type: 'daily', text: t, ts: Date.now() });
      save(S); render();
    });
    var aa = document.querySelector('#aAdd');
    if (aa) aa.addEventListener('click', function () {
      var t = (document.querySelector('#aText').value || '').trim();
      var d = document.querySelector('#aDate').value;
      if (!t || !d) { alert('ต้องมีทั้งข้อความและวันที่'); return; }
      S.archive.push({ text: t, ts: new Date(d + 'T12:00:00').getTime(), source: 'ผู้ใช้บันทึกเอง' });
      save(S); render();
    });
  }

  function pickAdaptive() {
    var tracked = Object.keys(S.interests);
    var conf = tracked.filter(function (k) { return S.interests[k].status === 'CONFIRMED'; });
    var Bank = (D().questions || {}).adaptive || [];
    function Q(when) { return Bank.filter(function (q) { return q.when === when; })[0]; }
    if (!tracked.length) return Q('no-love');
    if (conf.length === 0 && tracked.length >= 3) return Q('many-interests');
    var pausedLove = tracked.filter(function (k) {
      var r = (S.interests[k].ratings || {});
      return S.interests[k].status === 'PAUSED' && (+r.enjoyment || 0) >= 4;
    });
    if (pausedLove.length) return { when: 'paused-love', text: 'มีเรื่องที่เคยให้คะแนนความสุขไว้สูงแต่ตอนนี้หยุดพัก — อยากเล่าว่าเกิดอะไรขึ้นไหม?' };
    return Q('direction');
  }
  function contradictions() {
    var out = [];
    Object.keys(S.interests).forEach(function (k) {
      var r = S.interests[k];
      if (r.status === 'PAUSED' && r.ratings && (+r.ratings.enjoyment || 0) >= 4) {
        var s = intById(k);
        out.push('“' + (s ? s.name : k) + '” เคยสุขมากแต่ตอนนี้หยุดพัก — ติดที่เวลาหรือหมดไฟ?');
      }
    });
    return out;
  }
  function discoveryBlock() {
    if (S.dqSkip) return '';
    var q = pickAdaptive();
    if (!q) return '';
    var contra = contradictions();
    return '<section class="card"><h2><span class="em">🔍</span> คำถามค้นพบตัวเอง (ทีละข้อ ข้ามได้)</h2>' +
      '<div class="stmt">“' + esc(q.text) + '”</div>' +
      '<div class="rowbtns"><a class="btn small ghost" href="?tab=archive">✎ เขียนคำตอบใน journal</a> ' +
      '<button class="btn small vio" id="dqSkip">ข้ามข้อนี้</button></div>' +
      (contra.length ? '<p class="sub" style="margin-top:8px">⚠️ ที่สังเกต (ไม่ใช่คำตัดสิน):</p><ul><li>' + contra.map(esc).join('</li><li>') + '</li></ul>' : '') + '</section>';
  }
  function exportJSON() {
    var blob = new Blob([JSON.stringify({ app: 'inner-core', v: 1, exportedAt: new Date().toISOString(), data: sanitize(S) }, null, 2)], { type: 'application/json;charset=utf-8' });
    dl(blob, 'inner-core-backup.json');
  }
  function exportMD() {
    var L = [];
    L.push('# INNER CORE — ' + fmtDate(Date.now()));
    L.push('');
    L.push('## ประโยคตัวตน (' + (S.statement.status || 'HYPOTHESIS') + ')');
    L.push(S.statement.text || '(ยังไม่เขียน)');
    L.push('');
    L.push('## ความสนใจ');
    Object.keys(S.interests).forEach(function (k) {
      var r = S.interests[k], s = intById(k);
      L.push('- ' + (s ? s.name : k) + ' [' + (r.status || '?') + ']' + (r.notes ? ' — ' + r.notes : ''));
    });
    if (!Object.keys(S.interests).length) L.push('(ยังไม่มี)');
    L.push('');
    L.push('## ทักษะ');
    Object.keys(S.skills || {}).forEach(function (k) {
      var r = S.skills[k];
      L.push('- ' + k + ': ' + (r.level || '?') + (r.evidence ? ' — ' + r.evidence : ''));
    });
    L.push('');
    L.push('## โปรเจกต์');
    Object.keys(S.projects || {}).forEach(function (k) { L.push('- ' + k + ' [' + ((S.projects[k] || {}).status || '?') + ']'); });
    L.push('');
    L.push('## ค่านิยม (ที่ยืนยัน)');
    Object.keys(S.values || {}).forEach(function (k) { if (S.values[k].confirmed) L.push('- ' + k); });
    L.push('');
    L.push('## Quests');
    Object.keys(S.quests || {}).forEach(function (k) {
      var q = S.quests[k];
      L.push('- [' + q.status + '] ' + q.title + (q.reflection ? ' — ' + q.reflection : ''));
    });
    L.push('');
    L.push('## Journal');
    (S.journal || []).slice().sort(function (a, b) { return b.ts - a.ts; }).forEach(function (j) {
      L.push('- ' + fmtDate(j.ts) + ': ' + j.text);
    });
    L.push('');
    L.push('## คำถามที่ยังเปิดอยู่');
    D().interests.filter(function (s) { return userStatus(s.id) !== 'CONFIRMED'; }).slice(0, 10).forEach(function (s) {
      L.push('- ' + s.name + ': ' + s.question);
    });
    var blob = new Blob(['\ufeff' + L.join('\n')], { type: 'text/markdown;charset=utf-8' });
    dl(blob, 'inner-core.md');
  }
  function dl(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function bindDiscovery() {
    var sk = document.querySelector('#dqSkip');
    if (sk) sk.addEventListener('click', function () { S.dqSkip = Date.now(); save(S); render(); });
  }
  function bindExport() {
    var je = document.querySelector('#expJson');
    if (je) je.addEventListener('click', exportJSON);
    var me = document.querySelector('#expMd');
    if (me) me.addEventListener('click', exportMD);
    var fi = document.querySelector('#impFile');
    if (fi) fi.addEventListener('change', function () {
      var f = fi.files && fi.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var o = JSON.parse(r.result);
          var d = (o && o.app === 'inner-core' && o.data) ? o.data : null;
          if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('bad-schema');
          d = sanitize(d);
          if (!d.statement || !d.interests || !d.focus || !Array.isArray(d.journal)) throw new Error('bad-schema');
          var n = Object.keys(d.interests).length + Object.keys(d.skills || {}).length + d.journal.length;
          if (!confirm('นำเข้าข้อมูล ' + n + ' รายการ? (จะเขียนทับของเดิมทั้งหมด)')) { fi.value = ''; return; }
          S = d;
          save(S); render();
          fi.value = '';
        } catch (e) { alert('ไฟล์นี้ใช้ไม่ได้: ต้องเป็นไฟล์ inner-core-backup.json ที่ export จากห้องนี้'); fi.value = ''; }
      };
      r.readAsText(f);
    });
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
      var on = b.getAttribute('data-tab') === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var view = $('view');
    try {
      var pre = searchBlock();
      if (tab === 'overview') { view.innerHTML = pre + discoveryBlock() + vOverview(); bindOverview(); bindDiscovery(); return; }
      if (tab === 'interests') { view.innerHTML = pre + vInterests(); bindInterests(); return; }
      if (tab === 'desires') { view.innerHTML = pre + vDesires(); bindDesires(); return; }
      if (tab === 'values') { view.innerHTML = pre + vValues(); bindValues(); return; }
      if (tab === 'direction') { view.innerHTML = pre + vDirection(); bindDirection(); return; }
      if (tab === 'skills') { view.innerHTML = pre + vSkills(); bindSkills(); return; }
      if (tab === 'projects') { view.innerHTML = pre + vProjects(); bindProjects(); return; }
      view.innerHTML = pre + vArchive(); bindArchive(); bindExport();
    } catch (e) {
      // ข้อมูลเสียจนวาดไม่ได้ → อย่าทิ้งหน้าจอว่าง บอกตามตรงแล้วให้เริ่มใหม่/กู้จากไฟล์
      S = blankStore();
      save(S);
      view.innerHTML = '<section class="card"><div class="empty">ข้อมูล Inner Core เสียหาย — เริ่มจากห้องว่างให้ก่อน<br>' +
        'กู้จากไฟล์สำรองได้ที่แท็บ “คลังตัวตน” → Import JSON<br>' +
        '<div class="rowbtns"><a class="btn small" href="?tab=archive">ไปแท็บคลังตัวตน</a> <a class="btn small ghost" href="?tab=overview">กลับภาพรวม</a></div></div></section>';
    }
  }

  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { location.search = '?tab=' + b.getAttribute('data-tab'); });
  });
  var q0 = params().get('q');
  if (q0 && !$('q').value) $('q').value = q0;
  $('q').addEventListener('input', render);

  render();
})();
