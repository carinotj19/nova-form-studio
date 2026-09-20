import './styles.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function runLoader() {
  const loader = document.querySelector('[data-loader]');
  const value = document.querySelector('[data-loader-value]');
  const bar = document.querySelector('[data-loader-bar]');
  if (!loader || reduceMotion) {
    loader?.remove();
    document.body.classList.add('is-ready');
    return;
  }

  const started = performance.now();
  const duration = 1250;
  const tick = (now) => {
    const progress = clamp((now - started) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const percent = Math.round(eased * 100);
    value.textContent = `${String(percent).padStart(3, '0')}%`;
    bar.style.transform = `scaleX(${eased})`;
    if (progress < 1) return requestAnimationFrame(tick);
    setTimeout(() => {
      loader.classList.add('loader--done');
      document.body.classList.add('is-ready');
      setTimeout(() => loader.remove(), 700);
    }, 180);
  };
  requestAnimationFrame(tick);
}

function initTheme() {
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const themeColor = document.querySelector('meta[name="theme-color"]');

  const apply = (theme) => {
    root.dataset.theme = theme;
    const light = theme === 'light';
    if (themeColor) themeColor.content = light ? '#f4f2ea' : '#0d0d0b';
    if (toggle) {
      toggle.textContent = light ? 'DARK' : 'LIGHT';
      toggle.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} theme`);
    }
    dispatchEvent(new CustomEvent('novaform:theme', { detail: theme }));
  };
  apply(root.dataset.theme === 'light' ? 'light' : 'dark');

  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('novaform-theme', next); } catch { /* private mode */ }
    apply(next);
  });

  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
    let stored = null;
    try { stored = localStorage.getItem('novaform-theme'); } catch { /* private mode */ }
    if (!stored) apply(event.matches ? 'light' : 'dark');
  });
}

function initTelemetry() {
  const pointerX = document.querySelector('[data-pointer-x]');
  const pointerY = document.querySelector('[data-pointer-y]');
  const scrollPct = document.querySelector('[data-scroll-pct]');
  const sessionTime = document.querySelector('[data-session-time]');
  const cursor = document.querySelector('[data-cursor]');
  let targetX = innerWidth / 2;
  let targetY = innerHeight / 2;
  let x = targetX;
  let y = targetY;

  addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    pointerX.textContent = String(Math.round(event.clientX)).padStart(4, '0');
    pointerY.textContent = String(Math.round(event.clientY)).padStart(4, '0');
    cursor?.classList.add('cursor-orbit--visible');
  }, { passive: true });

  document.querySelectorAll('a, button').forEach((element) => {
    element.addEventListener('pointerenter', () => cursor?.classList.add('cursor-orbit--active'));
    element.addEventListener('pointerleave', () => cursor?.classList.remove('cursor-orbit--active'));
  });

  const updateScroll = () => {
    const range = document.documentElement.scrollHeight - innerHeight;
    const percent = range > 0 ? Math.round((scrollY / range) * 100) : 0;
    scrollPct.textContent = `${String(clamp(percent, 0, 100)).padStart(3, '0')}%`;
  };
  updateScroll();
  addEventListener('scroll', updateScroll, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });

  const sessionStart = Date.now();
  const updateSession = () => {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    sessionTime.textContent = `${minutes}:${seconds}`;
  };
  updateSession();
  setInterval(updateSession, 1000);

  if (reduceMotion || !cursor) return;
  const follow = () => {
    x += (targetX - x) * 0.16;
    y += (targetY - y) * 0.16;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(follow);
  };
  follow();
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  let previousY = scrollY;
  addEventListener('scroll', () => {
    const goingDown = scrollY > previousY;
    header.classList.toggle('site-header--hidden', goingDown && scrollY > 180);
    header.classList.toggle('site-header--scrolled', scrollY > 24);
    previousY = scrollY;
  }, { passive: true });
}

function initReveals() {
  const elements = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('reveal--visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('reveal--visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  elements.forEach((element) => observer.observe(element));
}

const projects = {
  meridian: {
    index: '01 / 04', type: 'EDITORIAL WEB · IDENTITY · INTERACTION', title: 'Project Meridian',
    lead: 'A fictional editorial platform built around clarity, rhythm, and discovery.',
    stats: [['01', 'concept system'], ['03', 'content modes'], ['00', 'client claims']],
    challenge: 'Explore how a dense editorial product can feel structured without becoming rigid or visually quiet.',
    response: 'The concept uses strong typographic hierarchy, modular content blocks, and restrained interaction to keep exploration fast while giving the interface a distinct voice.',
  },
  foundry: {
    index: '02 / 04', type: 'INDUSTRIAL IDENTITY · RESPONSIVE WEB', title: 'Project Foundry',
    lead: 'A fictional industrial brand translated into a sharper digital system.',
    stats: [['01', 'identity study'], ['06', 'layout modules'], ['100%', 'responsive']],
    challenge: 'Create a visual language that feels durable and technical without relying on familiar construction-site clichés.',
    response: 'A grid-led system, bold geometry, and concise content patterns turn the concept into a flexible interface that can scale from capability pages to project stories.',
  },
  careline: {
    index: '03 / 04', type: 'SERVICE DESIGN · ACCESSIBLE WEB', title: 'Project Careline',
    lead: 'A fictional care-service experience designed to feel calm, legible, and human.',
    stats: [['02', 'audience modes'], ['01', 'shared system'], ['AA', 'contrast target']],
    challenge: 'Balance reassurance and usability for an information-heavy service without making the interface feel clinical or generic.',
    response: 'The concept pairs warm editorial spacing with clear navigation, readable content density, and accessible interaction patterns across desktop and mobile.',
  },
  vector: {
    index: '04 / 04', type: 'TECH BRAND · DATA UI · MOTION', title: 'Project Vector',
    lead: 'A fictional technology brand built as one coherent system across product and story.',
    stats: [['03', 'interface layers'], ['01', 'visual language'], ['∞', 'motion loops']],
    challenge: 'Turn technical complexity into an interface that feels energetic while remaining understandable at a glance.',
    response: 'A modular visual language combines data-inspired graphics, motion cues, and reusable components so the identity stays consistent without becoming repetitive.',
  },
};

function initCaseDialog() {
  const dialog = document.querySelector('[data-case-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const fields = {
    index: dialog.querySelector('[data-dialog-index]'), type: dialog.querySelector('[data-dialog-type]'),
    title: dialog.querySelector('[data-dialog-title]'), lead: dialog.querySelector('[data-dialog-lead]'),
    stats: dialog.querySelector('[data-dialog-stats]'), challenge: dialog.querySelector('[data-dialog-challenge]'),
    response: dialog.querySelector('[data-dialog-response]'),
  };
  document.querySelectorAll('[data-project]').forEach((button) => button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    if (!project) return;
    Object.entries(fields).forEach(([key, element]) => {
      if (key !== 'stats') element.textContent = project[key];
    });
    fields.stats.replaceChildren(...project.stats.map(([value, label]) => {
      const item = document.createElement('div');
      const strong = document.createElement('strong');
      const span = document.createElement('span');
      strong.textContent = value;
      span.textContent = label;
      item.append(strong, span);
      return item;
    }));
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }));
  const close = () => {
    dialog.close();
    document.body.classList.remove('dialog-open');
  };
  dialog.querySelector('[data-dialog-close]').addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
}

initTheme();
runLoader();
initTelemetry();
initHeader();
initReveals();
initCaseDialog();
// Code-split: three.js loads behind the loader without blocking first paint.
import('./hero-scene.js').then(({ initHeroScene }) => initHeroScene()).catch(() => {});
