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