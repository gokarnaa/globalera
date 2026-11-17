// Vercel Serverless Function: Upload HD Bill/Receipt PNG to Meta Cloud API & Send via WhatsApp
// Endpoint: POST /api/whatsapp-send-media

const META_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  'EAAXs5uDM7CYBTKqFINzJDjZBEiRyfN5pWT5V4EftAnPfssMZBApLpRgfQYaEfZBtarXwIZA2IJh1Ux6JIrp8KAJRoI8UFP9ZCcti5xsZC2DkIaTKZBtkFFs8wfxCZCjSgxqySNpo2CzalInZCd2ZAZBsmKd4VsZBFSK20xyUm0ZBgLDMdZAOMVV6MgnBojhbeLvpLwnwZDZD';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1392365320634216';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { to, imageBase64, caption = '', filename = 'Official_Bill.png', phoneNumberId, accessToken } = req.body || {};
    if (!to || !imageBase64) {
      return res.status(400).json({ error: 'Missing recipient or imageBase64 payload' });
    }

    const activeToken = (accessToken || META_ACCESS_TOKEN).trim();
    const activePhoneId = (phoneNumberId || PHONE_NUMBER_ID).trim();

    // Strip data:image/...;base64, prefix
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const binaryBuffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([binaryBuffer], { type: 'image/png' });

    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', 'image/png');
    formData.append('file', blob, filename);

    // 1. Upload PNG to Meta Media API
    const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${activePhoneId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${activeToken}` },
      body: formData
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok || !uploadJson?.id) {
      return res.status(uploadRes.status || 400).json({
        error: uploadJson?.error?.message || 'Failed to upload bill image to Meta Media API'
      });
    }

    // 2. Send Image Message via Meta Cloud API
    const msgRes = await fetch(`https://graph.facebook.com/v19.0/${activePhoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: {
          id: uploadJson.id,
          caption
        }
      })
    });
    const msgJson = await msgRes.json();
    if (!msgRes.ok) {
      return res.status(msgRes.status || 400).json({
        error: msgJson?.error?.message || 'Failed to send WhatsApp bill image'
      });
    }

    const metaMessageId = msgJson?.messages?.[0]?.id || null;

    // 3. Log in Supabase whatsapp_logs
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_logs`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            phone: to,
            direction: 'outbound',
            message_type: 'bill_image',
            status: 'sent',
            content: caption || `[Signed Bill Image: ${filename}]`,
            meta_message_id: metaMessageId
          })
        });
      } catch {
        // non-fatal log error
      }
    }

    return res.status(200).json({ ok: true, mediaId: uploadJson.id, messageId: metaMessageId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
