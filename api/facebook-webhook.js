// Vercel Serverless Function: Official Meta Facebook Messenger & Page Comments Webhook
// Handles: Page Feed Comments (Public Reply + Private Reply to Messenger),
// Messenger 2-Way AI Counsellor (Master Prompt v5.0), Auto-Lead Capture & Human Takeover.

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'globalera_tvet_whatsapp_verify_2026';
const ENV_FB_PAGE_ID = process.env.FB_PAGE_ID || '';
const ENV_FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO';
const ENV_GEMINI_KEY = process.env.GEMINI_API_KEY || '';

async function supabaseRest(path, method = 'GET', body = null) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: method === 'GET' ? 'return=representation' : 'return=minimal'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) return null;
    if (method === 'GET') return await res.json();
    return true;
  } catch {
    return null;
  }
}

async function getRemoteBotConfig() {
  const [rows, cfgLogs] = await Promise.all([
    supabaseRest('system_settings?select=*&limit=1', 'GET'),
    supabaseRest('communication_logs?channel=eq.WA_Config_Sync&order=sent_at.desc&limit=1', 'GET')
  ]);
  const s = Array.isArray(rows) && rows[0] ? rows[0] : {};
  let logWaBot = {};
  if (Array.isArray(cfgLogs) && cfgLogs[0]?.message) {
    try {
      logWaBot = JSON.parse(cfgLogs[0].message) || {};
    } catch {
      logWaBot = {};
    }
  }
  const primaryWaBot = s.company_profile?.whatsappBot || {};
  const waBot = { ...logWaBot, ...primaryWaBot };
  const replyMode =
    waBot.replyMode === 'ai' || waBot.replyMode === 'bot' || waBot.replyMode === 'manual'
      ? waBot.replyMode
      : waBot.autoBotEnabled === false
        ? 'manual'
        : waBot.aiCounselorEnabled === false
          ? 'bot'
          : 'ai';
  return {
    replyMode,
    autoBotEnabled: replyMode !== 'manual' && waBot.autoBotEnabled !== false,
    aiCounselorEnabled: replyMode === 'ai' && waBot.aiCounselorEnabled !== false,
    geminiApiKey: (primaryWaBot.geminiApiKey || logWaBot.geminiApiKey || ENV_GEMINI_KEY || '').trim(),
    aiInstructions: waBot.aiInstructions || '',
    fbPageId: (primaryWaBot.fbPageId || logWaBot.fbPageId || ENV_FB_PAGE_ID || '').trim(),
    fbPageAccessToken: (primaryWaBot.fbPageAccessToken || logWaBot.fbPageAccessToken || ENV_FB_PAGE_TOKEN || '').trim(),
    fbAutoCommentReply: waBot.fbAutoCommentReply !== false
  };
}

