/* MIXING & MASTERING TEACHER ROOM — app logic (no deps, localStorage) */
(function(){
"use strict";
var D = window.MM_DATA;
var KEY = "mm-teacher-v1";
var state = { checklist:{}, dayStatus:{}, notes:{}, student:{understand:"",confused:"",submitted:"",feedback:"",next:""}, lastDay:1, lastTab:"overview", slideDeck:"opening", slideIdx:0, showNotes:true };
try {
  var raw = localStorage.getItem(KEY);
  if (raw) { var s = JSON.parse(raw); for (var k in s) state[k] = s[k]; }
} catch(e){ state._noStore = true; }
var storeOK = !state._noStore;
function save(msg){
  if (!storeOK) { toast("บันทึกไม่ได้: เบราว์เซอร์บล็อก LocalStorage"); return; }
  try { localStorage.setItem(KEY, JSON.stringify(state)); if (msg) toast(msg); var el = document.getElementById("saveState"); if (el) el.textContent = "บันทึกแล้ว " + new Date().toLocaleTimeString("th-TH"); }
  catch(e){ toast("บันทึกไม่ได้: " + e.message); }
}
function toast(msg){
  var t = document.getElementById("mmToast"); if(!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove("show"); }, 2200);
}
function copyText(txt, label){
  function done(){ toast("คัดลอกแล้ว: " + (label||"เนื้อหา")); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function(){ fallback(); });
  else fallback();
  function fallback(){ var ta=document.createElement("textarea"); ta.value=txt; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");done();}catch(e){toast("คัดลอกไม่ได้ กรุณาเลือกข้อความเอง");} document.body.removeChild(ta); }
}
var STATUS = [["not","Not Prepared"],["prep","Preparing"],["ready","Ready to Teach"],["done","Completed"]];
var ST_TH = { not:"ยังไม่เตรียม", prep:"กำลังเตรียม", ready:"พร้อมสอน", done:"สอนเสร็จ" };
function dayStatus(id){ return state.dayStatus[id] || "not"; }
/* ---------- tabs ---------- */
var TABS = [["course","🎓 ห้องคอร์ส 7 วัน"],["overview","◈ Overview"],["curriculum","📚 Curriculum"],["script","🎙 Teaching Script"],["slides","🖥 Slide Studio"],["practice","📝 Practice & HW"],["check","✅ Checklist"],["ref","📖 Reference"]];
function renderTabs(){
  document.getElementById("mmTabs").innerHTML = TABS.map(function(t){
    var c = ""; if (t[0]==="curriculum") c = ' <span class="cnt">7</span>';
    if (t[0]==="slides") c = ' <span class="cnt">' + (D.openingDeck.length + D.days.reduce(function(a,d){return a+d.slides.length;},0)) + "</span>";
    var hot = t[0]==="course" ? " hot" : "";
    return '<button class="mm-tab'+hot+(state.lastTab===t[0]?" on":"")+'" data-tab="'+t[0]+'">'+t[1]+c+"</button>";
  }).join("");
  document.querySelectorAll(".mm-tab").forEach(function(b){ b.addEventListener("click", function(){ switchTab(b.dataset.tab); }); });
}
function switchTab(id){
  state.lastTab = id; save();
  if (id==="overview") renderOverview();
  if (id==="curriculum") renderCurriculum();
  if (id==="script"){ document.getElementById("scriptDaySel").value = state.lastDay; renderScriptBody(); }
  if (id==="practice"){ document.getElementById("pracDaySel").value = state.lastDay; renderPracticeBody(); }
  if (id==="slides") renderSlide();
  if (id==="check") renderCheck();
  document.querySelectorAll(".mm-tab").forEach(function(b){ b.classList.toggle("on", b.dataset.tab===id); });
  document.querySelectorAll(".mm-panel").forEach(function(p){ p.classList.toggle("on", p.id==="p-"+id); });
  document.getElementById("mmTabs").scrollIntoView({block:"nearest"});
}
/* ---------- overview ---------- */
function counts(){
  var ready = D.days.filter(function(d){ var s=dayStatus(d.id); return s==="ready"||s==="done"; }).length;
  var done = D.days.filter(function(d){ return dayStatus(d.id)==="done"; }).length;
  var total = D.checklist.length, ck = D.checklist.filter(function(c){return state.checklist[c.id];}).length;
  return { ready:ready, done:done, ck:ck, total:total };
}
function renderOverview(){
  var c = counts();
  var pct = Math.round(c.ready/7*100);
  document.getElementById("ovReady").textContent = c.ready + " / 7 วัน";
  document.getElementById("ovDone").textContent = c.done + " / 7 วัน";
  document.getElementById("ovCheck").textContent = c.ck + " / " + c.total + " ข้อ";
  document.getElementById("ovPct").textContent = pct + "% พร้อมสอน";
  document.getElementById("ovBar").style.width = pct + "%";
  document.getElementById("ovDays").innerHTML = D.days.map(function(d){
    var s = dayStatus(d.id);
    return '<button class="mm-day'+(state.lastDay===d.id?" sel":"")+'" data-day="'+d.id+'"><span class="dnum">DAY 0'+d.id+'</span><h4>'+d.title+'</h4><span class="mm-badge st-'+s+'">'+ST_TH[s]+'</span></button>';
  }).join("");
  document.querySelectorAll("#ovDays .mm-day").forEach(function(b){ b.addEventListener("click", function(){ state.lastDay=+b.dataset.day; save(); renderAll(); switchTab("curriculum"); }); });
  document.getElementById("ovCourse").innerHTML =
    '<div class="mm-meta">' +
    [["Course",D.course.name],["Duration",D.course.sessions+" Sessions / "+D.course.hours+" Hours"],["Session Length",D.course.perSession+" Minutes"],["Learning Format",D.course.format],["Main DAW",D.course.daw],["Status", overallStatus()]].map(function(x){
      return '<div class="mm-stat"><small>'+x[0].toUpperCase()+'</small><strong>'+x[1]+'</strong></div>'; }).join("") + "</div>" +
    '<div class="mm-meter" aria-hidden="true">' + [26,40,18,46,32,52,24,44,36,20,48,30,42,22,50,28,38,34,46,26,40,32,48,24].map(function(h){return '<i style="height:'+h+'px"></i>';}).join("") + "</div>";
}
function overallStatus(){
  var c = counts();
  if (c.done===7) return "Completed";
  if (c.ready===7) return "Ready to Teach";
  return "Preparing";
}
/* ---------- curriculum ---------- */
function renderCurriculum(){
  document.getElementById("currGrid").innerHTML = D.days.map(function(d){
    var s = dayStatus(d.id);
    return '<button class="mm-day'+(state.lastDay===d.id?" sel":"")+'" data-day="'+d.id+'"><span class="dnum">DAY 0'+d.id+' · 120 MIN</span><h4>'+d.title+'</h4><span class="mm-badge st-'+s+'">'+ST_TH[s]+'</span></button>';
  }).join("");
  document.querySelectorAll("#currGrid .mm-day").forEach(function(b){ b.addEventListener("click", function(){ state.lastDay=+b.dataset.day; save(); renderCurriculumDetail(); renderCurriculumSel(); }); });
  renderCurriculumSel(); renderCurriculumDetail();
}
function renderCurriculumSel(){
  document.querySelectorAll("#currGrid .mm-day").forEach(function(b){ b.classList.toggle("sel", +b.dataset.day===state.lastDay); });
}
function renderCurriculumDetail(){
  var d = D.days[state.lastDay-1]; if(!d) return;
  var s = dayStatus(d.id);
  document.getElementById("currDetail").innerHTML =
    '<h3>DAY 0'+d.id+' — '+d.title+'</h3><p class="desc">🎯 '+d.goal+'</p>' +
    '<div class="mm-btnrow"><label style="font-size:13px;color:var(--mm-muted);font-weight:700">สถานะ:&nbsp;<select class="mm-sel" id="dayStatusSel" style="width:auto;display:inline-block">'+
    STATUS.map(function(x){return '<option value="'+x[0]+'"'+(s===x[0]?" selected":"")+'>'+ST_TH[x[0]]+'</option>';}).join("")+'</select></label>'+
    '<button class="mm-btn ghost" data-goto="script">🎙 เปิดบทพูดวันนี้</button>'+
    '<button class="mm-btn ghost" data-goto="slides">🖥 เปิดสไลด์วันนี้</button>'+
    '<button class="mm-btn ghost" data-goto="practice">📝 แบบฝึกหัด/การบ้าน</button></div>'+
    '<div class="mm-sec"><h4>TIMELINE · 120 นาที</h4><ul class="mm-tl">'+
    D.timeline.map(function(t){ return '<li><span class="t num">'+t.t+'</span><details><summary>'+t.act+'</summary><div class="notebox" style="font-size:13.5px;color:var(--mm-muted)">💡 '+t.tip+'</div></details><span class="m num">'+t.min+' นาที</span></li>'; }).join("")+'</ul></div>'+
    '<div class="mm-sec"><h4>TOPICS · หัวข้อหลัก</h4>'+ d.topics.map(function(t){ return '<div class="mm-box" style="margin-bottom:8px"><h4>'+t.n+'</h4><ul>'+t.b.map(function(b){return '<li>'+b+'</li>';}).join("")+'</ul></div>'; }).join("")+'</div>'+
    '<div class="mm-sec"><h4>สิ่งที่ผู้สอนต้องเตรียม</h4><div class="mm-box"><ul>'+d.prep.map(function(p){return '<li>'+p+'</li>';}).join("")+'</ul></div></div>'+
    '<div class="mm-sec"><h4>TEACHING NOTES · บันทึกผู้สอน (DAY 0'+d.id+')</h4><textarea class="mm-ta" id="dayNote" placeholder="จดโน้ตสำหรับวันนี้ เช่น จุดที่ต้องย้ำ ตัวอย่างที่จะเปิด คำถามสำรอง...">'+esc(state.notes["day"+d.id]||"")+'</textarea><div class="mm-save-ok" id="dayNoteOk"></div><div class="mm-btnrow"><button class="mm-btn" id="dayNoteSave">💾 บันทึกโน้ต</button></div></div>';
  document.getElementById("dayStatusSel").addEventListener("change", function(e){ state.dayStatus[d.id]=e.target.value; save("อัปเดตสถานะ Day "+d.id+" แล้ว"); renderAll(); });
  document.querySelectorAll("#currDetail [data-goto]").forEach(function(b){ b.addEventListener("click", function(){ switchTab(b.dataset.goto); }); });
  var ta = document.getElementById("dayNote");
  var t2; ta.addEventListener("input", function(){ clearTimeout(t2); t2=setTimeout(function(){ state.notes["day"+d.id]=ta.value; save(); document.getElementById("dayNoteOk").textContent="✓ บันทึกอัตโนมัติแล้ว"; }, 800); });
  document.getElementById("dayNoteSave").addEventListener("click", function(){ state.notes["day"+d.id]=ta.value; save("บันทึกโน้ต Day "+d.id+" แล้ว"); });
}
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
/* ---------- script ---------- */
function scriptText(d, sc){
  return "DAY 0"+d.id+" "+d.title+" — "+sc.h+"\n\n【เปิดหัวข้อ】\n"+sc.opening+"\n\n【อธิบาย】\n"+sc.explanation+"\n\n【เปรียบเทียบให้เห็นภาพ】\n"+sc.analogy+"\n\n【สาธิตใน FL Studio】\n"+sc.demo+"\n\n【ให้ฟัง】\n"+sc.listening+"\n\n【ถามเช็กความเข้าใจ】\n"+sc.questions+"\n\n【เชื่อมไปหัวข้อถัดไป】\n"+sc.transition;
}
function renderScript(){
  document.getElementById("scriptDaySel").innerHTML = D.days.map(function(d){ return '<option value="'+d.id+'"'+(state.lastDay===d.id?" selected":"")+'>DAY 0'+d.id+' — '+d.title+'</option>'; }).join("");
  renderScriptBody();
  document.getElementById("scriptDaySel").addEventListener("change", function(e){ state.lastDay=+e.target.value; save(); renderScriptBody(); });
}
function renderScriptBody(){
  var d = D.days[state.lastDay-1];
  var full = d.scripts.map(function(sc){ return scriptText(d, sc); }).join("\n\n────────────────\n\n");
  document.getElementById("scriptBody").innerHTML =
    '<div class="mm-btnrow" style="margin:0 0 12px"><button class="mm-btn" id="copyDayScript">📋 Copy บทพูดทั้งวัน</button></div>' +
    d.scripts.map(function(sc,i){
      return '<details class="mm-acc"'+(i===0?" open":"")+ '><summary>'+sc.h+'<span class="pill">หัวข้อ '+(i+1)+'/'+d.scripts.length+'</span></summary><div class="body">'+
      [["เปิดหัวข้อ","opening"],["อธิบาย","explanation"],["เปรียบเทียบ","analogy"],["สาธิต FL Studio","demo"],["ให้ฟัง","listening"],["คำถาม","questions"],["เชื่อมต่อ","transition"]].map(function(f){
        return '<div class="mm-script-field"><b>'+f[0]+'</b><p>'+sc[f[1]]+'</p></div>'; }).join("")+
      '<div class="mm-btnrow"><button class="mm-btn ghost" data-copy="'+i+'">📋 Copy หัวข้อนี้</button></div></div></details>';
    }).join("");
  document.getElementById("copyDayScript").addEventListener("click", function(){ copyText(full, "บทพูด Day "+d.id+" ทั้งวัน"); });
  document.querySelectorAll("#scriptBody [data-copy]").forEach(function(b){ b.addEventListener("click", function(){ var sc=d.scripts[+b.dataset.copy]; copyText(scriptText(d,sc), sc.h); }); });
}
/* ---------- slides ---------- */
function allDecks(){
  var decks = [{ id:"opening", name:"เปิดคอร์ส ("+D.openingDeck.length+" สไลด์)", slides:D.openingDeck }];
  D.days.forEach(function(d){ decks.push({ id:"day"+d.id, name:"Day "+d.id+" ("+d.slides.length+")", slides:d.slides }); });
  return decks;
}
function curDeck(){ var ds=allDecks(); var f=ds.filter(function(x){return x.id===state.slideDeck;}); return f.length?f[0]:ds[0]; }
function renderSlides(){
  document.getElementById("slideDeckSel").innerHTML = allDecks().map(function(x){ return '<option value="'+x.id+'"'+(state.slideDeck===x.id?" selected":"")+'>'+x.name+'</option>'; }).join("");
  document.getElementById("showNotesChk").checked = state.showNotes;
  renderSlide();
  document.getElementById("slideDeckSel").addEventListener("change", function(e){ state.slideDeck=e.target.value; state.slideIdx=0; save(); renderSlide(); });
  document.getElementById("showNotesChk").addEventListener("change", function(e){ state.showNotes=e.target.checked; save(); renderSlide(); });
  document.getElementById("prevSlide").addEventListener("click", function(){ stepSlide(-1); });
  document.getElementById("nextSlide").addEventListener("click", function(){ stepSlide(1); });
  document.getElementById("copySlide").addEventListener("click", function(){ var dk=curDeck(), s=dk.slides[state.slideIdx]; copyText(slideText(dk,s,state.slideIdx), s.title); });
  document.getElementById("presentBtn").addEventListener("click", openPresent);
  document.getElementById("exitPresent").addEventListener("click", closePresent);
  document.getElementById("pPrev").addEventListener("click", function(){ stepSlide(-1); renderPresent(); });
  document.getElementById("pNext").addEventListener("click", function(){ stepSlide(1); renderPresent(); });
  document.addEventListener("keydown", function(e){
    if (!document.getElementById("mmPresent").classList.contains("on")) return;
    if (e.key==="ArrowRight"){ stepSlide(1); renderPresent(); }
    if (e.key==="ArrowLeft"){ stepSlide(-1); renderPresent(); }
    if (e.key==="Escape"){ closePresent(); }
  });
}
function stepSlide(n){ var dk=curDeck(); state.slideIdx=(state.slideIdx+n+dk.slides.length)%dk.slides.length; save(); renderSlide(); }
function slideText(dk,s,i){
  return "สไลด์ "+(i+1)+"/"+dk.slides.length+" — "+s.title+"\nวัตถุประสงค์: "+s.obj+"\n\n"+s.bullets.map(function(b){return "• "+b;}).join("\n")+"\n\nบทพูด: "+s.notes+"\nสาธิต: "+s.demo+"\nคำถาม: "+s.q;
}
function renderSlide(){
  var dk = curDeck(); if (state.slideIdx>=dk.slides.length) state.slideIdx=0;
  var s = dk.slides[state.slideIdx];
  document.getElementById("slidePos").textContent = (state.slideIdx+1)+" / "+dk.slides.length;
  document.getElementById("slideBox").innerHTML =
    '<div class="snum">SLIDE '+(state.slideIdx+1)+' · '+esc(dk.name).toUpperCase()+'</div><h3>'+s.title+'</h3><div class="obj">🎯 '+s.obj+'</div>'+
    '<ul>'+s.bullets.map(function(b){return '<li>'+b+'</li>';}).join("")+'</ul>'+
    '<div class="speaker'+(state.showNotes?"":" hide")+'"><b>🎙 Speaker notes:</b> '+s.notes+'<br><b>🎧 สาธิต:</b> '+s.demo+'</div>'+
    '<div class="q">💬 '+s.q+'</div>';
}
function openPresent(){ document.getElementById("mmPresent").classList.add("on"); document.body.style.overflow="hidden"; renderPresent(); }
function closePresent(){ document.getElementById("mmPresent").classList.remove("on"); document.body.style.overflow=""; }
function renderPresent(){
  var dk = curDeck(); var s = dk.slides[state.slideIdx];
  document.getElementById("pSlide").innerHTML = '<div class="pn">'+esc(dk.name).toUpperCase()+' · '+(state.slideIdx+1)+'/'+dk.slides.length+'</div><h2>'+s.title+'</h2><ul>'+s.bullets.map(function(b){return '<li>'+b+'</li>';}).join("")+'</ul>';
}
/* ---------- practice ---------- */
function renderPractice(){
  document.getElementById("pracDaySel").innerHTML = D.days.map(function(d){ return '<option value="'+d.id+'"'+(state.lastDay===d.id?" selected":"")+'>DAY 0'+d.id+' — '+d.title+'</option>'; }).join("");
  renderPracticeBody();
  document.getElementById("pracDaySel").addEventListener("change", function(e){ state.lastDay=+e.target.value; save(); renderPracticeBody(); });
  var f = state.student;
  ["understand","confused","submitted","feedback","next"].forEach(function(id){
    var el = document.getElementById("st-"+id); if (el && f[id]) el.value = f[id];
    if (el) el.addEventListener("input", function(){ state.student[id]=el.value; save(); document.getElementById("stOk").textContent="✓ บันทึกอัตโนมัติแล้ว"; });
  });
  if (!f.understand && !f.confused && !f.submitted && !f.feedback && !f.next)
    document.getElementById("stEmpty").style.display = "block";
  else document.getElementById("stEmpty").style.display = "none";
  document.getElementById("stReset").addEventListener("click", function(){ if(confirm("ล้างข้อมูล Student Progress ทั้งหมด?")){ state.student={understand:"",confused:"",submitted:"",feedback:"",next:""}; save("ล้างข้อมูลแล้ว"); renderPractice(); } });
}
function renderPracticeBody(){
  var d = D.days[state.lastDay-1];
  document.getElementById("pracBody").innerHTML =
    '<div class="mm-box"><h4>✏️ แบบฝึกหัดระหว่างเรียน (Day '+d.id+')</h4><p>'+d.exercise+'</p></div>'+
    '<div class="mm-box" style="margin-top:10px"><h4>🏠 การบ้าน (Day '+d.id+')</h4><p>'+d.homework+'</p>'+
    '<div class="mm-btnrow"><button class="mm-btn ghost" id="copyHW">📋 Copy การบ้านวันนี้</button></div></div>'+
    '<div class="mm-box" style="margin-top:10px"><h4>📦 ผลงานเมื่อจบคอร์ส (Day 7)</h4><p>Final Mix · Mastered WAV · MP3 สำหรับฟัง · โปรเจกต์ FL Studio ตามขอบเขตที่ตกลง · บันทึก Workflow + Feedback</p></div>';
  document.getElementById("copyHW").addEventListener("click", function(){ copyText("การบ้าน Day "+d.id+" — "+d.title+"\n\nแบบฝึกหัด: "+d.exercise+"\nการบ้าน: "+d.homework, "การบ้าน Day "+d.id); });
}
/* ---------- checklist ---------- */
function renderCheck(){
  var c = counts();
  document.getElementById("checkBar").style.width = Math.round(c.ck/c.total*100)+"%";
  document.getElementById("checkPct").textContent = c.ck+" / "+c.total+" ข้อ";
  document.getElementById("checkList").innerHTML = D.checklist.map(function(x){
    var on = !!state.checklist[x.id];
    return '<li class="'+(on?"done":"")+'" data-ck="'+x.id+'"><input type="checkbox"'+(on?" checked":"")+' aria-label="'+esc(x.t)+'"><span class="ctxt">'+x.t+'<span class="csub">'+x.s+'</span></span></li>';
  }).join("");
  document.querySelectorAll("#checkList li").forEach(function(li){
    li.addEventListener("click", function(e){
      var id = li.dataset.ck;
      state.checklist[id] = !state.checklist[id];
      if (!state.checklist[id]) delete state.checklist[id];
      save(state.checklist[id] ? "✓ เตรียมแล้ว 1 ข้อ" : "ยกเลิก 1 ข้อ"); renderAll();
    });
  });
  document.getElementById("checkReset").addEventListener("click", function(){ if(confirm("ล้าง Checklist ทั้งหมด?")){ state.checklist={}; save("ล้าง Checklist แล้ว"); renderAll(); } });
}
/* ---------- reference ---------- */
function renderRef(){
  var cats = {};
  D.references.forEach(function(r){ (cats[r.cat]=cats[r.cat]||[]).push(r); });
  document.getElementById("refBody").innerHTML = Object.keys(cats).map(function(cat){
    return '<div class="mm-sec"><h4>'+cat.toUpperCase()+'</h4><div class="mm-ref">'+cats[cat].map(function(r){
      return '<a href="'+r.url+'" target="_blank" rel="noopener"><span>📖</span><span><b>'+r.name+'</b><small>'+r.note+'</small><span class="u">'+r.url+'</span></span></a>'; }).join("")+'</div></div>';
  }).join("") +
  '<div class="mm-sec"><h4>NOTES ผู้สอน</h4><textarea class="mm-ta" id="refNote" placeholder="จดโน้ตอ้างอิงเพิ่มเติมของตัวเอง...">'+esc(state.notes.ref||"")+'</textarea><div class="mm-save-ok" id="refNoteOk"></div><div class="mm-btnrow"><button class="mm-btn" id="refNoteSave">💾 บันทึกโน้ต</button></div></div>';
  var ta=document.getElementById("refNote"), t2;
  ta.addEventListener("input", function(){ clearTimeout(t2); t2=setTimeout(function(){ state.notes.ref=ta.value; save(); document.getElementById("refNoteOk").textContent="✓ บันทึกอัตโนมัติแล้ว"; },800); });
  document.getElementById("refNoteSave").addEventListener("click", function(){ state.notes.ref=ta.value; save("บันทึกโน้ตแล้ว"); });
}
/* ---------- boot ---------- */
function renderAll(){ renderOverview(); renderCurriculum(); renderScriptBody(); renderPracticeBody(); renderSlide(); renderCheck(); }
document.addEventListener("DOMContentLoaded", function(){
  renderTabs();
  renderOverview(); renderCurriculum(); renderScript(); renderSlides(); renderPractice(); renderCheck(); renderRef();
  if (!storeOK) toast("คำเตือน: LocalStorage ใช้ไม่ได้ ข้อมูลจะไม่ถูกจำ");
  switchTab(TABS.some(function(t){return t[0]===state.lastTab;}) ? state.lastTab : "overview");
  var el = document.getElementById("saveState"); if (el) el.textContent = storeOK ? "พร้อมใช้งาน · ข้อมูลอยู่ในเครื่องนี้" : "LocalStorage ใช้ไม่ได้";
});
window.MM_COPY = copyText;
})();
