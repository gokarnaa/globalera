// Official Meta WhatsApp Business Cloud API & Webhook Service
// Global Era Technical School TVET ERP Integration
import { getSupabaseConfig, getSupabaseClient } from './supabaseClient.js';
import { loadDB, saveDB } from './storage.js';

export const DEFAULT_META_TOKEN = 'EAAXs5uDM7CYBTKqFINzJDjZBEiRyfN5pWT5V4EftAnPfssMZBApLpRgfQYaEfZBtarXwIZA2IJh1Ux6JIrp8KAJRoI8UFP9ZCcti5xsZC2DkIaTKZBtkFFs8wfxCZCjSgxqySNpo2CzalInZCd2ZAZBsmKd4VsZBFSK20xyUm0ZBgLDMdZAOMVV6MgnBojhbeLvpLwnwZDZD';
export const DEFAULT_PHONE_NUMBER_ID = '1392365320634216';
export const DEFAULT_WABA_ID = '1691121166000159';
export const DEFAULT_VERIFY_TOKEN = 'globalera_tvet_whatsapp_verify_2026';

/**
 * Retrieve WhatsApp Cloud API settings from local DB or defaults
 */
export function getWhatsAppSettings() {
  const db = loadDB();
  const wa = db.settings?.whatsapp || {};
  return {
    accessToken: (wa.accessToken || DEFAULT_META_TOKEN).trim(),
    phoneNumberId: (wa.phoneNumberId || DEFAULT_PHONE_NUMBER_ID).trim(),
    wabaId: (wa.wabaId || DEFAULT_WABA_ID).trim(),
    verifyToken: (wa.verifyToken || DEFAULT_VERIFY_TOKEN).trim(),
    webhookUrl: wa.webhookUrl || 'https://globalera.vercel.app/api/whatsapp-webhook',
    enabled: Boolean(wa.enabled ?? true)
  };
}

/**
 * Save WhatsApp Cloud API settings to local DB
 */
export function saveWhatsAppSettings(newSettings) {
  const db = loadDB();
  const nextDb = {
    ...db,
    settings: {
      ...db.settings,
      whatsapp: {
        ...(db.settings?.whatsapp || {}),
        ...newSettings
      }
    }
  };
  saveDB(nextDb);
  return nextDb;
}

/**
 * Format Nepali / International phone number to E.164 without '+'
 * e.g. '9851000000' -> '9779851000000'
 */
export function formatToWhatsAppRecipient(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);

  // Standard Nepali 10-digit mobile (98..., 97...)
  if (cleaned.length === 10 && (cleaned.startsWith('98') || cleaned.startsWith('97') || cleaned.startsWith('96'))) {
    return `977${cleaned}`;
  }
  return cleaned;
}

/**
 * Send WhatsApp Message via Meta Cloud API
 * POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
 */
