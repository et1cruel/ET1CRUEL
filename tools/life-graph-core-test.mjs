// Unit tests for window.ET1LIFE_CORE — pure logic, no DOM, no localStorage.
// Run: node tools/life-graph-core-test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

globalThis.window = {};
eval(readFileSync('js/life-graph-data.js', 'utf8'));
eval(readFileSync('js/life-graph.js', 'utf8'));
const C = window.ET1LIFE_CORE, D = window.ET1LIFE_DATA;
assert.ok(C, 'ET1LIFE_CORE must exist without a DOM');
assert.ok(D, 'ET1LIFE_DATA must exist');

// ---- junk input must not throw, must not lose the seed set ----
const junk = C.readState('{{{not json', null, D);
assert.ok(Array.isArray(junk.records) && junk.records.length >= D.seeds.length, 'junk input must fall back to seeds');
assert.ok(junk.notice, 'a notice is required when stored data cannot be read');

// a wrong-shaped payload (records is not an array) must also fall back safely
const wrongShape = C.readState(JSON.stringify({ version: 2, records: 'nope' }), null, D);
assert.ok(wrongShape.records.length >= D.seeds.length, 'wrong-shaped v2 payload must fall back to seeds');

// ---- v1 -> v2: records the user created must survive exactly ----
const v1user = JSON.stringify({
  version: 1,
  records: [
    { id: 'user-1', title: 'ของฉัน', description: 'x', category: 'Art', chapterId: 'music-artist', date: '2024-05-05', endDate: null, datePrecision: 'exact', status: 'in-progress', type: 'milestone', importance: 2, evidenceNote: 'note', tags: ['a'], createdAt: '2024-06-01T00:00:00.000Z', updatedAt: null, storyLevel: 80, selfAssessmentScore: 40 },
    // unedited v1 code-seed (no createdAt) — superseded by the richer v2 seed of the same meaning
    { id: 'seed-football', title: 'วัย 11 ปี — ฟุตบอล', description: 'seed', category: 'Life', chapterId: 'childhood', date: '2015', endDate: '2016', datePrecision: 'approximate', status: 'user-reported', type: 'milestone', importance: 2, evidenceNote: 'seed', tags: ['ฟุตบอล'] }
  ]
});
const st = C.readState(null, v1user, D);
const mine = st.records.find(r => r.id === 'user-1');
assert.ok(mine, 'user record must survive migration');
assert.equal(mine.category, 'Content Creation', 'Art -> Content Creation');
assert.equal(mine.chapterId, 'music-production', 'music-artist -> music-production');
assert.equal(mine.startDate, '2024-05-05');
assert.equal(mine.startYearCE, 2024);
assert.equal(mine.narrativeLevel, 80, 'storyLevel -> narrativeLevel');
assert.equal(mine.selfAssessmentScore, 40);
assert.equal(mine.legacyScale, true, 'a score above 10 must be flagged, never silently converted');
assert.equal(mine.createdAt, '2024-06-01T00:00:00.000Z');
assert.ok(!st.records.some(r => r.id === 'seed-football'), 'unedited v1 code-seeds are superseded by the v2 seed set');
assert.ok(st.records.some(r => r.id === 'football-age11'), 'the v2 replacement seed is present');

// ---- seed merge must never overwrite the owner's edits, and must be idempotent ----
const edited = st.records.map(r => (r.id === 'release-blow-myself' ? { ...r, title: 'แก้เอง', userEdited: true } : r));
const merged = C.mergeSeeds(edited, D.seeds, []);
assert.equal(merged.find(r => r.id === 'release-blow-myself').title, 'แก้เอง');
assert.equal(C.mergeSeeds(merged, D.seeds, []).length, merged.length, 'merge must be idempotent');
// tombstoned seed must stay gone (the tombstone blocks the re-add; the delete itself is what removed it)
const withoutDeleted = merged.filter(r => r.id !== 'release-blow-myself');
assert.ok(!C.mergeSeeds(withoutDeleted, D.seeds, ['release-blow-myself']).some(r => r.id === 'release-blow-myself'), 'deleted seed must not come back');
assert.ok(C.mergeSeeds(withoutDeleted, D.seeds, []).some(r => r.id === 'release-blow-myself'), 'without a tombstone the seed does come back');

