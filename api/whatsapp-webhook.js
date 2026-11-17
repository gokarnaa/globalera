// Vercel Serverless Function: Official Meta WhatsApp Cloud API Webhook
// Features: Delivery Status Sync, FB Ad Referral Capture, Media Metadata,
// Server-Side Human Takeover, Student Self-Service Lookup, Auto-Lead Capture & Gemini 2.5 Flash Two-Way AI Counselor.

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'globalera_tvet_whatsapp_verify_2026';
const META_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  'EAAXs5uDM7CYBTKqFINzJDjZBEiRyfN5pWT5V4EftAnPfssMZBApLpRgfQYaEfZBtarXwIZA2IJh1Ux6JIrp8KAJRoI8UFP9ZCcti5xsZC2DkIaTKZBtkFFs8wfxCZCjSgxqySNpo2CzalInZCd2ZAZBsmKd4VsZBFSK20xyUm0ZBgLDMdZAOMVV6MgnBojhbeLvpLwnwZDZD';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1392365320634216';

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
  } catch (err) {
    console.debug('[Supabase Webhook Sync Notice]:', err.message);
    return null;
  }
}

function last10(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length > 10 ? d.slice(-10) : d;
}

async function getRemoteBotConfig() {
  const rows = await supabaseRest('system_settings?select=*&limit=1', 'GET');
  const s = Array.isArray(rows) && rows[0] ? rows[0] : {};
  const waBot =
    s.company_profile?.whatsappBot ||
    s.extra_settings?.whatsappBot ||
    s.whatsapp_bot ||
    {};
  return {
    autoBotEnabled: waBot.autoBotEnabled !== false,
    aiCounselorEnabled: waBot.aiCounselorEnabled !== false,
    geminiApiKey: (waBot.geminiApiKey || ENV_GEMINI_KEY || '').trim(),
    aiInstructions: waBot.aiInstructions || ''
  };
}

async function fetchConversationHistory(senderPhone) {
  const phone10 = last10(senderPhone);
  const waLogs = await supabaseRest(
    `whatsapp_logs?phone=ilike.*${encodeURIComponent(phone10)}&order=created_at.desc&limit=12`,
    'GET'
  );
  if (Array.isArray(waLogs)) return waLogs;

  // Fallback to communication_logs if whatsapp_logs table is not yet migrated
  const commLogs = await supabaseRest(
    `communication_logs?recipient_phone=ilike.*${encodeURIComponent(phone10)}&channel=ilike.WhatsApp*&order=sent_at.desc&limit=12`,
    'GET'
  );
  if (!Array.isArray(commLogs)) return [];
  return commLogs.map((c) => {
    const ch = String(c.channel || '');
    const direction = ch === 'WhatsApp_Inbound' ? 'inbound' : 'outbound';
    const message_type =
      ch === 'WhatsApp_Bot'
        ? 'auto_bot'
        : ch === 'WhatsApp_Bot_Pause'
          ? 'bot_pause_state'
          : ch === 'WhatsApp_Bot_Resume'
            ? 'bot_resume_state'
            : 'text';
    return {
      direction,
      message_type,
      content: c.message || '',
      created_at: c.sent_at
    };
  });
}

