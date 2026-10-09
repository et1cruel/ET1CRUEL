/* ============================================================
   ET1CRUEL LUCKY MOUSE — Phase 4: หนูขาวตัวเล็ก 🐭
   - วาดด้วย canvas vector ล้วน (ไม่อิโมจิ) ~40px, หูชมพู ตาแดง หางยาว
   - เดินบนพื้นจอ + ขอบบนการ์ด/section (getBoundingClientRect, ไม่แตะโค้ดเดิม)
   - state machine: walk/sit/sniff/groom/look/dig/sleep/run/hide/fall/jump/curious/flee
   - คลิก = จี๊ด (Web Audio เบามาก) + กระโดด + หัวใจ · ดับเบิลคลิก = ถือเหรียญ
   - layer ตัวเอง pointer-events:none ยกเว้นตัวหนู · รอยเท้าจางๆ
   - จำชื่อ/เปิด-ปิด/ขนาด (et1_mouse_v1) · เคารพ reduced-motion
   ============================================================ */
(function () {
  'use strict';
  var LS = 'et1_mouse_v1';
  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var S = { enabled: true, size: 1, name: 'ลัคกี้ไมซ์' };
  (function restore() {
    try {
      var o = JSON.parse(localStorage.getItem(LS) || 'null');
      if (!o) return;
      if (typeof o.enabled === 'boolean') S.enabled = o.enabled;
      if (o.size === 0.8 || o.size === 1 || o.size === 1.3) S.size = o.size;
      if (typeof o.name === 'string' && o.name.trim()) S.name = o.name.trim().slice(0, 24);
    } catch (e) {}
  })();
  function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
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

  var layer = null, cv = null, cx = null, W = 0, H = 0;
  var running = false, rafId = 0, lastT = 0, reduced = false;
  var PM = { x: -9999, y: -9999 };
  var surfaces = []; // {l,r,y}
  var hearts = [];
  var M = null;

  function floorY() { return H - 24; }
  function newMouse() {
    return {
      x: W * 0.3, y: floorY(), face: 1, state: 'sit', t: 0, dur: 2,
      target: null, surf: null, vy: 0, hop: 0, coin: 0, blink: rnd(1, 4),
      alpha: 1, hideX: 0, sniffN: 0
    };
  }
  function collect() {
    surfaces = [];
    try {
      var els = document.querySelectorAll('section.card,.treasury,.hero,.cover');
      var i, r;
      for (i = 0; i < els.length; i++) {
        r = els[i].getBoundingClientRect();
        if (r.width > 240 && r.top > 90 && r.top < H - 60) {
          surfaces.push({ l: r.left + 14, r: r.right - 14, y: r.top });
        }
      }
    } catch (e) {}
  }
  function surfAt(x, yTol) {
    // พื้นผิวใต้เท้า (การ์ดที่เท้าเหยียบอยู่) ไม่งั้นพื้นจอ
    var i, best = null;
    for (i = 0; i < surfaces.length; i++) {
      var s = surfaces[i];
      if (x >= s.l && x <= s.r && Math.abs(s.y - M.y) < (yTol || 60)) {
        if (!best || s.y > best.y) best = s;
      }
    }
    return best;
  }
  function setState(st, dur) {
    M.state = st; M.t = 0; M.dur = dur || rnd(2, 4);
    M.target = null;
  }
  function nextIdle() {
    var roll = Math.random();
    if (roll < 0.34) startWalk(false);
    else if (roll < 0.46) setState('sniff', rnd(1.5, 2.5));
    else if (roll < 0.56) setState('groom', rnd(2, 3.5));
    else if (roll < 0.66) setState('look', rnd(1.5, 2.5));
    else if (roll < 0.72) setState('sit', rnd(2, 4));
    else if (roll < 0.79) setState('dig', rnd(2, 3));
    else if (roll < 0.86) setState('sleep', rnd(6, 10));
    else if (roll < 0.91) { setState('hide', rnd(2.5, 4)); }
    else if (roll < 0.96) startWalk(true);
    else goHome();
  }
  function startWalk(run) {
    // เลือกเป้า: พื้นจอ 70% / ขอบการ์ด 30%
    var useCard = Math.random() < 0.3 && surfaces.length > 0;
    if (useCard) {
      var s = pick(surfaces);
      M.target = { x: rnd(s.l + 20, s.r - 20), y: s.y, surf: s };
    } else {
      M.target = { x: rnd(40, W - 40), y: floorY(), surf: null };
    }
    // กระโดดถ้าต่างระดับเกิน 40px
    if (Math.abs(M.target.y - M.y) > 40) {
      M.from = { x: M.x, y: M.y };
      setState('jump', clamp(Math.abs(M.target.x - M.x) / 160 + 0.4, 0.45, 1.1));
    } else {
      setState(run ? 'run' : 'walk', 12);
    }
  }
  function goHome() {
    M.target = { x: W * 0.15, y: floorY(), surf: null };
    if (Math.abs(M.y - floorY()) > 40) {
      M.from = { x: M.x, y: M.y };
      setState('jump', 0.8);
    } else setState('walk', 12);
  }

  /* ---------------- update ---------------- */
  function step(dt, time) {
    M.t += dt;
    M.blink -= dt;
    if (M.blink < -0.12) M.blink = rnd(2, 5);
    if (M.hop > 0) M.hop = Math.max(0, M.hop - dt * 3);
    if (M.coin > 0) M.coin -= dt;
    var i;
    for (i = trail.length - 1; i >= 0; i--) {
      trail[i].a -= dt * 0.15;
      if (trail[i].a <= 0) trail.splice(i, 1);
    }
    for (i = hearts.length - 1; i >= 0; i--) {
      hearts[i].y -= dt * 26; hearts[i].life -= dt;
      if (hearts[i].life <= 0) hearts.splice(i, 1);
    }
    // pointer: สนใจ / ตกใจ (เช็กทุก ~0.4 วิ)
    M._pc = (M._pc || 0) - dt;
    if (M._pc <= 0 && (M.state === 'walk' || M.state === 'sit' || M.state === 'sniff' || M.state === 'look')) {
      M._pc = 0.4;
      var dx = PM.x - M.x, dy = PM.y - (M.y - 14);
      if (PM.x > -9000 && dx * dx + dy * dy < 120 * 120) {
        if (Math.random() < 0.5) {
          M.target = { x: clamp(PM.x + (dx > 0 ? -70 : 70), 30, W - 30), y: M.surf ? M.surf.y : floorY(), surf: M.surf || null };
          setState('curious', 3);
        } else {
          M.face = dx > 0 ? -1 : 1;
          M.target = { x: clamp(M.x + (dx > 0 ? -220 : 220), 30, W - 30), y: M.surf ? M.surf.y : floorY(), surf: M.surf || null };
          setState('run', 2.5);
        }
      }
    }
    switch (M.state) {
      case 'walk': case 'run': case 'curious':
        walkTo(dt, M.state === 'run' ? 150 : M.state === 'curious' ? 46 : 52);
        break;
      case 'jump': {
        var k = clamp(M.t / M.dur, 0, 1);
        M.x = M.from.x + (M.target.x - M.from.x) * k;
        M.y = M.from.y + (M.target.y - M.from.y) * k - Math.sin(k * Math.PI) * clamp(Math.abs(M.target.y - M.from.y) * 0.4 + 60, 60, 220);
        M.face = M.target.x >= M.from.x ? 1 : -1;
        if (k >= 1) { M.y = M.target.y; M.surf = M.target.surf || null; M.target = null; setState('sniff', 1.6); }
        break;
      }
      case 'fall':
        M.vy += dt * 900;
        M.y += M.vy * dt;
        if (M.y >= floorY()) { M.y = floorY(); M.surf = null; M.vy = 0; puff(3); setState('sit', 1.5); }
        break;
      case 'hide':
        M.alpha = M.t < M.dur * 0.3 ? Math.max(0, 1 - M.t * 4) : (M.t > M.dur * 0.7 ? Math.min(1, (M.t - M.dur * 0.7) * 4) : 0);
        if (M.t >= M.dur) {
          // โผล่ที่ใหม่
          M.x = rnd(60, W - 60); M.y = floorY(); M.surf = null; M.alpha = 1;
          setState('look', 2);
        }
        break;
      case 'dig':
        if (M.t >= M.dur) { puff(4); nextIdle(); }
        break;
      case 'sleep':
        if (M.t >= M.dur) nextIdle();
        break;
      default:
        if (M.t >= M.dur) nextIdle();
    }
    // รอยเท้าตอนเดินบนพื้น
    if ((M.state === 'walk' || M.state === 'run') && !M.surf && Math.random() < dt * 1.4 && trail.length < 20) {
      trail.push({ x: M.x - M.face * 8, y: M.y + 2, a: 0.5 });
    }
  }
  function walkTo(dt, speed) {
    if (!M.target) { nextIdle(); return; }
    var dx = M.target.x - M.x;
    if (Math.abs(dx) < 4) { M.surf = M.target.surf || null; M.target = null; setState('sniff', 1.4); return; }
    M.face = dx > 0 ? 1 : -1;
    M.x += M.face * speed * dt;
    var edge = M.surf;
    if (edge && (M.x < edge.l || M.x > edge.r)) {
      // เดินตกขอบ → ร่วงลงพื้น
      M.surf = null; M.target = null; M.vy = 0;
      setState('fall', 5);
      return;
    }
    if (!edge) M.y = floorY();
    else M.y = edge.y;
    if (M.x < 24 || M.x > W - 24) { M.x = clamp(M.x, 24, W - 24); M.target = null; nextIdle(); }
    if (M.t >= M.dur) { M.target = null; nextIdle(); }
  }
  function puff(n) {
    var i;
    for (i = 0; i < n && hearts.length < 12; i++) {
      hearts.push({ x: M.x + rnd(-8, 8), y: M.y - 18, vy: 0, life: 0.7, ch: '·', col: 'rgba(200,180,150,.8)' });
    }
  }

  /* ---------------- เสียงจี๊ด (เบามาก) ---------------- */
  function squeak() {
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      var ac = new Ctor();
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (e) {} }
      var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(2700, t);
      o.frequency.exponentialRampToValueAtTime(3400, t + 0.07);
      o.frequency.exponentialRampToValueAtTime(2400, t + 0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(ac.destination);
      o.start(t); o.stop(t + 0.22);
      setTimeout(function () { try { ac.close(); } catch (e2) {} }, 600);
    } catch (e3) {}
  }

  /* หนู+รอยเท้า+หัวใจ วาดบน canvas เต็มจอใบเดียว (layer โปร่งใส)
     เพื่อให้รอยเท้าอยู่กับที่แม้หนูเดินไปแล้ว */
  var trail = []; // {x,y,a}
  function drawAll(time) {
    try {
      cx.clearRect(0, 0, W, H);
      var i;
      for (i = trail.length - 1; i >= 0; i--) {
        var pr = trail[i];
        pr.a -= 1 / 60 * 0.12;
        if (pr.a <= 0) { trail.splice(i, 1); continue; }
        cx.globalAlpha = clamp(pr.a, 0, 0.45);
        cx.fillStyle = '#fff';
        cx.beginPath(); cx.ellipse(pr.x - 2, pr.y, 1.6, 2.2, 0, 0, 6.2832); cx.fill();
        cx.beginPath(); cx.ellipse(pr.x + 2, pr.y, 1.6, 2.2, 0, 0, 6.2832); cx.fill();
      }
      for (i = hearts.length - 1; i >= 0; i--) {
        var hh = hearts[i];
        cx.globalAlpha = clamp(hh.life, 0, 1);
        cx.fillStyle = hh.col;
        cx.font = '13px sans-serif';
        cx.fillText(hh.ch, hh.x - 5, hh.y);
      }
      cx.globalAlpha = 1;
      drawMouse(time);
    } catch (e) {}
  }
  function drawMouse(time) {
    var s = 1.05 * S.size;
    var walking = (M.state === 'walk' || M.state === 'run' || M.state === 'curious');
    var bob = walking ? Math.sin(time * (M.state === 'run' ? 16 : 10)) * 1.6 : Math.sin(time * 2) * 0.6;
    var hopY = M.hop > 0 ? -Math.sin(M.hop * Math.PI) * 16 : 0;
    try {
      cx.save();
      cx.translate(M.x, M.y + bob * 0.4 + hopY);
      cx.scale(M.face * s, s);
      cx.globalAlpha = clamp(M.alpha, 0, 1);
      var t = time;
      if (M.state === 'sleep') {
        // นอน: ตัวเตี้ย ตาปิด z ลอย
        cx.fillStyle = '#f4f4f6';
        cx.beginPath(); cx.ellipse(0, 3, 17, 8.5, 0, 0, 6.2832); cx.fill();
        cx.fillStyle = '#e3e3e8';
        cx.beginPath(); cx.ellipse(0, 6, 13, 4.5, 0, 0, 6.2832); cx.fill();
        cx.fillStyle = '#f4f4f6';
        cx.beginPath(); cx.arc(12, -1, 7, 0, 6.2832); cx.fill();
        cx.strokeStyle = '#555'; cx.lineWidth = 1.2;
        cx.beginPath(); cx.moveTo(13, -3); cx.lineTo(17, -3); cx.stroke(); // ตาปิด
        cx.fillStyle = '#f2a0b5';
        cx.beginPath(); cx.arc(18.5, 0, 1.6, 0, 6.2832); cx.fill(); // จมูก
        cx.fillStyle = '#c9a0dc';
        cx.font = 'bold 9px sans-serif';
        cx.fillText('z', 16, -12 - ((t * 8) % 8));
        cx.fillText('z', 22, -18 - ((t * 8) % 8));
      } else {
        var groomPose = M.state === 'groom';
        var sniffK = M.state === 'sniff' ? Math.sin(t * 14) * 1.2 : 0;
        // หาง
        cx.strokeStyle = '#d9b8c4'; cx.lineWidth = 2; cx.lineCap = 'round';
        cx.beginPath(); cx.moveTo(-14, -4);
        cx.quadraticCurveTo(-24, -2 + Math.sin(t * 3) * 2, -28, 6 + Math.sin(t * 2.2) * 2);
        cx.stroke();
        // เท้าหลัง/หน้า (สลับตอนเดิน)
        var ph = walking ? Math.sin(t * (M.state === 'run' ? 16 : 10)) : 0;
        cx.fillStyle = '#f2a0b5';
        cx.beginPath(); cx.ellipse(-6, 9 + ph, 4, 2.4, 0, 0, 6.2832); cx.fill();
        cx.beginPath(); cx.ellipse(8, 9 - ph, 4, 2.4, 0, 0, 6.2832); cx.fill();
        // ตัว
        cx.fillStyle = '#fdfdfd';
        cx.beginPath(); cx.ellipse(0, 0, 17, 10.5, 0, 0, 6.2832); cx.fill();
        cx.fillStyle = 'rgba(120,130,150,.14)';
        cx.beginPath(); cx.ellipse(0, 5, 12.5, 4.5, 0, 0, 6.2832); cx.fill();
        // หัว
        var hx = 13 + sniffK, hy = M.state === 'look' ? -13 : -9;
        cx.fillStyle = '#fdfdfd';
        cx.beginPath(); cx.arc(hx, hy, 7.5, 0, 6.2832); cx.fill();
        // หู (หูกระดิกตอน curious)
        var wig = M.state === 'curious' ? Math.sin(t * 10) * 1.5 : 0;
        cx.fillStyle = '#fdfdfd';
        cx.beginPath(); cx.arc(hx - 4, hy - 8, 4.4, 0, 6.2832); cx.fill();
        cx.fillStyle = '#f2a0b5';
        cx.beginPath(); cx.arc(hx - 4, hy - 8 + wig * 0.3, 2.2, 0, 6.2832); cx.fill();
        // ตาแดง (กะพริบ)
        if (M.blink < 0) {
          cx.strokeStyle = '#a33'; cx.lineWidth = 1.2;
          cx.beginPath(); cx.moveTo(hx + 1, hy - 1.5); cx.lineTo(hx + 4.5, hy - 1.5); cx.stroke();
        } else {
          cx.fillStyle = '#c03040';
          cx.beginPath(); cx.arc(hx + 2.8, hy - 1.5, 1.7, 0, 6.2832); cx.fill();
          cx.fillStyle = '#fff';
          cx.beginPath(); cx.arc(hx + 3.3, hy - 2, 0.6, 0, 6.2832); cx.fill();
        }
        // จมูกชมพู
        cx.fillStyle = '#f27fa0';
        cx.beginPath(); cx.arc(hx + 7, hy + 1.5 + sniffK * 0.4, 1.7, 0, 6.2832); cx.fill();
        // หนวด
        cx.strokeStyle = 'rgba(150,150,160,.7)'; cx.lineWidth = 0.7;
        cx.beginPath(); cx.moveTo(hx + 6, hy + 1); cx.lineTo(hx + 13, hy - 1); cx.stroke();
        cx.beginPath(); cx.moveTo(hx + 6, hy + 2.5); cx.lineTo(hx + 13, hy + 3.5); cx.stroke();
        // ท่าล้างหน้า: อุ้งเท้าขึ้นแตะหน้า
        if (groomPose) {
          cx.fillStyle = '#f2a0b5';
          cx.beginPath(); cx.ellipse(hx + 2 + Math.sin(t * 9) * 2, hy + 3, 3, 2.2, 0, 0, 6.2832); cx.fill();
        }
        // ท่าขุด: ฝุ่น
        if (M.state === 'dig' && Math.random() < 0.3 && hearts.length < 14) {
          hearts.push({ x: M.x + M.face * rnd(10, 18), y: M.y - rnd(2, 8), life: 0.6, ch: '·', col: 'rgba(200,180,150,.9)' });
        }
        // เหรียญ (ดับเบิลคลิก)
        if (M.coin > 0) {
          cx.fillStyle = '#FBBF24';
          cx.beginPath(); cx.arc(hx + 2, hy - 14, 5, 0, 6.2832); cx.fill();
          cx.fillStyle = '#92400E';
          cx.font = 'bold 7px sans-serif';
          cx.fillText('฿', hx - 1, hy - 11.5);
        }
      }
      cx.restore();
      cx.globalAlpha = 1;
    } catch (e) {}
  }

  /* ---------------- loop ---------------- */
  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    step(dt, now / 1000);
    drawAll(now / 1000);
  }
  function startLoop() {
    if (running || !cx || !S.enabled) return;
    if (reduced) { drawStill(); return; }
    running = true; lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    running = false;
    try { cancelAnimationFrame(rafId); } catch (e) {}
  }
  function drawStill() {
    // reduced-motion: นั่งนิ่งเฟรมเดียว
    try { if (M.state !== 'sit' && M.state !== 'sleep') setState('sit', 9999); drawAll(0); } catch (e) {}
  }

  /* ---------------- เปิด/ปิด/ขนาด/ชื่อ ---------------- */
  function applySize() {
    var sel = $('mouseSize');
    if (sel) sel.value = String(S.size);
  }
  function setEnabled(on) {
    S.enabled = !!on; save();
    if (layer) layer.style.display = S.enabled ? '' : 'none';
    if (S.enabled) startLoop(); else stopLoop();
    var b = $('mouseToggle');
    if (b) b.textContent = '🐭 หนู: ' + (S.enabled ? 'เปิด' : 'ปิด');
  }
  function paintPanel() {
    var nm = $('mouseName');
    if (nm && document.activeElement !== nm) nm.value = S.name;
    applySize();
    var b = $('mouseToggle');
    if (b) b.textContent = '🐭 หนู: ' + (S.enabled ? 'เปิด' : 'ปิด');
  }

  /* ---------------- boot ---------------- */
  function boot() {
    layer = $('mouse-layer');
    cv = $('mouse-cv');
    if (!layer || !cv) return;
    try { cx = cv.getContext('2d'); } catch (e) { return; }
    if (!cx) return;
    try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e2) {}
    resize();
    collect();
    M = newMouse();
    setInterval(collect, 5000);
    var throttled = 0;
    window.addEventListener('scroll', function () {
      var n = Date.now();
      if (n - throttled > 200) { throttled = n; collect(); }
    }, { passive: true });
    window.addEventListener('resize', function () { resize(); collect(); });
    window.addEventListener('mousemove', function (e) {
      if (reduced) return;
      try { PM.x = e.clientX; PM.y = e.clientY; } catch (e3) {}
    }, { passive: true });
    // คลิกตัวหนู = จี๊ด + กระโดด + หัวใจ
    // (layer โปร่งใสทั้งชั้น ฟังคลิกระดับ document แล้ว hit-test เอง — ไม่บังปุ่มเดิม)
    function hitMouse(e) {
      if (!e) return false;
      var px = e.clientX, py = e.clientY;
      if (px == null || py == null) return false;
      var s = 48 * S.size;
      var dx = px - M.x, dy = py - (M.y - 10);
      return dx * dx + dy * dy <= s * s;
    }
    document.addEventListener('click', function (e) {
      if (reduced || !S.enabled || !hitMouse(e)) return;
      squeak();
      M.hop = 1;
      var i;
      for (i = 0; i < 3 && hearts.length < 14; i++) {
        hearts.push({ x: M.x + rnd(-10, 10), y: M.y - 22, life: 1.1, ch: '♥', col: '#F472B6' });
      }
    });
    document.addEventListener('dblclick', function (e) {
      if (reduced || !S.enabled || !hitMouse(e)) return;
      M.coin = 5;
      squeak();
      toast('🪙 ' + S.name + ' คาบเหรียญมาให้กำลังใจ!');
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopLoop();
      else startLoop();
    });
    // แผงควบคุม (อยู่ใน forestPop)
    var tg = $('mouseToggle');
    if (tg) tg.addEventListener('click', function () { setEnabled(!S.enabled); });
    var sz = $('mouseSize');
    if (sz) {
      sz.value = String(S.size);
      sz.addEventListener('change', function () {
        var v = parseFloat(sz.value);
        if (v === 0.8 || v === 1 || v === 1.3) { S.size = v; save(); }
      });
    }
    var nm = $('mouseName');
    if (nm) {
      nm.value = S.name;
      nm.addEventListener('change', function () {
        var v = (nm.value || '').trim().slice(0, 24);
        if (v) { S.name = v; save(); toast('🐭 ชื่อหนู: ' + S.name); }
        else nm.value = S.name;
      });
    }
    paintPanel();
    if (!S.enabled && layer) layer.style.display = 'none';
    else startLoop();
    window.ET1MOUSE = {
      state: function () { return { x: Math.round(M.x), y: Math.round(M.y), st: M.state, name: S.name }; },
      setEnabled: setEnabled,
      squeak: squeak
    };
  }
  function resize() {
    try {
      W = window.innerWidth || 1280; H = window.innerHeight || 800;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layer.style.width = W + 'px'; layer.style.height = H + 'px';
      if (M) { M.x = clamp(M.x, 24, W - 24); M.y = Math.min(M.y, floorY()); }
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
