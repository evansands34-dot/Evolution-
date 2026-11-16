/* Catalog-grounded Evo AI. This improves the storefront assistant without exposing
   a provider API key in GitHub Pages' public client-side JavaScript. */
(() => {
  'use strict';
  const products = window.products || [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const words = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
  const synonyms = {
    shoe:['shoes','sneaker','sneakers','trainer','trainers','footwear'], shoes:['shoe','sneaker','sneakers','trainer','trainers','footwear'],
    sneaker:['sneakers','shoe','shoes','footwear'], sneakers:['sneaker','shoe','shoes','footwear'], footwear:['shoe','shoes','sneaker','sneakers'],
    trainer:['trainers','shoes','sneakers','running'], trainers:['trainer','shoes','sneakers','running'],
    clothes:['clothing','apparel','shirt','hoodie','joggers','shorts','sweater'], clothing:['clothes','apparel','shirt','hoodie'], apparel:['clothing','clothes'],
    tee:['tshirt','shirt','apparel'], tshirt:['tee','shirt','apparel'], shirt:['tee','tshirt','apparel'], top:['shirt','hoodie','sweater'], tops:['shirt','hoodie','sweater'],
    pants:['joggers','apparel'], jogger:['joggers','pants'], hoodie:['jacket','apparel'], jacket:['hoodie','apparel'],
    cheap:['affordable','low','price'], affordable:['cheap','low'], comfy:['comfort','comfortable'], comfortable:['comfort','comfy'], gym:['fitness','training','trainers'],
    basketball:['court','shoes'], boot:['boots','footwear'], run:['running','runner'], running:['run','runner','trainers']
  };
  const expand = list => [...new Set(list.flatMap(w => [w, ...(synonyms[w] || [])]))];
  const productText = p => `${p.name} ${p.category} ${p.description} ${p.badge || ''}`.toLowerCase();
  function score(p, query) {
    const q = expand(words(query)); const title = words(`${p.name} ${p.category} ${p.description} ${p.badge || ''}`);
    let total = 0;
    for (const w of q) {
      if (title.includes(w)) total += (words(p.name).includes(w) ? 5 : 2);
      else if (title.some(t => t.startsWith(w) || (w.length > 4 && w.startsWith(t)))) total += 1;
    }
    if (/\b(running|run|jog|jogging)\b/i.test(query) && /running|trainers|gym/i.test(productText(p))) total += 4;
    if (/\b(basketball|court)\b/i.test(query) && /basketball|court/i.test(productText(p))) total += 5;
    return total;
  }
  function findProducts(query) {
    return products.map(p => ({p,score:score(p,query)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score || a.p.price-b.p.price).map(x=>x.p);
  }
  function itemCard(p) {
    return `<a href="product.html?id=${encodeURIComponent(p.id)}" style="display:flex;align-items:center;gap:10px;padding:9px;margin:8px 0;border-radius:10px;background:#ffffff12;color:inherit;text-decoration:none"><img src="${esc(p.image)}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px"><span><strong>${esc(p.name)}</strong><br><small>${esc(p.description)} · $${Number(p.price).toFixed(2)}</small></span></a>`;
  }
  function recommendationReply(query, found) {
    if (!found.length) return '';
    const chosen = found.slice(0,3);
    const lead = /best|recommend|suggest|looking for|want|need/i.test(query) ? 'Based on our catalog, these are the closest matches:' : 'Here are the closest matches in our catalog:';
    return `${lead}${chosen.map(itemCard).join('')}<small>Recommendations are based on item names and descriptions in the Evolution catalog.</small>`;
  }
  function answer(query) {
    const q = query.toLowerCase();
    const contextId = Number(new URLSearchParams(location.search).get('id'));
    const context = products.find(p=>p.id===contextId);
    if (/\b(hello|hi|hey|good morning|good evening)\b/.test(q)) return `Hi${localStorage.getItem('evoUser') ? `, ${esc(JSON.parse(localStorage.getItem('evoUser')).name?.split(/\s+/)[0] || 'there')}` : ''}! What are you shopping for today? You can ask me to find shoes, clothing, or a specific item.`;
    if (/\b(thank you|thanks)\b/.test(q)) return 'You’re welcome! Want help finding anything else in the Evolution collection?';
    if (/\b(shipping|delivery|deliver|return|refund|payment|checkout|order)\b/.test(q)) {
      if (/\b(return|refund)\b/.test(q)) return 'This site is a storefront demo. You can view saved demo orders and request a return from the account menu; no real order or return is processed.';
      if (/\b(shipping|delivery|deliver)\b/.test(q)) return 'The demo cart currently shows a $5 shipping charge when it contains items. Delivery times and tracking are not provided by this demo.';
      return 'Checkout on this site is a demo and does not process payments. A saved demo order can be viewed from your account menu.';
    }
    const priceQuestion = /\b(price|cost|how much|cheapest|affordable|under|between|budget)\b/.test(q);
    const categoryOnly = /\b(shoes?|sneakers?|sneaker|footwear|trainers?|boots?|clothes|clothing|apparel|shirts?|hoodies?|joggers?|shorts|sweaters?)\b/.test(q);
    let found = findProducts(query);
    if (context && found.length === 0 && !categoryOnly) found = [context];
    if (priceQuestion && found.length) {
      const sorted = [...found].sort((a,b)=>a.price-b.price);
      if (/cheapest|affordable|lowest|least expensive/.test(q)) return `The lowest-priced close match is ${itemCard(sorted[0])}Prices are from the demo catalog.`;
      const under = q.match(/(?:under|below|less than)\s*\$?\s*(\d+(?:\.\d+)?)/);
      if (under) {
        const limit=Number(under[1]); const within=sorted.filter(p=>p.price<=limit);
        return within.length ? `These matching items are under $${limit}: ${within.slice(0,5).map(itemCard).join('')}` : `I couldn't find a matching catalog item under $${limit}. The closest match is ${itemCard(sorted[0])}`;
      }
      return `Here are the prices for matching items, from lowest to highest: ${sorted.slice(0,5).map(itemCard).join('')}`;
    }
    if (found.length) return recommendationReply(query,found);
    if (context) return `You're viewing ${itemCard(context)}The catalog describes it as: “${esc(context.description)}.” It is listed at $${Number(context.price).toFixed(2)}. I can only confirm details shown in the listing; sizing and other specifications aren't included here.`;
    if (/\b(size|sizing|fit|material|fabric|cotton|color|colour|waterproof|availability|stock)\b/.test(q)) return 'I can only confirm product specifications included in the catalog. Each item page shows its listed description and price; details like sizing, fit, colors, and stock status may not be available in this demo.';
    if (/\b(who|what|when|where|why|how|tell me|explain)\b/.test(q)) return 'I’m Evo AI, the Evolution shopping assistant. I can answer questions using the items and details listed in this store, but I don’t have general web knowledge. Try asking about sneakers, running shoes, hoodies, or prices.';
    return 'I couldn’t match that to an item in the Evolution catalog. Try a product type like sneakers, shoes, hoodie, joggers, or shorts, or ask about a product’s listed price or description.';
  }
  function addBubble(container, html, user=false) {
    const bubble=document.createElement('div'); bubble.className=`bubble${user?' user':''}`; bubble.innerHTML=html; container.append(bubble); container.scrollTop=container.scrollHeight;
  }
  document.addEventListener('submit', event => {
    if (event.target?.id !== 'aiForm') return;
    event.preventDefault(); event.stopImmediatePropagation();
    const input=event.target.elements.question; const question=input.value.trim(); if(!question)return;
    const messages=document.querySelector('#aiMessages'); if(!messages)return;
    addBubble(messages,esc(question),true); addBubble(messages,answer(question)); event.target.reset(); input.focus();
  }, true);
  const observer=new MutationObserver(records=>{
    for(const record of records) for(const node of record.addedNodes) {
      if(!(node instanceof HTMLElement)) continue;
      const drawer=node.id==='aiDrawer'?node:node.querySelector?.('#aiDrawer'); if(!drawer) continue;
      const first=drawer.querySelector('#aiMessages .bubble:not(.user)');
      if(first && !first.dataset.evoIntro){first.dataset.evoIntro='true';first.innerHTML='Hi! I’m Evo AI, your Evolution shopping assistant. Ask me to find products, compare listed prices, or explain an item description. I use the store catalog, so I’ll let you know when a detail isn’t listed.';}
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
