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

console.log('OK core');
