/* ET1CRUEL LIFE GRAPH V2 — verification harness.
 *
 * ตรวจของจริงสองชั้น:
 *   1) runStatic()  — ระดับไฟล์: sw.js precache ต้องตรงกับ index.html, ทุก path ต้องมีอยู่จริง, เอกสารอัปเดต
 *   2) run(page)    — ระดับเบราว์เซอร์จริง (Chromium): ไทม์ไลน์รายปี, กราฟชีวิต, แผงรายละเอียด,
 *                     ความซื่อสัตย์ของข้อมูล (ห้ามเดาปี/ห้ามแต่งเนื้อหา), CRUD + persistence, นำเข้า/ส่งออก,
 *                     คีย์บอร์ด และจอ 360px — พร้อมยืนยันว่า Dashboard เดิมไม่พัง
 *
 * วิธีรัน:  node tools/verify-life-graph.mjs
 * ใช้กับเซิร์ฟเวอร์ที่มีอยู่แล้ว:  LG_URL=http://localhost:8080 node tools/verify-life-graph.mjs
 * ใช้จากสคริปต์อื่น:  import { run, runStatic } from './verify-life-graph.mjs'
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

export function createChecker() {
  const fails = [];
  const ok = (name, cond, extra) => { if (!cond) fails.push(name + (extra ? ' — ' + extra : '')); };
  const step = async (name, fn) => { try { await fn(); } catch (e) { fails.push(name + ' — threw: ' + e.message); } };
  return { fails, ok, step };
}

/* ═══════════════════════ ระดับไฟล์ (ไม่ต้องใช้เบราว์เซอร์) ═══════════════════════ */
export function runStatic(rootDir) {
  const root = rootDir || ROOT;
  const fails = [];
  const check = (name, cond, extra) => { if (!cond) fails.push(name + (extra ? ' — ' + extra : '')); };
  try {
    const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

    const m = sw.match(/var CACHE = '([^']+)'/);
    check('sw.js defines CACHE', !!m);
    check('CACHE is bumped past the pre-life-graph version', !!m && m[1] !== 'et1cruel-v65', m && m[1]);

    const coreStart = sw.indexOf('var CORE');
    const core = coreStart >= 0 ? sw.slice(coreStart, sw.indexOf('];', coreStart)) : '';
    check('sw.js defines CORE', core.length > 0);

    ['css/life-graph.css?v=4', 'js/life-graph-data.js?v=2', 'js/life-graph.js?v=4'].forEach(function (p) {
      check('CORE precaches ' + p, core.indexOf("'" + p + "'") >= 0);
      check('index.html requests ' + p + ' (page and precache must agree)', html.indexOf(p) >= 0);
    });
    // เวอร์ชัน asset ที่ bump ไปต้องไม่ทิ้ง URL เก่าค้างใน precache (cache ใหม่จะไม่มีไฟล์ที่หน้าเว็บเรียก)
    ['css/life-graph.css?v=2', 'js/life-graph.js?v=2', 'css/life-graph.css?v=3', 'js/life-graph.js?v=3'].forEach(function (p) {
      check('no stale ' + p + ' left in the precache', core.indexOf("'" + p + "'") < 0 && html.indexOf(p) < 0, p);
    });
    // neo-brutal ต้องตรงกับที่หน้าเว็บเรียกจริง ไม่งั้น offline จะไม่มี stylesheet หลัก
    const nbHtml = (html.match(/css\/neo-brutal\.css\?v=(\d+)/) || [])[1];
    const nbCore = (core.match(/css\/neo-brutal\.css\?v=(\d+)/) || [])[1];
    check('index.html and the precache agree on css/neo-brutal.css version', nbHtml && nbHtml === nbCore, 'html v' + nbHtml + ' vs precache v' + nbCore);
    check('the unversioned v1 script tag is gone', html.indexOf('js/life-graph.js"') < 0);

    const paths = [...core.matchAll(/'([^']+)'/g)].map(function (x) { return x[1]; });
    const missing = paths.filter(function (p) { return !fs.existsSync(path.join(root, p.split('?')[0])); });
    check('no precached path 404s (one bad entry aborts the whole precache)', missing.length === 0, missing.join(', '));

    const readme = fs.readFileSync(path.join(root, 'js/README.md'), 'utf8');
    check('js/README.md documents life-graph-data.js', /life-graph-data\.js/.test(readme));
    check('js/README.md documents life-graph.js', /life-graph\.js/.test(readme));

    return { ok: fails.length === 0, fails: fails, note: (m ? m[1] : 'no-cache') + ', ' + paths.length + ' precached files' };
  } catch (e) {
    return { ok: false, fails: fails.concat(['static check threw: ' + e.message]), note: '' };
  }
}