export async function sendMetaWhatsAppMessage({ to, type = 'text', text, template, document }) {
  const settings = getWhatsAppSettings();
  const recipient = formatToWhatsAppRecipient(to);

  if (!settings.accessToken) {
    throw new Error('Meta WhatsApp Cloud API Access Token is missing.');
  }

  if (!settings.phoneNumberId) {
    throw new Error('Meta WhatsApp Phone Number ID is missing. Please configure it in Settings.');
  }

  if (!recipient) {
    throw new Error('Invalid recipient phone number.');
  }

  const endpoint = `https://graph.facebook.com/v19.0/${settings.phoneNumberId}/messages`;

  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient
  };

  if (type === 'text') {
    payload.type = 'text';
    payload.text = {
      preview_url: true,
      body: text
    };
  } else if (type === 'document' && document) {
    payload.type = 'document';
    payload.document = {
      link: document.url,
      caption: document.caption || text || '',
      filename: document.filename || 'Curriculum_Brochure.pdf'
    };
  } else if (type === 'template' && template) {
    payload.type = 'template';
    payload.template = template;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.accessToken}`
    },
    body: JSON.stringify(payload)
  });

  const resData = await response.json();

  if (!response.ok) {
    const errorMsg = resData?.error?.message || response.statusText || 'Failed to send WhatsApp message';
    logWhatsAppMessage({
      phone: recipient,
      direction: 'outbound',
      messageType: type,
      status: 'failed',
      content: text || JSON.stringify(payload),
      metaResponse: resData
    });
    throw new Error(`Meta WhatsApp API Error: ${errorMsg}`);
  }

  const messageId = resData?.messages?.[0]?.id || '';
  logWhatsAppMessage({
    phone: recipient,
    direction: 'outbound',
    messageType: type,
    status: 'sent',
    content: text || JSON.stringify(payload),
    metaMessageId: messageId,
    metaResponse: resData
  });

  return {
    ok: true,
    recipient,
    messageId,
    data: resData
  };
}

/**
 * Log message into Supabase and local storage
 */
export async function logWhatsAppMessage(logEntry) {
  try {
    const db = loadDB();
    const newLog = {
      id: `WAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...logEntry
    };

    const nextLogs = [newLog, ...(db.whatsappLogs || [])].slice(0, 500);
    saveDB({ ...db, whatsappLogs: nextLogs });

    // Also push to Supabase if connected (whatsapp_logs with communication_logs fallback)
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('whatsapp_logs').insert({
        phone: logEntry.phone,
        direction: logEntry.direction || 'outbound',
        message_type: logEntry.messageType || 'text',
        status: logEntry.status || 'sent',
        content: logEntry.content || '',
        meta_message_id: logEntry.metaMessageId || null
      });
      if (error) {
        await supabase.from('communication_logs').insert({
          id: `WA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          organization_id: 'ORG-GLOBALERA-01',
          channel: logEntry.direction === 'inbound' ? 'WhatsApp_Inbound' : 'WhatsApp_Outbound',
          recipient_name: logEntry.senderName || 'WhatsApp Contact',
          recipient_phone: normalizePhoneKey(logEntry.phone) || logEntry.phone,
          message: logEntry.content || '',
          status: logEntry.status || 'sent',
          sent_at: new Date().toISOString()
        });
      }
    }
  } catch (err) {
    console.debug('[WhatsApp Log Notice]:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Custom Nepali WhatsApp Template Engine (Editable + Supabase Synced)
// ---------------------------------------------------------------------------

export const DEFAULT_NEPALI_WA_TEMPLATES = [
  {
    key: 'lead_welcome',
    title: 'Lead अभिवादन (Inquiry Welcome)',
    category: 'CRM / Lead',
    isSystem: true,
    body:
      `नमस्ते *{name}* ज्यू! 🙏\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)* बाट सम्पर्क गरेका हौं।\n\n` +
      `तपाईंले सोधपुछ गर्नुभएको *{course}* तालिमको विस्तृत जानकारी, सिफ्ट समय र भर्ना प्रक्रियाबारे सल्लाह गर्न चाहेका छौं।\n` +
      `📞 फोन: 01-4910715 | WhatsApp: 9803614574`
  },
  {
    key: 'admission_receipt',
    title: 'भर्ना तथा Advance रसिद',
    category: 'Billing / Receipt',
    isSystem: true,
    body:
      `🎉 *आधिकारिक भर्ना तथा शुल्क रसिद* 🎉\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `• रसिद नं: *{receiptNo}*\n` +
      `• विद्यार्थी: *{name}* ({tgid})\n` +
      `• कोर्स: *{course}*\n` +
      `• आज बुझाएको रकम: *Rs. {amount}*\n` +
      `• जम्मा शुल्क: *Rs. {totalFee}* | बाँकी रकम: *Rs. {due}*\n` +
      `• मिति: {date} ({method})\n\n` +
      `📍 जोरपाटी, गोकर्णेश्वर, काठमाडौं | 📞 01-4910715 / 9803614574\n` +
      `यो मेसेजलाई डिजिटल भुक्तानी प्रमाणको रूपमा सुरक्षित राख्नुहोला। प्राविधिक स्कुलमा स्वागत छ!`
  },
  {
    key: 'installment_receipt',
    title: 'किस्ता शुल्क रसिद (Installment)',
    category: 'Billing / Receipt',
    isSystem: true,
    body:
      `🧾 *आधिकारिक किस्ता शुल्क रसिद*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `आदरणीय *{name}* ज्यू, तपाईंको *Rs. {amount}* शुल्क भुक्तानी सफलतापूर्वक दर्ता भएको छ।\n\n` +
      `• रसिद नं: *{receiptNo}*\n` +
      `• कोर्स: *{course}*\n` +
      `• भुक्तानी माध्यम: {method} | मिति: {date}\n` +
      `• जम्मा शुल्क: Rs. {totalFee}\n` +
      `• हालसम्म बुझाएको: *Rs. {paid}*\n` +
      `• बाँकी रकम: *Rs. {due}*\n\n` +
      `📞 01-4910715 / 9803614574 — धन्यवाद!`
  },
  {
    key: 'final_clearance_bill',
    title: 'पूर्ण चुक्ता बिल (Final Clearance Bill)',
    category: 'Billing / Receipt',
    isSystem: true,
    body:
      `🎉 *आधिकारिक पूर्ण शुल्क चुक्ता बिल (Final Clearance Bill)* 🎉\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n\n` +
      `बधाई छ *{name}* ज्यू! तपाईंको तालिमको सम्पूर्ण शुल्क *100% चुक्ता* भएको छ।\n\n` +
      `• रसिद नं: *{receiptNo}*\n` +
      `• कोर्स: *{course}* ({tgid})\n` +
      `• जम्मा कोर्स शुल्क: *Rs. {totalFee}*\n` +
      `• जम्मा भुक्तानी: *Rs. {paid}*\n` +
      `• बाँकी रकम: *Rs. 0 (PAID IN FULL / CLEARED)* ✅\n` +
      `• मिति: {date}\n\n` +
      `तपाईं अब अन्तिम परीक्षा, OJT र प्रमाणपत्रका लागि योग्य हुनुभएको छ।\n` +
      `📞 01-4910715 / 9803614574`
  },
  {
    key: 'fee_reminder',
    title: 'शुल्क रिमाइन्डर (Fee Reminder)',
    category: 'Billing / Receipt',
    isSystem: true,
    body:
      `नमस्ते *{name}* ज्यू, 🙏\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)* को लेखा शाखाबाट विनम्र अनुरोध:\n\n` +
      `तपाईंको *{course}* तालिमको बाँकी शिक्षण शुल्क *Rs. {due}* समयमै बुझाई सहयोग गरिदिनुहुन अनुरोध छ।\n` +
      `📞 थप जानकारीका लागि: 01-4910715 / 9803614574`
  },
  {
    key: 'absent_alert',
    title: 'दैनिक अनुपस्थिति सूचना (Absent Alert)',
    category: 'Attendance',
    isSystem: true,
    body:
      `⚠️ *दैनिक हाजिरी सूचना — प्राविधिक स्कुल, जोरपाटी*\n` +
      `*(ग्लोबल एरा मल्टी सर्भिस प्रा. लि.)*\n\n` +
      `आदरणीय अभिभावक ज्यू,\n` +
      `आज मिति *{date}* मा तपाईंको विद्यार्थी *{name}* ({shift}) कक्षामा *अनुपस्थित (ABSENT)* रहनुभएको जानकारी गराइन्छ।\n\n` +
      `CTEVT मान्यता प्राप्त परीक्षा र OJT का लागि कम्तीमा 80% प्रयोगात्मक हाजिरी अनिवार्य छ।\n` +
      `📞 यदि पूर्व-स्वीकृत वा स्वास्थ्य कारण हो भने कृपया कार्यालयमा सम्पर्क गर्नुहोला: 01-4910715 / 9803614574`
  },
  {
    key: 'course_brochure',
    title: 'कोर्स ब्रोसर र सिलेबस',
    category: 'Academics',
    isSystem: true,
    body:
      `🌟 *ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)* 🌟\n` +
      `*आधिकारिक कोर्स ब्रोसर: {course}* ({hours} Hours — 80% प्रयोगात्मक तालिम)\n\n` +
      `📍 *ठेगाना:* जोरपाटी, गोकर्णेश्वर, काठमाडौं\n` +
      `⏱️ *दैनिक 2 घण्टे सिफ्ट:* Shift A (7–9 AM) देखि Shift E (4–6 PM)\n` +
      `💳 *सहज शुल्क नीति:* भर्ना हुँदा 50% + मध्य-कोर्समा 50%\n` +
      `🛠️ *औजार तथा सामग्री:* 100% प्रयोगात्मक औजार संस्थाबाटै उपलब्ध\n` +
      `💼 *रोजगार सहायता:* OJT र रोजगारी समन्वय\n\n` +
      `🌐 पूरा सिलेबस हेर्न: {verifyUrl}\n` +
      `📞 परामर्श तथा भर्नाको लागि: 01-4910715 / 9803614574`
  },
  {
    key: 'certificate_verify',
    title: 'प्रमाणपत्र अनलाइन भेरिफिकेसन लिङ्क',
    category: 'Certificates',
    isSystem: true,
    body:
      `🎓 *आधिकारिक प्रमाणपत्र भेरिफिकेसन — प्राविधिक स्कुल, जोरपाटी*\n` +
      `*(ग्लोबल एरा मल्टी सर्भिस प्रा. लि.)*\n\n` +
      `नमस्ते *{name}* ज्यू, तपाईंको आधिकारिक तालिम प्रमाणपत्र अब अनलाइनबाट जुनसुकै बेला भेरिफाई गर्न सकिन्छ:\n` +
      `🔗 {verifyUrl}\n\n` +
      `📞 01-4910715 / 9803614574`
  },
  {
    key: 'ojt_update',
    title: 'OJT / रोजगारी अपडेट',
    category: 'Placement / OJT',
    isSystem: true,
    body:
      `नमस्ते *{name}* ज्यू, 🙏\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)* बाट तपाईंको OJT / रोजगारी (Placement) सम्बन्धी नयाँ अपडेट छ।\n` +
      `कृपया समय मिलाई रिप्लाई गर्नुहोला वा 01-4910715 / 9803614574 मा सम्पर्क गर्नुहोला।`
  },
  {
    key: 'campus_location',
    title: 'संस्थाको ठेगाना र समय (/location)',
    category: 'Slash Command',
    slashCmd: '/location',
    isSystem: true,
    body:
      `📍 *ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n` +
      `ठेगाना: जोरपाटी, गोकर्णेश्वर, काठमाडौं (मित्रपार्क हब नजिक)\n` +
      `⏰ खुल्ने समय: बिहान 7:00 AM – बेलुका 6:00 PM (आइतबार–शुक्रबार)\n` +
      `📞 फोन: 01-4910715 | WhatsApp: 9803614574\n` +
      `🌐 वेबसाइट: https://globalera.vercel.app`
  },
  {
    key: 'slash_fee',
    title: '५०-५० शुल्क नीति (/fee)',
    category: 'Slash Command',
    slashCmd: '/fee',
    isSystem: true,
    body:
      `💳 *ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)* मा सजिलो 50%-50% शुल्क नीति छ:\n` +
      `• भर्ना हुँदा 50% Advance र आधा कोर्स सकिएपछि बाँकी 50%।\n` +
      `📞 कोर्स अनुसारको शुल्क बुझ्न: 01-4910715 / 9803614574`
  },
  {
    key: 'slash_shift',
    title: 'दैनिक सिफ्ट समय (/shift)',
    category: 'Slash Command',
    slashCmd: '/shift',
    isSystem: true,
    body:
      `⏱️ *दैनिक कक्षा सिफ्ट समय (आइतबार–शुक्रबार):*\n` +
      `• Shift A: 7:00 – 9:00 AM\n` +
      `• Shift B: 10:00 AM – 12:00 PM\n` +
      `• Shift C: 12:00 – 2:00 PM\n` +
      `• Shift D: 2:00 – 4:00 PM\n` +
      `• Shift E: 4:00 – 6:00 PM\n` +
      `📍 प्राविधिक स्कुल, जोरपाटी | 📞 01-4910715`
  },
  {
    key: 'slash_documents',
    title: 'भर्नाका लागि चाहिने कागजात (/documents)',
    category: 'Slash Command',
    slashCmd: '/documents',
    isSystem: true,
    body:
      `📋 *भर्नाका लागि आवश्यक कागजातहरू:*\n` +
      `1) नागरिकताको प्रतिलिपि (1 प्रति)\n` +
      `2) पासपोर्ट साइजको फोटो (2 प्रति)\n` +
      `3) अन्तिम शैक्षिक योग्यताको प्रमाणपत्र प्रतिलिपि\n` +
      `4) 50% भर्ना शुल्क (Advance)\n` +
      `📍 प्राविधिक स्कुल, जोरपाटी | 📞 01-4910715`
  },
  {
    key: 'slash_caregiver',
    title: 'केयरगिभर तालिम (/caregiver)',
    category: 'Slash Command',
    slashCmd: '/caregiver',
    isSystem: true,
    body:
      `🏥 *केयरगिभर तालिम (Caregiver — 390 Hours / 3 Months)*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n` +
      `• 80% प्रयोगात्मक क्लिनिकल ल्याब अभ्यास\n` +
      `• Vital Signs, वृद्धवृद्धा/बिरामी स्याहार, First Aid & CPR\n` +
      `• CTEVT मान्यता प्राप्त प्रमाणपत्र र OJT व्यवस्था\n` +
      `📞 भर्नाका लागि: 01-4910715 / 9803614574`
  },
  {
    key: 'slash_tailoring',
    title: 'टेलरिङ तथा फेसन (/tailoring)',
    category: 'Slash Command',
    slashCmd: '/tailoring',
    isSystem: true,
    body:
      `👗 *टेलरिङ तथा फेसन डिजाइनिङ (390 Hours / 3 Months)*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n` +
      `• प्रत्येक विद्यार्थीलाई छुट्टै Juki Industrial Sewing Machine\n` +
      `• कुर्ता-सुरुवाल, ब्लाउज, प्याटर्न ड्राफ्टिङ र आधुनिक सिलाइ\n` +
      `• 100% वर्कशप सामग्री सहित रोजगार समन्वय\n` +
      `📞 भर्नाका लागि: 01-4910715 / 9803614574`
  },
  {
    key: 'slash_beautician',
    title: 'ब्युटिसियन तथा कस्मेटोलोजी (/beautician)',
    category: 'Slash Command',
    slashCmd: '/beautician',
    isSystem: true,
    body:
      `💄 *ब्युटिसियन तथा कस्मेटोलोजी (390 Hours / 3 Months)*\n` +
      `*ग्लोबल एरा मल्टी सर्भिस प्रा. लि. (प्राविधिक स्कुल, जोरपाटी)*\n` +
      `• स्किन केयर, फेसियल, हेयर स्टाइल, र ब्राइडल मेकअप\n` +
      `• आधुनिक सलुन उपकरण र प्रयोगात्मक अभ्यास\n` +
      `• प्रमाणित ट्रेनर र सलुन OJT प्लेसमेन्ट\n` +
      `📞 भर्नाका लागि: 01-4910715 / 9803614574`
  }
];

