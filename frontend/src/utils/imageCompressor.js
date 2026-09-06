import heic2any from 'heic2any';

/**
 * Checks if a file or blob is HEIC/HEIF format (common on Apple/iPhone cameras)
 * @param {File|Blob} file 
 * @returns {boolean}
 */
export function isHeic(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return (
    type.includes('heic') ||
    type.includes('heif') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
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
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    return Array.isArray(result) ? result[0] : result;
  } catch (err1) {
    console.warn('heic2any standard conversion failed, trying multiple option:', err1);
    try {
      const multiResult = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
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
 * Compresses an image file using an HTML5 canvas to reduce payload size while preserving high visual quality.
 * Seamlessly handles all formats including iPhone HEIC / HEIF, PNG, WebP, JPEG, etc.
 * @param {File|Blob} file - The original image file
 * @param {number} maxWidth - Max width of output image (default 1200)
 * @param {number} maxHeight - Max height of output image (default 1200)
 * @param {number} quality - JPEG compression quality between 0 and 1 (default 0.85)
 * @returns {Promise<string>} Base64 data URL of compressed image
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  if (!file) {
    throw new Error('No file provided for compression');
  }

  const fileIsHeic = isHeic(file);

  // Strategy 1: Modern browser native decoding via createImageBitmap (fastest & handles many OS-native codecs)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const base64 = renderSourceToCompressedBase64(bitmap, maxWidth, maxHeight, quality);
      if (bitmap.close) bitmap.close();
      if (base64 && base64.startsWith('data:image/')) {
        return base64;
      }
    } catch (bitmapErr) {
      // Native decoding failed (e.g. HEIC in Chrome where browser has no native HEIC decoder)
      console.warn('createImageBitmap failed, falling back to next strategy:', bitmapErr);
    }
  }

  // Strategy 2: If HEIC/HEIF, convert via heic2any WASM
  let blobToProcess = file;
  if (fileIsHeic) {
    const convertedBlob = await convertHeicToJpegBlob(file);
    if (convertedBlob) {
      blobToProcess = convertedBlob;
      // Try createImageBitmap on converted JPEG blob
      if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
        try {
          const bitmap = await createImageBitmap(blobToProcess);
          const base64 = renderSourceToCompressedBase64(bitmap, maxWidth, maxHeight, quality);
          if (bitmap.close) bitmap.close();
          if (base64 && base64.startsWith('data:image/')) {
            return base64;
          }
        } catch {}
      }
    }
  }

  // Strategy 3: Standard Image element loading + Canvas rendering
  try {
    const base64Result = await new Promise((resolve, reject) => {
      let objectUrl = '';
      try {
        objectUrl = URL.createObjectURL(blobToProcess);
      } catch (urlErr) {
        return reject(urlErr);
      }

      const img = new Image();
      const cleanup = () => {
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch {}
      };

      img.onload = () => {
        try {
          const compressed = renderSourceToCompressedBase64(img, maxWidth, maxHeight, quality);
          cleanup();
          resolve(compressed);
        } catch (renderErr) {
          cleanup();
          reject(renderErr);
        }
      };

      img.onerror = () => {
        cleanup();
        reject(new Error('Image element decoding failed'));
      };

      img.src = objectUrl;
    });

    if (base64Result && base64Result.startsWith('data:image/')) {
      return base64Result;
    }
  } catch (imgElementErr) {
    console.warn('Image element canvas rendering failed, trying final fallback:', imgElementErr);
  }

  // Strategy 4: Direct DataURL read fallback (so the user upload never fails completely)
  try {
    const directDataUrl = await readBlobAsDataURL(file);
    if (directDataUrl && typeof directDataUrl === 'string') {
      return directDataUrl;
    }
  } catch (dataUrlErr) {
    console.error('Direct DataURL read failed:', dataUrlErr);
  }

  throw new Error('Failed to process image format. Please select a PNG or JPEG photo.');
}
