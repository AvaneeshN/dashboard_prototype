'use client';

import React, { useEffect } from 'react';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { ParticleField } from '@/components/ui/ParticleField';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight } from 'lucide-react';

export default function ClientPage() {
  const { user, isLoading } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'client')) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-xs font-mono text-zinc-400">
        Loading client workspace...
      </div>
    );
  }

  if (!user || user.role !== 'client') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-zinc-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-zinc-900">
            Client Authentication Required
          </h2>
          <p className="text-xs text-zinc-500">
            Please sign in with your enterprise client credentials to access your intake and quota dashboard.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Return to Login Gateway</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#fafafa] text-zinc-900 font-sans">
      <ParticleField />
      <div className="relative z-10">
        <ClientDashboard />
      </div>
    </div>
  );
}
