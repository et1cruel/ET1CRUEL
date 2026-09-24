
/* ===== 3D tilt on cards ===== */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.proj, .album, .lf, .goal, .tbox, .w').forEach(card=>{
    card.classList.add('tilt3d');
    const shine=document.createElement('div');
    shine.className='shine';
    card.appendChild(shine);
    card.addEventListener('pointermove', e=>{
      const r=card.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width - .5;
      const py=(e.clientY-r.top)/r.height - .5;
      card.style.transform=`perspective(700px) rotateY(${px*10}deg) rotateX(${-py*8}deg) translateZ(6px)`;
    });
    card.addEventListener('pointerleave', ()=>{ card.style.transform=''; });
  });
})();

/* ===== section 3D flip-in on scroll ===== */
const secIO = new IntersectionObserver((es)=>{
  es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('show'); secIO.unobserve(e.target); }
  });
},{threshold:.08});
document.querySelectorAll('section, .hero, .seal-row').forEach(s=>secIO.observe(s));

/* ===== gold dust particles ===== */
(function(){
  const dust = document.getElementById('dust');
  const N = 26;
  for(let i=0;i<N;i++){
    const s = document.createElement('span');
    s.className = 'spark';
    const size = 2 + Math.random()*4;
    s.style.width = size+'px';
    s.style.height = size+'px';
    s.style.left = Math.random()*100+'vw';
    s.style.top = (100 + Math.random()*30)+'vh';
    const dur = 9 + Math.random()*14;
    s.style.animationDuration = dur+'s';
    s.style.animationDelay = (Math.random()*dur)+'s';
    dust.appendChild(s);
  }
})();

/* ===== number counter ===== */
function countUp(el, target, dur, suffix){
  const start = performance.now();
  function tick(now){
    const p = Math.min((now-start)/dur, 1);
    const eased = 1 - Math.pow(1-p, 3);
    const v = Math.round(target * eased);
    el.textContent = v.toLocaleString('th-TH') + (suffix||'');
    if(p<1) requestAnimationFrame(tick);
    else el.classList.add('flash');
  }
  requestAnimationFrame(tick);
}

/* ===== intersection observer ===== */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('show');
    /* chart bars */
    if(el.classList.contains('cbar')){
      const col = el.querySelector('.col');
      col.style.height = el.dataset.h + '%';
      const valEl = el.querySelector('.val');
      setTimeout(()=>countUp(valEl, parseInt(el.dataset.v), 1300), 200);
    }
    /* wallet counters */
    if(el.dataset && el.dataset.count && el.classList.contains('wv')){
      countUp(el, parseInt(el.dataset.count), 1300);
    }
    /* music stat counters */
    if(el.classList.contains('mv') && el.dataset.count){
      countUp(el, parseInt(el.dataset.count), 1100, el.dataset.suffix||'');
    }
    /* goal bars */
    el.querySelectorAll?.('.pb i').forEach(b=>{
      b.style.width = (b.dataset.w||0) + '%';
    });
    io.unobserve(el);
  });
},{threshold:.25});

/* register all animated things */
document.querySelectorAll('.ev, .cbar, .wv, .mv, .proj, .lf, .reveal, .goal, .chip, .sk').forEach(el=>{
  io.observe(el);
});

/* chips + stack tags stagger */
document.querySelectorAll('.income, .tbox').forEach(box=>{
  const items = box.querySelectorAll('.chip, .sk');
  items.forEach((it,i)=>{
    it.style.transitionDelay = (i*90)+'ms';
  });
});

/* seal stamp when visible */
const seal = document.querySelector('.sealbig');
const sealIO = new IntersectionObserver((es)=>{
  es.forEach(e=>{
    if(e.isIntersecting){
      setTimeout(()=>seal.classList.add('stamped'), 350);
      sealIO.unobserve(seal);
    }
  });
},{threshold:.6});
if(seal) sealIO.observe(seal);

