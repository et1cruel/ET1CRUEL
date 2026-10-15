/* ============================================================
   ET1CRUEL KNOWLEDGE LIBRARY — Phase 8 (Muse Spark: display)
   - ข้อมูลอยู่ใน `js/knowledge-data.js` (GLM 5.3 เขียน): window.ET1KNOWLEDGE
   - schema ต่อชิ้น: {cat:'stocks'|'music'|'art'|'tech', title, body, tag}
   - ไฟล์นี้ไม่รู้จักเนื้อหา อ่านจาก schema อย่างเดียว + กันพังทุกจุด
   - แท็บ: วันนี้ / หุ้น / ดนตรี / ศิลปะ / เทค + ปุ่มสุ่ม
   ============================================================ */
(function () {
  'use strict';
  var CATS = [
    { id: 'today', label: '⭐ วันนี้', icon: '⭐' },
    { id: 'stocks', label: '📈 หุ้น', icon: '📈' },
    { id: 'music', label: '🎵 ดนตรี', icon: '🎵' },
    { id: 'art', label: '🎨 ศิลปะ', icon: '🎨' },
    { id: 'tech', label: '🤖 เทค', icon: '🤖' }
  ];
  function data() {
    try {
      var d = window.ET1KNOWLEDGE;
      if (Object.prototype.toString.call(d) !== '[object Array]') return [];
      return d.filter(function (x) {
        return x && typeof x.title === 'string' && typeof x.body === 'string' &&
          (x.cat === 'stocks' || x.cat === 'music' || x.cat === 'art' || x.cat === 'tech');
      });
    } catch (e) { return []; }
  }
  function daySeed() {
    var n = new Date();
    return n.getFullYear() * 1000 + dayOfYear(n);
  }
  function dayOfYear(n) {
    return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 864e5);
  }
  function pick(list, seed) {
    if (!list.length) return null;
    return list[seed % list.length];
  }
  function injectCSS() {
    if (document.getElementById('know-style')) return;
    var st = document.createElement('style');
    st.id = 'know-style';
    st.textContent = [
      '#know-card .know-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}',
      '#know-card .know-tab{border:1px solid #3d4666;background:#0B0D14;color:#AAB4CC;border-radius:10px;',
      ' padding:8px 12px;font-family:"Chakra Petch","IBM Plex Sans Thai",sans-serif;font-size:12.5px;font-weight:700;cursor:pointer}',
      '#know-card .know-tab.on{background:#4ADE80;color:#111;border-color:#4ADE80}',
      '#know-body{border:1px solid #2B3248;border-radius:14px;padding:18px;background:rgba(0,0,0,.3);min-height:120px}',
      '#know-tag{display:inline-block;font-family:"Chakra Petch",sans-serif;font-size:11px;font-weight:700;',
      ' color:#6EE7B7;border:1px solid #166534;border-radius:8px;padding:3px 10px;margin-bottom:8px;letter-spacing:.05em}',
      '#know-title{font-size:19px;font-weight:700;color:#fff;margin-bottom:6px}',
      '#know-text{color:#AAB4CC;font-size:15.5px;line-height:1.9}',
      '#know-foot{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center}',
      '#know-rand{border:1.5px solid #4ADE80;background:rgba(74,222,128,.12);color:#6EE7B7;border-radius:10px;',
      ' padding:8px 14px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}',
      '#know-count{margin-left:auto;font-family:"Chakra Petch",sans-serif;font-size:11.5px;color:#9AA3C2}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function render(section, cat) {
    var list = data();
    var body = section.querySelector('#know-body');
    var count = section.querySelector('#know-count');
    if (!list.length || !body) return;
    var item;
    if (cat === 'today') {
      item = pick(list, daySeed());
    } else {
      var f = list.filter(function (x) { return x.cat === cat; });
      item = pick(f, daySeed());
    }
    if (!item) return;
    section._cat = cat;
    section._item = item;
    body.innerHTML = '';
    var tag = document.createElement('span'); tag.id = 'know-tag'; tag.textContent = item.tag || cat;
    var h = document.createElement('div'); h.id = 'know-title'; h.textContent = item.title;
    var p = document.createElement('div'); p.id = 'know-text'; p.textContent = item.body;
    body.appendChild(tag); body.appendChild(h); body.appendChild(p);
    var tabs = section.querySelectorAll('.know-tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-cat') === cat) tabs[i].classList.add('on');
      else tabs[i].classList.remove('on');
    }
    if (count) {
      var n = cat === 'today' ? list.length : list.filter(function (x) { return x.cat === cat; }).length;
      count.textContent = n + ' เกร็ด';
    }
  }
  function random(section) {
    var list = data();
    if (!list.length) return;
    var cat = section._cat || 'today';
    var pool = cat === 'today' ? list : list.filter(function (x) { return x.cat === cat; });
    if (!pool.length) pool = list;
    var item = pool[(Math.random() * pool.length) | 0];
    section._item = item;
    var body = section.querySelector('#know-body');
    if (!body) return;
    body.innerHTML = '';
    var tag = document.createElement('span'); tag.id = 'know-tag'; tag.textContent = item.tag || cat;
    var h = document.createElement('div'); h.id = 'know-title'; h.textContent = item.title;
    var p = document.createElement('div'); p.id = 'know-text'; p.textContent = item.body;
    body.appendChild(tag); body.appendChild(h); body.appendChild(p);
  }
  function build() {
    var existing = document.getElementById('know-card');
    if (existing) {
      if (!data().length) return; // เหลือ static fallback ไว้
      injectCSS();
      var tabs = existing.querySelectorAll('.know-tab');
      for (var i = 0; i < tabs.length; i++) {
        (function (b) {
          b.addEventListener('click', function () { render(existing, b.getAttribute('data-cat')); });
        })(tabs[i]);
      }
      var rand = existing.querySelector('#know-rand');
      if (rand) rand.addEventListener('click', function () { random(existing); });
      render(existing, 'today');
      window.ET1KNOW = {
        random: function (cat) { render(existing, cat || 'today'); random(existing); },
        today: function () { render(existing, 'today'); },
        count: function () { return data().length; }
      };
      return;
    }
    if (!data().length) return; // ยังไม่มีไฟล์ข้อมูลจาก GLM → ไม่แสดงอะไร
    var anchor = document.querySelector('.treasury') || document.getElementById('gear');
    if (!anchor) return;
    injectCSS();
    var s = document.createElement('section');
    s.className = 'card';
    s.id = 'know-card';
    var head = document.createElement('div');
    head.className = 'shead';
    head.innerHTML = '<div class="icon">📚</div><div><h2>ห้องสมุดเกร็ดความรู้ — จากของจริงในเว็บนี้</h2>' +
      '<p>หุ้น · ดนตรี · ศิลปะ · เทคโนโลยี · เปลี่ยนทุกวัน กดสุ่มได้</p></div><span class="count">📚</span>';
    var tabs = document.createElement('div');
    tabs.className = 'know-tabs';
    CATS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'know-tab'; b.setAttribute('data-cat', c.id);
      b.textContent = c.label;
      b.addEventListener('click', function () { render(s, c.id); });
      tabs.appendChild(b);
    });
    var body = document.createElement('div'); body.id = 'know-body';
    var foot = document.createElement('div'); foot.id = 'know-foot';
    var rand = document.createElement('button');
    rand.type = 'button'; rand.id = 'know-rand'; rand.textContent = '🎲 สุ่มเกร็ดอื่น';
    rand.addEventListener('click', function () { random(s); });
    var count = document.createElement('span'); count.id = 'know-count';
    foot.appendChild(rand); foot.appendChild(count);
    s.appendChild(head); s.appendChild(tabs); s.appendChild(body); s.appendChild(foot);
    anchor.parentNode.insertBefore(s, anchor);
    render(s, 'today');
    window.ET1KNOW = {
      random: function (cat) { render(s, cat || 'today'); random(s); },
      today: function () { render(s, 'today'); },
      count: function () { return data().length; }
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