function cleanPlainText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/^#{1,6}\s*(.*?)$/gm, '$1')
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const FB_COUNSELOR_PROMPT = `तपाईं "ग्लोबल एरा मल्टी सर्भिसको प्राविधिक स्कुल, जोरपाटी" (Global Era Multi Service Pvt. Ltd.) को आधिकारिक AI Admission & Career Counsellor हुनुहुन्छ।
शैली:
- रोबोट वा लामो ब्रोशर नपठाई, जोरपाटी अफिसको वास्तविक, नम्र र आत्मीय मानव काउन्सिलरले Messenger मा च्याट गरे जस्तो २-४ लाइनमा सटिक उत्तर दिनुहोस्।
- सोधिएको मात्र उत्तर दिनुहोस् — नसोधी अन्य कोर्स, लामो सिलेबस वा ठेगाना नथप्नुहोस्।
- नेपाली युनिकोड, रोमन नेपाली र अंग्रेजी सबै बुझ्नुहोस्, तर उत्तर सधैँ प्राकृतिक, मिठो नेपाली देवनागरीमा दिनुहोस् (अंग्रेजी मागे मात्र अंग्रेजीमा दिनुहोस्)।
- Recent chat राम्रोसँग पढ्नुहोस् — पहिले नै नमस्कार वा संस्थाको पूरा परिचय दिइसकेको भए फेरि नदोहोर्‍याउनुहोस्।
- "हजुर" वा "तपाईं" भन्नुहोस्। अन्त्यमा केवल एउटा छोटो सान्दर्भिक प्रश्न सोध्नुहोस्।
- Smart Lead Capture: पहिलो "Hi/नमस्ते" मै नम्बर नमाग्नुहोस्, तर ग्राहकले २–३ मेसेजपछि शुल्क वा समयबारे चासो देखाएमा नम्र शैलीमा नाम र WhatsApp/फोन नम्बर माग्नुहोस् ("नयाँ ब्याचको सिट र समय मिलाउन हजुरको नाम र WhatsApp/फोन नम्बर दिनुभए हाम्रो काउन्सिलरले कल गर्नुहुन्छ नि।")।

तथ्य (संस्करण ५.०):
- ठेगाना: गोकर्णेश्वर–५, जोरपाटी (चामुण्डा गेट विपरीत, कुमार गहना पसलसँगैको गल्लीभित्र, T-Mart को दोस्रो तला)। फोन: 01-4910715 / 9803614574।
- सिलाई तालिम: बेसिक (१ महिना, रु. 2,000, ७ आइटम), फुल (३ महिना, ५०% छुटमा रु. 15,000, २२ आइटम), स्पेसल (१ महिना, रु. 10,000, ७ आइटम)।
- ब्युटिसियन / पार्लर: बेसिक (१ महिना, रु. 2,000, ७ आइटम), फुल (३ महिना, ५०% छुटमा रु. 15,000, ४८ आइटम)।
- नेल आर्ट एन्ड एक्सटेन्सन: बेसिक (१५ दिन, रु. 10,000), प्रोफेसनल (३५ दिन, रु. 20,000)।
- आइल्यास एन्ड एक्सटेन्सन: बेसिक (१५ दिन, रु. 10,000), प्रोफेसनल (३५ दिन, रु. 20,000)।
- प्रोफेसनल कम्बो ब्युटिसियन: रु. 45,000 (फुल ब्युटिसियन + प्रोफेसनल नेल + प्रोफेसनल आइल्यास, रु. 10,000 बचत; कुल अवधि अनुमान नगर्नुहोस्)।
- कमर्सियल बेकरी: २ महिना, रु. 30,000, दैनिक ५ घण्टा (बिहान 11–4 बजे), लक्षित १०० आइटम।
- सिफ्ट: बिहान 7–9, 10–12, दिउँसो 12–2, 2–4, साँझ 4–6 बजे र जागिरदारका लागि Holiday Special Class।
- प्रमाणपत्र: संस्थाद्वारा जारी तालिम प्रमाणपत्र + Digital Profile + Skill Dossier (पुष्टि नभई CTEVT/सरकारी नभन्नुहोस्)। OJT र Job Placement Support छ (तर १००% जागिर ग्यारेन्टी नभन्नुहोस्)।`;

function needsFbHumanHandoff(text = '') {
  const lower = String(text || '').toLowerCase();
  const triggers = [
    'kista', 'installment', 'किस्ता',
    'ajhai chhut', 'extra discount', 'discount milchha', 'discount milcha', 'थप छुट', 'अझै छुट', 'kam garnu', 'कम गर्नु',
    'gunaso', 'complain', 'complaint', 'गुनासो',
    'call garnu', 'call me', 'कल गर्नु', 'फोन गर्नु',
    'office audai', 'अफिस आउँदै', 'bhetna audai', 'भेट्न आउँदै'
  ];
  return triggers.some((t) => lower.includes(t));
}

async function askGeminiFb({ geminiKey, userPrompt, customInstructions, history = [] }) {
  if (!geminiKey) return null;
  const recent = (history || [])
    .slice(0, 10)
    .reverse()
    .map((h) => `${h.channel?.includes('Inbound') ? 'Visitor' : 'Counsellor'}: ${h.message}`)
    .join('\n');

  const systemInstruction =
    FB_COUNSELOR_PROMPT +
    (customInstructions ? `\nअतिरिक्त जानकारी:\n${customInstructions}` : '');

  const contentsText =
    `Recent chat:\n${recent || '(New conversation)'}\n\n${userPrompt}`;

  const models = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
  for (const model of models) {
    try {
      const genConfig = { temperature: 0.42, maxOutputTokens: 600 };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: contentsText }] }],
            generationConfig: genConfig
          })
        }
      );
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return cleanPlainText(text);
    } catch {
      // try next model
    }
  }
  return null;
}

