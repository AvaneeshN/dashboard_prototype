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

  // Responsive scaling
  const dimensions = {
    sm: { width: 56, height: 44, badge: 'py-1 px-2 text-[9.5px]' },
    md: { width: 68, height: 54, badge: 'py-1.5 px-2.5 text-xs' },
    lg: { width: 84, height: 66, badge: 'py-2 px-3 text-xs' }
  }[size];

  // 17 perimeter bolts (3 slots hidden behind the left hinge bracket)
  const boltAngles = [0, 18, 36, 54, 72, 90, 108, 126, 144, 216, 234, 252, 270, 288, 306, 324, 342];

  // 8 radial sectors for faceted metallic face reflection matching reference
  const sectorColors = [
    '#3b4a5b', // 0-45 deg: medium slate
    '#202c3a', // 45-90 deg: dark slate
    '#506377', // 90-135 deg: specular wedge
    '#2c3947', // 135-180 deg: medium-dark slate
    '#19232f', // 180-225 deg: shadow wedge
    '#495b6d', // 225-270 deg: specular wedge
    '#23303d', // 270-315 deg: medium-dark slate
    '#314150', // 315-360 deg: medium slate
  ];

  return (
    <div
      className={`relative inline-flex items-center gap-2.5 transition-all duration-300 select-none ${
        variant === 'floating'
          ? 'p-2 rounded-2xl bg-[#0a192f]/90 backdrop-blur-md border border-[#1e3a5f] shadow-lg shadow-black/20 hover:border-amber-400/50 hover:bg-[#0d213f]/95'
          : 'bg-transparent'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="WF47 ZYNG Cryptographic Compliance Vault"
    >
      {/* 1. Bank Vault Door Structure */}
      <div 
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* Ambient background glow */}
        <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-sm pointer-events-none animate-vault-glow" />

        <svg
          viewBox="0 0 120 100"
          className="w-full h-full drop-shadow-md overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Outer Ring Steel Gradient */}
            <linearGradient id="vaultOuterFlangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="35%" stopColor="#1e293b" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Hinge Bracket Gradient */}
            <linearGradient id="vaultHingeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="40%" stopColor="#334155" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Hinge Pin Cylinder Gradient */}
            <linearGradient id="vaultPinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="35%" stopColor="#64748b" />
              <stop offset="65%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Perimeter Bolt Metallic Gradient */}
            <radialGradient id="vaultBoltGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#cbd5e1" />
              <stop offset="80%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>

            {/* 6-Spoke Wheel Rim Gradient */}
            <linearGradient id="vaultWheelRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#cbd5e1" />
              <stop offset="80%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* 6 Spokes Gradient */}
            <linearGradient id="vaultSpokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Wheel Central Hub Gradient */}
            <radialGradient id="vaultHubGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>
          </defs>

          {/* LAYER 1: Circular Outer Flange / Bezel */}
          <circle
            cx="68"
            cy="50"
            r="42"
            fill="url(#vaultOuterFlangeGrad)"
            stroke="#1e3a5f"
            strokeWidth="1.5"
          />
          {/* Subtle Outer Golden Rim Accent for Brand Cohesion */}
          <circle
            cx="68"
            cy="50"
            r="41.2"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.6"
            opacity="0.4"
          />

          {/* LAYER 2: Faceted Inner Door Face (8 Specular Metallic Radial Wedges) */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
            const a1 = (idx * 45 * Math.PI) / 180;
            const a2 = ((idx + 1) * 45 * Math.PI) / 180;
            const x1 = +(68 + 30.5 * Math.cos(a1)).toFixed(2);
            const y1 = +(50 + 30.5 * Math.sin(a1)).toFixed(2);
            const x2 = +(68 + 30.5 * Math.cos(a2)).toFixed(2);
            const y2 = +(50 + 30.5 * Math.sin(a2)).toFixed(2);
            const d = `M 68 50 L ${x1} ${y1} A 30.5 30.5 0 0 1 ${x2} ${y2} Z`;
            return (
              <path
                key={idx}
                d={d}
                fill={sectorColors[idx]}
                opacity="0.95"
              />
            );
          })}

          {/* Inner Inset Border / Recessed Lip */}
          <circle
            cx="68"
            cy="50"
            r="30.5"
            fill="none"
            stroke="#0a192f"
            strokeWidth="1.4"
          />
          <circle
            cx="68"
            cy="50"
            r="29.8"
            fill="none"
            stroke="#475569"
            strokeWidth="0.5"
            opacity="0.6"
          />

          {/* LAYER 3: Perimeter Heavy Locking Bolts / Studs */}
          {boltAngles.map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const bx = +(68 + 36.5 * Math.cos(rad)).toFixed(2);
            const by = +(50 + 36.5 * Math.sin(rad)).toFixed(2);
            return (
              <g key={angle}>
                <circle
                  cx={bx}
                  cy={by}
                  r="2.2"
                  fill="url(#vaultBoltGrad)"
                  stroke="#0a192f"
                  strokeWidth="0.7"
                />
                {/* 3D Specular Highlight Dot */}
                <circle
                  cx={+bx - 0.5}
                  cy={+by - 0.5}
                  r="0.65"
                  fill="#ffffff"
                  opacity="0.75"
                />
              </g>
            );
          })}

          {/* LAYER 4: Left Heavy Hinge Assembly */}
          {/* Hinge Plate / Arm Bracket */}
          <rect
            x="9.5"
            y="36"
            width="24.5"
            height="28"
            rx="4"
            fill="url(#vaultHingeGrad)"
            stroke="#0f172a"
            strokeWidth="1.2"
          />
          {/* Upper Bevel Highlight */}
          <line
            x1="12"
            y1="37"
            x2="32"
            y2="37"
            stroke="#64748b"
            strokeWidth="0.9"
            opacity="0.8"
          />
          {/* Lower Shadow Groove */}
          <line
            x1="12"
            y1="63"
            x2="32"
            y2="63"
            stroke="#0a192f"
            strokeWidth="1"
          />

          {/* Vertical Hinge Pin (Center Pillar) */}
          <rect
            x="6.5"
            y="29"
            width="7"
            height="42"
            rx="2"
            fill="url(#vaultPinGrad)"
            stroke="#0a192f"
            strokeWidth="0.8"
          />
          {/* Top Pin Cap */}
          <rect
            x="5.5"
            y="25.5"
            width="9"
            height="5"
            rx="2.5"
            fill="url(#vaultPinGrad)"
            stroke="#0a192f"
            strokeWidth="0.8"
          />
          {/* Bottom Pin Cap */}
          <rect
            x="5.5"
            y="69.5"
            width="9"
            height="5"
            rx="2.5"
            fill="url(#vaultPinGrad)"
            stroke="#0a192f"
            strokeWidth="0.8"
          />

          {/* Hinge Rivets (2 Vertical Anchor Bolts on Bracket) */}
          <circle cx="16" cy="43" r="1.5" fill="url(#vaultBoltGrad)" stroke="#0a192f" strokeWidth="0.5" />
          <circle cx="16" cy="57" r="1.5" fill="url(#vaultBoltGrad)" stroke="#0a192f" strokeWidth="0.5" />

          {/* LAYER 5: Central Rotating 6-Spoke Wheel Handle */}
          <g
            className="animate-vault-wheel"
            style={{
              transformOrigin: '68px 50px',
              animationDuration: isHovered ? '8s' : '16s'
            }}
          >
            {/* Outer Rim of Vault Wheel */}
            <circle
              cx="68"
              cy="50"
              r="13.5"
              fill="none"
              stroke="url(#vaultWheelRimGrad)"
              strokeWidth="2.4"
            />
            <circle
              cx="68"
              cy="50"
              r="13.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.6"
              opacity="0.8"
            />

            {/* 6 Radial Spokes (Every 60 Degrees) */}
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = +(68 + 3.8 * Math.cos(rad)).toFixed(2);
              const y1 = +(50 + 3.8 * Math.sin(rad)).toFixed(2);
              const x2 = +(68 + 13.5 * Math.cos(rad)).toFixed(2);
              const y2 = +(50 + 13.5 * Math.sin(rad)).toFixed(2);
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#vaultSpokeGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Central Wheel Hub */}
            <circle
              cx="68"
              cy="50"
              r="4"
              fill="url(#vaultHubGrad)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
            <circle
              cx="68"
              cy="50"
              r="1.8"
              fill="#1e293b"
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
          </g>
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
