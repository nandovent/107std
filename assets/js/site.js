/* =========================================================
   107 Studios — Site público v05
   Comportamentos compartilhados por todas as páginas.
   Cada bloco só roda se o elemento existir na página.
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  // disponível para scripts específicos de página (ex.: portfólio)
  window.Site = { $, $$, esc, clamp, reduce, isMobile };

  /* entrada dos títulos */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- nav: some ao descer, volta ao subir ---------- */
  const nav = $('[data-nav]');
  let lastY = scrollY;
  const updateNav = () => {
    if (!nav) return;
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > 300 && y > lastY + 4);
    if (y < lastY - 4 || y < 300) nav.classList.remove('is-hidden');
    lastY = y;
  };

  /* ---------- menu do celular ---------- */
  const toggle = $('[data-menu-toggle]'), menu = $('[data-menu]');
  if (toggle && menu) {
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
  }

  /* ---------- números que contam (aceita 1,35M · +2.259% · 21.656 · +500GB) ---------- */
  const countUp = el => {
    const raw = el.dataset.count || el.textContent.trim();
    const m = raw.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (reduce || !m) return;
    const [, pre, num, suf] = m;
    const hasComma = num.includes(',');
    const grouped = /\d\.\d{3}/.test(num);
    const decimals = hasComma ? num.split(',')[1].length : 0;
    const end = parseFloat(num.replace(/\./g, '').replace(',', '.'));
    if (!isFinite(end) || end === 0) return;
    const fmt = v => v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouped });
    const t0 = performance.now(), dur = 1600;
    const tick = now => {
      const p = clamp((now - t0) / dur);
      el.textContent = pre + fmt(end * (1 - Math.pow(1 - p, 4))) + suf;
      if (p < 1) requestAnimationFrame(tick); else el.textContent = raw;
    };
    requestAnimationFrame(tick);
  };

  /* ---------- revelar ao rolar ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    $$('[data-count]', e.target).forEach(countUp);
    if (e.target.matches('[data-count]')) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  const observe = root => $$('[data-reveal]', root).forEach(el => io.observe(el));
  observe(document);
  Site.observe = observe;

  /* ---------- vídeos: versão certa para cada tela, toca só quando aparece ---------- */
  const vio = new IntersectionObserver(entries => entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) {
      if (!v.getAttribute('src')) v.src = (isMobile && v.dataset.srcMobile) || v.dataset.src || v.dataset.srcDesktop;
      if (v.muted && !v.dataset.userPaused) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }), { rootMargin: '150px 0px' });
  $$('video[data-src],video[data-src-desktop]').forEach(v => vio.observe(v));

  /* player com som (cases) */
  $$('[data-player]').forEach(root => {
    const v = $('video', root), play = $('[data-play]', root), sound = $('[data-sound]', root);
    const sync = () => {
      play.textContent = v.paused ? 'Reproduzir' : 'Pausar';
      sound.textContent = v.muted ? 'Ativar som' : 'Silenciar';
    };
    play.addEventListener('click', () => {
      if (v.paused) { delete v.dataset.userPaused; v.play().catch(() => {}); } else { v.dataset.userPaused = '1'; v.pause(); }
    });
    sound.addEventListener('click', () => { v.muted = !v.muted; if (v.paused) v.play().catch(() => {}); });
    ['play', 'pause', 'volumechange'].forEach(ev => v.addEventListener(ev, sync));
    sync();
  });

  /* ---------- briefing: monta a mensagem e abre o WhatsApp da 107 ---------- */
  $$('[data-briefing]').forEach(form => {
    const params = new URLSearchParams(location.search);
    const pre = params.get('servico');
    if (pre && form.elements.servico) form.elements.servico.value = pre;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = n => (form.elements[n]?.value || '').trim();
      const fields = [['Nome', 'nome'], ['Empresa', 'empresa'], ['Serviço', 'servico'], ['Data / prazo', 'quando'], ['Local', 'local'], ['Investimento previsto', 'investimento']]
        .filter(([, n]) => v(n)).map(([label, n]) => `*${label}:* ${v(n)}`);
      const text = ['Olá, 107! Quero conversar sobre um projeto.', '', ...fields, ...(v('mensagem') ? ['', `*Sobre o projeto:* ${v('mensagem')}`] : [])].join('\n');
      window.open(`https://wa.me/5547996685069?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });
  });

  /* ---------- frase que acende palavra por palavra ---------- */
  const words = $('[data-words]');
  let wordEls = [];
  if (words) {
    const highlight = new Set((words.dataset.words || '').split('|').filter(Boolean));
    words.innerHTML = words.textContent.trim().split(/\s+/)
      .map(w => `<span class="w${highlight.has(w) ? ' hl' : ''}">${esc(w)}</span>`).join(' ');
    wordEls = $$('.w', words);
  }

  /* ---------- subnavegação: marca a seção atual ---------- */
  const subLinks = $$('[data-subnav] a');
  const subTargets = subLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

  /* ---------- loop de scroll ---------- */
  const heroMedia = $('.hero [data-hero-media]');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    updateNav();
    const vh = innerHeight;
    if (heroMedia && !reduce) heroMedia.style.setProperty('--q', clamp(scrollY / vh).toFixed(4));
    if (wordEls.length) {
      const r = words.getBoundingClientRect();
      const n = Math.round((reduce ? 1 : clamp((vh * .85 - r.top) / (r.height + vh * .35))) * wordEls.length);
      wordEls.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (subTargets.length) {
      const bar = $('[data-subnav]');
      bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= parseFloat(getComputedStyle(bar).top) + 1);
      let current = 0;
      subTargets.forEach((t, i) => { if (t.getBoundingClientRect().top < vh * .35) current = i; });
      const started = subTargets[0].getBoundingClientRect().top < vh * .35;
      subLinks.forEach((a, i) => {
        const on = started && i === current;
        if (on && !a.classList.contains('is-active')) {
          const bar = a.parentElement;
          bar.scrollTo({ left: a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
        }
        a.classList.toggle('is-active', on);
      });
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
  const teamGrid = $('[data-team]');
  if (teamGrid) {
    fetch('/data/equipe.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const list = (Array.isArray(data) ? data : []).filter(i => i.publicado !== false).sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
        const featuredIndex = Math.max(0, list.findIndex(x => x.destaque === true));
        teamGrid.classList.add('has-featured');
        teamGrid.innerHTML = list.map((m, i) => {
          const p = insta(m.instagram);
          const tag = p ? 'a' : 'article';
          const attrs = p ? ` href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Instagram de ${esc(m.nome)}"` : '';
          const s = clamp((Number(m.escala) || 100) / 100, .6, 1.7);
          const img = m.arquivo ? `<img src="${esc(m.arquivo)}" alt="${esc(m.nome)}" loading="lazy" decoding="async" style="--s:${s}" onerror="this.remove()">` : '';
          return `<${tag} class="member${i === featuredIndex ? ' featured' : ''}"${attrs} data-reveal style="--d:${(i % 4) * .08}s"><div class="member-photo">${img}</div><div class="member-info"><h3>${esc(m.nome)}</h3><p>${esc(m.funcao)}</p>${p ? `<span class="handle">${esc(p.handle)}</span>` : ''}</div></${tag}>`;
        }).join('');
        observe(teamGrid);
      }).catch(() => {});
  }

  /* ---------- carrosséis de logos (clientes e parceiros, lidos de /data/*.json) ---------- */
  const markDark = img => {
    const check = () => {
      try {
        const c = document.createElement('canvas'); c.width = 48; c.height = 24;
        const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 48, 24);
        const d = x.getImageData(0, 0, 48, 24).data; let sum = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { sum += .3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]; n++; }
        if (n && sum / n < 165) img.classList.add('is-dark');
      } catch (_) { /* imagem de outro domínio: mantém como está */ }
    };
    img.complete && img.naturalWidth ? check() : img.addEventListener('load', check, { once: true });
  };
  $$('[data-logos]').forEach(section => {
    const { logos: src, logosAsset: assetDir, logosApi: api } = section.dataset;
    const track = $('[data-logos-track]', section);
    const url = item => {
      const path = String(item.arquivo || '').replace(/^\/+/, '');
      if (api && assetDir && path.startsWith(assetDir)) return `${api}?asset=${encodeURIComponent(path)}&v=${encodeURIComponent(item.id || 'logo')}`;
      return /^https?:/.test(item.arquivo) ? item.arquivo : '/' + path;
    };
    fetch(src, { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const list = (Array.isArray(data) ? data : []).filter(i => i.publicado !== false && i.arquivo).sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
        if (!list.length) return;
        const reps = Math.max(1, Math.ceil(innerWidth * 1.2 / ((isMobile ? 140 : 180) * list.length)));
        const seq = Array.from({ length: reps }, () => list).flat();
        const group = seq.map(i => {
          const img = `<img src="${esc(url(i))}" alt="${esc(i.nome || 'Logo')}" style="--s:${clamp((Number(i.escala) || 100) / 100, .55, 2.5)}" onerror="this.closest('.logo').remove()">`;
          return i.link ? `<a class="logo" href="${esc(i.link)}" target="_blank" rel="noopener">${img}</a>` : `<div class="logo">${img}</div>`;
        }).join('');
        track.innerHTML = `<div class="marquee-group">${group}</div><div class="marquee-group" aria-hidden="true">${group}</div>`;
        track.style.setProperty('--dur', `${Math.max(18, seq.length * 3)}s`);
        if (track.hasAttribute('data-reverse')) track.style.animationDirection = 'reverse';
        section.hidden = false;
        $$('img', track).forEach(markDark);
      }).catch(() => {});
  });
})();
