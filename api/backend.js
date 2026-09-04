export default async function handler(req, res) {
  const gasUrl = process.env.GAS_WEB_APP_URL;
  if (!gasUrl) return res.status(500).json({ ok:false, error:'GAS_WEB_APP_URL is not configured on Vercel.' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'POST only' });
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(req.body || {})
    });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = {ok:false,error:text}; }
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (e) { return res.status(500).json({ok:false,error:e.message}); }
}
