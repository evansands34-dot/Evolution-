// auth.js - small helper to show signed in user in nav
async function initAuth(){
  try{
    const token = localStorage.getItem('token');
    const navLogo = document.querySelector('nav .logo');
    if(navLogo) navLogo.textContent = 'Evolution';

    const nav = document.querySelector('nav');
    if(!nav) return;

    const rightArea = document.createElement('div');
    rightArea.style.display='flex';
    rightArea.style.alignItems='center';
    rightArea.style.gap='12px';

    const accountEl = document.createElement('div');
    accountEl.id='accountArea';

    const signinLink = document.createElement('a');
    signinLink.href='signin.html';
    signinLink.textContent='Sign in';
    signinLink.style.color='inherit';
    signinLink.style.textDecoration='none';

    const cartLink = document.createElement('a');
    cartLink.href='cart.html';
    cartLink.innerHTML='🛒 Cart (<span id="cartCount">0</span>)';
    cartLink.style.background='#fff';
    cartLink.style.padding='6px 10px';
    cartLink.style.borderRadius='18px';
    cartLink.style.color='#333';
    cartLink.style.textDecoration='none';

    accountEl.appendChild(signinLink);
    rightArea.appendChild(accountEl);
    rightArea.appendChild(cartLink);

    // attach to nav (end)
    const existingDiv = nav.querySelector('div');
    if(existingDiv){ existingDiv.replaceWith(rightArea);} else {nav.appendChild(rightArea)}

    if(token){
      const res = await fetch('/api/me',{headers:{'Authorization':'Bearer '+token}});
      if(res.ok){
        const data = await res.json();
        accountEl.innerHTML = `<div style="position:relative">
          <button id="acctBtn" style="background:transparent;border:none;color:inherit;cursor:pointer;font-weight:700">${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</button>
          <div id="acctMenu" style="position:absolute;right:0;top:36px;background:#fff;border:1px solid #ddd;padding:8px;border-radius:8px;display:none;min-width:160px;box-shadow:0 8px 20px rgba(0,0,0,.08)">
            <div><a href="#" id="signoutBtn">Sign out</a></div>
            <div><a href="#">Settings</a></div>
            <div><a href="#">Recent buys</a></div>
            <div><a href="#">Returns</a></div>
          </div>
        </div>`;
        const btn = document.getElementById('acctBtn');
        const menu = document.getElementById('acctMenu');
        btn.onclick = ()=>{menu.style.display = menu.style.display==='none'?'block':'none'};
        document.getElementById('signoutBtn').onclick = (e)=>{e.preventDefault();localStorage.removeItem('token');location.reload()}
      } else {
        // invalid token
        localStorage.removeItem('token');
      }
    }
  }catch(err){console.error('auth init error',err)}
}

function escapeHtml(s){return (s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]})}

if(typeof window !== 'undefined') document.addEventListener('DOMContentLoaded',initAuth);
