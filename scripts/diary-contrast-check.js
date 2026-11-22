/* Feedback loop: วัด contrast ของข้อความ description ในรายการไดอารี่
   RED  = contrast < 4.5 (WCAG AA สำหรับข้อความปกติ)
   GREEN = contrast >= 4.5
   ใช้: node scripts/diary-contrast-check.js            */
const { chromium } = require('playwright');
const path = require('path');

const THRESHOLD = 4.5;
const FILE = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

function lum(rgb) {
  const c = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(fg, bg) {
  const a = lum(fg), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function parse(str) {
  const m = String(str).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(s => parseFloat(s.trim()));
  return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  // seed ข้อมูลไดอารี่หนึ่งวันที่มี title + description ยาวพอให้เห็นเป็นย่อหน้า
  await page.addInitScript(() => {
    localStorage.setItem('et1cruel_diary_v1', JSON.stringify({
      entries: {
        '2026-11-22': {
          title: 'gpt plus หมดแล้ว / โปรลุกขึ้นมา 3 ตัว / ซื้อของเพิ่มเน็ต / กินปลาย',
          text: 'บรรทัดอธิบายรายละเอียดยาวพอที่จะเห็นเป็นย่อหน้าชัดเจน เพื่อใช้ตรวจว่าตัวอักษรบนพื้นการ์ดอ่านออกหรือไม่ — นี่คือข้อความทดสอบสำหรับการวัด contrast โดยตรง',
          mood: '😊', updatedAt: new Date().toISOString()
        }
      }
    }));
  });

  await page.goto(FILE, { waitUntil: 'networkidle' });
  await page.waitForSelector('#diaryList .jentry p', { timeout: 15000 });

  const result = await page.evaluate(() => {
    const p = document.querySelector('#diaryList .jentry p');
    const card = document.querySelector('#diaryList .jentry');
    const cs = getComputedStyle(p);

    // composite สีพื้นจริง: เดินจาก root ลงมาทับลูก (alpha ทับซ้อน) จนถึงข้อความ
    // เพื่อไม่ให้พื้นโปร่งอย่าง rgba(255,255,255,.07) ถูกเข้าใจผิดว่าเป็นพื้นขาว
    function over(dst, src) {
      const a = src[3] + dst[3] * (1 - src[3]);
      if (a === 0) return [0, 0, 0, 0];
      return [
        (src[0] * src[3] + dst[0] * dst[3] * (1 - src[3])) / a,
        (src[1] * src[3] + dst[1] * dst[3] * (1 - src[3])) / a,
        (src[2] * src[3] + dst[2] * dst[3] * (1 - src[3])) / a,
        a
      ];
    }
    function toRgba(str) {
      const m = String(str).match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const v = m[1].split(',').map(s => parseFloat(s.trim()));
      return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1];
    }

    const chain = [];
    for (let el = p; el; el = el.parentElement) chain.unshift(el);
    let acc = [255, 255, 255, 1]; // fallback: ขาว
    for (const el of chain) {
      const c = toRgba(getComputedStyle(el).backgroundColor);
      if (c && c[3] > 0) acc = over(acc, c);
    }

    const fgC = toRgba(cs.color) || [0, 0, 0, 1];
    const fgA = fgC[3] + acc[3] * (1 - fgC[3]);
    const effFg = [
      fgC[0] * fgC[3] / (fgA || 1) + acc[0] * acc[3] * (1 - fgC[3]) / (fgA || 1),
      fgC[1] * fgC[3] / (fgA || 1) + acc[1] * acc[3] * (1 - fgC[3]) / (fgA || 1),
      fgC[2] * fgC[3] / (fgA || 1) + acc[2] * acc[3] * (1 - fgC[3]) / (fgA || 1)
    ];

    return {
      color: cs.color,
      background: 'rgb(' + acc.slice(0, 3).map(n => Math.round(n)).join(', ') + ')',
      fontSize: cs.fontSize,
      cardBackground: card ? getComputedStyle(card).backgroundColor : null,
      panelBackground: getComputedStyle(document.querySelector('#diaryList').closest('.diary-history') || document.body).backgroundColor,
      _fg: effFg,
      _bg: acc.slice(0, 3),
      text: (p.textContent || '').slice(0, 40)
    };
  });

  const ratio = contrast(result._fg, result._bg);

  console.log('--- Diary description contrast ---');
  console.log('text     :', result.text + '…');
  console.log('color    :', result.color);
  console.log('bg       :', result.background);
  console.log('card bg  :', result.cardBackground);
  console.log('fontSize :', result.fontSize);
  console.log('ratio    :', ratio.toFixed(2) + ' (ต้อง >= ' + THRESHOLD + ')');

  await browser.close();
  process.exit(ratio >= THRESHOLD ? 0 : 1);
})().catch(e => { console.error('ERROR:', e.message); process.exit(2); });
