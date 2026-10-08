/* ===== S&P 500 table — ค้นหา + เรียงตามอันดับ / % ===== */
(function () {
  var body = document.getElementById('spBody');
  if (!body) return;
  var table = document.getElementById('spTable');
  var search = document.getElementById('spSearch');
  var sortBtn = document.getElementById('spSortRet');
  var count = document.getElementById('spCount');
  var cur = { key: 'rank', dir: 1 };

  function rows() { return Array.prototype.slice.call(body.querySelectorAll('tr')); }
  function updateCount() {
    if (!count) return;
    var vis = rows().filter(function (r) { return r.style.display !== 'none'; }).length;
    count.innerHTML = 'แสดง <b>' + vis + '/75</b>';
  }
  function apply() {
    var q = search ? search.value.trim().toLowerCase() : '';
    rows().forEach(function (r) {
      var hit = !q || r.textContent.toLowerCase().indexOf(q) >= 0;
      r.style.display = hit ? '' : 'none';
    });
    updateCount();
  }
  function sortBy(key) {
    if (cur.key === key) cur.dir *= -1;
    else cur = { key: key, dir: key === 'rank' ? 1 : -1 };
    rows().sort(function (a, b) {
      return cur.dir * (parseFloat(a.dataset[key]) - parseFloat(b.dataset[key]));
    }).forEach(function (r) { body.appendChild(r); });
    if (table) table.querySelectorAll('thead th').forEach(function (th) {
      th.classList.toggle('sorted', th.dataset.spsort === key);
    });
    if (sortBtn) {
      var on = key === 'ret';
      sortBtn.classList.toggle('active', on);
      sortBtn.classList.toggle('ghost', !on);
    }
    apply();
  }

  if (search) search.addEventListener('input', apply);
  if (sortBtn) sortBtn.addEventListener('click', function () { sortBy('ret'); });
  if (table) table.querySelectorAll('thead th[data-spsort]').forEach(function (th) {
    th.addEventListener('click', function () { sortBy(th.dataset.spsort); });
  });
  updateCount();
})();
