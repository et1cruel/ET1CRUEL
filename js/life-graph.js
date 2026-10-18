/* ET1CRUEL LIFE GRAPH — V2.
 * ครึ่งบน = ตรรกะบริสุทธิ์ที่ทดสอบได้ใน node (window.ET1LIFE_CORE) ไม่แตะ DOM/localStorage
 * ครึ่งล่าง = ชั้น DOM ที่ทำงานเฉพาะเมื่อมี #life-graph ในหน้าเว็บ
 * กฎของไฟล์นี้: ห้ามลบ/ทับข้อมูลที่ผู้ใช้สร้างหรือแก้ (createdAt != null หรือ userEdited === true)
 * ห้ามเดาปี ห้ามแต่งเหตุการณ์ และห้ามใช้คะแนนชีวิตแทนข้อมูลจริง */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  window.__lifeGraphLoadCount = (window.__lifeGraphLoadCount || 0) + 1;

  var KEY_V2 = 'et1cruel.life-graph.v2';
  var KEY_V1 = 'et1cruel.life-graph.v1';
  var KEY_V1_FOCUS = 'et1cruel.life-graph.v1.focus';

  var FALLBACK_CATS = ['Personal', 'Football', 'Music', 'Education', 'Work', 'Finance', 'Technology', 'Coding', 'AI', 'Robotics', 'Content Creation', 'Business', 'Personal Growth', 'Future Goals'];
  var FALLBACK_CH = ['childhood', 'football', 'music-origin', 'learning-struggle', 'education', 'work', 'music-production', 'coding-software', 'ai-automation', 'robotics', 'current-life', 'future-goals'];
  var PREC = ['exact_date', 'exact_month', 'exact_year', 'exact_range', 'estimated_year', 'estimated_range', 'school_period', 'age_based', 'unknown'];
  var DST = ['confirmed', 'estimated', 'needs_confirmation', 'unknown'];
  var DSRC = ['user_reported', 'project_record', 'imported_record', 'derived_estimate'];
  var TYPES = ['milestone', 'chapter', 'goal'];
  var STATUSES = ['verified', 'user-reported', 'planned', 'exploring', 'in-progress', 'completed'];

  var MODEL = ['id', 'title', 'description', 'category', 'chapterId', 'type', 'status', 'importance', 'startDate', 'endDate', 'startYearCE', 'endYearCE', 'startMonthCE', 'endMonthCE', 'datePrecision', 'dateStatus', 'dateSource', 'sourceReference', 'conflictNote', 'narrativeLevel', 'selfAssessmentScore', 'isCurrent', 'isFuture', 'isAnchor', 'relatedProjectIds', 'relatedSkills', 'whatChanged', 'reflection', 'tags', 'notes', 'userEdited', 'createdAt', 'updatedAt', 'legacy', 'legacyScale', 'migratedFrom', 'deletedSeedIds'];

  /* Mode A: ตำแหน่งแนวตั้งเชิงการจัดวาง ไม่ใช่คะแนนชีวิต (ตรึงค่าไว้ให้ตรวจสอบได้) */
  var CH_BASE = { childhood: 0.18, football: 0.26, 'music-origin': 0.40, 'learning-struggle': 0.34, education: 0.44, work: 0.50, 'music-production': 0.58, 'coding-software': 0.66, 'ai-automation': 0.74, robotics: 0.82, 'current-life': 0.72, 'future-goals': 0.88 };
  var THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function str(v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); }
  function numOrNull(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function isoDate(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; }
  function data() { return (window.ET1LIFE_DATA && typeof window.ET1LIFE_DATA === 'object') ? window.ET1LIFE_DATA : {}; }
  function cats() { var d = data(); return Array.isArray(d.categories) && d.categories.length ? d.categories : FALLBACK_CATS; }
  function chIds() {
    var d = data();
    return Array.isArray(d.chapters) && d.chapters.length ? d.chapters.map(function (c) { return c.id; }) : FALLBACK_CH;
  }
  function yearRange() {
    var r = data().yearRange;
    return Array.isArray(r) && r.length === 2 ? r : [2004, 2026];
  }

  /* ปีปัจจุบันต้องอยู่ในตรรกะบริสุทธิ์ เพราะ graphLayout ใช้ตัดสินว่าป้ายควรอยู่บนหรือล่างจุด
   * (เดิม NOW_YEAR ประกาศอยู่ในชั้น DOM ทำให้ node มองไม่เห็น แล้ว node กับเบราว์เซอร์คำนวณคนละแบบ) */
  function nowYearCE() {
    var n = Number(data().nowYearCE);
    return isFinite(n) && n > 1900 ? n : new Date().getFullYear();
  }

  /* ความกว้างกล่องป้ายชื่อ ใช้ทั้งตอนวางป้ายและตอนตรวจว่าป้ายทับกัน
   * 7 หน่วย/ตัวอักษรคือค่าที่วัดจากการเรนเดอร์จริง (ป้าย 30 ตัวอักษรกว้างราว 200 หน่วยในกราฟ)
   * ถ้าใช้ค่าคงที่แคบกว่านี้ ป้ายที่ห่างกัน 140px จะยังทับกันจริงบนจอ */
  function labelBoxWidth(text) {
    return clamp(String(text == null ? '' : text).length * 7, 48, 210);
  }

  function validRecord(r) {
    return !!r && typeof r === 'object' && typeof r.id === 'string' && r.id.trim() !== '' && typeof r.title === 'string' && r.title.trim() !== '';
  }

  /* เติมคีย์ที่ขาด + บังคับค่า enum ที่ผิดให้เป็นค่าปลอดภัย โดยเก็บค่าดั้งเดิมไว้ใน legacy เสมอ */
  function normalizeRecord(raw) {
    var r = (raw && typeof raw === 'object') ? raw : {};
    var defaults = {
      id: '', title: '', description: '', category: 'Personal', chapterId: '', type: 'milestone', status: 'user-reported',
      importance: 2, startDate: null, endDate: null, startYearCE: null, endYearCE: null, startMonthCE: null, endMonthCE: null,
      datePrecision: 'unknown', dateStatus: 'unknown', dateSource: 'user_reported', sourceReference: null, conflictNote: null,
      narrativeLevel: null, selfAssessmentScore: null, isCurrent: false, isFuture: false, isAnchor: false,
      relatedProjectIds: [], relatedSkills: [], whatChanged: '', reflection: '', tags: [], notes: '',
      userEdited: false, createdAt: null, updatedAt: null
    };
    var out = {}, legacy = {}, k;
    for (k in r) {
      if (!has(r, k)) continue;
      if (r[k] === undefined) continue;
      if (MODEL.indexOf(k) >= 0) { out[k] = r[k]; continue; }
      out[k] = r[k];        // คีย์ที่ไม่รู้จัก: เก็บไว้ที่เดิม
      legacy[k] = r[k];     // และบันทึกสำเนาไว้ว่ามาจากไหน
    }
    for (k in defaults) if (!has(out, k)) out[k] = defaults[k];
    if (out.legacy && typeof out.legacy === 'object') for (k in out.legacy) if (has(out.legacy, k) && !has(legacy, k)) legacy[k] = out.legacy[k];

    out.id = str(out.id);
    out.title = str(out.title);
    out.description = str(out.description);
    out.whatChanged = str(out.whatChanged);
    out.reflection = str(out.reflection);
    out.notes = str(out.notes);
    out.sourceReference = out.sourceReference == null ? null : str(out.sourceReference);
    out.conflictNote = out.conflictNote == null ? null : str(out.conflictNote);

    out.category = str(out.category);
    if (cats().indexOf(out.category) < 0) { if (out.category) legacy.originalCategory = out.category; out.category = 'Personal'; }

    out.chapterId = str(out.chapterId);
    if (out.chapterId && chIds().indexOf(out.chapterId) < 0) { legacy.originalChapterId = out.chapterId; out.chapterId = ''; }

    out.type = TYPES.indexOf(out.type) >= 0 ? out.type : 'milestone';
    out.status = STATUSES.indexOf(out.status) >= 0 ? out.status : 'user-reported';

    var imp = numOrNull(out.importance);
    if (imp === null) imp = 2;
    if (imp < 1 || imp > 3) { legacy.originalImportance = out.importance; imp = clamp(imp, 1, 3); }
    out.importance = Math.round(imp);

    if (PREC.indexOf(out.datePrecision) < 0) { if (out.datePrecision) legacy.originalDatePrecision = out.datePrecision; out.datePrecision = 'unknown'; }
    if (DST.indexOf(out.dateStatus) < 0) { if (out.dateStatus) legacy.originalDateStatus = out.dateStatus; out.dateStatus = 'unknown'; }
    if (DSRC.indexOf(out.dateSource) < 0) { if (out.dateSource) legacy.originalDateSource = out.dateSource; out.dateSource = 'user_reported'; }

    out.startDate = isoDate(out.startDate);
    out.endDate = isoDate(out.endDate);
    out.startYearCE = numOrNull(out.startYearCE);
    out.endYearCE = numOrNull(out.endYearCE);
    out.startMonthCE = numOrNull(out.startMonthCE);
    out.endMonthCE = numOrNull(out.endMonthCE);
    if (out.startYearCE === null && out.startDate) out.startYearCE = Number(out.startDate.slice(0, 4));
    if (out.startMonthCE === null && out.startDate) out.startMonthCE = Number(out.startDate.slice(5, 7));
    if (out.endYearCE === null && out.endDate) out.endYearCE = Number(out.endDate.slice(0, 4));
    if (out.endMonthCE === null && out.endDate) out.endMonthCE = Number(out.endDate.slice(5, 7));
    if (out.startYearCE !== null && (out.startYearCE < 1900 || out.startYearCE > 2200)) { legacy.rejectedStartYearCE = out.startYearCE; out.startYearCE = null; }
    if (out.endYearCE !== null && (out.endYearCE < 1900 || out.endYearCE > 2200)) { legacy.rejectedEndYearCE = out.endYearCE; out.endYearCE = null; }
    if (out.startMonthCE !== null && (out.startMonthCE < 1 || out.startMonthCE > 12)) { legacy.rejectedStartMonthCE = out.startMonthCE; out.startMonthCE = null; }
    if (out.endMonthCE !== null && (out.endMonthCE < 1 || out.endMonthCE > 12)) { legacy.rejectedEndMonthCE = out.endMonthCE; out.endMonthCE = null; }
    if (out.startYearCE !== null && out.endYearCE !== null && out.endYearCE < out.startYearCE) { legacy.rejectedEndYearCE = out.endYearCE; out.endYearCE = null; }

    var nl = numOrNull(out.narrativeLevel);
    if (nl !== null && (nl < 0 || nl > 100)) { legacy.originalNarrativeLevel = nl; nl = clamp(nl, 0, 100); }
    out.narrativeLevel = nl;

    var sc = numOrNull(out.selfAssessmentScore);
    out.selfAssessmentScore = sc;
    if (sc !== null && (sc < 1 || sc > 10)) out.legacyScale = true;   // ห้ามแปลงเงียบ
    if (sc !== null && (sc < 1 || sc > 10)) legacy.offScaleScore = sc;

    out.isCurrent = !!out.isCurrent;
    out.isFuture = !!out.isFuture;
    out.isAnchor = !!out.isAnchor;
    out.userEdited = !!out.userEdited;
    out.legacyScale = !!out.legacyScale;
    out.migratedFrom = out.migratedFrom == null ? null : str(out.migratedFrom);
    out.createdAt = out.createdAt == null ? null : str(out.createdAt);
    out.updatedAt = out.updatedAt == null ? null : str(out.updatedAt);

    out.tags = toList(out.tags);
    out.relatedSkills = toList(out.relatedSkills);
    out.relatedProjectIds = toList(out.relatedProjectIds);
    if (has(out, 'deletedSeedIds')) out.deletedSeedIds = toList(out.deletedSeedIds);

    var lk = Object.keys(legacy);
    if (lk.length) { out.legacy = legacy; }
    else if (!out.legacy || typeof out.legacy !== 'object') delete out.legacy;
    return out;
  }

  function toList(v) {
    if (Array.isArray(v)) return v.filter(function (x) { return x !== null && x !== undefined && x !== ''; }).map(str);
    if (typeof v === 'string') return v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    return [];
  }

  function v1Category(c) {
    var d = data(), s = str(c);
    if (!s) return 'Personal';
    if (cats().indexOf(s) >= 0) return s;
    var m = d.v1CategoryMap || {};
    return m[s] || 'Personal';
  }
  function v1Chapter(c) {
    var d = data(), s = str(c);
    if (!s) return '';
    if (chIds().indexOf(s) >= 0) return s;
    var m = d.v1ChapterMap || {};
    return m[s] || '';
  }

  /* V1 → V2: วันที่แบบ string ถูกตีความเป็นระดับความแม่นยำที่ตรงกับรูปของมันจริง ๆ
   * ห้ามเลื่อนสถานะเป็น "ยืนยันแล้ว" เอง ถ้าเดิมเป็นค่าประมาณ */
  function migrateV1Record(v1) {
    var raw = (v1 && typeof v1 === 'object') ? v1 : {};
    var date = str(raw.date).trim();
    var end = str(raw.endDate).trim();
    var approx = raw.datePrecision === 'approximate';
    var startDate = null, startYearCE = null, startMonthCE = null, endDate = null, endYearCE = null, prec = 'unknown';

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) { startDate = date; startYearCE = Number(date.slice(0, 4)); startMonthCE = Number(date.slice(5, 7)); prec = approx ? 'estimated_year' : 'exact_date'; }
    else if (/^\d{4}-\d{2}$/.test(date)) { startYearCE = Number(date.slice(0, 4)); startMonthCE = Number(date.slice(5, 7)); prec = approx ? 'estimated_year' : 'exact_month'; }
    else if (/^\d{4}$/.test(date)) { startYearCE = Number(date); prec = approx ? 'estimated_year' : 'exact_year'; }
    else if (raw.datePrecision === 'school-stage') prec = 'school_period';
    else if (raw.datePrecision === 'age') prec = 'age_based';

    if (/^\d{4}-\d{2}-\d{2}$/.test(end)) { endDate = end; endYearCE = Number(end.slice(0, 4)); }
    else if (/^\d{4}$/.test(end)) { endYearCE = Number(end); }

    if (approx && endYearCE !== null && startYearCE !== null && endYearCE !== startYearCE) prec = 'estimated_range';
    else if (!approx && endYearCE !== null && startYearCE !== null && endYearCE !== startYearCE && prec === 'exact_year') prec = 'exact_range';

    var tags = toList(raw.tags);
    var d = data();
    var extraTag = (d.v1CategoryTag || {})[str(raw.category)];
    if (extraTag && tags.indexOf(extraTag) < 0) tags.push(extraTag);

    var rec = {
      id: raw.id, title: raw.title, description: raw.description || '',
      category: v1Category(raw.category), chapterId: v1Chapter(raw.chapterId),
      type: TYPES.indexOf(raw.type) >= 0 ? raw.type : 'milestone',
      status: raw.status, importance: raw.importance === undefined ? 2 : raw.importance,
      startDate: startDate, endDate: endDate, startYearCE: startYearCE, endYearCE: endYearCE, startMonthCE: startMonthCE,
      datePrecision: prec,
      dateStatus: startYearCE === null ? 'unknown' : (approx ? 'estimated' : 'confirmed'),
      dateSource: 'user_reported',
      sourceReference: raw.evidenceNote || null,
      narrativeLevel: raw.storyLevel,
      selfAssessmentScore: raw.selfAssessmentScore,
      isFuture: raw.type === 'goal' && startYearCE === null,
      tags: tags, userEdited: raw.userEdited === true,
      createdAt: raw.createdAt || null, updatedAt: raw.updatedAt || null,
      migratedFrom: 'v1',
      legacy: { v1Date: raw.date || null, v1EndDate: raw.endDate || null, v1DatePrecision: raw.datePrecision || null, v1StoryLevel: raw.storyLevel == null ? null : raw.storyLevel }
    };
    return normalizeRecord(rec);
  }

  function tryParse(raw) {
    if (raw == null) return null;
    if (typeof raw === 'object') return raw;
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  /* อ่าน v2 ก่อน → ไม่มีก็ migrate v1 → พังทั้งคู่ก็เริ่มจาก seed โดยไม่เขียนทับอะไร */
  function readState(rawV2, rawV1, dataArg) {
    var D = dataArg || data();
    var seeds = Array.isArray(D.seeds) ? D.seeds : [];
    var records = null, deletedSeedIds = [], meta = { source: 'seed' }, noticeText = null;

    var p2 = tryParse(rawV2);
    if (p2 && Array.isArray(p2.records)) {
      var kept = [], skipped = 0, i;
      for (i = 0; i < p2.records.length; i++) {
        if (validRecord(p2.records[i])) kept.push(normalizeRecord(p2.records[i]));
        else skipped++;
      }
      records = kept;
      deletedSeedIds = Array.isArray(p2.deletedSeedIds) ? p2.deletedSeedIds.filter(function (x) { return typeof x === 'string' && x; }) : [];
      meta = { source: 'v2', skipped: skipped };
      if (skipped) noticeText = 'ข้ามข้อมูลที่รูปทรงไม่ถูกต้อง ' + skipped + ' รายการ (ไม่ได้ลบข้อมูลเดิม)';
    } else {
      var p1 = tryParse(rawV1);
      if (p1 && Array.isArray(p1.records)) {
        var users = [];
        for (var j = 0; j < p1.records.length; j++) {
          var r1 = p1.records[j];
          if (validRecord(r1) && (r1.createdAt != null || r1.userEdited === true)) users.push(r1);
        }
        records = users.map(migrateV1Record);
        var dropped = p1.records.length - users.length;
        meta = { source: 'v1', migrated: records.length, supersededCodeSeeds: dropped };
        noticeText = 'ย้ายข้อมูลจาก v1 แล้ว ' + records.length + ' รายการ' + (dropped ? ' · seed เดิม ' + dropped + ' รายการถูกแทนที่ด้วยชุดข้อมูลใหม่ (ข้อมูลที่คุณสร้างเองไม่ถูกแตะ)' : '');
      }
    }

    if (!records) {
      records = [];
      meta = { source: 'seed' };
      if (rawV2 != null || rawV1 != null) noticeText = 'อ่านข้อมูลเดิมไม่ได้ จึงเริ่มจากชุดข้อมูลตั้งต้น (ไม่มีการเขียนทับข้อมูลเดิม)';
    }

    records = mergeSeeds(records, seeds, deletedSeedIds);
    return { records: records, deletedSeedIds: deletedSeedIds, meta: meta, notice: noticeText };
  }

  /* เพิ่ม seed ที่ยังไม่มี · ไม่แตะ record ที่มีอยู่แล้ว · ข้ามที่ถูกลบ */
  function mergeSeeds(records, seeds, deletedSeedIds) {
    var out = Array.isArray(records) ? records.slice() : [];
    var have = {}, gone = {}, i;
    for (i = 0; i < out.length; i++) if (out[i] && out[i].id) have[out[i].id] = true;
    var del = Array.isArray(deletedSeedIds) ? deletedSeedIds : [];
    for (i = 0; i < del.length; i++) gone[del[i]] = true;
    var list = Array.isArray(seeds) ? seeds : [];
    for (i = 0; i < list.length; i++) {
      var s = list[i];
      if (!validRecord(s) || have[s.id] || gone[s.id]) continue;
      out.push(normalizeRecord(s));
      have[s.id] = true;
    }
    return out;
  }

  function validateImport(text) {
    if (typeof text !== 'string' || !text.trim()) return { ok: false, reason: 'ไฟล์ว่างหรืออ่านไม่ได้' };
    var p;
    try { p = JSON.parse(text); } catch (e) { return { ok: false, reason: 'ไม่ใช่ JSON ที่ถูกต้อง' }; }
    if (!p || typeof p !== 'object' || Array.isArray(p)) return { ok: false, reason: 'โครงสร้างไฟล์ต้องเป็น object' };
    if (!Array.isArray(p.records)) return { ok: false, reason: 'ต้องมีคีย์ "records" เป็น array' };
    if (p.records.length > 5000) return { ok: false, reason: 'ข้อมูลใหญ่เกินไป (' + p.records.length + ' รายการ สูงสุด 5000)' };
    var ids = {};
    for (var i = 0; i < p.records.length; i++) {
      var r = p.records[i];
      if (!r || typeof r !== 'object' || Array.isArray(r)) return { ok: false, reason: 'รายการที่ ' + (i + 1) + ' ไม่ใช่ object' };
      if (typeof r.id !== 'string' || !r.id.trim()) return { ok: false, reason: 'รายการที่ ' + (i + 1) + ' ไม่มี id' };
      if (typeof r.title !== 'string' || !r.title.trim()) return { ok: false, reason: 'รายการที่ ' + (i + 1) + ' ไม่มีชื่อเหตุการณ์' };
      if (ids[r.id]) return { ok: false, reason: 'id ซ้ำในไฟล์: ' + r.id };
      ids[r.id] = true;
    }
    return { ok: true, payload: p };
  }

  function importIntoState(state, payload) {
    var st = state || {};
    var records = Array.isArray(st.records) ? st.records.slice() : [];
    var index = {}, i;
    for (i = 0; i < records.length; i++) index[records[i].id] = i;
    var added = 0, updated = 0, list = (payload && Array.isArray(payload.records)) ? payload.records : [];
    for (i = 0; i < list.length; i++) {
      var rec = normalizeRecord(list[i]);
      rec.userEdited = true;
      if (index[rec.id] !== undefined) { records[index[rec.id]] = rec; updated++; }
      else { index[rec.id] = records.length; records.push(rec); added++; }
    }
    var deleted = Array.isArray(st.deletedSeedIds) ? st.deletedSeedIds.slice() : [];
    if (payload && Array.isArray(payload.deletedSeedIds)) {
      payload.deletedSeedIds.forEach(function (id) { if (typeof id === 'string' && deleted.indexOf(id) < 0) deleted.push(id); });
    }
    var live = {};
    for (i = 0; i < records.length; i++) live[records[i].id] = true;
    deleted = deleted.filter(function (id) { return id && !live[id]; });
    return { state: { records: records, deletedSeedIds: deleted }, added: added, updated: updated };
  }

  function sortChronological(records) {
    var list = Array.isArray(records) ? records.slice() : [];
    return list.sort(function (a, b) {
      var ay = a.startYearCE == null ? Infinity : a.startYearCE;
      var by = b.startYearCE == null ? Infinity : b.startYearCE;
      if (ay !== by) return ay - by;
      var am = a.startMonthCE == null ? 1 : a.startMonthCE;
      var bm = b.startMonthCE == null ? 1 : b.startMonthCE;
      if (am !== bm) return am - bm;
      return str(a.title).localeCompare(str(b.title), 'th');
    });
  }

  /* เหตุการณ์ในปีนั้น รวมเหตุการณ์ที่คร่อมหลายปี และไม่รวมอนาคต */
  function recordsForYear(records, yearCE) {
    var y = Number(yearCE);
    return (Array.isArray(records) ? records : []).filter(function (r) {
      if (!r || r.isFuture || r.startYearCE == null) return false;
      var s = Number(r.startYearCE);
      var e = r.endYearCE == null ? s : Number(r.endYearCE);
      return s <= y && y <= e;
    });
  }
  function undatedRecords(records) {
    return (Array.isArray(records) ? records : []).filter(function (r) { return r && r.startYearCE == null && !r.isFuture; });
  }
  function futureRecords(records) {
    return (Array.isArray(records) ? records : []).filter(function (r) { return r && r.isFuture; });
  }

  function formatYear(y) { var n = Number(y); return (n + 543) + ' (' + n + ')'; }

  function formatDateRange(r) {
    if (!r) return 'ปีไม่ระบุ';
    var p = r.datePrecision, sY = r.startYearCE;
    if (sY == null) {
      if (p === 'school_period') return 'ช่วงระดับชั้น (ปีไม่ระบุ)';
      if (p === 'age_based') return 'ช่วงอายุ (ปีไม่ระบุ)';
      return 'ปีไม่ระบุ';
    }
    var eY = r.endYearCE == null ? sY : r.endYearCE;
    var sM = r.startMonthCE, eM = r.endMonthCE;
    var approx = p === 'estimated_year' || p === 'estimated_range';
    var pre = approx ? 'ประมาณ ' : '';
    var range = eY !== sY;
    if (p === 'exact_date' && r.startDate) {
      var d = Number(r.startDate.slice(8, 10)), m = Number(r.startDate.slice(5, 7));
      var out = d + ' ' + THAI_MONTHS[m - 1] + ' ' + (sY + 543) + ' (' + sY + ')';
      if (r.endDate) {
        var d2 = Number(r.endDate.slice(8, 10)), m2 = Number(r.endDate.slice(5, 7));
        if (r.endYearCE === sY && m2 === m) out += '–' + d2;
        else if (r.endYearCE === sY) out = d + ' ' + THAI_MONTHS[m - 1] + ' – ' + d2 + ' ' + THAI_MONTHS[m2 - 1] + ' ' + (sY + 543) + ' (' + sY + ')';
        else out += ' – ' + d2 + ' ' + THAI_MONTHS[m2 - 1] + ' ' + (r.endYearCE + 543) + ' (' + r.endYearCE + ')';
      }
      return out;
    }
    if (sM != null) {
      var head = pre + THAI_MONTHS[sM - 1];
      if (range && eM != null && eY === sY) return head + '–' + THAI_MONTHS[eM - 1] + ' ' + (sY + 543) + ' (' + sY + ')';
      if (range) return head + ' ' + (sY + 543) + ' (' + sY + ')' + (eM != null ? ' – ' + THAI_MONTHS[eM - 1] + ' ' + (eY + 543) + ' (' + eY + ')' : ' – ' + (eY + 543) + ' (' + eY + ')');
      return head + ' ' + (sY + 543) + ' (' + sY + ')';
    }
    if (range) return pre + (sY + 543) + '–' + (eY + 543) + ' (' + sY + '–' + eY + ')';
    if (p === 'exact_range' && r.endDate) return pre + (sY + 543) + ' (' + sY + ')';
    return pre + (sY + 543) + ' (' + sY + ')';
  }

  function narrativeLevel(r) {
    if (r.narrativeLevel != null) return clamp(Number(r.narrativeLevel) / 100, 0, 1);
    var base = has(CH_BASE, r.chapterId) ? CH_BASE[r.chapterId] : 0.5;
    var imp = Number(r.importance);
    if (!isFinite(imp)) imp = 2;
    return clamp(base + (imp - 2) * 0.02, 0.05, 0.95);
  }
  function hasScore(r) {
    var s = r.selfAssessmentScore;
    return s != null && isFinite(Number(s)) && Number(s) >= 1 && Number(s) <= 10 && !r.legacyScale;
  }
  function scoreLevel(r) { return clamp(Number(r.selfAssessmentScore) / 10, 0, 1); }

  /* กราฟ: ทุก record ต้องถูกนับครั้งเดียว — อยู่บนเส้น, อยู่ที่ Undated, หรือเป็นอนาคต
   * โหมด self วาดเฉพาะจุดที่มีคะแนนจริง และเส้นขาดตรงช่วงที่ไม่มีคะแนน */
  function graphLayout(records, opts) {
    opts = opts || {};
    var mode = opts.mode === 'self' ? 'self' : 'narrative';
    var list = (Array.isArray(records) ? records : []).filter(validRecord);
    var yr = yearRange();
    var minYear = opts.minYear != null ? Number(opts.minYear) : yr[0];
    var maxYear = opts.maxYear != null ? Number(opts.maxYear) : yr[1];
    if (!(maxYear > minYear)) maxYear = minYear + 1;
    /* ขนาดกราฟ: ใหญ่พอให้อ่านได้จริง (เดิม 900×340 ทำให้จุด 2023–2026 อัดกันจนป้ายทับกัน)
     * ค่าขวาเผื่อที่ว่างสำหรับ "คอลัมน์อนาคต" แยกนอกแกนเวลา */
    var width = opts.width || 1280, height = opts.height || 680;
    var left = 70, right = width - 92, top = 46, bottom = height - 88;

    function xFor(y, frac) { return left + ((Number(y) + frac) - minYear) / (maxYear - minYear) * (right - left); }
    function cx(v) { return clamp(v, 0, width); }
    /* จุดเหตุการณ์ต้องอยู่ภายในพล็อต: เหตุการณ์ปลายปี 2569 มี frac เกือบ 1 จึงคำนวณเลยขอบขวาได้
     * ถ้าปล่อยไว้ จุดจะไปทับคอลัมน์เป้าหมายอนาคตที่อยู่นอกพล็อต */
    function plotX(v) { return clamp(v, left, right); }

    var points = [], undated = [], futurePoints = [], i;
    for (i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.isFuture) { futurePoints.push(futurePoint(r)); continue; }
      if (r.startYearCE == null) { undated.push({ id: r.id, record: r }); continue; }
      if (mode === 'self') { if (!hasScore(r)) continue; }
      points.push(makePoint(r));
    }

    function makePoint(r) {
      var frac = 0.5;
      if (r.startDate) frac = ((Number(r.startDate.slice(5, 7)) - 1) + (Number(r.startDate.slice(8, 10)) - 1) / 30) / 12;
      else if (r.startMonthCE != null) frac = (Number(r.startMonthCE) - 1) / 12;
      var x = plotX(xFor(r.startYearCE, frac));
      var lvl = mode === 'self' ? scoreLevel(r) : narrativeLevel(r);
      return {
        id: r.id, x: x, actualX: x, y: bottom - lvl * (bottom - top), level: lvl,
        year: Number(r.startYearCE), endYear: r.endYearCE == null ? null : Number(r.endYearCE),
        spanX: (r.endYearCE != null && Number(r.endYearCE) > Number(r.startYearCE)) ? plotX(xFor(r.endYearCE, 0.5)) : null,
        isCurrent: !!r.isCurrent, hasExactDate: !!r.startDate,
        isRange: r.endYearCE != null && Number(r.endYearCE) > Number(r.startYearCE),
        isEstimated: r.dateStatus === 'estimated' || r.datePrecision === 'estimated_year' || r.datePrecision === 'estimated_range' || r.datePrecision === 'needs_confirmation',
        dateLabel: formatDateRange(r),
        label: r.title, labelSide: 'above', record: r
      };
    }

    function futurePoint(r) {
      var lvl = narrativeLevel(r);
      var yv = bottom - lvl * (bottom - top);
      var x = r.startYearCE == null ? null : plotX(xFor(r.startYearCE, 0.5));
      return { id: r.id, x: x, actualX: x, projected: x == null, y: yv, level: lvl, label: r.title, labelSide: 'above', year: r.startYearCE == null ? null : Number(r.startYearCE), isGoal: r.type === 'goal', dateLabel: formatDateRange(r), record: r };
    }

    /* ── กันจุดทับกัน ────────────────────────────────────────────────────────
     * เหตุการณ์ปีเดียวกัน บทเดียวกัน น้ำหนักเท่ากัน จะได้พิกัดเดียวกันเป๊ะ แล้วมีจุดซ่อนทับกันจริง
     * โหมด A แก้ได้ เพราะ y เป็น "การจัดวางเชิงภาพ ไม่ใช่คะแนนชีวิต" (มี label กำกับใน UI)
     * โหมด B ห้ามแตะเด็ดขาด เพราะ y คือคะแนนที่ผู้ใช้กรอกเอง */
    var dodgedCount = 0;
    /* ระยะห่างขั้นต่ำของจุด: ต้องมากกว่ารัศมีจุด(5) + รัศมีจุดอนาคต(6) + ขอบ จึงจะไม่ดูเป็นจุดเดียวกัน */
    var MIN_MARKER_GAP = 16;
    if (mode === 'narrative') {
      var axisPoints = points.concat(futurePoints.filter(function (f) { return f.actualX != null; }));
      axisPoints.sort(function (a, b) { return a.actualX - b.actualX || a.y - b.y; });
      var columns = [];
      axisPoints.forEach(function (p) {
        var col = columns.length ? columns[columns.length - 1] : null;
        if (!col || p.actualX - col.maxX > MIN_MARKER_GAP) {
          col = { pts: [], maxX: p.actualX };
          columns.push(col);
        }
        col.maxX = Math.max(col.maxX, p.actualX);
        col.pts.push(p);
      });
      columns.forEach(function (col) {
        if (col.pts.length < 2) return;
        var crowded = false;
        for (var a = 0; a < col.pts.length && !crowded; a++) {
          for (var b = a + 1; b < col.pts.length; b++) {
            if (Math.hypot(col.pts[a].actualX - col.pts[b].actualX, col.pts[a].y - col.pts[b].y) < MIN_MARKER_GAP) { crowded = true; break; }
          }
        }
        if (!crowded) return;
        col.pts.sort(function (x1, x2) { return x1.y - x2.y || (x1.id < x2.id ? -1 : 1); });
        var n = col.pts.length;
        var center = col.pts.reduce(function (s, q) { return s + q.y; }, 0) / n;
        var height2 = Math.min(bottom - top, n * MIN_MARKER_GAP);
        var startY = clamp(center - height2 / 2, top, Math.max(top, bottom - height2));
        col.pts.forEach(function (q, idx) {
          q.y = startY + idx * (n === 1 ? 0 : height2 / (n - 1));
          q.dodged = true;
          dodgedCount++;
        });
      });
    }

    /* ── ป้ายชื่อบนกราฟ ─────────────────────────────────────────────────────
     * สเปกข้อ 8/90: เรียงตาม x แล้ว "ข้าม" ป้ายที่กล่องทับกัน + สลับบน/ล่าง + toggle "แสดง label ทั้งหมด"
     * กฎที่ต้องยึด: ป้ายต้องอยู่ติดจุดของตัวเองเสมอ ถ้าที่ข้างจุดไม่พอให้ซ่อนแล้วรายงานจำนวน
     * (เวอร์ชันที่ผลักป้ายไปจนสุดขอบกราฟทำให้เส้นโยงยาวข้ามกราฟทั้งใบ — นั่นคืออาการ "โยงกันมั่ว") */
    points.sort(function (a, b) { return a.actualX - b.actualX || a.y - b.y; });
    var boxes = [], hidden = 0;
    var force = !!opts.forceAllLabels;
    var LABEL_H = 30, LANE_GAP = 30, H_STEP = 40;
    /* ปกติป้ายไม่ถูกดันแนวนอนเลย (leader สั้นติดจุด) — โหมด "แสดงทั้งหมด" ดันได้เพื่อให้ครบทุกป้าย */
    var laneLimit = force ? Math.max(2, Math.floor((height - top - 40) / LANE_GAP)) : 2;
    var hTries = force ? 10 : 0;
    var labelLeftBound = left, labelRightBound = force ? width - 2 : right;   /* ป้ายไม่ล้ำออกไปทับคอลัมน์อนาคต */
    function labelBox(p, side, lane, shift) {
      var w = Math.max(labelBoxWidth(p.label), labelBoxWidth(p.dateLabel));
      var gap = 12 + lane * LANE_GAP;
      var yTop = side === 'above' ? p.y - gap - LABEL_H : p.y + gap;
      yTop = clamp(yTop, 2, Math.max(2, height - LABEL_H - 2));
      var x1 = clamp(p.x - w / 2 + (shift || 0) * H_STEP, labelLeftBound, Math.max(labelLeftBound, labelRightBound - w));
      return { x1: x1, x2: x1 + w, y1: yTop, y2: yTop + LABEL_H, cx: x1 + w / 2, side: side, lane: lane };
    }
    function hits(b) {
      for (var j = 0; j < boxes.length; j++) {
        var o = boxes[j];
        if (!(b.x2 < o.x1 || b.x1 > o.x2 || b.y2 < o.y1 || b.y1 > o.y2)) return true;
      }
      return false;
    }
    for (i = 0; i < points.length; i++) {
      var pt = points[i];
      var sideOrder = pt.year < nowYearCE() ? ['above', 'below'] : ['below', 'above'];
      var chosen = null;
      for (var lane = 0; lane <= laneLimit && !chosen; lane++) {
        for (var sk = 0; sk < 2 && !chosen; sk++) {
          for (var hx = 0; hx <= hTries && !chosen; hx++) {
            var shifts = hx === 0 ? [0] : [hx, -hx];
            for (var hs = 0; hs < shifts.length && !chosen; hs++) {
              var cand = labelBox(pt, sideOrder[sk], lane, shifts[hs]);
              if (!hits(cand)) chosen = cand;
            }
          }
        }
      }
      /* โหมด "แสดงทั้งหมด" สัญญาว่าจะไม่ซ่อนป้าย: ถ้าจริง ๆ แล้วไม่มีที่ว่าง ก็ยังวางให้เห็น (ยอมให้ทับกัน)
       * ดีกว่าซ่อนเงียบ ๆ เพราะผู้ใช้กดปุ่มนี้เพื่อดูให้ครบ */
      if (!chosen && force) chosen = labelBox(pt, 'above', 0, 0);
      if (chosen) {
        pt.labelSide = chosen.side;
        pt.labelLane = chosen.lane;
        pt.labelX = chosen.cx;
        pt.labelY = chosen.side === 'above' ? chosen.y2 : chosen.y1;
        boxes.push(chosen);
      } else {
        pt.labelSide = 'hidden';
        hidden++;
      }
    }

    var segments = [];
    if (mode === 'narrative') {
      /* หนึ่งจุดแทนหนึ่งปี: เลือก milestone เด่นสุดของปีนั้น เส้นจะได้ไม่ลนลานไปมาอยู่ในปีเดียว
       * ทุก record ยังมีจุดของตัวเองครบ — เฉพาะ "เส้น" ที่ใช้ปีละหนึ่งจุด */
      var byNarrativeYear = {};
      points.forEach(function (q) { (byNarrativeYear[q.year] = byNarrativeYear[q.year] || []).push(q); });
      var narrativeYears = Object.keys(byNarrativeYear).map(Number).sort(function (a2, b3) { return a2 - b3; });
      var yearlyPoints = narrativeYears.map(function (y) {
        return byNarrativeYear[y].slice().sort(function (a2, b3) {
          if (!!a2.isCurrent !== !!b3.isCurrent) return a2.isCurrent ? -1 : 1;
          if (Number(a2.record.importance) !== Number(b3.record.importance)) return Number(b3.record.importance) - Number(a2.record.importance);
          return a2.actualX - b3.actualX;
        })[0];
      });
      /* โหมด A ลากเส้นเดียวต่อเนื่องจากปีแรกถึงปีสุดท้าย "ข้าม" ปีที่ไม่มีบันทึกด้วย
       * (ผู้ใช้ทักว่า ค.ศ. 2004–2021 ไม่มีเส้นเลย เพราะเดิมตัดเส้นทุกครั้งที่เจอปีว่าง)
       * y ในโหมด A เป็นการจัดวางเชิงภาพ ไม่ใช่คะแนน จึงไม่มีอะไรถูกแต่งขึ้นเมื่อลากผ่านปีว่าง —
       * ต่างจากโอมด B ที่ y คือคะแนนจริง ช่องว่างจึงยังต้องตัดเส้น (ดู test "must break the line")
       * สิ่งที่ห้ามคือการ "แต่งจุดปลอม" ของปีที่ไม่มีบันทึก จุดบนเส้นมีแค่ปีที่มี record จริง */
      if (yearlyPoints.length > 1) segments.push(yearlyPoints.map(function (q) { return q.id; }));
    } else {
      var byYear = {};
      points.forEach(function (q) { (byYear[q.year] = byYear[q.year] || []).push(q.id); });
      var ys = Object.keys(byYear).map(Number).sort(function (a2, b3) { return a2 - b3; });
      var cur = null, prev = null;
      ys.forEach(function (y) {
        if (prev !== null && y === prev + 1) cur = cur.concat(byYear[y]);
        else { if (cur) segments.push(cur); cur = byYear[y].slice(); }
        prev = y;
      });
      if (cur) segments.push(cur);
    }

    /* ── เป้าหมายอนาคตที่ยังไม่กำหนดปี ──────────────────────────────────────
     * ต้องไม่ถูกวาดลงบนแกนเวลา (กฎ "ห้ามเดาปี") จึงวางเป็นคอลัมน์แยกนอกพล็อตทางขวา
     * และลากเส้นประเส้นเดียวจาก "จุดปัจจุบัน" ไปหาคอลัมน์ แทนการลากเส้นจากทุกเป้าหมาย
     * (เดิมลาก 9 เส้นจากจุดขวาสุด ทำให้เส้นพาดผ่านจุดจริงทั้งก้อน) */
    var projected = futurePoints.filter(function (f) { return f.projected; });
    var futureColumn = null;
    if (projected.length) {
      projected.sort(function (a, b) { return b.level - a.level || (a.id < b.id ? -1 : 1); });
      /* คอลัมน์ต้องอยู่ขวาของเส้นปีสุดท้ายจริง ๆ ไม่ใช่แค่ขวาของขอบพล็อต (ป้ายปี 2026 อยู่นอกขอบขวาอยู่แล้ว) */
      var colX = Math.min(width - 14, Math.max(right + 30, xFor(maxYear, 0.5) + 22));
      var nF = projected.length;
      /* เว้นช่องพอให้อ่านเป็น "รายการ" ไม่ใช่โซ่จุดติดกัน — แต่ไม่เกินความสูงของพล็อต */
      var GOAL_ROW = 34;
      var colSpan = Math.min(bottom - top - 24, Math.max(GOAL_ROW * (nF - 1), 40));
      var colTop = clamp((top + bottom) / 2 - colSpan / 2, top + 8, Math.max(top + 8, bottom - colSpan - 8));
      projected.forEach(function (f, idx) {
        f.x = colX;
        f.y = nF === 1 ? top + (bottom - top) / 2 : colTop + idx * (colSpan / (nF - 1));
        f.columnIndex = idx;
      });
      futureColumn = { x: colX, top: projected[0].y, bottom: projected[nF - 1].y, count: nF };
    }
    var futureAnchor = null;
    if (futurePoints.length) {
      var anchorPt = null;
      for (i = 0; i < points.length; i++) { if (points[i].isCurrent) { anchorPt = points[i]; break; } }
      if (!anchorPt && points.length) anchorPt = points[points.length - 1];
      if (anchorPt) futureAnchor = { id: anchorPt.id, x: anchorPt.actualX, y: anchorPt.y, isCurrent: !!anchorPt.isCurrent };
    }

    var years = [], span = maxYear - minYear;
    var step = span <= 6 ? 1 : (span <= 12 ? 2 : (span <= 24 ? 4 : 5));
    function tickW(y) { return String(formatYear(y)).length * 7; } /* ประมาณความกว้างป้ายปี (หน่วยเดียวกับ viewBox) */
    for (var t = minYear; t <= maxYear; t += step) years.push({ x: cx(xFor(t, 0.5)), year: t, label: formatYear(t) });
    /* ป้ายปีปัจจุบันสำคัญที่สุด: ถ้าใส่แล้วทับป้ายก่อนหน้า ให้ตัดป้ายก่อนหน้าออกแทนการทับกัน */
    if (years.length && years[years.length - 1].year !== maxYear) {
      var lastX = cx(xFor(maxYear, 0.5));
      var prevTick = years[years.length - 1];
      if (lastX - prevTick.x < (tickW(maxYear) + tickW(prevTick.year)) / 2) years.pop();
      years.push({ x: lastX, year: maxYear, label: formatYear(maxYear) });
    }
    /* ป้ายริมกราฟ: เลื่อนจุดยึดข้อความไม่ให้ถูกขอบ SVG ตัด */
    years.forEach(function (tk) {
      var w = tickW(tk.year);
      if (tk.x + w / 2 > width) tk.anchor = 'end';
      else if (tk.x - w / 2 < 0) tk.anchor = 'start';
      else tk.anchor = 'middle';
    });

    return {
      mode: mode, points: points, segments: segments, undated: undated, futurePoints: futurePoints,
      years: years, width: width, height: height, hiddenLabelCount: hidden,
      futureAnchor: futureAnchor, futureColumn: futureColumn, dodgedCount: dodgedCount,
      hasScores: list.some(hasScore),
      bounds: { left: left, right: right, top: top, bottom: bottom, minYear: minYear, maxYear: maxYear },
      yAxisNote: mode === 'self'
        ? 'คะแนนประเมินตนเอง 1–10 ที่คุณกรอกเอง — เส้นขาดตรงปีที่ยังไม่มีคะแนน'
        : 'ตำแหน่งแนวตั้งเป็นการจัดวางเชิงภาพ ไม่ใช่คะแนนชีวิตที่วัดจริง',
      xAxisNote: 'เวลา · พ.ศ. (ค.ศ.)'
    };
  }

  /* localStorage ถูกแตะเฉพาะสองฟังก์ชันนี้ และห่อ try/catch เสมอ
   * ถ้าเบราว์เซอร์ปิดที่จัดเก็บไว้ ให้คืนเหตุผลแทนการโยน error เงียบ ๆ */
  function saveState(state) {
    try {
      if (typeof localStorage === 'undefined') return { ok: false, reason: 'no-storage' };
      var payload = {
        version: 2,
        savedAt: new Date().toISOString(),
        records: (state && Array.isArray(state.records)) ? state.records : [],
        deletedSeedIds: (state && Array.isArray(state.deletedSeedIds)) ? state.deletedSeedIds : [],
        meta: (state && state.meta) ? state.meta : {}
      };
      localStorage.setItem(KEY_V2, JSON.stringify(payload));
      return { ok: true, bytes: JSON.stringify(payload).length };
    } catch (e) {
      return { ok: false, reason: String((e && e.message) || e) };
    }
  }
  function loadState() {
    try {
      if (typeof localStorage === 'undefined') return { v2: null, v1: null };
      var v2 = localStorage.getItem(KEY_V2);
      return { v2: v2, v1: v2 == null ? localStorage.getItem(KEY_V1) : localStorage.getItem(KEY_V1) };
    } catch (e) {
      return { v2: null, v1: null, error: String((e && e.message) || e) };
    }
  }

  window.ET1LIFE_CORE = {
    KEY_V2: KEY_V2, KEY_V1: KEY_V1, KEY_V1_FOCUS: KEY_V1_FOCUS,
    CH_BASE: CH_BASE, THAI_MONTHS: THAI_MONTHS,
    validRecord: validRecord, normalizeRecord: normalizeRecord,
    v1Category: v1Category, v1Chapter: v1Chapter, migrateV1Record: migrateV1Record,
    readState: readState, mergeSeeds: mergeSeeds,
    validateImport: validateImport, importIntoState: importIntoState,
    sortChronological: sortChronological, recordsForYear: recordsForYear,
    undatedRecords: undatedRecords, futureRecords: futureRecords,
    formatYear: formatYear, formatDateRange: formatDateRange,
    narrativeLevel: narrativeLevel, hasScore: hasScore, labelBoxWidth: labelBoxWidth, nowYearCE: nowYearCE,
    graphLayout: graphLayout,
    saveState: saveState, loadState: loadState
  };

  if (typeof document === 'undefined') return;

  /* ─────────────────────────── ชั้น DOM ─────────────────────────── */
  var root = document.getElementById('life-graph');
  if (!root) return;

  var C = window.ET1LIFE_CORE;
  var D = (window.ET1LIFE_DATA && typeof window.ET1LIFE_DATA === 'object') ? window.ET1LIFE_DATA : {};
  var CATS = Array.isArray(D.categories) ? D.categories : [];
  var CATNAMES = (D.categoryNames && typeof D.categoryNames === 'object') ? D.categoryNames : {};
  var CHS = Array.isArray(D.chapters) ? D.chapters : [];
  var YEARS = (Array.isArray(D.yearRange) && D.yearRange.length === 2) ? D.yearRange : [2004, 2026];
  var CHILDHOOD = (Array.isArray(D.childhoodRange) && D.childhoodRange.length === 2) ? D.childhoodRange : [2004, 2017];
  var NOW_YEAR = nowYearCE();   /* ปีปัจจุบันนิยามในตรรกะบริสุทธิ์ (core) ที่เดียว เพื่อให้ node กับเบราว์เซอร์ตรงกัน */
  var NOT_RECORDED = 'ยังไม่ได้บันทึก';

  var PREC_LABEL = {
    exact_date: 'วัน/เดือน/ปี (แน่นอน)', exact_month: 'เดือน (แน่นอน)', exact_year: 'ปี (แน่นอน)', exact_range: 'ช่วงปี (แน่นอน)',
    estimated_year: 'ปี (ประมาณ)', estimated_range: 'ช่วงปี (ประมาณ)', school_period: 'ช่วงระดับชั้น / ปีการศึกษา',
    age_based: 'ช่วงอายุ', unknown: 'ปีไม่ระบุ'
  };
  var DST_LABEL = { confirmed: 'ยืนยันแล้ว', estimated: 'ประมาณการ', needs_confirmation: 'ต้องยืนยัน', unknown: 'ยังไม่ทราบ' };
  var DSRC_LABEL = { user_reported: 'ผู้ใช้เล่าเอง', project_record: 'บันทึกในโปรเจกต์', imported_record: 'นำเข้า', derived_estimate: 'คำนวณจากข้อมูลอื่น' };

  var state = {
    records: [], deletedSeedIds: [], meta: {},
    view: 'timeline', mode: 'narrative', year: 'all', category: 'all', query: '', selected: null, labels: false
  };
  var noticeTimer = null;

  function byId(id) { return document.getElementById(id); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function chapterOf(id) { for (var i = 0; i < CHS.length; i++) if (CHS[i].id === id) return CHS[i]; return null; }
  function chapterLabel(id) { var c = chapterOf(id); return c ? (c.titleTh + ' · ' + c.title) : 'ไม่ระบุบท'; }
  function catLabel(c) { return CATNAMES[c] ? (CATNAMES[c] + ' · ' + c) : String(c || 'ไม่ระบุหมวด'); }
  function isSeedId(id) { return (D.seeds || []).some(function (s) { return s.id === id; }); }
  function nowIso() { return new Date().toISOString(); }

  function notice(text) {
    var el = byId('lg-notice');
    if (!el) return;
    el.textContent = text;
    el.hidden = false;
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { el.hidden = true; }, 9000);
  }

  function save(msg) {
    var res = C.saveState({ records: state.records, deletedSeedIds: state.deletedSeedIds, meta: state.meta });
    if (!res.ok) {
      notice('บันทึกลงเครื่องไม่สำเร็จ (' + res.reason + ') — บันทึกยังอยู่แต่จะหายเมื่อปิดแท็บ แนะนำให้กด "ส่งออก JSON" เก็บไว้');
    } else if (msg) notice(msg);
    return res.ok;
  }

  /* ── โหลด: v2 → migrate v1 → seed (ไม่เขียนทับเมื่ออ่านไม่ได้) ── */
  var firstVisit = false;
  function load() {
    var ls = { v2: null, v1: null };
    try { ls = C.loadState(); } catch (e) { /* ที่จัดเก็บถูกปิด: ใช้ seed ต่อไป */ }
    firstVisit = !ls.v2 && !ls.v1;
    var st = C.readState(ls.v2, ls.v1, D);
    state.records = st.records;
    state.deletedSeedIds = st.deletedSeedIds;
    state.meta = st.meta;
    if (st.meta.source === 'v1') save(st.notice || 'ย้ายข้อมูลจาก v1 แล้ว');
    else if (st.notice) notice(st.notice);
  }

  function filtered() {
    var q = String(state.query || '').trim().toLowerCase();
    return state.records.filter(function (r) {
      if (state.category !== 'all' && r.category !== state.category) return false;
      if (!q) return true;
      var hay = [r.title, r.description, r.whatChanged, r.reflection, r.notes, r.sourceReference, r.conflictNote,
        (r.tags || []).join(' '), (r.relatedSkills || []).join(' '), (r.relatedProjectIds || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function yearRecords(list, y) {
    return list.filter(function (r) {
      if (r.isFuture || r.startYearCE == null) return false;
      var s = Number(r.startYearCE);
      var e = r.endYearCE == null ? s : Number(r.endYearCE);
      return s <= y && y <= e;
    }).sort(function (a, b) {
      var am = a.startMonthCE == null ? 1 : Number(a.startMonthCE);
      var bm = b.startMonthCE == null ? 1 : Number(b.startMonthCE);
      return am - bm;
    });
  }
  function timelineYears(list) {
    var out = [];
    for (var y = YEARS[0]; y <= YEARS[1]; y++) {
      var recs = yearRecords(list, y);
      if (recs.length) out.push({ year: y, records: recs });
    }
    return out;
  }
  function emptyYearText(y) {
    if (y >= CHILDHOOD[0] && y <= CHILDHOOD[1]) return 'ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้ — ช่วงวัยเด็ก';
    return 'ไม่มีเหตุการณ์ที่บันทึกไว้ในปีนี้';
  }

  /* ── การ์ดเหตุการณ์ ── */
  function card(r, carriedFrom) {
    var meta = esc(C.formatDateRange(r)) + ' · ' + esc(catLabel(r.category)) + ' · ' + esc(chapterLabel(r.chapterId));
    var badges = '';
    if (carriedFrom != null) badges += ' <span class="lg-carried">ต่อเนื่องจาก ' + esc(C.formatYear(carriedFrom)) + '</span>';
    if (r.isCurrent) badges += ' <span class="lg-badge lg-badge-current">ปัจจุบัน</span>';
    if (r.isFuture) badges += ' <span class="lg-badge lg-badge-future">อนาคต — ยังไม่เกิดขึ้น</span>';
    if (r.conflictNote) badges += ' <span class="lg-badge lg-badge-warn">ต้องยืนยัน</span>';
    if (r.dateStatus === 'estimated' || r.datePrecision === 'estimated_year' || r.datePrecision === 'estimated_range') badges += ' <span class="lg-badge lg-badge-est">โดยประมาณ</span>';
    return '<article class="lg-event' + (carriedFrom != null ? ' lg-event-carried' : '') + '" data-id="' + esc(r.id) + '">' +
      '<div class="lg-event-copy">' +
      '<button type="button" class="lg-event-open" data-open="' + esc(r.id) + '">' + esc(r.title) + '</button>' +
      '<p>' + (r.description ? esc(r.description) : '<span class="lg-unrecorded">' + NOT_RECORDED + '</span>') + '</p>' +
      '<p class="lg-event-meta"><span class="lg-meta-text">' + meta + '</span>' + badges + '</p>' +
      '<div class="lg-actions"><button type="button" class="lg-btn" data-open="' + esc(r.id) + '">รายละเอียด</button></div>' +
      '</div></article>';
  }

  function undatedSection(list) {
    return '<section class="lg-undated"><h3>ปีไม่ระบุ · Undated Milestones <span class="lg-undated-count">(' + list.length + ')</span></h3>' +
      '<p class="lg-graph-note">เหตุการณ์กลุ่มนี้ยังไม่มีปีที่ยืนยันได้ จึงไม่ถูกวางบนแกนเวลา และระบบไม่เดาปีให้ — เปิดดูรายละเอียดได้เหมือนเหตุการณ์อื่น</p>' +
      '<div class="lg-undated-grid">' + list.map(function (r) {
        return '<button type="button" class="lg-undated-item" data-open="' + esc(r.id) + '" data-tip-id="' + esc(r.id) + '"><b>' + esc(r.title) + '</b><small>' + esc(catLabel(r.category)) + ' · ' + esc(chapterLabel(r.chapterId)) + '</small></button>';
      }).join('') + '</div></section>';
  }

  function futureSection(list) {
    return '<section class="lg-future-goals"><h3>เป้าหมายอนาคต — ยังไม่เกิดขึ้น (ไม่นับเป็นประวัติ)</h3>' +
      '<div class="lg-future-goals-grid">' + list.map(function (r) {
        return '<button type="button" class="lg-future-goal" data-open="' + esc(r.id) + '"><span><b>' + esc(r.title) + '</b><small>' + esc(catLabel(r.category)) + ' · ' + esc(r.status) + ' · ' + esc(C.formatDateRange(r)) + '</small></span></button>';
      }).join('') + '</div></section>';
  }

  function timelineView(list) {
    var h = '';
    if (state.year !== 'future') {
      var groups = timelineYears(list);
      if (typeof state.year === 'number') groups = groups.filter(function (g) { return g.year === state.year; });
      groups.forEach(function (g) {
        h += '<section class="lg-year-group" data-year="' + g.year + '"><header class="lg-year-group-head"><h3>' + esc(C.formatYear(g.year)) + '</h3><small>' + g.records.length + ' เหตุการณ์</small></header><div class="lg-year-group-body">';
        g.records.forEach(function (r) { h += card(r, Number(r.startYearCE) === g.year ? null : Number(r.startYearCE)); });
        h += '</div></section>';
      });
      if (!groups.length && typeof state.year === 'number') {
        var total = C.recordsForYear(state.records, state.year).length;
        h += '<p class="lg-empty">' + (total ? ('มีเหตุการณ์ในปีนี้ ' + total + ' รายการ แต่ไม่ตรงกับตัวกรองหรือคำค้นปัจจุบัน') : esc(emptyYearText(state.year))) + '</p>';
      }
      if (state.year === 'all') {
        var und = C.undatedRecords(list);
        if (und.length) h += undatedSection(und);
      }
    }
    if (state.year === 'all' || state.year === 'future') {
      var fut = C.futureRecords(list);
      if (fut.length) h += futureSection(fut);
      else if (state.year === 'future') h += '<p class="lg-empty">ยังไม่มีเป้าหมายอนาคตที่บันทึกไว้</p>';
    }
    if (!h) h = '<p class="lg-empty">ไม่มีเหตุการณ์ที่ตรงกับตัวกรองตอนนี้</p>';
    return h;
  }

  function chaptersView() {
    var list = filtered();
    var h = '<p class="lg-chapters-note">บทชีวิตเป็น "หมวดจัดระเบียบ" เพื่ออ่านภาพรวม — ไม่ใช่ข้ออ้างว่ามีวันเริ่ม–สิ้นสุดที่แน่นอน และไม่ได้แปลว่าชีวิตเดินเป็นขั้นบันได</p><div class="lg-chapter-grid">';
    CHS.forEach(function (c) {
      var recs = list.filter(function (r) { return r.chapterId === c.id && !r.isFuture; });
      var ys = recs.map(function (r) { return r.startYearCE; }).filter(function (y) { return y != null; }).sort(function (a, b) { return a - b; });
      var span = ys.length ? (ys[0] === ys[ys.length - 1] ? C.formatYear(ys[0]) : C.formatYear(ys[0]) + ' – ' + C.formatYear(ys[ys.length - 1])) : 'ปีไม่ระบุ';
      h += '<article class="lg-chapter-card"><h4>' + esc(c.title) + ' · ' + esc(c.titleTh) + '</h4>' +
        '<p class="lg-chapter-meta">' + esc(span) + ' · ' + recs.length + ' เหตุการณ์</p>' +
        '<p>' + esc(c.description || '') + '</p>' +
        '<ul class="lg-chapter-events">' + (recs.length ? recs.map(function (r) {
          return '<li><button type="button" class="lg-chapter-event" data-open="' + esc(r.id) + '">' + esc(r.title) + '<small>' + esc(C.formatDateRange(r)) + '</small></button></li>';
        }).join('') : '<li class="lg-chapter-none">ยังไม่มีเหตุการณ์ที่บันทึกไว้ในบทนี้</li>') + '</ul></article>';
    });
    return h + '</div>';
  }

  function mapView() {
    var list = filtered();
    var h = '<div class="lg-map">';
    CHS.forEach(function (c) {
      var n = list.filter(function (r) { return r.chapterId === c.id; }).length;
      h += '<div class="lg-map-node' + (n ? '' : ' is-empty') + '"><b>' + esc(c.titleTh) + '</b><small>' + esc(c.title) + ' · ' + n + ' เหตุการณ์</small></div>';
    });
    h += '</div><p class="lg-map-note">แผนที่แนวคิด — แสดงความเชื่อมโยงของบทชีวิต ไม่ใช่ลำดับความสำเร็จ ไม่ใช่คะแนนทักษะ และไม่ใช่วันที่ที่ยืนยันแล้ว</p>';
    h += '<div class="lg-year-group-body">' + list.map(function (r) { return card(r); }).join('') + '</div>';
    return h;
  }

  /* ── กราฟชีวิตแบบสต็อก ── */
  /* ข้อความ tooltip ต่อ record ถูกสร้างตอนวาดกราฟ แล้วให้ handler อ่านผ่าน data-tip-id
   * (ไม่ยัด HTML ลง attribute เพื่อไม่ให้ escape เพี้ยน) */
  var tips = {};
  function tipHtml(r, opts) {
    var precisionNote = '';
    if (r.datePrecision === 'exact_year' || r.datePrecision === 'estimated_year') precisionNote = 'ระบุเป็นปี (ไม่ทราบเดือน/วัน)';
    else if (r.datePrecision === 'school_period') precisionNote = 'ระบุเป็นช่วงชั้น/ปีการศึกษา';
    else if (r.datePrecision === 'age_based') precisionNote = 'ระบุจากช่วงอายุ';
    else if (r.datePrecision === 'exact_month' || r.datePrecision === 'estimated_month') precisionNote = 'ระบุเป็นเดือน';
    var flags = [];
    if (r.isCurrent) flags.push('ปัจจุบัน · ยังดำเนินอยู่');
    if (r.isFuture || (opts && opts.future)) flags.push('เป้าหมายอนาคต · ยังไม่เกิดขึ้น');
    if (r.dateStatus === 'estimated') flags.push('วันที่ประมาณการ');
    if (r.dateStatus === 'needs_confirmation') flags.push('ต้องยืนยัน');
    return '<b>' + esc(r.title) + '</b>' +
      '<span>' + esc(C.formatDateRange(r)) + '</span>' +
      (precisionNote ? '<em>' + esc(precisionNote) + '</em>' : '') +
      '<span>' + esc(catLabel(r.category)) + '</span>' +
      (flags.length ? '<i>' + esc(flags.join(' · ')) + '</i>' : '');
  }
  function graphTip() { return '<div class="lg-chart-tip" id="lg-chart-tip" role="tooltip" hidden></div>'; }

  function graphView() {
    tips = {};
    /* กราฟผูกกับความกว้างที่มีจริง (ไม่ยืม viewBox แคบ ๆ แล้วบวมด้วย CSS) เพื่อให้ตัวอักษรแสดงเต็มขนาด
     * แต่ล็อกขอบไว้ ไม่ให้เล็กเกินอ่านหรือใหญ่เกินจอ */
    var fit = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
    var chartWidth = Math.round(fit((root.clientWidth || 1280) - 34, 1040, 1600));
    var chartHeight = Math.round(fit(chartWidth * 0.54, 560, 880));
    var L = C.graphLayout(state.records, { mode: state.mode, minYear: YEARS[0], maxYear: YEARS[1], forceAllLabels: state.labels, width: chartWidth, height: chartHeight });
    var recById = {};
    state.records.forEach(function (r) { recById[r.id] = r; });
    var b = L.bounds;
    function xAt(y) { return b.left + (y - b.minYear) / (b.maxYear - b.minYear) * (b.right - b.left); }
    var s = '<svg class="lg-stock-chart" viewBox="0 0 ' + L.width + ' ' + L.height + '" width="' + L.width + '" height="' + L.height + '" role="img" aria-label="กราฟเส้นทางชีวิต เทียบเวลา พ.ศ. และ ค.ศ.">';
    var bx = Math.max(b.left, xAt(CHILDHOOD[0]));
    var bw = Math.max(0, Math.min(b.right, xAt(CHILDHOOD[1] + 1)) - bx);
    s += '<rect class="lg-chapter-band" x="' + bx.toFixed(1) + '" y="' + b.top + '" width="' + bw.toFixed(1) + '" height="' + (b.bottom - b.top) + '"><title>ช่วงวัยเด็ก 2547–2560 (2004–2017)</title></rect>';
    s += '<text class="lg-chapter-band-label" x="' + (bx + 8).toFixed(1) + '" y="' + (b.top + 16) + '">ช่วงวัยเด็ก · ไม่ใช่ช่องว่างข้อมูล</text>';
    for (var gi = 0; gi <= 4; gi++) {
      var gy = b.top + (b.bottom - b.top) * gi / 4;
      s += '<line class="lg-gridline" x1="' + b.left + '" y1="' + gy.toFixed(1) + '" x2="' + b.right + '" y2="' + gy.toFixed(1) + '"/>';
    }
    L.years.forEach(function (t) {
      s += '<line class="lg-grid-vertical" x1="' + t.x.toFixed(1) + '" y1="' + b.top + '" x2="' + t.x.toFixed(1) + '" y2="' + b.bottom + '"/>';
      s += '<text class="lg-axis-label" x="' + t.x.toFixed(1) + '" y="' + (b.bottom + 22) + '" text-anchor="' + (t.anchor || 'middle') + '">' + esc(t.label) + '</text>';
    });
    s += '<text class="lg-axis-title" x="' + b.left + '" y="' + (b.top - 12) + '">' + (state.mode === 'self' ? 'คะแนนประเมินตนเอง 1–10 (คุณกรอกเอง)' : 'การเปลี่ยนแปลงของชีวิต (ตำแหน่งเชิงภาพ ไม่ใช่คะแนน)') + '</text>';

    L.segments.forEach(function (seg) {
      var pts = seg.map(function (id) { return L.points.filter(function (p) { return p.id === id; })[0]; }).filter(Boolean);
      if (pts.length < 2) return;
      s += '<path class="lg-history-line" d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ') + '"/>';
    });

    /* ── อนาคต ──────────────────────────────────────────────────────────────
     * เหตุการณ์อนาคตที่ "มีวันที่" อยู่บนแกนเวลาตามจริง ส่วนเป้าหมายที่ยังไม่กำหนดปี
     * ต้องอยู่นอกแกนเวลา (กฎห้ามเดาปี) จึงเป็นคอลัมน์ทางขวา มีเส้นประเส้นเดียวจากจุดปัจจุบัน
     * เดิมลากเส้นจากจุดขวาสุดไปทุกเป้าหมาย ทำให้เส้นพาดผ่านจุดจริงทั้งก้อน */
    var anchor = L.futureAnchor;
    var col = L.futureColumn;
    if (anchor && col) {
      /* เส้นเชื่อมเส้นเดียว: ออกจากจุดปัจจุบันไปทางขวาแบบ "ข้องอ" (ไม่ทแยงผ่านจุดจริง)
       * แล้วต่อกับแกนตั้งของคอลัมน์เป้าหมายที่อยู่นอกแกนเวลา */
      s += '<line class="lg-future-line" x1="' + (anchor.x + 12).toFixed(1) + '" y1="' + anchor.y.toFixed(1) +
        '" x2="' + col.x.toFixed(1) + '" y2="' + anchor.y.toFixed(1) + '"/>';
      s += '<line class="lg-future-spine" x1="' + col.x.toFixed(1) + '" y1="' + Math.min(col.top, anchor.y).toFixed(1) +
        '" x2="' + col.x.toFixed(1) + '" y2="' + Math.max(col.bottom, anchor.y).toFixed(1) + '"/>';
      /* ป้ายกำกับใต้คอลัมน์ เพื่อไม่ให้เป็นจุดปริศนา — ชื่อเป้าหมายดูได้จาก hover/แตะ และจากกล่อง FUTURE QUESTS ด้านล่าง
       * ชิดขอบขวา (ไม่ center บนคอลัมน์) เพราะคอลัมน์อยู่ชิดขอบกราฟ ถ้า center จะถูกตัดขาด */
      s += '<text class="lg-future-col-label" x="' + (L.width - 4) + '" y="' + (col.bottom + 24).toFixed(1) + '" text-anchor="end">เป้าหมายที่ยังไม่กำหนดปี</text>';
    }
    L.futurePoints.forEach(function (f) {
      var fr = recById[f.id];
      if (fr) tips[f.id] = tipHtml(fr, { future: true });
      s += '<circle class="lg-future-dot' + (f.projected ? ' is-projected' : '') + '" data-id="' + esc(f.id) + '" data-open="' + esc(f.id) + '" data-tip-id="' + esc(f.id) + '" tabindex="0" role="button" aria-label="' + esc(f.label + (f.projected ? ' · เป้าหมายอนาคต ยังไม่กำหนดปี' : ' · อนาคต · ' + f.dateLabel)) + '" cx="' + f.x.toFixed(1) + '" cy="' + f.y.toFixed(1) + '" r="6"/>';
    });

    L.points.forEach(function (p) {
      var pr = recById[p.id];
      if (pr) tips[p.id] = tipHtml(pr);
      s += '<circle class="lg-chart-point' + (p.isCurrent ? ' is-current' : '') + '" data-id="' + esc(p.id) + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (p.isCurrent ? 7 : 5) + '"/>';
      if (p.labelSide !== 'hidden') {
        var lx = p.labelX == null ? p.x : p.labelX;
        /* p.labelY คือขอบของกล่องป้ายที่ชิดจุด (above = ขอบล่าง, below = ขอบบน)
         * สองบรรทัดถูกจัดวางพร้อมกับตอนกันทับกัน จึงไม่มีการเดาตำแหน่งที่นี่ */
        var lyName = p.labelSide === 'above' ? p.labelY - 17 : p.labelY + 13;
        var lyDate = p.labelSide === 'above' ? p.labelY - 4 : p.labelY + 26;
        var label = p.label.length > 30 ? p.label.slice(0, 29) + '…' : p.label;
        s += '<text class="lg-point-label" x="' + lx.toFixed(1) + '" y="' + lyName.toFixed(1) + '" text-anchor="middle">' + esc(label) + '</text>';
        s += '<text class="lg-point-year" x="' + lx.toFixed(1) + '" y="' + lyDate.toFixed(1) + '" text-anchor="middle">' + esc(p.dateLabel) + '</text>';
      }
      s += '<circle class="lg-hit" data-open="' + esc(p.id) + '" data-tip-id="' + esc(p.id) + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="11"/>';
      s += '<circle class="lg-hit-wrap" data-open="' + esc(p.id) + '" data-tip-id="' + esc(p.id) + '" tabindex="0" role="button" aria-label="' + esc(p.label + ' · ' + p.dateLabel) + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="15"/>';
    });
    s += '</svg>';

    var h = '<div class="lg-graph-tools">' +
      '<div class="lg-modes" role="group" aria-label="โหมดแกนตั้ง">' +
      '<button type="button" data-lg-mode="narrative" aria-pressed="' + (state.mode === 'narrative') + '"' + (state.mode === 'narrative' ? ' class="is-active"' : '') + '>โหมด A · การจัดวางเชิงภาพ</button>' +
      '<button type="button" data-lg-mode="self" aria-pressed="' + (state.mode === 'self') + '"' + (state.mode === 'self' ? ' class="is-active"' : '') + '>โหมด B · คะแนนประเมินตนเอง 1–10</button>' +
      '</div>' +
      '<button type="button" class="lg-btn" data-lg-labels aria-pressed="' + (state.labels ? 'true' : 'false') + '">' + (state.labels ? 'ย่อ label กลับ' : 'แสดง label ทั้งหมด') + '</button>' +
      '</div>' +
      '<p class="lg-mode-note">โหมดปัจจุบัน: ' + (state.mode === 'self' ? 'B — คะแนนประเมินตนเอง 1–10 ที่คุณกรอกเอง (ว่างไว้ได้ ไม่มีผลต่อข้อมูลจริง)' : 'A — ตำแหน่งแนวตั้งจัดวางตามบทชีวิตและความสำคัญ ไม่ใช่คะแนนวัดคุณภาพชีวิต') + '</p>';

    if (state.mode === 'self' && !L.hasScores) {
      h += '<p class="lg-score-notice">ยังไม่มีคะแนนประเมินตนเอง — กรอกได้ที่ปุ่มแก้ไข (โหมด B วาดเฉพาะคะแนน 1–10 ที่คุณกรอกเอง ระบบจะไม่เดาคะแนนให้)</p>';
    } else if (state.mode === 'self') {
      h += '<p class="lg-graph-note">วาดจากคะแนนที่คุณกรอกเอง ' + L.points.length + ' จุด — เส้นจะขาดตรงช่วงปีที่ไม่มีคะแนน ไม่มีการลากเชื่อมข้ามช่องว่าง</p>';
    }

    h += '<div class="lg-trajectory"><div class="lg-chart-scroll">' + s + '</div>' + graphTip() + '</div>';
    h += '<div class="lg-legend">' +
      '<span class="lg-legend-item"><span class="lg-legend-line"></span> ฟ้า = เหตุการณ์ในอดีต</span>' +
      '<span class="lg-legend-item"><span class="lg-legend-key" style="background:#14b88a"></span> เขียว = ปัจจุบัน</span>' +
      '<span class="lg-legend-item"><span class="lg-legend-dashed"></span> เส้นประ = เป้าหมายอนาคต (ยังไม่เกิดขึ้น)</span>' +
      '<span class="lg-legend-item"><span class="lg-legend-band"></span> แถบจาง = ช่วงวัยเด็ก</span>' +
      '</div>';
    h += '<p class="lg-graph-note">' + esc(L.yAxisNote) + ' · แกนนอนคือเวลา พ.ศ. (ค.ศ.) และตำแหน่งของเหตุการณ์ที่ยังไม่ยืนยันปีจะไม่ถูกเดาลงบนแกน</p>';
    if (state.mode === 'narrative') {
      h += '<p class="lg-graph-note">เส้นเชื่อมปีละหนึ่งเหตุการณ์หลัก (milestone เด่นสุดของปีนั้น) — เหตุการณ์อื่นยังแสดงเป็นจุดครบทุกอัน</p>';
      if (L.dodgedCount > 0) {
        h += '<p class="lg-graph-note">มี ' + L.dodgedCount + ' เหตุการณ์ที่ตำแหน่งตกทับกันเป๊ะ ถูกกระจายแนวตั้งเล็กน้อยเพื่อให้เห็นครบทุกจุด</p>';
      }
    }
    if (L.hiddenLabelCount > 0 && !state.labels) {
      h += '<p class="lg-graph-hidden-note">ซ่อน label อีก ' + L.hiddenLabelCount + ' จุด เพื่อไม่ให้ทับกัน — กด "แสดง label ทั้งหมด" เพื่อดูครบ</p>';
    }
    var und = C.undatedRecords(state.records);
    if (und.length) h += undatedSection(und);
    var fut = C.futureRecords(state.records);
    if (fut.length) h += futureSection(fut);
    return h;
  }

  /* ── ตัวกรองปี ── */
  function renderChips() {
    var box = byId('lg-years');
    if (!box) return;
    var h = '';
    for (var y = YEARS[0]; y <= YEARS[1]; y++) {
      var n = C.recordsForYear(state.records, y).length;
      var active = state.year === y;
      h += '<button type="button" class="lg-year-chip' + (n ? '' : ' is-empty') + (active ? ' is-active' : '') + '" data-lg-year="' + y + '" aria-pressed="' + active + '"' + (n ? '' : ' aria-describedby="lg-years-help"') + '>' + esc(C.formatYear(y)) + '<i aria-hidden="true">' + (n || '—') + '</i></button>';
    }
    var fn = C.futureRecords(state.records).length;
    var factive = state.year === 'future';
    h += '<button type="button" class="lg-year-chip lg-year-chip-future' + (factive ? ' is-active' : '') + '" data-lg-year="future" aria-pressed="' + factive + '">อนาคต · Future<i aria-hidden="true">' + fn + '</i></button>';
    box.innerHTML = h;
  }

  function renderYearDetail() {
    var box = byId('lg-year-detail');
    if (!box) return;
    if (state.year === 'all') { box.hidden = true; box.innerHTML = ''; return; }
    var h = '';
    if (state.year === 'future') {
      var fut = C.futureRecords(state.records);
      h += '<div class="lg-year-head"><h3>อนาคต · Future</h3><small>' + fut.length + ' เป้าหมาย · ยังไม่เกิดขึ้น จึงไม่นับเป็นประวัติ</small></div>';
      h += fut.length
        ? '<ul class="lg-year-list">' + fut.map(function (r) { return '<li><button type="button" class="lg-chapter-event" data-open="' + esc(r.id) + '">' + esc(r.title) + '<small>' + esc(C.formatDateRange(r)) + ' · ' + esc(r.status) + '</small></button></li>'; }).join('') + '</ul>'
        : '<p class="lg-empty-year">ยังไม่มีเป้าหมายอนาคตที่บันทึกไว้</p>';
      box.innerHTML = h;
      box.hidden = false;
      return;
    }
    var y = Number(state.year);
    var inYear = yearRecords(state.records, y);
    h += '<div class="lg-year-head"><h3>พ.ศ. ' + (y + 543) + ' (' + y + ')</h3><small>อายุ ' + (y - 2004) + ' ปี (คิดจากปีเกิด 2547) · ' + inYear.length + ' เหตุการณ์</small></div>';
    if (inYear.length) {
      h += '<ul class="lg-year-list">' + inYear.map(function (r) {
        var carried = Number(r.startYearCE) !== y;
        return '<li><button type="button" class="lg-chapter-event" data-open="' + esc(r.id) + '">' + esc(r.title) +
          (carried ? ' <span class="lg-carried">ต่อเนื่องจาก ' + esc(C.formatYear(r.startYearCE)) + '</span>' : '') +
          '<small>' + esc(C.formatDateRange(r)) + ' · ' + esc(catLabel(r.category)) + '</small></button></li>';
      }).join('') + '</ul>';
      var cats = {};
      inYear.forEach(function (r) { cats[r.category] = (cats[r.category] || 0) + 1; });
      h += '<div class="lg-year-cats">' + Object.keys(cats).map(function (k) { return '<span class="lg-year-cat">' + esc(catLabel(k)) + ' × ' + cats[k] + '</span>'; }).join('') + '</div>';
    } else {
      h += '<p class="lg-empty-year">' + esc(emptyYearText(y)) + '</p>';
      h += (y >= CHILDHOOD[0] && y <= CHILDHOOD[1])
        ? '<p class="lg-empty-year-note">ช่วงวัยเด็กไม่ใช่ช่องว่างข้อมูล — ไม่ต้องสร้างเหตุการณ์ย้อนหลังเพื่อให้ครบ</p>'
        : '<p class="lg-empty-year-note">ถ้ามีเหตุการณ์จริงในปีนี้ เพิ่มได้จากปุ่ม "เพิ่มบันทึก" ด้านบน — ระบบจะไม่เติมให้เอง</p>';
    }
    box.innerHTML = h;
    box.hidden = false;
  }

  /* ── แผงรายละเอียด ── */
  function row(k, v) { return '<div class="lg-detail-row"><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>'; }
  function textSection(title, text) {
    return '<div class="lg-detail-section"><h4>' + esc(title) + '</h4><p>' + (text ? esc(text) : '<span class="lg-unrecorded">' + NOT_RECORDED + '</span>') + '</p></div>';
  }
  function renderDetail() {
    var box = byId('lg-detail');
    if (!box) return;
    var r = state.selected ? state.records.filter(function (x) { return x.id === state.selected; })[0] : null;
    if (!r) { box.hidden = true; box.innerHTML = ''; return; }
    var badges = '';
    if (r.isCurrent) badges += '<span class="lg-badge lg-badge-current">ปัจจุบัน · ยังดำเนินอยู่</span>';
    if (r.isFuture) badges += '<span class="lg-badge lg-badge-future">อนาคต · ยังไม่เกิดขึ้น</span>';
    if (r.dateStatus === 'needs_confirmation') badges += '<span class="lg-badge lg-badge-warn">ต้องยืนยัน</span>';
    if (r.dateStatus === 'estimated' || r.datePrecision === 'estimated_year' || r.datePrecision === 'estimated_range') badges += '<span class="lg-badge lg-badge-est">โดยประมาณ</span>';
    if (isSeedId(r.id)) badges += '<span class="lg-badge">ชุดข้อมูลตั้งต้น</span>';
    badges += '<span class="lg-badge">' + esc(catLabel(r.category)) + '</span>';

    var h = '<div class="lg-detail-head"><h3>' + esc(r.title) + '</h3><div class="lg-detail-badges">' + badges + '</div></div>';
    if (r.conflictNote) h += '<div class="lg-conflict"><b>ข้อมูลขัดแย้ง — ต้องยืนยัน</b>' + esc(r.conflictNote) + '</div>';
    if (r.legacyScale) h += '<div class="lg-legacy-score">คะแนนประเมินตนเองเดิมคือ ' + esc(r.selfAssessmentScore) + ' ซึ่งอยู่นอกสเกล 1–10 ของระบบนี้ ระบบไม่แปลงให้เงียบ ๆ — กรอกใหม่ถ้าต้องการให้แสดงบนกราฟ</div>';

    h += '<dl class="lg-detail-fields">' +
      row('ปี พ.ศ.', r.startYearCE == null ? '<span class="lg-unrecorded">' + NOT_RECORDED + '</span>' : esc(String(Number(r.startYearCE) + 543))) +
      row('ปี ค.ศ.', r.startYearCE == null ? '<span class="lg-unrecorded">' + NOT_RECORDED + '</span>' : esc(String(r.startYearCE))) +
      row('วัน / ช่วงเวลา', esc(C.formatDateRange(r))) +
      row('ความแม่นยำของวันที่', esc(PREC_LABEL[r.datePrecision] || r.datePrecision)) +
      row('ความน่าเชื่อถือของวันที่', esc(DST_LABEL[r.dateStatus] || r.dateStatus)) +
      row('ที่มาของวันที่', esc(DSRC_LABEL[r.dateSource] || r.dateSource)) +
      row('Life Chapter', esc(chapterLabel(r.chapterId))) +
      row('Event Category', esc(catLabel(r.category))) +
      row('สถานะ', esc(r.status)) +
      '</dl>';

    h += '<div class="lg-detail-section"><h4>Description</h4><p>' + (r.description ? esc(r.description) : '<span class="lg-unrecorded">' + NOT_RECORDED + '</span>') + '</p></div>';
    h += textSection('What Changed — อะไรเปลี่ยนไป', r.whatChanged);
    h += '<div class="lg-detail-section"><h4>Related Skills</h4><p>' + (r.relatedSkills.length ? esc(r.relatedSkills.join(' · ')) : '<span class="lg-unrecorded">' + NOT_RECORDED + '</span>') + '</p></div>';
    h += '<div class="lg-detail-section"><h4>Related Projects</h4><p>' + (r.relatedProjectIds.length ? esc(r.relatedProjectIds.join(' · ')) : '<span class="lg-unrecorded">' + NOT_RECORDED + '</span>') + '</p></div>';
    h += textSection('Personal Reflection — สะท้อนตัวเอง', r.reflection);
    h += textSection('Evidence / Source', r.sourceReference);
    h += textSection('User Notes', r.notes);
    if (r.tags.length) h += '<div class="lg-detail-section"><h4>Tags</h4><p>' + esc(r.tags.join(' · ')) + '</p></div>';
    h += '<div class="lg-actions"><button type="button" class="lg-btn lg-primary" data-edit>แก้ไข</button><button type="button" class="lg-btn lg-danger" data-delete>ลบ</button><button type="button" class="lg-btn" data-close-detail>ปิด</button></div>';
    h += '<p class="lg-truth-note">ช่องที่ยังไม่มีข้อมูลจะแสดง "' + NOT_RECORDED + '" เสมอ ระบบจะไม่แต่งเรื่องหรือเดาปีแทนคุณ</p>';
    box.innerHTML = h;
    box.hidden = false;
  }

  function openDetail(id) {
    state.selected = id;
    renderDetail();
    var box = byId('lg-detail');
    if (box && !box.hidden && box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
  }

  /* ── ฟอร์มเพิ่ม/แก้ไข ── */
  function populateSelects() {
    var f = byId('lg-form');
    if (!f) return;
    var cs = f.elements.category;
    if (cs && cs.options.length <= 1) {
      CATS.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = catLabel(c); cs.appendChild(o); });
    }
    var ch = f.elements.chapterId;
    if (ch && ch.options.length <= 1) {
      CHS.forEach(function (c) { var o = document.createElement('option'); o.value = c.id; o.textContent = c.titleTh + ' · ' + c.title; ch.appendChild(o); });
    }
    var fl = byId('lg-category');
    if (fl && fl.options.length <= 1) {
      CATS.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = catLabel(c); fl.appendChild(o); });
    }
  }

  function setVal(f, name, v) { if (f.elements[name]) f.elements[name].value = (v == null ? '' : v); }

  function openForm(rec) {
    var f = byId('lg-form');
    if (!f) return;
    populateSelects();
    f.reset();
    byId('lg-dialog-title').textContent = rec ? 'แก้ไขบันทึกชีวิต' : 'เพิ่มบันทึกชีวิต';
    setVal(f, 'id', rec ? rec.id : '');
    setVal(f, 'title', rec ? rec.title : '');
    setVal(f, 'description', rec ? rec.description : '');
    setVal(f, 'category', rec ? rec.category : 'Personal');
    setVal(f, 'type', rec ? rec.type : 'milestone');
    setVal(f, 'startDate', rec ? rec.startDate : '');
    setVal(f, 'endDate', rec ? rec.endDate : '');
    setVal(f, 'startYearCE', rec ? rec.startYearCE : '');
    setVal(f, 'endYearCE', rec ? rec.endYearCE : '');
    setVal(f, 'startMonthCE', rec ? rec.startMonthCE : '');
    setVal(f, 'endMonthCE', rec ? rec.endMonthCE : '');
    setVal(f, 'datePrecision', rec ? rec.datePrecision : 'unknown');
    setVal(f, 'dateStatus', rec ? rec.dateStatus : 'unknown');
    setVal(f, 'dateSource', rec ? rec.dateSource : 'user_reported');
    setVal(f, 'status', rec ? rec.status : 'user-reported');
    setVal(f, 'importance', rec ? rec.importance : 2);
    setVal(f, 'narrativeLevel', rec ? rec.narrativeLevel : '');
    setVal(f, 'selfAssessmentScore', rec ? rec.selfAssessmentScore : '');
    setVal(f, 'chapterId', rec ? rec.chapterId : '');
    setVal(f, 'relatedSkills', rec ? (rec.relatedSkills || []).join(', ') : '');
    setVal(f, 'relatedProjectIds', rec ? (rec.relatedProjectIds || []).join(', ') : '');
    setVal(f, 'whatChanged', rec ? rec.whatChanged : '');
    setVal(f, 'reflection', rec ? rec.reflection : '');
    setVal(f, 'sourceReference', rec ? rec.sourceReference : '');
    setVal(f, 'notes', rec ? rec.notes : '');
    setVal(f, 'conflictNote', rec ? rec.conflictNote : '');
    setVal(f, 'tags', rec ? (rec.tags || []).join(', ') : '');
    byId('lg-dialog').showModal();
  }

  function readForm(f) {
    var id = f.elements.id.value;
    var old = id ? state.records.filter(function (r) { return r.id === id; })[0] : null;
    var num = function (v) { return v === '' || v == null ? null : Number(v); };
    var rec = {
      id: id || ('milestone-' + nowIso() + '-' + Math.random().toString(36).slice(2, 7)),
      title: f.elements.title.value.trim(),
      description: f.elements.description.value.trim(),
      category: f.elements.category.value,
      chapterId: f.elements.chapterId.value,
      type: f.elements.type.value,
      status: f.elements.status.value,
      importance: f.elements.importance.value,
      startDate: f.elements.startDate.value || null,
      endDate: f.elements.endDate.value || null,
      startYearCE: num(f.elements.startYearCE.value),
      endYearCE: num(f.elements.endYearCE.value),
      startMonthCE: num(f.elements.startMonthCE.value),
      endMonthCE: num(f.elements.endMonthCE.value),
      datePrecision: f.elements.datePrecision.value,
      dateStatus: f.elements.dateStatus.value,
      dateSource: f.elements.dateSource.value,
      sourceReference: f.elements.sourceReference.value.trim() || null,
      conflictNote: f.elements.conflictNote.value.trim() || null,
      narrativeLevel: num(f.elements.narrativeLevel.value),
      selfAssessmentScore: num(f.elements.selfAssessmentScore.value),
      relatedSkills: f.elements.relatedSkills.value,
      relatedProjectIds: f.elements.relatedProjectIds.value,
      whatChanged: f.elements.whatChanged.value.trim(),
      reflection: f.elements.reflection.value.trim(),
      notes: f.elements.notes.value.trim(),
      tags: f.elements.tags.value,
      isFuture: f.elements.type.value === 'goal' && !f.elements.startYearCE.value && !f.elements.startDate.value,
      isCurrent: old ? !!old.isCurrent : false,
      isAnchor: old ? !!old.isAnchor : false,
      legacyScale: old ? !!old.legacyScale : false,
      createdAt: old ? old.createdAt : nowIso(),
      updatedAt: nowIso(),
      userEdited: true,
      migratedFrom: old ? old.migratedFrom : null
    };
    return C.normalizeRecord(rec);
  }

  function onFormSubmit(ev) {
    ev.preventDefault();
    var f = byId('lg-form');
    if (!String(f.elements.title.value || '').trim()) {
      notice('ต้องมีชื่อเหตุการณ์ก่อนบันทึก');
      f.elements.title.focus();
      return;
    }
    var rec = readForm(f);
    var idx = -1;
    for (var i = 0; i < state.records.length; i++) if (state.records[i].id === rec.id) idx = i;
    if (idx >= 0) state.records[idx] = rec; else state.records.push(rec);
    state.selected = rec.id;
    state.view = 'timeline';
    state.query = '';
    var s = byId('lg-search'); if (s) s.value = '';
    if (typeof state.year === 'number' || state.year === 'future') state.year = 'all';
    byId('lg-dialog').close();
    save(idx >= 0 ? 'แก้ไขบันทึกแล้ว' : 'เพิ่มบันทึกแล้ว');
    render();
  }

  function deleteSelected() {
    var r = state.records.filter(function (x) { return x.id === state.selected; })[0];
    if (!r) return;
    if (!window.confirm('ยืนยันลบบันทึก "' + r.title + '" ? การลบย้อนกลับไม่ได้ และบันทึกตั้งต้นจะไม่ถูกสร้างกลับมาให้อีก')) return;
    state.records = state.records.filter(function (x) { return x.id !== r.id; });
    if (isSeedId(r.id) && state.deletedSeedIds.indexOf(r.id) < 0) state.deletedSeedIds.push(r.id);
    state.selected = null;
    save('ลบบันทึกแล้ว');
    render();
  }

  function exportJson() {
    var payload = {
      version: 2, app: 'ET1CRUEL Life Graph', exportedAt: nowIso(),
      records: state.records, deletedSeedIds: state.deletedSeedIds, meta: state.meta
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date();
    a.href = url;
    a.download = 'et1cruel-life-graph-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 1500);
  }

  function onImportFile(ev) {
    var input = ev.target;
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { notice('อ่านไฟล์ไม่สำเร็จ'); input.value = ''; };
    reader.onload = function () {
      var res = C.validateImport(String(reader.result));
      input.value = '';
      if (!res.ok) { notice('นำเข้าไม่สำเร็จ: ' + res.reason); return; }
      if (!window.confirm('นำเข้าข้อมูล ' + res.payload.records.length + ' รายการ จะรวมกับข้อมูลเดิมที่มีอยู่ — ยืนยัน?')) {
        notice('ยกเลิกการนำเข้าแล้ว — ข้อมูลเดิมไม่ถูกแตะ');
        return;
      }
      var merged = C.importIntoState({ records: state.records, deletedSeedIds: state.deletedSeedIds }, res.payload);
      state.records = merged.state.records;
      state.deletedSeedIds = merged.state.deletedSeedIds;
      save('นำเข้าแล้ว: เพิ่มใหม่ ' + merged.added + ' รายการ, อัปเดต ' + merged.updated + ' รายการ');
      render();
    };
    reader.readAsText(file);
  }

  function editFocus() {
    var cur = byId('lg-focus-text');
    var next = window.prompt('แก้ไข Primary Focus', cur ? cur.textContent : '');
    if (next == null) return;
    var v = String(next).trim();
    if (!v) return;
    if (cur) cur.textContent = v;
    try { localStorage.setItem(C.KEY_V1_FOCUS, v); } catch (e) { notice('บันทึก Focus ไม่สำเร็จ (ที่จัดเก็บของเบราว์เซอร์ถูกปิด)'); }
  }
  function loadFocus() {
    var cur = byId('lg-focus-text');
    if (!cur) return;
    try { var v = localStorage.getItem(C.KEY_V1_FOCUS); if (v) cur.textContent = v; } catch (e) {}
  }

  /* ── tooltip มืดของกราฟ (hover + โฟกัสคีย์บอร์ด ใช้เส้นทางเดียวกัน) ── */
  function showTip(el) {
    var tip = byId('lg-chart-tip');
    if (!tip || !el || !el.getAttribute) return;
    var key = el.getAttribute('data-tip-id');
    var html = key ? tips[key] : null;
    if (!html) return;
    var wrap = tip.parentElement;
    if (!wrap) return;
    tip.innerHTML = html;
    tip.hidden = false;
    var r = el.getBoundingClientRect();
    var w = wrap.getBoundingClientRect();
    var mid = r.left - w.left + r.width / 2;
    var tw = tip.offsetWidth;
    tip.style.left = Math.min(Math.max(6, w.width - tw - 6), Math.max(6, mid - tw / 2)) + 'px';
    tip.style.top = Math.max(2, r.top - w.top - tip.offsetHeight - 10) + 'px';
  }
  function hideTip() {
    var tip = byId('lg-chart-tip');
    if (tip) { tip.hidden = true; tip.innerHTML = ''; }
  }
  function tipTarget(ev) {
    return (ev.target && ev.target.closest) ? ev.target.closest('[data-tip-id]') : null;
  }
  function onTipOver(ev) { var el = tipTarget(ev); if (el) showTip(el); }
  function onTipOut(ev) {
    var el = tipTarget(ev);
    if (!el) return;
    var to = tipTarget({ target: ev.relatedTarget });
    if (to && to.getAttribute('data-tip-id') === el.getAttribute('data-tip-id')) return; // ย้ายระหว่างวงในวงนอกของจุดเดียวกัน
    hideTip();
  }

  /* ── เหตุการณ์คลิก/คีย์บอร์ด ── */
  function onClick(ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-lg-view],[data-lg-year],[data-prev-year],[data-next-year],[data-today],[data-all-years],[data-lg-mode],[data-lg-labels],[data-open],[data-close-detail],[data-add],[data-edit],[data-delete],[data-export],[data-import],[data-focus],[data-cancel]') : null;
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute('data-lg-view')) { state.view = t.getAttribute('data-lg-view'); state.selected = null; render(); return; }
    if (t.hasAttribute('data-lg-year')) {
      var v = t.getAttribute('data-lg-year');
      state.year = v === 'future' ? 'future' : Number(v);
      render();
      return;
    }
    if (t.hasAttribute('data-prev-year') || t.hasAttribute('data-next-year')) {
      var delta = t.hasAttribute('data-prev-year') ? -1 : 1;
      var cur = typeof state.year === 'number' ? state.year : YEARS[1];
      state.year = Math.min(YEARS[1], Math.max(YEARS[0], cur + delta));
      render();
      return;
    }
    if (t.hasAttribute('data-today')) { state.year = YEARS[1]; render(); return; }
    if (t.hasAttribute('data-all-years')) { state.year = 'all'; render(); return; }
    if (t.hasAttribute('data-lg-mode')) { state.mode = t.getAttribute('data-lg-mode') === 'self' ? 'self' : 'narrative'; render(); return; }
    if (t.hasAttribute('data-lg-labels')) { state.labels = !state.labels; render(); return; }
    if (t.hasAttribute('data-open')) { ev.preventDefault(); openDetail(t.getAttribute('data-open')); return; }
    if (t.hasAttribute('data-close-detail')) { state.selected = null; renderDetail(); return; }
    if (t.hasAttribute('data-add')) { openForm(null); return; }
    if (t.hasAttribute('data-edit')) {
      var r = state.records.filter(function (x) { return x.id === state.selected; })[0];
      if (r) openForm(r);
      return;
    }
    if (t.hasAttribute('data-delete')) { deleteSelected(); return; }
    if (t.hasAttribute('data-export')) { exportJson(); return; }
    if (t.hasAttribute('data-import')) { byId('lg-import-file').click(); return; }
    if (t.hasAttribute('data-focus')) { editFocus(); return; }
    if (t.hasAttribute('data-cancel')) { byId('lg-dialog').close(); return; }
  }

  function onKeydown(ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
    var t = ev.target;
    if (t && t.getAttribute && t.getAttribute('data-open')) {
      ev.preventDefault();
      openDetail(t.getAttribute('data-open'));
    }
  }

  /* ── วาดทุกส่วน ── */
  function renderStats() {
    var ys = {};
    state.records.forEach(function (r) { if (!r.isFuture && r.startYearCE != null) ys[r.startYearCE] = true; });
    var yn = Object.keys(ys).length;
    byId('lg-stat-years').textContent = yn ? yn + ' ปี' : 'ยังไม่มีปีที่ยืนยัน';
    byId('lg-milestones').textContent = state.records.filter(function (r) { return !r.isFuture; }).length + ' รายการ';
    byId('lg-chapters').textContent = CHS.length + ' บท';
    byId('lg-active').textContent = state.records.filter(function (r) { return r.isFuture || r.type === 'goal'; }).length + ' เป้าหมาย';
    byId('lg-age').textContent = String(NOW_YEAR + 543);
  }
  function renderToday() {
    var d = new Date();
    var el = byId('lg-today');
    if (!el) return;
    el.textContent = d.getDate() + ' ' + C.THAI_MONTHS[d.getMonth()] + ' ' + (d.getFullYear() + 543);
    el.setAttribute('datetime', d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()));
  }
  function renderViewButtons() {
    var btns = root.querySelectorAll('[data-lg-view]');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-lg-view') === state.view;
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) btns[i].classList.add('is-active'); else btns[i].classList.remove('is-active');
    }
  }
  function render() {
    renderToday();
    renderStats();
    renderChips();
    renderYearDetail();
    var list = filtered();
    byId('lg-result-count').textContent = list.length + ' / ' + state.records.length + ' รายการ';
    var box = byId('lg-content');
    if (state.view === 'graph') box.innerHTML = graphView();
    else if (state.view === 'chapters') box.innerHTML = chaptersView();
    else if (state.view === 'map') box.innerHTML = mapView();
    else box.innerHTML = timelineView(list);
    renderDetail();
    renderViewButtons();
  }

  /* ── เริ่มทำงาน ── */
  populateSelects();
  loadFocus();
  load();
  byId('lg-category').addEventListener('change', function (e) { state.category = e.target.value; render(); });
  byId('lg-search').addEventListener('input', function (e) { state.query = e.target.value; render(); });
  byId('lg-import-file').addEventListener('change', onImportFile);
  byId('lg-form').addEventListener('submit', onFormSubmit);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeydown);
  root.addEventListener('pointerover', onTipOver);
  root.addEventListener('pointerout', onTipOut);
  root.addEventListener('focusin', onTipOver);
  root.addEventListener('focusout', onTipOut);
  render();
  if (firstVisit) notice('เริ่มจากชุดข้อมูลตั้งต้น ' + state.records.length + ' รายการ ทุกช่องที่ยังไม่มีข้อมูลจะแสดงว่า "' + NOT_RECORDED + '" และปีที่ยังไม่มีบันทึกจะไม่ถูกเติมให้');
})();
