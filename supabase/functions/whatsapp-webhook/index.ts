// Supabase Edge Function: Meta WhatsApp Cloud API Webhook Handler
// URL: https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "globalera_tvet_whatsapp_verify_2026";
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "EAAfNnTOAYlMBS2hlBdjXhFtlm6LRZAT17r5o01sqPalD82sDqegG7vcM0McAXXZCM07wiAQF913m4OTHDiZCU6TcpPTZBQRgHc1k9GxmXTM79l2tRW1ZCjkj3oKsgHwMfLNxL1QVnt5RwImV7Gzx1OnW0bHshrBWg6BJNhNDEwGwIZB76q2E2LLyOf3EbwMjoxUcX7Yr8MZAmeBuMknkBoAcFHY7SArMeb5cEgjL4UFdbCleouJVKVlYfMqEH8mVJHJ3ZAAgGGQ5IiEzjguCg9ez2nHebcBa1lorIwZDZD";
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "1419057191293304";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);

  // 1. Meta Webhook Verification (GET request)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      console.log("[WhatsApp Webhook] Verification successful!");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden: Invalid Verify Token", { status: 403 });
  }

  // 2. Inbound Message Handling (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const message = changes?.messages?.[0];
      const contact = changes?.contacts?.[0];
      const metadata = changes?.metadata;

      if (!message) {
        return new Response(JSON.stringify({ status: "ignored_non_message" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const senderPhone = message.from; // e.g. "9779851000000"
      const senderName = contact?.profile?.name || "WhatsApp Visitor";
      const messageText = message.text?.body || message.type || "";
      const messageId = message.id;
      const phoneNumberId = metadata?.phone_number_id;

      console.log(`[WhatsApp Inbound] From: ${senderName} (${senderPhone}), Text: ${messageText}`);

      // Auto-reply generator logic
      let botReply = "";
      const lower = messageText.toLowerCase().trim();

      if (lower === "1" || lower.includes("caregiver") || lower.includes("care")) {
        botReply = `🏥 *Caregiver Training (390 Hours / 3 Months)*\n\n` +
          `• 80% Practical Hands-on Training\n` +
          `• Curriculum: Vital signs, Elderly & Dementia care, Patient mobility, Emergency First Aid & CPR\n` +
          `• CTEVT Accredited Certification with QR Verification\n` +
          `• 50% on Enrollment + 50% Mid-Course Fee Policy\n` +
          `• Campus: Jorpati, Gokarneshwor, Kathmandu\n\n` +
          `Reply with *APPLY* to start your admission or *CALL* to speak with our front desk.`;
      } else if (lower === "2" || lower.includes("tailor") || lower.includes("fashion") || lower.includes("sewing")) {
        botReply = `👗 *Tailoring & Fashion Designing (390 Hours / 3 Months)*\n\n` +
          `• Individual Juki Industrial Sewing Machine guaranteed for every student\n` +
          `• Master Kurtha-Suruwal, Blouse variations, Pattern drafting, and Modern embroidery\n` +
          `• 100% Workshop Tools & Fabrics included\n` +
          `• 1-Click Graduation Portfolio Dossier & Boutique Job Placement support\n\n` +
          `Reply with *APPLY* to register your seat or *VISIT* to book a free campus tour.`;
      } else if (lower === "3" || lower.includes("beauty") || lower.includes("salon") || lower.includes("parlor")) {
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
          `🌐 Website: https://globalera.com.np`;
      }

      // Record in Supabase database
      await supabase.from("whatsapp_inbound_events").insert({
        sender_phone: senderPhone,
        sender_name: senderName,
        message_text: messageText,
        meta_message_id: messageId,
        bot_reply_sent: botReply
      });

      // Send automated reply back via Meta Cloud API
      const targetPhoneId = phoneNumberId || WHATSAPP_PHONE_NUMBER_ID;
      if (targetPhoneId && WHATSAPP_ACCESS_TOKEN) {
        await fetch(`https://graph.facebook.com/v19.0/${targetPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: senderPhone,
            type: "text",
            text: { body: botReply }
          })
        });
      }

      return new Response(JSON.stringify({ status: "success", reply: botReply }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err: any) {
      console.error("[WhatsApp Webhook Error]:", err.message);
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
