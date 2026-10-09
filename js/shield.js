/* ===== SHIELD — หุ้นกันตาย: ธุรกิจจริงที่ขึ้นได้แม้ชิป AI ลง =====
 * ลิสต์จัด 9 ต.ค. 2569 · ราคาสด TradingView Scanner (ยิงตรงจากเบราว์เซอร์, ไม่ต้องใช้ key)
 * แคช 5 นาที + ออฟไลน์ใช้แคชล่าสุด · ไม่ใช่คำแนะนำการลงทุน */
(function () {
  'use strict';
  var LIST = [
    { sym: 'PLTR', name: 'Palantir', tv: 'NASDAQ:PLTR', why: 'สัญญารัฐ+เอกชนระยะยาว รายได้ประจำ' },
    { sym: 'AAPL', name: 'Apple', tv: 'NASDAQ:AAPL', why: 'เงินสดล้น ปันผล+ซื้อหุ้นคืน หลุมหลบภัย' },
    { sym: 'FDX', name: 'FedEx', tv: 'NYSE:FDX', why: 'ขนส่งตามเศรษฐกิจจริง ไม่พึ่งไฮป์เทค' },
    { sym: 'WMT', name: 'Walmart', tv: 'NASDAQ:WMT', why: 'ของจำเป็น คนแห่เข้าตอนเศรษฐกิจแย่' },
    { sym: 'RDDT', name: 'Reddit', tv: 'NYSE:RDDT', why: 'โฆษณา+data โตแรงเกินตลาดซบ' },
    { sym: 'KO', name: 'Coca-Cola', tv: 'NYSE:KO', why: 'เครื่องดื่มกันตาย ปันผลยาวนาน' },
    { sym: 'NFLX', name: 'Netflix', tv: 'NASDAQ:NFLX', why: 'สมาชิกรายเดือน กระแสเงินสดนิ่ง' },
    { sym: 'CVX', name: 'Chevron', tv: 'NYSE:CVX', why: 'น้ำมัน+ปันผล พลังงานยืนระยะ' },
    { sym: 'ADBE', name: 'Adobe', tv: 'NASDAQ:ADBE', why: 'ซอฟต์แวร์สมัครสมาชิก กำไรนิ่ง' },
    { sym: 'MCD', name: "McDonald's", tv: 'NYSE:MCD', why: 'ฟาสต์ฟู้ดขายดีทุกสภาวะ' },
    { sym: 'DPZ', name: "Domino's", tv: 'NASDAQ:DPZ', why: 'พิซซ่าเดลิเวอรี ธุรกิจง่ายกำไรดี' },
    { sym: 'EG', name: 'Everest Group', tv: 'NYSE:EG', why: 'ประกันภัย เบี้ยนิ่งไม่สนตลาด' },
    { sym: 'RL', name: 'Ralph Lauren', tv: 'NYSE:RL', why: 'แบรนด์พรีเมียม ลูกค้าซื้อซ้ำ' },
    { sym: 'MA', name: 'Mastercard', tv: 'NYSE:MA', why: 'กินค่าธรรมเนียมทุกธุรกรรม' },
    { sym: 'PSX', name: 'Phillips 66', tv: 'NYSE:PSX', why: 'โรงกลั่น+ปั๊ม เงินสดนิ่ง' },
    { sym: 'HP', name: 'Helmerich & Payne', tv: 'NYSE:HP', why: 'ขุดเจาะน้ำมัน สัญญาระยะยาว' },
    { sym: 'COST', name: 'Costco', tv: 'NASDAQ:COST', why: 'สมาชิก+ของถูก คนแน่นทุกวิกฤต' }
  ];
  var CACHE_KEY = 'et1shield-cache-v1';
  var CACHE_MS = 5 * 60 * 1000;
  var FX_FALLBACK = 33.6;
  // สแนปช็อตอ้างอิง 8 ต.ค. 2569 (ใช้เฉพาะตอนสดพัง+ไม่มีแคช)
  var SNAP = { WMT: { price: 110.56, prev: 108.16, chg: 2.40, pct: 2.22 } };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function num(v) { v = +v; return (isFinite(v) && v > 0) ? v : null; }
  function numS(v) { v = +v; return isFinite(v) ? v : null; }
  function fmtN(n, d) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('th-TH', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function getJSON(url, ms) {
    var ctrl = null, timer = null;
    try {
      if (typeof AbortController !== 'undefined') {
        ctrl = new AbortController();
        timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, ms || 12000);
      }
    } catch (e) { ctrl = null; }
    var p = fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    });
    if (timer) p = p.then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
    return p;
  }
  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.rows) return null;
      return o;
    } catch (e) { return null; }
  }
  function saveCache(rows, fx) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ rows: rows, fx: fx, ts: Date.now() })); } catch (e) {}
  }
  function fetchOne(w) {
    var url = 'https://scanner.tradingview.com/symbol?symbol=' + encodeURIComponent(w.tv) +
      '&fields=close,change,previous_close';
    return getJSON(url).then(function (d) {
      var price = num(d.close);
      if (price == null) throw new Error('bad tv ' + w.sym);
      var pct = numS(d.change) || 0;
      var prevRaw = num(d.previous_close);
      var prev = prevRaw != null ? prevRaw : (pct ? price / (1 + pct / 100) : price);
      return { sym: w.sym, price: price, prev: prev, chg: price - prev, pct: pct, live: true };
    });
  }
  function fetchFX() {
    return getJSON('https://open.er-api.com/v6/latest/USD').then(function (d) {
      var r = d && d.rates ? num(d.rates.THB) : null;
      if (r == null) throw new Error('bad fx');
      return r;
    });
  }
  function rowHtml(w, p, fx) {
    var cls = p.chg > 0 ? 'stock-up' : (p.chg < 0 ? 'stock-down' : 'stock-flat');
    var arrow = p.chg > 0 ? '▲' : (p.chg < 0 ? '▼' : '–');
    var thb = p.price != null ? p.price * fx : null;
    return '<tr><td><span class="stock-sym">' + esc(w.sym) + '<small>' + esc(w.name) + ' · ' + esc(w.why) + '</small></span></td>' +
      '<td><span class="stock-price">$' + fmtN(p.price, 2) + '</span><div class="stock-hl">≈ ' + fmtN(thb, 0) + ' ฿</div></td>' +
      '<td><span class="' + cls + '">' + arrow + ' ' + fmtN(p.chg, 2) + ' (' + fmtN(p.pct, 2) + '%)</span>' +
      (p.live ? '' : '<div class="stock-hl">○ ราคาแคช</div>') + '</td></tr>';
  }
  function render(rows, fx, live, ts) {
    var tb = $('shieldBody');
    if (!tb) return;
    var bySym = {}, i;
    for (i = 0; i < rows.length; i++) bySym[rows[i].sym] = rows[i];
    var html = '', up = 0, down = 0, sum = 0, n = 0;
    for (i = 0; i < LIST.length; i++) {
      var p = bySym[LIST[i].sym] || {};
      if (p.pct > 0) up++; else if (p.pct < 0) down++;
      if (p.pct != null && !isNaN(p.pct)) { sum += p.pct; n++; }
      html += rowHtml(LIST[i], p, fx);
    }
    tb.innerHTML = html;
    var sumEl = $('shieldSum');
    if (sumEl) sumEl.innerHTML = 'เขียว <b class="stock-up">' + up + '</b> · แดง <b class="stock-down">' + down +
      '</b> · เฉลี่ย <b>' + (n ? (sum / n >= 0 ? '+' : '') + fmtN(sum / n, 2) + '%' : '—') + '</b>';
    var up2 = $('shieldUpdated');
    if (up2) {
      var t = ts ? new Date(ts).toLocaleString('th-TH') : '—';
      up2.textContent = (live ? '● ราคาสด TradingView' : '○ ออฟไลน์ ใช้แคชล่าสุด') + ' · $1 ≈ ' + fmtN(fx, 2) + ' ฿ · ' + t;
    }
  }
  var busy = false;
  function refresh(force) {
    if (busy) return;
    var tb = $('shieldBody');
    if (!tb) return;
    var cached = loadCache();
    if (!force && cached && (Date.now() - cached.ts) < CACHE_MS) { render(cached.rows, cached.fx, false, cached.ts); return; }
    busy = true;
    if (tb && !tb.innerHTML) tb.innerHTML = '<tr><td colspan="3" style="text-align:center">กำลังดึงราคาสด…</td></tr>';
    var jobs = LIST.map(function (w) {
      return fetchOne(w).then(function (v) { return v; }, function () { return null; });
    });
    Promise.all(jobs).then(function (rs) {
      var rows = [], i;
      for (i = 0; i < rs.length; i++) { if (rs[i]) rows.push(rs[i]); }
      var oldBySym = {};
      if (cached) { for (i = 0; i < cached.rows.length; i++) oldBySym[cached.rows[i].sym] = cached.rows[i]; }
      // ตัวที่สดพัง ใช้แคชเก่าเติม (mark ไม่สด)
      for (i = 0; i < LIST.length; i++) {
        var has = false, k;
        for (k = 0; k < rows.length; k++) { if (rows[k].sym === LIST[i].sym) { has = true; break; } }
        if (!has && oldBySym[LIST[i].sym]) {
          var c = oldBySym[LIST[i].sym];
          rows.push({ sym: c.sym, price: c.price, prev: c.prev, chg: c.chg, pct: c.pct, live: false });
        }
      }
      fetchFX().then(function (fx) { done(rows, fx, rows.length > 0); }, function () {
        done(rows, (cached && cached.fx) || FX_FALLBACK, rows.length > 0);
      });
    }, function () {
      // กันเหนียว (ปกติมาไม่ถึง เพราะดักพังรายตัวไว้แล้ว)
      if (cached) render(cached.rows, cached.fx, false, cached.ts);
      busy = false;
    });
    function done(rows, fx, live) {
      if (rows.length) { saveCache(rows, fx); render(rows, fx, live, Date.now()); busy = false; return; }
      if (cached) { render(cached.rows, cached.fx, false, cached.ts); busy = false; return; }
      // สดพัง+ไม่มีแคช: ใช้สแนปช็อตอ้างอิงเท่าที่มี (mark ไม่สด)
      var snapRows = [], si;
      for (si = 0; si < LIST.length; si++) {
        var sn = SNAP[LIST[si].sym];
        if (sn) snapRows.push({ sym: LIST[si].sym, price: sn.price, prev: sn.prev, chg: sn.chg, pct: sn.pct, live: false });
      }
      if (snapRows.length) render(snapRows, fx, false, null);
      else tb.innerHTML = '<tr><td colspan="3" style="text-align:center">ดึงราคาไม่สำเร็จ — ลองกดรีเฟรช</td></tr>';
      busy = false;
    }
  }
  function init() {
    if (!$('shieldBody')) return; // หน้านี้ไม่มี section กันตาย
    var btn = $('shieldRefresh');
    if (btn) btn.addEventListener('click', function () { refresh(true); });
    refresh(false);
    window.ET1SHIELD = { refresh: function () { refresh(true); }, count: function () { return LIST.length; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
