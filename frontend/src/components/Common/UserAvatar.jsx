import React, { useState, useEffect } from 'react';

/**
 * UserAvatar
 * Renders a user's avatar image safely.
 * If the image URL is missing, invalid, or fails to load,
 * it seamlessly displays a styled initial placeholder fallback.
 */
export default function UserAvatar({
  src,
  name = 'User',
  className = "w-10 h-10 rounded-full",
  textClassName = "",
  alt
}) {
  const [imgError, setImgError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initial = name?.[0]?.toUpperCase() || 'U';

  const isInvalidSrc = !src || src === '/default-avatar.png' || src === 'null' || src === 'undefined';

  if (isInvalidSrc || imgError) {
    return (
      <div 
        className={`flex items-center justify-center shrink-0 bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-black select-none border border-orange-200/50 dark:border-orange-900/30 ${className}`}
      >
        <span className={textClassName || "text-xs font-bold"}>
          {initial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name || 'Avatar'}
      className={`object-cover shrink-0 ${className}`}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}
