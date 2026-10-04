'use client';

import React, { useState } from 'react';

export interface ArcReactorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  size = 'md',
  className = '',
  title
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Circular dimensions matching header bar proportions
  const dimensions = {
    sm: { width: 52, height: 52 },
    md: { width: 70, height: 70 },
    lg: { width: 90, height: 90 }
  }[size];

  // 10 radial coil positions for the classic Iron Man Arc Reactor
  const coilAngles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];

  // 3 inner turbine spokes at 120°
  const turbineAngles = [0, 120, 240];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      {/* Outer ambient glow halo behind the reactor */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-500 pointer-events-none"
        style={{
          background: isHovered
            ? 'radial-gradient(circle, rgba(0, 240, 255, 0.45) 0%, rgba(14, 165, 233, 0.2) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(0, 240, 255, 0.28) 0%, rgba(14, 165, 233, 0.1) 50%, transparent 75%)',
          filter: isHovered ? 'blur(10px)' : 'blur(6px)',
          transform: isHovered ? 'scale(1.2)' : 'scale(1.05)'
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible transition-transform duration-300"
        style={{
          filter: isHovered
            ? 'drop-shadow(0 0 16px rgba(0, 240, 255, 0.85)) drop-shadow(0 0 28px rgba(14, 165, 233, 0.45))'
            : 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.55)) drop-shadow(0 0 18px rgba(14, 165, 233, 0.25))'
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Intense Glow Filter for Cyan Neon Lines */}
          <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="blur1" />
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Core Bloom Filter for White Hot Energy */}
          <filter id="arcCoreBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dark Titanium Housing Gradient */}
          <radialGradient id="reactorChassis" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#081426" />
            <stop offset="85%" stopColor="#050c18" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Outer Bezel Rim Metallic Gradient */}
          <linearGradient id="bezelMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.9" />
          </linearGradient>

          {/* Luminous Center Plasma Node Gradient */}
          <radialGradient id="plasmaNode" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#cffafe" />
            <stop offset="55%" stopColor="#00f0ff" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.2" />
          </radialGradient>

          {/* Coil Metallic Body Gradient */}
          <linearGradient id="coilBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="35%" stopColor="#334155" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Solenoid Wire Wrap Accent */}
          <linearGradient id="coilWire" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>

        {/* ── 1. MAIN CASING & BASE ── */}
        {/* Outer Dark Alloy Base */}
        <circle cx="50" cy="50" r="48" fill="url(#reactorChassis)" />
        <circle cx="50" cy="50" r="48" stroke="url(#bezelMetallic)" strokeWidth="1.2" />

        {/* Fine Outer Inset Groove */}
        <circle cx="50" cy="50" r="46.5" stroke="#00f0ff" strokeWidth="0.4" strokeOpacity="0.4" />

        {/* ── 2. OUTER TELEMETRY HUD RING (Slow Clockwise Spin) ── */}
        <g className="animate-arc-cw-slow" style={{ transformOrigin: '50px 50px' }}>
          {/* Segmented HUD Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#00f0ff"
            strokeWidth="0.75"
            strokeDasharray="18 10 4 8 26 12 6 8"
            strokeOpacity="0.8"
            filter="url(#arcGlow)"
          />
          {/* Outer Cardinal Markers */}
          <circle cx="50" cy="6" r="1" fill="#00f0ff" />
          <circle cx="94" cy="50" r="1" fill="#00f0ff" />
          <circle cx="50" cy="94" r="1" fill="#00f0ff" />
          <circle cx="6" cy="50" r="1" fill="#00f0ff" />
        </g>

        {/* ── 3. SECONDARY REVERSE TELEMETRY (Counter-Clockwise Spin) ── */}
        <g className="animate-arc-ccw-medium" style={{ transformOrigin: '50px 50px' }}>
          <circle
            cx="50"
            cy="50"
            r="41.5"
            stroke="#38bdf8"
            strokeWidth="0.5"
            strokeDasharray="3 5 7 5"
            strokeOpacity="0.6"
          />
          {/* Circular Orbiting Nodes */}
          <circle cx="50" cy="8.5" r="0.8" fill="#38bdf8" />
          <circle cx="50" cy="91.5" r="0.8" fill="#38bdf8" />
          <circle cx="8.5" cy="50" r="0.8" fill="#38bdf8" />
          <circle cx="91.5" cy="50" r="0.8" fill="#38bdf8" />
        </g>

        {/* ── 4. PRIMARY CONTINUOUS ENERGY CHANNEL (Glowing Blue Ring) ── */}
        <circle
          cx="50"
          cy="50"
          r="34"
          stroke="#00f0ff"
          strokeWidth="4.5"
          strokeOpacity="0.9"
          filter="url(#arcGlow)"
        />
        <circle
          cx="50"
          cy="50"
          r="34"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity="0.95"
        />

        {/* ── 5. THE 10 MAGNETIC POWER COILS (Classic Iron Man Solenoids) ── */}
        <g>
          {coilAngles.map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              {/* Outer Coil Bracket */}
              <rect
                x="46"
                y="11.5"
                width="8"
                height="9.5"
                rx="1"
                fill="url(#coilBody)"
                stroke="#0ea5e9"
                strokeWidth="0.6"
              />
              {/* Copper / Radiant Wire Windings */}
              <line x1="47" y1="13.5" x2="53" y2="13.5" stroke="url(#coilWire)" strokeWidth="0.9" />
              <line x1="47" y1="15.5" x2="53" y2="15.5" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="47" y1="17.5" x2="53" y2="17.5" stroke="url(#coilWire)" strokeWidth="0.9" />
              <line x1="47" y1="19.5" x2="53" y2="19.5" stroke="#00f0ff" strokeWidth="0.6" />
              {/* Central Coil Core Light Pin */}
              <circle cx="50" cy="16.2" r="0.9" fill="#ffffff" filter="url(#arcGlow)" />
            </g>
          ))}
        </g>

        {/* ── 6. INNER GEOMETRIC STABILIZER RING (Counter-Clockwise Spin) ── */}
        <g className="animate-arc-ccw-medium" style={{ transformOrigin: '50px 50px' }}>
          {/* Segmented Conduit Ring */}
          <circle
            cx="50"
            cy="50"
            r="26"
            stroke="#0284c7"
            strokeWidth="1.8"
            strokeDasharray="14 5 8 5"
            strokeOpacity="0.8"
          />
          <circle
            cx="50"
            cy="50"
            r="26"
            stroke="#00f0ff"
            strokeWidth="0.8"
            strokeDasharray="10 9"
            filter="url(#arcGlow)"
          />
          {/* Stepped Alignment Notches */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="23.5"
              x2="50"
              y2="28.5"
              stroke="#00f0ff"
              strokeWidth="0.9"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}
        </g>

        {/* ── 7. FAST ROTATING INNER TURBINE APERTURE (Clockwise Spin) ── */}
        <g className="animate-arc-cw-fast" style={{ transformOrigin: '50px 50px' }}>
          {/* Inner Telemetry Dashed Circle */}
          <circle
            cx="50"
            cy="50"
            r="19"
            stroke="#38bdf8"
            strokeWidth="0.7"
            strokeDasharray="6 3 2 3"
            strokeOpacity="0.9"
          />

          {/* 3 High-Energy Radial Turbine Blades */}
          {turbineAngles.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 50)`}>
              {/* Blade Energy Beam */}
              <line
                x1="50"
                y1="20"
                x2="50"
                y2="13"
                stroke="#00f0ff"
                strokeWidth="1.4"
                strokeLinecap="round"
                filter="url(#arcGlow)"
              />
              <line
                x1="50"
                y1="19"
                x2="50"
                y2="14"
                stroke="#ffffff"
                strokeWidth="0.7"
              />
              <polygon
                points="49,17 51,17 50,14"
                fill="#ffffff"
              />
            </g>
          ))}
        </g>

        {/* ── 8. CENTRAL PLASMA ENERGY CORE (Breathing Glow & Flare) ── */}
        <g className="animate-arc-pulse" style={{ transformOrigin: '50px 50px' }}>
          {/* Intense Outer Core Bloom Ring */}
          <circle
            cx="50"
            cy="50"
            r="13"
            fill="#0284c7"
            fillOpacity="0.3"
            stroke="#00f0ff"
            strokeWidth="1.2"
            filter="url(#arcGlow)"
          />

          {/* Concentric Energy Conduits */}
          <circle
            cx="50"
            cy="50"
            r="9.5"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeDasharray="4 2"
            strokeOpacity="0.9"
          />

          {/* Glowing Palladium Center Disc */}
          <circle
            cx="50"
            cy="50"
            r="7"
            fill="url(#plasmaNode)"
            filter="url(#arcCoreBloom)"
          />

          {/* Blinding White Core Flash */}
          <circle
            cx="50"
            cy="50"
            r="3.5"
            fill="#ffffff"
          />

          {/* Central Target Micro-Crosshair */}
          <line x1="48" y1="50" x2="52" y2="50" stroke="#00f0ff" strokeWidth="0.5" strokeOpacity="0.8" />
          <line x1="50" y1="48" x2="50" y2="52" stroke="#00f0ff" strokeWidth="0.5" strokeOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
};

// Backwards-compatible alias so existing imports also resolve to the Arc Reactor
export const RotatingVault = ArcReactor;
