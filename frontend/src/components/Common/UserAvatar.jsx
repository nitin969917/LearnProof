import React, { useState, useEffect, useRef } from 'react';
import { isLikelyHeicSource, isNativeHeicSupported, convertHeicSourceToJpeg } from '../../utils/heicHelper.js';

/**
 * UserAvatar
 * Renders a user's avatar image safely.
 * Seamlessly converts iPhone HEIC/HEIF images for Chrome & other browsers that lack native HEIC support.
 * If the image URL is missing, invalid, or fails to load,
 * it displays a styled initial placeholder fallback.
 */
export default function UserAvatar({
  src,
  name = 'User',
  className = "w-10 h-10 rounded-full",
  textClassName = "",
  alt
}) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const [imgError, setImgError] = useState(false);
  const convertingRef = useRef(false);

  // Sync displaySrc and handle proactive HEIC conversion when src changes
  useEffect(() => {
    setImgError(false);
    convertingRef.current = false;

    if (!src || src === '/default-avatar.png' || src === 'null' || src === 'undefined') {
      setDisplaySrc(src);
      return;
    }

    let isMounted = true;

    // Proactive conversion if known HEIC in non-Safari browsers
    if (isLikelyHeicSource(src) && !isNativeHeicSupported()) {
      convertingRef.current = true;
      convertHeicSourceToJpeg(src)
        .then((jpegUrl) => {
          if (isMounted) {
            setDisplaySrc(jpegUrl || src);
            convertingRef.current = false;
          }
        })
        .catch(() => {
          if (isMounted) {
            setDisplaySrc(src);
            convertingRef.current = false;
          }
        });
    } else {
      setDisplaySrc(src);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  const handleImageError = async () => {
    // If image failed and hasn't been converted yet, check if it's a HEIC file Chrome couldn't decode
    if (src && displaySrc === src && !convertingRef.current) {
      convertingRef.current = true;
      try {
        const converted = await convertHeicSourceToJpeg(src);
        if (converted) {
          setDisplaySrc(converted);
          convertingRef.current = false;
          return;
        }
      } catch (err) {
        console.warn('Fallback HEIC conversion failed:', err);
      }
      convertingRef.current = false;
    }
    setImgError(true);
  };

  const initial = name?.[0]?.toUpperCase() || 'U';
  const isInvalidSrc = !src || src === '/default-avatar.png' || src === 'null' || src === 'undefined';

  if (isInvalidSrc || imgError) {
    const colors = [
      'from-purple-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-pink-500 to-rose-600',
      'from-orange-500 to-amber-600',
      'from-cyan-500 to-blue-600',
      'from-fuchsia-500 to-purple-600',
      'from-red-500 to-rose-600'
    ];
    let hash = 0;
    const nameStr = name || 'User';
    for (let i = 0; i < nameStr.length; i++) {
      hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorClass = colors[Math.abs(hash) % colors.length];

    return (
      <div 
        className={`flex items-center justify-center shrink-0 bg-gradient-to-tr ${colorClass} text-white font-black select-none shadow-sm ${className}`}
      >
        <span className={textClassName || "text-xs font-bold"}>
          {initial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt || name || 'Avatar'}
      className={`object-cover shrink-0 ${className}`}
      onError={handleImageError}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
