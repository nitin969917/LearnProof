import React from 'react';

/**
 * ProCrownIcon
 * Sleek, high-end metallic gold geometric crown vector.
 * Replaces standard OS emojis with a luxury faceted gold/amber gradient crest.
 */
export default function ProCrownIcon({ className = "w-3.5 h-3.5", size, ...props }) {
  const width = size || undefined;
  const height = size || undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Main metallic gold gradient */}
        <linearGradient id="proCrownGoldGrad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Specular highlight for central facet */}
        <linearGradient id="proCrownHighlight" x1="12" y1="4" x2="12" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
        </linearGradient>

        {/* Base polished band */}
        <linearGradient id="proCrownBase" x1="3" y1="17.5" x2="21" y2="17.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="30%" stopColor="#FDE68A" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Main Crown Body */}
      <path
        d="M2.75 17.75C2.75 18.16 3.09 18.5 3.5 18.5H20.5C20.91 18.5 21.25 18.16 21.25 17.75L19.65 8.7C19.57 8.25 19.1 8 18.69 8.2L14.35 10.35C13.92 10.56 13.42 10.33 13.26 9.88L12 6.1L10.74 9.88C10.58 10.33 10.08 10.56 9.65 10.35L5.31 8.2C4.9 8 4.43 8.25 4.35 8.7L2.75 17.75Z"
        fill="url(#proCrownGoldGrad)"
      />

      {/* Central 3D Facet Reflection */}
      <path
        d="M12 6.1L10.74 9.88C10.58 10.33 10.08 10.56 9.65 10.35L12 17H12.01L14.35 10.35C13.92 10.56 13.42 10.33 13.26 9.88L12 6.1Z"
        fill="url(#proCrownHighlight)"
      />

      {/* Base Gold Trim Bar */}
      <rect
        x="3"
        y="16.75"
        width="18"
        height="1.75"
        rx="0.875"
        fill="url(#proCrownBase)"
      />

      {/* Polished Jewel Orbs on Peak Tips */}
      <circle cx="12" cy="4.25" r="1.4" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.5" />
      <circle cx="3.8" cy="7.25" r="1.15" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.5" />
      <circle cx="20.2" cy="7.25" r="1.15" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.5" />
    </svg>
  );
}
