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
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleCategory {
  category: string;
  roles: string[];
}

const ROLE_CATALOG: RoleCategory[] = [
  {
    category: 'Technology & Engineering',
    roles: [
      'Full-Stack Developer Trainee',
      'Frontend Engineer Trainee',
      'Backend & API Developer Trainee',
      'Cloud & DevOps Associate',
      'Cybersecurity Analyst Trainee',
      'Data Engineer Trainee',
      'Machine Learning & AI Trainee',
      'QA & Automation Tester Trainee',
      'Mobile App Developer (iOS/Android)',
      'Systems Administrator Trainee'
    ]
  },
  {
    category: 'Management & Operations',
    roles: [
      'Business Operations Associate',
      'Associate Product Manager Trainee',
      'Project Management Coordinator',
      'Scrum & Agile Coordinator Trainee',
      'Supply Chain & Logistics Trainee',
      'Business Analyst Trainee',
      'Operations & Process Associate',
      'Executive Office Coordinator'
    ]
  },
  {
    category: 'Product, Design & Creative',
    roles: [
      'UI/UX Product Design Trainee',
      'Visual & Graphic Design Associate',
      'Motion Graphics & Video Editor',
      'Technical & Product Writer',
      '3D & Spatial Design Trainee'
    ]
  },
  {
    category: 'Finance, Accounts & Legal',
    roles: [
      'Financial Analyst Trainee',
      'Junior Accountant & Bookkeeper',
      'Legal Compliance & Audit Trainee',
      'Tax & Payroll Analyst Trainee',
      'Risk & Audit Associate'
    ]
  },
  {
    category: 'Sales, Marketing & Growth',
    roles: [
      'Digital Marketing & SEO Trainee',
      'Growth Marketing Associate',
      'B2B Sales & Lead Gen Trainee',
      'Social Media & Community Trainee',
      'Brand & Communications Associate'
    ]
  },
  {
    category: 'Human Resources & Talent',
    roles: [
      'HR Generalist Trainee',
      'Technical Talent Acquisition Associate',
      'Employee Engagement & Training Trainee',
      'HR Operations & People Analytics'
    ]
  },
  {
    category: 'Manufacturing & Industrial',
    roles: [
      'Industrial Automation Trainee',
      'Electrical & Electronics Trainee',
      'Mechanical Quality Control Trainee',
      'CNC Machine Operator Trainee',
      'Plant Safety & Maintenance Trainee'
    ]
  },
  {
    category: 'Customer Success & Support',
    roles: [
      'Customer Success Specialist Trainee',
      'Technical Support Engineer Trainee',
      'Client Relationship Coordinator'
    ]
  }
];

const INITIAL_FORM_STATE: IntakeFormData = {
  companyName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  industry: 'Technology & Digital Services',
  requiredApprenticeCount: 15,
  tradesRequired: ['Full-Stack Developer Trainee', 'Business Operations Associate'],
  stipendPerApprentice: 18500,
  dbtSchemeOptIn: true,
  proposedJoiningDate: '2026-10-01',
  trainingLocations: 'Hybrid / On-Premise',
  contractTemplateType: 'Standard National Apprenticeship Contract v3',
  complianceOfficerName: '',
  complianceOfficerEmail: '',
  hasPreviousCNIssues: false,
  cnIssueNotes: '',
  attachedDocsName: '',
  specialInstructions: '',
  agreedToTerms: true
};

