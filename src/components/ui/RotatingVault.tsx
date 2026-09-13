'use client';

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface RotatingVaultProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  variant?: 'floating' | 'embedded';
}

export const RotatingVault: React.FC<RotatingVaultProps> = ({
  size = 'md',
  showLabel = true,
  className = '',
  variant = 'floating'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Dimension scaling
  const dimensions = {
    sm: { wheel: 38, svg: 80, badge: 'py-1 px-2.5 text-[10px]' },
    md: { wheel: 46, svg: 90, badge: 'py-1.5 px-3 text-xs' },
    lg: { wheel: 56, svg: 100, badge: 'py-2 px-3.5 text-xs' }
  }[size];

  return (
    <div
      className={`relative inline-flex items-center gap-2.5 transition-all duration-300 select-none ${
        variant === 'floating'
          ? 'p-2 rounded-2xl bg-[#0a192f]/90 backdrop-blur-md border border-[#1e3a5f] shadow-lg shadow-black/10 hover:border-amber-400/50 hover:bg-[#0d213f]/95'
          : 'bg-transparent'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="WF47 ZYNG Cryptographic Compliance Vault"
    >
      {/* 1. Multi-Layered Rotating Vault Mechanism */}
      <div 
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: dimensions.wheel, height: dimensions.wheel }}
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-sm pointer-events-none animate-vault-glow" />

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="vaultOuterRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="50%" stopColor="#0a192f" />
              <stop offset="100%" stopColor="#112240" />
            </linearGradient>

            <linearGradient id="vaultGoldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="vaultSteelHub" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a192f" />
              <stop offset="100%" stopColor="#040b15" />
            </linearGradient>

            <filter id="vaultSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BASE: Armored Outer Flange with Perimeter Rivets */}
          <circle cx="50" cy="50" r="48" fill="url(#vaultOuterRim)" stroke="#1e3a5f" strokeWidth="2" />
          <circle cx="50" cy="50" r="44" stroke="#0a192f" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

          {/* Perimeter Heavy Locking Bolts / Rivets (8 Cardinal & Ordinal) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 50 + 44 * Math.cos(rad);
            const cy = 50 + 44 * Math.sin(rad);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="2.2"
                fill="#f59e0b"
                stroke="#0a192f"
                strokeWidth="0.8"
                opacity="0.9"
              />
            );
          })}

          {/* LAYER 1: Clockwise Outer Cog Ring / Gear Teeth */}
          <g className="animate-vault-slow" style={{ transformOrigin: '50px 50px' }}>
            {/* Circular Track */}
            <circle cx="50" cy="50" r="37" stroke="url(#vaultGoldAccent)" strokeWidth="1.2" opacity="0.55" />
            {/* 12 Notches / Gear Teeth */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 36 * Math.cos(rad);
              const y1 = 50 + 36 * Math.sin(rad);
              const x2 = 50 + 40 * Math.cos(rad);
              const y2 = 50 + 40 * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#vaultGoldAccent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* LAYER 2: Counter-Clockwise Combination Dial (Calibrated Degree Markings) */}
          <g className="animate-vault-reverse" style={{ transformOrigin: '50px 50px' }}>
            <circle cx="50" cy="50" r="29" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1.5 3.5" opacity="0.75" />
            {/* 4 Cardinal Diamond Markers */}
            {[0, 90, 180, 270].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const mx = 50 + 29 * Math.cos(rad);
              const my = 50 + 29 * Math.sin(rad);
              return (
                <circle key={i} cx={mx} cy={my} r="1.5" fill="#fde047" />
              );
            })}
          </g>

          {/* LAYER 3: Clockwise Heavy 3-Spoke Vault Wheel Handle */}
          <g className="animate-vault-wheel" style={{ transformOrigin: '50px 50px' }}>
            {[0, 120, 240].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 8 * Math.cos(rad);
              const y1 = 50 + 8 * Math.sin(rad);
              const x2 = 50 + 26 * Math.cos(rad);
              const y2 = 50 + 26 * Math.sin(rad);
              const hx = 50 + 27 * Math.cos(rad);
              const hy = 50 + 27 * Math.sin(rad);
              return (
                <g key={i}>
                  {/* Heavy Brass Spoke Arm */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="url(#vaultGoldAccent)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  {/* Outer Spoke Handle Grip Bulb */}
                  <circle
                    cx={hx}
                    cy={hy}
                    r="3.5"
                    fill="url(#vaultGoldAccent)"
                    stroke="#0a192f"
                    strokeWidth="1"
                    filter="url(#vaultSoftGlow)"
                  />
                </g>
              );
            })}
          </g>

          {/* LAYER 4: Armored Center Lock Hub (Static with Shield Emblem & Green Security Diode) */}
          <circle
            cx="50"
            cy="50"
            r="12.5"
            fill="url(#vaultSteelHub)"
            stroke="url(#vaultGoldAccent)"
            strokeWidth="1.8"
          />
          
          {/* Inner Monogram Shield */}
          <path
            d="M 50 43 L 55 45.5 L 55 51 C 55 54.5 52.5 56.5 50 57.5 C 47.5 56.5 45 54.5 45 51 L 45 45.5 Z"
            fill="#0a192f"
            stroke="#f59e0b"
            strokeWidth="1"
          />
          <path
            d="M 48 51.5 L 50 47.5 L 52 51.5"
            stroke="#fde047"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Pulsing Green LED */}
          <circle cx="50" cy="42" r="1.3" fill="#10b981" />
        </svg>
      </div>

      {/* 2. Sleek Typographic Security Readout */}
      {showLabel && (
        <div className="flex flex-col text-left leading-tight pr-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-mono font-bold text-[10px] tracking-wider text-amber-300 uppercase truncate">
              WF47 Vault
            </span>
          </div>
          <span className="font-mono text-[8.5px] text-slate-400 tracking-tight mt-0.5 truncate">
            256-BIT · SECURED
          </span>
        </div>
      )}

      {/* 3. Interactive Floating Tooltip on Hover */}
      {isHovered && (
        <div className="absolute right-0 top-full mt-2 w-48 p-2.5 rounded-xl bg-[#061224] border border-amber-400/40 shadow-2xl text-[10px] font-mono text-slate-300 z-50 pointer-events-none space-y-1 backdrop-blur-xl">
          <div className="flex items-center gap-1 text-amber-300 font-bold border-b border-white/10 pb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>ENCRYPTED LEDGER</span>
          </div>
          <div className="flex justify-between text-[9px] pt-0.5">
            <span className="text-slate-400">Vault Protocol:</span>
            <span className="text-white font-bold">WF47-TLS 1.3</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-400">DBT PFMS Tunnel:</span>
            <span className="text-emerald-400 font-bold">ACTIVE</span>
          </div>
        </div>
      )}
    </div>
  );
};
