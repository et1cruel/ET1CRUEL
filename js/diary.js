/* ============================================================
   ET1CRUEL DIARY — สมุดไดอารี่รายวัน (localStorage ล้วน)
   key: et1cruel_diary_v1 -> { entries: { 'YYYY-MM-DD': {title,text,mood,updatedAt} } }
   ต่อกับ Life OS: บันทึกวันใหม่ครั้งแรก +30 XP (ถ้ามี window.ET1OS)
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'et1cruel_diary_v1';

  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayKey() { return dayKey(new Date()); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function thaiDate(dateStr) {
    try {
      var p = dateStr.split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return dateStr; }
  }
  function toast(msg) {
    var box = $('os-toasts');
    if (!box) { alert(msg); return; }
    var t = document.createElement('div');
    t.className = 'os-toast xp';
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2200);
    setTimeout(function () { t.remove(); }, 2700);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); if (o && o.entries) return o; }
    } catch (e) {}
    return { entries: {} };
  }
  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { toast('เมมเต็ม — กด Export เก็บไว้ก่อน'); }
  }

  var DB = load();
  var curMood = '🙂';

  function sortedKeys() {
    return Object.keys(DB.entries).sort().reverse();
  }
  function streak() {
    var n = 0, d = new Date();
    if (!DB.entries[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (DB.entries[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function setMood(m) {
    curMood = m;
    var box = $('diaryMoods');
    if (!box) return;
    var btns = box.querySelectorAll('button');
    btns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mood') === m); });
  }

  function loadToEditor(dateStr) {
    var de = $('diaryDate'), ti = $('diaryTitle'), tx = $('diaryText');
    if (!de || !tx) return;
    de.value = dateStr;
    var e = DB.entries[dateStr];
    if (ti) ti.value = e ? (e.title || '') : '';
    tx.value = e ? (e.text || '') : '';
    setMood(e && e.mood ? e.mood : '🙂');
    updateEditorMeta();
    // กู้ฉบับร่างถ้ายังไม่เคยบันทึกวันนี้
    var dr = (!e && D[dateStr]) ? D[dateStr] : null;
    if (dr && ((dr.text || '') || (dr.title || ''))) {
      if (ti) ti.value = dr.title || '';
      tx.value = dr.text || '';
      setMood(dr.mood || '🙂');
      updateEditorMeta();
      var hint = $('diaryHint');
      if (hint) hint.textContent += ' · ✎ กู้ฉบับร่างอัตโนมัติ';
      paintSaved('● ฉบับร่างที่กู้คืน');
    } else paintSaved('');
  }

  function updateEditorMeta() {
    var de = $('diaryDate'), tx = $('diaryText');
    var label = $('diaryTodayLabel'), hint = $('diaryHint'), del = $('diaryDelete'), chars = $('diaryChars');
    if (!de) return;
    var k = de.value || todayKey();
    if (label) label.textContent = thaiDate(k) + (k === todayKey() ? ' · วันนี้' : '');
    if (chars && tx) chars.textContent = (tx.value || '').length;
    var exists = !!DB.entries[k];
    if (hint) {
      if (!tx || !tx.value.trim()) hint.textContent = exists ? 'มีบันทึกวันนี้แล้ว — แก้ไขแล้วกดบันทึกซ้ำได้' : (k === todayKey() ? 'ยังไม่ได้เขียนของวันนี้' : 'วันนี้ยังว่าง — เขียนแล้วย้อนกลับมาอ่านได้');
      else hint.textContent = exists ? '● แก้ไขอยู่ — กดบันทึกเพื่ออัปเดต' : '● เขียนอยู่ — กดบันทึกเพื่อเก็บ';
    }
    if (del) del.hidden = !exists;
  }

  function renderList() {
    var list = $('diaryList');
    var q = (($('diarySearch') || {}).value || '').trim().toLowerCase();
    var keys = sortedKeys();
    if (q) keys = keys.filter(function (k) {
      var e = DB.entries[k];
      return (k + ' ' + (e.title || '') + ' ' + (e.text || '') + ' ' + (e.mood || '')).toLowerCase().indexOf(q) >= 0;
    });
    var cnt = $('diaryCount'), nav = $('navDiary');
    var total = Object.keys(DB.entries).length;
    if (cnt) cnt.textContent = total + ' วัน';
    if (nav) nav.textContent = total ? total + ' วัน' : 'NEW';

    // streak bar: 7 วันล่าสุด
    var st = $('diaryStreak');
    if (st) {
      var dots = '', d = new Date();
      d.setDate(d.getDate() - 6);
      for (var i = 0; i < 7; i++) {
        var k = dayKey(d), hit = !!DB.entries[k], isT = k === todayKey();
        dots += '<span class="' + (hit ? 'hit' : '') + (isT ? ' today' : '') + '" title="' + k + '">' + (hit ? '📓' : d.getDate()) + '</span>';
        d.setDate(d.getDate() + 1);
      }
      st.innerHTML = '<div class="streak-dots">' + dots + '</div>' +
        '<small>🔥 เขียนติดกัน ' + streak() + ' วัน · รวม ' + total + ' วัน</small>';
    }

    if (!list) return;
    if (!keys.length) {
      list.innerHTML = '<small style="color:var(--muted)">' +
        (total ? 'ไม่เจอที่ค้นหา — ลองคำอื่น' : 'ยังไม่มีบันทึก — เริ่มจากวันนี้เลย ✎') + '</small>';
      return;
    }
    list.innerHTML = keys.slice(0, 60).map(function (k) {
      var e = DB.entries[k];
      var preview = String(e.text || '').slice(0, 120);
      return '<div class="jentry diary-entry">' +
        '<small>' + esc(thaiDate(k)) + ' · ' + esc(e.mood || '🙂') + '</small>' +
        (e.title ? '<b style="display:block;margin-top:4px">' + esc(e.title) + '</b>' : '') +
        '<p>' + esc(preview) + (String(e.text || '').length > 120 ? '…' : '') + '</p>' +
        '<div class="os-row" style="margin-top:8px">' +
        '<button class="os-btn small ghost" data-dopen="' + esc(k) + '">เปิดอ่าน / แก้</button>' +
        '<button class="os-btn small danger" data-ddel="' + esc(k) + '">ลบ</button>' +
        '</div></div>';
    }).join('');
  }

  function doSave() {
    var de = $('diaryDate'), ti = $('diaryTitle'), tx = $('diaryText');
    if (!de || !tx) return;
    var k = de.value || todayKey();
    var text = (tx.value || '').trim();
    if (!text) { toast('เขียนอะไรนิดนึงก่อน ✎'); tx.focus(); return; }
    var isNew = !DB.entries[k];
    DB.entries[k] = {
      title: ((ti || {}).value || '').trim().slice(0, 80),
      text: text,
      mood: curMood,
      updatedAt: new Date().toISOString()
    };
    save(DB);
    if (D[k]) { delete D[k]; saveDrafts(); } // บันทึกแล้วล้างฉบับร่างวันนี้
    paintSaved('✓ บันทึกแล้ว ' + hhmm());
    // sync ช่องเก่ากันสคริปต์ life-os หาไม่เจอ
    var jt = $('os-j-text'); if (jt) jt.value = '';
    updateEditorMeta();
    renderList();
    toast(isNew ? '📓 บันทึก ' + k + ' แล้ว +30 XP' : '📓 อัปเดต ' + k + ' แล้ว');
    if (isNew && window.ET1OS && typeof window.ET1OS.addXP === 'function') {
      try { window.ET1OS.addXP(30, 'Diary ' + k, 'MIND', 1); } catch (e) {}
    }
  }

  /* ---------- Phase 7: ฉบับร่าง autosave ---------- */
  var DRAFT_KEY = 'et1cruel_diary_draft_v1';
  var D = {};
  try { D = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') || {}; if (typeof D !== 'object') D = {}; } catch (e0) { D = {}; }
  var draftTimer = 0;
  function saveDrafts() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(D)); } catch (e) {} }
  function hhmm() { try { return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); } catch (e2) { return ''; } }
  function paintSaved(msg) { var el = $('diarySaved'); if (el) el.textContent = msg || ''; }
  function queueDraft() {
    var de = $('diaryDate'), ti = $('diaryTitle'), tx = $('diaryText');
    if (!de || !tx) return;
    var k = de.value || todayKey();
    var title = ((ti || {}).value || '').trim(), text = (tx.value || '');
    if (!title && !text.trim()) {
      if (D[k]) { delete D[k]; saveDrafts(); }
      paintSaved('');
      return;
    }
    D[k] = { title: title.slice(0, 80), text: text, mood: curMood, updatedAt: new Date().toISOString() };
    saveDrafts();
    paintSaved('● ฉบับร่าง ' + hhmm());
  }
  function queueDraftSoon() {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(queueDraft, 1500);
  }

  /* ---------- Phase 7: สำรองรวมทุกอย่าง ---------- */
  var BACKUP_DEFS = [
    { key: 'et1cruel_diary_v1', label: 'ไดอารี่', valid: function (v) { return v == null || (typeof v === 'object' && (!v.entries || typeof v.entries === 'object')); }, info: function (v) { return v && v.entries ? Object.keys(v.entries).length + ' วัน' : 'ว่าง'; } },
    { key: 'et1cruel_diary_draft_v1', label: 'ฉบับร่าง', valid: function (v) { return v == null || typeof v === 'object'; }, info: function (v) { return v ? Object.keys(v).length + ' วัน' : 'ว่าง'; } },
    { key: 'et1_forest_v1', label: 'ป่า', valid: function (v) { return v == null || (typeof v === 'object' && (!v.trees || Array.isArray(v.trees))); }, info: function (v) { return v && v.trees ? v.trees.length + ' ต้น' : 'ว่าง'; } },
    { key: 'et1_sound_v1', label: 'เสียง', valid: function (v) { return v == null || typeof v === 'object'; }, info: function (v) { return v ? 'มี' : 'ว่าง'; } },
    { key: 'et1cruel_lifeos_v1', label: 'Life OS', valid: function (v) { return v == null || (typeof v === 'object' && (!v.character || typeof v.character === 'object')); }, info: function (v) { return v ? 'มี' : 'ว่าง'; } },
    { key: 'et1_mouse_v1', label: 'หนู', valid: function (v) { return v == null || typeof v === 'object'; }, info: function (v) { return v ? 'มี' : 'ว่าง'; } },
    { key: 'et1cruel-tree-coins', label: 'เหรียญต้นไม้', valid: function (v) { return v == null || isFinite(+v); }, info: function (v) { return v == null ? 'ว่าง' : String(v); } },
    { key: 'et1cruel-collapsed-v1', label: 'การพับจอ', valid: function (v) { return v == null || Array.isArray(v); }, info: function (v) { return v ? v.length + ' section' : 'ว่าง'; } },
    { key: 'et1cruel-qtracker-min', label: 'qtracker', valid: function (v) { return v == null || v === 0 || v === 1 || v === '0' || v === '1'; }, info: function (v) { return v == null ? 'ว่าง' : 'มี'; } },
    { key: 'et1cruel-qtracker-hidden', label: 'qtracker-ซ่อน', valid: function (v) { return v == null || v === 0 || v === 1 || v === '0' || v === '1'; }, info: function (v) { return v == null ? 'ว่าง' : 'มี'; } }
  ];
  function parseRaw(raw) {
    if (raw == null) return null;
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }
  function collectBackup(app) {
    var data = {}, n = 0, i;
    for (i = 0; i < BACKUP_DEFS.length; i++) {
      var raw = null;
      try { raw = localStorage.getItem(BACKUP_DEFS[i].key); } catch (e) {}
      if (raw != null) { data[BACKUP_DEFS[i].key] = raw; n++; }
    }
    return { app: app || 'et1cruel-backup', v: 1, exportedAt: new Date().toISOString(), data: data, keys: n };
  }
  function download(name, text) {
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      return true;
    } catch (e) { return false; }
  }
  function doBackupAll() {
    var b = collectBackup('et1cruel-backup');
    if (!b.keys) { toast('ยังไม่มีข้อมูลอะไรให้สำรอง'); return; }
    if (download('et1cruel-backup-' + todayKey() + '.json', JSON.stringify(b, null, 2))) {
      toast('💾 สำรองทั้งหมด ' + b.keys + ' ชุดแล้ว ✓ (ไฟล์อยู่ในเครื่องคุณ)');
    } else toast('สำรองไม่สำเร็จ');
  }
  function doImportAll(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      var o = null;
      try { o = JSON.parse(r.result); } catch (err) { toast('ไฟล์ไม่ถูกต้อง (ไม่ใช่ JSON)'); return; }
      var data = (o && o.data && typeof o.data === 'object') ? o.data : null;
      if (!data) {
        // ยอมรับไฟล์ flat ที่key ตรง (เช่น export เก่า)
        data = {};
        var hk = false, i;
        for (i = 0; i < BACKUP_DEFS.length; i++) {
          if (o && Object.prototype.hasOwnProperty.call(o, BACKUP_DEFS[i].key)) { data[BACKUP_DEFS[i].key] = o[BACKUP_DEFS[i].key]; hk = true; }
        }
        if (!hk) { toast('ไฟล์นี้ไม่มีข้อมูลที่รู้จัก'); return; }
      }
      // ตรวจทุก key ก่อนเขียนจริง (atomic: พัง = ไม่เขียนเลย)
      var errors = [], previews = [], writes = [], i2;
      for (i2 = 0; i2 < BACKUP_DEFS.length; i2++) {
        var def = BACKUP_DEFS[i2];
        if (!Object.prototype.hasOwnProperty.call(data, def.key)) continue;
        var raw = data[def.key];
        var val = (typeof raw === 'string') ? parseRaw(raw) : raw;
        if (!def.valid(val)) { errors.push(def.label); continue; }
        writes.push({ key: def.key, raw: (typeof raw === 'string') ? raw : JSON.stringify(raw) });
        previews.push('• ' + def.label + ': ' + def.info(val));
      }
      if (errors.length) { toast('ไฟล์ไม่ผ่าน: ' + errors.join(' · ')); return; }
      if (!writes.length) { toast('ไฟล์นี้ไม่มีข้อมูลที่รู้จัก'); return; }
      var ok = false;
      try { ok = confirm('นำเข้าทับของเดิม?\n' + previews.join('\n') + '\n\nตกลง = สำรองของเดิมเป็นไฟล์ recovery ก่อน แล้วนำเข้า'); }
      catch (e2) { toast('เบราว์เซอร์นี้ยืนยันไม่ได้ ยกเลิกก่อน'); return; }
      if (!ok) return;
      // สำรองของเดิมก่อนทำลาย (กู้ได้)
      var rec = collectBackup('et1cruel-recovery');
      download('et1cruel-recovery-' + todayKey() + '.json', JSON.stringify(rec, null, 2));
      var j;
      for (j = 0; j < writes.length; j++) {
        try { localStorage.setItem(writes[j].key, writes[j].raw); } catch (e3) {}
      }
      toast('📥 นำเข้า ' + writes.length + ' ชุดแล้ว ✓ (มีไฟล์ recovery กันพลาด)');
      try { location.reload(); } catch (e4) {}
    };
    try { r.readAsText(file); } catch (e5) { toast('อ่านไฟล์ไม่ได้'); }
  }

  function doDelete(k) {
    if (!DB.entries[k]) return;
    if (!confirm('ลบไดอารี่วันที่ ' + k + ' ?')) return;
    delete DB.entries[k];
    save(DB);
    var de = $('diaryDate');
    if (de && de.value === k) loadToEditor(k);
    else { updateEditorMeta(); renderList(); }
    toast('ลบแล้ว 🗑');
  }

  function boot() {
    var de = $('diaryDate');
    if (!de) return; // หน้านี้ไม่มี section ไดอารี่
    de.value = todayKey();
    // จำกัดไม่ให้เลือกอนาคตไกล (กันมือลั่น) — อนุญาตถึงวันนี้เท่านั้น + อนาคต 7 วันเผื่อวางแผน
    try {
      var mx = new Date(); mx.setDate(mx.getDate() + 7);
      de.max = dayKey(mx);
    } catch (e) {}

    var box = $('diaryMoods');
    if (box) box.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-mood]') : null;
      if (b) { setMood(b.getAttribute('data-mood')); queueDraftSoon(); }
    });

    de.addEventListener('change', function () { loadToEditor(de.value || todayKey()); });
    var tx = $('diaryText');
    if (tx) tx.addEventListener('input', function () { updateEditorMeta(); queueDraftSoon(); });
    var ti = $('diaryTitle');
    if (ti) ti.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (tx) tx.focus(); }
    });
    if (ti) ti.addEventListener('input', queueDraftSoon);
    // Ctrl/Cmd+S = บันทึก
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        var sec = $('diary');
        if (!sec || sec.classList.contains('collapsed')) return;
        if (document.activeElement === tx || document.activeElement === ti) {
          e.preventDefault(); doSave();
        }
      }
    });

    var sv = $('diarySave'); if (sv) sv.addEventListener('click', doSave);
    var td = $('diaryToday'); if (td) td.addEventListener('click', function () { loadToEditor(todayKey()); });
    var del = $('diaryDelete');
    if (del) del.addEventListener('click', function () { doDelete(de.value || todayKey()); });
    var se = $('diarySearch'); if (se) se.addEventListener('input', renderList);

    // เปิด/ลบจากรายการ (delegate)
    var list = $('diaryList');
    if (list) list.addEventListener('click', function (e) {
      var o = e.target.closest ? e.target.closest('[data-dopen]') : null;
      var x = e.target.closest ? e.target.closest('[data-ddel]') : null;
      if (o) {
        loadToEditor(o.getAttribute('data-dopen'));
        var sec = $('diary');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var t2 = $('diaryText'); if (t2) t2.focus();
      } else if (x) doDelete(x.getAttribute('data-ddel'));
    });

    // Export / Import
    var ex = $('diaryExport');
    if (ex) ex.addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'diary-backup-' + todayKey() + '.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      toast('Export ไดอารี่แล้ว ✓');
    });
    var im = $('diaryImport');
    if (im) im.addEventListener('change', function () {
      var f = im.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var o = JSON.parse(r.result);
          var entries = o.entries || o;
          var n = 0;
          Object.keys(entries).forEach(function (k) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(k) && entries[k] && entries[k].text) {
              DB.entries[k] = {
                title: String(entries[k].title || '').slice(0, 80),
                text: String(entries[k].text || ''),
                mood: entries[k].mood || '🙂',
                updatedAt: entries[k].updatedAt || new Date().toISOString()
              };
              n++;
            }
          });
          save(DB); loadToEditor(de.value || todayKey()); renderList();
          toast('นำเข้า ' + n + ' วัน ✓');
        } catch (err) { toast('ไฟล์ไม่ถูกต้อง'); }
        im.value = '';
      };
      r.readAsText(f);
    });

    var ba = $('diaryBackupAll');
    if (ba) ba.addEventListener('click', doBackupAll);
    var ia = $('diaryImportAll');
    if (ia) ia.addEventListener('change', function () {
      var f = ia.files && ia.files[0];
      if (f) doImportAll(f);
      ia.value = '';
    });

    loadToEditor(todayKey());
    renderList();
    window.ET1DIARY = {
      save: doSave, open: loadToEditor,
      count: function () { return Object.keys(DB.entries).length; }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
