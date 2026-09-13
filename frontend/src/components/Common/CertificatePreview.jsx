import React from 'react';
import { ShieldCheck, Award, Sparkles, CheckCircle } from 'lucide-react';

const CertificatePreview = ({ userName, courseName, date, certId, template = null }) => {
  const primaryColor = template?.primaryColor || '#1e293b';
  const accentColor = template?.accentColor || '#f59e0b';
  const textColor = template?.textColor || '#0f172a';
  const bgColor = template?.backgroundColor || '#ffffff';
  const titleText = template?.titleText || 'Certificate of Achievement';
  const subtitleText = template?.subtitleText || 'This is proudly presented to';
  const bodyText = template?.bodyText || 'for demonstrating exemplary mastery of the curriculum and successfully passing the comprehensive examination for';
  const issuerName = template?.issuerName || 'LEARNPROOF ACADEMY';
  const issuerTitle = template?.issuerTitle || 'Global Council for Digital & Technical Credentials';
  const signatoryName = template?.signatoryName || 'Dr. Arthur Pendelton';
  const signatoryTitle = template?.signatoryTitle || 'Director of Academic Credentials';
  const sealText = template?.sealText || 'VERIFIED';
  const layout = template?.layout || 'classic';

  return (
    <div 
      className="relative w-full aspect-[1.414/1] p-2.5 sm:p-3 shadow-xl overflow-hidden select-none transition-all duration-300 rounded-sm"
      style={{ 
        backgroundColor: bgColor,
        borderColor: primaryColor,
        borderWidth: layout === 'minimal' ? '4px' : '7px',
        borderStyle: 'solid'
      }}
    >
      {/* Background Guilloché / Watermark Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(circle at center, ${primaryColor} 1px, transparent 1px)`,
          backgroundSize: '16px 16px'
        }}
      >
        <Award size={220} className="rotate-12" style={{ color: primaryColor }} strokeWidth={0.8} />
      </div>

      {/* Top Banner Ribbon for Modern Layout */}
      {layout === 'modern' && (
        <div 
          className="absolute top-0 left-0 right-0 h-2.5 z-30" 
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Corner Ornate Accents for Classic / Executive Layout */}
      {(layout === 'classic' || layout === 'executive') && (
        <>
          <div className="absolute top-1 left-1 w-8 h-8 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
          </div>
          <div className="absolute top-1 right-1 w-8 h-8 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 border-t-2 border-r-2" style={{ borderColor: accentColor }} />
          </div>
          <div className="absolute bottom-1 left-1 w-8 h-8 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-5 h-5 border-b-2 border-r-2" style={{ borderColor: accentColor }} />
          </div>
        </>
      )}

      {/* Inner Dual Security Frame */}
      <div 
        className="w-full h-full relative flex flex-col items-center justify-between py-3.5 sm:py-5 px-3 sm:px-6 rounded-xs"
        style={{
          border: `2px solid ${accentColor}88`,
          outline: `1px dashed ${primaryColor}44`,
          outlineOffset: '-5px'
        }}
      >
        {/* ── 1. HEADER & LOGO ── */}
        <div className="text-center relative z-10 w-full flex flex-col items-center">
          {/* Logo Brandmark */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <img 
              src="/LP_logo.png" 
              alt="LearnProof Logo" 
              className="h-6 sm:h-8 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                // Fallback if logo image fails
                e.target.style.display = 'none';
              }}
            />
          </div>

          <p className="text-[6.5px] sm:text-[7.5px] font-black tracking-[0.25em] uppercase text-slate-500 mb-0.5">
            {issuerTitle}
          </p>

          {/* Certificate Title */}
          <h2 
            className="text-[13px] sm:text-[17px] font-black leading-tight tracking-[0.16em] uppercase font-serif"
            style={{ color: primaryColor }}
          >
            {titleText}
          </h2>

          {/* Center Ornate Divider */}
          <div className="flex items-center justify-center gap-2 my-1 w-full max-w-[200px]">
            <div className="h-[1px] flex-1" style={{ backgroundColor: `${accentColor}99` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: accentColor }} />
            <div className="h-[1px] flex-1" style={{ backgroundColor: `${accentColor}99` }} />
          </div>
        </div>

        {/* ── 2. RECIPIENT SECTION ── */}
        <div className="text-center relative z-10 w-full px-2">
          <p className="text-[6px] sm:text-[7px] uppercase tracking-[0.22em] text-slate-400 font-bold mb-0.5">
            {subtitleText}
          </p>

          {/* Recipient's Name with Serif Elegance */}
          <div className="relative inline-block my-0.5 max-w-[280px]">
            <p 
              className="text-[16px] sm:text-[22px] font-black uppercase leading-tight truncate px-3 font-serif tracking-tight drop-shadow-2xs"
              style={{ color: accentColor }}
            >
              {userName || "Distinguished Learner"}
            </p>
            {/* Elegant Double Underline */}
            <div className="h-[1px] w-full mx-auto mt-0.5" style={{ backgroundColor: primaryColor, opacity: 0.4 }} />
            <div className="h-[0.5px] w-3/4 mx-auto mt-0.5" style={{ backgroundColor: accentColor }} />
          </div>
        </div>

        {/* ── 3. ACCREDITATION BODY & COURSE TITLE ── */}
        <div className="text-center px-2 relative z-10 max-w-[380px] w-full">
          <p className="text-[6px] sm:text-[7px] text-slate-600 mb-1 leading-relaxed font-normal">
            {bodyText}
          </p>
          <div 
            className="inline-block px-3 py-1 rounded-md border shadow-xs"
            style={{
              backgroundColor: `${accentColor}12`,
              borderColor: `${accentColor}40`
            }}
          >
            <p 
              className="text-[10px] sm:text-[12.5px] font-black italic leading-tight text-center"
              style={{ color: textColor }}
            >
              {courseName || "Mastery Certification"}
            </p>
          </div>
        </div>

        {/* ── 4. SIGNATURES & METALLIC SEAL ── */}
        <div className="w-full flex justify-between items-end px-3 sm:px-8 relative z-10 mt-1 mb-0.5">
          {/* Left: Date Conferred */}
          <div className="flex flex-col items-center min-w-[75px] sm:min-w-[90px]">
            <div className="w-20 sm:w-28 h-[1px] bg-slate-300 dark:bg-slate-600 mb-1" />
            <p className="text-[7.5px] sm:text-[9px] font-bold tracking-tight" style={{ color: primaryColor }}>
              {date || new Date().toLocaleDateString()}
            </p>
            <p className="text-[5px] sm:text-[6px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
              Date Conferred
            </p>
          </div>

          {/* Center: Official 3D Metallic Foil Seal */}
          <div className="flex flex-col items-center relative -bottom-1">
            <div 
              className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 flex flex-col items-center justify-center shadow-md"
              style={{ 
                background: `radial-gradient(circle, #fffbeb 0%, #fef3c7 40%, ${accentColor} 100%)`,
                borderColor: primaryColor
              }}
            >
              {/* Serrated Inner Ring */}
              <div 
                className="absolute inset-0.5 rounded-full border border-dashed opacity-60"
                style={{ borderColor: primaryColor }}
              />
              <ShieldCheck size={17} className="text-slate-900 drop-shadow-xs" />
              <p className="text-[3.5px] sm:text-[4px] font-black uppercase tracking-widest text-slate-900 mt-0.5">
                {sealText}
              </p>
            </div>
          </div>

          {/* Right: Unique Credential ID */}
          <div className="flex flex-col items-center min-w-[75px] sm:min-w-[100px]">
            <div className="w-20 sm:w-28 h-[1px] bg-slate-300 dark:bg-slate-600 mb-1" />
            <p 
              className="text-[6.5px] sm:text-[8px] font-mono font-bold tracking-tight text-center truncate max-w-[110px] sm:max-w-[130px]" 
              style={{ color: primaryColor }}
              title={certId || 'PREVIEW-MOCK'}
            >
              {certId ? certId.toUpperCase() : 'PREVIEW-MOCK'}
            </p>
            <p className="text-[5px] sm:text-[6px] text-slate-400 uppercase font-bold tracking-widest mt-0.5 text-center">
              Unique Credential ID
            </p>
          </div>
        </div>

        {/* ── 5. SECURITY & VERIFICATION FOOTER ── */}
        <div className="w-full pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-slate-400 text-[5.5px] sm:text-[6.5px] px-2 font-mono">
          <span className="tracking-wider text-slate-400">OFFICIALLY VERIFIED CREDENTIAL</span>
          <span className="tracking-wider text-slate-500 font-medium">learnproofai.com/verify</span>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
