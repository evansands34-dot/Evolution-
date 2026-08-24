// js/supabase.js
// Lightweight client-side wrapper that calls our serverless Supabase endpoints.
(function(){
  async function postJson(url, body){
    try{
      const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if(!res.ok){ const t = await res.text(); throw new Error(t || 'Request failed'); }
      return await res.json();
    }catch(err){ throw err; }
  }

  async function getJson(url){
    const res = await fetch(url);
    if(!res.ok) throw new Error('Request failed');
    return await res.json();
  }

  window.evoSupabase = {
    submitReview: async function(review){
      // review: { product_id, rating, comment, user }
      try{
        const resp = await postJson('/api/reviews', review);
        return resp;
      }catch(err){
        console.warn('submitReview failed, falling back to localStorage', err);
        // fallback: store in localStorage
        const key = 'evoReviewsLocal';
        const arr = JSON.parse(localStorage.getItem(key)||'[]');
        arr.unshift(Object.assign({ id: Date.now(), created_at: new Date().toISOString() }, review));
        localStorage.setItem(key, JSON.stringify(arr));
        return { ok: true, fallback: true };
      }
    },
    getReviews: async function(product_id){
      try{
        const q = product_id ? '?product_id=' + encodeURIComponent(product_id) : '';
        const resp = await getJson('/api/reviews' + q);
        return resp.reviews || [];
      }catch(err){
        console.warn('getReviews failed, using local cache', err);
        const key = 'evoReviewsLocal';
        const arr = JSON.parse(localStorage.getItem(key)||'[]');
        if(product_id) return arr.filter(r=>String(r.product_id)===String(product_id));
        return arr;
      }
    },
    submitPurchase: async function(purchase){
      try{
        const resp = await postJson('/api/purchases', purchase);
        return resp;
      }catch(err){
        console.warn('submitPurchase failed, saving locally', err);
        const key = 'evoPurchasesLocal';
        const arr = JSON.parse(localStorage.getItem(key)||'[]');
        arr.unshift(Object.assign({ id: Date.now(), created_at: new Date().toISOString() }, purchase));
        localStorage.setItem(key, JSON.stringify(arr));
        return { ok: true, fallback: true };
      }
    }
  };
})();
