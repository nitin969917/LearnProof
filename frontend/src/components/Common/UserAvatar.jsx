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
      src={src}
      alt={alt || name || 'Avatar'}
      className={`object-cover shrink-0 ${className}`}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}
