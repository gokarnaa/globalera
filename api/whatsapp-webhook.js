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

      const mediaObj = message.image || message.document || message.audio || message.video || null;
      const mediaInfo = mediaObj?.id
        ? {
            id: mediaObj.id,
            type: message.type,
            mimeType: mediaObj.mime_type || '',
            filename: mediaObj.filename || ''
          }
        : null;

      // Store inbound message in Supabase for Live 3-Pane Hub & Tracking
      await supabaseRest('whatsapp_inbound_events', 'POST', {
        phone: senderPhone,
        sender_name: senderName,
        message_text: `${adTag}${messageText}`,
        raw_payload: {
          message_id: message.id,
          type: message.type,
          timestamp: message.timestamp,
          referral,
          media: mediaInfo
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
        botReply = `🏥 *केयरगिभर तालिम (Caregiver — 390 Hours / 3 Months)*\n` +
          `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
          `• 80% प्रयोगात्मक क्लिनिकल ल्याब अभ्यास\n` +
          `• विषयवस्तु: Vital Signs, वृद्धवृद्धा तथा बिरामी स्याहार, First Aid र Adult CPR\n` +
          `• CTEVT मान्यता प्राप्त प्रमाणपत्र (QR Verification सहित)\n` +
          `• सहज शुल्क नीति: भर्ना हुँदा 50% + मध्य-कोर्समा 50%\n` +
          `• ठेगाना: जोरपाटी, गोकर्णेश्वर, काठमाडौं\n\n` +
          `भर्ना वा परामर्शको लागि *APPLY* लेखेर पठाउनुहोस् वा फोन गर्नुहोस्: 01-4910715 / 9803614574`;
      } else if (lower === '2' || lower.includes('tailor') || lower.includes('fashion') || lower.includes('dress') || lower.includes('sew')) {
        botReply = `👗 *टेलरिङ तथा फेसन डिजाइनिङ (390 Hours / 3 Months)*\n` +
          `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
          `• प्रत्येक विद्यार्थीलाई छुट्टै Juki Industrial Sewing Machine को ग्यारेन्टी\n` +
          `• कुर्ता-सुरुवाल, ब्लाउज, प्याटर्न ड्राफ्टिङ र आधुनिक सिलाइ अभ्यास\n` +
          `• 100% वर्कशप औजार र कपडा संस्थाबाटै उपलब्ध\n` +
          `• रोजगारी तथा बुटिक प्लेसमेन्ट समन्वय\n\n` +
          `सिट सुरक्षित गर्न *APPLY* लेखेर पठाउनुहोस् वा फोन गर्नुहोस्: 01-4910715 / 9803614574`;
      } else if (lower === '3' || lower.includes('beauty') || lower.includes('salon') || lower.includes('parlor') || lower.includes('makeup')) {
        botReply = `💄 *ब्युटिसियन तथा कस्मेटोलोजी (390 Hours / 3 Months)*\n` +
          `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
          `• प्रोफेसनल स्किन केयर, फेसियल, हेयर ट्रिटमेन्ट, स्टाइलिङ र ब्राइडल मेकअप\n` +
          `• अन्तर्राष्ट्रिय स्तरका सलुन उपकरण र कस्मेटिक सामग्री उपलब्ध\n` +
          `• प्रमाणित ट्रेनरद्वारा प्रशिक्षण र सलुन OJT प्लेसमेन्ट\n\n` +
          `भर्नाका लागि *APPLY* लेखेर पठाउनुहोस् वा फोन गर्नुहोस्: 01-4910715 / 9803614574`;
      } else {
        botReply = `🌟 *ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी) मा स्वागत छ!* 🌟\n` +
          `CTEVT मान्यता प्राप्त व्यावसायिक तालिम केन्द्र\n` +
          `ठेगाना: जोरपाटी, गोकर्णेश्वर, काठमाडौं (मित्रपार्क हब नजिक)\n\n` +
          `तत्काल कोर्स र शुल्क जानकारी पाउन तलको नम्बर टाइप गरी पठाउनुहोस्:\n` +
          `*1* — केयरगिभर तालिम (Caregiver)\n` +
          `*2* — टेलरिङ तथा फेसन डिजाइनिङ (Tailoring)\n` +
          `*3* — ब्युटिसियन तथा कस्मेटोलोजी (Beautician)\n` +
          `*4* — भर्ना परामर्शदातासँग कुरा गर्न (01-4910715 / 9803614574)\n\n` +
          `🌐 वेबसाइट: https://globalera.vercel.app`;
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
