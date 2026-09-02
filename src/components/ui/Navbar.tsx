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

  // On landing/login page (`/`), always render clean header without session pills
  if (pathname === '/') {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">✦</span>
            <span className="font-extrabold text-base tracking-tight text-black">
              Console
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            Secure Authentication Gateway
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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href={user.role === 'admin' ? '/admin' : '/client'} className="flex items-center gap-2 group">
          <span className="text-base leading-none">✦</span>
          <span className="font-extrabold text-base tracking-tight text-black">
            Console
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 ml-1">
            {user.role === 'admin' ? 'Administration' : 'Client Portal'}
          </span>
        </Link>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            
            {/* User Profile Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200">
              <div className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                {user.company_name?.charAt(0) || user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-zinc-800 font-semibold hidden sm:inline truncate max-w-xs">
                {user.company_name ? `${user.company_name} (${user.full_name})` : (user.full_name || user.email)}
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-white text-zinc-600 border border-zinc-200">
                {user.role}
              </span>
            </div>

            {/* Pill Log Out Button */}
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
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
