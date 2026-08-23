import React, { useState } from 'react';
import logoImg from '../../assets/logo.png';

export function GanpatiLogo({ size = 'md', className = '', glow = true, rounded = 'full' }) {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: { container: 'w-7 h-7', text: 'text-sm' },
    sm: { container: 'w-9 h-9', text: 'text-base' },
    md: { container: 'w-12 h-12', text: 'text-xl' },
    lg: { container: 'w-20 h-20', text: 'text-3xl' },
    xl: { container: 'w-28 h-28', text: 'text-5xl' },
    '2xl': { container: 'w-36 h-36', text: 'text-6xl' },
    '3xl': { container: 'w-44 h-44', text: 'text-7xl' }
  };

  const selectedSize = sizeMap[size] || sizeMap.md;
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 group select-none transition-transform duration-300 transform hover:scale-105 ${selectedSize.container} ${className}`}
    >
      {/* Royal Glow Aura */}
      {glow && (
        <div className={`absolute -inset-1 ${roundedClass} bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-300 opacity-60 blur-md group-hover:opacity-90 transition-opacity duration-300 pointer-events-none`} />
      )}

      {/* Emblem Frame */}
      <div
        className={`relative w-full h-full ${roundedClass} overflow-hidden bg-gradient-to-b from-amber-950/90 via-slate-950 to-orange-950/90 border-2 border-amber-400/70 shadow-2xl flex items-center justify-center ring-1 ring-amber-300/40`}
      >
        {!imgError ? (
          <img
            src={logoImg}
            alt="युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड"
            className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-110"
            onError={() => setImgError(true)}
            loading="eager"
          />
        ) : (
          <span className={`transform -translate-y-0.5 filter drop-shadow-md text-amber-300 ${selectedSize.text}`}>
            🕉️
          </span>
        )}

        {/* Gloss / Sheen Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Decorative Golden Sparkle on top-right */}
      {(size === 'lg' || size === 'xl' || size === '2xl' || size === '3xl') && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border border-amber-200" />
        </span>
      )}
    </div>
  );
}

export default GanpatiLogo;
