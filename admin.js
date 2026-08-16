document.addEventListener('DOMContentLoaded',()=>{
  const statusBtn = document.getElementById('statusBtn');
  const toggleBtn = document.getElementById('toggleBtn');
  const bootstrapBtn = document.getElementById('bootstrapBtn');
  const bootstrapKey = document.getElementById('bootstrapKey');
  const bootstrapFirst = document.getElementById('bootstrapFirst');
  const bootstrapLast = document.getElementById('bootstrapLast');
  const bootstrapPass = document.getElementById('bootstrapPass');

  const adminLoginBtn = document.getElementById('adminLogin');
  const adminLogoutBtn = document.getElementById('adminLogout');
  const adminFirst = document.getElementById('adminFirst');
  const adminLast = document.getElementById('adminLast');
  const adminPass = document.getElementById('adminPass');

  const statusArea = document.getElementById('statusArea');

  let adminToken = null;

  async function getStatus(){
    try{
      // if we have token, use Authorization header
      const headers = {};
      if(adminToken) headers['Authorization'] = 'Bearer '+adminToken;
      const res = await fetch('/api/admin/status',{headers});
      if(res.status===403){ statusArea.textContent = 'Admin token required or invalid'; return }
      const data = await res.json();
      statusArea.textContent = `openai_key_present: ${data.openai_key_present}, admin_enabled: ${data.admin_enabled}, effective_openai: ${data.effective_openai}`;
    }catch(e){statusArea.textContent = 'Error fetching status'}
  }

  statusBtn.addEventListener('click', getStatus);

  toggleBtn.addEventListener('click', async ()=>{
    try{
      const headers = {};
      if(adminToken) headers['Authorization'] = 'Bearer '+adminToken; else { alert('Please sign in as admin first.'); return }
      const res = await fetch('/api/admin/toggle',{method:'POST',headers});
      if(res.status===403){alert('Admin required');return}
      const data = await res.json();
      statusArea.textContent = `admin_enabled: ${data.admin_enabled}, effective_openai: ${data.effective_openai}`;
    }catch(e){alert('Network error')}
  });

  bootstrapBtn.addEventListener('click', async ()=>{
    const key = bootstrapKey.value.trim();
    const first = bootstrapFirst.value.trim();
    const last = bootstrapLast.value.trim();
    const pass = bootstrapPass.value;
    if(!key||!first||!last||!pass){alert('Provide all bootstrap fields');return}
    try{
      const res = await fetch('/api/admin/create',{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Key':key},body:JSON.stringify({firstName:first,lastName:last,password:pass})});
      const data = await res.json();
      if(!res.ok){alert(data.error||'Failed to create admin');return}
      alert('Admin created');
    }catch(e){alert('Network error')}
  });

  adminLoginBtn.addEventListener('click', async ()=>{
    const first = adminFirst.value.trim();
    const last = adminLast.value.trim();
    const pass = adminPass.value;
    if(!first||!last||!pass){alert('Provide credentials');return}
    try{
      const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:first,lastName:last,password:pass})});
      const data = await res.json();
      if(!res.ok){alert(data.error||'Sign in failed');return}
      if(!data.isAdmin){alert('Account is not an admin');return}
      adminToken = data.token;
      statusArea.textContent = `Signed in as admin: ${data.firstName} ${data.lastName}`;
    }catch(e){alert('Network error')}
  });

  adminLogoutBtn.addEventListener('click', ()=>{adminToken=null;statusArea.textContent='Signed out'});

  // auto load status (will show limited info if not signed in)
  // do not call getStatus automatically to avoid leaking admin-only endpoint status
});