/* ═══════════════════════════ ระดับเบราว์เซอร์ ═══════════════════════════ */
export async function run(page, ctx) {
  const ok = ctx.ok, step = ctx.step;
  const consoleErrors = ctx.consoleErrors || [];
  const failedRequests = ctx.failedRequests || [];
  const base = ctx.base;

  /* ---------- Dashboard เดิมต้องไม่พัง ---------- */
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

  /* ---------- ไทม์ไลน์รายปี + การนำทาง ---------- */
  await step('year navigation', async () => {
    await page.waitForSelector('#lg-years .lg-year-chip', { timeout: 15000 });
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

  /* ---------- Life Chapters + Life Map ---------- */
  await step('chapters and map views', async () => {
    await page.click('[data-lg-view="chapters"]');
    await page.waitForSelector('#lg-content .lg-chapter-card');
    const cards = await page.$$eval('#lg-content .lg-chapter-card', els => els.map(e => e.innerText));
    ok('chapters view has all 12 chapters', cards.length === 12, 'got ' + cards.length);
    const chMeta = await page.evaluate(() => window.ET1LIFE_DATA.chapters.map(c => ({ id: c.id, title: c.title, titleTh: c.titleTh })));
    ok('every chapter card shows its English title', chMeta.every(c => cards.some(t => t.includes(c.title))));
    ok('every chapter card shows its Thai title', chMeta.every(c => cards.some(t => t.includes(c.titleTh))));
    ok('chapters view says it is an organising device, not a claim of dates', /ไม่ใช่ข้ออ้าง/.test(await page.locator('#lg-content').innerText()));
    ok('chapters with no dated records say ปีไม่ระบุ', cards.filter(t => /ปีไม่ระบุ/.test(t)).length > 0);

    await page.click('[data-lg-view="map"]');
    ok('life map view still works', await page.locator('.lg-map').count() === 1);
    ok('map is labelled as a concept map', /แผนที่แนวคิด/.test(await page.locator('#lg-content').innerText()));

    await page.click('[data-lg-view="timeline"]');
  });

  /* ---------- กราฟชีวิตแบบสต็อก ---------- */
  await step('stock-style graph', async () => {
    await page.click('[data-lg-view="graph"]');
    await page.waitForSelector('.lg-trajectory');
    ok('trajectory container exists', await page.locator('.lg-trajectory').count() === 1);
    ok('stock chart svg exists', await page.locator('svg.lg-stock-chart').count() === 1);

    const expected = await page.evaluate(() => {
      const D = window.ET1LIFE_DATA, C = window.ET1LIFE_CORE;
      const L = C.graphLayout(D.seeds, { mode: 'narrative', minYear: D.yearRange[0], maxYear: D.yearRange[1] });
      return { points: L.points.length, future: L.futurePoints.length, undated: L.undated.length, current: L.points.filter(p => p.isCurrent).length };
    });
    ok('plotted points match the core layout', await page.locator('.lg-chart-point').count() === expected.points, 'got ' + await page.locator('.lg-chart-point').count() + ' expected ' + expected.points);
    ok('exactly one green current node', await page.locator('.lg-chart-point.is-current').count() === 1, 'expected ' + expected.current);
    ok('future markers match the future records', await page.locator('.lg-future-dot').count() === expected.future, 'got ' + await page.locator('.lg-future-dot').count() + ' expected ' + expected.future);
    ok('undated items match the undated records', await page.locator('.lg-undated-item').count() === expected.undated, 'got ' + await page.locator('.lg-undated-item').count() + ' expected ' + expected.undated);
    ok('undated section has a heading', /Undated/.test(await page.locator('#lg-content').innerText()));
    ok('future marks are drawn', await page.locator('.lg-future-line').count() > 0);
    const dash = await page.$eval('.lg-future-line', el => getComputedStyle(el).strokeDasharray);
    ok('future line is actually dashed', dash && dash !== 'none' && dash.indexOf('0') !== 0, dash);
    const fill = await page.$eval('.lg-future-dot', el => getComputedStyle(el).fill);
    ok('future dot is hollow', /rgba\(0, 0, 0, 0\)|none|transparent/.test(fill) || fill === 'none', fill);
    ok('childhood band is drawn', await page.locator('.lg-chapter-band').count() >= 1);
    const axis = await page.$$eval('.lg-stock-chart .lg-axis-label', els => els.map(e => e.textContent));
    ok('axis labels use พ.ศ. (ค.ศ.)', axis.some(t => /2547 \(2004\)/.test(t)) && axis.some(t => /2569 \(2026\)/.test(t)), axis.join(' '));
    ok('graph states the vertical axis is not a life score', /ไม่ใช่คะแนนชีวิต/.test(await page.locator('#lg-content').innerText()));
    ok('every record is counted exactly once (line + undated + future)', expected.points + expected.undated + expected.future === (await page.evaluate(() => window.ET1LIFE_DATA.seeds.length)));

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

    const hit = await page.$('.lg-hit-wrap');
    ok('graph points are keyboard reachable', !!hit);
    await hit.focus();
    await page.keyboard.press('Enter');
    ok('Enter on a graph point opens the detail panel', await page.locator('#lg-detail').isVisible());
    await page.click('[data-close-detail]');
  });

  /* ---------- สี/คำอธิบาย/tooltip/เป้าคีย์บอร์ด ตามสเปกที่ตรึงไว้ ---------- */
  await step('graph palette, legend, tooltip, keyboard targets', async () => {
    await page.click('[data-lg-view="graph"]');
    await page.waitForSelector('svg.lg-stock-chart');

    // ค่าที่เบราว์เซอร์คำนวณจริง ไม่ใช่แค่ชื่อคลาส
    const line = await page.$eval('.lg-history-line', el => getComputedStyle(el).stroke);
    ok('history line is the spec blue', line === 'rgb(57, 143, 229)', line);
    const cur = await page.$eval('.lg-chart-point.is-current', el => getComputedStyle(el).fill);
    ok('current point is the spec green', cur === 'rgb(20, 184, 138)', cur);
    const fd = await page.$eval('.lg-future-dot', el => ({ fill: getComputedStyle(el).fill, dash: getComputedStyle(el).strokeDasharray }));
    ok('future dot is hollow', fd.fill === 'none', fd.fill);
    ok('future dot outline is dashed', /\d\s+\d/.test(fd.dash) || fd.dash !== 'none', fd.dash);
    const wrapFill = await page.$eval('.lg-hit-wrap', el => getComputedStyle(el).fill);
    ok('the point hit area paints nothing over the marker', wrapFill === 'none', wrapFill);
    const band = await page.$eval('.lg-chapter-band', el => getComputedStyle(el).fill);
    ok('childhood band is a faint tint, not a solid block', /rgba\(.*0\.0\d\)/.test(band) || /rgba\(.*0\.1/.test(band), band);

    // เรขาคณิตของข้อความบนกราฟ: ไม่ทับกัน และไม่ถูกขอบตัด (ตรวจที่ขนาดที่เรนเดอร์จริง)
    const geom = await page.evaluate(() => {
      const svg = document.querySelector('svg.lg-stock-chart');
      const clip = document.querySelector('.lg-chart-scroll').getBoundingClientRect();
      const collect = sel => [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent, x: r.x, y: r.y, w: r.width, h: r.height }; });
      const collide = list => {
        const bad = [];
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
          const a = list[i], b = list[j];
          if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) bad.push(a.t + ' ⟂ ' + b.t);
        }
        return bad;
      };
      const axes = collect('.lg-axis-label'), labels = collect('.lg-point-label'), years = collect('.lg-point-year');
      const all = axes.concat(labels, years);
      return {
        axes: axes.length,
        axisCollisions: collide(axes),
        labelCollisions: collide(labels),
        yearCollisions: collide(years),
        outside: all.filter(o => o.x < clip.x - 1 || o.x + o.w > clip.x + clip.width + 1).map(o => o.t),
        currentYearTick: axes.some(a => /2569 \(2026\)/.test(a.t)),
        futureDotsOutside: (() => {
          const ys = [...document.querySelectorAll('.lg-gridline')].map(l => Number(l.getAttribute('y1')));
          const top = Math.min.apply(null, ys), bottom = Math.max.apply(null, ys);
          return [...document.querySelectorAll('.lg-future-dot')]
            .map(d => Number(d.getAttribute('cy')))
            .filter(cy => cy < top - 0.5 || cy > bottom + 0.5)
            .map(cy => Math.round(cy));
        })()
      };
    });
    ok('year ticks are drawn', geom.axes >= 4, '' + geom.axes);
    ok('year tick labels never overlap', geom.axisCollisions.length === 0, geom.axisCollisions.join(' | '));
    ok('point name labels never overlap', geom.labelCollisions.length === 0, geom.labelCollisions.join(' | '));
    ok('point date labels never overlap', geom.yearCollisions.length === 0, geom.yearCollisions.join(' | '));
    ok('no chart text is cut off by the chart edge', geom.outside.length === 0, geom.outside.join(' | '));
    ok('the current year (2569 / 2026) is always ticked', geom.currentYearTick);
    ok('future goal markers stay inside the plotting area', geom.futureDotsOutside.length === 0, 'below the plot: ' + geom.futureDotsOutside.join(', '));

    // เรขาคณิตของ "เส้นโยง": จุดที่ทับกันเป๊ะ และเส้นประอนาคตที่ลากข้ามจุดจริง คือสิ่งที่ผู้ใช้เห็นเป็นความมั่ว
    const links = await page.evaluate(() => {
      const num = el => k => Number(el.getAttribute(k));
      const points = [...document.querySelectorAll('.lg-chart-point')].map(el => ({ id: el.getAttribute('data-id'), x: num(el)('cx'), y: num(el)('cy'), r: num(el)('r') }));
      const dots = [...document.querySelectorAll('.lg-future-dot')].map(el => ({ id: el.getAttribute('data-id'), x: num(el)('cx'), y: num(el)('cy'), r: num(el)('r'), projected: el.classList.contains('is-projected') }));
      const lines = [...document.querySelectorAll('.lg-future-line')].map(el => ({ x1: num(el)('x1'), y1: num(el)('y1'), x2: num(el)('x2'), y2: num(el)('y2') }));
      const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const stacked = [];
      for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) if (d(points[i], points[j]) < 7) stacked.push(points[i].id + ' บน ' + points[j].id);
      const dotOnMarker = [];
      dots.forEach(f => points.forEach(p => { if (d(f, p) < f.r + p.r + 2) dotOnMarker.push(f.id + ' บน ' + p.id); }));
      const segDist = (p, s) => {
        const vx = s.x2 - s.x1, vy = s.y2 - s.y1, wx = p.x - s.x1, wy = p.y - s.y1;
        const L = vx * vx + vy * vy || 1;
        let t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / L));
        return Math.hypot(p.x - (s.x1 + t * vx), p.y - (s.y1 + t * vy));
      };
      const lineOverMarker = [];
      lines.forEach((s, si) => points.forEach(p => { if (segDist(p, s) < p.r + 1) lineOverMarker.push('line' + si + ' ผ่าน ' + p.id); }));
      const gridX = [...document.querySelectorAll('.lg-grid-vertical')].map(l => Number(l.getAttribute('x1')));
      const plotRight = Math.max(...gridX);
      const projectedDots = dots.filter(f => f.projected);
      return {
        stacked, dotOnMarker, lineOverMarker,
        plotRight: Math.round(plotRight),
        projectedCount: projectedDots.length,
        offAxisFailures: projectedDots.filter(f => !(f.x > plotRight + 1)).map(f => f.id + '@' + Math.round(f.x)),
        anchors: lines.length
      };
    });
    ok('no two event markers sit on top of each other', links.stacked.length === 0, links.stacked.join(' | '));
    ok('future dashed lines never cut through real event markers', links.lineOverMarker.length === 0, links.lineOverMarker.join(' | '));
    ok('future goal dots never sit on real event markers', links.dotOnMarker.length === 0, links.dotOnMarker.join(' | '));
    ok('undated future goals are drawn off the time axis, right of the last tick',
      links.offAxisFailures.length === 0, 'plot right edge ' + links.plotRight + ' — ' + links.offAxisFailures.join(', '));
    ok('undated future goals are actually drawn', links.projectedCount >= 1, links.projectedCount + ' projected goals');
    ok('the future is drawn as one connector to the goal column, not a fan of crossing lines', links.anchors <= 3, links.anchors + ' future lines');

    const content = await page.locator('#lg-content').innerText();
    ok('legend carries all four pinned meanings', /ฟ้า/.test(content) && /เขียว/.test(content) && /เส้นประ/.test(content) && /แถบจาง/.test(content));
    ok('undated heading uses the pinned wording', content.indexOf('ปีไม่ระบุ · Undated Milestones') >= 0, content.slice(0, 300));
    ok('the pinned vertical-axis sentence is present verbatim', content.indexOf('ตำแหน่งแนวตั้งเป็นการจัดวางเชิงภาพ ไม่ใช่คะแนนชีวิตที่วัดจริง') >= 0);

    const tip = page.locator('#lg-chart-tip');
    ok('tooltip starts hidden', !(await tip.isVisible()));
    await page.hover('.lg-hit-wrap[data-tip-id="football-age11"]');
    await page.waitForTimeout(150);
    ok('tooltip appears on hover', await tip.isVisible());
    const tipText = await tip.innerText();
    ok('tooltip names the event', /ฟุตบอล/.test(tipText), tipText);
    ok('tooltip annotates that the date is year-only', /ระบุเป็นปี/.test(tipText), tipText);
    const tipBg = await tip.evaluate(el => getComputedStyle(el).backgroundColor);
    const rgb = tipBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    ok('tooltip is dark', !!rgb && Math.max(+rgb[1], +rgb[2], +rgb[3]) < 70, tipBg);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(120);
    ok('tooltip hides again when the pointer leaves', !(await tip.isVisible()));

    const dot = await page.$('.lg-future-dot');
    await dot.focus();
    ok('future dot is keyboard focusable', await dot.evaluate(el => el === document.activeElement));
    ok('focusing a future dot also shows its tooltip', await tip.isVisible());
    await page.keyboard.press('Enter');
    ok('Enter on a future dot opens its detail', await page.locator('#lg-detail').isVisible());
    ok('the future dot detail is marked as a future goal', /อนาคต/.test(await page.locator('#lg-detail').innerText()));
    await page.click('[data-close-detail]');
  });

  /* ---------- ข้อความต้องอ่านออกจริง + badge ห้ามตกบรรทัด ---------- */
  await step('readable text and badge layout', async () => {
    // บล็อกนี้เป็นธีมเข้ม (--lg-ink = สีอ่อนเกือบขาว) ถ้าองค์ไหนหลงเหลือพื้นหลังธีมสว่าง
    // ตัวอักษรจะขาวชนขาว อ่านไม่ออก — เคยเกิดจริงกับ .lg-notice, #lg-detail, .lg-map-node,
    // และปุ่ม .lg-danger จึงตรวจทุกมุมมอง ไม่ใช่แค่มุมมองที่กำลังเปิดอยู่
    const scan = () => page.evaluate(() => {
      const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null;
        const p = m[1].split(',').map(s => parseFloat(s)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
      const lum = c => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
      const out = [];
      document.querySelectorAll('#life-graph *').forEach(el => {
        const c = parse(getComputedStyle(el).backgroundColor);
        if (!(c && c.a > 0.5 && c.r > 195 && c.g > 190 && c.b > 180)) return;   // ไม่ใช่พื้นหลังสว่าง -> ข้าม
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const fg = parse(getComputedStyle(el).color);
        const delta = Math.abs(lum(fg) - lum(c));
        // input/select ของธีมเว็บเป็นพื้นขาว + ตัวอักษรเข้มโดยทั่วไปทั้งเว็บ (อ่านออก) -> ตัดออก
        const tag = el.tagName;
        if (delta < 90 && tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
          out.push(String(el.className || tag) + ' ' + getComputedStyle(el).color + ' on ' +
            `rgb(${c.r}, ${c.g}, ${c.b})` + ' Δ' + Math.round(delta));
        }
      });
      return out;
    });

    for (const view of ['timeline', 'graph', 'chapters', 'map']) {
      await page.click('[data-lg-view="' + view + '"]');
      await page.waitForTimeout(220);
      const bad = await scan();
      ok('no unreadable light-background text in the ' + view + ' view', bad.length === 0, bad.join(' | '));
    }

    // badge ต้องอยู่บรรทัดแรกเดียวกับข้อความ meta ไม่ใช่หล่นไปบรรทัดใหม่หรือโดนขอบตัด
    await page.click('[data-lg-view="timeline"]');
    await page.fill('#lg-search', '');
    await page.click('[data-all-years]');
    await page.waitForTimeout(300);
    const metas = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('#lg-content .lg-event-meta').forEach(p => {
        const badges = [...p.querySelectorAll('.lg-badge, .lg-carried')];
        if (!badges.length) return;
        const pr = p.getBoundingClientRect();
        const card = p.closest('.lg-event');
        const cr = card ? card.getBoundingClientRect() : pr;
        out.push({
          metas: p.textContent.trim().slice(0, 40),
          pTop: pr.top, cardRight: cr.right,
          badges: badges.map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), top: r.top, right: r.right, w: r.width }; })
        });
      });
      return out;
    });
    ok('timeline has cards carrying badges to test', metas.length > 0, metas.length + ' metas');
    const dropped = [], clipped = [], zero = [];
    metas.forEach(m => m.badges.forEach(b => {
      if (b.top > m.pTop + 4) dropped.push(b.t);
      if (b.right > m.cardRight + 1) clipped.push(b.t + ' right=' + Math.round(b.right) + ' card=' + Math.round(m.cardRight));
      if (!b.w) zero.push(b.t);
    }));
    ok('badges stay on the meta line instead of dropping to a new one', dropped.length === 0, dropped.join(', '));
    ok('badges are not clipped by the card edge', clipped.length === 0, clipped.join(' | '));
    ok('every badge renders with a real width', zero.length === 0, zero.join(', '));
    ok('a known badge ("ต้องยืนยัน" / "โดยประมาณ") is among them',
      metas.some(m => m.badges.some(b => /ต้องยืนยัน|โดยประมาณ|ปัจจุบัน|อนาคต/.test(b.t))),
      metas.map(m => m.badges.map(b => b.t).join('+')).join(' / '));

    // ตารางข้อมูลในแผงรายละเอียดต้องเป็นกริด 2 คอลัมน์ "เสมอ" — เดิม CSS เขียนเป็น .lg-detail-head+dl
    // (พี่น้องติดกัน) พอใน markup มี .lg-conflict กั้นระหว่าง head กับ dl ตารางก็ล่มเป็นแนวตั้งทั้งแผง
    const warnCard = page.locator('#lg-content .lg-event').filter({ has: page.locator('.lg-badge-warn') }).first();
    if (await warnCard.count()) {
      await warnCard.locator('.lg-actions [data-open]').click();
      await page.waitForTimeout(280);
      const dl = await page.evaluate(() => {
        const row = document.querySelector('#lg-detail .lg-detail-fields .lg-detail-row');
        if (!row) return null;
        const cs = getComputedStyle(row);
        const dt = row.querySelector('dt'), dd = row.querySelector('dd');
        return { display: cs.display, cols: cs.gridTemplateColumns,
          dtTop: dt ? dt.getBoundingClientRect().top : null, ddTop: dd ? dd.getBoundingClientRect().top : null };
      });
      ok('each detail field row renders as a 2-column grid even with a conflict banner present',
        !!dl && dl.display === 'grid' && dl.cols.trim().split(/\s+/).length === 2, JSON.stringify(dl));
      ok('field label and value sit side by side, not stacked',
        !!dl && dl.dtTop != null && Math.abs(dl.dtTop - dl.ddTop) < 6, JSON.stringify(dl));
      await page.click('[data-close-detail]');
    } else {
      ok('a record with a conflict banner exists to test the field grid', false, 'no .lg-badge-warn card found');
    }
  });

  /* ---------- ความซื่อสัตย์ของแผงรายละเอียด ---------- */
  await step('detail panel honesty', async () => {
    await page.click('[data-lg-view="timeline"]');
    await page.fill('#lg-search', 'ส่วนสูง');
    await page.waitForTimeout(150);
    await page.click('#lg-content [data-open="height-187"]');
    const d = await page.locator('#lg-detail').innerText();
    ok('detail opens for an undated record', await page.locator('#lg-detail').isVisible());
    ok('undated detail says the year is not recorded', /ปีไม่ระบุ/.test(d), d.slice(0, 200));
    ok('empty fields are shown as not recorded, never invented', (d.match(/ยังไม่ได้บันทึก/g) || []).length >= 1, 'placeholders: ' + (d.match(/ยังไม่ได้บันทึก/g) || []).length);
    ok('no invented year appears for the undated record', !/25\d\d \(20\d\d\)/.test(d));

    await page.click('[data-close-detail]');
    await page.fill('#lg-search', '');
    await page.click('#lg-years .lg-year-chip[data-lg-year="2021"]');
    const paragraphs = await page.locator('#lg-year-detail').innerText();
    ok('a range event appears in a middle year', /เพลง/.test(paragraphs), paragraphs.slice(0, 160));
    ok('a range event is marked as continued from its start year', /ต่อเนื่องจาก/.test(paragraphs), paragraphs.slice(0, 200));

    await page.fill('#lg-search', 'ม.2');
    await page.waitForTimeout(150);
    await page.click('#lg-content [data-open="music-start"]');
    const conflict = await page.locator('#lg-detail').innerText();
    ok('the conflicting music-start years raise a warning', /ข้อมูลขัดแย้ง/.test(conflict), conflict.slice(0, 200));
    ok('the conflict warning names both versions', /2018/.test(conflict) && /2021/.test(conflict));
    ok('date precision is shown for the record', /ความแม่นยำ|โดยประมาณ/.test(conflict));
    await page.click('[data-close-detail]');
    await page.fill('#lg-search', '');
  });

  /* ---------- เพิ่ม/แก้/ลบ + persistence ---------- */
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
    await page.waitForTimeout(250);
    await page.fill('#lg-search', 'ทดสอบเหตุการณ์ใหม่');
    await page.waitForTimeout(200);
    ok('a new record shows up in the timeline', /ทดสอบเหตุการณ์ใหม่/.test(await page.locator('#lg-content').innerText()));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.confirm = () => true; });
    await page.waitForSelector('#lg-years .lg-year-chip');
    await page.fill('#lg-search', 'ทดสอบเหตุการณ์ใหม่');
    await page.waitForTimeout(200);
    ok('the new record survives a reload', /ทดสอบเหตุการณ์ใหม่/.test(await page.locator('#lg-content').innerText()));

    await page.click('[data-lg-view="graph"]');
    await page.click('[data-lg-mode="self"]');
    ok('mode B plots the one real score', await page.locator('.lg-chart-point').count() === 1, 'got ' + await page.locator('.lg-chart-point').count());
    ok('mode B no longer claims there are no scores', await page.locator('.lg-score-notice').count() === 0);
    await page.click('[data-lg-mode="narrative"]');
    await page.click('[data-lg-view="timeline"]');

    await page.fill('#lg-search', 'blow my self');
    await page.waitForTimeout(200);
    await page.click('#lg-content [data-open="release-blow-myself"]');
    await page.click('[data-edit]');
    await page.fill('#lg-form [name="title"]', 'แก้เองแล้ว');
    await page.click('#lg-form button[type="submit"]');
    await page.waitForTimeout(250);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.confirm = () => true; });
    await page.waitForSelector('#lg-years .lg-year-chip');
    await page.fill('#lg-search', 'แก้เองแล้ว');
    await page.waitForTimeout(200);
    ok('an edited seed record keeps the edit after reload', /แก้เองแล้ว/.test(await page.locator('#lg-content').innerText()));
    const stillSeed = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.find(r => r.id === 'release-blow-myself'));
    ok('the edited seed is flagged as user-edited', !!stillSeed && stillSeed.userEdited === true);

    await page.evaluate(() => { window.confirm = () => { window.__asked = (window.__asked || 0) + 1; return true; }; });
    await page.click('#lg-content [data-open="release-blow-myself"]');
    await page.click('[data-delete]');
    await page.waitForTimeout(250);
    const confirmAsked = await page.evaluate(() => window.__asked || 0);
    ok('delete asks for confirmation first', confirmAsked === 1, 'confirm calls: ' + confirmAsked);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.confirm = () => true; });
    await page.waitForSelector('#lg-years .lg-year-chip');
    await page.fill('#lg-search', 'แก้เองแล้ว');
    await page.waitForTimeout(200);
    ok('the deleted seed does not come back after reload', !/แก้เองแล้ว/.test(await page.locator('#lg-content').innerText()));
    const stillGone = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.find(r => r.id === 'release-blow-myself'));
    ok('the deleted seed stays deleted', !stillGone);
    const tomb = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).deletedSeedIds || []);
    ok('the deleted seed is tombstoned', tomb.indexOf('release-blow-myself') >= 0, JSON.stringify(tomb));

    await page.fill('#lg-search', 'ทดสอบเหตุการณ์ใหม่');
    await page.waitForTimeout(200);
    ok('deleting a seed never touches user records', /ทดสอบเหตุการณ์ใหม่/.test(await page.locator('#lg-content').innerText()));
    await page.fill('#lg-search', '');
  });

  /* ---------- ส่งออก + นำเข้า ---------- */
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
    await page.waitForTimeout(300);
    ok('a bad import is rejected with a reason', /records/.test(await page.locator('#lg-notice').innerText()), await page.locator('#lg-notice').innerText());
    const afterJunk = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.length);
    ok('a rejected import changes nothing', afterJunk === beforeCount, 'before ' + beforeCount + ' after ' + afterJunk);

    const good = path.join(tmp, 'lg-good.json');
    fs.writeFileSync(good, JSON.stringify({ version: 2, records: [{ id: 'imported-1', title: 'นำเข้าทดสอบ', startYearCE: 2019, category: 'Personal' }] }));
    await page.setInputFiles('#lg-import-file', good);
    await page.waitForTimeout(350);
    const afterGood = await page.evaluate(() => JSON.parse(localStorage.getItem('et1cruel.life-graph.v2')).records.length);
    ok('a valid import merges after confirmation', afterGood === beforeCount + 1, 'before ' + beforeCount + ' after ' + afterGood);
    await page.fill('#lg-search', 'นำเข้าทดสอบ');
    await page.waitForTimeout(200);
    ok('the imported record is visible', /นำเข้าทดสอบ/.test(await page.locator('#lg-content').innerText()));
    await page.fill('#lg-search', '');
  });

  /* ---------- คีย์บอร์ด + โฟกัส ---------- */
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

  /* ---------- จอแคบ 360px ---------- */
  await step('360px layout', async () => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#lg-years .lg-year-chip');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth);
    ok('no horizontal page overflow at 360px', overflow <= 361, 'scrollWidth ' + overflow);
    const strip = await page.$eval('#lg-years', el => ({ h: el.clientHeight }));
    ok('the year strip stays usable on mobile', strip.h > 0);
    const chipWidth = await page.evaluate(() => document.querySelector('#lg-years .lg-year-chip').getBoundingClientRect().width);
    ok('year chips keep a readable size on mobile', chipWidth >= 60, 'chip width ' + chipWidth);
    await page.setViewportSize({ width: 1280, height: 1000 });
  });

  /* ---------- ไม่มีไฟล์ของ life-graph ที่โหลดไม่ขึ้น ---------- */
  await step('assets', async () => {
    const missing = failedRequests.filter(u => /life-graph/.test(u));
    ok('no life-graph asset failed to load', missing.length === 0, missing.join(' | '));
  });
}

