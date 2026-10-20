/* ============================================================
   ET1CRUELVERSE — UI layer
   Renders the 7-identity grid, constellation map, filters and
   the expanded identity file. All content comes from verse-data.js.
   ============================================================ */
(function () {
  'use strict';

  var data = window.VERSE_IDENTITIES || [];
  var divisions = window.VERSE_DIVISIONS || [];
  var collabs = window.VERSE_COLLABS || [];
  if (!data.length) return;

  var root = document.getElementById('verse');
  if (!root) return;

  var grid = document.getElementById('verseGrid');
  var mapStage = document.getElementById('verseMapStage');
  var filtersEl = document.getElementById('verseFilters');
  var liveEl = document.getElementById('verseLive');
  var divisionsEl = document.getElementById('verseDivisions');
  var collabsEl = document.getElementById('verseCollabs');
  var countEl = document.getElementById('verseCount');

  var dialog = document.getElementById('verseDialog');
  var shell = document.getElementById('vfShell');
  var closeBtn = document.getElementById('vfClose');
  var prevBtn = document.getElementById('vfPrev');
  var nextBtn = document.getElementById('vfNext');
  var scrollEl = dialog ? dialog.querySelector('.idfile-scroll') : null;

  var current = 0;
  var lastTrigger = null;

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sigil(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#vsig-' +
      esc(name) + '"></use></svg>';
  }

  function findIdentity(id) {
    for (var i = 0; i < data.length; i += 1) {
      if (data[i].id === id) return data[i];
    }
    return null;
  }

  /* ---------- header count + division legend ---------- */
  if (countEl) countEl.textContent = data.length + ' Identities';
  var nodeCountEl = document.getElementById('verseNodeCount');
  if (nodeCountEl) nodeCountEl.textContent = String(data.length);

  if (divisionsEl) {
    divisionsEl.innerHTML = divisions.map(function (d) {
      var n = data.filter(function (item) { return item.division === d.id; }).length;
      return '<li style="--dcolor:' + esc(d.color) + '">' +
        '<i aria-hidden="true"></i>' +
        '<span>' + esc(d.label) + '</span>' +
        '<b>' + n + '</b>' +
        '</li>';
    }).join('');
  }

  /* ---------- identity cards ---------- */
  function cardHTML(d, i) {
    var isFeature = i === 0;
    var feature = isFeature ? ' idcard--feature' : '';
    var rank = d.rank === '—' ? '—' : d.rank;
    var rankLabel = d.rank === '—' ? 'Unassigned' : d.rank;
    var alias = d.alias ? '<span class="id-alias">/ ' + esc(d.alias) + '</span>' : '';
    var status = d.status ? '<span class="id-status">' + esc(d.status) + '</span>' : '';
    var chips = (d.keywords || []).map(function (k) {
      return '<li>' + esc(k) + '</li>';
    }).join('');
    var blurb = '<p class="id-blurb">' + esc(isFeature ? d.core : (d.lead || d.core)) + '</p>';

    return '<article class="idcard' + feature + '" data-division="' + esc(d.division) +
      '" data-index="' + esc(d.index) + '" style="--accent:' + esc(d.color) + '">' +
        '<div class="idcard-head">' +
          '<span class="id-index" aria-hidden="true">' + esc(d.index) + '</span>' +
          '<span class="id-sigil" aria-hidden="true">' + sigil(d.sigil) + '</span>' +
          '<span class="id-rank" aria-label="Rank ' + esc(rankLabel) + '">RANK ' + esc(rank) + '</span>' +
        '</div>' +
        '<div class="id-namebox">' +
          '<p class="id-cat">' + esc(d.divisionLabel) + ' / ' + esc(d.roleEN) + '</p>' +
          '<h3 class="id-name">' + esc(d.name) + '</h3>' +
          '<p class="id-role">' + esc(d.roleTH) + '</p>' +
          alias + status +
        '</div>' +
        blurb +
        '<p class="id-tagline">“' + esc(d.tagline) + '”</p>' +
        '<ul class="id-chips" aria-label="โฟกัสหลัก">' + chips + '</ul>' +
        '<button type="button" class="id-open" data-open="' + esc(d.id) +
          '" aria-label="เปิดแฟ้มตัวตน ' + esc(d.name) + '">เปิดแฟ้มตัวตน' +
          '<span aria-hidden="true">→</span></button>' +
      '</article>';
  }

  if (grid) grid.innerHTML = data.map(cardHTML).join('');

  /* ---------- constellation map ---------- */
  if (mapStage) {
    var n = data.length;
    var nodes = data.map(function (d, i) {
      var angle = (-Math.PI / 2) + (i * (Math.PI * 2) / n);
      return {
        d: d,
        x: 50 + 34 * Math.cos(angle),
        y: 50 + 30 * Math.sin(angle)
      };
    });

    var lines = nodes.map(function (node) {
      return '<line x1="50" y1="50" x2="' + node.x.toFixed(2) + '" y2="' + node.y.toFixed(2) + '"></line>';
    }).join('');

    var buttons = nodes.map(function (node) {
      var d = node.d;
      var shortName = d.name === 'et1cruel'
        ? 'et1'
        : d.name.replace('.et1cruel', '').replace('001e8', '').replace(/core$/, '');
      return '<button type="button" class="vmap-node" data-open="' + esc(d.id) +
        '" style="--x:' + node.x.toFixed(2) + '%;--y:' + node.y.toFixed(2) +
        '%;--accent:' + esc(d.color) + '" aria-label="' + esc(d.index + ' ' + d.name + ' — ' + d.roleTH) + '">' +
          '<span class="vmap-dot" aria-hidden="true">' + sigil(d.sigil) + '</span>' +
          '<span class="vmap-name">' + esc(d.name) + '</span>' +
          '<span class="vmap-short" aria-hidden="true">' + esc(shortName) + '</span>' +
        '</button>';
    }).join('');

    mapStage.innerHTML =
      '<svg class="vmap-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
        lines +
      '</svg>' +
      '<div class="vmap-core" aria-hidden="true">' +
        '<span class="vcore-num">1</span>' +
        '<span class="vcore-word">HUMAN</span>' +
        '<span class="vcore-sub">' + n + ' IDENTITIES</span>' +
      '</div>' +
      buttons;
  }

  /* ---------- filters ---------- */
  var activeFilter = 'all';

  function renderFilters() {
    if (!filtersEl) return;
    var items = [{ id: 'all', label: 'ทั้งหมด' }].concat(divisions);
    filtersEl.innerHTML = items.map(function (f) {
      var total = f.id === 'all'
        ? data.length
        : data.filter(function (d) { return d.division === f.id; }).length;
      return '<button type="button" class="vfilter" data-filter="' + esc(f.id) +
        '" aria-pressed="' + (f.id === 'all' ? 'true' : 'false') + '">' +
        esc(f.label) + '<span class="vcount">' + total + '</span></button>';
    }).join('');
  }

  renderFilters();

  function applyFilter(filter) {
    activeFilter = filter;
    var visible = 0;
    if (grid) {
      Array.prototype.forEach.call(grid.querySelectorAll('.idcard'), function (card) {
        var show = filter === 'all' || card.getAttribute('data-division') === filter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible += 1;
      });
    }
    if (filtersEl) {
      Array.prototype.forEach.call(filtersEl.querySelectorAll('.vfilter'), function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === filter ? 'true' : 'false');
      });
    }
    if (liveEl) {
      var label = filter === 'all' ? 'ทั้งหมด' : (divisions.filter(function (d) { return d.id === filter; })[0] || {}).label;
      liveEl.textContent = 'แสดง ' + visible + ' ตัวตน · ' + (label || filter);
    }
  }

  if (filtersEl) {
    filtersEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      applyFilter(btn.getAttribute('data-filter'));
    });
  }

  /* ---------- collaborations ---------- */
  if (collabsEl) {
    collabsEl.innerHTML = collabs.map(function (combo) {
      var a = findIdentity(combo.a);
      var b = findIdentity(combo.b);
      if (!a || !b) return '';
      return '<div class="vcombo">' +
        '<div class="vcombo-pair">' +
          '<span class="vchip" style="--accent:' + esc(a.color) + '">' + esc(a.name) + '</span>' +
          '<b aria-hidden="true">×</b>' +
          '<span class="vchip" style="--accent:' + esc(b.color) + '">' + esc(b.name) + '</span>' +
        '</div>' +
        '<h4>' + esc(combo.title) + '</h4>' +
        '<p>' + esc(combo.desc) + '</p>' +
      '</div>';
    }).join('');
  }

  /* ---------- expanded identity file ---------- */
  function renderDialog(d) {
    if (!dialog || !shell) return;
    var idx = data.indexOf(d);
    var n = data.length;

    shell.style.setProperty('--accent', d.color);
    dialog.style.setProperty('--accent', d.color);

    document.getElementById('vfSerial').textContent =
      'IDENTITY ' + d.index + ' · ' + d.divisionLabel.toUpperCase() + ' DIVISION';
    document.getElementById('vfName').textContent = d.name;
    document.getElementById('vfRole').textContent = d.roleTH + ' · ' + d.roleEN;
    document.getElementById('vfCat').textContent = d.category;
    document.getElementById('vfRank').textContent = 'RANK ' + d.rank;
    document.getElementById('vfTagline').textContent = '“' + d.tagline + '”';
    document.getElementById('vfCore').textContent = d.core;
    document.getElementById('vfPersona').textContent = d.personality;
    document.getElementById('vfRoleU').textContent = d.role;
    document.getElementById('vfCounter').textContent =
      String(idx + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');

    var alias = document.getElementById('vfAlias');
    alias.textContent = d.alias ? '/ ' + d.alias : '';
    alias.hidden = !d.alias;

    var status = document.getElementById('vfStatus');
    status.textContent = d.status || '';
    status.hidden = !d.status;

    document.getElementById('vfSigilUse').setAttribute('href', '#vsig-' + d.sigil);

    document.getElementById('vfFocus').innerHTML = (d.focus || []).map(function (item) {
      return '<li>' + esc(item) + '</li>';
    }).join('');

    document.getElementById('vfVisual').innerHTML = (d.visual || []).map(function (item) {
      return '<li>' + esc(item) + '</li>';
    }).join('');

    document.getElementById('vfLinks').innerHTML = (d.links || []).map(function (linkId) {
      var linked = findIdentity(linkId);
      if (!linked) return '';
      return '<button type="button" class="vflink" data-goto="' + esc(linked.id) +
        '" style="--accent:' + esc(linked.color) + '">' +
          '<span class="vflink-dot" aria-hidden="true"></span>' +
          '<span class="vflink-txt"><b>' + esc(linked.name) + '</b>' +
            '<small>' + esc(linked.roleTH + ' · ' + linked.roleEN) + '</small></span>' +
          '<span aria-hidden="true">→</span>' +
        '</button>';
    }).join('');

    var prev = data[(idx - 1 + n) % n];
    var next = data[(idx + 1) % n];
    prevBtn.setAttribute('aria-label', 'ก่อนหน้า: ' + prev.name);
    nextBtn.setAttribute('aria-label', 'ถัดไป: ' + next.name);
    if (scrollEl) scrollEl.scrollTop = 0;
  }

  function openIdentity(id, trigger) {
    var d = findIdentity(id);
    if (!d) return;
    if (trigger) lastTrigger = trigger;
    current = data.indexOf(d);
    renderDialog(d);
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') {
        try {
          dialog.showModal();
        } catch (err) {
          dialog.setAttribute('open', '');
        }
      } else {
        dialog.setAttribute('open', '');
      }
      document.documentElement.classList.add('verse-dialog-open');
    }
  }

  function goTo(offset) {
    current = (current + offset + data.length) % data.length;
    renderDialog(data[current]);
  }

  root.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      openIdentity(opener.getAttribute('data-open'), opener);
    }
  });

  if (dialog) {
    dialog.addEventListener('click', function (e) {
      var goto = e.target.closest('[data-goto]');
      if (goto) {
        e.preventDefault();
        openIdentity(goto.getAttribute('data-goto'));
        if (closeBtn) closeBtn.focus();
        return;
      }
      if (e.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
      document.documentElement.classList.remove('verse-dialog-open');
      var trigger = lastTrigger;
      lastTrigger = null;
      if (trigger && document.contains(trigger)) {
        window.requestAnimationFrame(function () {
          trigger.focus({ preventScroll: true });
        });
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(1); });
  }

  /* keep the active filter applied if the page re-renders the grid */
  applyFilter(activeFilter);
})();
