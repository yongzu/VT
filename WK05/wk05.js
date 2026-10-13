(() => {
  // VT 5주차 — IPS WK05 스크립트에서 가설 체인 트리만 덜어 냈다(임시)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const header = document.querySelector('.toolbar');

  // 부드러운 스크롤 — yongzu.github.io와 같은 값(lerp .09, 휠 ×1). 터치는 기본, 동작 줄이기 설정이면 끔
  const lenis = !reduce && window.Lenis ? new Lenis({ lerp: .09, wheelMultiplier: 1, autoRaf: true }) : null;
  const headerOffset = () => header.offsetHeight + 24;
  function layoutTop(el) { let top = 0; for (let n = el; n; n = n.offsetParent) top += n.offsetTop; return top; }
  function scrollToTarget(target) {
    const y = typeof target === 'number' ? target : Math.max(0, layoutTop(target) - headerOffset());
    if (lenis) lenis.scrollTo(y, { force: true }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); scrollToTarget(0); });

  // ---- 섹션: 제목으로 접고 편다. 이 페이지는 처음에 모두 펼쳐 둔다 ----
  const sections = [...document.querySelectorAll('.log-section')].map(sec => {
    const btn = sec.querySelector('.section-toggle'), body = sec.querySelector('.section-body');
    const set = open => { sec.dataset.open = open; btn.setAttribute('aria-expanded', String(open)); body.inert = !open; };
    btn.addEventListener('click', () => set(sec.dataset.open !== 'true'));
    set(true);
    return { sec, set };
  });

  // ---- 행: 호버하면 잠깐 뒤 미리 보고(스크롤 중엔 안 함), 누르면 고정, 여러 개 고정 가능 ----
  const rows = [...document.querySelectorAll('.row')];
  const rowStates = rows.map(row => {
    const title = row.querySelector('.row-title');
    const s = { pinned: false, hover: false, focus: false, timer: 0 };
    s.sync = () => { const open = s.pinned || s.hover || s.focus; row.dataset.open = open; title.setAttribute('aria-expanded', String(open)); };
    title.addEventListener('click', () => { s.pinned = !s.pinned; if (!s.pinned) s.hover = false; clearTimeout(s.timer); s.timer = 0; s.sync(); });
    if (row.dataset.hover !== 'off') {
      const arm = () => { clearTimeout(s.timer); s.timer = setTimeout(() => { s.timer = 0; if (lenis && lenis.isScrolling) return; s.hover = true; s.sync(); }, 180); };
      row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && fine.matches) arm(); });
      row.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && fine.matches && !s.hover && !s.timer) arm(); });
      row.addEventListener('pointerleave', e => { if (e.pointerType !== 'mouse') return; clearTimeout(s.timer); s.timer = setTimeout(() => { s.timer = 0; s.hover = false; s.sync(); }, 150); });
    }
    title.addEventListener('focus', () => { if (title.matches(':focus-visible')) { s.focus = true; s.sync(); } });
    title.addEventListener('blur', () => { s.focus = false; s.sync(); });
    s.sync();
    return s;
  });

  // ---- 스크롤 등장: 한 번에 들어온 것끼리 90ms씩 늦춘다 ----
  if (document.documentElement.classList.contains('has-reveal')) {
    const io = new IntersectionObserver(entries => {
      let i = 0;
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.style.setProperty('--reveal-delay', Math.min(i++, 6) * 90 + 'ms');
        en.target.dataset.reveal = 'in';
        io.unobserve(en.target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: .1 });
    document.querySelectorAll('.identity>*,.log-title,.row').forEach(el => io.observe(el));
  }

  // ---- 목차: 보고 있는 섹션 표시, 누르면 그 섹션을 열고 미끄러져 간다 ----
  const tocLinks = [...document.querySelectorAll('.toc a')];
  const tocTargets = tocLinks.map(a => document.querySelector(a.getAttribute('href')));
  const tocBar = document.querySelector('.toc-bar');
  let barAt = -1;
  function placeTocBar(i, force) {
    if (!tocBar || (i === barAt && !force)) return;
    const was = barAt; barAt = i;
    if (i < 0) { tocBar.style.opacity = '0'; return; }
    const a = tocLinks[i], y = a.offsetTop + 7, h = Math.max(0, a.offsetHeight - 14);
    if (was < 0 || force) { tocBar.style.transition = 'none'; tocBar.style.transform = `translateY(${y}px)`; tocBar.style.height = h + 'px'; tocBar.offsetHeight; tocBar.style.transition = ''; }
    else { tocBar.style.transform = `translateY(${y}px)`; tocBar.style.height = h + 'px'; }
    tocBar.style.opacity = '1';
  }
  document.fonts?.ready.then(() => placeTocBar(barAt, true));
  function updateToc() {
    const line = headerOffset() + 80;
    const atBottom = scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    let current = -1;
    tocTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= line) current = i; });
    if (atBottom) current = tocTargets.length - 1;
    tocLinks.forEach((a, i) => { a.classList.toggle('is-active', i === current); if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    placeTocBar(current);
  }
  tocLinks.forEach((a, i) => a.addEventListener('click', e => { e.preventDefault(); const t = tocTargets[i]; if (!t) return; sections.find(x => x.sec === t)?.set(true); scrollToTarget(t); }));

  // ---- 맨 위로: 한 화면쯤 내려가면 나타난다 ----
  const backTop = document.querySelector('.back-to-top');
  function updateBackTop() { const shown = scrollY > innerHeight * .8; backTop.dataset.shown = shown; backTop.tabIndex = shown ? 0 : -1; }
  backTop.addEventListener('click', () => scrollToTarget(0));
  const onScroll = () => { updateToc(); updateBackTop(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { placeTocBar(barAt, true); onScroll(); });
  onScroll();

  // Esc — 고정한 행을 모두 놓는다
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    rowStates.forEach(s => { clearTimeout(s.timer); s.timer = 0; s.pinned = false; s.hover = false; s.sync(); });
  });
})();
