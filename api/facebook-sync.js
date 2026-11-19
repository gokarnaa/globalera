// Vercel Serverless Function: Scan unreplied Facebook Page Comments & Messenger Conversations
// Powers the separate "FB Backlog / Catch-Up Mode" without cluttering Regular Live Mode

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yycybsmwuixixfmocrcz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_e8g5bAQNbCGpuI3aC0P1SA_Lb02m1cO';
const ENV_FB_PAGE_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';

async function getPageAccessToken() {
  if (ENV_FB_PAGE_TOKEN) return ENV_FB_PAGE_TOKEN.trim();
  try {
    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    const [sysRes, cfgRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/system_settings?select=id,company_profile&limit=10`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/communication_logs?channel=eq.WA_Config_Sync&order=sent_at.desc&limit=1`, { headers })
    ]);
    const [sysRows, cfgData] = await Promise.all([
      sysRes.ok ? sysRes.json() : [],
      cfgRes.ok ? cfgRes.json() : []
    ]);
    const globalRow = Array.isArray(sysRows)
      ? (sysRows.find((r) => r.id === 'GLOBAL_CONFIG') || sysRows[0] || {})
      : {};
    let logBot = {};
    if (Array.isArray(cfgData) && cfgData[0]?.message) {
      try {
        logBot = JSON.parse(cfgData[0].message) || {};
      } catch {
        logBot = {};
      }
    }
    return (
      globalRow?.company_profile?.whatsappBot?.fbPageAccessToken ||
      logBot.fbPageAccessToken ||
      ''
    ).trim();
  } catch {
    return '';
  }
}

