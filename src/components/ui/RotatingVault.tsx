'use client';

import React, { useState } from 'react';

interface RotatingVaultProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const RotatingVault: React.FC<RotatingVaultProps> = ({
  size = 'md',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Responsive scaling
  const dimensions = {
    sm: { width: 52, height: 44 },
    md: { width: 66, height: 55 },
    lg: { width: 82, height: 68 }
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
      className={`relative inline-flex items-center justify-center transition-transform duration-300 select-none cursor-pointer hover:scale-105 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="WF47 ZYNG Cryptographic Compliance Vault"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <svg
        viewBox="0 0 120 100"
        className="w-full h-full overflow-visible transition-all duration-300"
        style={{
          filter: isHovered
            ? 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 10px rgba(245, 158, 11, 0.3))'
            : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25))'
        }}
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
          opacity="0.45"
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
  );
};
