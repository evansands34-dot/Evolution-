/* Reliable compact dark demo checkout, replacing the broken/oversized legacy checkout modal. */
(() => {
  'use strict';

  const money = amount => `$${Number(amount || 0).toFixed(2)}`;
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function closeCheckout() {
    document.querySelector('#compactCheckoutOverlay')?.remove();
  }

  function showCheckout() {
    if (document.querySelector('#compactCheckoutOverlay')) return;
    const user = read('evoUser', null);
    if (!user) {
      window.location.href = 'signin.html?next=cart.html';
      return;
    }

    const products = Array.isArray(window.products) ? window.products : [];
    const cart = read('cart', []);
    const items = (Array.isArray(cart) ? cart : []).map(line => {
      const product = products.find(item => Number(item.id) === Number(line.id));
      return product ? { id: product.id, name: product.name, image: product.image, price: Number(product.price) || 0, quantity: Math.max(1, Number(line.quantity) || 1) } : null;
    }).filter(Boolean);
    if (!items.length) return;

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 5;
    const overlay = document.createElement('div');
    overlay.id = 'compactCheckoutOverlay';
    overlay.className = 'compact-checkout-overlay';
    overlay.innerHTML = `
      <section class="compact-checkout" role="dialog" aria-modal="true" aria-labelledby="compactCheckoutTitle">
        <header class="compact-checkout-head">
          <div><p class="compact-checkout-eyebrow">EVOLUTION · DEMO CHECKOUT</p><h2 id="compactCheckoutTitle">Complete your order</h2></div>
          <button type="button" class="compact-checkout-close" aria-label="Close checkout">×</button>
        </header>
        <div class="compact-checkout-content">
          <div class="compact-checkout-items">${items.map(item => `
            <article class="compact-checkout-item">
              <img src="${escapeHtml(item.image)}" alt="" loading="lazy">
              <div class="compact-checkout-item-copy"><strong>${escapeHtml(item.name)}</strong><small>Qty ${item.quantity} · ${money(item.price)} each</small></div>
              <strong class="compact-checkout-line-total">${money(item.price * item.quantity)}</strong>
            </article>`).join('')}
          </div>
          <div class="compact-checkout-totals"><div><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div><span>Shipping</span><strong>${money(shipping)}</strong></div><div class="compact-checkout-grand"><span>Total</span><strong>${money(subtotal + shipping)}</strong></div></div>
          <form id="compactCheckoutForm" class="compact-checkout-form">
            <label for="compactCheckoutName">Name</label>
            <input id="compactCheckoutName" name="name" required maxlength="100" value="${escapeHtml(user.name || '')}" autocomplete="name">
            <label for="compactCheckoutAddress">Shipping address</label>
            <textarea id="compactCheckoutAddress" name="address" rows="2" required maxlength="300" placeholder="Street, city, postal code" autocomplete="street-address"></textarea>
            <p class="compact-checkout-note">Demo only—no payment details are requested and no real payment is processed.</p>
            <button type="submit" class="compact-checkout-submit">Place demo order · ${money(subtotal + shipping)}</button>
          </form>
        </div>
      </section>`;

    overlay.addEventListener('click', event => { if (event.target === overlay) closeCheckout(); });
    overlay.querySelector('.compact-checkout-close').addEventListener('click', closeCheckout);
    overlay.querySelector('#compactCheckoutForm').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const name = form.elements.name.value.trim();
      const address = form.elements.address.value.trim();
      if (!name || !address) return;

      const orders = read('evoOrders', []);
      const order = {
        id: `EVO-${Date.now().toString().slice(-7)}`,
        name,
        address,
        items: items.map(({id, name: itemName, quantity, price}) => ({id, name: itemName, quantity, price})),
        subtotal,
        shipping,
        total: subtotal + shipping,
        created: new Date().toISOString()
      };
      try {
        localStorage.setItem('evoOrders', JSON.stringify([order, ...(Array.isArray(orders) ? orders : [])]));
        localStorage.setItem('cart', '[]');
      } catch {
        const note = overlay.querySelector('.compact-checkout-note');
        note.textContent = 'Could not save this demo order in browser storage. Check that site storage is enabled, then try again.';
        return;
      }
      closeCheckout();
      window.location.href = 'cart.html?ordered=1';
    });

    document.body.append(overlay);
    overlay.querySelector('#compactCheckoutName').focus();
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const checkoutButton = target?.closest('[data-action="checkout"]');
    if (!checkoutButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showCheckout();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCheckout();
  });
})();
