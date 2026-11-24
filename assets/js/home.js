/* 107 Studios — Home v05 */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* entrada do título */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));
  const year = $('[data-year]'); if (year) year.textContent = new Date().getFullYear();

  /* ---------- nav: some ao descer, volta ao subir ---------- */
  const nav = $('[data-nav]');
  let lastY = scrollY;
  const onNav = () => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > 300 && y > lastY + 4);
    if (y < lastY - 4 || y < 300) nav.classList.remove('is-hidden');
    lastY = y;
  };

  /* ---------- menu mobile ---------- */
  const toggle = $('[data-menu-toggle]'), menu = $('[data-menu]');
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('menu-active', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- reveal + contadores ---------- */
  const countUp = el => {
    const end = Number(el.dataset.count) || 0;
    if (reduce || !end) return;
    const t0 = performance.now(), dur = 1600;
    const tick = now => {
      const p = clamp((now - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    $$('[data-count]', e.target).forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  const observeReveals = root => $$('[data-reveal]', root).forEach(el => io.observe(el));
  observeReveals(document);

  /* ---------- vídeo do topo: versão certa para cada tela ---------- */
  const video = $('[data-hero-media] video');
  if (video) {
    video.src = isMobile ? video.dataset.srcMobile : video.dataset.srcDesktop;
    video.play().catch(() => {});
    new IntersectionObserver(([e]) => { e.isIntersecting ? video.play().catch(() => {}) : video.pause(); }).observe(video);
  }

  /* ---------- frase que acende palavra por palavra ---------- */
  const words = $('[data-words]');
  let wordEls = [];
  if (words) {
    const highlight = new Set(['juntos.', 'certo.']);
    words.innerHTML = words.textContent.trim().split(/\s+/)
      .map(w => `<span class="w${highlight.has(w) ? ' hl' : ''}">${esc(w)}</span>`).join(' ');
    wordEls = $$('.w', words);
  }

  /* ---------- loop de scroll ---------- */
  const heroMedia = $('[data-hero-media]');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    onNav();
    const vh = innerHeight;
    if (heroMedia && !reduce) {
      const q = clamp(scrollY / vh);
      heroMedia.style.setProperty('--q', q.toFixed(4));
    }
    if (wordEls.length) {
      const r = words.getBoundingClientRect();
      const p = reduce ? 1 : clamp((vh * .85 - r.top) / (r.height + vh * .35));
      const n = Math.round(p * wordEls.length);
      wordEls.forEach((w, i) => w.classList.toggle('on', i < n));
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  onScroll();

  /* ---------- equipe (lida do admin: /data/equipe.json) ---------- */
  const insta = v => {
    const h = String(v || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/?(\?.*)?$/, '').split('/')[0];
    return /^[A-Za-z0-9._]+$/.test(h) ? { handle: '@' + h, url: `https://www.instagram.com/${h}/` } : null;
  };
  const renderTeam = items => {
    const grid = $('[data-team]'); if (!grid) return;
    const list = items.filter(i => i.publicado !== false).sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
    grid.innerHTML = list.map((m, i) => {
      const p = insta(m.instagram);
      const tag = p ? 'a' : 'article';
      const attrs = p ? ` href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Instagram de ${esc(m.nome)}"` : '';
      const s = clamp((Number(m.escala) || 100) / 100, .6, 1.7);
      const img = m.arquivo ? `<img src="${esc(m.arquivo)}" alt="${esc(m.nome)}" loading="lazy" decoding="async" style="--s:${s}" onerror="this.remove()">` : '';
      const featured = m.destaque === true || (i === 0 && !list.some(x => x.destaque === true));
      return `<${tag} class="member${featured ? ' featured' : ''}"${attrs} data-reveal style="--d:${(i % 4) * 0.08}s"><div class="member-photo">${img}</div><div class="member-info"><h3>${esc(m.nome)}</h3><p>${esc(m.funcao)}</p>${p ? `<span class="handle">${esc(p.handle)}</span>` : ''}</div></${tag}>`;
    }).join('');
    observeReveals(grid);
  };
  fetch('/data/equipe.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject())
    .then(d => renderTeam(Array.isArray(d) ? d : []))
    .catch(() => renderTeam([]));

  /* ---------- clientes (lidos do admin: /data/clientes.json) ---------- */
  const logoUrl = item => {
    const path = String(item.arquivo || '').replace(/^\/+/, '');
    return path.startsWith('assets/clientes/') ? `/api/clientes?asset=${encodeURIComponent(path)}&v=${encodeURIComponent(item.id || 'logo')}` : item.arquivo;
  };
  fetch('/data/clientes.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      const list = (Array.isArray(data) ? data : []).filter(i => i.publicado !== false && i.arquivo).sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
      if (!list.length) return;
      const section = $('[data-clients]'), track = $('[data-clients-track]');
      const per = isMobile ? 140 : 170;
      const reps = Math.max(1, Math.ceil(innerWidth * 1.2 / (per * list.length)));
      const seq = Array.from({ length: reps }, () => list).flat();
      const group = seq.map(i => `<div class="logo"><img src="${esc(logoUrl(i))}" alt="${esc(i.nome || 'Cliente')}" loading="eager" style="--s:${clamp((Number(i.escala) || 100) / 100, .55, 2.5)}" onerror="this.parentElement.remove()"></div>`).join('');
      track.innerHTML = `<div class="marquee-group">${group}</div><div class="marquee-group" aria-hidden="true">${group}</div>`;
      track.style.setProperty('--dur', `${Math.max(18, seq.length * 3)}s`);
      section.hidden = false;
      $$('img', track).forEach(img => {
        const check = () => {
          try {
            const c = document.createElement('canvas'); c.width = 48; c.height = 24;
            const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 48, 24);
            const d = x.getImageData(0, 0, 48, 24).data; let sum = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { sum += .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; n++; }
            if (n && sum / n < 150) img.classList.add('is-dark');
          } catch (_) {}
        };
        img.complete && img.naturalWidth ? check() : img.addEventListener('load', check, { once: true });
      });
    }).catch(() => {});
})();
