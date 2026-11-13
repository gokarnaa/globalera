// Vercel Serverless Function: Official Meta WhatsApp Business Cloud API Webhook
// Live URL: https://globalera.vercel.app/api/whatsapp-webhook

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'globalera_tvet_whatsapp_verify_2026';
const META_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'EAAfNnTOAYlMBS2hlBdjXhFtlm6LRZAT17r5o01sqPalD82sDqegG7vcM0McAXXZCM07wiAQF913m4OTHDiZCU6TcpPTZBQRgHc1k9GxmXTM79l2tRW1ZCjkj3oKsgHwMfLNxL1QVnt5RwImV7Gzx1OnW0bHshrBWg6BJNhNDEwGwIZB76q2E2LLyOf3EbwMjoxUcX7Yr8MZAmeBuMknkBoAcFHY7SArMeb5cEgjL4UFdbCleouJVKVlYfMqEH8mVJHJ3ZAAgGGQ5IiEzjguCg9ez2nHebcBa1lorIwZDZD';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1419057191293304';

export default async function handler(req, res) {
  // Set CORS headers
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
      console.log('[Meta WhatsApp Webhook] Challenge verified successfully!');
      return res.status(200).send(challenge);
    }
    console.warn('[Meta WhatsApp Webhook] Verification failed. Received token:', token);
    return res.status(403).send('Forbidden: Invalid Verify Token');
  }

  // 2. Inbound Message Event Handling (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];
      const contact = changes?.contacts?.[0];
      const metadata = changes?.metadata;

      // Ignore status receipts (sent, delivered, read)
      if (!message) {
        return res.status(200).json({ status: 'ignored_status_or_empty' });
      }

      const senderPhone = message.from; // e.g. "9779851000000"
      const senderName = contact?.profile?.name || 'WhatsApp Visitor';
      const messageText = (message.text?.body || message.type || '').trim();
      const currentPhoneId = metadata?.phone_number_id || PHONE_NUMBER_ID;

      console.log(`[WhatsApp Message Received] From: ${senderName} (${senderPhone}) Text: ${messageText}`);

      // Intelligent Interactive Bot Reply Menu
      let botReply = '';
      const lower = messageText.toLowerCase();

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

      // Send reply via Meta WhatsApp Cloud API
      if (currentPhoneId && META_ACCESS_TOKEN) {
        try {
          await fetch(`https://graph.facebook.com/v19.0/${currentPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${META_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: senderPhone,
              type: 'text',
              text: { body: botReply }
            })
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
