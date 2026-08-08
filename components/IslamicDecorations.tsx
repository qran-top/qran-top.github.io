import React from 'react';

/**
 * 8-Pointed Islamic Star SVG path generator or component
 */
export const IslamicStarIcon: React.FC<{ className?: string; size?: number; fill?: string; stroke?: string }> = ({
  className = "w-6 h-6",
  size = 24,
  fill = "currentColor",
  stroke = "none"
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 40 40" 
    className={className} 
    fill={fill} 
    stroke={stroke}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer 8-Pointed Star */}
    <path 
      d="M20 0 L25.86 5.86 L34.14 5.86 L34.14 14.14 L40 20 L34.14 25.86 L34.14 34.14 L25.86 34.14 L20 40 L14.14 34.14 L5.86 34.14 L5.86 25.86 L0 20 L5.86 14.14 L5.86 5.86 L14.14 5.86 Z" 
    />
  </svg>
);

/**
 * Intricate 4-Corner Islamic Rosette Ornaments for Mushaf Page
 */
export const MushafCornerOrnaments: React.FC = () => {
  return (
    <>
      {/* Top Right Corner Rosette */}
      <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-8 h-8 sm:w-12 sm:h-12 pointer-events-none select-none text-primary opacity-85 z-10">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-xs">
          <path d="M0 0 L60 0 L60 60 L45 45 C 30 45, 15 30, 15 15 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {/* Outer Corner Arch */}
          <path d="M0 25 C 15 25, 25 15, 25 0" fill="none" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2,2" />
          <path d="M0 40 C 25 40, 40 25, 40 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
          {/* Corner 8-Point Star */}
          <g transform="translate(14, 14) scale(0.6)">
            <path d="M20 0 L25.86 5.86 L34.14 5.86 L34.14 14.14 L40 20 L34.14 25.86 L34.14 34.14 L25.86 34.14 L20 40 L14.14 34.14 L5.86 34.14 L5.86 25.86 L0 20 L5.86 14.14 L5.86 5.86 L14.14 5.86 Z" fill="currentColor" opacity="0.25" />
            <path d="M20 4 L24.5 8.5 L31.5 8.5 L31.5 15.5 L36 20 L31.5 24.5 L31.5 31.5 L24.5 31.5 L20 36 L15.5 31.5 L8.5 31.5 L8.5 24.5 L4 20 L8.5 15.5 L8.5 8.5 L15.5 8.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
          </g>
        </svg>
      </div>

      {/* Top Left Corner Rosette */}
      <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 w-8 h-8 sm:w-12 sm:h-12 pointer-events-none select-none text-primary opacity-85 z-10 transform -scale-x-100">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-xs">
          <path d="M0 0 L60 0 L60 60 L45 45 C 30 45, 15 30, 15 15 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 25 C 15 25, 25 15, 25 0" fill="none" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2,2" />
          <path d="M0 40 C 25 40, 40 25, 40 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <g transform="translate(14, 14) scale(0.6)">
            <path d="M20 0 L25.86 5.86 L34.14 5.86 L34.14 14.14 L40 20 L34.14 25.86 L34.14 34.14 L25.86 34.14 L20 40 L14.14 34.14 L5.86 34.14 L5.86 25.86 L0 20 L5.86 14.14 L5.86 5.86 L14.14 5.86 Z" fill="currentColor" opacity="0.25" />
            <path d="M20 4 L24.5 8.5 L31.5 8.5 L31.5 15.5 L36 20 L31.5 24.5 L31.5 31.5 L24.5 31.5 L20 36 L15.5 31.5 L8.5 31.5 L8.5 24.5 L4 20 L8.5 15.5 L8.5 8.5 L15.5 8.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
          </g>
        </svg>
      </div>

      {/* Bottom Right Corner Rosette */}
      <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 w-8 h-8 sm:w-12 sm:h-12 pointer-events-none select-none text-primary opacity-85 z-10 transform -scale-y-100">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-xs">
          <path d="M0 0 L60 0 L60 60 L45 45 C 30 45, 15 30, 15 15 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 25 C 15 25, 25 15, 25 0" fill="none" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2,2" />
          <path d="M0 40 C 25 40, 40 25, 40 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <g transform="translate(14, 14) scale(0.6)">
            <path d="M20 0 L25.86 5.86 L34.14 5.86 L34.14 14.14 L40 20 L34.14 25.86 L34.14 34.14 L25.86 34.14 L20 40 L14.14 34.14 L5.86 34.14 L5.86 25.86 L0 20 L5.86 14.14 L5.86 5.86 L14.14 5.86 Z" fill="currentColor" opacity="0.25" />
            <path d="M20 4 L24.5 8.5 L31.5 8.5 L31.5 15.5 L36 20 L31.5 24.5 L31.5 31.5 L24.5 31.5 L20 36 L15.5 31.5 L8.5 31.5 L8.5 24.5 L4 20 L8.5 15.5 L8.5 8.5 L15.5 8.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
          </g>
        </svg>
      </div>

      {/* Bottom Left Corner Rosette */}
      <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 w-8 h-8 sm:w-12 sm:h-12 pointer-events-none select-none text-primary opacity-85 z-10 transform -scale-x-100 -scale-y-100">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-xs">
          <path d="M0 0 L60 0 L60 60 L45 45 C 30 45, 15 30, 15 15 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 25 C 15 25, 25 15, 25 0" fill="none" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2,2" />
          <path d="M0 40 C 25 40, 40 25, 40 0" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <g transform="translate(14, 14) scale(0.6)">
            <path d="M20 0 L25.86 5.86 L34.14 5.86 L34.14 14.14 L40 20 L34.14 25.86 L34.14 34.14 L25.86 34.14 L20 40 L14.14 34.14 L5.86 34.14 L5.86 25.86 L0 20 L5.86 14.14 L5.86 5.86 L14.14 5.86 Z" fill="currentColor" opacity="0.25" />
            <path d="M20 4 L24.5 8.5 L31.5 8.5 L31.5 15.5 L36 20 L31.5 24.5 L31.5 31.5 L24.5 31.5 L20 36 L15.5 31.5 L8.5 31.5 L8.5 24.5 L4 20 L8.5 15.5 L8.5 8.5 L15.5 8.5 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="4" fill="currentColor" />
          </g>
        </svg>
      </div>
    </>
  );
};

/**
 * Elegant Islamic Section Divider for multiple Surahs on a single Mushaf page
 */
export const IslamicSectionDivider: React.FC<{ className?: string }> = ({ className = "my-6" }) => (
  <div className={`${className} flex items-center justify-center select-none`} aria-hidden="true">
    <div className="w-full flex items-center gap-2 max-w-md mx-auto opacity-80 text-primary">
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-primary" />
      <div className="flex items-center gap-1.5 px-2">
        <span className="text-xs">❖</span>
        <IslamicStarIcon className="w-5 h-5 text-primary" fill="currentColor" />
        <span className="text-xs">❖</span>
      </div>
      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-primary/50 to-primary" />
    </div>
  </div>
);

/**
 * Islamic Hizb/Juz Margin Medallion
 */
export const HizbMarginBadge: React.FC<{ label: string; side?: 'left' | 'right' }> = ({ label, side = 'right' }) => (
  <div className={`hizb-marker ${side} flex items-center gap-1.5 shadow-sm bg-surface border border-primary/40 rounded-full px-3 py-1 font-serif text-xs font-bold text-primary-text-strong z-20`}>
    <IslamicStarIcon className="w-3.5 h-3.5 text-primary" fill="currentColor" />
    <span>{label}</span>
  </div>
);
