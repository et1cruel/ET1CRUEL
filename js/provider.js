/* ET1CRUEL Agency OS — Provider Adapter (Phase 5 เริ่มต้น)
 * รองรับ: mock · openrouter (OpenAI-compatible) · gemini
 * กฎเหล็ก: session key อยู่ใน memory เท่านั้น — ห้าม persist ห้าม log ห้ามโชว์ */
(function () {
'use strict';

var CFG_KEY = 'et1cruel.agency.provider';
var USE_KEY = 'et1cruel.agency.usage';
var memKey = ''; // session key — memory only

function cfg() {
  try {
    var c = JSON.parse(localStorage.getItem(CFG_KEY)) || {};
    return { active: c.active || 'mock', model: c.model || 'openrouter/free',
      fallback: c.fallback || '', retries: c.retries != null ? c.retries : 2,
      timeoutMs: c.timeoutMs || 45000 };
  } catch (e) { return { active: 'mock', model: 'openrouter/free', fallback: '', retries: 2, timeoutMs: 45000 }; }
}
function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }
function usage() { try { return JSON.parse(localStorage.getItem(USE_KEY)) || []; } catch (e) { return []; } }
function logUse(u) {
  try {
    var a = usage(); a.unshift(u); if (a.length > 100) a.length = 100;
    localStorage.setItem(USE_KEY, JSON.stringify(a));
  } catch (e) {}
}
function estTokens(s) { return Math.ceil(String(s || '').length / 4); } // ~ประมาณเท่านั้น

/* จำแนก error: อันไหน retry ได้ อันไหนต้องหยุด */
function classify(st, body) {
  if (st === 0) return 'network';
  if (st === 401 || st === 403) return 'auth';
  if (st === 402) return 'billing';
  if (st === 429) return 'quota';
  if (st >= 500) return 'server';
  if (st === 400) return 'bad-request';
  if (st === 404) return 'bad-request';
  if ((body || '').indexOf('insufficient') >= 0) return 'billing';
  return 'unknown';
}
function retryable(cls) { return cls === 'quota' || cls === 'server' || cls === 'network'; }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function withTimeout(p, ms) {
  var ctrl = new AbortController();
  var h = setTimeout(function () { ctrl.abort(); }, ms);
  try { return await p(ctrl.signal); }
  finally { clearTimeout(h); }
}

async function callOpenRouter(model, sys, user, maxTokens, signal) {
  var r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', signal: signal,
    headers: { 'Authorization': 'Bearer ' + memKey, 'Content-Type': 'application/json',
      'HTTP-Referer': 'https://et1cruel.github.io/ET1CRUEL/agency.html', 'X-Title': 'ET1CRUEL Agency OS' },
    body: JSON.stringify({ model: model, messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], max_tokens: maxTokens })
  });
  var retryAfter = r.headers ? r.headers.get('retry-after') : null;
  var j = await r.json().catch(function () { return {}; });
  if (!r.ok) return { ok: false, status: r.status, retryAfter: retryAfter, error: ((j.error || {}).message || r.statusText || ('HTTP ' + r.status)).slice(0, 220) };
  var m = (((j.choices || [])[0] || {}).message) || {};
  var text = m.content || m.reasoning || '';
  return { ok: true, text: String(text), via: m.content ? 'content' : 'reasoning' };
}

async function callGemini(model, sys, user, maxTokens, signal) {
  var r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'POST', signal: signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': memKey },
    body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] },
      contents: [{ parts: [{ text: user }] }], generationConfig: { maxOutputTokens: maxTokens } })
  });
  var j = await r.json().catch(function () { return {}; });
  if (!r.ok) return { ok: false, status: r.status, error: (((j.error || {}).message) || r.statusText || ('HTTP ' + r.status)).slice(0, 220) };
  var parts = ((((j.candidates || [])[0] || {}).content || {}).parts) || [];
  return { ok: true, text: parts.map(function (p) { return p.text || ''; }).join(''), via: 'content' };
}

function driverFor(active) {
  if (active === 'gemini') return callGemini;
  if (active === 'openrouter') return callOpenRouter;
  return null;
}

/* เรียกหลัก: primary → fallback → retry(backoff) → สรุปผล + usage log */
async function call(opts) {
  var c = cfg(), sys = opts.system || '', user = opts.user || '', maxTokens = opts.maxTokens || 600;
  if (c.active === 'mock' || !driverFor(c.active)) {
    await sleep(300);
    return { ok: true, text: '[MOCK] ร่างคำตอบสำหรับ: ' + user.slice(0, 120) + '… (ต่อ provider จริงใน Settings)', model: 'mock', ms: 300, mocked: true };
  }
  if (!memKey) return { ok: false, cls: 'auth', error: 'ยังไม่มี session key — ใส่ key ใน Settings (อยู่แค่ใน memory)', model: c.model };
  var models = [c.model].concat(c.fallback ? [c.fallback] : []);
  var last = null;
  for (var mi = 0; mi < models.length; mi++) {
    var tries = Math.max(0, Math.min(4, c.retries)) + 1;
    for (var a = 0; a < tries; a++) {
      var t0 = Date.now(), res;
      try {
        res = await withTimeout(function (sig) { return driverFor(c.active)(models[mi], sys, user, maxTokens, sig); }, c.timeoutMs);
      } catch (e) {
        res = { ok: false, status: 0, error: (e && e.name === 'AbortError') ? 'timeout เกิน ' + c.timeoutMs + 'ms' : String((e && e.message) || e).slice(0, 160) };
      }
      var ms = Date.now() - t0;
      if (res.ok) {
        logUse({ ts: new Date().toISOString(), provider: c.active, model: models[mi], ok: true, ms: ms, inEst: estTokens(sys + user), outEst: estTokens(res.text) });
        return { ok: true, text: res.text, model: models[mi], ms: ms, via: res.via };
      }
      var cls = classify(res.status || 0, res.error);
      last = { cls: cls, error: res.error, model: models[mi], status: res.status };
      logUse({ ts: new Date().toISOString(), provider: c.active, model: models[mi], ok: false, ms: ms, err: cls });
      if (!retryable(cls)) break; // auth/billing/bad-request: หยุดทันที ไม่ retry
      var wait = 1000 * Math.pow(2, a);
      if (res.retryAfter) wait = Math.min(30000, (parseFloat(res.retryAfter) || 1) * 1000);
      await sleep(wait);
    }
  }
  return { ok: false, cls: last.cls, error: last.error, model: last.model, status: last.status };
}

