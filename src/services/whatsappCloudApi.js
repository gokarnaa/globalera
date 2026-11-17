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

  const msg = `🌟 *Prabidhik School (Global Era Multi Service Pvt. Ltd.) — Official Syllabus & Brochure* 🌟\n\n` +
    `Hello! Here is the official vocational curriculum details for *${cTitle}* (${hours} Hours — 80% Practical Hands-on Training):\n\n` +
    `📍 *Campus:* Jorpati, Gokarneshwor, Kathmandu\n` +
    `⏱️ *Daily 2-Hour Flexible Shifts:* Shift A (7-9 AM) to Shift E (4-6 PM)\n` +
    `💳 *Affordable TVET Fee Structure:* 50% on Enrollment + 50% Mid-Course\n` +
    `🛠️ *Tools & Materials:* 100% individual toolsets provided in workshop\n` +
    `💼 *Career Support:* 1-Click Graduation Portfolio Dossier & OJT Job Placement\n\n` +
    `🌐 *View Full Interactive Syllabus Online:* https://globalera.com.np/?course=${course?.id || ''}\n\n` +
    `For counseling or admissions assistance, reply to this message directly or call 014910715 / WhatsApp 9705147147.`;

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
    `*Prabidhik School (Global Era Multi Service Pvt. Ltd.)*\n` +
    `Receipt No: *${receiptNo}*\n` +
    `Student Name: *${sName}*\n` +
    `Registration TGID: *${tgid}*\n` +
    `Enrolled Course: *${cTitle}*\n\n` +
    `💰 *Fee Payment Summary (50-50 Policy):*\n` +
    `• Amount Paid Today: *NPR ${paid}* (Advance 50%)\n` +
    `• Remaining Due: *NPR ${due}* (Due at Mid-Course)\n\n` +
    `📍 Campus: Jorpati, Gokarneshwor, Kathmandu | Phone: 014910715 | WhatsApp: 9705147147\n` +
    `Please keep this message as your official digital payment proof. Welcome to Prabidhik School!`;

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

  const msg = `⚠️ *Prabidhik School — Daily Attendance Notice*\n\n` +
    `Dear Guardian/Parent,\n` +
    `This is to notify that your ward *${sName}* was recorded *ABSENT* from the ${shift} vocational training on *${dateStr}*.\n\n` +
    `CTEVT accreditation requires at least 80% practical attendance for final examination and OJT eligibility.\n` +
    `If this absence was pre-approved or due to medical reasons, please contact the front desk at 014910715 / 9705147147.\n\n` +
    `Admin Office, Prabidhik School (Global Era Multi Service Pvt. Ltd.)`;

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

export function toggleBotPause(phone, paused) {
  const key = normalizePhoneKey(phone);
  if (!key) return;
  const map = getThreadMetaMap();
  map[key] = {
    ...(map[key] || {}),
    botPaused: Boolean(paused)
  };
  saveThreadMetaMap(map);
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

    const [logsRes, inboundRes] = await Promise.all([
      supabase.from('whatsapp_logs').select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from('whatsapp_inbound_events').select('*').order('created_at', { ascending: false }).limit(250)
    ]);

    return {
      logs: logsRes?.data || [],
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

  // 2. Remote Supabase whatsapp_logs (outbound, auto_bot, delivery statuses)
  (remoteData.logs || []).forEach((lg) => {
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
