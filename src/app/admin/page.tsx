'use client';

import React from 'react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ParticleField } from '@/components/ui/ParticleField';

export default function AdminPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#fafafa] text-zinc-900">
      <ParticleField />
      <div className="relative z-10">
        <AdminDashboard />
      </div>
    </div>
  );
}