// ---- bad imports are rejected with a reason ----
assert.equal(C.validateImport('{"records":"nope"}').ok, false);
assert.equal(C.validateImport('{"records":[{"title":"no id"}]}').ok, false);
assert.equal(C.validateImport('not json at all').ok, false);
assert.equal(C.validateImport('{"records":[{"id":"dup","title":"a"},{"id":"dup","title":"b"}]}').ok, false, 'duplicate ids rejected');
assert.ok(C.validateImport('{"records":[{"id":"a","title":"t"}]}').reason === undefined);
assert.equal(C.validateImport('{"records":[{"id":"a","title":"t"}]}').ok, true);
assert.ok(C.validateImport('{"records":"nope"}').reason.length > 0, 'rejection must explain itself');

// ---- year index: single year, ranges, undated, future ----
assert.ok(C.recordsForYear(D.seeds, 2015).some(r => r.id === 'football-age11'));
assert.ok(C.recordsForYear(D.seeds, 2019).some(r => r.id === 'music-start'), 'a range must cover its middle years');
assert.ok(!C.recordsForYear(D.seeds, 2019).some(r => r.isFuture));
assert.ok(!C.recordsForYear(D.seeds, 2007).length, '2007 is a childhood year with nothing recorded — and must stay empty');
assert.ok(C.undatedRecords(D.seeds).every(r => r.startYearCE === null && !r.isFuture));
assert.ok(C.undatedRecords(D.seeds).length > 0, 'this life has genuinely undated events');
assert.ok(C.futureRecords(D.seeds).every(r => r.isFuture));
assert.equal(C.formatYear(2026), '2569 (2026)');
assert.equal(C.formatYear(2004), '2547 (2004)');
assert.equal(C.formatDateRange(C.undatedRecords(D.seeds)[0]), 'ปีไม่ระบุ');

// ---- graph layout: honest positioning ----
const L = C.graphLayout(D.seeds, { mode: 'narrative', minYear: 2004, maxYear: 2026 });
assert.ok(L.points.every(p => p.x >= 0 && p.x <= L.width), 'every point must sit inside the chart');
assert.equal(
  L.points.length + L.undated.length + L.futurePoints.length,
  D.seeds.length,
  'every record must be accounted for exactly once: on the line, in undated, or as future'
);
assert.equal(L.undated.length, C.undatedRecords(D.seeds).length);
assert.equal(L.futurePoints.length, C.futureRecords(D.seeds).length);
assert.equal(L.points.filter(p => p.isCurrent).length, 1, 'exactly one current point');
assert.ok(L.years.length >= 3 && L.years.every(y => /^\d{4} \(\d{4}\)$/.test(y.label)), 'axis labels are พ.ศ. (ค.ศ.)');
assert.ok(L.hiddenLabelCount >= 0);
// narrative layout must never be presented as a measurement
assert.match(L.yAxisNote, /ไม่ใช่คะแนน/);

// mode B: nobody has scored their own life yet -> no points, and no invented ones
const S = C.graphLayout(D.seeds, { mode: 'self', minYear: 2004, maxYear: 2026 });
assert.equal(S.points.length, 0, 'no self-assessment scores means no points — never a guess');
assert.equal(S.hasScores, false);

// mode B with only two scored years far apart -> the line must break between them
const scattered = [
  { id: 'a', startYearCE: 2010, selfAssessmentScore: 4 },
  { id: 'b', startYearCE: 2011, selfAssessmentScore: 6 },
  { id: 'c', startYearCE: 2016, selfAssessmentScore: 8 }
].map(r => C.normalizeRecord({ ...r, title: r.id }));
const S2 = C.graphLayout(scattered, { mode: 'self', minYear: 2004, maxYear: 2026 });
assert.equal(S2.points.length, 3);
assert.equal(S2.segments.length, 2, 'a gap in scored years must break the line, never bridge it');
assert.equal(S2.hasScores, true);

// ---- normalizeRecord must preserve unknown fields instead of dropping them ----
const kept = C.normalizeRecord({ id: 'x', title: 't', category: 'Nonsense', datePrecision: 'nope', evidenceNote: 'legacy field', userEdited: true });
assert.equal(kept.category, 'Personal', 'unknown category falls back to Personal');
assert.equal(kept.datePrecision, 'unknown');
assert.equal(kept.userEdited, true);
assert.equal(kept.evidenceNote, 'legacy field', 'unknown fields are preserved, not discarded');
assert.equal(kept.legacy.originalCategory, 'Nonsense', 'the original value is recorded, not erased');

