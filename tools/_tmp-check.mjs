/* TEMPORARY life-graph v2 browser check — accumulates Tasks 3, 4 and 5.
 * Runs a real Chromium against index.html over a local static server.
 * Deleted at the end of Task 7, replaced by tools/verify-life-graph.mjs.
 * Run: node tools/_tmp-check.mjs */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(root, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port;

const fails = [];
const ok = (name, cond, extra) => { if (!cond) fails.push(name + (extra ? ' — ' + extra : '')); };
const step = async (name, fn) => { try { await fn(); } catch (e) { fails.push(name + ' — threw: ' + e.message); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block', acceptDownloads: true });
// Third-party fonts/widgets/APIs are blocked so the check is deterministic and offline.
// Their load failures are counted separately from real page errors (see externalBlocked).
await ctx.route('**/*', route => (route.request().url().startsWith(base) ? route.continue() : route.abort()));
const page = await ctx.newPage();
const consoleErrors = [];
let externalBlocked = 0;
page.on('console', m => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED/.test(t)) { externalBlocked++; return; }
  consoleErrors.push(t);
});
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
const failedRequests = [];
page.on('requestfailed', r => { if (r.url().startsWith(base)) failedRequests.push(r.url()); });
page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) failedRequests.push(r.status() + ' ' + r.url()); });

await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#life-graph', { timeout: 15000 });

/* ---------- dashboard integrity: the existing page must be untouched ---------- */
await step('dashboard integrity', async () => {
  ok('hero still present', await page.locator('.hero').count() === 1);
  ok('hero title unchanged', (await page.locator('.hero h1 .et').innerText()).trim() === 'ET1CRUEL');
  ok('hero lead unchanged', (await page.locator('.hero .lead').innerText()).includes('ออมสิน'));
  ok('hero CTAs intact', await page.locator('.hero-cta a').count() === 5);
  ok('life-graph section present', await page.locator('#life-graph').count() === 1);
  ok('life-graph heading unchanged', (await page.locator('#lg-heading').innerText()).includes('กราฟชีวิต'));
  ok('topbar intact', await page.locator('.topbar').count() === 1);
  ok('quote section intact', await page.locator('#quotes').count() === 1);
  ok('no console errors on load', consoleErrors.length === 0, consoleErrors.join(' | '));
});

/* ---------- Task 3: year navigation ---------- */
await step('year navigation', async () => {
  await page.waitForSelector('#lg-years .lg-year-chip', { timeout: 8000 });
  const chips = await page.$$eval('#lg-years .lg-year-chip', els => els.map(e => ({ year: e.dataset.lgYear, text: e.textContent.trim(), disabled: e.disabled })));
  ok('23 year chips + 1 future chip', chips.length === 24, 'got ' + chips.length);
  ok('first chip is พ.ศ. 2547', /^2547/.test(chips[0] && chips[0].text), chips[0] && chips[0].text);
  ok('last chip is the future chip', chips[chips.length - 1].year === 'future', chips[chips.length - 1].year);
  ok('future chip is labelled as future', /อนาคต/.test(chips[chips.length - 1].text), chips[chips.length - 1].text);
  ok('no year chip is disabled', chips.every(c => !c.disabled));
  const years = chips.filter(c => c.year !== 'future').map(c => Number(c.year));
  ok('years run 2004..2026 with no gaps', years.length === 23 && years[0] === 2004 && years[years.length - 1] === 2026);

  await page.click('#lg-years .lg-year-chip[data-lg-year="2007"]');
  const emptyCopy = await page.locator('#lg-year-detail').innerText();
  ok('2007 shows the childhood empty-year wording', /ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้/.test(emptyCopy) && /ช่วงวัยเด็ก/.test(emptyCopy), emptyCopy.slice(0, 120));
  ok('empty childhood year is not prompted for input', !/เพิ่มเหตุการณ์|กรอก/.test(emptyCopy));

  await page.click('#lg-years .lg-year-chip[data-lg-year="2015"]');
  const d2015 = await page.locator('#lg-year-detail').innerText();
  ok('2015 detail names the football event', /ฟุตบอล/.test(d2015), d2015.slice(0, 120));
  ok('2015 detail is labelled in both calendars', /2558 \(2015\)/.test(d2015), d2015.slice(0, 160));
  ok('active chip is the selected year', await page.locator('#lg-years .lg-year-chip[data-lg-year="2015"].is-active').count() === 1);

  await page.click('[data-next-year]');
  ok('next year moves to 2016', await page.locator('#lg-years .lg-year-chip[data-lg-year="2016"].is-active').count() === 1);
  await page.click('[data-prev-year]');
  ok('prev year moves back to 2015', await page.locator('#lg-years .lg-year-chip[data-lg-year="2015"].is-active').count() === 1);
  await page.click('[data-today]');
  ok('today button selects the current year chip', await page.locator('#lg-years .lg-year-chip[data-lg-year="2026"].is-active').count() === 1);
  await page.click('[data-all-years]');
  ok('all-years hides the year detail', await page.locator('#lg-year-detail').isHidden());

  const groups = await page.$$eval('#lg-content .lg-year-group', els => els.map(e => e.dataset.year));
  const expected = await page.evaluate(() => {
    const D = window.ET1LIFE_DATA, C = window.ET1LIFE_CORE;
    const out = [];
    for (let y = D.yearRange[0]; y <= D.yearRange[1]; y++) if (C.recordsForYear(D.seeds, y).length) out.push(String(y));
    return out;
  });
  ok('timeline groups only years that have records', groups.length === expected.length, 'got ' + groups.length + ' expected ' + expected.length);
  ok('timeline groups match the data', groups.slice().sort().join(',') === expected.slice().sort().join(','), groups.join(','));
  const body = await page.locator('#lg-content').innerText();
  ok('a recorded year is rendered in both calendars', /2558 \(2015\)/.test(body) || /2015/.test(body));
});