export function getWhatsAppTemplates() {
  const db = loadDB();
  const saved = Array.isArray(db.whatsappTemplates) ? db.whatsappTemplates : [];
  const byKey = new Map();
  DEFAULT_NEPALI_WA_TEMPLATES.forEach((tpl) => byKey.set(tpl.key, { ...tpl }));
  saved.forEach((tpl) => {
    if (tpl?.key) {
      const base = byKey.get(tpl.key) || {};
      byKey.set(tpl.key, { ...base, ...tpl });
    }
  });
  return Array.from(byKey.values());
}

export function saveWhatsAppTemplates(templatesList) {
  const db = loadDB();
  const nextDb = { ...db, whatsappTemplates: templatesList };
  saveDB(nextDb);
  return nextDb;
}

export function resetWhatsAppTemplates() {
  const db = loadDB();
  const nextDb = { ...db, whatsappTemplates: DEFAULT_NEPALI_WA_TEMPLATES };
  saveDB(nextDb);
  return DEFAULT_NEPALI_WA_TEMPLATES;
}

export function renderWhatsAppTemplate(keyOrTemplate, vars = {}) {
  const templates = getWhatsAppTemplates();
  const tpl =
    typeof keyOrTemplate === 'string'
      ? templates.find((t) => t.key === keyOrTemplate) || DEFAULT_NEPALI_WA_TEMPLATES.find((t) => t.key === keyOrTemplate)
      : keyOrTemplate;
  let body = tpl?.body || '';
  const safeVars = {
    name: 'Trainee',
    course: 'Vocational Training',
    amount: '0',
    totalFee: '0',
    paid: '0',
    due: '0',
    receiptNo: '-',
    method: 'Cash',
    date: new Date().toISOString().slice(0, 10),
    tgid: '-',
    shift: 'Regular Shift',
    hours: '390',
    verifyUrl: 'https://globalera.vercel.app',
    receivedBy: 'Accounts Office',
    ...vars
  };
  Object.entries(safeVars).forEach(([k, v]) => {
    body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
  });
  return body;
}

