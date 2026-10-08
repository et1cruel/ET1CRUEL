/* ============================================================
   ET1CRUEL LIFE OS — interactive systems layer (incremental)
   - Preserves all original HTML data; this is additive state.
   - Storage: localStorage adapter shaped for Supabase migration.
   - XP curve preserves original numbers: cumulative(L)=(L-1)*5000
     LV21 -> 100,000 threshold, seed 96,500 = 96.5% ... matches page.
   ============================================================ */
(function () {
'use strict';
var LS_KEY = 'et1cruel_lifeos_v1';

/* ---------- Storage adapter (Supabase-ready shape) ---------- */
var Store = {
  load: function () {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted -> reseed below */ }
    return null;
  },
  save: function (state) {
    try {
      state.meta.updatedAt = new Date().toISOString();
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) { toast('Storage full — export backup!', 'danger'); }
  },
  export: function (state) { return JSON.stringify(state, null, 2); },
  import: function (json) { return JSON.parse(json); }
  // FUTURE: swap internals for Supabase:
  // async load() -> supabase.from('life_os_state').select().eq('user_id', uid)
  // tables: quests, stats, money_ledger, projects, content_cards,
  //         achievements, journal, memories, xp_log, settings
};

/* ---------- Seed (mirrors original page values — DO NOT alter originals) ---------- */
function seed() {
  var today = dayKey(new Date());
  return {
    meta: { version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    character: { name: 'ET1CRUEL', level: 21, xp: 96500, hp: 82, mp: 64, role: 'ARTIST / BUILDER', goal: 'PROJECT 1M' },
    streak: { days: {}, best: 0 },           // days: { 'YYYY-MM-DD': count }
    dailies: [
      { id: 'dq-beat',   title: 'ทำ Beat 30 นาที',    cat: 'MUSIC',   xp: 100, stat: 'MUSIC',   pts: 2, done: {}, note: '1 loop จบ = ชนะ' },
      { id: 'dq-loop',   title: 'ทำ Beat 1 loop',     cat: 'MUSIC',   xp: 60,  stat: 'MUSIC',   pts: 1, done: {}, note: 'export เก็บไว้' },
      { id: 'dq-content',title: 'ตัด Content 1 คลิป', cat: 'CONTENT', xp: 120, stat: 'CONTENT', pts: 2, done: {}, note: 'raw > perfect' },
      { id: 'dq-code',   title: 'Coding 30 นาที',     cat: 'TECH',    xp: 100, stat: 'TECH',    pts: 2, done: {}, note: 'Life OS / beatstore' },
      { id: 'dq-gym',    title: 'Exercise',           cat: 'BODY',    xp: 80,  stat: 'BODY',    pts: 2, done: {}, note: 'จ–ศ 18:00' },
      { id: 'dq-learn',  title: 'Learning',           cat: 'MIND',    xp: 60,  stat: 'MIND',    pts: 1, done: {}, note: 'เพลง / โค้ด / หนังสือ' },
      { id: 'dq-medit',  title: 'Meditation',         cat: 'LIFE',    xp: 40,  stat: 'LIFE',    pts: 1, done: {}, note: 'อานาปานสติ 10 นาที' }
    ],
    stats: {
      MUSIC:   { pts: 86, xp: 4300 }, TECH: { pts: 34, xp: 1700 },
      FINANCE: { pts: 40, xp: 2000 }, ART:  { pts: 30, xp: 1500 },
      BODY:    { pts: 28, xp: 1400 }, MIND: { pts: 32, xp: 1600 },
      LIFE:    { pts: 24, xp: 1200 }, CONTENT: { pts: 36, xp: 1800 }
    },
    mainQuest: { name: 'PROJECT 1M', current: 651420, target: 1000000,
      milestones: [500000, 750000, 1000000, 2000000, 10000000] },
    money: {
      vaults: { savings: 409000, kasikorn: 225820, ktb: 0, dime: 3000, cash: 200, stocks: 13000, btc: 400 },
      flow: [ { d: today, type: 'income', amt: 8500, note: 'seed' }, { d: today, type: 'expense', amt: 3200, note: 'seed' } ],
      history: [ { m: 'Jun', v: 33000 }, { m: 'Jul', v: 63300 }, { m: 'Aug', v: 72000 }, { m: 'Sep', v: 651400 }, { m: 'Oct', v: 651420 } ]
    },
    projects: [
      { id: 'p-himori', name: 'HIMORIYACORE', goal: '10 SONG ALBUM', pct: 60, next: 'Finish Track 04', xp: 500, tracks: [1,1,1,0,0,0,0,0,0,0] },
      { id: 'p-beat',   name: 'THAI BEAT ACADEMY', goal: 'Beatstore + Course', pct: 35, next: 'ลง Beatstore 3 บีท', xp: 400 },
      { id: 'p-content',name: 'ET1CRUEL CONTENT', goal: '30 clips', pct: 25, next: 'ตัดคลิปบีทแบบดีๆ 1 ตัว', xp: 300 },
      { id: 'p-tattoo', name: 'TATTOO', goal: 'Stylebook 10 ลาย', pct: 20, next: 'ฝึกหนังเทียม 1 ลาย', xp: 300 },
      { id: 'p-lifeos', name: 'LIFE OS', goal: 'Daily usable dashboard', pct: 45, next: 'ใช้ dashboard นี้ 7 วันติด', xp: 500 }
    ],
    content: [
      { id: 'c1', title: 'Beat Video', stage: 0 }, { id: 'c2', title: 'Ambient Video', stage: 1 },
      { id: 'c3', title: 'Lucky Content', stage: 2 }, { id: 'c4', title: 'Nature', stage: 0 },
      { id: 'c5', title: 'Tech build', stage: 3 }, { id: 'c6', title: 'Art timelapse', stage: 4 }
    ],
    achievements: [
      { id: 'a-beat',  icon: '🎛️', name: 'FIRST BEAT', desc: 'บีทแรกที่ขายได้', unlocked: '2026-06-02' },
      { id: 'a-cust',  icon: '🤝', name: 'FIRST CUSTOMER', desc: 'ลูกค้าคนแรก', unlocked: '2026-06-04' },
      { id: 'a-100k',  icon: '💰', name: 'FIRST 100K', desc: 'สะสมถึง 100K', unlocked: '2026-07-15' },
      { id: 'a-cam',   icon: '🎥', name: 'FIRST CAMERA', desc: 'Insta360 Ace Pro 2', unlocked: '2026-08-20' },
      { id: 'a-cont',  icon: '🎬', name: 'FIRST CONTENT', desc: 'โพสต์คลิปแรก', unlocked: '2026-06-01' },
      { id: 'a-streak',icon: '🔥', name: '7 DAY STREAK', desc: 'ทำ daily ครบ 7 วันติด', unlocked: null },
      { id: 'a-1m',    icon: '👑', name: '1M SAVINGS', desc: 'Net worth 1,000,000 ฿', unlocked: null },
      { id: 'a-100b',  icon: '🎵', name: '100 BEATS', desc: 'ทำบีทครบ 100', unlocked: null },
      { id: 'a-album', icon: '💽', name: 'FIRST ALBUM', desc: 'HIMORIYACORE 10 เพลง', unlocked: null },
      { id: 'a-100kf', icon: '👥', name: '100K FOLLOWERS', desc: 'ผู้ติดตามรวม 100K', unlocked: null },
      { id: 'a-robot', icon: '🤖', name: 'ROBOT PROJECT', desc: 'Aom Universe online', unlocked: null }
    ],
    journal: [],
    memories: [
      { d: '2025-03-14', t: '🐭 Lucky — คู่หูวิญญาณ' },
      { d: '2026-04-10', t: '🖋️ เครื่องสักชิ้นแรก — อาชีพที่สอง' },
      { d: '2026-08-20', t: '🎥 Insta360 Ace Pro 2 — content machine online' },
      { d: '2026-09-01', t: '💰 500K savings vault' },
      { d: '2026-09-15', t: '🎵 ET1CRUEL — ตัวตนศิลปินเต็มตัว' }
    ],
    future: [
      { d: '2027', t: 'ที่ดิน 1–3 ไร่ + บ้านสร้างเอง' },
      { d: '2030', t: '1M → 10M · Aom Universe offline 100%' }
    ],
    xpLog: [],   // {d, amt, why}
    settings: { dailyLimit: 7 }
  };
}

/* ---------- XP / Level math (preserves page identity) ----------
   Page canon: LV 21 · 96,500 / 100,000 XP (96.5%) · NEXT LEVEL 3,500 XP.
   => LV21 spans 95,000 -> 100,000; every level costs 5,000 XP.
   Bar shows cumulative xp / next threshold (matches original topbar). */
var XP_PER_LEVEL = 5000;
var LV21_BASE = 95000;
function nextThreshold(level) { return LV21_BASE + (level - 21 + 1) * XP_PER_LEVEL; } // LV21 -> 100000
function progressToNext(xp, level) {
  var th = nextThreshold(level), base = th - XP_PER_LEVEL;
  var into = Math.max(0, xp - base);
  return { level: level, into: into, need: XP_PER_LEVEL,
    pct: Math.min(100, (xp / th) * 100), remain: Math.max(0, th - xp), threshold: th };
}
function statLevel(pts) { return Math.floor(pts / 20) + 1; }

/* ---------- helpers ---------- */
function dayKey(d) {
  var y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + dd;
}
function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function toast(msg, cls) {
  var box = document.getElementById('os-toasts');
  if (!box) return;
  var t = document.createElement('div');
  t.className = 'os-toast' + (cls ? ' ' + cls : '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2200);
  setTimeout(function () { t.remove(); }, 2700);
}
function levelUpModal(from, to) {
  var bg = document.getElementById('os-modal-bg'), m = document.getElementById('os-modal');
  if (!bg || !m || !bg.classList) return;
  m.innerHTML = '<div style="font-family:\'Chakra Petch\',sans-serif;font-size:12px;letter-spacing:.2em;color:var(--xp);font-weight:700">✦ LEVEL UP ✦</div>' +
    '<div class="big num">LV ' + from + ' → ' + to + '</div>' +
    '<p>Rewards: <b style="color:var(--gold)">+5 MUSIC · +3 TECH · +2 FINANCE</b><br>Title unlocked: <b>DAILY SLAYER</b></p>' +
    '<button class="os-btn" id="os-modal-ok">CONTINUE ⚔</button>';
  bg.classList.add('show');
  var ok = document.getElementById('os-modal-ok');
  if (ok) ok.onclick = function () { bg.classList.remove('show'); };
  bg.onclick = function (e) { if (e.target === bg) bg.classList.remove('show'); };
}

/* ---------- state ---------- */
var S = Store.load() || seed();
Store.save(S);

/* ---------- core ops ---------- */
function addXP(amt, why, statKey, statPts) {
  var before = S.character.level;
  S.character.xp += amt;
  if (statKey && S.stats[statKey]) {
    S.stats[statKey].xp += amt;
    S.stats[statKey].pts += (statPts || 0);
  }
  S.titles = S.titles || [];
  S.xpLog.push({ d: dayKey(new Date()), amt: amt, why: why || '', stat: statKey || null });
  if (S.xpLog.length > 400) S.xpLog = S.xpLog.slice(-400);
  var after = before;
  while (S.character.xp >= nextThreshold(after)) {
    after++;
    // level rewards
    if (S.stats.MUSIC) S.stats.MUSIC.pts += 5;
    if (S.stats.TECH) S.stats.TECH.pts += 3;
    if (S.stats.FINANCE) S.stats.FINANCE.pts += 2;
  }
  S.character.level = after;
  if (after > before) {
    S.titles.push({ name: 'LV ' + after + ' SLAYER', d: dayKey(new Date()) });
    levelUpModal(before, after);
    toast('LEVEL UP! LV ' + before + ' → ' + after, 'xp');
    toast('🏆 Title: LV ' + after + ' SLAYER', 'xp');
    unlock('a-streak', true);
  }
  Store.save(S);
  renderAll();
  return after;
}
function toggleDaily(id) {
  var q = S.dailies.filter(function (x) { return x.id === id; })[0];
  if (!q) return;
  var today = dayKey(new Date());
  if (q.done[today]) {
    delete q.done[today];
    // rollback: subtract XP once (never below 0; level never drops — identity preserved)
    S.character.xp = Math.max(0, S.character.xp - q.xp);
    if (S.stats[q.stat]) { S.stats[q.stat].xp = Math.max(0, S.stats[q.stat].xp - q.xp); S.stats[q.stat].pts = Math.max(0, S.stats[q.stat].pts - q.pts); }
    // NOTE: level never decreases on un-complete (rank identity preserved)
    toast('Quest re-opened: ' + q.title);
  } else {
    q.done[today] = new Date().toISOString();
    var dk = S.streak.days[today] || 0;
    S.streak.days[today] = dk + 1;
    addXP(q.xp, q.title, q.stat, q.pts);
    toast('+' + q.xp + ' XP · +' + q.pts + ' ' + q.stat, 'xp');
    checkAchievements();
    return;
  }
  Store.save(S);
  renderAll();
}
function currentStreak() {
  var n = 0, d = new Date();
  // allow today missing: start from today or yesterday
  if (!S.streak.days[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (S.streak.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function bestStreak() {
  var keys = Object.keys(S.streak.days).sort(), best = 0, run = 0, prev = null;
  keys.forEach(function (k) {
    if (!S.streak.days[k]) return;
    if (prev) {
      var diff = (new Date(k) - new Date(prev)) / 86400000;
      run = (diff === 1) ? run + 1 : 1;
    } else run = 1;
    if (run > best) best = run;
    prev = k;
  });
  return Math.max(best, S.streak.best || 0, currentStreak());
}
function weekActivity() {
  var done = 0, days = {}, d = new Date();
  for (var i = 0; i < 7; i++) { days[dayKey(d)] = false; d.setDate(d.getDate() - 1); }
  Object.keys(days).forEach(function (k) {
    var n = 0;
    S.dailies.forEach(function (q) { if (q.done[k]) { n++; done++; } });
    if (n > 0) days[k] = true;
  });
  var active = Object.keys(days).filter(function (k) { return days[k]; }).length;
  return { done: done, active: active, missed: 7 - active };
}
function lastStatActivity(k) {
  for (var i = S.xpLog.length - 1; i >= 0; i--) {
    if (S.xpLog[i].stat === k) return S.xpLog[i];
  }
  return null;
}
function unlock(id, silent) {
  var a = S.achievements.filter(function (x) { return x.id === id; })[0];
  if (a && !a.unlocked) {
    a.unlocked = dayKey(new Date());
    Store.save(S);
    if (!silent) { toast('🏆 ' + a.name + ' unlocked!', 'xp'); renderAll(); }
  }
}
function checkAchievements() {
  var doneToday = S.dailies.filter(function (q) { return q.done[dayKey(new Date())]; }).length;
  if (doneToday >= 1) unlock('a-beat', true);
  if (currentStreak() >= 7) unlock('a-streak');
  if (netWorth() >= 1000000) unlock('a-1m');
  var himori = S.projects.filter(function (p) { return p.id === 'p-himori'; })[0];
  if (himori && himori.pct >= 100) unlock('a-album');
  S.streak.best = Math.max(S.streak.best || 0, bestStreak());
  Store.save(S);
}
function netWorth() {
  var v = S.money.vaults, s = 0;
  for (var k in v) s += Number(v[k]) || 0;
  return s;
}
function weekXP() {
  var out = 0, d = new Date();
  for (var i = 0; i < 7; i++) {
    var k = dayKey(d);
    S.xpLog.forEach(function (e) { if (e.d === k) out += e.amt; });
    d.setDate(d.getDate() - 1);
  }
  return out;
}

/* ---------- Quest Master (local heuristic — honest, no fake AI) ---------- */
function questMasterPicks() {
  var today = dayKey(new Date());
  var open = S.dailies.filter(function (q) { return !q.done[today]; })
    .sort(function (a, b) { return b.xp - a.xp; }).slice(0, 2)
    .map(function (q) { return { title: q.title, xp: q.xp, stat: q.stat, pts: q.pts, id: q.id }; });
  // weakest stat -> suggest training
  var weak = Object.keys(S.stats).sort(function (a, b) { return S.stats[a].pts - S.stats[b].pts; })[0];
  var statQuest = { title: weak === 'BODY' ? 'เดิน/วิ่ง 20 นาที + ยืดเส้น' : weak === 'FINANCE' ? 'จดรายรับ–รายจ่ายวันนี้ + โอนออม 100฿' : 'Deep work 25 นาทีเพื่อ ' + weak, xp: 150, stat: weak, pts: 2, id: null };
  // project next action
  var proj = S.projects.slice().sort(function (a, b) { return a.pct - b.pct; })[0];
  var pq = proj ? { title: proj.name + ' — ' + proj.next, xp: 200, stat: 'TECH', pts: 2, id: null, proj: proj.id } : statQuest;
  var picks = open.concat([statQuest, pq]).slice(0, 3);
  return { picks: picks, weak: weak };
}
function weeklyReview() {
  var done7 = 0, d = new Date();
  for (var i = 0; i < 7; i++) {
    var k = dayKey(d);
    S.dailies.forEach(function (q) { if (q.done[k]) done7++; });
    d.setDate(d.getDate() - 1);
  }
  var stats = Object.keys(S.stats).map(function (k) { return { k: k, pts: S.stats[k].pts }; })
    .sort(function (a, b) { return b.pts - a.pts; });
  var mq = S.mainQuest;
  return {
    done: done7, xp: weekXP(), streak: currentStreak(), best: bestStreak(),
    strong: stats[0], weak: stats[stats.length - 1],
    moneyPct: Math.min(100, (netWorth() / mq.target) * 100),
    objectives: [
      'ทำ Daily Quest วันละ 3+ ( streak ต่อ — ตอนนี้ ' + currentStreak() + ' วัน )',
      'ดัน ' + stats[stats.length - 1].k + ' (weakest) +6 pts สัปดาห์นี้',
      'ขยับ ' + (S.projects.slice().sort(function (a, b) { return a.pct - b.pct; })[0] || {}).name + ' +10%',
      'ออมเพิ่ม ' + fmt(Math.max(1000, Math.round((mq.target - netWorth()) / 52))) + ' ฿ สู่ 1M',
      'Post content 1 ชิ้น (+100 XP)'
    ]
  };
}

/* ---------- rendering ---------- */
var STAT_ICON = { MUSIC: '🎵', TECH: '💻', FINANCE: '💰', ART: '🎨', BODY: '💪', MIND: '🧠', LIFE: '🌱', CONTENT: '🎬' };
function statRec(k) {
  var r = lastStatActivity(k);
  return r ? '<br>↳ ' + esc(String(r.why).slice(0, 26)) + ' · ' + esc(String(r.d).slice(5)) : '<br>↳ —';
}
function nextQuest() {
  var today = dayKey(new Date());
  var open = S.dailies.filter(function (q) { return !q.done[today]; }).sort(function (a, b) { return b.xp - a.xp; });
  return open[0] || null;
}
function renderHeader() {
  var el = document.getElementById('os-charhead');
  if (!el) return;
  var p = progressToNext(S.character.xp, S.character.level);
  var nq = nextQuest();
  el.innerHTML =
    '<div class="os-next"><div class="qmeta"><span class="badge b-todo">TODAY · ' + esc(dayKey(new Date())) + '</span>' +
    '<span class="badge b-money">🔥 ' + currentStreak() + ' DAYS</span>' +
    '<span class="badge b-done">' + fmt(S.character.xp) + ' XP</span></div>' +
    '<div style="font-family:\'Chakra Petch\',sans-serif;font-size:12px;letter-spacing:.16em;color:var(--gold);font-weight:700">⚔️ NEXT QUEST — WHAT SHOULD I DO TODAY?</div>' +
    (nq ? '<div class="qtitle">' + esc(nq.title) + '</div>' +
      '<div class="os-row"><span class="badge b-money">+' + nq.xp + ' XP</span><span class="badge b-indigo">+' + nq.pts + ' ' + esc(nq.stat) + '</span><span class="badge b-todo">' + esc(nq.cat) + '</span></div>' +
      '<div class="os-row" style="margin-top:14px"><button class="os-btn" data-act="start" data-id="' + nq.id + '">START QUEST ⚔</button>' +
      '<a href="#os-dailies" class="os-btn ghost" style="text-decoration:none;display:inline-block">SEE ALL</a></div>'
      : '<div class="qtitle">✅ All clear — ตัวโหด. พัก / สร้าง / โบนัสเควสต่อ</div><div class="os-row" style="margin-top:12px"><button class="os-btn ghost small" data-act="reset-day">RESET DAILY ↺</button></div>') +
    '</div>' +
    '<div class="os-card"><h3>◆ CHARACTER <span class="rm">LV synced to XP curve</span></h3><div class="os-char">' +
    '<div class="os-avatar"><span>夢</span></div><div><div class="os-charname num">ET1CRUEL · LV ' + S.character.level + '</div>' +
    '<div class="os-role">' + esc(S.character.role) + ' · 🎯 ' + esc(S.character.goal) + '</div></div></div>' +
    '<div class="os-hud"><div class="cell"><small>❤ HP</small><strong class="num">' + S.character.hp + '</strong><div class="os-bar hp"><i style="width:' + S.character.hp + '%"></i></div></div>' +
    '<div class="cell"><small>💧 MP</small><strong class="num">' + S.character.mp + '</strong><div class="os-bar mp"><i style="width:' + S.character.mp + '%"></i></div></div>' +
    '<div class="cell"><small>✦ EXP · LV ' + p.level + '</small><strong class="num">' + fmt(S.character.xp) + ' / ' + fmt(p.threshold) + '</strong><div class="os-bar xp"><i style="width:' + p.pct + '%"></i></div><small style="color:var(--gold)">NEXT LEVEL · ' + fmt(p.remain) + ' XP</small></div></div></div>';
}
function renderDailies() {
  var el = document.getElementById('os-dailies-list');
  if (!el) return;
  var today = dayKey(new Date());
  var done = S.dailies.filter(function (q) { return q.done[today]; }).length;
  el.innerHTML = S.dailies.map(function (q) {
    var is = !!q.done[today];
    return '<div class="dq' + (is ? ' done' : '') + '"><button class="cb" data-act="toggle" data-id="' + q.id + '">' + (is ? '✓' : '○') + '</button>' +
      '<div class="t">' + esc(q.title) + '<small>' + esc(q.note || '') + ' · +' + q.xp + ' XP · +' + q.pts + ' ' + esc(q.stat) + ' ' + (STAT_ICON[q.stat] || '') + '</small></div>' +
      '<span class="badge ' + (is ? 'b-done">DONE' : 'b-todo">' + esc(q.cat)) + '</span></div>';
  }).join('');
  var bar = document.getElementById('os-daily-bar');
  if (bar) bar.innerHTML = '<i style="width:' + (S.dailies.length ? (done / S.dailies.length * 100) : 0) + '%"></i>';
  var lbl = document.getElementById('os-daily-label');
  if (lbl) lbl.textContent = done + ' / ' + S.dailies.length + ' CLEAR';
  // streak dots (last 7)
  var dots = document.getElementById('os-streak-dots');
  if (dots) {
    var h = '', d = new Date();
    d.setDate(d.getDate() - 6);
    for (var i = 0; i < 7; i++) {
      var k = dayKey(d), isT = k === today, hit = !!S.streak.days[k];
      h += '<span class="' + (hit ? 'hit' : '') + (isT ? ' today' : '') + '" title="' + k + '">' + (hit ? '🔥' : d.getDate()) + '</span>';
      d.setDate(d.getDate() + 1);
    }
    dots.innerHTML = h;
  }
  var meta = document.getElementById('os-streak-meta');
  if (meta) { var w = weekActivity(); meta.textContent = 'STREAK ' + currentStreak() + ' · BEST ' + bestStreak() + ' · WEEK ' + w.active + '/7 · +' + fmt(weekXP()) + ' XP'; }
}
function renderStats() {
  var el = document.getElementById('os-stats-grid');
  if (!el) return;
  el.innerHTML = Object.keys(S.stats).map(function (k) {
    var s = S.stats[k], lv = statLevel(s.pts), pct = ((s.pts % 20) / 20 * 100).toFixed(0);
    return '<div class="stat"><span class="lv">LV ' + lv + '</span><b>' + (STAT_ICON[k] || '') + ' ' + k + '</b>' +
      '<div class="os-bar xp"><i style="width:' + pct + '%"></i></div><small>' + s.pts + ' pts · ' + fmt(s.xp) + ' XP' + statRec(k) + '</small></div>';
  }).join('');
}
function renderTreasury() {
  var grid = document.getElementById('treasGrid');
  if (!grid) return; // หน้านี้ไม่มี treasury block
  var v = S.money.vaults, mq = S.mainQuest;
  function sum(keys) { return keys.reduce(function (s, k) { return s + (Number(v[k]) || 0); }, 0); }
  var saveKeys = SAVE_VAULTS.filter(function (k) { return k in v; });
  var spendKeys = Object.keys(v).filter(function (k) { return saveKeys.indexOf(k) < 0; });
  var saveT = sum(saveKeys), spendT = sum(spendKeys), total = saveT + spendT;
  var savePct = total ? (saveT / total * 100) : 0, spendPct = total ? (spendT / total * 100) : 0;
  var bossPct = Math.min(100, total / mq.target * 100);
  function rows(keys) {
    return keys.map(function (k) {
      return '<div class="vrow"><span>' + esc(VAULT_LABEL[k] || k) + '</span><b>' + fmt(v[k]) + '</b></div>';
    }).join('');
  }
  grid.innerHTML =
    '<div class="vault save"><small>🛡️ SAVINGS VAULT · เงินเก็บ</small>' +
    '<div class="vamt num">' + fmt(saveT) + ' ฿</div>' + rows(saveKeys) +
    '<div class="vbar"><i style="width:' + savePct.toFixed(1) + '%;background:linear-gradient(90deg,#4DA6FF,#8ec5ff);box-shadow:0 0 10px rgba(77,166,255,.6)"></i></div>' +
    '<div class="treas-foot" style="text-align:left;margin-top:8px">สัดส่วน <b>' + savePct.toFixed(1) + '%</b> ของทั้งหมด</div></div>' +
    '<div class="vault spend"><small>⚡ SPEND WALLET · เงินใช้จ่าย</small>' +
    '<div class="vamt num">' + fmt(spendT) + ' ฿</div>' + rows(spendKeys) +
    '<div class="vrow" style="border-top:1px solid var(--gold-dim);color:var(--gold)"><span>' + spendKeys.map(function (k) { return fmt(v[k]); }).join('+') + ' =</span><b style="color:var(--gold)">' + fmt(spendT) + '</b></div>' +
    '<div class="vbar"><i style="width:' + spendPct.toFixed(1) + '%;background:linear-gradient(90deg,#FBBF24,#ffef9e)"></i></div></div>' +
    '<div class="vault boss"><small>👑 BOSS CHEST · ยอดรวม</small>' +
    '<div class="vamt num">' + fmt(total) + ' ฿</div>' +
    '<div class="vrow"><span>เงินเก็บ</span><b>' + fmt(saveT) + '</b></div>' +
    '<div class="vrow"><span>เงินใช้จ่าย</span><b>' + fmt(spendT) + '</b></div>' +
    '<div class="vrow" style="border-top:1px solid var(--gold-dim);color:var(--gold)"><span>' + fmt(saveT) + ' + ' + fmt(spendT) + ' =</span><b style="color:var(--gold)">' + fmt(total) + '</b></div>' +
    '<div class="vbar"><i style="width:' + bossPct.toFixed(1) + '%;background:repeating-linear-gradient(-55deg,var(--gold) 0 10px,#15803d 10px 20px);animation:slide 1s linear infinite"></i></div></div>';
  var tt = document.getElementById('treasTotal');
  if (tt) tt.textContent = fmt(total) + ' ฿';
  var foot = document.getElementById('treasFoot');
  if (foot) {
    var remain = Math.max(0, mq.target - total);
    foot.innerHTML = 'สูตร: <b>' + fmt(saveT) + ' + (' + spendKeys.map(function (k) { return fmt(v[k]); }).join(' + ') + ') = ' + fmt(total) + '</b> · เหลืออีก <b>' + fmt(remain) + '</b> ถึงบอสใหญ่ 1,000,000 ฿ ⚔';
  }
  var nav = document.getElementById('navTreas');
  if (nav) nav.textContent = total >= 1000 ? Math.round(total / 1000) + 'K' : fmt(total);
  var hud = document.getElementById('moneyHudAmt');
  if (hud) hud.textContent = fmt(total);
}
function renderMoney() {
  var el = document.getElementById('os-money-body');
  if (!el) return;
  var mq = S.mainQuest, nw = netWorth();
  var pct = Math.min(100, (nw / mq.target * 100));
  var stones = mq.milestones.map(function (m) {
    var cls = nw >= m ? 'hit' : (m === mq.milestones.filter(function (x) { return x > nw; })[0] ? 'next' : '');
    return '<span class="' + cls + '">' + (nw >= m ? '✓ ' : '') + (m >= 1000000 ? (m / 1000000) + 'M' : (m / 1000) + 'K') + '</span>';
  }).join('');
  var flow = { income: 0, expense: 0 };
  S.money.flow.forEach(function (f) { if (f.type === 'income') flow.income += f.amt; else if (f.type === 'expense') flow.expense += f.amt; });
  var histMax = Math.max.apply(null, S.money.history.map(function (h) { return h.v; }).concat([1]));
  var hist = S.money.history.map(function (h) {
    return '<div style="flex:1;text-align:center"><div style="height:70px;display:flex;align-items:flex-end;justify-content:center"><div style="width:70%;border-radius:6px 6px 0 0;background:linear-gradient(180deg,var(--gold),#15803d);height:' + Math.max(4, (h.v / histMax * 100)) + '%"></div></div><small style="color:var(--muted);font-family:\'Chakra Petch\',sans-serif;font-size:10.5px">' + esc(h.m) + '<br>' + fmt(h.v) + '</small></div>';
  }).join('');
  el.innerHTML =
    '<div class="mq-big num">' + fmt(nw) + ' ฿</div>' +
    '<div class="os-bar xp" style="height:16px;margin:10px 0"><i style="width:' + pct + '%"></i></div>' +
    '<div class="os-row"><span class="badge b-money">' + pct.toFixed(1) + '% OF 1M</span><span class="badge b-todo">REMAINING ' + fmt(mq.target - nw) + ' ฿</span></div>' +
    '<div class="mstones">' + stones + '</div>' +
    '<div class="group-title" style="margin-top:16px"><span class="gnum">฿</span> NET WORTH HISTORY</div>' +
    '<div style="display:flex;gap:6px;align-items:flex-end;background:#0B0D14;border:1px solid #343c58;border-radius:12px;padding:12px">' + hist + '</div>' +
    '<div class="group-title"><span class="gnum">⇄</span> MONEY FLOW (this log)</div>' +
    '<div class="os-row"><span class="badge b-done">IN +' + fmt(flow.income) + '</span><span class="badge" style="border-color:#FF4D5E;color:#ff8b96">OUT −' + fmt(flow.expense) + '</span><span class="badge b-indigo">NET ' + (flow.income - flow.expense >= 0 ? '+' : '') + fmt(flow.income - flow.expense) + '</span></div>' +
    '<div class="os-row" style="margin-top:10px"><input class="os-input" id="os-flow-amt" type="number" placeholder="จำนวน ฿" style="max-width:150px;margin:0"><select class="os-sel" id="os-flow-type" style="max-width:150px;margin:0"><option value="income">+ Income</option><option value="expense">− Expense</option><option value="investment">⇄ Investment</option><option value="saving">🛡 Saving</option></select><button class="os-btn small" data-act="flow-add">ADD</button></div>' +
    '<div class="os-row" style="margin-top:8px"><button class="os-btn small ghost" data-act="vault-toggle">EDIT VAULTS</button><button class="os-btn small ghost" data-act="hist-toggle">+ HISTORY</button></div><div id="os-vault-edit"></div><div id="os-hist-edit"></div>';
  var ve = document.getElementById('os-vault-edit');
  if (ve) ve.innerHTML = OSUI.vaultEdit ? Object.keys(S.money.vaults).map(function (k) {
    return '<div class="os-row" style="margin-top:6px"><span class="badge b-indigo" style="min-width:140px">' + esc(VAULT_LABEL[k] || k) + '</span><input class="os-input" id="os-vault-' + k + '" type="number" value="' + S.money.vaults[k] + '" style="max-width:150px;margin:0"></div>';
  }).join('') + '<button class="os-btn small" data-act="vault-save" style="margin-top:8px">SAVE VAULTS</button>' : '';
  var he = document.getElementById('os-hist-edit');
  if (he) he.innerHTML = OSUI.histEdit ? '<div class="os-row" style="margin-top:8px"><input class="os-input" id="os-hist-m" placeholder="เดือน (เช่น Oct)" style="max-width:110px;margin:0"><input class="os-input" id="os-hist-v" type="number" placeholder="net worth ฿" style="max-width:150px;margin:0"><button class="os-btn small" data-act="hist-add">ADD</button></div>' : '';
}
function renderProjects() {
  var el = document.getElementById('os-projects-list');
  if (!el) return;
  el.innerHTML = S.projects.map(function (p) {
    var tracks = p.tracks ? '<div class="os-row" style="margin-top:6px">' + p.tracks.map(function (t, i) {
      return '<button data-act="track" data-id="' + p.id + '" data-i="' + i + '" style="background:' + (t ? 'var(--xp)' : '#0B0D14') + ';border:1px solid ' + (t ? 'var(--xp)' : '#3d4666') + ';color:' + (t ? '#06130c' : 'var(--muted)') + ';border-radius:6px;font-size:10px;padding:2px 7px;cursor:pointer;font-family:\'Chakra Petch\',sans-serif">T' + ('0' + (i + 1)).slice(-2) + '</button>';
    }).join('') + '</div>' : '';
    var stat = PROJ_STAT[p.id] || 'TECH';
    var tasks = (p.tasks || []).map(function (t, i) {
      return '<div class="os-task"><button class="' + (t.done ? 'done' : '') + '" data-act="task" data-id="' + p.id + '" data-i="' + i + '">' + (t.done ? '✓' : '○') + '</button><span class="' + (t.done ? 'tdone' : '') + '">' + esc(t.t) + '</span></div>';
    }).join('');
    return '<div class="proj-os"><div class="os-row"><b>' + esc(p.name) + '</b><span class="badge b-money" style="margin-left:auto">' + p.pct + '%</span></div>' +
      '<small style="color:var(--muted)">' + esc(p.goal) + ' · +' + p.xp + ' XP · ' + stat + '</small><br>' +
      '<small style="color:var(--muted)">NEXT: ' + esc(p.next) + ' · 🗓 <input class="os-input os-deadline" data-id="' + p.id + '" value="' + esc(p.deadline || '') + '" placeholder="deadline" style="display:inline-block;width:130px;margin:0;padding:4px 8px;font-size:12px"></small>' +
      '<div class="os-bar xp"><i style="width:' + p.pct + '%"></i></div>' + tracks + tasks +
      '<div class="os-row" style="margin-top:6px"><input class="os-input" id="os-task-' + p.id + '" placeholder="+ task" style="flex:1;margin:0;padding:6px 10px;font-size:12.5px"><button class="os-btn small ghost" data-act="task-add" data-id="' + p.id + '">ADD</button></div>' +
      '<div class="os-row" style="margin-top:8px"><button class="os-btn small ghost" data-act="proj-dec" data-id="' + p.id + '">−10%</button><button class="os-btn small ghost" data-act="proj-inc" data-id="' + p.id + '">+10%</button><button class="os-btn small" data-act="proj-done" data-id="' + p.id + '">SHIP +XP</button></div></div>';
  }).join('');
}
var KSTAGES = ['IDEAS', 'SHOOTING', 'EDITING', 'READY', 'POSTED'];
var KXP = [10, 30, 50, 80, 100];
function renderKanban() {
  var el = document.getElementById('os-kanban');
  if (!el) return;
  el.innerHTML = KSTAGES.map(function (st, si) {
    var cards = S.content.filter(function (c) { return c.stage === si; }).map(function (c) {
      return '<div class="kcard">' + esc(c.title) + '<small>+' + KXP[si] + ' XP · ' + st + '</small><div class="mv2">' +
        (si > 0 ? '<button data-act="k-left" data-id="' + c.id + '">◀</button>' : '') +
        (si < 4 ? '<button data-act="k-right" data-id="' + c.id + '">▶</button>' : '<span style="font-size:11px;color:var(--xp);font-family:\'Chakra Petch\',sans-serif">POSTED ✓</span>') +
        '</div></div>';
    }).join('');
    return '<div class="kcol"><h4>' + st + '</h4>' + (cards || '<small style="color:#3d4666">— empty —</small>') + '</div>';
  }).join('');
}
function renderAch() {
  var el = document.getElementById('os-ach-list');
  if (!el) return;
  el.innerHTML = S.achievements.map(function (a) {
    var cond = ACH_COND[a.id] ? '🎯 ' + ACH_COND[a.id] : '';
    return '<div class="ach' + (a.unlocked ? '' : ' lock') + '"><div class="ic">' + (a.unlocked ? a.icon : '🔒') + '</div>' +
      '<div><b>' + esc(a.name) + '</b><small>' + esc(a.desc) + (cond ? '<br>' + esc(cond) : '') + '</small></div>' +
      '<span class="dt">' + (a.unlocked ? '✓ ' + esc(a.unlocked) : 'LOCKED') + '</span></div>';
  }).join('');
  var tl = document.getElementById('os-titles-list');
  if (tl) tl.innerHTML = (S.titles && S.titles.length) ? S.titles.map(function (t) { return '<span class="os-title">🎖 ' + esc(t.name) + '</span>'; }).join(' ') : '<small style="color:var(--muted)">Level up เพื่อปลดล็อก title แรก</small>';
}
function renderJournal() {
  var el = document.getElementById('os-journal-list');
  if (!el) return;
  if (!S.journal.length) el.innerHTML = '<small style="color:var(--muted)">ยังไม่มีบันทึก — วันนี้รู้สึกอย่างไร? เริ่ม log แรกเลย</small>';
  else el.innerHTML = S.journal.slice().reverse().slice(0, 10).map(function (j) {
    return '<div class="jentry"><small>' + esc(j.d) + ' · ' + esc(j.mood) + (j.tags ? ' · ' + esc(j.tags) : '') + '</small><b style="display:block;margin-top:4px">' + esc(j.title || 'Log') + '</b><p>' + esc(j.text) + '</p><button class="os-btn small danger" data-act="j-del" data-id="' + j.id + '">DELETE</button></div>';
  }).join('');
  var mem = document.getElementById('os-memory-list');
  if (mem) {
    mem.innerHTML = '<div class="mem-tl">' + S.memories.concat(S.future.map(function (f) { return { d: f.d, t: f.t + ' <span style="color:var(--gold)">· FUTURE</span>' }; })).map(function (m) {
      return '<div class="mi"><small>' + esc(m.d) + '</small><br><b>' + m.t + '</b></div>';
    }).join('') + '</div>';
  }
}
function renderQM() {
  var el = document.getElementById('os-qm-list');
  if (!el) return;
  var qm = questMasterPicks();
  el.innerHTML = qm.picks.map(function (q, i) {
    return '<div class="qm-q"><small style="font-family:\'Chakra Petch\',sans-serif;color:var(--gold);font-size:11px;letter-spacing:.1em">QUEST #' + (i + 1) + ' · WEAKEST: ' + esc(qm.weak) + '</small><br><b>' + esc(q.title) + '</b><br><div class="os-row" style="margin-top:6px"><span class="badge b-money">+' + q.xp + ' XP</span><span class="badge b-indigo">+' + q.pts + ' ' + esc(q.stat) + '</span>' +
      (q.id ? '<button class="os-btn small" data-act="toggle" data-id="' + q.id + '">ACCEPT ⚔</button>' : '<button class="os-btn small" data-act="qm-accept" data-t="' + esc(q.title) + '" data-xp="' + q.xp + '" data-stat="' + esc(q.stat) + '">ACCEPT ⚔</button>') + '</div></div>';
  }).join('');
  var wr = document.getElementById('os-weekly');
  if (wr) {
    var w = weeklyReview();
    wr.innerHTML = '<div class="os-row"><span class="badge b-done">DONE ' + w.done + '</span><span class="badge b-money">+' + fmt(w.xp) + ' XP/WK</span><span class="badge b-indigo">STRONG ' + esc(w.strong.k) + '</span><span class="badge b-todo">WEAK ' + esc(w.weak.k) + '</span></div>' +
      '<div class="group-title"><span class="gnum">→</span> NEXT WEEK OBJECTIVES</div><ul style="margin-left:20px;color:#DDE3F5;font-size:14.5px;line-height:2">' + w.objectives.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('') + '</ul>';
  }
}
function renderSysStatus() {
  var el = document.getElementById('os-sysstatus');
  if (!el) return;
  var rows = [['Dashboard', 1], ['Daily Quest', 1], ['XP System', 1], ['Level System', 1], ['Stats', 1], ['Money OS', 1], ['Projects', 1], ['Content', 1], ['Achievements', 1], ['Journal', 1], ['Timeline', 1], ['AI Quest Master', 0], ['Supabase', 0]];
  el.innerHTML = rows.map(function (r) {
    return '<span class="badge ' + (r[1] ? 'b-done' : 'b-indigo') + '">' + r[0] + ' ' + (r[1] ? '✓' : '○ READY FOR BACKEND') + '</span>';
  }).join(' ');
}
function renderAll() {
  renderHeader(); renderDailies(); renderStats(); renderMoney(); renderTreasury();
  renderProjects(); renderKanban(); renderAch(); renderJournal(); renderQM(); renderSysStatus();
}

/* ---------- events (delegated, no inline handlers to keep CSP calm) ---------- */
document.addEventListener('click', function (e) {
  var b = e.target.closest ? e.target.closest('[data-act]') : null;
  if (!b) return;
  var act = b.getAttribute('data-act'), id = b.getAttribute('data-id');
  if (act === 'toggle') toggleDaily(id);
  else if (act === 'start') { toggleDaily(id); var t = document.getElementById('os-dailies'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (act === 'reset-day') {
    var today = dayKey(new Date());
    S.dailies.forEach(function (q) { delete q.done[today]; });
    Store.save(S); renderAll(); toast('Daily quests reset for today ↺');
  }
  else if (act === 'flow-add') {
    var amt = parseInt((document.getElementById('os-flow-amt') || {}).value, 10);
    var type = (document.getElementById('os-flow-type') || {}).value || 'income';
    if (!amt || amt <= 0) { toast('ใส่จำนวนก่อน'); return; }
    S.money.flow.push({ d: dayKey(new Date()), type: type, amt: amt, note: 'manual' });
    if (type === 'income' || type === 'saving') S.money.vaults.cash = (S.money.vaults.cash || 0) + amt;
    if (type === 'expense' || type === 'investment') S.money.vaults.cash = Math.max(0, (S.money.vaults.cash || 0) - amt);
    if (type === 'saving') addXP(50, 'Saving +' + amt, 'FINANCE', 1);
    Store.save(S); renderAll(); checkAchievements(); toast('Money logged: ' + type + ' ' + fmt(amt) + ' ฿', 'xp');
  }
  else if (act === 'proj-inc' || act === 'proj-dec') {
    var p = S.projects.filter(function (x) { return x.id === id; })[0];
    if (p) { p.pct = Math.min(100, Math.max(0, p.pct + (act === 'proj-inc' ? 10 : -10))); Store.save(S); renderAll(); }
  }
  else if (act === 'proj-done') {
    var p2 = S.projects.filter(function (x) { return x.id === id; })[0];
    if (p2) { p2.pct = Math.min(100, p2.pct + 10); addXP(150, p2.name + ' ship', 'TECH', 2); toast('+' + 150 + ' XP · ' + p2.name, 'xp'); }
  }
  else if (act === 'track') {
    var p3 = S.projects.filter(function (x) { return x.id === id; })[0];
    var i = parseInt(b.getAttribute('data-i'), 10);
    if (p3 && p3.tracks) {
      p3.tracks[i] = p3.tracks[i] ? 0 : 1;
      var done = p3.tracks.filter(Boolean).length;
      p3.pct = Math.round(done / p3.tracks.length * 100);
      if (p3.tracks[i]) addXP(100, p3.name + ' track', 'MUSIC', 1);
      else { Store.save(S); renderAll(); }
    }
  }
  else if (act === 'k-left' || act === 'k-right') {
    var c = S.content.filter(function (x) { return x.id === id; })[0];
    if (c) {
      c.stage = Math.min(4, Math.max(0, c.stage + (act === 'k-right' ? 1 : -1)));
      if (act === 'k-right') addXP(KXP[c.stage], 'Content → ' + KSTAGES[c.stage], 'CONTENT', 1);
      else { Store.save(S); renderAll(); }
    }
  }
  else if (act === 'qm-accept') {
    addXP(parseInt(b.getAttribute('data-xp'), 10) || 150, b.getAttribute('data-t'), b.getAttribute('data-stat'), 2);
    toast('Quest accepted ⚔ +' + b.getAttribute('data-xp') + ' XP', 'xp');
  }
  else if (act === 'j-add') {
    var mood = (document.getElementById('os-j-mood') || {}).value || '🙂';
    var text = ((document.getElementById('os-j-text') || {}).value || '').trim();
    var tags = ((document.getElementById('os-j-tags') || {}).value || '').trim();
    if (!text) { toast('เขียนอะไรนิดนึงก่อน'); return; }
    S.journal.push({ id: 'j' + Date.now(), d: dayKey(new Date()), mood: mood, title: text.split('\n')[0].slice(0, 40), text: text, tags: tags });
    document.getElementById('os-j-text').value = ''; document.getElementById('os-j-tags').value = '';
    addXP(30, 'Journal', 'MIND', 1);
  }
  else if (act === 'j-del') {
    S.journal = S.journal.filter(function (j) { return j.id !== id; });
    Store.save(S); renderAll();
  }
  else if (act === 'mem-add') {
    var mt = ((document.getElementById('os-mem-text') || {}).value || '').trim();
    if (!mt) { toast('ใส่ memory ก่อน'); return; }
    S.memories.push({ d: dayKey(new Date()), t: mt });
    document.getElementById('os-mem-text').value = '';
    Store.save(S); renderAll(); toast('Memory saved ✦', 'xp');
  }
  else if (act === 'future-add') {
    var ft = ((document.getElementById('os-future-text') || {}).value || '').trim();
    if (!ft) { toast('ใส่ future goal ก่อน'); return; }
    S.future.push({ d: '20XX', t: ft });
    document.getElementById('os-future-text').value = '';
    Store.save(S); renderAll(); toast('Future goal set 🎯', 'xp');
  }
  else if (act === 'dq-add') {
    var dt = ((document.getElementById('os-dq-text') || {}).value || '').trim();
    if (!dt) { toast('ใส่ชื่อเควสก่อน'); return; }
    if (S.dailies.length >= (S.settings.dailyLimit || 12)) { toast('Daily limit reached (' + S.settings.dailyLimit + ') — เพิ่ม limit ใน Settings'); return; }
    S.dailies.push({ id: 'dq' + Date.now(), title: dt, cat: 'LIFE', xp: 50, stat: 'LIFE', pts: 1, done: {}, note: 'custom' });
    document.getElementById('os-dq-text').value = '';
    Store.save(S); renderAll();
  }
  else if (act === 'limit-save') {
    var lim = parseInt((document.getElementById('os-limit-input') || {}).value, 10);
    if (lim >= 1 && lim <= 30) { S.settings.dailyLimit = lim; Store.save(S); renderAll(); toast('Daily limit = ' + lim); }
    else toast('Limit 1–30');
  }
  else if (act === 'vault-toggle') { OSUI.vaultEdit = !OSUI.vaultEdit; renderAll(); }
  else if (act === 'vault-save') {
    Object.keys(S.money.vaults).forEach(function (k) {
      var vi = document.getElementById('os-vault-' + k);
      if (vi) { var vv = parseInt(vi.value, 10); if (!isNaN(vv) && vv >= 0) S.money.vaults[k] = vv; }
    });
    OSUI.vaultEdit = false; Store.save(S); renderAll(); checkAchievements(); toast('Vaults updated 💰', 'xp');
  }
  else if (act === 'hist-toggle') { OSUI.histEdit = !OSUI.histEdit; renderAll(); }
  else if (act === 'hist-add') {
    var hm = ((document.getElementById('os-hist-m') || {}).value || '').trim() || 'Now';
    var hv = parseInt((document.getElementById('os-hist-v') || {}).value, 10);
    if (!hv || hv <= 0) { toast('ใส่มูลค่าก่อน'); return; }
    S.money.history.push({ m: hm, v: hv });
    if (S.money.history.length > 12) S.money.history = S.money.history.slice(-12);
    OSUI.histEdit = false; Store.save(S); renderAll(); toast('History added 📈', 'xp');
  }
  else if (act === 'task') {
    var pt = S.projects.filter(function (x) { return x.id === id; })[0];
    var ti = parseInt(b.getAttribute('data-i'), 10);
    if (pt && pt.tasks && pt.tasks[ti]) {
      pt.tasks[ti].done = !pt.tasks[ti].done;
      if (pt.tasks[ti].done) addXP(30, pt.name + ': ' + pt.tasks[ti].t, PROJ_STAT[pt.id] || 'TECH', 1);
      else { Store.save(S); renderAll(); }
    }
  }
  else if (act === 'task-add') {
    var pa = S.projects.filter(function (x) { return x.id === id; })[0];
    var ta = document.getElementById('os-task-' + id);
    var tv = ((ta || {}).value || '').trim();
    if (!pa || !tv) { toast('ใส่ชื่อ task ก่อน'); return; }
    pa.tasks = pa.tasks || []; pa.tasks.push({ t: tv, done: false });
    Store.save(S); renderAll();
  }
  else if (act === 'export') {
    var blob = new Blob([Store.export(S)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'life-os-backup.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Exported life-os-backup.json ✓', 'xp');
  }
  else if (act === 'reset-all') {
    if (confirm('Reset Life OS progress? (original page content ไม่หาย — reset แค่ XP/daily state)')) {
      localStorage.removeItem(LS_KEY); S = seed(); Store.save(S); renderAll(); toast('Life OS reset ↺');
    }
  }
  else if (act === 'hpmp') {
    // tiny life sim: completing quests restores a bit
    S.character.hp = Math.min(100, S.character.hp + 1);
    S.character.mp = Math.max(0, S.character.mp - 1);
    Store.save(S); renderAll();
  }
});

/* import file */
document.addEventListener('change', function (e) {
  if (e.target && e.target.classList && e.target.classList.contains('os-deadline')) {
    var pd = S.projects.filter(function (x) { return x.id === e.target.getAttribute('data-id'); })[0];
    if (pd) { pd.deadline = e.target.value; Store.save(S); toast('Deadline saved 🗓'); }
    return;
  }
  if (e.target && e.target.id === 'os-theme-sel') {
    S.settings.theme = e.target.value; Store.save(S); applyTheme(); toast('Theme: ' + e.target.value);
    return;
  }
  if (e.target && e.target.id === 'os-import-file') {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = Store.import(r.result);
        if (!data.character || !data.dailies) throw new Error('bad file');
        S = data; Store.save(S); renderAll(); toast('Imported ✓', 'xp');
      } catch (err) { toast('Import failed — ไฟล์ไม่ถูกต้อง'); }
    };
    r.readAsText(f);
  }
});

/* ---------- boot + migrations (never reset user data) ---------- */
var ACH_COND = {
  'a-beat': 'ขายบีทแรกได้', 'a-cust': 'ปิดลูกค้าคนแรก', 'a-100k': 'Net worth 100K',
  'a-cam': 'ซื้อ Insta360 Ace Pro 2', 'a-cont': 'โพสต์คลิปแรก',
  'a-streak': 'Daily ครบ 7 วันติด', 'a-1m': 'Net worth 1,000,000 ฿',
  'a-100b': 'ทำบีทครบ 100', 'a-album': 'HIMORIYACORE 100%',
  'a-100kf': 'ผู้ติดตามรวม 100K', 'a-robot': 'Aom Universe online'
};
var PROJ_STAT = { 'p-himori': 'MUSIC', 'p-beat': 'FINANCE', 'p-content': 'CONTENT', 'p-tattoo': 'ART', 'p-lifeos': 'TECH' };
var PROJ_TASKS = {
  'p-himori': ['Finish Track 04', 'Mix / master', 'Cover art'],
  'p-beat': ['ลง Beatstore 3 บีท', 'TikTok loop 3 คลิป', 'Drumkit pack'],
  'p-content': ['ตัดคลิปบีท 1 ตัว', 'โพสต์ 1 ชิ้น', 'Lucky content 1'],
  'p-tattoo': ['ฝึกหนังเทียม 1 ลาย', 'Stylebook 3 ลาย', 'รับสักจริง 1'],
  'p-lifeos': ['ใช้ dashboard 7 วันติด', 'Export backup', 'ต่อ Supabase']
};
var PROJ_DEADLINE = { 'p-himori': '2026-12-31', 'p-beat': '2026-11-30', 'p-content': 'ongoing', 'p-tattoo': '2026-12-31', 'p-lifeos': 'ongoing' };
var VAULT_LABEL = { savings: '🌱 Kept Grow', kasikorn: '💳 กสิกร e-Sav', ktb: '🏦 KTB e-Sav', dime: '💚 DIME Save', cash: '💵 เงินสด', stocks: '📈 DIME US', btc: '₿ BTC' };
var SAVE_VAULTS = ['savings'];
var DEF_VAULTS = { savings: 409000, kasikorn: 225820, ktb: 0, dime: 3000, cash: 200, stocks: 13000, btc: 400 };
var OLD_VAULTS = { kasikorn: 425820, ktb: 2000, dime: 2000, stocks: 11000 }; // ค่า default เก่า — ถ้ายังไม่เคยแก้ให้อัปเป็นยอดใหม่
var OSUI = { vaultEdit: false, histEdit: false };
function migrate() {
  S.titles = S.titles || [];
  S.settings = S.settings || { dailyLimit: 7 };
  if (!S.settings.theme) S.settings.theme = 'dark';
  if (!S.settings.dailyLimit) S.settings.dailyLimit = 7;
  // รวม vaults ใหม่ (Krungsri) + อัปยอดเก่าที่ยังไม่เคยแก้ — ไม่ทับค่าที่ผู้ใช้แก้เอง
  S.money = S.money || { vaults: {}, flow: [], history: [] };
  S.money.vaults = S.money.vaults || {};
  Object.keys(DEF_VAULTS).forEach(function (k) {
    if (typeof S.money.vaults[k] !== 'number') S.money.vaults[k] = DEF_VAULTS[k];
  });
  Object.keys(OLD_VAULTS).forEach(function (k) {
    if (S.money.vaults[k] === OLD_VAULTS[k]) S.money.vaults[k] = DEF_VAULTS[k];
  });
  // ซิงก์ยอดทางการครั้งเดียว (v3 = Kept 409K + กสิกร 225,820 + KTB 0 + DIME 3K + สด 200 + US 13K + BTC 400)
  // แก้เองหลังเวอร์ชันนี้จะไม่โดนทับ
  if (S.money.vaultVer !== 3) {
    S.money.vaults = Object.assign({}, DEF_VAULTS);
    S.money.vaultVer = 3;
  }
  if (S.money.vaults.dime === 1000) S.money.vaults.dime = 3000; // ยอด seed รอบก่อน
  if (S.money.vaults.kasikorn === 157420) S.money.vaults.kasikorn = 225820; // ยอด seed รอบก่อน
  delete S.money.vaults.keptKrungsri; delete S.money.vaults.growKrungsri; // รวม Krungsri กลับเป็น Kept Grow
  if (S.money.vaults.savings === 200000) S.money.vaults.savings = 409000; // ยอด seed เก่า
  if (S.mainQuest) S.mainQuest.current = netWorth();
  if (Array.isArray(S.money.history) && S.money.history.length) {
    var last = S.money.history[S.money.history.length - 1];
    if (last && (last.v === 639420 || last.v === 783020 || last.v === 583020) && netWorth() !== last.v) last.v = netWorth();
  }
  S.projects.forEach(function (p) {
    if (!p.tasks) p.tasks = (PROJ_TASKS[p.id] || ['Next action']).map(function (t) { return { t: t, done: false }; });
    if (!p.deadline) p.deadline = PROJ_DEADLINE[p.id] || 'ongoing';
  });
}
function applyTheme() {
  if (!document.body || !document.body.classList) return;
  document.body.classList.toggle('os-void', S.settings.theme === 'void');
  document.body.classList.toggle('os-neon', S.settings.theme === 'neon');
  var sel = document.getElementById('os-theme-sel');
  if (sel) sel.value = S.settings.theme;
  var lim = document.getElementById('os-limit-input');
  if (lim) lim.value = S.settings.dailyLimit || 7;
}
function boot() {
  if (!S.character.level) S.character.level = 21; // identity preserved, never derived
  migrate();
  applyTheme();
  S.streak.best = Math.max(S.streak.best || 0, bestStreak());
  Store.save(S);
  renderAll();
  window.ET1OS = { state: function () { return S; }, addXP: addXP, netWorth: netWorth, progressToNext: function () { return progressToNext(S.character.xp, S.character.level); }, export: function () { return Store.export(S); } };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
