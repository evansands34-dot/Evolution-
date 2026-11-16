(() => {
  'use strict';

  function moveDiscoverNavigation() {
    const header = document.querySelector('.topbar');
    const sidebar = document.querySelector('.sidebar');
    if (!header || !sidebar || document.querySelector('.top-nav')) return;

    const nav = document.createElement('nav');
    nav.className = 'top-nav';
    nav.setAttribute('aria-label', 'Store navigation');

    const label = sidebar.querySelector('.side-title');
    if (label) {
      label.classList.add('top-nav-label');
      nav.append(label);
    }

    sidebar.querySelectorAll('.side-link').forEach(link => nav.append(link));

    const aiTitle = [...sidebar.querySelectorAll('.side-title')].find(item => item.textContent.trim().toLowerCase().includes('smarter'));
    const aiTeaser = sidebar.querySelector('.ai-teaser');
    if (aiTitle) aiTitle.remove();
    if (aiTeaser) {
      aiTeaser.classList.add('top-nav-ai');
      nav.append(aiTeaser);
    }

    header.insertAdjacentElement('afterend', nav);
    sidebar.hidden = true;
    document.querySelector('.layout')?.classList.add('layout-nav-moved');

    const style = document.createElement('style');
    style.textContent = `
      .top-nav {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 0.55rem;
        min-height: 58px;
        padding: 0.65rem clamp(1rem, 3vw, 2.5rem);
        overflow-x: auto;
        background: #171719;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        scrollbar-width: thin;
      }
      .top-nav-label {
        flex: 0 0 auto;
        margin: 0 0.4rem 0 0;
        color: rgba(255,255,255,0.54);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .top-nav .side-link {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 0.45rem;
        margin: 0;
        padding: 0.62rem 0.82rem;
        border: 1px solid transparent;
        border-radius: 999px;
        color: rgba(255,255,255,0.82);
        text-decoration: none;
        white-space: nowrap;
        font-size: 0.88rem;
      }
      .top-nav .side-link:hover,
      .top-nav .side-link.active {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.12);
        color: #fff;
      }
      .top-nav-ai {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        margin-left: auto;
      }
      .top-nav-ai strong,
      .top-nav-ai p { display: none; }
      .top-nav-ai button { white-space: nowrap; }

      /* The moved navigation leaves the main content spanning the full page width. */
      .layout.layout-nav-moved {
        display: block;
        width: 100%;
        max-width: none;
      }
      .layout-nav-moved > .main { width: 100%; }

      /* Keep product images readable in the three-column catalog. */
      .main .evo-product-grid,
      .main .products-grid {
        display: grid !important;
        width: 100% !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        gap: clamp(0.5rem, 1.8vw, 1rem) !important;
        align-items: start;
      }
      .main .evo-product-grid > .evo-card,
      .main .products-grid > .product-card {
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        margin: 0 !important;
        overflow: hidden;
      }
      .main .evo-product-grid .evo-card img,
      .main .products-grid .product-card img.photo {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        aspect-ratio: 1 / 1;
        object-fit: contain !important;
        object-position: center !important;
      }

      /* Keep the header/search from forcing the page wider than the viewport. */
      .topbar { grid-template-columns: max-content minmax(0, 1fr) max-content; }
      .topbar > *, .search-wrap, .top-actions { min-width: 0; }
      .search-wrap { position: relative; }
      .searchbox { width: 100%; min-width: 0; }
      .searchbox input { min-width: 0; }
      .search-results {
        position: absolute;
        z-index: 60;
        top: calc(100% + 8px);
        right: 0;
        left: 0;
        max-height: min(60vh, 420px);
        overflow-y: auto;
        padding: 6px;
        border: 1px solid #38383b;
        border-radius: 12px;
        background: #19191b;
        box-shadow: 0 12px 32px #0009;
      }
      .search-results[hidden] { display: none !important; }
      .search-result {
        display: block;
        padding: 10px 12px;
        border-radius: 8px;
        color: #f5f5f5;
        text-decoration: none;
      }
      .search-result:hover, .search-result:focus-visible { background: #2a2a2d; outline: none; }
      .search-result small { display: block; margin-top: 3px; color: #aaa; }
      .search-empty { padding: 12px; color: #aaa; font-size: .9rem; }

      /* Account choices stay tucked away until the account button is clicked. */
      .profile-menu { display: none !important; }
      .profile-menu.open {
        display: grid !important;
        gap: 4px;
        min-width: 210px;
        padding: 8px;
        border: 1px solid #38383b;
        border-radius: 12px;
        background: #19191b;
        box-shadow: 0 12px 32px #0009;
      }
      .profile-menu a,
      .profile-menu button {
        display: block;
        width: 100%;
        padding: 10px 12px;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: #f5f5f5;
        text-align: left;
        text-decoration: none;
        font: inherit;
        cursor: pointer;
      }
      .profile-menu a:hover,
      .profile-menu button:hover { background: #2a2a2d; }

      @media (max-width: 700px) {
        .top-nav { gap: 0.25rem; padding-inline: 0.75rem; }
        .top-nav-label { display: none; }
        .top-nav .side-link { padding: 0.58rem 0.68rem; font-size: 0.82rem; }
        .top-nav-ai { margin-left: 0.25rem; }
        .topbar { grid-template-columns: minmax(0, 1fr) auto; }
        .topbar .search-wrap { grid-column: 1 / -1; grid-row: 2; width: 100%; }
        .topbar .top-actions { grid-column: 2; grid-row: 1; }
        .topbar .brand { grid-column: 1; grid-row: 1; }
      }
      @media (max-width: 420px) {
        .topbar { grid-template-columns: minmax(0, 1fr) auto; }
        .top-actions { gap: 6px; }
        .profile-button { padding-inline: 7px; }
      }
    `;
    document.head.append(style);
  }

  function wireStoreSearch() {
    const input = document.querySelector('#siteSearch');
    if (!input || input.dataset.searchReady) return;
    input.dataset.searchReady = 'true';

    const wrap = input.closest('.search-wrap') || input.parentElement;
    let results = document.querySelector('#searchResults');
    if (!results) {
      results = document.createElement('div');
      results.id = 'searchResults';
      results.className = 'search-results';
      results.hidden = true;
      wrap.append(results);
    }
    results.setAttribute('role', 'listbox');
    input.setAttribute('aria-controls', results.id);
    input.setAttribute('aria-autocomplete', 'list');

    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();
    const catalog = Array.isArray(window.products) ? window.products : [];

    function render() {
      const query = normalize(input.value);
      if (!query) {
        results.hidden = true;
        results.innerHTML = '';
        input.setAttribute('aria-expanded', 'false');
        return;
      }
      const terms = query.split(/\s+/).filter(Boolean);
      const found = catalog.map(product => {
        const searchable = normalize(`${product.name} ${product.category} ${product.description || ''} ${product.badge || ''}`);
        const score = terms.reduce((total, term) => total + (searchable.includes(term) ? (normalize(product.name).includes(term) ? 3 : 1) : 0), 0);
        return { product, score };
      }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);

      results.innerHTML = found.length ? found.map(({ product }) => `
        <a class="search-result" role="option" href="product.html?id=${encodeURIComponent(product.id)}">
          <span>${escapeHtml(product.name)}</span>
          <small>${escapeHtml(product.category || '')} · $${Number(product.price).toFixed(2)}</small>
        </a>`).join('') : '<div class="search-empty">No matching products found.</div>';
      results.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    input.addEventListener('input', render);
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        results.hidden = true;
        input.setAttribute('aria-expanded', 'false');
      } else if (event.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          event.preventDefault();
          window.location.href = `shop.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
    input.closest('form')?.addEventListener('submit', event => {
      const query = input.value.trim();
      if (!query) return;
      event.preventDefault();
      window.location.href = `shop.html?q=${encodeURIComponent(query)}`;
    });
    document.addEventListener('click', event => {
      if (!wrap.contains(event.target)) {
        results.hidden = true;
        input.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initialize() {
    moveDiscoverNavigation();
    wireStoreSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
