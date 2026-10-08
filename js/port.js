/* ===== Stock portfolio — ตารางพอร์ต NASDAQ, แก้ไขได้, เซฟลง localStorage, ซิงก์เข้า DIME US Stocks ===== */
(function () {
  var STORE_KEY = 'aom-port-v1';
  var MONEY_KEY = 'aom-money-v5';
  var MONEY_WALLET = 'dime-us';

  var DEFAULT_FX = 33.65;
  // ข้อมูลตั้งต้นจากภาพ (price US$, qty, cap/income/curr ฿)
  var DEFAULTS = [
    { sym: 'NVDA', market: 'NASDAQ', name: 'NVIDIA Corp', price: 237.47, qty: 0.4533, cap: 0, inc: 0, curr: 0.70, logo: 'N', color: '#76b900', domain: 'nvidia.com' },
    { sym: 'AVGO', market: 'NASDAQ', name: 'Broadcom Inc', price: 376.51, qty: 0.1716, cap: 0, inc: 0, curr: 0.42, logo: 'A', color: '#cc092f', domain: 'broadcom.com' },
    { sym: 'CRWD', market: 'NASDAQ', name: 'Crowdstrike Holdings Inc - Ordinary Shares - Class A', price: 265.44, qty: 0.1529, cap: 0, inc: 0, curr: 0.26, logo: 'C', color: '#e01f26', domain: 'crowdstrike.com' },
    { sym: 'ASML', market: 'NASDAQ', name: 'ASML Holding NV - New York Shares', price: 1804.96, qty: 0.0167, cap: 0, inc: 0, curr: 0.20, logo: 'A', color: '#00a0df', domain: 'asml.com' },
    { sym: 'PLTR', market: 'NASDAQ', name: 'Palantir Technologies Inc - Ordinary Shares - Class A', price: 194.12, qty: 0.1531, cap: 0, inc: 0, curr: 0.19, logo: 'P', color: '#4258d0', domain: 'palantir.com' },
    { sym: 'AMD', market: 'NASDAQ', name: 'Advanced Micro Devices Inc.', price: 645.86, qty: 0.0458, cap: 0, inc: 0, curr: 0.19, logo: 'A', color: '#ed1c24', domain: 'amd.com' },
    { sym: 'MRVL', market: 'NASDAQ', name: 'Marvell Technology Inc', price: 284.68, qty: 0.1035, cap: 0, inc: 0, curr: 0.19, logo: 'M', color: '#c8102e', domain: 'marvell.com' },
    { sym: 'PENG', market: 'NASDAQ', name: 'Penguin Solutions Inc.', price: 72.61, qty: 0.4054, cap: 0, inc: 0, curr: 0.19, logo: 'P', color: '#14b8a6', domain: 'penguinsolutions.com' },
    { sym: 'LITE', market: 'NASDAQ', name: 'Lumentum Holdings Inc', price: 1111.07, qty: 0.0108, cap: 0, inc: 0, curr: 0.08, logo: 'L', color: '#9ca3af', domain: 'lumentum.com' },
    { sym: 'COST', market: 'NASDAQ', name: 'Costco Wholesale Corp', price: 942.25, qty: 0.0101, cap: 0, inc: 0, curr: 0.06, logo: 'C', color: '#005daa', domain: 'costco.com' }
  ];

  var section = document.getElementById('port-snap');
  if (!section) return;
  var body = document.getElementById('portBody');
  var editBtn = document.getElementById('editPortBtn');
  var resetBtn = document.getElementById('resetPortBtn');
  var fxInput = document.getElementById('portFx');
  var updatedEl = document.getElementById('portUpdated');

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function getData() {
    var s = load();
    if (s && Array.isArray(s.stocks) && s.stocks.length) {
      if (typeof s.fx !== 'number' || !(s.fx > 0)) s.fx = DEFAULT_FX;
      // เติมฟิลด์ใหม่ (domain/logo/color) จาก default โดยไม่ทับค่าที่ผู้ใช้แก้ (price/qty/cap/inc/curr)
      s.stocks.forEach(function (st) {
        var def = DEFAULTS.filter(function (x) { return x.sym === st.sym; })[0];
        if (def) {
          ['market', 'name', 'logo', 'color', 'domain'].forEach(function (k) {
            if (st[k] == null) st[k] = def[k];
          });
          // โลโก้อิโมจิเก่า → ใช้ตัวอักษรย่อแทน (รูปจริงทับอยู่แล้ว)
          if (st.logo && st.logo.length > 1) st.logo = def.logo;
        }
      });
      return s;
    }
    return { fx: DEFAULT_FX, stocks: JSON.parse(JSON.stringify(DEFAULTS)), updatedAt: null };
  }
  function logoUrl(s) {
    return s.domain
      ? 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(s.domain) + '&sz=64'
      : null;
  }
  function save(d) {
    d.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {}
    renderUpdated(d.updatedAt);
  }
  function fmt(n, dec) {
    return (n || 0).toLocaleString('th-TH', { minimumFractionDigits: dec != null ? dec : 2, maximumFractionDigits: dec != null ? dec : 2 });
  }
  function fmtInt(n) { return Math.round(n || 0).toLocaleString('th-TH'); }
  function fmtDate(iso) {
    if (!iso) return null;
    try { return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return null; }
  }
  function renderUpdated(iso) {
    if (!updatedEl) return;
    var d = fmtDate(iso);
    if (d) updatedEl.innerHTML = 'อัพเดทล่าสุด <b>' + d + '</b> · แตะตัวเลขเพื่อแก้ไขได้เลย';
    else updatedEl.textContent = 'แตะตัวเลขเพื่อแก้ไขได้เลย';
  }
  function valueTHB(s, fx) { return s.price * s.qty * fx; }
  function retTHB(s) { return (s.cap || 0) + (s.inc || 0) + (s.curr || 0); }

  var sortKey = 'value', sortDir = -1;

  function sortedStocks(stocks, fx) {
    var arr = stocks.slice();
    arr.sort(function (a, b) {
      var va, vb;
      switch (sortKey) {
        case 'symbol': va = a.sym; vb = b.sym; return sortDir * String(va).localeCompare(String(vb));
        case 'price': va = a.price; vb = b.price; break;
        case 'qty': va = a.qty; vb = b.qty; break;
        case 'cap': va = a.cap; vb = b.cap; break;
        case 'inc': va = a.inc; vb = b.inc; break;
        case 'curr': va = a.curr; vb = b.curr; break;
        case 'ret': va = retTHB(a); vb = retTHB(b); break;
        default: va = valueTHB(a, fx); vb = valueTHB(b, fx);
      }
      return (va - vb) * sortDir;
    });
    return arr;
  }

  function syncToMoneyWallet(totalRounded) {
    // ปิด auto-sync ตามคำขอ — ยอด DIME US Stocks คุมเองจาก section เงิน (13,000)
    // คงฟังก์ชันไว้เผื่อเปิดกลับ แค่ return เฉยๆ
    return;
  }

  function render() {
    var d = getData();
    var fx = d.fx || DEFAULT_FX;
    if (fxInput && document.activeElement !== fxInput) fxInput.value = fx;

    var rows = sortedStocks(d.stocks, fx);
    body.innerHTML = '';

    var tVal = 0, tCap = 0, tInc = 0, tCurr = 0, tRet = 0;
    rows.forEach(function (s) {
      var v = valueTHB(s, fx), r = retTHB(s);
      tVal += v; tCap += s.cap || 0; tInc += s.inc || 0; tCurr += s.curr || 0; tRet += r;

      var tr = document.createElement('tr');
      tr.dataset.sym = s.sym;

      var tdSym = document.createElement('td');
      tdSym.className = 'l';
      tdSym.innerHTML = '<div class="port-sym"><span class="port-logo" style="color:' + (s.color || '#9e2b1e') + '">' +
        (s.logo || s.sym.charAt(0)) + '</span><span><div class="sn">' + s.sym +
        ' <small>| ' + (s.market || 'NASDAQ') + '</small></div><div class="fn">' + s.name + '</div></span></div>';
      tr.appendChild(tdSym);

      tr.appendChild(numCell('US$' + fmt(s.price), 'price', s.sym));
      tr.appendChild(numCell(fmt(s.qty, 4), 'qty', s.sym));
      var tdV = document.createElement('td');
      tdV.className = 'num';
      tdV.innerHTML = '<b>฿' + fmt(v) + '</b>';
      tr.appendChild(tdV);
      tr.appendChild(numCell('฿' + fmt(s.cap), 'cap', s.sym, true));
      tr.appendChild(numCell('฿' + fmt(s.inc), 'inc', s.sym, true));
      tr.appendChild(numCell('฿' + fmt(s.curr), 'curr', s.sym, false));
      var tdR = document.createElement('td');
      tdR.className = 'num';
      tdR.innerHTML = '<b>฿' + fmt(r) + '</b>';
      tr.appendChild(tdR);

      body.appendChild(tr);
    });

    setText('portTotalValue', '฿' + fmt(tVal));
    setText('portTotalCap', '฿' + fmt(tCap));
    setText('portTotalInc', '฿' + fmt(tInc));
    setText('portTotalCurr', '฿' + fmt(tCurr));
    setText('portTotalRet', '฿' + fmt(tRet));
    setText('portGrandValue', '฿' + fmt(tVal));
    setText('portGrandCap', '฿' + fmt(tCap));
    setText('portGrandInc', '฿' + fmt(tInc));
    setText('portGrandCurr', '฿' + fmt(tCurr));
    setText('portGrandRet', '฿' + fmt(tRet));

    // header sort highlight
    document.querySelectorAll('#portTable thead th').forEach(function (th) {
      th.classList.toggle('sorted', th.dataset.sort === sortKey);
    });

    bindInlineEdit();
    syncToMoneyWallet(Math.round(tVal * 100) / 100);
  }

  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }

  function numCell(text, field, sym, muted) {
    var td = document.createElement('td');
    td.className = 'num' + (muted ? ' muted' : '');
    td.dataset.field = field;
    td.dataset.sym = sym;
    td.textContent = text;
    return td;
  }

  function bindInlineEdit() {
    body.querySelectorAll('td[data-field]').forEach(function (td) {
      if (td.dataset.bound) return;
      td.dataset.bound = '1';
      td.addEventListener('click', function () {
        if (!section.classList.contains('editing')) return;
        if (td.querySelector('input')) return;
        var field = td.dataset.field, sym = td.dataset.sym;
        var d = getData();
        var s = d.stocks.filter(function (x) { return x.sym === sym; })[0];
        if (!s) return;
        var cur = s[field];
        var input = document.createElement('input');
        input.className = 'money-input';
        input.value = cur;
        input.inputMode = 'decimal';
        td.textContent = '';
        td.appendChild(input);
        input.focus();
        input.select();
        function commit(saveIt) {
          if (saveIt) {
            var num = parseFloat(String(input.value).replace(/[^0-9.\-]/g, ''));
            if (isNaN(num)) num = 0;
            if (field === 'qty' && num < 0) num = 0;
            s[field] = num;
            save(d);
          }
          render();
        }
        input.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') commit(true);
          if (ev.key === 'Escape') render();
          ev.stopPropagation();
        });
        input.addEventListener('blur', function () { commit(true); });
        input.addEventListener('click', function (ev) { ev.stopPropagation(); });
      });
    });
  }

  // sort header
  document.querySelectorAll('#portTable thead th[data-sort]').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.dataset.sort;
      if (sortKey === k) sortDir *= -1;
      else { sortKey = k; sortDir = (k === 'symbol' ? 1 : -1); }
      render();
    });
  });

  // FX edit
  if (fxInput) {
    fxInput.addEventListener('change', function () {
      var num = parseFloat(String(fxInput.value).replace(/[^0-9.]/g, ''));
      if (!(num > 0)) { render(); return; }
      var d = getData();
      d.fx = Math.round(num * 100) / 100;
      save(d);
      render();
    });
  }

  // edit mode
  var editing = false;
  function setEditing(on) {
    editing = on;
    section.classList.toggle('editing', on);
    if (editBtn) {
      editBtn.textContent = on ? '✔ เสร็จแล้ว' : '✎ แก้ไขพอร์ต';
      editBtn.classList.toggle('active', on);
    }
    if (resetBtn) resetBtn.hidden = !on;
    body.querySelectorAll('td[data-field]').forEach(function (td) {
      td.classList.toggle('editable', on);
    });
    if (on && updatedEl) updatedEl.innerHTML = 'โหมดแก้ไข: <b>แตะที่ราคา/จำนวน/กำไร</b> แล้วพิมพ์ตัวเลขใหม่ กด Enter เพื่อบันทึก';
    else renderUpdated(getData().updatedAt);
  }
  if (editBtn) editBtn.addEventListener('click', function () {
    setEditing(!editing);
    if (editing) render(); // re-bind editable class
    else render();
  });
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!confirm('รีเซ็ตพอร์ตกลับเป็นค่าเริ่มต้น?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    render();
    renderUpdated(null);
  });

  var init = getData();
  renderUpdated(init.updatedAt);
  render();

  // เผย section ด้วย observer เดิมถ้ามี
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { section.classList.add('show'); io.disconnect(); }
      });
    }, { threshold: 0.08 });
    io.observe(section);
  } else {
    section.classList.add('show');
  }
})();
