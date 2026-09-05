'use client';

import React, { useEffect, useRef } from 'react';

interface WaveLayer {
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  color: string;
  verticalOffset: number;
}

export const NavyWaveBackground: React.FC<{
  className?: string;
  intensity?: 'subtle' | 'standard';
}> = ({ className = '', intensity = 'standard' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const isSubtle = intensity === 'subtle';
    const waves: WaveLayer[] = [
      {
        amplitude: isSubtle ? 14 : 28,
        frequency: 0.0022,
        speed: 0.008,
        phase: 0,
        color: isSubtle ? 'rgba(10, 25, 47, 0.03)' : 'rgba(10, 25, 47, 0.07)',
        verticalOffset: isSubtle ? 0.92 : 0.72
      },
      {
        amplitude: isSubtle ? 16 : 36,
        frequency: 0.0016,
        speed: -0.006,
        phase: 2,
        color: isSubtle ? 'rgba(15, 39, 68, 0.035)' : 'rgba(15, 39, 68, 0.09)',
        verticalOffset: isSubtle ? 0.94 : 0.78
      },
      {
        amplitude: isSubtle ? 14 : 32,
        frequency: 0.0028,
        speed: 0.011,
        phase: 4,
        color: isSubtle ? 'rgba(22, 59, 101, 0.04)' : 'rgba(22, 59, 101, 0.11)',
        verticalOffset: isSubtle ? 0.96 : 0.84
      },
      {
        amplitude: isSubtle ? 10 : 22,
        frequency: 0.0035,
        speed: -0.009,
        phase: 1,
        color: isSubtle ? 'rgba(10, 30, 58, 0.05)' : 'rgba(10, 30, 58, 0.14)',
        verticalOffset: isSubtle ? 0.97 : 0.90
      }
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      waves.forEach((w) => {
        w.phase += w.speed;
        const baseY = height * w.verticalOffset;

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, baseY);

        for (let x = 0; x <= width; x += 12) {
          const y =
            baseY +
            Math.sin(x * w.frequency + w.phase) * w.amplitude +
            Math.sin(x * (w.frequency * 0.5) + w.phase * 1.5) * (w.amplitude * 0.4);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = w.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
};
