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

function cleanWhatsAppMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/^#{1,6}\s*(.*?)$/gm, '*$1*')
    .replace(/\*\*\*(.*?)\*\*\*/g, '*$1*')
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function getRemoteBotConfig() {
  const [rows, orgRows, cfgLogs] = await Promise.all([
    supabaseRest('system_settings?select=*&limit=1', 'GET'),
    supabaseRest('organizations?select=settings&limit=1', 'GET'),
    supabaseRest('communication_logs?channel=eq.WA_Config_Sync&order=sent_at.desc&limit=1', 'GET')
  ]);
  const s = Array.isArray(rows) && rows[0] ? rows[0] : {};
  const orgWaBot = Array.isArray(orgRows) && orgRows[0]?.settings?.whatsappBot ? orgRows[0].settings.whatsappBot : {};
  let logWaBot = {};
  if (Array.isArray(cfgLogs) && cfgLogs[0]?.message) {
    try {
      logWaBot = JSON.parse(cfgLogs[0].message) || {};
    } catch {
      logWaBot = {};
    }
  }
  const primaryWaBot =
    s.company_profile?.whatsappBot ||
    s.extra_settings?.whatsappBot ||
    s.whatsapp_bot ||
    {};
  const waBot = {
    ...logWaBot,
    ...orgWaBot,
    ...primaryWaBot,
    geminiApiKey: (primaryWaBot.geminiApiKey || orgWaBot.geminiApiKey || logWaBot.geminiApiKey || ENV_GEMINI_KEY || '').trim()
  };
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
    geminiApiKey: waBot.geminiApiKey,
    aiInstructions: waBot.aiInstructions || ''
  };
}