/**
 * 1-Click Action: Send Course Brochure & Syllabus via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppBrochureDirect(phone, course) {
  const cTitle = course?.title || 'Vocational Training';
  const hours = course?.totalHours || 390;
  const verifyUrl = `https://globalera.vercel.app/?course=${course?.id || ''}`;

  const msg = renderWhatsAppTemplate('course_brochure', {
    course: cTitle,
    hours: String(hours),
    verifyUrl
  });

  return sendMetaWhatsAppMessage({
    to: phone,
    type: 'text',
    text: msg
  });
}

/**
 * 1-Click Action: Send Official Admission Confirmation & Fee Receipt
 */
export async function sendWhatsAppAdmissionReceiptDirect(phone, student, admission, course) {
  const sName = student?.name || 'Trainee';
  const cTitle = course?.title || 'Vocational Course';
  const tgid = student?.tgid || 'GETS-STD';
  const paid = Number(admission?.advanceFee || 0).toLocaleString();
  const due = Number(admission?.dueFee || 0).toLocaleString();
  const totalFee = Number(admission?.totalFee || Number(admission?.advanceFee || 0) + Number(admission?.dueFee || 0)).toLocaleString();
  const receiptNo = admission?.receiptNo || `REC-${Date.now().toString().slice(-6)}`;

  const msg = renderWhatsAppTemplate('admission_receipt', {
    name: sName,
    course: cTitle,
    tgid,
    amount: paid,
    paid,
    due,
    totalFee,
    receiptNo,
    method: admission?.paymentMethod || 'Cash',
    date: admission?.admissionDate || new Date().toISOString().slice(0, 10)
  });

  return sendMetaWhatsAppMessage({
    to: phone,
    type: 'text',
    text: msg
  });
}

