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
 * Converts HEIC/HEIF blob to a standard JPEG blob using heic2any
 * @param {File|Blob} file 
 * @returns {Promise<Blob>}
 */
async function getStandardImageBlob(file) {
  if (isHeic(file)) {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      return Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn('heic2any initial conversion error:', err);
      return file;
    }
  }
  return file;
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

  // Pre-convert HEIC/HEIF if identified by extension or MIME type
  const blobToProcess = await getStandardImageBlob(file);

  return new Promise((resolve, reject) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(blobToProcess);
    } catch (urlErr) {
      return reject(new Error('Failed to create object URL for image'));
    }

    const img = new Image();

    const cleanup = () => {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch {}
    };

    img.onload = () => {
      try {
        let { width, height } = img;

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

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas output to JPEG with optimal quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        cleanup();
        resolve(compressedBase64);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = async () => {
      cleanup();
      // If direct load failed (e.g. iPhone HEIC photo without .heic extension or untyped blob), try heic2any fallback
      if (!isHeic(file)) {
        try {
          const fallbackConverted = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          const convertedBlob = Array.isArray(fallbackConverted) ? fallbackConverted[0] : fallbackConverted;
          const fallbackUrl = URL.createObjectURL(convertedBlob);
          const fallbackImg = new Image();
          
          fallbackImg.onload = () => {
            try {
              let { width, height } = fallbackImg;
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
              ctx.drawImage(fallbackImg, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
              URL.revokeObjectURL(fallbackUrl);
              resolve(compressedBase64);
            } catch (fallbackErr) {
              URL.revokeObjectURL(fallbackUrl);
              reject(fallbackErr);
            }
          };

          fallbackImg.onerror = () => {
            URL.revokeObjectURL(fallbackUrl);
            reject(new Error('Failed to decode image format'));
          };

          fallbackImg.src = fallbackUrl;
          return;
        } catch (fallbackCatch) {
          reject(new Error('Unsupported or unrecognized image format'));
          return;
        }
      }
      reject(new Error('Failed to process image'));
    };

    img.src = objectUrl;
  });
}
