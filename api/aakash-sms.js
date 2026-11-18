// Vercel Serverless Function: Official Aakash SMS API Proxy
// Docs: https://sms.aakashsms.com/sms/v3/send/ | /sms/v1/credit | /sms/v1/report/api

const AAKASH_BASE = 'https://sms.aakashsms.com/sms/v1';
const AAKASH_SEND_URL = 'https://sms.aakashsms.com/sms/v3/send/';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO';

async function fetchAakashTokenFromSupabase() {
  try {
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    const [sysRes, orgRes, cfgRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/system_settings?select=company_profile&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/organizations?select=settings&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/communication_logs?channel=eq.WA_Config_Sync&order=sent_at.desc&limit=1`, { headers })
    ]);
    const [sysData, orgData, cfgData] = await Promise.all([
      sysRes.ok ? sysRes.json() : [],
      orgRes.ok ? orgRes.json() : [],
      cfgRes.ok ? cfgRes.json() : []
    ]);
    let syncToken = '';
    if (Array.isArray(cfgData) && cfgData[0]?.message) {
      try {
        syncToken = JSON.parse(cfgData[0].message)?.aakashSmsToken || '';
      } catch {
        syncToken = '';
      }
    }
    return String(
      orgData?.[0]?.settings?.aakashSmsToken ||
        sysData?.[0]?.company_profile?.aakashSmsToken ||
        syncToken ||
        ''
    ).trim();
  } catch {
    return '';
  }
}

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
    let authToken = String(token || process.env.AAKASH_SMS_TOKEN || '').trim();
    if (!authToken) {
      authToken = await fetchAakashTokenFromSupabase();
    }

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

    const { ok, json } = await postForm(AAKASH_SEND_URL, {
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
