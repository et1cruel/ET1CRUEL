/* ============================================================
   AMBIENT — เสียงธรรมชาติฟังเพลินๆ (สังเคราะห์ด้วย Web Audio
   ล้วน ไม่โหลดไฟล์เสียงนอกเว็บ): ฝน / คลื่น / ป่า+นก / กลางคืน
   เก็บสถานะใน localStorage · เปิดผสมกันได้ · DOM-ready guard
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'et1cruel-ambient-v1';
  function $(id) { return document.getElementById(id); }
  function load() {
    try {
      var r = localStorage.getItem(KEY);
      if (r) { var o = JSON.parse(r); if (o && typeof o === 'object') return o; }
    } catch (e) {}
    return { on: {}, vol: 60 };
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function toast(msg) {
    var box = $('os-toasts');
    if (!box) return;
    try {
      var t = document.createElement('div');
      t.className = 'os-toast xp';
      t.textContent = msg;
      box.appendChild(t);
      setTimeout(function () { t.style.opacity = '0'; }, 2200);
      setTimeout(function () { t.remove(); }, 2700);
    } catch (e) {}
  }

  var S = load();
  if (typeof S.vol !== 'number' || isNaN(S.vol)) S.vol = 60;
  if (!S.on || typeof S.on !== 'object') S.on = {};
  var NAMES = { rain: 'ฝนตก', waves: 'คลื่น', forest: 'ป่า·นก', night: 'กลางคืน' };

  var AC = null, master = null, noiseBuf = null;
  var live = {}; // name -> {stop:fn}
  function ctx() {
    if (AC) { if (AC.state === 'suspended' && AC.resume) { try { AC.resume(); } catch (e) {} } return AC; }
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    AC = new Ctor();
    master = AC.createGain();
    master.gain.value = (S.vol / 100) * 0.9;
    try { master.connect(AC.destination); } catch (e) {}
    return AC;
  }
  function noise() {
    if (noiseBuf) return noiseBuf;
    var len = AC.sampleRate * 2;
    noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
    var d = noiseBuf.getChannelData(0), i;
    for (i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function applyVol() {
    if (AC && master) {
      try { master.gain.setTargetAtTime((S.vol / 100) * 0.9, AC.currentTime, 0.2); } catch (e) {}
    }
  }
  function mkNoiseSrc() {
    var s = AC.createBufferSource();
    s.buffer = noise();
    s.loop = true;
    return s;
  }
  function fadeIn(g, v) { try { g.gain.setTargetAtTime(v, AC.currentTime, 1.2); } catch (e) {} }
  function fadeOut(g, src, extra) {
    try {
      var t = AC.currentTime;
      g.gain.setTargetAtTime(0, t, 0.4);
      var stops = extra || [];
      stops.push(src);
      var k;
      for (k = 0; k < stops.length; k++) { try { stops[k].stop(t + 1.5); } catch (e2) {} }
    } catch (e) {}
  }

  function startRain() {
    var src = mkNoiseSrc(), lp = AC.createBiquadFilter(), g = AC.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    g.gain.value = 0;
    src.connect(lp); lp.connect(g); g.connect(master);
    try { src.start(); } catch (e) {}
    fadeIn(g, 0.5);
    return { stop: function () { fadeOut(g, src); } };
  }
  function startWaves() {
    var src = mkNoiseSrc(), lp = AC.createBiquadFilter(), wg = AC.createGain();
    var lfo = AC.createOscillator(), lg = AC.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 550;
    wg.gain.value = 0.3;
    lfo.type = 'sine'; lfo.frequency.value = 0.1;
    lg.gain.value = 0.2;
    try { lfo.connect(lg); lg.connect(wg.gain); } catch (e) {}
    src.connect(lp); lp.connect(wg); wg.connect(master);
    try { src.start(); lfo.start(); } catch (e2) {}
    return { stop: function () { fadeOut(wg, src, [lfo]); } };
  }
  function chirp() {
    try {
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      var f = 2600 + Math.random() * 1600;
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.09);
      o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.22);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.4);
    } catch (e) {}
  }
  function startForest() {
    var src = mkNoiseSrc(), bp = AC.createBiquadFilter(), g = AC.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 0.7;
    g.gain.value = 0;
    src.connect(bp); bp.connect(g); g.connect(master);
    try { src.start(); } catch (e) {}
    fadeIn(g, 0.05);
    var timer = setInterval(function () { if (Math.random() < 0.7) chirp(); }, 3200);
    return { stop: function () { clearInterval(timer); fadeOut(g, src); } };
  }
  function cricketBurst() {
    try {
      var t0 = AC.currentTime, n = 3 + Math.floor(Math.random() * 3), i;
      for (i = 0; i < n; i++) {
        (function (i) {
          var t = t0 + i * 0.09, o = AC.createOscillator(), g = AC.createGain();
          o.type = 'sine'; o.frequency.value = 4100 + Math.random() * 300;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
          o.connect(g); g.connect(master);
          o.start(t); o.stop(t + 0.1);
        })(i);
      }
    } catch (e) {}
  }
  function startNight() {
    var src = mkNoiseSrc(), lp = AC.createBiquadFilter(), g = AC.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 380;
    g.gain.value = 0;
    src.connect(lp); lp.connect(g); g.connect(master);
    try { src.start(); } catch (e) {}
    fadeIn(g, 0.05);
    var timer = setInterval(function () { if (Math.random() < 0.8) cricketBurst(); }, 1600);
    return { stop: function () { clearInterval(timer); fadeOut(g, src); } };
  }
  var BUILDERS = { rain: startRain, waves: startWaves, forest: startForest, night: startNight };

  function engineStart(name) {
    if (live[name]) return true;
    var c = ctx();
    if (!c) { toast('เบราว์เซอร์นี้เล่นเสียงไม่ได้'); return false; }
    try {
      live[name] = BUILDERS[name]();
      return true;
    } catch (e) { return false; }
  }
  function engineStop(name) {
    if (!live[name]) return;
    try { live[name].stop(); } catch (e) {}
    delete live[name];
  }
  function anyOn() {
    var k;
    for (k in S.on) { if (S.on[k]) return true; }
    return false;
  }

  function paint() {
    var btns = document.querySelectorAll('#ambientPop [data-snd]'), i, b;
    for (i = 0; i < btns.length; i++) {
      b = btns[i];
      var n = b.getAttribute('data-snd');
      if (b.classList) b.classList.toggle('on', !!S.on[n]);
      b.setAttribute('aria-pressed', S.on[n] ? 'true' : 'false');
    }
    var fab = $('ambientFab');
    if (fab && fab.classList) fab.classList.toggle('playing', anyOn());
    var v = $('ambientVol');
    if (v && document.activeElement !== v) v.value = S.vol;
  }

  function toggleSound(name) {
    if (!BUILDERS[name]) return;
    if (S.on[name]) { S.on[name] = false; engineStop(name); }
    else {
      if (engineStart(name)) { S.on[name] = true; toast('♪ ' + (NAMES[name] || name)); }
    }
    save(S); paint();
  }

  function init() {
    var fab = $('ambientFab'), pop = $('ambientPop');
    if (!fab || !pop) return;
    fab.addEventListener('click', function () { pop.classList.toggle('open'); });
    var close = $('ambientClose');
    if (close) close.addEventListener('click', function () { pop.classList.remove('open'); });
    var grid = $('ambientGrid');
    if (grid) grid.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-snd]') : null;
      if (b) toggleSound(b.getAttribute('data-snd'));
    });
    var v = $('ambientVol');
    if (v) {
      v.value = S.vol;
      v.addEventListener('input', function () {
        S.vol = parseInt(v.value, 10) || 0;
        applyVol(); save(S); paint();
      });
    }
    paint();
    window.ET1AMBIENT = { toggle: toggleSound, state: function () { return S; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
