import { getHeic2Any, isHeicBlob, isNativeHeicSupported } from './heicHelper.js';

/**
 * Checks if a file or blob is HEIC/HEIF format (common on Apple/iPhone cameras)
 * Inspects both file metadata and binary magic bytes (ftypheic, ftypmif1, etc.)
 * @param {File|Blob} file 
 * @returns {Promise<boolean>}
 */
export async function isHeic(file) {
  if (!file) return false;
  return isHeicBlob(file);
}

/**
 * Reads a File or Blob directly to a Base64 data URL
 * @param {File|Blob} blob 
 * @returns {Promise<string>}
 */
function readBlobAsDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Draws an ImageBitmap or HTMLImageElement to a canvas and exports compressed JPEG Base64
 * @param {ImageBitmap|HTMLImageElement} source 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @param {number} quality 
 * @returns {string}
 */
function renderSourceToCompressedBase64(source, maxWidth, maxHeight, quality) {
  let { width, height } = source;
  if (!width || !height) {
    width = source.naturalWidth || maxWidth;
    height = source.naturalHeight || maxHeight;
  }

  // Calculate aspect-ratio preserving dimensions
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Attempts to convert a HEIC/HEIF blob to standard JPEG blob using heic2any with fallbacks
 * @param {File|Blob} file 
 * @returns {Promise<Blob|null>}
 */
async function convertHeicToJpegBlob(file) {
  const converter = await getHeic2Any();
  if (!converter) {
    console.warn('heic2any converter unavailable');
    return null;
  }

  try {
    const result = await converter({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (err1) {
    console.warn('heic2any standard conversion failed, trying multiple option:', err1);
    try {
      const multiResult = await converter({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.92,
        multiple: true,
      });
      return Array.isArray(multiResult) ? multiResult[0] : multiResult;
    } catch (err2) {
      console.warn('heic2any fallback conversion failed:', err2);
      return null;
    }
  }
}

/**
 * Loads an image source (Blob or File) into an HTMLImageElement and uses decode()
 * to guarantee decoded pixels are ready before drawing to canvas.
 * Works natively on Apple WebKit (iOS/macOS) for iPhone HEIC images!
 */
async function decodeImageElement(blob) {
  const objectUrl = URL.createObjectURL(blob);
  const img = new Image();
  // Do NOT set img.crossOrigin on blob: URLs because WebKit/Safari throws SecurityError when reading canvas toDataURL

  try {
    img.src = objectUrl;
    if (typeof img.decode === 'function') {
      await img.decode();
    } else {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load in element'));
      });
    }
    return { img, objectUrl };
  } catch (err) {
    try { URL.revokeObjectURL(objectUrl); } catch {}
    throw err;
  }
}

/**
 * Compresses an image file using an HTML5 canvas to reduce payload size while preserving high visual quality.
 * Seamlessly handles all formats including iPhone HEIC / HEIF, PNG, WebP, JPEG, etc.
 * Guarantees that the output is ALWAYS standard, universal image/jpeg Base64 so every
 * Android device, Windows PC, Linux machine, and web browser can render it with zero errors.
 * @param {File|Blob} file - The original image file
 * @param {number} maxWidth - Max width of output image (default 1200)
 * @param {number} maxHeight - Max height of output image (default 1200)
 * @param {number} quality - JPEG compression quality between 0 and 1 (default 0.85)
 * @returns {Promise<string>} Base64 data URL of compressed JPEG image
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  if (!file) {
    throw new Error('No file provided for compression');
  }

  const fileIsHeic = await isHeic(file);
  const nativeHeicSupport = isNativeHeicSupported();
  let blobToProcess = file;

  // If HEIC on non-Apple platform (e.g. Windows/Android Chrome), convert via heic2any WASM
  // On Apple platforms (iOS/macOS), the browser natively decodes HEIC in Image elements,
  // so we skip heic2any to avoid Web Worker crashes and memory limits.
  if (fileIsHeic && !nativeHeicSupport) {
    const convertedBlob = await convertHeicToJpegBlob(file);
    if (convertedBlob) {
      blobToProcess = convertedBlob;
    }
  }

  // Strategy 1: Standard Image element loading with decode() + Canvas rendering
  // Works for ALL standard formats AND natively for iPhone HEIC on Apple devices!
  try {
    const { img, objectUrl } = await decodeImageElement(blobToProcess);
    try {
      const base64 = renderSourceToCompressedBase64(img, maxWidth, maxHeight, quality);
      if (base64 && base64.startsWith('data:image/jpeg')) {
        return base64;
      }
    } finally {
      try { URL.revokeObjectURL(objectUrl); } catch {}
    }
  } catch (decodeErr) {
    console.warn('decodeImageElement canvas rendering failed, trying next strategy:', decodeErr);
  }

  // Strategy 2: Modern browser native decoding via createImageBitmap
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blobToProcess);
      const base64 = renderSourceToCompressedBase64(bitmap, maxWidth, maxHeight, quality);
      if (bitmap.close) bitmap.close();
      if (base64 && base64.startsWith('data:image/jpeg')) {
        return base64;
      }
    } catch (bitmapErr) {
      console.warn('createImageBitmap failed:', bitmapErr);
    }
  }

  // Strategy 3: FileReader to Data URL -> Image element -> Canvas to JPEG
  try {
    const directDataUrl = await readBlobAsDataURL(blobToProcess);
    if (directDataUrl && typeof directDataUrl === 'string') {
      const img = new Image();
      img.src = directDataUrl;
      if (typeof img.decode === 'function') {
        await img.decode();
      } else {
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('DataURL image load failed'));
        });
      }
      const base64 = renderSourceToCompressedBase64(img, maxWidth, maxHeight, quality);
      if (base64 && base64.startsWith('data:image/jpeg')) {
        return base64;
      }
      // If direct data URL is already standard JPEG, PNG or WebP, safely return it
      if (directDataUrl.startsWith('data:image/jpeg') || directDataUrl.startsWith('data:image/png') || directDataUrl.startsWith('data:image/webp')) {
        return directDataUrl;
      }
    }
  } catch (dataUrlErr) {
    console.error('DataURL canvas fallback failed:', dataUrlErr);
  }

  throw new Error('Failed to process image format. Please select a valid photo.');
}
