export type UserRole = 'admin' | 'client';

export type SubmissionStatus = 
  | 'draft' 
  | 'in_progress' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'rejected' 
  | 'abandoned';

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'image' | 'other';
  category: 'Aadhaar' | 'Education' | 'Bank Proof' | 'Resume' | 'COI' | 'GST' | 'Signatory Letter' | 'Cheque' | 'General';
  sizeFormatted: string;
  dataUrl?: string;
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
  tradeOrRole: string;
  qualification: string;
  onboardingDate: string;
  stipendAmount: number;
  dbtEligibleAmount: number;
  contractStatus: 'Generated' | 'Signed' | 'Pending Verification';
  attendanceRate: string;
  daysPresent?: number;
  totalWorkingDays?: number;
  status: 'Active' | 'Under Training' | 'Completed' | 'Terminated';
  bankAccountNumber?: string;
  ifscCode?: string;
  spocEmail?: string;
  spocName?: string;
  documents?: {
    aadhaarDoc?: UploadedDocument;
    educationDoc?: UploadedDocument;
    bankProofDoc?: UploadedDocument;
    resumeDoc?: UploadedDocument;
    aadhaarFile?: string;
    educationFile?: string;
    bankProofFile?: string;
    resumeFile?: string;
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

export interface ClientApprenticeMetrics {
  clientName: string;
  companyName: string;
  assignedCompanySpoc?: CompanyOperationsSPOC;
  totalApprenticesEligible: number;
  currentOnboardedApprentices: number;
  remainingNumbersLeft: number;
  dbtClaimedLastMonth: number;
  pendingAmountClaimable: number;
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
}

export interface IntakeFormData {
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

  // Step 3: Contract & Compliance Details
  contractTemplateType?: string;
  complianceOfficerName?: string;
  complianceOfficerEmail?: string;
  hasPreviousCNIssues?: boolean;
  cnIssueNotes?: string;

  // Step 4: Documents & Final Verification
  companyDocs?: IntakeCompanyDocs;
  hasBrandGuidelines?: boolean;
  projectDescription?: string;
  uploadedFileName?: string;
  attachedDocsName?: string;
  specialInstructions?: string;
  additionalNotes?: string;
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
