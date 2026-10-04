'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FormSubmission } from '@/types';
import { 
  X, 
  FileSpreadsheet, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Download, 
  Layers, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TimelineExportMode, 
  TimelineExportOptions, 
  MONTH_LIST, 
  buildAggregatedRows, 
  filterTimelineRows, 
  exportTimelineToExcel 
} from '@/lib/excel-export';

interface AdminBulkTimelineExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: FormSubmission[];
  seniorAdminName?: string;
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

export const AdminBulkTimelineExportModal: React.FC<AdminBulkTimelineExportModalProps> = ({
  isOpen,
  onClose,
  submissions,
  seniorAdminName = 'Senior Administrator'
}) => {
  const currentYear = new Date().getFullYear();
  
  // Timeline mode
  const [mode, setMode] = useState<TimelineExportMode>('month_range');

  // Single Month State
  const [singleMonth, setSingleMonth] = useState<string>('AUG');
  const [singleYear, setSingleYear] = useState<number>(currentYear);

  // Month Range State
  const [startMonth, setStartMonth] = useState<string>('JAN');
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endMonth, setEndMonth] = useState<string>('DEC');
  const [endYear, setEndYear] = useState<number>(currentYear);

  // Filters
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'PAID' | 'UNPAID' | 'FAIL'>('all');

  // UI state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<{ fileName: string; rowCount: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Build options object
  const exportOptions: TimelineExportOptions = useMemo(() => {
    return {
      mode,
      singleMonth: mode === 'single_month' ? { month: singleMonth, year: singleYear } : undefined,
      startMonth: mode === 'month_range' ? { month: startMonth, year: startYear } : undefined,
      endMonth: mode === 'month_range' ? { month: endMonth, year: endYear } : undefined,
      establishmentId: selectedEstablishment,
      statusFilter: selectedStatus
    };
  }, [mode, singleMonth, singleYear, startMonth, startYear, endMonth, endYear, selectedEstablishment, selectedStatus]);

  // Live filtered records count
  const allRows = useMemo(() => buildAggregatedRows(submissions), [submissions]);
  const previewRows = useMemo(() => filterTimelineRows(allRows, exportOptions), [allRows, exportOptions]);

  const previewStipend = useMemo(() => {
    return previewRows.reduce((acc, r) => acc + (r.stipend || 0), 0);
  }, [previewRows]);

  const previewDbt = useMemo(() => {
    return previewRows.reduce((acc, r) => acc + (r.dbtSubsidy || 0), 0);
  }, [previewRows]);

  const previewEstablishmentsCount = useMemo(() => {
    return new Set(previewRows.map(r => r.establishmentName)).size;
  }, [previewRows]);

  const handleExecuteExport = () => {
    setIsExporting(true);
    setExportFeedback(null);

    // Yield to allow UI spinner
    setTimeout(() => {
      try {
        const result = exportTimelineToExcel(submissions, exportOptions, seniorAdminName);
        setExportFeedback({
          fileName: result.fileName,
          rowCount: result.rowCount
        });
      } catch (err) {
        console.error('Failed to export Excel workbook:', err);
      } finally {
        setIsExporting(false);
      }
    }, 250);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white border border-zinc-200/90 rounded-3xl shadow-2xl p-6 sm:p-7 text-zinc-900 my-auto max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900">
                    Bulk Timeline Excel Parser
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center gap-1 font-mono uppercase">
                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                    Senior Admin
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Parse and download cross-establishment data across a custom timeline as a formatted Excel (.xlsx) workbook.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-5 overflow-y-auto flex-1 pr-1.5">
            {/* Step 1: Mode Selection Pills */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
                1. Select Timeline Scope
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('single_month')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === 'single_month'
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/70'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Single Month</span>
                    {mode === 'single_month' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className={`text-[11px] mt-1 ${mode === 'single_month' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    One specific monthly cycle
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('month_range')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === 'month_range'
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/70'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Timeline Range</span>
                    {mode === 'month_range' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className={`text-[11px] mt-1 ${mode === 'month_range' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    From month to month
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('all_time')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === 'all_time'
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/70'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Complete Archive</span>
                    {mode === 'all_time' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className={`text-[11px] mt-1 ${mode === 'all_time' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    All historical timelines
                  </p>
                </button>
              </div>
            </div>

            {/* Step 2: Timeline Pickers */}
            {mode === 'single_month' && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-3">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  Select Target Month & Year
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Month</label>
                    <select
                      value={singleMonth}
                      onChange={(e) => setSingleMonth(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black"
                    >
                      {MONTH_LIST.map(m => (
                        <option key={m.value} value={m.value}>{m.label} ({m.value})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 mb-1">Year</label>
                    <select
                      value={singleYear}
                      onChange={(e) => setSingleYear(parseInt(e.target.value, 10))}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black"
                    >
                      {AVAILABLE_YEARS.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {mode === 'month_range' && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 space-y-3">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  Define Start and End Timeline Bounds
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* From */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-zinc-200/70">
                    <span className="text-[11px] font-bold text-zinc-600 uppercase font-mono">From Month</span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        className="py-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black"
                      >
                        {MONTH_LIST.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
                        className="py-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black"
                      >
                        {AVAILABLE_YEARS.map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* To */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-white border border-zinc-200/70">
                    <span className="text-[11px] font-bold text-zinc-600 uppercase font-mono">To Month (Inclusive)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        className="py-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black"
                      >
                        {MONTH_LIST.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={endYear}
                        onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
                        className="py-1.5 px-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-900 focus:outline-none focus:border-black"
                      >
                        {AVAILABLE_YEARS.map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mode === 'all_time' && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-xs text-zinc-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Extracting full historical dataset across all recorded establishment batches.</span>
              </div>
            )}

            {/* Step 3: Optional Sub-Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Establishment Scope</label>
                <select
                  value={selectedEstablishment}
                  onChange={(e) => setSelectedEstablishment(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:border-black"
                >
                  <option value="all">All Establishments (Consolidated)</option>
                  {submissions.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.company_name || sub.client_name || 'Establishment'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">DBT Payment Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-900 focus:outline-none focus:border-black"
                >
                  <option value="all">All Statuses (PAID, UNPAID, FAIL)</option>
                  <option value="PAID">PAID Only (Disbursed)</option>
                  <option value="UNPAID">UNPAID Only (Pending)</option>
                  <option value="FAIL">FAIL Only (Discrepancy)</option>
                </select>
              </div>
            </div>

            {/* Live Data Preview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-zinc-50 border border-emerald-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Live Extraction Preview
                </span>
                <span className="font-mono font-bold text-emerald-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {previewRows.length} Matching Records
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="block text-[10px] text-zinc-500 font-medium">Establishments</span>
                  <span className="text-xs font-extrabold text-zinc-900">{previewEstablishmentsCount}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="block text-[10px] text-zinc-500 font-medium">Gross Stipends</span>
                  <span className="text-xs font-extrabold text-zinc-900">₹{previewStipend.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  <span className="block text-[10px] text-zinc-500 font-medium">DBT Subsidy</span>
                  <span className="text-xs font-extrabold text-emerald-700">₹{previewDbt.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Sheet preview pills */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-600">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Included Sheets:</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-medium font-mono">
                  1. Executive_Summary
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-medium font-mono">
                  2. DBT_Subsidy_Ledger
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-medium font-mono">
                  3. Establishments_Overview
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-[10px] font-medium font-mono">
                  4. Apprentice_Registry
                </span>
              </div>
            </div>

            {/* Success feedback */}
            {exportFeedback && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Successfully compiled <strong>{exportFeedback.rowCount} records</strong> into <strong>{exportFeedback.fileName}</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-full text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isExporting || previewRows.length === 0}
              onClick={handleExecuteExport}
              className="py-2.5 px-5 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Compiling Excel Workbook...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Parse & Download Excel (.xlsx)</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
