// Shared helper functions for product pages, reviews, and cart
function getQueryParam(name){
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function formatPrice(n){
  return Number(n).toFixed(2);
}

function getProductById(id){
  return PRODUCTS.find(p=>p.id === id);
}

// Index page
function loadIndexProducts(){
  const container = document.getElementById('product-list');
  container.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'product-card';
    el.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <div class="product-title">${p.name}</div>
      <div class="product-price">$${formatPrice(p.price)}</div>
      <p>${p.description}</p>
      <div style="margin-top:8px">
        <a class="btn" href="product.html?id=${p.id}">View</a>
        <button class="btn" onclick="addToCart('${p.id}',1)" style="background:#28a745;margin-left:8px">Add to cart</button>
      </div>
    `;
    container.appendChild(el);
  });
}

// Product page
function loadProductPage(){
  const id = getQueryParam('id');
  const target = document.getElementById('product-detail');
  if(!id){ target.innerHTML = '<p>Product not found</p>'; return; }
  const p = getProductById(id);
  if(!p){ target.innerHTML = '<p>Product not found</p>'; return; }
  target.innerHTML = `
    <div class="product-card">
      <img src="${p.img}" alt="${p.name}">
      <h2>${p.name}</h2>
      <div class="product-price">$${formatPrice(p.price)}</div>
      <p>${p.description}</p>
      <div style="margin-top:8px">
        <label>Quantity: <input id="qty-input" type="number" value="1" min="1" style="width:60px"></label>
        <button class="btn" id="add-cart-btn" style="background:#28a745;margin-left:8px">Add to cart</button>
      </div>
    </div>
  `;
  document.getElementById('add-cart-btn').addEventListener('click', ()=>{
    const qty = parseInt(document.getElementById('qty-input').value,10) || 1;
    addToCart(id, qty);
  });
  renderReviews(id);
}

// Reviews
function getReviewsKey(id){ return `evo_reviews_${id}`; }
function getReviews(id){
  try{
    const raw = localStorage.getItem(getReviewsKey(id));
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveReviews(id, reviews){
  localStorage.setItem(getReviewsKey(id), JSON.stringify(reviews));
}
function addReview(id, review){
  const reviews = getReviews(id);
  reviews.unshift(review);
  saveReviews(id, reviews);
}
function renderReviews(id){
  const list = document.getElementById('reviews-list');
  if(!list) return;
  const reviews = getReviews(id);
  if(reviews.length === 0) list.innerHTML = '<p>No reviews yet.</p>';
  else{
    list.innerHTML = '';
    reviews.forEach(r=>{
      const el = document.createElement('div');
      el.className = 'review';
      el.innerHTML = `<strong>${escapeHtml(r.name)}</strong> — ${'★'.repeat(r.rating)}<br><small>${new Date(r.created).toLocaleString()}</small><p>${escapeHtml(r.comment)}</p>`;
      list.appendChild(el);
    });
  }
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; });
}

// Cart
function getCart(){
  try{ const raw = localStorage.getItem('evo_cart'); return raw ? JSON.parse(raw) : []; }catch(e){ return []; }
}
function saveCart(cart){ localStorage.setItem('evo_cart', JSON.stringify(cart)); }

function addToCart(id, qty){
  const p = getProductById(id);
  if(!p) return alert('Product not found');
  const cart = getCart();
  const existing = cart.find(i=>i.id === id);
  if(existing) existing.qty = existing.qty + qty;
  else cart.push({id: p.id, name: p.name, price: p.price, qty});
  saveCart(cart);
  updateCartCount();
  alert('Added to cart');
}

function updateCartCount(){
  const cart = getCart();
  const count = cart.reduce((s,i)=>s+i.qty,0);
  const link = document.getElementById('cart-link');
  if(link) link.textContent = `Cart (${count})`;
}

function renderCartPage(){
  const container = document.getElementById('cart-contents');
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  if(cart.length === 0){ container.innerHTML = '<p>Your cart is empty.</p>'; return; }
  cart.forEach(item=>{
    const row = document.createElement('div');
    row.className = 'cart-row';
    const prod = getProductById(item.id) || {};
    row.innerHTML = `
      <img src="${prod.img || 'https://via.placeholder.com/150'}" alt="${item.name}">
      <div style="flex:1">
        <div style="font-weight:700">${escapeHtml(item.name)}</div>
        <div>$${formatPrice(item.price)}</div>
      </div>
      <div class="cart-controls">
        <button onclick="changeQty('${item.id}', -1)">-</button>
        <div>${item.qty}</div>
        <button onclick="changeQty('${item.id}', 1)">+</button>
        <div style="width:12px"></div>
        <button onclick="removeItem('${item.id}')">Remove</button>
      </div>
    `;
    container.appendChild(row);
  });
  const total = cart.reduce((s,i)=> s + i.qty * Number(i.price), 0).toFixed(2);
  const totalEl = document.createElement('div');
  totalEl.innerHTML = `<h3>Subtotal: $${total}</h3>`;
  container.appendChild(totalEl);
}

function changeQty(id, delta){
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty = Math.max(0, item.qty + delta);
  const idx = cart.findIndex(i=>i.id===id);
  if(item.qty === 0) cart.splice(idx,1);
  saveCart(cart);
  renderCartPage();
  updateCartCount();
}

function removeItem(id){
  const cart = getCart().filter(i=>i.id!==id);
  saveCart(cart);
  renderCartPage();
  updateCartCount();
}