async function fetchFbProfileName(psid, pageToken) {
  if (!psid || !pageToken) return 'FB Visitor';
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(psid)}?fields=name&access_token=${encodeURIComponent(pageToken)}`
    );
    if (!res.ok) return 'FB Visitor';
    const data = await res.json();
    return data?.name || 'FB Visitor';
  } catch {
    return 'FB Visitor';
  }
}

async function logFbMessage({ channel, recipientId, recipientName, message, status = 'sent' }) {
  return supabaseRest('communication_logs', 'POST', {
    id: `FB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organization_id: 'ORG-GLOBALERA-01',
    channel,
    recipient_name: recipientName || 'FB Visitor',
    recipient_phone: String(recipientId || ''),
    message: message || '',
    status,
    sent_at: new Date().toISOString()
  });
}

async function autoCaptureFbLead({ senderName, senderId, messageText, source }) {
  const phoneMatch = String(messageText || '').match(/(?:\+?977[-\s]?)?(9[678]\d{8})\b/);
  const lower = String(messageText || '').toLowerCase();
  const hasIntent =
    Boolean(phoneMatch) ||
    lower.includes('admission') ||
    lower.includes('भर्ना') ||
    lower.includes('fee') ||
    lower.includes('सिक्न');
  if (!hasIntent) return;

  const phone = phoneMatch ? phoneMatch[1] : `FB-${String(senderId).slice(-8)}`;
  const existing = await supabaseRest(`leads?phone=eq.${encodeURIComponent(phone)}&limit=1`, 'GET');
  if (Array.isArray(existing) && existing.length > 0) return;

  await supabaseRest('leads', 'POST', {
    id: `LD-FB-${Date.now().toString().slice(-6)}`,
    organization_id: 'ORG-GLOBALERA-01',
    name: senderName || 'Facebook Inquiry',
    phone,
    source: source || 'Facebook Messenger',
    status: 'New',
    priority: 'High',
    notes: `Auto-captured from ${source || 'Facebook'}: ${messageText}`,
    created_at: new Date().toISOString()
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden: Invalid Verify Token');
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (body.object !== 'page') {
        return res.status(200).json({ status: 'ignored_non_page' });
      }

      const botConfig = await getRemoteBotConfig();
      const pageToken = botConfig.fbPageAccessToken;
      const pageId = botConfig.fbPageId;

      for (const entry of body.entry || []) {
        // 1. Handle Messenger Direct Messages
        for (const event of entry.messaging || []) {
          if (event.message?.is_echo) continue;
          const senderPsid = event.sender?.id;
          const msgText = (event.message?.text || event.postback?.title || '').trim();
          if (!senderPsid || !msgText) continue;

          const [senderName, history, pauseRows] = await Promise.all([
            fetchFbProfileName(senderPsid, pageToken),
            supabaseRest(
              `communication_logs?recipient_phone=eq.${encodeURIComponent(senderPsid)}&channel=ilike.FB_Messenger_*&order=sent_at.desc&limit=10`,
              'GET'
            ),
            supabaseRest(
              `communication_logs?recipient_phone=eq.${encodeURIComponent(`messenger:${senderPsid}`)}&channel=in.(WhatsApp_Bot_Pause,WhatsApp_Bot_Resume)&order=sent_at.desc&limit=1`,
              'GET'
            )
          ]);

          await Promise.all([
            logFbMessage({
              channel: 'FB_Messenger_Inbound',
              recipientId: senderPsid,
              recipientName: senderName,
              message: msgText,
              status: 'received'
            }),
            autoCaptureFbLead({ senderName, senderId: senderPsid, messageText: msgText, source: 'Facebook Messenger' })
          ]);

          // Check explicit pause state or human takeover (last 30 mins manual outbound)
          const explicitlyPaused = Array.isArray(pauseRows) && pauseRows[0]?.channel === 'WhatsApp_Bot_Pause';
          const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
          const recentHuman = Array.isArray(history)
            ? history.find((h) => h.channel === 'FB_Messenger_Outbound' && new Date(h.sent_at).getTime() > thirtyMinAgo)
            : null;

          if (!botConfig.autoBotEnabled || explicitlyPaused || recentHuman) continue;

          let replyText = null;
          if (needsFbHumanHandoff(msgText)) {
            replyText = 'एकछिन है हजुर, यो विषयमा हाम्रो जोरपाटी अफिसको सर/म्यामले नै हजुरलाई प्रत्यक्ष बुझाएर मिलाइदिनुहुन्छ — एकैछिनमा सम्पर्क गर्छौं है। 🙏';
            await supabaseRest('communication_logs', 'POST', {
              id: `WABOT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              organization_id: 'ORG-GLOBALERA-01',
              channel: 'WhatsApp_Bot_Pause',
              recipient_name: senderName || 'FB Visitor',
              recipient_phone: `messenger:${senderPsid}`,
              message: `[Smart Human Handoff triggered by: ${msgText.slice(0, 80)}]`,
              status: 'paused',
              sent_at: new Date().toISOString()
            });
          } else if (botConfig.aiCounselorEnabled && botConfig.geminiApiKey) {
            replyText = await askGeminiFb({
              geminiKey: botConfig.geminiApiKey,
              userPrompt: `Latest Messenger message from ${senderName}: "${msgText}"\nReply naturally:`,
              customInstructions: botConfig.aiInstructions,
              history: Array.isArray(history) ? history : []
            });
          }
          // Natural 2-second human-like pause before sending reply
          await new Promise((r) => setTimeout(r, 2000));
          if (!replyText) {
            replyText =
              'नमस्कार हजुर! ग्लोबल एरा मल्टी सर्भिसको प्राविधिक स्कुल, जोरपाटीमा स्वागत छ। हजुरलाई सिलाई, ब्युटिसियन, नेल आर्ट, आइल्यास वा बेकरीमध्ये कुन तालिमबारे जानकारी चाहिएको हो?';
          }

          if (pageToken) {
            const sendRes = await fetch(
              `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(pageToken)}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  recipient: { id: senderPsid },
                  messaging_type: 'RESPONSE',
                  message: { text: replyText }
                })
              }
            );
            await logFbMessage({
              channel: 'FB_Messenger_Bot',
              recipientId: senderPsid,
              recipientName: senderName,
              message: replyText,
              status: sendRes.ok ? 'sent' : 'failed'
            });
          }
        }

        // 2. Handle Facebook Page Comments (feed)
        for (const change of entry.changes || []) {
          if (change.field !== 'feed') continue;
          const val = change.value || {};
          if (val.item !== 'comment' || val.verb !== 'add') continue;
          const commentId = val.comment_id;
          const commentText = (val.message || '').trim();
          const commenterId = val.from?.id || '';
          const commenterName = val.from?.name || 'FB Commenter';

          // Ignore page's own comments
          if (!commentId || !commentText || (pageId && commenterId === pageId)) continue;

          await Promise.all([
            logFbMessage({
              channel: 'FB_Comment_Inbound',
              recipientId: commentId,
              recipientName: commenterName,
              message: commentText,
              status: 'received'
            }),
            autoCaptureFbLead({ senderName: commenterName, senderId: commenterId || commentId, messageText: commentText, source: 'Facebook Comment' })
          ]);

          if (!botConfig.autoBotEnabled || !botConfig.fbAutoCommentReply || !pageToken) continue;

          let privateReply = null;
          if (botConfig.aiCounselorEnabled && botConfig.geminiApiKey) {
            privateReply = await askGeminiFb({
              geminiKey: botConfig.geminiApiKey,
              userPrompt: `Visitor ${commenterName} commented on our Facebook post: "${commentText}". Write a warm 2-3 line private Messenger reply directly answering their comment:`,
              customInstructions: botConfig.aiInstructions
            });
          }
          if (!privateReply) {
            privateReply = `नमस्कार ${commenterName} ज्यू! हजुरले हाम्रो पोस्टमा कमेन्ट गर्नुभएको देख्यौँ। तालिम वा शुल्कबारे के जानकारी चाहनुहुन्छ, कृपया यहाँ म्यासेज गर्नुहोला है 🙏`;
          }

          const publicCommentReply = `नमस्कार हजुर! हजुरको Messenger इनबक्समा जानकारी पठाएका छौँ है 🙏 (सम्पर्क: 01-4910715 / 9803614574)`;

          // Send Private Reply to Messenger + Public Comment Reply in parallel
          const targetPage = pageId || entry.id;
          const [privRes] = await Promise.all([
            targetPage
              ? fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(targetPage)}/messages?access_token=${encodeURIComponent(pageToken)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    recipient: { comment_id: commentId },
                    message: { text: privateReply }
                  })
                })
              : Promise.resolve({ ok: false }),
            fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(commentId)}/comments?access_token=${encodeURIComponent(pageToken)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: publicCommentReply })
            })
          ]);

          await logFbMessage({
            channel: 'FB_Comment_Reply',
            recipientId: commentId,
            recipientName: commenterName,
            message: `[Private DM Sent]: ${privateReply}`,
            status: privRes.ok ? 'sent' : 'failed'
          });
        }
      }

      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      return res.status(500).json({ error: err?.message || 'Facebook webhook error' });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
