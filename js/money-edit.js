/* ===== Inline money editor — แตะตัวเลขเพื่อแก้ไข, เซฟลง localStorage อัตโนมัติ ===== */
(function () {
  var STORE_KEY = 'aom-money-v3'; // v3: ยอด ต.ค. 2026 (Kept 200K / DIME US 11K)
  var GOAL = 1000000;

  var section = document.getElementById('money-section');
  if (!section) return;
  var editBtn = document.getElementById('editMoneyBtn');
  var resetBtn = document.getElementById('resetMoneyBtn');
  var updatedEl = document.getElementById('moneyUpdated');
  var totalEl = document.getElementById('totalWallet');
  var goalDesc = document.getElementById('goalMainDesc');
  var goalBar = document.getElementById('goalMainBar');
  var goalPct = document.getElementById('goalMainPct');
  var chartNote = document.getElementById('chartNote');

  // เก็บค่า default จาก HTML (เผื่อกดรีเซ็ต)
  var defaults = { wallets: {}, history: {} };
  section.querySelectorAll('.w[data-money-key] .wv').forEach(function (el) {
    var key = el.closest('.w').getAttribute('data-money-key');
    defaults.wallets[key] = parseInt(el.getAttribute('data-count'), 10) || 0;
  });
  section.querySelectorAll('.cbar[data-money-key]').forEach(function (bar) {
    var key = bar.getAttribute('data-money-key');
    if (key !== 'total-bar') defaults.history[key] = parseInt(bar.getAttribute('data-v'), 10) || 0;
  });

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function save(data) {
    data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
    renderUpdated(data.updatedAt);
  }
  function getData() {
    var s = load();
    if (s && s.wallets) return s;
    return { wallets: Object.assign({}, defaults.wallets), history: Object.assign({}, defaults.history), updatedAt: null };
  }

  function fmt(n) { return (n || 0).toLocaleString('th-TH'); }
  function fmtDate(iso) {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return null; }
  }
  function renderUpdated(iso) {
    if (!updatedEl) return;
    var d = fmtDate(iso);
    if (d) updatedEl.innerHTML = 'อัพเดทล่าสุด <b>' + d + '</b> · แตะตัวเลขเพื่อแก้ไขได้เลย';
    else updatedEl.textContent = 'แตะตัวเลขเพื่อแก้ไขได้เลย';
  }

  function calcTotal(wallets) {
    var sum = 0;
    Object.keys(wallets).forEach(function (k) { sum += (+wallets[k] || 0); });
    return sum;
  }

  // วาดค่าทั้งหมดลงหน้าเว็บ (ยอดรวม + กราฟ + เป้าหมาย คำนวณอัตโนมัติ)
  function render(data, animate) {
    var total = calcTotal(data.wallets);

    // 1. wallets
    section.querySelectorAll('.w[data-money-key] .wv').forEach(function (el) {
      var key = el.closest('.w').getAttribute('data-money-key');
      var v = data.wallets[key] || 0;
      el.setAttribute('data-count', v);
      if (!el.querySelector('input')) el.textContent = fmt(v);
    });
    // total (auto-sum)
    if (totalEl) {
      totalEl.setAttribute('data-count', total);
      if (!totalEl.querySelector('input')) totalEl.textContent = fmt(total);
    }

    // 2. chart: 3 แท่งแรกตาม history, แท่งสุดท้าย = total
    var maxV = Math.max(total, data.history.h1 || 0, data.history.h2 || 0, data.history.h3 || 0, 1);
    section.querySelectorAll('.cbar[data-money-key]').forEach(function (bar) {
      var key = bar.getAttribute('data-money-key');
      var v = (key === 'total-bar') ? total : (data.history[key] || 0);
      bar.setAttribute('data-v', v);
      var h = Math.max(4, Math.round((v / maxV) * 90));
      bar.setAttribute('data-h', h);
      var col = bar.querySelector('.col');
      // ถ้าแท่งเคยแสดงแล้ว (มี .show) อัพเดทความสูงทันที ไม่งั้นปล่อยให้ main.js animate ตอน scroll
      if (bar.classList.contains('show') && col) col.style.height = h + '%';
      var valEl = bar.querySelector('.val');
      if (valEl && !valEl.querySelector('input')) valEl.textContent = fmt(v);
    });

    // 3. goal 1M อัตโนมัติ
    var pct = Math.min(100, (total / GOAL) * 100);
    var remain = Math.max(0, GOAL - total);
    if (goalBar) { goalBar.setAttribute('data-w', pct.toFixed(1)); goalBar.style.width = pct.toFixed(1) + '%'; }
    if (goalPct) goalPct.textContent = (Math.round(pct * 10) / 10) + '%';
    if (goalDesc) goalDesc.textContent = remain > 0
      ? 'เป้าหมายหลัก — เหลืออีก ' + fmt(remain) + ' ฿'
      : 'บรรลุเป้าหมาย 1,000,000 ฿ แล้ว! 🎉';

    // 4. chart note เติบโตกี่เท่า
    if (chartNote) {
      var first = data.history.h1 || 1;
      var times = (total / first);
      chartNote.textContent = '* อัพเดทล่าสุด ' + fmt(total) + ' ฿ — เติบโต ~' + (Math.round(times * 10) / 10) + ' เท่าจากจุดแรก';
    }
  }

  // --- inline edit: แตะตัวเลข -> กลายเป็นช่องกรอก ---
  function makeEditable(el, getVal, onSave) {
    el.classList.add('editable');
    el.addEventListener('click', function () {
      if (!section.classList.contains('editing')) return;
      if (el.querySelector('input')) return;
      var cur = getVal();
      var input = document.createElement('input');
      input.className = 'money-input';
      input.type = 'text';
      input.inputMode = 'numeric';
      input.value = cur;
      el.textContent = '';
      el.appendChild(input);
      input.focus();
      input.select();
      function commit() {
        var num = parseInt(String(input.value).replace(/[^0-9]/g, ''), 10);
        if (isNaN(num)) num = 0;
        onSave(num);
      }
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') commit();
        if (ev.key === 'Escape') render(getData());
        ev.stopPropagation();
      });
      input.addEventListener('blur', commit);
      input.addEventListener('click', function (ev) { ev.stopPropagation(); });
    });
  }

  var data = getData();
  render(data);
  renderUpdated(data.updatedAt);

  // ผูก edit กับ wallet แต่ละใบ
  section.querySelectorAll('.w[data-money-key]').forEach(function (box) {
    var key = box.getAttribute('data-money-key');
    var el = box.querySelector('.wv');
    makeEditable(el, function () { return getData().wallets[key] || 0; }, function (num) {
      var d = getData();
      d.wallets[key] = num;
      save(d);
      render(d);
    });
  });
  // ผูก edit กับกราฟ 3 แท่งแรก
  section.querySelectorAll('.cbar[data-money-key]').forEach(function (bar) {
    var key = bar.getAttribute('data-money-key');
    if (key === 'total-bar') return; // แท่งรวมคำนวณอัตโนมัติ ห้ามแก้ตรง
    var valEl = bar.querySelector('.val');
    makeEditable(valEl, function () { return getData().history[key] || 0; }, function (num) {
      var d = getData();
      d.history[key] = num;
      save(d);
      render(d);
    });
  });

  // ปุ่มแก้ไข / เสร็จ
  var editing = false;
  function setEditing(on) {
    editing = on;
    section.classList.toggle('editing', on);
    editBtn.textContent = on ? '✔ เสร็จแล้ว' : '✎ แก้ไขยอดเงิน';
    editBtn.classList.toggle('active', on);
    if (resetBtn) resetBtn.hidden = !on;
    if (on && updatedEl) updatedEl.innerHTML = 'โหมดแก้ไข: <b>แตะที่ตัวเลข</b> แล้วพิมพ์ยอดใหม่ กด Enter เพื่อบันทึก';
    else renderUpdated(getData().updatedAt);
  }
  if (editBtn) editBtn.addEventListener('click', function () { setEditing(!editing); });

  // ปุ่มรีเซ็ต
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!confirm('รีเซ็ตยอดเงินกลับเป็นค่าเดิม?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    render({ wallets: Object.assign({}, defaults.wallets), history: Object.assign({}, defaults.history) });
    renderUpdated(null);
  });
})();
