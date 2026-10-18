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
    var width = opts.width || 900, height = opts.height || 340;
    var left = 64, right = width - 54, top = 38, bottom = height - 72;

    function xFor(y, frac) { return left + ((Number(y) + frac) - minYear) / (maxYear - minYear) * (right - left); }
    function cx(v) { return clamp(v, 0, width); }

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
      var x = cx(xFor(r.startYearCE, frac));
      var lvl = mode === 'self' ? scoreLevel(r) : narrativeLevel(r);
      return {
        id: r.id, x: x, y: bottom - lvl * (bottom - top), level: lvl,
        year: Number(r.startYearCE), endYear: r.endYearCE == null ? null : Number(r.endYearCE),
        spanX: (r.endYearCE != null && Number(r.endYearCE) > Number(r.startYearCE)) ? cx(xFor(r.endYearCE, 0.5)) : null,
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
      var x = r.startYearCE == null ? null : cx(xFor(r.startYearCE, 0.5));
      return { id: r.id, x: x, projected: x == null, y: yv, level: lvl, label: r.title, labelSide: 'above', year: r.startYearCE == null ? null : Number(r.startYearCE), isGoal: r.type === 'goal', dateLabel: formatDateRange(r), record: r };
    }

    /* label anti-overlap: เรียงตาม x แล้ววางบน/ล่าง ถ้ายังทับให้ซ่อน (นับเป็น hiddenLabelCount) */
    points.sort(function (a, b) { return a.x - b.x; });
    var boxes = [], hidden = 0;
    function boxFor(p, side) {
      var w = Math.min(150, Math.max(52, String(p.label || '').length * 7));
      var h = 26;
      var y1 = side === 'above' ? p.y - 12 - h : p.y + 12;
      return { x1: p.x - w / 2, x2: p.x + w / 2, y1: y1, y2: y1 + h };
    }
    function hits(b) {
      for (var j = 0; j < boxes.length; j++) {
        var o = boxes[j];
        if (!(b.x2 < o.x1 || b.x1 > o.x2 || b.y2 < o.y1 || b.y1 > o.y2)) return true;
      }
      return false;
    }
    var force = !!opts.forceAllLabels;
    for (i = 0; i < points.length; i++) {
      var p = points[i];
      if (force) { p.labelSide = 'above'; boxes.push(boxFor(p, 'above')); continue; }
      var a = boxFor(p, 'above'), b2 = boxFor(p, 'below');
      if (!hits(a)) { p.labelSide = 'above'; boxes.push(a); }
      else if (!hits(b2)) { p.labelSide = 'below'; boxes.push(b2); }
      else { p.labelSide = 'hidden'; hidden++; }
    }

    var segments = [];
    if (mode === 'narrative') {
      if (points.length) segments.push(points.map(function (q) { return q.id; }));
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

    var years = [], span = maxYear - minYear;
    var step = span <= 6 ? 1 : (span <= 12 ? 2 : (span <= 24 ? 4 : 5));
    for (var t = minYear; t <= maxYear; t += step) years.push({ x: cx(xFor(t, 0.5)), year: t, label: formatYear(t) });
    if (years.length && years[years.length - 1].year !== maxYear) years.push({ x: cx(xFor(maxYear, 0.5)), year: maxYear, label: formatYear(maxYear) });

    return {
      mode: mode, points: points, segments: segments, undated: undated, futurePoints: futurePoints,
      years: years, width: width, height: height, hiddenLabelCount: hidden,
      hasScores: list.some(hasScore),
      bounds: { left: left, right: right, top: top, bottom: bottom, minYear: minYear, maxYear: maxYear },
      yAxisNote: mode === 'self'
        ? 'คะแนนประเมินตนเอง 1–10 ที่คุณกรอกเอง — เส้นขาดตรงปีที่ยังไม่มีคะแนน'
        : 'ตำแหน่งแนวตั้งเป็นการจัดวางเชิงภาพ ไม่ใช่คะแนนชีวิตที่วัดจริง',
      xAxisNote: 'เวลา · พ.ศ. (ค.ศ.)'
    };
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
    narrativeLevel: narrativeLevel, hasScore: hasScore,
    graphLayout: graphLayout
  };

  if (typeof document === 'undefined') return;

  /* ── ชั้น DOM (Task 3–5) จะถูกเพิ่มในคอมมิตถัดไป ── */
})();
