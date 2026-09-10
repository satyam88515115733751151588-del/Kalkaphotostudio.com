/* =============================================
   PRODUCT DETAIL PAGE LOGIC
   Reads ?id= from the URL, looks it up in SHOP_PRODUCTS
   (shop-data.js) and renders the Amazon-style layout:
   left = image gallery, right = info + contact,
   below = horizontal "you may also like" scroller.
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  const main = document.getElementById('productMain');
  if (!main || typeof SHOP_PRODUCTS === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const product = getShopProductById(id);

  if (!product) {
    main.innerHTML = `
      <div class="product-not-found reveal">
        <h1>We couldn't find that item</h1>
        <p>It may have been removed, or the link might be incorrect.</p>
        <a href="shop.html" class="btn-contact">Back to Shop</a>
      </div>
    `;
    revealAndRewire(main);
    return;
  }

  document.title = `${product.name} — Kalka digital`;

  const images = product.images && product.images.length ? product.images : [''];
  const whatsappNumber = '919999980621';
  const whatsappMsg = encodeURIComponent(`Hi, I'm interested in "${product.name}" from your shop.`);

  main.innerHTML = `
    <section class="product-detail">
      <div class="product-gallery reveal">
        <div class="product-gallery-main">
          <img id="productMainImg" src="${images[0]}" alt="${product.name}" />
        </div>
        ${images.length > 1 ? `
          <div class="product-gallery-thumbs" id="productThumbs">
            ${images.map((img, i) => `
              <button class="product-gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="View image ${i + 1}">
                <img src="${img}" alt="${product.name} view ${i + 1}" />
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="product-info reveal reveal-delay-1">
        <span class="product-info-category">${product.category}</span>
        <h1>${product.name}</h1>
        <div class="product-info-rating">
          <span class="star-row">${renderStarsHTML(product.rating)}</span>
          <span class="product-info-rating-value">${product.rating.toFixed(1)} (${product.reviewCount} reviews)</span>
        </div>
        ${product.price ? `<div class="product-info-price">${product.price}</div>` : ''}
        <p class="product-info-desc">${product.description}</p>

        <div class="product-contact">
          <span class="product-contact-label">Interested in this piece?</span>
          <div class="product-contact-actions">
            <a class="btn-contact" href="tel:+919999980621">
              <span class="material-symbols-outlined">call</span>
              Contact us: +91 9999980621
            </a>
            <a class="btn-contact outline" href="https://wa.me/${whatsappNumber}?text=${whatsappMsg}" target="_blank" rel="noopener">
              <span class="material-symbols-outlined">chat</span>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="also-like-section reveal reveal-delay-2">
      <div class="also-like-inner">
        <div class="also-like-heading">
          <h2>You may also like</h2>
          <span class="also-like-hint">
            Swipe <span class="material-symbols-outlined">arrow_forward</span>
          </span>
        </div>
        <div class="also-like-track" id="alsoLikeTrack"></div>
      </div>
    </section>
  `;

  // ---- Thumbnail switching ----
  const mainImg = document.getElementById('productMainImg');
  const thumbs = document.querySelectorAll('.product-gallery-thumb');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index, 10);
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = images[idx];
        mainImg.style.opacity = '1';
      }, 150);
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // ---- "You may also like" — everything except the current product ----
  const others = SHOP_PRODUCTS.filter(p => p.id !== product.id);
  const track = document.getElementById('alsoLikeTrack');
  track.innerHTML = others.map(p => `
    <a class="also-like-card" href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="also-like-card-img">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="also-like-card-body">
        <span>${p.category}</span>
        <h4>${p.name}</h4>
      </div>
    </a>
  `).join('');

  revealAndRewire(main);
});

/* Re-run scroll reveal + smooth page-nav interception on content
   that was injected after main.js's own DOMContentLoaded pass ran. */
function revealAndRewire(container) {
  const reveals = container.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => revealObserver.observe(el));

  container.querySelectorAll('a[href$=".html"], a[href*=".html?"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector('main') || document.body;
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.35s ease';
        setTimeout(() => { window.location.href = href; }, 350);
      }
    });
  });
}
