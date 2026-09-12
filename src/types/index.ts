export type UserRole = 'senior_admin' | 'junior_admin' | 'admin' | 'client';

export interface AdminPermissions {
  canApproveOrRejectClient: boolean;
  canDeleteSubmission: boolean;
  canViewUnmaskedSensitiveData: boolean; // Bank account & full Aadhaar
  canApproveDBTClaims: boolean;
  canModifyDBTPaymentStatus: boolean;
  canExportCSV: boolean;
  canViewSecurityAuditLogs: boolean;
  canReassignSPOC: boolean;
}

export const isSeniorAdmin = (role?: UserRole | string): boolean => {
  return role === 'senior_admin' || role === 'admin';
};

export const isJuniorAdmin = (role?: UserRole | string): boolean => {
  return role === 'junior_admin';
};

export const getAdminPermissions = (role?: UserRole | string): AdminPermissions => {
  if (role === 'junior_admin') {
    return {
      canApproveOrRejectClient: false,
      canDeleteSubmission: false,
      canViewUnmaskedSensitiveData: false,
      canApproveDBTClaims: false,
      canModifyDBTPaymentStatus: false,
      canExportCSV: false,
      canViewSecurityAuditLogs: false,
      canReassignSPOC: false,
    };
  }
  return {
    canApproveOrRejectClient: true,
    canDeleteSubmission: true,
    canViewUnmaskedSensitiveData: true,
    canApproveDBTClaims: true,
    canModifyDBTPaymentStatus: true,
    canExportCSV: true,
    canViewSecurityAuditLogs: true,
    canReassignSPOC: true,
  };
};

export type SubmissionStatus = 
  | 'draft' 
  | 'in_progress' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'abandoned';

export interface RequiredDocumentConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  mandatory: boolean;
  allowedExtensions?: string[];
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'image' | 'other';
  category: 'Aadhaar' | 'Education' | 'Bank Proof' | 'Resume' | 'Agreement' | 'GST' | 'PAN' | 'Cheque' | 'COI' | 'Signatory Letter' | 'General' | (string & {});
  sizeFormatted: string;
  dataUrl?: string;
  storageUrl?: string;
  textContent?: string;
  uploadedAt: string;
}

export interface CompanyOperationsSPOC {
  name: string;
  email: string;
  phone?: string;
  roleTitle?: string;
  assignedAt?: string;
}

export interface SPOCEmailLog {
  id: string;
  candidateId: string;
  candidateName: string;
  recipientEmail: string;
  recipientName?: string;
  spocType?: 'company' | 'client' | 'dual';
  companySpocEmail?: string;
  clientSpocEmail?: string;
  companyName: string;
  subject: string;
  documentNames: string[];
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Bounced';
  previewBodyHtml?: string;
}

export interface ApprenticeRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  aparId?: string;
  dob?: string;
  gender?: string;
  documentReceiveDate?: string;
  ojtDistrict?: string;
  ojtState?: string;
  tradeOrRole: string;
  qualification: string;
  onboardingDate: string;
  contractExpireDate?: string;
  enrollmentScheme?: 'NAPS' | 'NATS' | 'Others';
  stipendAmount: number;
  dbtEligibleAmount: number;
  contractStatus: 'Generated' | 'Signed' | 'Pending Verification';
  contractCode?: string;
  apprenticeCode?: string;
  attendanceRate: string;
  daysPresent?: number;
  totalWorkingDays?: number;
  status: 'Active' | 'Under Training' | 'Completed' | 'Terminated';
  socialCategory?: 'General' | 'OBC' | 'SC' | 'ST' | 'Minority';
  tradeType?: 'optional' | 'designated';
  assessmentStatus?: 'Assessed' | 'Pending' | 'Exempt';
  certificationStatus?: 'Certified' | 'Pending' | 'In Progress';
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  spocEmail?: string;
  spocName?: string;
  documents?: {
    aadhaarDoc?: UploadedDocument;
    educationDoc?: UploadedDocument;
    doc10th?: UploadedDocument;
    doc12th?: UploadedDocument;
    docGrad?: UploadedDocument;
    bankProofDoc?: UploadedDocument;
    resumeDoc?: UploadedDocument;
    photoDoc?: UploadedDocument;
    signatureDoc?: UploadedDocument;
    // NATS specific candidate documents
    panDoc?: UploadedDocument;
    allSemesterDoc?: UploadedDocument;
    casteCertDoc?: UploadedDocument;
    aparIdDoc?: UploadedDocument;
    aadhaarFile?: string;
    educationFile?: string;
    doc10thFile?: string;
    doc12thFile?: string;
    docGradFile?: string;
    bankProofFile?: string;
    resumeFile?: string;
    photoFile?: string;
    signatureFile?: string;
    panFile?: string;
    allSemesterFile?: string;
    casteCertFile?: string;
    aparIdFile?: string;
  };
}

