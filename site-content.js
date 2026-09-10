/* ---------------------------------------------------------------
   Kalka Digital — dynamic content loader
   Add this ONE script tag to every page, right before </body>,
   after main.js:

     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="assets/site-content.js"></script>

   It does three jobs, all optional per page:
   1. Always: adds any dashboard-created sections as extra nav links.
   2. If the page has <div data-dynamic-gallery="wedding"></div>,
      fills it with dashboard-uploaded images tagged "wedding".
   3. If the page has <div data-dynamic-videos></div>,
      fills it with dashboard-added YouTube videos.
------------------------------------------------------------------ */

(function () {
  // ---- fill these in after you create your Supabase project ----
  const SUPABASE_URL = 'https://lzrtgzhqfythmmjhgcph.supabase.co/rest/v1/ ';
  const SUPABASE_ANON_KEY = 'sb_publishable_VIXCu1Rlzb-Wu8l4SpeAJw_BVRsxaO';
  // -----------------------------------------------------------------

  if (!window.supabase) return; // supabase-js failed to load, fail quietly
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  document.addEventListener('DOMContentLoaded', async () => {
    await injectNavSections();
    await fillGalleries();
    await fillVideos();
  });

  async function injectNavSections() {
    const { data, error } = await client
      .from('sections')
      .select('slug, nav_label, sort_order')
      .order('sort_order', { ascending: true });
    if (error || !data || !data.length) return;

    const desktopNav = document.querySelector('.navbar-links');
    const mobileNav = document.querySelector('.mobile-menu-links');

    data.forEach((section) => {
      const href = `section.html?slug=${encodeURIComponent(section.slug)}`;

      if (desktopNav) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = section.nav_label;
        desktopNav.appendChild(a);
      }
      if (mobileNav) {
        const a = document.createElement('a');
        a.href = href;
        a.className = 'mobile-link';
        a.textContent = section.nav_label;
        mobileNav.appendChild(a);
      }
    });
  }

  async function fillGalleries() {
    const containers = document.querySelectorAll('[data-dynamic-gallery]');
    if (!containers.length) return;

    for (const container of containers) {
      const tag = container.getAttribute('data-dynamic-gallery');
      const { data, error } = await client
        .from('images')
        .select('url, alt, sort_order')
        .eq('gallery', tag)
        .order('sort_order', { ascending: true });
      if (error || !data) continue;

      data.forEach((img) => {
        const wrap = document.createElement('div');
        wrap.className = 'work-card-img'; // reuses your existing image styling
        const el = document.createElement('img');
        el.src = img.url;
        el.alt = img.alt || '';
        el.loading = 'lazy';
        wrap.appendChild(el);
        container.appendChild(wrap);
      });
    }
  }

  async function fillVideos() {
    const containers = document.querySelectorAll('[data-dynamic-videos]');
    if (!containers.length) return;

    const { data, error } = await client
      .from('videos')
      .select('youtube_id, title, sort_order')
      .order('sort_order', { ascending: true });
    if (error || !data) return;

    containers.forEach((container) => {
      data.forEach((video) => {
        const wrap = document.createElement('div');
        wrap.className = 'dynamic-video-card';
        wrap.innerHTML = `
          <div style="position:relative;padding-top:56.25%;border-radius:10px;overflow:hidden;">
            <iframe
              src="https://www.youtube.com/embed/${video.youtube_id}"
              title="${escapeHtml(video.title || '')}"
              style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy">
            </iframe>
          </div>
          ${video.title ? `<p style="font-size:0.8rem;margin-top:0.5rem;">${escapeHtml(video.title)}</p>` : ''}
        `;
        container.appendChild(wrap);
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
})();