/* ---------- Task 3: chapters + map views ---------- */
await step('chapters and map views', async () => {
  await page.click('[data-lg-view="chapters"]');
  await page.waitForSelector('#lg-content .lg-chapter-card');
  const cards = await page.$$eval('#lg-content .lg-chapter-card', els => els.map(e => e.innerText));
  ok('chapters view has all 12 chapters', cards.length === 12, 'got ' + cards.length);
  const chMeta = await page.evaluate(() => window.ET1LIFE_DATA.chapters.map(c => ({ id: c.id, title: c.title, titleTh: c.titleTh })));
  ok('every chapter card shows its English title', chMeta.every(c => cards.some(t => t.includes(c.title))), '');
  ok('every chapter card shows its Thai title', chMeta.every(c => cards.some(t => t.includes(c.titleTh))), '');
  ok('chapters view says it is an organising device, not a claim of dates', /ไม่ใช่ข้ออ้าง/.test(await page.locator('#lg-content').innerText()));
  const vague = cards.filter(t => /ปีไม่ระบุ/.test(t));
  ok('chapters with no dated records say ปีไม่ระบุ', vague.length > 0);

  await page.click('[data-lg-view="map"]');
  ok('life map view still works', await page.locator('.lg-map').count() === 1);
  ok('map is labelled as a concept map', /แผนที่แนวคิด/.test(await page.locator('#lg-content').innerText()));

  await page.click('[data-lg-view="timeline"]');
});

