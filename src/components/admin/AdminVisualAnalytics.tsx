'use client';

import React, { useMemo, useState } from 'react';
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
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const AdminVisualAnalytics: React.FC = () => {
  const { submissions } = useStore();
  const [dataViewMode, setDataViewMode] = useState<'live_delta' | 'national_benchmark'>('live_delta');

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

    // Social category distribution
    let socialCounts: Record<string, number> = {
      General: 0,
      OBC: 0,
      SC: 0,
      ST: 0,
      Minority: 0
    };

    // State wise distribution: state -> { designated: number, optional: number }
    const stateMap: Record<string, { designated: number; optional: number }> = {};

    // Count distinct client establishments
    const uniqueEstCodes = new Set<string>();
    submissions.forEach(sub => {
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

        // Social Category
        const cat = cand.socialCategory || 'General';
        if (socialCounts[cat] !== undefined) {
          socialCounts[cat]++;
        } else {
          socialCounts['General']++;
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

    const establishmentsCount = Math.max(uniqueEstCodes.size, submissions.length);

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
      socialCounts,
      stateMap
    };
  }, [submissions]);

  // Scaled dynamic data blending live submissions with realistic national benchmarks
  const benchmarkBase = {
    engaged: 5580410,
    completed: 2941106,
    assessed: 977251,
    certified: 936593,
    establishments: 59108,
    ongoing: 1043317,
    dbtPaidCrores: 1570
  };

  // Formatted display values
  const displayNumbers = useMemo(() => {
    if (dataViewMode === 'live_delta') {
      // Direct live company values from database
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
        dbtPaid: liveDbtFormatted,
        isAggregated: false
      };
    } else {
      // Blended national benchmark + live additions
      const totalEng = benchmarkBase.engaged + liveStats.totalCandidates;
      const totalComp = benchmarkBase.completed + liveStats.completedCandidates;
      const totalAss = benchmarkBase.assessed + liveStats.assessedCandidates;
      const totalCert = benchmarkBase.certified + liveStats.certifiedCandidates;
      const totalEst = benchmarkBase.establishments + liveStats.establishmentsCount;
      const totalOng = benchmarkBase.ongoing + liveStats.ongoingCandidates;
      const totalDbtCr = benchmarkBase.dbtPaidCrores + Math.round((liveStats.totalDbtDisbursed / 10000000) * 10) / 10;

      return {
        engaged: totalEng.toLocaleString('en-IN'),
        completed: totalComp.toLocaleString('en-IN'),
        assessed: totalAss.toLocaleString('en-IN'),
        certified: totalCert.toLocaleString('en-IN'),
        establishments: totalEst.toLocaleString('en-IN'),
        ongoing: totalOng.toLocaleString('en-IN'),
        dbtPaid: `${totalDbtCr.toLocaleString('en-IN')} Cr`,
        isAggregated: true
      };
    }
  }, [dataViewMode, liveStats, benchmarkBase]);

  // Chart 1: Gender Data
  const genderChartData = useMemo(() => {
    if (dataViewMode === 'live_delta' && (liveStats.totalCandidates > 0)) {
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
    }
    // Baseline + delta
    return [
      {
        trade: 'Optional Trades',
        female: 1028747 + liveStats.optionalFemale,
        male: 3000000 + liveStats.optionalMale,
        others: 14230 + liveStats.optionalOthers
      },
      {
        trade: 'Designated Trades',
        female: 251612 + liveStats.designatedFemale,
        male: 1300000 + liveStats.designatedMale,
        others: 8420 + liveStats.designatedOthers
      }
    ];
  }, [dataViewMode, liveStats]);

  // Chart 2: Social Category Data
  const socialChartData = useMemo(() => {
    const totalLiveSocial = Object.values(liveStats.socialCounts).reduce((a, b) => a + b, 0);

    if (dataViewMode === 'live_delta' && totalLiveSocial > 0) {
      return [
        { name: 'General', value: liveStats.socialCounts.General || 0, color: '#3b82f6' },
        { name: 'OBC', value: liveStats.socialCounts.OBC || 0, color: '#1e3a8a' },
        { name: 'SC', value: liveStats.socialCounts.SC || 0, color: '#ea580c' },
        { name: 'ST', value: liveStats.socialCounts.ST || 0, color: '#7e22ce' },
        { name: 'Minority', value: liveStats.socialCounts.Minority || 0, color: '#ec4899' }
      ].filter(item => item.value > 0);
    }

    // National benchmark proportions + live delta
    return [
      { name: 'General', value: 2954371 + (liveStats.socialCounts.General || 0), color: '#3b82f6' },
      { name: 'OBC', value: 1659896 + (liveStats.socialCounts.OBC || 0), color: '#1e3a8a' },
      { name: 'SC', value: 684835 + (liveStats.socialCounts.SC || 0), color: '#ea580c' },
      { name: 'ST', value: 263663 + (liveStats.socialCounts.ST || 0), color: '#7e22ce' },
      { name: 'Minority', value: 17445 + (liveStats.socialCounts.Minority || 0), color: '#ec4899' }
    ];
  }, [dataViewMode, liveStats]);

  // Chart 3: Geographical Ranking Data
  const geoChartData = useMemo(() => {
    const benchmarkStates = [
      { state: 'Maharashtra', designated: 317905, optional: 1094150 },
      { state: 'Gujarat', designated: 276712, optional: 316574 },
      { state: 'Tamil Nadu', designated: 64106, optional: 506781 },
      { state: 'Karnataka', designated: 88181, optional: 387674 },
      { state: 'Uttar Pradesh', designated: 142164, optional: 291427 },
      { state: 'Haryana', designated: 164979, optional: 260792 },
      { state: 'Telangana', designated: 67488, optional: 170729 },
      { state: 'West Bengal', designated: 30631, optional: 135371 },
      { state: 'Madhya Pradesh', designated: 53770, optional: 104157 },
      { state: 'Delhi', designated: 25008, optional: 114604 },
      { state: 'Andhra Pradesh', designated: 30901, optional: 91842 },
      { state: 'Rajasthan', designated: 37077, optional: 85511 },
      { state: 'Uttarakhand', designated: 23868, optional: 98081 },
      { state: 'Punjab', designated: 28777, optional: 73168 }
    ];

    if (dataViewMode === 'live_delta') {
      const stateKeys = Object.keys(liveStats.stateMap);
      if (stateKeys.length > 0) {
        return stateKeys.map(s => ({
          state: s,
          designated: liveStats.stateMap[s]?.designated || 0,
          optional: liveStats.stateMap[s]?.optional || 0
        })).sort((a, b) => (b.designated + b.optional) - (a.designated + a.optional));
      }
    }

    // Benchmark + Live Delta
    return benchmarkStates.map(item => {
      const liveState = liveStats.stateMap[item.state] || { designated: 0, optional: 0 };
      return {
        state: item.state,
        designated: item.designated + liveState.designated,
        optional: item.optional + liveState.optional
      };
    });
  }, [dataViewMode, liveStats]);

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
      
      {/* Top Title & View Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-zinc-800" />
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

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-100 border border-zinc-200 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setDataViewMode('live_delta')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              dataViewMode === 'live_delta' 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Live Database ({submissions.length} Intakes)
          </button>
          <button
            type="button"
            onClick={() => setDataViewMode('national_benchmark')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              dataViewMode === 'national_benchmark' 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            National Scaled Overview
          </button>
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

        {/* Chart B: Apprentices Engaged By Social Category */}
        <GlassCard className="p-6 bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                  Apprentices Engaged By Social Category
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                Demographic affirmative compliance breakdown
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-bold">
              Reservation Groups
            </span>
          </div>

          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={socialChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(1) : '0'}%`}
                  labelLine={false}
                >
                  {socialChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
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
                <Legend 
                  verticalAlign="bottom" 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* SECTION 3: Apprentices Engaged By Geographical Ranking */}
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
              State-wise apprentice training density comparing Designated vs. Optional training trades
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

        <div className="h-72 w-full">
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
        </div>
      </GlassCard>

    </div>
  );
};
