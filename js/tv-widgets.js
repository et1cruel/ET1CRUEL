/* ===== TradingView widgets — tape + advanced chart + heatmap (lazy-load) =====
 * แนวเดียวกับ OpenStock (ใช้ TradingView embed ของเขา) — โหลดสคริปต์ก็ต่อเมื่อ
 * section ถูกกางและสก롤มาถึงเท่านั้น ประหยัดเน็ตตอนเปิดหน้า
 * อ้างอิง: https://github.com/Open-Dev-Society/OpenStock (AGPL-3.0)
 */
(function () {
  'use strict';
  var tapeEl = document.getElementById('tvTape');
  var chartEl = document.getElementById('tvChart');
  var heatEl = document.getElementById('tvHeat');
  var btnsEl = document.getElementById('tvBtns');
  if (!tapeEl && !chartEl && !heatEl) return;

  var SYMS = [
    ['NVDA', 'NASDAQ:NVDA'], ['AVGO', 'NASDAQ:AVGO'], ['CRWD', 'NASDAQ:CRWD'],
    ['ASML', 'NASDAQ:ASML'], ['PLTR', 'NASDAQ:PLTR'], ['AMD', 'NASDAQ:AMD'],
    ['MRVL', 'NASDAQ:MRVL'], ['PENG', 'NASDAQ:PENG'], ['LITE', 'NASDAQ:LITE'],
    ['COST', 'NASDAQ:COST'], ['QQQI', 'NASDAQ:QQQI'], ['MU', 'NASDAQ:MU'],
    ['DELL', 'NYSE:DELL'], ['BTC', 'BITSTAMP:BTCUSD']
  ];
  var cur = 'NASDAQ:NVDA';
  var loaded = { tape: false, chart: false, heat: false };

  function tvScript(src, cfg, container) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = src;
    s.textContent = JSON.stringify(cfg);
    container.appendChild(s);
  }
  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function loadTape() {
    if (loaded.tape || !tapeEl) return;
    loaded.tape = true;
    clear(tapeEl);
    var wrap = document.createElement('div');
    wrap.className = 'tradingview-widget-container';
    wrap.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    tapeEl.appendChild(wrap);
    tvScript('https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js', {
      symbols: SYMS.map(function (p) { return { proName: p[1], title: p[0] }; })
        .concat([{ proName: 'AMEX:SPY', title: 'S&P 500' }]),
      showSymbolLogo: true, isTransparent: true, displayMode: 'adaptive',
      colorTheme: 'dark', locale: 'th_TH'
    }, wrap);
  }

  function loadChart(sym) {
    if (!chartEl) return;
    loaded.chart = true;
    cur = sym || cur;
    clear(chartEl);
    var wrap = document.createElement('div');
    wrap.className = 'tradingview-widget-container';
    wrap.style.height = '100%';
    wrap.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%"></div>';
    chartEl.appendChild(wrap);
    tvScript('https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js', {
      autosize: true, symbol: cur, interval: 'D', timezone: 'Asia/Bangkok',
      theme: 'dark', style: '1', locale: 'th_TH', allow_symbol_change: true,
      hide_side_toolbar: false, support_host: 'https://www.tradingview.com'
    }, wrap);
    if (btnsEl) btnsEl.querySelectorAll('.tv-btn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.tv === cur);
    });
  }

  function loadHeat() {
    if (loaded.heat || !heatEl) return;
    loaded.heat = true;
    clear(heatEl);
    var wrap = document.createElement('div');
    wrap.className = 'tradingview-widget-container';
    wrap.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    heatEl.appendChild(wrap);
    tvScript('https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js', {
      dataSource: 'SPX500', blockSize: 'market_cap_weight', blockColor: 'change',
      grouping: 'no_group', locale: 'en', symbolUrl: '', colorTheme: 'dark',
      hasTopBar: true, isDataSetEnabled: true, isZoomEnabled: true,
      hasSymbolTooltip: true, width: '100%', height: 600
    }, wrap);
  }

  // ปุ่มสลับหุ้น
  if (btnsEl) {
    SYMS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tv-btn' + (p[1] === cur ? ' on' : '');
      b.dataset.tv = p[1];
      b.textContent = p[0];
      b.addEventListener('click', function () { loadChart(p[1]); });
      btnsEl.appendChild(b);
    });
  }

  // โหลดเมื่อ section ถูกกาง + เลื่อนมาถึง (ประหยัด + ไม่พังตอน display:none)
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target === tapeEl) { loadTape(); io.unobserve(tapeEl); }
      if (e.target === chartEl) { loadChart(); io.unobserve(chartEl); }
      if (e.target === heatEl) { loadHeat(); io.unobserve(heatEl); }
    });
  }, { rootMargin: '200px' }) : null;

  function observe() {
    [tapeEl, chartEl, heatEl].forEach(function (el) {
      if (!el || el.dataset.tvWatch) return;
      el.dataset.tvWatch = '1';
      if (io) io.observe(el);
      else { loadTape(); loadChart(); loadHeat(); }
    });
  }
  observe();
  // เผื่อ section ยังพับอยู่ตอนโหลด — ลอง observe ซ้ำเมื่อมีการกาง
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.collapse-btn') : null;
    if (b) setTimeout(observe, 350);
  });
  // ปุ่ม nav กดมาก็เหมือนกัน
  document.querySelectorAll('#nav a[href="#charts"]').forEach(function (a) {
    a.addEventListener('click', function () { setTimeout(observe, 600); });
  });
})();
