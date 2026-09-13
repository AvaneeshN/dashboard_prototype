'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useStore, getExpiringContracts } from '@/lib/store';
import { 
  FormSubmission, 
  SubmissionStatus, 
  UploadedDocument,
  NAPSPortalRecord,
  ComplianceInvoiceRecord,
  ComplianceActionItem,
  ApprenticeRecord,
  CompanyOperationsSPOC,
  StipendPaymentRecord,
  MonthlyAttendanceRecord,
  getAdminPermissions,
  isSeniorAdmin,
  isJuniorAdmin
} from '@/types';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import { downloadDocumentFile } from '@/lib/document-utils';
import { 
  X, 
  ArrowLeft,
  ArrowRight,
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  UserX,
  FileText, 
  Download, 
  User, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  FileSignature,
  Building,
  CreditCard,
  UploadCloud,
  Check,
  ExternalLink,
  Eye,
  Send,
  Paperclip,
  Table,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Lock,
  Search,
  Filter,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubmissionDetailDrawerProps {
  submission: FormSubmission | null;
  onClose: () => void;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}

export const SubmissionDetailDrawer: React.FC<SubmissionDetailDrawerProps> = ({
  submission,
  onClose,
  onStatusChange
}) => {
  const { 
    assignCompanySpoc, 
    adminSpoc,
    addNAPSRecord,
    updateNAPSRecord,
    deleteNAPSRecord,
    updateClientComplianceReport,
    addStipendPayment,
    updateStipendPayment,
    addActionItem,
    addInvoice,
    deleteInvoice,
    submissions,
    user,
    updateAttendanceRecord,
    bulkCreateMonthlyAttendance
  } = useStore();
  const permissions = getAdminPermissions(user?.role);
  const isSenior = isSeniorAdmin(user?.role);

  const [activeTab, setActiveTab] = useState<'application' | 'documents' | 'candidates' | 'dbt_claims' | 'spoc_logs' | 'naps_portal' | 'invoices' | 'attendance'>('application');
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'allocated' | 'pending' | 'terminated'>('all');
  const [previewingDoc, setPreviewingDoc] = useState<any>(null);

  // Invoice Management States (Admin/Company)
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [invoiceSuccessMsg, setInvoiceSuccessMsg] = useState<string | null>(null);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    amount: '' as unknown as number,
    status: 'SUBMITTED',
    paymentDate: '',
    remarks: ''
  });

  // Stipend Payment Management States (Admin DBT Entry & Review)
  const [editingStipendRecord, setEditingStipendRecord] = useState<StipendPaymentRecord | null>(null);
  const [stipendAdminForm, setStipendAdminForm] = useState({
    dbtByGovt: 0,
    dbtReleaseDate: 'UNDER PROCESS',
    status: 'UNDER PROCESS',
    remarks: ''
  });
  const [savingStipendAdmin, setSavingStipendAdmin] = useState(false);
  const [stipendAdminSuccess, setStipendAdminSuccess] = useState<string | null>(null);
  const [showAdminAddStipend, setShowAdminAddStipend] = useState(false);
  const [adminNewStipend, setAdminNewStipend] = useState({
    month: 'JANUARY',
    year: '2026',
    stipendPaidByEmployer: '' as unknown as number,
    datePaid: '',
    dbtByGovt: 0,
    dbtReleaseDate: 'UNDER PROCESS',
    status: 'UNDER PROCESS',
    remarks: ''
  });

  // Attendance Ledger State (Admin)
  const [adminAttFilterMonth, setAdminAttFilterMonth] = useState<string>('all');
  const [adminAttFilterYear, setAdminAttFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [adminAttFilterCode, setAdminAttFilterCode] = useState<string>('');
  const [editingAdminAttRows, setEditingAdminAttRows] = useState<Record<string, Partial<MonthlyAttendanceRecord>>>({});
  const [adminAttSaving, setAdminAttSaving] = useState(false);
  const [adminAttSuccess, setAdminAttSuccess] = useState<string | null>(null);
  const [generatingAdminAtt, setGeneratingAdminAtt] = useState(false);

  // NAPS Record Modal States
  const [showNapsModal, setShowNapsModal] = useState(false);
  const [editingNapsRecord, setEditingNapsRecord] = useState<NAPSPortalRecord | null>(null);
  const [napsFormMonthFilter, setNapsFormMonthFilter] = useState<string>('all');
  const [napsFormYearFilter, setNapsFormYearFilter] = useState<string>('all');
  const [napsFilterEstCode, setNapsFilterEstCode] = useState<string>('');
  const [napsFilterCnCode, setNapsFilterCnCode] = useState<string>('');
  const [napsFilterApCode, setNapsFilterApCode] = useState<string>('');
  const [napsFilterDbtStatus, setNapsFilterDbtStatus] = useState<string>('all');
  const [napsSearchQuery, setNapsSearchQuery] = useState('');
  const [napsForm, setNapsForm] = useState<Omit<NAPSPortalRecord, 'id'>>({
    candidateId: '',
    candidateName: '',
    candidateAadhaarName: '',
    documentReceiveDate: '',
    establishmentCode: '',
    location: '',
    ojtState: '',
    ojtDistrict: '',
    dob: '',
    gender: '',
    mobileNumber: '',
    emailId: '',
    stipend: 0,
    qualification: '',
    curriculum: '',
    apprenticeCode: '',
    beneficiaryId: '',
    contractCode: '',
    remarks: '',
    contractStartDate: '',
    contractEndDate: '',
    dbtStatus: 'UNPAID',
    jurisdiction: 'central',
    contractType: 'optional',
    payoutMonth: '',
    beneficiaryStatus: 'created',
    dbtProcessedToPfmsDate: '',
    candidateDbtConsent: 'Yes',
    eKycStatus: 'Yes',
    establishmentSharedStatus: 'pending',
    amount: 0,
    paymentStatus: 'PENDING',
    paymentFailureReason: ''
  });

  // Company SPOC Assignment Form State
  const [isEditingSpoc, setIsEditingSpoc] = useState(false);
  const [companySpocState, setCompanySpocState] = useState({
    name: submission?.assigned_company_spoc?.name || '',
    email: submission?.assigned_company_spoc?.email || '',
    phone: submission?.assigned_company_spoc?.phone || '',
    roleTitle: submission?.assigned_company_spoc?.roleTitle || 'Dedicated Operations SPOC'
  });
  const [spocSaveSuccess, setSpocSaveSuccess] = useState(false);

  // Synchronize SPOC state when submission changes
  useEffect(() => {
    if (submission) {
      setCompanySpocState({
        name: submission.assigned_company_spoc?.name || '',
        email: submission.assigned_company_spoc?.email || '',
        phone: submission.assigned_company_spoc?.phone || '',
        roleTitle: submission.assigned_company_spoc?.roleTitle || 'Dedicated Operations SPOC'
      });
    }
  }, [submission?.id, submission?.assigned_company_spoc?.email, submission?.assigned_company_spoc?.name, submission?.assigned_company_spoc?.phone, submission?.assigned_company_spoc?.roleTitle]);

  const handleSaveSpoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySpocState.name || !companySpocState.email) return;

    await assignCompanySpoc(submission!.id, {
      name: companySpocState.name,
      email: companySpocState.email,
      phone: companySpocState.phone,
      roleTitle: companySpocState.roleTitle
    });

    setIsEditingSpoc(false);
    setSpocSaveSuccess(true);
    setTimeout(() => setSpocSaveSuccess(false), 3000);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!submission) return null;

  const currentSub = submissions.find(s => s.id === submission.id) || submission;
  const responses = currentSub.responses || {};
  const companyDocs = responses.companyDocs || {};
  const candidateList = currentSub.candidates || [];
  const dbtClaims = currentSub.dbt_claims || [];
  const spocLogs = currentSub.spoc_logs || [];
  const napsRecords = currentSub.naps_records || [];
  const stipendPayments: StipendPaymentRecord[] = currentSub.stipend_payments || [];
  const attendanceRecords: MonthlyAttendanceRecord[] = currentSub.attendance_records || [];
  const invoiceList: ComplianceInvoiceRecord[] = currentSub.invoices || [];
  const actionItemsList: ComplianceActionItem[] = currentSub.action_items || [];

  const handleAddInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSub || !newInvoiceForm.invoiceNo || !newInvoiceForm.amount) return;
    setInvoiceSubmitting(true);
    try {
      await addInvoice(currentSub.id, {
        invoiceNo: newInvoiceForm.invoiceNo.trim(),
        invoiceDate: newInvoiceForm.invoiceDate || new Date().toISOString().split('T')[0],
        amount: Number(newInvoiceForm.amount) || 0,
        status: newInvoiceForm.status,
        paymentDate: newInvoiceForm.paymentDate ? newInvoiceForm.paymentDate.trim() : '-',
        remarks: newInvoiceForm.remarks ? newInvoiceForm.remarks.trim() : ''
      });
      setShowAddInvoiceModal(false);
      setNewInvoiceForm({
        invoiceNo: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        amount: '' as unknown as number,
        status: 'SUBMITTED',
        paymentDate: '',
        remarks: ''
      });
      setInvoiceSuccessMsg(`Invoice ${newInvoiceForm.invoiceNo} added and published to client dashboard.`);
      setTimeout(() => setInvoiceSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error adding invoice:', err);
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleOpenEditStipend = (rec: StipendPaymentRecord) => {
    setEditingStipendRecord(rec);
    setStipendAdminForm({
      dbtByGovt: rec.dbtByGovt || 0,
      dbtReleaseDate: rec.dbtReleaseDate || 'UNDER PROCESS',
      status: rec.status || 'UNDER PROCESS',
      remarks: rec.remarks || ''
    });
  };

  const handleSaveStipendAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !editingStipendRecord) return;
    setSavingStipendAdmin(true);
    try {
      await updateStipendPayment(submission.id, editingStipendRecord.id, {
        dbtByGovt: Number(stipendAdminForm.dbtByGovt),
        dbtReleaseDate: stipendAdminForm.dbtReleaseDate,
        status: stipendAdminForm.status,
        remarks: stipendAdminForm.remarks,
        reviewedByAdmin: true,
        reviewedAt: new Date().toISOString()
      });
      setEditingStipendRecord(null);
      setStipendAdminSuccess('DBT details and remarks saved. The client compliance report has been updated.');
      setTimeout(() => setStipendAdminSuccess(null), 4000);
    } catch (err) {
      console.error('Error updating stipend:', err);
    } finally {
      setSavingStipendAdmin(false);
    }
  };

  const handleAdminCreateStipend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    try {
      await addStipendPayment(submission.id, {
        month: adminNewStipend.month,
        year: adminNewStipend.year,
        stipendPaidByEmployer: Number(adminNewStipend.stipendPaidByEmployer),
        datePaid: adminNewStipend.datePaid,
        dbtByGovt: Number(adminNewStipend.dbtByGovt),
        dbtReleaseDate: adminNewStipend.dbtReleaseDate,
        status: adminNewStipend.status,
        remarks: adminNewStipend.remarks,
        submittedByClient: false,
        reviewedByAdmin: true,
        reviewedAt: new Date().toISOString()
      });
      setShowAdminAddStipend(false);
      setStipendAdminSuccess(`Monthly stipend record for ${adminNewStipend.month} ${adminNewStipend.year} created successfully.`);
      setTimeout(() => setStipendAdminSuccess(null), 4000);
    } catch (err) {
      console.error('Error creating stipend:', err);
    }
  };

  // Attendance Ledger Admin Handlers
  const handleAdminGenerateAttMonth = async () => {
    if (!submission) return;
    setGeneratingAdminAtt(true);
    try {
      const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
      const month = adminAttFilterMonth !== 'all' ? adminAttFilterMonth : MONTHS[new Date().getMonth()];
      const year = adminAttFilterYear !== 'all' ? adminAttFilterYear : new Date().getFullYear().toString();
      const created = await bulkCreateMonthlyAttendance(submission.id, month, year);
      if (created.length > 0) {
        setAdminAttSuccess(`Generated ${created.length} attendance rows for ${month} ${year}.`);
      } else {
        setAdminAttSuccess(`All candidates already have attendance records for ${month} ${year}.`);
      }
      setTimeout(() => setAdminAttSuccess(null), 4000);
    } catch (err) {
      console.error('Error generating attendance:', err);
    } finally {
      setGeneratingAdminAtt(false);
    }
  };

  const handleAdminAttFieldChange = (recordId: string, field: string, value: number) => {
    setEditingAdminAttRows(prev => ({
      ...prev,
      [recordId]: { ...(prev[recordId] || {}), [field]: value }
    }));
  };

  const handleAdminSaveAttRow = async (record: MonthlyAttendanceRecord) => {
    if (!submission) return;
    const edits = editingAdminAttRows[record.id];
    if (!edits) return;
    setAdminAttSaving(true);
    try {
      await updateAttendanceRecord(submission.id, record.id, {
        ...edits,
        reviewedByAdmin: true,
        reviewedAt: new Date().toISOString(),
        status: 'REVIEWED'
      });
      setEditingAdminAttRows(prev => {
        const copy = { ...prev };
        delete copy[record.id];
        return copy;
      });
      setAdminAttSuccess(`Updated financials for ${record.candidateName} (${record.month} ${record.year}).`);
      setTimeout(() => setAdminAttSuccess(null), 4000);
    } catch (err) {
      console.error('Error saving attendance:', err);
    } finally {
      setAdminAttSaving(false);
    }
  };

  const filteredNapsRecords = napsRecords.filter(r => {
    // Month filter (supports payoutMonth format like 'JAN-2026' or just 'JAN')
    let matchesMonth = true;
    if (napsFormMonthFilter !== 'all') {
      const pMonth = (r.payoutMonth || '').toUpperCase();
      matchesMonth = pMonth.includes(napsFormMonthFilter.toUpperCase());
    }

    // Year filter
    let matchesYear = true;
    if (napsFormYearFilter !== 'all') {
      const pYear = (r.payoutMonth || '').toUpperCase();
      matchesYear = pYear.includes(napsFormYearFilter);
    }

    // Est Code filter
    const matchesEst = !napsFilterEstCode.trim() || 
      (r.establishmentCode && r.establishmentCode.toLowerCase().includes(napsFilterEstCode.trim().toLowerCase()));

    // CN Code filter
    const matchesCn = !napsFilterCnCode.trim() || 
      (r.contractCode && r.contractCode.toLowerCase().includes(napsFilterCnCode.trim().toLowerCase()));

    // AP Code filter
    const matchesAp = !napsFilterApCode.trim() || 
      (r.apprenticeCode && r.apprenticeCode.toLowerCase().includes(napsFilterApCode.trim().toLowerCase()));

    // DBT Status filter
    const currentStatus = (r.dbtStatus || (r.paymentStatus === 'PAID' ? 'PAID' : r.paymentStatus === 'FAILED' ? 'FAIL' : 'UNPAID')).toUpperCase();
    const matchesStatus = napsFilterDbtStatus === 'all' || currentStatus === napsFilterDbtStatus.toUpperCase();

    // General query search
    const query = napsSearchQuery.trim().toLowerCase();
    const matchesQuery = !query || 
      (r.candidateName && r.candidateName.toLowerCase().includes(query)) ||
      (r.candidateAadhaarName && r.candidateAadhaarName.toLowerCase().includes(query)) ||
      (r.apprenticeCode && r.apprenticeCode.toLowerCase().includes(query)) ||
      (r.contractCode && r.contractCode.toLowerCase().includes(query)) ||
      (r.establishmentCode && r.establishmentCode.toLowerCase().includes(query)) ||
      (r.beneficiaryId && r.beneficiaryId.toLowerCase().includes(query)) ||
      (r.emailId && r.emailId.toLowerCase().includes(query)) ||
      (r.mobileNumber && r.mobileNumber.toLowerCase().includes(query)) ||
      (r.location && r.location.toLowerCase().includes(query));

    return matchesMonth && matchesYear && matchesEst && matchesCn && matchesAp && matchesStatus && matchesQuery;
  });

  const availableNapsMonths = Array.from(new Set(napsRecords.map(r => r.payoutMonth))).filter(Boolean);

  const handleOpenAddNaps = (targetCandidate?: ApprenticeRecord) => {
    setEditingNapsRecord(null);
    const cand = targetCandidate;
    setNapsForm({
      candidateId: cand?.id || '',
      candidateName: cand?.name || '',
      candidateAadhaarName: cand?.name || '',
      documentReceiveDate: cand?.documentReceiveDate || new Date().toISOString().split('T')[0],
      establishmentCode: napsRecords[0]?.establishmentCode || submission.establishment_details?.pan || '',
      location: (napsRecords[0]?.location) || (cand ? `${cand.ojtDistrict || 'Bangalore'}, ${cand.ojtState || 'Karnataka'}` : 'Bangalore, Karnataka'),
      ojtState: napsRecords[0]?.ojtState || 'Karnataka',
      ojtDistrict: napsRecords[0]?.ojtDistrict || 'Bangalore',
      dob: cand?.dob || '2001-05-15',
      gender: cand?.gender || 'Male',
      mobileNumber: cand?.phone || '',
      emailId: cand?.email || '',
      stipend: cand?.stipendAmount || 0,
      qualification: cand?.qualification || 'Graduate / Diploma',
      curriculum: cand?.tradeOrRole || 'Apprenticeship Trainee',
      apprenticeCode: cand?.apprenticeCode || '',
      beneficiaryId: '',
      contractCode: cand?.contractCode || '',
      remarks: '',
      jurisdiction: 'central',
      contractStartDate: cand?.onboardingDate || new Date().toISOString().split('T')[0],
      contractEndDate: cand?.contractExpireDate || (cand?.onboardingDate ? new Date(new Date(cand.onboardingDate).setFullYear(new Date(cand.onboardingDate).getFullYear() + 1)).toISOString().split('T')[0] : ''),
      dbtStatus: 'UNPAID',
      contractType: 'optional',
      payoutMonth: `AUG-${new Date().getFullYear()}`,
      beneficiaryStatus: 'created',
      dbtProcessedToPfmsDate: '',
      candidateDbtConsent: 'Yes',
      eKycStatus: 'Yes',
      establishmentSharedStatus: 'pending',
      amount: cand?.dbtEligibleAmount || 0,
      paymentStatus: 'PENDING',
      paymentFailureReason: ''
    });
    setShowNapsModal(true);
  };

  const handleOpenEditNaps = (rec: NAPSPortalRecord) => {
    setEditingNapsRecord(rec);
    const cand = candidateList.find(c => c.id === rec.candidateId || c.contractCode === rec.contractCode || (c.name && rec.candidateName && c.name.toLowerCase() === rec.candidateName.toLowerCase()));
    setNapsForm({
      candidateId: rec.candidateId || cand?.id || '',
      candidateName: rec.candidateName || cand?.name || '',
      candidateAadhaarName: rec.candidateAadhaarName || rec.candidateName || cand?.name || '',
      documentReceiveDate: rec.documentReceiveDate || cand?.documentReceiveDate || '',
      establishmentCode: rec.establishmentCode,
      location: rec.location || (rec.ojtDistrict ? `${rec.ojtDistrict}, ${rec.ojtState}` : ''),
      ojtState: rec.ojtState,
      ojtDistrict: rec.ojtDistrict,
      dob: rec.dob || cand?.dob || '',
      gender: rec.gender || cand?.gender || '',
      mobileNumber: rec.mobileNumber || cand?.phone || '',
      emailId: rec.emailId || cand?.email || '',
      stipend: rec.stipend || cand?.stipendAmount || rec.amount || 0,
      qualification: rec.qualification || cand?.qualification || '',
      curriculum: rec.curriculum || cand?.tradeOrRole || '',
      apprenticeCode: rec.apprenticeCode,
      beneficiaryId: rec.beneficiaryId,
      contractCode: rec.contractCode,
      remarks: rec.remarks || '',
      contractStartDate: rec.contractStartDate,
      contractEndDate: rec.contractEndDate,
      dbtStatus: (rec.dbtStatus as any) || (rec.paymentStatus === 'PAID' ? 'PAID' : rec.paymentStatus === 'FAILED' ? 'FAIL' : 'UNPAID'),
      jurisdiction: rec.jurisdiction,
      contractType: rec.contractType,
      payoutMonth: rec.payoutMonth,
      beneficiaryStatus: rec.beneficiaryStatus,
      dbtProcessedToPfmsDate: rec.dbtProcessedToPfmsDate || '',
      candidateDbtConsent: rec.candidateDbtConsent,
      eKycStatus: rec.eKycStatus,
      establishmentSharedStatus: rec.establishmentSharedStatus,
      amount: rec.amount,
      paymentStatus: rec.paymentStatus,
      paymentFailureReason: rec.paymentFailureReason || ''
    });
    setShowNapsModal(true);
  };

  const applyCandidateToNapsForm = (matched: ApprenticeRecord, baseForm?: Partial<Omit<NAPSPortalRecord, 'id'>>) => {
    setNapsForm(prev => {
      const current = { ...prev, ...(baseForm || {}) };
      return {
        ...current,
        candidateId: matched.id,
        candidateName: matched.name,
        candidateAadhaarName: matched.name,
        dob: matched.dob || current.dob,
        gender: matched.gender || current.gender,
        mobileNumber: matched.phone || current.mobileNumber,
        emailId: matched.email || current.emailId,
        stipend: matched.stipendAmount || current.stipend,
        qualification: matched.qualification || current.qualification,
        curriculum: matched.tradeOrRole || current.curriculum,
        apprenticeCode: matched.apprenticeCode || current.apprenticeCode,
        contractCode: matched.contractCode || current.contractCode,
        contractStartDate: matched.onboardingDate || current.contractStartDate,
        contractEndDate: matched.contractExpireDate || (matched.onboardingDate ? new Date(new Date(matched.onboardingDate).setFullYear(new Date(matched.onboardingDate).getFullYear() + 1)).toISOString().split('T')[0] : current.contractEndDate),
        documentReceiveDate: matched.documentReceiveDate || current.documentReceiveDate,
        location: (matched.ojtDistrict ? `${matched.ojtDistrict}, ${matched.ojtState || ''}` : current.location),
        amount: (matched.dbtEligibleAmount !== undefined && matched.dbtEligibleAmount !== null && matched.dbtEligibleAmount > 0) ? matched.dbtEligibleAmount : current.amount
      };
    });
  };

  const handleCnCodeInputChange = (newCn: string) => {
    const cleanCn = newCn.trim().toLowerCase();
    const matched = cleanCn ? candidateList.find(c => c.contractCode && c.contractCode.trim().toLowerCase() === cleanCn) : null;
    if (matched) {
      applyCandidateToNapsForm(matched, { contractCode: newCn });
    } else {
      setNapsForm(prev => ({ ...prev, contractCode: newCn }));
    }
  };

  const handleApCodeInputChange = (newAp: string) => {
    const cleanAp = newAp.trim().toLowerCase();
    const matched = cleanAp ? candidateList.find(c => c.apprenticeCode && c.apprenticeCode.trim().toLowerCase() === cleanAp) : null;
    if (matched) {
      applyCandidateToNapsForm(matched, { apprenticeCode: newAp });
    } else {
      setNapsForm(prev => ({ ...prev, apprenticeCode: newAp }));
    }
  };

  const handleSaveNapsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!napsForm.apprenticeCode || !napsForm.contractCode) return;

    if (editingNapsRecord) {
      await updateNAPSRecord(submission.id, editingNapsRecord.id, napsForm);
    } else {
      await addNAPSRecord(submission.id, napsForm);
    }

    // Automatically sync contractCode, apprenticeCode, contractStatus, and dbtEligibleAmount to candidate record
    const targetCandidateId = napsForm.candidateId || 
      candidateList.find(c => 
        (napsForm.contractCode && c.contractCode && c.contractCode.trim().toLowerCase() === napsForm.contractCode.trim().toLowerCase()) ||
        (napsForm.apprenticeCode && c.apprenticeCode && c.apprenticeCode.trim().toLowerCase() === napsForm.apprenticeCode.trim().toLowerCase()) ||
        (napsForm.candidateName && c.name && c.name.toLowerCase() === napsForm.candidateName.toLowerCase())
      )?.id || 
      (candidateList.length === 1 ? candidateList[0].id : null);

    if (targetCandidateId) {
      const updatedCandidates = candidateList.map(c => {
        if (c.id === targetCandidateId) {
          return {
            ...c,
            contractCode: napsForm.contractCode,
            apprenticeCode: napsForm.apprenticeCode,
            dbtEligibleAmount: Number(napsForm.amount) || c.dbtEligibleAmount || 0,
            contractStatus: 'Signed' as const
          };
        }
        return c;
      });
      await updateClientComplianceReport(submission.id, { candidates: updatedCandidates });
    }

    setShowNapsModal(false);
    setEditingNapsRecord(null);
  };

  const handleDuplicateNapsToNextMonth = async (rec: NAPSPortalRecord) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    let nextMonth = 'SEP-2026';
    const parts = (rec.payoutMonth || '').split('-');
    if (parts.length === 2) {
      const curM = parts[0].toUpperCase();
      const curY = parseInt(parts[1], 10);
      const mIdx = months.indexOf(curM);
      if (mIdx !== -1 && !isNaN(curY)) {
        if (mIdx === 11) {
          nextMonth = `JAN-${curY + 1}`;
        } else {
          nextMonth = `${months[mIdx + 1]}-${curY}`;
        }
      }
    }
    const duplicated: Omit<NAPSPortalRecord, 'id'> = {
      ...rec,
      payoutMonth: nextMonth,
      dbtProcessedToPfmsDate: ''
    };
    await addNAPSRecord(submission.id, duplicated);
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

  const filteredAdminAtt = useMemo(() => {
    return attendanceRecords.filter(r => {
      if (adminAttFilterMonth !== 'all' && r.month !== adminAttFilterMonth) return false;
      if (adminAttFilterYear !== 'all' && r.year !== adminAttFilterYear) return false;
      if (adminAttFilterCode && !r.candidateCode.toLowerCase().includes(adminAttFilterCode.toLowerCase()) && !r.candidateName.toLowerCase().includes(adminAttFilterCode.toLowerCase())) return false;
      return true;
    });
  }, [attendanceRecords, adminAttFilterMonth, adminAttFilterYear, adminAttFilterCode]);

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] w-screen h-screen bg-[#f8fafc] flex flex-col overflow-hidden text-zinc-900 font-sans"
        >
          {/* Fullscreen Sticky Header with Back Button, Title, Status & Close */}
          <div className="sticky top-0 z-30 bg-white border-b border-zinc-200 px-6 sm:px-10 py-3.5 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Back to Dashboard Button */}
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>

              <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0a192f] text-amber-300 font-serif flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {submission.company_name?.charAt(0) || submission.client_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 leading-tight">
                      {submission.company_name || submission.client_name || 'Company Information'}
                    </h2>
                    {getStatusBadge(submission.status)}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Client: {submission.client_name} · ID: {submission.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Indicator Badge */}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border hidden sm:inline-flex items-center gap-1 ${
                isSenior 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <span>{isSenior ? 'Senior Admin (Full)' : 'Junior Admin (Restricted)'}</span>
              </span>

              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1">
                <span className="text-xs text-zinc-500 font-medium hidden md:inline">Approval:</span>
                <select
                  value={submission.status}
                  onChange={(e) => {
                    const next = e.target.value as SubmissionStatus;
                    if (!permissions.canApproveOrRejectClient && (next === 'approved' || next === 'rejected')) {
                      alert('Restricted: Changing status to Approved requires Senior Admin authorization.');
                      return;
                    }
                    onStatusChange(submission.id, next);
                  }}
                  className="text-xs font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved" disabled={!permissions.canApproveOrRejectClient}>
                    Approved {!permissions.canApproveOrRejectClient ? '(Senior Admin Only)' : ''}
                  </option>
                  <option value="in_progress">In Progress</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              {/* Top Close Button */}
              <button
                onClick={onClose}
                title="Close Fullscreen (ESC)"
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Section Tabs Bar */}
          <div className="px-6 sm:px-10 py-2.5 bg-white border-b border-zinc-200 flex items-center gap-2 overflow-x-auto shrink-0 shadow-2xs">
            {[
              { id: 'application', label: 'Company Info' },
              { id: 'naps_portal', label: `DBT Dashboard (${napsRecords.length})` },
              { id: 'invoices', label: `Invoices (${invoiceList.length})` },
              { id: 'documents', label: 'Company Documents' },
              { id: 'candidates', label: `Apprentices (${candidateList.length})` },
              { id: 'dbt_claims', label: `DBT Claims (${dbtClaims.length})` },
              { id: 'spoc_logs', label: `SPOC Alerts (${spocLogs.length})` },
              { id: 'attendance', label: `Attendance (${attendanceRecords.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0a192f] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Fullscreen Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-12 py-6">
            <div className="max-w-7xl mx-auto space-y-5">

              {/* SPOC Management & Routing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Client Company Designated SPOC */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-700" />
                        <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                          Client Company SPOC
                        </h4>
                      </div>
                      {permissions.canReassignSPOC ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingSpoc(!isEditingSpoc)}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-800 cursor-pointer transition-all"
                        >
                          {isEditingSpoc ? 'Cancel' : 'Edit'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded-full bg-zinc-200/50" title="Only Senior Admin can reassign official client SPOC">
                          Locked (Senior Only)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Contact at {submission.company_name || 'the client company'} who receives candidate dossiers.
                    </p>
                  </div>

                  {isEditingSpoc ? (
                    <div className="p-3 rounded-xl bg-white border border-zinc-200 space-y-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">SPOC Name *</label>
                        <input
                          type="text"
                          value={companySpocState.name}
                          onChange={(e) => setCompanySpocState({ ...companySpocState, name: e.target.value })}
                          placeholder="Contact Name"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium text-xs focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">SPOC Email *</label>
                        <input
                          type="email"
                          value={companySpocState.email}
                          onChange={(e) => setCompanySpocState({ ...companySpocState, email: e.target.value })}
                          placeholder="spoc@client.com"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium text-xs focus:outline-none focus:border-black"
                        />
                      </div>
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveSpoc}
                          className="px-3 py-1 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold cursor-pointer transition-all"
                        >
                          Save Client SPOC
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white border border-zinc-200 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="font-bold text-zinc-900 block font-sans">
                          {submission.assigned_company_spoc?.name || companySpocState.name || 'Not Configured'}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {submission.assigned_company_spoc?.email || companySpocState.email || 'No email assigned'}
                        </span>
                      </div>
                      {submission.assigned_company_spoc?.email && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-sans">
                          Client Lead
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Platform Operations SPOC (Admin) */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-700" />
                      <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                        Organization Operations SPOC
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Platform lead overseeing this client's compliance dossiers and dispatches.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-zinc-200 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-zinc-900 block font-sans">
                        {adminSpoc?.name || 'Not Configured'}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {adminSpoc?.email || 'Set in Executive Telemetry'}
                      </span>
                    </div>
                    {adminSpoc?.email && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white font-sans">
                        Platform Lead
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* TAB 1: Intake Application */}
              {activeTab === 'application' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                      <div className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Progress</div>
                      <div className="text-base font-extrabold text-zinc-900 mt-0.5">{submission.completion_percentage}%</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                      <div className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Time in Intake</div>
                      <div className="text-base font-extrabold text-zinc-900 mt-0.5">{Math.floor(submission.time_spent_seconds / 60)}m {submission.time_spent_seconds % 60}s</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                      <div className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Date Logged</div>
                      <div className="text-base font-extrabold text-zinc-900 mt-0.5">
                        {new Date(submission.last_active_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Establishment Registration Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                        1. Establishment Registration Details ({responses.enrollmentScheme || 'NAPS'} Scheme)
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        {responses.enrollmentScheme || 'NAPS'} Portal
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Name of Establishment:</span> 
                        <strong className="text-zinc-900">{submission.establishment_details?.establishmentName || responses.companyName || submission.company_name || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Establishment Type:</span> 
                        <span className="text-zinc-800 font-semibold">{submission.establishment_details?.establishmentType || responses.establishmentType || 'FOOD SERVICE / SERVICES'}</span>
                      </div>
                      {(submission.establishment_details?.establishmentCategory || responses.establishmentCategory) && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">Category / Sector:</span> 
                          <span className="text-zinc-800 font-medium">{submission.establishment_details?.establishmentCategory || responses.establishmentCategory}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Company PAN:</span> 
                        <span className="font-mono font-bold text-zinc-900">{submission.establishment_details?.pan || responses.panNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">GSTIN Number:</span> 
                        <span className="font-mono font-bold text-zinc-900">{submission.establishment_details?.gstin || responses.gstinNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Contact Person:</span> 
                        <span className="text-zinc-800 font-medium">{submission.establishment_details?.contactPerson || responses.contactName || submission.client_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Contact Mobile:</span> 
                        <span className="text-zinc-800 font-mono">{submission.establishment_details?.contactPhone || responses.contactPhone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Official Contact Email:</span> 
                        <span className="text-zinc-800 font-mono">{submission.establishment_details?.contactEmail || responses.contactEmail || submission.client_email || 'N/A'}</span>
                      </div>
                      {(submission.establishment_details?.landline || responses.landlineNumber) && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">Landline:</span> 
                          <span className="text-zinc-800 font-mono">{submission.establishment_details?.landline || responses.landlineNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Apprentice Quota:</span> 
                        <span className="font-extrabold text-emerald-800">{responses.requiredApprenticeCount || 0} Candidates</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Operational States:</span> 
                        <span className="font-bold text-zinc-900">{responses.operationalStates || submission.establishment_details?.state || 'N/A'}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-200 text-zinc-600">
                        <span className="text-zinc-500 font-medium block mb-0.5">Registered Address:</span>
                        <p className="text-[11px] text-zinc-700 bg-white p-2.5 rounded-xl border border-zinc-200">
                          {submission.establishment_details?.address || responses.registeredAddress || 'N/A'}
                          {(submission.establishment_details?.city || responses.city) && (
                            <span className="block mt-0.5 text-zinc-500 font-mono text-[10px]">
                              {submission.establishment_details?.city || responses.city}, {submission.establishment_details?.district || responses.district || ''}, {submission.establishment_details?.state || responses.state || ''} - {submission.establishment_details?.pincode || responses.pincode || ''}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Head of Establishment Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                      2. Head of Establishment
                    </h4>
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Full Name:</span> 
                        <span className="font-bold text-zinc-900">{submission.establishment_details?.headOfEstablishment || responses.headOfEstablishmentName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Designation:</span> 
                        <span className="text-zinc-800 font-semibold">{submission.establishment_details?.designation || responses.headOfEstablishmentDesignation || 'Director'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Official Email ID:</span> 
                        <span className="font-mono text-zinc-800">{submission.establishment_details?.headOfEstablishmentEmail || responses.headOfEstablishmentEmail || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Signing Authority:</span> 
                        <span className="font-bold text-emerald-700">Authorized Signatory Declared</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Designated Notification SPOC */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                        3. Designated Notification SPOC
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                        Configured for Candidate Dossiers
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">SPOC Name:</span> 
                        <span className="font-bold text-zinc-900">{submission.assigned_company_spoc?.name || responses.spocFullName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">SPOC Official Email:</span> 
                        <span className="font-mono font-bold text-blue-700">{submission.assigned_company_spoc?.email || responses.spocEmailAddress || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">SPOC Phone:</span> 
                        <span className="font-mono text-zinc-800">{submission.assigned_company_spoc?.phone || responses.spocPhone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Role / Title:</span> 
                        <span className="text-zinc-800">{submission.assigned_company_spoc?.roleTitle || responses.spocRoleTitle || 'HR / Compliance SPOC'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Tax & Compliance Identifiers */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                      4. Statutory Compliance Documents
                    </h4>
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Company GSTIN:</span> 
                        <span className="font-mono font-bold text-zinc-900">{responses.gstinNumber || submission.establishment_details?.gstin || 'N/A'}</span>
                      </div>
                      {companyDocs.epfoRegistrationCode && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500 font-medium">EPFO Registration Code:</span> 
                          <span className="font-mono text-zinc-800">{companyDocs.epfoRegistrationCode}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Uploaded Documents:</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('documents')}
                          className="font-bold text-black hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>Cross-verify in Documents Tab</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: NAPS Government Portal (Government DBT) */}
              {activeTab === 'naps_portal' && (
                <div className="space-y-4">
                  {/* Top Bar: Controls & Add Record */}
                  <div className="p-4 rounded-2xl bg-[#0a192f] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-amber-300" />
                        <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                          DBT Dashboard & Government NAPS Registry
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        Client-specific records verified against DBT / PFMS / NAPS portal. Records update the client's live view.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenAddNaps()}
                        className="px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Monthly Record</span>
                      </button>
                    </div>
                  </div>

                  {/* Card: Client Monthly Stipend Payment Submissions (Section 4 Review & Govt. DBT Fill) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                            Client Monthly Stipend Disbursements & Govt. DBT Approval (Section 4)
                          </h4>
                          <p className="text-[11px] text-zinc-500">
                            Client enters stipend paid + payment date. Admin reviews, verifies on NAPS portal, and fills DBT govt subsidy and PFMS release date.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAdminAddStipend(true)}
                        className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Month (Admin)</span>
                      </button>
                    </div>

                    {stipendAdminSuccess && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                        <span>{stipendAdminSuccess}</span>
                        <button onClick={() => setStipendAdminSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-zinc-200">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-[#0a192f] text-white uppercase tracking-wider text-[9px] font-mono whitespace-nowrap">
                          <tr>
                            <th className="py-2 px-3">Month</th>
                            <th className="py-2 px-3">Stipend Paid by Employer</th>
                            <th className="py-2 px-3">Date Paid</th>
                            <th className="py-2 px-3">DBT by Govt. (₹)</th>
                            <th className="py-2 px-3">DBT Release Date</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Remarks</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium whitespace-nowrap">
                          {stipendPayments.length > 0 ? (
                            stipendPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-2 px-3 font-bold font-sans text-zinc-900">
                                  {p.month} {p.year && p.year !== 'all' ? p.year : ''}
                                  {p.submittedByClient && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-rose-100 text-rose-800 border border-rose-300 font-bold">Client</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold text-zinc-900">₹{p.stipendPaidByEmployer?.toLocaleString('en-IN') || '-'}</td>
                                <td className="py-2 px-3 font-mono text-zinc-600">{p.datePaid || '-'}</td>
                                <td className="py-2 px-3 font-mono font-bold text-emerald-700">₹{p.dbtByGovt?.toLocaleString('en-IN') || '0'}</td>
                                <td className="py-2 px-3 font-mono text-zinc-600">{p.dbtReleaseDate || '-'}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    p.status === 'DBT RELEASED' ? 'bg-emerald-100 text-emerald-800' :
                                    p.status === 'UNDER PROCESS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {p.status || 'SUBMITTED'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 max-w-xs">
                                  {p.remarks ? (
                                    p.submittedByClient ? (
                                      <span className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 font-bold text-[11px] block truncate" title={p.remarks}>
                                        [Client Remark] {p.remarks}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-600 font-sans truncate block">{p.remarks}</span>
                                    )
                                  ) : '-'}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditStipend(p)}
                                    className="px-2.5 py-1 rounded-lg bg-[#0a192f] text-white hover:bg-zinc-800 text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Edit DBT & Remarks
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-zinc-400">
                                No monthly stipend entries logged yet for this client.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Section 6 Client Remarks & Action Items */}
                    <div className="pt-3 border-t border-zinc-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <h5 className="text-[11px] font-bold text-zinc-900 uppercase font-mono">
                            Client Remarks & Action Items (Section 6)
                          </h5>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">Client-submitted items tagged in red</span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-zinc-200">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#0a192f] text-white uppercase tracking-wider text-[9px] font-mono whitespace-nowrap">
                            <tr>
                              <th className="py-2 px-3">S.No</th>
                              <th className="py-2 px-3">Observation / Remark</th>
                              <th className="py-2 px-3">Action Required</th>
                              <th className="py-2 px-3">Owner</th>
                              <th className="py-2 px-3">Target Date</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 font-medium whitespace-nowrap">
                            {actionItemsList.length > 0 ? (
                              actionItemsList.map((act, aIdx) => (
                                <tr key={act.id || aIdx} className="hover:bg-zinc-50/80 transition-colors">
                                  <td className="py-2 px-3 font-mono font-bold text-zinc-400">{aIdx + 1}</td>
                                  <td className="py-2 px-3 max-w-xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {act.addedBy === 'client' ? (
                                        <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-300 text-rose-700 font-bold text-[10px]">
                                          [Client Remark] {act.observation}
                                        </span>
                                      ) : (
                                        <span className="text-zinc-900 font-semibold">{act.observation}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-zinc-700 max-w-xs truncate">{act.actionRequired}</td>
                                  <td className="py-2 px-3 font-semibold text-zinc-800">{act.owner}</td>
                                  <td className="py-2 px-3 font-mono text-zinc-500">{act.targetDate}</td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      {act.status || 'ACTIVE'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-zinc-400">
                                  No compliance remarks or action items logged yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="font-mono text-zinc-600 text-[11px] font-bold">Month:</span>
                          <select
                            value={napsFormMonthFilter}
                            onChange={(e) => setNapsFormMonthFilter(e.target.value)}
                            className="px-2.5 py-1 rounded-full bg-white border border-zinc-300 text-zinc-900 font-bold text-xs cursor-pointer focus:outline-none"
                          >
                            <option value="all">All Months</option>
                            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="font-mono text-zinc-600 text-[11px] font-bold">Year:</span>
                          <select
                            value={napsFormYearFilter}
                            onChange={(e) => setNapsFormYearFilter(e.target.value)}
                            className="px-2.5 py-1 rounded-full bg-white border border-zinc-300 text-zinc-900 font-bold text-xs cursor-pointer focus:outline-none"
                          >
                            <option value="all">All Years</option>
                            {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="font-mono text-zinc-600 text-[11px] font-bold">DBT Status:</span>
                          <select
                            value={napsFilterDbtStatus}
                            onChange={(e) => setNapsFilterDbtStatus(e.target.value)}
                            className="px-2.5 py-1 rounded-full bg-white border border-zinc-300 text-zinc-900 font-bold text-xs cursor-pointer focus:outline-none"
                          >
                            <option value="all">All Statuses</option>
                            <option value="PAID">PAID</option>
                            <option value="UNPAID">UNPAID</option>
                            <option value="FAIL">FAIL</option>
                          </select>
                        </div>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search Aadhar name, email..."
                          value={napsSearchQuery}
                          onChange={(e) => setNapsSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white border border-zinc-300 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    {/* Dedicated Code Filters */}
                    <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                        <span className="font-mono text-zinc-500 text-[11px] font-bold whitespace-nowrap">Est Code:</span>
                        <input
                          type="text"
                          placeholder="Filter Establishment Code..."
                          value={napsFilterEstCode}
                          onChange={(e) => setNapsFilterEstCode(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-zinc-300 text-xs text-zinc-800 font-mono focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                        <span className="font-mono text-zinc-500 text-[11px] font-bold whitespace-nowrap">CN Code:</span>
                        <input
                          type="text"
                          placeholder="Filter CN Code..."
                          value={napsFilterCnCode}
                          onChange={(e) => setNapsFilterCnCode(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-zinc-300 text-xs text-zinc-800 font-mono focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                        <span className="font-mono text-zinc-500 text-[11px] font-bold whitespace-nowrap">AP Code:</span>
                        <input
                          type="text"
                          placeholder="Filter AP Code..."
                          value={napsFilterApCode}
                          onChange={(e) => setNapsFilterApCode(e.target.value)}
                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-zinc-300 text-xs text-zinc-800 font-mono focus:outline-none focus:border-black"
                        />
                      </div>

                      {(napsFilterEstCode || napsFilterCnCode || napsFilterApCode || napsFormMonthFilter !== 'all' || napsFormYearFilter !== 'all' || napsFilterDbtStatus !== 'all' || napsSearchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setNapsFilterEstCode('');
                            setNapsFilterCnCode('');
                            setNapsFilterApCode('');
                            setNapsFormMonthFilter('all');
                            setNapsFormYearFilter('all');
                            setNapsFilterDbtStatus('all');
                            setNapsSearchQuery('');
                          }}
                          className="px-3 py-1 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* NAPS Portal Table (19 Required Columns) */}
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#112240] text-white uppercase tracking-wider text-[9px] font-mono whitespace-nowrap">
                        <tr>
                          <th className="py-2.5 px-3">Serial No</th>
                          <th className="py-2.5 px-3">Document Receive Date</th>
                          <th className="py-2.5 px-3">Establishment Code</th>
                          <th className="py-2.5 px-3">Location</th>
                          <th className="py-2.5 px-3">Candidate Aadhar Name</th>
                          <th className="py-2.5 px-3">DOB</th>
                          <th className="py-2.5 px-3">Gender</th>
                          <th className="py-2.5 px-3">Mobile Number</th>
                          <th className="py-2.5 px-3">Email ID</th>
                          <th className="py-2.5 px-3">Stipend</th>
                          <th className="py-2.5 px-3">Qualification</th>
                          <th className="py-2.5 px-3">Curriculum</th>
                          <th className="py-2.5 px-3">AP Code</th>
                          <th className="py-2.5 px-3">Beneficiary ID</th>
                          <th className="py-2.5 px-3">CN Number</th>
                          <th className="py-2.5 px-3">Remarks</th>
                          <th className="py-2.5 px-3">Contract Start Date</th>
                          <th className="py-2.5 px-3">Contract End Date</th>
                          <th className="py-2.5 px-3">DBT Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium whitespace-nowrap">
                        {filteredNapsRecords.length > 0 ? (
                          filteredNapsRecords.map((rec, idx) => {
                            const cand = candidateList.find(c => c.id === rec.candidateId || c.contractCode === rec.contractCode || (c.name && rec.candidateName && c.name.toLowerCase() === rec.candidateName.toLowerCase()));
                            const docRecDate = rec.documentReceiveDate || cand?.documentReceiveDate || '-';
                            const estCode = rec.establishmentCode || '-';
                            const loc = rec.location || (rec.ojtDistrict ? `${rec.ojtDistrict}, ${rec.ojtState}` : (cand?.ojtDistrict ? `${cand.ojtDistrict}, ${cand.ojtState || ''}` : '-'));
                            const aadharName = rec.candidateAadhaarName || rec.candidateName || cand?.name || '-';
                            const birthDate = rec.dob || cand?.dob || '-';
                            const candGender = rec.gender || cand?.gender || '-';
                            const phoneNum = rec.mobileNumber || cand?.phone || '-';
                            const mailAddr = rec.emailId || cand?.email || '-';
                            const stipendVal = rec.stipend || cand?.stipendAmount || rec.amount || 0;
                            const qual = rec.qualification || cand?.qualification || '-';
                            const curr = rec.curriculum || cand?.tradeOrRole || '-';
                            const apCode = rec.apprenticeCode || cand?.apprenticeCode || '-';
                            const benId = rec.beneficiaryId || '-';
                            const cnNum = rec.contractCode || cand?.contractCode || '-';
                            const rem = rec.remarks || '-';
                            const startDate = rec.contractStartDate || cand?.onboardingDate || '-';
                            const endDate = rec.contractEndDate || cand?.contractExpireDate || '-';
                            const resolvedStatus: 'PAID' | 'UNPAID' | 'FAIL' = 
                              rec.dbtStatus === 'PAID' || rec.paymentStatus === 'PAID' ? 'PAID' :
                              rec.dbtStatus === 'FAIL' || rec.paymentStatus === 'FAILED' ? 'FAIL' : 'UNPAID';

                            return (
                              <tr key={rec.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-2 px-3 font-mono font-bold text-zinc-400">{idx + 1}</td>
                                <td className="py-2 px-3 font-mono text-zinc-600">{docRecDate}</td>
                                <td className="py-2 px-3 font-mono font-bold text-zinc-800">{estCode}</td>
                                <td className="py-2 px-3 text-zinc-700">{loc}</td>
                                <td className="py-2 px-3 font-bold text-zinc-900">{aadharName}</td>
                                <td className="py-2 px-3 font-mono text-zinc-600">{birthDate}</td>
                                <td className="py-2 px-3 capitalize text-zinc-700">{candGender}</td>
                                <td className="py-2 px-3 font-mono text-zinc-700">{phoneNum}</td>
                                <td className="py-2 px-3 font-mono text-zinc-600">{mailAddr}</td>
                                <td className="py-2 px-3 font-bold text-zinc-900 font-mono">₹{stipendVal.toLocaleString('en-IN')}</td>
                                <td className="py-2 px-3 text-zinc-700">{qual}</td>
                                <td className="py-2 px-3 text-zinc-700 max-w-xs truncate">{curr}</td>
                                <td className="py-2 px-3 font-mono text-sky-800 font-bold">{apCode}</td>
                                <td className="py-2 px-3 font-mono text-zinc-500">{benId}</td>
                                <td className="py-2 px-3 font-mono font-bold text-zinc-800">{cnNum}</td>
                                <td className="py-2 px-3 text-zinc-600 max-w-xs truncate">{rem}</td>
                                <td className="py-2 px-3 font-mono text-zinc-600">{startDate}</td>
                                <td className="py-2 px-3 font-mono text-zinc-600">{endDate}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    resolvedStatus === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : resolvedStatus === 'FAIL'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {resolvedStatus}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateNapsToNextMonth(rec)}
                                      title="Replicate to next month"
                                      className="p-1 text-zinc-500 hover:text-black rounded hover:bg-zinc-100 cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditNaps(rec)}
                                      title="Edit record"
                                      className="p-1 text-zinc-500 hover:text-black rounded hover:bg-zinc-100 cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteNAPSRecord(submission.id, rec.id)}
                                      title="Delete record"
                                      className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={20} className="py-8 text-center text-zinc-400">
                              No DBT dashboard records found matching the selected filters. Click &quot;+ Add Monthly Record&quot; to add rows or clear active filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: Company Invoices (TPA Facilitation & Management) */}
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                            Company Facilitation Invoices (Section 5)
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Manage and issue facilitation / management invoices to the client. Invoices added here sync directly to Section 5 of the client portal.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddInvoiceModal(true)}
                        className="px-3.5 py-1.5 rounded-full bg-[#0a192f] hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Invoice (Company)</span>
                      </button>
                    </div>

                    {invoiceSuccessMsg && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                        <span>{invoiceSuccessMsg}</span>
                        <button onClick={() => setInvoiceSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-zinc-200">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-[#0a192f] text-white uppercase tracking-wider text-[9px] font-mono whitespace-nowrap">
                          <tr>
                            <th className="py-2.5 px-3">Invoice No.</th>
                            <th className="py-2.5 px-3">Invoice Date</th>
                            <th className="py-2.5 px-3">Amount (₹)</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Payment Date</th>
                            <th className="py-2.5 px-3">Remarks</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-medium whitespace-nowrap">
                          {invoiceList.length > 0 ? (
                            invoiceList.map((inv) => (
                              <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">{inv.invoiceNo}</td>
                                <td className="py-2.5 px-3 font-mono text-zinc-600">{inv.invoiceDate}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">₹{inv.amount.toLocaleString('en-IN')}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    inv.status === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-zinc-600">{inv.paymentDate || '-'}</td>
                                <td className="py-2.5 px-3 text-zinc-600 font-sans max-w-xs truncate">{inv.remarks || '-'}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => deleteInvoice(currentSub.id, inv.id)}
                                    title="Delete invoice"
                                    className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-zinc-400">
                                No facilitation invoices created yet. Click &quot;+ Add Invoice (Company)&quot; to generate an invoice for this client.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Company Documents (.pdf, .docx, .txt) with View & Download */}
              {activeTab === 'documents' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">Company GSTIN:</span> <span className="font-mono font-bold text-zinc-900">{responses.gstinNumber || '27AAACN0123M1Z5 (Logged)'}</span></div>
                    {companyDocs.epfoRegistrationCode && (
                      <div className="flex justify-between"><span className="text-zinc-500 font-medium">EPFO Code:</span> <span className="font-mono text-zinc-800">{companyDocs.epfoRegistrationCode}</span></div>
                    )}
                  </div>

                  {/* Dynamic Company Documents List */}
                  {(() => {
                    const dynamicEntries = Object.entries(companyDocs?.dynamicDocs || {}) as [string, UploadedDocument][];
                    if (dynamicEntries.length > 0) {
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {dynamicEntries.map(([key, doc]) => (
                            <div key={key} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-zinc-900">{doc.category || key.toUpperCase()}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Attached</span>
                                </div>
                                <div className="font-mono text-zinc-600 text-[11px] truncate mb-2" title={doc.name}>
                                  {doc.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200">
                                <button
                                  type="button"
                                  onClick={() => setPreviewingDoc(doc)}
                                  className="flex-1 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadDocumentFile(doc)}
                                  className="p-1.5 rounded-xl bg-black text-white hover:bg-zinc-800 cursor-pointer"
                                  title={`Download ${doc.name}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    // Fallback to legacy fields if dynamicDocs not yet populated
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* COI */}
                        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-zinc-900">Certificate of Incorporation</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Verified</span>
                            </div>
                            <div className="font-mono text-zinc-600 text-[11px] truncate mb-2">
                              {companyDocs.coiFileName || 'certificate_of_incorporation.pdf'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200">
                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(companyDocs.coiDoc || { name: companyDocs.coiFileName || 'certificate_of_incorporation.pdf', type: 'pdf' })}
                              className="flex-1 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(companyDocs.coiDoc || { name: companyDocs.coiFileName || 'certificate_of_incorporation.pdf', type: 'pdf' })}
                              className="p-1.5 rounded-xl bg-black text-white hover:bg-zinc-800 cursor-pointer"
                              title="Download COI"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* GST */}
                        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-zinc-900">GST Registration</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Verified</span>
                            </div>
                            <div className="font-mono text-zinc-600 text-[11px] truncate mb-2">
                              {companyDocs.gstFileName || 'company_gst_registration.pdf'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200">
                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(companyDocs.gstDoc || { name: companyDocs.gstFileName || 'company_gst_registration.pdf', type: 'pdf' })}
                              className="flex-1 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(companyDocs.gstDoc || { name: companyDocs.gstFileName || 'company_gst_registration.pdf', type: 'pdf' })}
                              className="p-1.5 rounded-xl bg-black text-white hover:bg-zinc-800 cursor-pointer"
                              title="Download GST"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Signatory Letter */}
                        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-zinc-900">Signatory Authorization</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Verified</span>
                            </div>
                            <div className="font-mono text-zinc-600 text-[11px] truncate mb-2">
                              {companyDocs.signatoryLetterFileName || 'board_authorization_letter.pdf'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200">
                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(companyDocs.signatoryDoc || { name: companyDocs.signatoryLetterFileName || 'board_authorization_letter.pdf', type: 'pdf' })}
                              className="flex-1 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(companyDocs.signatoryDoc || { name: companyDocs.signatoryLetterFileName || 'board_authorization_letter.pdf', type: 'pdf' })}
                              className="p-1.5 rounded-xl bg-black text-white hover:bg-zinc-800 cursor-pointer"
                              title="Download Signatory Letter"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bank Proof */}
                        <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-zinc-900">Cancelled Cheque / Bank</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Verified</span>
                            </div>
                            <div className="font-mono text-zinc-600 text-[11px] truncate mb-2">
                              {companyDocs.cancelledChequeFileName || 'company_bank_proof.pdf'}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-200">
                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(companyDocs.chequeDoc || { name: companyDocs.cancelledChequeFileName || 'company_bank_proof.pdf', type: 'pdf' })}
                              className="flex-1 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(companyDocs.chequeDoc || { name: companyDocs.cancelledChequeFileName || 'company_bank_proof.pdf', type: 'pdf' })}
                              className="p-1.5 rounded-xl bg-black text-white hover:bg-zinc-800 cursor-pointer"
                              title="Download Bank Proof"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* NATS Structured Training Module Details Card */}
                  {Boolean(responses?.structuredTrainingModule || currentSub.nats_establishment_details?.structuredTrainingModule) && (
                    <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                        <span className="font-mono font-extrabold text-xs text-zinc-900 uppercase tracking-wider">
                          NATS Structured Training Module Breakdown
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          NATS Curricular Specs
                        </span>
                      </div>
                      {(() => {
                        const moduleData = responses?.structuredTrainingModule || currentSub.nats_establishment_details?.structuredTrainingModule;
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-zinc-500 font-medium">What apprentice will learn:</span>
                              <div className="font-semibold text-zinc-800 mt-0.5">{moduleData?.learningObjectives || '-'}</div>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-medium">Duration of training:</span>
                              <div className="font-semibold text-zinc-800 mt-0.5">{moduleData?.trainingDuration || '-'}</div>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-medium">Department-wise exposure:</span>
                              <div className="font-semibold text-zinc-800 mt-0.5">{moduleData?.departmentWiseExposure || '-'}</div>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-medium">Skills to be developed:</span>
                              <div className="font-semibold text-zinc-800 mt-0.5">{moduleData?.skillsToBeDeveloped || '-'}</div>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-medium">Monthly training breakup:</span>
                              <div className="font-semibold text-zinc-800 mt-0.5">{moduleData?.monthlyTrainingBreakup || '-'}</div>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-medium">Supervisor / Training Officer:</span>
                              <div className="font-semibold text-zinc-800 mt-0.5">{moduleData?.supervisorOrOfficerDetails || '-'}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Apprentices Roster & Candidate Documents */}
              {activeTab === 'candidates' && (
                <div className="space-y-3">
                  {(() => {
                    const expiringList = getExpiringContracts(candidateList);
                    const allocatedCount = candidateList.filter(c => c.contractCode && c.contractCode !== 'CN Pending').length;
                    const pendingCount = candidateList.filter(c => !c.contractCode || c.contractCode === 'CN Pending').length;
                    const terminatedCount = candidateList.filter(c => c.contractStatus === 'Terminated' || c.status === 'Terminated').length;
                    const displayedCandidates = candidateList.filter(cand => {
                      if (candidateFilter === 'allocated') return Boolean(cand.contractCode && cand.contractCode !== 'CN Pending');
                      if (candidateFilter === 'pending') return !cand.contractCode || cand.contractCode === 'CN Pending';
                      if (candidateFilter === 'terminated') return cand.contractStatus === 'Terminated' || cand.status === 'Terminated';
                      return true;
                    });

                    return (
                      <>
                        {/* 45-Day Prior Contract Expiry Warning Banner */}
                        {expiringList.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Contract Expiry Alert: {expiringList.length} candidate(s) expiring within 45 days</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded-full text-amber-900">
                                Prior Notification Active
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {expiringList.map(({ candidate: c, daysRemaining, expiryDateStr, isExpired }) => (
                                <div key={c.id} className="p-2 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-[11px]">
                                  <div>
                                    <div className="font-bold text-zinc-900">{c.name}</div>
                                    <div className="text-[10px] font-mono text-zinc-500">Expires: {expiryDateStr}</div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                    isExpired ? 'bg-rose-100 text-rose-800' : daysRemaining <= 15 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {isExpired ? 'EXPIRED' : `${daysRemaining} days left`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="text-xs font-bold text-zinc-900 uppercase font-mono">
                            Apprentice Candidate Records & Attached Files ({candidateList.length})
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setCandidateFilter('all')}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                candidateFilter === 'all'
                                  ? 'bg-black text-white shadow-xs'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              All ({candidateList.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setCandidateFilter('allocated')}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                candidateFilter === 'allocated'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              Allocated ({allocatedCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setCandidateFilter('pending')}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                candidateFilter === 'pending'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                              }`}
                            >
                              Pending ({pendingCount})
                            </button>
                            {terminatedCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setCandidateFilter('terminated')}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                  candidateFilter === 'terminated'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-rose-100 text-rose-900 hover:bg-rose-200 border border-rose-300'
                                }`}
                              >
                                Terminated ({terminatedCount})
                              </button>
                            )}
                          </div>
                        </div>

                        {displayedCandidates.length > 0 ? (
                          <div className="space-y-3">
                            {displayedCandidates.map(cand => {
                              const expDate = cand.contractExpireDate || (cand.onboardingDate ? new Date(new Date(cand.onboardingDate).setFullYear(new Date(cand.onboardingDate).getFullYear() + 1)).toISOString().split('T')[0] : '-');
                              const isCnApproved = Boolean(cand.contractCode && cand.contractCode !== 'CN Pending');
                              const isTerminated = cand.contractStatus === 'Terminated' || cand.status === 'Terminated';

                              return (
                                <div key={cand.id} className={`p-4 rounded-2xl border text-xs space-y-3 ${isTerminated ? 'bg-rose-50/30 border-rose-200' : 'bg-zinc-50 border-zinc-200'}`}>
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-zinc-900 text-xs">{cand.name}</span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                          {cand.enrollmentScheme || 'NAPS'}
                                        </span>
                                        {isTerminated ? (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                            Terminated: {cand.terminationDate || 'Closed'} ({cand.terminationReason || 'Early cessation'})
                                          </span>
                                        ) : isCnApproved ? (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                            CN: {cand.contractCode}
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                            CN Pending
                                          </span>
                                        )}
                                        {cand.apprenticeCode && (
                                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-100 text-sky-900 border border-sky-200">
                                            AP: {cand.apprenticeCode}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{cand.id} · {cand.email || 'Verified'} · {cand.phone || 'Phone Logged'}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!isTerminated && (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenAddNaps(cand)}
                                          className="px-2.5 py-1 rounded-xl bg-[#0a192f] text-white hover:bg-zinc-800 text-[10px] font-bold cursor-pointer transition-colors"
                                        >
                                          {cand.contractCode ? 'Edit CN / DBT Record' : '+ Assign CN Number'}
                                        </button>
                                      )}
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isTerminated ? 'bg-rose-700 text-white' : 'bg-zinc-900 text-white'
                                      }`}>
                                        {isTerminated ? 'Terminated' : cand.status}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200 text-[11px]">
                                    <div><span className="text-zinc-500">Curriculum:</span> <strong className="text-zinc-800">{cand.tradeOrRole}</strong></div>
                                    <div><span className="text-zinc-500">DOJ (Joining):</span> <strong className="font-mono text-zinc-800">{cand.onboardingDate || '-'}</strong></div>
                                    <div><span className="text-zinc-500">Contract Expiry:</span> <strong className="font-mono text-zinc-800">{expDate}</strong></div>
                                    <div><span className="text-zinc-500">Stipend:</span> <strong className="text-zinc-800">₹{cand.stipendAmount.toLocaleString()}/mo</strong></div>
                                    <div><span className="text-zinc-500">Govt. DBT Share:</span> <strong className="font-bold text-emerald-700">{cand.dbtEligibleAmount ? `₹${cand.dbtEligibleAmount.toLocaleString()}/mo` : 'Pending Admin Entry'}</strong></div>
                                    <div><span className="text-zinc-500">Aadhaar:</span> <span className="font-mono">{permissions.canViewUnmaskedSensitiveData ? (cand.aadhaarNumber || 'Not specified') : (cand.aadhaarNumber ? `•••• •••• ${cand.aadhaarNumber.slice(-4)}` : '•••• •••• 9214')}</span></div>
                                    <div><span className="text-zinc-500">Bank:</span> <strong className="text-zinc-800">{cand.bankName || 'Not recorded'}</strong></div>
                                    <div><span className="text-zinc-500">A/C No:</span> <span className="font-mono">{permissions.canViewUnmaskedSensitiveData ? (cand.bankAccountNumber || 'Not recorded') : (cand.bankAccountNumber ? `•••• •••• ${cand.bankAccountNumber.slice(-4)}` : '•••• •••• 4819')}</span></div>
                                    <div><span className="text-zinc-500">IFSC:</span> <span className="font-mono font-bold text-zinc-700">{permissions.canViewUnmaskedSensitiveData ? (cand.ifscCode || 'Not recorded') : (cand.ifscCode ? `${cand.ifscCode.slice(0, 4)}••••••` : 'HDFC••••••')}</span></div>
                                  </div>

                                  {/* Candidate Attached Files Bar */}
                                  <div className="pt-2 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">Attached Documents (Max 2MB per file):</span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {/* 10th Marksheet */}
                                      {(cand.documents?.doc10th || cand.documents?.doc10thFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.doc10th || { name: cand.documents?.doc10thFile || '10th_Marksheet.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>10th Marksheet</span>
                                        </button>
                                      )}

                                      {/* 12th Marksheet */}
                                      {(cand.documents?.doc12th || cand.documents?.doc12thFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.doc12th || { name: cand.documents?.doc12thFile || '12th_Marksheet.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>12th Marksheet</span>
                                        </button>
                                      )}

                                      {/* Graduation Degree */}
                                      {(cand.documents?.docGrad || cand.documents?.educationDoc || cand.documents?.docGradFile || cand.documents?.educationFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.docGrad || cand.documents?.educationDoc || { name: cand.documents?.docGradFile || cand.documents?.educationFile || 'Degree_Certificate.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Grad / Degree</span>
                                        </button>
                                      )}

                                      {/* Photo */}
                                      {(cand.documents?.photoDoc || cand.documents?.photoFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.photoDoc || { name: cand.documents?.photoFile || 'Candidate Photo.jpg', type: 'image' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Photo</span>
                                        </button>
                                      )}

                                      {/* Signature */}
                                      {(cand.documents?.signatureDoc || cand.documents?.signatureFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.signatureDoc || { name: cand.documents?.signatureFile || 'Candidate Signature.png', type: 'image' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Sign</span>
                                        </button>
                                      )}

                                      {/* Aadhaar */}
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(cand.documents?.aadhaarDoc || { name: cand.documents?.aadhaarFile || 'Aadhaar Card.pdf', type: 'pdf' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                      >
                                        <Eye className="w-2.5 h-2.5" />
                                        <span>Aadhaar</span>
                                      </button>

                                      {/* Cheque / Bank Proof */}
                                      {(cand.documents?.bankProofDoc || cand.documents?.bankProofFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.bankProofDoc || { name: cand.documents?.bankProofFile || 'Cancelled Cheque.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Cheque</span>
                                        </button>
                                      )}

                                      {/* Resume */}
                                      <button
                                        type="button"
                                        onClick={() => setPreviewingDoc(cand.documents?.resumeDoc || { name: cand.documents?.resumeFile || 'Candidate Resume.docx', type: 'docx' })}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                      >
                                        <Eye className="w-2.5 h-2.5" />
                                        <span>Resume</span>
                                      </button>

                                      {/* PAN (NATS) */}
                                      {(cand.documents?.panDoc || cand.documents?.panFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.panDoc || { name: cand.documents?.panFile || 'PAN Card.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer flex items-center gap-1 font-bold"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>PAN</span>
                                        </button>
                                      )}

                                      {/* All Semester Marksheets (NATS) */}
                                      {(cand.documents?.allSemesterDoc || cand.documents?.allSemesterFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.allSemesterDoc || { name: cand.documents?.allSemesterFile || 'All Semester Marksheets.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer flex items-center gap-1 font-bold"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Sem Marksheets</span>
                                        </button>
                                      )}

                                      {/* Caste / Category Certificate (NATS) */}
                                      {(cand.documents?.casteCertDoc || cand.documents?.casteCertFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.casteCertDoc || { name: cand.documents?.casteCertFile || 'Caste Certificate.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>Caste Cert</span>
                                        </button>
                                      )}

                                      {/* APAR ID (NATS) */}
                                      {(cand.documents?.aparIdDoc || cand.documents?.aparIdFile) && (
                                        <button
                                          type="button"
                                          onClick={() => setPreviewingDoc(cand.documents?.aparIdDoc || { name: cand.documents?.aparIdFile || 'APAR ID Document.pdf', type: 'pdf' })}
                                          className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 cursor-pointer flex items-center gap-1"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                          <span>APAR ID</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                            {candidateFilter === 'pending'
                              ? 'No candidates currently pending CN allocation.'
                              : candidateFilter === 'allocated'
                              ? 'No candidates with active CN allocation yet.'
                              : 'No candidates onboarded by client yet.'}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: DBT Subsidy Claims */}
              {activeTab === 'dbt_claims' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-900 uppercase font-mono mb-2">
                    Filed Government DBT Subsidy Claims
                  </div>

                  {dbtClaims.length > 0 ? (
                    <div className="space-y-2.5">
                      {dbtClaims.map(claim => (
                        <div key={claim.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900">{claim.monthYear}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {claim.status}
                            </span>
                          </div>
                          <div className="flex justify-between text-zinc-600 text-[11px]">
                            <span>Amount Claimed: <strong>₹{claim.amountClaimed.toLocaleString()}</strong></span>
                            <span className="font-mono text-zinc-400">{claim.utrReference}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                      No DBT claims filed for this account yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SPOC Email Dispatches Log */}
              {activeTab === 'spoc_logs' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-900 uppercase font-mono mb-2">
                    Automated SPOC Email Dispatches Log
                  </div>

                  {spocLogs.length > 0 ? (
                    <div className="space-y-2.5">
                      {spocLogs.map(log => (
                        <div key={log.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900">{log.subject}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {log.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 font-mono">
                            <div>SPOC: <strong className="text-zinc-800">{log.recipientEmail}</strong></div>
                            <div>Candidate: <strong className="text-zinc-800">{log.candidateName}</strong></div>
                          </div>
                          {log.documentNames && (
                            <div className="text-[10px] font-mono text-zinc-400">
                              Attached: {log.documentNames.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                      No SPOC notifications triggered yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: Attendance Ledger */}
              {activeTab === 'attendance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 uppercase font-mono">
                        MONTHLY ATTENDANCE LEDGER
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        View client inputs and configure financial processing for apprentices.
                      </p>
                    </div>
                    <button
                      onClick={handleAdminGenerateAttMonth}
                      disabled={generatingAdminAtt}
                      className="px-3.5 py-1.5 rounded-full bg-[#0a192f] text-white hover:bg-zinc-800 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {generatingAdminAtt ? 'Generating...' : 'Generate Month'}
                    </button>
                  </div>

                  {adminAttSuccess && (
                    <div className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 border-emerald-200 text-emerald-800 border flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {adminAttSuccess}
                    </div>
                  )}

                  {/* Filters toolbar */}
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-zinc-500" />
                      <select
                        value={adminAttFilterMonth}
                        onChange={(e) => setAdminAttFilterMonth(e.target.value)}
                        className="text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:border-black font-mono font-bold"
                      >
                        <option value="all">All Months</option>
                        {['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={adminAttFilterYear}
                        onChange={(e) => setAdminAttFilterYear(e.target.value)}
                        className="text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:border-black font-mono font-bold"
                      >
                        <option value="all">All Yrs</option>
                        {['2024','2025','2026','2027'].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="h-5 w-px bg-zinc-300 hidden sm:block" />
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1.5" />
                      <input
                        type="text"
                        placeholder="Search candidate or code..."
                        value={adminAttFilterCode}
                        onChange={(e) => setAdminAttFilterCode(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:border-black font-mono"
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-[#0a192f] text-white">
                          <tr>
                            <th className="px-3 py-2 font-bold font-mono">Ap. Code</th>
                            <th className="px-3 py-2 font-bold font-mono">Name</th>
                            <th className="px-3 py-2 font-bold font-mono">Beneficiary ID</th>
                            <th className="px-3 py-2 font-bold font-mono">Contract Code</th>
                            <th className="px-3 py-2 font-bold font-mono text-right">Stipend (₹)</th>
                            <th className="px-3 py-2 font-bold font-mono text-center">Eligible Days</th>
                            <th className="px-3 py-2 font-bold font-mono text-center">Present</th>
                            <th className="px-3 py-2 font-bold font-mono text-center">Absent</th>
                            <th className="px-3 py-2 font-bold font-mono text-right">Stipend Payable (₹)</th>
                            <th className="px-3 py-2 font-bold font-mono text-right">Est. Contrib. (₹)</th>
                            <th className="px-3 py-2 font-bold font-mono text-right">DBT (₹)</th>
                            <th className="px-3 py-2 font-bold font-mono text-center">Status</th>
                            <th className="px-3 py-2 font-bold font-mono text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {filteredAdminAtt.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="px-4 py-8 text-center text-zinc-400 font-mono text-[11px]">
                                No attendance records found for criteria. Click &quot;Generate Month&quot; to populate records from active apprentice contracts.
                              </td>
                            </tr>
                          ) : (
                            filteredAdminAtt.map((record: MonthlyAttendanceRecord) => {
                              const isClientPending = record.status === 'PENDING_CLIENT';
                              const isSubmitted = record.status === 'SUBMITTED';
                              const isRowEditing = isSubmitted || Boolean(editingAdminAttRows[record.id]);
                              
                              const valPayable = editingAdminAttRows[record.id]?.stipendPayable ?? record.stipendPayable;
                              const valContrib = editingAdminAttRows[record.id]?.establishmentContribution ?? record.establishmentContribution;
                              const valDbt = editingAdminAttRows[record.id]?.dbtAmount ?? record.dbtAmount;

                              return (
                                <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                                  <td className="px-3 py-2 font-mono text-[10px] text-zinc-800">{record.candidateCode}</td>
                                  <td className="px-3 py-2 font-bold text-zinc-900">{record.candidateName}<br/><span className="text-[9px] font-normal text-zinc-400">{record.month} {record.year}</span></td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{record.beneficiaryId || '-'}</td>
                                  <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{record.contractCode || '-'}</td>
                                  <td className="px-3 py-2 font-mono text-[11px] text-right text-zinc-900">{record.contractStipend.toLocaleString()}</td>
                                  <td className="px-3 py-2 font-mono text-[11px] text-center text-zinc-900">{record.courseEligibleDays === 0 && isClientPending ? '-' : record.courseEligibleDays}</td>
                                  <td className="px-3 py-2 font-mono text-[11px] text-center text-emerald-700 font-bold">{record.presentDays === 0 && isClientPending ? '-' : record.presentDays}</td>
                                  <td className="px-3 py-2 font-mono text-[11px] text-center text-rose-700">{record.absentDays === 0 && isClientPending ? '-' : record.absentDays}</td>
                                  
                                  <td className="px-3 py-2 text-right">
                                    {isClientPending ? (
                                      <span className="text-zinc-400">-</span>
                                    ) : isRowEditing ? (
                                      <input type="number" value={valPayable} onChange={e => handleAdminAttFieldChange(record.id, 'stipendPayable', Number(e.target.value))} className="w-16 sm:w-20 px-1.5 py-1 text-xs border border-zinc-300 rounded-lg text-center font-mono focus:ring-1 focus:ring-[#0a192f] focus:border-[#0a192f] outline-none" />
                                    ) : (
                                      <span className="font-mono text-[11px] text-zinc-900 font-bold">{record.stipendPayable.toLocaleString()}</span>
                                    )}
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    {isClientPending ? (
                                      <span className="text-zinc-400">-</span>
                                    ) : isRowEditing ? (
                                      <input type="number" value={valContrib} onChange={e => handleAdminAttFieldChange(record.id, 'establishmentContribution', Number(e.target.value))} className="w-16 sm:w-20 px-1.5 py-1 text-xs border border-zinc-300 rounded-lg text-center font-mono focus:ring-1 focus:ring-[#0a192f] focus:border-[#0a192f] outline-none" />
                                    ) : (
                                      <span className="font-mono text-[11px] text-zinc-900 font-bold">{record.establishmentContribution.toLocaleString()}</span>
                                    )}
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    {isClientPending ? (
                                      <span className="text-zinc-400">-</span>
                                    ) : isRowEditing ? (
                                      <input type="number" value={valDbt} onChange={e => handleAdminAttFieldChange(record.id, 'dbtAmount', Number(e.target.value))} className="w-16 sm:w-20 px-1.5 py-1 text-xs border border-zinc-300 rounded-lg text-center font-mono focus:ring-1 focus:ring-[#0a192f] focus:border-[#0a192f] outline-none" />
                                    ) : (
                                      <span className="font-mono text-[11px] text-zinc-900 font-bold">{record.dbtAmount.toLocaleString()}</span>
                                    )}
                                  </td>

                                  <td className="px-3 py-2 text-center">
                                    {record.status === 'PENDING_CLIENT' && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>}
                                    {record.status === 'SUBMITTED' && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Submitted</span>}
                                    {record.status === 'REVIEWED' && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Reviewed</span>}
                                    {record.status === 'COMPLETED' && <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>}
                                  </td>
                                  
                                  <td className="px-3 py-2 text-center">
                                    {isClientPending && <span className="text-[9px] text-zinc-400 italic">Awaiting Client</span>}
                                    {isSubmitted && (
                                      <button onClick={() => handleAdminSaveAttRow(record)} disabled={adminAttSaving} className="px-2.5 py-1 bg-black text-white rounded-lg text-[10px] font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer">
                                        Review
                                      </button>
                                    )}
                                    {(record.status === 'REVIEWED' || record.status === 'COMPLETED') && !editingAdminAttRows[record.id] && (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <button
                                          type="button"
                                          onClick={() => setEditingAdminAttRows(prev => ({
                                            ...prev,
                                            [record.id]: {
                                              stipendPayable: record.stipendPayable,
                                              establishmentContribution: record.establishmentContribution,
                                              dbtAmount: record.dbtAmount
                                            }
                                          }))}
                                          className="text-[10px] font-bold text-zinc-600 hover:text-black underline cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    )}
                                    {editingAdminAttRows[record.id] && record.status !== 'SUBMITTED' && (
                                      <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => handleAdminSaveAttRow(record)} disabled={adminAttSaving} className="px-2 py-0.5 bg-[#0a192f] text-white rounded text-[10px] font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer">
                                          Save
                                        </button>
                                        <button onClick={() => setEditingAdminAttRows(prev => { const cp = {...prev}; delete cp[record.id]; return cp; })} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] hover:bg-zinc-200 transition-colors cursor-pointer">
                                          ✕
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              </div>
            </div>

            {/* Fullscreen Bottom Status Bar */}
            <div className="px-6 sm:px-10 py-3 border-t border-zinc-200 bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-400 font-mono">* Press ESC or click &quot;Back to Dashboard&quot; to exit fullscreen view</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

          </motion.div>
      </AnimatePresence>

      {/* NAPS Record Add/Edit Modal */}
      <AnimatePresence>
        {showNapsModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-6 border border-zinc-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0a192f] text-amber-300 font-serif flex items-center justify-center font-bold text-xs">
                    C
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 uppercase font-mono">
                      {editingNapsRecord ? 'Edit DBT & NAPS Record' : 'Add DBT & NAPS Portal Record'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Client: {submission.company_name || submission.client_name}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowNapsModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNapsForm} className="space-y-3.5 text-xs">
                {/* CN / AP Number Lookup & Candidate Auto-fill Configuration */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold text-xs font-mono">
                        #
                      </div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-zinc-900 uppercase font-mono tracking-tight">
                          Configure by CN Number or AP Code
                        </h4>
                        <p className="text-[10px] text-zinc-600 font-mono">
                          Input CN or AP code to instantly match and auto-prefill candidate profile, stipend, and contact details
                        </p>
                      </div>
                    </div>
                    {candidateList.length > 0 && (
                      <span className="text-[10px] text-zinc-500 font-mono bg-white/70 px-2 py-0.5 rounded-md border border-amber-200">
                        {candidateList.length} candidate(s) onboarded
                      </span>
                    )}
                  </div>

                  {/* Dropdown Selector by CN / AP Number */}
                  {candidateList.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 mb-1">
                        Select by CN / AP Number:
                      </label>
                      <select
                        value={
                          candidateList.find(c => 
                            (napsForm.candidateId && c.id === napsForm.candidateId) ||
                            (napsForm.contractCode && c.contractCode && c.contractCode.toLowerCase() === napsForm.contractCode.toLowerCase()) ||
                            (napsForm.apprenticeCode && c.apprenticeCode && c.apprenticeCode.toLowerCase() === napsForm.apprenticeCode.toLowerCase())
                          )?.id || ''
                        }
                        onChange={(e) => {
                          const selId = e.target.value;
                          const matched = candidateList.find(c => c.id === selId);
                          if (matched) {
                            applyCandidateToNapsForm(matched);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-zinc-900 font-medium text-xs focus:outline-none focus:border-amber-600 cursor-pointer"
                      >
                        <option value="">-- Choose Onboarded Candidate by CN / AP --</option>
                        {candidateList.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.contractCode ? `CN: ${c.contractCode}` : '[Pending CN]'} | {c.apprenticeCode ? `AP: ${c.apprenticeCode}` : '[Pending AP]'} — {c.name} ({c.tradeOrRole})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Direct CN and AP inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-800 mb-1">
                        CN Number (Contract Code) *
                      </label>
                      <input
                        type="text"
                        required
                        value={napsForm.contractCode || ''}
                        onChange={(e) => handleCnCodeInputChange(e.target.value)}
                        placeholder="e.g. CN072687468"
                        className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-amber-400/60 text-zinc-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-800 mb-1">
                        AP Code (Apprentice Code) *
                      </label>
                      <input
                        type="text"
                        required
                        value={napsForm.apprenticeCode || ''}
                        onChange={(e) => handleApCodeInputChange(e.target.value)}
                        placeholder="e.g. A012691340"
                        className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-amber-400/60 text-zinc-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  {/* Auto-match status indicator */}
                  {(() => {
                    const matchedCandidate = candidateList.find(c =>
                      (napsForm.candidateId && c.id === napsForm.candidateId) ||
                      (napsForm.contractCode && c.contractCode && c.contractCode.trim().toLowerCase() === napsForm.contractCode.trim().toLowerCase()) ||
                      (napsForm.apprenticeCode && c.apprenticeCode && c.apprenticeCode.trim().toLowerCase() === napsForm.apprenticeCode.trim().toLowerCase())
                    );

                    if (matchedCandidate) {
                      return (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="font-mono text-[11px] leading-tight">
                            <span className="font-bold text-emerald-800">Matched Candidate: </span>
                            <span className="font-extrabold">{matchedCandidate.name}</span>
                            {matchedCandidate.tradeOrRole ? ` (${matchedCandidate.tradeOrRole})` : ''}
                            {matchedCandidate.stipendAmount ? ` | Stipend: ₹${matchedCandidate.stipendAmount}` : ''}
                            <span className="text-emerald-700 ml-1">— All candidate details auto-prefilled below</span>
                          </div>
                        </div>
                      );
                    } else if (napsForm.contractCode || napsForm.apprenticeCode) {
                      return (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-mono text-[10px]">
                          <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>No onboarded candidate found matching this CN / AP number. You can fill details manually below.</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Row 1: Document Receive Date, Establishment Code, Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Document Receive Date</label>
                    <input
                      type="date"
                      value={napsForm.documentReceiveDate || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, documentReceiveDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Establishment Code *</label>
                    <input
                      type="text"
                      required
                      value={napsForm.establishmentCode}
                      onChange={(e) => setNapsForm({ ...napsForm, establishmentCode: e.target.value })}
                      placeholder="e.g. E12253600040"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-none focus:border-black font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={napsForm.location || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, location: e.target.value })}
                      placeholder="e.g. Bangalore, Karnataka"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Row 2: Candidate Aadhar Name, DOB, Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Candidate Aadhar Name *</label>
                      {napsForm.candidateName && (
                        <span className="text-[9px] text-emerald-700 font-mono font-semibold">Prefilled</span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={napsForm.candidateAadhaarName || napsForm.candidateName || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, candidateAadhaarName: e.target.value, candidateName: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">DOB</label>
                    <input
                      type="date"
                      value={napsForm.dob || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, dob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Gender</label>
                    <select
                      value={napsForm.gender || 'Male'}
                      onChange={(e) => setNapsForm({ ...napsForm, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Mobile Number, Email ID, Stipend */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={napsForm.mobileNumber || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, mobileNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Email ID</label>
                    <input
                      type="email"
                      value={napsForm.emailId || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, emailId: e.target.value })}
                      placeholder="candidate@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Stipend (₹) *</label>
                      {Boolean(napsForm.stipend && napsForm.stipend > 0) && (
                        <span className="text-[9px] text-emerald-700 font-mono font-semibold">Prefilled</span>
                      )}
                    </div>
                    <input
                      type="number"
                      required
                      min={0}
                      value={napsForm.stipend || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, stipend: Number(e.target.value) })}
                      placeholder="18500"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono font-bold text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Row 4: Qualification, Curriculum, Beneficiary ID */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={napsForm.qualification || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, qualification: e.target.value })}
                      placeholder="e.g. B.Tech / Diploma / Graduate"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Curriculum</label>
                    <input
                      type="text"
                      value={napsForm.curriculum || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, curriculum: e.target.value })}
                      placeholder="e.g. Mechanical / Retail Associate"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Beneficiary ID</label>
                    <input
                      type="text"
                      value={napsForm.beneficiaryId || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, beneficiaryId: e.target.value })}
                      placeholder="e.g. *********7799"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Row 5: Contract Start Date, Contract End Date, DBT Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Contract Start Date</label>
                    <input
                      type="date"
                      value={napsForm.contractStartDate || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, contractStartDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Contract End Date</label>
                    <input
                      type="date"
                      value={napsForm.contractEndDate || ''}
                      onChange={(e) => setNapsForm({ ...napsForm, contractEndDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">DBT Status *</label>
                    <select
                      value={napsForm.dbtStatus || 'UNPAID'}
                      onChange={(e) => {
                        const val = e.target.value as 'PAID' | 'UNPAID' | 'FAIL';
                        setNapsForm({ 
                          ...napsForm, 
                          dbtStatus: val,
                          paymentStatus: val === 'PAID' ? 'PAID' : val === 'FAIL' ? 'FAILED' : 'PENDING'
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold text-xs focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="PAID">PAID</option>
                      <option value="UNPAID">UNPAID</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                  </div>
                </div>

                {/* Row 6: Remarks */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={napsForm.remarks || ''}
                    onChange={(e) => setNapsForm({ ...napsForm, remarks: e.target.value })}
                    placeholder="e.g. Verified by State DGT"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                {/* Additional Government Ledger Fields (Month/Year & DBT Amount) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Payout Month & Year *</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={(napsForm.payoutMonth || '').split('-')[0] || 'AUG'}
                        onChange={(e) => {
                          const yr = (napsForm.payoutMonth || '').split('-')[1] || new Date().getFullYear().toString();
                          setNapsForm({ ...napsForm, payoutMonth: `${e.target.value}-${yr}` });
                        }}
                        className="px-2 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono font-bold text-xs focus:outline-none focus:border-black cursor-pointer"
                      >
                        {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={(napsForm.payoutMonth || '').split('-')[1] || new Date().getFullYear().toString()}
                        onChange={(e) => {
                          const mo = (napsForm.payoutMonth || '').split('-')[0] || 'AUG';
                          setNapsForm({ ...napsForm, payoutMonth: `${mo}-${e.target.value}` });
                        }}
                        className="px-2 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono font-bold text-xs focus:outline-none focus:border-black cursor-pointer"
                      >
                        {['2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Govt DBT Share Claim Amount (₹)</label>
                    <input
                      type="number"
                      step={100}
                      value={napsForm.amount === 0 ? '' : napsForm.amount}
                      onChange={(e) => setNapsForm({ ...napsForm, amount: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-mono font-bold text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNapsModal(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#0a192f] text-white hover:bg-zinc-800 text-xs font-bold cursor-pointer transition-all shadow-sm"
                  >
                    {editingNapsRecord ? 'Save Record Changes' : 'Add to Client DBT Registry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Admin Edit Stipend DBT & Remarks */}
      <AnimatePresence>
        {editingStipendRecord && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden"
            >
              <div className="bg-[#0a192f] text-white p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Update DBT Approval: {editingStipendRecord.month} {editingStipendRecord.year}
                  </h4>
                  <p className="text-[11px] text-zinc-300">
                    Employer Paid: ₹{editingStipendRecord.stipendPaidByEmployer?.toLocaleString('en-IN')} on {editingStipendRecord.datePaid}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStipendRecord(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveStipendAdmin} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Govt. DBT Approved Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={stipendAdminForm.dbtByGovt === 0 ? '' : stipendAdminForm.dbtByGovt}
                    onChange={(e) => setStipendAdminForm({ ...stipendAdminForm, dbtByGovt: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="Enter approved DBT amount"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold font-mono text-sm focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">DBT Release Date / PFMS Status *</label>
                  <input
                    type="text"
                    value={stipendAdminForm.dbtReleaseDate}
                    onChange={(e) => setStipendAdminForm({ ...stipendAdminForm, dbtReleaseDate: e.target.value })}
                    placeholder="e.g. UNDER PROCESS or 18-07-2026"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-semibold focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Status Badge *</label>
                  <select
                    value={stipendAdminForm.status}
                    onChange={(e) => setStipendAdminForm({ ...stipendAdminForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 font-bold focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="SUBMITTED">SUBMITTED (Pending NAPS Verification)</option>
                    <option value="UNDER PROCESS">UNDER PROCESS (Claim filed with Govt)</option>
                    <option value="DBT RELEASED">DBT RELEASED (Disbursed via PFMS)</option>
                    <option value="PENDING">PENDING (Action required)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Admin Remarks / Audit Notes</label>
                  <textarea
                    rows={2}
                    value={stipendAdminForm.remarks}
                    onChange={(e) => setStipendAdminForm({ ...stipendAdminForm, remarks: e.target.value })}
                    placeholder="e.g. DBT credited to 7 candidates via PFMS batch 2026-07-18"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStipendRecord(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStipendAdmin}
                    className="px-5 py-2 rounded-xl bg-[#0a192f] hover:bg-[#102a4c] text-white font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    {savingStipendAdmin ? 'Saving...' : 'Save & Publish to Client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Admin Add Stipend Month */}
      <AnimatePresence>
        {showAdminAddStipend && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden"
            >
              <div className="bg-[#0a192f] text-white p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Record Monthly Stipend Disbursement</h4>
                  <p className="text-[11px] text-zinc-300">Admin entry on behalf of client</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdminAddStipend(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleAdminCreateStipend} className="p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Month *</label>
                    <input
                      type="text"
                      value={adminNewStipend.month}
                      onChange={(e) => setAdminNewStipend({ ...adminNewStipend, month: e.target.value.toUpperCase() })}
                      placeholder="e.g. JUNE"
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold focus:outline-none focus:border-black uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Year *</label>
                    <input
                      type="text"
                      value={adminNewStipend.year}
                      onChange={(e) => setAdminNewStipend({ ...adminNewStipend, year: e.target.value })}
                      placeholder="2026"
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono font-bold focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Stipend Paid by Employer (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={adminNewStipend.stipendPaidByEmployer}
                    onChange={(e) => setAdminNewStipend({ ...adminNewStipend, stipendPaidByEmployer: Number(e.target.value) })}
                    placeholder="e.g. 94634"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold font-mono focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Date Paid *</label>
                  <input
                    type="text"
                    value={adminNewStipend.datePaid}
                    onChange={(e) => setAdminNewStipend({ ...adminNewStipend, datePaid: e.target.value })}
                    placeholder="10-07-2026"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">DBT by Govt. (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={adminNewStipend.dbtByGovt === 0 ? '' : adminNewStipend.dbtByGovt}
                      onChange={(e) => setAdminNewStipend({ ...adminNewStipend, dbtByGovt: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold font-mono focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Release Date</label>
                    <input
                      type="text"
                      value={adminNewStipend.dbtReleaseDate}
                      onChange={(e) => setAdminNewStipend({ ...adminNewStipend, dbtReleaseDate: e.target.value })}
                      placeholder="UNDER PROCESS"
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Status</label>
                  <select
                    value={adminNewStipend.status}
                    onChange={(e) => setAdminNewStipend({ ...adminNewStipend, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold focus:outline-none focus:border-black"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER PROCESS">UNDER PROCESS</option>
                    <option value="DBT RELEASED">DBT RELEASED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={adminNewStipend.remarks}
                    onChange={(e) => setAdminNewStipend({ ...adminNewStipend, remarks: e.target.value })}
                    placeholder="Admin remarks"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminAddStipend(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#0a192f] hover:bg-[#102a4c] text-white font-bold cursor-pointer transition-all"
                  >
                    Create Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Facilitation Invoice Add Modal (Company Admin) */}
      <AnimatePresence>
        {showAddInvoiceModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 border border-zinc-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0a192f] text-amber-300 font-serif flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 uppercase font-mono">
                      Add Facilitation Invoice
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">Company / TPA Billing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="p-1 text-zinc-400 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddInvoiceSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    value={newInvoiceForm.invoiceNo}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceNo: e.target.value })}
                    placeholder="e.g. INV-2026-001"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold font-mono focus:outline-none focus:border-black"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Invoice Date *</label>
                    <input
                      type="date"
                      value={newInvoiceForm.invoiceDate}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, invoiceDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      value={newInvoiceForm.amount}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount: Number(e.target.value) })}
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold font-mono focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Status *</label>
                    <select
                      value={newInvoiceForm.status}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, status: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-bold focus:outline-none focus:border-black"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Payment Date</label>
                    <input
                      type="text"
                      value={newInvoiceForm.paymentDate}
                      onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, paymentDate: e.target.value })}
                      placeholder="e.g. 15-08-2026 or -"
                      className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 font-mono focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Remarks (Optional)</label>
                  <input
                    type="text"
                    value={newInvoiceForm.remarks}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, remarks: e.target.value })}
                    placeholder="e.g. Monthly NAPS Compliance Retainer"
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddInvoiceModal(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={invoiceSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-[#0a192f] hover:bg-[#102a4c] text-white font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    {invoiceSubmitting ? 'Adding...' : 'Generate Invoice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Document Viewer Modal */}
      <DocumentViewerModal
        document={previewingDoc}
        onClose={() => setPreviewingDoc(null)}
      />
    </>
  );
};
