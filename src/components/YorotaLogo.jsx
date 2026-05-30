import React from 'react';
import { Shield } from 'lucide-react';

/**
 * YorotaLogo - High-fidelity premium vector road safety shield logo.
 * Designed with perfect scalability, glowing emerald/gold layers, 
 * and professional traffic control emblem paths.
 */
export default function YorotaLogo({ className = "w-10 h-10", showText = false }) {
  return (
    <div className={`relative flex items-center gap-2.5 ${className}`}>
      
      {/* Dynamic Vector Shield Emblem */}
      <div className="relative w-full h-full aspect-square shrink-0 select-none">
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
          {/* Outer Warning Gold Ring representing highway barriers */}
          <circle 
            cx="50" 
            cy="50" 
            r="46" 
            stroke="#F5C800" 
            strokeWidth="3.2" 
            fill="#090d16" 
          />
          
          {/* Inner Safety Emerald Circular Layer representing traffic lights */}
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            stroke="#10b981" 
            strokeWidth="4" 
            fill="transparent" 
          />
          
          {/* Vector Road Crossing Star Emblem (White safe crossings paths) */}
          <polygon points="50,23 36,68 64,68" fill="#ffffff" opacity="0.9" />
          <polygon points="50,77 36,32 64,32" fill="#ffffff" opacity="0.9" />
          
          {/* Central Gold Shield core */}
          <circle cx="50" cy="50" r="11" fill="#F5C800" />
          {/* Emerald star safety core */}
          <circle cx="50" cy="50" r="6" fill="#10b981" />
        </svg>
        {/* Soft glowing ambient backing layer */}
        <div className="absolute inset-0.5 rounded-full bg-emerald-500/5 blur-[3px]" />
      </div>

      {showText && (
        <div className="flex flex-col justify-center min-w-0 select-none">
          <span className="font-black text-sm tracking-widest text-slate-100 block gold-text-glow leading-none">
            YOROTA
          </span>
          <span className="text-[9px] text-[#F5C800] font-black tracking-[0.2em] block uppercase mt-0.5 leading-none">
            Smart Office
          </span>
        </div>
      )}

    </div>
  );
}
