import React from 'react';
import { Shield } from 'lucide-react';

/**
 * YorotaLogo - High-fidelity premium vector road safety shield logo.
 * Designed with perfect scalability, glowing emerald/gold layers, 
 * and professional traffic control emblem paths.
 */
export default function YorotaLogo({ className = "w-10 h-10", showText = false }) {
  return (
    <div className="relative flex items-center gap-2 select-none shrink-0">
      
      {/* Official YOROTA Logo Image container */}
      <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
        <img 
          src="/logo.png" 
          alt="YOROTA Official Logo" 
          className="w-full h-full object-contain filter drop-shadow-[0_2px_12px_rgba(245,200,0,0.35)] transition-transform duration-500 hover:scale-105"
        />
        {/* Soft glowing background under logo */}
        <div className="absolute inset-0.5 rounded-full bg-emerald-500/5 blur-[4px] -z-10 pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <span className="font-black text-xs sm:text-sm tracking-widest text-slate-100 block gold-text-glow leading-none">
            YOROTA
          </span>
          <span className="text-[8px] sm:text-[9px] text-[#F5C800] font-black tracking-[0.2em] block uppercase mt-0.5 leading-none">
            Smart Office
          </span>
        </div>
      )}

    </div>
  );
}

