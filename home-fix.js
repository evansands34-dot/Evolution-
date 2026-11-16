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
        gap: 1.25rem;
        padding: 1rem 0 0;
      }
      .evo-product-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.9rem;
      }
      .evo-card {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 1.1rem;
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
        height: 210px;
        object-fit: cover;
        background: #131315;
      }
      .evo-card-body {
        padding: 0.8rem 0.8rem 0.9rem;
      }
      .evo-card-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.3rem 0.55rem;
        border-radius: 999px;
        background: rgba(245, 188, 92, 0.12);
        border: 1px solid rgba(245, 188, 92, 0.32);
        color: #f8d46d;
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .evo-card h3 {
        margin: 0.7rem 0 0.25rem;
        font-size: 1rem;
        line-height: 1.2;
        letter-spacing: -0.04em;
      }
      .evo-card p {
        margin: 0;
        color: rgba(255,255,255,0.7);
        font-size: 0.8rem;
        min-height: 2.3rem;
      }
      .evo-card-meta {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.6rem;
        margin-top: 0.75rem;
      }
      .evo-price {
        font-size: 1.08rem;
        font-weight: 800;
        letter-spacing: -0.05em;
      }
      .evo-rating {
        color: rgba(255,255,255,0.72);
        font-size: 0.7rem;
      }
      .evo-card-actions {
        display: flex;
        gap: 0.45rem;
        margin-top: 0.8rem;
      }
      .evo-card-actions .button,
      .evo-card-actions .button.secondary {
        flex: 1;
        justify-content: center;
        padding: 0.7rem 0.75rem;
        font-size: 0.78rem;
      }
    </style>

    <section class="evo-home-fix">
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