/* ═══════════════════════════════ ตัวรัน ═══════════════════════════════ */
export async function main() {
  const checker = createChecker();
  const external = process.env.LG_URL || '';
  let server = null;
  let base = external;

  if (!base) {
    server = http.createServer((req, res) => {
      const rel = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = 'http://127.0.0.1:' + server.address().port;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, serviceWorkers: 'block', acceptDownloads: true });
  // บล็อกฟอนต์/วิดเจ็ต/API ภายนอก เพื่อให้ผลตรวจคงที่และรันได้แบบออฟไลน์
  await context.route('**/*', route => (route.request().url().startsWith(base) ? route.continue() : route.abort()));
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource|net::ERR_FAILED|ERR_BLOCKED/.test(t)) return; // ของภายนอกที่ถูกบล็อก
    consoleErrors.push(t);
  });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
  const failedRequests = [];
  page.on('requestfailed', r => { if (r.url().startsWith(base)) failedRequests.push(r.url()); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) failedRequests.push(r.status() + ' ' + r.url()); });

  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#life-graph', { timeout: 20000 });

  await run(page, { ok: checker.ok, step: checker.step, consoleErrors, failedRequests, base });

  await browser.close();
  if (server) server.close();

  const stat = runStatic(ROOT);
  const fails = checker.fails.concat(stat.fails);
  if (consoleErrors.length) fails.push('console errors: ' + consoleErrors.join(' | '));

  if (fails.length) {
    console.error('FAIL (' + fails.length + ')\n- ' + fails.join('\n- '));
    process.exitCode = 1;
    return { ok: false, fails };
  }
  console.log('OK life-graph v2 — dashboard intact, timeline/chapters/map/graph/panel verified (' + stat.note + ')');
  return { ok: true, fails: [] };
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (invoked === import.meta.url) {
  main().catch(e => { console.error('harness crashed: ' + (e && e.stack || e)); process.exit(1); });
}

export default run;
