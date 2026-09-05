'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { ApprenticeRecord, UploadedDocument, SPOCEmailLog, NAPSPortalRecord, ComplianceInvoiceRecord, ComplianceActionItem, ClientApprenticeMetrics, DBTClaimRecord } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClientIntakeWizard } from './ClientIntakeWizard';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import { processUploadedFile, downloadDocumentFile } from '@/lib/document-utils';
import { NavyWaveBackground } from '@/components/ui/NavyWaveBackground';
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
  Paperclip,
  Table,
  Filter
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

type ClientViewTab = 'compliance_report' | 'naps_registry' | 'compliance_contracts' | 'apprentices' | 'spoc_logs';

export const ALL_REPORT_MONTHS = [
  { value: 'all', label: 'All Months', full: 'ALL MONTHS', num: '' },
  { value: 'JAN', label: 'January', full: 'JANUARY', num: '01' },
  { value: 'FEB', label: 'February', full: 'FEBRUARY', num: '02' },
  { value: 'MAR', label: 'March', full: 'MARCH', num: '03' },
  { value: 'APR', label: 'April', full: 'APRIL', num: '04' },
  { value: 'MAY', label: 'May', full: 'MAY', num: '05' },
  { value: 'JUN', label: 'June', full: 'JUNE', num: '06' },
  { value: 'JUL', label: 'July', full: 'JULY', num: '07' },
  { value: 'AUG', label: 'August', full: 'AUGUST', num: '08' },
  { value: 'SEP', label: 'September', full: 'SEPTEMBER', num: '09' },
  { value: 'OCT', label: 'October', full: 'OCTOBER', num: '10' },
  { value: 'NOV', label: 'November', full: 'NOVEMBER', num: '11' },
  { value: 'DEC', label: 'December', full: 'DECEMBER', num: '12' },
];