/**
 * 1-Click Action: Send Student Daily Absence Warning to Parent
 */
export async function sendWhatsAppAbsenceAlertDirect(parentPhone, student, group, date) {
  const sName = student?.name || 'Student';
  const shift = group?.shift ? `Shift ${group.shift}` : 'Regular Class';
  const dateStr = date || new Date().toISOString().slice(0, 10);

  const msg = renderWhatsAppTemplate('absent_alert', {
    name: sName,
    shift,
    date: dateStr
  });

  return sendMetaWhatsAppMessage({
    to: parentPhone,
    type: 'text',
    text: msg
  });
}

// ---------------------------------------------------------------------------
// Unified WhatsApp Hub: Thread Metadata, Live Sync & Directory Builder
// ---------------------------------------------------------------------------

const THREAD_META_KEY = 'kite_wa_thread_meta_v1';

export function getThreadMetaMap() {
  try {
    const raw = localStorage.getItem(THREAD_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveThreadMetaMap(map) {
  try {
    localStorage.setItem(THREAD_META_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('kite_db_updated'));
  } catch {
    // ignore storage quota errors
  }
}

export function normalizePhoneKey(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function markThreadRead(phone) {
  const key = normalizePhoneKey(phone);
  if (!key) return;
  const map = getThreadMetaMap();
  map[key] = {
    ...(map[key] || {}),
    lastReadAt: new Date().toISOString()
  };
  saveThreadMetaMap(map);
}

export async function toggleBotPause(phone, paused) {
  const key = normalizePhoneKey(phone);
  if (!key) return;
  const map = getThreadMetaMap();
  map[key] = {
    ...(map[key] || {}),
    botPaused: Boolean(paused)
  };
  saveThreadMetaMap(map);

  // Sync explicit pause/resume state to Supabase so Vercel Webhook respects Human Takeover
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from('whatsapp_logs').insert({
        phone: formatToWhatsAppRecipient(phone) || key,
        direction: 'outbound',
        message_type: paused ? 'bot_pause_state' : 'bot_resume_state',
        status: paused ? 'paused' : 'resumed',
        content: paused ? '[Human Takeover: Auto-Bot Paused]' : '[Auto-Bot Resumed]'
      });
      if (error) {
        await supabase.from('communication_logs').insert({
          id: `WABOT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          organization_id: 'ORG-GLOBALERA-01',
          channel: paused ? 'WhatsApp_Bot_Pause' : 'WhatsApp_Bot_Resume',
          recipient_name: 'System Bot State',
          recipient_phone: key,
          message: paused ? '[Human Takeover: Auto-Bot Paused]' : '[Auto-Bot Resumed]',
          status: paused ? 'paused' : 'resumed',
          sent_at: new Date().toISOString()
        });
      }
    }
  } catch {
    // non-fatal
  }
}

export function resolveBotMode(bot = {}) {
  if (bot.replyMode === 'ai' || bot.replyMode === 'bot' || bot.replyMode === 'manual') {
    return bot.replyMode;
  }
  if (bot.autoBotEnabled === false) return 'manual';
  if (bot.aiCounselorEnabled === false) return 'bot';
  return 'ai';
}

export function normalizeBotConfig(bot = {}) {
  const replyMode = resolveBotMode(bot);
  return {
    replyMode,
    autoBotEnabled: replyMode !== 'manual',
    aiCounselorEnabled: replyMode === 'ai',
    geminiApiKey: bot.geminiApiKey || '',
    aiInstructions: bot.aiInstructions || ''
  };
}

export function getBotSettings() {
  const db = loadDB();
  const bot = db.settings?.whatsappBot || {};
  return normalizeBotConfig(bot);
}

export function cleanWhatsAppMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/^#{1,6}\s*(.*?)$/gm, '*$1*')
    .replace(/\*\*\*(.*?)\*\*\*/g, '*$1*')
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function fetchRemoteBotSettings() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return getBotSettings();
    const [{ data, error }, { data: orgData }, { data: cfgLogs }] = await Promise.all([
      supabase.from('system_settings').select('id, company_profile').limit(1),
      supabase.from('organizations').select('id, settings').limit(1),
      supabase.from('communication_logs').select('message').eq('channel', 'WA_Config_Sync').order('sent_at', { ascending: false }).limit(1)
    ]);
    const sysBot = !error && Array.isArray(data) ? data[0]?.company_profile?.whatsappBot : null;
    const orgBot = Array.isArray(orgData) ? orgData[0]?.settings?.whatsappBot : null;
    let logBot = null;
    if (Array.isArray(cfgLogs) && cfgLogs[0]?.message) {
      try {
        logBot = JSON.parse(cfgLogs[0].message);
      } catch {
        logBot = null;
      }
    }
    const remoteBot = sysBot || orgBot || logBot;
    if (remoteBot) {
      const merged = normalizeBotConfig({
        ...getBotSettings(),
        ...(logBot || {}),
        ...(orgBot || {}),
        ...(sysBot || {}),
        geminiApiKey: sysBot?.geminiApiKey || orgBot?.geminiApiKey || logBot?.geminiApiKey || getBotSettings().geminiApiKey || ''
      });
      const db = loadDB();
      saveDB({
        ...db,
        settings: {
          ...(db.settings || {}),
          whatsappBot: merged
        }
      });
      return merged;
    }
  } catch {
    // fallback to local
  }
  return getBotSettings();
}

export async function saveBotSettings(nextBot) {
  const db = loadDB();
  const merged = normalizeBotConfig({ ...getBotSettings(), ...nextBot });
  const nextDb = {
    ...db,
    settings: {
      ...(db.settings || {}),
      whatsappBot: merged
    }
  };
  saveDB(nextDb);

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ...merged, syncedRemote: false };
  }

  const [{ data, error: readErr }, { data: orgData }] = await Promise.all([
    supabase.from('system_settings').select('id, company_profile').limit(1),
    supabase.from('organizations').select('id, settings').limit(1)
  ]);
  if (readErr || !Array.isArray(data) || !data[0]?.id) {
    throw new Error(readErr?.message || 'Could not read system_settings from Supabase.');
  }

  const nextProfile = {
    ...(data[0].company_profile || {}),
    whatsappBot: merged
  };
  const { error: updErr } = await supabase
    .from('system_settings')
    .update({ company_profile: nextProfile, updated_at: new Date().toISOString() })
    .eq('id', data[0].id);
  if (updErr) {
    throw new Error(updErr.message || 'Failed to sync bot settings to Supabase.');
  }

  // Also persist into organizations.settings.whatsappBot and WA_Config_Sync log as resilient backup
  if (Array.isArray(orgData) && orgData[0]?.id) {
    await supabase
      .from('organizations')
      .update({
        settings: {
          ...(orgData[0].settings || {}),
          whatsappBot: merged
        }
      })
      .eq('id', orgData[0].id);
  }
  await supabase.from('communication_logs').insert({
    id: `WACFG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organization_id: 'ORG-GLOBALERA-01',
    channel: 'WA_Config_Sync',
    recipient_name: 'System Bot Config',
    recipient_phone: 'SYSTEM',
    message: JSON.stringify(merged),
    status: 'sent',
    sent_at: new Date().toISOString()
  });
  return { ...merged, syncedRemote: true };
}

/**
 * Subscribe to real-time Supabase changes on communication_logs (WhatsApp channels)
 * so inbound customer messages & outbound AI replies appear instantly (< 0.5s).
 */
export function subscribeWhatsAppRealtime(onEvent) {
  const supabase = getSupabaseClient();
  if (!supabase || typeof onEvent !== 'function') return () => {};
  const channelName = `wa-realtime-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'communication_logs' },
      (payload) => {
        const ch = payload?.new?.channel || payload?.old?.channel || '';
        if (String(ch).startsWith('WhatsApp')) {
          onEvent(payload);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      // ignore cleanup error
    }
  };
}

export async function testGeminiConnection(apiKey) {
  const key = (apiKey || '').trim();
  if (!key) {
    throw new Error('Please paste your Gemini API Key first.');
  }
  const models = ['gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.8-flash'];
  let lastError = 'Gemini API request failed.';
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Reply with OK in one word.' }] }],
            generationConfig: { maxOutputTokens: 16 }
          })
        }
      );
      if (res.ok) {
        return { ok: true, model };
      }
      const errData = await res.json().catch(() => ({}));
      lastError = errData?.error?.message || `HTTP ${res.status}`;
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error(lastError);
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

async function callGeminiCounselorApi({ apiKey, systemPrompt, userPrompt }) {
  const models = ['gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.8-flash'];
  let lastError = 'Failed to generate AI response.';
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
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
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return { reply: cleanWhatsAppMarkdown(text), model };
      } else {
        const errData = await res.json().catch(() => ({}));
        lastError = errData?.error?.message || `HTTP ${res.status}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }
  throw new Error(lastError);
}

export async function suggestGeminiReply({ contactName, role, messages = [], studentInfo = '' }) {
  const botCfg = await fetchRemoteBotSettings();
  const apiKey = (botCfg?.geminiApiKey || '').trim();
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Save it in WhatsApp -> Broadcast & Bot Info.');
  }

  const recentTurns = (messages || [])
    .filter((m) => m.messageType !== 'internal_note' && m.content)
    .slice(-12)
    .map((m) => `${m.direction === 'inbound' ? 'Visitor' : 'Counsellor'}: ${m.content}`)
    .join('\n');

  const systemPrompt =
    MASTER_COUNSELOR_PROMPT_V5 +
    (botCfg.aiInstructions ? `\n\n७. संस्थाको थप अद्यावधिक निर्देशन / अफर:\n${botCfg.aiInstructions}\n` : '') +
    (studentInfo ? `\n८. Verified Student Record:\n${studentInfo}\n` : '');

  const userPrompt =
    `Contact: ${contactName || 'Visitor'} (${role || 'Inquiry'})\n` +
    `Recent Chat:\n${recentTurns || '(New conversation — first contact)'}\n\n` +
    `Write a natural, warm, human-like Counsellor WhatsApp reply now (reply text only):`;

  const result = await callGeminiCounselorApi({ apiKey, systemPrompt, userPrompt });
  return result.reply;
}

export async function simulateGeminiCounselorTurn({ messages = [], userInput = '', customInstructions = '', studentContext = '' }) {
  const botCfg = await fetchRemoteBotSettings();
  const apiKey = (botCfg?.geminiApiKey || '').trim();
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please save it above first.');
  }

  const instructions = customInstructions || botCfg.aiInstructions || '';
  const recentTurns = (messages || [])
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'Visitor' : 'Counsellor'}: ${m.text}`)
    .join('\n');

  const systemPrompt =
    MASTER_COUNSELOR_PROMPT_V5 +
    (instructions ? `\n\n७. संस्थाको थप अद्यावधिक निर्देशन / अफर:\n${instructions}\n` : '') +
    (studentContext ? `\n${studentContext}\n` : '');

  const userPrompt =
    `Recent conversation:\n${recentTurns || '(New conversation — first contact)'}\n\n` +
    `Latest message from Visitor:\n"${userInput}"\n\n` +
    `Write a natural, warm, human-like Counsellor reply in WhatsApp style now:`;

  return callGeminiCounselorApi({ apiKey, systemPrompt, userPrompt });
}

export function togglePinContact(phone) {
  const key = normalizePhoneKey(phone);
  if (!key) return false;
  const map = getThreadMetaMap();
  const nextPinned = !Boolean(map[key]?.pinned);
  map[key] = {
    ...(map[key] || {}),
    pinned: nextPinned
  };
  saveThreadMetaMap(map);
  return nextPinned;
}

export function assignThreadStaff(phone, staffName) {
  const key = normalizePhoneKey(phone);
  if (!key) return;
  const map = getThreadMetaMap();
  map[key] = {
    ...(map[key] || {}),
    assignedTo: staffName || ''
  };
  saveThreadMetaMap(map);
}

export function addInternalStaffNote({ phone, note, author = 'Staff' }) {
  const cleanNote = String(note || '').trim();
  if (!phone || !cleanNote) return;
  const db = loadDB();
  const newNote = {
    id: `NOTE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    phone,
    direction: 'internal_note',
    messageType: 'internal_note',
    status: 'internal',
    author,
    content: cleanNote
  };
  const nextLogs = [newNote, ...(db.whatsappLogs || [])].slice(0, 500);
  saveDB({ ...db, whatsappLogs: nextLogs });
}

