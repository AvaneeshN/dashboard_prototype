'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Shield, User, LogOut, ArrowUpRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export const Navbar: React.FC = () => {
  const { user, logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // On landing/login page (`/`), render company navy blue header
  if (pathname === '/') {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-[#1e3a5f] bg-[#0a192f] text-white shadow-md font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#112240] border border-amber-400/40 flex items-center justify-center text-amber-300 font-serif font-bold text-xs shadow-xs tracking-tighter">
              W
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-white leading-none">
                WorkForce2047
              </div>
              <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                Compliance Management Portal
              </div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-300 hidden sm:block">
            Apprenticeship Act, 1961 Gateway
          </div>
        </div>
      </header>
    );
  }

  // If not logged in and on protected routes, return null
  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1e3a5f] bg-[#0a192f] text-white shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href={user.role === 'admin' ? '/admin' : '/client'} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#112240] border border-amber-400/40 flex items-center justify-center text-amber-300 font-serif font-bold text-xs shadow-xs tracking-tighter transition-transform group-hover:scale-105">
            W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">
                WorkForce2047
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#112240] text-amber-300 border border-amber-400/30">
                {user.role === 'admin' ? 'Administration' : 'Client Portal'}
              </span>
            </div>
          </div>
        </Link>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            
            {/* User Profile Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#112240] border border-[#1e3a5f]">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                {user.company_name?.charAt(0) || user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-white font-semibold hidden sm:inline truncate max-w-xs">
                {user.company_name ? `${user.company_name} (${user.full_name})` : (user.full_name || user.email)}
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-[#0a192f] text-slate-300 border border-[#1e3a5f]">
                {user.role}
              </span>
            </div>

            {/* Pill Log Out Button */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#0a192f] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <span>LOG OUT</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
