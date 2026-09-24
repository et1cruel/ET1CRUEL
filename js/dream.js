/* ============================================================
   阿夢心物語 — DREAM WORLD ENGINE
   โลกแห่งความฝัน : ท้องฟ้าดาว · ออโร่า · ดาวตก · หิ่งห้อย
   คลื่นความฝันตอนคลิก · ตัวอักษรคันจิแห่งความฝัน
   ============================================================ */
(function(){
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;

  /* ---------- canvas setup (ท้องฟ้าอยู่หลังเนื้อหา) ---------- */
  const cv = document.createElement('canvas');
  cv.id = 'dreamSky';
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0;';
  document.body.appendChild(cv);
  document.querySelector('.scroll').style.zIndex = 1;
  const ctx = cv.getContext('2d');
  let W, H, DPR;
  function resize(){
    DPR = Math.min(devicePixelRatio||1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W*DPR; cv.height = H*DPR;
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resize();
  addEventListener('resize', resize);

  const rand = (a,b)=>a+Math.random()*(b-a);
  const GOLD = ['232,209,136','202,165,62','220,192,120','245,227,192'];

  /* ---------- ดาวระยิบ ---------- */
  const stars = Array.from({length:150},()=>({
    x:Math.random(), y:Math.random(), r:rand(.4,1.7),
    tw:rand(.5,2.2), ph:rand(0,Math.PI*2),
    c:GOLD[Math.floor(Math.random()*GOLD.length)]
  }));

  /* ---------- ออโร่าแห่งความฝัน (หมอกสีลอยช้าๆ) ---------- */
  const nebulas = [
    {c:'138,82,21',  r:.55, sx:.00006, sy:.00004, ox:.2,  oy:.15},
    {c:'58,74,107',  r:.5,  sx:.00005, sy:.00006, ox:.75, oy:.3},
    {c:'74,94,58',   r:.45, sx:.00004, sy:.00005, ox:.4,  oy:.75},
    {c:'158,43,30',  r:.4,  sx:.00007, sy:.00003, ox:.85, oy:.8}
  ];

  /* ---------- ดาวตกแห่งความปรารถนา ---------- */
  let meteor = null, nextMeteor = 3000;
  function spawnMeteor(){
    meteor = {
      x:rand(.15,.85)*W, y:rand(-40,H*.3),
      vx:rand(3,6), vy:rand(2.2,4), life:1, trail:[]
    };
  }

  /* ---------- หิ่งห้อยตามเมาส์ (dream fireflies) ---------- */
  const flies = [];
  let mx=-999, my=-999;
  addEventListener('pointermove', e=>{ mx=e.clientX; my=e.clientY;
    if(flies.length<24 && Math.random()<.35)
      flies.push({x:mx+rand(-8,8), y:my+rand(-8,8), vx:rand(-.5,.5), vy:rand(-.7,-.2),
        r:rand(1.2,2.8), life:1, c:GOLD[Math.floor(Math.random()*GOLD.length)]});
  }, {passive:true});

  /* ---------- คลื่นความฝัน (คลิกที่ไหนก็เบ่งบาน) ---------- */
  const ripples = [];
  addEventListener('pointerdown', e=>{
    if(e.target.closest('a,button,input,textarea')) return;
    ripples.push({x:e.clientX, y:e.clientY, r:0, a:1});
    for(let i=0;i<10;i++){
      const ang = rand(0,Math.PI*2), sp = rand(.8,2.6);
      flies.push({x:e.clientX, y:e.clientY, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp-.8,
        r:rand(1.5,3), life:1, c:GOLD[Math.floor(Math.random()*GOLD.length)]});
    }
  });

  /* ---------- ตัวอักษรคันจิแห่งความฝันลอยขึ้น ---------- */
  const DREAM_WORDS = ['夢','光','星','心','愿','雲','音','緣'];
  const glyphs = [];
  setInterval(()=>{
    if(document.hidden || glyphs.length>6) return;
    const g = document.createElement('span');
    g.textContent = DREAM_WORDS[Math.floor(Math.random()*DREAM_WORDS.length)];
    g.style.cssText = `position:fixed;left:${rand(3,92)}vw;bottom:-40px;z-index:2;
      pointer-events:none;font-family:'Zen Old Mincho',serif;font-weight:900;
      font-size:${rand(16,30)}px;color:rgba(232,209,136,${rand(.1,.22)});
      text-shadow:0 0 12px rgba(232,209,136,.25);filter:blur(.4px);`;
    document.body.appendChild(g);
    glyphs.push({el:g, dur:rand(11000,17000), t:0, sway:rand(-30,30)});
  }, 3800);

  /* ---------- main loop ---------- */
  let last = performance.now();
  function frame(now){
    const dt = Math.min(now-last, 50); last = now;
    const t = now*.001;
    ctx.clearRect(0,0,W,H);

    /* ออโร่า */
    nebulas.forEach(n=>{
      const x = (n.ox + Math.sin(t*n.sx*1000)*.12)*W;
      const y = (n.oy + Math.cos(t*n.sy*1000)*.1)*H;
      const rad = Math.max(W,H)*n.r;
      const g = ctx.createRadialGradient(x,y,0, x,y,rad);
      g.addColorStop(0, `rgba(${n.c},${.10+.05*Math.sin(t*.3+n.ox*9)})`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);
    });

    /* ดาวระยิบ */
    stars.forEach(s=>{
      const a = .25 + .75*Math.abs(Math.sin(t*s.tw+s.ph));
      ctx.beginPath();
      ctx.arc(s.x*W, s.y*H, s.r, 0, 7);
      ctx.fillStyle = `rgba(${s.c},${a*.85})`;
      ctx.fill();
      if(s.r>1.2 && a>.8){
        ctx.fillRect(s.x*W-4, s.y*H-.4, 8, .8);
        ctx.fillRect(s.x*W-.4, s.y*H-4, .8, 8);
      }
    });

    /* ดาวตก */
    nextMeteor -= dt;
    if(!meteor && nextMeteor<=0){ spawnMeteor(); nextMeteor = rand(6000,14000); }
    if(meteor){
      meteor.trail.push({x:meteor.x, y:meteor.y});
      if(meteor.trail.length>16) meteor.trail.shift();
      meteor.x += meteor.vx*dt*.06; meteor.y += meteor.vy*dt*.06;
      meteor.life -= dt*.00035;
      meteor.trail.forEach((p,i)=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y, i*.14, 0, 7);
        ctx.fillStyle = `rgba(232,209,136,${i/meteor.trail.length*.5})`;
        ctx.fill();
      });
      ctx.beginPath(); ctx.arc(meteor.x,meteor.y,2.2,0,7);
      ctx.fillStyle = `rgba(245,227,192,${meteor.life})`;
      ctx.fill();
      if(meteor.life<=0 || meteor.x>W+60) meteor = null;
    }

    /* หิ่งห้อย */
    for(let i=flies.length-1;i>=0;i--){
      const f = flies[i];
      f.x += f.vx; f.y += f.vy; f.life -= dt*.0006;
      if(f.life<=0 || f.y<-30){ flies.splice(i,1); continue; }
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, 7);
      ctx.fillStyle = `rgba(${f.c},${f.life*.8})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r*3, 0, 7);
      ctx.fillStyle = `rgba(${f.c},${f.life*.08})`;
      ctx.fill();
    }

    /* คลื่นความฝัน */
    for(let i=ripples.length-1;i>=0;i--){
      const r = ripples[i];
      r.r += dt*.25; r.a -= dt*.0011;
      if(r.a<=0){ ripples.splice(i,1); continue; }
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, 7);
      ctx.strokeStyle = `rgba(220,192,120,${r.a*.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r*.6, 0, 7);
      ctx.strokeStyle = `rgba(158,43,30,${r.a*.25})`;
      ctx.stroke();
    }

    /* คันจิลอย */
    glyphs.forEach((g,i)=>{
      g.t += dt;
      const p = g.t/g.dur;
      if(p>=1){ g.el.remove(); glyphs.splice(i,1); return; }
      g.el.style.transform = `translateY(${-p*innerHeight*1.05}px) translateX(${Math.sin(p*6)*g.sway}px)`;
      g.el.style.opacity = p<.15 ? p/.15 : (1-p);
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
