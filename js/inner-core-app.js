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
  function intById(id) { return D().interests.filter(function (x) { return x.id === id; })[0] || null; }
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
    if (openId) {
      var s = intById(openId);
      if (s) {
        var u = S.interests[openId] || {};
        h += '<section class="card"><a class="btn small ghost" href="?tab=interests">← กลับรายการ</a>' +
          '<h2 style="margin-top:10px"><span class="em">💜</span> ' + esc(s.name) + '</h2>' +
          '<p class="sub">' + statusTag(userStatus(openId)) + '</p>' +
          '<div class="drawer"><b>🔎 สัญญาณที่พบ</b><br>' + esc(s.evidence) +
          '<br><br><b>? ยังไม่ทราบ</b><br>' + esc(s.unknown) +
          '<br><br><b>💬 คำถามสำรวจ</b><br>' + esc(s.question) +
          (u.notes ? '<br><br><b>✎ โน้ตของฉัน</b><br>' + esc(u.notes) : '') + '</div></section>';
      } else {
        h += '<div class="empty">ไม่เจอหัวข้อนี้ — <a href="?tab=interests">กลับรายการ</a></div>';
      }
    }
    var groups = ['CREATE', 'BUILD', 'EXPLORE', 'SHARE', 'LIVE'];
    h += groups.map(function (g) {
      var list = D().interests.filter(function (x) { return x.group === g; });
      return '<section class="card"><h2><span class="em">🗂️</span> ' + g + ' <span class="ev">(' + list.length + ')</span></h2><div class="kv">' +
        list.map(function (x) { return interestCard(x, true); }).join('') + '</div></section>';
    }).join('');
    return h;
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
    if (tab === 'interests') { view.innerHTML = vInterests(); return; }
    var titles = { interests: 'ความสนใจ', desires: 'อยากทำที่สุด', skills: 'ทักษะ', projects: 'โปรเจกต์', values: 'ค่านิยม', direction: 'ทิศชีวิต', archive: 'คลังตัวตน' };
    view.innerHTML = todoShell(titles[tab] || tab);
  }

  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { location.search = '?tab=' + b.getAttribute('data-tab'); });
  });
  $('q').addEventListener('input', render);

  render();
})();
