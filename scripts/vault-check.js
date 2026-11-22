/* Verify vault balances + "K E-savings" rename + SCB vault + cache-bust.
 * Reads authoritative state from window.S / netWorth() (life-os-os.js), not just DOM.
 * Diary contrast is covered separately by scripts/diary-contrast-check.js (proven).
 * Run: node scripts/vault-check.js   (exit 0 = all pass) */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..');
const FILE = 'file:///' + path.join(root, 'index.html').replace(/\\/g, '/');
const BANKS = 'file:///' + path.join(root, 'banks.html').replace(/\\/g, '/');

/* vault key -> [expected value, expected displayed label] */
const EXPECT = {
  savings: [619000, '🌱 Kept Grow'],
  kasikorn: [962, '💳 K E-savings'],
  ktb: [120000, '🏦 KTB e-Savings'],
  dime: [23000, '💚 DIME Save'],
  scb: [4100, '🏦 SCB E-Savings'],
  cash: [2500, '💵 เงินสด'],
  stocks: [4378, '📈 DIME US'],
  btc: [400, '₿ BTC'],
};
const EXPECT_NET = 774340;

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') jsErrors.push('CONSOLE: ' + m.text().slice(0, 160)); });

  let fail = 0;
  const ok = (cond, label, extra) => {
    console.log((cond ? '  PASS  ' : '  FAIL  ') + label + (extra !== undefined ? '  -> ' + extra : ''));
    if (!cond) fail++;
  };

  /* ---------- 1. authoritative state ---------- */
  await page.goto(FILE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  /* State lives in an IIFE (life-os-os.js:8) so S/netWorth are NOT global.
   * Store.save() runs right after migrate() -> localStorage holds post-migration truth. */
  const state = await page.evaluate(() => {
    const raw = localStorage.getItem('et1cruel_lifeos_v1');
    if (!raw) return null;
    const s = JSON.parse(raw);
    return { vaults: s.money && s.money.vaults, ver: s.money && s.money.vaultVer };
  });

  console.log('=== 1. Authoritative state (localStorage et1cruel_lifeos_v1) ===');
  console.log('  vaultVer = ' + (state && state.ver));
  console.log('  vaults   = ' + JSON.stringify(state && state.vaults));

  ok(!!(state && state.vaults), 'persisted state readable', JSON.stringify(state && state.vaults));
  if (state && state.vaults) {
    const keys = Object.keys(state.vaults).sort();
    const wantKeys = Object.keys(EXPECT).sort();
    ok(JSON.stringify(keys) === JSON.stringify(wantKeys), 'vault keys match exactly', keys.join(','));
    for (const [k, [want]] of Object.entries(EXPECT)) {
      ok(state.vaults[k] === want, '  ' + k + ' = ' + want, state.vaults[k]);
    }
    const sum = Object.values(state.vaults).reduce((a, b) => a + (Number(b) || 0), 0);
    ok(sum === EXPECT_NET, 'sum(persisted vaults) = ' + EXPECT_NET, sum);
    ok(state.ver === 12, 'vaultVer migrated to 12', state.ver);
  }

  /* ---------- 2. rendered rows (display proof) ---------- */
  const rows = await page.evaluate(() => [...document.querySelectorAll('.vault .vrow')]
    .map(r => ({ label: r.querySelector('span')?.textContent.trim(), amt: r.querySelector('b')?.textContent.trim() })));
  console.log('\n=== 2. Rendered vault rows ===');
  rows.forEach(r => console.log('    ' + r.label + ' = ' + r.amt));

  const num = t => Number(String(t).replace(/[^\d]/g, ''));
  for (const [k, [want, label]] of Object.entries(EXPECT)) {
    const row = rows.find(r => r.label === label);
    ok(!!row, 'row rendered: ' + label, row ? row.amt : 'MISSING');
    if (row) ok(num(row.amt) === want, '  displayed = ' + want, row.amt);
  }
  ok(!rows.some(r => r.label && r.label.includes('กสิกร')), 'old label "กสิกร e-Savings" gone from vaults');

  /* SCB must be inside the SPEND breakdown (proves it is counted, not just shown) */
  const spendRow = rows.find(r => r.label && r.label.includes('4,100') && r.label.includes('+'));
  ok(!!spendRow, 'SPEND breakdown includes SCB 4,100', spendRow ? spendRow.label : 'not found');
  const totalRow = rows.find(r => r.label && r.label.includes('=') && num(r.amt) === EXPECT_NET);
  ok(!!totalRow, 'total row = ' + EXPECT_NET, totalRow ? totalRow.label + ' -> ' + totalRow.amt : 'not found');

  /* ---------- 3. banks.html rename + search ---------- */
  await page.goto(BANKS, { waitUntil: 'networkidle' });
  await page.waitForSelector('#bankGrid article.bank', { timeout: 15000 });

  console.log('\n=== 3. banks.html ===');
  const h3 = (await page.locator('#bankGrid article.bank h3').nth(1).textContent()).trim();
  ok(h3 === '2 · K E-savings', 'card title = "2 · K E-savings"', h3);

  const meta = await page.getAttribute('meta[name="description"]', 'content');
  ok(meta.includes('K E-savings') && !meta.includes('กสิกร E-Savings'), 'meta description renamed');

  for (const q of ['K E-savings', 'กสิกร', 'kbank', 'e-savings']) {
    await page.fill('#bankSearch', q);
    await page.waitForTimeout(150);
    const visible = await page.evaluate(() =>
      [...document.querySelectorAll('#bankGrid article.bank')].filter(a => a.offsetParent !== null).length);
    ok(visible >= 1, 'search "' + q + '" finds >=1 card', visible + ' card(s)');
  }
  await page.fill('#bankSearch', '');
  await page.waitForTimeout(150);
  const all = await page.evaluate(() =>
    [...document.querySelectorAll('#bankGrid article.bank')].filter(a => a.offsetParent !== null).length);
  ok(all === 11, 'clearing search restores all 11 cards', all);

  /* ---------- 4. cache-bust ---------- */
  console.log('\n=== 4. Cache-bust ===');
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  ok(/life-os-os\.js\?v=5/.test(idx), 'index.html references life-os-os.js?v=5');
  ok(!/life-os-os\.js\?v=4/.test(idx), 'index.html has no stale life-os-os.js?v=4');
  ok(/life-os-os\.js\?v=5/.test(sw), 'sw.js CORE has life-os-os.js?v=5');
  ok(/et1cruel-v82/.test(sw), 'sw.js CACHE = et1cruel-v82');

  console.log('\n=== JS errors: ' + jsErrors.length + ' ===');
  jsErrors.slice(0, 8).forEach(e => console.log('  ' + e));
  ok(jsErrors.length === 0, 'no JS errors');

  await browser.close();
  console.log('\n' + (fail === 0 ? 'ALL PASS' : fail + ' FAILED'));
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e.message); process.exit(2); });
