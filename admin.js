document.addEventListener('DOMContentLoaded',()=>{
  const statusBtn = document.getElementById('statusBtn');
  const toggleBtn = document.getElementById('toggleBtn');
  const keyInput = document.getElementById('adminkey');
  const statusArea = document.getElementById('statusArea');

  async function getStatus(){
    try{
      const res = await fetch('/api/admin/status');
      const data = await res.json();
      statusArea.textContent = `openai_key_present: ${data.openai_key_present}, admin_enabled: ${data.admin_enabled}, effective_openai: ${data.effective_openai}`;
    }catch(e){statusArea.textContent = 'Error fetching status'}
  }

  statusBtn.addEventListener('click', getStatus);

  toggleBtn.addEventListener('click', async ()=>{
    const key = keyInput.value.trim();
    if(!key){alert('Enter ADMIN_KEY');return}
    try{
      const res = await fetch('/api/admin/toggle',{method:'POST',headers:{'X-Admin-Key':key}});
      const data = await res.json();
      if(!res.ok){alert(data.error||'Forbidden');return}
      statusArea.textContent = `admin_enabled: ${data.admin_enabled}, effective_openai: ${data.effective_openai}`;
    }catch(e){alert('Network error')}
  });

  // auto load status
  getStatus();
});
