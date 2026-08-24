export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(200).json({ ok: true, message: 'Evo AI endpoint (POST with {message, product})' });
    }

    const { message, product } = req.body || {};
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: missing OPENAI_API_KEY environment variable' });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "message" in request body' });
    }

    // Build system prompt with product context when available
    let systemPrompt = `You are "Evo AI", a helpful assistant for the Evolution e-commerce store. Answer user questions about products, sizing, materials, shipping, compatibility, and style. Be concise and friendly.`;
    let userContent = `User question: ${message}`;
    if (product) {
      userContent += `\n\nProduct context (JSON): ${JSON.stringify(product)}`;
    }

    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(502).json({ error: 'OpenAI error', detail: txt });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || '';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Evo AI error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