/**
 * Fetch remote inbound events and delivery logs from Supabase
 */
export async function fetchRemoteWhatsAppData() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { logs: [], inbound: [] };

    const [logsRes, inboundRes, commRes] = await Promise.all([
      supabase.from('whatsapp_logs').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('whatsapp_inbound_events').select('*').order('created_at', { ascending: false }).limit(250),
      supabase
        .from('communication_logs')
        .select('*')
        .ilike('channel', 'WhatsApp_%')
        .order('sent_at', { ascending: false })
        .limit(250)
    ]);

    const mappedCommLogs = (commRes?.data || []).map((c) => {
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
        id: c.id,
        phone: c.recipient_phone,
        direction,
        message_type,
        status: c.status || 'sent',
        content: c.message || '',
        created_at: c.sent_at
      };
    });

    return {
      logs: logsRes?.data && logsRes.data.length > 0 ? logsRes.data : mappedCommLogs,
      inbound: inboundRes?.data || []
    };
  } catch {
    return { logs: [], inbound: [] };
  }
}

/**
 * Build unified contacts, threads, unread counts, and systematic audit logs
 * combining Leads, Students, Trainers, Employers, and Unknown/FB Ad visitors.
 */
export function buildWhatsAppHubState(db, remoteData = { logs: [], inbound: [] }) {
  const metaMap = getThreadMetaMap();
  const contactsByKey = new Map();

  const registerEntity = (entity, role) => {
    const rawPhone = entity?.phone || entity?.mobile || entity?.contactPhone;
    const key = normalizePhoneKey(rawPhone);
    if (!key) return;
    if (!contactsByKey.has(key)) {
      contactsByKey.set(key, {
        key,
        phone: rawPhone,
        name: entity.name || entity.companyName || entity.contactPerson || 'Contact',
        role,
        entity,
        messages: [],
        adReferral: null,
        unreadCount: 0,
        botPaused: Boolean(metaMap[key]?.botPaused),
        pinned: Boolean(metaMap[key]?.pinned),
        assignedTo: metaMap[key]?.assignedTo || ''
      });
    }
  };

  (db.leads || []).forEach((l) => registerEntity(l, 'Lead'));
  (db.students || []).forEach((s) => registerEntity(s, 'Student'));
  (db.trainers || []).forEach((t) => registerEntity(t, 'Trainer'));
  (db.employers || []).forEach((e) => registerEntity(e, 'Employer'));

  const ensureThread = (phone, fallbackName = 'WhatsApp Visitor') => {
    const key = normalizePhoneKey(phone);
    if (!key) return null;
    if (!contactsByKey.has(key)) {
      contactsByKey.set(key, {
        key,
        phone,
        name: fallbackName,
        role: 'New Inquiry',
        entity: null,
        messages: [],
        adReferral: null,
        unreadCount: 0,
        botPaused: Boolean(metaMap[key]?.botPaused),
        pinned: Boolean(metaMap[key]?.pinned),
        assignedTo: metaMap[key]?.assignedTo || ''
      });
    }
    return contactsByKey.get(key);
  };

  const seenIds = new Set();
  const allAuditLogs = [];

  const pushMessage = (msg) => {
    const dedupeKey = msg.metaMessageId || `${msg.key}|${msg.direction}|${msg.content}|${(msg.createdAt || '').slice(0, 16)}`;
    if (seenIds.has(dedupeKey)) return;
    seenIds.add(dedupeKey);

    const thread = ensureThread(msg.phone, msg.senderName || 'WhatsApp Visitor');
    if (!thread) return;
    if (msg.adReferral && !thread.adReferral) {
      thread.adReferral = msg.adReferral;
    }
    thread.messages.push(msg);

    const lastRead = metaMap[thread.key]?.lastReadAt;
    if (msg.direction === 'inbound' && (!lastRead || new Date(msg.createdAt) > new Date(lastRead))) {
      thread.unreadCount += 1;
    }

    allAuditLogs.push({
      ...msg,
      contactName: thread.name,
      contactRole: thread.role
    });
  };

  // 1. Remote Supabase inbound events (preserve rich referral + media metadata)
  (remoteData.inbound || []).forEach((ev) => {
    const referral = ev?.raw_payload?.referral || null;
    const media = ev?.raw_payload?.media || null;
    pushMessage({
      id: `INB-${ev.id}`,
      key: normalizePhoneKey(ev.phone),
      phone: ev.phone,
      senderName: ev.sender_name || 'WhatsApp Visitor',
      direction: 'inbound',
      messageType: referral ? 'fb_ad_inquiry' : 'text',
      status: 'received',
      content: ev.message_text || '',
      createdAt: ev.created_at || new Date().toISOString(),
      metaMessageId: ev?.raw_payload?.message_id || null,
      adReferral: referral,
      media
    });
  });

  // 2. Remote Supabase whatsapp_logs (outbound, auto_bot, delivery statuses; skip internal bot state markers)
  (remoteData.logs || []).forEach((lg) => {
    if (lg.message_type === 'bot_pause_state' || lg.message_type === 'bot_resume_state') return;
    pushMessage({
      id: `RLOG-${lg.id}`,
      key: normalizePhoneKey(lg.phone),
      phone: lg.phone,
      senderName: 'WhatsApp Visitor',
      direction: lg.direction || 'outbound',
      messageType: lg.message_type || 'text',
      status: lg.status || 'sent',
      content: lg.content || '',
      createdAt: lg.created_at || new Date().toISOString(),
      metaMessageId: lg.meta_message_id || null,
      adReferral: null
    });
  });

  // 3. Local whatsappLogs
  (db.whatsappLogs || []).forEach((lg) => {
    pushMessage({
      id: lg.id,
      key: normalizePhoneKey(lg.phone),
      phone: lg.phone,
      senderName: lg.recipientName || 'Contact',
      direction: lg.direction || 'outbound',
      messageType: lg.messageType || 'text',
      status: lg.status || 'sent',
      content: lg.content || '',
      createdAt: lg.createdAt || new Date().toISOString(),
      metaMessageId: lg.metaMessageId || null,
      adReferral: lg.adReferral || null
    });
  });

  // 4. Local communicationLogs (WhatsApp / SMS)
  (db.communicationLogs || []).forEach((cl) => {
    if (cl.channel === 'Call') return;
    const phone = cl.recipientPhone || cl.phone;
    if (!phone) return;
    pushMessage({
      id: cl.id,
      key: normalizePhoneKey(phone),
      phone,
      senderName: cl.recipientName || 'Contact',
      direction: 'outbound',
      messageType: cl.channel === 'SMS' ? 'sms' : 'text',
      status: cl.status === 'Failed' ? 'failed' : 'sent',
      content: cl.messageText || cl.message || '',
      createdAt: cl.sentAt || cl.createdAt || new Date().toISOString(),
      metaMessageId: null,
      adReferral: null
    });
  });

  const threads = Array.from(contactsByKey.values()).map((t) => {
    t.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const lastMsg = t.messages[t.messages.length - 1] || null;
    return {
      ...t,
      lastMessage: lastMsg?.content || '',
      lastTimestamp: lastMsg?.createdAt || null
    };
  });

  threads.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
    if (a.lastTimestamp && b.lastTimestamp) return new Date(b.lastTimestamp) - new Date(a.lastTimestamp);
    if (a.lastTimestamp) return -1;
    if (b.lastTimestamp) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  allAuditLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  return {
    threads,
    auditLogs: allAuditLogs,
    totalUnread
  };
}