async function markMetaMessageAsRead(phoneId, messageId) {
  if (!phoneId || !META_ACCESS_TOKEN || !messageId) return;
  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${META_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      })
    });
  } catch {
    // non-fatal
  }
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
  const resumedAt = stateLog && stateLog.message_type === 'bot_resume_state'
    ? new Date(stateLog.created_at).getTime()
    : 0;

  // Auto-pause for 30 minutes if a human staff member replied directly (unless explicitly resumed afterwards)
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
  const recentHumanReply = logs.find(
    (l) =>
      l.direction === 'outbound' &&
      l.message_type !== 'auto_bot' &&
      l.message_type !== 'bot_resume_state' &&
      new Date(l.created_at).getTime() > Math.max(thirtyMinAgo, resumedAt)
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

const MASTER_COUNSELOR_PROMPT_V5 = `तपाईं "ग्लोबल एरा मल्टी सर्भिसको प्राविधिक स्कुल, जोरपाटी" (Global Era Multi Service Pvt. Ltd.) को आधिकारिक, अनुभवी र तालिमप्राप्त AI Admission & Career Counsellor हुनुहुन्छ।
मूल सिद्धान्त: सही जानकारी, सही परामर्श, सही तालिम र करियर विकास। ("सीप सिकौं • आम्दानी गरौं • आत्मनिर्भर बनौं।")

१. मानवीय संवाद र WhatsApp शैली (अत्यन्त जरुरी — कडाइका साथ पालना गर्नुहोस्):
- रोबोट वा लामो ब्रोशर पठाए जस्तो कहिल्यै नलेख्नुहोस्! जोरपाटी अफिसमै बसेको वास्तविक, नम्र र आत्मीय मानव काउन्सिलरले WhatsApp मा च्याट गरे जस्तो लेख्नुहोस्।
- *सोधिएको मात्र उत्तर दिनुहोस् (Strict Relevance):* विद्यार्थीले जति सोधेको छ ठ्याक्कै त्यति मात्र उत्तर दिनुहोस् (अधिकतम २-४ लाइन)। नसोधी अन्य कोर्स, लामो सिलेबस, शुल्क, ठेगाना वा अनावश्यक विवरण कहिल्यै नथप्नुहोस्!
  • जस्तै: कसैले "Num dinsu na" (नम्बर दिनुस्) मात्र सोधेमा -> "हजुर, हाम्रो सम्पर्क नम्बर 01-4910715 र 9803614574 हो। हजुरलाई कुन तालिमबारे कुरा गर्नु छ?" मात्र भन्नुहोस् (अन्य कोर्स र ठेगाना नथप्नुहोस्)।
  • जस्तै: कसैले "Kk traning xa?" सोधेमा -> सिलाई, ब्युटिसियन/पार्लर, नेल आर्ट, आइल्यास र कमर्सियल बेकरी गरी कोर्सको नाम मात्र छोटोमा बताउनुहोस् (प्रत्येकको शुल्क र आइटम एकैचोटी नफाल्नुहोस्)।
  • जस्तै: कसैले केवल "Hi / Hlo / नमस्ते" मात्र भनेमा -> छोटो स्वागत: "नमस्कार हजुर! ग्लोबल एरा मल्टी सर्भिसको प्राविधिक स्कुल, जोरपाटीमा स्वागत छ। 🙏 हजुरलाई कुन तालिमबारे जानकारी चाहिएको हो?"
- "हजुर" वा "तपाईं" भनेर सम्बोधन गर्नुहोस्।
- हरेक उत्तरमा संस्थाको पूरा नाम, ठेगाना वा फोन नम्बर नदोहोर्याउनुहोस्! एकचोटी बताइसकेपछि कुराकानीमा "हाम्रो प्राविधिक स्कुल" वा "हाम्रो संस्था" मात्र भन्नुहोस्।
- संवाद अगाडि बढाउन अन्त्यमा केवल एउटा छोटो सान्दर्भिक प्रश्न सोध्नुहोस्।
- नेपाली युनिकोड, रोमन नेपाली (e.g. "kati lagchha", "num dinsu na", "kk training xa", "kaha ho") र अंग्रेजी सबै बुझ्नुहोस्। मुख्य उत्तर प्राकृतिक नेपाली देवनागरीमा दिनुहोस् (अंग्रेजी मागे मात्र अंग्रेजीमा दिनुहोस्)।
- WhatsApp फर्म्याट नियम: बोल्ड गर्न केवल सिंगल तारा (*शब्द*) मात्र प्रयोग गर्नुहोस्। कहिल्यै डबल तारा (**शब्द**) वा ### हेडिङ प्रयोग नगर्नुहोस्। वाक्य बीचमै नकाट्नुहोस्।

२. संस्थाको आधिकारिक परिचय र ठेगाना:
- नाम: ग्लोबल एरा मल्टी सर्भिसको प्राविधिक स्कुल, जोरपाटी (कम्पनी: Global Era Multi Service Pvt. Ltd.)
- ठेगाना: गोकर्णेश्वर नगरपालिका–५, जोरपाटी, काठमाडौं, नेपाल।
- पुग्ने बाटो: जोरपाटीको चामुण्डा गेटको विपरीत, कुमार गहना पसलसँगैको गल्लीबाट एक घरभित्र, T-Mart को दोस्रो तला।
- सम्पर्क: 01-4910715 / 9803614574

३. सम्पूर्ण तालिम तथा शुल्क सूची (अद्यावधिक संस्करण ५.०):
क) सिलाई तालिम:
- बेसिक सिलाई: १ महिना | शुल्क: रु. 2,000 | ७ आइटम (बच्चाको दौरा, भोटो, टोपी, सुरुवाल, कुर्था, सुरुवाल, चारपाटे पेटिकोट)।
- फुल सिलाई: ३ महिना | नियमित रु. 30,000, हाल ५०% छुटमा रु. 15,000 | २२ आइटम (बच्चाको दौरा, भोटो, टोपी, सुरुवाल, कुर्था, सुरुवाल, चारपाटे पेटिकोट, टप्स, छपाटे पेटिकोट, म्याक्सी, गाउन, वान पिस, अम्ब्रेला फ्रक, चौबन्दी, साधारण ब्लाउज, डिजाइनर ब्लाउज, पाइजामा सुरुवाल, पाइजामा टप, पाइजामा पाइन्ट, सलवार, कर्ड सेट टप्स, कर्ड सेट पाइन्ट्स)।
- स्पेसल सिलाई: १ महिना | शुल्क: रु. 10,000 | आवश्यकताअनुसार ७ आइटम (ब्लाउज, गाउन, डिजाइनर कुर्था, वान पिस आदि; अन्तिम छनोट प्रशिक्षक र केन्द्रबाट पुष्टि हुने)।

ख) ब्युटिसियन तथा पार्लर तालिम:
- बेसिक ब्युटिसियन: १ महिना | शुल्क: रु. 2,000 | ७ आइटम (Threading, Cleansing, Simple Makeup, Basic Bun, Hair Oil Massage, Iron Straight, Iron Curly)।
- फुल ब्युटिसियन: ३ महिना | नियमित रु. 30,000, हाल ५०% छुटमा रु. 15,000 | ४८ आइटम (हेयर कटिङ १४ प्रकार, हेयर स्टाइलिङ/केयर ९ प्रकार, मेकअप ७ प्रकार, फेसियल/म्यानीक्योर/पेडिक्योर/नेल आर्ट ६ प्रकार, हेयर बन/ब्राइडल १२ प्रकार — सिलेबस मागे मात्र विस्तृत बताउनुहोस्)।

ग) नेल आर्ट एन्ड एक्सटेन्सन:
- बेसिक: १५ दिन | शुल्क: रु. 10,000
- प्रोफेसनल: ३५ दिन | शुल्क: रु. 20,000

घ) आइल्यास एन्ड एक्सटेन्सन:
- बेसिक: १५ दिन | शुल्क: रु. 10,000
- प्रोफेसनल: ३५ दिन | शुल्क: रु. 20,000

ङ) प्रोफेसनल कम्बो ब्युटिसियन:
- कुल प्याकेज शुल्क: रु. 45,000 (फुल ब्युटिसियन ४८ आइटम + प्रोफेसनल नेल आर्ट + प्रोफेसनल आइल्यास)। छुट्टाछुट्टै जोड्दा रु. 55,000 पर्छ, कम्बोमा रु. 10,000 बचत हुन्छ। (नियम: कम्बोको कुल अवधि अनुमान नगर्नुहोस् — सँगसँगै वा क्रमशः चल्ने व्यवस्थाअनुसार फरक हुन्छ)।

च) कमर्सियल बेकरी तालिम:
- अवधि: २ महिना | शुल्क: रु. 30,000 | दैनिक ५ घण्टा (बिहान 11:00 बजेदेखि अपराह्न 4:00 बजेसम्म) | लक्षित १०० आइटम (Bread, Bun, Cake, Cookies, Puff, Pastry, Pizza, Doughnut, स्थानीय अन्नका बेकरी आदि; स्वीकृत १०० आइटमको सूची उपलब्ध नभएसम्म आधिकारिक दाबी नगर्नुहोस्)।

४. कक्षा समय, सिफ्ट र Holiday Special Class:
- दैनिक २ घण्टे सिफ्ट: बिहान 7–9 बजे, बिहान 10–12 बजे, दिउँसो 12–2 बजे, दिउँसो 2–4 बजे, र साँझ 4–6 बजे (साँझको सिफ्टको E/F नाम पुष्टि बाँकी भएकाले समय स्पष्ट बताउनुहोस्)। बेकरी फुल कोर्स: बिहान 11–4 बजे।
- Holiday Special Class: जागिर, व्यवसाय, कार्यालय वा विद्यालयमा व्यस्त व्यक्तिका लागि बिदाका दिनमा विशेष कक्षा मिलाउने व्यवस्था छ (निश्चित दिन/समय/शुल्क कार्यालयबाट पुष्टि हुने)।

५. प्रमाणपत्र, प्रोफाइल, Skill Dossier, OJT र Job Placement नीति:
- प्रमाणपत्र: तालिम सफलतापूर्वक पूरा गरेपछि *संस्थाद्वारा जारी तालिम प्रमाणपत्र (Institution-Issued Training Certificate)* प्रदान गरिन्छ। (सावधानी: पुष्टि नभएसम्म CTEVT, NSTB वा सरकारी प्रमाणपत्र/लाइसेन्स भनेर दाबी नगर्नुहोस्)।
- Student Digital Profile र Training & Skill Dossier: प्रत्येक विद्यार्थीको व्यक्तिगत डिजिटल प्रोफाइल र प्रमाणपत्रसँगै सिकेका सीप, हाजिरी, Practical Portfolio र मूल्याङ्कनको विस्तृत *Skill Dossier* तयार गरिन्छ (यसलाई सरकारी Skill Passport नभन्नुहोस्)।
- OJT Support र Job Placement Support: कार्यस्थल अभ्यास (OJT) र रोजगारदातासँग जोडिन सहयोग गरिन्छ, तर १००% Job Guarantee, निश्चित तलब वा विदेश पठाउने ग्यारेन्टी कहिल्यै नगर्नुहोस्।

६. अनिवार्य सत्यता र सुरक्षा नियम:
- पुरानो शुल्क रु. 11,865 कहिल्यै प्रयोग नगर्नुहोस्। "पूर्ण निःशुल्क तालिम" नभन्नुहोस्।
- किस्ताबन्दी, हालको ब्याच सिट उपलब्धता वा थप छुट कार्यालयबाट पुष्टि गर्नुपर्ने बताउनुहोस्। अफरको अन्तिम मिति वा कृत्रिम अभाव सिर्जना नगर्नुहोस्।
- नागरिकता नम्बर, पासवर्ड, OTP वा बैंक कार्ड विवरण नमाग्नुहोस्। सिस्टमबाट पुष्टि नभई "सिट बुक भयो" वा "भर्ना भयो" नभन्नुहोस्।
- भर्ना हुन इच्छुक भए सहमति लिएर पूरा नाम, मोबाइल नम्बर, कोर्स र मनपर्ने समय सोध्नुहोस्।`;

async function askGeminiCounselor({ geminiKey, messageText, senderName, history, studentContext, referral, customInstructions }) {
  if (!geminiKey) return null;

  const recentTurns = (history || [])
    .filter((h) => h.message_type !== 'bot_pause_state' && h.message_type !== 'bot_resume_state' && h.content)
    .slice(0, 12)
    .reverse()
    .map((h) => `${h.direction === 'inbound' ? 'Visitor' : 'Counsellor'}: ${h.content}`)
    .join('\n');

  const systemPrompt =
    MASTER_COUNSELOR_PROMPT_V5 +
    (customInstructions ? `\n\n७. संस्थाको थप अद्यावधिक निर्देशन / अफर:\n${customInstructions}\n` : '') +
    (studentContext ? `\n${studentContext}\nUse this verified record ONLY if this student asks about their fee, due, TGID, or certificate.\n` : '') +
    (referral ? `\n[User arrived from Facebook Ad: ${referral.headline || 'Vocational Course Ad'}]\n` : '');

  const userPrompt =
    `Recent conversation:\n${recentTurns || '(New conversation — first contact)'}\n\n` +
    `Latest message from ${senderName}:\n"${messageText}"\n\n` +
    `Write a natural, warm, human-like Counsellor reply in WhatsApp style now:`;

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
            generationConfig: { temperature: 0.25, maxOutputTokens: 1200 }
          })
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) return cleanWhatsAppMarkdown(reply);
    } catch (err) {
      console.debug(`[Gemini Counselor Fallback ${model}]:`, err.message);
    }
  }
  return null;
}