export interface DBTClaimRecord {
  id: string;
  monthYear: string;
  claimDate: string;
  candidateCount: number;
  amountClaimed: number;
  amountSettled: number;
  status: 'Submitted to Portal' | 'Under Government Review' | 'Settled via PFMS' | 'Query Raised';
  utrReference?: string;
  remarks?: string;
}

export interface NAPSPortalRecord {
  id: string;
  candidateId?: string;
  candidateName?: string;
  candidateAadhaarName?: string;
  documentReceiveDate?: string;
  establishmentCode: string;
  location?: string;
  ojtState: string;
  ojtDistrict: string;
  dob?: string;
  gender?: string;
  socialCategory?: 'General' | 'OBC' | 'SC' | 'ST' | 'Minority';
  mobileNumber?: string;
  emailId?: string;
  stipend?: number;
  qualification?: string;
  curriculum?: string;
  apprenticeCode: string;
  contractCode: string;
  jurisdiction: 'central' | 'state' | string;
  contractStartDate: string;
  contractEndDate: string;
  contractType: 'optional' | 'designated' | string;
  payoutMonth: string; // e.g. AUG-2026, JUL-2026
  beneficiaryStatus: string; // e.g. created
  beneficiaryId: string; // masked, e.g. *********7799
  dbtProcessedToPfmsDate?: string; // e.g. 04-08-2026 or empty
  candidateDbtConsent: 'Yes' | 'No' | string;
  eKycStatus: 'Yes' | 'No' | string;
  establishmentSharedStatus: 'paid' | 'pending' | string;
  amount: number; // e.g. 1500.0
  paymentStatus: 'PAID' | 'UNPAID' | 'FAIL' | 'PENDING' | 'FAILED' | string;
  dbtStatus?: 'PAID' | 'UNPAID' | 'FAIL' | string;
  paymentFailureReason?: string;
  remarks?: string;
  createdAt?: string;
}

export interface ComplianceInvoiceRecord {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  status: 'SUBMITTED' | 'PAID' | 'PENDING' | string;
  paymentDate: string;
  remarks?: string;
}

export interface ComplianceActionItem {
  id: string;
  observation: string;
  actionRequired: string;
  owner: string;
  targetDate: string;
  status?: string;
  addedBy?: 'client' | 'admin';
}

export interface StipendPaymentRecord {
  id: string;
  month: string;                    // e.g. "JUNE", "JULY"
  year: string;                     // e.g. "2026"
  stipendPaidByEmployer: number;    // Amount client paid (Rs)
  datePaid: string;                 // Date client paid stipend (DD-MM-YYYY)
  dbtByGovt: number;               // Filled by admin after NAPS approval
  dbtReleaseDate: string;           // Filled by admin
  status: 'SUBMITTED' | 'UNDER PROCESS' | 'DBT RELEASED' | 'PENDING' | string;
  remarks: string;                  // Admin remarks
  submittedByClient: boolean;       // true = client entered this row
  submittedAt?: string;             // ISO timestamp when client submitted
  reviewedByAdmin?: boolean;
  reviewedAt?: string;
}

