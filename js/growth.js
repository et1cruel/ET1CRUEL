(function () {
  'use strict';
  var KEY = 'et1cruel_growth_v1';
  var $ = function (id) { return document.getElementById(id); };
  var today = new Date();
  var dateKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  var state = { logs: [], proofs: [], weeks: [] };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && Array.isArray(saved.logs) && Array.isArray(saved.proofs) && Array.isArray(saved.weeks)) state = saved;
  } catch (_) {}
  ['logDate', 'proofDate', 'weekDate'].forEach(function (id) { $(id).value = dateKey; });

  function esc(text) { return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (_) { notify('พื้นที่จัดเก็บเต็ม ลองสำรองหรือลบรายการเก่าก่อน'); return false; } }
  var toastTimer;
  function notify(message) { var el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200); }
  function makeId() { return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function sorted(list) { return list.slice().sort(function (a, b) { return b.date.localeCompare(a.date) || b.id.localeCompare(a.id); }); }
  function removeButton(type, id) { return '<button class="del" type="button" data-remove="' + type + '" data-id="' + esc(id) + '" aria-label="ลบบันทึก">ลบ</button>'; }
  function render() {
    $('logList').innerHTML = state.logs.length ? sorted(state.logs).map(function (x) { return '<article class="entry"><div class="entry-top"><div><h3>' + esc(x.title) + '</h3><div class="meta">' + esc(x.date) + ' · ' + esc(x.type) + '</div></div>' + removeButton('logs', x.id) + '</div>' + (x.body ? '<p>' + esc(x.body) + '</p>' : '') + '</article>'; }).join('') : '<div class="empty"><b>บันทึกแรกยังรออยู่</b>วันนี้ได้เรียนรู้อะไรเกี่ยวกับตัวเองบ้าง?</div>';
    $('proofList').innerHTML = state.proofs.length ? sorted(state.proofs).map(function (x) { var link = safeUrl(x.url); return '<article class="entry proof"><div class="entry-top"><div><h3>' + esc(x.title) + '</h3><div class="meta">' + esc(x.date) + ' · ' + esc(x.type) + '</div></div>' + removeButton('proofs', x.id) + '</div>' + (x.note ? '<p>' + esc(x.note) + '</p>' : '') + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">เปิดผลงาน ↗</a>' : '') + '</article>'; }).join('') : '<div class="empty"><b>ความก้าวหน้าไม่จำเป็นต้องใหญ่</b>เก็บหลักฐานชิ้นแรกเมื่อพร้อม</div>';
    $('weekList').innerHTML = state.weeks.length ? sorted(state.weeks).map(function (x) { return '<article class="entry week"><div class="entry-top"><div><h3>สัปดาห์เริ่ม ' + esc(x.date) + '</h3></div>' + removeButton('weeks', x.id) + '</div>' + (x.win ? '<div class="label">ภูมิใจ</div><p>' + esc(x.win) + '</p>' : '') + (x.hard ? '<div class="label" style="margin-top:9px">ยาก / ได้เรียนรู้</div><p>' + esc(x.hard) + '</p>' : '') + (x.next ? '<div class="label" style="margin-top:9px">อยากลองต่อ</div><p>' + esc(x.next) + '</p>' : '') + '</article>'; }).join('') : '<div class="empty"><b>พักทบทวนสั้น ๆ ได้ทุกเมื่อ</b>อะไรคือเรื่องหนึ่งที่อยากพาติดตัวไปสัปดาห์หน้า?</div>';
    applyEntrySearches();
  }
  function applyEntrySearches() {
    document.querySelectorAll('[data-entry-search]').forEach(function (input) {
      var list = $(input.getAttribute('data-entry-search'));
      var empty = $(list.id.replace('List', 'SearchEmpty'));
      var query = input.value.trim().toLocaleLowerCase();
      var entries = list.querySelectorAll('.entry');
      var visible = 0;
      entries.forEach(function (entry) {
        var matches = !query || entry.textContent.toLocaleLowerCase().indexOf(query) !== -1;
        entry.hidden = !matches;
        if (matches) visible++;
      });
      if (empty) empty.hidden = !query || visible > 0 || entries.length === 0;
    });
  }
  function safeUrl(url) { try { var u = new URL(url); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (_) { return ''; } }
  function value(id) { return $(id).value.trim(); }
  function submit(formId, build, message) { $(formId).addEventListener('submit', function (event) { event.preventDefault(); var item = build(); if (!item) return; state[item.collection].push(item.value); if (!persist()) { state[item.collection].pop(); return; } render(); $(formId).reset(); var dateInput = $(formId).querySelector('input[type="date"]'); if (dateInput) dateInput.value = dateKey; notify(message); }); }
  submit('logForm', function () { return { collection: 'logs', value: { id: makeId(), date: value('logDate'), type: $('logType').value, title: value('logTitle'), body: value('logBody') } }; }, 'บันทึก Growth Log แล้ว');
  submit('proofForm', function () { var url = value('proofUrl'); if (url && !safeUrl(url)) { $('proofUrl').setCustomValidity('ใส่ลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://'); $('proofUrl').reportValidity(); $('proofUrl').setCustomValidity(''); return null; } return { collection: 'proofs', value: { id: makeId(), date: value('proofDate'), type: $('proofType').value, title: value('proofTitle'), note: value('proofNote'), url: url } }; }, 'เก็บหลักฐานแล้ว');
  submit('weekForm', function () { if (!value('weekWin') && !value('weekHard') && !value('weekNext')) { notify('เขียนสักหนึ่งข้อก่อนบันทึกนะ'); return null; } return { collection: 'weeks', value: { id: makeId(), date: value('weekDate'), win: value('weekWin'), hard: value('weekHard'), next: value('weekNext') } }; }, 'บันทึกรีวิวแล้ว');
  document.addEventListener('click', function (event) {
    var tab = event.target.closest('[role="tab"]');
    if (tab) { document.querySelectorAll('[role="tab"]').forEach(function (el) { el.setAttribute('aria-selected', el === tab ? 'true' : 'false'); }); document.querySelectorAll('[role="tabpanel"]').forEach(function (el) { el.classList.toggle('active', el.id === tab.getAttribute('aria-controls')); }); return; }
    var del = event.target.closest('[data-remove]');
    if (del) { var key = del.getAttribute('data-remove'), id = del.getAttribute('data-id'); state[key] = state[key].filter(function (x) { return x.id !== id; }); if (persist()) { render(); notify('ลบบันทึกแล้ว'); } }
  });
  $('exportBtn').addEventListener('click', function () { var blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2)], { type: 'application/json' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'et1cruel-growth-backup.json'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); notify('ดาวน์โหลดไฟล์สำรองแล้ว'); });
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function (event) { var file = event.target.files && event.target.files[0]; if (!file) return; var reader = new FileReader(); reader.onload = function () { try { var parsed = JSON.parse(reader.result), candidate = parsed.data || parsed; if (!candidate || !Array.isArray(candidate.logs) || !Array.isArray(candidate.proofs) || !Array.isArray(candidate.weeks)) throw new Error('format'); if (!window.confirm('นำเข้าข้อมูล Growth จากไฟล์นี้และแทนที่ข้อมูลปัจจุบันหรือไม่? แนะนำกดสำรองข้อมูลก่อน')) return; var previous = state; state = candidate; if (!persist()) { state = previous; return; } render(); notify('กู้คืนข้อมูลแล้ว'); } catch (_) { notify('ไฟล์นี้ไม่ใช่ข้อมูล Growth ที่รองรับ'); } finally { event.target.value = ''; } }; reader.readAsText(file); });
  document.addEventListener('keydown', function (event) { if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return; var current = event.target.closest('[role="tab"]'); if (!current) return; var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]')); var next = (tabs.indexOf(current) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; tabs[next].focus(); tabs[next].click(); });
  document.querySelectorAll('[data-entry-search]').forEach(function (input) { input.addEventListener('input', applyEntrySearches); });
  render();
}());
