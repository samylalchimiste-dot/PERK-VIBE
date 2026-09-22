import React from 'react';

interface BrandCrestLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
}

export const BrandCrestLogo: React.FC<BrandCrestLogoProps> = ({
  className = '',
  size = 'md',
  showGlow = true,
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeMap[size]} ${className}`}>
      {/* Golden Outer Radial Glow */}
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl scale-125 pointer-events-none animate-pulse" />
      )}

      {/* Cybernetic Connoisseur Crest SVG */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gold Metallic Gradients */}
          <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#eab308" />
            <stop offset="50%" stopColor="#ca8a04" />
            <stop offset="75%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#fef9c3" />
          </linearGradient>

          <linearGradient id="metalPlate" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="goldBanner" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ca8a04" />
            <stop offset="50%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <radialGradient id="helmetCore" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#090d16" />
            <stop offset="100%" stopColor="#020408" />
          </radialGradient>
        </defs>

        {/* Outer Ring with Tachymeter notches */}
        <circle cx="100" cy="100" r="92" stroke="url(#goldRing)" strokeWidth="3.5" opacity="0.95" />
        <circle cx="100" cy="100" r="86" stroke="#ca8a04" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
        <circle cx="100" cy="100" r="82" fill="url(#metalPlate)" stroke="#334155" strokeWidth="1.5" />

        {/* Inner Gear Notches */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <rect
            key={deg}
            x="98.5"
            y="11"
            width="3"
            height="5"
            fill="#eab308"
            opacity="0.8"
            transform={`rotate(${deg} 100 100)`}
          />
        ))}

        {/* Cyber Helmet / Mask Base */}
        <path
          d="M 62 70 C 62 48 78 38 100 38 C 122 38 138 48 138 70 C 138 88 134 110 126 122 C 118 134 108 140 100 140 C 92 140 82 134 74 122 C 66 110 62 88 62 70 Z"
          fill="url(#helmetCore)"
          stroke="url(#goldRing)"
          strokeWidth="2.5"
        />

        {/* Helmet Tech Brow & Ear Protectors */}
        <path
          d="M 52 68 L 64 64 L 64 88 L 52 94 Z"
          fill="#1e293b"
          stroke="#ca8a04"
          strokeWidth="1.5"
        />
        <path
          d="M 148 68 L 136 64 L 136 88 L 148 94 Z"
          fill="#1e293b"
          stroke="#ca8a04"
          strokeWidth="1.5"
        />

        {/* Visor / Optical Eyes (Glowing Cyber Cyan) */}
        <path
          d="M 72 74 C 72 68 84 66 100 66 C 116 66 128 68 128 74 C 128 82 118 86 100 86 C 82 86 72 82 72 74 Z"
          fill="url(#cyberGlow)"
          filter="drop-shadow(0 0 6px #38bdf8)"
        />
        <line x1="100" y1="67" x2="100" y2="85" stroke="#082f49" strokeWidth="1.5" opacity="0.6" />

        {/* Trichome / Connoisseur Leaf Emblem on Forehead */}
        <path
          d="M 100 44 C 98 48 96 52 92 54 C 96 55 98 56 100 62 C 102 56 104 55 108 54 C 104 52 102 48 100 44 Z"
          fill="#fef08a"
          filter="drop-shadow(0 0 3px #eab308)"
        />

        {/* Respirator / Filtration Grid (Dry Sift / Extraction Vibe) */}
        <path
          d="M 85 96 L 115 96 L 110 114 L 90 114 Z"
          fill="#0f172a"
          stroke="#eab308"
          strokeWidth="1"
        />
        <line x1="90" y1="101" x2="110" y2="101" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />
        <line x1="92" y1="106" x2="108" y2="106" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />
        <line x1="95" y1="110" x2="105" y2="110" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2 1.5" />

        {/* Gold Ribbon Banner with TRICHOME MONTANE */}
        <path
          d="M 24 135 L 42 125 L 158 125 L 176 135 L 164 158 L 100 162 L 36 158 Z"
          fill="#050811"
          stroke="url(#goldRing)"
          strokeWidth="2.5"
        />

        {/* Gold Trim inside Banner */}
        <path
          d="M 38 130 L 162 130 L 154 153 L 100 157 L 46 153 Z"
          fill="url(#goldBanner)"
          opacity="0.15"
        />

        {/* Text CARTEL DEL FARMEZ */}
        <text
          x="100"
          y="143"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="10"
          fontWeight="900"
          fontFamily="'Montserrat', 'Arial Black', sans-serif"
          letterSpacing="1.5"
        >
          CARTEL DEL
        </text>
        <text
          x="100"
          y="155"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="11"
          fontWeight="900"
          fontFamily="'Montserrat', 'Arial Black', sans-serif"
          letterSpacing="2.2"
        >
          FARMEZ
        </text>

        {/* Small Bottom Star */}
        <polygon
          points="100,166 102,171 107,171 103,174 105,179 100,176 95,179 97,174 93,171 98,171"
          fill="#eab308"
        />
      </svg>
    </div>
  );
};
