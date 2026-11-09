/* =============================================
   THE EDITORIAL GALLERY — SHARED JAVASCRIPT
   ============================================= */

// ---- THEME: apply before paint to prevent flash ----
(function() {
  const saved = localStorage.getItem('kd-theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

document.addEventListener('DOMContentLoaded', () => {

  // ---- THEME TOGGLE (desktop + mobile) ----
  const themeToggles = document.querySelectorAll('.theme-toggle, .mobile-theme-toggle');
  themeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('kd-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('kd-theme', 'dark');
      }
    });
  });

  // ---- NAVBAR SCROLL ----
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // ---- SCROLL REVEAL ----
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  // ---- PAGE LOAD ANIMATION — applied to <main>, NOT <body> ----
  // Applying transform animations to <body> breaks position:fixed (overlay, navbar)
  // because any transform on an ancestor makes it the containing block for fixed elements.
  const mainEl = document.querySelector('main');
  if (mainEl) mainEl.classList.add('page-transition');

  // ---- NAVIGATION: intercept links for smooth page exit ----
  document.querySelectorAll('a[href$=".html"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        e.preventDefault();
        // Fade out main content only — not body (would break fixed elements)
        const el = document.querySelector('main') || document.body;
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.35s ease';
        setTimeout(() => { window.location.href = href; }, 350);
      }
    });
  });

  // ---- MOBILE NAV MENU ----
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');

  if (menuToggle && mobileMenuOverlay) {
    const drawer = mobileMenuOverlay.querySelector('.mobile-menu-drawer');

    // All items that stagger in: links + book button + theme toggle
    const staggerItems = Array.from(
      mobileMenuOverlay.querySelectorAll('.mobile-link, .btn-book-mobile, .mobile-theme-toggle')
    );

    // Stagger delays in seconds — one per item
    const delays = staggerItems.map((_, i) => 0.06 + i * 0.04);

    function animateIn() {
      // 1. Instantly hide all items (before overlay fades in)
      staggerItems.forEach(el => {
        el.style.transition = 'none';
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
      });

      // 2. Wait two frames so the hidden state is painted, then animate each item in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          staggerItems.forEach((el, i) => {
            el.style.transition =
              `opacity 0.35s ease ${delays[i]}s, transform 0.4s cubic-bezier(0.22,1,0.36,1) ${delays[i]}s`;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          });
        });
      });
    }

    function animateOut() {
      // Clear all inline styles so CSS base takes over (items are hidden by overlay opacity:0)
      staggerItems.forEach(el => {
        el.style.transition = '';
        el.style.opacity = '';
        el.style.transform = '';
      });
    }

    function toggleMenu(forceState) {
      const isOpen = typeof forceState === 'boolean' ? forceState : !menuToggle.classList.contains('open');
      menuToggle.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      mobileMenuOverlay.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';

      if (isOpen) {
        animateIn();
      } else {
        animateOut();
      }
    }

    menuToggle.addEventListener('click', () => toggleMenu());

    // Close when clicking the frosted backdrop (outside the drawer card)
    mobileMenuOverlay.addEventListener('click', (e) => {
      if (drawer && !drawer.contains(e.target)) toggleMenu(false);
    });

    // Close on link tap
    staggerItems.forEach(el => {
      if (el.tagName === 'A') {
        el.addEventListener('click', () => setTimeout(() => toggleMenu(false), 120));
      }
    });

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') toggleMenu(false);
    });
  }



  // ---- ABOUT PAGE SLIDESHOW ----
  // Scoped to .about-hero-img so it never conflicts with other pages
  const slideContainer = document.querySelector('.about-hero-img');
  if (slideContainer) {
    const slides = slideContainer.querySelectorAll('.slide');
    const dots   = slideContainer.querySelectorAll('.dot');
    const counter = slideContainer.querySelector('.slide-counter');
    const total = slides.length;
    let current = 0, timer;

    function pad(n) { return String(n).padStart(2, '0'); }

    function updateCounter() {
      if (counter) counter.textContent = `${pad(current + 1)} / ${pad(total)}`;
    }

    function goTo(next) {
      // Remove active from current
      slides[current].classList.remove('active');
      slides[current].classList.add('prev');
      if (dots[current]) dots[current].classList.remove('active');

      // Clean up prev class after transition finishes
      const leaving = slides[current];
      setTimeout(() => leaving.classList.remove('prev'), 1400);

      current = next;

      // Activate next
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
      updateCounter();
    }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(() => goTo((current + 1) % total), 4500);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index);
        if (idx !== current) { goTo(idx); startTimer(); }
      });
    });

    // Init counter
    updateCounter();
    startTimer();
  }

});