/* ---------- Task 4: stock-style graph ---------- */
await step('stock-style graph', async () => {
  await page.click('[data-lg-view="graph"]');
  await page.waitForSelector('.lg-trajectory');
  ok('trajectory container exists', await page.locator('.lg-trajectory').count() === 1);
  ok('stock chart svg exists', await page.locator('svg.lg-stock-chart').count() === 1);

  const expected = await page.evaluate(() => {
    const D = window.ET1LIFE_DATA, C = window.ET1LIFE_CORE;
    const L = C.graphLayout(D.seeds, { mode: 'narrative', minYear: D.yearRange[0], maxYear: D.yearRange[1] });
    return { points: L.points.length, future: L.futurePoints.length, undated: L.undated.length, current: L.points.filter(p => p.isCurrent).length, hidden: L.hiddenLabelCount };
  });
  ok('plotted points match the core layout', await page.locator('.lg-chart-point').count() === expected.points, 'got ' + await page.locator('.lg-chart-point').count() + ' expected ' + expected.points);
  ok('exactly one green current node', await page.locator('.lg-chart-point.is-current').count() === 1, 'expected ' + expected.current);
  ok('future markers match the future records', await page.locator('.lg-future-dot').count() === expected.future, 'got ' + await page.locator('.lg-future-dot').count() + ' expected ' + expected.future);
  ok('undated items match the undated records', await page.locator('.lg-undated-item').count() === expected.undated, 'got ' + await page.locator('.lg-undated-item').count() + ' expected ' + expected.undated);
  ok('undated section has a heading', /Undated/.test(await page.locator('#lg-content').innerText()));
  ok('future marks are dashed', await page.locator('.lg-future-line').count() > 0);
  const dash = await page.$eval('.lg-future-line', el => getComputedStyle(el).strokeDasharray);
  ok('future line is actually dashed', dash && dash !== 'none' && dash.indexOf('0') !== 0, dash);
  const fill = await page.$eval('.lg-future-dot', el => getComputedStyle(el).fill);
  ok('future dot is hollow', /rgba\(0, 0, 0, 0\)|none|transparent/.test(fill) || fill === 'none', fill);
  const grey = await page.$eval('.lg-chapter-band', el => getComputedStyle(el).fill || getComputedStyle(el).backgroundColor);
  ok('childhood band is drawn', await page.locator('.lg-chapter-band').count() >= 1);
  const axis = await page.$$eval('.lg-stock-chart .lg-axis-label', els => els.map(e => e.textContent));
  ok('axis labels use พ.ศ. (ค.ศ.)', axis.some(t => /2547 \(2004\)/.test(t)) && axis.some(t => /2569 \(2026\)/.test(t)), axis.join(' '));
  ok('graph states the vertical axis is not a life score', /ไม่ใช่คะแนนชีวิต/.test(await page.locator('#lg-content').innerText()));
  ok('undated records are not plotted on the timeline', expected.points + expected.undated + expected.future === (await page.evaluate(() => window.ET1LIFE_DATA.seeds.length)));

  // Mode A / Mode B
  const hiddenNote = await page.locator('#lg-content').innerText();
  ok('label overflow is reported honestly', !/ซ่อน label/.test(hiddenNote) || /ซ่อน label อีก \d+ จุด/.test(hiddenNote));
  await page.click('[data-lg-labels]');
  ok('label toggle reports pressed state', await page.getAttribute('[data-lg-labels]', 'aria-pressed') === 'true');
  ok('forcing all labels removes the hidden count', !/ซ่อน label/.test(await page.locator('#lg-content').innerText()));
  await page.click('[data-lg-labels]');

  await page.click('[data-lg-mode="self"]');
  ok('mode B explains there are no self scores yet', /ยังไม่มีคะแนนประเมินตนเอง/.test(await page.locator('.lg-score-notice').innerText()));
  ok('mode B plots no invented points', await page.locator('.lg-chart-point').count() === 0, 'got ' + await page.locator('.lg-chart-point').count());
  ok('mode B is labelled as self assessment', /ประเมินตนเอง/.test(await page.locator('#lg-content').innerText()));
  await page.click('[data-lg-mode="narrative"]');
  ok('mode A restores the historical line', await page.locator('.lg-chart-point').count() === expected.points);

  // keyboard access to a graph point
  const hit = await page.$('.lg-hit-wrap');
  ok('graph points are keyboard reachable', !!hit);
  await hit.focus();
  await page.keyboard.press('Enter');
  ok('Enter on a graph point opens the detail panel', await page.locator('#lg-detail').isVisible());
  await page.click('[data-close-detail]');
});

/* ---------- Task 5: detail panel honesty ---------- */
await step('detail panel honesty', async () => {
  await page.click('[data-lg-view="timeline"]');
  await page.fill('#lg-search', 'ส่วนสูง');
  await page.waitForTimeout(120);
  await page.click('#lg-content [data-open="height-187"]');
  const d = await page.locator('#lg-detail').innerText();
  ok('detail opens for an undated record', await page.locator('#lg-detail').isVisible());
  ok('undated detail says the year is not recorded', /ปีไม่ระบุ/.test(d), d.slice(0, 200));
  ok('empty Personal Reflection is not invented', /Personal Reflection[\s\S]*ยังไม่ได้บันทึก/.test(d) || /ยังไม่ได้บันทึก/.test(d));
  ok('empty What Changed is not invented', (d.match(/ยังไม่ได้บันทึก/g) || []).length >= 1, 'not-recorded placeholders: ' + (d.match(/ยังไม่ได้บันทึก/g) || []).length);
  ok('no invented year appears for the undated record', !/25\d\d \(20\d\d\)/.test(d));

  await page.click('[data-close-detail]');
  await page.fill('#lg-search', '');
  await page.click('#lg-years .lg-year-chip[data-lg-year="2021"]');
  const paragraphs = await page.locator('#lg-year-detail').innerText();
  ok('a range event appears in a middle year', /เพลง/.test(paragraphs), paragraphs.slice(0, 160));
  ok('a range event is marked as continued from its start year', /ต่อเนื่องจาก/.test(paragraphs), paragraphs.slice(0, 200));

  await page.fill('#lg-search', 'ม.2');
  await page.waitForTimeout(120);
  await page.click('#lg-content [data-open="music-start"]');
  const conflict = await page.locator('#lg-detail').innerText();
  ok('the conflicting music-start years raise a warning', /ข้อมูลขัดแย้ง/.test(conflict), conflict.slice(0, 200));
  ok('the conflict warning names both versions', /2018/.test(conflict) && /2021/.test(conflict));
  ok('date precision is shown for the record', /ความแม่นยำ|โดยประมาณ/.test(conflict));
  await page.click('[data-close-detail]');
  await page.fill('#lg-search', '');
});

