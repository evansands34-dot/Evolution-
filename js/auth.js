// js/auth.js
(function(){
  // Simple client-side auth using localStorage. Not secure for production.
  async function hashPassword(password){
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem('evoUsers')||'[]'); }catch(e){return[]} }
  function saveUsers(u){ localStorage.setItem('evoUsers', JSON.stringify(u)); }

  function getSession(){ try{ return JSON.parse(localStorage.getItem('evoUserSession')||'null'); }catch(e){return null} }
  function setSession(session){ localStorage.setItem('evoUserSession', JSON.stringify(session)); window.dispatchEvent(new CustomEvent('evoUserChanged', { detail: session })); }
  function clearSession(){ localStorage.removeItem('evoUserSession'); window.dispatchEvent(new CustomEvent('evoUserChanged', { detail: null })); }

  async function createUser(first, last, password){
    const users = getUsers();
    const existing = users.find(u => u.first.toLowerCase()===first.toLowerCase() && u.last.toLowerCase()===last.toLowerCase());
    if(existing) throw new Error('An account with that name already exists');
    const passHash = await hashPassword(password);
    const user = { id: Date.now(), first, last, passHash, createdAt: new Date().toISOString() };
    users.push(user); saveUsers(users);
    setSession({ id: user.id, first: user.first, last: user.last });
    return user;
  }

  async function signIn(first, last, password){
    const users = getUsers();
    const passHash = await hashPassword(password);
    const user = users.find(u => u.first.toLowerCase()===first.toLowerCase() && u.last.toLowerCase()===last.toLowerCase() && u.passHash===passHash);
    if(!user) throw new Error('Invalid name or password');
    setSession({ id: user.id, first: user.first, last: user.last });
    return user;
  }

  // Build modal
  function createAuthModal(){
    if(document.getElementById('evoAuthModal')) return;
    const modal = document.createElement('div'); modal.id='evoAuthModal'; modal.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);z-index:10000';
    modal.innerHTML = `
      <div style="width:420px;max-width:94%;background:#fff;border-radius:10px;padding:16px;box-shadow:0 12px 40px rgba(0,0,0,.25)">
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button id="evoTabCreate" style="flex:1;padding:10px;border-radius:8px;border:1px solid #ddd;background:#f7f9fc">Create an account</button>
          <button id="evoTabSign" style="flex:1;padding:10px;border-radius:8px;border:1px solid #ddd;background:#fff">Sign in</button>
        </div>
        <div id="evoAuthBody"></div>
        <div style="text-align:right;margin-top:10px"><button id="evoAuthClose" style="padding:8px 12px;border-radius:8px;border:none;background:#ddd">Close</button></div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('evoAuthClose').addEventListener('click', ()=>{ modal.style.display='none'; });
    document.getElementById('evoTabCreate').addEventListener('click', ()=>{ renderCreate(); });
    document.getElementById('evoTabSign').addEventListener('click', ()=>{ renderSignIn(); });

    function renderCreate(){
      document.getElementById('evoTabCreate').style.background='#fff';
      document.getElementById('evoTabSign').style.background='#f7f9fc';
      document.getElementById('evoAuthBody').innerHTML = `
        <form id="evoCreateForm">
          <label>First name</label>
          <input id="createFirst" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px">
          <label>Last name</label>
          <input id="createLast" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px">
          <label>Password</label>
          <input id="createPass" type="password" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px">
          <label>Confirm password</label>
          <input id="createPass2" type="password" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px">
          <div style="color:red;margin-bottom:8px" id="createError"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button type="submit" style="padding:10px 14px;border-radius:8px;border:none;background:linear-gradient(90deg,#667eea,#764ba2);color:#fff">Create account</button></div>
        </form>
      `;
      document.getElementById('evoCreateForm').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const first = document.getElementById('createFirst').value.trim();
        const last = document.getElementById('createLast').value.trim();
        const pass = document.getElementById('createPass').value;
        const pass2 = document.getElementById('createPass2').value;
        const err = document.getElementById('createError'); err.innerText='';
        if(pass.length < 6){ err.innerText='Password must be at least 6 characters'; return; }
        if(pass !== pass2){ err.innerText='Passwords do not match'; return; }
        try{
          await createUser(first,last,pass);
          modal.style.display='none'; alert('Account created and signed in');
        }catch(ex){ err.innerText = ex.message || 'Error'; }
      });
    }

    function renderSignIn(){
      document.getElementById('evoTabCreate').style.background='#f7f9fc';
      document.getElementById('evoTabSign').style.background='#fff';
      document.getElementById('evoAuthBody').innerHTML = `
        <form id="evoSignForm">
          <label>First name</label>
          <input id="signFirst" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px">
          <label>Last name</label>
          <input id="signLast" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px">
          <label>Password</label>
          <input id="signPass" type="password" required style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px">
          <div style="color:red;margin-bottom:8px" id="signError"></div>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button type="submit" style="padding:10px 14px;border-radius:8px;border:none;background:linear-gradient(90deg,#667eea,#764ba2);color:#fff">Sign in</button></div>
        </form>
      `;
      document.getElementById('evoSignForm').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const first = document.getElementById('signFirst').value.trim();
        const last = document.getElementById('signLast').value.trim();
        const pass = document.getElementById('signPass').value;
        const err = document.getElementById('signError'); err.innerText='';
        try{
          await signIn(first,last,pass);
          modal.style.display='none'; alert('Signed in');
        }catch(ex){ err.innerText = ex.message || 'Error'; }
      });
    }

    renderSignIn();
    // Public open
    window.openEvoAuth = function(){ modal.style.display='flex'; };
  }

  // Expose sign out and getSession
  window.evoAuth = {
    getSession,
    signOut: clearSession
  };

  // Initialize modal on DOM ready
  document.addEventListener('DOMContentLoaded', ()=>{ createAuthModal();
    // If session exists, broadcast it
    const s = getSession(); if(s) window.dispatchEvent(new CustomEvent('evoUserChanged', { detail: s }));
  });

})();
