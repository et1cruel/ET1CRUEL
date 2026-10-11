(function () {
  'use strict';
  if (document.querySelector('.experience')) return; // Planet portal has its own motion sequence.
  if (document.getElementById('nav')) return; // Homepage already has viewport-aware entrance motion.
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var selector = [
    '.wrap > header.hero', '.wrap > section', '.wrap > details.card',
    '.page > header.hero', '.page > section.card', '.wrap > section.glass',
    '.glass', '.grid > .card', '.shell > header.hero', '.shell > section:not(.panel)'
  ].join(',');
  var blocks = Array.prototype.slice.call(document.querySelectorAll(selector)).filter(function (el) {
    return window.getComputedStyle(el).display !== 'none';
  });
  if (!blocks.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });

  blocks.forEach(function (el, index) {
    el.classList.add('site-reveal');
    el.style.setProperty('--reveal-delay', Math.min(index % 5, 4) * 45 + 'ms');
    observer.observe(el);
  });
}());

// Record visited rooms on every page that shares the site polish layer.
(function () {
  'use strict';
  var storageKey = 'et1cruel-memory-constellation-v1';
  function visit() {
    var href = window.location.pathname + window.location.search + window.location.hash;
    var links = document.querySelectorAll('#nav a[href], .explore a[href]');
    var label = '';
    for (var i = 0; i < links.length; i += 1) {
      if (links[i].href === window.location.href) { label = links[i].textContent.replace(/\s+/g, ' ').trim(); break; }
    }
    if (!label) {
      var heading = document.querySelector('h1');
      label = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : document.title;
    }
    try {
      var memory = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
      if (!memory || typeof memory !== 'object' || Array.isArray(memory)) memory = {};
      memory[href] = { href: href, label: label || href, at: Date.now() };
      Object.keys(memory).sort(function (a, b) { return memory[b].at - memory[a].at; }).slice(40).forEach(function (key) { delete memory[key]; });
      window.localStorage.setItem(storageKey, JSON.stringify(memory));
    } catch (_) {}
  }
  window.addEventListener('hashchange', visit);
  visit();
}());