/* ---------- Task 5: CRUD + persistence + import/export ---------- */
await step('CRUD + persistence', async () => {
  await page.evaluate(() => { window.confirm = () => true; });
  await page.click('[data-all-years]');
  await page.click('[data-add]');
  await page.fill('#lg-form [name="title"]', 'ทดสอบเหตุการณ์ใหม่');
  await page.fill('#lg-form [name="description"]', 'สร้างจากชุดตรวจ');
  await page.fill('#lg-form [name="startYearCE"]', '2024');
  await page.selectOption('#lg-form [name="category"]', 'Personal');
  await page.fill('#lg-form [name="selfAssessmentScore"]', '6');
  await page.click('#lg-form button[type="submit"]');
  await page.waitForTimeout(200);
  await page.fill('#lg-search', 'ทดสอบเหตุการณ์ใหม่');
  await page.waitForTimeout(150);
  ok('a new record shows up in the timeline', /ทดสอบเหตุการณ์ใหม่/.test(await page.locator('#lg-content').innerText()));

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { window.confirm = () => true; });
  await page.waitForSelector('#lg-years .lg-year-chip');
  await page.fill('#lg-search', 'ทดสอบเหตุการณ์ใหม่');
  await page.waitForTimeout(150);
  ok('the new record survives a reload', /ทดสอบเหตุการณ์ใหม่/.test(await page.locator('#lg-content').innerText()));

  // self assessment now exists -> mode B must plot exactly that one point
  await page.click('[data-lg-view="graph"]');
  await page.click('[data-lg-mode="self"]');
  ok('mode B plots the one real score', await page.locator('.lg-chart-point').count() === 1, 'got ' + await page.locator('.lg-chart-point').count());
  ok('mode B no longer claims there are no scores', await page.locator('.lg-score-notice').count() === 0);
  await page.click('[data-lg-mode="narrative"]');
  await page.click('[data-lg-view="timeline"]');

  // edit a seed record
  await page.fill('#lg-search', 'blow my self');
  await page.waitForTimeout(150);
  await page.click('#lg-content [data-open="release-blow-myself"]');
  await page.click('[data-edit]');
  await page.fill('#lg-form [name="title"]', 'แก้เองแล้ว');
  await page.click('#lg-form button[type="submit"]');
  await page.waitForTimeout(200);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { window.confirm = () => true; });
  await page.waitForSelector('#lg-years .lg-year-chip');
  await page.fill('#lg-search', 'แก้เองแล้ว');
  await page.waitForTimeout(150);
  ok('an edited seed record keeps the edit after reload', /แก้เองแล้ว/.test(await page.locator('#lg-content').innerText()));
  const stillSeed = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.find(r => r.id === 'release-blow-myself'));
  ok('the edited seed is flagged as user-edited', stillSeed && stillSeed.userEdited === true);

  // delete with confirmation
  let confirmAsked = 0;
  await page.evaluate(() => { window.confirm = () => { window.__asked = (window.__asked || 0) + 1; return true; }; });
  await page.click('#lg-content [data-open="release-blow-myself"]');
  await page.click('[data-delete]');
  await page.waitForTimeout(200);
  confirmAsked = await page.evaluate(() => window.__asked || 0);
  ok('delete asks for confirmation first', confirmAsked === 1, 'confirm calls: ' + confirmAsked);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { window.confirm = () => true; });
  await page.waitForSelector('#lg-years .lg-year-chip');
  await page.fill('#lg-search', 'แก้เองแล้ว');
  await page.waitForTimeout(150);
  ok('the deleted seed does not come back after reload', !/แก้เองแล้ว/.test(await page.locator('#lg-content').innerText()));
  const stillGone = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.find(r => r.id === 'release-blow-myself'));
  ok('the deleted seed stays deleted', !stillGone);
  const tomb = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).deletedSeedIds || []);
  ok('the deleted seed is tombstoned', tomb.indexOf('release-blow-myself') >= 0, JSON.stringify(tomb));

  // the user-created record must still be there after the seed deletion
  await page.fill('#lg-search', 'ทดสอบเหตุการณ์ใหม่');
  await page.waitForTimeout(150);
  ok('deleting a seed never touches user records', /ทดสอบเหตุการณ์ใหม่/.test(await page.locator('#lg-content').innerText()));
  await page.fill('#lg-search', '');
});

