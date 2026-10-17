/* ===== MUSIC ROOM APP (1/2) — gate, storage, hall, origin, universe, archive ===== */
(function () {
  'use strict';
  var KEY = 'et1cruel.musicroom.v1';
  var SEEN = 'et1cruel.musicroom.seen';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function D() { return window.ET1MUSIC_DATA || { origins: [], tags: [], compassQs: [], returnOptions: [], dailyQs: [] }; }
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function bkk(ts) { try { return new Date(ts == null ? Date.now() : ts).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }

  function blankStore() {
    return { origins: {}, artists: [], tracks: [], sounds: [], tags: [], searching: [], archive: [], ideas: [], diary: [], letters: [], connections: [], compass: {}, favs: [], notes: [], daily: [] };
  }
  /* ---- sanitize: ข้อมูลจาก localStorage/ไฟล์นำเข้า ต้องไม่ทำให้ห้องพัง ---- */
  function strArr(a) { return (Array.isArray(a) ? a : []).filter(function (x) { return typeof x === 'string'; }); }
  function strMap(o) {
    var r = {};
    if (isObj(o)) Object.keys(o).forEach(function (k) { if (typeof o[k] === 'string') r[k] = o[k]; });
    return r;
  }
  function itemArr(a, fields) {
    return (Array.isArray(a) ? a : []).filter(isObj).map(function (x, i) {
      var o = {};
      fields.forEach(function (f) {
        var v = x[f];
        if (f === 'ts') o.ts = (+v || 0);
        else if (f === 'rest') o.rest = !!v;
        else o[f] = (v == null) ? '' : String(v);
      });
      if (fields.indexOf('id') >= 0 && !o.id) o.id = 'a' + i;
      return o;
    });
  }
  function sanitize(o) {
    var s = isObj(o) ? o : {};
    var origins = {};
    if (isObj(s.origins)) Object.keys(s.origins).forEach(function (k) {
      var v = s.origins[k];
      if (isObj(v)) origins[k] = { text: (v.text == null ? '' : String(v.text)), ts: (+v.ts || 0) };
    });
    return {
      origins: origins,
      artists: strArr(s.artists), tracks: strArr(s.tracks), sounds: strArr(s.sounds),
      tags: strArr(s.tags), searching: strArr(s.searching),
      archive: itemArr(s.archive, ['id', 'title', 'date', 'idea', 'status', 'url', 'note', 'uploadName']),
      ideas: itemArr(s.ideas, ['text', 'status', 'note', 'ts']),
      diary: itemArr(s.diary, ['text', 'ts']),
      letters: itemArr(s.letters, ['title', 'text', 'openAt', 'ts']),
      connections: strArr(s.connections),
      compass: strMap(s.compass),
      favs: strArr(s.favs),
      notes: itemArr(s.notes, ['text', 'ts']),
      daily: itemArr(s.daily, ['text', 'ts', 'rest'])
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankStore();
      return sanitize(JSON.parse(raw));
    } catch (e) { return blankStore(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load();

  function params() { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; } }; } }
  var seq = 0;
  function uid(p) { seq++; return (p || 'x') + Date.now().toString(36) + seq.toString(36); }

  /* ---------- gate ---------- */
  function gate() {
    var g = $('gate');
    var seen = false;
    try { seen = !!localStorage.getItem(SEEN); } catch (e) {}
    // ถ้ามี ?tab= ในลิงก์ แปลว่าตั้งใจเข้าห้องอยู่แล้ว — ห้ามกั้นด้วยประตูที่จำไม่ได้
    // (กรณี localStorage ถูกบล็อก ประตูจะไม่วนซ้ำ เพราะปุ่มพาไป ?tab= ทุกครั้ง)
    if (seen || params().get('tab') !== null) { g.style.display = 'none'; return; }
    function go(tab) {
      var ok = false;
      try { localStorage.setItem(SEEN, '1'); ok = true; } catch (e) {}
      if (!ok) g.style.display = 'none';
      else g.classList.add('away');
      location.search = '?tab=' + (tab || 'hall');
    }
    $('enterBtn').addEventListener('click', function () { go('hall'); });
    $('listenBtn').addEventListener('click', function () { go('listening'); });
  }

  /* ---------- hall ---------- */
  function vHall() {
    var nArc = S.archive.length, nLet = S.letters.length, nIdea = S.ideas.length;
    var mem = (nArc + nLet + nIdea) > 0
      ? '<div class="kbox"><b>📦 ในห้องมีของเธออยู่ ' + (nArc + nLet + nIdea) + ' ชิ้น</b><small>งาน ' + nArc + ' · จดหมาย ' + nLet + ' · ไอเดีย ' + nIdea + '</small></div>'
      : '<div class="empty">ห้องยังว่าง — เริ่มจากฟังเพลงสักเพลง หรือเขียนอะไรสั้นๆ ก็ได้ ไม่ต้องมีผลงานก่อน</div>';
    return '<section class="card"><h2><span class="em">🏠</span> ห้องโถง</h2>' +
      '<p class="sub">วันนี้ไม่ต้องสร้างเพลงที่ดีที่สุดก็ได้ — แค่กลับมาอยู่กับเสียงที่ชอบก็พอ</p><div class="kv">' + mem +
      '<div class="kbox"><b>▶️ เริ่มจากอะไรดี?</b><small>ฟังเพลง · เปิดงานเก่า · เล่น 15 นาที · เขียนโน้ต</small><div class="rowbtns"><button class="btn small" id="hallReturn">🎵 หนทางกลับมา</button></div></div></div></section>';
  }

  /* ---------- origin ---------- */
  function vOrigin() {
    var h = '<section class="card"><h2><span class="em">🌱</span> Where It All Began</h2><p class="sub">ค่อยๆ ตอบทีละข้อก็ได้ ไม่ต้องครบในครั้งเดียว</p>';
    h += D().origins.map(function (o) {
      var mine = (S.origins || {})[o.id] || {};
      var txt = mine.text !== undefined ? mine.text : o.answer;
      var prov = (o.answer && (mine.text === undefined)) ? '<p class="ev">มาจากโน้ต/ภาพที่คุณส่งไว้ — แก้ให้เป็นคำของคุณได้เลย</p>' : '';
      return '<div class="sec" id="org-' + o.id + '"><h3>' + o.no + ' — ' + esc(o.title) + '</h3>' +
        '<p class="sub">' + esc(o.prompt) + '</p>' + prov +
        '<div class="form"><label>คำตอบของฉัน<textarea rows="3" data-org="' + o.id + '">' + esc(txt) + '</textarea></label></div></div>';
    }).join('');
    h += '<div class="rowbtns"><button class="btn small" id="orgSave">💾 บันทึกทั้งหมด</button></div>';
    h += '<div class="sec"><h3>💌 จดหมายสำคัญ: ถ้าวันหนึ่งลืมว่าทำไมถึงเริ่ม</h3>' +
      '<div class="form"><label>อยากให้ตัวเองในอนาคตจำอะไรได้มากที่สุด?<textarea rows="3" id="orgLetter">' + esc((S.origins.__letter || {}).text || '') + '</textarea></label>' +
      '<div><button class="btn small ghost" id="orgLetterSave">เก็บจดหมายฉบับนี้</button></div></div></div></section>';
    return h;
  }
  function bindOrigin() {
    var sv = $('orgSave');
    if (sv) sv.addEventListener('click', function () {
      S.origins = S.origins || {};
      document.querySelectorAll('[data-org]').forEach(function (el) {
        var id = el.getAttribute('data-org');
        S.origins[id] = S.origins[id] || {};
        S.origins[id].text = el.value;
        S.origins[id].ts = Date.now();
      });
      save(S); render();
    });
    var ls = $('orgLetterSave');
    if (ls) ls.addEventListener('click', function () {
      var t = ($('orgLetter').value || '').trim();
      if (!t) return;
      S.origins = S.origins || {};
      S.origins.__letter = { text: t, ts: Date.now() };
      save(S); render();
    });
  }

  /* ---------- universe ---------- */
  function vUniverse() {
    function list(arr, kind) {
      return (arr.length ? '<ul>' + arr.map(function (x, i) {
        return '<li>' + esc(x) + ' <button class="btn small ghost" data-udel="' + kind + ':' + i + '">ลบ</button></li>';
      }).join('') + '</ul>' : '<div class="empty">ยังว่าง</div>');
    }
    var tags = TAGS_ALL().map(function (t) {
      var on = (S.tags || []).indexOf(t) >= 0;
      return '<span class="tag' + (on ? ' on' : '') + '" data-tag="' + esc(t) + '">' + esc(t) + '</span>';
    }).join('');
    return '<section class="card"><h2><span class="em">🌌</span> A Universe Made of Sound</h2>' +
      '<p class="sub">แท็กของฉัน (กดเลือกได้):</p><div>' + tags + '</div>' +
      '<div class="form"><label>＋ แท็กใหม่<input id="tagNew" maxlength="30"></label><div><button class="btn small ghost" id="tagAdd">เพิ่มแท็ก</button></div></div></section>' +
      '<section class="card"><h2><span class="em">🎧</span> สิ่งที่ชอบ</h2>' +
      '<div class="sec"><h3>ศิลปินที่ชอบ</h3>' + list(S.artists, 'artists') +
      '<div class="form"><label>＋ เพิ่ม<input id="in-artists" maxlength="80"></label><div><button class="btn small" data-uadd="artists">เพิ่ม</button></div></div></div>' +
      '<div class="sec"><h3>เพลงที่ฟังซ้ำ</h3>' + list(S.tracks, 'tracks') +
      '<div class="form"><label>＋ เพิ่ม<input id="in-tracks" maxlength="120"></label><div><button class="btn small" data-uadd="tracks">เพิ่ม</button></div></div></div>' +
      '<div class="sec"><h3>เสียงที่ชอบเป็นพิเศษ</h3>' + list(S.sounds, 'sounds') +
      '<div class="form"><label>＋ เพิ่ม<input id="in-sounds" maxlength="120"></label><div><button class="btn small" data-uadd="sounds">เพิ่ม</button></div></div></div></section>' +
      '<section class="card"><h2><span class="em">🔭</span> THE SOUND I AM SEARCHING FOR</h2><p class="sub">เสียงในจินตนาการที่ยังสร้างไม่สำเร็จ — เขียนไว้ก่อนก็ได้</p>' +
      list(S.searching, 'searching') +
      '<div class="form"><label>＋ เสียงที่ตามหา<input id="in-searching" maxlength="200" placeholder="เช่น กลองที่เหมือนดังมาจากห้องข้างๆ"></label><div><button class="btn small" data-uadd="searching">เพิ่ม</button></div></div></section>';
  }
  function TAGS_ALL() {
    var base = D().tags.slice();
    (S.tags || []).forEach(function (t) { if (base.indexOf(t) < 0) base.push(t); });
    return base;
  }
  function bindUniverse() {
    document.querySelectorAll('[data-tag]').forEach(function (el) {
      el.addEventListener('click', function () {
        var t = el.getAttribute('data-tag');
        S.tags = S.tags || [];
        var i = S.tags.indexOf(t);
        if (i >= 0) S.tags.splice(i, 1); else S.tags.push(t);
        save(S); render();
      });
    });
    var ta = $('tagAdd');
    if (ta) ta.addEventListener('click', function () {
      var v = ($('tagNew').value || '').trim();
      if (!v) return;
      S.tags = S.tags || [];
      if (S.tags.indexOf(v) < 0) S.tags.push(v);
      save(S); render();
    });
    document.querySelectorAll('[data-uadd]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-uadd');
        var v = (document.querySelector('#in-' + k).value || '').trim();
        if (!v) return;
        S[k] = S[k] || [];
        S[k].push(v);
        save(S); render();
      });
    });
    document.querySelectorAll('[data-udel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-udel').split(':');
        if (!confirm('ลบข้อนี้ใช่ไหม?')) return;
        S[p[0]].splice(+p[1], 1);
        save(S); render();
      });
    });
  }

  /* ---------- archive ---------- */
  var ASTAT = ['Idea', 'Demo', 'WIP', 'Finished', 'Released'];
  var BLOBS = {}; /* ไฟล์ที่แนบในเซสชันนี้ — เก็บในหน่วยความจำเท่านั้น ไม่ลง localStorage/ไฟล์สำรอง */
  function isAudioUrl(u) { return /^blob:|\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)([?#]|$)/i.test(String(u || '')); }
  function audioFor(a) {
    var src = a.url || BLOBS[a.id] || '';
    if (src && isAudioUrl(src)) return '<audio controls preload="none" data-aid="' + esc(a.id) + '" src="' + esc(src) + '"></audio>';
    if (a.uploadName) return '<p class="ev">🎵 เคยแนบไฟล์ “' + esc(a.uploadName) + '” — ไฟล์แนบอยู่ได้แค่ในเซสชันนั้น ไม่ได้ถูกบันทึกลงเครื่อง แนบใหม่ถ้าอยากฟัง</p>';
    if (a.url) return '<p class="ev">🔗 ลิงก์ “' + esc(a.url) + '” ไม่ใช่ไฟล์เสียงที่เล่นในหน้านี้ได้</p>';
    return '';
  }
  function vArchive(filter) {
    var fStat = params().get('st') || '';
    var list = S.archive.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    if (fStat) list = list.filter(function (a) { return (a.status || 'Idea') === fStat; });
    if (filter) {
      var q = filter.toLowerCase();
      list = list.filter(function (a) { return ((a.title || '') + ' ' + (a.idea || '')).toLowerCase().indexOf(q) >= 0; });
    }
    var h = '<section class="card"><h2><span class="em">🎼</span> My Sound, My Timeline</h2>' +
      '<p class="sub">เดโมที่ไม่เคยปล่อยก็มีที่อยู่ตรงนี้ — คุณค่าไม่ได้วัดที่สถานะ</p>' +
      '<div class="rowbtns">' + ASTAT.concat(['']).map(function (s) {
        var onNow = s ? fStat === s : !fStat;
        return '<a class="btn small ' + (onNow ? '' : 'ghost') + '" href="?tab=archive' + (s ? '&st=' + encodeURIComponent(s) : '') + (filter ? '&q=' + encodeURIComponent(filter) : '') + '">' + (s || 'ทั้งหมด') + '</a>';
      }).join(' ') + '</div>' +
      '<div class="form"><label>🔍 ค้นหา<input id="arcQ" value="' + esc(filter || '') + '" maxlength="60"></label></div>';
    h += list.length ? '<ul class="tl">' + list.map(function (a) {
      return '<li><b class="yr num">' + esc(a.date || '—') + '</b><b>' + esc(a.title || '(ไม่มีชื่อ)') + '</b> <span class="tag">' + esc(a.status || 'Idea') + '</span><br>' +
        '<small>' + esc((a.idea || '').slice(0, 120)) + '</small>' + audioFor(a) +
        '<div class="rowbtns"><button class="btn small ghost" data-aopen="' + esc(a.id) + '">เปิดบันทึก →</button></div></li>';
    }).join('') + '</ul>' : '<div class="empty">ยังไม่มีงานชิ้นไหน' + (fStat || filter ? 'ที่ตรงกับที่กรองอยู่' : ' — เพิ่มชิ้นแรกด้านล่างได้เลย (ไอเดียก็ได้)') + '</div>';
    var playable = S.archive.filter(function (a) { return isAudioUrl(a.url) || isAudioUrl(BLOBS[a.id]); });
    if (playable.length) {
      var pick = playable[Math.floor(Date.now() / 864e5) % playable.length];
      h += '<section class="card"><h2><span class="em">⏳</span> LISTEN TO WHO I WAS</h2>' +
        '<p class="sub">สุ่มงานเก่าของคุณขึ้นมาฟัง — ไม่ต้องตัดสิน ไม่ต้องแก้อะไร แค่ฟัง (เปลี่ยนชิ้นทุกวัน)</p>' +
        '<div class="kbox"><b>' + esc(pick.title || '(ไม่มีชื่อ)') + '</b><small>' + esc(pick.date || '—') + (pick.status ? ' · ' + esc(pick.status) : '') + '</small>' + audioFor(pick) + '</div></section>';
    }
    h += '<div class="sec"><h3>＋ เพิ่มงาน</h3><div class="form">' +
      '<label>ชื่อเพลง<input id="aTitle" maxlength="80"></label>' +
      '<label>วันที่<input id="aDate" type="date"></label>' +
      '<label>สถานะ<select id="aStatus">' + ASTAT.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label>แนวคิดเบื้องหลัง<textarea id="aIdea" rows="2"></textarea></label>' +
      '<label>ลิงก์เพลง (ถ้ามี)<input id="aUrl" placeholder="https://…"></label>' +
      '<label>หรือแนบไฟล์เสียง<input id="aFile" type="file" accept="audio/*"></label>' +
      '<p class="ev">ไฟล์ที่แนบใช้ฟังได้เฉพาะในเซสชันนี้ (ไม่เก็บไฟล์ลงเครื่อง) — ถ้าอยากเก็บถาวรให้วางไฟล์ในโฟลเดอร์ music/ แล้วใส่ลิงก์</p>' +
      '<div><button class="btn small" id="aAdd">เก็บเข้าคลัง</button></div></div></div></section>';
    var oid = params().get('open');
    if (oid) {
      var a = S.archive.filter(function (x) { return x.id === oid; })[0];
      if (a) {
        h += '<section class="card"><h2><span class="em">📖</span> ' + esc(a.title || '') + '</h2>' +
          '<p><b>สถานะ:</b> ' + esc(a.status || '') + ' · <b>วันที่:</b> ' + esc(a.date || '—') + '</p>' +
          (a.idea ? '<p><b>แนวคิด:</b> ' + esc(a.idea) + '</p>' : '') + audioFor(a) +
          '<div class="form"><label>บันทึกจากตัวเองในวันที่สร้าง<textarea id="aNote" rows="2">' + esc(a.note || '') + '</textarea></label>' +
          '<div class="rowbtns"><button class="btn small" id="aNoteSave">💾 บันทึก</button> <button class="btn small ghost" id="aDel">ลบงานนี้</button></div></div></section>';
      } else {
        h += '<section class="card"><div class="empty">ไม่เจองานชิ้นนี้ — <a href="?tab=archive">กลับไปคลังเพลง</a></div></section>';
      }
    }
    return h;
  }
  function bindArchive() {
    var q = $('arcQ');
    if (q) q.addEventListener('input', function () {
      clearTimeout(window.__arct);
      window.__arct = setTimeout(function () {
        var st = params().get('st') || '';
        var url = '?tab=archive' + (st ? '&st=' + encodeURIComponent(st) : '') + (q.value.trim() ? '&q=' + encodeURIComponent(q.value.trim()) : '');
        history.replaceState(null, '', url);
        render();
        var nq = $('arcQ');
        if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
      }, 400);
    });
    document.querySelectorAll('audio[data-aid]').forEach(function (au) {
      au.addEventListener('error', function () {
        var p = document.createElement('p');
        p.className = 'ev';
        p.textContent = 'เปิดไฟล์นี้ไม่ได้ — ตรวจลิงก์อีกครั้ง';
        if (au.parentNode) au.parentNode.replaceChild(p, au);
      });
    });
    var add = $('aAdd');
    if (add) add.addEventListener('click', function () {
      var t = ($('aTitle').value || '').trim();
      if (!t && !$('aIdea').value.trim()) return;
      var item = { id: uid('a'), title: t || '(ไม่มีชื่อ)', date: $('aDate').value || '', status: $('aStatus').value, idea: ($('aIdea').value || '').trim(), url: ($('aUrl').value || '').trim(), ts: Date.now() };
      var f = $('aFile').files && $('aFile').files[0];
      if (f) {
        item.uploadName = f.name;
        try { BLOBS[item.id] = URL.createObjectURL(f); } catch (e) {}
      }
      S.archive.push(item);
      try { S = sanitize(S); } catch (e) {}
      save(S); render();
    });
    var ns = $('aNoteSave');
    if (ns) ns.addEventListener('click', function () {
      var oid = params().get('open');
      var a = S.archive.filter(function (x) { return x.id === oid; })[0];
      if (!a) return;
      a.note = ($('aNote').value || '').trim();
      save(S); render();
    });
    var del = $('aDel');
    if (del) del.addEventListener('click', function () {
      var oid = params().get('open');
      if (!oid || !confirm('ลบงานชิ้นนี้ถาวรใช่ไหม? (กู้ไม่ได้)')) return;
      S.archive = S.archive.filter(function (x) { return x.id !== oid; });
      save(S); location.search = '?tab=archive';
    });
    document.querySelectorAll('[data-aopen]').forEach(function (b) {
      b.addEventListener('click', function () { location.search = '?tab=archive&open=' + encodeURIComponent(b.getAttribute('data-aopen')); });
    });
  }

  /* ---------- sanctuary ---------- */
  var ONE_SOUNDS = ['เสียงกลองหนึ่งเสียง', 'เสียงแอมเบียนต์หนึ่งชิ้น', 'คอร์ดหนึ่งคอร์ด', 'เสียงจากสิ่งของรอบตัว', 'เสียงหายใจของตัวเอง', 'เสียงฝน/พัดลมในห้อง'];
  var IMP_ST = ['Resting', 'Maybe Later', 'Still Curious', 'Needs Another Day', 'Archived with Love'];
  function vSanctuary() {
    var ideas = S.ideas.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    var ih = ideas.length ? '<ul class="tl">' + ideas.map(function (w, i) {
      return '<li><b>' + esc(w.text) + '</b> <span class="tag">' + esc(w.status || 'Resting') + '</span><br><small>' + esc(w.note || '') + '</small> ' +
        '<button class="btn small ghost" data-idel="' + i + '">ลบ</button></li>';
    }).join('') + '</ul>' : '<div class="empty">ยังไม่มีไอเดียค้าง — ดีแล้วก็ได้ ไม่ต้องมีก็ได้</div>';
    var diary = S.diary.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 10);
    var dh = diary.length ? '<ul>' + diary.map(function (d) { return '<li><small>' + esc(bkk(d.ts)) + '</small><br>' + esc(d.text) + '</li>'; }).join('') + '</ul>' : '<div class="empty">ยังไม่มีบันทึกเสียง/ข้อความ</div>';
    return '<section class="card"><h2><span class="em">🔥</span> Make Something Without a Reason</h2>' +
      '<p class="sub">ไม่ต้องคิดเรื่องยอดวิว รายได้ อัลกอริทึม — ห้องนี้ปิดทุกอย่างนั้นไว้ข้างนอก</p>' +
      '<div class="sec"><h3>🎲 One Sound</h3><p>คืนนี้ลองเริ่มจาก: <b id="oneSound">' + esc(ONE_SOUNDS[Math.floor(Math.random() * ONE_SOUNDS.length)]) + '</b></p>' +
      '<div class="rowbtns"><button class="btn small ghost" id="oneMore">สุ่มใหม่</button></div></div>' +
      '<div class="sec"><h3>⏱️ Fifteen-Minute Session (ไม่บังคับ)</h3>' +
      '<p class="num" id="timerShow" style="font-size:32px">' + esc(timerText()) + '</p>' +
      '<div class="rowbtns"><button class="btn small" id="tStart">เริ่ม 15 นาที</button> <button class="btn small ghost" id="tStop">หยุด</button></div>' +
      '<p class="ev">หมดเวลาแล้วจะทำต่อ หยุด หรือบันทึกไอเดียก็ได้ — ไม่มีคะแนน</p></div>' +
      '<div class="sec"><h3>🌊 Sound Diary</h3>' + dh +
      '<div class="form"><label>ได้ยิน/อยากลองอะไร<input id="sdText" maxlength="200"></label><div><button class="btn small" id="sdAdd">จดไว้</button></div></div></div>' +
      '<div class="sec"><h3>🌙 Imperfect Ideas (ไม่มีคำว่า failed)</h3>' + ih +
      '<div class="form"><label>ไอเดียที่ยังไม่สมบูรณ์<input id="ideaText" maxlength="200"></label>' +
      '<label>สถานะ<select id="ideaSt">' + IMP_ST.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label>โน้ตสั้นๆ<input id="ideaNote" maxlength="140"></label>' +
      '<div><button class="btn small" id="ideaAdd">เก็บไว้แบบไม่ตัดสิน</button></div></div></div></section>';
  }
  var timerH = null, timerEnd = 0, timerMsg = '';
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function timerText() {
    if (timerEnd > 0) {
      var left = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      return pad2(Math.floor(left / 60)) + ':' + pad2(left % 60);
    }
    return timerMsg || '15:00';
  }
  function paintTimer() {
    var show = $('timerShow');
    var left = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
    if (show) show.textContent = pad2(Math.floor(left / 60)) + ':' + pad2(left % 60);
    if (left <= 0) {
      if (timerH) { clearInterval(timerH); timerH = null; }
      timerEnd = 0;
      timerMsg = 'หมดเวลาแล้ว — จะทำต่อ หยุด หรือจดไอเดียก็ได้ 🤍';
      var s2 = $('timerShow');
      if (s2) s2.textContent = timerMsg;
    }
  }
  function stopTimer(msg) {
    if (timerH) { clearInterval(timerH); timerH = null; }
    timerEnd = 0;
    timerMsg = msg || '';
  }
  function bindSanctuary() {
    var om = $('oneMore');
    if (om) om.addEventListener('click', function () {
      $('oneSound').textContent = ONE_SOUNDS[Math.floor(Math.random() * ONE_SOUNDS.length)];
    });
    var st = $('tStart');
    if (st) st.addEventListener('click', function () {
      if (timerH) return;
      timerMsg = '';
      timerEnd = Date.now() + 15 * 60000;
      paintTimer();
      timerH = setInterval(paintTimer, 1000);
    });
    var sp = $('tStop');
    if (sp) sp.addEventListener('click', function () {
      stopTimer('หยุดแล้ว — พักได้ ไม่ผิดอะไร');
      render();
    });
    var sd = $('sdAdd');
    if (sd) sd.addEventListener('click', function () {
      var v = ($('sdText').value || '').trim();
      if (!v) return;
      S.diary.push({ text: v, ts: Date.now() });
      save(S); render();
    });
    var ia = $('ideaAdd');
    if (ia) ia.addEventListener('click', function () {
      var v = ($('ideaText').value || '').trim();
      if (!v) return;
      S.ideas.push({ text: v, status: $('ideaSt').value, note: ($('ideaNote').value || '').trim(), ts: Date.now() });
      save(S); render();
    });
    document.querySelectorAll('[data-idel]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('ลบไอเดียนี้ใช่ไหม?')) return;
        S.ideas.splice(+b.getAttribute('data-idel'), 1);
        save(S); render();
      });
    });
  }

  /* ---------- letters ---------- */
  function vLetters() {
    var list = S.letters.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    var h = list.length ? '<ul class="tl">' + list.map(function (l, i) {
      var open = !l.openAt || Date.now() >= l.openAt;
      return '<li><b>' + esc(l.title || 'จดหมาย') + '</b><br><small>เขียน ' + esc(bkk(l.ts)) + ' · เปิดได้ ' + (l.openAt ? esc(bkk(l.openAt)) : 'ทุกเมื่อ') + '</small><br>' +
        (open ? esc(l.text) : '<i>🔒 ยังไม่ถึงเวลา (แต่กดเปิดเองได้)</i>') +
        '<div class="rowbtns">' + (open ? '' : '<button class="btn small ghost" data-lopen="' + i + '">เปิดตอนนี้</button> ') + '<button class="btn small ghost" data-ldel="' + i + '">ลบ</button></div></li>';
    }).join('') + '</ul>' : '<div class="empty">ยังไม่มีจดหมาย — เขียนถึงตัวเองในอนาคตสักฉบับไหม</div>';
    return '<section class="card"><h2><span class="em">💌</span> Notes from Different Versions of Me</h2>' +
      '<p class="sub">ส่วนตัวทั้งหมด ไม่เผยแพร่ ไม่ส่งให้ใคร</p>' + h +
      '<div class="sec"><h3>＋ เขียนจดหมาย</h3><div class="form">' +
      '<label>หัวข้อ<input id="lTitle" maxlength="80" placeholder="เช่น ถึงฉันตอนท้อ"></label>' +
      '<label>เนื้อหา<textarea id="lText" rows="3"></textarea></label>' +
      '<label>วันเปิดอ่าน (เว้นได้ = เปิดได้เลย)<input id="lOpen" type="date"></label>' +
      '<div><button class="btn small" id="lAdd">ผนึกจดหมาย</button></div></div></div></section>';
  }
  function bindLetters() {
    var ad = $('lAdd');
    if (ad) ad.addEventListener('click', function () {
      var t = ($('lText').value || '').trim();
      if (!t) return;
      var od = $('lOpen').value;
      S.letters.push({ title: ($('lTitle').value || '').trim() || 'จดหมาย', text: t, openAt: od ? new Date(od + 'T00:00:00+07:00').getTime() : null, ts: Date.now() });
      save(S); render();
    });
    document.querySelectorAll('[data-lopen]').forEach(function (b) {
      b.addEventListener('click', function () {
        var l = S.letters[+b.getAttribute('data-lopen')];
        if (l) { l.openAt = Date.now(); save(S); render(); }
      });
    });
    document.querySelectorAll('[data-ldel]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('ลบจดหมายฉบับนี้ถาวรใช่ไหม?')) return;
        S.letters.splice(+b.getAttribute('data-ldel'), 1);
        save(S); render();
      });
    });
  }

  /* ---------- compass + connections ---------- */
  function vCompass() {
    var c = S.compass || {};
    var qs = D().compassQs.map(function (q, i) {
      return '<div class="sec"><h3>' + (i + 1) + '. ' + esc(q) + '</h3>' +
        '<div class="form"><label>คำตอบของฉัน (แก้ได้เสมอ)<textarea rows="2" data-cq="' + i + '">' + esc(c[i] || '') + '</textarea></label></div></div>';
    }).join('');
    var filled = D().compassQs.filter(function (_, i) { return (c[i] || '').trim(); }).length;
    var snap = filled
      ? '<div class="stmt">ภาพสะท้อนตอนนี้ (จาก ' + filled + '/10 ข้อ, ' + esc(bkk(Date.now())) + '):<br>' +
        D().compassQs.map(function (q, i) { return c[i] ? '· ' + esc(String(c[i]).slice(0, 90)) : null; }).filter(Boolean).join('<br>') +
        '<br><span class="ev">นี่คือภาพชั่วคราว ไม่ใช่คำตัดสิน — เปลี่ยนได้เมื่อใจเปลี่ยน</span></div>'
      : '<div class="empty">ตอบสักข้อสองข้อ ภาพสะท้อนจะขึ้นตรงนี้</div>';
    var conns = (S.connections || []);
    var ch = conns.length ? '<ul>' + conns.map(function (x, i) {
      return '<li>' + esc(x) + ' <button class="btn small ghost" data-cdel="' + i + '">ลบ</button></li>';
    }).join('') + '</ul>' : '<div class="empty">เช่น "โค้ดช่วยให้ฉันทำเว็บขายบีทเองได้"</div>';
    return '<section class="card"><h2><span class="em">🧭</span> Music Compass</h2>' + qs +
      '<div class="rowbtns"><button class="btn small" id="cSave">💾 บันทึกคำตอบ</button></div></section>' +
      '<section class="card"><h2><span class="em">🪞</span> ภาพสะท้อนตอนนี้</h2>' + snap + '</section>' +
      '<section class="card"><h2><span class="em">🔗</span> ด้านต่างๆ สนับสนุนกันอย่างไร (ฉันเขียนเอง)</h2>' + ch +
      '<div class="form"><label>＋ เพิ่ม<input id="cNew" maxlength="200" placeholder="เช่น AI ช่วยฉันทดลองเสียงใหม่ๆ"></label><div><button class="btn small" id="cAdd">เพิ่ม</button></div></div></section>';
  }
  function bindCompass() {
    var sv = $('cSave');
    if (sv) sv.addEventListener('click', function () {
      S.compass = S.compass || {};
      document.querySelectorAll('[data-cq]').forEach(function (el) {
        S.compass[el.getAttribute('data-cq')] = el.value;
      });
      save(S); render();
    });
    var ad = $('cAdd');
    if (ad) ad.addEventListener('click', function () {
      var v = ($('cNew').value || '').trim();
      if (!v) return;
      S.connections.push(v);
      save(S); render();
    });
    document.querySelectorAll('[data-cdel]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('ลบข้อนี้ใช่ไหม?')) return;
        S.connections.splice(+b.getAttribute('data-cdel'), 1);
        save(S); render();
      });
    });
  }

  /* ---------- listening ---------- */
  var drone = null;
  function vListening() {
    var h = '<section class="card"><h2><span class="em">🎧</span> Listening Space</h2>' +
      '<p class="sub">นั่งฟังเฉยๆ ก็ได้ ไม่ต้องทำอะไร</p><div id="libList"><p class="ev">กำลังโหลดคลัง…</p></div></section>';
    h += '<section class="card"><h2><span class="em">🌫️</span> Ambient Drone (เสียงสังเคราะห์ ไม่ใช่เพลงของเธอ)</h2>' +
      '<p class="sub">เปิดเมื่ออยากมีเสียงบรรยากาศ — ปิดเมื่อไหร่ก็ได้</p>' +
      '<div class="rowbtns"><button class="btn small" id="drOn">เปิด drone</button> <button class="btn small ghost" id="drOff">ปิด</button></div>' +
      '<div class="form"><label>ความดัง<input id="drVol" type="range" min="0" max="100" value="25"></label></div></section>';
    return h;
  }
  function bindListening() {
    function row(title, sub, src, id) {
      var fav = (S.favs || []).indexOf(id) >= 0 ? '★' : '☆';
      return '<div class="kbox"><b>' + esc(title) + '</b><small>' + esc(sub) + '</small>' +
        (src ? '<audio controls preload="none" src="' + esc(src) + '"></audio>' : '<p class="ev">ยังไม่มีไฟล์เสียง — เพิ่มลิงก์/ไฟล์จาก Music Archive</p>') +
        '<div class="rowbtns"><button class="btn small ghost" data-fav="' + esc(id) + '">' + fav + ' เพลงสำคัญ</button></div></div>';
    }
    function paint(list) {
      var el = $('libList');
      if (!el) return;
      el.innerHTML = '<div class="kv">' + list.map(function (t) { return row(t.title, t.sub, t.src, t.id); }).join('') + '</div>';
      el.querySelectorAll('[data-fav]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-fav');
          S.favs = S.favs || [];
          var i = S.favs.indexOf(id);
          if (i >= 0) S.favs.splice(i, 1); else S.favs.push(id);
          save(S); render();
        });
      });
    }
    var lib = [];
    (S.archive || []).forEach(function (a) {
      var src = a.url || BLOBS[a.id] || '';
      var sub = (a.status || '') + ' · งานของฉัน';
      if (src && !isAudioUrl(src)) src = '';
      if (!src && (a.uploadName || a.url)) sub += ' · ไม่มีไฟล์เสียงที่เล่นได้';
      lib.push({ id: 'arc:' + a.id, title: a.title || '(ไม่มีชื่อ)', sub: sub, src: src });
    });
    fetch('music/tracks.json').then(function (r) { return r.json(); }).then(function (ts) {
      (ts || []).forEach(function (t) {
        lib.push({ id: 'lib:' + t.id, title: t.id, sub: (t.desc || '') + ' · ' + t.bpm + ' BPM', src: t.file });
      });
      paint(lib);
    }).catch(function () { paint(lib); });
    paint(lib);
    var on = $('drOn'), off = $('drOff');
    function stopDrone() {
      if (drone) { try { drone.stop(); } catch (e) {} drone = null; }
    }
    document.querySelectorAll('#libList audio').forEach(function (au) {
      au.addEventListener('error', function () {
        var p = document.createElement('p');
        p.className = 'ev';
        p.textContent = 'เปิดไฟล์นี้ไม่ได้ — ตรวจลิงก์/ตำแหน่งไฟล์อีกครั้ง';
        if (au.parentNode) au.parentNode.replaceChild(p, au);
      });
    });
    if (on) on.addEventListener('click', function () {
      stopDrone();
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        var ctx = new AC();
        var g = ctx.createGain();
        g.gain.value = (+($('drVol').value || 25)) / 100 * 0.15;
        var f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 400;
        [110, 164.8, 220].forEach(function (fr) {
          var o = ctx.createOscillator();
          o.type = 'sine'; o.frequency.value = fr;
          o.connect(f); o.start();
        });
        f.connect(g); g.connect(ctx.destination);
        drone = { stop: function () { try { ctx.close(); } catch (e) {} }, ctx: ctx, gain: g };
        var vol = $('drVol');
        if (vol && vol.getAttribute('data-bound') !== '1') {
          vol.setAttribute('data-bound', '1');
          vol.addEventListener('input', function () {
            if (drone && drone.gain) drone.gain.gain.value = (+vol.value || 0) / 100 * 0.15;
          });
        }
      } catch (e) { alert('เบราว์เซอร์นี้เปิดเสียงสังเคราะห์ไม่ได้'); }
    });
    if (off) off.addEventListener('click', function () { stopDrone(); });
  }

  /* ---------- notes + daily ---------- */
  function vNotes() {
    var list = S.notes.slice().sort(function (a, b) { return b.ts - a.ts; });
    var nh = list.length ? '<ul>' + list.map(function (n, i) {
      return '<li>' + esc(n.text) + ' <button class="btn small ghost" data-ndel="' + i + '">ลบ</button></li>';
    }).join('') + '</ul>' : '<div class="empty">ยังไม่มีโน้ต</div>';
    var dq = D().dailyQs.map(function (q, i) {
      return '<label>' + esc(q) + '<input data-dq="' + i + '"></label>';
    }).join('');
    var dh = S.daily.slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 10);
    var dhh = dh.length ? '<ul>' + dh.map(function (d) {
      return '<li><small>' + esc(bkk(d.ts)) + (d.rest ? ' · 🛌 วันพัก' : '') + '</small><br>' + esc(d.text) + '</li>';
    }).join('') + '</ul>' : '<div class="empty">ยังไม่มีบันทึก — วันพักก็บันทึกได้ ไม่มีผลลบ</div>';
    return '<section class="card"><h2><span class="em">📓</span> โน้ตสั้นๆ</h2>' + nh +
      '<div class="form"><label>＋ โน้ต<input id="nText" maxlength="200"></label><div><button class="btn small" id="nAdd">จด</button></div></div></section>' +
      '<section class="card"><h2><span class="em">🌙</span> Daily Entry (ไม่บังคับ ไม่นับ streak)</h2>' + dhh +
      '<div class="form">' + dq +
      '<label style="flex-direction:row;align-items:center;gap:8px;display:flex"><input type="checkbox" id="dRest" style="width:auto"> วันนี้พัก (นับเป็นวันพักที่ดี)</label>' +
      '<div><button class="btn small" id="dAdd">บันทึกวันนี้</button></div></div></section>' +
      '<section class="card"><h2><span class="em">🔐</span> สำรองข้อมูลห้องนี้</h2>' +
      '<p class="sub">ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น — Export เก็บไว้ก่อนล้างข้อมูลเว็บ</p>' +
      '<div class="rowbtns"><button class="btn small ghost" id="mExpJson">⬇ Export JSON (สำรองเต็ม)</button> ' +
      '<button class="btn small ghost" id="mExpMd">⬇ Export Markdown (อ่านง่าย ไม่ครบ)</button> ' +
      '<label class="btn small ghost" style="cursor:pointer">⬆ Import JSON<input id="mImpFile" type="file" accept=".json,application/json" hidden></label></div>' +
      '<p class="ev">Markdown = สรุปสำหรับอ่าน ไม่มีทุกฟิลด์ · JSON = สำรองเต็ม ใช้กู้ข้อมูล · Import จะเขียนทับทั้งหมด (มีคำยืนยัน) · ไฟล์เพลงที่แนบไม่ถูกเก็บในไฟล์สำรอง</p></section>';
  }
  function bindNotes() {
    var na = $('nAdd');
    if (na) na.addEventListener('click', function () {
      var v = ($('nText').value || '').trim();
      if (!v) return;
      S.notes.push({ text: v, ts: Date.now() });
      save(S); render();
    });
    document.querySelectorAll('[data-ndel]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('ลบโน้ตนี้ใช่ไหม?')) return;
        S.notes.splice(+b.getAttribute('data-ndel'), 1);
        save(S); render();
      });
    });
    var da = $('dAdd');
    if (da) da.addEventListener('click', function () {
      var parts = [];
      document.querySelectorAll('[data-dq]').forEach(function (el) {
        var v = (el.value || '').trim();
        if (v) parts.push(D().dailyQs[+el.getAttribute('data-dq')] + ' → ' + v);
      });
      var rest = $('dRest').checked;
      if (!parts.length && !rest) return;
      S.daily.push({ text: parts.join(' / ') || 'วันพัก', rest: rest, ts: Date.now() });
      save(S); render();
    });
  }

  /* ---------- return overlay ---------- */
  function bindReturn() {
    var fab = $('returnFab'), box = $('returnBox');
    if (!fab || !box || fab.getAttribute('data-bound') === '1') return;
    fab.setAttribute('data-bound', '1');
    function paintBox() {
      box.innerHTML = '<b>🎵 กลับมาหาเพลง</b>' + D().returnOptions.map(function (o, i) {
        return '<button class="opt" data-rgo="' + i + '">' + esc(o.label) + '</button>';
      }).join('');
      box.querySelectorAll('[data-rgo]').forEach(function (b) {
        b.addEventListener('click', function () {
          var o = D().returnOptions[+b.getAttribute('data-rgo')];
          box.classList.remove('open');
          if (o.id === 'idk') {
            location.search = '?tab=sanctuary&msg=idk';
          } else if (o.go === 'hall') {
            location.search = '?tab=hall';
          } else {
            location.search = '?tab=' + o.go;
          }
        });
      });
    }
    fab.addEventListener('click', function () {
      if (!box.classList.contains('open')) paintBox();
      box.classList.toggle('open');
    });
  }
  function bindAgain() {
    var ag = $('againBtn');
    if (!ag || ag.getAttribute('data-bound') === '1') return;
    ag.setAttribute('data-bound', '1');
    ag.addEventListener('click', function () { location.search = '?tab=listening'; });
  }

  /* ---------- export / import ---------- */
  function dl(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  function exportJSON() {
    dl(new Blob([JSON.stringify({ app: 'musicroom', v: 1, exportedAt: new Date().toISOString(), data: sanitize(S) }, null, 2)], { type: 'application/json;charset=utf-8' }), 'music-room-backup.json');
  }
  function exportMD() {
    var L = [];
    L.push('# THE ROOM WHERE MY MUSIC LIVES — ' + bkk(Date.now()));
    L.push('');
    L.push('## จุดเริ่ม (Origin)');
    D().origins.forEach(function (o) {
      var t = ((S.origins || {})[o.id] || {});
      L.push('### ' + o.no + ' — ' + o.title);
      L.push((t.text !== undefined && t.text !== '') ? t.text : '(ยังไม่ตอบ)');
      L.push('');
    });
    var ol = (S.origins || {}).__letter;
    if (ol && ol.text) { L.push('### จดหมายสำคัญ'); L.push(ol.text); L.push(''); }
    L.push('## จักรวาลเสียง');
    L.push('- แท็ก: ' + ((S.tags || []).join(', ') || '(ยังไม่มี)'));
    ['artists', 'tracks', 'sounds', 'searching'].forEach(function (k) {
      L.push('- ' + k + ': ' + ((S[k] || []).join(', ') || '(ยังไม่มี)'));
    });
    L.push('');
    L.push('## งานที่ทำมา (' + S.archive.length + ')');
    S.archive.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).forEach(function (a) {
      L.push('- [' + (a.status || 'Idea') + '] ' + (a.title || '') + (a.date ? ' · ' + a.date : '') + (a.idea ? ' — ' + a.idea : ''));
    });
    L.push('');
    L.push('## ไอเดียที่ยังไม่สมบูรณ์ (' + S.ideas.length + ')');
    S.ideas.forEach(function (w) { L.push('- [' + (w.status || 'Resting') + '] ' + w.text + (w.note ? ' — ' + w.note : '')); });
    L.push('');
    L.push('## จดหมาย (' + S.letters.length + ')');
    S.letters.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).forEach(function (l) {
      L.push('### ' + (l.title || 'จดหมาย') + ' (เขียน ' + bkk(l.ts) + (l.openAt ? ', เปิดได้ ' + bkk(l.openAt) : '') + ')');
      L.push(l.text);
      L.push('');
    });
    L.push('## เข็มทิศ');
    D().compassQs.forEach(function (q, i) { L.push('- ' + q + ' → ' + (((S.compass || {})[i]) || '(ยังไม่ตอบ)')); });
    L.push('');
    var blob = new Blob(['\ufeff' + L.join('\n')], { type: 'text/markdown;charset=utf-8' });
    dl(blob, 'music-room.md');
  }
  function importJSON(file, done) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var o = JSON.parse(r.result);
        var d = (o && o.app === 'musicroom' && o.data) ? o.data : null;
        if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('bad-schema');
        var clean = sanitize(d);
        var n = clean.archive.length + clean.letters.length + clean.ideas.length + clean.notes.length + clean.daily.length + clean.diary.length;
        if (!confirm('นำเข้าข้อมูล ' + n + ' รายการ? (จะเขียนทับของเดิมทั้งหมด)')) { done('cancelled'); return; }
        S = clean;
        save(S); render();
        done('ok');
      } catch (e) {
        alert('ไฟล์นี้ใช้ไม่ได้: ต้องเป็นไฟล์ music-room-backup.json ที่ export จากห้องนี้');
        done('bad');
      }
    };
    r.readAsText(file);
  }
  function bindExportRoom() {
    var ej = $('mExpJson');
    if (ej) ej.addEventListener('click', exportJSON);
    var em = $('mExpMd');
    if (em) em.addEventListener('click', exportMD);
    var fi = $('mImpFile');
    if (fi) fi.addEventListener('change', function () {
      var f = fi.files && fi.files[0];
      if (f) importJSON(f, function () { fi.value = ''; });
    });
  }

  /* ---------- router ---------- */
  function render() {
    var p = params();
    var tab = p.get('tab') || 'hall';
    var tabs = ['hall', 'origin', 'universe', 'archive', 'sanctuary', 'letters', 'compass', 'listening', 'notes'];
    if (tabs.indexOf(tab) < 0) {
      $('view').innerHTML = '<div class="empty">ไม่เจอห้องนี้ — <a href="?tab=hall">กลับห้องโถง</a></div>';
      return;
    }
    document.querySelectorAll('#tabs button').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    bindReturn();
    bindAgain();
    var view = $('view');
    var q = (p.get('q') || '').trim();
    try {
      if (tab === 'hall') { view.innerHTML = vHall(); var hr = $('hallReturn'); if (hr) hr.addEventListener('click', function () { $('returnFab').click(); }); }
      else if (tab === 'origin') { view.innerHTML = vOrigin(); bindOrigin(); }
      else if (tab === 'universe') { view.innerHTML = vUniverse(); bindUniverse(); }
      else if (tab === 'archive') { view.innerHTML = vArchive(q); bindArchive(); }
      else if (tab === 'sanctuary') { view.innerHTML = vSanctuary(); bindSanctuary(); }
      else if (tab === 'letters') { view.innerHTML = vLetters(); bindLetters(); }
      else if (tab === 'compass') { view.innerHTML = vCompass(); bindCompass(); }
      else if (tab === 'listening') { view.innerHTML = vListening(); bindListening(); }
      else if (tab === 'notes') { view.innerHTML = vNotes(); bindNotes(); bindExportRoom(); }
      if (p.get('msg') === 'idk') {
        view.insertAdjacentHTML('afterbegin', '<section class="card"><h2><span class="em">🤍</span> ไม่เป็นไร</h2><p>คุณไม่จำเป็นต้องรู้ว่าจะสร้างอะไรในตอนนี้ — เริ่มจากการฟังสักเพลงก็ได้</p><div class="rowbtns"><a class="btn small" href="?tab=listening">🎧 ไปฟังเพลง</a></div></section>');
      }
    } catch (e) {
      // ข้อมูลเสียจนวาดไม่ได้ — อย่าทิ้งหน้าจอว่าง: บอกตามตรงแล้วให้เริ่มใหม่/กู้จากไฟล์
      S = blankStore();
      save(S);
      view.innerHTML = '<section class="card"><div class="empty">ข้อมูลในห้องนี้เสียหาย — เริ่มจากห้องว่างให้ก่อน<br>' +
        'ถ้ามีไฟล์สำรอง (music-room-backup.json) กู้ได้ที่แท็บ “โน้ต” → Import JSON<br>' +
        '<div class="rowbtns"><a class="btn small" href="?tab=notes">ไปแท็บโน้ต/สำรองข้อมูล</a> <a class="btn small ghost" href="?tab=hall">กลับห้องโถง</a></div></div></section>';
    }
  }

  document.querySelectorAll('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { location.search = '?tab=' + b.getAttribute('data-tab'); });
  });

  gate();
  render();
})();
