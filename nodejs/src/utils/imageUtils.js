/**
 * Universal Image Transcoding & Sanitization Utility
 * Ensures all image inputs (especially iPhone HEIC / HEIF photos)
 * are stored in universal, highly-compatible JPEG format so they render
 * instantly on Android, iOS, Windows, Linux, and all web browsers.
 */

let heicConvert = null;
try {
  heicConvert = require('heic-convert');
} catch (e) {
  console.warn('heic-convert module not loaded:', e.message);
}

/**
 * Inspects buffer magic bytes at offset 4 to 12 to check for HEIC/HEIF ISO BMFF container
 * @param {Buffer} buf
 * @returns {boolean}
 */
function isHeicBuffer(buf) {
  if (!buf || buf.length < 12) return false;
  // Offset 4: 'ftyp'
  const ftyp = buf.toString('ascii', 4, 8);
  if (ftyp === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12).toLowerCase();
    const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'heif', 'mif1', 'msf1'];
    return heicBrands.includes(brand);
  }
  return false;
}

/**
 * Checks if a string or Data URL contains HEIC/HEIF image data
 * @param {string} str
 * @returns {boolean}
 */
function isHeicString(str) {
  if (!str || typeof str !== 'string') return false;
  const lowerPrefix = str.slice(0, 50).toLowerCase();
  if (lowerPrefix.includes('image/heic') || lowerPrefix.includes('image/heif')) {
    return true;
  }
  // Check raw base64 header for 'ftypheic' / 'ftypmif1'
  if (str.startsWith('data:')) {
    const commaIdx = str.indexOf(',');
    if (commaIdx !== -1) {
      const sample = str.slice(commaIdx + 1, commaIdx + 30);
      try {
        const sampleBuf = Buffer.from(sample, 'base64');
        return isHeicBuffer(sampleBuf);
      } catch {
        return false;
      }
    }
  }
  return false;
}

/**
 * Transcodes any HEIC/HEIF image data URL or Buffer into standard, universal JPEG
 * @param {string} imageInput - Base64 Data URL or string
 * @param {number} quality - JPEG quality between 0 and 1 (default 0.85)
 * @returns {Promise<string>} Standard JPEG Data URL (data:image/jpeg;base64,...)
 */
async function ensureUniversalImage(imageInput, quality = 0.85) {
  if (!imageInput || typeof imageInput !== 'string') {
    return imageInput;
  }

  // If it is an external URL (http/https), don't alter it
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
    return imageInput;
  }

  // If not a data URL or raw base64, return as-is
  if (!imageInput.startsWith('data:') && !imageInput.startsWith('/9j/')) {
    return imageInput;
  }

  // Quick check: If standard JPEG, PNG, or WebP and NOT HEIC, return as-is for maximum speed
  if (!isHeicString(imageInput)) {
    return imageInput;
  }

  if (!heicConvert) {
    console.warn('[imageUtils] heic-convert not available to transcode HEIC image');
    return imageInput;
  }

  try {
    let base64Data = imageInput;
    const commaIdx = imageInput.indexOf(',');
    if (commaIdx !== -1) {
      base64Data = imageInput.slice(commaIdx + 1);
    }

    const inputBuffer = Buffer.from(base64Data, 'base64');
    
    // Verify it actually has HEIC header before running WASM conversion
    if (!isHeicBuffer(inputBuffer) && !imageInput.toLowerCase().includes('image/heic')) {
      return imageInput;
    }

    console.log(`[imageUtils] Transcoding iPhone HEIC image (${(inputBuffer.length / 1024).toFixed(1)} KB) to universal JPEG...`);

    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: quality,
    });

    const jpegBase64 = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
    console.log(`[imageUtils] Successfully transcoded HEIC image to universal JPEG (${(outputBuffer.length / 1024).toFixed(1)} KB)`);
    return jpegBase64;
  } catch (err) {
    console.error('[imageUtils] Failed to transcode HEIC to JPEG:', err.message);
    // Return original input safely rather than failing the user's post/action
    return imageInput;
  }
}

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Saves a base64 Data URL or string as a static file in the media volume.
 * Drops JSON payloads from ~3MB down to 10KB and offloads image delivery to Nginx with caching.
 * If file saving fails or input is already a URL, it gracefully falls back without breaking.
 * 
 * @param {string} imageInput - Base64 Data URL, external URL, or existing media path
 * @param {string} subfolder - Directory under media (e.g. 'social/posts', 'social/avatars')
 * @returns {Promise<string>} Clean media URL (e.g. '/media/social/posts/169..._abc.jpg')
 */
async function saveBase64Image(imageInput, subfolder = 'social/posts') {
  if (!imageInput || typeof imageInput !== 'string') {
    return imageInput;
  }

  // Already a URL or relative path
  if (imageInput.startsWith('http://') || imageInput.startsWith('https://') || imageInput.startsWith('/media/')) {
    return imageInput;
  }

  // If not a data URL or raw base64, return as-is
  if (!imageInput.startsWith('data:') && !imageInput.startsWith('/9j/')) {
    return imageInput;
  }

  try {
    // 1. Ensure any HEIC from iPhone is first converted to universal JPEG
    const universalImage = await ensureUniversalImage(imageInput);

    // 2. Determine extension
    let ext = 'jpg';
    let base64Data = universalImage;
    if (universalImage.startsWith('data:')) {
      const mimeMatch = universalImage.match(/^data:image\/([a-zA-Z0-9+]+);base64,/);
      if (mimeMatch && mimeMatch[1]) {
        const mime = mimeMatch[1].toLowerCase();
        if (mime === 'png') ext = 'png';
        else if (mime === 'webp') ext = 'webp';
        else if (mime === 'gif') ext = 'gif';
        else ext = 'jpg';
      }
      const commaIdx = universalImage.indexOf(',');
      if (commaIdx !== -1) {
        base64Data = universalImage.slice(commaIdx + 1);
      }
    }

    // 3. Resolve destination directory
    const cleanSub = subfolder.replace(/^\/+|\/+$/g, '');
    const mediaRoot = process.env.MEDIA_DIR || path.resolve(__dirname, '../../media');
    const targetDir = path.join(mediaRoot, cleanSub);

    await fs.promises.mkdir(targetDir, { recursive: true });

    // 4. Generate random unique filename
    const rand = crypto.randomBytes(6).toString('hex');
    const filename = `${Date.now()}_${rand}.${ext}`;
    const filePath = path.join(targetDir, filename);

    // 5. Write file asynchronously
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/media/${cleanSub}/${filename}`;
    console.log(`[imageUtils] Saved static image to ${relativeUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return relativeUrl;
  } catch (err) {
    console.error('[imageUtils] Failed to save base64 image as file, falling back to original:', err.message);
    return imageInput;
  }
}

module.exports = {
  isHeicBuffer,
  isHeicString,
  ensureUniversalImage,
  saveBase64Image,
};
