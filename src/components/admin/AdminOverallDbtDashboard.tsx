'use client';

import React, { useState, useMemo } from 'react';
import { FormSubmission, ApprenticeRecord, NAPSPortalRecord } from '@/types';
import { generateAutoContinuedDbtRecords } from '@/lib/store';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  ArrowUpRight,
  UserCheck,
  CreditCard,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AdminOverallDbtDashboardProps {
  submissions: FormSubmission[];
  onInspectSubmission?: (submission: FormSubmission) => void;
}

export interface AggregatedDbtRow {
  id: string;
  submissionId: string;
  submission: FormSubmission;
  establishmentName: string;
  establishmentCode: string;
  documentReceiveDate: string;
  location: string;
  candidateAadhaarName: string;
  dob: string;
  gender: string;
  mobileNumber: string;
  emailId: string;
  stipend: number;
  dbtSubsidy: number;
  qualification: string;
  curriculum: string;
  tradeType: string;
  apprenticeCode: string;
  beneficiaryId: string;
  contractCode: string;
  remarks: string;
  contractStartDate: string;
  contractEndDate: string;
  dbtStatus: 'PAID' | 'UNPAID' | 'FAIL';
  payoutMonth: string;
  candidate?: ApprenticeRecord;
  rawRecord?: NAPSPortalRecord;
}

const MONTH_OPTIONS = [
  { value: 'all', label: 'All Months' },
  { value: 'JAN', label: 'January (JAN)' },
  { value: 'FEB', label: 'February (FEB)' },
  { value: 'MAR', label: 'March (MAR)' },
  { value: 'APR', label: 'April (APR)' },
  { value: 'MAY', label: 'May (MAY)' },
  { value: 'JUN', label: 'June (JUN)' },
  { value: 'JUL', label: 'July (JUL)' },
  { value: 'AUG', label: 'August (AUG)' },
  { value: 'SEP', label: 'September (SEP)' },
  { value: 'OCT', label: 'October (OCT)' },
  { value: 'NOV', label: 'November (NOV)' },
  { value: 'DEC', label: 'December (DEC)' }
];

