/* ===== Watchlist sort — เรียงตาราง 17 หุ้น AI Infra ตาม 1Y / 3Yรวม / 3Y CAGR ===== */
(function () {
  var body = document.getElementById('w17Body');
  if (!body) return;
  var table = document.getElementById('w17Table');
  var btn1Y = document.getElementById('watchSort1Y');
  var btnCagr = document.getElementById('watchSortCagr');
  var cur = { key: 'y1', dir: -1 };

  function sortBy(key) {
    if (cur.key === key) cur.dir *= -1;
    else cur = { key: key, dir: key === 'sym' ? 1 : -1 };
    var rows = Array.prototype.slice.call(body.querySelectorAll('tr'));
    rows.sort(function (a, b) {
      if (key === 'sym') {
        var sa = a.cells[0].textContent.trim(), sb = b.cells[0].textContent.trim();
        return cur.dir * sa.localeCompare(sb);
      }
      return cur.dir * (parseFloat(a.dataset[key]) - parseFloat(b.dataset[key]));
    });
    rows.forEach(function (r) { body.appendChild(r); });
    if (table) table.querySelectorAll('thead th').forEach(function (th) {
      th.classList.toggle('sorted', th.dataset.wsort === key);
    });
    if (btn1Y && btnCagr) {
      var on1 = key === 'y1', onC = key === 'cagr';
      btn1Y.classList.toggle('active', on1);
      btnCagr.classList.toggle('active', onC);
      btn1Y.classList.toggle('ghost', !on1);
      btnCagr.classList.toggle('ghost', !onC);
    }
  }

  if (table) table.querySelectorAll('thead th[data-wsort]').forEach(function (th) {
    th.addEventListener('click', function () { sortBy(th.dataset.wsort); });
  });
  if (btn1Y) btn1Y.addEventListener('click', function () { sortBy('y1'); });
  if (btnCagr) btnCagr.addEventListener('click', function () { sortBy('cagr'); });
  // ตั้งต้น: เรียงตาม 1Y มาก→น้อย (ตรงกับรูป)
  if (table) {
    var th1 = table.querySelector('thead th[data-wsort="y1"]');
    if (th1) th1.classList.add('sorted');
  }
  if (btn1Y) btn1Y.classList.add('active');
})();
