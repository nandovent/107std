document.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>b.closest('.nav').classList.toggle('open')));const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');o.unobserve(e.target)}}),{threshold:.14});document.querySelectorAll('.reveal').forEach(el=>o.observe(el));
document.querySelectorAll('[data-carousel]').forEach((carousel)=>{
  const viewport=carousel.querySelector('.portfolio-carousel-viewport');
  const track=carousel.querySelector('[data-track]');
  const slides=[...carousel.querySelectorAll('[data-slide]')];
  const prev=carousel.querySelector('[data-prev]');
  const next=carousel.querySelector('[data-next]');
  const current=carousel.querySelector('[data-current]');
  const total=carousel.querySelector('[data-total]');
  const expand=carousel.querySelector('[data-expand]');
  const modal=document.querySelector('[data-grid-modal]');
  let index=0,startX=0,dragX=0,dragging=false;
  const update=()=>{track.style.transform=`translateX(${-index*100}%)`;current.textContent=String(index+1).padStart(2,'0');total.textContent=String(slides.length).padStart(2,'0');prev.disabled=slides.length<=1;next.disabled=slides.length<=1};
  const go=(n)=>{index=Math.max(0,Math.min(slides.length-1,n));update()};
  prev.addEventListener('click',()=>go(index-1));
  next.addEventListener('click',()=>go(index+1));
  viewport.addEventListener('pointerdown',(e)=>{if(e.target.closest('iframe,button,a'))return;dragging=true;startX=e.clientX;dragX=0;viewport.classList.add('is-dragging');viewport.setPointerCapture(e.pointerId)});
  viewport.addEventListener('pointermove',(e)=>{if(dragging)dragX=e.clientX-startX});
  const end=()=>{if(!dragging)return;dragging=false;viewport.classList.remove('is-dragging');if(Math.abs(dragX)>60)go(index+(dragX<0?1:-1))};
  viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
  expand.addEventListener('click',()=>{modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')});
  modal.querySelectorAll('[data-close-grid]').forEach(b=>b.addEventListener('click',()=>{modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}));
  modal.querySelectorAll('[data-grid-index]').forEach(b=>b.addEventListener('click',()=>{go(Number(b.dataset.gridIndex||0));modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');carousel.scrollIntoView({behavior:'smooth',block:'center'})}));
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&modal.classList.contains('is-open')){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}});
  update();
});

document.querySelectorAll('[data-list-carousel]').forEach((carousel)=>{
  const viewport=carousel.querySelector('.portfolio-list-viewport');
  const track=carousel.querySelector('[data-list-track]');
  const slides=[...carousel.querySelectorAll('[data-list-slide]')];
  const prev=carousel.querySelector('[data-list-prev]');
  const next=carousel.querySelector('[data-list-next]');
  const expand=carousel.querySelector('[data-list-expand]');
  const modal=document.querySelector('[data-list-grid]');
  let index=0,startX=0,deltaX=0,dragging=false;

  const step=()=>{
    if(!slides.length)return 0;
    const gap=parseFloat(getComputedStyle(track).gap||0);
    return slides[0].getBoundingClientRect().width+gap;
  };
  const update=()=>{
    track.style.transform=`translateX(${-index*step()}px)`;
    prev.disabled=index===0;
    next.disabled=index===slides.length-1;
  };
  const go=(n)=>{index=Math.max(0,Math.min(slides.length-1,n));update()};

  prev.addEventListener('click',()=>go(index-1));
  next.addEventListener('click',()=>go(index+1));

  viewport.addEventListener('pointerdown',(e)=>{
    if(e.target.closest('iframe,button,a'))return;
    dragging=true;startX=e.clientX;deltaX=0;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove',(e)=>{if(dragging)deltaX=e.clientX-startX});
  const end=()=>{
    if(!dragging)return;
    dragging=false;
    viewport.classList.remove('is-dragging');
    if(Math.abs(deltaX)>60)go(index+(deltaX<0?1:-1));
  };
  viewport.addEventListener('pointerup',end);
  viewport.addEventListener('pointercancel',end);

  expand.addEventListener('click',()=>{
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  });

  modal.querySelectorAll('[data-list-close]').forEach((b)=>b.addEventListener('click',()=>{
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }));

  modal.querySelectorAll('[data-list-grid-index]').forEach((b)=>b.addEventListener('click',()=>{
    go(Number(b.dataset.listGridIndex||0));
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    carousel.scrollIntoView({behavior:'smooth',block:'center'});
  }));

  window.addEventListener('resize',update);
  update();
});
