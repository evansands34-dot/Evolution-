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

      /* Keep shop product cards and images aligned like the home grid. */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.9rem;
      }
      .products-grid .product-card {
        min-width: 0;
        overflow: hidden;
      }
      .products-grid .product-card .photo {
        display: block;
        width: 100%;
        height: 210px;
        object-fit: cover;
        object-position: center;
      }

      @media (max-width: 700px) {
        .top-nav { gap: 0.25rem; padding-inline: 0.75rem; }
        .top-nav-label { display: none; }
        .top-nav .side-link { padding: 0.58rem 0.68rem; font-size: 0.82rem; }
        .top-nav-ai { margin-left: 0.25rem; }
      }
    `;
    document.head.append(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moveDiscoverNavigation, { once: true });
  } else {
    moveDiscoverNavigation();
  }
})();
