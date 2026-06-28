/* =============================================
   THE EDITORIAL GALLERY — SHARED JAVASCRIPT
   ============================================= */

// ---- THEME: apply before paint to prevent flash ----
// Dark is default; only switch to light if explicitly saved
(function() {
  const saved = localStorage.getItem('kd-theme');
  if (saved === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
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

  // ---- AURORA NAVBAR OVERLAY ----
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const aurora = document.createElement('canvas');
    aurora.className = 'navbar-aurora';
    aurora.setAttribute('aria-hidden', 'true');
    // Append AFTER other children so it's absolutely positioned on top via z-index
    navbar.appendChild(aurora);

    const ctx = aurora.getContext('2d');
    let raf;

    function resizeAurora() {
      // Use getBoundingClientRect so we get the real rendered size, not flex-distorted offsetWidth
      const rect = navbar.getBoundingClientRect();
      aurora.width  = rect.width;
      aurora.height = rect.height;
    }
    // Defer one frame so navbar is fully painted before measuring
    requestAnimationFrame(resizeAurora);
    window.addEventListener('resize', resizeAurora);

    // Aurora — vivid curtains of light sweeping across the pill
    // Each band sweeps horizontally like a real aurora curtain
    const bands = [
      { cx: 0.08, speed: 0.00055, phase: 0.0,  color: [60,  230, 180], pulseSpeed: 0.0009, pulsePhase: 0.0  },
      { cx: 0.32, speed: 0.00040, phase: 1.8,  color: [40,  160, 255], pulseSpeed: 0.0007, pulsePhase: 1.1  },
      { cx: 0.58, speed: 0.00065, phase: 3.4,  color: [180,  80, 240], pulseSpeed: 0.0011, pulsePhase: 2.3  },
      { cx: 0.82, speed: 0.00048, phase: 5.1,  color: [60,  210, 230], pulseSpeed: 0.0008, pulsePhase: 3.7  },
      { cx: 0.45, speed: 0.00035, phase: 0.9,  color: [120, 255, 160], pulseSpeed: 0.0006, pulsePhase: 4.2  },
    ];

    let last = 0, t = 0;
    function drawAurora(ts) {
      const dt = Math.min(ts - last, 50); // cap dt so a background tab doesn't snap
      last = ts;
      t += dt;

      const w = aurora.width, h = aurora.height;
      ctx.clearRect(0, 0, w, h);

      bands.forEach(b => {
        // Sweep: center x oscillates widely left-to-right across the full pill
        const sweep = Math.sin(t * b.speed + b.phase);
        const cx = (b.cx + sweep * 0.55) * w;

        // Pulse: opacity breathes in and out
        const pulse = 0.55 + 0.45 * Math.sin(t * b.pulseSpeed + b.pulsePhase);

        // Vertical wobble: center y ripples gently
        const cy = h * (0.5 + 0.28 * Math.cos(t * b.speed * 0.7 + b.phase * 1.3));

        // Radius: wide horizontal ellipse — stretch x more than y
        const rx = w * (0.38 + 0.12 * Math.abs(sweep));
        const ry = h * (0.65 + 0.25 * pulse);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / rx); // squash into horizontal ellipse

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        const [r, g, bl] = b.color;
        const alpha = pulse * 0.72;
        grad.addColorStop(0,    `rgba(${r},${g},${bl},${alpha.toFixed(2)})`);
        grad.addColorStop(0.35, `rgba(${r},${g},${bl},${(alpha * 0.5).toFixed(2)})`);
        grad.addColorStop(0.7,  `rgba(${r},${g},${bl},${(alpha * 0.15).toFixed(2)})`);
        grad.addColorStop(1,    `rgba(${r},${g},${bl},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      raf = requestAnimationFrame(drawAurora);
    }
    raf = requestAnimationFrame(drawAurora);
  }
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