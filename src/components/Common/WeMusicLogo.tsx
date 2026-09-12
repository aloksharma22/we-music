import React from 'react';
import logoImg from '../../assets/images/wemusic_brand_logo_1788951299606.jpg';

interface WeMusicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const WeMusicLogo: React.FC<WeMusicLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick,
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const textHeadingClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Visual Logo Mark: Dual-layer icon with generated brand emblem and glowing border */}
      <div className="relative shrink-0">
        <div
          className={`${iconSizeClasses[size]} overflow-hidden relative shadow-md shadow-emerald-500/20 ring-1 ring-white/10 group-hover:ring-emerald-400/50 transition-all duration-300 bg-slate-950 flex items-center justify-center`}
        >
          {/* High-res generated We Music brand visual */}
          <img
            src={logoImg}
            alt="We Music Logo"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />

          {/* Fallback & accent overlay glow */}
          <div className="absolute inset-0 bg-linear-to-tr from-emerald-500/15 via-transparent to-teal-400/20 pointer-events-none" />
        </div>

        {/* Live Audio Pulse Indicator on the logo corner */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-1 ring-slate-950" />
        </span>
      </div>

      {/* Brand Typographic Identity */}
      {showText && (
        <div className="hidden sm:block leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black ${textHeadingClasses[size]} tracking-wider uppercase text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1`}
            >
              WE MUSIC
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30 shrink-0">
              AUDIO
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
            Sonic Community & Rooms
          </p>
        </div>
      )}
    </div>
  );
};
