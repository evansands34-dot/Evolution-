(() => {
  const page = document.body?.dataset?.page || 'home';
  if (page !== 'home') return;

  const app = document.getElementById('app');
  if (!app) return;

  const brand = document.querySelector('.brand');
  if (brand) {
    brand.innerHTML = 'Evolution';
    brand.classList.add('brand-plain');
  }

  document.title = 'Evolution';

  const products = window.products || [];
  const money = value => '$' + Number(value).toFixed(2);

  const productMarkup = products.slice(0, 8).map((product) => `
    <article class="evo-card">
      <a href="product.html?id=${encodeURIComponent(product.id)}" aria-label="View ${product.name}">
        <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">
      </a>
      <div class="evo-card-body">
        <span class="evo-card-badge">${product.badge || product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="evo-card-meta">
          <span class="evo-price">${money(product.price)}</span>
          <span class="evo-rating">${product.rating || '★★★★★'}</span>
        </div>
        <div class="evo-card-actions">
          <a class="button secondary" href="product.html?id=${encodeURIComponent(product.id)}">Details</a>
          <button class="button" data-add="${product.id}">Add to cart</button>
        </div>
      </div>
    </article>
  `).join('');

  const main = document.querySelector('.main');
  if (!main) return;

  main.innerHTML = `
    <style>
      .brand-plain {
        font-size: 1.08rem;
        letter-spacing: -0.04em;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
      .brand-plain span {
        display: none;
      }
      .evo-home-fix {
        display: grid;
        gap: 1.5rem;
        padding: 1.1rem 0 0;
      }
      .evo-home-top {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.25rem 0 0.5rem;
      }
      .evo-home-top .eyebrow {
        display: inline-block;
        margin-bottom: 0.6rem;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #f8d46d;
        font-weight: 800;
      }
      .evo-home-top h1 {
        font-size: clamp(2.1rem, 4vw, 4rem);
        line-height: 0.95;
        letter-spacing: -0.06em;
        margin: 0;
        font-weight: 800;
      }
      .evo-home-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .evo-home-actions .button {
        white-space: nowrap;
      }
      .evo-product-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }
      .evo-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 1.25rem;
        overflow: hidden;
        transition: transform 0.18s ease, border-color 0.18s ease;
      }
      .evo-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255,255,255,0.18);
      }
      .evo-card a {
        display: block;
      }
      .evo-card img {
        display: block;
        width: 100%;
        height: 250px;
        object-fit: cover;
        background: #131315;
      }
      .evo-card-body {
        padding: 1rem 1rem 1.05rem;
      }
      .evo-card-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.38rem 0.6rem;
        border-radius: 999px;
        background: rgba(245, 188, 92, 0.12);
        border: 1px solid rgba(245, 188, 92, 0.32);
        color: #f8d46d;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .evo-card h3 {
        margin: 0.8rem 0 0.3rem;
        font-size: 1.18rem;
        line-height: 1.2;
        letter-spacing: -0.04em;
      }
      .evo-card p {
        margin: 0;
        color: rgba(255,255,255,0.7);
        font-size: 0.9rem;
        min-height: 2.75rem;
      }
      .evo-card-meta {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 0.9rem;
      }
      .evo-price {
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.05em;
      }
      .evo-rating {
        color: rgba(255,255,255,0.72);
        font-size: 0.72rem;
      }
      .evo-card-actions {
        display: flex;
        gap: 0.6rem;
        margin-top: 0.95rem;
      }
      .evo-card-actions .button,
      .evo-card-actions .button.secondary {
        flex: 1;
        justify-content: center;
      }
      @media (max-width: 860px) {
        .evo-home-top {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    </style>

    <section class="evo-home-fix">
      <div class="evo-home-top">
        <div>
          <span class="eyebrow">Fresh drops</span>
          <h1>Built for every move.</h1>
        </div>
        <div class="evo-home-actions">
          <a class="button" href="shop.html">Shop all</a>
          <a class="button secondary" href="shop.html?category=footwear">Footwear</a>
        </div>
      </div>

      <div class="evo-product-grid">
        ${productMarkup}
      </div>
    </section>
  `;

  const footer = document.querySelector('.foot');
  if (footer) footer.remove();

  const panel = document.querySelector('.evo-home-fix');
  if (panel) {
    panel.insertAdjacentHTML('beforeend', '<footer class="foot">Evolution · Where style meets motion &nbsp;·&nbsp; Demo storefront. Checkout does not process real payments.</footer>');
  }
})();
