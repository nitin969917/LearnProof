import React, { useState, useEffect, useRef } from 'react';
import { isLikelyHeicSource, isNativeHeicSupported, convertHeicSourceToJpeg, resolveMediaUrl } from '../../utils/heicHelper.js';

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
  const resolvedSrc = resolveMediaUrl(src);
  const [displaySrc, setDisplaySrc] = useState(resolvedSrc);
  const [hasError, setHasError] = useState(false);
  const isConvertingRef = useRef(false);

  useEffect(() => {
    setHasError(false);
    isConvertingRef.current = false;

    if (!resolvedSrc) {
      setDisplaySrc(resolvedSrc);
      return;
    }

    let isMounted = true;

    // If source is known to be HEIC and browser lacks native decoding (Chrome, Android, etc.)
    if (isLikelyHeicSource(resolvedSrc) && !isNativeHeicSupported()) {
      isConvertingRef.current = true;
      convertHeicSourceToJpeg(resolvedSrc)
        .then((jpegUrl) => {
          if (isMounted) {
            setDisplaySrc(jpegUrl || resolvedSrc);
            isConvertingRef.current = false;
          }
        })
        .catch(() => {
          if (isMounted) {
            setDisplaySrc(resolvedSrc);
            isConvertingRef.current = false;
          }
        });
    } else {
      setDisplaySrc(resolvedSrc);
    }

    return () => {
      isMounted = false;
    };
  }, [resolvedSrc]);

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
