/* 107 Studios — Portfólio (lê /data/portfolio.json, cadastrado pelo admin) */
(() => {
  const { $, $$, esc, observe } = window.Site;
  const root = $('[data-portfolio]'), filters = $('[data-filters]'), modal = $('[data-modal]');
  if (!root) return;
  const BASE_CATEGORIES = ['Filmes Institucionais', 'Videoclipes'];
  const slug = t => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const title = t => { const s = String(t || '').trim(); return s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s; };

  const parse = url => {
    const t = String(url || '').trim();
    const yt = t.match(/youtu\.be\/([\w-]+)/) || t.match(/[?&]v=([\w-]+)/) || t.match(/youtube\.com\/(?:embed|shorts)\/([\w-]+)/);
    if (yt) return { platform: 'YouTube', embed: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&autoplay=1&playsinline=1`, thumb: `https://img.youtube.com/vi/${yt[1]}/maxresdefault.jpg`, thumbAlt: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` };
    const vm = t.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return { platform: 'Vimeo', embed: `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0&badge=0&autoplay=1`, thumb: `https://vumbnail.com/${vm[1]}.jpg` };
    return null;
  };

  /* janela do vídeo */
  const frame = $('[data-modal-frame]', modal), mTitle = $('[data-modal-title]', modal), mDesc = $('[data-modal-desc]', modal);
  let lastFocus = null;
  const open = item => {
    lastFocus = document.activeElement;
    frame.innerHTML = `<iframe src="${esc(item.video.embed)}" title="${esc(item.titulo)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    mTitle.textContent = item.titulo || '';
    mDesc.textContent = item.descricao || '';
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    $('[data-modal-close]', modal).focus();
  };
  const close = () => {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    setTimeout(() => { frame.innerHTML = ''; }, 400);
    lastFocus?.focus();
  };
  $('[data-modal-close]', modal).addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) close(); });

  /* setas do carrossel (computador) */
  const wireRail = section => {
    const rail = $('.rail', section), prev = $('[data-prev]', section), next = $('[data-next]', section);
    if (!rail || !prev) return;
    const step = () => (rail.firstElementChild?.getBoundingClientRect().width || 400) + 14;
    const sync = () => {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    };
    prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    sync();
  };

  fetch('/data/portfolio.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      const groups = {};
      BASE_CATEGORIES.forEach(c => { groups[c] = []; });
      (Array.isArray(data) ? data : [])
        .filter(v => v.publicado !== false)
        .map(v => ({ ...v, video: parse(v.link) }))
        .filter(v => v.video)
        .sort((a, b) => (a.ordem || 999) - (b.ordem || 999))
        .forEach(v => {
          const key = Object.keys(groups).find(k => k.toLowerCase() === String(v.categoria || 'Outros').trim().toLowerCase()) || String(v.categoria || 'Outros').trim();
          (groups[key] ??= []).push(v);
        });
      const entries = Object.entries(groups);
      const items = [];

      filters.innerHTML = entries.map(([cat, list]) => `<a href="#${slug(cat)}">${esc(title(cat))}<span>${list.length}</span></a>`).join('');

      root.innerHTML = entries.map(([cat, list], ci) => `
        <section class="cat" id="${slug(cat)}">
          <div class="wrap cat-head" data-reveal>
            <div>
              <span class="eyebrow">${String(ci + 1).padStart(2, '0')} · ${list.length} ${list.length === 1 ? 'vídeo' : 'vídeos'}</span>
              <h2 class="h2">${esc(title(cat))}.</h2>
            </div>
            ${list.length > 1 ? '<div class="rail-nav"><button type="button" data-prev aria-label="Anterior">←</button><button type="button" data-next aria-label="Próximo">→</button></div>' : ''}
          </div>
          ${list.length ? `<div class="rail" data-reveal>${list.map(v => {
            const i = items.push(v) - 1;
            return `<button class="vcard" type="button" data-open="${i}" aria-label="Assistir ${esc(v.titulo)}">
              <div class="vcard-thumb">
                <img src="${esc(v.video.thumb)}" alt="" loading="lazy" decoding="async"${v.video.thumbAlt ? ` onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${v.video.thumbAlt}'}"` : ''}>
                <span class="vcard-tag">${esc(v.video.platform)}</span>
                <span class="vcard-play" aria-hidden="true"></span>
              </div>
              <h3>${esc(v.titulo)}</h3>
              ${v.descricao ? `<p>${esc(v.descricao)}</p>` : ''}
            </button>`;
          }).join('')}</div>` : `<div class="wrap" data-reveal><div class="empty"><strong>Em breve</strong>Os primeiros vídeos desta categoria serão publicados aqui.</div></div>`}
        </section>`).join('');

      $$('[data-open]', root).forEach(b => b.addEventListener('click', () => open(items[+b.dataset.open])));
      $$('.cat', root).forEach(wireRail);
      observe(root);
    })
    .catch(() => { root.innerHTML = '<div class="wrap"><div class="empty"><strong>Não foi possível carregar</strong>Atualize a página em alguns instantes.</div></div>'; });
})();
