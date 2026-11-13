// Official Meta WhatsApp Business Cloud API & Webhook Service
// Global Era Technical School TVET ERP Integration
import { getSupabaseConfig, getSupabaseClient } from './supabaseClient.js';
import { loadDB, saveDB } from './storage.js';

export const DEFAULT_META_TOKEN = 'EAAfNnTOAYlMBS2hlBdjXhFtlm6LRZAT17r5o01sqPalD82sDqegG7vcM0McAXXZCM07wiAQF913m4OTHDiZCU6TcpPTZBQRgHc1k9GxmXTM79l2tRW1ZCjkj3oKsgHwMfLNxL1QVnt5RwImV7Gzx1OnW0bHshrBWg6BJNhNDEwGwIZB76q2E2LLyOf3EbwMjoxUcX7Yr8MZAmeBuMknkBoAcFHY7SArMeb5cEgjL4UFdbCleouJVKVlYfMqEH8mVJHJ3ZAAgGGQ5IiEzjguCg9ez2nHebcBa1lorIwZDZD';
export const DEFAULT_VERIFY_TOKEN = 'globalera_tvet_whatsapp_verify_2026';

/**
 * Retrieve WhatsApp Cloud API settings from local DB or defaults
 */
export function getWhatsAppSettings() {
  const db = loadDB();
  const wa = db.settings?.whatsapp || {};
  return {
    accessToken: (wa.accessToken || DEFAULT_META_TOKEN).trim(),
    phoneNumberId: (wa.phoneNumberId || '').trim(),
    wabaId: (wa.wabaId || '').trim(),
    verifyToken: (wa.verifyToken || DEFAULT_VERIFY_TOKEN).trim(),
    webhookUrl: wa.webhookUrl || 'https://yycybsmwuixixfmocrcz.supabase.co/functions/v1/whatsapp-webhook',
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

    // Also push to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('whatsapp_logs').insert({
        phone: logEntry.phone,
        direction: logEntry.direction || 'outbound',
        message_type: logEntry.messageType || 'text',
        status: logEntry.status || 'sent',
        content: logEntry.content || '',
        meta_message_id: logEntry.metaMessageId || null
      });
    }
  } catch (err) {
    console.debug('[WhatsApp Log Notice]:', err.message);
  }
}

/**
 * 1-Click Action: Send Course Brochure & Syllabus via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppBrochureDirect(phone, course) {
  const cTitle = course?.title || 'Vocational Training';
  const hours = course?.totalHours || 390;

  const msg = `🌟 *Global Era Technical School — Official Syllabus & Brochure* 🌟\n\n` +
    `Hello! Here is the official vocational curriculum details for *${cTitle}* (${hours} Hours — 80% Practical Hands-on Training):\n\n` +
    `📍 *Campus:* Jorpati, Gokarneshwor, Kathmandu (Near MitraPark Hub)\n` +
    `⏱️ *Daily 2-Hour Flexible Shifts:* Shift A (7-9 AM) to Shift E (4-6 PM)\n` +
    `💳 *Affordable TVET Fee Structure:* 50% on Enrollment + 50% Mid-Course\n` +
    `🛠️ *Tools & Materials:* 100% individual toolsets provided in workshop\n` +
    `💼 *Career Support:* 1-Click Graduation Portfolio Dossier & OJT Job Placement\n\n` +
    `🌐 *View Full Interactive Syllabus Online:* https://globalera.com.np/?course=${course?.id || ''}\n\n` +
    `For counseling or admissions assistance, reply to this message directly or call 01410715 / 9851000000.`;

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
  const receiptNo = admission?.receiptNo || `REC-${Date.now().toString().slice(-6)}`;

  const msg = `🎉 *Official Admission Confirmation & Fee Receipt* 🎉\n\n` +
    `*Global Era Technical School*\n` +
    `Receipt No: *${receiptNo}*\n` +
    `Student Name: *${sName}*\n` +
    `Registration TGID: *${tgid}*\n` +
    `Enrolled Course: *${cTitle}*\n\n` +
    `💰 *Fee Payment Summary (50-50 Policy):*\n` +
    `• Amount Paid Today: *NPR ${paid}* (Advance 50%)\n` +
    `• Remaining Due: *NPR ${due}* (Due at Mid-Course)\n\n` +
    `📍 Campus: Jorpati, Gokarneshwor | Phone: 01410715\n` +
    `Please keep this message as your official digital payment proof. Welcome to Global Era!`;

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
  const shift = group?.shift ? `Shift ${group.shift}` : 'regular class';
  const dateStr = date || new Date().toISOString().slice(0, 10);

  const msg = `⚠️ *Global Era Technical School — Daily Attendance Notice*\n\n` +
    `Dear Guardian/Parent,\n` +
    `This is to notify that your ward *${sName}* was recorded *ABSENT* from the ${shift} vocational training on *${dateStr}*.\n\n` +
    `CTEVT accreditation requires at least 80% practical attendance for final examination and OJT eligibility.\n` +
    `If this absence was pre-approved or due to medical reasons, please contact the front desk at 01410715.\n\n` +
    `Admin Office, Global Era Technical School`;

  return sendMetaWhatsAppMessage({
    to: parentPhone,
    type: 'text',
    text: msg
  });
}
