'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = true,
  glowColor,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.15 } } : undefined}
      className={`relative rounded-2xl bg-white border border-zinc-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-200 ${
        hoverEffect ? 'hover:border-zinc-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
