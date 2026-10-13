/* ET1CRUEL — Gold Rain FX (fx/gold-rain.js)
 * Self-contained: ฉีด <style> + canvas #goldrain-cv เอง ไม่มี dependency
 * API: window.ET1GOLDRAIN = { burst(n), test() }   // test() = burst(60)
 * Auto-hook: MutationObserver บน #os-toasts → toast ที่มี ฿/GOLD/เหรียญ/สำเร็จ → burst(30)
 * ประหยัดเครื่อง: prefers-reduced-motion / saveData / จอ <520px → ลดครึ่ง หรือไม่ร่วงเลย
 * Prefix ทั้งหมด: goldrain- / ET1GOLDRAIN (ไม่ชนกับ js/level-up.js)
 */
(function () {
  'use strict';

  var G = (window.ET1GOLDRAIN = window.ET1GOLDRAIN || {});

  /* ---------- Guard helpers ---------- */
  function safe(fn) {
    try { return fn(); } catch (e) { /* silent */ return undefined; }
  }

  /* ---------- Performance mode ---------- */
  function perfMode() {
    var reduced = false, saveData = false, narrow = false;
    safe(function () {
      reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    });
    safe(function () {
      var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      saveData = !!(c && c.saveData);
    });
    safe(function () {
      narrow = window.innerWidth < 520;
    });
    if (reduced || saveData) return 'off';   // ไม่ร่วงเลย เหลือแค่ toast
    if (narrow) return 'half';               // จอเล็ก → ลดครึ่ง
    return 'full';
  }

  /* ---------- Style + Canvas injection ---------- */
  function ensureCanvas() {
    if (!document.body) return null;
    var cv = document.getElementById('goldrain-cv');
    if (cv) return cv;
    safe(function () {
      if (!document.getElementById('goldrain-style')) {
        var st = document.createElement('style');
        st.id = 'goldrain-style';
        st.textContent = '#goldrain-cv{position:fixed;inset:0;width:100vw;height:100vh;z-index:65;pointer-events:none;}';
        (document.head || document.documentElement).appendChild(st);
      }
    });
    cv = document.createElement('canvas');
    cv.id = 'goldrain-cv';
    document.body.appendChild(cv);
    return cv;
  }

  var cv = null, ctx = null, raf = null, coins = [], dpr = 1;

  function resize() {
    if (!cv) return;
    dpr = safe(function () { return Math.min(window.devicePixelRatio || 1, 2); }) || 1;
    cv.width = Math.floor(window.innerWidth * dpr);
    cv.height = Math.floor(window.innerHeight * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  safe(function () {
    window.addEventListener('resize', resize, { passive: true });
  });

  /* ---------- Coin drawing ---------- */
  var R = 18; // รัศมีเหรียญ (px) — ใหญ่พออ่าน ฿ ชัด

  function drawCoin(c, t) {
    if (!ctx) return;
    // ส่ายซ้ายขวา
    var sway = Math.sin(t / 400 + c.phase) * c.swayAmp;
    var x = c.x + sway;
    var y = c.y;
    var alpha = Math.min(1, c.life / 0.3); // เกิดมาเต็มตา ค่อยจางตอนหมดอายุ

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    // ตัวเหรียญเป็นวงกลมเลยไม่ต้องหมุน — ฿ ตั้งตรงอ่านออกเสมอ
    try { ctx.shadowColor = 'rgba(251,191,36,.8)'; ctx.shadowBlur = 12; } catch (e) {}
    var grad = ctx.createLinearGradient(-R, -R, R, R);
    grad.addColorStop(0, '#FDE68A');
    grad.addColorStop(1, '#FBBF24');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    try { ctx.shadowBlur = 0; } catch (e) {}
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#B45309';
    ctx.stroke();
    ctx.fillStyle = '#92400E';
    ctx.font = 'bold ' + R + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('฿', 0, 1);
    ctx.restore();
  }

  /* ---------- Loop ---------- */
  function tick(ts) {
    if (!cv || !ctx) { raf = null; return; }
    var w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    var alive = [];
    for (var i = 0; i < coins.length; i++) {
      var c = coins[i];
      c.y += c.vy;
      c.x += c.vx;
      c.rot += c.vr;
      if (c.y >= 0) c.life -= 0.008; // เหนือจอไม่นับอายุ — กันตายก่อนเข้าจอ
      if (c.y < h + R * 2 && c.life > 0) {
        drawCoin(c, ts);
        alive.push(c);
      }
    }
    coins = alive;
    if (coins.length) {
      raf = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, w, h);
      raf = null;
    }
  }

  /* ---------- Burst API ---------- */
  function burst(n) {
    try {
      n = Math.max(1, Math.floor(n) || 30);
      var mode = perfMode();
      if (mode === 'off') { try { console.info('[goldrain] skipped: reduced-motion/saveData on'); } catch (e) {} return; } // เครื่องอ่อน/ตั้งค่า reduce → ข้าม
      if (mode === 'half') n = Math.ceil(n / 2);

      if (!document.body) return;
      cv = ensureCanvas();
      if (!cv) return;
      if (!cv.getContext) return;
      ctx = cv.getContext('2d');
      if (!ctx) return;
      resize();

      var w = window.innerWidth, h = window.innerHeight;
      var max = 120;
      n = Math.min(n, max);
      for (var i = 0; i < n; i++) {
        // ครึ่งหนึ่งร่วงจากฟ้า อีกครึ่งเกิดกลางจอเลย — เห็นทันทีไม่ต้องรอ
        var inView = (i % 2 === 1);
        coins.push({
          x: Math.random() * w,
          y: inView ? Math.random() * (h * 0.6) : (-R * 2 - Math.random() * (h * 0.4)),
          vx: (Math.random() - 0.5) * 1.2,
          vy: 2.5 + Math.random() * 4,
          vr: (Math.random() - 0.5) * 0.12,
          rot: Math.random() * Math.PI * 2,
          phase: Math.random() * Math.PI * 2,
          swayAmp: 8 + Math.random() * 22,
          life: 1
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    } catch (e) { /* silent */ }
  }

  G.burst = burst;
  G.test = function () { burst(60); };

  /* ---------- Auto-hook: #os-toasts ---------- */
  var KEYWORDS = /฿|GOLD|เหรียญ|สำเร็จ/i;

  function hookToasts() {
    if (!window.MutationObserver) return;
    var mount = function () {
      var host = document.getElementById('os-toasts');
      if (!host || host.__goldrainHooked) return;
      host.__goldrainHooked = true;
      var mo = new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          var nodes = muts[i].addedNodes;
          if (!nodes || !nodes.length) continue;
          for (var j = 0; j < nodes.length; j++) {
            var el = nodes[j];
            if (el.nodeType !== 1) continue;
            var text = '';
            safe(function () { text = (el.textContent || '') + (el.getAttribute && el.getAttribute('aria-label') ? ' ' + el.getAttribute('aria-label') : ''); });
            if (text && KEYWORDS.test(text)) {
              setTimeout(function () { burst(30); }, 50);
            }
          }
        }
      });
      mo.observe(host, { childList: true, subtree: true });
    };
    mount();
    // ถ้า #os-toasts ยังไม่เกิด ค่อยเฝ้า body
    if (!document.getElementById('os-toasts') && document.body) {
      var bom = new MutationObserver(function () { mount(); });
      safe(function () { bom.observe(document.body, { childList: true }); });
    }
  }

  function init() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', safe.bind(null, init), { once: true });
      return;
    }
    safe(hookToasts);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { safe(init); }, { once: true });
  } else {
    safe(init);
  }
})();