export interface ClientApprenticeMetrics {
  clientName: string;
  companyName: string;
  reportingMonth?: string; // e.g. JULY, 2026
  napsPortalId?: string; // e.g. E01232900003
  assignedCompanySpoc?: CompanyOperationsSPOC;
  sanctionedQuota?: number; // e.g. 27
  totalApprenticesEligible: number;
  currentOnboardedApprentices: number;
  remainingNumbersLeft: number;
  utilizationPercentage?: string;
  onboardedThisMonth?: number; // e.g. 3
  dbtClaimedLastMonth: number;
  dbtAllocationNotUtilized?: number; // e.g. 30000
  pendingAmountClaimable: number;
  governmentApproval?: {
    totalApproved: number;
    approvedThisMonth: number;
    pendingApproval: number;
  };
  lastMonthPayroll: {
    totalDisbursed: number;
    stipendProcessedCount: number;
    payoutDate: string;
    status: 'Processed' | 'Processing' | 'Pending Approval';
    breakdown: {
      baseStipend: number;
      dbtGovtShare: number;
      companyShare: number;
    };
  };
  contractLetters: {
    totalGenerated: number;
    signedCount: number;
    pendingSignature: number;
    lastGeneratedDate: string;
  };
  lastMonthCNRemarks: {
    remarkCode: string;
    summary: string;
    status: 'Clean / No Issues' | 'Action Required' | 'Resolved';
    auditDate: string;
    details: string;
  };
  lastMonthOnboardedList: ApprenticeRecord[];
  dbtClaimsHistory?: DBTClaimRecord[];
  spocEmailLogs?: SPOCEmailLog[];
  napsPortalRecords?: NAPSPortalRecord[];
  invoices?: ComplianceInvoiceRecord[];
  actionItems?: ComplianceActionItem[];
  stipendPayments?: StipendPaymentRecord[];
  establishmentDetails?: NAPSEstablishmentDetails;
  natsEstablishmentDetails?: NATSEstablishmentDetails;
}

export interface NAPSEstablishmentDetails {
  establishmentName: string;
  establishmentType: string;
  establishmentCategory?: string;
  pan: string;
  address: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  landline?: string;
  gstin: string;
  headOfEstablishment: string;
  headOfEstablishmentEmail?: string;
  designation: string;
  workingDays?: string;
  operatingStatesCount?: number;
  bankName?: string;
  beneficiaryName?: string;
  accountNumber?: string;
  ifscCode?: string;
  documents?: {
    panDoc?: UploadedDocument;
    gstDoc?: UploadedDocument;
    chequeDoc?: UploadedDocument;
    signatoryDoc?: UploadedDocument;
  };
}

export interface StructuredTrainingModuleConfig {
  learningObjectives?: string;
  trainingDuration?: string;
  departmentWiseExposure?: string;
  skillsToBeDeveloped?: string;
  monthlyTrainingBreakup?: string;
  supervisorOrOfficerDetails?: string;
  moduleDocument?: UploadedDocument;
}

export interface NATSEstablishmentDetails {
  nameAndDesignation: string;
  mobileNumber: string;
  officialEmailId: string;
  documents?: {
    panDoc?: UploadedDocument;
    tanDoc?: UploadedDocument;
    gstDoc?: UploadedDocument;
    itrDoc?: UploadedDocument;
    coiDoc?: UploadedDocument;
    epfoEsicDoc?: UploadedDocument;
    chequeDoc?: UploadedDocument;
    trainingModuleDoc?: UploadedDocument;
  };
  structuredTrainingModule?: StructuredTrainingModuleConfig;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
  apprenticeMetrics?: ClientApprenticeMetrics;
}

export interface IntakeCompanyDocs {
  coiFileName?: string;
  coiDoc?: UploadedDocument;
  gstFileName?: string;
  gstDoc?: UploadedDocument;
  signatoryLetterFileName?: string;
  signatoryDoc?: UploadedDocument;
  cancelledChequeFileName?: string;
  chequeDoc?: UploadedDocument;
  epfoRegistrationCode?: string;
  // Additional documents for NAPS / NATS
  panFileName?: string;
  panDoc?: UploadedDocument;
  tanFileName?: string;
  tanDoc?: UploadedDocument;
  itrFileName?: string;
  itrDoc?: UploadedDocument;
  epfoEsicFileName?: string;
  epfoEsicDoc?: UploadedDocument;
  trainingModuleFileName?: string;
  trainingModuleDoc?: UploadedDocument;
  dynamicDocs?: Record<string, UploadedDocument>;
}

