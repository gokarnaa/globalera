// Vercel Serverless Function: Official Aakash SMS v1 API Proxy
// Docs: https://aakashsms.com/admin/public/sms/v1/send | /credit | /report/api

const AAKASH_BASE = 'https://aakashsms.com/admin/public/sms/v1';

function normalizeNepal10List(to) {
  const parts = String(to || '')
    .split(',')
    .map((p) => p.replace(/\D/g, ''))
    .map((d) => (d.length > 10 ? d.slice(-10) : d))
    .filter((d) => d.length === 10);
  return [...new Set(parts)].join(',');
}

async function postForm(url, params) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, json };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { action = 'send', token, from = '31001', to, text, page = 1 } = req.body || {};
    const authToken = String(token || process.env.AAKASH_SMS_TOKEN || '').trim();

    if (!authToken) {
      return res.status(400).json({
        ok: false,
        error: 'Aakash SMS Auth Token is missing. Please save your token in Settings -> Aakash SMS & Automation.'
      });
    }

    if (action === 'credit') {
      const { ok, json } = await postForm(`${AAKASH_BASE}/credit`, { auth_token: authToken });
      const isSuccess = ok && (json.response_code === 202 || json.available_credit !== undefined);
      return res.status(isSuccess ? 200 : 400).json({
        ok: isSuccess,
        ...json,
        error: isSuccess ? null : json.response || json.message || 'Credit check failed'
      });
    }

    if (action === 'report') {
      const { ok, json } = await postForm(`${AAKASH_BASE}/report/api`, {
        auth_token: authToken,
        page: String(page || 1)
      });
      return res.status(ok ? 200 : 400).json({ ok, ...json });
    }

    // Default: action === 'send'
    const normalizedTo = normalizeNepal10List(to);
    if (!normalizedTo) {
      return res.status(400).json({ ok: false, error: 'Valid 10-digit Nepal mobile number is required.' });
    }
    if (!String(text || '').trim()) {
      return res.status(400).json({ ok: false, error: 'SMS text cannot be empty.' });
    }

    const { ok, json } = await postForm(`${AAKASH_BASE}/send`, {
      auth_token: authToken,
      from: String(from || '31001'),
      to: normalizedTo,
      text: String(text).trim()
    });

    const hasErrorCode = Number(json.response_code) >= 4000 || json.error === true;
    const isSuccess = ok && !hasErrorCode;

    return res.status(isSuccess ? 200 : 400).json({
      ok: isSuccess,
      to: normalizedTo,
      ...json,
      error: isSuccess ? null : json.response || json.message || `Aakash SMS error (${json.response_code || 'unknown'})`
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Aakash SMS proxy error' });
  }
}
