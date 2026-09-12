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
  AlertCircle,
  MapPin,
  UserCheck,
  Info,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processUploadedFile } from '@/lib/document-utils';

const INITIAL_FORM_STATE: IntakeFormData = {
  companyName: '',
  establishmentType: 'FOOD SERVICE / NON FOOD ITEMS',
  establishmentCategory: 'Food Service',
  panNumber: '',
  registeredAddress: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  landlineNumber: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  headOfEstablishmentName: '',
  headOfEstablishmentEmail: '',
  headOfEstablishmentDesignation: 'Director',
  spocFullName: '',
  spocEmailAddress: '',
  spocPhone: '',
  spocRoleTitle: 'HR / Compliance SPOC',
  industry: 'Food Service / Retail',
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
      setCurrentSection(existing.current_step && existing.current_step <= 3 ? existing.current_step : 1);
      setFormData(prev => ({
        ...prev,
        ...existing.responses,
        companyName: existing.responses?.companyName || existing.company_name || user?.company_name || '',
        contactName: existing.responses?.contactName || existing.client_name || user?.full_name || '',
        contactEmail: existing.responses?.contactEmail || existing.client_email || user?.email || '',
        contactPhone: existing.responses?.contactPhone || user?.phone || '',
        panNumber: existing.responses?.panNumber || existing.establishment_details?.pan || '',
        establishmentType: existing.responses?.establishmentType || existing.establishment_details?.establishmentType || 'FOOD SERVICE / NON FOOD ITEMS',
        establishmentCategory: existing.responses?.establishmentCategory || existing.establishment_details?.establishmentCategory || 'Food Service',
        registeredAddress: existing.responses?.registeredAddress || existing.establishment_details?.address || '',
        city: existing.responses?.city || existing.establishment_details?.city || '',
        district: existing.responses?.district || existing.establishment_details?.district || '',
        state: existing.responses?.state || existing.establishment_details?.state || '',
        pincode: existing.responses?.pincode || existing.establishment_details?.pincode || '',
        landlineNumber: existing.responses?.landlineNumber || existing.establishment_details?.landline || '',
        headOfEstablishmentName: existing.responses?.headOfEstablishmentName || existing.establishment_details?.headOfEstablishment || existing.client_name || user?.full_name || '',
        headOfEstablishmentEmail: existing.responses?.headOfEstablishmentEmail || existing.establishment_details?.headOfEstablishmentEmail || existing.client_email || user?.email || '',
        headOfEstablishmentDesignation: existing.responses?.headOfEstablishmentDesignation || existing.establishment_details?.designation || 'Director',
        spocFullName: existing.responses?.spocFullName || existing.assigned_company_spoc?.name || user?.apprenticeMetrics?.assignedCompanySpoc?.name || user?.full_name || '',
        spocEmailAddress: existing.responses?.spocEmailAddress || existing.assigned_company_spoc?.email || user?.apprenticeMetrics?.assignedCompanySpoc?.email || user?.email || '',
        spocPhone: existing.responses?.spocPhone || existing.assigned_company_spoc?.phone || user?.apprenticeMetrics?.assignedCompanySpoc?.phone || user?.phone || '',
        spocRoleTitle: existing.responses?.spocRoleTitle || existing.assigned_company_spoc?.roleTitle || 'HR / Compliance SPOC',
        enrollmentScheme: existing.responses?.enrollmentScheme || 'NAPS',
        gstinNumber: existing.responses?.gstinNumber || existing.establishment_details?.gstin || ''
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
        contactPhone: user.phone || '',
        headOfEstablishmentName: user.full_name || '',
        headOfEstablishmentEmail: user.email || '',
        spocFullName: user.full_name || '',
        spocEmailAddress: user.email || '',
        spocPhone: user.phone || ''
      }));
    }
  }, [user, getActiveClientSubmission]);

  // Record abandonment on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isSubmitted && currentSection < 3) {
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

  // Validate Mandatory Fields across the 3 sections
  const validateMandatoryFields = (data: IntakeFormData, maxSectionToCheck?: number) => {
    const errors: { field: string; sectionNumber: number; sectionName: string }[] = [];

    // Section 1 Mandatory Fields: Establishment & Quota
    if (!data.companyName?.trim()) {
      errors.push({ field: 'Name of the Establishment', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.establishmentType?.trim()) {
      errors.push({ field: 'Establishment Type', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.panNumber?.trim()) {
      errors.push({ field: 'Company PAN Number', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.registeredAddress?.trim()) {
      errors.push({ field: 'Registered Address', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.city?.trim()) {
      errors.push({ field: 'City', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.district?.trim()) {
      errors.push({ field: 'District', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.state?.trim()) {
      errors.push({ field: 'State', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.pincode?.trim()) {
      errors.push({ field: 'Pincode (Postal Code)', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.contactName?.trim()) {
      errors.push({ field: 'Contact Person Full Name', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.contactEmail?.trim()) {
      errors.push({ field: 'Contact Official Email', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.contactPhone?.trim()) {
      errors.push({ field: 'Contact Mobile Number', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.headOfEstablishmentName?.trim()) {
      errors.push({ field: 'Head of Establishment Full Name', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.headOfEstablishmentEmail?.trim()) {
      errors.push({ field: 'Head of Establishment Official Email', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.headOfEstablishmentDesignation?.trim()) {
      errors.push({ field: 'Head of Establishment Designation', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }
    if (!data.requiredApprenticeCount || Number(data.requiredApprenticeCount) < 1) {
      errors.push({ field: 'Total Apprentice Quota Required', sectionNumber: 1, sectionName: 'Establishment & Quota' });
    }

    // Section 2 Mandatory Fields: Document Verification
    if (!maxSectionToCheck || maxSectionToCheck >= 2) {
      if (!data.gstinNumber?.trim()) {
        errors.push({ field: 'Company GSTIN Number', sectionNumber: 2, sectionName: 'Compliance Documents' });
      }

      const isNats = data.enrollmentScheme === 'NATS';

      if (isNats) {
        // NATS Mandatory Documents:
        const panUploaded = data.companyDocs?.panDoc || data.companyDocs?.panFileName || data.companyDocs?.dynamicDocs?.['pan'];
        if (!panUploaded) errors.push({ field: 'PAN Card (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const tanUploaded = data.companyDocs?.tanDoc || data.companyDocs?.tanFileName || data.companyDocs?.dynamicDocs?.['tan'];
        if (!tanUploaded) errors.push({ field: 'TAN Document / Details (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const gstUploaded = data.companyDocs?.gstDoc || data.companyDocs?.gstFileName || data.companyDocs?.dynamicDocs?.['gst'];
        if (!gstUploaded) errors.push({ field: 'GST Certificate (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const itrUploaded = data.companyDocs?.itrDoc || data.companyDocs?.itrFileName || data.companyDocs?.dynamicDocs?.['itr'];
        if (!itrUploaded) errors.push({ field: 'ITR Acknowledgement (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const coiUploaded = data.companyDocs?.coiDoc || data.companyDocs?.coiFileName || data.companyDocs?.dynamicDocs?.['coi'];
        if (!coiUploaded) errors.push({ field: 'Incorporation / Registration Certificate (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const epfoUploaded = data.companyDocs?.epfoEsicDoc || data.companyDocs?.epfoEsicFileName || data.companyDocs?.dynamicDocs?.['epfo_esic'] || data.companyDocs?.epfoRegistrationCode;
        if (!epfoUploaded) errors.push({ field: 'EPFO / ESIC Registration (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const chequeUploaded = data.companyDocs?.chequeDoc || data.companyDocs?.cancelledChequeFileName || data.companyDocs?.dynamicDocs?.['cheque'];
        if (!chequeUploaded) errors.push({ field: 'Cancelled Cheque (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const trainingUploaded = data.companyDocs?.trainingModuleDoc || data.companyDocs?.trainingModuleFileName || data.companyDocs?.dynamicDocs?.['training_module'];
        if (!trainingUploaded) errors.push({ field: 'Structured Training Module Document (Mandatory NATS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        if (!data.structuredTrainingModule?.learningObjectives?.trim()) {
          errors.push({ field: 'Structured Module: What Apprentice Will Learn', sectionNumber: 2, sectionName: 'Compliance Documents' });
        }
        if (!data.structuredTrainingModule?.trainingDuration?.trim()) {
          errors.push({ field: 'Structured Module: Duration of Training', sectionNumber: 2, sectionName: 'Compliance Documents' });
        }
        if (!data.structuredTrainingModule?.departmentWiseExposure?.trim()) {
          errors.push({ field: 'Structured Module: Department-wise Exposure', sectionNumber: 2, sectionName: 'Compliance Documents' });
        }
        if (!data.structuredTrainingModule?.skillsToBeDeveloped?.trim()) {
          errors.push({ field: 'Structured Module: Skills to be Developed', sectionNumber: 2, sectionName: 'Compliance Documents' });
        }
        if (!data.structuredTrainingModule?.monthlyTrainingBreakup?.trim()) {
          errors.push({ field: 'Structured Module: Monthly Training Breakup', sectionNumber: 2, sectionName: 'Compliance Documents' });
        }
        if (!data.structuredTrainingModule?.supervisorOrOfficerDetails?.trim()) {
          errors.push({ field: 'Structured Module: Supervisor / Training Officer Details', sectionNumber: 2, sectionName: 'Compliance Documents' });
        }
      } else {
        // NAPS Mandatory Documents:
        const panUploaded = data.companyDocs?.panDoc || data.companyDocs?.panFileName || data.companyDocs?.dynamicDocs?.['pan'];
        if (!panUploaded) errors.push({ field: 'PAN Card (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const gstUploaded = data.companyDocs?.gstDoc || data.companyDocs?.gstFileName || data.companyDocs?.dynamicDocs?.['gst'];
        if (!gstUploaded) errors.push({ field: 'GST Registration (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const chequeUploaded = data.companyDocs?.chequeDoc || data.companyDocs?.cancelledChequeFileName || data.companyDocs?.dynamicDocs?.['cheque'];
        if (!chequeUploaded) errors.push({ field: 'Cancelled Cheque (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });

        const signatoryUploaded = data.companyDocs?.signatoryDoc || data.companyDocs?.signatoryLetterFileName || data.companyDocs?.dynamicDocs?.['signatory'];
        if (!signatoryUploaded) errors.push({ field: 'Signature & Seal of Authorized Signatory (Mandatory NAPS Document)', sectionNumber: 2, sectionName: 'Compliance Documents' });
      }
    }

    // Section 3 Mandatory Fields: Designated SPOC & Declaration
    if (!maxSectionToCheck || maxSectionToCheck >= 3) {
      if (!data.spocFullName?.trim()) {
        errors.push({ field: 'Designated SPOC Full Name', sectionNumber: 3, sectionName: 'SPOC & Submit' });
      }
      if (!data.spocEmailAddress?.trim()) {
        errors.push({ field: 'Designated SPOC Official Email Address', sectionNumber: 3, sectionName: 'SPOC & Submit' });
      }
      if (!data.spocPhone?.trim()) {
        errors.push({ field: 'Designated SPOC Contact Phone', sectionNumber: 3, sectionName: 'SPOC & Submit' });
      }
      if (!data.agreedToTerms) {
        errors.push({ field: 'Acceptance of Regulatory Declarations & Terms', sectionNumber: 3, sectionName: 'SPOC & Submit' });
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
    if (currentSection < 3) {
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
    const errors = validateMandatoryFields(formData, 3);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setCurrentSection(errors[0].sectionNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    await saveSubmissionStep(formData, 3, true);
    setIsSaving(false);
    setIsSubmitted(true);
  };

  const sections = [
    { number: 1, title: 'Establishment & Quota', desc: 'Registration & Head of Establishment' },
    { number: 2, title: 'Compliance Documents', desc: 'Scheme verification files & GST' },
    { number: 3, title: 'SPOC & Submit', desc: 'Notification contact & declaration' }
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
            Onboarding Application Submitted
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto text-xs leading-relaxed mb-8 font-medium">
            Establishment details and candidate requirements for <strong>{formData.companyName || 'your organization'}</strong> ({formData.requiredApprenticeCount} apprentices) have been registered into the administration console.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8 text-left text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Establishment</span>
              <div className="font-extrabold text-zinc-900 text-base mt-0.5 truncate">{formData.companyName || 'Registered Client'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Designated SPOC</span>
              <div className="font-extrabold text-zinc-900 text-base mt-0.5 truncate">{formData.spocEmailAddress || formData.contactEmail}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">Scheme & Quota</span>
              <div className="font-extrabold text-emerald-700 text-base mt-0.5">{formData.enrollmentScheme || 'NAPS'} · {formData.requiredApprenticeCount} Quota</div>
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
            Establishment Onboarding & Quota Registration
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 font-mono font-semibold">
          <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isSaving ? 'Saving...' : 'Saved'}</span>
        </div>
      </div>

      {/* Section Progress Bar */}
      <div className="mb-6 space-y-2">
        <div className="grid grid-cols-3 gap-2">
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
            initial={{ width: '33%' }}
            animate={{ width: `${(currentSection / 3) * 100}%` }}
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
        <span className="font-mono text-[11px] text-zinc-400">Step {currentSection} of 3</span>
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
            {/* SECTION 1: Establishment Registration & Quota Scope */}
            {currentSection === 1 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 01: ESTABLISHMENT REGISTRATION & QUOTA SCOPE
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Select your regulatory apprenticeship scheme, provide official establishment registration details, and declare head of establishment.
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

                {/* Card 1: Establishment Registration Details */}
                <div className="p-5 rounded-3xl bg-zinc-50/80 border border-zinc-200 space-y-4">
                  <div className="border-b border-zinc-200 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                        Establishment Registration Details
                      </h4>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        Official corporate registry info matching government apprenticeship portal
                      </p>
                    </div>
                    <Building className="w-4 h-4 text-zinc-400" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Establishment Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Name of the Establishment / Legal Entity Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="e.g. NIDEESHWARAM FOODS / NovaTech Solutions Pvt Ltd"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-semibold"
                      />
                    </div>

                    {/* Establishment Type */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Establishment Type *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.establishmentType || ''}
                        onChange={(e) => updateField('establishmentType', e.target.value)}
                        placeholder="e.g. FOODS SERVICE / NON FOOD ITEMS"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* Establishment Category / Sector */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Establishment Category / Sector
                      </label>
                      <input
                        type="text"
                        value={formData.establishmentCategory || ''}
                        onChange={(e) => updateField('establishmentCategory', e.target.value)}
                        placeholder="e.g. FOOD SERVICE / IT / MANUFACTURING"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* Company PAN Number */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Company PAN Number *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={formData.panNumber || ''}
                        onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())}
                        placeholder="e.g. AAVFN4359C"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs font-mono font-bold uppercase placeholder-zinc-400 focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* Landline Number */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Landline Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.landlineNumber || ''}
                        onChange={(e) => updateField('landlineNumber', e.target.value)}
                        placeholder="e.g. 080 23456789 or 0"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* Registered Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Registered Establishment Address *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={formData.registeredAddress || ''}
                        onChange={(e) => updateField('registeredAddress', e.target.value)}
                        placeholder="e.g. SP 8, NGEF Ancillary Industrial Estate, Mahadevapura"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium resize-none"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city || ''}
                        onChange={(e) => updateField('city', e.target.value)}
                        placeholder="e.g. Bangalore"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        District *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.district || ''}
                        onChange={(e) => updateField('district', e.target.value)}
                        placeholder="e.g. Bangalore Urban"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.state || ''}
                        onChange={(e) => updateField('state', e.target.value)}
                        placeholder="e.g. Karnataka"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Pincode (Postal Code) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={formData.pincode || ''}
                        onChange={(e) => updateField('pincode', e.target.value)}
                        placeholder="e.g. 560048"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs font-mono font-bold placeholder-zinc-400 focus:outline-none focus:border-black"
                      />
                    </div>

                    {/* Contact Person Name */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Name of Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactName}
                        onChange={(e) => updateField('contactName', e.target.value)}
                        placeholder="e.g. Mansi Gupta C S"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* Contact Mobile */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Contact Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.contactPhone}
                        onChange={(e) => updateField('contactPhone', e.target.value)}
                        placeholder="e.g. 9632469856"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    {/* Official Email */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Official Contact Email ID *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.contactEmail}
                        onChange={(e) => updateField('contactEmail', e.target.value)}
                        placeholder="e.g. mansigupta1509@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Head of Establishment Details */}
                <div className="p-5 rounded-3xl bg-zinc-50/80 border border-zinc-200 space-y-4">
                  <div className="border-b border-zinc-200 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                        Head of Establishment
                      </h4>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        Primary signing officer empowered to enter apprenticeship agreements
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-zinc-400" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.headOfEstablishmentName || ''}
                        onChange={(e) => updateField('headOfEstablishmentName', e.target.value)}
                        placeholder="e.g. Mansi Gupta C S"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Official Email ID *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.headOfEstablishmentEmail || ''}
                        onChange={(e) => updateField('headOfEstablishmentEmail', e.target.value)}
                        placeholder="e.g. mansigupta1509@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Designation *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.headOfEstablishmentDesignation || ''}
                        onChange={(e) => updateField('headOfEstablishmentDesignation', e.target.value)}
                        placeholder="e.g. Director / CEO / Managing Partner"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3: Apprentice Quota & Operational States */}
                <div className="p-5 rounded-3xl bg-zinc-50/80 border border-zinc-200 space-y-4">
                  <div className="border-b border-zinc-200 pb-2">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                      Apprentice Quota Allocation
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Operational States *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.operationalStates || ''}
                        onChange={(e) => updateField('operationalStates', e.target.value)}
                        placeholder="e.g. Karnataka, Maharashtra, Tamil Nadu, Delhi NCR"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Mandatory Compliance Documents */}
            {currentSection === 2 && (
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 02: MANDATORY COMPLIANCE DOCUMENTS & TAX IDENTIFIERS
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Upload official corporate compliance files according to your chosen ({formData.enrollmentScheme || 'NAPS'}) scheme to establish legal apprenticeship quota.
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
                      placeholder="e.g. 29AAVFN4359C1ZS"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-mono uppercase focus:outline-none focus:border-black focus:bg-white font-bold"
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
                      placeholder="e.g. BNG-1234567-000"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-mono focus:outline-none focus:border-black focus:bg-white"
                    />
                  </div>
                </div>

                {/* Scheme-Specific Documents Grid */}
                {(() => {
                  const isNats = formData.enrollmentScheme === 'NATS';
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-800 font-mono uppercase">
                          {isNats ? 'NATS Mandatory Compliance Documents (8 Requirements)' : 'NAPS Mandatory Compliance Documents (4 Requirements)'}
                        </span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold">
                          Max 5MB each (.pdf, .png, .jpg)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* 1. PAN Card Document */}
                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-zinc-900 block">1. Company PAN Card *</span>
                              <span className="text-[10px] text-zinc-500">Official PAN verification document</span>
                            </div>
                            {(formData.companyDocs?.panDoc || formData.companyDocs?.panFileName) && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={async (e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0];
                                const doc = await processUploadedFile(file, 'General', user?.id || 'client');
                                updateField('companyDocs', {
                                  ...(formData.companyDocs || {}),
                                  panFileName: file.name,
                                  panDoc: doc
                                });
                              }
                            }}
                            className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                          />
                          {(formData.companyDocs?.panFileName || formData.companyDocs?.panDoc?.name) && (
                            <p className="text-[10px] text-emerald-700 font-mono truncate">
                              ✓ {formData.companyDocs?.panFileName || formData.companyDocs?.panDoc?.name}
                            </p>
                          )}
                        </div>

                        {/* 2. For NATS: TAN Card / Proof || For NAPS: GST Registration */}
                        {isNats ? (
                          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 block">2. TAN Card / Proof *</span>
                                <span className="text-[10px] text-zinc-500">Tax deduction account number document</span>
                              </div>
                              {(formData.companyDocs?.tanDoc || formData.companyDocs?.tanFileName) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const doc = await processUploadedFile(file, 'General', user?.id || 'client');
                                  updateField('companyDocs', {
                                    ...(formData.companyDocs || {}),
                                    tanFileName: file.name,
                                    tanDoc: doc
                                  });
                                }
                              }}
                              className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                            />
                            {(formData.companyDocs?.tanFileName || formData.companyDocs?.tanDoc?.name) && (
                              <p className="text-[10px] text-emerald-700 font-mono truncate">
                                ✓ {formData.companyDocs?.tanFileName || formData.companyDocs?.tanDoc?.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 block">2. GST Registration *</span>
                                <span className="text-[10px] text-zinc-500">Certificate of GST registration</span>
                              </div>
                              {(formData.companyDocs?.gstDoc || formData.companyDocs?.gstFileName) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const doc = await processUploadedFile(file, 'GST', user?.id || 'client');
                                  updateField('companyDocs', {
                                    ...(formData.companyDocs || {}),
                                    gstFileName: file.name,
                                    gstDoc: doc
                                  });
                                }
                              }}
                              className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                            />
                            {(formData.companyDocs?.gstFileName || formData.companyDocs?.gstDoc?.name) && (
                              <p className="text-[10px] text-emerald-700 font-mono truncate">
                                ✓ {formData.companyDocs?.gstFileName || formData.companyDocs?.gstDoc?.name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 3. For NATS: GST Certificate || For NAPS: Cancelled Cheque */}
                        {isNats ? (
                          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 block">3. GST Certificate *</span>
                                <span className="text-[10px] text-zinc-500">Official GST certificate</span>
                              </div>
                              {(formData.companyDocs?.gstDoc || formData.companyDocs?.gstFileName) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const doc = await processUploadedFile(file, 'GST', user?.id || 'client');
                                  updateField('companyDocs', {
                                    ...(formData.companyDocs || {}),
                                    gstFileName: file.name,
                                    gstDoc: doc
                                  });
                                }
                              }}
                              className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                            />
                            {(formData.companyDocs?.gstFileName || formData.companyDocs?.gstDoc?.name) && (
                              <p className="text-[10px] text-emerald-700 font-mono truncate">
                                ✓ {formData.companyDocs?.gstFileName || formData.companyDocs?.gstDoc?.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 block">3. Cancelled Cheque *</span>
                                <span className="text-[10px] text-zinc-500">Bank account confirmation for DBT subsidy</span>
                              </div>
                              {(formData.companyDocs?.chequeDoc || formData.companyDocs?.cancelledChequeFileName) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const doc = await processUploadedFile(file, 'Cheque', user?.id || 'client');
                                  updateField('companyDocs', {
                                    ...(formData.companyDocs || {}),
                                    cancelledChequeFileName: file.name,
                                    chequeDoc: doc
                                  });
                                }
                              }}
                              className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                            />
                            {(formData.companyDocs?.cancelledChequeFileName || formData.companyDocs?.chequeDoc?.name) && (
                              <p className="text-[10px] text-emerald-700 font-mono truncate">
                                ✓ {formData.companyDocs?.cancelledChequeFileName || formData.companyDocs?.chequeDoc?.name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 4. For NATS: ITR Acknowledgement || For NAPS: Signature & Seal */}
                        {isNats ? (
                          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 block">4. ITR Acknowledgement *</span>
                                <span className="text-[10px] text-zinc-500">Income Tax Return filing proof</span>
                              </div>
                              {(formData.companyDocs?.itrDoc || formData.companyDocs?.itrFileName) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const doc = await processUploadedFile(file, 'General', user?.id || 'client');
                                  updateField('companyDocs', {
                                    ...(formData.companyDocs || {}),
                                    itrFileName: file.name,
                                    itrDoc: doc
                                  });
                                }
                              }}
                              className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                            />
                            {(formData.companyDocs?.itrFileName || formData.companyDocs?.itrDoc?.name) && (
                              <p className="text-[10px] text-emerald-700 font-mono truncate">
                                ✓ {formData.companyDocs?.itrFileName || formData.companyDocs?.itrDoc?.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 block">4. Signature & Seal of Signatory *</span>
                                <span className="text-[10px] text-zinc-500">Authorized corporate authority declaration</span>
                              </div>
                              {(formData.companyDocs?.signatoryDoc || formData.companyDocs?.signatoryLetterFileName) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  const doc = await processUploadedFile(file, 'Signatory Letter', user?.id || 'client');
                                  updateField('companyDocs', {
                                    ...(formData.companyDocs || {}),
                                    signatoryLetterFileName: file.name,
                                    signatoryDoc: doc
                                  });
                                }
                              }}
                              className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                            />
                            {(formData.companyDocs?.signatoryLetterFileName || formData.companyDocs?.signatoryDoc?.name) && (
                              <p className="text-[10px] text-emerald-700 font-mono truncate">
                                ✓ {formData.companyDocs?.signatoryLetterFileName || formData.companyDocs?.signatoryDoc?.name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* NATS Documents 5 to 8 */}
                        {isNats && (
                          <>
                            {/* 5. Incorporation Certificate */}
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-zinc-900 block">5. Incorporation Certificate *</span>
                                  <span className="text-[10px] text-zinc-500">Certificate of Incorporation (COI) / Registration</span>
                                </div>
                                {(formData.companyDocs?.coiDoc || formData.companyDocs?.coiFileName) && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    const file = e.target.files[0];
                                    const doc = await processUploadedFile(file, 'COI', user?.id || 'client');
                                    updateField('companyDocs', {
                                      ...(formData.companyDocs || {}),
                                      coiFileName: file.name,
                                      coiDoc: doc
                                    });
                                  }
                                }}
                                className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                              />
                              {(formData.companyDocs?.coiFileName || formData.companyDocs?.coiDoc?.name) && (
                                <p className="text-[10px] text-emerald-700 font-mono truncate">
                                  ✓ {formData.companyDocs?.coiFileName || formData.companyDocs?.coiDoc?.name}
                                </p>
                              )}
                            </div>

                            {/* 6. EPFO / ESIC Registration */}
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-zinc-900 block">6. EPFO / ESIC Registration *</span>
                                  <span className="text-[10px] text-zinc-500">EPFO or ESIC establishment registration proof</span>
                                </div>
                                {(formData.companyDocs?.epfoEsicDoc || formData.companyDocs?.epfoEsicFileName) && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    const file = e.target.files[0];
                                    const doc = await processUploadedFile(file, 'General', user?.id || 'client');
                                    updateField('companyDocs', {
                                      ...(formData.companyDocs || {}),
                                      epfoEsicFileName: file.name,
                                      epfoEsicDoc: doc
                                    });
                                  }
                                }}
                                className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                              />
                              {(formData.companyDocs?.epfoEsicFileName || formData.companyDocs?.epfoEsicDoc?.name) && (
                                <p className="text-[10px] text-emerald-700 font-mono truncate">
                                  ✓ {formData.companyDocs?.epfoEsicFileName || formData.companyDocs?.epfoEsicDoc?.name}
                                </p>
                              )}
                            </div>

                            {/* 7. Cancelled Cheque */}
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-zinc-900 block">7. Cancelled Cheque *</span>
                                  <span className="text-[10px] text-zinc-500">Bank account confirmation for NATS</span>
                                </div>
                                {(formData.companyDocs?.chequeDoc || formData.companyDocs?.cancelledChequeFileName) && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    const file = e.target.files[0];
                                    const doc = await processUploadedFile(file, 'Cheque', user?.id || 'client');
                                    updateField('companyDocs', {
                                      ...(formData.companyDocs || {}),
                                      cancelledChequeFileName: file.name,
                                      chequeDoc: doc
                                    });
                                  }
                                }}
                                className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                              />
                              {(formData.companyDocs?.cancelledChequeFileName || formData.companyDocs?.chequeDoc?.name) && (
                                <p className="text-[10px] text-emerald-700 font-mono truncate">
                                  ✓ {formData.companyDocs?.cancelledChequeFileName || formData.companyDocs?.chequeDoc?.name}
                                </p>
                              )}
                            </div>

                            {/* 8. Structured Training Module Document */}
                            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-zinc-900 block">8. Structured Training Module Document *</span>
                                  <span className="text-[10px] text-zinc-500">Official syllabus & module curriculum (.pdf, .docx)</span>
                                </div>
                                {(formData.companyDocs?.trainingModuleDoc || formData.companyDocs?.trainingModuleFileName) && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.docx,.doc,.txt"
                                onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                    const file = e.target.files[0];
                                    const doc = await processUploadedFile(file, 'General', user?.id || 'client');
                                    updateField('companyDocs', {
                                      ...(formData.companyDocs || {}),
                                      trainingModuleFileName: file.name,
                                      trainingModuleDoc: doc
                                    });
                                  }
                                }}
                                className="block w-full text-[11px] text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 file:text-zinc-800 hover:file:bg-zinc-300 cursor-pointer"
                              />
                              {(formData.companyDocs?.trainingModuleFileName || formData.companyDocs?.trainingModuleDoc?.name) && (
                                <p className="text-[10px] text-emerald-700 font-mono truncate">
                                  ✓ {formData.companyDocs?.trainingModuleFileName || formData.companyDocs?.trainingModuleDoc?.name}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* NATS Structured Training Module Breakdown Fields */}
                      {isNats && (
                        <div className="p-5 rounded-3xl bg-zinc-100/70 border border-zinc-200 space-y-3 mt-4">
                          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                            <span className="text-xs font-bold text-zinc-900 font-mono uppercase">
                              Structured Training Module Breakdown
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">Mandatory for NATS approval</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                What Apprentice Will Learn *
                              </label>
                              <input
                                type="text"
                                value={formData.structuredTrainingModule?.learningObjectives || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  learningObjectives: e.target.value
                                })}
                                placeholder="e.g. Industry operations, quality control, cloud architecture"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Duration of Training *
                              </label>
                              <input
                                type="text"
                                value={formData.structuredTrainingModule?.trainingDuration || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  trainingDuration: e.target.value
                                })}
                                placeholder="e.g. 12 Months (1 Year)"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Department-wise Exposure *
                              </label>
                              <input
                                type="text"
                                value={formData.structuredTrainingModule?.departmentWiseExposure || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  departmentWiseExposure: e.target.value
                                })}
                                placeholder="e.g. Operations (4m), Quality (4m), Maintenance (4m)"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Skills to be Developed *
                              </label>
                              <input
                                type="text"
                                value={formData.structuredTrainingModule?.skillsToBeDeveloped || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  skillsToBeDeveloped: e.target.value
                                })}
                                placeholder="e.g. SOP compliance, equipment handling, data analytics"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Monthly Training Breakup *
                              </label>
                              <input
                                type="text"
                                value={formData.structuredTrainingModule?.monthlyTrainingBreakup || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  monthlyTrainingBreakup: e.target.value
                                })}
                                placeholder="e.g. Month 1-3 Foundation, Month 4-8 Hands-on, Month 9-12 Project"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Supervisor / Training Officer Details *
                              </label>
                              <input
                                type="text"
                                value={formData.structuredTrainingModule?.supervisorOrOfficerDetails || ''}
                                onChange={(e) => updateField('structuredTrainingModule', {
                                  ...(formData.structuredTrainingModule || {}),
                                  supervisorOrOfficerDetails: e.target.value
                                })}
                                placeholder="e.g. Rajesh Verma, Lead Training Manager"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SECTION 3: Designated SPOC Configuration & Final Submission */}
            {currentSection === 3 && (
              <div className="space-y-6">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 03: DESIGNATED SPOC CONFIGURATION & SUBMISSION
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Configure your primary notification contact for candidate dossiers and review your onboarding application.
                  </p>
                </div>

                {/* Prominent Informational Banner: Why SPOC is needed */}
                <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Why do we require your SPOC Email Address?</span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed pl-6 font-medium">
                    Whenever a new apprentice candidate is onboarded or multi-format documents (.pdf, .docx) are verified, an official compliance dossier is <strong>automatically dispatched to this email address</strong>. 
                  </p>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed pl-6">
                    This includes candidate KYC, Aadhaar card, education certificates, bank proofs, and apprenticeship legal contract agreements. Setting this now ensures your internal HR and compliance team receives real-time verification records.
                  </p>
                  <div className="pl-6 pt-1 text-[10px] font-mono text-amber-800 font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>You can edit or update this SPOC contact at any time from your Client Dashboard.</span>
                  </div>
                </div>

                {/* Designated SPOC Input Card */}
                <div className="p-5 rounded-3xl bg-zinc-50/80 border border-zinc-200 space-y-4">
                  <div className="border-b border-zinc-200 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                        Designated SPOC Details
                      </h4>
                      <p className="text-[11px] text-zinc-500 font-medium">
                        This person will receive candidate onboarding emails and audit logs
                      </p>
                    </div>
                    <Mail className="w-4 h-4 text-zinc-400" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        SPOC Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.spocFullName || ''}
                        onChange={(e) => updateField('spocFullName', e.target.value)}
                        placeholder="e.g. Mansi Gupta C S / Alex Rivera"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        SPOC Official Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.spocEmailAddress || ''}
                        onChange={(e) => updateField('spocEmailAddress', e.target.value)}
                        placeholder="e.g. hr-spoc@company.com"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        SPOC Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.spocPhone || ''}
                        onChange={(e) => updateField('spocPhone', e.target.value)}
                        placeholder="+91 98765 00000"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        SPOC Role / Designation
                      </label>
                      <input
                        type="text"
                        value={formData.spocRoleTitle || ''}
                        onChange={(e) => updateField('spocRoleTitle', e.target.value)}
                        placeholder="e.g. HR Operations Lead / Compliance SPOC"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Application Review Summary Card */}
                <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="font-mono font-bold uppercase text-zinc-800">Application Summary</span>
                    <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-bold">
                      {formData.enrollmentScheme || 'NAPS'} Scheme
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                    <span className="text-zinc-500">Establishment:</span>
                    <span className="font-extrabold text-zinc-900">{formData.companyName || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                    <span className="text-zinc-500">PAN & GSTIN:</span>
                    <span className="font-mono font-bold text-zinc-800">{formData.panNumber || '-'} · {formData.gstinNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                    <span className="text-zinc-500">Head of Establishment:</span>
                    <span className="font-bold text-zinc-900">{formData.headOfEstablishmentName || '-'} ({formData.headOfEstablishmentDesignation || 'Director'})</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                    <span className="text-zinc-500">Configured Notification SPOC:</span>
                    <span className="font-bold text-zinc-900">{formData.spocFullName || '-'} &lt;{formData.spocEmailAddress || '-'}&gt;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Requested Apprentice Quota:</span>
                    <span className="font-extrabold text-emerald-800">{formData.requiredApprenticeCount} Candidates</span>
                  </div>
                </div>

                {/* Regulatory Declaration Checkbox */}
                <label className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black border-zinc-300"
                  />
                  <span className="text-xs text-zinc-700 font-medium">
                    I declare and verify that all establishment registration details, head of establishment information, and corporate compliance documents are accurate and authentic. <span className="text-red-500 font-bold">*</span>
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

          {currentSection < 3 ? (
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
