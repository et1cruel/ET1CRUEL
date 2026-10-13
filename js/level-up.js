/* ============================================================
   ET1CRUEL LEVEL-UP OVERLAY — Phase 7 (Muse Spark)
   - แสดงฉลองตอน LV อัพจาก XP จริงใน `et1cruel_lifeos_v1`
   - สูตร LV เดียวกับ life-os-os.js: cumulative(L)=(L-1)*5000
   - ไม่แตะ key เดิม จำ LV ที่ฉลองแล้วใน `et1_levelup_v1`
   - self-contained: ฉีด CSS เอง + canvas particles ของตัวเอง
   - เคารพ prefers-reduced-motion / saveData / จอเล็ก
   ============================================================ */
(function () {
  'use strict';
  var LS_LIFE = 'et1cruel_lifeos_v1';
  var LS_SEEN = 'et1_levelup_v1';
  function levelOf(xp) { xp = +xp || 0; return Math.floor(xp / 5000) + 1; }
  function readXP() {
    try {
      var raw = localStorage.getItem(LS_LIFE);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o && o.character && typeof o.character.xp === 'number') return o.character.xp;
      if (typeof o.xp === 'number') return o.xp;
    } catch (e) {}
    return null;
  }
  function readSeen() {
    try { return JSON.parse(localStorage.getItem(LS_SEEN) || '{}'); }
    catch (e) { return {}; }
  }
  function writeSeen(s) { try { localStorage.setItem(LS_SEEN, JSON.stringify(s)); } catch (e) {} }
  function reduced() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      if (navigator.connection && navigator.connection.saveData) return true;
    } catch (e) {}
    return false;
  }
  function injectCSS() {
    if (document.getElementById('lvup-style')) return;
    var st = document.createElement('style');
    st.id = 'lvup-style';
    st.textContent = [
      '#lvup-veil{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;',
      ' background:radial-gradient(600px 300px at 50% 40%,rgba(74,222,128,.18),transparent 70%),rgba(4,5,9,.72);',
      ' pointer-events:none}',
      '#lvup-veil.show{display:flex}',
      '#lvup-card{text-align:center;padding:28px 36px;border:1px solid #4ADE80;border-radius:18px;',
      ' background:linear-gradient(180deg,#141a2b,#0b0d14);box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 30px rgba(74,222,128,.35);',
      ' animation:lvup-pop .45s ease-out}',
      '#lvup-card h2{font-family:"Chakra Petch","IBM Plex Sans Thai",sans-serif;font-size:34px;color:#fff;letter-spacing:.06em}',
      '#lvup-card h2 b{color:#4ADE80}',
      '#lvup-card p{color:#AAB4CC;font-size:14px;margin-top:6px}',
      '#lvup-card .lvup-lv{font-family:"Chakra Petch",sans-serif;font-size:52px;font-weight:700;color:#4ADE80;line-height:1.1}',
      '#lvup-cv{position:fixed;inset:0;z-index:81;pointer-events:none;display:none}',
      '#lvup-cv.show{display:block}',
      '@keyframes lvup-pop{from{transform:scale(.85) translateY(10px);opacity:0}to{transform:none;opacity:1}}',
      '@media(max-width:520px){#lvup-card h2{font-size:24px}#lvup-card .lvup-lv{font-size:38px}}',
      '@media(prefers-reduced-motion:reduce){#lvup-card{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function ensureDOM() {
    injectCSS();
    var veil = document.getElementById('lvup-veil');
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'lvup-veil';
      veil.innerHTML = '<div id="lvup-card"><h2>⚔ LEVEL <b>UP</b></h2><div class="lvup-lv" id="lvup-num">LV 22</div><p id="lvup-sub"></p></div>';
      document.body.appendChild(veil);
    }
    var cv = document.getElementById('lvup-cv');
    if (!cv) {
      cv = document.createElement('canvas');
      cv.id = 'lvup-cv';
      document.body.appendChild(cv);
    }
    return { veil: veil, cv: cv };
  }
  function burst(cv, n) {
    try {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.floor(innerWidth * dpr);
      cv.height = Math.floor(innerHeight * dpr);
      var ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      var P = [];
      var colors = ['#4ADE80', '#FBBF24', '#F4F6FB', '#6EE7B7'];
      for (var i = 0; i < (n || 90); i++) {
        P.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.42,
          vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3,
          s: Math.random() * 5 + 2, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
          c: colors[(Math.random() * colors.length) | 0], life: 1 });
      }
      var t0 = performance.now();
      (function frame(t) {
        if (!document.body.contains(cv)) return;
        var el = (t - t0) / 1600;
        if (el >= 1) { cv.classList.remove('show'); return; }
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (var k = 0; k < P.length; k++) {
          var p = P[k];
          p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life = 1 - el;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
          ctx.restore();
        }
        requestAnimationFrame(frame);
      })(t0);
    } catch (e) {}
  }
  function show(lv, xp) {
    var d = ensureDOM();
    var num = document.getElementById('lvup-num');
    var sub = document.getElementById('lvup-sub');
    if (num) num.textContent = 'LV ' + lv;
    if (sub) sub.textContent = 'XP ' + Number(xp).toLocaleString('en-US') + ' — ไปต่อสู่ LV ' + (lv + 1);
    d.veil.classList.add('show');
    if (!reduced()) { d.cv.classList.add('show'); burst(d.cv, innerWidth < 520 ? 50 : 110); }
    try {
      if (window.ET1FOREST && typeof window.ET1FOREST.celebrate === 'function') window.ET1FOREST.celebrate(12);
    } catch (e) {}
    setTimeout(function () { d.veil.classList.remove('show'); }, 2600);
  }
  function check(init) {
    var xp = readXP();
    if (xp === null) return;
    var lv = levelOf(xp);
    var seen = readSeen();
    if (init) { // จำ LV ปัจจุบันครั้งแรก กันเด้งตั้งแต่เปิดเว็บ
      if (!seen.base) { seen.base = lv; writeSeen(seen); }
      return;
    }
    if (lv > (seen.base || lv)) {
      seen.base = lv;
      writeSeen(seen);
      show(lv, xp);
    }
  }
  function watchToasts() {
    var box = document.getElementById('os-toasts');
    if (!box || !window.MutationObserver) return;
    try {
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var nodes = muts[i].addedNodes || [];
          for (var j = 0; j < nodes.length; j++) {
            var tx = (nodes[j].textContent || '').toUpperCase();
            if (tx.indexOf('LEVEL') !== -1 || tx.indexOf('เลเวล') !== -1) {
              setTimeout(function () { check(false); }, 300);
              return;
            }
          }
        }
      }).observe(box, { childList: true });
    } catch (e) {}
  }
  function boot() {
    ensureDOM();
    check(true);
    watchToasts();
    window.addEventListener('storage', function (e) { if (e.key === LS_LIFE) check(false); });
    setInterval(function () { check(false); }, 5000);
    window.ET1LEVELUP = { check: function () { check(false); }, test: function () { var xp = readXP() || 96500; show(levelOf(xp) + 1, xp); } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
