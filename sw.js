/* ET1CRUEL service worker — แคชไฟล์ต้นทาง (same-origin) อย่างเดียว
 *  progressive enhancement: ไม่มี SW เว็บก็ทำงานปกติทุกอย่าง
 *  HTML = network-first (กันติดหน้าเก่า) · JS/CSS/รูป/ฟอนต์ = cache-first */
var CACHE = 'et1cruel-v24';
var CORE = ['index.html', 'banks.html', 'pillars.html', 'prod/index.html', '404.html', 'manifest.json', 'favicon.svg', 'logo.svg', 'banner.webp', 'banner-960.webp', 'logos/ktb.png', 'logos/kbank.png', 'logos/bbl.png', 'logos/scb.svg', 'logos/paypal.png', 'logos/truemoney.png', 'logos/ttb.svg', 'logos/dime.svg', 'logos/webull.png', 'logos/shopee.png', 'logos/kept.png', 'css/life-os-os.css', 'css/stock-os.css?v=2', 'fx/fx.css', 'css/home-responsive.css', 'css/site-polish.css', 'css/command-deck.css?v=10', 'js/hero-clock.js', 'js/command-console.js?v=6', 'js/reactive-lens.js', 'js/site-polish.js?v=3', 'js/life-os-os.js', 'js/sky-breaks.js', 'js/diary.js', 'js/stock-talk.js?v=4', 'js/port.js?v=2', 'js/watch.js', 'js/shield.js', 'js/sp500.js', 'js/money-tree.js', 'js/ambient.js', 'js/level-up.js?v=1', 'js/tv-widgets.js', 'fx/forest.js', 'fx/mouse.js', 'fx/gold-rain.js?v=2', 'fx/audio.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () {})
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // ข้าม CDN/API/ฟอนต์
  // หน้า HTML: เน็ตกอน แคชสำรอง
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); })
    );
    return;
  }
  // ไฟล์ static: แคชก่อน เน็ตเติมทีหลัง
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
