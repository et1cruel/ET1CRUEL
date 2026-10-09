/* ============================================================
   ET1CRUEL SOUND GARDEN — Phase 5: Sound Sanctuary
   - อัปเกรดแผง 🌧️ เดิม (ปุ่ม/ID เดิมครบ) ไม่สร้างปุ่มซ้อน
   - 12 ชั้นเสียง ผสมกันได้ แต่ละชั้น toggle + slider อิสระ
   - ธรรมชาติสังเคราะห์ (Web Audio ล้วน) + ดนตรี generative สเกลเดียว
   - จูนอิง A=432Hz (สเปกเสียง ไม่ใช่ข้ออ้างสรรพคุณรักษาโรค)
   - master + fade นุ่มทุกครั้ง · เริ่มหลังกดเท่านั้น · จำค่า et1_sound_v1
   - ย้ายค่าเก่าจาก et1cruel-ambient-v1 ครั้งเดียว (key เก่าไม่ลบ)
   - สั่งป่าได้: ฝน→หมอก/ละออง, ลม→โยก (ผ่าน ET1FOREST ถ้ามี)
   ============================================================ */
(function () {
  'use strict';
  /* ---------- config กลาง ---------- */
  var PAD_REF = 528; // แพดอิง 528Hz (สเปกเสียง ไม่ใช่สรรพคุณรักษา)
  var LAYERS = [
    { id: 'rain',   icon: '🌧', name: 'ฝน',       kind: 'nature' },
    { id: 'waves',  icon: '🌊', name: 'คลื่น',     kind: 'nature' },
    { id: 'forest', icon: '🌲', name: 'ป่า·นก',    kind: 'nature' },
    { id: 'night',  icon: '🦗', name: 'กลางคืน',   kind: 'nature' },
    { id: 'wind',   icon: '🌬', name: 'ลม',        kind: 'nature' },
    { id: 'fire',   icon: '🔥', name: 'กองไฟ',     kind: 'nature' },
    { id: 'stream', icon: '💧', name: 'ลำธาร',     kind: 'nature' },
    { id: 'thunder', icon: '⛈', name: 'ฟ้าร้องไกล', kind: 'nature' },
    { id: 'pad',    icon: '🎵', name: 'แพด 528Hz', kind: 'music' },
    { id: 'med432', icon: '🎼', name: 'LeBerch 432', kind: 'music' }
  ];
  var PRESETS = {
    morning:  { label: '🌅 ป่าฝนยามเช้า', on: { forest: 70, wind: 40, stream: 30 } },
    rainforest: { label: '🌧 ป่าฝน', on: { rain: 80, thunder: 60, pad: 25 } },
    meditate: { label: '🧘 นั่งสมาธิ', on: { pad: 60, night: 30 } },
    focus:    { label: '🎯 โฟกัสทำงาน', on: { pad: 35, rain: 25 } },
    silent:   { label: '🔇 เงียบสงบ', on: {} }
  };
  var KEY = 'et1_sound_v1', OLD_KEY = 'et1cruel-ambient-v1';
  var KNOWN = {};
  (function () { var i; for (i = 0; i < LAYERS.length; i++) KNOWN[LAYERS[i].id] = true; })();

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function toast(msg) {
    var box = $('os-toasts');
    if (!box) return;
    try {
      var t = document.createElement('div');
      t.className = 'os-toast xp'; t.textContent = msg;
      box.appendChild(t);
      setTimeout(function () { t.style.opacity = '0'; }, 2200);
      setTimeout(function () { t.remove(); }, 2700);
    } catch (e) {}
  }
  function defState() {
    var i, vol = {};
    for (i = 0; i < LAYERS.length; i++) vol[LAYERS[i].id] = 60;
    return { on: {}, vol: vol, master: 60, preset: '', timerMin: 0 };
  }
  function load() {
    var s = defState();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          if (o.on && typeof o.on === 'object') {
            s.on = o.on;
            var _k; for (_k in s.on) { if (!KNOWN[_k]) delete s.on[_k]; } // ตัดเสียงที่ถูกถอดออก
          }
          if (o.vol && typeof o.vol === 'object') { var k; for (k in s.vol) { if (typeof o.vol[k] === 'number') s.vol[k] = clamp(o.vol[k], 0, 100); } }
          if (typeof o.master === 'number') s.master = clamp(o.master, 0, 100);
          if (typeof o.preset === 'string') s.preset = o.preset;
        }
      } else {
        // ย้ายค่าเก่าครั้งเดียว (key เก่าคงไว้ไม่ลบ)
        var old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
        if (old && typeof old === 'object') {
          if (old.on && typeof old.on === 'object') { for (var k2 in old.on) { if (old.on[k2]) s.on[k2] = true; } }
          if (typeof old.vol === 'number') s.master = clamp(old.vol, 0, 100);
        }
      }
    } catch (e) {}
    return s;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ on: S.on, vol: S.vol, master: S.master, preset: S.preset })); } catch (e) {} }

  var S = load();
  var AC = null, master = null, noiseBuf = null, verb = null;
  var live = {}; // id -> {stop}
  var timerId = 0, timerEnd = 0;

  /* ---------- engine ---------- */
  function ctx() {
    if (AC) { if (AC.state === 'suspended' && AC.resume) { try { AC.resume(); } catch (e) {} } return AC; }
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try { AC = new Ctor(); } catch (e2) { return null; }
    master = AC.createGain();
    master.gain.value = S.master / 100;
    try { master.connect(AC.destination); } catch (e3) {}
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
  function reverb() {
    if (verb) return verb;
    try {
      verb = AC.createConvolver();
      var len = Math.floor(AC.sampleRate * 2), buf = AC.createBuffer(2, len, AC.sampleRate), ch, i;
      for (ch = 0; ch < 2; ch++) {
        var d = buf.getChannelData(ch);
        for (i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
      }
      verb.buffer = buf;
    } catch (e) { verb = null; }
    return verb;
  }
  function layerGain(id) {
    var g = AC.createGain();
    g.gain.value = 0;
    try { g.connect(master); } catch (e) {}
    try { g.gain.setTargetAtTime(((S.vol[id] == null ? 60 : S.vol[id]) / 100) * 0.9, AC.currentTime, 1.0); } catch (e2) {}
    return g;
  }
  function noiseSrc() {
    var s = AC.createBufferSource();
    s.buffer = noise(); s.loop = true;
    return s;
  }
  function stopNodes(g, srcs) {
    try {
      var t = AC.currentTime;
      g.gain.setTargetAtTime(0, t, 0.5);
      var i;
      for (i = 0; i < srcs.length; i++) { try { srcs[i].stop(t + 2); } catch (e) {} }
    } catch (e2) {}
  }
  function anyOn() { var k; for (k in S.on) { if (S.on[k]) return true; } return false; }
  function maybeSuspend() {
    if (!anyOn() && AC && AC.suspend) {
      try {
        var ac = AC;
        setTimeout(function () { if (!anyOn()) { try { ac.suspend(); } catch (e) {} } }, 2500);
      } catch (e2) {}
    }
  }

  /* ----- nature builders (return {stop}) ----- */
  function bRain() {
    var src = noiseSrc(), f = AC.createBiquadFilter(), g = layerGain('rain');
    f.type = 'lowpass'; f.frequency.value = 900 + (S.vol.rain / 100) * 900;
    src.connect(f); f.connect(g);
    try { src.start(); } catch (e) {}
    // หยดสุ่มเบาๆ
    var timer = setInterval(function () {
      if (Math.random() < 0.5) drop(3000 + Math.random() * 3000, 0.05);
    }, 900);
    function drop(fr, v) {
      try {
        var t = AC.currentTime, o = AC.createOscillator(), og = AC.createGain();
        o.type = 'sine'; o.frequency.value = fr;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(v, t + 0.02);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.2);
      } catch (e) {}
    }
    return { stop: function () { clearInterval(timer); stopNodes(g, [src]); }, setVol: stdSetVol('rain', g) };
  }
  function stdSetVol(id, g) {
    return function () {
      try { g.gain.setTargetAtTime(((S.vol[id] == null ? 60 : S.vol[id]) / 100) * 0.9, AC.currentTime, 0.5); } catch (e) {}
    };
  }
  function bWaves() {
    var src = noiseSrc(), f = AC.createBiquadFilter(), g = layerGain('waves');
    var lfo = AC.createOscillator(), lg = AC.createGain();
    f.type = 'lowpass'; f.frequency.value = 550;
    lfo.type = 'sine'; lfo.frequency.value = 0.1;
    lg.gain.value = 0.5 * ((S.vol.waves == null ? 60 : S.vol.waves) / 100);
    try { lfo.connect(lg); lg.connect(g.gain); } catch (e) {}
    src.connect(f); f.connect(g);
    try { src.start(); lfo.start(); } catch (e2) {}
    return {
      stop: function () { stopNodes(g, [src, lfo]); },
      setVol: function () {
        stdSetVol('waves', g)();
        try { lg.gain.value = 0.5 * ((S.vol.waves == null ? 60 : S.vol.waves) / 100); } catch (e3) {}
      }
    };
  }
  function birdChirp(out, lo, hi) {
    try {
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      var f = lo + Math.random() * (hi - lo);
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.09);
      o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.22);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
    } catch (e) {}
  }
  function bForest() {
    var src = noiseSrc(), f = AC.createBiquadFilter(), g = layerGain('forest');
    f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = 0.7;
    src.connect(f); f.connect(g);
    try { src.start(); } catch (e) {}
    var kinds = [[2600, 4200], [3400, 5200], [2200, 3200]], ki = 0;
    var timer = setInterval(function () {
      if (Math.random() < 0.75) { var k = kinds[ki % kinds.length]; ki++; birdChirp(g, k[0], k[1]); }
    }, 2800);
    return { stop: function () { clearInterval(timer); stopNodes(g, [src]); }, setVol: stdSetVol('forest', g) };
  }
  function bNight() {
    var src = noiseSrc(), f = AC.createBiquadFilter(), g = layerGain('night');
    f.type = 'lowpass'; f.frequency.value = 380;
    src.connect(f); f.connect(g);
    try { src.start(); } catch (e) {}
    var timer = setInterval(function () {
      var r = Math.random();
      if (r < 0.62) cricket(g);
      else if (r < 0.72) frog(g);
    }, 1600);
    function cricket(out) {
      try {
        var t0 = AC.currentTime, n = 3 + Math.floor(Math.random() * 3), i;
        for (i = 0; i < n; i++) {
          (function (i) {
            var t = t0 + i * 0.09, o = AC.createOscillator(), og = AC.createGain();
            o.type = 'sine'; o.frequency.value = 4100 + Math.random() * 300;
            og.gain.setValueAtTime(0.0001, t);
            og.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
            og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
            o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.1);
          })(i);
        }
      } catch (e) {}
    }
    function frog(out) {
      try {
        var t = AC.currentTime, o = AC.createOscillator(), og = AC.createGain(), am = AC.createOscillator(), amg = AC.createGain();
        o.type = 'triangle'; o.frequency.value = 160 + Math.random() * 120;
        am.type = 'sine'; am.frequency.value = 22; amg.gain.value = 0.5;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.14, t + 0.06);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        try { am.connect(amg); amg.connect(og.gain); } catch (e) {}
        o.connect(og); og.connect(out);
        o.start(t); am.start(t); o.stop(t + 0.4); am.stop(t + 0.4);
      } catch (e2) {}
    }
    return { stop: function () { clearInterval(timer); stopNodes(g, [src]); }, setVol: stdSetVol('night', g) };
  }
  function bWind() {
    var src = noiseSrc(), f = AC.createBiquadFilter(), g = layerGain('wind');
    var lfo = AC.createOscillator(), lg = AC.createGain(), lfo2 = AC.createOscillator(), lg2 = AC.createGain();
    f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.6;
    lfo.type = 'sine'; lfo.frequency.value = 0.07; lg.gain.value = 260;
    lfo2.type = 'sine'; lfo2.frequency.value = 0.11; lg2.gain.value = 0.12;
    try { lfo.connect(lg); lg.connect(f.frequency); lfo2.connect(lg2); lg2.connect(g.gain); } catch (e) {}
    src.connect(f); f.connect(g);
    try { src.start(); lfo.start(); lfo2.start(); } catch (e2) {}
    return { stop: function () { stopNodes(g, [src, lfo, lfo2]); }, setVol: stdSetVol('wind', g) };
  }
  function bFire() {
    var src = noiseSrc(), f = AC.createBiquadFilter(), g = layerGain('fire');
    f.type = 'lowpass'; f.frequency.value = 420;
    src.connect(f); f.connect(g);
    try { src.start(); } catch (e) {}
    var timer = setInterval(function () {
      if (Math.random() < 0.8) pop();
    }, 320);
    function pop() {
      try {
        var t = AC.currentTime, s2 = AC.createBufferSource(), og = AC.createGain(), bp = AC.createBiquadFilter();
        s2.buffer = noise();
        s2.playbackRate.value = 0.7 + Math.random();
        bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random() * 2200; bp.Q.value = 2;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.1 + Math.random() * 0.12, t + 0.012);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.05);
        s2.connect(bp); bp.connect(og); og.connect(g);
        s2.start(t); s2.stop(t + 0.15);
      } catch (e2) {}
    }
    return { stop: function () { clearInterval(timer); stopNodes(g, [src]); }, setVol: stdSetVol('fire', g) };
  }
  function bStream() {
    var src = noiseSrc(), f = AC.createBiquadFilter(), g = layerGain('stream');
    var lfo = AC.createOscillator(), lg = AC.createGain();
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.1;
    lfo.type = 'sine'; lfo.frequency.value = 0.4 + Math.random() * 0.3; lg.gain.value = 320;
    try { lfo.connect(lg); lg.connect(f.frequency); } catch (e) {}
    src.connect(f); f.connect(g);
    try { src.start(); lfo.start(); } catch (e2) {}
    return { stop: function () { stopNodes(g, [src, lfo]); }, setVol: stdSetVol('stream', g) };
  }
  function bThunder() {
    var tg = layerGain('thunder');
    var timer = setInterval(function () {
      if (Math.random() < 0.4) rumble();
    }, 22000);
    // คำรามแรกหลังเปิดไม่นาน (ฟ้าร้องหายากแต่ได้ยินชัวร์)
    setTimeout(function () { if (live.thunder) rumble(); }, 6000);
    function rumble() {
      try {
        var t = AC.currentTime, s2 = AC.createBufferSource(), og = AC.createGain(), lp = AC.createBiquadFilter();
        s2.buffer = noise(); s2.loop = true;
        s2.playbackRate.value = 0.25;
        lp.type = 'lowpass'; lp.frequency.value = 120;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.5, t + 0.7);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
        s2.connect(lp); lp.connect(og); og.connect(tg);
        s2.start(t); s2.stop(t + 3.6);
      } catch (e) {}
    }
    return { stop: function () { clearInterval(timer); stopNodes(tg, []); }, setVol: stdSetVol('thunder', tg) };
  }
  /* ----- music ----- */
  function bPad() {
    // โดรนอิง 528Hz: ราก 264 + คู่ห้า 396 + อ็อกเทฟ 528 (สเปกเสียง)
    // สาย: oscs → mix → lowpass(หายใจช้าๆ) → g → master + send → reverb → master
    var g = layerGain('pad'), mix = AC.createGain(), oscs = [], i;
    var parts = [PAD_REF / 2, PAD_REF * 0.75, PAD_REF];
    for (i = 0; i < parts.length; i++) {
      (function (i) {
        var o1 = AC.createOscillator(), o2 = AC.createOscillator(), og = AC.createGain();
        o1.type = 'sine'; o2.type = 'triangle';
        o1.frequency.value = parts[i];
        o2.frequency.value = parts[i];
        try { o1.detune.value = -4; o2.detune.value = 5; } catch (e) {}
        og.gain.value = i === 0 ? 0.5 : 0.3;
        o1.connect(og); o2.connect(og); og.connect(mix);
        try { o1.start(); o2.start(); } catch (e2) {}
        oscs.push(o1, o2);
      })(i);
    }
    var lp = AC.createBiquadFilter(), lfo = AC.createOscillator(), lg = AC.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 620;
    lfo.type = 'sine'; lfo.frequency.value = 0.05; lg.gain.value = 260;
    var send = AC.createGain(), wet = AC.createGain();
    send.gain.value = 0.5; wet.gain.value = 0.5;
    try {
      mix.connect(lp); lp.connect(g);
      lfo.connect(lg); lg.connect(lp.frequency);
      g.connect(master);
      g.connect(send);
      var rv = reverb();
      if (rv) { send.connect(rv); rv.connect(wet); wet.connect(master); }
      else send.connect(master);
      lfo.start();
    } catch (e3) {}
    return {
      stop: function () { stopNodes(g, oscs.concat([lfo])); },
      setVol: stdSetVol('pad', g)
    };
  }
  /* ----- ไฟล์เพลงจริง (โหลดเฉพาะตอนกดเปิด ไม่ถ่วงตอนเปิดหน้า) ----- */
  var FILE_CACHE = {}; // id -> AudioBuffer
  function bFile(id, url) {
    var g = layerGain(id);
    var st = { dead: false, src: null };
    markLoad(true);
    if (FILE_CACHE[id]) startSrc(FILE_CACHE[id]);
    else {
      fetch(url).then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.arrayBuffer();
      }).then(function (ab) {
        return new Promise(function (resolve, reject) {
          try {
            if (AC.decodeAudioData.length >= 2) AC.decodeAudioData(ab, resolve, reject);
            else {
              var p = AC.decodeAudioData(ab);
              if (p && p.then) p.then(resolve, reject);
              else reject(new Error('decode?'));
            }
          } catch (e) { reject(e); }
        });
      }).then(function (buf) {
        FILE_CACHE[id] = buf;
        startSrc(buf);
      }, function () { fail(); });
    }
    function startSrc(buf) {
      if (st.dead) return;
      try {
        var s = AC.createBufferSource();
        s.buffer = buf; s.loop = true;
        s.connect(g);
        s.start();
        st.src = s;
      } catch (e) { fail(); return; }
      markLoad(false);
    }
    function markLoad(loading) {
      try {
        var box = $('sndLayers');
        if (!box || !box.querySelectorAll) return;
        var rows = box.querySelectorAll('[data-layer]'), i;
        for (i = 0; i < rows.length; i++) {
          if (rows[i].getAttribute('data-layer') === id) {
            var b = rows[i].querySelector('button');
            if (b && b.classList) b.classList.toggle('loading', !!loading);
          }
        }
      } catch (e2) {}
    }
    function fail() {
      markLoad(false);
      st.dead = true;
      try {
        if (S.on[id]) { S.on[id] = false; engineStop(id); }
        save(); paint();
        toast('โหลดไฟล์เพลงไม่สำเร็จ');
      } catch (e3) {}
    }
    return {
      stop: function () { st.dead = true; markLoad(false); stopNodes(g, st.src ? [st.src] : []); },
      setVol: stdSetVol(id, g)
    };
  }
  function bMed432() { return bFile('med432', 'audio/leberch-432hz.mp3'); }
  var BUILDERS = {
    rain: bRain, waves: bWaves, forest: bForest, night: bNight,
    wind: bWind, fire: bFire, stream: bStream, thunder: bThunder,
    pad: bPad, med432: bMed432
  };

  /* ---------- control ---------- */
  function engineStart(id) {
    if (live[id]) return true;
    if (!ctx()) { toast('เบราว์เซอร์นี้เล่นเสียงไม่ได้'); return false; }
    try { live[id] = BUILDERS[id](); applyVol(id); return true; }
    catch (e) { return false; }
  }
  function engineStop(id) {
    if (!live[id]) return;
    try { live[id].stop(); } catch (e) {}
    try { if (live[id].timer) clearInterval(live[id].timer); } catch (e2) {}
    delete live[id];
    maybeSuspend();
  }
  function applyVol(id) {
    if (!AC || !live[id] || !live[id].setVol) return;
    try { live[id].setVol((S.vol[id] == null ? 60 : S.vol[id]) / 100); } catch (e) {}
  }
  function applyMaster() {
    if (AC && master) {
      try { master.gain.setTargetAtTime(S.master / 100, AC.currentTime, 0.3); } catch (e) {}
    }
  }
  function anyOn() { var k; for (k in S.on) { if (S.on[k]) return true; } return false; }
  function forestReact() {
    try {
      if (window.ET1FOREST && window.ET1FOREST.setWeather) {
        window.ET1FOREST.setWeather({
          rain: S.on.rain ? 0.3 + (S.vol.rain / 100) * 0.7 : (S.on.thunder ? 0.6 : 0),
          wind: S.on.wind ? 0.3 + (S.vol.wind / 100) * 0.7 : (S.on.waves ? 0.25 : 0)
        });
      }
    } catch (e) {}
  }
  var ICONS = {}, NAMES = {};
  (function () { var i; for (i = 0; i < LAYERS.length; i++) { ICONS[LAYERS[i].id] = LAYERS[i].icon; NAMES[LAYERS[i].id] = LAYERS[i].name; } })();

  function toggle(id, silent) {
    if (!BUILDERS[id]) return;
    clearTimer(true);
    if (S.on[id]) { S.on[id] = false; engineStop(id); }
    else {
      if (engineStart(id)) { S.on[id] = true; if (!silent) toast('♪ ' + (NAMES[id] || id)); }
    }
    S.preset = '';
    save(); paint(); forestReact();
  }
  function applyPreset(key, silent) {
    var p = PRESETS[key];
    if (!p) return;
    clearTimer(true);
    var ids = {}, i;
    for (i = 0; i < LAYERS.length; i++) ids[LAYERS[i].id] = false;
    for (var k in p.on) {
      if (BUILDERS[k]) {
        S.vol[k] = clamp(p.on[k], 0, 100);
        if (!S.on[k]) { if (engineStart(k)) S.on[k] = true; }
        else applyVol(k);
        ids[k] = S.on[k];
      }
    }
    for (i = 0; i < LAYERS.length; i++) {
      var id = LAYERS[i].id;
      if (!ids[id] && S.on[id]) { S.on[id] = false; engineStop(id); }
    }
    S.preset = key;
    save(); paint(); forestReact();
    if (!silent) toast('🎧 ' + p.label);
  }

  /* ---------- sleep timer ---------- */
  function clearTimer(silent) {
    if (timerId) { clearTimeout(timerId); timerId = 0; timerEnd = 0; }
    if (!silent) paintTimer();
  }
  function setTimer(min) {
    clearTimer(true);
    if (!min) { paintTimer(); save(); return; }
    timerEnd = Date.now() + min * 60000;
    timerId = setTimeout(function () {
      timerId = 0; timerEnd = 0;
      // fade master ลงนุ่มๆ แล้วหยุดทุกชั้น
      try {
        if (AC && master) master.gain.setTargetAtTime(0.0001, AC.currentTime, 3);
      } catch (e) {}
      setTimeout(function () {
        var k;
        for (k in S.on) { if (S.on[k]) { S.on[k] = false; engineStop(k); } }
        S.preset = ''; applyMaster(); save(); paint(); forestReact();
        toast('🌙 หมดเวลาฟัง — ปิดเสียงให้นุ่มๆ แล้ว');
      }, 9000);
    }, min * 60000);
    save(); paintTimer();
    toast('⏱ ปิดเสียงอัตโนมัติใน ' + min + ' นาที');
  }
  function paintTimer() {
    var el = $('sndTimerNote');
    if (!el) return;
    if (timerEnd) {
      var left = Math.max(1, Math.round((timerEnd - Date.now()) / 60000));
      el.textContent = '⏱ ปิดใน ~' + left + ' นาที (กดซ้ำเพื่อยกเลิก)';
    } else el.textContent = '';
  }

  /* ---------- UI ---------- */
  function paint() {
    // ปุ่ม grid เดิม (4 เสียงแรก) + แถว layer ทั้งหมด
    var i, b, id;
    var grid = $('ambientGrid');
    if (grid && grid.children) {
      for (i = 0; i < grid.children.length; i++) {
        b = grid.children[i];
        if (b.getAttribute) {
          id = b.getAttribute('data-snd');
          if (id && b.classList) b.classList.toggle('on', !!S.on[id]);
          if (id) b.setAttribute('aria-pressed', S.on[id] ? 'true' : 'false');
        }
      }
    }
    var box = $('sndLayers');
    if (box) {
      var rows = box.querySelectorAll('[data-layer]');
      for (i = 0; i < rows.length; i++) {
        (function (row) {
          var lid = row.getAttribute('data-layer');
          var btn = row.querySelector('button'), sl = row.querySelector('input');
          if (btn && btn.classList) btn.classList.toggle('on', !!S.on[lid]);
          if (sl && document.activeElement !== sl) sl.value = (S.vol[lid] == null ? 60 : S.vol[lid]);
        })(rows[i]);
      }
    }
    var fab = $('ambientFab');
    if (fab && fab.classList) fab.classList.toggle('playing', anyOn());
    var mv = $('ambientVol');
    if (mv && document.activeElement !== mv) mv.value = S.master;
    var now = $('sndNow');
    if (now) {
      var names = [];
      for (i = 0; i < LAYERS.length; i++) { if (S.on[LAYERS[i].id]) names.push(LAYERS[i].icon + ' ' + LAYERS[i].name); }
      now.textContent = names.length ? '🎧 ' + names.join(' · ') : (S.preset === 'silent' ? '🔇 เงียบสงบ' : 'ยังไม่เปิดเสียง');
    }
    paintTimer();
  }
  function buildLayers() {
    var box = $('sndLayers');
    if (!box || box.children.length) return;
    var html = '', i;
    var cur = 'nature';
    for (i = 0; i < LAYERS.length; i++) {
      var L = LAYERS[i];
      if (L.kind !== cur) {
        html += '<div class="snd-kind">' + (L.kind === 'music' ? '🎼 ดนตรี' : '🌿 ธรรมชาติ') + '</div>';
        cur = L.kind;
      }
      html += '<div class="snd-row" data-layer="' + L.id + '"><button type="button" aria-pressed="false">' +
        L.icon + ' ' + L.name + '</button>' +
        '<input type="range" min="0" max="100" value="' + (S.vol[L.id] == null ? 60 : S.vol[L.id]) + '" aria-label="ความดัง ' + L.name + '"></div>';
    }
    try { box.innerHTML = html; } catch (e) {}
  }
  function buildPresets() {
    var box = $('sndPresets');
    if (!box || box.children.length) return;
    var html = '', k;
    for (k in PRESETS) {
      html += '<button type="button" data-preset="' + k + '">' + PRESETS[k].label + '</button>';
    }
    try { box.innerHTML = html; } catch (e) {}
  }

  function init() {
    var fab = $('ambientFab'), pop = $('ambientPop');
    if (!fab || !pop) return; // หน้านี้ไม่มีแผงเสียง
    buildLayers(); buildPresets();
    var grid = $('ambientGrid');
    if (grid) grid.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-snd]') : null;
      if (b) toggle(b.getAttribute('data-snd'));
    });
    var layers = $('sndLayers');
    if (layers) {
      layers.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('[data-layer] button') : null;
        if (!b) return;
        var row = b.parentNode;
        var id = row && row.getAttribute ? row.getAttribute('data-layer') : null;
        if (id) toggle(id);
      });
      layers.addEventListener('input', function (e) {
        var sl = e.target;
        if (!sl || sl.tagName !== 'INPUT') return;
        var row = sl.parentNode;
        var id = row && row.getAttribute ? row.getAttribute('data-layer') : null;
        if (!id) return;
        S.vol[id] = clamp(parseInt(sl.value, 10) || 0, 0, 100);
        if (S.vol[id] > 0 && !S.on[id]) {
          if (engineStart(id)) { S.on[id] = true; forestReact(); }
        } else if (S.on[id]) applyVol(id);
        S.preset = '';
        save(); paint();
      });
    }
    var pr = $('sndPresets');
    if (pr) pr.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-preset]') : null;
      if (b) applyPreset(b.getAttribute('data-preset'));
    });
    var tm = $('sndTimer');
    if (tm) tm.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-min]') : null;
      if (!b) return;
      var min = parseInt(b.getAttribute('data-min'), 10) || 0;
      if (timerId && min > 0) setTimer(0); // กดซ้ำ = ยกเลิก
      else setTimer(min);
    });
    var mv = $('ambientVol');
    if (mv) {
      mv.value = S.master;
      mv.addEventListener('input', function () {
        S.master = clamp(parseInt(mv.value, 10) || 0, 0, 100);
        applyMaster(); save(); paint();
      });
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) paintTimer(); });
    paint();
    window.ET1SOUND = {
      toggle: toggle, preset: applyPreset, timer: setTimer,
      state: function () { return { on: S.on, master: S.master, preset: S.preset }; }
    };
    window.ET1SOUND_V2 = true;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
