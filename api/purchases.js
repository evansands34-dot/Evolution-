export default async function handler(req, res) {
  // Simple Supabase-backed purchases endpoint.
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
      const { user, items, total, address } = req.body || {};
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: items (non-empty array)' });
      }
      const payload = {
        user_first: user?.first || null,
        user_last: user?.last || null,
        items: JSON.stringify(items),
        total: total || items.reduce((s,i)=>s+(i.price||0),0),
        address: address || null,
        created_at: new Date().toISOString()
      };

      const resp = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({ error: 'Supabase insert failed', detail: text });
      }
      const data = await resp.json();
      return res.status(200).json({ ok: true, purchase: data[0] });
    }

    if (req.method === 'GET') {
      const user_id = req.query?.user_id;
      let url = `${SUPABASE_URL}/rest/v1/purchases?order=created_at.desc`;
      // filtering by user_first could be done but better to use real auth; keep simple
      if (user_id) url += `&user_id=eq.${encodeURIComponent(user_id)}`;

      const resp = await fetch(url, { method: 'GET', headers });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(502).json({ error: 'Supabase read failed', detail: text });
      }
      const data = await resp.json();
      return res.status(200).json({ ok: true, purchases: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('api/purchases error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
