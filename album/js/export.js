/* ============================================================
   export.js — builds a single, self-contained HTML file for
   a finished album. The output has no dependency on this
   builder app; it only needs the internet to load photos
   from Cloudinary.
   ============================================================ */

const AlbumExport = (() => {

  function esc(str = '') {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  /** Insert a Cloudinary transformation string right after /upload/ */
  function cld(url, transform) {
    if (!url || !url.includes('/upload/')) return url;
    return url.replace('/upload/', `/upload/${transform}/`);
  }

  function orderedPhotos(album) {
    return [...(album.photos || [])].sort((a, b) => a.order - b.order);
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function buildAlbumHTML(album) {
    const photos = orderedPhotos(album);
    const cover = photos.find(p => p.id === album.coverPhotoId) || photos[0];
    const coverUrl = cover ? cld(cover.url, 'q_auto,f_auto,w_1800') : '';
    const layout = album.layout || 'grid';
    const year = new Date().getFullYear();

    const photoData = photos.map((p, i) => ({
      full: cld(p.url, 'q_auto,f_auto,w_2000'),
      thumb: cld(p.url, 'q_auto,f_auto,c_fill,w_700,h_700'),
      index: i + 1
    }));

    const galleryItems = photoData.map((p, i) => `
      <button class="g-item" data-index="${i}" aria-label="Open photo ${p.index}">
        <img src="${esc(p.thumb)}" loading="lazy" alt="${esc(album.title)} photo ${p.index}">
        <span class="g-item__cap"><span>${String(p.index).padStart(3, '0')}</span></span>
      </button>`).join('\n');

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(album.title)}${album.studioName ? ' — ' + esc(album.studioName) : ''}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${albumCSS()}
</style>
</head>
<body>
  <header class="a-header">
    <div class="a-brand">
      ${album.logoUrl ? `<img class="a-logo" src="${esc(album.logoUrl)}" alt="${esc(album.studioName || '')}">` : `<span class="a-studio">${esc(album.studioName || '')}</span>`}
    </div>
    <button class="a-theme" id="theme-toggle" aria-label="Toggle theme">◐</button>
  </header>

  <section class="a-hero">
    ${coverUrl ? `<div class="a-hero__image" style="background-image:url('${esc(coverUrl)}')"></div>` : ''}
    <div class="a-hero__text">
      ${album.eventType ? `<p class="a-eyebrow">${esc(album.eventType)}${album.eventDate ? ' · ' + esc(formatDate(album.eventDate)) : ''}</p>` : ''}
      <h1 class="a-title"><em>${esc(album.title)}</em></h1>
      ${album.clientName ? `<p class="a-client">${esc(album.clientName)}</p>` : ''}
      ${album.description ? `<p class="a-desc">${esc(album.description)}</p>` : ''}
      <p class="a-count">${photos.length} photograph${photos.length === 1 ? '' : 's'}</p>
    </div>
  </section>

  <main class="a-gallery layout-${layout}" id="gallery">
    ${galleryItems || '<p class="a-empty">No photos in this album yet.</p>'}
  </main>

  <footer class="a-footer">
    <p>${esc(album.studioName || '')}</p>
    <p class="a-footer__sub">© ${year}. All rights reserved.</p>
  </footer>

  <!-- Viewer -->
  <div class="viewer" id="viewer" aria-hidden="true">
    <button class="v-close" id="v-close" aria-label="Close">✕</button>
    <button class="v-nav v-prev" id="v-prev" aria-label="Previous photo">←</button>
    <button class="v-nav v-next" id="v-next" aria-label="Next photo">→</button>
    <div class="v-stage" id="v-stage">
      <img id="v-image" alt="">
    </div>
    <div class="v-bar">
      <button class="v-play" id="v-play" aria-label="Toggle slideshow">▶</button>
      <span class="v-counter" id="v-counter"></span>
      <span class="v-hint">Click photo to zoom</span>
    </div>
  </div>

<script>
${albumJS(photoData)}
</script>
</body>
</html>`;
  }

  function albumCSS() {
    return `
:root{
  --paper:#F6F5F1; --paper-raised:#FFFFFF; --ink:#17160F; --ink-soft:#635F52;
  --line:#E1DDD1; --accent:#7C6A46; --accent-ink:#FFFFFF;
  --font-display:'Fraunces',Georgia,serif; --font-body:'Inter',-apple-system,sans-serif;
}
html[data-theme="dark"]{
  --paper:#131210; --paper-raised:#1B1A16; --ink:#EEEAE0; --ink-soft:#A29C8B;
  --line:#322F27; --accent:#C9B084; --accent-ink:#17160F;
}
*{box-sizing:border-box;}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font-body);
  line-height:1.6;-webkit-font-smoothing:antialiased;transition:background .2s ease,color .2s ease;}
img{display:block;max-width:100%;}
button{font-family:inherit;cursor:pointer;}

.a-header{display:flex;align-items:center;justify-content:space-between;
  padding:24px 5vw;position:sticky;top:0;background:var(--paper);z-index:20;border-bottom:1px solid var(--line);}
.a-logo{height:34px;width:auto;}
.a-studio{font-family:var(--font-display);font-style:italic;font-size:1.1rem;}
.a-theme{background:none;border:1px solid var(--line);border-radius:50%;width:34px;height:34px;color:var(--ink);}

.a-hero{padding:64px 5vw 48px;display:grid;gap:40px;grid-template-columns:1.1fr .9fr;align-items:center;}
.a-hero__image{aspect-ratio:4/5;background-size:cover;background-position:center;border-radius:2px;}
.a-eyebrow{color:var(--ink-soft);font-size:.85rem;margin:0 0 10px;letter-spacing:.02em;}
.a-title{font-family:var(--font-display);font-weight:500;font-size:clamp(2rem,4.5vw,3.4rem);line-height:1.08;margin:0 0 14px;}
.a-title em{font-style:italic;font-weight:400;}
.a-client{font-size:1.05rem;margin:0 0 14px;}
.a-desc{color:var(--ink-soft);max-width:46ch;margin:0 0 18px;}
.a-count{color:var(--ink-soft);font-size:.85rem;margin:0;}

.a-gallery{padding:8px 5vw 80px;}
.a-empty{color:var(--ink-soft);text-align:center;padding:60px 0;}

.g-item{position:relative;display:block;width:100%;padding:0;border:none;background:var(--line);overflow:hidden;border-radius:2px;}
.g-item img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease;}
.g-item:hover img{transform:scale(1.03);}
.g-item__cap{position:absolute;left:10px;bottom:10px;color:#fff;font-size:.72rem;letter-spacing:.03em;
  background:rgba(0,0,0,.35);padding:3px 8px;border-radius:2px;opacity:0;transition:opacity .2s ease;}
.g-item:hover .g-item__cap{opacity:1;}

/* --- grid --- */
.layout-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.layout-grid .g-item{aspect-ratio:1;}

/* --- masonry --- */
.layout-masonry{column-count:3;column-gap:6px;}
.layout-masonry .g-item{margin-bottom:6px;break-inside:avoid;}
.layout-masonry .g-item img{height:auto;}

/* --- large grid --- */
.layout-large{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.layout-large .g-item{aspect-ratio:4/3;}

/* --- full-screen gallery --- */
.layout-full .g-item{aspect-ratio:16/9;margin-bottom:6px;}

/* --- slideshow (grid fallback for scrollable thumb strip) --- */
.layout-slideshow{display:flex;gap:6px;overflow-x:auto;padding-bottom:12px;}
.layout-slideshow .g-item{flex:0 0 220px;aspect-ratio:3/4;}

/* --- magazine --- */
.layout-magazine{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;grid-auto-rows:140px;}
.layout-magazine .g-item:nth-child(6n+1){grid-column:span 4;grid-row:span 2;}
.layout-magazine .g-item:nth-child(6n+2){grid-column:span 2;grid-row:span 1;}
.layout-magazine .g-item:nth-child(6n+3){grid-column:span 2;grid-row:span 1;}
.layout-magazine .g-item:nth-child(6n+4){grid-column:span 2;grid-row:span 2;}
.layout-magazine .g-item:nth-child(6n+5){grid-column:span 2;grid-row:span 1;}
.layout-magazine .g-item:nth-child(6n+6){grid-column:span 2;grid-row:span 1;}

@media (max-width:860px){
  .a-hero{grid-template-columns:1fr;padding-top:40px;}
  .layout-grid, .layout-large{grid-template-columns:repeat(2,1fr);}
  .layout-masonry{column-count:2;}
  .layout-magazine{grid-template-columns:repeat(2,1fr);grid-auto-rows:160px;}
  .layout-magazine .g-item{grid-column:span 1 !important;grid-row:span 1 !important;}
}

.a-footer{padding:40px 5vw 60px;border-top:1px solid var(--line);color:var(--ink-soft);font-size:.85rem;}
.a-footer p{margin:0 0 4px;}
.a-footer__sub{font-size:.75rem;}

/* --- viewer --- */
.viewer{position:fixed;inset:0;background:rgba(10,9,6,.96);display:none;z-index:100;}
.viewer.is-open{display:flex;flex-direction:column;}
.v-stage{flex:1;display:flex;align-items:center;justify-content:center;padding:60px 80px;overflow:hidden;}
.v-stage img{max-height:100%;max-width:100%;object-fit:contain;cursor:zoom-in;transition:transform .25s ease;}
.v-stage img.is-zoomed{cursor:zoom-out;transform:scale(1.9);}
.v-close,.v-nav,.v-play{background:none;border:none;color:#EEEAE0;font-size:1.3rem;}
.v-close{position:absolute;top:20px;right:28px;font-size:1.1rem;}
.v-nav{position:absolute;top:50%;transform:translateY(-50%);font-size:1.6rem;padding:14px;opacity:.75;}
.v-nav:hover{opacity:1;}
.v-prev{left:12px;} .v-next{right:12px;}
.v-bar{display:flex;align-items:center;justify-content:center;gap:18px;padding:16px;color:#C9C4B6;font-size:.8rem;}
.v-counter{font-variant-numeric:tabular-nums;}
.v-hint{color:#8b8676;display:none;}
@media (min-width:640px){ .v-hint{display:inline;} }
`;
  }

  function albumJS(photoData) {
    return `
(function(){
  var PHOTOS = ${JSON.stringify(photoData)};

  // theme
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem('kab_theme'); } catch(e){}
  if (stored) root.setAttribute('data-theme', stored);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme','dark');
  document.getElementById('theme-toggle').addEventListener('click', function(){
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('kab_theme', next); } catch(e){}
  });

  // viewer
  var viewer = document.getElementById('viewer');
  var vImage = document.getElementById('v-image');
  var vCounter = document.getElementById('v-counter');
  var current = 0;
  var slideshowTimer = null;

  function show(i){
    current = (i + PHOTOS.length) % PHOTOS.length;
    vImage.src = PHOTOS[current].full;
    vImage.classList.remove('is-zoomed');
    vCounter.textContent = (current+1) + ' / ' + PHOTOS.length;
  }
  function open(i){
    show(i);
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function close(){
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    stopSlideshow();
  }
  function next(){ show(current+1); }
  function prev(){ show(current-1); }

  function toggleSlideshow(){
    var btn = document.getElementById('v-play');
    if (slideshowTimer){ stopSlideshow(); }
    else {
      btn.textContent = '❚❚';
      slideshowTimer = setInterval(next, 2600);
    }
  }
  function stopSlideshow(){
    clearInterval(slideshowTimer);
    slideshowTimer = null;
    var btn = document.getElementById('v-play');
    if (btn) btn.textContent = '▶';
  }

  document.querySelectorAll('.g-item').forEach(function(el){
    el.addEventListener('click', function(){ open(parseInt(el.dataset.index,10)); });
  });
  document.getElementById('v-close').addEventListener('click', close);
  document.getElementById('v-prev').addEventListener('click', function(){ stopSlideshow(); prev(); });
  document.getElementById('v-next').addEventListener('click', function(){ stopSlideshow(); next(); });
  document.getElementById('v-play').addEventListener('click', toggleSlideshow);
  vImage.addEventListener('click', function(){ vImage.classList.toggle('is-zoomed'); });
  viewer.addEventListener('click', function(e){ if (e.target === viewer) close(); });

  document.addEventListener('keydown', function(e){
    if (!viewer.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight'){ stopSlideshow(); next(); }
    if (e.key === 'ArrowLeft'){ stopSlideshow(); prev(); }
  });
})();
`;
  }

  function downloadAlbum(album) {
    const html = buildAlbumHTML(album);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const safeName = (album.title || 'album').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName || 'album'}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return { buildAlbumHTML, downloadAlbum };
})();