// ---- persistence helpers must fail safely when there is no storage at all ----
assert.equal(typeof C.saveState, 'function');
assert.equal(typeof C.loadState, 'function');
const noStore = C.saveState({ records: D.seeds, deletedSeedIds: [] });
assert.equal(noStore.ok, false, 'no localStorage in node -> saveState reports failure instead of throwing');
assert.ok(typeof noStore.reason === 'string' && noStore.reason.length > 0);
const loaded = C.loadState();
assert.equal(loaded.v2, null);
assert.equal(loaded.v1, null);

// ---- ตำแหน่งป้ายปีบนแกน X: ต้องไม่ทับกัน และต้องไม่ถูกขอบกราฟตัด ----
var Lg = C.graphLayout(D.seeds, { mode: 'narrative', minYear: D.yearRange[0], maxYear: D.yearRange[1] });
assert.ok(Lg.years.length >= 4, 'แกน X ต้องมีป้ายปีหลายตัว');
for (var ti = 1; ti < Lg.years.length; ti++) {
  var ta = Lg.years[ti - 1], tb = Lg.years[ti];
  var need = (String(ta.label).length * 7 + String(tb.label).length * 7) / 2;
  assert.ok(tb.x - ta.x >= need,
    'ป้ายปี "' + ta.label + '" กับ "' + tb.label + '" ทับกัน (ห่าง ' + Math.round(tb.x - ta.x) + 'px แต่ต้อง >= ' + need + 'px)');
}
Lg.years.forEach(function (t) {
  var w = String(t.label).length * 7;
  var anchor = t.anchor || 'middle';
  var x1 = anchor === 'end' ? t.x - w : (anchor === 'start' ? t.x : t.x - w / 2);
  var x2 = anchor === 'end' ? t.x : (anchor === 'start' ? t.x + w : t.x + w / 2);
  assert.ok(x1 >= 0 && x2 <= Lg.width,
    'ป้ายปี "' + t.label + '" ถูกขอบกราฟตัด (' + Math.round(x1) + '..' + Math.round(x2) + ' ของความกว้าง ' + Lg.width + ')');
});
assert.equal(Lg.years[Lg.years.length - 1].year, D.yearRange[1], 'ป้ายปีสุดท้ายต้องเป็นปีปัจจุบันเสมอ');

// ---- ป้ายชื่อจุดที่แสดงอยู่ ต้องอยู่ในกรอบ SVG ไม่ถูกขอบตัด ----
Lg.points.forEach(function (p) {
  if (p.labelSide === 'hidden') return;
  var w = Math.min(150, Math.max(52, String(p.label || '').length * 7));
  var cxp = p.labelX == null ? p.x : p.labelX;
  assert.ok(cxp - w / 2 >= 0 && cxp + w / 2 <= Lg.width,
    'ป้าย "' + p.label + '" ถูกขอบกราฟตัด (กลางที่ ' + Math.round(cxp) + ', ครึ่งกว้าง ' + Math.round(w / 2) + ', ความกว้างกราฟ ' + Lg.width + ')');
});

// ---- ความกว้างป้ายชื่อ: ใช้โมเดลเดียวกับที่เลย์เอาต์ใช้ตัดสินการทับกัน (ก่อนหน้านี้เลย์เอาต์ใช้ค่าคงที่ 132
//      ซึ่งแคบกว่าข้อความจริง ~200px ทำให้ป้ายที่อยู่ห่างกัน 140px ยังทับกันจริงบนจอ) ----
assert.equal(typeof C.labelBoxWidth, 'function', 'ต้องมีตัวคำนวณความกว้างป้ายที่ใช้ร่วมกันทั้งเลย์เอาต์และเทสต์');
assert.ok(C.labelBoxWidth('ก'.repeat(40)) > C.labelBoxWidth('กก'), 'ป้ายยาวต้องกว้างกว่าป้ายสั้น');
assert.ok(C.labelBoxWidth('ก'.repeat(500)) <= 240, 'ความกว้างป้ายต้องมีเพดาน ไม่บานไม่จำกัด');
assert.ok(C.labelBoxWidth('') >= 40, 'ป้ายว่างยังต้องมีความกว้างขั้นต่ำ');