export const ALL_REPORT_YEARS = [
  { value: 'all', label: 'All Years' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028' },
];

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

  const [activeTab, setActiveTab] = useState<ClientViewTab>('compliance_report');
  const [activeMainView, setActiveMainView] = useState<'intake' | 'dashboard'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Interactive Month and Year Filters
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('all');
  const [selectedReportYear, setSelectedReportYear] = useState<string>('all');
  const [filterCandidatesByMonth, setFilterCandidatesByMonth] = useState<boolean>(false);

  const [napsPayoutMonthFilter, setNapsPayoutMonthFilter] = useState<string>('all');
  const [napsClientSearch, setNapsClientSearch] = useState('');
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
    qualification: '',
    stipendAmount: 18500,
    dbtEligibleAmount: 4500,
    joiningDate: new Date().toISOString().split('T')[0],
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    spocEmail: '',
    spocName: ''
  });

  // Candidate Document State
  const [candidateDocs, setCandidateDocs] = useState<{
    photoDoc?: UploadedDocument;
    signatureDoc?: UploadedDocument;
    aadhaarDoc?: UploadedDocument;
    educationDoc?: UploadedDocument;
    bankProofDoc?: UploadedDocument;
    resumeDoc?: UploadedDocument;
  }>({});

  // Role Selection State (from client's intake selections)
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');

  const clientChosenRoles: string[] = useMemo(() => {
    const roles = activeSubmission?.responses?.tradesRequired;
    if (Array.isArray(roles) && roles.length > 0) {
      return roles;
    }
    return [
      'Full-Stack Developer Trainee',
      'Business Operations Associate',
      'Cloud & DevOps Associate',
      'Data & Analytics Trainee'
    ];
  }, [activeSubmission?.responses?.tradesRequired]);

  const hasSubmittedIntake = Boolean(activeSubmission && activeSubmission.status === 'submitted');

  useEffect(() => {
    if (!hasSubmittedIntake) {
      setActiveMainView('intake');
    } else {
      setActiveMainView('dashboard');
    }
  }, [hasSubmittedIntake]);

  // Pre-fill SPOC Email prioritizing the designated configured SPOC
  useEffect(() => {
    const designatedEmail = currentSpoc?.email || activeSubmission?.assigned_company_spoc?.email || user?.apprenticeMetrics?.assignedCompanySpoc?.email || activeSubmission?.responses?.complianceOfficerEmail || user?.email || '';
    const designatedName = currentSpoc?.name || activeSubmission?.assigned_company_spoc?.name || user?.apprenticeMetrics?.assignedCompanySpoc?.name || activeSubmission?.responses?.complianceOfficerName || user?.full_name || 'Designated SPOC';
    
    if (designatedEmail) {
      setCandidateForm(prev => ({
        ...prev,
        spocEmail: designatedEmail,
        spocName: designatedName
      }));
    }
  }, [currentSpoc?.email, currentSpoc?.name, activeSubmission?.assigned_company_spoc?.email, user?.apprenticeMetrics?.assignedCompanySpoc?.email, activeSubmission?.responses?.complianceOfficerEmail, user?.email]);

  const defaultEmptyMetrics: ClientApprenticeMetrics = {
    clientName: user?.full_name || 'Client Workspace',
    companyName: user?.company_name || '',
    reportingMonth: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
    napsPortalId: 'Pending Allocation',
    sanctionedQuota: 0,
    totalApprenticesEligible: 0,
    currentOnboardedApprentices: 0,
    remainingNumbersLeft: 0,
    onboardedThisMonth: 0,
    utilizationPercentage: '0.0%',
    dbtClaimedLastMonth: 0,
    dbtAllocationNotUtilized: 0,
    pendingAmountClaimable: 0,
    governmentApproval: {
      totalApproved: 0,
      approvedThisMonth: 0,
      pendingApproval: 0
    },
    lastMonthPayroll: {
      totalDisbursed: 0,
      stipendProcessedCount: 0,
      payoutDate: 'Pending Cycle',
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
      summary: 'Workspace registered. No compliance issues detected.',
      status: 'Clean / No Issues' as const,
      auditDate: new Date().toISOString().split('T')[0],
      details: 'All contracts and stipend disbursements are aligned with Apprenticeship Act guidelines.'
    },
    lastMonthOnboardedList: [] as ApprenticeRecord[],
    dbtClaimsHistory: [] as DBTClaimRecord[],
    spocEmailLogs: [] as SPOCEmailLog[],
    napsPortalRecords: [] as NAPSPortalRecord[],
    invoices: [] as ComplianceInvoiceRecord[],
    actionItems: [] as ComplianceActionItem[]
  };

  const metrics: ClientApprenticeMetrics = user?.apprenticeMetrics || defaultEmptyMetrics;
  const clientDisplayName = activeSubmission?.company_name || user?.company_name || user?.full_name || metrics.companyName || 'Client Workspace';

  // Strict tenant boundary: only display records belonging to THIS authenticated client
  const candidateList = useMemo(() => {
    if (activeSubmission) return activeSubmission.candidates || [];
    if (user?.apprenticeMetrics?.lastMonthOnboardedList) return user.apprenticeMetrics.lastMonthOnboardedList;
    return [];
  }, [activeSubmission, user?.apprenticeMetrics?.lastMonthOnboardedList]);

  const spocLogs = useMemo(() => {
    if (activeSubmission) return activeSubmission.spoc_logs || [];
    if (user?.apprenticeMetrics?.spocEmailLogs) return user.apprenticeMetrics.spocEmailLogs;
    return [];
  }, [activeSubmission, user?.apprenticeMetrics?.spocEmailLogs]);

  const effectiveNapsRecords: NAPSPortalRecord[] = useMemo(() => {
    if (activeSubmission) return activeSubmission.naps_records || [];
    if (user?.apprenticeMetrics?.napsPortalRecords) return user.apprenticeMetrics.napsPortalRecords;
    return [];
  }, [activeSubmission, user?.apprenticeMetrics?.napsPortalRecords]);

  const effectiveInvoices: ComplianceInvoiceRecord[] = useMemo(() => {
    if (activeSubmission) return activeSubmission.invoices || [];
    if (user?.apprenticeMetrics?.invoices) return user.apprenticeMetrics.invoices;
    return [];
  }, [activeSubmission, user?.apprenticeMetrics?.invoices]);

  const effectiveActionItems: ComplianceActionItem[] = useMemo(() => {
    if (activeSubmission) return activeSubmission.action_items || [];
    if (user?.apprenticeMetrics?.actionItems) return user.apprenticeMetrics.actionItems;
    return [];
  }, [activeSubmission, user?.apprenticeMetrics?.actionItems]);

  const effectiveCandidatesList: ApprenticeRecord[] = useMemo(() => {
    return candidateList;
  }, [candidateList]);

  // Real quota calculation from actual intake submission
  const sanctionedQuota = useMemo(() => {
    if (activeSubmission?.responses?.requiredApprenticeCount) {
      const parsed = Number(activeSubmission.responses.requiredApprenticeCount);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (activeSubmission?.sanctioned_quota) return activeSubmission.sanctioned_quota;
    if (metrics.sanctionedQuota && metrics.sanctionedQuota > 0) return metrics.sanctionedQuota;
    return candidateList.length;
  }, [activeSubmission?.responses?.requiredApprenticeCount, activeSubmission?.sanctioned_quota, metrics.sanctionedQuota, candidateList.length]);

  const utilisedQuota = candidateList.length;
  const openQuota = Math.max(0, sanctionedQuota - utilisedQuota);
  const utilisationPercentage = sanctionedQuota > 0 ? ((utilisedQuota / sanctionedQuota) * 100).toFixed(1) + '%' : '0.0%';

  const currentMonthObj = ALL_REPORT_MONTHS.find(m => m.value === selectedReportMonth);
  const reportingMonthStr = useMemo(() => {
    if (selectedReportMonth === 'all' && selectedReportYear === 'all') {
      return activeSubmission?.reporting_month || metrics.reportingMonth || 'ALL REPORTING PERIODS';
    }
    if (selectedReportMonth === 'all') {
      return `FULL YEAR ${selectedReportYear}`;
    }
    if (selectedReportYear === 'all') {
      return `${currentMonthObj?.full || selectedReportMonth} (ALL YEARS)`;
    }
    return `${currentMonthObj?.full || selectedReportMonth}, ${selectedReportYear}`;
  }, [selectedReportMonth, selectedReportYear, currentMonthObj, activeSubmission?.reporting_month, metrics.reportingMonth]);

  const onboardedThisMonth = useMemo(() => {
    return candidateList.filter(c => {
      if (!c.onboardingDate) return false;
      if (selectedReportYear !== 'all' && !c.onboardingDate.includes(selectedReportYear)) {
        return false;
      }
      if (selectedReportMonth !== 'all') {
        const mNum = currentMonthObj?.num;
        if (mNum && !c.onboardingDate.includes(`-${mNum}-`) && !c.onboardingDate.includes(`/${mNum}/`)) {
          return false;
        }
      }
      return true;
    }).length;
  }, [candidateList, selectedReportMonth, selectedReportYear, currentMonthObj]);

  const dbtClaimedReal = useMemo(() => {
    const paidSum = effectiveNapsRecords
      .filter(r => {
        if (r.paymentStatus !== 'PAID') return false;
        const pUpper = (r.payoutMonth || '').toUpperCase();
        if (selectedReportMonth !== 'all' && !pUpper.includes(selectedReportMonth)) return false;
        if (selectedReportYear !== 'all' && !pUpper.includes(selectedReportYear)) return false;
        return true;
      })
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return paidSum;
  }, [effectiveNapsRecords, selectedReportMonth, selectedReportYear]);

  const dbtAllocationNotUtilized = useMemo(() => {
    if (activeSubmission?.dbt_allocation_not_utilized !== undefined) {
      return activeSubmission.dbt_allocation_not_utilized;
    }
    if (openQuota > 0) {
      return openQuota * 1500;
    }
    return 0;
  }, [activeSubmission?.dbt_allocation_not_utilized, openQuota]);

  const totalApprovedGovt = candidateList.filter(c => c.contractStatus === 'Signed' || c.status === 'Active').length;
  const approvedThisMonthGovt = onboardedThisMonth;
  const pendingApprovalGovt = candidateList.filter(c => c.contractStatus === 'Pending Verification' || c.contractStatus === 'Generated').length;

  const portalNapsId = activeSubmission?.naps_portal_id || metrics.napsPortalId || 'Pending Allocation';

  const monthlyNapsSummary = useMemo(() => {
    const monthMap: Record<string, { count: number; dbtTotal: number; paidCount: number; latestPfmsDate: string }> = {};
    effectiveNapsRecords.forEach(r => {
      const m = r.payoutMonth || 'CURRENT';
      const mUpper = m.toUpperCase();
      if (selectedReportMonth !== 'all' && !mUpper.includes(selectedReportMonth)) return;
      if (selectedReportYear !== 'all' && !mUpper.includes(selectedReportYear)) return;

      if (!monthMap[m]) {
        monthMap[m] = { count: 0, dbtTotal: 0, paidCount: 0, latestPfmsDate: '-' };
      }
      monthMap[m].count += 1;
      monthMap[m].dbtTotal += Number(r.amount) || 0;
      if (r.paymentStatus === 'PAID') monthMap[m].paidCount += 1;
      if (r.dbtProcessedToPfmsDate && r.dbtProcessedToPfmsDate !== '-') {
        monthMap[m].latestPfmsDate = r.dbtProcessedToPfmsDate;
      }
    });
    return Object.entries(monthMap).map(([month, data]) => ({
      month,
      stipendPaid: data.count * (Number(activeSubmission?.responses?.stipendPerApprentice) || 18500),
      dbtGovt: data.dbtTotal,
      datePaid: '05/' + (month.includes('-') ? month.split('-')[0] : '07'),
      dbtReleaseDate: data.latestPfmsDate,
      remarks: data.paidCount > 0 
        ? `DBT credited via PFMS to ${data.paidCount} of ${data.count} candidates`
        : `DBT processing pending for ${data.count} candidate contracts`
    }));
  }, [effectiveNapsRecords, selectedReportMonth, selectedReportYear, activeSubmission?.responses?.stipendPerApprentice]);

  const displayedCandidatesList = useMemo(() => {
    if (!filterCandidatesByMonth || (selectedReportMonth === 'all' && selectedReportYear === 'all')) {
      return effectiveCandidatesList;
    }
    return effectiveCandidatesList.filter(c => {
      if (!c.onboardingDate) return false;
      if (selectedReportYear !== 'all' && !c.onboardingDate.includes(selectedReportYear)) return false;
      if (selectedReportMonth !== 'all') {
        const mNum = currentMonthObj?.num;
        if (mNum && !c.onboardingDate.includes(`-${mNum}-`) && !c.onboardingDate.includes(`/${mNum}/`)) return false;
      }
      return true;
    });
  }, [effectiveCandidatesList, filterCandidatesByMonth, selectedReportMonth, selectedReportYear, currentMonthObj]);

  const filteredApprentices = candidateList.filter(app => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tradeOrRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const filteredNapsRecords = useMemo(() => {
    return effectiveNapsRecords.filter((rec) => {
      const recMonthUpper = (rec.payoutMonth || '').toUpperCase();
      const matchesMonth = selectedReportMonth === 'all' || recMonthUpper.includes(selectedReportMonth);
      const matchesYear = selectedReportYear === 'all' || recMonthUpper.includes(selectedReportYear);
      const matchesSearch = !napsClientSearch.trim() ||
        rec.apprenticeCode.toLowerCase().includes(napsClientSearch.toLowerCase()) ||
        rec.contractCode.toLowerCase().includes(napsClientSearch.toLowerCase()) ||
        rec.establishmentCode.toLowerCase().includes(napsClientSearch.toLowerCase()) ||
        rec.beneficiaryId.toLowerCase().includes(napsClientSearch.toLowerCase()) ||
        rec.ojtDistrict.toLowerCase().includes(napsClientSearch.toLowerCase());
      return matchesMonth && matchesYear && matchesSearch;
    });
  }, [effectiveNapsRecords, selectedReportMonth, selectedReportYear, napsClientSearch]);

  const napsMonthOptions = useMemo(() => {
    const months = Array.from(new Set(effectiveNapsRecords.map(r => r.payoutMonth).filter(Boolean)));
    return ['all', ...months];
  }, [effectiveNapsRecords]);

  const exportNapsRecordsToCsv = () => {
    const list = filteredNapsRecords.length > 0 ? filteredNapsRecords : effectiveNapsRecords;
    if (!list.length) return;

    const headers = [
      'Establishment Code',
      'OJT State',
      'OJT District',
      'Apprentice Code',
      'Contract Code',
      'Jurisdiction',
      'Contract Start Date',
      'Contract End Date',
      'Contract Type',
      'Payout Month',
      'Beneficiary Status',
      'Beneficiary ID',
      'DBT Processed to PFMS Date',
      'Candidate DBT Consent',
      'eKYC Status',
      'Establishment Shared Status',
      'Amount (INR)',
      'Payment Status',
      'Payment Failure Reason'
    ];

    const rows = list.map(r => [
      r.establishmentCode,
      r.ojtState,
      r.ojtDistrict,
      r.apprenticeCode,
      r.contractCode,
      r.jurisdiction,
      r.contractStartDate,
      r.contractEndDate,
      r.contractType,
      r.payoutMonth,
      r.beneficiaryStatus,
      r.beneficiaryId,
      r.dbtProcessedToPfmsDate || '-',
      r.candidateDbtConsent,
      r.eKycStatus,
      r.establishmentSharedStatus,
      r.amount,
      r.paymentStatus,
      r.paymentFailureReason || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NAPS_Portal_Registry_${reportingMonthStr.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Document File Change
  const handleDocFileSelect = async (
    file: File | null,
    category: 'Aadhaar' | 'Education' | 'Bank Proof' | 'Resume' | 'Photo' | 'Signature'
  ) => {
    if (!file) return;
    const clientId = user?.id || activeSubmission?.id || 'client';
    const doc = await processUploadedFile(file, category, clientId);
    if (category === 'Aadhaar') setCandidateDocs(prev => ({ ...prev, aadhaarDoc: doc }));
    if (category === 'Education') setCandidateDocs(prev => ({ ...prev, educationDoc: doc }));
    if (category === 'Bank Proof') setCandidateDocs(prev => ({ ...prev, bankProofDoc: doc }));
    if (category === 'Resume') setCandidateDocs(prev => ({ ...prev, resumeDoc: doc }));
    if (category === 'Photo') setCandidateDocs(prev => ({ ...prev, photoDoc: doc }));
    if (category === 'Signature') setCandidateDocs(prev => ({ ...prev, signatureDoc: doc }));
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
      bankName: candidateForm.bankName || 'State Bank of India',
      bankAccountNumber: candidateForm.bankAccountNumber || '987654321012',
      ifscCode: candidateForm.ifscCode || 'SBIN0001824',
      spocEmail: candidateForm.spocEmail,
      spocName: candidateForm.spocName,
      documents: {
        photoDoc: candidateDocs.photoDoc,
        signatureDoc: candidateDocs.signatureDoc,
        aadhaarDoc: candidateDocs.aadhaarDoc,
        educationDoc: candidateDocs.educationDoc,
        bankProofDoc: candidateDocs.bankProofDoc,
        resumeDoc: candidateDocs.resumeDoc,
        photoFile: candidateDocs.photoDoc?.name || 'candidate_photo.jpg',
        signatureFile: candidateDocs.signatureDoc?.name || 'candidate_signature.png',
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
      qualification: '',
      stipendAmount: 18500,
      dbtEligibleAmount: 4500,
      joiningDate: new Date().toISOString().split('T')[0],
      bankName: '',
      bankAccountNumber: '',
      ifscCode: '',
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

  // Open Add Candidate Modal with Current SPOC & Intake Roles Pre-filled
  const handleOpenAddModal = () => {
    const designatedEmail = currentSpoc?.email || activeSubmission?.assigned_company_spoc?.email || user?.apprenticeMetrics?.assignedCompanySpoc?.email || activeSubmission?.responses?.complianceOfficerEmail || user?.email || '';
    const designatedName = currentSpoc?.name || activeSubmission?.assigned_company_spoc?.name || user?.apprenticeMetrics?.assignedCompanySpoc?.name || activeSubmission?.responses?.complianceOfficerName || user?.full_name || 'Designated SPOC';
    const defaultRole = clientChosenRoles[0] || '';

    setCandidateDocs({});
    setIsCustomRole(false);
    setCustomRoleText('');
    setCandidateForm({
      name: '',
      email: '',
      phone: '',
      aadhaarNumber: '',
      tradeOrRole: defaultRole,
      qualification: '',
      stipendAmount: Number(activeSubmission?.responses?.stipendPerApprentice) || 18500,
      dbtEligibleAmount: 4500,
      joiningDate: activeSubmission?.responses?.proposedJoiningDate || new Date().toISOString().split('T')[0],
      bankName: '',
      bankAccountNumber: '',
      ifscCode: '',
      spocEmail: designatedEmail,
      spocName: designatedName
    });
    setShowAddModal(true);
  };

  // Handle Save SPOC Contact
  const handleSaveSpoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spocNameInput.trim() || !spocEmailInput.trim()) return;
    const cleanEmail = spocEmailInput.trim().toLowerCase();
    const cleanName = spocNameInput.trim();

    assignCompanySpoc(activeSubmission?.id || '', {
      name: cleanName,
      email: cleanEmail,
      phone: spocPhoneInput.trim(),
      roleTitle: 'Designated SPOC'
    });

    setCandidateForm(prev => ({
      ...prev,
      spocEmail: cleanEmail,
      spocName: cleanName
    }));

    setShowSpocModal(false);
    setClaimSuccessAlert(`Designated SPOC updated: ${cleanName} (${cleanEmail}). All onboarding documents will be dispatched to this address.`);
    setTimeout(() => setClaimSuccessAlert(null), 6000);
  };

  const tabs = [
    { id: 'compliance_report', label: 'Compliance Report (Apprenticeship Act)', icon: <FileText className="w-3.5 h-3.5 text-amber-500" /> },
    { id: 'naps_registry', label: `DBT Dashboard (${filteredNapsRecords.length})`, icon: <WalletCards className="w-3.5 h-3.5 text-sky-500" /> },
    { id: 'compliance_contracts', label: 'Contracts & CN Remarks', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'apprentices', label: `Apprentice Roster (${filteredApprentices.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'spoc_logs', label: `SPOC Dispatches (${spocLogs.length})`, icon: <Mail className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="relative min-h-screen bg-[#f8fafc]/95">
      <NavyWaveBackground intensity="subtle" className="fixed inset-0 pointer-events-none -z-10" />
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-7 font-sans text-zinc-900">
      
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
              
              {/* TAB: Compliance Management Report (Apprenticeship Act, 1961) */}
              {activeTab === 'compliance_report' && (
                <motion.div
                  key="compliance_report"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Executive Report Header Card */}
                  <div className="rounded-3xl overflow-hidden shadow-sm border border-zinc-200">
                    {/* Top Banner with Navy Background */}
                    <div className="bg-[#0a192f] text-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-serif text-white font-extrabold text-xl shadow-md border border-amber-300/30 shrink-0">
                          C
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                              Apprenticeship Compliance Ledger
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Active Compliance
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                            Monthly Apprenticeship Act, 1961 (India) – Compliance Management Report
                          </h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Report</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-bar with Metadata & Month/Year Selector */}
                    <div className="bg-[#102a4c] text-zinc-300 px-6 py-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div className="flex flex-wrap items-center gap-6">
                        <div>
                          <span className="text-zinc-400 text-[11px]">Client / Establishment:</span>{' '}
                          <strong className="text-white font-semibold">{clientDisplayName}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[11px]">Portal NAPS ID:</span>{' '}
                          <strong className="text-white font-mono font-bold bg-white/10 px-2 py-0.5 rounded">{portalNapsId}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[11px]">Active Period:</span>{' '}
                          <strong className="text-amber-300 font-mono font-bold bg-amber-400/15 px-2.5 py-0.5 rounded border border-amber-300/30">
                            {reportingMonthStr}
                          </strong>
                        </div>
                      </div>

                      {/* Interactive Month and Year Filter Selector */}
                      <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/15">
                        <Calendar className="w-3.5 h-3.5 text-amber-300 ml-1.5" />
                        <span className="text-[11px] font-bold text-zinc-300 font-mono">Filter Cycle:</span>
                        
                        {/* Month Selector */}
                        <select
                          value={selectedReportMonth}
                          onChange={(e) => setSelectedReportMonth(e.target.value)}
                          className="px-2.5 py-1 rounded-xl bg-zinc-900/90 text-white font-bold text-xs border border-white/20 focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          {ALL_REPORT_MONTHS.map(m => (
                            <option key={m.value} value={m.value} className="bg-zinc-900 text-white">
                              {m.label}
                            </option>
                          ))}
                        </select>

                        {/* Year Selector */}
                        <select
                          value={selectedReportYear}
                          onChange={(e) => setSelectedReportYear(e.target.value)}
                          className="px-2.5 py-1 rounded-xl bg-zinc-900/90 text-white font-bold text-xs border border-white/20 focus:outline-none focus:border-amber-400 cursor-pointer font-mono"
                        >
                          {ALL_REPORT_YEARS.map(y => (
                            <option key={y.value} value={y.value} className="bg-zinc-900 text-white">
                              {y.label}
                            </option>
                          ))}
                        </select>

                        {(selectedReportMonth !== 'all' || selectedReportYear !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportMonth('all');
                              setSelectedReportYear('all');
                            }}
                            className="px-2 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-zinc-200 text-[10px] font-bold cursor-pointer transition-all"
                            title="Reset to All Cycles"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Quota & Onboarding Overview */}
                  <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f]"></div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
                          1. Quota & Onboarding Overview
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">Statutory Quota: 2.5% – 15%</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {/* Sanctioned Quota */}
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight leading-snug">
                          Sanctioned Quota
                        </span>
                        <div className="mt-3">
                          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono">
                            {sanctionedQuota}
                          </span>
                        </div>
                      </div>

                      {/* Utilised Till Date */}
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight leading-snug">
                          Utilised Till Date
                        </span>
                        <div className="mt-3">
                          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono">
                            {utilisedQuota}
                          </span>
                        </div>
                      </div>

                      {/* Remaining Open Quota */}
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight leading-snug">
                          Remaining Open Quota
                        </span>
                        <div className="mt-3">
                          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono">
                            {openQuota}
                          </span>
                        </div>
                      </div>

                      {/* Utilisation % - Light green */}
                      <div className="p-4 rounded-2xl bg-[#dcfce7] border border-emerald-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight leading-snug">
                          Utilisation %
                        </span>
                        <div className="mt-3">
                          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
                            {utilisationPercentage}
                          </span>
                        </div>
                      </div>

                      {/* Onboarded This Month */}
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight leading-snug">
                          Onboarded This Month
                        </span>
                        <div className="mt-3">
                          <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono">
                            {onboardedThisMonth}
                          </span>
                        </div>
                      </div>

                      {/* DBT Claimed for Month - Warm Yellow */}
                      <div className="p-4 rounded-2xl bg-[#fef3c7] border border-amber-200 flex flex-col justify-between">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-tight leading-snug">
                          DBT Claimed (NAPS)
                        </span>
                        <div className="mt-3">
                          <span className="text-xl sm:text-2xl font-extrabold text-amber-800 font-mono">
                            ₹{dbtClaimedReal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* DBT Allocation Not Fully Utilized - Burgundy Dark Red with White Text */}
                      <div className="p-4 rounded-2xl bg-[#8b1e1e] border border-red-900 text-white flex flex-col justify-between shadow-sm">
                        <span className="text-[11px] font-bold text-red-100 uppercase tracking-tight leading-snug">
                          DBT Allocation Not Utilized
                        </span>
                        <div className="mt-3">
                          <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                            ₹{dbtAllocationNotUtilized.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Government Approval Status */}
                  <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f]"></div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
                          2. Government Approval Status
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">Ministry of Skill Development & Entrepreneurship (MSDE)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
                          Total Approved (Till Date)
                        </span>
                        <div className="mt-2 text-2xl font-extrabold text-zinc-900 font-mono">
                          {totalApprovedGovt}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
                          Approved This Month
                        </span>
                        <div className="mt-2 text-2xl font-extrabold text-zinc-900 font-mono">
                          {approvedThisMonthGovt}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
                          Pending Approval
                        </span>
                        <div className="mt-2 text-2xl font-extrabold text-zinc-900 font-mono">
                          {pendingApprovalGovt}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-tight">
                          Portal Reference / NAPS ID
                        </span>
                        <div className="mt-2 text-base font-extrabold text-amber-900 font-mono tracking-wide">
                          {portalNapsId}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Contract Numbers (CN) – Candidates Onboarded on Month */}
                  <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f]"></div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
                          3. Contract Numbers (CN) – Candidates Onboarded on Month
                        </h3>
                        <span className="text-[11px] font-mono text-zinc-400">({displayedCandidatesList.length} shown)</span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {(selectedReportMonth !== 'all' || selectedReportYear !== 'all') && (
                          <button
                            type="button"
                            onClick={() => setFilterCandidatesByMonth(!filterCandidatesByMonth)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                              filterCandidatesByMonth
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                            }`}
                          >
                            {filterCandidatesByMonth ? `Filtered: ${reportingMonthStr}` : 'Filter by Active Period'}
                          </button>
                        )}
                        <button
                          onClick={handleOpenAddModal}
                          className="px-3.5 py-1.5 rounded-full bg-[#0a192f] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Onboard Candidate</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                      <table className="w-full text-left text-xs text-zinc-700">
                        <thead className="bg-zinc-50 border-b border-zinc-200 font-bold text-[11px] uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-4 py-3">S.No</th>
                            <th className="px-4 py-3">Candidate Name</th>
                            <th className="px-4 py-3">CN Number</th>
                            <th className="px-4 py-3">Trade / Role</th>
                            <th className="px-4 py-3">Onboarding Date</th>
                            <th className="px-4 py-3">Govt Status / Remarks</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {displayedCandidatesList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 font-medium">
                                No candidates onboarded for this reporting period ({reportingMonthStr}) yet. Click &ldquo;+ Onboard Candidate&rdquo; to begin.
                              </td>
                            </tr>
                          ) : (
                            displayedCandidatesList.map((app, idx) => {
                              // Match CN from candidate record, or from NAPS registry
                              const matchedNaps = effectiveNapsRecords.find(
                                r => (r.candidateId && r.candidateId === app.id) ||
                                     (r.candidateName && r.candidateName.toLowerCase() === app.name.toLowerCase()) ||
                                     (r.contractCode && r.contractCode === app.contractCode)
                              ) || (effectiveNapsRecords.length === 1 && displayedCandidatesList.length === 1 ? effectiveNapsRecords[0] : undefined);

                              const resolvedCN = app.contractCode || matchedNaps?.contractCode;
                              const isApproved = Boolean(resolvedCN && resolvedCN !== 'CN Pending');

                              return (
                                <tr key={app.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                                  <td className="px-4 py-3 font-mono text-zinc-400 font-bold">{idx + 1}</td>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-zinc-900">{app.name}</div>
                                    <div className="font-mono text-[10px] text-zinc-400">{app.tradeOrRole}</div>
                                  </td>
                                  <td className="px-4 py-3 font-mono font-semibold text-zinc-800">
                                    {isApproved ? (
                                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-[11px] shadow-2xs">
                                        {resolvedCN}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                                        CN Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-zinc-600">{app.tradeOrRole}</td>
                                  <td className="px-4 py-3 font-mono text-zinc-500">{app.onboardingDate || '-'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      isApproved
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}>
                                      {isApproved ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Approved on NAPS Portal</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3 text-amber-600" />
                                          <span>Portal CN Allocation in Progress</span>
                                        </>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => setSelectedContractCandidate(app as ApprenticeRecord)}
                                      className="text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                                    >
                                      View Contract
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 4: Stipend Payment & DBT Status */}
                  <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f]"></div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
                          4. Stipend Payment & DBT Status
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">DBT Subsidy ₹1,500 / candidate / month</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                      <table className="w-full text-left text-xs text-zinc-700">
                        <thead className="bg-zinc-50 border-b border-zinc-200 font-bold text-[11px] uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-4 py-3">Month</th>
                            <th className="px-4 py-3">Stipend Paid by Employer</th>
                            <th className="px-4 py-3">Date Paid</th>
                            <th className="px-4 py-3">DBT by Govt.</th>
                            <th className="px-4 py-3">DBT Release Date</th>
                            <th className="px-4 py-3">Remarks / PFMS Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 font-mono">
                          {monthlyNapsSummary.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 font-sans font-medium">
                                No monthly stipend and DBT disbursements recorded yet for this establishment.
                              </td>
                            </tr>
                          ) : (
                            monthlyNapsSummary.map((mRow, mIdx) => (
                              <tr key={mIdx} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="px-4 py-3 font-bold text-zinc-900 font-sans">{mRow.month}</td>
                                <td className="px-4 py-3 font-bold text-zinc-800">₹{mRow.stipendPaid.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3 text-zinc-500">{mRow.datePaid}</td>
                                <td className="px-4 py-3 font-bold text-emerald-700">₹{mRow.dbtGovt.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3 text-zinc-500">{mRow.dbtReleaseDate}</td>
                                <td className="px-4 py-3 font-sans text-xs text-zinc-600">
                                  {mRow.remarks}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 5: Invoice Status */}
                  <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f]"></div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
                          5. Invoice Status
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">TPA Facilitation & Management</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                      <table className="w-full text-left text-xs text-zinc-700">
                        <thead className="bg-zinc-50 border-b border-zinc-200 font-bold text-[11px] uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-4 py-3">Invoice No.</th>
                            <th className="px-4 py-3">Invoice Date</th>
                            <th className="px-4 py-3">Amount (₹)</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Payment Date</th>
                            <th className="px-4 py-3">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {effectiveInvoices.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 font-medium">
                                No facilitation invoices generated yet.
                              </td>
                            </tr>
                          ) : (
                            effectiveInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-zinc-900">{inv.invoiceNo}</td>
                                <td className="px-4 py-3 font-mono text-zinc-500">{inv.invoiceDate}</td>
                                <td className="px-4 py-3 font-mono font-bold text-zinc-900">₹{inv.amount.toLocaleString('en-IN')}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    inv.status === 'PAID'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-500">{inv.paymentDate}</td>
                                <td className="px-4 py-3 text-zinc-600">{inv.remarks || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 6: Remarks / Action Items */}
                  <div className="rounded-3xl bg-white border border-zinc-200 p-6 sm:p-7 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f]"></div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-900">
                          6. Remarks / Action Items
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">Governance & Timeline</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                      <table className="w-full text-left text-xs text-zinc-700">
                        <thead className="bg-zinc-50 border-b border-zinc-200 font-bold text-[11px] uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-4 py-3">S.No</th>
                            <th className="px-4 py-3">Observation / Remark</th>
                            <th className="px-4 py-3">Action Required</th>
                            <th className="px-4 py-3">Owner</th>
                            <th className="px-4 py-3">Target Date</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {effectiveActionItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 font-medium">
                                No active compliance action items or remarks recorded for this period.
                              </td>
                            </tr>
                          ) : (
                            effectiveActionItems.map((act, idx) => (
                              <tr key={act.id || idx} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="px-4 py-3 font-mono text-zinc-400 font-bold">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-zinc-900 max-w-xs">{act.observation}</td>
                                <td className="px-4 py-3 text-zinc-700 max-w-xs">{act.actionRequired}</td>
                                <td className="px-4 py-3 font-semibold text-zinc-800">{act.owner}</td>
                                <td className="px-4 py-3 font-mono text-zinc-500">{act.targetDate}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    {act.status || 'ACTIVE'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: DBT Dashboard */}
              {activeTab === 'naps_registry' && (
                <motion.div
                  key="naps_registry"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Registry Header Card */}
                  <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 font-mono">
                            National Apprenticeship Promotion Scheme
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">PFMS / DBT Sync</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
                          DBT Dashboard
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">
                          Official monthly establishment apprentice ledger, eKYC status, and direct benefit transfer records.
                        </p>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                          type="button"
                          onClick={exportNapsRecordsToCsv}
                          className="px-4 py-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="pt-3 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Filter className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-600">Month:</span>
                        <select
                          value={selectedReportMonth}
                          onChange={(e) => setSelectedReportMonth(e.target.value)}
                          className="px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-300 text-xs font-bold text-zinc-800 focus:outline-none focus:border-black cursor-pointer font-mono"
                        >
                          {ALL_REPORT_MONTHS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>

                        <span className="text-xs font-bold text-zinc-600 ml-1">Year:</span>
                        <select
                          value={selectedReportYear}
                          onChange={(e) => setSelectedReportYear(e.target.value)}
                          className="px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-300 text-xs font-bold text-zinc-800 focus:outline-none focus:border-black cursor-pointer font-mono"
                        >
                          {ALL_REPORT_YEARS.map((y) => (
                            <option key={y.value} value={y.value}>
                              {y.label}
                            </option>
                          ))}
                        </select>

                        {(selectedReportMonth !== 'all' || selectedReportYear !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReportMonth('all');
                              setSelectedReportYear('all');
                            }}
                            className="px-2.5 py-1 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer transition-all"
                          >
                            Show All
                          </button>
                        )}
                      </div>

                      {/* Search Input */}
                      <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search Apprentice / Contract..."
                          value={napsClientSearch}
                          onChange={(e) => setNapsClientSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    {/* Quick Summary Pill Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                        <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">Total Entries</span>
                        <div className="text-lg font-bold font-mono text-zinc-900 mt-0.5">{filteredNapsRecords.length}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                        <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">Total DBT Amount</span>
                        <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                          ₹{filteredNapsRecords.reduce((acc, r) => acc + (r.amount || 0), 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-800">Paid Status</span>
                        <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                          {filteredNapsRecords.filter(r => r.paymentStatus === 'PAID').length}
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                        <span className="text-[10px] font-bold uppercase tracking-tight text-amber-800">Pending</span>
                        <div className="text-lg font-bold font-mono text-amber-700 mt-0.5">
                          {filteredNapsRecords.filter(r => r.paymentStatus !== 'PAID').length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Multi-Column NAPS Government Portal Table (TPA Columns Omitted) */}
                  <div className="rounded-3xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full text-left text-xs text-zinc-700 whitespace-nowrap">
                        <thead className="bg-[#0a192f] text-white font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10">
                          <tr>
                            <th className="px-3.5 py-3">Candidate / Apprentice</th>
                            <th className="px-3.5 py-3">Establishment Code</th>
                            <th className="px-3.5 py-3">OJT State</th>
                            <th className="px-3.5 py-3">OJT District</th>
                            <th className="px-3.5 py-3">Contract Code</th>
                            <th className="px-3.5 py-3">Jurisdiction</th>
                            <th className="px-3.5 py-3">Contract Dates</th>
                            <th className="px-3.5 py-3">Contract Type</th>
                            <th className="px-3.5 py-3">Payout Month</th>
                            <th className="px-3.5 py-3">Beneficiary Status</th>
                            <th className="px-3.5 py-3">Beneficiary ID</th>
                            <th className="px-3.5 py-3">DBT to PFMS Date</th>
                            <th className="px-3.5 py-3">Candidate DBT Consent</th>
                            <th className="px-3.5 py-3">eKYC Status</th>
                            <th className="px-3.5 py-3">Establishment Shared</th>
                            <th className="px-3.5 py-3">Amount (₹)</th>
                            <th className="px-3.5 py-3">Payment Status</th>
                            <th className="px-3.5 py-3">Payment Failure Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                          {filteredNapsRecords.length === 0 ? (
                            <tr>
                              <td colSpan={18} className="px-6 py-12 text-center text-zinc-500 font-sans">
                                No NAPS government portal records filed yet. Operations administrators update this ledger as monthly claims are processed.
                              </td>
                            </tr>
                          ) : (
                            filteredNapsRecords.map((r) => {
                              const cand = candidateList.find(c => c.id === r.candidateId || c.contractCode === r.contractCode || (c.name && r.candidateName && c.name.toLowerCase() === r.candidateName.toLowerCase()));
                              const candidateDisplayName = r.candidateName || cand?.name || 'Apprentice';

                              return (
                                <tr key={r.id} className="hover:bg-zinc-50/90 transition-colors">
                                  <td className="px-3.5 py-3 font-sans">
                                    <div className="font-bold text-zinc-900">{candidateDisplayName}</div>
                                    <div className="font-mono text-[10px] text-sky-700 font-bold">{r.apprenticeCode}</div>
                                  </td>
                                  <td className="px-3.5 py-3 font-bold text-zinc-900">{r.establishmentCode}</td>
                                  <td className="px-3.5 py-3 font-sans text-zinc-600">{r.ojtState}</td>
                                  <td className="px-3.5 py-3 font-sans text-zinc-600">{r.ojtDistrict}</td>
                                  <td className="px-3.5 py-3 font-mono font-bold text-zinc-800">{r.contractCode}</td>
                                <td className="px-3.5 py-3 font-sans capitalize text-zinc-600">{r.jurisdiction}</td>
                                <td className="px-3.5 py-3 text-zinc-500">
                                  {r.contractStartDate} → {r.contractEndDate}
                                </td>
                                <td className="px-3.5 py-3 font-sans capitalize text-zinc-600">{r.contractType}</td>
                                <td className="px-3.5 py-3 font-bold text-zinc-900">{r.payoutMonth}</td>
                                <td className="px-3.5 py-3 font-sans capitalize text-zinc-600">{r.beneficiaryStatus}</td>
                                <td className="px-3.5 py-3 text-zinc-500">{r.beneficiaryId}</td>
                                <td className="px-3.5 py-3 text-zinc-500">{r.dbtProcessedToPfmsDate || '-'}</td>
                                <td className="px-3.5 py-3 font-sans">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    r.candidateDbtConsent === 'Yes'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-zinc-100 text-zinc-600'
                                  }`}>
                                    {r.candidateDbtConsent}
                                  </span>
                                </td>
                                <td className="px-3.5 py-3 font-sans">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    r.eKycStatus === 'Yes'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    {r.eKycStatus}
                                  </span>
                                </td>
                                <td className="px-3.5 py-3 font-sans capitalize text-zinc-600">{r.establishmentSharedStatus}</td>
                                <td className="px-3.5 py-3 font-bold text-zinc-900">
                                  ₹{r.amount.toFixed(1)}
                                </td>
                                <td className="px-3.5 py-3 font-sans">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    r.paymentStatus === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : r.paymentStatus === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-red-100 text-red-800 border border-red-300'
                                  }`}>
                                    {r.paymentStatus}
                                  </span>
                                </td>
                                <td className="px-3.5 py-3 text-zinc-400">{r.paymentFailureReason || '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: Compliance & Contracts */}
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
                          onClick={() => handleOpenAddModal()}
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
                                </td>

                                <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-600">
                                  <div>{app.aadhaarNumber || '4523-XXXX-9912'}</div>
                                  <div className="text-[10px] text-zinc-400">
                                    {app.bankName ? `${app.bankName} · ` : ''}{app.ifscCode || 'HDFC0001824'}
                                  </div>
                                  {app.bankAccountNumber && (
                                    <div className="text-[9px] text-zinc-400">
                                      A/C {app.bankAccountNumber}
                                    </div>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 font-bold text-zinc-900">
                                  ₹{app.stipendAmount.toLocaleString()}
                                </td>

                                <td className="py-3.5 px-4 font-bold text-emerald-600">
                                  ₹{app.dbtEligibleAmount.toLocaleString()}
                                </td>

                                {/* Compliance Files Slot */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {app.documents?.photoDoc || app.documents?.photoFile ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(app.documents?.photoDoc || { name: app.documents?.photoFile || 'Candidate Photo.jpg', type: 'image' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 cursor-pointer"
                                        title="View Candidate Photo"
                                      >
                                        Photo ↗
                                      </button>
                                    ) : null}

                                    {app.documents?.signatureDoc || app.documents?.signatureFile ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(app.documents?.signatureDoc || { name: app.documents?.signatureFile || 'Signature.jpg', type: 'image' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 cursor-pointer"
                                        title="View Signature"
                                      >
                                        Sign ↗
                                      </button>
                                    ) : null}

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
                                        onClick={() => setPreviewingDoc(app.documents?.educationDoc || { name: app.documents?.educationFile || 'Degree.pdf', type: 'pdf' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 cursor-pointer"
                                        title="View Degree"
                                      >
                                        Degree ↗
                                      </button>
                                    ) : null}

                                    {app.documents?.bankProofDoc || app.documents?.bankProofFile ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(app.documents?.bankProofDoc || { name: app.documents?.bankProofFile || 'Bank Proof.pdf', type: 'pdf' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 cursor-pointer"
                                        title="View Bank Proof / Cheque"
                                      >
                                        Cheque ↗
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

                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-zinc-700 text-xs">Target Role / Specialization *</label>
                        <span className="text-[10px] text-zinc-400 font-mono">From your intake selections</span>
                      </div>

                      <select
                        value={isCustomRole ? '__other__' : candidateForm.tradeOrRole}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__other__') {
                            setIsCustomRole(true);
                            setCandidateForm({ ...candidateForm, tradeOrRole: customRoleText });
                          } else {
                            setIsCustomRole(false);
                            setCandidateForm({ ...candidateForm, tradeOrRole: val });
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-semibold cursor-pointer"
                      >
                        {clientChosenRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                        <option value="__other__">+ Other (Type Custom Role)</option>
                      </select>

                      {isCustomRole && (
                        <div className="pt-1">
                          <input
                            type="text"
                            required
                            placeholder="Enter custom role title (e.g. AI Prompt Engineer / QA Analyst)"
                            value={customRoleText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomRoleText(val);
                              setCandidateForm({ ...candidateForm, tradeOrRole: val });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-300 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {/* Monthly Stipend & Joining Date (Pre-filled from Intake with edit option) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-700 text-xs">Monthly Stipend (₹) *</label>
                        {activeSubmission?.responses?.stipendPerApprentice && (
                          <span className="text-[10px] text-zinc-400 font-mono">Intake default</span>
                        )}
                      </div>
                      <input
                        type="number"
                        required
                        step={500}
                        min={1000}
                        value={candidateForm.stipendAmount ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0;
                          setCandidateForm({ ...candidateForm, stipendAmount: val as number });
                        }}
                        className="w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-bold"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-zinc-700 text-xs">Joining Date *</label>
                        {activeSubmission?.responses?.proposedJoiningDate && (
                          <span className="text-[10px] text-zinc-400 font-mono">Intake default</span>
                        )}
                      </div>
                      <input
                        type="date"
                        required
                        value={candidateForm.joiningDate}
                        onChange={(e) => setCandidateForm({ ...candidateForm, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Candidate Banking & Direct DBT Transfer Details */}
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    2. Candidate Banking Details (For Direct DBT Subsidy Disbursement)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-zinc-700 text-xs mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. State Bank of India"
                        value={candidateForm.bankName}
                        onChange={(e) => setCandidateForm({ ...candidateForm, bankName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 text-xs mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 50100234567890"
                        value={candidateForm.bankAccountNumber}
                        onChange={(e) => setCandidateForm({ ...candidateForm, bankAccountNumber: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 text-xs mb-1">
                        Bank IFSC Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SBIN0001824"
                        value={candidateForm.ifscCode}
                        onChange={(e) => setCandidateForm({ ...candidateForm, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-mono uppercase font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Candidate Compliance & Verification Documents */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    3. Candidate Proofs & Verification Files (Photos, KYC & Certificates)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Candidate Passport Photo */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Candidate Passport Photo *</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">JPG / PNG</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.photoDoc?.name || 'Attach Candidate Photo (.jpg/.png)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => handleDocFileSelect(e.target.files?.[0] || null, 'Photo')}
                        />
                      </label>
                    </div>

                    {/* Candidate Signature Photo */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Candidate Signature Photo *</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">JPG / PNG / PDF</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.signatureDoc?.name || 'Attach Signature (.jpg/.png/.pdf)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp,.pdf"
                          className="hidden"
                          onChange={(e) => handleDocFileSelect(e.target.files?.[0] || null, 'Signature')}
                        />
                      </label>
                    </div>

                    {/* Aadhaar Card */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Aadhaar Card Document *</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">PDF / DOCX</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.aadhaarDoc?.name || 'Attach Aadhaar (.pdf/.docx/.jpg)'}
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
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">PDF / DOCX</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.educationDoc?.name || 'Attach Degree (.pdf/.docx/.jpg)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleDocFileSelect(e.target.files?.[0] || null, 'Education')}
                        />
                      </label>
                    </div>

                    {/* Bank Passbook / Cancelled Cheque */}
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-zinc-800 text-xs">Cancelled Cheque / Bank Proof *</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">PDF / JPG / PNG</span>
                      </div>
                      <label className="p-2 rounded-xl bg-white border border-zinc-200 hover:border-black flex items-center gap-2 cursor-pointer transition-colors text-[11px]">
                        <UploadCloud className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono text-zinc-700">
                          {candidateDocs.bankProofDoc?.name || 'Attach Cancelled Cheque (.pdf/.jpg)'}
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

                {/* 4. Automated SPOC Email Notification Setup */}
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
                    value={candidateForm.spocEmail || currentSpoc?.email || ''}
                    onChange={(e) => setCandidateForm({ ...candidateForm, spocEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                  />
                  {currentSpoc?.email && (
                    <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                      Using Designated SPOC: {currentSpoc.email}
                    </span>
                  )}
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
    </div>
  );
};
