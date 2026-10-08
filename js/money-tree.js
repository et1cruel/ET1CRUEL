/* ===== MONEY TREE — ต้นไม้การเงิน เขย่าแล้วเหรียญร่วง + เสียง ===== */
(function () {
  'use strict';
  var fab = document.getElementById('treeFab');
  var pop = document.getElementById('treePop');
  if (!fab || !pop) return;
  var stage = document.getElementById('treeStage');
  var info = document.getElementById('treeInfo');
  var coinsEl = document.getElementById('treeCoins');
  var muteBtn = document.getElementById('treeMute');
  var closeBtn = document.getElementById('treeClose');
  var COIN_KEY = 'et1cruel-tree-coins';
  var MUTE_KEY = 'et1cruel-tree-mute';
  var GOAL = 1000000;

  function loadCoins() { try { return parseInt(localStorage.getItem(COIN_KEY), 10) || 0; } catch (e) { return 0; } }
  function saveCoins(n) { try { localStorage.setItem(COIN_KEY, String(n)); } catch (e) {} }
  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; } }
  var coins = loadCoins();
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var actx = null;
  function ding() {
    if (isMuted()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      [[988, 0], [1319, 0.09]].forEach(function (nt) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'square';
        o.frequency.value = nt[0];
        var t = actx.currentTime + nt[1];
        g.setValueAtTime(0.0001, t);
        g.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(actx.destination);
        o.start(t); o.stop(t + 0.25);
      });
    } catch (e) {}
  }

  function netWorth() {
    try {
      if (window.ET1OS && typeof window.ET1OS.netWorth === 'function') return window.ET1OS.netWorth();
    } catch (e) {}
    return 0;
  }
  function refresh() {
    var nw = netWorth(), pct = GOAL ? (nw / GOAL) : 0;
    var tree = '🌱', label = 'ต้นกล้า — เริ่มปลูก';
    if (pct >= 0.75) { tree = '🌳✨'; label = 'ต้นใหญ่ — ใกล้ 1M แล้ว!'; }
    else if (pct >= 0.5) { tree = '🌳'; label = 'ต้นโต — เกินครึ่งทาง'; }
    else if (pct >= 0.25) { tree = '🌿'; label = 'แตกใบ — กำลังโต'; }
    if (stage) stage.textContent = tree;
    if (info) info.textContent = label + ' · ' + Math.round(pct * 100) + '% สู่ 1M';
    if (coinsEl) coinsEl.textContent = '🪙 เก็บได้ ' + coins.toLocaleString('th-TH');
    if (muteBtn) muteBtn.textContent = isMuted() ? '🔇' : '🔊';
  }

  function spawnCoins(n) {
    if (!pop || reduceMotion) return;
    var area = document.getElementById('treeArea');
    if (!area) return;
    for (var i = 0; i < n; i++) {
      (function (i) {
        var c = document.createElement('span');
        c.className = 'tree-coin';
        c.textContent = ['🪙', '◉', '✦'][i % 3];
        c.style.left = (8 + Math.random() * 80) + '%';
        c.style.animationDelay = (Math.random() * 0.35) + 's';
        c.style.fontSize = (15 + Math.random() * 14) + 'px';
        area.appendChild(c);
        setTimeout(function () { c.remove(); }, 1900);
      })(i);
    }
  }

  function shake() {
    refresh();
    if (!reduceMotion && stage) {
      stage.classList.remove('shake');
      void stage.offsetWidth;
      stage.classList.add('shake');
    }
    var n = 5 + Math.floor(Math.random() * 4);
    spawnCoins(n);
    coins += n;
    saveCoins(coins);
    if (coinsEl) coinsEl.textContent = '🪙 เก็บได้ ' + coins.toLocaleString('th-TH');
    ding();
  }

  fab.addEventListener('click', function () {
    pop.classList.toggle('open');
    if (pop.classList.contains('open')) refresh();
  });
  if (closeBtn) closeBtn.addEventListener('click', function () { pop.classList.remove('open'); });
  if (muteBtn) muteBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    try { localStorage.setItem(MUTE_KEY, isMuted() ? '0' : '1'); } catch (err) {}
    refresh();
  });
  if (stage) {
    stage.addEventListener('click', shake);
    stage.style.cursor = 'pointer';
  }
  refresh();
})();
