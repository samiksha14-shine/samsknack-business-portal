import {OAuth2Client} from 'google-auth-library';

const googleClient = new OAuth2Client();
const ALLOWED_TEAM = {
  'samsknack@gmail.com': 'Samiksha',
  'snehalshinde302001@gmail.com': 'Snehal',
  'sandeshshinde15@gmail.com': 'Sandesh',
  'anket.nalawade42@gmail.com': 'Anket'
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ok:false, error:'POST only'});

  const gasUrl = process.env.GAS_WEB_APP_URL;
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const proxySecret = process.env.GAS_PROXY_SECRET;
  if (!gasUrl) return res.status(500).json({ok:false, error:'GAS_WEB_APP_URL is not configured on Vercel.'});
  if (!clientId) return res.status(500).json({ok:false, error:'GOOGLE_CLIENT_ID (or VITE_GOOGLE_CLIENT_ID) is not configured on Vercel.'});
  if (!proxySecret) return res.status(500).json({ok:false, error:'GAS_PROXY_SECRET is not configured on Vercel.'});

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const credential = typeof body.credential === 'string' ? body.credential : '';
    if (!credential) return res.status(401).json({ok:false, error:'Google sign-in credential missing.'});

    // Verify the Google ID token in Vercel, not inside Apps Script. The Google
    // Auth library validates the signature, audience, issuer, and expiry.
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({idToken:credential, audience:clientId});
      payload = ticket.getPayload();
    } catch (_) {
      return res.status(401).json({ok:false, error:'Google sign-in could not be verified. Please sign in again.'});
    }

    const email = String(payload?.email || '').trim().toLowerCase();
    if (payload?.email_verified !== true || !ALLOWED_TEAM[email]) {
      return res.status(403).json({ok:false, error:'This Google account is not approved for Samsknack.'});
    }

    // Never trust client-supplied auth details or proxy secrets.
    const forwardBody = {...body};
    delete forwardBody.credential;
    delete forwardBody.auth;
    delete forwardBody.proxySecret;
    forwardBody.auth = {name:ALLOWED_TEAM[email], email};
    forwardBody.proxySecret = proxySecret;

    const response = await fetch(gasUrl, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(forwardBody)
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = {ok:false, error:'Apps Script returned an invalid response.'}; }
    return res.status(response.ok ? 200 : 502).json(data);
  } catch (error) {
    console.error('Samsknack backend request failed:', error?.message || error);
    return res.status(500).json({ok:false, error:'The Samsknack backend could not complete the request. Please try again.'});
  }
}