// ---- ป้ายชื่อบนกราฟ: ต้องอยู่ติดจุดของตัวเอง (leader สั้น) และซ่อนเมื่อที่ว่างไม่พอ ----
// ต้นเหตุของ "โยงกันมั่ว": เลย์เอาต์เดิมผลักป้ายไปได้ไกลสุดขอบกราฟ ทำให้เส้นโยงยาวข้ามกราฟ
const Lp = C.graphLayout(D.seeds, { mode: 'narrative', minYear: D.yearRange[0], maxYear: D.yearRange[1] });
const visibleLabels = Lp.points.filter(p => p.labelSide !== 'hidden');
assert.ok(visibleLabels.length > 0, 'ต้องมีป้ายที่แสดงจริงบนกราฟ');
assert.equal(Lp.hiddenLabelCount, Lp.points.filter(p => p.labelSide === 'hidden').length, 'hiddenLabelCount ต้องตรงกับจำนวนที่ซ่อนจริง');
visibleLabels.forEach(function (p) {
  var reach = Math.hypot((p.labelX == null ? p.x : p.labelX) - p.x, (p.labelY == null ? p.y : p.labelY) - p.y);
  /* ขอบเขตจริงของเลย์เอาต์: แนวนอนถูกจำกัดไม่ให้หลุดพล็อต (ครึ่งป้ายกว้างสุด 105) + แนวตั้งไม่เกิน 2 ชั้น (72) */
  assert.ok(reach <= 135, 'ป้าย "' + p.id + '" ถูกลากไปไกลจากจุดของตัวเอง ' + Math.round(reach) + 'px (ต้องไม่เกิน 135px)');
});
for (var li = 0; li < visibleLabels.length; li++) {
  for (var lj = li + 1; lj < visibleLabels.length; lj++) {
    var la = visibleLabels[li], lb = visibleLabels[lj];
    if (la.labelSide !== lb.labelSide || Math.abs(la.labelY - lb.labelY) >= 20) continue;
    var need = (C.labelBoxWidth(la.label) + C.labelBoxWidth(lb.label)) / 2 + 4;
    assert.ok(Math.abs(la.labelX - lb.labelX) >= need,
      'ป้าย "' + la.id + '" กับ "' + lb.id + '" ทับกัน (ห่าง ' + Math.round(Math.abs(la.labelX - lb.labelX)) + 'px ต้อง >= ' + Math.round(need) + 'px)');
  }
}
// ป้ายกว้างสุดต้องยังไม่ถูกขอบกราฟตัด (นับทั้งบรรทัดชื่อและบรรทัดวันที่)
Lp.points.forEach(function (p) {
  if (p.labelSide === 'hidden') return;
  var w = Math.max(C.labelBoxWidth(p.label), C.labelBoxWidth(p.dateLabel));
  var cxp = p.labelX == null ? p.x : p.labelX;
  assert.ok(cxp - w / 2 >= -0.5 && cxp + w / 2 <= Lp.width + 0.5,
    'ป้าย "' + p.id + '" ถูกขอบกราฟตัด (กลาง ' + Math.round(cxp) + ' ครึ่งกว้าง ' + Math.round(w / 2) + ' ของ ' + Lp.width + ')');
});
// ผู้ใช้สั่ง "แสดง label ทั้งหมด" -> ต้องไม่ซ่อนป้ายใดเลย
var Lforced = C.graphLayout(D.seeds, { mode: 'narrative', minYear: D.yearRange[0], maxYear: D.yearRange[1], width: 900, height: 340, forceAllLabels: true });
assert.equal(Lforced.hiddenLabelCount, 0, 'เมื่อสั่งแสดง label ทั้งหมด ต้องไม่ซ่อนป้ายใด');
assert.ok(Lforced.points.every(function (p) { return p.labelSide !== 'hidden'; }));

