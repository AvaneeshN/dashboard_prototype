'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  GraduationCap, 
  BookOpenCheck, 
  UserCheck, 
  Award, 
  Building2, 
  FileEdit, 
  BadgeIndianRupee,
  TrendingUp,
  MapPin,
  Users2,
  Filter,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

export const AdminVisualAnalytics: React.FC = () => {
  const { submissions } = useStore();

  // Selected client/establishment filter state ('all' or specific submission id)
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string>('all');

  // Filter out any internal system records from client intakes
  const allClientSubmissions = useMemo(() => {
    return submissions.filter(s => 
      s.id !== 'system_admin_config' && 
      s.id !== 'system_intake_config' && 
      s.client_id !== 'system-admin' &&
      s.company_name !== 'Platform Organization'
    );
  }, [submissions]);

  // Client/Establishment options for the dropdown filter
  const establishmentOptions = useMemo(() => {
    return allClientSubmissions.map(sub => {
      const name = sub.company_name || sub.client_name || 'Unnamed Establishment';
      const code = sub.establishment_details?.pan || sub.responses?.establishmentCode || sub.naps_portal_id || '';
      return {
        id: sub.id,
        name,
        code,
        candidateCount: (sub.candidates || []).length
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allClientSubmissions]);

  // Active client submissions based on the selected filter
  const clientSubmissions = useMemo(() => {
    if (selectedEstablishmentFilter === 'all') {
      return allClientSubmissions;
    }
    return allClientSubmissions.filter(s => s.id === selectedEstablishmentFilter);
  }, [allClientSubmissions, selectedEstablishmentFilter]);

  // Compute live real metrics from database
  const liveStats = useMemo(() => {
    let totalCandidates = 0;
    let ongoingCandidates = 0;
    let completedCandidates = 0;
    let assessedCandidates = 0;
    let certifiedCandidates = 0;
    let totalDbtDisbursed = 0;

    // Gender breakdown
    let optionalFemale = 0;
    let optionalMale = 0;
    let optionalOthers = 0;
    let designatedFemale = 0;
    let designatedMale = 0;
    let designatedOthers = 0;

    // State wise distribution: state -> { designated: number, optional: number }
    const stateMap: Record<string, { designated: number; optional: number }> = {};

    // Count distinct client establishments
    const uniqueEstCodes = new Set<string>();
    clientSubmissions.forEach(sub => {
      const estCode = sub.establishment_details?.pan || sub.establishment_details?.gstin || sub.company_name;
      if (estCode) uniqueEstCodes.add(estCode);

      // Process candidates
      (sub.candidates || []).forEach(cand => {
        totalCandidates++;

        if (cand.status === 'Completed') {
          completedCandidates++;
        } else if (cand.status === 'Active' || cand.status === 'Under Training' || !cand.status) {
          ongoingCandidates++;
        }

        if (cand.assessmentStatus === 'Assessed' || cand.status === 'Completed') {
          assessedCandidates++;
        }

        if (cand.certificationStatus === 'Certified' || (cand.contractCode && cand.status === 'Completed')) {
          certifiedCandidates++;
        }

        const isDesignated = cand.tradeType === 'designated' || (cand.tradeOrRole && cand.tradeOrRole.toLowerCase().includes('designated'));
        const gen = (cand.gender || '').toLowerCase();

        if (isDesignated) {
          if (gen === 'female' || gen === 'f') designatedFemale++;
          else if (gen === 'male' || gen === 'm') designatedMale++;
          else designatedOthers++;
        } else {
          if (gen === 'female' || gen === 'f') optionalFemale++;
          else if (gen === 'male' || gen === 'm') optionalMale++;
          else optionalOthers++;
        }

        // Geographical State
        const rawState = cand.ojtState || sub.establishment_details?.state || 'Karnataka';
        const normState = rawState.trim();
        if (!stateMap[normState]) {
          stateMap[normState] = { designated: 0, optional: 0 };
        }
        if (isDesignated) {
          stateMap[normState].designated++;
        } else {
          stateMap[normState].optional++;
        }
      });

      // Process NAPS records
      (sub.naps_records || []).forEach(naps => {
        if (naps.dbtStatus === 'PAID' || naps.paymentStatus === 'PAID') {
          totalDbtDisbursed += (Number(naps.amount) || 0);
        }

        const isDesig = naps.contractType === 'designated';
        const st = naps.ojtState || 'Karnataka';
        if (!stateMap[st]) {
          stateMap[st] = { designated: 0, optional: 0 };
        }
        if (isDesig) stateMap[st].designated++;
        else stateMap[st].optional++;
      });

      // Process claims
      (sub.dbt_claims || []).forEach(claim => {
        if (claim.status === 'Settled via PFMS' || claim.amountSettled) {
          totalDbtDisbursed += (claim.amountSettled || claim.amountClaimed || 0);
        }
      });
    });

    const establishmentsCount = Math.max(uniqueEstCodes.size, clientSubmissions.length);

    return {
      totalCandidates,
      ongoingCandidates,
      completedCandidates,
      assessedCandidates,
      certifiedCandidates,
      establishmentsCount,
      totalDbtDisbursed,
      optionalFemale,
      optionalMale,
      optionalOthers,
      designatedFemale,
      designatedMale,
      designatedOthers,
      stateMap
    };
  }, [clientSubmissions]);

  // Formatted live display values directly from database
  const displayNumbers = useMemo(() => {
    const liveDbtFormatted = liveStats.totalDbtDisbursed >= 10000000 
      ? `${(liveStats.totalDbtDisbursed / 10000000).toFixed(2)} Cr`
      : liveStats.totalDbtDisbursed >= 100000 
      ? `${(liveStats.totalDbtDisbursed / 100000).toFixed(2)} L`
      : `₹${liveStats.totalDbtDisbursed.toLocaleString('en-IN')}`;

    return {
      engaged: (liveStats.totalCandidates || 0).toLocaleString('en-IN'),
      completed: (liveStats.completedCandidates || 0).toLocaleString('en-IN'),
      assessed: (liveStats.assessedCandidates || 0).toLocaleString('en-IN'),
      certified: (liveStats.certifiedCandidates || 0).toLocaleString('en-IN'),
      establishments: (liveStats.establishmentsCount || 0).toLocaleString('en-IN'),
      ongoing: (liveStats.ongoingCandidates || 0).toLocaleString('en-IN'),
      dbtPaid: liveDbtFormatted
    };
  }, [liveStats]);

  // Chart 1: Gender Data
  const genderChartData = useMemo(() => {
    return [
      {
        trade: 'Optional Trades',
        female: liveStats.optionalFemale,
        male: liveStats.optionalMale,
        others: liveStats.optionalOthers
      },
      {
        trade: 'Designated Trades',
        female: liveStats.designatedFemale,
        male: liveStats.designatedMale,
        others: liveStats.designatedOthers
      }
    ];
  }, [liveStats]);

  // Chart 3: Geographical Ranking Data
  const geoChartData = useMemo(() => {
    const stateKeys = Object.keys(liveStats.stateMap);
    if (stateKeys.length > 0) {
      return stateKeys.map(s => ({
        state: s,
        designated: liveStats.stateMap[s]?.designated || 0,
        optional: liveStats.stateMap[s]?.optional || 0
      })).sort((a, b) => (b.designated + b.optional) - (a.designated + a.optional));
    }
    return [];
  }, [liveStats]);

  // Current formatted date (e.g. 12/09/2026)
  const currentDateFormatted = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, []);

  // 7 Hexagonal Badges Configuration
  const hexagonalCards = [
    {
      id: 'engaged',
      label: 'Apprentices Engaged',
      value: displayNumbers.engaged,
      icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
      color: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.12)'
    },
    {
      id: 'completed',
      label: 'Apprentices Completed',
      value: displayNumbers.completed,
      icon: <BookOpenCheck className="w-5 h-5 text-orange-600" />,
      color: '#f97316',
      bgGlow: 'rgba(249, 115, 22, 0.12)'
    },
    {
      id: 'assessed',
      label: 'Apprentices Assessed',
      value: displayNumbers.assessed,
      icon: <UserCheck className="w-5 h-5 text-slate-600" />,
      color: '#64748b',
      bgGlow: 'rgba(100, 116, 139, 0.12)'
    },
    {
      id: 'certified',
      label: 'Apprentices Certified',
      value: displayNumbers.certified,
      icon: <Award className="w-5 h-5 text-red-500" />,
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.12)'
    },
    {
      id: 'establishments',
      label: 'Establishments Engaged',
      value: displayNumbers.establishments,
      icon: <Building2 className="w-5 h-5 text-lime-600" />,
      color: '#84cc16',
      bgGlow: 'rgba(132, 204, 22, 0.12)'
    },
    {
      id: 'ongoing',
      label: 'Apprentices Ongoing as on Date',
      value: displayNumbers.ongoing,
      icon: <FileEdit className="w-5 h-5 text-fuchsia-600" />,
      color: '#d946ef',
      bgGlow: 'rgba(217, 70, 239, 0.12)'
    },
    {
      id: 'dbt_paid',
      label: `DBT Paid as on ${currentDateFormatted}`,
      value: displayNumbers.dbtPaid,
      icon: <BadgeIndianRupee className="w-5 h-5 text-emerald-600" />,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)'
    }
  ];

  return (
    <div className="space-y-7 font-sans text-zinc-900">
      
      {/* Top Title, Client/Establishment Filter & Indicator Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-zinc-800" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
              Live Apprenticeship & DBT Telemetry
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Dynamic operational overview aggregated from client registrations, candidate rosters, and DBT payouts.
            </p>
          </div>
        </div>

        {/* Filter Controls & Live Database Badge */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          {/* Client / Establishment Filter Selector */}
          <div className="flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-zinc-50 border border-zinc-200">
            <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-[11px] font-bold text-zinc-600 uppercase font-mono">Establishment:</span>
            <select
              value={selectedEstablishmentFilter}
              onChange={(e) => setSelectedEstablishmentFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-semibold focus:outline-none focus:border-black cursor-pointer shadow-2xs max-w-[220px] sm:max-w-[280px] truncate"
            >
              <option value="all">All Establishments ({allClientSubmissions.length})</option>
              {establishmentOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} {opt.code ? `(${opt.code})` : ''} — {opt.candidateCount} candidate{opt.candidateCount === 1 ? '' : 's'}
                </option>
              ))}
            </select>

            {selectedEstablishmentFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedEstablishmentFilter('all')}
                className="p-1 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                title="Reset to all establishments"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Filter Scope Indicator Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold font-mono text-emerald-800">
              {selectedEstablishmentFilter === 'all' 
                ? `All Intakes (${clientSubmissions.length})` 
                : `${clientSubmissions[0]?.company_name || 'Selected Client'} (${liveStats.totalCandidates} apprentices)`}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: 7 Hexagonal / Geometric Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {hexagonalCards.map((card) => {
          return (
            <div
              key={card.id}
              className="relative flex flex-col items-center justify-center p-5 rounded-3xl bg-white border transition-all duration-200 hover:-translate-y-0.5 shadow-sm group"
              style={{
                borderColor: `${card.color}40`,
                boxShadow: `0 4px 20px -2px ${card.bgGlow}`
              }}
            >
              {/* Subtle accent corner glow */}
              <div 
                className="absolute top-0 inset-x-0 h-1.5 rounded-t-3xl opacity-85"
                style={{ backgroundColor: card.color }}
              />

              {/* Icon Container */}
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 border"
                style={{ 
                  backgroundColor: `${card.color}15`,
                  borderColor: `${card.color}35`
                }}
              >
                {card.icon}
              </div>

              {/* Metric Value */}
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-zinc-950 text-center leading-tight">
                {card.value}
              </div>

              {/* Metric Label */}
              <div className="text-[11px] font-semibold text-zinc-500 text-center mt-1.5 leading-snug">
                {card.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: Gender Breakdown & Social Category (2 Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Apprentices Engaged By Gender */}
        <GlassCard className="p-6 bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                  Apprentices Engaged By Gender
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                Distribution across Optional vs Designated trades by gender
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-bold">
              Gender Split
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderChartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <XAxis 
                  dataKey="trade" 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e4e4e7' }} 
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#e4e4e7' }} 
                  tickFormatter={(val) => val >= 100000 ? `${(val/100000).toFixed(0)}L` : val}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e4e4e7', 
                    borderRadius: '12px', 
                    color: '#09090b', 
                    fontSize: '11px', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
                  }}
                  formatter={(value: any) => [Number(value).toLocaleString('en-IN'), '']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="female" name="Female" stackId="gender" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                <Bar dataKey="male" name="Male" stackId="gender" fill="#1e40af" radius={[0, 0, 0, 0]} />
                <Bar dataKey="others" name="Others" stackId="gender" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Chart B: Apprentices Engaged By Geographical Ranking */}
        <GlassCard className="p-6 bg-white border border-zinc-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-fuchsia-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                  Apprentices Engaged By Geographical Ranking
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                State-wise training density: Designated vs. Optional trades
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-900" />
                <span>Designated</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                <span>Optional</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {geoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={geoChartData} margin={{ top: 15, right: 10, left: 10, bottom: 25 }}>
                  <XAxis 
                    dataKey="state" 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e4e4e7' }} 
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e4e4e7' }} 
                    tickFormatter={(val) => val >= 100000 ? `${(val/100000).toFixed(0)}L` : val}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e4e4e7', 
                      borderRadius: '12px', 
                      color: '#09090b', 
                      fontSize: '11px', 
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)' 
                    }}
                    formatter={(value: any) => [Number(value).toLocaleString('en-IN'), 'Apprentices']}
                  />
                  <Bar dataKey="designated" name="Designated" fill="#581c87" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="optional" name="Optional" fill="#db2777" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-mono">
                No geographical candidate distribution data logged yet
              </div>
            )}
          </div>
        </GlassCard>

      </div>

    </div>
  );
};
