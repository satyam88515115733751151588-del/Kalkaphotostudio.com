/* =============================================
   SHOP LISTING PAGE LOGIC
   Renders category tabs + product cards from SHOP_PRODUCTS
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('shopGrid');
  const filterBar = document.getElementById('shopFilterBar');
  if (!grid || !filterBar || typeof SHOP_PRODUCTS === 'undefined') return;

  // ---- Build category tabs ----
  const categories = [...new Set(SHOP_PRODUCTS.map(p => p.category))];
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'shop-filter-tab';
    btn.dataset.category = cat;
    btn.textContent = cat;
    filterBar.appendChild(btn);
  });

  // ---- Render product card markup ----
  function cardHTML(p) {
    const cover = p.images && p.images[0] ? p.images[0] : '';
    return `
      <a class="shop-card reveal" href="product.html?id=${encodeURIComponent(p.id)}" data-category="${p.category}">
        <div class="shop-card-img">
          <img src="${cover}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="shop-card-body">
          <span class="shop-card-category">${p.category}</span>
          <h3>${p.name}</h3>
          <div class="shop-card-meta">
            <span class="shop-card-price">${p.price || ''}</span>
            <span class="shop-card-rating">
              <span class="material-symbols-outlined">star</span>${p.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </a>
    `;
  }

  function render(filter) {
    grid.innerHTML = SHOP_PRODUCTS
      .filter(p => filter === 'all' || p.category === filter)
      .map(cardHTML)
      .join('');

    // Re-run scroll reveal + page-nav interception for the freshly injected links,
    // since main.js only wires these up once on DOMContentLoaded.
    const reveals = grid.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => revealObserver.observe(el));

    grid.querySelectorAll('a[href$=".html"], a[href*=".html?"]').forEach(link => {
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

  // ---- Filter tab clicks ----
  filterBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.shop-filter-tab');
    if (!tab) return;
    filterBar.querySelectorAll('.shop-filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    render(tab.dataset.category);
  });

  render('all');
});
