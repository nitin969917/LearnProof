import React, { useState, useEffect, useRef } from 'react';
import { isLikelyHeicSource, isNativeHeicSupported, convertHeicSourceToJpeg } from '../../utils/heicHelper.js';

/**
 * RenderableImage
 * Drop-in replacement for <img> that guarantees cross-browser rendering for iPhone HEIC / HEIF
 * and standard JPEG/PNG/WebP images.
 */
export default function RenderableImage({
  src,
  alt = 'Image',
  className = '',
  loading = 'lazy',
  fallback = null,
  ...props
}) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const isConvertingRef = useRef(false);

  useEffect(() => {
    setHasError(false);
    isConvertingRef.current = false;

    if (!src) {
      setDisplaySrc(src);
      return;
    }

    let isMounted = true;

    // If source is known to be HEIC and browser lacks native decoding (Chrome, Android, etc.)
    if (isLikelyHeicSource(src) && !isNativeHeicSupported()) {
      isConvertingRef.current = true;
      convertHeicSourceToJpeg(src)
        .then((jpegUrl) => {
          if (isMounted) {
            setDisplaySrc(jpegUrl || src);
            isConvertingRef.current = false;
          }
        })
        .catch(() => {
          if (isMounted) {
            setDisplaySrc(src);
            isConvertingRef.current = false;
          }
        });
    } else {
      setDisplaySrc(src);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  const handleError = async (e) => {
    if (src && displaySrc === src && !isConvertingRef.current) {
      isConvertingRef.current = true;
      try {
        const jpegUrl = await convertHeicSourceToJpeg(src);
        if (jpegUrl) {
          setDisplaySrc(jpegUrl);
          isConvertingRef.current = false;
          return;
        }
      } catch (err) {
        console.warn('Fallback HEIC conversion failed:', err);
      }
      isConvertingRef.current = false;
    }
    setHasError(true);
    if (props.onError) {
      props.onError(e);
    }
  };

  if (!displaySrc || hasError) {
    return fallback;
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={handleError}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
}