function buildKeywordFallbackReply(messageText, referral) {
  const lower = `${messageText} ${referral?.headline || ''}`.toLowerCase();

  if (lower === '1' || lower.includes('tailor') || lower.includes('silai') || lower.includes('सिलाई') || lower.includes('सिलाइ')) {
    return `नमस्कार हजुर! *सिलाई तालिम* को विवरण यस प्रकार छ:\n` +
      `• *बेसिक सिलाई (१ महिना):* रु. 2,000 (७ आइटम)\n` +
      `• *फुल सिलाई (३ महिना):* नियमित रु. 30,000, हाल ५०% छुटमा रु. 15,000 (२२ आइटम)\n` +
      `• *स्पेसल सिलाई (१ महिना):* रु. 10,000 (७ डिजाइन आइटम)\n\n` +
      `हजुरले पहिले सिलाई सिक्नुभएको छ कि सुरुदेखि सिक्न चाहनुहुन्छ?`;
  }
  if (lower === '2' || lower.includes('beauty') || lower.includes('beautician') || lower.includes('parlor') || lower.includes('पार्लर') || lower.includes('ब्युटिसियन')) {
    return `नमस्कार हजुर! *ब्युटिसियन तथा पार्लर तालिम* को विवरण:\n` +
      `• *बेसिक ब्युटिसियन (१ महिना):* रु. 2,000 (७ आइटम)\n` +
      `• *फुल ब्युटिसियन (३ महिना):* नियमित रु. 30,000, हाल ५०% छुटमा रु. 15,000 (४८ आइटम)\n` +
      `• *प्रोफेसनल कम्बो (फुल + नेल + आइल्यास):* रु. 45,000 (रु. 10,000 बचत)\n\n` +
      `हजुर सुरुदेखि सिक्न चाहनुहुन्छ कि व्यावसायिक पार्लर खोल्ने सोचमा हुनुहुन्छ?`;
  }
  if (lower === '3' || lower.includes('nail') || lower.includes('eyelash') || lower.includes('lash') || lower.includes('नेल') || lower.includes('आइल्यास')) {
    return `नमस्कार हजुर! *नेल आर्ट एन्ड एक्सटेन्सन* तथा *आइल्यास एन्ड एक्सटेन्सन* को विवरण:\n` +
      `• *बेसिक कोर्स:* १५ दिन — रु. 10,000\n` +
      `• *प्रोफेसनल कोर्स:* ३५ दिन — रु. 20,000\n\n` +
      `हजुरलाई नेल आर्ट र आइल्यासमध्ये कुन कोर्सबारे थप बुझ्नु छ?`;
  }
  if (lower === '4' || lower.includes('bakery') || lower.includes('बेकरी') || lower.includes('cake')) {
    return `नमस्कार हजुर! *कमर्सियल बेकरी तालिम* को विवरण:\n` +
      `• अवधि: २ महिना (दैनिक ५ घण्टा, बिहान 11:00 देखि अपराह्न 4:00 बजेसम्म)\n` +
      `• शुल्क: रु. 30,000 (लक्षित १०० आइटम — Bread, Cake, Cookies, Pizza, Pastry आदि)\n\n` +
      `के हजुर यो तालिम व्यवसाय सुरु गर्नका लागि सिक्न चाहनुहुन्छ?`;
  }
  if (lower.includes('apply') || lower.includes('admission') || lower.includes('भर्ना')) {
    return `हजुरलाई भर्ना प्रक्रियामा सहयोग गर्न पाउँदा खुसी लाग्यो! कृपया हजुरको *पूरा नाम*, *मनपर्ने कोर्स* र *उपयुक्त समय* पठाउनुहोला, हाम्रो भर्ना टोलीले तुरुन्तै समन्वय गर्नेछ। (सम्पर्क: 01-4910715 / 9803614574)`;
  }
  if (lower.includes('fee') || lower.includes('paisa') || lower.includes('kati') || lower.includes('शुल्क')) {
    return `हजुर, हाम्रो तालिमको हालको शुल्क विवरण:\n` +
      `• *बेसिक सिलाई / बेसिक ब्युटिसियन (१ महिना):* रु. 2,000\n` +
      `• *फुल सिलाई / फुल ब्युटिसियन (३ महिना):* रु. 15,000 (५०% छुट)\n` +
      `• *नेल आर्ट / आइल्यास:* बेसिक रु. 10,000 (१५ दिन) | प्रोफेसनल रु. 20,000 (३५ दिन)\n` +
      `• *प्रोफेसनल कम्बो ब्युटिसियन:* रु. 45,000\n` +
      `• *कमर्सियल बेकरी (२ महिना):* रु. 30,000\n\n` +
      `हजुर कुन कोर्सबारे बुझ्न चाहनुहुन्छ?`;
  }
  if (lower.includes('location') || lower.includes('kaha') || lower.includes('address') || lower.includes('ठाउँ')) {
    return `हाम्रो तालिम केन्द्र *गोकर्णेश्वर नगरपालिका–५, जोरपाटी, काठमाडौं* मा छ।\n` +
      `📍 *पुग्ने बाटो:* जोरपाटीको चामुण्डा गेटको विपरीत, कुमार गहना पसलसँगैको गल्लीबाट एक घरभित्र, T-Mart को दोस्रो तला।\n` +
      `📞 *सम्पर्क:* 01-4910715 / 9803614574`;
  }
  if (lower.includes('time') || lower.includes('shift') || lower.includes('baje') || lower.includes('समय')) {
    return `हजुर, हाम्रोमा बिहान 7–9, 10–12, दिउँसो 12–2, 2–4 र साँझ 4–6 बजेको २ घण्टे कक्षा विकल्प छन्। जागिर वा व्यवसायमा व्यस्त व्यक्तिका लागि *Holiday Special Class* को व्यवस्था पनि छ।\nहजुरलाई कुन समय उपयुक्त हुन्छ?`;
  }

  return `नमस्कार हजुर! *ग्लोबल एरा मल्टी सर्भिसको प्राविधिक स्कुल, जोरपाटी* मा स्वागत छ। 🙏\n\n` +
    `तत्काल जानकारीका लागि तलको नम्बर पठाउनुहोस्:\n` +
    `*1* — सिलाई तालिम (बेसिक रु. 2,000 / फुल रु. 15,000)\n` +
    `*2* — ब्युटिसियन / पार्लर तालिम (बेसिक रु. 2,000 / फुल रु. 15,000)\n` +
    `*3* — नेल आर्ट तथा आइल्यास एक्सटेन्सन\n` +
    `*4* — कमर्सियल बेकरी तालिम (रु. 30,000)\n\n` +
    `हजुरलाई कुन तालिमबारे जानकारी चाहिएको हो?`;
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

      // Run inbound logging, lead capture, blue-tick read receipt, bot config, takeover check & student lookup in parallel for ultra-fast response
      const [, , , botConfig, takeover, studentCtx] = await Promise.all([
        supabaseRest('whatsapp_inbound_events', 'POST', {
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
        }),
        logToSupabase({
          phone: senderPhone,
          senderName,
          direction: 'inbound',
          messageType: referral ? 'fb_ad_inquiry' : (message.type || 'text'),
          status: 'received',
          content: `${adTag}${messageText}`,
          metaMessageId: message.id || null
        }),
        autoCaptureLeadIfNeeded(senderPhone, senderName, messageText, referral),
        getRemoteBotConfig(),
        isHumanTakeoverActive(senderPhone),
        getStudentSelfServiceContext(senderPhone),
        markMetaMessageAsRead(currentPhoneId, message.id)
      ]);

      if (!botConfig.autoBotEnabled || takeover.paused) {
        return res.status(200).json({ status: 'skipped_human_takeover_or_disabled', replyMode: botConfig.replyMode });
      }

      // Generate smart reply: AI Counselor when in 'ai' mode, or Keyword Fallback in 'bot' mode
      let botReply = null;
      if (botConfig.aiCounselorEnabled && botConfig.geminiApiKey) {
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
      botReply = cleanWhatsAppMarkdown(botReply);

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
