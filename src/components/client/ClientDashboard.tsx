'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ApprenticeRecord, UploadedDocument, SPOCEmailLog } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClientIntakeWizard } from './ClientIntakeWizard';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import { processUploadedFile, downloadDocumentFile } from '@/lib/document-utils';
import { 
  Users, 
  UserCheck, 
  WalletCards, 
  Receipt, 
  FileSignature, 
  ShieldCheck, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  Download, 
  Calendar, 
  BarChart2, 
  PieChart as PieIcon, 
  FileText,
  LayoutDashboard,
  DollarSign,
  Shield,
  Layers,
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  Plus,
  Trash2,
  X,
  UploadCloud,
  Check,
  Building,
  CreditCard,
  Clock,
  Printer,
  Mail,
  Send,
  Eye,
  FileCheck2,
  Paperclip
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type ClientViewTab = 'overview' | 'payroll_dbt' | 'compliance_contracts' | 'apprentices' | 'spoc_logs';

export const ClientDashboard: React.FC = () => {
  const { 
    user, 
    getActiveClientSubmission, 
    addApprentice, 
    removeApprentice, 
    updateApprentice, 
    processMonthlyPayrollBatch, 
    fileDBTClaim,
    assignCompanySpoc
  } = useStore();

  const [activeTab, setActiveTab] = useState<ClientViewTab>('overview');
  const [activeMainView, setActiveMainView] = useState<'intake' | 'dashboard'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [claimSuccessAlert, setClaimSuccessAlert] = useState<string | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showDBTClaimModal, setShowDBTClaimModal] = useState(false);
  const [selectedContractCandidate, setSelectedContractCandidate] = useState<ApprenticeRecord | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<any>(null);

  // SPOC State & Modal
  const [showSpocModal, setShowSpocModal] = useState(false);
  const activeSubmission = getActiveClientSubmission();
  const currentSpoc = user?.apprenticeMetrics?.assignedCompanySpoc || activeSubmission?.assigned_company_spoc;
  const [spocNameInput, setSpocNameInput] = useState('');
  const [spocEmailInput, setSpocEmailInput] = useState('');
  const [spocPhoneInput, setSpocPhoneInput] = useState('');

  // New Candidate Form State
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    email: '',
    phone: '',
    aadhaarNumber: '',
    tradeOrRole: '',
    qualification: 'B.Tech / B.Sc / Diploma',
    stipendAmount: 18500,
    dbtEligibleAmount: 4500,
    joiningDate: new Date().toISOString().split('T')[0],
    bankAccountNumber: '',
    ifscCode: 'HDFC0001824',
    spocEmail: '',
    spocName: ''
  });

  // Candidate Document State
  const [candidateDocs, setCandidateDocs] = useState<{
    aadhaarDoc?: UploadedDocument;
    educationDoc?: UploadedDocument;
    bankProofDoc?: UploadedDocument;
    resumeDoc?: UploadedDocument;
  }>({});

  const hasSubmittedIntake = Boolean(activeSubmission && activeSubmission.status === 'submitted');

  useEffect(() => {
    if (!hasSubmittedIntake) {
      setActiveMainView('intake');
    } else {
      setActiveMainView('dashboard');
    }
  }, [hasSubmittedIntake]);

  // Pre-fill SPOC Email from submission or user
  useEffect(() => {
    const spocEmailDefault = activeSubmission?.responses?.complianceOfficerEmail || user?.email || 'spoc@novatech.io';
    const spocNameDefault = activeSubmission?.responses?.complianceOfficerName || user?.full_name || 'Compliance SPOC';
    setCandidateForm(prev => ({
      ...prev,
      spocEmail: prev.spocEmail || spocEmailDefault,
      spocName: prev.spocName || spocNameDefault
    }));
  }, [activeSubmission, user]);

  const defaultEmptyMetrics = {
    clientName: user?.full_name || 'Client Workspace',
    companyName: user?.company_name || '',
    totalApprenticesEligible: 0,
    currentOnboardedApprentices: 0,
    remainingNumbersLeft: 0,
    dbtClaimedLastMonth: 0,
    pendingAmountClaimable: 0,
    lastMonthPayroll: {
      totalDisbursed: 0,
      stipendProcessedCount: 0,
      payoutDate: 'Pending Intake',
      status: 'Pending Approval' as const,
      breakdown: {
        baseStipend: 0,
        dbtGovtShare: 0,
        companyShare: 0
      }
    },
    contractLetters: {
      totalGenerated: 0,
      signedCount: 0,
      pendingSignature: 0,
      lastGeneratedDate: '-'
    },
    lastMonthCNRemarks: {
      remarkCode: 'CN-INITIAL',
      summary: 'New workspace registered. Complete the intake form to initialize compliance tracking.',
      status: 'Action Required' as const,
      auditDate: new Date().toISOString().split('T')[0],
      details: 'Fill out the 4-section apprentice intake form to allocate quota and enable DBT subsidies.'
    },
    lastMonthOnboardedList: [],
    dbtClaimsHistory: [],
    spocEmailLogs: []
  };

  const metrics = user?.apprenticeMetrics || defaultEmptyMetrics;
  const clientDisplayName = metrics.companyName || user?.company_name || user?.full_name || metrics.clientName || 'Client Workspace';

  const quotaChartData = [
    { name: 'Onboarded', value: metrics.currentOnboardedApprentices, color: '#18181b' },
    { name: 'Remaining Quota', value: metrics.remainingNumbersLeft, color: '#e4e4e7' }
  ];

  const financialChartData = [
    { name: 'Company Share', amount: metrics.lastMonthPayroll.breakdown.companyShare, color: '#4a7c93' },
    { name: 'DBT Govt Subsidy', amount: metrics.dbtClaimedLastMonth, color: '#10b981' },
    { name: 'Pending Claim', amount: metrics.pendingAmountClaimable, color: '#f04e37' }
  ];

  const candidateList = metrics.lastMonthOnboardedList || [];
  const spocLogs = metrics.spocEmailLogs || [];

  const filteredApprentices = candidateList.filter(app => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tradeOrRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Handle Document File Change
  const handleDocFileSelect = async (
    file: File | null,
    category: 'Aadhaar' | 'Education' | 'Bank Proof' | 'Resume'
  ) => {
    if (!file) return;
    const doc = await processUploadedFile(file, category);
    if (category === 'Aadhaar') setCandidateDocs(prev => ({ ...prev, aadhaarDoc: doc }));
    if (category === 'Education') setCandidateDocs(prev => ({ ...prev, educationDoc: doc }));
    if (category === 'Bank Proof') setCandidateDocs(prev => ({ ...prev, bankProofDoc: doc }));
    if (category === 'Resume') setCandidateDocs(prev => ({ ...prev, resumeDoc: doc }));
  };

  // Handle Adding New Candidate & Triggering SPOC Email
  const handleAddCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm.name || !candidateForm.tradeOrRole || !candidateForm.phone) return;

    const newCandidate = await addApprentice({
      name: candidateForm.name,
      email: candidateForm.email || `${candidateForm.name.toLowerCase().replace(/\s+/g, '.')}@portal.edu`,
      phone: candidateForm.phone,
      aadhaarNumber: candidateForm.aadhaarNumber || '4523-XXXX-9901',
      tradeOrRole: candidateForm.tradeOrRole,
      qualification: candidateForm.qualification,
      onboardingDate: candidateForm.joiningDate,
      stipendAmount: Number(candidateForm.stipendAmount) || 18500,
      dbtEligibleAmount: Number(candidateForm.dbtEligibleAmount) || 4500,
      contractStatus: 'Generated',
      attendanceRate: '100%',
      daysPresent: 26,
      totalWorkingDays: 26,
      status: 'Active',
      bankAccountNumber: candidateForm.bankAccountNumber || '987654321012',
      ifscCode: candidateForm.ifscCode || 'HDFC0001824',
      spocEmail: candidateForm.spocEmail,
      spocName: candidateForm.spocName,
      documents: {
        aadhaarDoc: candidateDocs.aadhaarDoc,
        educationDoc: candidateDocs.educationDoc,
        bankProofDoc: candidateDocs.bankProofDoc,
        resumeDoc: candidateDocs.resumeDoc,
        aadhaarFile: candidateDocs.aadhaarDoc?.name || 'aadhaar_card_doc.pdf',
        educationFile: candidateDocs.educationDoc?.name || 'degree_marksheet.pdf',
        bankProofFile: candidateDocs.bankProofDoc?.name || 'bank_passbook_doc.pdf',
        resumeFile: candidateDocs.resumeDoc?.name || 'candidate_resume.docx'
      }
    });

    const spocTarget = candidateForm.spocEmail || 'SPOC';
    setClaimSuccessAlert(`Candidate ${candidateForm.name} onboarded. SPOC notification email dispatched to ${spocTarget}.`);
    setTimeout(() => setClaimSuccessAlert(null), 6000);

    setShowAddModal(false);
    setCandidateDocs({});
    setCandidateForm({
      name: '',
      email: '',
      phone: '',
      aadhaarNumber: '',
      tradeOrRole: '',
      qualification: 'B.Tech / B.Sc / Diploma',
      stipendAmount: 18500,
      dbtEligibleAmount: 4500,
      joiningDate: new Date().toISOString().split('T')[0],
      bankAccountNumber: '',
      ifscCode: 'HDFC0001824',
      spocEmail: candidateForm.spocEmail,
      spocName: candidateForm.spocName
    });
  };

  // Handle Payroll Run
  const handleRunPayrollBatch = async () => {
    const res = await processMonthlyPayrollBatch();
    setClaimSuccessAlert(`Monthly payroll processed for ${res.count} candidates (₹${res.totalDisbursed.toLocaleString()} disbursed). Pending DBT subsidies unlocked for claiming!`);
    setTimeout(() => setClaimSuccessAlert(null), 6000);
    setShowPayrollModal(false);
  };

  // Handle DBT Claim
  const handleFileDBTClaim = async () => {
    if (metrics.pendingAmountClaimable <= 0) return;
    const claim = await fileDBTClaim('August 2026 Cycle', metrics.pendingAmountClaimable);
    setClaimSuccessAlert(`Government DBT subsidy claim filed successfully! Reference ID: ${claim.utrReference}`);
    setTimeout(() => setClaimSuccessAlert(null), 6000);
    setShowDBTClaimModal(false);
  };

  // Handle Save SPOC Contact
  const handleSaveSpoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spocNameInput.trim() || !spocEmailInput.trim()) return;
    assignCompanySpoc(activeSubmission?.id || '', {
      name: spocNameInput.trim(),
      email: spocEmailInput.trim().toLowerCase(),
      phone: spocPhoneInput.trim(),
      roleTitle: 'Designated SPOC'
    });
    setShowSpocModal(false);
    setClaimSuccessAlert(`Designated SPOC updated: ${spocNameInput.trim()} (${spocEmailInput.trim().toLowerCase()}). All onboarding documents will be dispatched to this address.`);
    setTimeout(() => setClaimSuccessAlert(null), 6000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Quota', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'payroll_dbt', label: 'Payroll & DBT Subsidy', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'compliance_contracts', label: 'Contracts & CN Remarks', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'apprentices', label: `Apprentice Roster (${filteredApprentices.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'spoc_logs', label: `SPOC Dispatches (${spocLogs.length})`, icon: <Mail className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-7 font-sans text-zinc-900">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg leading-none">✦</span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Client Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
            {clientDisplayName}
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Apprentice Quota Allocation, Multi-Format Document Verification & Automated SPOC Notification
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-200/80 border border-zinc-300 self-start md:self-auto">
          <button
            onClick={() => setActiveMainView('intake')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMainView === 'intake'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Intake Application</span>
          </button>

          <button
            onClick={() => setActiveMainView('dashboard')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMainView === 'dashboard'
                ? 'bg-black text-white shadow-sm'
                : 'text-zinc-600 hover:text-black'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Analytics Dashboard</span>
          </button>
        </div>
      </div>

      {/* Claim Toast Notice */}
      <AnimatePresence>
        {claimSuccessAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-2xl bg-zinc-900 text-white flex items-center justify-between text-xs shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{claimSuccessAlert}</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">Live Delivery Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main View Selection */}
      {activeMainView === 'intake' ? (
        <div className="space-y-4">
          {!hasSubmittedIntake && (
            <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-between text-xs text-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold">*</span>
                <span>
                  <strong>Step 1:</strong> Complete your candidate intake requirements below to configure your apprentice quota.
                </span>
              </div>
            </div>
          )}
          <ClientIntakeWizard />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-200/80 border border-zinc-300 overflow-x-auto w-fit">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ClientViewTab)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer select-none ${
                    isActive ? 'text-black' : 'text-zinc-600 hover:text-black'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="clientActiveSectionPill"
                      className="absolute inset-0 bg-white border border-zinc-300 rounded-full shadow-sm -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Segmented Tab Content */}
          <div className="min-h-[420px]">
            <AnimatePresence mode="wait">
              
              {/* TAB 1: Overview & Quota */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Designated Notification SPOC Card */}
                  <div className="p-5 sm:p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-zinc-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            Designated Notification SPOC
                          </span>
                          {currentSpoc?.email ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active Recipient
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Setup Required
                            </span>
                          )}
                        </div>
                        {currentSpoc?.email ? (
                          <div className="mt-1">
                            <span className="text-sm font-bold text-zinc-900">{currentSpoc.name}</span>
                            <span className="text-xs text-zinc-500 font-mono ml-2">({currentSpoc.email})</span>
                            {currentSpoc.phone && <span className="text-xs text-zinc-400 ml-2">· {currentSpoc.phone}</span>}
                            <p className="text-xs text-zinc-500 mt-0.5">
                              All candidate dossiers, verified documents, and onboarding notifications are automatically dispatched to this email.
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-600 mt-1">
                            Please configure the primary SPOC name and email address. All candidate onboarding dossiers and documents will be sent to this recipient.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSpocNameInput(currentSpoc?.name || '');
                        setSpocEmailInput(currentSpoc?.email || '');
                        setSpocPhoneInput(currentSpoc?.phone || '');
                        setShowSpocModal(true);
                      }}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center shrink-0 shadow-sm"
                    >
                      {currentSpoc?.email ? 'Edit SPOC' : 'Configure SPOC'}
                    </button>
                  </div>

                  {/* Grid Stat Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200 rounded-3xl bg-white overflow-hidden shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
                    
                    <div className="p-6 sm:p-7">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        TOTAL CAPACITY
                      </span>
                      <div className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight">
                        {metrics.totalApprenticesEligible}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">
                        Eligible candidate quota
                      </div>
                    </div>

                    <div className="p-6 sm:p-7">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        CURRENTLY ONBOARDED
                      </span>
                      <div className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight">
                        {metrics.currentOnboardedApprentices}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">
                        Active in national training
                      </div>
                    </div>

                    <div className="p-6 sm:p-7 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          REMAINING SLOTS
                        </span>
                        <div className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight">
                          {metrics.remainingNumbersLeft}
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Available to fill</span>
                        <button
                          onClick={() => { setActiveTab('apprentices'); setShowAddModal(true); }}
                          className="font-bold text-black hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>+ Add Candidate</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Quota Chart & Overview Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-6">
                      <GlassCard className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-2 font-mono">
                              QUOTA UTILIZATION GAUGE
                            </h3>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
                              {metrics.totalApprenticesEligible > 0 ? Math.round((metrics.currentOnboardedApprentices / metrics.totalApprenticesEligible) * 100) : 0}% Filled
                            </span>
                          </div>

                          <div className="h-48 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={quotaChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={4}
                                  dataKey="value"
                                  stroke="#ffffff"
                                  strokeWidth={3}
                                >
                                  {quotaChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', color: '#09090b', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-black" />
                            <span className="text-zinc-500">Onboarded: <strong className="text-zinc-900">{metrics.currentOnboardedApprentices}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                            <span className="text-zinc-500">Remaining: <strong className="text-zinc-900">{metrics.remainingNumbersLeft}</strong></span>
                          </div>
                        </div>
                      </GlassCard>
                    </div>

                    <div className="lg:col-span-6">
                      <GlassCard className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 border-b border-zinc-100 pb-3 mb-4 font-mono">
                            WORKSPACE STATUS & ACTIONS
                          </h3>

                          <div className="space-y-3 text-xs">
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                              <div>
                                <div className="font-bold text-zinc-900">Intake Form Submission</div>
                                <div className="text-xs text-zinc-500">
                                  {hasSubmittedIntake ? 'Completed & Logged in Registry' : 'Action Required — Complete candidate intake'}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                hasSubmittedIntake ? 'bg-zinc-900 text-white' : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {hasSubmittedIntake ? 'VERIFIED' : 'PENDING'}
                              </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                              <div>
                                <div className="font-bold text-zinc-900">Active DBT Scheme</div>
                                <div className="text-xs text-zinc-500">Government subsidy per apprentice</div>
                              </div>
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-zinc-200 text-zinc-800">
                                ₹4,500/MO
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-5">
                          <button
                            onClick={() => { setActiveTab('apprentices'); setShowAddModal(true); }}
                            className="flex-1 py-3 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ONBOARD APPRENTICE</span>
                          </button>
                          <button
                            onClick={() => setActiveMainView('intake')}
                            className="px-4 py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold border border-zinc-200 cursor-pointer transition-all"
                          >
                            Edit Intake
                          </button>
                        </div>
                      </GlassCard>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: Payroll & DBT Subsidies */}
              {activeTab === 'payroll_dbt' && (
                <motion.div
                  key="payroll_dbt"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200 rounded-3xl bg-white overflow-hidden shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
                    
                    <div className="p-6 sm:p-7">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        DBT CLAIMED (LAST MONTH)
                      </span>
                      <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                        ₹{metrics.dbtClaimedLastMonth.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">
                        Govt subsidy direct transfer
                      </div>
                    </div>

                    <div className="p-6 sm:p-7 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          PENDING CLAIMABLE AMOUNT
                        </span>
                        <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                          ₹{metrics.pendingAmountClaimable.toLocaleString()}
                        </div>
                      </div>
                      {metrics.pendingAmountClaimable > 0 && (
                        <div className="mt-3 pt-2 border-t border-zinc-100 flex justify-end">
                          <button
                            onClick={() => setShowDBTClaimModal(true)}
                            className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>File DBT Claim</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-6 sm:p-7 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          PAYROLL VOLUME DISBURSED
                        </span>
                        <div className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                          ₹{metrics.lastMonthPayroll.totalDisbursed.toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-medium">{metrics.lastMonthPayroll.stipendProcessedCount} stipends</span>
                        <button
                          onClick={() => setShowPayrollModal(true)}
                          className="font-bold text-black hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Run Payroll</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Financial Bar Chart & DBT Claim History */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-7">
                      <GlassCard className="p-6 h-full">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 font-mono">
                            MONTHLY FINANCIALS & DBT SHARE COMPARISON
                          </h3>
                          <span className="text-xs font-mono text-zinc-400">Values in ₹ INR</span>
                        </div>

                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                                tickFormatter={(val) => `₹${val / 1000}k`} 
                              />
                              <Tooltip 
                                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px', color: '#09090b', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                              />
                              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                {financialChartData.map((entry, index) => (
                                  <Cell key={`bar-cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </GlassCard>
                    </div>

                    <div className="lg:col-span-5">
                      <GlassCard className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-3">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 font-mono">
                              DBT REIMBURSEMENT HISTORY
                            </h3>
                            <button
                              onClick={() => setShowDBTClaimModal(true)}
                              className="text-[11px] font-bold text-black hover:underline cursor-pointer"
                            >
                              + File Claim
                            </button>
                          </div>

                          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 text-xs">
                            {(metrics.dbtClaimsHistory && metrics.dbtClaimsHistory.length > 0) ? (
                              metrics.dbtClaimsHistory.map(claim => (
                                <div key={claim.id} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-zinc-900">{claim.monthYear}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      {claim.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-zinc-500 text-[11px]">
                                    <span>Claimed: <strong>₹{claim.amountClaimed.toLocaleString()}</strong></span>
                                    <span className="font-mono text-zinc-400">{claim.utrReference}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-center text-zinc-400">
                                No claims filed yet. Run monthly payroll to generate claimable DBT subsidies.
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setShowPayrollModal(true)}
                          className="w-full mt-4 py-2.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>RUN PAYROLL CYCLE</span>
                        </button>
                      </GlassCard>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: Compliance & Contracts */}
              {activeTab === 'compliance_contracts' && (
                <motion.div
                  key="compliance_contracts"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200 rounded-3xl bg-white overflow-hidden shadow-sm divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
                    <div className="p-6 sm:p-7">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        CONTRACTS GENERATED
                      </span>
                      <div className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                        {metrics.contractLetters.totalGenerated}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">Official apprenticeship contracts</div>
                    </div>

                    <div className="p-6 sm:p-7">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        SIGNED & VERIFIED
                      </span>
                      <div className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                        {metrics.contractLetters.signedCount}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">Dual signatures complete</div>
                    </div>

                    <div className="p-6 sm:p-7">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        PENDING SIGNATURES
                      </span>
                      <div className="text-4xl font-extrabold text-zinc-900 tracking-tight">
                        {metrics.contractLetters.pendingSignature}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-1">Signatures in progress</div>
                    </div>
                  </div>

                  <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-black">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-mono">
                            LAST MONTH CN (COMPLIANCE & CREDIT NOTE) REMARK
                          </h3>
                          <p className="text-[11px] font-mono text-zinc-400">Audit Ref: {metrics.lastMonthCNRemarks.remarkCode}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {metrics.lastMonthCNRemarks.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 leading-relaxed mb-2 font-medium">
                      {metrics.lastMonthCNRemarks.summary}
                    </p>
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 font-mono">
                      {metrics.lastMonthCNRemarks.details}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* TAB 4: Apprentice Registry Table */}
              {activeTab === 'apprentices' && (
                <motion.div
                  key="apprentices"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                          APPRENTICES ONBOARD REGISTRY
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                          Manage candidate profiles, multi-format compliance documents (.pdf, .docx, .txt), and legal contracts.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 text-xs focus:outline-none focus:border-black w-40 sm:w-48 font-medium"
                          />
                        </div>

                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="text-xs px-3 py-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold focus:outline-none focus:border-black"
                        >
                          <option value="all">All ({candidateList.length})</option>
                          <option value="active">Active</option>
                          <option value="under training">Under Training</option>
                        </select>

                        <button
                          onClick={() => setShowAddModal(true)}
                          className="px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Apprentice</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-200 font-mono">
                          <tr>
                            <th className="py-3 px-4">Candidate ID & Name</th>
                            <th className="py-3 px-4">Trade / Role</th>
                            <th className="py-3 px-4">Aadhaar & Bank</th>
                            <th className="py-3 px-4">Monthly Stipend</th>
                            <th className="py-3 px-4">DBT Govt Share</th>
                            <th className="py-3 px-4">Compliance Files</th>
                            <th className="py-3 px-4">Contract</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white font-medium">
                          {filteredApprentices.length > 0 ? (
                            filteredApprentices.map((app) => (
                              <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-zinc-900 text-xs">{app.name}</div>
                                  <div className="text-[10px] font-mono text-zinc-400">{app.id} · {app.phone || 'Phone Verified'}</div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <div className="text-zinc-800 font-semibold">{app.tradeOrRole}</div>
                                  <div className="text-[10px] text-zinc-400">{app.qualification}</div>
                                </td>

                                <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                                  <div>{app.aadhaarNumber || '4523-XXXX-9912'}</div>
                                  <div className="text-[10px] text-zinc-400">{app.ifscCode || 'HDFC0001824'}</div>
                                </td>

                                <td className="py-3.5 px-4 font-bold text-zinc-900">
                                  ₹{app.stipendAmount.toLocaleString()}
                                </td>

                                <td className="py-3.5 px-4 font-bold text-emerald-600">
                                  ₹{app.dbtEligibleAmount.toLocaleString()}
                                </td>

                                {/* Compliance Files Slot */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {app.documents?.aadhaarDoc || app.documents?.aadhaarFile ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(app.documents?.aadhaarDoc || { name: app.documents?.aadhaarFile || 'Aadhaar Card.pdf', type: 'pdf' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 cursor-pointer"
                                        title="View Aadhaar"
                                      >
                                        Aadhaar ↗
                                      </button>
                                    ) : null}

                                    {app.documents?.educationDoc || app.documents?.educationFile ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(app.documents?.educationDoc || { name: app.documents?.educationFile || 'Degree.docx', type: 'docx' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 cursor-pointer"
                                        title="View Degree"
                                      >
                                        Degree ↗
                                      </button>
                                    ) : null}

                                    {app.documents?.resumeDoc || app.documents?.resumeFile ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(app.documents?.resumeDoc || { name: app.documents?.resumeFile || 'Resume.docx', type: 'docx' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 cursor-pointer"
                                        title="View Resume"
                                      >
                                        Resume ↗
                                      </button>
                                    ) : null}
                                  </div>
                                </td>

                                <td className="py-3.5 px-4">
                                  <button
                                    onClick={() => setSelectedContractCandidate(app)}
                                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <FileSignature className="w-3 h-3" />
                                    <span>{app.contractStatus} ↗</span>
                                  </button>
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => removeApprentice(app.id)}
                                    className="p-1.5 rounded-full hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Remove Candidate"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-10 text-center text-zinc-400 text-xs">
                                No candidates registered yet. Click &quot;Add Apprentice&quot; to onboard candidates into your quota.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* TAB 5: SPOC Email Dispatches Log */}
              {activeTab === 'spoc_logs' && (
                <motion.div
                  key="spoc_logs"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassCard className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                          SPOC EMAIL DISPATCH REGISTRY
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                          Automated email notifications triggered to designated SPOCs / Compliance Officers upon candidate onboarding.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {spocLogs.length} Dispatches Logged
                      </span>
                    </div>

                    <div className="space-y-3">
                      {spocLogs.length > 0 ? (
                        spocLogs.map(log => (
                          <div key={log.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-zinc-600" />
                                <span className="font-bold text-zinc-900">{log.subject}</span>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {log.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-500 pt-1 border-t border-zinc-200 font-mono">
                              <div>Recipient SPOC: <strong className="text-zinc-800">{log.recipientEmail}</strong></div>
                              <div>Candidate: <strong className="text-zinc-800">{log.candidateName}</strong></div>
                              <div>Dispatched: <span>{new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                            </div>

                            {log.documentNames && log.documentNames.length > 0 && (
                              <div className="pt-1 text-[11px] flex items-center gap-1.5 flex-wrap">
                                <span className="text-zinc-400 font-mono">Attached Docs:</span>
                                {log.documentNames.map((d, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700 font-mono text-[10px]">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                          No SPOC email notifications dispatched yet. Onboard a candidate to trigger automated SPOC alerts.
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      )}

      {/* MODAL 1: Add Apprentice Candidate with Multi-Format Documents (.pdf, .docx, .txt) & SPOC Email */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-7 border border-zinc-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">✦</span>
                  <h3 className="text-sm font-extrabold text-zinc-900 uppercase font-mono">
                    Onboard Candidate with Compliance Documents
                  </h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-black cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCandidateSubmit} className="space-y-4 text-xs">
                {/* 1. Candidate Bio Details */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    1. Candidate Bio & Role Specification
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Candidate Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={candidateForm.name}
                        onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 00000"
                        value={candidateForm.phone}
                        onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="priya@portal.edu"
                        value={candidateForm.email}
                        onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">Aadhaar Card Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="XXXX-XXXX-9901"
                        value={candidateForm.aadhaarNumber}
                        onChange={(e) => setCandidateForm({ ...candidateForm, aadhaarNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-mono focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-700 mb-1">Target Role / Specialization *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Full-Stack Developer Trainee / Operations Associate"
                        value={candidateForm.tradeOrRole}
                        onChange={(e) => setCandidateForm({ ...candidateForm, tradeOrRole: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Candidate Compliance Documents (.docx, .pdf, .txt) */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    2. Upload Mandatory Candidate Documents (.docx, .pdf, .txt)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Aadhaar Card */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Aadhaar Card Document *</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700">PDF / DOCX / TXT</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.aadhaarDoc?.name || 'Attach Aadhaar (.pdf/.docx/.txt)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleDocFileSelect(e.target.files?.[0] || null, 'Aadhaar')}
                        />
                      </label>
                    </div>

                    {/* Educational Degree */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Degree / Marksheet *</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700">PDF / DOCX / TXT</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.educationDoc?.name || 'Attach Degree (.pdf/.docx/.txt)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleDocFileSelect(e.target.files?.[0] || null, 'Education')}
                        />
                      </label>
                    </div>

                    {/* Bank Passbook / Cheque */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Bank Passbook / Cheque</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700">PDF / DOCX / TXT</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.bankProofDoc?.name || 'Attach Bank Proof'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleDocFileSelect(e.target.files?.[0] || null, 'Bank Proof')}
                        />
                      </label>
                    </div>

                    {/* Resume / CV */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Candidate Resume / CV</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700">DOCX / PDF / TXT</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.resumeDoc?.name || 'Attach Resume (.docx/.pdf/.txt)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleDocFileSelect(e.target.files?.[0] || null, 'Resume')}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Automated SPOC Email Notification Setup */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-600" />
                      <span>SPOC Email ID (Auto-Notification Trigger) *</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Auto-Trigger</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Once submitted, an official onboarding dossier with document links will be automatically dispatched to this SPOC email ID.
                  </p>
                  <input
                    type="email"
                    required
                    placeholder="spoc@company.com"
                    value={candidateForm.spocEmail}
                    onChange={(e) => setCandidateForm({ ...candidateForm, spocEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-black hover:bg-zinc-800 text-white font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Onboard & Dispatch SPOC Alert ↗</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Run Monthly Payroll Batch */}
      <AnimatePresence>
        {showPayrollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-7 border border-zinc-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase font-mono">
                  Execute Monthly Payroll Cycle
                </h3>
                <button onClick={() => setShowPayrollModal(false)} className="text-zinc-400 hover:text-black cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                This will disburse the monthly stipends for <strong>{candidateList.length} active apprentices</strong>, calculate the pro-rated company share, and release the government DBT subsidy reimbursement claim.
              </p>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Gross Stipend Volume:</span> <span className="font-extrabold text-zinc-900">₹{(candidateList.length * 18500).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Company Payout Share:</span> <span className="font-bold text-zinc-900">₹{(candidateList.length * 14000).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">DBT Govt Subsidy Share:</span> <span className="font-extrabold text-emerald-700">₹{(candidateList.length * 4500).toLocaleString()}</span></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunPayrollBatch}
                  className="px-6 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span>Confirm & Disburse Payroll</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: File DBT Subsidy Claim */}
      <AnimatePresence>
        {showDBTClaimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-7 border border-zinc-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase font-mono">
                  File Government DBT Subsidy Claim
                </h3>
                <button onClick={() => setShowDBTClaimModal(false)} className="text-zinc-400 hover:text-black cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                Submit an official DBT reimbursement claim to the National Apprenticeship Promotion Scheme (NAPS) for verified monthly candidate stipends.
              </p>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Claim Cycle:</span> <span className="font-bold text-zinc-900">August 2026 Cycle</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Total Apprentices:</span> <span className="font-bold text-zinc-900">{candidateList.length} Verified Candidates</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Claim Amount:</span> <span className="font-extrabold text-emerald-700 text-sm">₹{metrics.pendingAmountClaimable.toLocaleString()}</span></div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDBTClaimModal(false)}
                  className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFileDBTClaim}
                  className="px-6 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span>Submit DBT Claim ↗</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Legal Contract Agreement Preview */}
      <AnimatePresence>
        {selectedContractCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-8 border border-zinc-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    Form Schedule-V · National Apprenticeship Act
                  </span>
                  <h3 className="text-base font-extrabold text-zinc-900">
                    Tripartite Apprenticeship Contract Agreement
                  </h3>
                </div>
                <button onClick={() => setSelectedContractCandidate(null)} className="text-zinc-400 hover:text-black cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formal Contract Text Body */}
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4 text-xs font-serif leading-relaxed text-zinc-800">
                <p>
                  This Apprenticeship Agreement is entered into on <strong>{selectedContractCandidate.onboardingDate}</strong> between <strong>{clientDisplayName}</strong> (hereinafter referred to as the &quot;Employer&quot;) and <strong>{selectedContractCandidate.name}</strong> (hereinafter referred to as the &quot;Apprentice&quot;).
                </p>

                <div className="p-4 rounded-xl bg-white border border-zinc-200 font-sans space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500 font-medium">Contract ID:</span> <span className="font-mono font-bold text-zinc-900">NAPS-AGR-{selectedContractCandidate.id}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500 font-medium">Designated Trade / Role:</span> <span className="font-bold text-zinc-900">{selectedContractCandidate.tradeOrRole}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500 font-medium">Monthly Total Stipend:</span> <span className="font-extrabold text-zinc-900">₹{selectedContractCandidate.stipendAmount.toLocaleString()} / month</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500 font-medium">Government DBT Subsidy:</span> <span className="font-bold text-emerald-700">₹{selectedContractCandidate.dbtEligibleAmount.toLocaleString()} / month</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500 font-medium">Training Duration:</span> <span className="font-medium text-zinc-800">12 Months (Full-Time Apprenticeship)</span></div>
                </div>

                <p className="text-zinc-600 text-[11px] font-sans">
                  * Both parties agree to abide by the provisions of the Apprentices Act, maintaining compliant attendance logging and bi-weekly competency training evaluations.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono font-bold text-zinc-700">Status: {selectedContractCandidate.contractStatus}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateApprentice(selectedContractCandidate.id, { contractStatus: 'Signed' });
                      setSelectedContractCandidate({ ...selectedContractCandidate, contractStatus: 'Signed' });
                      setClaimSuccessAlert(`Contract marked Signed for ${selectedContractCandidate.name}!`);
                    }}
                    className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold cursor-pointer transition-all"
                  >
                    Mark as Signed
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedContractCandidate(null)}
                    className="px-5 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Universal Document Viewer & Downloader (.pdf, .docx, .txt) */}
      <DocumentViewerModal
        document={previewingDoc}
        onClose={() => setPreviewingDoc(null)}
      />

      {/* MODAL 6: Configure / Edit Designated Notification SPOC */}
      <AnimatePresence>
        {showSpocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">
                    {currentSpoc?.email ? 'Edit Designated SPOC' : 'Configure Designated SPOC'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Enter the primary contact person who will receive candidate documents and onboarding notifications.
                  </p>
                </div>
                <button
                  onClick={() => setShowSpocModal(false)}
                  className="text-zinc-400 hover:text-black cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSpoc} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    SPOC Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={spocNameInput}
                    onChange={(e) => setSpocNameInput(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    SPOC Notification Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={spocEmailInput}
                    onChange={(e) => setSpocEmailInput(e.target.value)}
                    placeholder="e.g. rahul.sharma@company.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-hidden focus:border-black transition-colors"
                  />
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    All compliance dossiers and candidate files will be sent to this email.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={spocPhoneInput}
                    onChange={(e) => setSpocPhoneInput(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-xs text-zinc-900 focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setShowSpocModal(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-sm"
                  >
                    Save Designated SPOC
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