/* =============================================
   LIQUID GLASS — icons + sliding lens
   - Adds a vector icon above every navbar / mobile-menu link name
   - Slides a glass "lens" behind the active (or hovered) tab
   - Same lens is reused by any element with [data-glass-lens]
     e.g. the gallery category picker
   ============================================= */
(function () {
  const svg = (inner) =>
    `<svg class="glass-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;

  const ICONS = {
    home:     '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    gallery:  '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>',
    wedding:  '<circle cx="9" cy="14.5" r="4.8"/><circle cx="15" cy="14.5" r="4.8"/><path d="M10 3.5h4l1.6 2.2L12 9 8.4 5.7z"/>',
    family:   '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.2c2.8-.3 5 1.8 5 4.8"/>',
    haldi:    '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    films:    '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
    about:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.2c1.3-2 3.3-3 5.8-3s4.5 1 5.8 3"/>',
    contact:  '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 8 8 5.5L20 8"/>',
    shop:     '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    section:  '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    // gallery category picker
    all:        '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    portraits:  '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
    landscapes: '<path d="m3 19 6.5-11 4 6.5L16 11l5 8z"/><circle cx="17" cy="6" r="1.6"/>',
    street:     '<path d="M12 3v18"/><path d="M12 5h6l2 2.5-2 2.5h-6"/><path d="M12 13H6l-2 2.5L6 18h6"/>',
    fashion:    '<path d="M12 7.5a2.2 2.2 0 1 0-2.2-2.2"/><path d="M12 7.5v2L3.5 16a1.5 1.5 0 0 0 1 2.6h15a1.5 1.5 0 0 0 1-2.6L12 9.5"/>'
  };

  const FILE_TO_ICON = {
    'index.html': 'home',
    'gallery.html': 'gallery',
    'wedding-gallery.html': 'wedding',
    'family-functions.html': 'family',
    'haldi-mehndi.html': 'haldi',
    'video-gallery.html': 'films',
    'about.html': 'about',
    'contact.html': 'contact',
    'shop.html': 'shop'
  };

  function iconFor(href) {
    const file = (href || '').split('?')[0].split('#')[0].split('/').pop();
    return ICONS[FILE_TO_ICON[file] || 'section'];
  }

  /* Wrap a link's text with an icon. Safe to call twice. */
  function decorateLink(a, mobile) {
    if (a.dataset.glassDone) return;
    a.dataset.glassDone = '1';
    const label = a.textContent.trim();
    const icon = svg(iconFor(a.getAttribute('href')));
    const text = document.createElement('span');
    text.textContent = label;
    a.textContent = '';
    if (mobile) {
      const main = document.createElement('span');
      main.className = 'ml-main';
      main.insertAdjacentHTML('beforeend', icon);
      main.appendChild(text);
      a.appendChild(main);
    } else {
      a.insertAdjacentHTML('beforeend', icon);
      a.appendChild(text);
    }
  }

  /* Sliding glass lens behind the active / hovered item of a container. */
  function initLens(container, itemSel) {
    if (!container || container.dataset.lensReady) return;
    container.dataset.lensReady = '1';

    const lens = document.createElement('span');
    lens.className = 'glass-lens';
    lens.setAttribute('aria-hidden', 'true');
    container.prepend(lens);

    let hovered = null;
    let pressed = null;
    let placedOnce = false;

    const items = () => Array.from(container.querySelectorAll(itemSel));
    const active = () => container.querySelector(itemSel + '.active');

    function place(el) {
      if (!el || !el.offsetWidth) { lens.classList.remove('on'); return; }
      if (!placedOnce) {
        // first placement: snap into position instead of sliding in from 0,0
        lens.style.transition = 'none';
      }
      lens.style.width = el.offsetWidth + 'px';
      lens.style.height = el.offsetHeight + 'px';
      lens.style.setProperty('--lx', el.offsetLeft + 'px');
      lens.style.setProperty('--ly', el.offsetTop + 'px');
      lens.classList.add('on');
      if (!placedOnce) {
        placedOnce = true;
        void lens.offsetWidth;            // flush, then re-enable the CSS transition
        lens.style.transition = '';
      }
    }

    function sync() { place(pressed || hovered || active()); }

    container.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const it = e.target.closest(itemSel);
      if (it && container.contains(it)) { hovered = it; sync(); }
    });
    container.addEventListener('pointerleave', () => { hovered = null; pressed = null; lens.classList.remove('pressed'); sync(); });

    container.addEventListener('pointerdown', (e) => {
      const it = e.target.closest(itemSel);
      if (!it) return;
      pressed = it;
      lens.classList.add('pressed');
      sync();
    });
    const release = () => { pressed = null; lens.classList.remove('pressed'); sync(); };
    container.addEventListener('pointerup', release);
    container.addEventListener('pointercancel', release);

    // Re-sync when classes change (gallery filter clicks) or links are added (admin "sections")
    new MutationObserver((muts) => {
      if (muts.every(m => m.target === lens)) return;
      sync();
    }).observe(container, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(container);
    window.addEventListener('resize', sync);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
    window.addEventListener('load', sync);

    sync();
  }

  document.addEventListener('DOMContentLoaded', () => {
    // ---- Navbar tab bar ----
    const navLinks = document.querySelector('.navbar-links');
    if (navLinks) {
      navLinks.querySelectorAll('a').forEach(a => decorateLink(a, false));
      // links appended later by assets/site-content.js (admin "sections")
      new MutationObserver((muts) => {
        muts.forEach(m => m.addedNodes.forEach(n => {
          if (n.nodeType === 1 && n.tagName === 'A') decorateLink(n, false);
        }));
      }).observe(navLinks, { childList: true });
      initLens(navLinks, 'a');
    }

    // ---- Mobile menu links (icons only, no lens) ----
    const mobileLinks = document.querySelector('.mobile-menu-links');
    if (mobileLinks) {
      mobileLinks.querySelectorAll('a').forEach(a => decorateLink(a, true));
      new MutationObserver((muts) => {
        muts.forEach(m => m.addedNodes.forEach(n => {
          if (n.nodeType === 1 && n.tagName === 'A') decorateLink(n, true);
        }));
      }).observe(mobileLinks, { childList: true });
    }

    // ---- Any glass tab bar on the page, e.g. gallery categories ----
    document.querySelectorAll('[data-glass-lens]').forEach(el => {
      const sel = el.getAttribute('data-glass-lens');
      el.querySelectorAll(sel).forEach(tab => {
        const key = tab.dataset.icon || tab.dataset.filter;
        if (key && ICONS[key] && !tab.querySelector('.glass-icon')) {
          const label = tab.textContent.trim();
          tab.textContent = '';
          tab.insertAdjacentHTML('beforeend', svg(ICONS[key]));
          const t = document.createElement('span');
          t.textContent = label;
          tab.appendChild(t);
        }
      });
      initLens(el, sel);
    });
  });
})();