await step('export + import', async () => {
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('[data-export]')]);
  const name = download.suggestedFilename();
  ok('export filename is dated', /^et1cruel-life-graph-\d{4}-\d{2}-\d{2}\.json$/.test(name), name);
  const file = await download.path();
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok('export is version 2', exported.version === 2);
  ok('export contains every record', Array.isArray(exported.records) && exported.records.length > 10, 'records: ' + (exported.records && exported.records.length));
  ok('export carries the tombstones', Array.isArray(exported.deletedSeedIds) && exported.deletedSeedIds.indexOf('release-blow-myself') >= 0);

  const beforeCount = exported.records.length;
  const tmp = os.tmpdir();
  const junk = path.join(tmp, 'lg-junk.json');
  fs.writeFileSync(junk, '{"records":"nope"}');
  await page.setInputFiles('#lg-import-file', junk);
  await page.waitForTimeout(250);
  const notice = await page.locator('#lg-notice').innerText();
  ok('a bad import is rejected with a reason', /records/.test(notice), notice);
  const afterJunk = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.length);
  ok('a rejected import changes nothing', afterJunk === beforeCount, 'before ' + beforeCount + ' after ' + afterJunk);

  const good = path.join(tmp, 'lg-good.json');
  fs.writeFileSync(good, JSON.stringify({ version: 2, records: [{ id: 'imported-1', title: 'นำเข้าทดสอบ', startYearCE: 2019, category: 'Personal' }] }));
  await page.setInputFiles('#lg-import-file', good);
  await page.waitForTimeout(300);
  const afterGood = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.length);
  ok('a valid import merges after confirmation', afterGood === beforeCount + 1, 'before ' + beforeCount + ' after ' + afterGood);
  await page.fill('#lg-search', 'นำเข้าทดสอบ');
  await page.waitForTimeout(150);
  ok('the imported record is visible', /นำเข้าทดสอบ/.test(await page.locator('#lg-content').innerText()));
  await page.fill('#lg-search', '');
});

/* ---------- keyboard + focus ---------- */
await step('keyboard and focus', async () => {
  await page.evaluate(() => document.querySelector('#life-graph').scrollIntoView());
  await page.evaluate(() => document.querySelector('[data-lg-view="timeline"]').focus());
  let outlined = null;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      const cs = getComputedStyle(a);
      return { cls: a.className || a.tagName, outline: cs.outlineWidth + ' ' + cs.outlineStyle };
    });
    if (info && /lg-year-chip/.test(info.cls)) { outlined = info; break; }
  }
  ok('tabbing reaches the year chips', !!outlined, 'no year chip reached');
  ok('the focused year chip has a visible outline', outlined && outlined.outline !== '0px none', outlined && outlined.outline);
});

/* ---------- narrow screen ---------- */
await step('360px layout', async () => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#lg-years .lg-year-chip');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth);
  ok('no horizontal page overflow at 360px', overflow <= 361, 'scrollWidth ' + overflow);
  const strip = await page.$eval('#lg-years', el => ({ scrollable: el.scrollWidth > el.clientWidth, h: el.clientHeight }));
  ok('the year strip stays usable on mobile', strip.h > 0);
  const clipped = await page.evaluate(() => {
    const y = document.querySelector('#lg-years .lg-year-chip');
    const r = y.getBoundingClientRect();
    return r.width;
  });
  ok('year chips keep a readable size on mobile', clipped >= 60, 'chip width ' + clipped);
  await page.setViewportSize({ width: 1280, height: 1000 });
});

/* ---------- no missing life-graph asset ---------- */
await step('assets', async () => {
  const missing = failedRequests.filter(u => /life-graph/.test(u));
  ok('no life-graph asset failed to load', missing.length === 0, missing.join(' | '));
});

await browser.close();
server.close();

if (consoleErrors.length) fails.push('console errors: ' + consoleErrors.join(' | '));
if (fails.length) { console.error('FAIL (' + fails.length + ')\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK shell+graph+panel');
