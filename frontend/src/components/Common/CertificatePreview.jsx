import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

const CertificatePreview = ({ userName, courseName, date, certId, template = null }) => {
  const primaryColor = template?.primaryColor || '#1e293b';
  const accentColor = template?.accentColor || '#f59e0b';
  const textColor = template?.textColor || '#0f172a';
  const bgColor = template?.backgroundColor || '#ffffff';
  const titleText = template?.titleText || 'Certificate of Achievement';
  const subtitleText = template?.subtitleText || 'This achievement is officially verified';
  const bodyText = template?.bodyText || 'for successfully mastering the curriculum and passing the final examination for';
  const issuerName = template?.issuerName || 'LEARNPROOF ACADEMY';
  const issuerTitle = template?.issuerTitle || 'Global Certification Authority';
  const signatoryName = template?.signatoryName || 'Academic Director';
  const signatoryTitle = template?.signatoryTitle || 'Head of Certifications';
  const sealText = template?.sealText || 'VERIFIED';
  const layout = template?.layout || 'classic';

  return (
    <div 
      className="relative w-full aspect-[1.414/1] p-1.5 shadow-md overflow-hidden select-none transition-all duration-300 rounded-sm"
      style={{ 
        backgroundColor: bgColor,
        borderColor: primaryColor,
        borderWidth: layout === 'minimal' ? '3px' : '6px',
        borderStyle: 'solid'
      }}
    >
      {/* Top Bar Accent for Modern Layout */}
      {layout === 'modern' && (
        <div 
          className="absolute top-0 left-0 right-0 h-2 z-30" 
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Corner Decorations for Classic Layout */}
      {layout === 'classic' && (
        <>
          <div className="absolute top-0 left-0 w-7 h-7 z-20 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <div className="w-3.5 h-3.5 border-t border-l opacity-60" style={{ borderColor: accentColor }} />
          </div>
          <div className="absolute top-0 right-0 w-7 h-7 z-20 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <div className="w-3.5 h-3.5 border-t border-r opacity-60" style={{ borderColor: accentColor }} />
          </div>
          <div className="absolute bottom-0 left-0 w-7 h-7 z-20 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <div className="w-3.5 h-3.5 border-b border-l opacity-60" style={{ borderColor: accentColor }} />
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 z-20 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <div className="w-3.5 h-3.5 border-b border-r opacity-60" style={{ borderColor: accentColor }} />
          </div>
        </>
      )}

      {/* Inner Accent Border */}
      <div 
        className="w-full h-full relative flex flex-col items-center justify-between py-4 sm:py-6 px-3 sm:px-4"
        style={{
          border: layout !== 'minimal' ? `2px solid ${accentColor}55` : 'none'
        }}
      >
        {/* Background Watermark/Pattern */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none flex items-center justify-center overflow-hidden">
          <Award size={190} className="rotate-12" style={{ color: primaryColor }} strokeWidth={1} />
        </div>

        {/* Header Branding */}
        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-1.5 mb-0.5">
            <span className="text-[7px] sm:text-[8px] font-black tracking-[0.25em] uppercase" style={{ color: primaryColor }}>
              {issuerName}
            </span>
          </div>
          <p className="text-[11px] sm:text-[14px] font-black leading-tight tracking-[0.12em] uppercase" style={{ color: primaryColor }}>
            {titleText}
          </p>
          <div className="h-[1.5px] w-12 mx-auto mt-1 opacity-80" style={{ backgroundColor: accentColor }} />
          <p className="text-[5.5px] sm:text-[6.5px] font-bold tracking-[0.2em] uppercase mt-1 text-slate-500">
            {subtitleText}
          </p>
        </div>

        {/* Recipient Name */}
        <div className="text-center relative z-10 py-0.5">
          <p className="text-[5.5px] sm:text-[6.5px] uppercase mb-0.5 tracking-widest text-slate-400 font-semibold">
            Proudly Presented To
          </p>
          <p 
            className="text-[15px] sm:text-[19px] font-black uppercase leading-tight truncate px-3 w-full max-w-[240px] font-serif tracking-tight"
            style={{ color: accentColor }}
          >
            {userName || "Learner"}
          </p>
          <div className="h-[0.5px] w-28 bg-slate-300 mx-auto mt-0.5" />
        </div>

        {/* Course / Body text */}
        <div className="text-center px-3 relative z-10 max-w-[340px]">
          <p className="text-[5.5px] sm:text-[6.5px] text-slate-500 mb-1 font-medium leading-relaxed">
            {bodyText}
          </p>
          <p 
            className="text-[9.5px] sm:text-[11.5px] font-bold italic leading-tight inline-block px-2.5 py-1 rounded-md border shadow-2xs"
            style={{
              color: textColor,
              backgroundColor: `${accentColor}10`,
              borderColor: `${accentColor}30`
            }}
          >
            {courseName || "Expert Specialization"}
          </p>
        </div>

        {/* Bottom Section: Date & Seal & Signatory/ID */}
        <div className="w-full flex justify-between items-end px-3 sm:px-6 relative z-10 mt-1">
          {/* Date Left */}
          <div className="flex flex-col items-center min-w-[55px]">
            <p className="text-[5px] text-slate-400 uppercase font-bold mb-0.5 tracking-tight">Date Issued</p>
            <p className="text-[6px] sm:text-[7px] font-bold" style={{ color: primaryColor }}>{date}</p>
            <div className="w-10 h-[0.5px] bg-slate-300 mt-0.5" />
          </div>
          
          {/* Verified Center Badge */}
          <div className="flex flex-col items-center relative -bottom-1">
            <div 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex flex-col items-center justify-center bg-white shadow-md"
              style={{ borderColor: accentColor }}
            >
              <ShieldCheck size={13} style={{ color: accentColor }} />
              <p className="text-[3px] font-black uppercase" style={{ color: accentColor }}>{sealText}</p>
            </div>
          </div>

          {/* Signatory or ID Right */}
          <div className="flex flex-col items-center min-w-[55px]">
            <p className="text-[5px] text-slate-400 uppercase font-bold mb-0.5 tracking-tight">{signatoryTitle}</p>
            <p className="text-[6px] sm:text-[7px] font-bold truncate max-w-[65px] text-center" style={{ color: primaryColor }}>
              {signatoryName || certId || "Authorized"}
            </p>
            <div className="w-10 h-[0.5px] bg-slate-300 mt-0.5" />
          </div>
        </div>
        
        {/* Footer Authority Info */}
        <div className="mt-1.5 flex flex-col items-center opacity-70">
          <p className="text-[3.5px] sm:text-[4.5px] text-slate-500 font-medium tracking-[0.18em] uppercase">
            {issuerTitle} • ID: {certId ? certId.slice(0, 12) : "LP-CERT"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
