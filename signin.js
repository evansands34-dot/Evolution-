// signin.js - client side auth for demo backend

function $(id){return document.getElementById(id)}

document.addEventListener('DOMContentLoaded',()=>{
  const tabCreate = $('tab-create');
  const tabSignin = $('tab-signin');
  const formCreate = $('form-create');
  const formSignin = $('form-signin');

  tabCreate.onclick=()=>{tabCreate.classList.add('active');tabSignin.classList.remove('active');formCreate.classList.add('active');formSignin.classList.remove('active')}
  tabSignin.onclick=()=>{tabSignin.classList.add('active');tabCreate.classList.remove('active');formSignin.classList.add('active');formCreate.classList.remove('active')}

  $('create-btn').onclick = async ()=>{
    $('create-error').textContent='';
    const first = $('create-first').value.trim();
    const last = $('create-last').value.trim();
    const pass = $('create-pass').value;
    const pass2 = $('create-pass2').value;
    if(!first||!last||!pass){$('create-error').textContent='Please fill all fields';return}
    if(pass!==pass2){$('create-error').textContent='Passwords do not match';return}

    try{
      const res = await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:first,lastName:last,password:pass})});
      const data = await res.json();
      if(!res.ok){$('create-error').textContent=data.error||'Failed to create account';return}
      localStorage.setItem('token',data.token);
      location.href='home.html';
    }catch(err){console.error(err);$('create-error').textContent='Network error'}
  }

  $('signin-btn').onclick = async ()=>{
    $('signin-error').textContent='';
    const first = $('signin-first').value.trim();
    const last = $('signin-last').value.trim();
    const pass = $('signin-pass').value;
    if(!first||!last||!pass){$('signin-error').textContent='Please fill all fields';return}
    try{
      const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:first,lastName:last,password:pass})});
      const data = await res.json();
      if(!res.ok){$('signin-error').textContent=data.error||'Failed to sign in';return}
      localStorage.setItem('token',data.token);
      location.href='home.html';
    }catch(err){console.error(err);$('signin-error').textContent='Network error'}
  }
});
