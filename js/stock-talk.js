/* ===== STOCK TALK — คุยเรื่องหุ้น US + คริปโต (realtime) =====
 * แหล่งข้อมูลสด (ยิงตรงจากเบราว์เซอร์, ไม่ต้องใช้ key):
 * - หุ้น US : TradingView Scanner (CORS ผ่าน)
 * - คริปโต  : CoinGecko (หลัก) / Binance (สำรอง)
 * - ค่าเงิน  : open.er-api.com (USD→THB)
 * - แคช 5 นาที + fallback ออฟไลน์
 * - พอร์ตเก็บใน localStorage แก้ไขได้
 * - แชทบอท rule-based ตอบภาษาไทย (ไม่ใช่คำแนะนำการลงทุน)
 */
(function () {
  'use strict';

  var WATCH = [
    { sym: 'QQQI', name: 'QQQI ETF',    tv: 'NASDAQ:QQQI', bucket: 'income', desc: 'ETF Nasdaq100 ปันผลรายเดือน — เสาหลักสาย Income' },
    { sym: 'AMD',  name: 'AMD',       tv: 'NASDAQ:AMD',  bucket: 'growth', desc: 'คู่แข่ง NVDA สายชิป — เบต้าสูงกว่า' },
    { sym: 'MU',   name: 'Micron',    tv: 'NASDAQ:MU',   bucket: 'growth', desc: 'ชิปหน่วยความจำ — วัฏจักรแรง ขึ้นลงโหด' },
    { sym: 'DELL', name: 'Dell',      tv: 'NYSE:DELL',    bucket: 'growth', desc: 'เซิร์ฟเวอร์ AI + PC — ได้อานิสงส์ AI infra' },
    { sym: 'MRVL', name: 'Marvell',   tv: 'NASDAQ:MRVL',  bucket: 'growth', desc: 'ชิป data center + custom AI' },
    { sym: 'NVDA', name: 'NVIDIA',    tv: 'NASDAQ:NVDA',  bucket: 'aicore', desc: 'ชิป AI เบอร์ 1 ของโลก — หัวใจพอร์ตสาย AI' },
    { sym: 'GOOGL', name: 'Alphabet', tv: 'NASDAQ:GOOGL', bucket: 'aicore', desc: 'โฆษณา + Cloud + AI — ครบเครื่อง' },
    { sym: 'ASML', name: 'ASML',      tv: 'NASDAQ:ASML',  bucket: 'aicore', desc: 'เครื่อง lithography เจ้าเดียวในโลก — คอขวดชิป' },
    { sym: 'AMAT', name: 'Applied Materials', tv: 'NASDAQ:AMAT', bucket: 'aicore', desc: 'เครื่องจักรผลิตชิป' },
    { sym: 'VRT',  name: 'Vertiv',    tv: 'NYSE:VRT',     bucket: 'aicore', desc: 'ระบบไฟ + ระบายความร้อน data center' },
    { sym: 'TSM',  name: 'TSMC',      tv: 'NYSE:TSM',     bucket: 'aicore', desc: 'โรงงานผลิตชิปรายใหญ่สุดของโลก' },
    { sym: 'AAPL', name: 'Apple',     tv: 'NASDAQ:AAPL', desc: 'มั่นคง ปันผลสม่ำเสมอ — หลุมหลบภัยของพอร์ต' },
    { sym: 'TSLA', name: 'Tesla',     tv: 'NASDAQ:TSLA', desc: 'ผันผวนสูง ขึ้นลงแรง — สายซิ่งต้องเผื่อใจ' },
    { sym: 'MSFT', name: 'Microsoft', tv: 'NASDAQ:MSFT', desc: 'Azure + AI + ปันผล — เสาหลักสายเทค' },
    { sym: 'AMZN', name: 'Amazon',    tv: 'NASDAQ:AMZN', desc: 'AWS + ค้าปลีก — โตเงียบแต่ชัวร์' },
    { sym: 'META', name: 'Meta',      tv: 'NASDAQ:META', desc: 'โฆษณา + AI — กำไรโหด ราคาเหวี่ยงตามงบ' },
    { sym: 'AVGO', name: 'Broadcom',  tv: 'NASDAQ:AVGO', desc: 'ชิป + ซอฟต์แวร์ ปันผลดี — ขวัญใจสาย DCA' },
    { sym: 'BTC',  name: 'Bitcoin',   crypto: true, cg: 'bitcoin',  bn: 'BTCUSDT',  desc: 'ทองดิจิทัล — ผันผวนโหด แบ่งไม้เล็กๆ พอ' },
    { sym: 'ETH',  name: 'Ethereum',  crypto: true, cg: 'ethereum', bn: 'ETHUSDT',  desc: 'แพลตฟอร์ม smart contract — เหวี่ยงตาม BTC' }
  ];
  var CACHE_KEY = 'aom-stock-cache-v1';
  var HOLD_KEY = 'aom-stock-hold-v1';
  var CACHE_MS = 5 * 60 * 1000;
  var FETCH_TIMEOUT = 12000;
  var FALLBACK_FX = 33.61;
  // ราคาอ้างอิง 7-8 ต.ค. 2026 (ใช้เฉพาะตอนออฟไลน์สนิท)
  var FALLBACK = { QQQI: 56.60, AMD: 646.91, MU: 1086.16, DELL: 580.76, MRVL: 282.01, NVDA: 237.34, GOOGL: 347.89, ASML: 1802.69, AMAT: 519.46, VRT: 243.88, TSM: 473.28, AAPL: 335.98, TSLA: 377.17, MSFT: 528.67, AMZN: 259.24, META: 724.67, AVGO: 373.70, BTC: 83218, ETH: 2560 };

  var state = { prices: {}, fx: FALLBACK_FX, fxLive: false, ts: null, stale: true, loading: false, src: { stock: null, crypto: null, fx: null } };

  var ALIAS = [
    [/nvidia|เอ็นวี|nvda/, 'NVDA'], [/apple|แอปเปิ้ล|aapl/, 'AAPL'],
    [/tesla|เทสลา|tsla/, 'TSLA'], [/microsoft|ไมโครซอฟ|msft/, 'MSFT'],
    [/amazon|อเมซอน|amzn/, 'AMZN'], [/meta|เฟส|facebook|เฟซ/, 'META'],
    [/broadcom|avgo/, 'AVGO'], [/amd/, 'AMD'],
    [/bitcoin|บิตคอย|บิทคอย|btc/, 'BTC'], [/ethereum|อีเธอ|eth/, 'ETH'],
    [/qqqi/, 'QQQI'], [/\bmu\b|micron|ไมครอน/, 'MU'], [/dell|เดล/, 'DELL'],
    [/mrvl|marvell/, 'MRVL'], [/googl|google|alphabet|กูเกิล/, 'GOOGL'],
    [/asml/, 'ASML'], [/amat/, 'AMAT'],
    [/\bvrt\b|vertiv/, 'VRT'], [/\btsm\b|tsmc|ไต้หวันเซมิ/, 'TSM']
  ];

  function $(id) { return document.getElementById(id); }
  function fmtN(n, d) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('th-TH', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  }
  function fmtInt(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(Number(n)).toLocaleString('th-TH');
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  // num(): แปลงเป็นตัวเลข ถ้า null/undefined/0/NaN คืน null (กัน isFinite(null)===true หลอก)
  function num(v) { v = +v; return (isFinite(v) && v > 0) ? v : null; }
  function numS(v) { v = +v; return isFinite(v) ? v : null; }

  /* ---------- ราคาสด: หลายแหล่ง (ยิงตรงจากเบราว์เซอร์) ---------- */
  function getJSON(url, ms) {
    var ctrl = null, timer = null;
    try {
      if (typeof AbortController !== 'undefined') {
        ctrl = new AbortController();
        timer = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, ms || FETCH_TIMEOUT);
      }
    } catch (e) { ctrl = null; }
    var p = fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    });
    if (timer) p = p.then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
    return p;
  }
  // หุ้น US — TradingView Scanner (เรียลไทม์, ไม่ต้องใช้ key)
  function fetchStocksTV() {
    var stocks = WATCH.filter(function (w) { return !w.crypto; });
    var jobs = stocks.map(function (w) {
      var url = 'https://scanner.tradingview.com/symbol?symbol=' + encodeURIComponent(w.tv) +
        '&fields=close,change,open,high,low,volume,previous_close';
      return getJSON(url).then(function (d) {
        var price = num(d.close);
        if (price == null) throw new Error('bad tv ' + w.sym);
        var pct = numS(d.change) || 0;
        var prevRaw = num(d.previous_close);
        var prev = prevRaw != null ? prevRaw : (pct ? price / (1 + pct / 100) : price);
        return {
          sym: w.sym, price: price, prev: prev, chg: price - prev, pct: pct,
          open: num(d.open), high: num(d.high),
          low: num(d.low), vol: num(d.volume),
          live: true, src: 'TradingView'
        };
      });
    });
    return Promise.all(jobs.map(function (p) {
      return p.then(function (v) { return { ok: true, v: v }; }, function () { return { ok: false }; });
    })).then(function (rs) {
      var out = [];
      rs.forEach(function (r) { if (r.ok) out.push(r.v); });
      if (!out.length) throw new Error('all tv failed');
      return out; // สดเฉพาะตัวที่รอด ตัวที่พังไปเติมแคชทีหลัง
    });
  }
  // คริปโต — CoinGecko (หลัก)
  function fetchCryptoCG() {
    var ids = WATCH.filter(function (w) { return w.crypto; }).map(function (w) { return w.cg; }).join(',');
    var url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids +
      '&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true';
    return getJSON(url).then(function (d) {
      return WATCH.filter(function (w) { return w.crypto; }).map(function (w) {
        var c = d[w.cg];
        var price = c ? num(c.usd) : null;
        if (price == null) throw new Error('bad cg ' + w.sym);
        var pct = numS(c.usd_24h_change) || 0;
        var prev = pct ? price / (1 + pct / 100) : price;
        return { sym: w.sym, price: price, prev: prev, chg: price - prev, pct: pct, open: null, high: null, low: null, vol: null, live: true, src: 'CoinGecko' };
      });
    });
  }
  // คริปโต — Binance (สำรอง)
  function fetchCryptoBN() {
    var syms = WATCH.filter(function (w) { return w.crypto; }).map(function (w) { return '"' + w.bn + '"'; }).join(',');
    return getJSON('https://api.binance.com/api/v3/ticker/24hr?symbols=[' + syms + ']').then(function (arr) {
      var by = {};
      (arr || []).forEach(function (t) { by[t.symbol] = t; });
      return WATCH.filter(function (w) { return w.crypto; }).map(function (w) {
        var t = by[w.bn];
        var price = t ? num(t.lastPrice) : null;
        if (price == null) throw new Error('bad bn ' + w.sym);
        var pct = numS(t.priceChangePercent) || 0;
        var chg = numS(t.priceChange);
        chg = chg == null ? (pct ? price - price / (1 + pct / 100) : 0) : chg;
        return {
          sym: w.sym, price: price, prev: price - chg, chg: chg, pct: pct,
          open: num(t.openPrice), high: num(t.highPrice),
          low: num(t.lowPrice), vol: num(t.volume), live: true, src: 'Binance'
        };
      });
    });
  }
  // ค่าเงิน USD→THB
  function fetchFX() {
    return getJSON('https://open.er-api.com/v6/latest/USD').then(function (d) {
      var thb = d && d.rates ? num(d.rates.THB) : null;
      if (thb == null) throw new Error('bad fx');
      return thb;
    });
  }
  function saveCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: state.ts, prices: state.prices, fx: state.fx, fxLive: state.fxLive, stale: state.stale, src: state.src })); } catch (e) {}
  }
  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function applyQuote(q) { state.prices[q.sym] = q; }
  function applyFallbackAll() {
    WATCH.forEach(function (w) {
      state.prices[w.sym] = {
        sym: w.sym, price: FALLBACK[w.sym], prev: FALLBACK[w.sym], chg: 0, pct: 0,
        open: null, high: null, low: null, vol: null, live: false, src: 'อ้างอิง'
      };
    });
    state.src.stock = null; state.src.crypto = null;
  }
  function refreshPrices(force) {
    if (state.loading) return Promise.resolve();
    var cached = loadCache();
    if (!force && cached && cached.ts && (Date.now() - cached.ts < CACHE_MS) && cached.prices && cached.prices.NVDA) {
      state.prices = cached.prices; state.fx = cached.fx || FALLBACK_FX; state.fxLive = !!cached.fxLive;
      state.ts = cached.ts; state.stale = !!cached.stale; state.src = cached.src || { stock: null, crypto: null, fx: null };
      renderAll();
      return Promise.resolve();
    }
    state.loading = true;
    renderUpdated('กำลังดึงราคาสด…');
    var stockP = fetchStocksTV();
    var cryptoP = fetchCryptoCG().catch(function () { return fetchCryptoBN(); });
    var fxP = fetchFX();
    return Promise.all([stockP, cryptoP, fxP].map(function (p) {
      return p.then(function (v) { return { ok: true, v: v }; }, function (e) { return { ok: false, e: e }; });
    })).then(function (rs) {
      var anyLive = false;
      state.prices = {};
      state.src = { stock: null, crypto: null, fx: null };
      function fillMissing(list, group) {
        list.forEach(function (w) {
          if (state.prices[w.sym]) return;
          var old = cached && cached.prices ? cached.prices[w.sym] : null;
          state.prices[w.sym] = old && isFinite(old.price)
            ? Object.assign({}, old, { live: false })
            : { sym: w.sym, price: FALLBACK[w.sym], prev: FALLBACK[w.sym], chg: 0, pct: 0, open: null, high: null, low: null, vol: null, live: false, src: 'อ้างอิง' };
        });
        var liveOne = list.map(function (w) { return state.prices[w.sym]; }).filter(function (p) { return p.live; })[0];
        if (liveOne) { state.src[group] = liveOne.src; anyLive = true; }
      }
      if (rs[0].ok) rs[0].v.forEach(applyQuote);
      fillMissing(WATCH.filter(function (w) { return !w.crypto; }), 'stock');
      if (rs[1].ok && rs[1].v.length) rs[1].v.forEach(applyQuote);
      fillMissing(WATCH.filter(function (w) { return w.crypto; }), 'crypto');
      if (rs[2].ok) {
        state.fx = rs[2].v; state.fxLive = true; state.src.fx = 'ER-API';
      } else {
        state.fx = (cached && isFinite(cached.fx)) ? cached.fx : FALLBACK_FX;
        state.fxLive = false;
      }
      state.ts = Date.now();
      state.stale = !anyLive;
      saveCache();
      state.loading = false;
      renderAll();
    });
  }

  /* ---------- พอร์ต ---------- */
  function defaultHold() {
    return [
      { sym: 'NVDA', qty: 0.3, avg: 130 },
      { sym: 'AAPL', qty: 0.5, avg: 200 },
      { sym: 'BTC', qty: 0.0001, avg: 100000 }
    ];
  }
  function getHold() {
    try {
      var raw = localStorage.getItem(HOLD_KEY);
      if (raw) { var a = JSON.parse(raw); if (Array.isArray(a)) return a; }
    } catch (e) {}
    return defaultHold();
  }
  function saveHold(a) { try { localStorage.setItem(HOLD_KEY, JSON.stringify(a)); } catch (e) {} }
  function priceOf(sym) { var p = state.prices[sym]; return p ? p.price : FALLBACK[sym]; }
  function holdStats() {
    var hold = getHold(), cost = 0, val = 0;
    var rows = hold.map(function (h) {
      var px = priceOf(h.sym) || 0;
      var v = px * h.qty, c = h.avg * h.qty;
      cost += c; val += v;
      return { sym: h.sym, qty: h.qty, avg: h.avg, px: px, v: v, c: c, pl: v - c, plp: c ? ((v - c) / c) * 100 : 0 };
    });
    return { rows: rows, cost: cost, val: val, pl: val - cost, plp: cost ? ((val - cost) / cost) * 100 : 0 };
  }

  /* ---------- เรนเดอร์ ---------- */
  function chgClass(p) { return p.chg > 0 ? 'stock-up' : (p.chg < 0 ? 'stock-down' : 'stock-flat'); }
  function chgArrow(p) { return p.chg > 0 ? '▲' : (p.chg < 0 ? '▼' : '–'); }
  function fmtVol(v) {
    if (v == null || !isFinite(v)) return '—';
    if (v >= 1e9) return fmtN(v / 1e9) + 'B';
    if (v >= 1e6) return fmtN(v / 1e6) + 'M';
    if (v >= 1e3) return fmtN(v / 1e3) + 'K';
    return fmtInt(v);
  }
  function timeShort(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return '—'; }
  }
  // ตลาด US เปิดไหม? (จ–ศ 9:30–16:00 ET = 21:30–04:00 ไทย)
  function usMarketStatus() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var g = {};
      parts.forEach(function (p) { g[p.type] = p.value; });
      var mins = (+g.hour) * 60 + (+g.minute);
      var weekday = g.weekday;
      var open = weekday !== 'Sat' && weekday !== 'Sun' && mins >= 570 && mins < 960;
      return open ? '🟢 ตลาด US เปิดอยู่' : '🔴 ตลาด US ปิด — ราคาปิดล่าสุด';
    } catch (e) { return ''; }
  }
  function srcTag(p) {
    // ป้ายแหล่งข้อมูลต่อตัว: ● สด / ○ แคช
    if (p && p.live) return '● สด';
    return '○ แคช';
  }
  function watchRow(w) {
    var p = state.prices[w.sym] || {};
    var dec = w.crypto ? (w.sym === 'BTC' ? 0 : 1) : 2;
    var thb = p.price != null ? p.price * state.fx : null;
    var hl = (p.high != null || p.low != null)
      ? '<div class="stock-hl">H ' + fmtN(p.high, dec) + ' · L ' + fmtN(p.low, dec) + (p.vol != null ? ' · V ' + fmtVol(p.vol) : '') + '</div>'
      : (p.live ? '' : '<div class="stock-hl">○ ราคาแคช</div>');
    return '<tr><td><span class="stock-sym">' + w.sym + '<small>' + esc(w.name) + '</small></span></td>' +
      '<td><span class="stock-price">$' + fmtN(p.price, dec) + '</span><div class="stock-hl">≈ ' + fmtInt(thb) + ' ฿</div></td>' +
      '<td><span class="' + chgClass(p) + '">' + chgArrow(p) + ' ' + fmtN(p.chg, dec) + ' (' + fmtN(p.pct) + '%)</span>' + hl + '</td></tr>';
  }
  function renderWatch() {
    var tb = $('watchBody');
    if (!tb) return;
    var groups = [
      { key: 'income', label: '🟢 INCOME · เป้า +10%/ปี' },
      { key: 'growth', label: '🔴 GROWTH · เป้า +45%/1ปี' },
      { key: 'aicore', label: '🔵 AI CORE · เป้า +30%/ปี' },
      { key: null, label: '👀 เฝ้าดู' }
    ];
    var html = '';
    groups.forEach(function (g) {
      var list = WATCH.filter(function (w) { return (w.bucket || null) === g.key; });
      if (!list.length) return;
      html += '<tr class="wgroup"><td colspan="3">' + esc(g.label) + '</td></tr>';
      list.forEach(function (w) { html += watchRow(w); });
    });
    tb.innerHTML = html;
  }
  /* ---------- แผนหลัก: ราคาสดของหุ้นในแผน ---------- */
  var PLAN = [
    { key: 'income', dot: '#3DFF88', name: 'Income', holds: ['QQQI'] },
    { key: 'growth', dot: '#FF4D5E', name: 'Growth', holds: ['AMD', 'MU', 'DELL', 'MRVL'] },
    { key: 'aicore', dot: '#4DA6FF', name: 'AI Core', holds: ['NVDA', 'GOOGL', 'ASML', 'AMAT', 'VRT', 'TSM'] }
  ];
  function renderPlan() {
    var el = $('planLive');
    if (!el) return;
    el.innerHTML = PLAN.map(function (b) {
      var pills = b.holds.map(function (s) {
        var p = state.prices[s] || {};
        return '<span class="plan-pill' + (p.live ? '' : ' stale') + '"><b>' + s + '</b> $' + fmtN(p.price, 2) +
          ' <span class="' + chgClass(p) + '">' + (p.pct >= 0 ? '+' : '') + fmtN(p.pct) + '%</span></span>';
      }).join('');
      return '<div class="plan-line"><span class="plan-dot" style="background:' + b.dot + '"></span><b>' + b.name + '</b>' + pills + '</div>';
    }).join('');
  }
  function renderFx() {
    document.querySelectorAll('.fx-badge').forEach(function (el) {
      el.textContent = '$1 ≈ ' + fmtN(state.fx) + ' ฿';
    });
  }
  function renderUpdated(msg) {
    var el = $('stockUpdated');
    if (!el) return;
    if (msg) { el.textContent = msg; return; }
    var bits = [];
    if (state.src.stock) bits.push('หุ้น ' + state.src.stock + ' ●');
    else bits.push('หุ้น ○แคช');
    if (state.src.crypto) bits.push('คริปโต ' + state.src.crypto + ' ●');
    else bits.push('คริปโต ○แคช');
    bits.push('ค่าเงิน ' + (state.fxLive ? '$1 ≈ ' + fmtN(state.fx) + ' ฿ ●' : '$1 ≈ ' + fmtN(state.fx) + ' ฿ ○'));
    var head = state.stale ? '⚠ ออฟไลน์ ใช้ราคาแคช · ' : '● ราคาสด · ';
    el.innerHTML = head + bits.join(' · ') + ' · <b>' + esc(timeShort(state.ts)) + '</b><br>' + esc(usMarketStatus());
  }
  function renderPf() {
    var tb = $('pfBody');
    if (!tb) return;
    var st = holdStats();
    tb.innerHTML = st.rows.map(function (r, i) {
      var step = (r.sym === 'BTC' || r.sym === 'ETH') ? '0.0001' : '0.01';
      var cls = r.pl > 0 ? 'stock-up' : (r.pl < 0 ? 'stock-down' : 'stock-flat');
      return '<tr><td><span class="stock-sym">' + esc(r.sym) + '</span><div class="stock-hl">$' + fmtN(r.px, 2) + '</div></td>' +
        '<td><input class="pf-input qty" data-i="' + i + '" data-f="qty" type="number" step="' + step + '" min="0" value="' + r.qty + '"></td>' +
        '<td><input class="pf-input" data-i="' + i + '" data-f="avg" type="number" step="0.01" min="0" value="' + r.avg + '"></td>' +
        '<td>$' + fmtN(r.v) + '<div class="stock-hl">' + fmtInt(r.v * state.fx) + ' ฿</div></td>' +
        '<td><span class="' + cls + '">' + (r.pl >= 0 ? '+' : '') + fmtN(r.pl) + ' (' + fmtN(r.plp) + '%)</span><br><button class="pf-del" data-del="' + i + '">ลบ</button></td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--ink-faint)">ยังไม่มีหุ้น — กดเพิ่มด้านล่างได้เลย</td></tr>';
    var t = $('pfTotal');
    if (t) {
      var cls = st.pl > 0 ? 'stock-up' : (st.pl < 0 ? 'stock-down' : 'stock-flat');
      t.innerHTML = '<span>มูลค่าพอร์ต ≈ <b>$' + fmtN(st.val) + ' · ' + fmtInt(st.val * state.fx) + ' ฿</b></span>' +
        '<span class="' + cls + '">P/L ' + (st.pl >= 0 ? '+' : '') + fmtN(st.pl) + '$ (' + fmtN(st.plp) + '%)</span>';
    }
    // ผูก event
    tb.querySelectorAll('input.pf-input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var hold = getHold();
        var i = +inp.getAttribute('data-i'), f = inp.getAttribute('data-f');
        var v = parseFloat(inp.value);
        if (!isFinite(v) || v < 0) v = 0;
        if (hold[i]) { hold[i][f] = v; saveHold(hold); renderPf(); }
      });
    });
    tb.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var hold = getHold();
        hold.splice(+btn.getAttribute('data-del'), 1);
        saveHold(hold); renderPf();
      });
    });
  }
  function renderPfSelect() {
    var sel = $('pfSym');
    if (!sel || sel.options.length) return;
    var hold = getHold().map(function (h) { return h.sym; });
    WATCH.forEach(function (w) {
      if (hold.indexOf(w.sym) >= 0) return;
      var o = document.createElement('option');
      o.value = w.sym; o.textContent = w.sym + ' · ' + w.name;
      sel.appendChild(o);
    });
  }
  function renderAll() { renderWatch(); renderFx(); renderUpdated(); renderPf(); renderPlan(); }

  /* ---------- แชทบอท ---------- */
  function findSyms(text) {
    var t = ' ' + String(text).toLowerCase() + ' ';
    var found = [];
    ALIAS.forEach(function (a) { if (a[0].test(t) && found.indexOf(a[1]) < 0) found.push(a[1]); });
    return found;
  }
  function priceLine(sym, full) {
    var w = WATCH.filter(function (x) { return x.sym === sym; })[0];
    if (!w) return '';
    var p = state.prices[sym];
    var price = p && p.price != null ? p.price : FALLBACK[sym];
    var chg = p ? p.chg : 0, pct = p ? p.pct : 0;
    var dec = w.crypto ? (sym === 'BTC' ? 0 : 1) : 2;
    var cls = chgClass({ chg: chg });
    var tag = srcTag(p) + (p && p.src ? ' ' + p.src : '');
    var s = '<div style="margin:4px 0"><b>' + sym + '</b> ' + esc(w.name) + ' — <b>$' + fmtN(price, dec) + '</b>' +
      ' (≈ ' + fmtInt(price * state.fx) + ' ฿) ' +
      '<span class="' + cls + '">' + chgArrow({ chg: chg }) + ' ' + fmtN(chg, dec) + ' (' + (pct >= 0 ? '+' : '') + fmtN(pct) + '%)</span>' +
      '<br><span style="opacity:.75;font-size:12px">' + esc(tag) + ' · ' + esc(timeShort(state.ts)) + (w.crypto ? ' · 24 ชม.' : ' · เทียบปิดก่อนหน้า') + '</span>';
    if (full !== false && p && (p.high != null || p.vol != null)) {
      s += '<br><span style="opacity:.75;font-size:12px">วันนี้ H $' + fmtN(p.high, dec) + ' · L $' + fmtN(p.low, dec) +
        (p.vol != null ? ' · วอลุ่ม ' + fmtVol(p.vol) : '') + '</span>';
    }
    s += '<br><span style="opacity:.75;font-size:12px">' + esc(w.desc) + '</span></div>';
    return s;
  }
  function pfSummaryHTML() {
    var st = holdStats();
    if (!st.rows.length) return 'พอร์ตว่างเปล่า — เพิ่มหุ้นจากตารางพอร์ตก่อน แล้วถามออมใหม่ได้เลย';
    var lines = st.rows.map(function (r) {
      return '<span class="pill">' + esc(r.sym) + ' ×' + r.qty + '</span> $' + fmtN(r.v) + ' (' + (r.pl >= 0 ? '+' : '') + fmtN(r.plp) + '%)';
    }).join('<br>');
    var verdict = st.plp > 10 ? 'ฟอร์มสวย — พิจารณาแบ่งขายทำกำไรบางส่วนแล้วถือเงินสดบ้างก็ได้' :
      st.plp > 0 ? 'เขียวอ่อนๆ — ถือต่อได้ ถ้ายังเชื่อในพื้นฐาน' :
      st.plp > -10 ? 'แดงนิดหน่อย — ปกติของตลาด อย่าเพิ่งแพนิก ถ้าเงินนี้เย็นพอ' :
      'แดงเข้ม — ทบทวนพื้นฐาน ถ้า thesis พังให้คัท ถ้าแค่ตลาดเหวี่ยงให้ DCA อย่างมีวินัย';
    return 'พอร์ตตอนนี้มูลค่า <b>$' + fmtN(st.val) + ' (≈ ' + fmtInt(st.val * state.fx) + ' ฿)</b> ทุน $' + fmtN(st.cost) +
      ' P/L <b>' + (st.pl >= 0 ? '+' : '') + fmtN(st.pl) + '$ (' + fmtN(st.plp) + '%)</b><br>' + lines + '<br>มุมมองออม: ' + verdict;
  }
  function freshTag() {
    var liveBits = [];
    if (state.src.stock) liveBits.push(state.src.stock);
    if (state.src.crypto) liveBits.push(state.src.crypto);
    var base = liveBits.length
      ? '● สดจาก ' + liveBits.join(' + ') + ' · ' + timeShort(state.ts)
      : '○ แคชล่าสุด ' + timeShort(state.ts) + ' — กด ↻ รีเฟรชลองใหม่';
    return '<br><span style="opacity:.7;font-size:11.5px">' + esc(base) + ' · ไม่ใช่คำแนะนำการลงทุน</span>';
  }
  function compareHTML(a, b) {
    var pa = state.prices[a] || {}, pb = state.prices[b] || {};
    var wa = WATCH.filter(function (x) { return x.sym === a; })[0];
    var wb = WATCH.filter(function (x) { return x.sym === b; })[0];
    function row(sym, w, p) {
      var dec = w.crypto ? (sym === 'BTC' ? 0 : 1) : 2;
      return '<span class="pill">' + sym + '</span> $' + fmtN(p.price, dec) +
        ' <span class="' + chgClass(p) + '">' + (p.pct >= 0 ? '+' : '') + fmtN(p.pct) + '%</span>';
    }
    var win = (pa.pct || 0) >= (pb.pct || 0) ? a : b;
    return row(a, wa, pa) + '<br>' + row(b, wb, pb) +
      '<br>วันนี้ <b>' + win + '</b> วิ่งกว่า — แต่เลือกจากพื้นฐาน + สไตล์ตัวเองนะ ไม่ใช่จากวันเดียว';
  }
  function topMoversHTML() {
    var arr = WATCH.map(function (w) { return { sym: w.sym, pct: (state.prices[w.sym] || {}).pct || 0 }; });
    arr.sort(function (a, b) { return b.pct - a.pct; });
    return arr.slice(0, 3).map(function (m) { return '<span class="pill">' + m.sym + ' ' + (m.pct >= 0 ? '+' : '') + fmtN(m.pct) + '%</span>'; }).join(' ');
  }
  function botReply(q) {
    var t = String(q || '').toLowerCase().trim();
    var syms = findSyms(t);
    var has = function () { for (var i = 0; i < arguments.length; i++) if (t.indexOf(arguments[i]) >= 0) return true; return false; };

    if (!t) return 'พิมพ์ชื่อหุ้นมาได้เลย เช่น <b>NVDA</b> <b>AAPL</b> <b>BTC</b> หรือถามว่า <b>พอร์ตฉันเป็นไง</b>';
    if (has('สวัสดี', 'hello', 'hi', 'ดีครับ', 'ดีคับ') && t.length < 20) return 'สวัสดี! ออมเอง 👋 ถามราคาหุ้น US/คริปโตได้เลย เช่น <b>NVDA เท่าไหร่</b> หรือ <b>พอร์ตฉันเป็นไง</b> — ตอนนี้ตัววิ่งแรง ' + topMoversHTML();
    if (has('ทำอะไรได้', 'ช่วยอะไร', 'help', 'คำสั่ง', 'ใช้ยังไง'))
      return 'ออมช่วยได้ 4 อย่าง:<br>1) <b>ราคา</b> — พิมพ์ชื่อหุ้น เช่น NVDA / MU / TSM / BTC<br>2) <b>พอร์ต</b> — พิมพ์ "พอร์ตฉันเป็นไง"<br>3) <b>ความรู้</b> — DCA / P/E / ETF / DIME คืออะไร<br>4) <b>ภาพรวม</b> — พิมพ์ "ตัวไหนวิ่งแรง"';
    if (has('พอร์ต', 'พอร', 'dime', 'ของฉัน', 'ถืออยู่', 'กำไร', 'ขาดทุน', 'รวม')) return pfSummaryHTML() + freshTag();
    if (has('ตลาดเปิด', 'ตลาดปิด', 'เปิดตลาด', 'market open', 'ตลาดหุ้นเปิด'))
      return usMarketStatus() + ' (เวลาไทย ตลาด US เปิด จ–ศ 21:30–04:00)' + freshTag();
    if (syms.length >= 2 && has('vs', 'เทียบ', 'เปรียบ', 'หรือ', 'ดีกว่า', 'เลือก'))
      return compareHTML(syms[0], syms[1]) + freshTag();
    if (has('วิ่งแรง', 'ขึ้นเยอะ', 'ลงเยอะ', 'ทั้งหมด', 'มีตัวไหน', 'watch', 'แนะนำ', 'น่าซื้อ', 'ตัวไหนดี')) {
      var hot = WATCH.slice().sort(function (a, b) {
        return Math.abs((state.prices[b.sym] || {}).pct || 0) - Math.abs((state.prices[a.sym] || {}).pct || 0);
      }).slice(0, 5);
      return 'กระดานวันนี้ ' + topMoversHTML() + '<br>' + hot.map(function (w) { return priceLine(w.sym); }).join('') +
        '<br>สไตล์ออม: แผนหลักคือ <b>Income/Growth/AI Core อย่างละ 100K</b> — เงินเย็นเท่านั้นนะ' + freshTag();
    }
    if (has('dca')) return '<b>DCA</b> = ซื้อเท่าๆ กันทุกเดือน ไม่สนราคา เช่น เดือนละ 2,000฿ ลง NVDA — ข้อดีคือได้ราคาเฉลี่ย ไม่ต้องจับจังหวะ เหมาะกับมนุษย์เงินเดือนและคนใจร้อน (แบบออม 😄) เริ่มใน DIME ได้ด้วยเศษหุ้น';
    if (has('p/e', 'p e', 'พีอี', 'pe ratio')) return '<b>P/E</b> = ราคา ÷ กำไรต่อหุ้น — ยิ่งต่ำยิ่ง "ถูก" เทียบกับกำไร แต่หุ้นโตเร็ว (NVDA/META) P/E สูงเป็นปกติ อย่าดูเลขเดียว ให้เทียบกับค่าเฉลี่ยตัวเอง + คู่แข่ง + การเติบโต';
    if (has('etf')) return '<b>ETF</b> = ตะกร้าหุ้น ซื้อตัวเดียวได้หลายบริษัท เช่น <b>VOO</b> (S&P500) <b>QQQ</b> (Nasdaq100) — เหมาะกับคนไม่อยากเลือกหุ้นรายตัว ความผันผวนต่ำกว่าหุ้นเดี่ยว ซื้อใน DIME ได้เหมือนหุ้นเลย';
    if (has('dime', 'เฟรค', 'เศษหุ้น', 'fractional', 'เปิดบัญชี')) return '<b>DIME</b> = แอปซื้อหุ้น US/ไทยเป็นเศษหุ้นได้ เริ่มหลักร้อย — วิธีเริ่ม: เปิดบัญชี → ยืนยันตัวตน → แลก USD → ตั้ง DCA อัตโนมัติ → อย่า all-in วันเดียว แบ่ง 3–4 ไม้';
    if (has('ดอลลาร์', 'ค่าเงิน', 'usd', 'แลกเงิน', 'เรท')) return 'ตอนนี้ <b>$1 ≈ ' + fmtN(state.fx) + ' ฿</b> — บาทอ่อน = ซื้อหุ้น US แพงขึ้นนิดหน่อย แต่ถ้า DCA ยาวๆ ไม่ต้องซีเรียสจังหวะค่าเงินมาก';
    if (has('บิตคอย', 'bitcoin', 'btc', 'คริปโต', 'halving') && syms.length === 0) syms = ['BTC'];
    if (has('เสี่ยง', 'คัท', 'stop', 'ขาดทุนทำไง', 'ดอย')) return 'กฎเหล็กออม: 1) <b>เงินเย็นเท่านั้น</b> 2) ไม่เกิน 5–10% ต่อตัวสำหรับหุ้นซิ่ง/คริปโต 3) ตั้งจุดคัทก่อนซื้อ (เช่น -15%) 4) แดงแล้วอย่าถัวมั่ว — ถามตัวเองว่า "ถ้าไม่มีของ จะซื้อตรงนี้ไหม" ถ้าตอบไม่ ก็อย่าถัว';
    if (syms.length) {
      var extra = '';
      if (has('ซื้อดี', 'เข้าได้', 'ควรซื้อ', 'อนาคต')) extra = '<br>มุมมองออม: ดูกราฟ + งบก่อนนะ ถ้าเชื่อยาวให้<b>แบ่ง 3 ไม้</b> อย่าหมดแม็กไม้เดียว — นี่ไม่ใช่คำแนะนำการลงทุนน้า ⚠';
      if (has('งบ', 'กำไร', 'รายได้', 'พื้นฐาน')) extra = '<br>งบสดๆ ออมดึงให้ไม่ได้เต็มๆ นะ แนะนำเช็ค earning date + รายได้ YoY ในแอป DIME ก่อนตัดสินใจ';
      return syms.map(function (s) { return priceLine(s); }).join('') + extra + freshTag();
    }
    if (has('ออม', 'ใคร', 'เจ้าของเว็บ')) return 'ออมสิน (et1cruel) — โปรดิวเซอร์สายเมฆที่หันมาเอาดีด้านโค้ด + AI + เก็บเงินล้าน ตอนนี้ DCA หุ้น US ผ่าน DIME อยู่ คุยหุ้นกันได้ทุกวัน!';
    if (has('ขอบคุณ', 'thank')) return 'ยินดีเสมอ! มาอัพเดทพอร์ตกันบ่อยๆ นะ — วินัยชนะดวงเสมอ 🍀';
    // default: ช่วยเดา + เสนอภาพรวม
    return 'ออมไม่แน่ใจ ลองถามแบบนี้ดู:<br>• <b>MU เท่าไหร่</b><br>• <b>BTC เป็นไง</b><br>• <b>NVDA vs AMD</b><br>• <b>พอร์ตฉันเป็นไง</b><br>วันนี้ตัววิ่ง ' + topMoversHTML();
  }

  /* ---------- ผูก UI แชท (ใช้ร่วมกัน 2 กล่อง) ---------- */
  function scrollDown(box) { box.scrollTop = box.scrollHeight; }
  function pushMsg(box, who, html) {
    var d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = html;
    box.appendChild(d);
    scrollDown(box);
    return d;
  }
  function ask(box, q) {
    pushMsg(box, 'me', esc(q));
    var typing = pushMsg(box, 'bot', 'ออมกำลังดูกราฟ… ●●●');
    setTimeout(function () {
      typing.innerHTML = botReply(q);
      scrollDown(box);
    }, 450);
  }
  function bindChat(prefix) {
    var msgs = $(prefix + 'Msgs'), form = $(prefix + 'Form'), input = $(prefix + 'Input');
    if (!msgs || !form || !input) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      ask(msgs, v);
    });
    var chips = document.querySelectorAll('[data-' + prefix + 'chip]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () { ask(msgs, c.getAttribute('data-' + prefix.toLowerCase() + 'chip') || c.textContent.trim()); });
    });
    if (!msgs.children.length) {
      pushMsg(msgs, 'bot', 'สวัสดี! ออมเอง 👋 ถามได้เลย เช่น <b>NVDA เท่าไหร่</b> / <b>BTC เป็นไง</b> / <b>พอร์ตฉันเป็นไง</b> / <b>DCA คืออะไร</b>');
    }
  }

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderPfSelect();
    renderAll();
    bindChat('chat');
    bindChat('pop');
    // tab สลับ แชท/ตลาด/พอร์ต
    document.querySelectorAll('#stocks .os-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#stocks .os-tab').forEach(function (b) { b.classList.remove('on'); });
        document.querySelectorAll('#stocks .os-pane').forEach(function (p) { p.classList.remove('on'); });
        btn.classList.add('on');
        var pane = document.getElementById(btn.getAttribute('data-tab'));
        if (pane) pane.classList.add('on');
      });
    });
    refreshPrices(false);

    var rb = $('refreshBtn');
    if (rb) rb.addEventListener('click', function () { refreshPrices(true); });
    var add = $('pfAdd');
    if (add) add.addEventListener('click', function () {
      var sel = $('pfSym');
      if (!sel || !sel.value) return;
      var hold = getHold();
      if (hold.some(function (h) { return h.sym === sel.value; })) return;
      var sym = sel.value;
      var qty = (sym === 'BTC' || sym === 'ETH') ? 0.0001 : 0.1;
      hold.push({ sym: sym, qty: qty, avg: priceOf(sym) || 0 });
      saveHold(hold);
      // รีเฟรช select
      sel.innerHTML = '';
      renderPfSelect(); renderPf();
    });

    // ปุ่มลอย + popup
    var fab = $('stockFab'), pop = $('stockPop'), close = $('stockPopClose');
    if (fab && pop) {
      fab.addEventListener('click', function () {
        pop.classList.toggle('open');
        if (pop.classList.contains('open')) {
          var inp = $('popInput');
          if (inp) setTimeout(function () { inp.focus(); }, 150);
        }
      });
      if (close) close.addEventListener('click', function () { pop.classList.remove('open'); });
    }

    // รีเฟรชอัตโนมัติทุก 5 นาที
    setInterval(function () { refreshPrices(false); }, CACHE_MS);
  });

  window.StockTalk = { refresh: function () { return refreshPrices(true); }, ask: botReply };
})();
