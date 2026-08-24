export default async function handler(req, res) {
  // Simple Supabase-backed reviews endpoint.
  // Requires SUPABASE_URL and SUPABASE_KEY environment variables to be set on the server.
  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured on server. Set SUPABASE_URL and SUPABASE_KEY.' });
    }

    const headers = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    };

    if (req.method === 'POST') {
      const { product_id, rating, comment, user } = req.body || {};
      if (!product_id || typeof rating !== 'number' || !comment) {
        return res.status(400).json({ error: 'Missing required fields: product_id (number|string), rating (number), comment (string)' });
      }

      const payload = {
        product_id,
        rating,
        comment,
        user_first: user?.first || null,
        user_last: user?.last || null,
        created_at: new Date().toISOString()
      };

      const resp = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({ error: 'Supabase insert failed', detail: text });
      }

      const data = await resp.json();
      return res.status(200).json({ ok: true, review: data[0] });
    }

    // GET: /api/reviews?product_id=1
    if (req.method === 'GET') {
      const product_id = req.query?.product_id;
      let url = `${SUPABASE_URL}/rest/v1/reviews?order=created_at.desc`;
      if (product_id) url += `&product_id=eq.${encodeURIComponent(product_id)}`;

      const resp = await fetch(url, { method: 'GET', headers });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({ error: 'Supabase read failed', detail: text });
      }
      const data = await resp.json();
      return res.status(200).json({ ok: true, reviews: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('api/reviews error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
