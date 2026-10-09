/* ============================================================
   ET1CRUEL LIVING FOREST — Phase 2: ป่า background มีชีวิต
   - canvas โปร่งใสซ้อนทับ galaxy เดิม (z-index 0, ใต้เนื้อหา)
   - ต้นไม้ procedural (สน/ไม้ใบกว้าง/ไผ่/เฟิร์น) + เติบโต + ลม + หมอก
   - เติบโตจากข้อมูลจริง: วันไดอารี่ + XP Life OS + เวลาจริง
   - จำป่าข้ามวัน (et1_forest_v1) · ไดอารี่ 1 วัน = ต้นเรืองแสง 1 ต้น
   - ประหยัดเครื่อง: cache sprite/offscreen, DPR จำกัด, auto-degrade,
     หยุดตอน tab ซ่อน, เคารพ prefers-reduced-motion
   - API: window.ET1FOREST { status, refresh, setEnabled, setQuality,
     setWeather } — เตรียมให้เฟสเสียงสั่งฝน/ลมได้
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- utils ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function $(id) { return document.getElementById(id); }
  function dayKey(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  /* ---------------- palette ตามเวลาจริง ---------------- */
  var PALETTES = {
    dawn:  { sky: ['#16233f', '#5a4a72', '#d8956a'], far: '#3c4a68', mid: '#2b4a3c', near: '#1b3026', ground: '#0d1a14', mist: 'rgba(232,180,120,.10)', ray: 'rgba(255,210,140,.10)', mote: '#ffe2ae', firefly: false },
    day:   { sky: ['#0d2836', '#2a6a58', '#79c69c'], far: '#4a7a6e', mid: '#2f5c45', near: '#1d3b2b', ground: '#0e2018', mist: 'rgba(190,235,205,.10)', ray: 'rgba(255,255,220,.07)', mote: '#eafff0', firefly: false },
    dusk:  { sky: ['#1b1b40', '#6b3a58', '#dd7840'], far: '#4a3f60', mid: '#33482f', near: '#1e2e22', ground: '#0e1a12', mist: 'rgba(230,150,110,.10)', ray: 'rgba(255,170,110,.10)', mote: '#ffd9ae', firefly: false },
    night: { sky: ['#020610', '#0a1c3c', '#1c3f60'], far: '#16283f', mid: '#10262b', near: '#0a1c20', ground: '#060f12', mist: 'rgba(120,170,220,.09)', ray: 'rgba(150,190,255,.05)', mote: '#cfe6ff', firefly: true }
  };
  function paletteFor(h) {
    if (h >= 5 && h < 8) return PALETTES.dawn;
    if (h >= 8 && h < 17) return PALETTES.day;
    if (h >= 17 && h < 20) return PALETTES.dusk;
    return PALETTES.night;
  }
  /* Phase 3: crossfade พาเลตต์นุ่มๆ ตามเวลา (คีย์ปัดเป็นขั้นกัน rebuild บ่อย) */
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mixHex(a, b, t) {
    var A = hexRgb(a), B = hexRgb(b);
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }
  function mixPal(p, q, t) {
    return {
      sky: [mixHex(p.sky[0], q.sky[0], t), mixHex(p.sky[1], q.sky[1], t), mixHex(p.sky[2], q.sky[2], t)],
      far: mixHex(p.far, q.far, t), mid: mixHex(p.mid, q.mid, t),
      near: mixHex(p.near, q.near, t), ground: mixHex(p.ground, q.ground, t),
      mist: t < 0.5 ? p.mist : q.mist, ray: t < 0.5 ? p.ray : q.ray,
      mote: t < 0.5 ? p.mote : q.mote, firefly: !!(p.firefly || q.firefly)
    };
  }
  var DAY_KEYS = [[0, 'night'], [5, 'night'], [6.5, 'dawn'], [8, 'day'], [17, 'day'], [18.5, 'dusk'], [20, 'night'], [24, 'night']];
  function paletteNow(h) {
    var i;
    for (i = 0; i < DAY_KEYS.length - 1; i++) {
      var a = DAY_KEYS[i], b = DAY_KEYS[i + 1];
      if (h >= a[0] && h <= b[0]) {
        var t = (h - a[0]) / ((b[0] - a[0]) || 1);
        return { pal: mixPal(PALETTES[a[1]], PALETTES[b[1]], t), key: a[1] + '>' + b[1] + ':' + Math.round(t * 12) };
      }
    }
    return { pal: PALETTES.night, key: 'night' };
  }
  var STAGES = [
    { at: 0.2, icon: '🌱', name: 'เมล็ดพันธุ์' },
    { at: 0.4, icon: '🌿', name: 'สวนกล้า' },
    { at: 0.6, icon: '🌲', name: 'ป่ากำลังโต' },
    { at: 0.85, icon: '🌳', name: 'ป่าโบราณ' },
    { at: 2, icon: '✨', name: 'ป่านิรันดร์' }
  ];
  function stageOf(g) {
    var i;
    for (i = 0; i < STAGES.length; i++) { if (g < STAGES[i].at) return STAGES[i]; }
    return STAGES[STAGES.length - 1];
  }

  /* ---------------- state ---------------- */
  var LS_KEY = 'et1_forest_v1';
  var QUALITY = {
    low:    { trees: 34, ferns: 8,  motes: 18, dpr: 1,   mist: 2, rays: false },
    medium: { trees: 62, ferns: 14, motes: 38, dpr: 1.5, mist: 3, rays: true },
    high:   { trees: 92, ferns: 20, motes: 64, dpr: 2,   mist: 4, rays: true }
  };
  function loadState() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { var o = JSON.parse(raw); if (o && typeof o === 'object') return o; }
    } catch (e) {}
    return null;
  }
  function saveState() {
    try {
      S.updatedAt = new Date().toISOString();
      localStorage.setItem(LS_KEY, JSON.stringify({
        seed: S.seed, bornAt: S.bornAt, updatedAt: S.updatedAt,
        quality: S.quality, enabled: S.enabled,
        trees: S.trees.map(function (t) {
          return { x: +t.x.toFixed(4), layer: t.layer, type: t.type, g: +t.g.toFixed(3), phase: +t.phase.toFixed(3), glow: !!t.glow, h: Math.round(t.h) };
        })
      }));
    } catch (e) {}
  }
  var S = {
    seed: 20261009, bornAt: new Date().toISOString(), updatedAt: null,
    quality: 'medium', enabled: true, trees: [],
    weather: { rain: 0, wind: 0 }
  };
  (function restore() {
    var o = loadState();
    if (!o) return;
    if (typeof o.seed === 'number') S.seed = o.seed;
    if (o.bornAt) S.bornAt = o.bornAt;
    if (QUALITY[o.quality]) S.quality = o.quality;
    if (typeof o.enabled === 'boolean') S.enabled = o.enabled;
    if (Array.isArray(o.trees)) {
      var now = Date.now(), born = Date.parse(o.bornAt) || now, prev = Date.parse(o.updatedAt) || born;
      var elapsedH = Math.max(0, (now - Math.max(prev, born)) / 3600000);
      var i, t;
      for (i = 0; i < o.trees.length && i < 140; i++) {
        t = o.trees[i];
        if (typeof t.x !== 'number' || !t.type) continue;
        // โตชดเชยตามเวลาจริงที่ผ่านไป (โตเต็มใน ~14 วัน)
        S.trees.push({
          x: clamp(t.x, 0, 1), layer: t.layer === 2 ? 2 : 1,
          type: t.type, phase: (typeof t.phase === 'number' ? t.phase : Math.random()),
          g: clamp((typeof t.g === 'number' ? t.g : 0.4) + elapsedH / 336, 0, 1),
          glow: !!t.glow, h: t.h || 0, shrink: false, sprite: null
        });
      }
    }
  })();

  /* ---------------- ข้อมูลจริงจาก Life OS ---------------- */
  function realData() {
    var diaryDays = 0, xp = 0;
    try {
      var d = JSON.parse(localStorage.getItem('et1cruel_diary_v1') || 'null');
      if (d && d.entries) diaryDays = Object.keys(d.entries).length;
    } catch (e) {}
    try {
      var l = JSON.parse(localStorage.getItem('et1cruel_lifeos_v1') || 'null');
      if (l && l.character && isFinite(+l.character.xp)) xp = +l.character.xp;
    } catch (e2) {}
    var ageDays = 0;
    try { ageDays = Math.max(0, (Date.now() - Date.parse(S.bornAt)) / 86400000); } catch (e3) {}
    return { diaryDays: diaryDays, xp: xp, ageDays: ageDays };
  }
  function growthOf(r) {
    return clamp(0.1 + Math.min(r.diaryDays, 15) * 0.03 + (r.xp / 100000) * 0.3 + Math.min(r.ageDays, 30) * 0.005, 0, 1);
  }

  /* ---------------- canvas ---------------- */
  var cv = null, cx = null, W = 0, H = 0, DPR = 1;
  var reduced = false, running = false, rafId = 0, lastT = 0;
  var mx = 0, rafCount = 0;
  var farCache = null, skyCache = null, mistCache = null;
  var motes = [], leaves = [];
  var spawnTimer = 0, leafTimer = 3, saveTimer = 0, slowFrames = 0, degraded = false;
  var curPal = PALETTES.day, curPalKey = '';

  function setupCanvas() {
    cv = $('forest-bg');
    if (!cv) return false;
    try { cx = cv.getContext('2d'); } catch (e) { return false; }
    return !!cx;
  }
  function resize() {
    if (!cv) return;
    var q = QUALITY[S.quality] || QUALITY.medium;
    var small = (window.innerWidth || 1280) < 700;
    DPR = Math.min(window.devicePixelRatio || 1, small ? 1.25 : q.dpr);
    W = window.innerWidth || 1280; H = window.innerHeight || 800;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    try { cx.setTransform(DPR, 0, 0, DPR, 0, 0); } catch (e) {}
    farCache = null; skyCache = null; mistCache = null;
    layoutTrees();
  }

  /* ---------------- sprite ต้นไม้ procedural ---------------- */
  function makeSprite(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
    draw(c.getContext('2d'), c.width, c.height);
    return c;
  }
  function shade(hex, amt, rnd) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = clamp(Math.round(r + (rnd() - 0.5) * 14), 0, 255);
    g = clamp(Math.round(g + (rnd() - 0.5) * 14), 0, 255);
    b = clamp(Math.round(b + (rnd() - 0.5) * 14), 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function drawPine(x, w, h, rnd, pal) {
    var cx0 = w / 2;
    x.fillStyle = '#3a2a1c'; x.fillRect(cx0 - w * 0.03, h * 0.72, w * 0.06, h * 0.28);
    var i, y;
    for (i = 0; i < 4; i++) {
      y = h * (0.78 - i * 0.19);
      var ww = w * (0.5 - i * 0.09);
      x.fillStyle = shade('#1e4a34', 6 - i * 4, rnd);
      x.beginPath(); x.moveTo(cx0 - ww, y); x.lineTo(cx0, y - h * 0.24); x.lineTo(cx0 + ww, y); x.closePath(); x.fill();
    }
  }
  function drawBroad(x, w, h, rnd, pal) {
    var cx0 = w / 2;
    x.strokeStyle = '#3a2a1c'; x.lineWidth = Math.max(3, w * 0.05); x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx0, h); x.quadraticCurveTo(cx0 + w * 0.06, h * 0.6, cx0 - w * 0.02, h * 0.42); x.stroke();
    x.beginPath(); x.moveTo(cx0, h * 0.62); x.quadraticCurveTo(cx0 - w * 0.2, h * 0.5, cx0 - w * 0.28, h * 0.32); x.stroke();
    var i;
    for (i = 0; i < 11; i++) {
      var px = cx0 + (rnd() - 0.5) * w * 0.85, py = h * 0.34 + (rnd() - 0.5) * h * 0.4;
      var pr = w * (0.1 + rnd() * 0.13);
      x.fillStyle = shade(i % 2 ? '#2a6a44' : '#1c4a30', 4, rnd);
      x.beginPath(); x.arc(px, py, pr, 0, 6.2832); x.fill();
    }
  }
  function drawBamboo(x, w, h, rnd, pal) {
    var s, seg;
    for (s = 0; s < 3; s++) {
      var bx = w * (0.25 + s * 0.25) + (rnd() - 0.5) * w * 0.06;
      x.strokeStyle = shade('#3f7a3a', 6, rnd); x.lineWidth = Math.max(3, w * 0.035); x.lineCap = 'round';
      x.beginPath(); x.moveTo(bx, h); x.lineTo(bx + (rnd() - 0.5) * w * 0.08, h * 0.08); x.stroke();
      for (seg = 1; seg <= 4; seg++) {
        var ly = h - (h * 0.92 * seg) / 4;
        x.fillStyle = shade('#2f6a34', 8, rnd);
        x.beginPath(); x.ellipse(bx + w * 0.09, ly, w * 0.1, w * 0.028, -0.5, 0, 6.2832); x.fill();
        x.beginPath(); x.ellipse(bx - w * 0.09, ly - h * 0.03, w * 0.1, w * 0.028, 0.5, 0, 6.2832); x.fill();
      }
    }
  }
  function drawFern(x, w, h, rnd, pal) {
    var f;
    for (f = 0; f < 9; f++) {
      var a = -Math.PI * (0.12 + 0.76 * (f / 8));
      x.strokeStyle = shade('#2f7a44', 10, rnd); x.lineWidth = Math.max(2, w * 0.02); x.lineCap = 'round';
      x.beginPath(); x.moveTo(w / 2, h);
      x.quadraticCurveTo(w / 2 + Math.cos(a) * w * 0.3, h + Math.sin(a) * h * 0.6, w / 2 + Math.cos(a) * w * 0.52, h + Math.sin(a) * h * 0.95);
      x.stroke();
    }
  }
  var SPRITE_BUILDERS = { pine: drawPine, broad: drawBroad, bamboo: drawBamboo, fern: drawFern };
  function buildSprite(t) {
    var rnd = mulberry32(S.seed + Math.round(t.x * 99991) + t.layer * 7919);
    var scale = H / 800;
    var h = (t.h || (t.layer === 2 ? 200 + rnd() * 160 : 120 + rnd() * 110)) * scale;
    var w = h * (t.type === 'fern' ? 1.1 : t.type === 'bamboo' ? 0.55 : 0.62);
    try {
      t.sprite = makeSprite(w, h, function (x, sw, sh) {
        SPRITE_BUILDERS[t.type](x, sw, sh, rnd, curPal);
      });
      t.sw = w; t.sh = h;
    } catch (e) { t.sprite = null; }
  }

  /* ---------------- วางต้นไม้ ---------------- */
  function layoutTrees() {
    var rnd = mulberry32(S.seed + 7);
    var i, t;
    for (i = 0; i < S.trees.length; i++) {
      t = S.trees[i];
      if (!t.sprite) buildSprite(t);
    }
    void rnd;
  }
  function targetCount() {
    var q = QUALITY[S.quality] || QUALITY.medium;
    var r = realData();
    return Math.round(lerp(22, q.trees, growthOf(r)));
  }
  function spawnSapling() {
    var rnd = Math.random;
    var r = realData();
    var types = r && 1 ? ['pine', 'pine', 'broad', 'broad', 'bamboo'] : ['pine'];
    void r;
    var layer = rnd() < 0.35 ? 2 : 1;
    var t = {
      x: rnd(), layer: layer,
      type: types[Math.floor(rnd() * types.length)],
      phase: rnd(), g: 0.04, glow: false, h: 0, shrink: false, sprite: null
    };
    buildSprite(t);
    S.trees.push(t);
  }
  function syncGlow() {
    // ไดอารี่ 1 วัน = ต้นเรืองแสง 1 ต้น (สูงสุด 14)
    var r = realData();
    var want = Math.min(r.diaryDays, 14), have = 0, i;
    for (i = 0; i < S.trees.length; i++) { if (S.trees[i].glow) have++; }
    if (have >= want) return;
    var cands = S.trees.filter(function (t) { return !t.glow && !t.shrink && t.layer === 1; });
    cands.sort(function (a, b) { return b.g - a.g; });
    for (i = 0; i < cands.length && have < want; i++) { cands[i].glow = true; have++; }
  }

  /* ---------------- เลเยอร์ไกล (cache) ---------------- */
  function buildFar() {
    var rnd = mulberry32(S.seed + 99);
    farCache = makeSprite(W, H, function (x, w, h) {
      var i;
      // ภูเขา 2 ชั้น
      x.fillStyle = curPal.far;
      x.beginPath(); x.moveTo(0, h * 0.62);
      for (i = 0; i <= 8; i++) x.lineTo((w * i) / 8, h * (0.5 + rnd() * 0.16));
      x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
      // แถวต้นไม้ไกล (silhouette)
      x.fillStyle = curPal.mid;
      var n = Math.round(w / 46);
      for (i = 0; i < n; i++) {
        var tx = (i + rnd() * 0.7) * (w / n), th = h * (0.1 + rnd() * 0.12), ty = h * 0.66;
        x.beginPath(); x.moveTo(tx - 14, ty); x.lineTo(tx, ty - th); x.lineTo(tx + 14, ty); x.closePath(); x.fill();
      }
      // พื้นดิน
      var gr = x.createLinearGradient(0, h * 0.7, 0, h);
      gr.addColorStop(0, curPal.ground); gr.addColorStop(1, '#040a08');
      x.fillStyle = gr; x.fillRect(0, h * 0.7, w, h * 0.3);
    });
    skyCache = makeSprite(W, H, function (x, w, h) {
      var gr = x.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, curPal.sky[0]); gr.addColorStop(0.55, curPal.sky[1]); gr.addColorStop(1, curPal.sky[2]);
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
    });
    mistCache = makeSprite(Math.round(W / 2), 90, function (x, w, h) {
      var i;
      for (i = 0; i < 7; i++) {
        var gx = (i / 7) * w + 20;
        var g2 = x.createRadialGradient(gx, h / 2, 4, gx, h / 2, 70);
        g2.addColorStop(0, 'rgba(220,235,225,.16)'); g2.addColorStop(1, 'rgba(220,235,225,0)');
        x.fillStyle = g2; x.fillRect(0, 0, w, h);
      }
    });
  }

  /* ---------------- particles ---------------- */
  function seedMotes() {
    var q = QUALITY[S.quality] || QUALITY.medium;
    motes = [];
    var i;
    for (i = 0; i < q.motes; i++) {
      motes.push({ x: Math.random(), y: Math.random() * 0.85, s: 0.6 + Math.random() * 1.8, ph: Math.random() * 6.28, sp: 0.008 + Math.random() * 0.02 });
    }
  }

  /* ---------------- วาด ---------------- */
  function drawTree(t, time, gust) {
    if (!t.sprite || t.g <= 0.01) return;
    var depth = t.layer === 2 ? 1 : 0.45;
    var boost = 0;
    if (!reduced && PM.x > -9000) {
      var pdx = bx - PM.x, pdy = by - PM.y;
      var pd = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pd < 260) boost = (1 - pd / 260) * 0.9;
    }
    var sway = (Math.sin(time * (0.6 + t.phase * 0.7) + t.phase * 6.28) * 0.012 * (1 + boost * 2) + (gust + gustBoost) * 0.035) * depth;
    if (reduced) sway = 0;
    var e = easeOutCubic(t.g);
    var sc = (0.25 + 0.75 * e) * (H / 800 > 1.4 ? 1.15 : 1);
    var bx = t.x * W + mx * 14 * depth, by = H * (t.layer === 2 ? 0.97 : 0.99);
    try {
      cx.save();
      cx.translate(bx, by);
      cx.rotate(sway);
      cx.globalAlpha = clamp(t.g * 3, 0, 1);
      if (t.glow && !reduced) { cx.shadowColor = 'rgba(255,230,150,.85)'; cx.shadowBlur = 22; }
      cx.drawImage(t.sprite, (-t.sw * sc) / 2, -t.sh * sc, t.sw * sc, t.sh * sc);
      cx.restore();
      cx.globalAlpha = 1;
      cx.shadowBlur = 0;
    } catch (err) {}
  }
  var mistX = [0, 0.4, 0.7, 0.25];
  /* Phase 3: pointer/scroll parallax + celebration */
  var PM = { x: -9999, y: -9999 };
  var scrollSm = 0, gustBoost = 0, burstGlow = 0;
  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    // auto-degrade: เฟรมช้าเรื้อรัง → ลดอนุภาค
    if (!reduced) {
      if (dt > 0.028) { slowFrames++; } else if (slowFrames > 0) { slowFrames--; }
      if (slowFrames > 90 && !degraded) { degraded = true; motes = motes.slice(0, Math.ceil(motes.length / 2)); }
    }
    var time = now / 1000;
    var _d = new Date();
    var pn = paletteNow(_d.getHours() + _d.getMinutes() / 60);
    if (pn.key !== curPalKey) { curPal = pn.pal; curPalKey = pn.key; farCache = null; }
    if (!farCache) buildFar();
    // Phase 3: scroll parallax (lerp นุ่ม, clamp กันขอบโผล่)
    var targetScroll = 0;
    try { targetScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0; } catch (e) {}
    scrollSm += (targetScroll - scrollSm) * Math.min(1, dt * 3);
    var scrollShift = clamp(scrollSm * 0.02, -20, 20);
    gustBoost = Math.max(0, gustBoost - dt * 0.4);
    var gust = Math.max(0, Math.sin(time * 0.13) + Math.sin(time * 0.047 + 1.7) - 1.15) * 0.5 + S.weather.wind * 0.5;
    // เติบโต + งอกใหม่
    var target = targetCount(), i, t;
    var alive = 0;
    for (i = 0; i < S.trees.length; i++) { if (!S.trees[i].shrink) alive++; }
    spawnTimer -= dt;
    if (alive < target && spawnTimer <= 0) { spawnSapling(); spawnTimer = 4 + Math.random() * 6; }
    for (i = S.trees.length - 1; i >= 0; i--) {
      t = S.trees[i];
      if (t.shrink) {
        t.g -= dt * 0.4;
        if (t.g <= 0) S.trees.splice(i, 1);
      } else if (t.g < 1) {
        t.g = Math.min(1, t.g + dt * 0.03 * (1 - t.g) + dt * 0.004);
      }
    }
    if (alive > target + 6) {
      // ข้อมูลถูกแก้ลด → ค่อยๆ ถอนต้นเกิน (ย้อนกลับได้)
      var excess = alive - target, k = 0;
      for (i = S.trees.length - 1; i >= 0 && k < excess; i--) {
        if (!S.trees[i].shrink && !S.trees[i].glow && S.trees[i].g > 0.5) { S.trees[i].shrink = true; k++; }
      }
    }
    // ใบไม้ร่วงนานๆ ที
    leafTimer -= dt * (1 + S.weather.rain * 2 + S.weather.wind);
    if (leafTimer <= 0 && leaves.length < 6 && !reduced) {
      leaves.push({ x: Math.random(), y: -0.02, vy: 0.05 + Math.random() * 0.05, ph: Math.random() * 6.28, s: 3 + Math.random() * 4 });
      leafTimer = 4 + Math.random() * 6;
    }
    saveTimer -= dt;
    if (saveTimer <= 0) { saveState(); saveTimer = 20; }

    /* ---- render ---- */
    try {
      cx.clearRect(0, 0, W, H);
      cx.drawImage(skyCache, 0, 0, W, H);
      var os = 0.035; // overscan กันขอบโผล่ตอน parallax
      cx.drawImage(farCache, -W * os + mx * -10, -H * os + scrollShift, W * (1 + os * 2), H * (1 + os * 2));
      var q = QUALITY[S.quality] || QUALITY.medium;
      // หมอกหลัง
      var m;
      for (m = 0; m < Math.min(2, q.mist); m++) {
        var mox = ((mistX[m] + time * 0.004 * (m + 1)) % 1.4) - 0.2;
        cx.globalAlpha = 0.5 + S.weather.rain * 0.4;
        cx.drawImage(mistCache, mox * W - W * 0.1, H * (0.42 + m * 0.1) + scrollSm * 0.03, W * 1.1, 90);
      }
      cx.globalAlpha = 1;
      // ต้นชั้นกลาง → ต้นใกล้ (เรียงตาม y)
      for (i = 0; i < S.trees.length; i++) { t = S.trees[i]; if (t.layer === 1) drawTree(t, time, gust); }
      for (i = 0; i < S.trees.length; i++) { t = S.trees[i]; if (t.layer === 2) drawTree(t, time, gust); }
      // หมอกหน้า
      for (m = 2; m < q.mist; m++) {
        var mox2 = ((mistX[m] + time * 0.006 * (m - 1)) % 1.4) - 0.2;
        cx.globalAlpha = 0.65 + S.weather.rain * 0.3;
        cx.drawImage(mistCache, mox2 * W - W * 0.1, H * (0.6 + (m - 2) * 0.09) + scrollSm * 0.04, W * 1.1, 90);
      }
      cx.globalAlpha = 1;
      // Phase 3: แสงฉลอง (toast/XP/ไดอารี่) — วูบทองจางๆ
      if (burstGlow > 0.01) {
        try {
          cx.save();
          cx.globalAlpha = clamp(burstGlow, 0, 1) * 0.14;
          var bg2 = cx.createRadialGradient(W / 2, H * 0.6, 10, W / 2, H * 0.6, W * 0.5);
          bg2.addColorStop(0, '#ffe9a8'); bg2.addColorStop(1, 'rgba(255,233,168,0)');
          cx.fillStyle = bg2; cx.fillRect(0, 0, W, H);
          cx.restore();
          cx.globalAlpha = 1;
        } catch (e2) {}
        burstGlow = Math.max(0, burstGlow - dt * 0.5);
      }
      // god rays
      if (q.rays && !reduced) {
        cx.save();
        cx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 0.1);
        cx.translate(W * 0.7, -H * 0.1); cx.rotate(0.35 + 0.03 * Math.sin(time * 0.07));
        var rg = cx.createLinearGradient(0, 0, 0, H);
        rg.addColorStop(0, curPal.ray); rg.addColorStop(1, 'rgba(255,255,255,0)');
        cx.fillStyle = rg;
        cx.fillRect(-W * 0.12, 0, W * 0.1, H * 1.2);
        cx.fillRect(W * 0.02, 0, W * 0.05, H * 1.2);
        cx.restore();
        cx.globalAlpha = 1;
      }
      // ละออง/หิ่งห้อย
      var fire = curPal.firefly;
      for (i = 0; i < motes.length; i++) {
        var mo = motes[i];
        if (!reduced) {
          mo.y -= mo.sp * dt * (0.5 + S.weather.wind);
          mo.x += Math.sin(time * 0.5 + mo.ph) * 0.0004 + S.weather.wind * dt * 0.02;
          if (mo.y < -0.02) { mo.y = 0.9; mo.x = Math.random(); }
        }
        var tw = fire ? (0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + mo.ph))) : (0.25 + 0.2 * Math.sin(time + mo.ph));
        cx.globalAlpha = clamp(tw, 0, 1);
        cx.fillStyle = fire ? '#ffe9a8' : curPal.mote;
        var ms = mo.s * (fire ? 1.6 : 1);
        cx.fillRect(mo.x * W, mo.y * H, ms, ms);
      }
      cx.globalAlpha = 1;
      // ใบไม้ร่วง (รองรับ delay จาก celebrate)
      for (i = leaves.length - 1; i >= 0; i--) {
        var lf = leaves[i];
        if (lf.delay > 0) { lf.delay -= dt; continue; }
        if (!reduced) {
          lf.y += lf.vy * dt;
          lf.x += Math.sin(time * 2 + lf.ph) * 0.0008;
        }
        if (lf.y > 1.02) { leaves.splice(i, 1); continue; }
        cx.save();
        cx.translate(lf.x * W, lf.y * H);
        cx.rotate(lf.ph + time * 1.5);
        cx.globalAlpha = 0.75;
        cx.fillStyle = '#3f7a44';
        cx.beginPath(); cx.ellipse(0, 0, lf.s, lf.s * 0.45, 0, 0, 6.2832); cx.fill();
        cx.restore();
      }
      cx.globalAlpha = 1;
    } catch (err) {}
  }

  /* ---------------- Phase 3: ฉลอง (toast → ใบไม้ร่วงพรู) ---------------- */
  function celebrate(n) {
    n = clamp(Math.round(n || 10), 1, 24);
    if (reduced) return;
    var i;
    for (i = 0; i < n; i++) {
      if (leaves.length >= 26) break;
      leaves.push({
        x: Math.random(), y: -0.02 - Math.random() * 0.1,
        vy: 0.06 + Math.random() * 0.06, ph: Math.random() * 6.28,
        s: 3 + Math.random() * 4, delay: Math.random() * 1.2
      });
    }
    burstGlow = 1;
    gustBoost = Math.min(1.2, gustBoost + 0.7);
  }

  /* ---------------- สถานะป่า (แผง) ---------------- */
  function status() {
    var r = realData(), g = growthOf(r), st = stageOf(g);
    var tc = targetCount();
    var next = null, i;
    for (i = 0; i < STAGES.length; i++) {
      if (g < STAGES[i].at) { next = STAGES[i]; break; }
    }
    return {
      growth: Math.round(g * 100), stage: st.name, icon: st.icon,
      trees: S.trees.length, target: tc,
      memories: r.diaryDays, xp: r.xp,
      next: next ? (next.icon + ' ' + next.name + ' ที่ ' + Math.round(next.at * 100) + '%') : 'ถึงขีดสุดแล้ว ✨'
    };
  }
  function paintStatus() {
    var el = $('forestStatus');
    if (!el) return;
    try {
      var s = status();
      el.innerHTML = '<div class="fstat-top"><span class="fstat-stage">' + s.icon + ' ' + s.stage + '</span>' +
        '<span class="fstat-pct">' + s.growth + '%</span></div>' +
        '<div class="fstat-bar"><i style="width:' + s.growth + '%"></i></div>' +
        '<div class="fstat-meta">🌱 ต้นไม้ ' + s.trees + '/' + s.target + ' · 📓 ความทรงจำ ' + s.memories +
        ' วัน<br>→ ต่อไป: ' + s.next + '</div>';
    } catch (e) {}
  }

  /* ---------------- ควบคุม ---------------- */
  function setEnabled(on) {
    S.enabled = !!on;
    saveState();
    var c = $('forest-bg'), v = $('forest-veil');
    if (c) c.style.display = S.enabled ? '' : 'none';
    if (v) v.style.display = S.enabled ? '' : 'none';
    if (S.enabled) startLoop(); else stopLoop();
    paintToggle();
  }
  function setQuality(qn) {
    if (!QUALITY[qn]) return;
    S.quality = qn;
    degraded = false;
    saveState();
    resize(); seedMotes();
    var sel = $('forestQuality');
    if (sel) sel.value = qn;
  }
  function paintToggle() {
    var b = $('forestToggle');
    if (b) { b.textContent = S.enabled ? '🌲 ป่า: เปิด' : '🌲 ป่า: ปิด'; b.classList.toggle('off', !S.enabled); }
  }
  function startLoop() {
    if (running || !cx || !S.enabled) return;
    if (reduced) { drawOnce(); return; } // reduced-motion: วาดนิ่งเฟรมเดียว
    running = true; lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
    try { cancelAnimationFrame(rafId); } catch (e) {}
  }
  function drawOnce() {
    // เฟรมนิ่งสำหรับ reduced-motion
    try {
      var _d = new Date();
      var pn = paletteNow(_d.getHours() + _d.getMinutes() / 60);
      curPal = pn.pal; curPalKey = pn.key;
      if (!farCache) buildFar();
      cx.clearRect(0, 0, W, H);
      cx.drawImage(skyCache, 0, 0, W, H);
      cx.drawImage(farCache, 0, 0, W, H);
      var i;
      for (i = 0; i < S.trees.length; i++) drawTree(S.trees[i], 0, 0);
    } catch (e) {}
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (!setupCanvas()) return;
    try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if ((window.innerWidth || 1280) < 700 && S.quality === 'high') S.quality = 'medium';
    // มือถือมาก + ประหยัดดาต้า → low
    try {
      if ((window.innerWidth || 1280) < 420 && (!loadState())) S.quality = 'low';
    } catch (e2) {}
    resize();
    seedMotes();
    syncGlow();
    // ปุ่ม/แผง
    var fab = $('forestFab'), pop = $('forestPop');
    if (fab && pop) fab.addEventListener('click', function () { pop.classList.toggle('open'); paintStatus(); });
    var close = $('forestClose');
    if (close) close.addEventListener('click', function () { if (pop) pop.classList.remove('open'); });
    var tg = $('forestToggle');
    if (tg) tg.addEventListener('click', function () { setEnabled(!S.enabled); });
    var sel = $('forestQuality');
    if (sel) {
      sel.value = S.quality;
      sel.addEventListener('change', function () { setQuality(sel.value); });
    }
    paintToggle(); paintStatus();
    setInterval(function () { syncGlow(); paintStatus(); saveState(); }, 60000);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stopLoop(); saveState(); }
      else { syncGlow(); startLoop(); }
    });
    window.addEventListener('resize', function () {
      if (window.__forestRz) clearTimeout(window.__forestRz);
      window.__forestRz = setTimeout(resize, 250);
    });
    window.addEventListener('mousemove', function (e) {
      if (reduced) return;
      try {
        mx = (e.clientX / (window.innerWidth || 1) - 0.5) * 2;
        PM.x = e.clientX; PM.y = e.clientY;
      } catch (e2) {}
    }, { passive: true });
    // Phase 3: toast ใหม่ = ฉลองในป่า (observer อย่างเดียว ไม่แตะโค้ดเดิม)
    try {
      if (typeof MutationObserver !== 'undefined') {
        var toasts = $('os-toasts');
        if (toasts) {
          new MutationObserver(function (muts) {
            var added = 0, i, j;
            for (i = 0; i < muts.length; i++) {
              if (muts[i].addedNodes) for (j = 0; j < muts[i].addedNodes.length; j++) added++;
            }
            if (added > 0) celebrate(8 + Math.min(8, added * 4));
          }).observe(toasts, { childList: true });
        }
      }
    } catch (e4) {}
    try {
      var mm = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mm && mm.addEventListener) mm.addEventListener('change', function () { location.reload(); });
    } catch (e3) {}
    if (!S.enabled) { setEnabled(false); }
    else startLoop();
    window.ET1FOREST = {
      status: status,
      refresh: function () { syncGlow(); paintStatus(); saveState(); },
      celebrate: celebrate,
      setEnabled: setEnabled, setQuality: setQuality,
      setWeather: function (w) {
        if (!w) return;
        if (typeof w.rain === 'number') S.weather.rain = clamp(w.rain, 0, 1);
        if (typeof w.wind === 'number') S.weather.wind = clamp(w.wind, 0, 1);
      }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
