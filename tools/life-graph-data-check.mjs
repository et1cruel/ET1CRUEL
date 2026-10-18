// Validates js/life-graph-data.js shape and honesty rules. Run: node tools/life-graph-data-check.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync('js/life-graph-data.js', 'utf8');
const window = {};
eval(src);
const D = window.ET1LIFE_DATA;
const errs = [];
const CATS = ['Personal', 'Football', 'Music', 'Education', 'Work', 'Finance', 'Technology', 'Coding', 'AI', 'Robotics', 'Content Creation', 'Business', 'Personal Growth', 'Future Goals'];
const CH = ['childhood', 'football', 'music-origin', 'learning-struggle', 'education', 'work', 'music-production', 'coding-software', 'ai-automation', 'robotics', 'current-life', 'future-goals'];
const PREC = ['exact_date', 'exact_month', 'exact_year', 'exact_range', 'estimated_year', 'estimated_range', 'school_period', 'age_based', 'unknown'];
const DST = ['confirmed', 'estimated', 'needs_confirmation', 'unknown'];
const DSRC = ['user_reported', 'project_record', 'imported_record', 'derived_estimate'];

if (!D) errs.push('no ET1LIFE_DATA');
else {
  if (D.categories.join('|') !== CATS.join('|')) errs.push('categories mismatch: ' + D.categories.join(','));
  if (D.chapters.map(c => c.id).join('|') !== CH.join('|')) errs.push('chapters mismatch: ' + D.chapters.map(c => c.id).join(','));
  if (D.yearRange.join(',') !== '2004,2026') errs.push('yearRange mismatch');
  const ids = new Set();
  for (const r of D.seeds) {
    const tag = r.id || '(no id)';
    if (ids.has(r.id)) errs.push('duplicate id ' + tag); ids.add(r.id);
    if (!CATS.includes(r.category)) errs.push(tag + ' bad category: ' + r.category);
    if (!CH.includes(r.chapterId)) errs.push(tag + ' bad chapterId: ' + r.chapterId);
    if (!PREC.includes(r.datePrecision)) errs.push(tag + ' bad datePrecision: ' + r.datePrecision);
    if (!DST.includes(r.dateStatus)) errs.push(tag + ' bad dateStatus: ' + r.dateStatus);
    if (!DSRC.includes(r.dateSource)) errs.push(tag + ' bad dateSource: ' + r.dateSource);
    if (typeof r.importance !== 'number' || r.importance < 1 || r.importance > 3) errs.push(tag + ' bad importance');
    if (r.selfAssessmentScore !== null) errs.push(tag + ' seeded selfAssessmentScore (must be null)');
    if (r.isFuture && r.type === 'goal' && r.dateStatus === 'confirmed') errs.push(tag + ' goal marked confirmed');
    if (r.isFuture && r.type !== 'goal' && r.startYearCE === null) errs.push(tag + ' future event without a date');
    if (r.dateStatus === 'confirmed' && !r.startDate && r.startYearCE === null) errs.push(tag + ' confirmed without a date');
    if (r.startYearCE !== null && (r.startYearCE < 1900 || r.startYearCE > 2200)) errs.push(tag + ' year out of range');
    if (r.endYearCE !== null && r.startYearCE !== null && r.endYearCE < r.startYearCE) errs.push(tag + ' endYear before startYear');
    for (const m of [r.startMonthCE, r.endMonthCE]) if (m !== null && (m < 1 || m > 12)) errs.push(tag + ' month out of range');
    if (!r.isFuture && !r.sourceReference) errs.push(tag + ' missing provenance (sourceReference)');
    if (typeof r.title !== 'string' || !r.title.trim()) errs.push(tag + ' missing title');
  }
  const cur = D.seeds.filter(r => r.isCurrent);
  if (cur.length !== 1) errs.push('expected exactly 1 isCurrent record, got ' + cur.length);
}

const goals = (D?.seeds || []).filter(r => r.type === 'goal');
if (!goals.length) errs.push('no future goals seeded');
if (!goals.every(g => g.isFuture && g.startYearCE === null && g.endYearCE === null)) errs.push('goals must be future with null years until owner sets them');
if (!goals.every(g => g.category === 'Future Goals' || g.category === 'Business')) errs.push('future goals must use Future Goals (or Business) category');

if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
console.log('OK data: ' + D.seeds.length + ' seeds, ' + goals.length + ' goals');