const YEAR_OPTIONS = [
  { value: 'all', label: 'All Years' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028' },
  { value: '2029', label: '2029' },
  { value: '2030', label: '2030' }
];

export const AdminOverallDbtDashboard: React.FC<AdminOverallDbtDashboardProps> = ({
  submissions,
  onInspectSubmission
}) => {
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [filterEstCode, setFilterEstCode] = useState<string>('');
  const [filterCnCode, setFilterCnCode] = useState<string>('');
  const [filterApCode, setFilterApCode] = useState<string>('');
  const [filterDbtStatus, setFilterDbtStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Detail Modal State
  const [inspectedRow, setInspectedRow] = useState<AggregatedDbtRow | null>(null);

  // Aggregate DBT records across all client submissions
  const allAggregatedRows = useMemo(() => {
    const rows: AggregatedDbtRow[] = [];

    submissions.forEach(sub => {
      const estName = sub.company_name || sub.client_name || 'Establishment';
      const estCodeFallback = sub.establishment_details?.pan || sub.naps_portal_id || sub.id;
      const candidates = sub.candidates || [];
      const napsRecords = generateAutoContinuedDbtRecords(sub);

      // Track which candidates have been represented via naps_records
      const processedCandIds = new Set<string>();

      // 1. Add official NAPS portal records
      napsRecords.forEach(rec => {
        const matchedCand = candidates.find(c => 
          c.id === rec.candidateId || 
          (c.contractCode && rec.contractCode && c.contractCode === rec.contractCode) ||
          (c.name && rec.candidateName && c.name.toLowerCase() === rec.candidateName.toLowerCase())
        );

        if (matchedCand?.id) {
          processedCandIds.add(matchedCand.id);
        }

        const estCode = rec.establishmentCode || estCodeFallback;
        const loc = rec.location || 
          (rec.ojtDistrict ? `${rec.ojtDistrict}, ${rec.ojtState}` : 
          (matchedCand?.ojtDistrict ? `${matchedCand.ojtDistrict}, ${matchedCand.ojtState || ''}` : 
          (sub.establishment_details?.state || 'Corporate Office')));

        const aadharName = rec.candidateAadhaarName || rec.candidateName || matchedCand?.name || 'Unknown';
        const birthDate = rec.dob || matchedCand?.dob || '-';
        const candGender = rec.gender || matchedCand?.gender || '-';
        const phoneNum = rec.mobileNumber || matchedCand?.phone || '-';
        const mailAddr = rec.emailId || matchedCand?.email || '-';
        const stipendVal = rec.stipend || matchedCand?.stipendAmount || rec.amount || 0;
        const dbtSubsidyVal = matchedCand?.dbtEligibleAmount || rec.amount || 0;
        const qual = rec.qualification || matchedCand?.qualification || '-';
        const curr = rec.curriculum || matchedCand?.tradeOrRole || '-';
        const tradeType = rec.contractType || matchedCand?.tradeType || 'optional';
        const apCode = rec.apprenticeCode || matchedCand?.apprenticeCode || '-';
        const benId = rec.beneficiaryId || '-';
        const cnNum = rec.contractCode || matchedCand?.contractCode || '-';
        const rem = rec.remarks || '-';
        const startDate = rec.contractStartDate || matchedCand?.onboardingDate || '-';
        const endDate = rec.contractEndDate || matchedCand?.contractExpireDate || '-';
        const resolvedStatus: 'PAID' | 'UNPAID' | 'FAIL' = 
          rec.dbtStatus === 'PAID' || rec.paymentStatus === 'PAID' ? 'PAID' :
          rec.dbtStatus === 'FAIL' || rec.paymentStatus === 'FAILED' ? 'FAIL' : 'UNPAID';

        rows.push({
          id: rec.id,
          submissionId: sub.id,
          submission: sub,
          establishmentName: estName,
          establishmentCode: estCode,
          documentReceiveDate: rec.documentReceiveDate || matchedCand?.documentReceiveDate || sub.started_at?.split('T')[0] || '-',
          location: loc,
          candidateAadhaarName: aadharName,
          dob: birthDate,
          gender: candGender,
          mobileNumber: phoneNum,
          emailId: mailAddr,
          stipend: stipendVal,
          dbtSubsidy: dbtSubsidyVal,
          qualification: qual,
          curriculum: curr,
          tradeType,
          apprenticeCode: apCode,
          beneficiaryId: benId,
          contractCode: cnNum,
          remarks: rem,
          contractStartDate: startDate,
          contractEndDate: endDate,
          dbtStatus: resolvedStatus,
          payoutMonth: rec.payoutMonth || 'AUG-2026',
          candidate: matchedCand,
          rawRecord: rec
        });
      });

      // 2. Include active candidates from submission that do not yet have a separate NAPS portal record
      candidates.forEach(cand => {
        if (processedCandIds.has(cand.id)) return;

        const loc = cand.ojtDistrict 
          ? `${cand.ojtDistrict}, ${cand.ojtState || ''}` 
          : (sub.establishment_details?.state || 'Corporate Office');

        const resolvedStatus: 'PAID' | 'UNPAID' | 'FAIL' = 
          cand.contractStatus === 'Signed' ? 'PAID' : 'UNPAID';

        rows.push({
          id: `cand-${cand.id}`,
          submissionId: sub.id,
          submission: sub,
          establishmentName: estName,
          establishmentCode: estCodeFallback,
          documentReceiveDate: cand.documentReceiveDate || cand.onboardingDate || '-',
          location: loc,
          candidateAadhaarName: cand.name,
          dob: cand.dob || '-',
          gender: cand.gender || '-',
          mobileNumber: cand.phone || '-',
          emailId: cand.email || '-',
          stipend: cand.stipendAmount || 0,
          dbtSubsidy: cand.dbtEligibleAmount || 0,
          qualification: cand.qualification || '-',
          curriculum: cand.tradeOrRole || '-',
          tradeType: cand.tradeType || 'optional',
          apprenticeCode: cand.apprenticeCode || '-',
          beneficiaryId: cand.aadhaarNumber ? `BEN-${cand.aadhaarNumber.slice(-4)}` : '-',
          contractCode: cand.contractCode || 'CN Pending',
          remarks: cand.status || 'Active',
          contractStartDate: cand.onboardingDate || '-',
          contractEndDate: cand.contractExpireDate || '-',
          dbtStatus: resolvedStatus,
          payoutMonth: `AUG-${new Date().getFullYear()}`,
          candidate: cand
        });
      });
    });

    return rows;
  }, [submissions]);

  // Apply Multi-Criteria Filters
  const filteredRows = useMemo(() => {
    return allAggregatedRows.filter(row => {
      // Month Filter
      if (selectedMonth !== 'all') {
        const pMonth = (row.payoutMonth || '').toUpperCase();
        if (!pMonth.includes(selectedMonth.toUpperCase())) {
          return false;
        }
      }

      // Year Filter
      if (selectedYear !== 'all') {
        const pYear = (row.payoutMonth || '').toUpperCase();
        if (!pYear.includes(selectedYear)) {
          return false;
        }
      }

      // Establishment Code Filter
      if (filterEstCode.trim()) {
        const query = filterEstCode.trim().toLowerCase();
        const estCodeMatches = (row.establishmentCode || '').toLowerCase().includes(query);
        const estNameMatches = (row.establishmentName || '').toLowerCase().includes(query);
        if (!estCodeMatches && !estNameMatches) {
          return false;
        }
      }

      // CN Number Filter
      if (filterCnCode.trim()) {
        const query = filterCnCode.trim().toLowerCase();
        if (!(row.contractCode || '').toLowerCase().includes(query)) {
          return false;
        }
      }

      // AP Number Filter
      if (filterApCode.trim()) {
        const query = filterApCode.trim().toLowerCase();
        if (!(row.apprenticeCode || '').toLowerCase().includes(query)) {
          return false;
        }
      }

      // DBT Status Filter
      if (filterDbtStatus !== 'all') {
        if (row.dbtStatus.toUpperCase() !== filterDbtStatus.toUpperCase()) {
          return false;
        }
      }

      // Free-text Search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = (row.candidateAadhaarName || '').toLowerCase().includes(q);
        const matchesEmail = (row.emailId || '').toLowerCase().includes(q);
        const matchesPhone = (row.mobileNumber || '').toLowerCase().includes(q);
        const matchesBenId = (row.beneficiaryId || '').toLowerCase().includes(q);
        const matchesEstName = (row.establishmentName || '').toLowerCase().includes(q);
        const matchesEstCode = (row.establishmentCode || '').toLowerCase().includes(q);
        const matchesLoc = (row.location || '').toLowerCase().includes(q);
        const matchesCurr = (row.curriculum || '').toLowerCase().includes(q);
        const matchesCn = (row.contractCode || '').toLowerCase().includes(q);
        const matchesAp = (row.apprenticeCode || '').toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesBenId && 
            !matchesEstName && !matchesEstCode && !matchesLoc && !matchesCurr &&
            !matchesCn && !matchesAp) {
          return false;
        }
      }

      return true;
    });
  }, [allAggregatedRows, selectedMonth, selectedYear, filterEstCode, filterCnCode, filterApCode, filterDbtStatus, searchQuery]);

  // Aggregate KPI Calculations
  const totalDisbursed = useMemo(() => {
    return filteredRows.reduce((acc, r) => acc + (r.stipend || 0), 0);
  }, [filteredRows]);

  const totalDbtSubsidies = useMemo(() => {
    return filteredRows.reduce((acc, r) => acc + (r.dbtSubsidy || 0), 0);
  }, [filteredRows]);

  const paidCount = useMemo(() => {
    return filteredRows.filter(r => r.dbtStatus === 'PAID').length;
  }, [filteredRows]);

  const unpaidCount = useMemo(() => {
    return filteredRows.filter(r => r.dbtStatus === 'UNPAID').length;
  }, [filteredRows]);

  const failCount = useMemo(() => {
    return filteredRows.filter(r => r.dbtStatus === 'FAIL').length;
  }, [filteredRows]);

  const uniqueEstablishmentsCount = useMemo(() => {
    const set = new Set(filteredRows.map(r => r.establishmentCode || r.establishmentName));
    return set.size;
  }, [filteredRows]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    selectedMonth !== 'all' || 
    selectedYear !== 'all' || 
    filterEstCode.trim() || 
    filterCnCode.trim() || 
    filterApCode.trim() || 
    filterDbtStatus !== 'all' || 
    searchQuery.trim()
  );

  const handleClearFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setFilterEstCode('');
    setFilterCnCode('');
    setFilterApCode('');
    setFilterDbtStatus('all');
    setSearchQuery('');
  };

  // CSV Export for Overall DBT Records
  const handleExportCSV = () => {
    const headers = [
      'Serial No',
      'Document Receive Date',
      'Establishment Code',
      'Establishment Name',
      'Location',
      'Candidate Aadhar Name',
      'DOB',
      'Gender',
      'Mobile Number',
      'Email ID',
      'Stipend (Rs)',
      'DBT Subsidy (Rs)',
      'Qualification',
      'Curriculum',
      'Trade Type',
      'AP Code',
      'Beneficiary ID',
      'CN Number',
      'Remarks',
      'Contract Start Date',
      'Contract End Date',
      'DBT Status',
      'Payout Cycle'
    ];

    const rows = filteredRows.map((r, idx) => [
      idx + 1,
      `"${r.documentReceiveDate}"`,
      `"${r.establishmentCode}"`,
      `"${r.establishmentName}"`,
      `"${r.location}"`,
      `"${r.candidateAadhaarName}"`,
      `"${r.dob}"`,
      `"${r.gender}"`,
      `"${r.mobileNumber}"`,
      `"${r.emailId}"`,
      r.stipend,
      r.dbtSubsidy,
      `"${r.qualification}"`,
      `"${r.curriculum}"`,
      `"${r.tradeType}"`,
      `"${r.apprenticeCode}"`,
      `"${r.beneficiaryId}"`,
      `"${r.contractCode}"`,
      `"${r.remarks}"`,
      `"${r.contractStartDate}"`,
      `"${r.contractEndDate}"`,
      `"${r.dbtStatus}"`,
      `"${r.payoutMonth}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `overall_dbt_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Controls */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono uppercase">
                Cross-Establishment Ledger
              </span>
              <span className="text-xs text-zinc-400 font-mono">Real-time DBT & PFMS Consolidation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 mt-1">
              Overall DBT Administration Dashboard
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Consolidated Direct Benefit Transfer records across all client establishments, apprentice contracts, and NAPS subsidy claims.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Overall DBT CSV</span>
            </button>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-zinc-100">
          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 block font-mono">
              Total Records
            </span>
            <div className="text-xl font-extrabold font-mono text-zinc-900 mt-1">
              {filteredRows.length}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Across establishments</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 block font-mono">
              Total Disbursed
            </span>
            <div className="text-xl font-extrabold font-mono text-zinc-900 mt-1">
              ₹{totalDisbursed.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Gross stipend total</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-800 block font-mono">
              DBT Subsidy
            </span>
            <div className="text-xl font-extrabold font-mono text-emerald-700 mt-1">
              ₹{totalDbtSubsidies.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Government subsidy</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-800 block font-mono">
              Paid Status
            </span>
            <div className="text-xl font-extrabold font-mono text-emerald-700 mt-1">
              {paidCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Completed payouts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold uppercase tracking-tight text-amber-800 block font-mono">
              Unpaid / Pending
            </span>
            <div className="text-xl font-extrabold font-mono text-amber-700 mt-1">
              {unpaidCount}
            </div>
            <span className="text-[10px] text-amber-600 font-medium">Pending allocation / pay</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500 block font-mono">
              Establishments
            </span>
            <div className="text-xl font-extrabold font-mono text-zinc-900 mt-1">
              {uniqueEstablishmentsCount}
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Participating entities</span>
          </div>
        </div>

        {/* Multi-Criteria Filter Controls */}
        <div className="mt-6 pt-5 border-t border-zinc-200 space-y-3.5 text-xs">
          
          {/* Row 1: Month, Year, DBT Status, and Free Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Month Dropdown */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono text-zinc-600 font-bold text-[11px]">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-white border border-zinc-300 text-zinc-900 font-bold text-xs cursor-pointer focus:outline-none focus:border-black shadow-2xs"
                >
                  {MONTH_OPTIONS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Year Dropdown */}
              <div className="flex items-center gap-1.5 ml-1">
                <span className="font-mono text-zinc-600 font-bold text-[11px]">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-white border border-zinc-300 text-zinc-900 font-bold text-xs cursor-pointer focus:outline-none focus:border-black shadow-2xs"
                >
                  {YEAR_OPTIONS.map(y => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>

              {/* DBT Status Dropdown */}
              <div className="flex items-center gap-1.5 ml-1">
                <span className="font-mono text-zinc-600 font-bold text-[11px]">DBT Status:</span>
                <select
                  value={filterDbtStatus}
                  onChange={(e) => setFilterDbtStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-white border border-zinc-300 text-zinc-900 font-bold text-xs cursor-pointer focus:outline-none focus:border-black shadow-2xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </div>
            </div>

            {/* General Free Search */}
            <div className="relative w-full lg:w-80">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search candidate, email, mobile, entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white border border-zinc-300 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-black shadow-2xs"
              />
            </div>
          </div>

          {/* Row 2: Code Specific Filters (Est Code, CN Code, AP Code) */}
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <span className="font-mono text-zinc-500 text-[11px] font-bold whitespace-nowrap">Est Code:</span>
              <input
                type="text"
                placeholder="Filter Establishment Code / Entity..."
                value={filterEstCode}
                onChange={(e) => setFilterEstCode(e.target.value)}
                className="w-full px-3 py-1 rounded-xl bg-white border border-zinc-300 text-xs text-zinc-800 font-mono focus:outline-none focus:border-black shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <span className="font-mono text-zinc-500 text-[11px] font-bold whitespace-nowrap">CN Code:</span>
              <input
                type="text"
                placeholder="Filter Contract (CN) Code..."
                value={filterCnCode}
                onChange={(e) => setFilterCnCode(e.target.value)}
                className="w-full px-3 py-1 rounded-xl bg-white border border-zinc-300 text-xs text-zinc-800 font-mono focus:outline-none focus:border-black shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <span className="font-mono text-zinc-500 text-[11px] font-bold whitespace-nowrap">AP Code:</span>
              <input
                type="text"
                placeholder="Filter Apprentice (AP) Code..."
                value={filterApCode}
                onChange={(e) => setFilterApCode(e.target.value)}
                className="w-full px-3 py-1 rounded-xl bg-white border border-zinc-300 text-xs text-zinc-800 font-mono focus:outline-none focus:border-black shadow-2xs"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3.5 py-1.5 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Main 19-Column DBT Table Card */}
      <GlassCard className="p-0 overflow-hidden rounded-3xl border border-zinc-200 shadow-sm">
        <div className="p-4 sm:p-5 bg-zinc-50/70 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono flex items-center gap-2">
              <span>OFFICIAL NAPS / DBT REGISTRY LEDGER</span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 text-[10px]">
                {filteredRows.length} Matching Records
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
              Consolidated 19 columns corresponding to NAPS compliance portal standards across all registered corporate establishments.
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-[11px] font-mono text-zinc-500">
              Click &quot;Inspect Details&quot; on any row to view full candidate and establishment dossier.
            </span>
          </div>
        </div>

        {/* 19 Required Columns Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-[#112240] text-white uppercase tracking-wider text-[9px] font-mono sticky top-0 z-10 select-none">
              <tr>
                <th className="py-3 px-3.5">1. S.No</th>
                <th className="py-3 px-3.5">2. Receive Date</th>
                <th className="py-3 px-3.5">3. Establishment</th>
                <th className="py-3 px-3.5">4. Location</th>
                <th className="py-3 px-3.5">5. Candidate Aadhar Name</th>
                <th className="py-3 px-3.5">6. DOB</th>
                <th className="py-3 px-3.5">7. Gender</th>
                <th className="py-3 px-3.5">8. Mobile Number</th>
                <th className="py-3 px-3.5">9. Email ID</th>
                <th className="py-3 px-3.5">10. Stipend</th>
                <th className="py-3 px-3.5">11. Qualification</th>
                <th className="py-3 px-3.5">12. Curriculum</th>
                <th className="py-3 px-3.5">13. AP Code</th>
                <th className="py-3 px-3.5">14. Beneficiary ID</th>
                <th className="py-3 px-3.5">15. CN Number</th>
                <th className="py-3 px-3.5">16. Remarks</th>
                <th className="py-3 px-3.5">17. Contract Start</th>
                <th className="py-3 px-3.5">18. Contract End</th>
                <th className="py-3 px-3.5">19. DBT Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {filteredRows.length > 0 ? (
                filteredRows.map((row, idx) => (
                  <tr 
                    key={`${row.submissionId}-${row.id}-${idx}`}
                    className="hover:bg-zinc-50/90 transition-colors"
                  >
                    {/* 1. Serial No */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-zinc-400">
                      {idx + 1}
                    </td>

                    {/* 2. Document Receive Date */}
                    <td className="py-2.5 px-3.5 font-mono text-zinc-600">
                      {row.documentReceiveDate}
                    </td>

                    {/* 3. Establishment Code & Name */}
                    <td className="py-2.5 px-3.5">
                      <div className="font-mono font-bold text-zinc-900">
                        {row.establishmentCode}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[150px]" title={row.establishmentName}>
                        {row.establishmentName}
                      </div>
                    </td>

                    {/* 4. Location */}
                    <td className="py-2.5 px-3.5 text-zinc-700 max-w-[140px] truncate" title={row.location}>
                      {row.location}
                    </td>

                    {/* 5. Candidate Aadhar Name */}
                    <td className="py-2.5 px-3.5 font-bold text-zinc-900">
                      <div>{row.candidateAadhaarName}</div>
                      {row.tradeType && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {row.tradeType}
                        </span>
                      )}
                    </td>

                    {/* 6. DOB */}
                    <td className="py-2.5 px-3.5 font-mono text-zinc-600">
                      {row.dob}
                    </td>

                    {/* 7. Gender */}
                    <td className="py-2.5 px-3.5 capitalize text-zinc-700">
                      {row.gender}
                    </td>

                    {/* 8. Mobile Number */}
                    <td className="py-2.5 px-3.5 font-mono text-zinc-700">
                      {row.mobileNumber}
                    </td>

                    {/* 9. Email ID */}
                    <td className="py-2.5 px-3.5 font-mono text-zinc-600 max-w-[150px] truncate" title={row.emailId}>
                      {row.emailId}
                    </td>

                    {/* 10. Stipend */}
                    <td className="py-2.5 px-3.5 font-bold text-zinc-900 font-mono">
                      ₹{row.stipend.toLocaleString('en-IN')}
                    </td>

                    {/* 11. Qualification */}
                    <td className="py-2.5 px-3.5 text-zinc-700 max-w-[120px] truncate" title={row.qualification}>
                      {row.qualification}
                    </td>

                    {/* 12. Curriculum */}
                    <td className="py-2.5 px-3.5 text-zinc-700 max-w-[140px] truncate" title={row.curriculum}>
                      {row.curriculum}
                    </td>

                    {/* 13. AP Code */}
                    <td className="py-2.5 px-3.5 font-mono text-sky-800 font-bold">
                      {row.apprenticeCode}
                    </td>

                    {/* 14. Beneficiary ID */}
                    <td className="py-2.5 px-3.5 font-mono text-zinc-500">
                      {row.beneficiaryId}
                    </td>

                    {/* 15. CN Number */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-zinc-800">
                      {row.contractCode}
                    </td>

                    {/* 16. Remarks */}
                    <td className="py-2.5 px-3.5 text-zinc-600 max-w-[120px] truncate" title={row.remarks}>
                      {row.remarks}
                    </td>

                    {/* 17. Contract Start Date */}
                    <td className="py-2.5 px-3.5 font-mono text-zinc-600">
                      {row.contractStartDate}
                    </td>

                    {/* 18. Contract End Date */}
                    <td className="py-2.5 px-3.5 font-mono text-zinc-600">
                      {row.contractEndDate}
                    </td>

                    {/* 19. DBT Status */}
                    <td className="py-2.5 px-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.dbtStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : row.dbtStatus === 'FAIL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {row.dbtStatus}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectedRow(row)}
                          className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                          title="Inspect Candidate & Establishment DBT Details"
                        >
                          <Eye className="w-3 h-3 text-zinc-500" />
                          <span>View Details</span>
                        </button>
                        
                        {onInspectSubmission && (
                          <button
                            type="button"
                            onClick={() => onInspectSubmission(row.submission)}
                            className="px-2.5 py-1 rounded-full bg-black hover:bg-zinc-800 text-white text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                            title="Open Full Client Intake Dossier"
                          >
                            <span>Dossier</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={20} className="py-12 text-center text-zinc-400 text-xs font-sans">
                    No DBT records found matching the active search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Candidate & Establishment Detailed Inspection Modal */}
      <AnimatePresence>
        {inspectedRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                      DBT Record Details
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inspectedRow.dbtStatus === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : inspectedRow.dbtStatus === 'FAIL'
                        ? 'bg-rose-50 text-rose-700 border border-rose-300'
                        : 'bg-amber-50 text-amber-700 border border-amber-300'
                    }`}>
                      Status: {inspectedRow.dbtStatus}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900">
                    {inspectedRow.candidateAadhaarName}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    {inspectedRow.establishmentName} · Est Code: {inspectedRow.establishmentCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedRow(null)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-black cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Establishment Information Section */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                  <Building2 className="w-4 h-4 text-zinc-700" />
                  <span className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
                    Establishment & Client Profile
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Establishment Name:</span>
                    <span className="font-bold text-zinc-900">{inspectedRow.establishmentName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Establishment Code:</span>
                    <span className="font-mono font-bold text-zinc-900">{inspectedRow.establishmentCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Company PAN:</span>
                    <span className="font-mono font-bold text-zinc-800">
                      {inspectedRow.submission.establishment_details?.pan || inspectedRow.submission.responses?.panNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Company GSTIN:</span>
                    <span className="font-mono font-bold text-zinc-800">
                      {inspectedRow.submission.establishment_details?.gstin || inspectedRow.submission.responses?.gstinNumber || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Primary Client Contact:</span>
                    <span className="text-zinc-800 font-medium">
                      {inspectedRow.submission.client_name} ({inspectedRow.submission.client_email})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Operations SPOC:</span>
                    <span className="text-zinc-800 font-medium">
                      {inspectedRow.submission.assigned_company_spoc?.name ? (
                        `${inspectedRow.submission.assigned_company_spoc.name} (${inspectedRow.submission.assigned_company_spoc.email})`
                      ) : (
                        'Default Administrator SPOC'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Candidate Details Section */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                  <UserCheck className="w-4 h-4 text-zinc-700" />
                  <span className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
                    Candidate Bio & Curriculum Profile
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Aadhaar Full Name:</span>
                    <span className="font-bold text-zinc-900">{inspectedRow.candidateAadhaarName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">DOB & Gender:</span>
                    <span className="text-zinc-800 font-medium">{inspectedRow.dob} · <span className="capitalize">{inspectedRow.gender}</span></span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Contact Mobile:</span>
                    <span className="font-mono text-zinc-800 font-medium">{inspectedRow.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Contact Email:</span>
                    <span className="font-mono text-zinc-800 font-medium">{inspectedRow.emailId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">OJT Training Location:</span>
                    <span className="text-zinc-800 font-medium">{inspectedRow.location}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Qualification:</span>
                    <span className="text-zinc-800 font-medium">{inspectedRow.qualification}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-zinc-500 text-[11px] block">Curriculum / Designated Role:</span>
                    <span className="font-bold text-zinc-900">{inspectedRow.curriculum}</span>
                    <span className="ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                      Trade Type: {inspectedRow.tradeType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Portal & Contract Codes */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
                  <CreditCard className="w-4 h-4 text-zinc-700" />
                  <span className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
                    NAPS Portal Identifiers & Contract Period
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Contract Code (CN Number):</span>
                    <span className="font-mono font-bold text-zinc-900">{inspectedRow.contractCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Apprentice Code (AP Number):</span>
                    <span className="font-mono font-bold text-sky-800">{inspectedRow.apprenticeCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Beneficiary ID:</span>
                    <span className="font-mono text-zinc-700 font-medium">{inspectedRow.beneficiaryId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Document Receive Date:</span>
                    <span className="font-mono text-zinc-700 font-medium">{inspectedRow.documentReceiveDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Contract Start Date:</span>
                    <span className="font-mono text-zinc-700">{inspectedRow.contractStartDate}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px] block">Contract End Date:</span>
                    <span className="font-mono text-zinc-700">{inspectedRow.contractEndDate}</span>
                  </div>
                </div>
              </div>

              {/* Financial & DBT Subsidy Breakdown */}
              <div className="p-4 rounded-2xl bg-zinc-900 text-white space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold uppercase tracking-wider text-zinc-200 text-[11px]">
                      Stipend & Direct Benefit Transfer Breakdown
                    </span>
                  </div>
                  <span className="font-mono text-zinc-400 text-[10px]">
                    Cycle: {inspectedRow.payoutMonth}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700">
                    <span className="text-[10px] text-zinc-400 uppercase block font-sans">Total Stipend</span>
                    <span className="text-base font-extrabold text-white mt-0.5 block">
                      ₹{inspectedRow.stipend.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800">
                    <span className="text-[10px] text-emerald-400 uppercase block font-sans">Govt DBT Subsidy</span>
                    <span className="text-base font-extrabold text-emerald-300 mt-0.5 block">
                      ₹{inspectedRow.dbtSubsidy.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700">
                    <span className="text-[10px] text-zinc-400 uppercase block font-sans">Company Share</span>
                    <span className="text-base font-extrabold text-zinc-200 mt-0.5 block">
                      ₹{Math.max(inspectedRow.stipend - inspectedRow.dbtSubsidy, 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-between text-[11px] text-zinc-400">
                  <span>Remarks: <strong className="text-zinc-200">{inspectedRow.remarks}</strong></span>
                  <span>Payment Status: <strong className="text-emerald-400">{inspectedRow.dbtStatus}</strong></span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setInspectedRow(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-zinc-600 hover:text-black cursor-pointer transition-colors"
                >
                  Close
                </button>

                {onInspectSubmission && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetSub = inspectedRow.submission;
                      setInspectedRow(null);
                      onInspectSubmission(targetSub);
                    }}
                    className="px-5 py-2 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>Open Full Client Dossier</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
