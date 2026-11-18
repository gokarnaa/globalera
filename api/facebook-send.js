// Vercel Serverless Function: Send manual/AI reply to Facebook Messenger or Page Comment
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO';
const ENV_FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';

async function getPageAccessToken() {
  if (ENV_FB_PAGE_TOKEN) return ENV_FB_PAGE_TOKEN;
  try {
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    const [sysRes, cfgRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/system_settings?select=company_profile&limit=1`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/communication_logs?channel=eq.WA_Config_Sync&order=sent_at.desc&limit=1`, { headers })
    ]);
    const [sysData, cfgData] = await Promise.all([
      sysRes.ok ? sysRes.json() : [],
      cfgRes.ok ? cfgRes.json() : []
    ]);
    let logBot = {};
    if (Array.isArray(cfgData) && cfgData[0]?.message) {
      try {
        logBot = JSON.parse(cfgData[0].message) || {};
      } catch {
        logBot = {};
      }
    }
    return (
      sysData?.[0]?.company_profile?.whatsappBot?.fbPageAccessToken ||
      logBot.fbPageAccessToken ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  try {
    const { targetId, targetName = 'FB Visitor', channel = 'messenger', text, pageToken: bodyToken, messageType = 'text' } = req.body || {};
    const pageToken = (bodyToken || (await getPageAccessToken()) || '').trim();
    if (!pageToken) {
      return res.status(400).json({ ok: false, error: 'Facebook Page Access Token is not configured.' });
    }
    if (!targetId || !String(text || '').trim()) {
      return res.status(400).json({ ok: false, error: 'Target ID and message text are required.' });
    }

    const cleanText = String(text).trim();
    let apiRes;
    if (channel === 'fb_comment') {
      apiRes = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(targetId)}/comments?access_token=${encodeURIComponent(pageToken)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: cleanText })
        }
      );
    } else {
      apiRes = await fetch(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(pageToken)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: targetId },
            messaging_type: 'RESPONSE',
            message: { text: cleanText }
          })
        }
      );
    }

    const data = await apiRes.json().catch(() => ({}));
    if (!apiRes.ok) {
      return res.status(400).json({ ok: false, error: data?.error?.message || 'Facebook API error' });
    }

    // Log outbound message to communication_logs
    const logChannel =
      channel === 'fb_comment'
        ? 'FB_Comment_Reply'
        : messageType === 'auto_bot'
          ? 'FB_Messenger_Bot'
          : 'FB_Messenger_Outbound';

    await fetch(`${SUPABASE_URL}/rest/v1/communication_logs`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        id: `FB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        organization_id: 'ORG-GLOBALERA-01',
        channel: logChannel,
        recipient_name: targetName,
        recipient_phone: String(targetId),
        message: cleanText,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
    });

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Failed to send Facebook message' });
  }
}