export const ClientIntakeWizard: React.FC = () => {
  const { user, getActiveClientSubmission, saveSubmissionStep, recordAbandonment } = useStore();
  const [currentSection, setCurrentSection] = useState<number>(1);
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Role Search & Custom Role State
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [showRoleSelectorModal, setShowRoleSelectorModal] = useState(false);

  // Initialize from active submission or current user
  useEffect(() => {
    const existing = getActiveClientSubmission();
    if (existing) {
      if (existing.status === 'submitted' || existing.status === 'approved' || existing.status === 'under_review') {
        setIsSubmitted(true);
      }
      setCurrentSection(existing.current_step || 1);
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
      setFormData(prev => ({
        ...prev,
        companyName: user.company_name || '',
        contactName: user.full_name || '',
        contactEmail: user.email || '',
        contactPhone: user.phone || ''
      }));
    }
  }, [user]);

  // Record abandonment on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isSubmitted && currentSection < 4) {
        recordAbandonment(currentSection, formData);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSection, formData, isSubmitted]);

  const updateField = (field: keyof IntakeFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    
    setIsSaving(true);
    setTimeout(() => {
      saveSubmissionStep(updated, currentSection, false);
      setIsSaving(false);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 350);
  };

  // Toggle or add role
  const toggleRole = (role: string) => {
    const current = formData.tradesRequired || [];
    const updated = current.includes(role)
      ? current.filter((r: string) => r !== role)
      : [...current, role];
    updateField('tradesRequired', updated);
  };

  const removeRole = (roleToRemove: string) => {
    const current = formData.tradesRequired || [];
    updateField('tradesRequired', current.filter(r => r !== roleToRemove));
  };

  const handleAddCustomRole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRole = customRoleInput.trim();
    if (!cleanRole) return;

    const current = formData.tradesRequired || [];
    if (!current.includes(cleanRole)) {
      updateField('tradesRequired', [...current, cleanRole]);
    }
    setCustomRoleInput('');
  };

  // Filtered Roles List
  const filteredRoleCategories = useMemo(() => {
    const query = roleSearchQuery.toLowerCase().trim();

    return ROLE_CATALOG.map(cat => {
      if (selectedCategory !== 'All' && cat.category !== selectedCategory) {
        return null;
      }

      const matchingRoles = cat.roles.filter(role => 
        !query || role.toLowerCase().includes(query)
      );

      if (matchingRoles.length === 0) return null;

      return {
        category: cat.category,
        roles: matchingRoles
      };
    }).filter(Boolean) as RoleCategory[];
  }, [roleSearchQuery, selectedCategory]);

  const allFilteredRolesCount = useMemo(() => {
    return filteredRoleCategories.reduce((acc, cat) => acc + cat.roles.length, 0);
  }, [filteredRoleCategories]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setActiveFile(file.name);
      updateField('attachedDocsName', file.name);
    }
  };

  const handleNextSection = async () => {
    if (currentSection < 4) {
      const next = currentSection + 1;
      setCurrentSection(next);
      await saveSubmissionStep(formData, next, false);
    }
  };

  const handlePrevSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveSubmissionStep(formData, 4, true);
    setIsSaving(false);
    setIsSubmitted(true);
  };

  const sections = [
    { number: 1, title: 'Requirements & Quota', desc: 'Company, candidates & roles' },
    { number: 2, title: 'Payroll & Stipends', desc: 'Stipend rates & DBT subsidy' },
    { number: 3, title: 'Contract & Compliance', desc: 'Legal template & officers' },
    { number: 4, title: 'Verification & Submit', desc: 'Document upload & dispatch' }
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
              Onboarding Wizard
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
            Candidate Intake & Quota Application
          </h2>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 font-mono font-semibold">
          <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isSaving ? 'Saving...' : 'Saved'}</span>
        </div>
      </div>

      {/* Section Progress Bar */}
      <div className="mb-6 space-y-2">
        <div className="grid grid-cols-4 gap-2">
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
            initial={{ width: '25%' }}
            animate={{ width: `${(currentSection / 4) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>

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
            {/* SECTION 1: Candidate Requirements & Quota */}
            {currentSection === 1 && (
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 01: CANDIDATE REQUIREMENTS & QUOTA SCOPE
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Define your company details, target apprentice roles, and candidate headcount.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name Field */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Company / Organization Name *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="e.g. Acme Innovations Pvt Ltd"
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
                      value={formData.requiredApprenticeCount}
                      onChange={(e) => updateField('requiredApprenticeCount', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black focus:bg-white font-bold"
                    />
                  </div>
                </div>

                {/* Comprehensive Role Selector with Search, Categories & Custom Role Adder */}
                <div className="pt-2 border-t border-zinc-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-900 block">
                        Select Apprentice Roles / Specializations *
                      </label>
                      <p className="text-[11px] text-zinc-500">
                        Search across Tech, Management, Design, Finance, HR, or add your own custom roles.
                      </p>
                    </div>

                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 self-start sm:self-auto">
                      {(formData.tradesRequired || []).length} Selected
                    </span>
                  </div>

                  {/* Selected Roles Chips Tray */}
                  {(formData.tradesRequired || []).length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 mb-3.5">
                      <div className="text-[10px] uppercase font-mono font-bold text-zinc-400 mb-2">
                        Currently Selected:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(formData.tradesRequired || []).map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-xs font-semibold shadow-xs"
                          >
                            <span>{role}</span>
                            <button
                              type="button"
                              onClick={() => removeRole(role)}
                              className="w-3.5 h-3.5 rounded-full hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <X className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Role Search & Category Filter */}
                  <div className="space-y-2.5 mb-3.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search roles (e.g. Developer, Operations, Product, Analyst, Designer)..."
                        value={roleSearchQuery}
                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white font-medium"
                      />
                      {roleSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRoleSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {['All', 'Technology & Engineering', 'Management & Operations', 'Product, Design & Creative', 'Finance, Accounts & Legal', 'Sales, Marketing & Growth', 'Human Resources & Talent', 'Manufacturing & Industrial', 'Customer Success & Support'].map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-black text-white shadow-xs'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {cat.split(' & ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categorized Role Grid List */}
                  <div className="max-h-64 overflow-y-auto pr-1 space-y-4 rounded-2xl border border-zinc-200 p-3.5 bg-zinc-50/50">
                    {filteredRoleCategories.length > 0 ? (
                      filteredRoleCategories.map((group) => (
                        <div key={group.category} className="space-y-1.5">
                          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 px-1">
                            {group.category}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {group.roles.map((role) => {
                              const isSelected = (formData.tradesRequired || []).includes(role);
                              return (
                                <button
                                  type="button"
                                  key={role}
                                  onClick={() => toggleRole(role)}
                                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-black text-white border border-black shadow-xs'
                                      : 'bg-white border border-zinc-200 text-zinc-800 hover:border-zinc-300'
                                  }`}
                                >
                                  <span className="truncate pr-2">{role}</span>
                                  <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                                    isSelected ? 'bg-white border-white text-black' : 'border-zinc-300'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-zinc-500 text-xs">
                        <p>No predefined roles found for &quot;{roleSearchQuery}&quot;.</p>
                        {roleSearchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              const clean = roleSearchQuery.trim();
                              if (clean && !(formData.tradesRequired || []).includes(clean)) {
                                updateField('tradesRequired', [...(formData.tradesRequired || []), clean]);
                                setRoleSearchQuery('');
                              }
                            }}
                            className="mt-2.5 px-4 py-1.5 rounded-full bg-black text-white font-bold text-xs hover:bg-zinc-800 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Add &quot;{roleSearchQuery}&quot; as custom role</span>
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* "Others" Custom Role Form Adder */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Can't find your role? Type custom role here (e.g. AI Prompt Specialist)..."
                        value={customRoleInput}
                        onChange={(e) => setCustomRoleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomRole();
                          }
                        }}
                        className="w-full px-3.5 py-2 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomRole}
                      disabled={!customRoleInput.trim()}
                      className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Role</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* SECTION 2: Payroll & Stipend Configuration */}
            {currentSection === 2 && (
              <div className="space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 02: PAYROLL, STIPEND & DBT STRUCTURE
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Configure monthly stipend amounts, DBT government subsidy, and locations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Monthly Stipend Rate per Apprentice (₹) *
                    </label>
                    <input
                      type="number"
                      step={500}
                      value={formData.stipendPerApprentice}
                      onChange={(e) => updateField('stipendPerApprentice', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black focus:bg-white font-bold"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block font-mono">* Benchmark: ₹15,000 – ₹25,000</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Target Joining Date
                    </label>
                    <input
                      type="date"
                      value={formData.proposedJoiningDate}
                      onChange={(e) => updateField('proposedJoiningDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black focus:bg-white font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Training & Work Location Mode *
                    </label>
                    <select
                      value={formData.trainingLocations || 'Hybrid (Office + Remote Work)'}
                      onChange={(e) => updateField('trainingLocations', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black focus:bg-white font-semibold cursor-pointer"
                    >
                      <option value="Hybrid (Office + Remote Work)">Hybrid (Office + Remote Work)</option>
                      <option value="On-Premise / Corporate Office (Full-Time In-Person)">On-Premise / Corporate Office (Full-Time In-Person)</option>
                      <option value="Remote / Work From Home (100% Virtual)">Remote / Work From Home (100% Virtual)</option>
                      <option value="Plant / Industrial Manufacturing Facility">Plant / Industrial Manufacturing Facility</option>
                      <option value="Client Site / Field Deployment">Client Site / Field Deployment</option>
                      <option value="Multi-Location / Regional Branch Rotational">Multi-Location / Regional Branch Rotational</option>
                      <option value="Specialized Tech Park / Innovation Center">Specialized Tech Park / Innovation Center</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dbtSchemeOptIn}
                    onChange={(e) => updateField('dbtSchemeOptIn', e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black border-zinc-300 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">
                      Opt-in for Direct Benefit Transfer (DBT) Government Subsidy (₹4,500/month per candidate)
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      Enables automated portal reconciliation and direct govt subsidy disbursement.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* SECTION 3: Contract & Compliance Details */}
            {currentSection === 3 && (
              <div className="space-y-4">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 03: CONTRACT TEMPLATE & COMPLIANCE SETUP
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Legal framework parameters, compliance officer contact, and audit notes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Contract Letter Framework Template
                    </label>
                    <select
                      value={formData.contractTemplateType}
                      onChange={(e) => updateField('contractTemplateType', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs focus:outline-none focus:border-black font-semibold"
                    >
                      <option value="Standard National Apprenticeship Contract v3">Standard National Apprenticeship Contract v3</option>
                      <option value="Advanced Tech / Professional Services Contract">Advanced Tech / Professional Services Contract</option>
                      <option value="Industrial Trainee Standard Contract">Industrial Trainee Standard Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Compliance Officer Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.complianceOfficerName}
                      onChange={(e) => updateField('complianceOfficerName', e.target.value)}
                      placeholder="e.g. Vikas Malhotra"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Compliance Officer Email
                    </label>
                    <input
                      type="email"
                      value={formData.complianceOfficerEmail}
                      onChange={(e) => updateField('complianceOfficerEmail', e.target.value)}
                      placeholder="compliance@portal.com"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Special Compliance Instructions / Audit Notes
                    </label>
                    <textarea
                      rows={2}
                      value={formData.cnIssueNotes}
                      onChange={(e) => updateField('cnIssueNotes', e.target.value)}
                      placeholder="Any specific attendance logging requirements, shift patterns, or compliance prerequisites..."
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black font-medium resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: Document Verification & Submit */}
            {currentSection === 4 && (
              <div className="space-y-5">
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-mono">
                    SECTION 04: MANDATORY COMPLIANCE DOCUMENTS & SUBMIT
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Upload official corporate compliance files to establish legal apprenticeship quota and enable direct DBT claims.
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

                {/* Structured Document Slots */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-zinc-900">
                    Mandatory Enterprise Compliance Files (PDF / DOCX / JPG)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. COI */}
                    <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 hover:border-zinc-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-zinc-900">Certificate of Incorporation (COI)</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">Required</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">Proof of registered corporate entity.</p>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer p-2 rounded-xl bg-white border border-zinc-200">
                        <UploadCloud className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate">
                          {formData.companyDocs?.coiFileName || 'Attach COI PDF'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const name = e.target.files[0].name;
                              updateField('companyDocs', { ...(formData.companyDocs || {}), coiFileName: name });
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* 2. GST Certificate */}
                    <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 hover:border-zinc-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-zinc-900">Company PAN & GST Certificate</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">Required</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">Government tax and invoice reconciliation.</p>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer p-2 rounded-xl bg-white border border-zinc-200">
                        <UploadCloud className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate">
                          {formData.companyDocs?.gstFileName || 'Attach GST/PAN Document'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const name = e.target.files[0].name;
                              updateField('companyDocs', { ...(formData.companyDocs || {}), gstFileName: name });
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* 3. Authorized Signatory Letter */}
                    <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 hover:border-zinc-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-zinc-900">Signatory Authorization Letter</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">Required</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">Authorization to execute legal apprentice contracts.</p>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer p-2 rounded-xl bg-white border border-zinc-200">
                        <UploadCloud className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate">
                          {formData.companyDocs?.signatoryLetterFileName || 'Attach Signatory Letter'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const name = e.target.files[0].name;
                              updateField('companyDocs', { ...(formData.companyDocs || {}), signatoryLetterFileName: name });
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* 4. Bank Proof */}
                    <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 hover:border-zinc-300 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-zinc-900">Cancelled Cheque / Bank Proof</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-700 font-bold">Required</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">Bank details for DBT credits and payroll reconciliation.</p>
                      </div>

                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-black cursor-pointer p-2 rounded-xl bg-white border border-zinc-200">
                        <UploadCloud className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate">
                          {formData.companyDocs?.cancelledChequeFileName || 'Attach Cancelled Cheque'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const name = e.target.files[0].name;
                              updateField('companyDocs', { ...(formData.companyDocs || {}), cancelledChequeFileName: name });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

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
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500">Total Quota:</span>
                    <span className="font-extrabold text-zinc-900">{formData.requiredApprenticeCount} Candidates</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2">
                    <span className="text-zinc-500">Stipend Rate:</span>
                    <span className="font-bold text-zinc-900">₹{Number(formData.stipendPerApprentice).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Location Mode:</span>
                    <span className="text-zinc-800 font-medium">{formData.trainingLocations || 'Hybrid'}</span>
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
                    I verify all corporate compliance documents and apprentice quota requirements are authentic.
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

          {currentSection < 4 ? (
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
              <span>SUBMIT INTAKE APPLICATION ↗</span>
            </button>
          )}
        </div>

      </GlassCard>

    </div>
  );
};
