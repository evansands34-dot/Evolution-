// js/header.js
(function(){
  function buildHeader(){
    const header = document.querySelector('header');
    if(!header) return;
    header.innerHTML = `
      <nav>
        <a href="home.html" class="logo" style="font-weight:700;color:#fff;text-decoration:none;padding-right:12px">Evolution</a>
        <div style="flex:1;display:flex;align-items:center;gap:12px">
          <input id="evoSearch" placeholder="Search products, e.g. sneakers" style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.15)">
          <button id="evoSearchBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#fff;color:#333">Search</button>
        </div>
        <ul style="list-style:none;display:flex;gap:18px;align-items:center;margin:0;padding:0">
          <li><a href="home.html" style="color:#fff;text-decoration:none">Home</a></li>
          <li><a href="shop.html" style="color:#fff;text-decoration:none">Products</a></li>
          <li><a href="#" id="evoSearchHistory" style="color:#fff;text-decoration:none">Search history</a></li>
          <li><a href="#" id="evoCustomerService" style="color:#fff;text-decoration:none">Customer service</a></li>
          <li><a href="#" id="evoAiOpen" style="color:#fff;text-decoration:none">Evo AI</a></li>
          <li id="evoAccountArea" style="color:#fff;cursor:pointer">Sign in</li>
          <li><a href="cart.html" style="background:#fff;padding:6px 10px;border-radius:18px;color:#333;text-decoration:none">🛒 <span style="font-weight:700">Cart</span> (<span id="cartCountHeader">0</span>)</a></li>
        </ul>
      </nav>
    `;

    // Attach events
    const searchInput = document.getElementById('evoSearch');
    const searchBtn = document.getElementById('evoSearchBtn');
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') doSearch(); });

    document.getElementById('evoAccountArea').addEventListener('click', ()=>{ if(window.openEvoAuth) window.openEvoAuth(); });
    document.getElementById('evoAiOpen').addEventListener('click', ()=>{ if(window.openEvoAI) window.openEvoAI(); });

    document.getElementById('evoSearchHistory').addEventListener('click', ()=>{
      const hist = JSON.parse(localStorage.getItem('evoSearchHistory')||'[]');
      alert('Search history:\n' + (hist.length?hist.join('\n'):'(none)'));
    });
    document.getElementById('evoCustomerService').addEventListener('click', ()=>{ alert('Customer service: please email support@evolutionbrand.com'); });

    updateCartCount();
    // Update account area on user change
    window.addEventListener('evoUserChanged', (e)=>{ renderAccountArea(e.detail); });
    renderAccountArea(window.evoAuth && window.evoAuth.getSession ? window.evoAuth.getSession() : null);
  }

  function doSearch(){
    const q = document.getElementById('evoSearch').value.trim();
    if(!q) return; 
    // save history
    const hist = JSON.parse(localStorage.getItem('evoSearchHistory')||'[]');
    hist.unshift(q); if(hist.length>30) hist.pop(); localStorage.setItem('evoSearchHistory', JSON.stringify(hist));
    // go to shop page with query param
    location.href = 'shop.html?q=' + encodeURIComponent(q);
  }

  function renderAccountArea(session){
    const area = document.getElementById('evoAccountArea'); if(!area) return;
    if(session){
      area.innerHTML = `${escapeHtml(session.first)} ${escapeHtml(session.last)} ▾`;
      area.onclick = ()=>{ openAccountMenu(session); };
    } else {
      area.innerText = 'Sign in';
      area.onclick = ()=>{ if(window.openEvoAuth) window.openEvoAuth(); };
    }
  }

  function openAccountMenu(session){
    // simple menu
    const menu = document.createElement('div');
    menu.style.cssText = 'position:fixed;right:18px;top:70px;background:#fff;padding:8px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.18);z-index:20000';
    menu.innerHTML = `<div style="padding:8px;font-weight:700">${escapeHtml(session.first)} ${escapeHtml(session.last)}</div>
      <div style="border-top:1px solid #eee;margin-top:8px;padding-top:8px">
        <a href="#" id="accSettings">Account settings</a><br>
        <a href="#" id="accRecent">Recent purchases</a><br>
        <a href="#" id="accReturns">Returns</a><br>
        <a href="#" id="accSignOut">Sign out</a>
      </div>`;
    document.body.appendChild(menu);
    function close(){ if(menu && menu.parentNode) menu.parentNode.removeChild(menu); window.removeEventListener('click', onDocClick); }
    function onDocClick(e){ if(!menu.contains(e.target)) close(); }
    window.addEventListener('click', onDocClick);
    document.getElementById('accSignOut').addEventListener('click', ()=>{ if(window.evoAuth) window.evoAuth.signOut(); close(); alert('Signed out'); });
    document.getElementById('accSettings').addEventListener('click', ()=>{ alert('Settings: language, security (not implemented yet)'); });
    document.getElementById('accRecent').addEventListener('click', ()=>{ alert('Recent purchases are stored locally (demo)'); });
    document.getElementById('accReturns').addEventListener('click', ()=>{ alert('Returns not implemented yet'); });
  }

  function updateCartCount(){ const el = document.getElementById('cartCountHeader'); if(!el) return; const cart = JSON.parse(localStorage.getItem('evoCart')||'[]'); el.innerText = cart.length; }

  function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]; }); }

  document.addEventListener('DOMContentLoaded', ()=>{ buildHeader();
    // update cart count on storage changes
    window.addEventListener('storage', (e)=>{ if(e.key==='evoCart') updateCartCount(); });
  });
})();