function extractNepalPhone(text = '') {
  const cleaned = String(text || '').replace(/[^\d+]/g, ' ');
  const match = cleaned.match(/(?:\+?977\s*)?(9[678]\d{8})\b/);
  return match ? match[1] : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.method === 'POST' ? (req.body || {}) : (req.query || {});
    const postLimit = Math.min(50, Math.max(5, Number(body.postLimit) || 25));
    const convLimit = Math.min(100, Math.max(10, Number(body.convLimit) || 50));
    const pageToken = String(body.pageToken || (await getPageAccessToken()) || '').trim();

    if (!pageToken) {
      return res.status(400).json({
        ok: false,
        error: 'Facebook Page Access Token is not configured. Please connect Facebook in Settings -> Channels.'
      });
    }

    // 1. Identify Page ID & Name
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(pageToken)}`
    );
    const meData = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !meData?.id) {
      return res.status(400).json({
        ok: false,
        error: meData?.error?.message || 'Failed to verify Facebook Page Access Token.'
      });
    }
    const pageId = String(meData.id);
    const pageName = meData.name || 'Facebook Page';

    // 2. Fetch Recent Posts + Comments AND Recent Messenger Conversations in parallel
    const postsFields = 'id,message,created_time,permalink_url,comments.limit(50){id,from,message,created_time,comments.limit(10){from{id}}}';
    const convFields = 'id,updated_time,link,participants,messages.limit(10){id,from,message,created_time}';

    const [postsRes, convsRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(postsFields)}&limit=${postLimit}&access_token=${encodeURIComponent(pageToken)}`
      ),
      fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/conversations?platform=messenger&fields=${encodeURIComponent(convFields)}&limit=${convLimit}&access_token=${encodeURIComponent(pageToken)}`
      )
    ]);

    const [postsJson, convsJson] = await Promise.all([
      postsRes.json().catch(() => ({})),
      convsRes.json().catch(() => ({}))
    ]);

    const warnings = [];
    if (!postsRes.ok) {
      warnings.push(`Comments scan: ${postsJson?.error?.message || 'Permission required (pages_read_engagement)'}`);
    }
    if (!convsRes.ok) {
      warnings.push(`Messenger scan: ${convsJson?.error?.message || 'Permission required (pages_messaging)'}`);
    }

    const nowMs = Date.now();

    // 3. Filter Unreplied Comments
    const unrepliedComments = [];
    const posts = Array.isArray(postsJson?.data) ? postsJson.data : [];
    for (const post of posts) {
      const postSnippet = String(post.message || '').trim().slice(0, 110) || 'Facebook Page Post';
      const commentsList = Array.isArray(post?.comments?.data) ? post.comments.data : [];
      for (const cmt of commentsList) {
        if (!cmt?.id || !String(cmt.message || '').trim()) continue;
        // Skip comments made by our own Page
        if (String(cmt?.from?.id || '') === pageId) continue;
        // Skip comments that our Page has already replied to
        const childReplies = Array.isArray(cmt?.comments?.data) ? cmt.comments.data : [];
        const alreadyRepliedByPage = childReplies.some((r) => String(r?.from?.id || '') === pageId);
        if (alreadyRepliedByPage) continue;

        const createdMs = cmt.created_time ? new Date(cmt.created_time).getTime() : nowMs;
        const ageHours = Math.max(0, (nowMs - createdMs) / 3600000);
        unrepliedComments.push({
          id: cmt.id,
          type: 'fb_comment',
          postId: post.id,
          postSnippet,
          permalinkUrl: post.permalink_url || `https://facebook.com/${post.id}`,
          senderId: cmt?.from?.id || '',
          senderName: cmt?.from?.name || 'Facebook User',
          message: String(cmt.message || '').trim(),
          createdAt: cmt.created_time || new Date().toISOString(),
          ageHours: Math.round(ageHours * 10) / 10,
          extractedPhone: extractNepalPhone(cmt.message || '')
        });
      }
    }

    // 4. Filter Unreplied Messenger Conversations into 3 Smart Buckets
    const messenger24h = [];
    const messengerOldWithPhone = [];
    const messengerOldNoPhone = [];

    const convs = Array.isArray(convsJson?.data) ? convsJson.data : [];
    for (const conv of convs) {
      const msgs = Array.isArray(conv?.messages?.data) ? conv.messages.data : [];
      if (!msgs.length) continue;

      // Latest message is index 0 in Graph API
      const latest = msgs[0];
      if (!latest) continue;
      // If our Page sent the last message, this conversation is already replied
      if (String(latest?.from?.id || '') === pageId) continue;

      const participants = Array.isArray(conv?.participants?.data) ? conv.participants.data : [];
      const customer = participants.find((p) => String(p?.id || '') !== pageId) || latest?.from || {};
      const customerPsid = String(customer?.id || latest?.from?.id || '');
      if (!customerPsid) continue;

      const customerName = customer?.name || latest?.from?.name || 'Messenger Visitor';
      const createdMs = latest.created_time ? new Date(latest.created_time).getTime() : nowMs;
      const ageHours = Math.max(0, (nowMs - createdMs) / 3600000);
      const within24h = ageHours < 23.5;

      // Combine recent customer messages to find any phone number
      const allText = msgs.map((m) => m.message || '').join(' ');
      const extractedPhone = extractNepalPhone(allText);
      const lastCustomerText = String(latest.message || '').trim() || '[Attachment / Sticker]';

      const metaInboxUrl = conv.link
        ? (conv.link.startsWith('http') ? conv.link : `https://business.facebook.com${conv.link}`)
        : `https://business.facebook.com/latest/inbox/all?asset_id=${encodeURIComponent(pageId)}&selected_item_id=${encodeURIComponent(customerPsid)}`;

      const item = {
        id: conv.id,
        type: 'messenger',
        psid: customerPsid,
        senderName: customerName,
        message: lastCustomerText,
        recentMessages: msgs.slice(0, 4).reverse().map((m) => ({
          fromPage: String(m?.from?.id || '') === pageId,
          text: String(m.message || '').trim() || '[Media]',
          createdAt: m.created_time
        })),
        createdAt: latest.created_time || conv.updated_time || new Date().toISOString(),
        ageHours: Math.round(ageHours * 10) / 10,
        within24h,
        extractedPhone,
        metaInboxUrl
      };

      if (within24h) {
        messenger24h.push(item);
      } else if (extractedPhone) {
        messengerOldWithPhone.push(item);
      } else {
        messengerOldNoPhone.push(item);
      }
    }

    return res.status(200).json({
      ok: true,
      pageId,
      pageName,
      scannedPosts: posts.length,
      scannedConversations: convs.length,
      warnings,
      comments: unrepliedComments,
      messenger24h,
      messengerOldWithPhone,
      messengerOldNoPhone,
      stats: {
        comments: unrepliedComments.length,
        messenger24h: messenger24h.length,
        messengerOldWithPhone: messengerOldWithPhone.length,
        messengerOldNoPhone: messengerOldNoPhone.length,
        totalUnreplied:
          unrepliedComments.length +
          messenger24h.length +
          messengerOldWithPhone.length +
          messengerOldNoPhone.length
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Facebook backlog scan failed.' });
  }
}
