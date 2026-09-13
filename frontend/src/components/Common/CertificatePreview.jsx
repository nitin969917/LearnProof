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
        <div className="w-full flex justify-between items-end px-2 sm:px-6 relative z-10 mt-1">
          {/* Left Signatory: Registrar & Issue Date */}
          <div className="flex flex-col items-center min-w-[70px]">
            {/* Realistic Cursive Signature SVG */}
            <svg className="w-16 h-5 text-slate-700 opacity-85 mb-0.5" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 22 C 20 8, 30 25, 45 12 C 55 2, 60 28, 75 14 C 85 5, 90 20, 95 10" strokeLinecap="round" />
            </svg>
            <div className="w-16 h-[0.75px] bg-slate-300 mb-0.5" />
            <p className="text-[6.5px] sm:text-[7.5px] font-bold" style={{ color: primaryColor }}>
              {date || new Date().toLocaleDateString()}
            </p>
            <p className="text-[5px] sm:text-[5.5px] text-slate-400 uppercase font-semibold tracking-wider">
              Date Conferred
            </p>
          </div>

          {/* Center Official 3D Metallic Foil Seal */}
          <div className="flex flex-col items-center relative -bottom-0.5">
            <div 
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex flex-col items-center justify-center shadow-lg"
              style={{ 
                background: `radial-gradient(circle, #fffbeb 0%, #fef3c7 40%, ${accentColor} 100%)`,
                borderColor: primaryColor
              }}
            >
              {/* Serrated Ring Effect */}
              <div 
                className="absolute inset-0.5 rounded-full border border-dashed opacity-70"
                style={{ borderColor: primaryColor }}
              />
              <ShieldCheck size={16} className="text-slate-900 drop-shadow-xs" />
              <p className="text-[3.5px] sm:text-[4px] font-black uppercase tracking-widest text-slate-900 mt-0.5">
                {sealText}
              </p>
            </div>
          </div>

          {/* Right Signatory: Authorized Director */}
          <div className="flex flex-col items-center min-w-[70px]">
            {/* Realistic Second Cursive Signature SVG */}
            <svg className="w-16 h-5 text-slate-700 opacity-85 mb-0.5" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 15 C 25 25, 35 5, 50 18 C 65 28, 70 8, 85 16 C 92 20, 95 12, 98 14" strokeLinecap="round" />
            </svg>
            <div className="w-16 h-[0.75px] bg-slate-300 mb-0.5" />
            <p className="text-[6.5px] sm:text-[7.5px] font-bold truncate max-w-[85px] text-center" style={{ color: primaryColor }}>
              {signatoryName}
            </p>
            <p className="text-[5px] sm:text-[5.5px] text-slate-400 uppercase font-semibold tracking-wider text-center">
              {signatoryTitle}
            </p>
          </div>
        </div>

        {/* ── 5. SECURITY & VERIFICATION FOOTER ── */}
        <div className="w-full pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-slate-400 text-[5px] sm:text-[6px] px-1 font-mono">
          <span>LEARNPROOF ACCREDITATION REPOSITORY</span>
          <span className="font-bold text-slate-600">ID: {certId ? certId.slice(0, 16) : 'LP-VERIFIED-2026'}</span>
          <span>learnproofai.com/verify</span>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