async function logToSupabase({ phone, senderName, direction, messageType, status, content, metaMessageId }) {
  const ok = await supabaseRest('whatsapp_logs', 'POST', {
    phone,
    direction,
    message_type: messageType,
    status,
    content,
    meta_message_id: metaMessageId || null
  });
  if (ok) return true;

  // Fallback to communication_logs (always present in schema)
  const channel =
    direction === 'inbound'
      ? 'WhatsApp_Inbound'
      : messageType === 'auto_bot'
        ? 'WhatsApp_Bot'
        : messageType === 'bot_pause_state'
          ? 'WhatsApp_Bot_Pause'
          : messageType === 'bot_resume_state'
            ? 'WhatsApp_Bot_Resume'
            : 'WhatsApp_Outbound';
  return supabaseRest('communication_logs', 'POST', {
    id: `WA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organization_id: 'ORG-GLOBALERA-01',
    channel,
    recipient_name: senderName || 'WhatsApp Visitor',
    recipient_phone: last10(phone) || phone,
    message: content || '',
    status: status || 'sent',
    sent_at: new Date().toISOString()
  });
}

async function isHumanTakeoverActive(senderPhone) {
  const logs = await fetchConversationHistory(senderPhone);
  if (!Array.isArray(logs) || logs.length === 0) return { paused: false, history: [] };

  // Check explicit pause/resume state
  const stateLog = logs.find((l) => l.message_type === 'bot_pause_state' || l.message_type === 'bot_resume_state');
  if (stateLog && stateLog.message_type === 'bot_pause_state') {
    return { paused: true, history: logs };
  }

  // Auto-pause for 30 minutes if a human staff member replied directly
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  const recentHumanReply = logs.find(
    (l) =>
      l.direction === 'outbound' &&
      l.message_type !== 'auto_bot' &&
      l.message_type !== 'bot_resume_state' &&
      new Date(l.created_at).getTime() > thirtyMinAgo
  );
  return { paused: Boolean(recentHumanReply), history: logs };
}

async function getStudentSelfServiceContext(senderPhone) {
  const phone10 = last10(senderPhone);
  if (!phone10) return '';
  const students = await supabaseRest(
    `students?phone=ilike.*${encodeURIComponent(phone10)}&limit=1`,
    'GET'
  );
  const std = Array.isArray(students) && students[0] ? students[0] : null;
  if (!std) return '';

  const [payments, certs] = await Promise.all([
    supabaseRest(`payments?student_id=eq.${encodeURIComponent(std.id)}&select=amount,receipt_no,payment_date`, 'GET'),
    supabaseRest(`certificates?student_id=eq.${encodeURIComponent(std.id)}&select=certificate_no,status`, 'GET')
  ]);

  const paid = Array.isArray(payments) && payments.length > 0
    ? payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    : Number(std.fee_paid ?? std.paid_fee ?? 0);
  const totalFee = Number(std.fee_amount ?? std.total_fee ?? 0);
  const due = Math.max(0, totalFee - paid);
  const certNo = Array.isArray(certs) && certs[0]?.certificate_no ? certs[0].certificate_no : null;

  return (
    `\n[ENROLLED STUDENT VERIFIED RECORD FOR THIS PHONE]:\n` +
    `- Name: ${std.name}\n` +
    `- TGID: ${std.tgid || '-'}\n` +
    `- Status: ${std.status || 'Active'}\n` +
    `- Total Fee: Rs. ${totalFee.toLocaleString()}\n` +
    `- Paid Fee: Rs. ${paid.toLocaleString()}\n` +
    `- Remaining Due: Rs. ${due.toLocaleString()}\n` +
    (certNo ? `- Certificate No: ${certNo} (Verify URL: https://globalera.vercel.app/?verify=${encodeURIComponent(certNo)})\n` : '')
  );
}

async function autoCaptureLeadIfNeeded(senderPhone, senderName, messageText, referral) {
  const lower = messageText.toLowerCase();
  const isLeadIntent =
    lower === '4' ||
    lower.includes('apply') ||
    lower.includes('admission') ||
    lower.includes('भर्ना') ||
    Boolean(referral);
  if (!isLeadIntent) return;

  const phone10 = last10(senderPhone);
  const existing = await supabaseRest(`leads?phone=ilike.*${encodeURIComponent(phone10)}&limit=1`, 'GET');
  if (Array.isArray(existing) && existing.length > 0) return;

  await supabaseRest('leads', 'POST', {
    id: `LD-WA-${Date.now().toString().slice(-6)}`,
    organization_id: 'ORG-GLOBALERA-01',
    name: senderName || 'WhatsApp Inquiry',
    phone: phone10 || senderPhone,
    source: referral ? 'Facebook Ad (WhatsApp)' : 'WhatsApp Auto-Bot',
    status: 'New',
    priority: 'High',
    notes: `${referral?.headline ? `Ad: ${referral.headline} | ` : ''}Auto-captured from WhatsApp: ${messageText}`,
    created_at: new Date().toISOString()
  });
}

async function askGeminiCounselor({ geminiKey, messageText, senderName, history, studentContext, referral, customInstructions }) {
  if (!geminiKey) return null;

  const recentTurns = (history || [])
    .filter((h) => h.message_type !== 'bot_pause_state' && h.message_type !== 'bot_resume_state' && h.content)
    .slice(0, 8)
    .reverse()
    .map((h) => `${h.direction === 'inbound' ? 'User' : 'Counselor'}: ${h.content}`)
    .join('\n');

  const systemPrompt =
    `You are the official 24/7 AI Admission & Student Counselor for "ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)" (Global Era Multi Service Pvt. Ltd. — Prabidhik School, Jorpati, Gokarneshwor, Kathmandu, near MitraPark Hub).\n\n` +
    `STRICT RULES:\n` +
    `1. Reply warmly in polite, natural Nepali (Devanagari), but ALWAYS write phone numbers (01-4910715, 9803614574), currency amounts (Rs. ...), shift codes (Shift A-E), and numbers using English digits (0-9).\n` +
    `2. Keep replies concise and WhatsApp-friendly (under 140 words).\n` +
    `3. Core Facts:\n` +
    `   - Courses: Caregiver Training (390 Hours / 3 Months), Tailoring & Fashion Designing (390 Hours / 3 Months), Beautician & Cosmetology (390 Hours / 3 Months).\n` +
    `   - Training style: 80% practical hands-on lab/workshop, CTEVT accredited certification with QR verification, OJT & job placement assistance.\n` +
    `   - Fee Policy: Easy 50% on admission + 50% mid-course.\n` +
    `   - Daily 2-hour shifts (Sun–Fri): Shift A (7–9 AM), Shift B (10–12 PM), Shift C (12–2 PM), Shift D (2–4 PM), Shift E (4–6 PM).\n` +
    `   - Admission documents: Citizenship copy, 2 PP photos, last academic certificate copy, 50% advance fee.\n` +
    `   - Website: https://globalera.vercel.app\n` +
    `4. Never invent guaranteed visa, salary, or unverified fees. If unsure or asked for exact fee discounts, ask them to call 01-4910715 or 9803614574.\n` +
    (customInstructions ? `5. Extra Institute Instructions:\n${customInstructions}\n` : '') +
    (studentContext ? `\n${studentContext}\nUse this verified record ONLY if this student asks about their fee, due, TGID, or certificate.\n` : '') +
    (referral ? `\n[User arrived from Facebook Ad: ${referral.headline || 'Vocational Course Ad'}]\n` : '');

  const userPrompt =
    `Recent conversation:\n${recentTurns || '(New conversation)'}\n\n` +
    `Latest message from ${senderName}:\n"${messageText}"\n\n` +
    `Write the Counselor reply now:`;

  const models = ['gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.8-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 450 }
          })
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) return reply;
    } catch (err) {
      console.debug(`[Gemini Counselor Fallback ${model}]:`, err.message);
    }
  }
  return null;
}

