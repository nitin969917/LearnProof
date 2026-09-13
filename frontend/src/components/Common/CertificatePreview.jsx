import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

const CertificatePreview = ({ userName, courseName, date, certId, template = null }) => {
  const primaryColor = template?.primaryColor || '#1e293b';
  const accentColor = template?.accentColor || '#f59e0b';
  const textColor = template?.textColor || '#0f172a';
  const bgColor = template?.backgroundColor || '#ffffff';
  const titleText = template?.titleText || 'CERTIFICATE OF ACHIEVEMENT';
  const subtitleText = template?.subtitleText || 'THIS IS OFFICIALLY PRESENTED TO';
  const bodyText = template?.bodyText || 'for successfully mastering the curriculum and passing the comprehensive examination for';
  const issuerTitle = template?.issuerTitle || 'GLOBAL CERTIFICATION AUTHORITY';
  const sealText = template?.sealText || 'VERIFIED';
  const layout = template?.layout || 'classic';

  // Format recipient display name
  const displayName = (userName && userName.trim() && userName !== '****') 
    ? userName 
    : (template ? 'Alex M. Harrison' : (userName || 'Distinguished Learner'));

  // Format date cleanly
  const displayDate = date 
    ? date 
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // Format credential ID cleanly to prevent any overflow
  const rawId = certId ? String(certId) : 'LP-PREVIEW-2026';
  const displayCertId = rawId.startsWith('LP-') 
    ? rawId 
    : (rawId.length > 16 ? `LP-${rawId.slice(0, 8).toUpperCase()}` : rawId.toUpperCase());

  return (
    <div 
      className="@container relative w-full aspect-[1.414/1] shadow-2xl overflow-hidden select-none transition-all duration-300 rounded-xs"
      style={{ 
        backgroundColor: bgColor,
        borderColor: primaryColor,
        borderWidth: layout === 'minimal' ? '4px' : '7px',
        borderStyle: 'solid'
      }}
    >
      {/* Background Guilloché / Watermark Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${primaryColor} 1px, transparent 1px)`,
          backgroundSize: '16px 16px'
        }}
      >
        <Award size={260} className="rotate-12" style={{ color: primaryColor }} strokeWidth={0.8} />
      </div>

      {/* Top Banner Ribbon for Modern Layout */}
      {layout === 'modern' && (
        <div 
          className="absolute top-0 left-0 right-0 h-[1.5%]" 
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Decorative Outer Inset Frame (Always safely outside content) */}
      <div 
        className="absolute inset-[1.8%] border pointer-events-none rounded-xs"
        style={{ borderColor: `${accentColor}88` }}
      />
      <div 
        className="absolute inset-[2.5%] border border-dashed pointer-events-none rounded-xs opacity-40"
        style={{ borderColor: primaryColor }}
      />

      {/* Corner Ornate Accents (Classic / Executive) */}
      {(layout === 'classic' || layout === 'executive') && (
        <>
          <div className="absolute top-[1.8%] left-[1.8%] w-[3.5%] h-[3.5%] z-20 pointer-events-none border-t-2 border-l-2" style={{ borderColor: accentColor }} />
          <div className="absolute top-[1.8%] right-[1.8%] w-[3.5%] h-[3.5%] z-20 pointer-events-none border-t-2 border-r-2" style={{ borderColor: accentColor }} />
          <div className="absolute bottom-[1.8%] left-[1.8%] w-[3.5%] h-[3.5%] z-20 pointer-events-none border-b-2 border-l-2" style={{ borderColor: accentColor }} />
          <div className="absolute bottom-[1.8%] right-[1.8%] w-[3.5%] h-[3.5%] z-20 pointer-events-none border-b-2 border-r-2" style={{ borderColor: accentColor }} />
        </>
      )}

      {/* Certificate Content Body - Safely Inset (4% Padding ensures zero border collision) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between py-[3.8%] px-[5.5%]">
        
        {/* ── 1. HEADER & LOGO ── */}
        <div className="text-center w-full flex flex-col items-center">
          {/* Logo Brandmark */}
          <div className="flex items-center justify-center mb-[0.8%]">
            <img 
              src="/LP_logo.png" 
              alt="LearnProof Logo" 
              className="h-[8.5cqi] max-h-16 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <p className="text-[1.25cqi] font-black tracking-[0.25em] uppercase text-slate-500 mb-[0.4%]">
            {issuerTitle}
          </p>

          {/* Certificate Title */}
          <h2 
            className="text-[2.8cqi] font-black leading-tight tracking-[0.16em] uppercase font-serif"
            style={{ color: primaryColor }}
          >
            {titleText}
          </h2>

          {/* Center Ornate Divider */}
          <div className="flex items-center justify-center gap-[1cqi] my-[0.8%] w-full max-w-[34cqi]">
            <div className="h-[1px] flex-1" style={{ backgroundColor: `${accentColor}bb` }} />
            <div className="w-[1.1cqi] h-[1.1cqi] rotate-45 shrink-0" style={{ backgroundColor: accentColor }} />
            <div className="h-[1px] flex-1" style={{ backgroundColor: `${accentColor}bb` }} />
          </div>
        </div>

        {/* ── 2. RECIPIENT SECTION ── */}
        <div className="text-center w-full px-2 my-[0.4%]">
          <p className="text-[1.15cqi] uppercase tracking-[0.22em] text-slate-400 font-bold mb-[0.5%]">
            {subtitleText}
          </p>

          {/* Recipient's Name with Serif Grandeur */}
          <div className="relative inline-block max-w-[85%]">
            <p 
              className="text-[3.5cqi] font-black uppercase leading-tight truncate px-3 font-serif tracking-tight drop-shadow-2xs"
              style={{ color: accentColor }}
            >
              {displayName}
            </p>
            {/* Elegant Double Underline */}
            <div className="h-[1px] w-full mx-auto mt-[0.3cqi]" style={{ backgroundColor: primaryColor, opacity: 0.35 }} />
            <div className="h-[0.5px] w-3/4 mx-auto mt-[0.2cqi]" style={{ backgroundColor: accentColor }} />
          </div>
        </div>

        {/* ── 3. ACCREDITATION BODY & COURSE TITLE ── */}
        <div className="text-center w-full max-w-[80cqi] mx-auto my-[0.4%]">
          <p className="text-[1.2cqi] text-slate-600 mb-[0.8%] leading-relaxed font-normal">
            {bodyText}
          </p>
          <div 
            className="inline-block px-[2.8cqi] py-[0.7cqi] rounded-md border shadow-xs max-w-[90%]"
            style={{
              backgroundColor: `${accentColor}12`,
              borderColor: `${accentColor}40`
            }}
          >
            <p 
              className="text-[2.0cqi] font-black italic leading-tight text-center truncate"
              style={{ color: textColor }}
            >
              {courseName || "Mastery Certification"}
            </p>
          </div>
        </div>

        {/* ── 4. SIGNATURES, SEAL & CREDENTIAL ID ── */}
        <div className="w-full flex justify-between items-end px-[2cqi] mt-[0.8%] mb-[0.4%]">
          {/* Left: Date Conferred */}
          <div className="flex flex-col items-center w-[25cqi]">
            <div className="w-full max-w-[16cqi] h-[1px] bg-slate-300 dark:bg-slate-600 mb-[0.4cqi]" />
            <p className="text-[1.35cqi] font-bold tracking-tight text-center whitespace-nowrap" style={{ color: primaryColor }}>
              {displayDate}
            </p>
            <p className="text-[0.9cqi] text-slate-400 uppercase font-bold tracking-widest mt-[0.2cqi] text-center">
              Date Conferred
            </p>
          </div>

          {/* Center: Official 3D Metallic Foil Seal */}
          <div className="flex flex-col items-center shrink-0 mx-[1cqi]">
            <div 
              className="relative w-[7.5cqi] h-[7.5cqi] rounded-full border-2 flex flex-col items-center justify-center shadow-md"
              style={{ 
                background: `radial-gradient(circle, #fffbeb 0%, #fef3c7 40%, ${accentColor} 100%)`,
                borderColor: primaryColor
              }}
            >
              {/* Serrated Inner Ring */}
              <div 
                className="absolute inset-[0.35cqi] rounded-full border border-dashed opacity-60"
                style={{ borderColor: primaryColor }}
              />
              <ShieldCheck className="w-[2.8cqi] h-[2.8cqi] text-slate-900 drop-shadow-xs" />
              <p className="text-[0.65cqi] font-black uppercase tracking-widest text-slate-900 mt-[0.1cqi]">
                {sealText}
              </p>
            </div>
          </div>

          {/* Right: Unique Credential ID */}
          <div className="flex flex-col items-center w-[25cqi]">
            <div className="w-full max-w-[16cqi] h-[1px] bg-slate-300 dark:bg-slate-600 mb-[0.4cqi]" />
            <p 
              className="text-[1.25cqi] font-mono font-bold tracking-tight text-center truncate w-full" 
              style={{ color: primaryColor }}
              title={rawId}
            >
              {displayCertId}
            </p>
            <p className="text-[0.9cqi] text-slate-400 uppercase font-bold tracking-widest mt-[0.2cqi] text-center">
              Unique Credential ID
            </p>
          </div>
        </div>

        {/* ── 5. SECURITY & VERIFICATION FOOTER ── */}
        <div className="w-full pt-[0.8%] border-t border-slate-200/80 flex items-center justify-between text-slate-400 text-[0.95cqi] font-mono">
          <span className="tracking-wider text-slate-400">OFFICIALLY VERIFIED CREDENTIAL</span>
          <span className="tracking-wider text-slate-500 font-medium">learnproofai.com/verify</span>
        </div>

      </div>
    </div>
  );
};

export default CertificatePreview;
