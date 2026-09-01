'use client';

import React from 'react';
import { ClientDashboard } from '@/components/client/ClientDashboard';
import { ParticleField } from '@/components/ui/ParticleField';

export default function ClientPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#fafafa] text-zinc-900">
      <ParticleField />
      <div className="relative z-10">
        <ClientDashboard />
      </div>
    </div>
  );
}