function buildKeywordFallbackReply(messageText, referral) {
  const lower = `${messageText} ${referral?.headline || ''}`.toLowerCase();

  if (lower === '1' || lower.includes('caregiver') || lower.includes('care') || lower.includes('nurse')) {
    return `🏥 *केयरगिभर तालिम (Caregiver — 390 Hours / 3 Months)*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `• 80% प्रयोगात्मक क्लिनिकल ल्याब अभ्यास\n` +
      `• विषयवस्तु: Vital Signs, वृद्धवृद्धा तथा बिरामी स्याहार, First Aid र Adult CPR\n` +
      `• CTEVT मान्यता प्राप्त प्रमाणपत्र (QR Verification सहित)\n` +
      `• सहज शुल्क नीति: भर्ना हुँदा 50% + मध्य-कोर्समा 50%\n\n` +
      `भर्ना वा परामर्शको लागि *APPLY* लेखेर पठाउनुहोस् वा फोन गर्नुहोस्: 01-4910715 / 9803614574`;
  }
  if (lower === '2' || lower.includes('tailor') || lower.includes('fashion') || lower.includes('dress') || lower.includes('sew')) {
    return `👗 *टेलरिङ तथा फेसन डिजाइनिङ (390 Hours / 3 Months)*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `• प्रत्येक विद्यार्थीलाई छुट्टै Juki Industrial Sewing Machine को ग्यारेन्टी\n` +
      `• कुर्ता-सुरुवाल, ब्लाउज, प्याटर्न ड्राफ्टिङ र आधुनिक सिलाइ अभ्यास\n` +
      `• 100% वर्कशप औजार र कपडा संस्थाबाटै उपलब्ध\n\n` +
      `सिट सुरक्षित गर्न *APPLY* लेखेर पठाउनुहोस् वा फोन गर्नुहोस्: 01-4910715 / 9803614574`;
  }
  if (lower === '3' || lower.includes('beauty') || lower.includes('salon') || lower.includes('parlor') || lower.includes('makeup')) {
    return `💄 *ब्युटिसियन तथा कस्मेटोलोजी (390 Hours / 3 Months)*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `• प्रोफेसनल स्किन केयर, फेसियल, हेयर ट्रिटमेन्ट, स्टाइलिङ र ब्राइडल मेकअप\n` +
      `• आधुनिक सलुन उपकरण र प्रयोगात्मक अभ्यास\n` +
      `• प्रमाणित ट्रेनरद्वारा प्रशिक्षण र सलुन OJT प्लेसमेन्ट\n\n` +
      `भर्नाका लागि *APPLY* लेखेर पठाउनुहोस् वा फोन गर्नुहोस्: 01-4910715 / 9803614574`;
  }
  if (lower === '4' || lower.includes('apply') || lower.includes('admission') || lower.includes('भर्ना')) {
    return `✅ *तपाईंको भर्ना / परामर्श अनुरोध दर्ता भएको छ!*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `हाम्रो परामर्शदाताले छिट्टै तपाईंलाई सम्पर्क गर्नुहुनेछ।\n` +
      `तत्काल कुरा गर्न फोन गर्नुहोस्: 01-4910715 / 9803614574`;
  }
  if (lower.includes('fee') || lower.includes('paisa') || lower.includes('kati') || lower.includes('शुल्क')) {
    return `💳 *शुल्क नीति — ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `हामीकहाँ सजिलो *50%-50%* शुल्क व्यवस्था छ: भर्ना हुँदा 50% Advance र मध्य-कोर्समा बाँकी 50%।\n` +
      `कोर्स अनुसारको शुल्क जानकारीका लागि फोन गर्नुहोस्: 01-4910715 / 9803614574`;
  }
  if (lower.includes('location') || lower.includes('kaha') || lower.includes('address') || lower.includes('ठाउँ')) {
    return `📍 *ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n` +
      `ठेगाना: जोरपाटी, गोकर्णेश्वर, काठमाडौं (मित्रपार्क हब नजिक)\n` +
      `⏰ खुल्ने समय: बिहान 7:00 AM – बेलुका 6:00 PM (आइतबार–शुक्रबार)\n` +
      `📞 फोन: 01-4910715 / 9803614574`;
  }
  if (lower.includes('time') || lower.includes('shift') || lower.includes('baje') || lower.includes('समय')) {
    return `⏱️ *दैनिक 2 घण्टे सिफ्ट समय (आइतबार–शुक्रबार):*\n` +
      `• Shift A: 7:00 – 9:00 AM\n• Shift B: 10:00 AM – 12:00 PM\n• Shift C: 12:00 – 2:00 PM\n• Shift D: 2:00 – 4:00 PM\n• Shift E: 4:00 – 6:00 PM\n` +
      `📞 सिट बुकिङ: 01-4910715 / 9803614574`;
  }

  return `🌟 *ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी) मा स्वागत छ!* 🌟\n` +
    `CTEVT मान्यता प्राप्त व्यावसायिक तालिम केन्द्र\n` +
    `ठेगाना: जोरपाटी, गोकर्णेश्वर, काठमाडौं (मित्रपार्क हब नजिक)\n\n` +
    `तत्काल कोर्स र शुल्क जानकारी पाउन तलको नम्बर टाइप गरी पठाउनुहोस्:\n` +
    `*1* — केयरगिभर तालिम (Caregiver)\n` +
    `*2* — टेलरिङ तथा फेसन डिजाइनिङ (Tailoring)\n` +
    `*3* — ब्युटिसियन तथा कस्मेटोलोजी (Beautician)\n` +
    `*4* — भर्ना परामर्शदातासँग कुरा गर्न (01-4910715 / 9803614574)\n\n` +
    `🌐 वेबसाइट: https://globalera.vercel.app`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      const statuses = changes?.statuses || [];
      const message = changes?.messages?.[0];
      const contact = changes?.contacts?.[0];
      const metadata = changes?.metadata;

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

      // Always store inbound event & log for live ERP hub
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

      await logToSupabase({
        phone: senderPhone,
        senderName,
        direction: 'inbound',
        messageType: referral ? 'fb_ad_inquiry' : (message.type || 'text'),
        status: 'received',
        content: `${adTag}${messageText}`,
        metaMessageId: message.id || null
      });

      // Auto-capture lead if admission intent or FB Ad
      await autoCaptureLeadIfNeeded(senderPhone, senderName, messageText, referral);

      // Check Global Bot switch & Server-side Human Takeover
      const [botConfig, takeover] = await Promise.all([
        getRemoteBotConfig(),
        isHumanTakeoverActive(senderPhone)
      ]);

      if (!botConfig.autoBotEnabled || takeover.paused) {
        return res.status(200).json({ status: 'skipped_human_takeover_or_disabled' });
      }

      // Generate smart reply: Gemini Two-Way Counselor first, then Keyword Fallback
      let botReply = null;
      if (botConfig.aiCounselorEnabled && botConfig.geminiApiKey) {
        const studentCtx = await getStudentSelfServiceContext(senderPhone);
        botReply = await askGeminiCounselor({
          geminiKey: botConfig.geminiApiKey,
          messageText,
          senderName,
          history: takeover.history,
          studentContext: studentCtx,
          referral,
          customInstructions: botConfig.aiInstructions
        });
      }

      if (!botReply) {
        botReply = buildKeywordFallbackReply(messageText, referral);
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
          await logToSupabase({
            phone: senderPhone,
            senderName,
            direction: 'outbound',
            messageType: 'auto_bot',
            status: sendRes.ok ? 'sent' : 'failed',
            content: botReply,
            metaMessageId: botMsgId
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