// ---- เคสพื้นที่แคบ: ต้อง "ซ่อนแล้วรายงาน" ไม่ใช่วางป้ายทับกัน ----
var Lc = C.graphLayout(D.seeds, { mode: 'narrative', minYear: D.yearRange[0], maxYear: D.yearRange[1], width: 900, height: 340 });
var crowded = Lc.points.filter(p => p.labelSide !== 'hidden');
assert.ok(Lc.hiddenLabelCount > 0, 'บนพื้นที่แคบต้องซ่อนป้ายบางส่วน — ถ้าไม่ซ่อนเลยแปลว่าวางป้ายทับกัน');
for (var ci = 0; ci < crowded.length; ci++) {
  for (var cj = ci + 1; cj < crowded.length; cj++) {
    var ca = crowded[ci], cb = crowded[cj];
    if (ca.labelSide !== cb.labelSide || Math.abs(ca.labelY - cb.labelY) >= 20) continue;
    assert.ok(Math.abs(ca.labelX - cb.labelX) >= (C.labelBoxWidth(ca.label) + C.labelBoxWidth(cb.label)) / 2 + 4,
      'บนพื้นที่แคบ ป้าย "' + ca.id + '" กับ "' + cb.id + '" ทับกัน');
  }
}
crowded.forEach(function (p) {
  assert.ok(Math.hypot(p.labelX - p.x, p.labelY - p.y) <= 135, 'บนพื้นที่แคบ ป้าย "' + p.id + '" ถูกลากไกลจากจุดของตัวเอง');
});

// ---- จุดที่ตกตำแหน่งเดียวกันเป๊ะ: โหมด A ต้องกระจายให้เห็นครบ (y คือการจัดวางเชิงภาพ ไม่ใช่คะแนน) ----
// ---- แต่โหมด B ห้ามขยับจุด เพราะ y คือคะแนนที่ผู้ใช้กรอกเอง ----
for (var ai = 0; ai < Lp.points.length; ai++) {
  for (var aj = ai + 1; aj < Lp.points.length; aj++) {
    var pa = Lp.points[ai], pb = Lp.points[aj];
    assert.ok(Math.hypot(pa.x - pb.x, pa.y - pb.y) >= 7,
      'จุด "' + pa.id + '" กับ "' + pb.id + '" ทับกันเป๊ะในโหมด A — ต้องกระจายแนวตั้ง');
  }
}
S2.points.forEach(function (p) {
  var expectedY = S2.bounds.bottom - p.level * (S2.bounds.bottom - S2.bounds.top);
  assert.ok(Math.abs(p.y - expectedY) < 0.001, 'โหมด B ห้ามขยับ y ของคะแนนจริง (' + p.id + ')');
});

// ---- เป้าหมายอนาคตที่ยังไม่กำหนดปี: ห้ามวาดลงบนแกนเวลา ----
const futureGoals = Lp.futurePoints.filter(function (f) { return f.projected; });
assert.ok(futureGoals.length > 0, 'มีเป้าหมายที่ยังไม่กำหนดปีในข้อมูลจริง');
futureGoals.forEach(function (f) {
  assert.ok(f.x > Lp.bounds.right + 1,
    'เป้าหมายที่ยังไม่กำหนดปี "' + f.id + '" ต้องอยู่ขวาของพล็อต (x=' + Math.round(f.x) + ' ต้อง > ' + Math.round(Lp.bounds.right) + ') จึงจะไม่ดูเหมือนถูกกำหนดปี');
});
futureGoals.forEach(function (f) {
  assert.ok(f.y >= Lp.bounds.top - 0.5 && f.y <= Lp.bounds.bottom + 0.5, 'เป้าหมาย "' + f.id + '" ต้องอยู่ในความสูงของพล็อต');
  Lp.points.forEach(function (p) {
    assert.ok(Math.hypot(f.x - p.x, f.y - p.y) >= 8, 'วงกลมเป้าหมาย "' + f.id + '" ทับจุดเหตุการณ์จริง "' + p.id + '"');
  });
});
// เส้นประอนาคตต้องลากจาก "จุดปัจจุบัน" ไม่ใช่จากจุดขวาสุดเฉย ๆ
assert.ok(Lp.futureAnchor && Lp.futureAnchor.id, 'ต้องระบุจุดตั้งต้นของเส้นอนาคต');
assert.equal(Lp.futureAnchor.isCurrent, true, 'เส้นอนาคตต้องเริ่มจากจุดปัจจุบัน (สีเขียว)');

console.log('OK core');
