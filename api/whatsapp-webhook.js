// Vercel Serverless Function: Official Meta WhatsApp Business Cloud API Webhook
// Live URL: https://globalera.vercel.app/api/whatsapp-webhook

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'globalera_tvet_whatsapp_verify_2026';
const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EAAXs5uDM7CYBTKqFINzJDjZBEiRyfN5pWT5V4EftAnPfssMZBApLpRgfQYaEfZBtarXwIZA2IJh1Ux6JIrp8KAJRoI8UFP9ZCcti5xsZC2DkIaTKZBtkFFs8wfxCZCjSgxqySNpo2CzalInZCd2ZAZBsmKd4VsZBFSK20xyUm0ZBgLDMdZAOMVV6MgnBojhbeLvpLwnwZDZD';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1392365320634216';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO';

async function supabaseRest(path, method = 'GET', body = null) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) return null;
    if (method === 'GET') return await res.json();
    return true;
  } catch (err) {
    console.debug('[Supabase Webhook Sync Notice]:', err.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Meta Webhook Verification Challenge (GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden: Invalid Verify Token');
  }

  // 2. Inbound Message & Delivery Status Handling (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const statuses = changes?.statuses || [];
      const message = changes?.messages?.[0];
      const contact = changes?.contacts?.[0];
      const metadata = changes?.metadata;

      // Handle Delivery Status Receipts (sent -> delivered -> read -> failed)
      if (statuses.length > 0) {
        for (const st of statuses) {
          if (st?.id && st?.status) {
            await supabaseRest(
              `whatsapp_logs?meta_message_id=eq.${encodeURIComponent(st.id)}`,
              'PATCH',
              { status: st.status }
            );
          }
        }
        if (!message) {
          return res.status(200).json({ status: 'status_updated', count: statuses.length });
        }
      }

      if (!message) {
        return res.status(200).json({ status: 'ignored_empty' });
      }

      const senderPhone = message.from;
      const senderName = contact?.profile?.name || 'WhatsApp Visitor';
      const mediaCaption =
        message.image?.caption ||
        message.document?.caption ||
        message.video?.caption ||
        '';
      const mediaFilename = message.document?.filename || '';
      const messageText = (
        message.text?.body ||
        message.button?.text ||
        message.interactive?.button_reply?.title ||
        (mediaCaption ? `[${message.type}: ${mediaFilename || 'media'}] ${mediaCaption}` : `[${message.type || 'media'}${mediaFilename ? `: ${mediaFilename}` : ''}]`)
      ).trim();
      const currentPhoneId = metadata?.phone_number_id || PHONE_NUMBER_ID;

      // Capture Click-to-WhatsApp Facebook/Instagram Ad Referral Metadata
      const referral = message.referral || null;
      const adTag = referral
        ? `[FB Ad: ${referral.headline || referral.source_id || 'Campaign'}] `
        : '';

      // Store inbound message in Supabase for Live 3-Pane Hub & Tracking
      await supabaseRest('whatsapp_inbound_events', 'POST', {
        phone: senderPhone,
        sender_name: senderName,
        message_text: `${adTag}${messageText}`,
        raw_payload: {
          message_id: message.id,
          type: message.type,
          timestamp: message.timestamp,
          referral
        }
      });

      await supabaseRest('whatsapp_logs', 'POST', {
        phone: senderPhone,
        direction: 'inbound',
        message_type: referral ? 'fb_ad_inquiry' : (message.type || 'text'),
        status: 'received',
        content: `${adTag}${messageText}`,
        meta_message_id: message.id || null
      });

      // Intelligent Auto-Bot Reply (tailored to FB Ad referral if present)
      let botReply = '';
      const lower = `${messageText} ${referral?.headline || ''}`.toLowerCase();

      if (lower === '1' || lower.includes('caregiver') || lower.includes('care') || lower.includes('nurse')) {
        botReply = `🏥 *Caregiver Training (390 Hours / 3 Months)*\n\n` +
          `• 80% Practical Hands-on Training & Clinical Demos\n` +
          `• Curriculum: Vital signs, Elderly & Dementia care, Patient mobility, Emergency First Aid & Adult CPR\n` +
          `• CTEVT Accredited Certification with QR Verification\n` +
          `• Affordable Fee Policy: 50% on Enrollment + 50% Mid-Course\n` +
          `• Campus: Jorpati, Gokarneshwor, Kathmandu\n\n` +
          `Reply with *APPLY* to start your admission or call *01410715*.`;
      } else if (lower === '2' || lower.includes('tailor') || lower.includes('fashion') || lower.includes('dress') || lower.includes('sew')) {
        botReply = `👗 *Tailoring & Fashion Designing (390 Hours / 3 Months)*\n\n` +
          `• Individual Juki Industrial Sewing Machine guaranteed for every student\n` +
          `• Master Kurtha-Suruwal, Blouse variations, Pattern drafting, and Modern embroidery\n` +
          `• 100% Workshop Tools & Fabrics included\n` +
          `• 1-Click Graduation Portfolio Dossier & Boutique Job Placement support\n\n` +
          `Reply with *APPLY* to reserve your seat in the upcoming batch.`;
      } else if (lower === '3' || lower.includes('beauty') || lower.includes('salon') || lower.includes('parlor') || lower.includes('makeup')) {
        botReply = `💄 *Beautician & Cosmetology (390 Hours / 3 Months)*\n\n` +
          `• Professional Skin Care, Fruit Facial, Hair Treatment, Styling & Bridal Makeup\n` +
          `• International Standard Salon Equipment & Cosmetics provided\n` +
          `• Certified Trainer mentorship & Salon OJT Placement\n\n` +
          `Reply with *APPLY* to reserve your seat in the upcoming batch.`;
      } else {
        botReply = `🌟 *Welcome to Global Era Technical School!* 🌟\n` +
          `CTEVT Accredited Vocational Training Institute\n` +
          `Location: Jorpati, Gokarneshwor, Kathmandu (Near MitraPark Hub)\n\n` +
          `Please reply with a number to receive instant curriculum and fee details:\n` +
          `*1* — Caregiver Training (Healthcare)\n` +
          `*2* — Tailoring & Fashion Designing\n` +
          `*3* — Beautician & Cosmetology\n` +
          `*4* — Speak with our Admission Counselor (01410715)\n\n` +
          `🌐 Website: https://globalera.vercel.app`;
      }

      if (currentPhoneId && META_ACCESS_TOKEN) {
        try {
          const sendRes = await fetch(`https://graph.facebook.com/v19.0/${currentPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${META_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: senderPhone,
              type: 'text',
              text: { body: botReply }
            })
          });
          const sendJson = await sendRes.json();
          const botMsgId = sendJson?.messages?.[0]?.id || null;
          await supabaseRest('whatsapp_logs', 'POST', {
            phone: senderPhone,
            direction: 'outbound',
            message_type: 'auto_bot',
            status: sendRes.ok ? 'sent' : 'failed',
            content: botReply,
            meta_message_id: botMsgId
          });
        } catch (apiErr) {
          console.error('[Meta API Send Error]:', apiErr.message);
        }
      }

      return res.status(200).json({ status: 'success', reply: botReply });
    } catch (err) {
      console.error('[WhatsApp Webhook Handler Error]:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
