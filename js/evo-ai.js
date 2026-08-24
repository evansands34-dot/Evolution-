// evo-ai client with local fallback
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
    const input = document.getElementById('evoAiInput'); if(input) input.focus();
  }
  function closePanel(){ panel.style.display = 'none'; }

  toggle.addEventListener('click', ()=>{ if(panel.style.display==='none') openPanel(); else closePanel(); });

  async function callServerAI(text){
    // Try server-side /api/ai first. If that fails or returns error, caller will fall back to local.
    try{
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, product: currentProduct })
      });
      if(!res.ok) throw new Error('server error');
      const data = await res.json();
      if(data && data.reply) return data.reply;
      if(typeof data === 'string') return data;
      throw new Error('no reply');
    }catch(err){
      // bubble up so caller can fallback
      throw err;
    }
  }

  function localAssistant(message, product){
    const m = (message||'').toLowerCase();
    const prodName = product?.name || 'this item';
    const prodDesc = product?.description || '';
    const category = (product?.category||'').toLowerCase();
    const price = product?.price ? `$${Number(product.price).toFixed(2)}` : null;

    // Helper answers
    if(/size|fit|fits|running size|true to size|fit/.test(m)){
      if(category.includes('footwear')){
        return `For ${prodName}, most customers find it fits true to size. If you are between sizes we recommend sizing up. If you tell me your usual shoe size I can give a more specific suggestion.`;
      }
      return `Sizing varies by product. ${prodName} generally fits as expected. Check the product description for measurements.`;
    }

    if(/material|made of|fabric|leather|cotton|polyester/.test(m)){
      if(/leather/.test(prodDesc.toLowerCase())) return `${prodName} is made with premium leather for durability and a polished look.`;
      if(/cotton/.test(prodDesc.toLowerCase())) return `${prodName} uses soft cotton blend for comfort and breathability.`;
      return `${prodName}: ${prodDesc || 'Material info is not available in the description.'}`;
    }

    if(/ship|shipping|delivery|deliver/.test(m)){
      return `Standard shipping usually takes 3–7 business days. We offer expedited options at checkout. Return eligibility and shipping specifics are available on the Checkout page.`;
    }

    if(/return|refund|exchange/.test(m)){
      return `We accept returns within 30 days of delivery for most items (unused). To start a return, go to your account > Recent purchases and select the item. For exchanges, contact customer service.`;
    }

    if(/price|cost|how much|cheap|expensive/.test(m)){
      if(price) return `${prodName} is ${price}${product?.originalPrice ? ` (originally $${Number(product.originalPrice).toFixed(2)})` : ''}.`;
      return `Price information is not available for this item.`;
    }

    if(/recommend|style|match|what to wear|pair|outfit/.test(m)){
      // try to recommend items from window.products
      try{
        const list = window.products || [];
        const matches = list.filter(p => p.id !== product?.id && ((p.category||'').toLowerCase() === (product?.category||'').toLowerCase())).slice(0,3);
        if(matches.length) return `I recommend ${matches.map(p=>p.name).join(', ')} as a good match for ${prodName}.`;
      }catch(e){}
      return `Consider pairing ${prodName} with neutral basics like slim-fit jeans or a casual tee. If you tell me your style, I can give a better suggestion.`;
    }

    if(/review|rating|opinions|feedback/.test(m)){
      return `${prodName} has received positive reviews for quality and comfort in our demo data. You can read customer reviews below the product or add your own.`;
    }

    // fallback: summarize product
    let reply = `Here is what I know about ${prodName}.`;
    if(prodDesc) reply += ` ${prodDesc}`;
    if(price) reply += ` The price is ${price}.`;
    reply += ` Ask me about sizing, materials, shipping, returns, or how to style this item.`;
    return reply;
  }

  async function sendMessage(text){
    const bodyEl = document.getElementById('evoAiBody');
    const userMsg = document.createElement('div'); userMsg.className='evo-ai-message user'; userMsg.innerText = text; bodyEl.appendChild(userMsg);
    const loading = document.createElement('div'); loading.className='evo-ai-message'; loading.innerText = 'Thinking...'; bodyEl.appendChild(loading);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    // Try server first, fallback to local assistant
    try{
      const reply = await callServerAI(text);
      loading.innerText = reply || 'No reply from server AI.';
    }catch(err){
      console.warn('Server AI unavailable, using local assistant', err);
      try{
        const reply = localAssistant(text, currentProduct);
        loading.innerText = reply;
      }catch(e){
        loading.innerText = 'Evo AI is unavailable.';
      }
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // attach events (in case script loads early)
    const sendBtn = document.getElementById('evoAiSend');
    const input = document.getElementById('evoAiInput');
    if(sendBtn){ sendBtn.addEventListener('click', ()=>{ const text = input.value.trim(); if(!text) return; input.value=''; sendMessage(text); }); }
    if(input){ input.addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); const text=input.value.trim(); if(!text) return; input.value=''; sendMessage(text); } }); }
  });

  // Public hooks
  window.setEvoProduct = function(p){ currentProduct = p; }
  window.openEvoAI = function(){ openPanel(); }

})();
