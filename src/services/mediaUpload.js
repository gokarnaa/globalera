import { getSupabaseClient } from './supabaseClient';

export const MEDIA_BUCKET = 'media-uploads';

/**
 * Resize & compress any selected/camera image into a crisp passport-grade JPEG (~35-65 KB)
 * Returns { blob, dataUrl, width, height, sizeKb }
 */
export function compressImageFile(file, { maxDim = 480, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                blob: null,
                dataUrl,
                width,
                height,
                sizeKb: Math.round((dataUrl.length * 0.75) / 1024)
              });
            }
            resolve({
              blob,
              dataUrl,
              width,
              height,
              sizeKb: Math.max(1, Math.round(blob.size / 1024))
            });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload compressed photo to Supabase Storage bucket ('media-uploads').
 * Automatically falls back to compact compressed JPEG dataUrl if bucket isn't created yet or offline.
 */
export async function uploadPhotoToSupabase(file, { folder = 'students', entityId = '' } = {}) {
  const { blob, dataUrl, sizeKb } = await compressImageFile(file, { maxDim: 480, quality: 0.82 });

  const safeFolder = String(folder || 'uploads').replace(/[^a-z0-9_-]/gi, '');
  const safeId = String(entityId || 'photo').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'photo';
  const objectPath = `${safeFolder}/${safeId}-${Date.now()}.jpg`;

  try {
    const client = getSupabaseClient();
    if (client && blob) {
      const { error } = await client.storage
        .from(MEDIA_BUCKET)
        .upload(objectPath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
          upsert: true
        });
      if (!error) {
        const { data: pub } = client.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
        if (pub?.publicUrl) {
          return {
            ok: true,
            url: pub.publicUrl,
            storage: 'supabase',
            sizeKb
          };
        }
      } else {
        console.warn('[MediaUpload] Supabase Storage fallback to inline:', error.message);
      }
    }
  } catch (err) {
    console.warn('[MediaUpload] Storage exception, using compact inline fallback:', err?.message);
  }

  return {
    ok: true,
    url: dataUrl,
    storage: 'inline',
    sizeKb
  };
}