export interface IntakeFormData {
  // Enrollment Scheme for Onboarding
  enrollmentScheme?: 'NAPS' | 'NATS';

  // Step 1: Company & Apprentice Requirement
  companyName: string;
  gstinNumber?: string;
  website?: string;
  industry: string;
  teamSize?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country?: string;
  targetAudience?: string;
  requiredApprenticeCount?: number;
  tradesRequired?: string[];
  servicesNeeded?: string[];
  primaryObjective?: string;
  keyPainPoints?: string;

  // Establishment Registration Details (Official NAPS/NATS Register)
  establishmentType?: string;
  establishmentCategory?: string;
  panNumber?: string;
  registeredAddress?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  landlineNumber?: string;

  // Head of Establishment Details
  headOfEstablishmentName?: string;
  headOfEstablishmentEmail?: string;
  headOfEstablishmentDesignation?: string;

  // Designated SPOC Notification Details (Section 3)
  spocFullName?: string;
  spocEmailAddress?: string;
  spocPhone?: string;
  spocRoleTitle?: string;

  // Step 2: Payroll, Timeline & Budget
  budgetRange?: string;
  timeline?: string;
  stipendPerApprentice?: number;
  dbtSchemeOptIn?: boolean;
  priorityLevel?: 'Standard' | 'Urgent' | 'Flexible';
  currentTechStack?: string;
  specialRequirements?: string;
  proposedJoiningDate?: string;
  trainingLocations?: string;
  operationalStates?: string;

  // Step 3: Contract & Compliance Details
  contractTemplateType?: string;
  complianceOfficerName?: string;
  complianceOfficerEmail?: string;
  hasPreviousCNIssues?: boolean;
  cnIssueNotes?: string;

  // Step 4: Documents & Final Verification
  companyDocs?: IntakeCompanyDocs;
  requiredDocuments?: RequiredDocumentConfig[];
  hasBrandGuidelines?: boolean;
  projectDescription?: string;
  uploadedFileName?: string;
  attachedDocsName?: string;
  specialInstructions?: string;
  // NATS Structured Training Module Details
  structuredTrainingModule?: StructuredTrainingModuleConfig;

  agreedToTerms: boolean;
}

export interface FormSubmission {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  company_name: string;
  assigned_company_spoc?: CompanyOperationsSPOC;
  status: SubmissionStatus;
  current_step: number;
  total_steps: number;
  responses: Partial<IntakeFormData>;
  started_at: string;
  last_active_at: string;
  submitted_at?: string | null;
  time_spent_seconds: number;
  completion_percentage: number;
  notes?: string;
  candidates?: ApprenticeRecord[];
  dbt_claims?: DBTClaimRecord[];
  spoc_logs?: SPOCEmailLog[];
  naps_records?: NAPSPortalRecord[];
  invoices?: ComplianceInvoiceRecord[];
  action_items?: ComplianceActionItem[];
  stipend_payments?: StipendPaymentRecord[];
  reporting_month?: string;
  naps_portal_id?: string;
  sanctioned_quota?: number;
  dbt_allocation_not_utilized?: number;
  establishment_details?: NAPSEstablishmentDetails;
  nats_establishment_details?: NATSEstablishmentDetails;
}

export interface FunnelEvent {
  id: string;
  submission_id?: string;
  client_id?: string;
  event_type: 'form_started' | 'step_reached' | 'step_completed' | 'abandoned' | 'submitted';
  step_number: number;
  step_name: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface LoginActivityLog {
  id: string;
  user_id?: string;
  email: string;
  role_attempted: UserRole;
  status: 'success' | 'failed';
  failure_reason?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}
