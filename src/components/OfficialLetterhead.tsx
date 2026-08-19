import React from 'react';

interface OfficialLetterheadProps {
  className?: string;
  showSubtitle?: boolean;
}

export const OfficialLetterhead: React.FC<OfficialLetterheadProps> = ({ 
  className = '',
  showSubtitle = true 
}) => {
  return (
    <div className={`border-b-4 border-double border-slate-950 pb-2.5 mb-4 flex items-center justify-between gap-4 ${className}`}>
      {/* Logo Lambang Kabupaten Garut (PNG) */}
      <div className="w-16 h-20 flex-shrink-0 flex items-center justify-center p-0.5">
        <img 
          src="/logo_garut.png" 
          alt="Lambang Kabupaten Garut" 
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            // Fallback to SVG if PNG fails to load in preview
            (e.target as HTMLElement).style.display = 'none';
            const fallback = document.getElementById('garut-svg-fallback');
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <div id="garut-svg-fallback" className="hidden w-full h-full">
          <svg viewBox="0 0 100 120" className="w-full h-full text-slate-900 fill-current">
            <path d="M50 3 L92 22 V75 C92 95 72 110 50 117 C28 110 8 95 8 75 V22 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="4" />
            <path d="M50 8 L87 25 V72 C87 90 69 104 50 110 C31 104 13 90 13 72 V25 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
            <polygon points="50,15 53,23 61,23 55,28 57,36 50,31 43,36 45,28 39,23 47,23" fill="#0f172a" />
            <path d="M22 62 L36 42 L50 56 L64 42 L78 62 Z" fill="#0f172a" />
            <path d="M20 68 Q35 64 50 68 T80 68" fill="none" stroke="#0f172a" strokeWidth="2" />
            <path d="M20 73 Q35 69 50 73 T80 73" fill="none" stroke="#0f172a" strokeWidth="2" />
            <path d="M20 78 Q35 74 50 78 T80 78" fill="none" stroke="#0f172a" strokeWidth="2" />
            <circle cx="50" cy="86" r="6" fill="#0f172a" />
            <path d="M12 98 Q50 108 88 98 L84 106 Q50 114 16 106 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
            <text x="50" y="104" textAnchor="middle" fontSize="4.5" fontWeight="bold" fontFamily="serif" fill="#0f172a">
              TATA TENTREM KERTA RAHARJA
            </text>
          </svg>
        </div>
      </div>

      {/* Header Text Kedinasan Garut */}
      <div className="text-center flex-1 font-serif">
        <h1 className="text-xs sm:text-sm font-bold tracking-wider text-slate-950 uppercase leading-tight">
          PEMERINTAH KABUPATEN GARUT
        </h1>
        <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-slate-950 uppercase leading-tight mt-0.5">
          DINAS PEKERJAAN UMUM DAN PENATAAN RUANG
        </h2>
        {showSubtitle && (
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-slate-950 uppercase leading-tight mt-0.5">
            SEKRETARIAT SIMBG DAERAH
          </h3>
        )}
        <p className="text-[10px] sm:text-[11px] text-slate-900 font-sans leading-tight mt-1">
          Jalan Prof. KH. Cecep Syarifuddin No. 117 Telp. (0262) 233730 Fax (0262) 544184 Garut 44151
        </p>
        <p className="text-[10px] text-slate-900 font-sans leading-tight mt-0.5">
          e-mail : bangunan.puprgarutkab@gmail.com
        </p>
      </div>

      {/* Spacer kanan agar logo berada di kiri dan teks presisi di tengah */}
      <div className="w-16 h-20 flex-shrink-0 hidden sm:block"></div>
    </div>
  );
};
