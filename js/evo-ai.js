// evo-ai client
(function(){
  // Create panel UI
  const style = document.createElement('style');
  style.textContent = `
  .evo-ai-toggle{position:fixed;right:18px;bottom:18px;background:#667eea;color:#fff;border-radius:999px;padding:12px 16px;cursor:pointer;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2)}
  .evo-ai-panel{position:fixed;right:18px;bottom:78px;width:360px;max-width:90vw;height:60vh;background:#fff;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.25);z-index:9999;display:flex;flex-direction:column;overflow:hidden}
  .evo-ai-header{padding:12px 14px;background:linear-gradient(90deg,#667eea,#764ba2);color:#fff;font-weight:700}
  .evo-ai-body{flex:1;padding:12px;overflow:auto;background:#f7f9fc}
  .evo-ai-input{display:flex;padding:10px;border-top:1px solid #eee;background:#fff}
  .evo-ai-input input{flex:1;padding:8px;border:1px solid #ddd;border-radius:8px;margin-right:8px}
  .evo-ai-message{background:#fff;padding:8px;border-radius:8px;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,.03)}
  .evo-ai-message.user{background:#e6f0ff;text-align:right}
  `;
  document.head.appendChild(style);

  const toggle = document.createElement('button');
  toggle.className = 'evo-ai-toggle';
  toggle.innerText = 'Evo AI';
  document.body.appendChild(toggle);

  const panel = document.createElement('div');
  panel.className = 'evo-ai-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div class="evo-ai-header">Evo AI</div>
    <div class="evo-ai-body" id="evoAiBody"></div>
    <div class="evo-ai-input">
      <input id="evoAiInput" placeholder="Ask about a product or the store...">
      <button id="evoAiSend">Ask</button>
    </div>
  `;
  document.body.appendChild(panel);

  let currentProduct = null;

  function openPanel(){
    panel.style.display = 'flex';
    document.getElementById('evoAiInput').focus();
  }
  function closePanel(){ panel.style.display = 'none'; }

  toggle.addEventListener('click', ()=>{ if(panel.style.display==='none') openPanel(); else closePanel(); });

  async function sendMessage(text){
    const bodyEl = document.getElementById('evoAiBody');
    const userMsg = document.createElement('div'); userMsg.className='evo-ai-message user'; userMsg.innerText = text; bodyEl.appendChild(userMsg);
    const loading = document.createElement('div'); loading.className='evo-ai-message'; loading.innerText = 'Thinking...'; bodyEl.appendChild(loading);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    try{
      const res = await fetch('/api/ai',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({message:text, product: currentProduct})
      });
      const data = await res.json();
      loading.innerText = data.reply || (data.error?('Error: '+data.error):'No reply');
    }catch(err){
      loading.innerText = 'Error contacting Evo AI';
      console.error(err);
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  document.getElementById('evoAiSend').addEventListener('click', ()=>{
    const input = document.getElementById('evoAiInput');
    const text = input.value.trim();
    if(!text) return; input.value=''; sendMessage(text);
  });

  document.getElementById('evoAiInput').addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); document.getElementById('evoAiSend').click(); } });

  // Public hooks
  window.setEvoProduct = function(p){ currentProduct = p; }
  window.openEvoAI = function(){ openPanel(); }

})();
