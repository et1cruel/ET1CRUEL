/* ============================================================
   SKY BREAKS — แทรกแถบภาพธรรมชาติ/ท้องฟ้าคั่นระหว่าง section
   ฉากวนลูป: sunrise / day / sunset / night / forest
   หมายเหตุ: แทรกเป็น div ธรรมดาระหว่าง section.card เท่านั้น
   จึงไม่กระทบ collapse / search / scrollspy / quest tracker
   ============================================================ */
(function () {
  'use strict';
  var SCENES = [
    { s: 'sunrise', t: '🌅 เช้าวันใหม่ — เริ่มใหม่ได้เสมอ' },
    { s: 'day',     t: '🌿 พักสายตา — มองสีเขียวไว้' },
    { s: 'sunset',  t: '🌇 หมดวันแล้ว — วันนี้เก่งมาก' },
    { s: 'night',   t: '🌌 ดาวยังอยู่ — ฝันต่อได้' },
    { s: 'forest',  t: '🌲 หายใจลึกๆ — แล้วเดินต่อ' }
  ];
  function boot() {
    try {
      var secs = document.querySelectorAll('.sections > section.card');
      if (!secs || secs.length < 2) return;
      // กันแทรกซ้ำ (เช่น สคริปต์รันสองรอบ)
      if (document.querySelector('.sections > .sky-break')) return;
      for (var i = 1; i < secs.length; i++) {
        try {
          var prev = secs[i].previousElementSibling;
          if (prev && prev.classList && prev.classList.contains('photo-break')) continue; /* มีรูปคั่นแล้ว ไม่ซ้อนแถบท้องฟ้า */
          var sc = SCENES[(i - 1) % SCENES.length];
          var d = document.createElement('div');
          d.className = 'sky-break';
          d.setAttribute('data-scene', sc.s);
          d.setAttribute('aria-hidden', 'true');
          var cap = document.createElement('span');
          cap.textContent = sc.t;
          d.appendChild(cap);
          var fx = document.createElement('i');
          fx.className = 'sky-fx';
          fx.setAttribute('aria-hidden', 'true');
          d.appendChild(fx);
          secs[i].parentNode.insertBefore(d, secs[i]);
        } catch (e2) { /* ชิ้นไหนพังข้ามไป ไม่ลามทั้งแถบ */ }
      }
    } catch (e) { /* แถบประดับพังได้ แต่ต้องไม่ลามไปส่วนอื่น */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
