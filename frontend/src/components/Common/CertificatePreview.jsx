import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';

const CertificatePreview = ({ userName, courseName, date, certId }) => {
  return (
    <div className="relative w-full aspect-[1.414/1] bg-white border-[6px] border-[#1e293b] p-1.5 shadow-inner overflow-hidden select-none transition-all duration-500 rounded-sm">
      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-t border-l border-orange-400 opacity-50"></div>
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-t border-r border-orange-400 opacity-50"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-b border-l border-orange-400 opacity-50"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#1e293b] z-20 flex items-center justify-center">
        <div className="w-4 h-4 border-b border-r border-orange-400 opacity-50"></div>
      </div>

      {/* Inner Gold/Premium Border */}
      <div className="w-full h-full border-2 border-[#f59e0b]/30 relative flex flex-col items-center justify-between py-6 sm:py-8 px-4">
        {/* Background Watermark/Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
           <Award size={200} className="rotate-12 text-[#1e293b]" strokeWidth={1} />
        </div>

        {/* Header */}
        <div className="text-center relative z-10">
          <p className="text-[12px] sm:text-[14px] font-black text-[#1e293b] leading-tight tracking-[0.15em] uppercase">Certificate of Achievement</p>
          <div className="h-[1px] w-12 bg-orange-400 mx-auto mt-1 opacity-60"></div>
          <p className="text-[6px] sm:text-[7px] text-[#64748b] font-bold tracking-[0.25em] uppercase mt-1">This achievement is officially verified</p>
        </div>

        {/* Recipient */}
        <div className="text-center relative z-10 py-1 sm:py-2">
          <p className="text-[6px] text-[#94a3b8] font-bold uppercase mb-1 sm:mb-2 tracking-widest">Proudly Presented To</p>
          <p className="text-[16px] sm:text-[20px] font-black text-[#f97316] uppercase leading-tight truncate px-4 w-full max-w-[220px] font-serif tracking-tight">
            {userName || "Learner"}
          </p>
          <div className="h-[0.5px] w-32 bg-[#cbd5e1] mx-auto mt-1"></div>
        </div>

        {/* Course */}
        <div className="text-center px-4 relative z-10">
          <p className="text-[6px] sm:text-[7px] text-[#64748b] mb-1 sm:mb-2 font-medium leading-tight">for successfully mastering the curriculum and passing the final examination for</p>
          <p className="text-[10px] sm:text-[12px] font-bold text-[#1e293b] italic leading-tight inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-orange-50/50 rounded-lg border border-orange-100/50">
            {courseName}
          </p>
        </div>

        {/* Bottom Section: Date & ID */}
        <div className="w-full flex justify-between items-end px-4 sm:px-8 relative z-10 mt-1 sm:mt-2">
          <div className="flex flex-col items-center">
            <p className="text-[5px] text-[#94a3b8] uppercase font-bold mb-1 tracking-tighter">Issue Date</p>
            <p className="text-[6px] font-black text-[#1e293b]">{date}</p>
            <div className="w-10 sm:w-12 h-[0.5px] bg-[#1e293b]/20 mt-1"></div>
          </div>
          
          <div className="flex flex-col items-center relative -bottom-1 sm:-bottom-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-orange-400 flex flex-col items-center justify-center bg-white shadow-lg">
              <ShieldCheck size={14} className="text-orange-500 sm:w-4 sm:h-4" />
              <p className="text-[3px] sm:text-[4px] font-black text-orange-600 uppercase">Verified</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-[5px] text-[#94a3b8] uppercase font-bold mb-1 tracking-tighter">Verify ID</p>
            <p className="text-[6px] font-black text-[#1e293b] truncate w-14 text-center">{certId}</p>
            <div className="w-10 sm:w-12 h-[0.5px] bg-[#1e293b]/20 mt-1"></div>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4 flex flex-col items-center opacity-70">
           <p className="text-[6px] sm:text-[7px] font-black text-[#1e293b] tracking-wider">LEARNPROOF ACADEMY</p>
           <p className="text-[3px] sm:text-[4px] text-[#64748b] font-medium tracking-[0.2em] uppercase">Global Certification Authority</p>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
