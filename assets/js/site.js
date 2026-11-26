/* =========================================================
   107 Studios — Site público v05
   Comportamentos compartilhados por todas as páginas.

   Duas camadas:
   - Fixa (roda uma vez): menu, player da trilha e navegação
     entre páginas sem recarregar (a música não para).
   - Da página (initPage): animações, vídeos, formulários,
     equipe, logos… roda de novo a cada troca de página.
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const store = {
    get: k => { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (_) {} }
  };
  // disponível para scripts específicos de página (ex.: portfólio)
  window.Site = { $, $$, esc, clamp, reduce, isMobile };

  /* =======================================================
     CAMADA FIXA
     ======================================================= */

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
  const setMenu = open => {
    if (!toggle || !menu) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('menu-active', open);
    document.body.classList.toggle('menu-open', open);
  };
  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- player da música tema (fica em todas as páginas) ---------- */
  const music = $('[data-music]');
  const MUSIC_CLOSED = '107-trilha-fechada', MUSIC_POS = '107-trilha-posicao';
  if (music && store.get(MUSIC_CLOSED) !== '1') {
    const audio = $('audio', music), wave = $('[data-music-wave]', music), time = $('[data-music-time]', music);
    const play = $('[data-music-play]', music);
    const peaks = JSON.parse(music.dataset.peaks || '[]');
    const bars = peaks.map((h, k) => `<i style="--h:${h};--k:${k}"></i>`).join('');
    wave.innerHTML = `<div class="wave-bars">${bars}</div><div class="wave-bars wave-fill" aria-hidden="true">${bars}</div>`;
    const dur = () => audio.duration || Number(music.dataset.duration) || 0;
    const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const paint = () => {
      const p = dur() ? audio.currentTime / dur() : 0;
      wave.style.setProperty('--p', p.toFixed(4));
      wave.setAttribute('aria-valuenow', Math.round(audio.currentTime));
      wave.setAttribute('aria-valuetext', `${mmss(audio.currentTime)} de ${mmss(dur())}`);
      time.textContent = `${mmss(audio.currentTime)} / ${mmss(dur())}`;
    };
    const fadeIn = () => {
      audio.volume = 0;
      const t0 = performance.now();
      const step = now => { audio.volume = clamp((now - t0) / 900) * .85; if (audio.volume < .85 && !audio.paused) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const togglePlay = () => { if (audio.paused) audio.play().then(fadeIn).catch(() => {}); else audio.pause(); };
    play.addEventListener('click', togglePlay);
    audio.addEventListener('play', () => { music.classList.add('is-playing'); play.setAttribute('aria-label', 'Pausar a música'); });
    audio.addEventListener('pause', () => { music.classList.remove('is-playing'); play.setAttribute('aria-label', 'Ouvir a música'); });
    ['timeupdate', 'loadedmetadata', 'seeked'].forEach(ev => audio.addEventListener(ev, paint));

    /* posicionar a música (clique, arraste ou setas) */
    const seek = p => {
      if (audio.readyState < 1) {
        audio.preload = 'auto';
        audio.addEventListener('loadedmetadata', () => { audio.currentTime = p * dur(); }, { once: true });
        audio.load();
      } else audio.currentTime = p * dur();
      wave.style.setProperty('--p', p.toFixed(4));
    };
    const seekX = x => { const r = wave.getBoundingClientRect(); seek(clamp((x - r.left) / r.width)); };
    let dragging = false;
    wave.addEventListener('pointerdown', e => { dragging = true; wave.setPointerCapture(e.pointerId); seekX(e.clientX); });
    wave.addEventListener('pointermove', e => { if (dragging) seekX(e.clientX); });
    wave.addEventListener('pointerup', () => { dragging = false; });
    wave.addEventListener('keydown', e => {
      const d = { ArrowRight: 5, ArrowLeft: -5 }[e.key];
      if (d) { e.preventDefault(); audio.currentTime = clamp(audio.currentTime + d, 0, dur()); }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePlay(); }
    });

    $('[data-music-close]', music).addEventListener('click', () => {
      audio.pause();
      music.classList.remove('is-visible');
      store.set(MUSIC_CLOSED, '1');
      setTimeout(() => { music.hidden = true; }, 700);
    });

    /* se a página for recarregada, volta no ponto em que estava (pausada) */
    addEventListener('pagehide', () => { if (audio.currentTime > 1) store.set(MUSIC_POS, String(audio.currentTime)); });
    const saved = Number(store.get(MUSIC_POS));
    if (saved > 1) seek(saved / dur());

    /* controles na tela de bloqueio do celular */
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: music.dataset.title, artist: '107 Studios', artwork: [{ src: $('img', music).src, sizes: '160x160', type: 'image/jpeg' }] });
    }

    music.hidden = false;
    paint();
    setTimeout(() => music.classList.add('is-visible'), 1800);
  }

  /* =======================================================
     CAMADA DA PÁGINA
     ======================================================= */
  const page = {};

  /* números que contam (aceita 1,35M · +2.259% · 21.656 · +500GB) */
  const countUp = el => {
    const raw = el.dataset.count || el.textContent.trim();
    const m = raw.match(/^([^\d]*)([\d.,]+)(.*)$/);
    if (reduce || !m) return;
    const [, pre, num, suf] = m;
    const decimals = num.includes(',') ? num.split(',')[1].length : 0;
    const grouped = /\d\.\d{3}/.test(num);
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

  /* revelar ao rolar */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    $$('[data-count]', e.target).forEach(countUp);
    if (e.target.matches('[data-count]')) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  const observe = root => $$('[data-reveal]', root).forEach(el => io.observe(el));
  Site.observe = observe;

  /* vídeos: versão certa para cada tela, toca só quando aparece */
  const vio = new IntersectionObserver(entries => entries.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) {
      if (!v.getAttribute('src')) v.src = (isMobile && v.dataset.srcMobile) || v.dataset.src || v.dataset.srcDesktop;
      if (v.muted && !v.dataset.userPaused) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }), { rootMargin: '150px 0px' });

  const insta = v => {
    const h = String(v || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/?(\?.*)?$/, '').split('/')[0];
    return /^[A-Za-z0-9._]+$/.test(h) ? { handle: '@' + h, url: `https://www.instagram.com/${h}/` } : null;
  };

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

  const initPage = () => {
    /* entrada dos títulos */
    document.body.classList.remove('is-loaded');
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-loaded')));
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

    observe(document);
    $$('video[data-src],video[data-src-desktop]').forEach(v => vio.observe(v));

    /* filme com som (cases) */
    $$('[data-player]').forEach(root => {
      const v = $('video', root), play = $('[data-play]', root), sound = $('[data-sound]', root);
      const sync = () => {
        play.textContent = v.paused ? 'Reproduzir' : 'Pausar';
        sound.textContent = v.muted ? 'Ativar som' : 'Silenciar';
      };
      play.addEventListener('click', () => {
        if (v.paused) { delete v.dataset.userPaused; v.play().catch(() => {}); } else { v.dataset.userPaused = '1'; v.pause(); }
      });
      sound.addEventListener('click', () => {
        v.muted = !v.muted;
        if (v.paused) v.play().catch(() => {});
        // som do filme e música tema não tocam juntos
        if (!v.muted) $('[data-music] audio')?.pause();
      });
      ['play', 'pause', 'volumechange'].forEach(ev => v.addEventListener(ev, sync));
      sync();
    });

    /* pedido de orçamento: monta a mensagem e abre o WhatsApp da 107 */
    $$('[data-orcamento]').forEach(form => {
      const pre = new URLSearchParams(location.search).get('servico');
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

    /* janelas: botão [data-dialog-open="id"] abre <div class="modal" id="id" data-dialog> */
    $$('[data-dialog-open]').forEach(btn => {
      const box = document.getElementById(btn.dataset.dialogOpen);
      if (!box) return;
      const close = () => { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); document.body.classList.remove('menu-open'); btn.focus(); };
      btn.addEventListener('click', () => {
        box.classList.add('is-open'); box.setAttribute('aria-hidden', 'false');
        document.body.classList.add('menu-open');
        $('[data-dialog-close]', box)?.focus();
      });
      $$('[data-dialog-close]', box).forEach(b => b.addEventListener('click', close));
      box.addEventListener('click', e => { if (e.target === box) close(); });
      box.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    });

    /* frase que acende palavra por palavra */
    page.words = $('[data-words]');
    page.wordEls = [];
    if (page.words) {
      const highlight = new Set((page.words.dataset.words || '').split('|').filter(Boolean));
      page.words.innerHTML = page.words.textContent.trim().split(/\s+/)
        .map(w => `<span class="w${highlight.has(w) ? ' hl' : ''}">${esc(w)}</span>`).join(' ');
      page.wordEls = $$('.w', page.words);
    }

    /* subnavegação e topo com vídeo */
    page.subnav = $('[data-subnav]');
    page.subLinks = $$('[data-subnav] a');
    page.subTargets = page.subLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    page.heroMedia = $('.hero [data-hero-media]');

    /* equipe (lida do admin: /data/equipe.json) */
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

    /* carrosséis de logos (clientes e parceiros, lidos de /data/*.json) */
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

    onScroll();
  };

  /* ---------- loop de scroll (lê o estado da página atual) ---------- */
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    updateNav();
    const vh = innerHeight;
    if (page.heroMedia && !reduce) page.heroMedia.style.setProperty('--q', clamp(scrollY / vh).toFixed(4));
    if (page.wordEls?.length) {
      const r = page.words.getBoundingClientRect();
      const n = Math.round((reduce ? 1 : clamp((vh * .85 - r.top) / (r.height + vh * .35))) * page.wordEls.length);
      page.wordEls.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    if (page.subTargets?.length) {
      const bar = page.subnav;
      bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= parseFloat(getComputedStyle(bar).top) + 1);
      let current = 0;
      page.subTargets.forEach((t, i) => { if (t.getBoundingClientRect().top < vh * .35) current = i; });
      const started = page.subTargets[0].getBoundingClientRect().top < vh * .35;
      page.subLinks.forEach((a, i) => {
        const on = started && i === current;
        if (on && !a.classList.contains('is-active')) {
          const row = a.parentElement;
          row.scrollTo({ left: a.offsetLeft - (row.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
        }
        a.classList.toggle('is-active', on);
      });
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);

  /* =======================================================
     NAVEGAÇÃO SEM RECARREGAR
     Troca só o conteúdo da página: menu e player continuam.
     Qualquer falha cai na navegação normal do navegador.
     ======================================================= */
  const KEEP = '[data-nav],[data-menu],[data-music]';
  const cache = new Map();
  const isInternal = a => {
    if (!a || a.target || a.hasAttribute('download') || a.dataset.reload !== undefined) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (/^\/(admin|api|propostas)(\/|$)/.test(url.pathname)) return null;
    if (/\.[a-z0-9]{2,5}$/i.test(url.pathname) && !url.pathname.endsWith('.html')) return null;
    return url;
  };
  const load = url => {
    const key = url.pathname + url.search;
    if (!cache.has(key)) {
      cache.set(key, fetch(key, { headers: { Accept: 'text/html' } })
        .then(r => (r.ok && (r.headers.get('content-type') || '').includes('text/html')) ? r.text() : Promise.reject(r.status))
        .catch(err => { cache.delete(key); throw err; }));
    }
    return cache.get(key);
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let rendered = location.pathname + location.search;

  const swap = (html, url) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!$('main', doc)) throw new Error('sem conteúdo');
    document.title = doc.title;
    ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:url"]', 'meta[property="og:image"]']
      .forEach(sel => { const a = $(sel), b = $(sel, doc); if (a && b) a.replaceWith(b.cloneNode(true)); });
    /* menu: marca a página atual */
    ['.nav-links', '.menu-links'].forEach(sel => { const a = $(sel), b = $(sel, doc); if (a && b) a.innerHTML = b.innerHTML; });
    /* conteúdo: troca tudo menos menu e player */
    [...document.body.children].forEach(el => { if (!el.matches(KEEP)) el.remove(); });
    const scripts = [];
    [...doc.body.children].forEach(el => {
      if (el.matches(KEEP)) return;
      if (el.tagName === 'SCRIPT') { scripts.push(el); return; }
      document.body.appendChild(document.adoptNode(el));
    });
    /* scripts próprios da página (ex.: portfólio, dados) */
    scripts.forEach(old => {
      const s = document.createElement('script');
      [...old.attributes].forEach(at => s.setAttribute(at.name, at.value));
      s.removeAttribute('defer');
      if (!old.src) s.textContent = old.textContent;
      document.body.appendChild(s);
    });
  };

  const go = async (url, { push = true, scroll = null } = {}) => {
    setMenu(false);
    document.documentElement.classList.add('is-leaving');
    try {
      const [html] = await Promise.all([load(url), wait(reduce ? 0 : 220)]);
      if (push) {
        history.replaceState({ ...(history.state || {}), y: scrollY }, '');
        history.pushState({ y: 0 }, '', url.href);
      }
      swap(html, url);
      rendered = url.pathname + url.search;
      initPage();
      const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (scroll !== null) scrollTo(0, scroll);
      else if (target) target.scrollIntoView({ behavior: 'instant' });
      else scrollTo(0, 0);
      const main = $('main');
      if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
    } catch (_) {
      location.href = url.href;
      return;
    } finally {
      requestAnimationFrame(() => document.documentElement.classList.remove('is-leaving'));
    }
  };

  if ('fetch' in window && 'pushState' in history && 'DOMParser' in window) {
    history.scrollRestoration = 'manual';
    history.replaceState({ ...(history.state || {}), y: scrollY }, '');
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      const url = isInternal(a);
      if (!url) return;
      /* âncora na mesma página: deixa o navegador rolar */
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      e.preventDefault();
      if (url.href === location.href) { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
      go(url);
    });
    /* pré-carrega ao passar o mouse ou tocar no link */
    const warm = e => { const url = isInternal(e.target.closest?.('a[href]')); if (url && url.pathname !== location.pathname) load(url).catch(() => {}); };
    document.addEventListener('pointerover', warm, { passive: true });
    document.addEventListener('touchstart', warm, { passive: true });
    addEventListener('popstate', e => {
      /* voltar de uma âncora na mesma página: o navegador cuida */
      if (location.pathname + location.search === rendered) return;
      go(new URL(location.href), { push: false, scroll: e.state?.y ?? 0 });
    });
  }

  initPage();
})();
