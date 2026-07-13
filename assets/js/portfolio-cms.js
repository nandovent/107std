
(() => {
  const root=document.querySelector('#portfolio-categories');
  if(!root)return;

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const parseVideo=(url)=>{
    const t=String(url||'');
    const y=t.match(/youtu\.be\/([A-Za-z0-9_-]+)/)||t.match(/[?&]v=([A-Za-z0-9_-]+)/)||t.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/);
    if(y)return{platform:'YouTube',embed:`https://www.youtube.com/embed/${y[1]}?rel=0&modestbranding=1`,thumb:`https://img.youtube.com/vi/${y[1]}/hqdefault.jpg`};
    const v=t.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if(v)return{platform:'Vimeo',embed:`https://player.vimeo.com/video/${v[1]}?title=0&byline=0&portrait=0&badge=0&autopause=0`,thumb:`https://vumbnail.com/${v[1]}.jpg`};
    return null;
  };

  const activate=(carousel)=>{
    const viewport=carousel.querySelector('.portfolio-list-viewport');
    const track=carousel.querySelector('[data-list-track]');
    const slides=[...carousel.querySelectorAll('[data-list-slide]')];
    const prev=carousel.querySelector('[data-list-prev]');
    const next=carousel.querySelector('[data-list-next]');
    const expand=carousel.querySelector('[data-list-expand]');
    const modal=carousel.parentElement.querySelector('[data-list-grid]');
    const grid=modal.querySelector('[data-generated-grid]');
    let index=0,startX=0,deltaX=0,dragging=false;

    const step=()=>slides.length?slides[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap||0):0;
    const update=()=>{track.style.transform=`translateX(${-index*step()}px)`;prev.disabled=index===0;next.disabled=index===slides.length-1};
    const go=n=>{index=Math.max(0,Math.min(slides.length-1,n));update()};

    prev.onclick=()=>go(index-1); next.onclick=()=>go(index+1);
    viewport.onpointerdown=e=>{if(e.target.closest('iframe,button,a'))return;dragging=true;startX=e.clientX;deltaX=0;viewport.classList.add('is-dragging')};
    viewport.onpointermove=e=>{if(dragging)deltaX=e.clientX-startX};
    viewport.onpointerup=viewport.onpointercancel=()=>{if(!dragging)return;dragging=false;viewport.classList.remove('is-dragging');if(Math.abs(deltaX)>60)go(index+(deltaX<0?1:-1))};

    const buildGrid=()=>{
      grid.innerHTML='';
      slides.forEach((s,i)=>{
        const b=document.createElement('button');
        b.className='portfolio-grid-card'; b.type='button';
        b.innerHTML=`<div class="portfolio-grid-thumb"><img src="${esc(s.dataset.thumb)}" alt="Miniatura de ${esc(s.dataset.title)}"><span class="portfolio-grid-play">▶</span></div><div class="portfolio-grid-copy"><strong>${esc(s.dataset.title)}</strong><span>${esc(s.dataset.label)} · ${esc(s.dataset.source)}</span></div>`;
        b.onclick=()=>{go(i);modal.classList.remove('is-open');document.body.classList.remove('modal-open');carousel.scrollIntoView({behavior:'smooth',block:'center'})};
        grid.appendChild(b);
      });
    };

    expand.onclick=()=>{buildGrid();modal.classList.add('is-open');document.body.classList.add('modal-open')};
    modal.querySelectorAll('[data-list-close]').forEach(b=>b.onclick=()=>{modal.classList.remove('is-open');document.body.classList.remove('modal-open')});
    window.addEventListener('resize',update); update();
  };

  fetch('../data/portfolio.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw new Error();return r.json()})
    .then(items=>{
      const videos=items.filter(x=>x.publicado!==false).map(x=>({...x,video:parseVideo(x.link)})).filter(x=>x.video).sort((a,b)=>(a.ordem||999)-(b.ordem||999));
      const groups={}; videos.forEach(v=>(groups[v.categoria||'Outros']??=[]).push(v));
      root.innerHTML=Object.entries(groups).map(([cat,list])=>`
        <section class="panel light reveal visible">
          <div class="category-heading"><div><span class="kicker">Categoria</span><h2 class="title">${esc(cat)}.</h2></div></div>
          <div class="portfolio-list-shell" data-list-carousel>
            <div class="portfolio-list-actions"><div class="portfolio-arrows"><button class="portfolio-icon-button" data-list-prev>←</button><button class="portfolio-icon-button" data-list-next>→</button></div><button class="portfolio-expand-button" data-list-expand>Expandir</button></div>
            <div class="portfolio-list-viewport"><div class="portfolio-list-track" data-list-track>
              ${list.map(v=>`<article class="portfolio-list-slide" data-list-slide data-title="${esc(v.titulo)}" data-label="${esc(cat)}" data-source="${esc(v.video.platform)}" data-thumb="${esc(v.video.thumb)}"><div class="video-frame"><iframe src="${esc(v.video.embed)}" title="${esc(v.titulo)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div><div class="portfolio-info portfolio-info-below"><span class="kicker">${esc(cat)}</span><h3>${esc(v.titulo)}.</h3><p>${esc(v.descricao)}</p></div></article>`).join('')}
            </div></div>
          </div>
          <div class="portfolio-grid-modal" data-list-grid><div class="portfolio-grid-backdrop" data-list-close></div><div class="portfolio-grid-dialog"><div class="portfolio-grid-header"><div><span class="kicker">Todos os vídeos</span><h3>${esc(cat)}.</h3></div><button class="portfolio-icon-button" data-list-close>×</button></div><div class="portfolio-grid" data-generated-grid></div></div></div>
        </section>`).join('')||'<div class="portfolio-empty">Nenhum vídeo publicado.</div>';
      root.querySelectorAll('[data-list-carousel]').forEach(activate);
    })
    .catch(()=>root.innerHTML='<div class="portfolio-empty">Não foi possível carregar o portfólio.</div>');
})();
