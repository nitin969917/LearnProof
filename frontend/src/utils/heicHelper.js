import heic2any from 'heic2any';

// In-memory cache for converted JPEG object URLs so we never convert the same source twice
const convertedCache = new Map();

/**
 * Safely resolves the heic2any function from ESM/CJS interop or global window
 */
export function getHeic2Any() {
  if (typeof heic2any === 'function') return heic2any;
  if (heic2any && typeof heic2any.default === 'function') return heic2any.default;
  if (typeof window !== 'undefined' && typeof window.heic2any === 'function') return window.heic2any;
  return null;
}

/**
 * Checks if the current browser natively renders HEIC images (Safari on Apple OS).
 * Chrome, Firefox, Edge, and Android Chrome do NOT natively support HEIC.
 */
export function isNativeHeicSupported() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android') && !ua.includes('crios');
  const isAppleDevice = /macintosh|mac os x|iphone|ipad|ipod/.test(ua);
  return isSafari && isAppleDevice;
}

/**
 * Synchronous check to see if a string/URL looks like a HEIC/HEIF image
 */
export function isLikelyHeicSource(src) {
  if (!src || typeof src !== 'string') return false;
  const lower = src.toLowerCase();
  return (
    lower.startsWith('data:image/heic') ||
    lower.startsWith('data:image/heif') ||
    lower.includes('.heic') ||
    lower.includes('.heif')
  );
}

/**
 * Checks if a Blob or File is HEIC/HEIF by inspecting MIME type and ISO BMFF magic bytes (ftypheic/ftypmif1...)
 */
export async function isHeicBlob(blob) {
  if (!blob) return false;
  const type = (blob.type || '').toLowerCase();
  const name = (blob.name || '').toLowerCase();

  if (
    type.includes('heic') ||
    type.includes('heif') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  ) {
    return true;
  }

  // Check magic bytes at offset 4 ('ftyp')
  if (blob.slice) {
    try {
      const slice = blob.slice(0, 16);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length >= 12) {
        const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
        if (ftyp === 'ftyp') {
          const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
          const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'heif', 'mif1', 'msf1'];
          if (heicBrands.includes(brand)) return true;
        }
      }
    } catch {}
  }
  return false;
}

/**
 * Converts a base64 Data URL to a Blob
 */
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/heic';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Converts any HEIC/HEIF source (URL, data URL, or Blob) to a browser-renderable JPEG Blob Object URL.
 * Automatically caches results so repeated renders are instant.
 *
 * @param {string|Blob} src - Image URL, Data URL, or Blob
 * @returns {Promise<string|null>} JPEG object URL (blob:http...) or null if conversion failed
 */
export async function convertHeicSourceToJpeg(src) {
  if (!src) return null;

  if (typeof src === 'string' && convertedCache.has(src)) {
    return convertedCache.get(src);
  }

  const converter = getHeic2Any();
  if (!converter) {
    console.warn('heic2any library not available');
    return null;
  }

  let blob = null;
  if (src instanceof Blob) {
    blob = src;
  } else if (typeof src === 'string') {
    if (src.startsWith('data:')) {
      blob = dataUrlToBlob(src);
    } else {
      try {
        const response = await fetch(src, { mode: 'cors' });
        blob = await response.blob();
      } catch (fetchErr) {
        try {
          const response = await fetch(src);
          blob = await response.blob();
        } catch (fallbackErr) {
          console.warn('Failed to fetch image for HEIC conversion:', fallbackErr);
          return null;
        }
      }
    }
  }

  if (!blob) return null;

  // Verify blob actually has HEIC signature or type before passing to WASM
  const isHeic = await isHeicBlob(blob);
  if (!isHeic && typeof src === 'string' && !isLikelyHeicSource(src)) {
    return null;
  }

  try {
    const result = await converter({
      blob,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    const jpegBlob = Array.isArray(result) ? result[0] : result;
    const objectUrl = URL.createObjectURL(jpegBlob);

    if (typeof src === 'string') {
      convertedCache.set(src, objectUrl);
    }

    return objectUrl;
  } catch (err) {
    // Try with multiple: true fallback (some iPhone burst/HDR photos are image collections)
    try {
      const multiResult = await converter({
        blob,
        toType: 'image/jpeg',
        quality: 0.92,
        multiple: true,
      });
      const jpegBlob = Array.isArray(multiResult) ? multiResult[0] : multiResult;
      const objectUrl = URL.createObjectURL(jpegBlob);

      if (typeof src === 'string') {
        convertedCache.set(src, objectUrl);
      }

      return objectUrl;
    } catch (multiErr) {
      console.warn('heic2any failed to convert HEIC blob:', multiErr);
      return null;
    }
  }
}
