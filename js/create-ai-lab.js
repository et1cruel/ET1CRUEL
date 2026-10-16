/* CREATE AI lab — real math in-browser (neuron/GD/attention); tokenizer = labeled SIMULATION */
(function () {
'use strict';
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function sig(z) { return 1 / (1 + Math.exp(-z)); }
function fmt(n, d) { return Number(n).toFixed(d == null ? 4 : d); }

/* ---------- hero brain canvas (2D illustrative, pausable) ---------- */
var brainOn = true, brainRAF = 0;
function brainDraw() {
  var cv = document.getElementById('brain');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var W = cv.width, H = cv.height;
  var layers = [4, 6, 6, 3], pos = [];
  var t0 = performance.now();
  function frame(t) {
    if (!brainOn) return;
    var el = (t - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    pos = layers.map(function (n, li) {
      var x = 80 + li * ((W - 160) / (layers.length - 1)), arr = [];
      for (var i = 0; i < n; i++) arr.push([x, 30 + i * ((H - 60) / Math.max(n - 1, 1))]);
      return arr;
    });
    ctx.lineWidth = 1;
    for (var a = 0; a < pos.length - 1; a++) for (var i = 0; i < pos[a].length; i++) for (var j = 0; j < pos[a + 1].length; j++) {
      var p = (Math.sin(el * 1.4 + i * 1.7 + j * 2.3 + a) + 1) / 2;
      ctx.strokeStyle = 'rgba(74,222,128,' + (0.08 + p * 0.30).toFixed(2) + ')';
      ctx.beginPath(); ctx.moveTo(pos[a][i][0], pos[a][i][1]); ctx.lineTo(pos[a + 1][j][0], pos[a + 1][j][1]); ctx.stroke();
    }
    pos.forEach(function (layer, li) {
      layer.forEach(function (pt, i) {
        var p = (Math.sin(el * 2 + li + i * 1.3) + 1) / 2;
        ctx.fillStyle = li === 0 ? '#22D3EE' : (li === pos.length - 1 ? '#A78BFA' : '#4ADE80');
        ctx.globalAlpha = 0.55 + p * 0.45;
        ctx.beginPath(); ctx.arc(pt[0], pt[1], 7, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      });
    });
    brainRAF = requestAnimationFrame(frame);
  }
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { brainOn = false; }
  } catch (e) {}
  if (brainOn) brainRAF = requestAnimationFrame(frame);
  else { ctx.fillStyle = '#AAB4CC'; ctx.font = '14px sans-serif'; ctx.fillText('ภาพนิ่ง (reduced motion / หยุดภาพไว้) — 4-6-6-3 โหนดเพื่อการสอน', 20, H / 2); }
}
function brainToggle() {
  brainOn = !brainOn;
  if (brainOn) brainDraw();
  else cancelAnimationFrame(brainRAF);
  return brainOn;
}

/* ---------- Lab 1: single neuron, real equation ---------- */
function labNeuron() {
  var s = { x1: 1, x2: 0, w1: 0.8, w2: -0.4, b: 0.1 };
  function calc() { var z = s.w1 * s.x1 + s.w2 * s.x2 + s.b; return { z: z, y: sig(z) }; }
  function row(k, label, min, max, step) {
    return '<label>' + label + ': <output id="n-' + k + 'v">' + s[k] + '</output>' +
      '<input type="range" id="n-' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + s[k] + '"></label>';
  }
  var html = '<div class="lab" id="lab-neuron"><h3>🔬 Lab 1 · Neuron — สมการจริง <span class="pill ok">REAL MATH</span></h3>' +
    '<p class="muted">y = σ(w₁x₁ + w₂x₂ + b), σ(z) = 1/(1+e<sup>−z</sup>) · ตัดสินเป็น 1 เมื่อ y ≥ 0.5</p><div class="ctl">' +
    row('x1', 'x₁ input', 0, 1, 1) + row('x2', 'x₂ input', 0, 1, 1) +
    row('w1', 'w₁ weight', -2, 2, 0.1) + row('w2', 'w₂ weight', -2, 2, 0.1) + row('b', 'b bias', -2, 2, 0.1) + '</div>' +
    '<div class="kv"><div><small>z = w·x + b</small><b id="n-z">–</b></div><div><small>y = σ(z)</small><b id="n-y">–</b></div><div><small>class</small><b id="n-c">–</b></div></div></div>';
  return { html: html, bind: function (root) {
    function paint() {
      var r = calc();
      root.querySelector('#n-z').textContent = fmt(r.z);
      root.querySelector('#n-y').textContent = fmt(r.y);
      root.querySelector('#n-c').textContent = r.y >= 0.5 ? '1' : '0';
      ['x1', 'x2', 'w1', 'w2', 'b'].forEach(function (k) { root.querySelector('#n-' + k + 'v').textContent = s[k]; });
    }
    ['x1', 'x2', 'w1', 'w2', 'b'].forEach(function (k) {
      root.querySelector('#n-' + k).addEventListener('input', function (e) { s[k] = +e.target.value; paint(); });
    });
    paint();
  } };
}

/* ---------- Lab 2: train tiny 2-2-1 net with REAL full-batch GD ---------- */
var TRAIN = (function () {
  var X = [[0, 0], [0, 1], [1, 0], [1, 1]];
  var Y = [0, 1, 1, 1]; // OR — แยกได้ด้วยชั้นเดียว แต่ใช้ 2 ชั้นเพื่อสอน hidden layer
  function init() { return { W1: [[0.5, -0.4], [0.3, 0.6]], b1: [0, 0], W2: [0.7, -0.5], b2: 0 }; }
  function forward(P) {
    var outs = [], hs = [];
    for (var n = 0; n < 4; n++) {
      var h = [sig(X[n][0] * P.W1[0][0] + X[n][1] * P.W1[1][0] + P.b1[0]),
               sig(X[n][0] * P.W1[0][1] + X[n][1] * P.W1[1][1] + P.b1[1])];
      hs.push(h);
      outs.push(sig(h[0] * P.W2[0] + h[1] * P.W2[1] + P.b2));
    }
    return { h: hs, o: outs };
  }
  function lossOf(P) {
    var f = forward(P), s = 0;
    for (var n = 0; n < 4; n++) s += Math.pow(f.o[n] - Y[n], 2);
    return s / 4;
  }
  function step(P, lr) {
    var f = forward(P);
    var dW1 = [[0, 0], [0, 0]], db1 = [0, 0], dW2 = [0, 0], db2 = 0;
    for (var n = 0; n < 4; n++) {
      var e = f.o[n] - Y[n], do_ = e * f.o[n] * (1 - f.o[n]);
      dW2[0] += do_ * f.h[n][0] / 4; dW2[1] += do_ * f.h[n][1] / 4; db2 += do_ / 4;
      for (var j = 0; j < 2; j++) {
        var dh = do_ * P.W2[j] * f.h[n][j] * (1 - f.h[n][j]);
        dW1[0][j] += dh * X[n][0] / 4; dW1[1][j] += dh * X[n][1] / 4; db1[j] += dh / 4;
      }
    }
    for (var j = 0; j < 2; j++) { P.W2[j] -= lr * dW2[j]; P.b1[j] -= lr * db1[j]; P.W1[0][j] -= lr * dW1[0][j]; P.W1[1][j] -= lr * dW1[1][j]; }
    P.b2 -= lr * db2;
  }
  function run(lr, steps) {
    var P = init(), hist = [lossOf(P)];
    for (var s = 0; s < steps; s++) { step(P, lr); if (s % 10 === 9) hist.push(lossOf(P)); }
    var f = forward(P), acc = 0;
    for (var n = 0; n < 4; n++) if (((f.o[n] >= 0.5) ? 1 : 0) === Y[n]) acc++;
    return { loss: hist, final: lossOf(P), acc: acc, preds: f.o.map(function (o) { return +o.toFixed(3); }) };
  }
  return { run: run, X: X, Y: Y };
})();
function labTrain() {
  var html = '<div class="lab" id="lab-train"><h3>🔬 Lab 2 · ฝึกเน็ต 2-2-1 ด้วย gradient descent จริง <span class="pill ok">REAL MATH</span></h3>' +
    '<p class="muted">ข้อมูล OR 4 จุด · full-batch GD · init คงที่ (deterministic) · loss = MSE เฉลี่ย — กดรันกี่ครั้งก็ได้เลขเดิม</p>' +
    '<div class="ctl"><label>learning rate <select id="t-lr"><option value="0.1">0.1 (ช้า)</option><option value="0.8" selected>0.8 (พอดี)</option><option value="3">3.0 (แรงเกิน)</option></select></label>' +
    '<label>steps <select id="t-st"><option value="100">100</option><option value="500" selected>500</option><option value="2000">2000</option></select></label></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" id="t-run">▶ รันการฝึก (คำนวณจริง)</button>' +
    '<button id="t-cmp">เทียบ LR 0.1 / 0.8 / 3.0 (500 steps)</button></div>' +
    '<div class="kv"><div><small>final loss (MSE)</small><b id="t-loss">–</b></div><div><small>accuracy /4</small><b id="t-acc">–</b></div><div><small>predictions</small><b id="t-pred" style="font-size:12px">–</b></div></div>' +
    '<canvas id="t-cv" width="640" height="200"></canvas><div id="t-tbl"></div></div>';
  function drawCurve(cv, hist, label) {
    var ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    var mx = Math.max.apply(null, hist) || 1;
    ctx.strokeStyle = '#2B3248'; ctx.beginPath(); ctx.moveTo(0, H - 14); ctx.lineTo(W, H - 14); ctx.stroke();
    ctx.strokeStyle = '#4ADE80'; ctx.lineWidth = 2; ctx.beginPath();
    hist.forEach(function (v, i) {
      var x = 8 + i * ((W - 16) / Math.max(hist.length - 1, 1)), y = H - 16 - (v / mx) * (H - 40);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#AAB4CC'; ctx.font = '12px monospace';
    ctx.fillText(label + '  loss ' + hist[0].toFixed(4) + ' → ' + hist[hist.length - 1].toFixed(4), 10, 16);
  }
  return { html: html, bind: function (root) {
    root.querySelector('#t-run').onclick = function () {
      var r = TRAIN.run(+root.querySelector('#t-lr').value, +root.querySelector('#t-st').value);
      root.querySelector('#t-loss').textContent = fmt(r.final);
      root.querySelector('#t-acc').textContent = r.acc + '/4';
      root.querySelector('#t-pred').textContent = '[' + r.preds.join(', ') + ']';
      drawCurve(root.querySelector('#t-cv'), r.loss, 'loss curve (real)');
      root.querySelector('#t-tbl').innerHTML = '';
    };
    root.querySelector('#t-cmp').onclick = function () {
      var rows = [0.1, 0.8, 3.0].map(function (lr) { var r = TRAIN.run(lr, 500); return { lr: lr, loss: r.final, acc: r.acc }; });
      root.querySelector('#t-tbl').innerHTML = '<table><tr><th>learning rate</th><th>final loss</th><th>accuracy</th><th>อ่านผล</th></tr>' +
        rows.map(function (r) {
          var note = r.lr === 0.1 ? 'ลงช้า ยังไม่ถึงก้นหุบ' : (r.lr === 0.8 ? 'ลงสวย' : (r.loss > 0.2 ? 'แรงเกิน กระโดดไปมา' : 'ลงได้แต่เสี่ยง'));
          return '<tr><td>' + r.lr + '</td><td>' + fmt(r.loss) + '</td><td>' + r.acc + '/4</td><td>' + note + '</td></tr>';
        }).join('') + '</table>';
      drawCurve(root.querySelector('#t-cv'), TRAIN.run(0.8, 500).loss, 'lr=0.8 (real)');
      root.querySelector('#t-loss').textContent = fmt(rows[1].loss);
      root.querySelector('#t-acc').textContent = rows[1].acc + '/4';
    };
  } };
}

/* ---------- Lab 3: attention heatmap, real softmax ---------- */
function labAttn() {
  var K = [[1, 0], [0, 1], [1, 1]], Q = [1, 0.5], toks = ['แมว', 'กิน', 'ปลา'];
  function calc() {
    var d = 2, scores = K.map(function (k) { return (Q[0] * k[0] + Q[1] * k[1]) / Math.sqrt(d); });
    var mx = Math.max.apply(null, scores);
    var ex = scores.map(function (s) { return Math.exp(s - mx); });
    var sm = ex.reduce(function (a, b) { return a + b; }, 0);
    return { scores: scores, w: ex.map(function (e) { return e / sm; }) };
  }
  var html = '<div class="lab" id="lab-attn"><h3>🔬 Lab 3 · Attention heatmap — softmax จริง <span class="pill ok">REAL MATH</span></h3>' +
    '<p class="muted">query "แมว" สนใจ key 3 ตัวแค่ไหน: weight = softmax(Q·K/√d) · แก้เลข K แล้วดูน้ำหนักเปลี่ยน</p>' +
    '<div class="ctl">' +
    [0, 1, 2].map(function (i) {
      return '<label>K' + (i + 1) + ' (' + toks[i] + ') [a,b]<input type="text" id="a-k' + i + '" value="' + K[i][0] + ',' + K[i][1] + '"></label>';
    }).join('') + '</div><div id="a-out"></div>';
  return { html: html, bind: function (root) {
    function paint() {
      for (var i = 0; i < 3; i++) {
        var v = root.querySelector('#a-k' + i).value.split(',');
        var a = parseFloat(v[0]), b = parseFloat(v[1]);
        K[i] = [isFinite(a) ? a : 0, isFinite(b) ? b : 0];
      }
      var r = calc(), mx = Math.max.apply(null, r.w);
      root.querySelector('#a-out').innerHTML = '<table><tr><th>key</th><th>score Q·K/√2</th><th>weight</th><th>ภาพ</th></tr>' +
        r.w.map(function (w, i) {
          var bars = Math.round(w / mx * 12);
          return '<tr><td>' + toks[i] + ' [' + K[i][0] + ',' + K[i][1] + ']</td><td>' + fmt(r.scores[i], 3) + '</td><td>' + fmt(w, 3) + '</td><td style="color:var(--lime)">' + new Array(bars + 1).join('█') + '</td></tr>';
        }).join('') + '</table><p class="muted" style="font-size:13px">ผลรวม weight = ' + fmt(r.w[0] + r.w[1] + r.w[2], 4) + ' (ต้องเป็น 1.0 เสมอ — ตรวจเองได้)</p>';
    }
    [0, 1, 2].forEach(function (i) { root.querySelector('#a-k' + i).addEventListener('input', paint); });
    paint();
  } };
}

/* ---------- Lab 4: tokenizer demo — SIMULATION ---------- */
function labTok() {
  var html = '<div class="lab" id="lab-tok"><h3>🔬 Lab 4 · Tokenizer <span class="pill">SIMULATION — ไม่ใช่ BPE จริง</span></h3>' +
    '<p class="muted">ของจริง (BPE/WordPiece) เรียนการตัดจากข้อมูลหลาย GB ที่นี่จำลองด้วยการตัดตามช่องว่าง + อักขระ เพื่อให้เห็นไอเดีย "หั่นก่อนแปลงเป็น ID" เท่านั้น</p>' +
    '<div class="ctl"><label>พิมพ์ข้อความ (ไทย/อังกฤษ)<input type="text" id="k-in" value="AI learns from data"></label></div><div id="k-out"></div>';
  return { html: html, bind: function (root) {
    function paint() {
      var t = root.querySelector('#k-in').value || '';
      var toks = t.split(/(\s+|[^\u0E00-\u0E7FA-Za-z0-9]+)/).filter(function (x) { return x && !/^\s+$/.test(x); });
      var ids = toks.map(function (x) { var h = 0; for (var i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) % 50000; return h; });
      root.querySelector('#k-out').innerHTML = '<table><tr><th>#</th><th>ชิ้นข้อความ</th><th>ID จำลอง</th></tr>' +
        toks.map(function (x, i) { return '<tr><td>' + i + '</td><td>' + esc(x) + '</td><td>' + ids[i] + '</td></tr>'; }).join('') + '</table>';
    }
    root.querySelector('#k-in').addEventListener('input', paint);
    paint();
  } };
}

window.CAILAB = {
  brain: brainDraw, brainToggle: brainToggle,
  render: function (host, focus) {
    var labs = [labNeuron(), labTrain(), labAttn(), labTok()];
    host.innerHTML = '<div class="panel"><h2>🧪 แล็บลงมือ (' + labs.length + ')</h2><p class="desc">ป้าย <span class="pill ok">REAL MATH</span> = คำนวณจริงในเครื่องคุณ · <span class="pill">SIMULATION</span> = ภาพประกอบเพื่อการสอน</p></div>';
    labs.forEach(function (L) {
      var d = document.createElement('div');
      d.innerHTML = L.html;
      host.appendChild(d);
      L.bind(d);
    });
    if (focus) {
      var map = { neuron: 'lab-neuron', train: 'lab-train', attn: 'lab-attn', tok: 'lab-tok' };
      void map;
    }
  }
};
})();