async function test() {
  var r = await call({ system: 'Reply with exactly: OK', user: 'Reply with exactly: OK', maxTokens: 16 });
  return r;
}
/* แชทแบบมี tools (OpenAI-compatible tool_calls) — ใช้โดย chat.js */
async function chatWithTools(model, messages, tools, maxTokens) {
  var c = cfg();
  if (!memKey) return { ok: false, cls: 'auth', error: 'ยังไม่มี session key — ใส่ในแชทหรือ Settings' };
  if (c.active === 'gemini') return { ok: false, cls: 'bad-request', error: 'gemini ยังไม่รองรับ tools ในแชท — ใช้ openrouter หรือ mock' };
  if (c.active === 'mock' || !memKey) {
    await sleep(300);
    return { ok: true, mocked: true, model: 'mock', ms: 300,
      message: { content: '[MOCK] เปิด provider จริง (openrouter) แล้วคุยใหม่ — ตอนนี้ตอบแบบจำลอง\nคำสั่งที่ใช้ได้: /task /project /help', tool_calls: [] } };
  }
  var tries = Math.max(0, Math.min(4, c.retries)) + 1, last = null;
  for (var a = 0; a < tries; a++) {
    var t0 = Date.now(), res;
    try {
      res = await withTimeout(function (sig) {
        return fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: sig,
          headers: { 'Authorization': 'Bearer ' + memKey, 'Content-Type': 'application/json',
            'HTTP-Referer': 'https://et1cruel.github.io/ET1CRUEL/agency.html', 'X-Title': 'ET1CRUEL Agency OS' },
          body: JSON.stringify({ model: model, messages: messages, tools: tools, max_tokens: maxTokens }) })
          .then(async function (r) {
            var j = await r.json().catch(function () { return {}; });
            if (!r.ok) return { ok: false, status: r.status, retryAfter: r.headers ? r.headers.get('retry-after') : null, error: (((j.error || {}).message) || r.statusText || ('HTTP ' + r.status)).slice(0, 220) };
            var m = (((j.choices || [])[0] || {}).message) || {};
            return { ok: true, message: { content: m.content || '', tool_calls: m.tool_calls || [] } };
          });
      }, c.timeoutMs);
    } catch (e) {
      res = { ok: false, status: 0, error: (e && e.name === 'AbortError') ? 'timeout' : String((e && e.message) || e).slice(0, 160) };
    }
    var ms = Date.now() - t0;
    if (res.ok) {
      logUse({ ts: new Date().toISOString(), provider: c.active, model: model, ok: true, ms: ms, inEst: estTokens(JSON.stringify(messages)), outEst: estTokens(res.message.content) });
      res.message.tool_calls = res.message.tool_calls || [];
      return { ok: true, message: res.message, model: model, ms: ms };
    }
    var cls = classify(res.status || 0, res.error);
    last = { cls: cls, error: res.error, status: res.status };
    logUse({ ts: new Date().toISOString(), provider: c.active, model: model, ok: false, ms: ms, err: cls });
    if (!retryable(cls)) break;
    var wait = 1000 * Math.pow(2, a);
    if (res.retryAfter) wait = Math.min(30000, (parseFloat(res.retryAfter) || 1) * 1000);
    await sleep(wait);
  }
  return { ok: false, cls: last.cls, error: last.error, status: last.status };
}
async function quota() {
  var c = cfg();
  if (c.active !== 'openrouter') return { ok: false, error: 'เช็กโควต้าอัตโนมัติได้เฉพาะ openrouter (gemini ดูใน AI Studio)' };
  if (!memKey) return { ok: false, error: 'ไม่มี session key' };
  try {
    var r = await fetch('https://openrouter.ai/api/v1/key', { headers: { 'Authorization': 'Bearer ' + memKey } });
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) return { ok: false, error: 'HTTP ' + r.status };
    var d = j.data || {}, f = d.free_model_daily_requests || {};
    return { ok: true, text: 'free-model ใช้ไป ' + (f.used != null ? f.used : (d.usage != null ? d.usage : '?')) + ' / ceiling ' + (f.limit != null ? f.limit : (d.limit != null ? d.limit : '?')) + ' ต่อวัน' };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 120) }; }
}

window.Provider = { call: call, test: test, quota: quota, chat: chatWithTools, cfg: cfg, saveCfg: saveCfg, usage: usage,
  classify: classify, setKey: function (k) { memKey = String(k || ''); },
  clearKey: function () { memKey = ''; }, hasKey: function () { return !!memKey; } };
})();