// Save a private, browser-local constellation of the rooms the user has explored.
(function () {
  'use strict';
  var STORAGE_KEY = 'et1cruel-memory-constellation-v1';
  var bar = document.querySelector('.hero-sysbar');
  if (!bar || !document.getElementById('commandOpen')) return;

  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'memory-open';
  trigger.setAttribute('aria-label', 'เปิดแผนที่ความทรงจำ');
  trigger.setAttribute('title', 'แผนที่ความทรงจำ');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'memoryConstellation');
  trigger.innerHTML = '<span aria-hidden="true">✧</span><b class="memory-total">0</b>';
  bar.insertBefore(trigger, document.getElementById('commandOpen'));

  var panel = document.createElement('section');
  panel.className = 'memory-panel';
  panel.id = 'memoryConstellation';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'memoryTitle');
  panel.innerHTML = '<header class="memory-head"><div><span class="memory-kicker">LOCAL SAVE · PRIVATE TO THIS DEVICE</span><h2 id="memoryTitle">Memory constellation</h2></div><button type="button" class="memory-close" aria-label="ปิดแผนที่ความทรงจำ">×</button></header><p class="memory-intro">ห้องที่คุณเคยแวะ จะกลายเป็นดาวให้ย้อนกลับมาได้</p><section class="memory-progress" aria-label="ความคืบหน้าการสำรวจ"><div class="memory-progress-head"><span>WORLD DISCOVERY</span><strong class="memory-progress-count">0 / 0</strong></div><div class="memory-progress-track" role="progressbar" aria-label="สำรวจห้องในเว็บไซต์" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"><span></span></div><div class="memory-ranks"></div><p class="memory-next-goal"></p><a class="memory-discover" href="#">ค้นพบห้องใหม่ <span aria-hidden="true">↗</span></a></section><div class="memory-galaxy" aria-hidden="true"><svg class="memory-orbits" viewBox="0 0 360 176" preserveAspectRatio="none"></svg><div class="memory-galaxy-core"><span>ET1</span></div></div><div class="memory-stars" role="list" aria-label="ห้องที่เข้าชมล่าสุด"></div><p class="memory-empty" hidden>ยังไม่มีดาวในแผนที่ ลองแวะไปอีกห้องหนึ่งก่อนนะ</p><footer class="memory-foot"><span>บันทึกในเบราว์เซอร์เครื่องนี้เท่านั้น</span><button type="button" class="memory-clear">เริ่มแผนที่ใหม่</button></footer>';
  document.body.appendChild(panel);

  var total = trigger.querySelector('.memory-total');
  var stars = panel.querySelector('.memory-stars');
  var galaxy = panel.querySelector('.memory-orbits');
  var progressCount = panel.querySelector('.memory-progress-count');
  var progressTrack = panel.querySelector('.memory-progress-track');
  var progressFill = progressTrack.querySelector('span');
  var ranks = panel.querySelector('.memory-ranks');
  var nextGoal = panel.querySelector('.memory-next-goal');
  var discover = panel.querySelector('.memory-discover');
  var empty = panel.querySelector('.memory-empty');
  var memory = load();

  function load() {
    try {
      var value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function save() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch (_) {}
  }
  function currentDestination() {
    return window.location.pathname + window.location.search + window.location.hash;
  }
  function labelForCurrent() {
    var links = document.querySelectorAll('#nav a[href], .explore a[href]');
    for (var i = 0; i < links.length; i += 1) {
      if (links[i].href === window.location.href) return links[i].textContent.replace(/\s+/g, ' ').trim();
    }
    var heading = document.querySelector('h1');
    var label = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : document.title;
    if (!window.location.hash && /\/index\.html?$/.test(window.location.pathname)) label = 'หน้าแผนที่ชีวิต';
    return label || currentDestination();
  }
  function refresh() {
    var entries = Object.keys(memory).map(function (key) { return memory[key]; })
      .filter(function (item) { return item && item.href && item.label; })
      .sort(function (a, b) { return b.at - a.at; });
    var targets = [];
    var targetSeen = Object.create(null);
    Array.prototype.forEach.call(document.querySelectorAll('#nav a[href], .explore a[href]'), function (link) {
      try {
        var url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        var href = url.pathname + url.search + url.hash;
        if (!targetSeen[href]) { targetSeen[href] = true; targets.push({ href: href, label: link.textContent.replace(/\s+/g, ' ').trim() }); }
      } catch (_) {}
    });
    var discovered = targets.filter(function (target) { return !!memory[target.href]; }).length;
    var percentage = targets.length ? Math.round(discovered / targets.length * 100) : 0;
    progressCount.textContent = discovered + ' / ' + targets.length + ' · ' + percentage + '%';
    progressTrack.setAttribute('aria-valuemax', String(targets.length));
    progressTrack.setAttribute('aria-valuenow', String(discovered));
    progressFill.style.width = percentage + '%';
    var rankData = [
      { name: 'FIRST STAR', at: 1 },
      { name: 'EXPLORER', at: 5 },
      { name: 'CARTOGRAPHER', at: 12 },
      { name: 'WORLDWALKER', at: targets.length }
    ];
    ranks.textContent = '';
    rankData.forEach(function (rank) {
      if (rank.at > targets.length) return;
      var badge = document.createElement('span');
      badge.className = 'memory-rank' + (discovered >= rank.at ? ' is-unlocked' : '');
      badge.textContent = (discovered >= rank.at ? '✦ ' : '◇ ') + rank.name;
      ranks.appendChild(badge);
    });
    var nextRank = rankData.find(function (rank) { return rank.at > discovered && rank.at <= targets.length; });
    nextGoal.textContent = nextRank ? 'อีก ' + (nextRank.at - discovered) + ' ห้อง ปลดล็อก ' + nextRank.name : 'คุณสำรวจทุกห้องในแผนที่แล้ว ✦';
    var nextRoom = targets.find(function (target) { return !memory[target.href]; });
    discover.hidden = !nextRoom;
    if (nextRoom) { discover.href = nextRoom.href; discover.setAttribute('aria-label', 'ค้นพบห้องใหม่: ' + nextRoom.label); }
    total.textContent = String(entries.length);
    stars.textContent = '';
    galaxy.textContent = '';
    var visible = entries.slice(0, 8);
    var points = [
      [32, 41], [74, 24], [132, 43], [229, 28],
      [318, 52], [330, 118], [253, 151], [112, 145]
    ];
    var center = [180, 88];
    visible.forEach(function (_, index) {
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', center[0]); line.setAttribute('y1', center[1]);
      line.setAttribute('x2', points[index][0]); line.setAttribute('y2', points[index][1]);
      line.setAttribute('class', 'memory-ray memory-ray-' + (index % 4));
      galaxy.appendChild(line);
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', points[index][0]); dot.setAttribute('cy', points[index][1]);
      dot.setAttribute('r', index === 0 ? '3.5' : '2.6');
      dot.setAttribute('class', 'memory-orbit-star memory-orbit-star-' + (index % 4));
      galaxy.appendChild(dot);
    });
    if (visible.length > 1) {
      var route = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      route.setAttribute('points', visible.map(function (_, index) { return points[index].join(','); }).join(' '));
      route.setAttribute('class', 'memory-route');
      galaxy.insertBefore(route, galaxy.firstChild);
    }
    visible.forEach(function (item, index) {
      var link = document.createElement('a');
      link.className = 'memory-star';
      link.setAttribute('role', 'listitem');
      link.href = item.href;
      link.innerHTML = '<span class="memory-star-icon" aria-hidden="true">✦</span><span class="memory-star-name"></span><span class="memory-star-index">' + String(index + 1).padStart(2, '0') + '</span>';
      link.querySelector('.memory-star-name').textContent = item.label;
      stars.appendChild(link);
    });
    empty.hidden = entries.length !== 0;
  }
  function close() {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }
  function visit() {
    var href = currentDestination();
    memory[href] = { href: href, label: labelForCurrent(), at: Date.now() };
    var keys = Object.keys(memory).sort(function (a, b) { return memory[b].at - memory[a].at; });
    keys.slice(40).forEach(function (key) { delete memory[key]; });
    save();
    refresh();
  }

  trigger.addEventListener('click', function () {
    panel.hidden = !panel.hidden;
    trigger.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) panel.querySelector('.memory-close').focus();
  });
  panel.querySelector('.memory-close').addEventListener('click', close);
  panel.querySelector('.memory-clear').addEventListener('click', function () {
    memory = {};
    save();
    refresh();
    close();
  });
  document.addEventListener('click', function (event) {
    if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) close();
  });
  window.addEventListener('hashchange', visit);
  visit();
}());

// A short portal jump makes movement between the site's rooms feel intentional.
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.__et1cruelWarpReady) return;
  window.__et1cruelWarpReady = true;

  var timer = 0;
  var overlay = document.createElement('div');
  overlay.className = 'warp-transition';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<span class="warp-ring warp-ring-a"></span><span class="warp-ring warp-ring-b"></span><span class="warp-core"></span><span class="warp-label">JUMPING TO NEXT ROOM</span>';
  document.body.appendChild(overlay);

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self' || link.relList.contains('external')) return;

    var destination;
    try { destination = new URL(link.href, window.location.href); } catch (_) { return; }
    if (destination.origin !== window.location.origin || /^(mailto:|tel:|javascript:)$/.test(destination.protocol)) return;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
    if (event.isTrusted === false || document.body.classList.contains('is-warping')) return;

    event.preventDefault();
    document.body.classList.add('is-warping');
    timer = window.setTimeout(function () { window.location.assign(destination.href); }, 360);
  });

  window.addEventListener('pagehide', function () { if (timer) window.clearTimeout(timer); });
}());
