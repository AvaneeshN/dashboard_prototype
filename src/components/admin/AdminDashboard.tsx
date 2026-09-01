'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { FormSubmission, SubmissionStatus } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { SubmissionDetailDrawer } from './SubmissionDetailDrawer';
import { INITIAL_FUNNEL_STEPS } from '@/lib/mock-data';
import { 
  Users, 
  WalletCards, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Download, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Activity,
  Layers,
  ShieldCheck,
  BarChart2,
  FileSpreadsheet,
  LayoutDashboard,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type AdminTab = 'telemetry' | 'intakes' | 'security';

export const AdminDashboard: React.FC = () => {
  const { submissions, loginLogs, updateSubmissionStatus, syncDataToSupabase } = useStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('telemetry');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [logFilter, setLogFilter] = useState<'all' | 'failed' | 'success'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSupabaseSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncDataToSupabase();
    setSyncFeedback(res);
    setIsSyncing(false);
    setTimeout(() => {
      setSyncFeedback(null);
    }, 6000);
  };

  // Compute Live KPIs
  const totalSubmissions = submissions.length;
  const completedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'under_review' || s.status === 'approved').length;
  const inProgressCount = submissions.filter(s => s.status === 'in_progress' || s.status === 'draft').length;
  const abandonedCount = submissions.filter(s => s.status === 'abandoned').length;
  
  const totalLogins = loginLogs.length;
  const failedLogins = loginLogs.filter(l => l.status === 'failed').length;
  const successLogins = loginLogs.filter(l => l.status === 'success').length;

  // Funnel data for Recharts
  const funnelChartData = INITIAL_FUNNEL_STEPS.map(s => ({
    name: `Step ${s.step}`,
    fullName: s.name,
    started: s.started,
    completed: s.completed,
    dropOff: s.dropOff
  }));

  // Filter Submissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.client_email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Logs
  const filteredLogs = loginLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.status === logFilter;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Submission ID', 'Client Name', 'Email', 'Status', 'Current Step', 'Completion %', 'Time Spent (s)', 'Submitted At'];
    const rows = submissions.map(s => [
      s.id,
      `"${s.client_name}"`,
      `"${s.client_email}"`,
      s.status,
      s.current_step,
      `${s.completion_percentage}%`,
      s.time_spent_seconds,
      s.submitted_at || 'In Progress'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `intake_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-white">Submitted</span>;
      case 'under_review':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">Under Review</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Approved</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">In Progress</span>;
      case 'abandoned':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Abandoned</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600">{status}</span>;
    }
  };

  const adminTabs = [
    { id: 'telemetry', label: 'Executive Telemetry & Funnel', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'intakes', label: `Client Intakes (${submissions.length})`, icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { id: 'security', label: `Security Audit Log (${loginLogs.length})`, icon: <ShieldCheck className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-7 font-sans text-zinc-900">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg leading-none">✦</span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Admin Telemetry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
            Administration & Telemetry
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Intake funnel telemetry, candidate onboarding quotas, and security audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSupabaseSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isSyncing ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV ↗</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-4 rounded-2xl border border-zinc-300 bg-white text-xs text-zinc-900 flex items-start gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">{syncFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-200/80 border border-zinc-300 overflow-x-auto w-fit">
        {adminTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer select-none ${
                isActive ? 'text-black' : 'text-zinc-600 hover:text-black'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>

              {isActive && (
                <motion.div
                  layoutId="adminActiveSectionPill"
                  className="absolute inset-0 bg-white border border-zinc-300 rounded-full shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tabbed Content */}
      <div className="min-h-[420px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Executive Telemetry & Funnel */}
          {activeTab === 'telemetry' && (
            <motion.div
              key="telemetry"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Executive Grid Stat Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 border border-zinc-200 rounded-3xl bg-white overflow-hidden shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
                <div className="p-6">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    CLIENT INTAKES
                  </span>
                  <div className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                    {totalSubmissions}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mt-1">
                    {completedCount} Completed · {inProgressCount} Drafts
                  </div>
                </div>

                <div className="p-6">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    TOTAL DBT DISBURSED
                  </span>
                  <div className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                    ₹4.5L
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mt-1">
                    August cycle settled
                  </div>
                </div>

                <div className="p-6">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    FORM ABANDONED
                  </span>
                  <div className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                    {abandonedCount}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mt-1">
                    Mid-session drop-offs
                  </div>
                </div>

                <div className="p-6">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    LOGIN TELEMETRY
                  </span>
                  <div className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                    {totalLogins}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium mt-1">
                    {successLogins} Verified · {failedLogins} Failed
                  </div>
                </div>
              </div>

              {/* Funnel Chart */}
              <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-zinc-100 pb-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                      CLIENT INTAKE PROGRESSION & DROP-OFF FUNNEL
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                      Volume starting vs completing each intake section.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700">Section Conversion</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis 
                        dataKey="name" 
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
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', color: '#09090b', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="started" name="Started" fill="#d4d4d8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#18181b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* TAB 2: Client Submissions Registry */}
          {activeTab === 'intakes' && (
            <motion.div
              key="intakes"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                      CLIENT INTAKE REGISTRY
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                      Inspect candidate quota requests and modify review status.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 text-xs focus:outline-none focus:border-black w-48 sm:w-56 font-medium"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs px-3 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold focus:outline-none focus:border-black"
                    >
                      <option value="all">All ({submissions.length})</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="abandoned">Abandoned</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 font-mono">
                      <tr>
                        <th className="py-3 px-4">Client Profile</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Progress</th>
                        <th className="py-3 px-4">Session Time</th>
                        <th className="py-3 px-4">Last Active</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-zinc-900 text-xs">
                                {sub.company_name ? `${sub.company_name}` : sub.client_name}
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                {sub.company_name ? `${sub.client_name} · ${sub.client_email}` : sub.client_email}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {getStatusBadge(sub.status)}
                            </td>

                            <td className="py-3.5 px-4 font-mono text-zinc-600 font-bold">
                              {sub.completion_percentage}%
                            </td>

                            <td className="py-3.5 px-4 text-zinc-600 font-mono">
                              {Math.floor(sub.time_spent_seconds / 60)}m {sub.time_spent_seconds % 60}s
                            </td>

                            <td className="py-3.5 px-4 text-zinc-400 text-[11px] font-mono">
                              {new Date(sub.last_active_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedSubmission(sub)}
                                className="px-4 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer"
                              >
                                Inspect ↗
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-zinc-400 text-xs">
                            No intake applications found. Newly submitted client applications will appear here in real-time.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* TAB 3: Security & Login Audit Log */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-zinc-100 pb-4">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                      AUTHENTICATION AUDIT TRAIL
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                      Live log of all logins and IP telemetry.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        logFilter === 'all' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      All ({loginLogs.length})
                    </button>
                    <button
                      onClick={() => setLogFilter('failed')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        logFilter === 'failed' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      Failed ({failedLogins})
                    </button>
                    <button
                      onClick={() => setLogFilter('success')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        logFilter === 'success' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      Success ({successLogins})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 font-mono">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Account</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">IP Address</th>
                        <th className="py-3 px-4">Diagnostic / Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white font-mono text-[11px]">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-3 px-4 text-zinc-500">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 text-zinc-900 font-sans font-bold">
                            {log.email}
                          </td>
                          <td className="py-3 px-4 uppercase text-zinc-500 text-[10px]">
                            {log.role_attempted}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            {log.status === 'success' ? (
                              <span className="text-emerald-600">Success</span>
                            ) : (
                              <span className="text-rose-600">Failed</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-500">
                            {log.ip_address}
                          </td>
                          <td className="py-3 px-4 text-zinc-700 font-sans font-medium">
                            {log.failure_reason || 'Verified'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Submission Detail Drawer */}
      <SubmissionDetailDrawer
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onStatusChange={(id, status) => {
          updateSubmissionStatus(id, status);
          if (selectedSubmission && selectedSubmission.id === id) {
            setSelectedSubmission({ ...selectedSubmission, status });
          }
        }}
      />

    </div>
  );
};
