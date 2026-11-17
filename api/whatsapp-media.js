// Vercel Serverless Proxy: Fetch & stream Meta WhatsApp Cloud API inbound media securely
// Usage: GET /api/whatsapp-media?id=<META_MEDIA_ID>

const META_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN ||
  'EAAXs5uDM7CYBTKqFINzJDjZBEiRyfN5pWT5V4EftAnPfssMZBApLpRgfQYaEfZBtarXwIZA2IJh1Ux6JIrp8KAJRoI8UFP9ZCcti5xsZC2DkIaTKZBtkFFs8wfxCZCjSgxqySNpo2CzalInZCd2ZAZBsmKd4VsZBFSK20xyUm0ZBgLDMdZAOMVV6MgnBojhbeLvpLwnwZDZD';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const mediaId = req.query?.id;
  if (!mediaId) {
    return res.status(400).json({ error: 'Missing media id' });
  }

  try {
    // 1. Resolve temporary download URL from Meta Graph API
    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(mediaId)}`, {
      headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` }
    });
    const metaJson = await metaRes.json();
    if (!metaRes.ok || !metaJson?.url) {
      return res.status(metaRes.status || 404).json({ error: metaJson?.error?.message || 'Media not found' });
    }

    // 2. Download binary media using Bearer token and stream to client
    const fileRes = await fetch(metaJson.url, {
      headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` }
    });
    if (!fileRes.ok) {
      return res.status(fileRes.status).send('Failed to download media');
    }

    const contentType = fileRes.headers.get('content-type') || metaJson.mime_type || 'application/octet-stream';
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