/**
 * Capture a printable Bill/Receipt DOM element as an HD PNG using html2canvas
 * and send it directly to the student's WhatsApp via /api/whatsapp-send-media.
 */
export async function sendBillElementToWhatsApp({
  elementId,
  phone,
  studentName = 'Student',
  filename = 'Official_Bill.png',
  caption = ''
}) {
  const recipient = formatToWhatsAppRecipient(phone);
  if (!recipient) throw new Error('Student phone number is missing or invalid.');

  const el = document.getElementById(elementId);
  if (!el) throw new Error('Printable bill element not found.');

  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#FFFFFF'
  });
  const imageBase64 = canvas.toDataURL('image/png');
  const settings = getWhatsAppSettings();

  const res = await fetch('/api/whatsapp-send-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipient,
      imageBase64,
      caption,
      filename,
      phoneNumberId: settings.phoneNumberId,
      accessToken: settings.accessToken
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    // Graceful fallback to text summary if media proxy endpoint is unavailable (e.g. local dev without vercel dev)
    if (caption) {
      return sendMetaWhatsAppMessage({ to: phone, type: 'text', text: caption });
    }
    throw new Error(data?.error || 'Failed to send bill image via WhatsApp.');
  }

  logWhatsAppMessage({
    phone: recipient,
    recipientName: studentName,
    direction: 'outbound',
    messageType: 'bill_image',
    status: 'sent',
    content: caption || `[Signed Bill Sent: ${filename}]`,
    metaMessageId: data.messageId || null
  });

  return data;
}

/**
 * Open the global Floating 3-Pane WhatsApp Hub directly on a specific contact's chat
 * with an optional pre-filled draft message (replacing legacy external wa.me redirects).
 */
export function openWhatsAppHubForContact({ phone, name = '', role = '', initialDraft = '' }) {
  if (!phone) return;
  window.dispatchEvent(
    new CustomEvent('kite_open_whatsapp_hub', {
      detail: { phone, name, role, initialDraft }
    })
  );
}
