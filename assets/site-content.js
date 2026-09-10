// assets/site-content.js
// Pulls images (and videos) uploaded via /admin.html out of Supabase and
// injects them into the existing static containers on each page, using the
// same markup/classes as the hand-written cards so they look identical.
(function () {
  const SUPABASE_URL = 'https://lzrtgzhqfythmmjhgcph.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_VIXCu1Rlzb-Wu8l4SpeAJw_BVRsxaOV';

  if (!window.supabase) {
    console.warn('[site-content] Supabase library did not load; skipping dynamic content.');
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function loadImages(galleryKey) {
    const { data, error } = await client
      .from('images')
      .select('*')
      .eq('gallery', galleryKey)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[site-content] Failed to load images for "' + galleryKey + '":', error.message);
      return [];
    }
    return data || [];
  }

  // ---- Main Gallery page (masonry grid, id="gallery-grid") ----
  const galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    loadImages('gallery').then((images) => {
      images.forEach((img) => {
        const caption = escapeHtml(img.alt);
        galleryGrid.insertAdjacentHTML('afterbegin', `
          <a class="masonry-item reveal" data-category="all" href="#" data-title="${caption}">
            <div class="masonry-img">
              <img src="${img.url}" alt="${caption}" />
              <div class="masonry-overlay"></div>
            </div>
            <div class="masonry-meta">
              <h3>${caption || 'Untitled'}</h3><span>New</span>
            </div>
          </a>
        `);
      });
    });
  }

  // ---- Wedding gallery (.story-grid) ----
  const storyGrid = document.querySelector('.story-grid');
  if (storyGrid) {
    loadImages('wedding').then((images) => {
      images.forEach((img) => {
        const caption = escapeHtml(img.alt);
        storyGrid.insertAdjacentHTML('afterbegin', `
          <div class="story-card medium">
            <img src="${img.url}" alt="${caption}">
            <div class="story-overlay">
              <div class="story-meta">
                <span>Wedding</span>
                <h2>${caption || 'Untitled'}</h2>
              </div>
            </div>
          </div>
        `);
      });
    });
  }

  // ---- Family functions (.family-grid) ----
  const familyGrid = document.querySelector('.family-grid');
  if (familyGrid) {
    loadImages('family').then((images) => {
      images.forEach((img) => {
        const caption = escapeHtml(img.alt);
        familyGrid.insertAdjacentHTML('afterbegin', `
          <div class="family-card">
            <img src="${img.url}" alt="${caption}">
            <div class="family-content">
              <span>New</span>
              <h3>${caption || 'Untitled'}</h3>
            </div>
          </div>
        `);
      });
    });
  }

  // ---- Haldi / Mehndi (.film-strip) ----
  const filmStrip = document.querySelector('.film-strip');
  if (filmStrip) {
    loadImages('haldi-mehndi').then((images) => {
      images.forEach((img) => {
        const caption = escapeHtml(img.alt);
        filmStrip.insertAdjacentHTML('afterbegin', `
          <div class="frame">
            <img src="${img.url}" alt="${caption}">
            <div class="frame-info">
              <span>New</span>
              <h3>${caption || 'Untitled'}</h3>
            </div>
          </div>
        `);
      });
    });
  }

  // ---- Home page hero slider (#hero-slider) ----
  const heroSlider = document.getElementById('hero-slider');
  if (heroSlider) {
    loadImages('home').then((images) => {
      if (!images.length) return;
      images.forEach((img) => {
        heroSlider.insertAdjacentHTML('beforeend', `
          <div class="slide">
            <img src="${img.url}" alt="${escapeHtml(img.alt)}" />
            <div class="slide-overlay"></div>
          </div>
        `);
      });
      // Let index.html's slider script know new slides/dots need to be rebuilt
      window.dispatchEvent(new Event('slides-updated'));
    });
  }

  // ---- Navbar: inject a link for every published "section" (present on every page) ----
  const navLinks = document.querySelector('.navbar-links');
  const mobileLinks = document.querySelector('.mobile-menu-links');
  if (navLinks || mobileLinks) {
    client
      .from('sections')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('[site-content] Failed to load sections:', error.message);
          return;
        }
        (data || []).forEach((s) => {
          const href = `section.html?slug=${encodeURIComponent(s.slug)}`;
          const label = escapeHtml(s.nav_label);
          if (navLinks) {
            navLinks.insertAdjacentHTML('beforeend', `<a href="${href}">${label}</a>`);
          }
          if (mobileLinks) {
            mobileLinks.insertAdjacentHTML('beforeend', `<a href="${href}" class="mobile-link">${label}</a>`);
          }
        });
      });
  }

  // ---- Videos (.video-grid) ----
  const videoGrid = document.querySelector('.video-grid');
  if (videoGrid) {
    client
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[site-content] Failed to load videos:', error.message);
          return;
        }
        (data || []).forEach((v) => {
          const title = escapeHtml(v.title);
          videoGrid.insertAdjacentHTML('afterbegin', `
            <div class="video-card">
              <div class="video-frame">
                <a href="${v.youtube_url}" target="_blank" rel="noopener">
                  <img src="https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg">
                </a>
              </div>
              <div class="video-info">
                <span>New</span>
                <h3>${title || 'Untitled'}</h3>
              </div>
            </div>
          `);
        });
      });
  }
})();
