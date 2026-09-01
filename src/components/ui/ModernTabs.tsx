'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface ModernTabsProps<T extends string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  activeGlowColor?: string;
}

export function ModernTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  activeGlowColor = 'bg-gradient-to-r from-cyan-500 to-indigo-600'
}: ModernTabsProps<T>) {
  return (
    <div className={`relative flex items-center p-1.5 rounded-xl bg-zinc-950/80 border border-white/10 backdrop-blur-md ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-medium transition-colors duration-200 cursor-pointer select-none rounded-lg ${
              isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.icon && <span className="text-base">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {tab.badge}
              </span>
            )}

            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className={`absolute inset-0 -z-10 rounded-lg shadow-lg ${activeGlowColor}`}
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
