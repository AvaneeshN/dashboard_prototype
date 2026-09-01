'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Shield, User, LogOut, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export const Navbar: React.FC = () => {
  const { user, logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  // On login screen (root `/`) and not logged in, keep top clean
  if (pathname === '/' && !user) {
    return null;
  }

  const handleSwitchToAdmin = () => {
    router.push('/admin');
  };

  const handleSwitchToClient = () => {
    router.push('/client');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Clean Logo without Devlab or badges */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-base leading-none">✦</span>
          <span className="font-extrabold text-base tracking-tight text-black">
            Console
          </span>
        </Link>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-3">
          
          {/* User Logged In Actions */}
          {user && (
            <div className="flex items-center gap-2.5">
              
              {/* Role View Toggle */}
              {user.role === 'client' ? (
                <button
                  onClick={handleSwitchToAdmin}
                  className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-all cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin View</span>
                </button>
              ) : (
                <button
                  onClick={handleSwitchToClient}
                  className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Client View</span>
                </button>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200">
                <div className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-zinc-800 font-semibold hidden sm:inline">
                  {user.full_name || user.email}
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
          )}

        </div>
      </div>
    </header>
  );
};
