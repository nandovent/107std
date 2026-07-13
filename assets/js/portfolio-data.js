(() => {
  const root=document.querySelector('#portfolio-categories');
  if(!root)return;

  const BASE_CATEGORIES=['Filmes Institucionais','Videoclipes'];

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[c]));

  const parseVideo=(url)=>{
    const text=String(url||'').trim();

    const youtube=
      text.match(/youtu\.be\/([A-Za-z0-9_-]+)/)||
      text.match(/[?&]v=([A-Za-z0-9_-]+)/)||
      text.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/);

    if(youtube){
      const id=youtube[1];
      return{
        platform:'YouTube',
        embed:`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        thumb:`https://img.youtube.com/vi/${id}/hqdefault.jpg`
      };
    }

    const vimeo=text.match(/vimeo\.com\/(?:video\/)?(\d+)/);

    if(vimeo){
      const id=vimeo[1];
      return{
        platform:'Vimeo',
        embed:`https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&badge=0&autopause=0`,
        thumb:`https://vumbnail.com/${id}.jpg`
      };
    }

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

    let index=0;
    let startX=0;
    let deltaX=0;
    let dragging=false;

    const step=()=>{
      if(!slides.length)return 0;
      const gap=parseFloat(getComputedStyle(track).gap||0);
      return slides[0].getBoundingClientRect().width+gap;
    };

    const update=()=>{
      track.style.transform=`translateX(${-index*step()}px)`;
      prev.disabled=slides.length<=1||index===0;
      next.disabled=slides.length<=1||index===slides.length-1;
      expand.disabled=slides.length===0;
    };

    const go=(nextIndex)=>{
      index=Math.max(0,Math.min(slides.length-1,nextIndex));
      update();
    };

    if(!slides.length){
      update();
      return;
    }

    prev.onclick=()=>go(index-1);
    next.onclick=()=>go(index+1);

    viewport.onpointerdown=event=>{
      if(event.target.closest('iframe,button,a'))return;
      dragging=true;
      startX=event.clientX;
      deltaX=0;
      viewport.classList.add('is-dragging');
    };

    viewport.onpointermove=event=>{
      if(dragging)deltaX=event.clientX-startX;
    };

    viewport.onpointerup=viewport.onpointercancel=()=>{
      if(!dragging)return;
      dragging=false;
      viewport.classList.remove('is-dragging');

      if(Math.abs(deltaX)>60){
        go(index+(deltaX<0?1:-1));
      }
    };

    const buildGrid=()=>{
      grid.innerHTML='';

      slides.forEach((slide,slideIndex)=>{
        const button=document.createElement('button');
        button.className='portfolio-grid-card';
        button.type='button';
        button.innerHTML=`
          <div class="portfolio-grid-thumb">
            <img src="${esc(slide.dataset.thumb)}" alt="Miniatura de ${esc(slide.dataset.title)}">
            <span class="portfolio-grid-play">▶</span>
          </div>
          <div class="portfolio-grid-copy">
            <strong>${esc(slide.dataset.title)}</strong>
            <span class="portfolio-grid-description">${esc(slide.dataset.description||"")}</span>
          </div>
        `;

        button.onclick=()=>{
          go(slideIndex);
          modal.classList.remove('is-open');
          document.body.classList.remove('modal-open');
          carousel.scrollIntoView({behavior:'smooth',block:'center'});
        };

        grid.appendChild(button);
      });
    };

    expand.onclick=()=>{
      buildGrid();
      modal.classList.add('is-open');
      document.body.classList.add('modal-open');
    };

    modal.querySelectorAll('[data-list-close]').forEach(button=>{
      button.onclick=()=>{
        modal.classList.remove('is-open');
        document.body.classList.remove('modal-open');
      };
    });

    window.addEventListener('resize',update);
    update();
  };

  fetch('../data/portfolio.json',{cache:'no-store'})
    .then(response=>{
      if(!response.ok)throw new Error();
      return response.json();
    })
    .then(items=>{
      const videos=items
        .filter(item=>item.publicado!==false)
        .map(item=>({...item,video:parseVideo(item.link)}))
        .filter(item=>item.video)
        .sort((a,b)=>(a.ordem||999)-(b.ordem||999));

      const groups={};

      BASE_CATEGORIES.forEach(category=>{
        groups[category]=[];
      });

      videos.forEach(video=>{
        const category=video.categoria||'Outros';
        (groups[category]??=[]).push(video);
      });

      root.innerHTML=Object.entries(groups).map(([category,list])=>`
        <section class="panel light reveal visible">
          <div class="category-heading">
            <div>
              <span class="kicker">Categoria</span>
              <h2 class="title">${esc(category)}.</h2>
            </div>
          </div>

          <div class="portfolio-list-shell" data-list-carousel>
            <div class="portfolio-list-actions">
              <div class="portfolio-arrows">
                <button class="portfolio-icon-button" data-list-prev aria-label="Vídeo anterior">←</button>
                <button class="portfolio-icon-button" data-list-next aria-label="Próximo vídeo">→</button>
              </div>
              <button class="portfolio-expand-button" data-list-expand>Expandir</button>
            </div>

            ${
              list.length
                ? `
                  <div class="portfolio-list-viewport">
                    <div class="portfolio-list-track" data-list-track>
                      ${list.map(video=>`
                        <article
                          class="portfolio-list-slide"
                          data-list-slide
                          data-title="${esc(video.titulo)}"
                          data-label="${esc(category)}"
                          data-source="${esc(video.video.platform)}"
                          data-description="${esc(video.descricao)}"
                          data-thumb="${esc(video.video.thumb)}">
                          <div class="video-frame">
                            <iframe
                              src="${esc(video.video.embed)}"
                              title="${esc(video.titulo)}"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowfullscreen
                              loading="lazy"></iframe>
                          </div>

                          <div class="portfolio-info portfolio-info-below">
                            <span class="kicker">${esc(category)}</span>
                            <h3>${esc(video.titulo)}.</h3>
                            <p>${esc(video.descricao)}</p>
                          </div>
                        </article>
                      `).join('')}
                    </div>
                  </div>
                `
                : `
                  <div class="portfolio-empty-category">
                    <strong>Em breve.</strong>
                    <span>Os primeiros vídeos desta categoria serão publicados aqui.</span>
                  </div>
                `
            }
          </div>

          <div class="portfolio-grid-modal" data-list-grid>
            <div class="portfolio-grid-backdrop" data-list-close></div>

            <div class="portfolio-grid-dialog">
              <div class="portfolio-grid-header">
                <div>
                  <span class="kicker">Todos os vídeos</span>
                  <h3>${esc(category)}.</h3>
                </div>
                <button class="portfolio-icon-button" data-list-close>×</button>
              </div>

              <div class="portfolio-grid" data-generated-grid></div>
            </div>
          </div>
        </section>
      `).join('');

      root.querySelectorAll('[data-list-carousel]').forEach(activate);
    })
    .catch(()=>{
      root.innerHTML='<div class="portfolio-empty">Não foi possível carregar o portfólio.</div>';
    });
})();
