/* CREATE AI lab2 — calculators & visualizers (all compute from user input, v1) */
(function () {
'use strict';
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function num(id, root) { var v = parseFloat((root.querySelector('#' + id) || {}).value); return isFinite(v) ? v : NaN; }
function fmt(n, d) { if (!isFinite(n)) return '—'; return Number(n).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d }); }
function card(title, inner) { return '<div class="lab"><h3>' + title + ' <span class="pill ok">REAL CALC</span></h3>' + inner + '</div>'; }

/* ---- matrix 2x2 ---- */
function matrix() {
  var cell = function (id, v) { return '<input type="number" id="' + id + '" value="' + v + '" step="any" style="width:64px">'; };
  var html = card('🧮 Matrix 2×2 — คูณ + บวก + det (คำนวณจริง)',
    '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">' +
    '<div>A = [[' + cell('m-a11', 1) + ',' + cell('m-a12', 2) + '],[' + cell('m-a21', 3) + ',' + cell('m-a22', 4) + ']]</div>' +
    '<div>B = [[' + cell('m-b11', 5) + ',' + cell('m-b12', 6) + '],[' + cell('m-b21', 7) + ',' + cell('m-b22', 8) + ']]</div>' +
    '<button class="primary" id="m-go">คำนวณ</button></div><div id="m-out" style="margin-top:8px"></div>');
  return { html: html, bind: function (root) {
    root.querySelector('#m-go').onclick = function () {
      var g = function (id) { return num(id, root) || 0; };
      var A = [[g('m-a11'), g('m-a12')], [g('m-a21'), g('m-a22')]];
      var B = [[g('m-b11'), g('m-b12')], [g('m-b21'), g('m-b22')]];
      var C = [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
               [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
      var S = [[A[0][0] + B[0][0], A[0][1] + B[0][1]], [A[1][0] + B[1][0], A[1][1] + B[1][1]]];
      var det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      root.querySelector('#m-out').innerHTML = '<div class="kv"><div><small>A@B</small><b style="font-size:13px">[' + C[0] + '][' + C[1] + ']</b></div>' +
        '<div><small>A+B</small><b style="font-size:13px">[' + S[0] + '][' + S[1] + ']</b></div>' +
        '<div><small>det(A)</small><b>' + fmt(det) + '</b></div></div>';
    };
  } };
}

/* ---- GD 1D playground ---- */
function gd1d() {
  var html = card('⛰ GD Playground — เดินลงเขา f(w)=(w−4)² (คำนวณจริง)',
    '<div class="ctl"><label>w เริ่มต้น <input type="number" id="g-w" value="1" step="any"></label>' +
    '<label>learning rate <input type="number" id="g-lr" value="0.3" step="any"></label>' +
    '<label>steps <input type="number" id="g-n" value="12" step="1"></label></div>' +
    '<button class="primary" id="g-go">เดิน</button><div id="g-out" style="margin-top:8px"></div><canvas id="g-cv" width="640" height="180"></canvas>');
  return { html: html, bind: function (root) {
    root.querySelector('#g-go').onclick = function () {
      var w = num('g-w', root), lr = num('g-lr', root), n = Math.min(Math.max(Math.round(num('g-n', root)) || 0, 1), 200);
      if (!isFinite(w) || !isFinite(lr)) { root.querySelector('#g-out').textContent = 'ใส่ตัวเลขให้ครบ'; return; }
      var path = [w];
      for (var i = 0; i < n; i++) { w = w - lr * 2 * (w - 4); path.push(w); if (!isFinite(w)) break; }
      var rows = path.map(function (p, i) { return '<tr><td>' + i + '</td><td>' + fmt(p) + '</td><td>' + fmt(Math.pow(p - 4, 2)) + '</td></tr>'; }).join('');
      root.querySelector('#g-out').innerHTML = '<table><tr><th>step</th><th>w</th><th>loss</th></tr>' + rows + '</table>' +
        (isFinite(w) ? (Math.abs(w - 4) < 0.05 ? '<p style="color:var(--lime)">ถึงก้นหุบเขาแล้ว</p>' : '<p style="color:var(--amber)">ยังไม่ถึง ลองเพิ่ม steps หรือปรับ lr</p>') : '<p style="color:var(--red)">กระจาย (diverge) — lr ใหญ่เกินไป</p>');
      var cv = root.querySelector('#g-cv'), ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      var xs = [], mn = Infinity, mx = -Infinity;
      for (var x = -2; x <= 10; x += 0.2) { var y = Math.pow(x - 4, 2); xs.push([x, y]); if (y > mx) mx = y; }
      ctx.strokeStyle = '#2B3248'; ctx.beginPath();
      xs.forEach(function (p, i) { var X = 10 + (p[0] + 2) / 12 * (W - 20), Y = H - 14 - p[1] / mx * (H - 30); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.stroke();
      ctx.fillStyle = '#4ADE80';
      path.forEach(function (p) { if (!isFinite(p)) return; var X = 10 + (p + 2) / 12 * (W - 20), Y = H - 14 - Math.pow(p - 4, 2) / mx * (H - 30); ctx.beginPath(); ctx.arc(X, Y, 3, 0, 7); ctx.fill(); });
    };
  } };
}

/* ---- Bayes calculator ---- */
function bayes() {
  var html = card('🧪 Bayes Calculator — P(ป่วย|บวก) (คำนวณจริง)',
    '<div class="ctl"><label>อัตราป่วย P(D) % <input type="number" id="b-p" value="1" step="any"></label>' +
    '<label>ความไว sens % <input type="number" id="b-s" value="95" step="any"></label>' +
    '<label>ผลบวกลวง FPR % <input type="number" id="b-f" value="5" step="any"></label></div>' +
    '<button class="primary" id="b-go">คำนวณ</button><div id="b-out" style="margin-top:8px"></div>');
  return { html: html, bind: function (root) {
    root.querySelector('#b-go').onclick = function () {
      var p = num('b-p', root) / 100, s = num('b-s', root) / 100, f = num('b-f', root) / 100;
      if (!(p >= 0 && p <= 1 && s >= 0 && s <= 1 && f >= 0 && f <= 1)) { root.querySelector('#b-out').textContent = 'ใส่ 0–100 ให้ครบ'; return; }
      var top = s * p, bot = top + f * (1 - p);
      var ans = bot ? top / bot : NaN;
      root.querySelector('#b-out').innerHTML = '<div class="kv"><div><small>P(ป่วย|บวก)</small><b>' + fmt(ans * 100) + '%</b></div>' +
        '<div><small>สูตร</small><b style="font-size:12px">sens·P / (sens·P + FPR·(1−P))</b></div></div>';
    };
  } };
}

/* ---- VRAM estimator (assumptions disclosed) ---- */
function vram() {
  var html = card('💾 VRAM Estimator — ประมาณการพร้อมสมมติฐานเปิดเผย',
    '<p class="muted" style="font-size:13px">สมมติฐาน: น้ำหนัก = params×bytes · ฝึกบวก gradient (≈น้ำหนัก) + Adam (≈8B/param) · activation/KV-cache ขึ้นกับ context/batch ให้ช่วง ±25% — ใช้วางแผน ไม่ใช่ค่าตายตัว</p>' +
    '<div class="ctl"><label>params (พันล้าน เช่น 7) <input type="number" id="v-p" value="7" step="any"></label>' +
    '<label>precision <select id="v-b"><option value="4">FP32 (4B)</option><option value="2" selected>FP16/BF16 (2B)</option><option value="1">INT8 (1B)</option><option value="0.5">INT4 (0.5B)</option></select></label>' +
    '<label>โหมด <select id="v-m"><option value="infer">inference</option><option value="train">training (Adam)</option></select></label></div>' +
    '<button class="primary" id="v-go">ประมาณ</button><div id="v-out" style="margin-top:8px"></div>');
  return { html: html, bind: function (root) {
    root.querySelector('#v-go').onclick = function () {
      var P = num('v-p', root) * 1e9, B = parseFloat(root.querySelector('#v-b').value);
      var train = root.querySelector('#v-m').value === 'train';
      if (!(P > 0)) { root.querySelector('#v-out').textContent = 'ใส่ params ให้ถูก'; return; }
      var w = P * B / 1e9;
      var extra = train ? (P * B / 1e9 + P * 8 / 1e9) : w * 0.3;
      var mid = w + extra, lo = mid * 0.75, hi = mid * 1.25;
      root.querySelector('#v-out').innerHTML = '<div class="kv"><div><small>น้ำหนัก</small><b>' + fmt(w, 1) + ' GB</b></div>' +
        '<div><small>ช่วงประมาณ (±25%)</small><b>' + fmt(lo, 1) + '–' + fmt(hi, 1) + ' GB</b></div></div>' +
        '<p class="muted" style="font-size:13px">ยังไม่รวม KV-cache ตาม context/batch — context ยาวบวกเพิ่มได้มาก</p>';
    };
  } };
}

/* ---- training cost (all inputs, formula disclosed) ---- */
function cost() {
  var html = card('💸 Training Cost — สูตรเปิดเผย FLOPs≈6·N·D',
    '<p class="muted" style="font-size:13px">สมมติฐาน: FLOPs ≈ 6×params×tokens (heuristic) · เวลา = FLOPs ÷ (TFLOPS/GPU × utilization) · ไม่รวมสื่อสาร/ไฟ/คน</p>' +
    '<div class="ctl"><label>params (พันล้าน) <input type="number" id="c-p" value="7" step="any"></label>' +
    '<label>tokens (พันล้าน) <input type="number" id="c-t" value="100" step="any"></label>' +
    '<label>TFLOPS ต่อ GPU <input type="number" id="c-f" value="150" step="any"></label>' +
    '<label>utilization 0–1 <input type="number" id="c-u" value="0.4" step="any"></label>' +
    '<label>จำนวน GPU <input type="number" id="c-g" value="8" step="any"></label>' +
    '<label>$/GPU-ชม. <input type="number" id="c-r" value="2" step="any"></label></div>' +
    '<button class="primary" id="c-go">คำนวณ</button><div id="c-out" style="margin-top:8px"></div>');
  return { html: html, bind: function (root) {
    root.querySelector('#c-go').onclick = function () {
      var N = num('c-p', root) * 1e9, D = num('c-t', root) * 1e9, F = num('c-f', root) * 1e12,
        U = num('c-u', root), G = num('c-g', root), R = num('c-r', root);
      if (!(N > 0 && D > 0 && F > 0 && U > 0 && U <= 1 && G > 0 && R >= 0)) { root.querySelector('#c-out').textContent = 'ตรวจ input ให้ถูก (util 0–1)'; return; }
      var flops = 6 * N * D, hrs = flops / (F * U) / 3600 / G, cost = hrs * G * R;
      root.querySelector('#c-out').innerHTML = '<div class="kv"><div><small>FLOPs (ประมาณ)</small><b>' + (flops / 1e21).toFixed(1) + 'e21</b></div>' +
        '<div><small>เวลา (GPU ' + G + ' ใบ)</small><b>' + fmt(hrs, 1) + ' ชม.</b></div>' +
        '<div><small>ค่า GPU (~)</small><b>$' + fmt(cost, 0) + '</b></div></div>';
    };
  } };
}

/* ---- unit economics ---- */
function unitEcon() {
  var html = card('💰 Unit Economics — สูตรเปิดเผย ไม่การันตีรายได้',
    '<div class="ctl"><label>ราคาขาย/งาน (฿) <input type="number" id="u-p" value="5000" step="any"></label>' +
    '<label>ต้นทุน AI/งาน (฿) <input type="number" id="u-a" value="300" step="any"></label>' +
    '<label>ต้นทุนผันแปรอื่น (฿) <input type="number" id="u-v" value="700" step="any"></label>' +
    '<label>CAC/ลูกค้า (฿) <input type="number" id="u-c" value="2000" step="any"></label>' +
    '<label>กำไร/เดือน/ลูกค้า (฿) <input type="number" id="u-m" value="1500" step="any"></label></div>' +
    '<button class="primary" id="u-go">คำนวณ</button><div id="u-out" style="margin-top:8px"></div>');
  return { html: html, bind: function (root) {
    root.querySelector('#u-go').onclick = function () {
      var p = num('u-p', root), a = num('u-a', root), v = num('u-v', root), c = num('u-c', root), m = num('u-m', root);
      if (!(p > 0)) { root.querySelector('#u-out').textContent = 'ใส่ราคาขายก่อน'; return; }
      var margin = (p - a - v) / p * 100, pay = m > 0 ? c / m : NaN;
      root.querySelector('#u-out').innerHTML = '<div class="kv"><div><small>gross margin</small><b>' + fmt(margin, 1) + '%</b></div>' +
        '<div><small>CAC payback</small><b>' + fmt(pay, 1) + ' เดือน</b></div></div>' +
        '<p class="muted" style="font-size:13px">ตัวเลขจริงต้องมาจากบัญชีของคุณเอง</p>';
    };
  } };
}

/* ---- model compare (m07) ---- */
function compare() {
  var D = window.CAIDATA;
  var opts = D.m07models.map(function (m, i) { return '<option value="' + i + '">' + esc(m.name) + '</option>'; }).join('');
  var html = card('⚖️ Model Comparison — เลือก 2–3 ตัว (UNKNOWN คือไม่เคลม)',
    '<div class="ctl"><label>ตัวที่ 1 <select id="k-a">' + opts + '</select></label>' +
    '<label>ตัวที่ 2 <select id="k-b">' + opts.replace('value="1"', 'value="1" selected') + '</select></label>' +
    '<label>ตัวที่ 3 (ไม่บังคับ) <select id="k-c"><option value="-1">—</option>' + opts + '</select></label></div>' +
    '<button class="primary" id="k-go">เทียบ</button><div id="k-out" style="margin-top:8px;overflow-x:auto"></div>');
  function row(k, vals) { return '<tr><th>' + k + '</th>' + vals.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }
  return { html: html, bind: function (root) {
    root.querySelector('#k-go').onclick = function () {
      var idx = [root.querySelector('#k-a').value, root.querySelector('#k-b').value, root.querySelector('#k-c').value]
        .map(Number).filter(function (i) { return i >= 0; }).slice(0, 3);
      if (idx.length < 2) { root.querySelector('#k-out').textContent = 'เลือกอย่างน้อย 2 ตัว'; return; }
      var ms = idx.map(function (i) { return D.m07models[i]; });
      var keys = [['name', 'รุ่น'], ['dev', 'ผู้พัฒนา'], ['weights', 'เวต'], ['params', 'params'], ['active', 'active'], ['ctx', 'context'], ['license', 'license'], ['commercial', 'ใช้เชิงพาณิชย์'], ['local', 'รันเอง'], ['bench', 'benchmark'], ['status', 'สถานะ'], ['retrieved', 'ตรวจเมื่อ']];
      root.querySelector('#k-out').innerHTML = '<table class="cmp"><tr><th>หัวข้อ</th>' + ms.map(function (m) { return '<th>' + esc(m.name) + '</th>'; }).join('') + '</tr>' +
        keys.map(function (kk) { return row(kk[1], ms.map(function (m) { return m[kk[0]]; })); }).join('') +
        '<tr><th>แหล่งอ้างอิง</th>' + ms.map(function (m) {
          return '<td>' + (m.refs.length ? m.refs.map(function (r) { return '<a href="' + r.u + '" target="_blank" rel="noopener" style="color:var(--cyan)">' + esc(r.l) + '</a>'; }).join('<br>') : '—') + '<br><small style="color:var(--muted)">' + esc(m.note) + '</small></td>';
        }).join('') + '</tr></table>';
    };
  } };
}

/* ---- open-weight explorer (m08) ---- */
function explorer() {
  var D = window.CAIDATA;
  function sizeOf(p) {
    var m = /([\d.]+)\s*B/i.exec(p || '');
    if (!m) return 'unknown';
    var v = parseFloat(m[1]);
    if (v < 1) return '<1B';
    if (v < 3) return '1–3B'; if (v < 8) return '3–8B'; if (v < 14) return '8–14B';
    if (v < 32) return '14–32B'; if (v < 70) return '32–70B'; return '70B+';
  }
  var html = card('🔍 Open-Weight Explorer — กรองตามขนาด/เวต/ภาษา',
    '<div class="ctl"><label>ขนาด <select id="e-s"><option value="">ทั้งหมด</option><option><1B</option><option>1–3B</option><option>3–8B</option><option>8–14B</option><option>14–32B</option><option>32–70B</option><option>70B+</option><option>unknown</option></select></label>' +
    '<label>ภาษาไทย <select id="e-l"><option value="">ทั้งหมด</option><option>partial/community</option><option>UNKNOWN</option></select></label></div>' +
    '<div id="e-out" style="margin-top:8px"></div>');
  return { html: html, bind: function (root) {
    function paint() {
      var s = root.querySelector('#e-s').value, l = root.querySelector('#e-l').value;
      var list = D.m08open.filter(function (m) {
        return (!s || sizeOf(m.params) === s) && (!l || m.lang === l);
      });
      root.querySelector('#e-out').innerHTML = '<p class="muted">เจอ ' + list.length + ' รุ่น (VRAM คือประมาณการ)</p>' +
        list.map(function (m) {
          return '<div class="lesson"><h3>' + esc(m.name) + ' <span class="pill info">' + esc(m.params) + '</span> <span class="pill">' + esc(m.status) + '</span></h3>' +
            '<p style="font-size:14px">license: ' + esc(m.license) + ' · ใช้เชิงพาณิชย์: ' + esc(m.commercial) + ' · ไทย: ' + esc(m.lang) + '<br>VRAM: ' + esc(m.vram) + '<br>รัน: ' + esc(m.runtimes) + '</p></div>';
        }).join('');
    }
    root.querySelector('#e-s').onchange = paint; root.querySelector('#e-l').onchange = paint;
    paint();
  } };
}

/* ---- robots table (m13) ---- */
function robots() {
  var D = window.CAIDATA;
  var sts = ['ทั้งหมด', 'R&D / demo unit', 'pilot deployments reported', 'announced'];
  var html = card('🦾 Humanoid Tracker — UNKNOWN คือไม่เคลมสเปก',
    '<div class="ctl"><label>สถานะ <select id="r-s">' + sts.map(function (s) { return '<option>' + s + '</option>'; }).join('') + '</select></label></div>' +
    '<div id="r-out" style="margin-top:8px;overflow-x:auto"></div>');
  function cell(v) { return v === 'UNKNOWN' || v === 'NOT DISCLOSED' ? '<span style="color:var(--muted)">' + v + '</span>' : esc(v); }
  return { html: html, bind: function (root) {
    function paint() {
      var s = root.querySelector('#r-s').value;
      var list = D.m13robots.filter(function (r) { return s === 'ทั้งหมด' || r.status === s; });
      root.querySelector('#r-out').innerHTML = '<table class="cmp"><tr><th>บริษัท / รุ่น</th><th>สถานะ</th><th>สูง/หนัก/DoF</th><th>ราคา</th><th>อ้างอิง+โน้ต</th></tr>' +
        list.map(function (r) {
          return '<tr><td><b>' + esc(r.co) + '</b><br>' + esc(r.model) + ' <small style="color:var(--muted)">(' + esc(r.rel) + ')</small></td>' +
            '<td>' + esc(r.status) + ' <span class="pill">' + esc(r.vstatus) + '</span></td>' +
            '<td>' + cell(r.h) + ' / ' + cell(r.w) + ' / ' + cell(r.dof) + '</td><td>' + cell(r.price) + '</td>' +
            '<td>' + r.refs.map(function (x) { return '<a href="' + x.u + '" target="_blank" rel="noopener" style="color:var(--cyan)">' + esc(x.l) + '</a>'; }).join(' ') +
            '<br><small style="color:var(--muted)">' + esc(r.note) + '</small></td></tr>';
        }).join('') + '</table>';
    }
    root.querySelector('#r-s').onchange = paint;
    paint();
  } };
}

/* ---- 2-link arm FK playground ---- */
function arm() {
  var html = card('🦾 แขนกล 2 ข้อ — Forward Kinematics จริง',
    '<div class="ctl"><label>θ1 องศา <input type="range" id="j-t1" min="-180" max="180" value="40"></label>' +
    '<label>θ2 องศา <input type="range" id="j-t2" min="-180" max="180" value="50"></label>' +
    '<label>L1 <input type="number" id="j-l1" value="100"></label><label>L2 <input type="number" id="j-l2" value="80"></label></div>' +
    '<div class="kv"><div><small>ปลาย (x,y)</small><b id="j-p">–</b></div><div><small>สูตร</small><b style="font-size:12px">x=L1cosθ1+L2cos(θ1+θ2)</b></div></div>' +
    '<canvas id="j-cv" width="640" height="300"></canvas>');
  return { html: html, bind: function (root) {
    function paint() {
      var t1 = (+root.querySelector('#j-t1').value) * Math.PI / 180;
      var t2 = (+root.querySelector('#j-t2').value) * Math.PI / 180;
      var L1 = +root.querySelector('#j-l1').value || 0, L2 = +root.querySelector('#j-l2').value || 0;
      var x1 = L1 * Math.cos(t1), y1 = L1 * Math.sin(t1);
      var x2 = x1 + L2 * Math.cos(t1 + t2), y2 = y1 + L2 * Math.sin(t1 + t2);
      root.querySelector('#j-p').textContent = '(' + x2.toFixed(1) + ', ' + y2.toFixed(1) + ')';
      var cv = root.querySelector('#j-cv'), ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      var ox = 80, oy = 240, sc = 1;
      function P(x, y) { return [ox + x * sc, oy - y * sc]; }
      ctx.strokeStyle = '#4ADE80'; ctx.lineWidth = 6; ctx.beginPath();
      var a = P(0, 0), b = P(x1, y1), c = P(x2, y2);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
      ctx.fillStyle = '#A78BFA';
      [a, b, c].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7); ctx.fill(); });
      ctx.lineWidth = 1;
    }
    ['j-t1', 'j-t2', 'j-l1', 'j-l2'].forEach(function (id) { root.querySelector('#' + id).addEventListener('input', paint); });
    paint();
  } };
}

/* ---- agent workflow builder ---- */
function workflow() {
  var D = window.CAIDATA;
  var html = card('🔧 Agent Workflow Builder — เลือกตัวอย่างแล้วดูสายงาน',
    '<div class="ctl"><label>ตัวอย่าง agent <select id="f-a">' +
    D.m11agents.map(function (a, i) { return '<option value="' + i + '">' + esc(a.n) + '</option>'; }).join('') +
    '</select></label></div><div id="f-out" style="margin-top:8px"></div>');
  var colors = { input: '#22D3EE', plan: '#A78BFA', 'tool-call': '#FBBF24', observe: '#4ADE80', decide: '#F472B6', 'ask-human': '#FF4D5E', output: '#4ADE80' };
  return { html: html, bind: function (root) {
    function paint() {
      var a = D.m11agents[+root.querySelector('#f-a').value];
      root.querySelector('#f-out').innerHTML =
        '<p>' + a.flow.map(function (s) { return '<span class="pill" style="border-color:' + (colors[s] || '#fff') + ';color:' + (colors[s] || '#fff') + '">' + s + '</span>'; }).join(' → ') + '</p>' +
        '<p style="font-size:14px">เครื่องมือ: ' + esc(a.tools) + '<br>การ์ดกันพลาด: ' + esc(a.guard) + '</p>' +
        '<p class="muted" style="font-size:13px">นี่คือแผนภาพขั้นตอน (rule-based) ไม่ใช่การรัน agent จริง</p>';
    }
    root.querySelector('#f-a').onchange = paint;
    paint();
  } };
}

/* ---- timeline ---- */
function timeline() {
  var D = window.CAIDATA;
  var eras = ['ทั้งหมด', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
  var html = card('🕰 Interactive Timeline 1950–2023 (ข้อเท็จจริง + แหล่งอ้างอิงชื่อ)',
    '<div class="ctl"><label>ยุค <select id="e-era">' + eras.map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></label></div>' +
    '<div id="e-out" style="margin-top:8px;overflow-x:auto"></div>');
  return { html: html, bind: function (root) {
    function paint() {
      var e = root.querySelector('#e-era').value;
      var list = D.m02events.filter(function (ev) {
        if (e === 'ทั้งหมด') return true;
        var dec = e.slice(0, 3);
        return (ev.y || '').slice(0, 3) === dec;
      });
      root.querySelector('#e-out').innerHTML = '<table class="cmp"><tr><th>ปี</th><th>ใคร/เหตุการณ์</th><th>เทคโนโลยี</th><th>ทำไมสำคัญ</th><th>แหล่งอ้างอิง</th></tr>' +
        list.map(function (ev) {
          return '<tr><td><b>' + esc(ev.y) + '</b></td><td><b>' + esc(ev.who) + '</b><br>' + esc(ev.ev) + '</td><td>' + esc(ev.tech) + '</td><td>' + esc(ev.why) + '</td><td><small style="color:var(--muted)">' + esc(ev.src) + '</small></td></tr>';
        }).join('') + '</table><p class="muted" style="font-size:13px">หลัง 2023 ให้ตามจากบล็อก/เอกสารทางการโดยตรง</p>';
    }
    root.querySelector('#e-era').onchange = paint;
    paint();
  } };
}

/* ---- knowledge graph SVG ---- */
function kgraph() {
  var D = window.CAIDATA;
  var pos = { linalg: [60, 60], prob: [60, 160], python: [220, 60], pytorch: [220, 160], neuron: [380, 110], backprop: [540, 110], transformer: [700, 110], llm: [860, 110], finetune: [1020, 60], rag: [1020, 160], agent: [1180, 110], serve: [1180, 210], vision: [860, 260], robot: [1020, 260], safety: [1180, 310], biz: [1340, 210] };
  var col = { math: '#22D3EE', code: '#A78BFA', net: '#4ADE80', model: '#FBBF24', app: '#F472B6', sense: '#4DA6FF', biz: '#FF4D5E' };
  var W = 1420, H = 360, s = '';
  D.kgraph.links.forEach(function (lk) {
    var a = pos[lk[0]], b = pos[lk[1]];
    s += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#2B3248" stroke-width="2"/>';
  });
  D.kgraph.nodes.forEach(function (n) {
    var p = pos[n.id];
    s += '<g data-kg="' + n.id + '" style="cursor:pointer"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="16" fill="#0B0D14" stroke="' + (col[n.g] || '#fff') + '" stroke-width="3"/>' +
      '<text x="' + p[0] + '" y="' + (p[1] + 32) + '" fill="#F4F6FB" font-size="12" text-anchor="middle">' + esc(n.l) + '</text></g>';
  });
  var info = { linalg: 'ต้องก่อน: คณิต ม.ปลาย · ไป: Neuron (m05) · โปรเจกต์: Project 1', prob: 'ต้องก่อน: - · ไป: Loss/Naive Bayes (m03l4, Project 4)', python: 'ต้องก่อน: - · ไป: PyTorch, Project 1–4', pytorch: 'ต้องก่อน: Python+numpy · ไป: M04l5, Project 2–3', neuron: 'ต้องก่อน: Linear Algebra · ไป: Backprop (m05l2–l3)', backprop: 'ต้องก่อน: Neuron+Chain rule · ไป: Transformer (1986 Nature)', transformer: 'ต้องก่อน: Backprop+Attention · ไป: LLM (Vaswani et al. 2017)', llm: 'ต้องก่อน: Transformer · ไป: Fine-tune/RAG/Agents', finetune: 'ต้องก่อน: LLM · ไป: LoRA/QLoRA (M06L4)', rag: 'ต้องก่อน: LLM+embeddings · ไป: Agent (m11l3)', agent: 'ต้องก่อน: LLM+tools · ไป: M11, ธุรกิจ', serve: 'ต้องก่อน: LLM+quant · ไป: vLLM/llama.cpp (M10)', vision: 'ต้องก่อน: CNN พื้นฐาน · ไป: VLM (M12)', robot: 'ต้องก่อน: Vision+LLM · ไป: ROS 2/VLA (M13)', safety: 'ต้องก่อน: - · ไป: M14 checklist', biz: 'ต้องก่อน: Agent+serve · ไป: M15' };
  var html = '<div class="lab"><h3>🕸 Knowledge Graph — คลิกโหนดดูเส้นทาง <span class="pill ok">STATIC MAP</span></h3>' +
    '<div style="overflow-x:auto"><svg id="kg-svg" width="' + W + '" height="' + H + '" role="img" aria-label="แผนที่ความรู้ AI">' + s + '</svg></div>' +
    '<div id="kg-info" class="muted" style="margin-top:8px">คลิกโหนดเพื่อดูว่าต้องเรียนอะไรก่อน–หลัง</div></div>';
  return { html: html, bind: function (root) {
    root.querySelectorAll('[data-kg]').forEach(function (g) {
      g.addEventListener('click', function () { root.querySelector('#kg-info').innerHTML = '<b style="color:var(--lime)">' + g.dataset.kg + '</b> — ' + esc(info[g.dataset.kg] || ''); });
    });
  } };
}

window.CAILAB2 = { matrix: matrix, gd1d: gd1d, bayes: bayes, vram: vram, cost: cost, unitEcon: unitEcon, compare: compare, explorer: explorer, robots: robots, arm: arm, workflow: workflow, timeline: timeline, kgraph: kgraph };
})();
