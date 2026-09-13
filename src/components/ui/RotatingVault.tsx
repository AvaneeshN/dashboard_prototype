'use client';

import React, { useState } from 'react';

interface RotatingVaultProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RotatingVault: React.FC<RotatingVaultProps> = ({
  size = 'md',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Precision mechanical dimensions
  const dimensions = {
    sm: { width: 64, height: 53 },
    md: { width: 80, height: 66 },
    lg: { width: 96, height: 80 }
  }[size];

  // 17 perimeter locking lugs (162°, 180°, 198° covered by the left hinge bracket)
  const boltAngles = [0, 18, 36, 54, 72, 90, 108, 126, 144, 216, 234, 252, 270, 288, 306, 324, 342];

  // 12 radial sectors for authentic anisotropic circular brushed stainless steel sheen
  const sectorColors = [
    '#384654', '#273441', '#4a5b6c', '#313f4d',
    '#222d38', '#455565', '#2c3946', '#3d4d5d',
    '#25323e', '#4e6072', '#2a3745', '#354351'
  ];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-300 hover:scale-105 ${className}`}
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
            ? 'drop-shadow(0 6px 16px rgba(15, 23, 42, 0.35)) drop-shadow(0 0 10px rgba(245, 158, 11, 0.3))'
            : 'drop-shadow(0 4px 12px rgba(15, 23, 42, 0.22)) drop-shadow(0 1px 3px rgba(15, 23, 42, 0.15))'
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Blur for Cast Shadows */}
          <filter id="vaultBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>

          {/* Outer Casing Steel Gradient */}
          <linearGradient id="vaultOuterBezel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="25%" stopColor="#334155" />
            <stop offset="55%" stopColor="#1e293b" />
            <stop offset="85%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Recessed Bolt Channel Trench */}
          <linearGradient id="vaultBoltChannel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          {/* Inner Stepped Bezel Lip */}
          <linearGradient id="vaultInnerBezelLip" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="35%" stopColor="#475569" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Precision Machined Bolt Stud Gradient */}
          <radialGradient id="vaultStud" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#e2e8f0" />
            <stop offset="65%" stopColor="#64748b" />
            <stop offset="90%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Hinge Pin Cylindrical Light Stripe Gradient */}
          <linearGradient id="vaultPinSteel" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="18%" stopColor="#475569" />
            <stop offset="32%" stopColor="#f1f5f9" />
            <stop offset="52%" stopColor="#94a3b8" />
            <stop offset="78%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Hinge Bracket Solid Steel Arm Gradient */}
          <linearGradient id="vaultHingePlate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="30%" stopColor="#334155" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* 6-Spoke Tubular Wheel Rim Gradient */}
          <linearGradient id="vaultWheelRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="60%" stopColor="#64748b" />
            <stop offset="85%" stopColor="#334155" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Spoke Rod Gradient */}
          <linearGradient id="vaultSpoke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Wheel Hub Outer Collar Gradient */}
          <radialGradient id="vaultHubOuter" cx="38%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#cbd5e1" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>

          {/* Wheel Hub Inner Boss Gradient */}
          <radialGradient id="vaultHubInner" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
        </defs>

        {/* ---------------------------------------------------- */}
        {/* LAYER 1: Circular Outer Flange / Bezel */}
        {/* ---------------------------------------------------- */}
        <circle
          cx="68"
          cy="50"
          r="42"
          fill="url(#vaultOuterBezel)"
          stroke="#090d16"
          strokeWidth="0.9"
        />
        {/* Outer Chamfer Edge Highlight */}
        <circle
          cx="68"
          cy="50"
          r="41.2"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.6"
          opacity="0.65"
        />
        {/* Subtle Gold Hairline Accent for Theme Cohesion */}
        <circle
          cx="68"
          cy="50"
          r="41.7"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="0.4"
          opacity="0.35"
        />

        {/* Recessed Bolt Channel (Sunken Ring Groove) */}
        <circle
          cx="68"
          cy="50"
          r="39"
          fill="url(#vaultBoltChannel)"
          stroke="#090d16"
          strokeWidth="0.6"
        />
        {/* Subtle Channel Center Inset Guide */}
        <circle
          cx="68"
          cy="50"
          r="36.5"
          fill="none"
          stroke="#090d16"
          strokeWidth="0.5"
          opacity="0.8"
        />

        {/* ---------------------------------------------------- */}
        {/* LAYER 2: 17 Precision Machined Locking Studs / Bolts */}
        {/* ---------------------------------------------------- */}
        {boltAngles.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const bx = +(68 + 36.5 * Math.cos(rad)).toFixed(2);
          const by = +(50 + 36.5 * Math.sin(rad)).toFixed(2);
          return (
            <g key={angle}>
              {/* Stud Base Counter-bore Shadow */}
              <circle
                cx={bx}
                cy={by}
                r="2.0"
                fill="#090d16"
                opacity="0.95"
              />
              {/* Machined Metallic Stud Body */}
              <circle
                cx={bx}
                cy={by}
                r="1.7"
                fill="url(#vaultStud)"
              />
              {/* Micro Specular Highlight Glint */}
              <circle
                cx={+bx - 0.45}
                cy={+by - 0.45}
                r="0.5"
                fill="#ffffff"
                opacity="0.9"
              />
            </g>
          );
        })}

        {/* ---------------------------------------------------- */}
        {/* LAYER 3: Stepped Inner Bezel Lip */}
        {/* ---------------------------------------------------- */}
        <circle
          cx="68"
          cy="50"
          r="31.5"
          fill="none"
          stroke="url(#vaultInnerBezelLip)"
          strokeWidth="1.2"
        />
        <circle
          cx="68"
          cy="50"
          r="30.5"
          fill="none"
          stroke="#090d16"
          strokeWidth="0.8"
        />

        {/* ---------------------------------------------------- */}
        {/* LAYER 4: Recessed Faceted Door Face (12 Anisotropic Wedges) */}
        {/* ---------------------------------------------------- */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((idx) => {
          const a1 = (idx * 30 * Math.PI) / 180;
          const a2 = ((idx + 1) * 30 * Math.PI) / 180;
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

        {/* Recessed Door Top Ambient Occlusion Drop Shadow */}
        <path
          d="M 37.5 50 A 30.5 30.5 0 0 1 98.5 50 Z"
          fill="#050a12"
          opacity="0.22"
        />
        {/* Concentric Machined Steel Lathe Grooves */}
        <circle
          cx="68"
          cy="50"
          r="22"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.3"
          opacity="0.12"
        />
        <circle
          cx="68"
          cy="50"
          r="16"
          fill="none"
          stroke="#090d16"
          strokeWidth="0.4"
          opacity="0.25"
        />

        {/* ---------------------------------------------------- */}
        {/* LAYER 5: Left Industrial Hinge Assembly */}
        {/* ---------------------------------------------------- */}
        {/* Cast Shadow under Hinge Plate onto Circular Door */}
        <rect
          x="10"
          y="36.5"
          width="25"
          height="29"
          rx="3.5"
          fill="#050a12"
          opacity="0.45"
          filter="url(#vaultBlur)"
        />

        {/* Solid Machined Steel Hinge Bracket Arm */}
        <rect
          x="9.5"
          y="35.5"
          width="24.5"
          height="29"
          rx="3.5"
          fill="url(#vaultHingePlate)"
          stroke="#090d16"
          strokeWidth="0.8"
        />
        {/* Top Chamfer Edge Highlight */}
        <line
          x1="12"
          y1="36.2"
          x2="32.5"
          y2="36.2"
          stroke="#cbd5e1"
          strokeWidth="0.75"
          strokeLinecap="round"
        />
        {/* Bottom Shadow Groove */}
        <line
          x1="12"
          y1="63.8"
          x2="32.5"
          y2="63.8"
          stroke="#090d16"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        {/* Right Mating Seam Line */}
        <line
          x1="33.2"
          y1="38"
          x2="33.2"
          y2="62"
          stroke="#1e293b"
          strokeWidth="0.7"
        />

        {/* Recessed Socket-Head Fasteners on Bracket */}
        <g>
          {/* Upper Fastener */}
          <circle cx="15.5" cy="43" r="1.9" fill="#090d16" />
          <circle cx="15.5" cy="43" r="1.4" fill="url(#vaultStud)" />
          <circle cx="15.5" cy="43" r="0.7" fill="#090d16" />

          {/* Lower Fastener */}
          <circle cx="15.5" cy="57" r="1.9" fill="#090d16" />
          <circle cx="15.5" cy="57" r="1.4" fill="url(#vaultStud)" />
          <circle cx="15.5" cy="57" r="0.7" fill="#090d16" />
        </g>

        {/* Vertical Hinge Pin (Precision Ground Steel Shaft & Caps) */}
        {/* Top Stepped Cap */}
        <rect
          x="5.5"
          y="24"
          width="9"
          height="5.5"
          rx="2"
          fill="url(#vaultPinSteel)"
          stroke="#090d16"
          strokeWidth="0.7"
        />
        {/* Top Collar Ring */}
        <rect
          x="5"
          y="29.5"
          width="10"
          height="2"
          rx="0.5"
          fill="url(#vaultPinSteel)"
          stroke="#090d16"
          strokeWidth="0.5"
        />
        {/* Main Pin Column */}
        <rect
          x="6.5"
          y="31.5"
          width="7"
          height="37"
          rx="1.2"
          fill="url(#vaultPinSteel)"
          stroke="#090d16"
          strokeWidth="0.7"
        />
        {/* Bottom Collar Ring */}
        <rect
          x="5"
          y="68.5"
          width="10"
          height="2"
          rx="0.5"
          fill="url(#vaultPinSteel)"
          stroke="#090d16"
          strokeWidth="0.5"
        />
        {/* Bottom Stepped Cap */}
        <rect
          x="5.5"
          y="70.5"
          width="9"
          height="5.5"
          rx="2"
          fill="url(#vaultPinSteel)"
          stroke="#090d16"
          strokeWidth="0.7"
        />
        {/* Vertical Specular Light Stripe Down the Hinge Pin */}
        <line
          x1="8.8"
          y1="25"
          x2="8.8"
          y2="75"
          stroke="#ffffff"
          strokeWidth="0.6"
          opacity="0.65"
          strokeLinecap="round"
        />

        {/* ---------------------------------------------------- */}
        {/* LAYER 6: Central Rotating 6-Spoke Wheel Handle */}
        {/* ---------------------------------------------------- */}
        <g
          className="animate-vault-wheel"
          style={{
            transformOrigin: '68px 50px',
            animationDuration: isHovered ? '7s' : '15s'
          }}
        >
          {/* Wheel Outer Tubular Rim */}
          <circle
            cx="68"
            cy="50"
            r="13.5"
            fill="none"
            stroke="url(#vaultWheelRim)"
            strokeWidth="2.3"
          />
          {/* Tubular Outer Specular Rim Highlight */}
          <circle
            cx="68"
            cy="50"
            r="14.4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.4"
            opacity="0.65"
          />
          {/* Tubular Inner Rim Shadow Line */}
          <circle
            cx="68"
            cy="50"
            r="12.3"
            fill="none"
            stroke="#090d16"
            strokeWidth="0.6"
            opacity="0.75"
          />

          {/* 6 Radial Spoke Cylindrical Rods with Handle Tips */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = +(68 + 3.6 * Math.cos(rad)).toFixed(2);
            const y1 = +(50 + 3.6 * Math.sin(rad)).toFixed(2);
            const x2 = +(68 + 14.8 * Math.cos(rad)).toFixed(2);
            const y2 = +(50 + 14.8 * Math.sin(rad)).toFixed(2);
            const hx = +(68 + 14.8 * Math.cos(rad)).toFixed(2);
            const hy = +(50 + 14.8 * Math.sin(rad)).toFixed(2);
            return (
              <g key={angle}>
                {/* Spoke Rod Body */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#vaultSpoke)"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                {/* Spoke Specular Core Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  opacity="0.75"
                  strokeLinecap="round"
                />
                {/* Outer Grip Handle Ball on Rim */}
                <circle
                  cx={hx}
                  cy={hy}
                  r="1.3"
                  fill="url(#vaultStud)"
                  stroke="#090d16"
                  strokeWidth="0.4"
                />
              </g>
            );
          })}

          {/* Wheel Central Hub Assembly (Stepped Industrial Boss) */}
          {/* Outer Hub Bezel */}
          <circle
            cx="68"
            cy="50"
            r="4.3"
            fill="url(#vaultHubOuter)"
            stroke="#090d16"
            strokeWidth="0.7"
          />
          {/* Hub Bevel Edge Highlight */}
          <circle
            cx="68"
            cy="50"
            r="3.9"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.4"
            opacity="0.8"
          />
          {/* Inner Recessed Hub Boss */}
          <circle
            cx="68"
            cy="50"
            r="2.5"
            fill="url(#vaultHubInner)"
            stroke="#090d16"
            strokeWidth="0.5"
          />
          {/* Center Axis Cap */}
          <circle
            cx="68"
            cy="50"
            r="1.1"
            fill="#cbd5e1"
            stroke="#090d16"
            strokeWidth="0.4"
          />
          {/* Axis Micro Pin */}
          <circle
            cx="68"
            cy="50"
            r="0.4"
            fill="#090d16"
          />
        </g>
      </svg>
    </div>
  );
};
