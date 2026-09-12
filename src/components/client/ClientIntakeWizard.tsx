'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { IntakeFormData } from '@/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Users, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  FileText, 
  UploadCloud, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Trash2, 
  FileSignature, 
  Building, 
  Check, 
  ArrowUpRight,
  Search,
  X,
  Briefcase,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processUploadedFile } from '@/lib/document-utils';

const INITIAL_FORM_STATE: IntakeFormData = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  industry: 'Technology & Digital Services',
  requiredApprenticeCount: 15,
  tradesRequired: [],
  contractTemplateType: 'Standard National Apprenticeship Contract v3',
  complianceOfficerName: '',
  complianceOfficerEmail: '',
  hasPreviousCNIssues: false,
  cnIssueNotes: '',
  attachedDocsName: '',
  specialInstructions: '',
  enrollmentScheme: 'NAPS',
  agreedToTerms: true
};

export const ClientIntakeWizard: React.FC = () => {
  const { user, getActiveClientSubmission, saveSubmissionStep, recordAbandonment, requiredDocuments } = useStore();
  const [currentSection, setCurrentSection] = useState<number>(1);
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Anti-glitch and race-condition refs
  const isInitializedRef = React.useRef(false);
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; sectionNumber: number; sectionName: string }[]>([]);

  // Initialize from active submission or current user ONCE on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    const existing = getActiveClientSubmission();
    if (existing) {
      isInitializedRef.current = true;
      if (existing.status === 'submitted' || existing.status === 'approved' || existing.status === 'under_review') {
        setIsSubmitted(true);
      }
      setCurrentSection(existing.current_step && existing.current_step <= 2 ? existing.current_step : 1);
      setFormData(prev => ({
        ...prev,
        ...existing.responses,
        companyName: existing.responses?.companyName || existing.company_name || user?.company_name || '',
        contactName: existing.responses?.contactName || existing.client_name || user?.full_name || '',
        contactEmail: existing.responses?.contactEmail || existing.client_email || user?.email || '',
        contactPhone: existing.responses?.contactPhone || user?.phone || ''
      }));
      if (existing.responses?.attachedDocsName) {
        setActiveFile(existing.responses.attachedDocsName);
      }
    } else if (user) {
      isInitializedRef.current = true;
      setFormData(prev => ({
        ...prev,
        companyName: user.company_name || '',
        contactName: user.full_name || '',
        contactEmail: user.email || '',
        contactPhone: user.phone || ''
      }));
    }
  }, [user, getActiveClientSubmission]);

  // Record abandonment on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isSubmitted && currentSection < 2) {
        recordAbandonment(currentSection, formData);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSection, formData, isSubmitted, recordAbandonment]);

  // Smooth, glitch-free debounced field update
  const updateField = (field: keyof IntakeFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      
      setIsSaving(true);
      saveTimerRef.current = setTimeout(() => {
        saveSubmissionStep(updated, currentSection, false);
        setIsSaving(false);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }, 700);

      return updated;
    });

    // Clear validation error when user fills the field
    setValidationErrors(prev => prev.filter(e => e.field.toLowerCase() !== (field as string).toLowerCase()));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActiveFile(file.name);
      updateField('attachedDocsName', file.name);
    }
  };

  // Validate Mandatory Fields across the 2 sections
  const validateMandatoryFields = (data: IntakeFormData, maxSectionToCheck?: number) => {
    const errors: { field: string; sectionNumber: number; sectionName: string }[] = [];

    // Section 1 Mandatory Fields: Requirements & Quota
    if (!data.companyName?.trim()) {
      errors.push({ field: 'Company Legal Name', sectionNumber: 1, sectionName: 'Requirements & Quota' });
    }
    if (!data.contactName?.trim()) {
      errors.push({ field: 'Contact Person Full Name', sectionNumber: 1, sectionName: 'Requirements & Quota' });
    }
    if (!data.contactEmail?.trim()) {
      errors.push({ field: 'Work Email Address', sectionNumber: 1, sectionName: 'Requirements & Quota' });
    }
    if (!data.contactPhone?.trim()) {
      errors.push({ field: 'Direct Contact Phone', sectionNumber: 1, sectionName: 'Requirements & Quota' });
    }
    if (!data.requiredApprenticeCount || Number(data.requiredApprenticeCount) < 1) {
      errors.push({ field: 'Total Apprentice Quota Required', sectionNumber: 1, sectionName: 'Requirements & Quota' });
    }

    // Section 2 Mandatory Fields: Document Verification & Submit
    if (!maxSectionToCheck || maxSectionToCheck >= 2) {
      if (!data.gstinNumber?.trim()) {
        errors.push({ field: 'Company GSTIN Number', sectionNumber: 2, sectionName: 'Verification & Submit' });
      }

      const isNats = data.enrollmentScheme === 'NATS';

      if (isNats) {
        // NATS Mandatory Documents:
        // 1. PAN Card
        const panUploaded = data.companyDocs?.panDoc || data.companyDocs?.panFileName || data.companyDocs?.dynamicDocs?.['pan'];
        if (!panUploaded) errors.push({ field: 'PAN Card (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 2. TAN
        const tanUploaded = data.companyDocs?.tanDoc || data.companyDocs?.tanFileName || data.companyDocs?.dynamicDocs?.['tan'];
        if (!tanUploaded) errors.push({ field: 'TAN Document / Details (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 3. GST Certificate
        const gstUploaded = data.companyDocs?.gstDoc || data.companyDocs?.gstFileName || data.companyDocs?.dynamicDocs?.['gst'];
        if (!gstUploaded) errors.push({ field: 'GST Certificate (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 4. ITR Acknowledgement
        const itrUploaded = data.companyDocs?.itrDoc || data.companyDocs?.itrFileName || data.companyDocs?.dynamicDocs?.['itr'];
        if (!itrUploaded) errors.push({ field: 'ITR Acknowledgement (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 5. Incorporation / Registration Certificate
        const coiUploaded = data.companyDocs?.coiDoc || data.companyDocs?.coiFileName || data.companyDocs?.dynamicDocs?.['coi'];
        if (!coiUploaded) errors.push({ field: 'Incorporation / Registration Certificate (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 6. EPFO / ESIC Registration (if applicable)
        const epfoUploaded = data.companyDocs?.epfoEsicDoc || data.companyDocs?.epfoEsicFileName || data.companyDocs?.dynamicDocs?.['epfo_esic'] || data.companyDocs?.epfoRegistrationCode;
        if (!epfoUploaded) errors.push({ field: 'EPFO / ESIC Registration (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 7. Cancelled Cheque
        const chequeUploaded = data.companyDocs?.chequeDoc || data.companyDocs?.cancelledChequeFileName || data.companyDocs?.dynamicDocs?.['cheque'];
        if (!chequeUploaded) errors.push({ field: 'Cancelled Cheque (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 8. Structured Training Module (Document + Details)
        const trainingUploaded = data.companyDocs?.trainingModuleDoc || data.companyDocs?.trainingModuleFileName || data.companyDocs?.dynamicDocs?.['training_module'];
        if (!trainingUploaded) errors.push({ field: 'Structured Training Module Document (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        if (!data.structuredTrainingModule?.learningObjectives?.trim()) {
          errors.push({ field: 'Structured Module: What Apprentice Will Learn', sectionNumber: 2, sectionName: 'Verification & Submit' });
        }
        if (!data.structuredTrainingModule?.trainingDuration?.trim()) {
          errors.push({ field: 'Structured Module: Duration of Training', sectionNumber: 2, sectionName: 'Verification & Submit' });
        }
        if (!data.structuredTrainingModule?.departmentWiseExposure?.trim()) {
          errors.push({ field: 'Structured Module: Department-wise Exposure', sectionNumber: 2, sectionName: 'Verification & Submit' });
        }
        if (!data.structuredTrainingModule?.skillsToBeDeveloped?.trim()) {
          errors.push({ field: 'Structured Module: Skills to be Developed', sectionNumber: 2, sectionName: 'Verification & Submit' });
        }
        if (!data.structuredTrainingModule?.monthlyTrainingBreakup?.trim()) {
          errors.push({ field: 'Structured Module: Monthly Training Breakup', sectionNumber: 2, sectionName: 'Verification & Submit' });
        }
        if (!data.structuredTrainingModule?.supervisorOrOfficerDetails?.trim()) {
          errors.push({ field: 'Structured Module: Supervisor / Training Officer Details', sectionNumber: 2, sectionName: 'Verification & Submit' });
        }
      } else {
        // NAPS Mandatory Documents:
        // 1. PAN
        const panUploaded = data.companyDocs?.panDoc || data.companyDocs?.panFileName || data.companyDocs?.dynamicDocs?.['pan'];
        if (!panUploaded) errors.push({ field: 'PAN Card (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 2. GST Registration
        const gstUploaded = data.companyDocs?.gstDoc || data.companyDocs?.gstFileName || data.companyDocs?.dynamicDocs?.['gst'];
        if (!gstUploaded) errors.push({ field: 'GST Registration (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 3. Cancelled Cheque
        const chequeUploaded = data.companyDocs?.chequeDoc || data.companyDocs?.cancelledChequeFileName || data.companyDocs?.dynamicDocs?.['cheque'];
        if (!chequeUploaded) errors.push({ field: 'Cancelled Cheque (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });

        // 4. Signature & Seal of Authorized Signatory
        const signatoryUploaded = data.companyDocs?.signatoryDoc || data.companyDocs?.signatoryLetterFileName || data.companyDocs?.dynamicDocs?.['signatory'];
        if (!signatoryUploaded) errors.push({ field: 'Signature & Seal of Authorized Signatory (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Verification & Submit' });
      }

      if (!data.agreedToTerms) {
        errors.push({ field: 'Acceptance of Regulatory Declarations & Terms', sectionNumber: 2, sectionName: 'Verification & Submit' });
      }
    }

    return errors;
  };

  const handleNextSection = async () => {
    const currentSectionErrors = validateMandatoryFields(formData, currentSection).filter(e => e.sectionNumber === currentSection);
    if (currentSectionErrors.length > 0) {
      setValidationErrors(currentSectionErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    if (currentSection < 2) {
      const next = currentSection + 1;
      setCurrentSection(next);
      await saveSubmissionStep(formData, next, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    setValidationErrors([]);
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateMandatoryFields(formData, 2);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setCurrentSection(errors[0].sectionNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    await saveSubmissionStep(formData, 2, true);
    setIsSaving(false);
    setIsSubmitted(true);
  };

  const sections = [
    { number: 1, title: 'Requirements & Quota', desc: 'Company details & headcount' },
    { number: 2, title: 'Verification & Submit', desc: 'Compliance documents & GSTIN' }
  ];

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 font-sans text-zinc-900">
        <GlassCard className="p-10 text-center bg-white border-zinc-200 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-black text-white flex items-center justify-center shadow-lg">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
            APPLICATION LOGGED IN REGISTRY
          </span>

          <h2 className="text-3xl font-extrabold text-zinc-900 mt-4 mb-2">
            Intake Request Submitted
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto text-xs leading-relaxed mb-8 font-medium">
            Candidate requirements for <strong>{formData.companyName || 'your organization'}</strong> ({formData.requiredApprenticeCount} apprentices) have been registered into the administration console.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8 text-left text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Company / Org</span>
              <div className="font-extrabold text-zinc-900 text-base mt-0.5 truncate">{formData.companyName || 'Registered Client'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Quota Requested</span>
              <div className="font-extrabold text-zinc-900 text-base mt-0.5">{formData.requiredApprenticeCount} Candidates</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">DBT Govt Subsidy</span>
              <div className="font-extrabold text-emerald-700 text-base mt-0.5">{formData.dbtSchemeOptIn ? 'Active (₹4,500/mo)' : 'Standard'}</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setIsSubmitted(false); setCurrentSection(1); }}
              className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs font-bold cursor-pointer transition-all"
            >
              Modify Details
            </button>
            <a
              href="/client"
              className="px-6 py-2.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
            >
              <span>View Analytics Dashboard</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 font-sans text-zinc-900">
      
      {/* Top Header & Save Status */}
      <div className="flex items-center justify-between gap-4 mb-6 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base leading-none">✦</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
              Client Onboarding Form
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
            Client Onboarding & Quota Registration
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 font-mono font-semibold">
          <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isSaving ? 'Saving...' : 'Saved'}</span>
        </div>
      </div>

      {/* Section Progress Bar */}
      <div className="mb-6 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {sections.map((sec) => {
            const isCompleted = currentSection > sec.number;
            const isCurrent = currentSection === sec.number;

            return (
              <button
                key={sec.number}
                type="button"
                onClick={() => setCurrentSection(sec.number)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-black text-white border-black shadow-md'
                    : isCompleted
                    ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                    : 'bg-zinc-50 text-zinc-400 border-zinc-200 opacity-60'
                }`}
              >
                <div className="text-[10px] font-mono uppercase mb-0.5 flex items-center justify-between font-bold">
                  <span>0{sec.number}</span>
                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="text-xs font-bold truncate">{sec.title}</div>
              </button>
            );
          })}
        </div>

        <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-black rounded-full"
            initial={{ width: '50%' }}
            animate={{ width: `${(currentSection / 2) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>

      {/* Mandatory Field Notice */}
      <div className="mb-3 px-4 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-bold text-sm leading-none">*</span>
          <span>Fields marked with an asterisk (<strong>*</strong>) are mandatory and must be completed to submit.</span>
        </div>
      </div>

      {/* Validation Errors Alert Banner */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Please complete all mandatory fields (*) before proceeding:</span>
          </div>
          <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-rose-700">
            {validationErrors.map((err, idx) => (
              <li key={idx}><strong>{err.field}</strong> in <em>{err.sectionName}</em></li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Form Card */}
      <GlassCard className="p-8 bg-white border-zinc-200 shadow-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* SECTION 1: Requirements & Quota */}
            {currentSection === 1 && (
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 01: REQUIREMENTS & QUOTA SCOPE
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Select your regulatory apprenticeship scheme, define organization details, and specify apprentice quota.
                  </p>
                </div>

                {/* Scheme Selector: NAPS vs NATS */}
                <div className="p-4 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-900">
                      Apprenticeship Scheme Enrollment *
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Determines required corporate verification documents
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateField('enrollmentScheme', 'NAPS')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        (formData.enrollmentScheme || 'NAPS') === 'NAPS'
                          ? 'border-black bg-white shadow-sm ring-2 ring-black/5'
                          : 'border-zinc-200 bg-zinc-100/60 hover:bg-white text-zinc-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-zinc-900 font-mono">NAPS Scheme</span>
                        {(formData.enrollmentScheme || 'NAPS') === 'NAPS' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-600 font-medium leading-snug">
                        National Apprenticeship Promotion Scheme (MSDE). Direct DBT govt subsidy transfer for candidates.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateField('enrollmentScheme', 'NATS')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        formData.enrollmentScheme === 'NATS'
                          ? 'border-black bg-white shadow-sm ring-2 ring-black/5'
                          : 'border-zinc-200 bg-zinc-100/60 hover:bg-white text-zinc-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-zinc-900 font-mono">NATS Scheme</span>
                        {formData.enrollmentScheme === 'NATS' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-600 font-medium leading-snug">
                        National Apprenticeship Training Scheme (MoE / AICTE). Structured training modules for graduates & diploma holders.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name Field */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Organization / Company Name / Legal Entity Name *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="e.g. Acme Innovations Pvt Ltd / Legal Entity"
                        className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Primary Contact Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Contact Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => updateField('contactEmail', e.target.value)}
                      placeholder="alex@portal.com"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contactPhone}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Total Apprentice Quota Required *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={formData.requiredApprenticeCount ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0;
                        updateField('requiredApprenticeCount', val);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black focus:bg-white font-bold"
                    />
                  </div>

                  {/* Operational States Field */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-zinc-700">
                        Operational States *
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">States where your organization operates</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.operationalStates || ''}
                      onChange={(e) => updateField('operationalStates', e.target.value)}
                      placeholder="e.g. Karnataka, Maharashtra, Tamil Nadu, Delhi NCR"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Document Verification & Submit */}
            {currentSection === 2 && (
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 02: MANDATORY COMPLIANCE DOCUMENTS & SUBMIT
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Upload official corporate compliance files to establish legal apprenticeship quota and enable portal verification.
                  </p>
                </div>

                {/* Company Tax & Registration Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Company GSTIN Number *
                    </label>
                    <input
                      type="text"
                      value={formData.gstinNumber || ''}
                      onChange={(e) => updateField('gstinNumber', e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAACN0123M1Z5"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-mono uppercase focus:outline-none focus:border-black focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      EPFO / ESIC Establishment Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.companyDocs?.epfoRegistrationCode || ''}
                      onChange={(e) => updateField('companyDocs', { ...(formData.companyDocs || {}), epfoRegistrationCode: e.target.value })}
                      placeholder="e.g. MH/BAN/0012345/000"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-mono focus:outline-none focus:border-black focus:bg-white"
                    />
                  </div>
                </div>

                {/* Structured Document Slots based on Scheme */}
                {(() => {
                  const isNats = formData.enrollmentScheme === 'NATS';

                  const natsDocsConfig = [
                    { id: 'pan', name: 'PAN Card', category: 'PAN', desc: 'Permanent Account Number card for company registration', allowed: ['.pdf', '.jpg', '.jpeg', '.png'], file: formData.companyDocs?.panDoc?.name || formData.companyDocs?.panFileName || formData.companyDocs?.dynamicDocs?.['pan']?.name },
                    { id: 'tan', name: 'TAN Card / Number Proof', category: 'TAN', desc: 'Tax Deduction and Collection Account Number proof', allowed: ['.pdf', '.jpg', '.jpeg', '.png'], file: formData.companyDocs?.tanDoc?.name || formData.companyDocs?.tanFileName || formData.companyDocs?.dynamicDocs?.['tan']?.name },
                    { id: 'gst', name: 'GST Certificate', category: 'GST', desc: 'Official Goods and Services Tax registration certificate', allowed: ['.pdf', '.jpg', '.jpeg', '.png'], file: formData.companyDocs?.gstDoc?.name || formData.companyDocs?.gstFileName || formData.companyDocs?.dynamicDocs?.['gst']?.name },
                    { id: 'itr', name: 'ITR Acknowledgement', category: 'ITR', desc: 'Income Tax Return acknowledgement filing for previous assessment year', allowed: ['.pdf'], file: formData.companyDocs?.itrDoc?.name || formData.companyDocs?.itrFileName || formData.companyDocs?.dynamicDocs?.['itr']?.name },
                    { id: 'coi', name: 'Incorporation / Registration Certificate', category: 'COI', desc: 'Certificate of Incorporation (MCA) or formal firm registration certificate', allowed: ['.pdf', '.jpg', '.png'], file: formData.companyDocs?.coiDoc?.name || formData.companyDocs?.coiFileName || formData.companyDocs?.dynamicDocs?.['coi']?.name },
                    { id: 'epfo_esic', name: 'EPFO / ESIC Registration', category: 'EPFO', desc: 'EPFO or ESIC establishment registration code certificate (if applicable)', allowed: ['.pdf', '.jpg', '.png'], file: formData.companyDocs?.epfoEsicDoc?.name || formData.companyDocs?.epfoEsicFileName || formData.companyDocs?.dynamicDocs?.['epfo_esic']?.name },
                    { id: 'cheque', name: 'Cancelled Cheque', category: 'Cheque', desc: 'Corporate bank account cancelled cheque copy for direct stipend/reimbursement transfer', allowed: ['.pdf', '.jpg', '.png'], file: formData.companyDocs?.chequeDoc?.name || formData.companyDocs?.cancelledChequeFileName || formData.companyDocs?.dynamicDocs?.['cheque']?.name },
                    { id: 'training_module', name: 'Structured Training Module Document', category: 'Training Module', desc: 'Official apprenticeship curriculum syllabus and departmental training plan document', allowed: ['.pdf', '.docx', '.doc'], file: formData.companyDocs?.trainingModuleDoc?.name || formData.companyDocs?.trainingModuleFileName || formData.companyDocs?.dynamicDocs?.['training_module']?.name }
                  ];

                  const napsDocsConfig = [
                    { id: 'pan', name: 'PAN Card', category: 'PAN', desc: 'Entity PAN Card issued by the Income Tax Department', allowed: ['.pdf', '.jpg', '.jpeg', '.png'], file: formData.companyDocs?.panDoc?.name || formData.companyDocs?.panFileName || formData.companyDocs?.dynamicDocs?.['pan']?.name },
                    { id: 'gst', name: 'GST Registration', category: 'GST', desc: 'Official Goods and Services Tax registration certificate (Form GST REG-06)', allowed: ['.pdf', '.jpg', '.jpeg', '.png'], file: formData.companyDocs?.gstDoc?.name || formData.companyDocs?.gstFileName || formData.companyDocs?.dynamicDocs?.['gst']?.name },
                    { id: 'cheque', name: 'Cancelled Cheque', category: 'Cheque', desc: 'Bank passbook copy or cancelled cheque for DBT subsidy reimbursements and stipend reconciliation', allowed: ['.pdf', '.jpg', '.jpeg', '.png'], file: formData.companyDocs?.chequeDoc?.name || formData.companyDocs?.cancelledChequeFileName || formData.companyDocs?.dynamicDocs?.['cheque']?.name },
                    { id: 'signatory', name: 'Signature & Seal of Authorized Signatory', category: 'Signatory Letter', desc: 'Authorized signatory identification document with official entity rubber stamp/seal', allowed: ['.pdf', '.jpg', '.jpeg', '.png'], file: formData.companyDocs?.signatoryDoc?.name || formData.companyDocs?.signatoryLetterFileName || formData.companyDocs?.dynamicDocs?.['signatory']?.name }
                  ];

                  const activeDocs = isNats ? natsDocsConfig : napsDocsConfig;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-zinc-900">
                          {isNats ? 'NATS Corporate Establishment Documents (8 Requirements)' : 'NAPS Establishment Compliance Documents (4 Requirements)'}
                        </label>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          {formData.enrollmentScheme || 'NAPS'} Mode
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeDocs.map((docItem) => (
                          <div key={docItem.id} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 hover:border-zinc-300 transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-zinc-900">
                                  {docItem.name} <span className="text-rose-600">*</span>
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                  Required *
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mb-3">{docItem.desc}</p>
                            </div>

                            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer p-2 rounded-xl bg-white border border-zinc-200 hover:border-zinc-400 transition-all">
                              <UploadCloud className="w-4 h-4 text-zinc-400 shrink-0" />
                              <span className="truncate">
                                {docItem.file || `Attach ${docItem.name} (${docItem.allowed.join('/')})`}
                              </span>
                              <input
                                type="file"
                                accept={docItem.allowed.join(',')}
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    const file = e.target.files[0];
                                    const clientId = user?.id || 'client';
                                    const doc = await processUploadedFile(file, docItem.category as any, clientId);
                                    const currentCompanyDocs = formData.companyDocs || {};
                                    const currentDynamic = currentCompanyDocs.dynamicDocs || {};

                                    const updatedDocs = {
                                      ...currentCompanyDocs,
                                      dynamicDocs: {
                                        ...currentDynamic,
                                        [docItem.id]: doc
                                      },
                                      ...(docItem.id === 'pan' ? { panFileName: file.name, panDoc: doc } : {}),
                                      ...(docItem.id === 'tan' ? { tanFileName: file.name, tanDoc: doc } : {}),
                                      ...(docItem.id === 'gst' ? { gstFileName: file.name, gstDoc: doc } : {}),
                                      ...(docItem.id === 'itr' ? { itrFileName: file.name, itrDoc: doc } : {}),
                                      ...(docItem.id === 'coi' ? { coiFileName: file.name, coiDoc: doc } : {}),
                                      ...(docItem.id === 'epfo_esic' ? { epfoEsicFileName: file.name, epfoEsicDoc: doc } : {}),
                                      ...(docItem.id === 'cheque' ? { cancelledChequeFileName: file.name, chequeDoc: doc } : {}),
                                      ...(docItem.id === 'signatory' ? { signatoryLetterFileName: file.name, signatoryDoc: doc } : {}),
                                      ...(docItem.id === 'training_module' ? { trainingModuleFileName: file.name, trainingModuleDoc: doc } : {})
                                    };

                                    updateField('companyDocs', updatedDocs);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        ))}
                      </div>

                      {/* NATS Structured Training Module Breakdown Fields */}
                      {isNats && (
                        <div className="p-4 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-3 pt-4">
                          <div className="border-b border-zinc-200 pb-2">
                            <span className="font-extrabold text-xs text-zinc-900 font-mono uppercase tracking-wider block">
                              Structured Training Module Details (Mandatory for NATS) *
                            </span>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Please furnish comprehensive apprenticeship training curriculum details as mandated by NATS AICTE/MoE guidelines.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">What apprentice will learn *</label>
                              <input
                                type="text"
                                required
                                placeholder="Core technical competencies, hands-on production workflows..."
                                value={formData.structuredTrainingModule?.learningObjectives || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  learningObjectives: e.target.value
                                })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">Duration of training *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. 12 Months (52 Weeks)"
                                value={formData.structuredTrainingModule?.trainingDuration || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  trainingDuration: e.target.value
                                })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">Department-wise exposure *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. QA (3 mos), Operations (6 mos), Maintenance (3 mos)"
                                value={formData.structuredTrainingModule?.departmentWiseExposure || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  departmentWiseExposure: e.target.value
                                })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">Skills to be developed *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Equipment diagnostic calibration, standard operating procedures..."
                                value={formData.structuredTrainingModule?.skillsToBeDeveloped || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  skillsToBeDeveloped: e.target.value
                                })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">Monthly training breakup *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. M1-M2: Induction & Safety, M3-M8: Department rotations, M9-M12: Project work"
                                value={formData.structuredTrainingModule?.monthlyTrainingBreakup || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  monthlyTrainingBreakup: e.target.value
                                })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-zinc-700 mb-1">Supervisor / Training Officer details *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Rajesh Kumar (Senior Training Manager, rajesh@co.in, +91 98765 43210)"
                                value={formData.structuredTrainingModule?.supervisorOrOfficerDetails || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  supervisorOrOfficerDetails: e.target.value
                                })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Final Review Summary Card */}
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500">Company:</span>
                    <span className="font-extrabold text-zinc-900">{formData.companyName || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500">Contact:</span>
                    <span className="font-bold text-zinc-900">{formData.contactName} ({formData.contactEmail})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Quota:</span>
                    <span className="font-extrabold text-zinc-900">{formData.requiredApprenticeCount} Candidates</span>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black border-zinc-300"
                  />
                  <span className="text-xs text-zinc-700 font-medium">
                    I verify all corporate compliance documents and apprentice quota requirements are authentic. <span className="text-red-500 font-bold">*</span>
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Section Navigation Buttons */}
        <div className="mt-8 pt-5 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevSection}
            disabled={currentSection === 1}
            className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              currentSection === 1
                ? 'opacity-30 cursor-not-allowed text-zinc-400 bg-transparent'
                : 'text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentSection < 2 ? (
            <button
              type="button"
              onClick={handleNextSection}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <span>CONTINUE TO SECTION 0{currentSection + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-7 py-2.5 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SUBMIT ONBOARDING APPLICATION ↗</span>
            </button>
          )}
        </div>

      </GlassCard>

    </div>
  );
};
