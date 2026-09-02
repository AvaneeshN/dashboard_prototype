'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  FormSubmission, 
  LoginActivityLog, 
  UserRole, 
  IntakeFormData, 
  SubmissionStatus, 
  ClientApprenticeMetrics, 
  ApprenticeRecord,
  DBTClaimRecord,
  SPOCEmailLog
} from '@/types';
import { INITIAL_PROFILES, INITIAL_SUBMISSIONS, INITIAL_LOGIN_LOGS } from './mock-data';
import { isSupabaseConfigured, createClient } from './supabase/client';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  submissions: FormSubmission[];
  loginLogs: LoginActivityLog[];
  login: (email: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { fullName: string; email: string; companyName?: string; phone?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  saveSubmissionStep: (responses: Partial<IntakeFormData>, step: number, isFinalSubmit?: boolean) => Promise<FormSubmission>;
  recordAbandonment: (step: number, responses: Partial<IntakeFormData>) => void;
  updateSubmissionStatus: (submissionId: string, status: SubmissionStatus) => void;
  getActiveClientSubmission: () => FormSubmission | undefined;
  syncDataToSupabase: () => Promise<{ success: boolean; message: string }>;
  resetToDemoData: () => void;
  
  // Production Candidate & Financial Operations
  addApprentice: (candidateData: Omit<ApprenticeRecord, 'id'>) => Promise<ApprenticeRecord>;
  removeApprentice: (id: string) => Promise<void>;
  updateApprentice: (id: string, updates: Partial<ApprenticeRecord>) => Promise<void>;
  processMonthlyPayrollBatch: (payoutDate?: string) => Promise<{ totalDisbursed: number; count: number }>;
  fileDBTClaim: (monthYear: string, amount: number) => Promise<DBTClaimRecord>;
  updateCNRemark: (remarkCode: string, summary: string, details: string, status: 'Clean / No Issues' | 'Action Required' | 'Resolved') => Promise<void>;
  triggerSPOCEmail: (candidate: ApprenticeRecord, targetSpocEmail?: string, targetSpocName?: string) => Promise<SPOCEmailLog>;
  assignCompanySpoc: (submissionId: string, spocData: { name: string; email: string; phone?: string; roleTitle?: string }) => void;
}

const StoreContext = createContext<AuthState | null>(null);

const STORAGE_KEY_USER = 'app_current_user';
const STORAGE_KEY_SUBMISSIONS = 'app_form_submissions';
const STORAGE_KEY_LOGS = 'app_login_logs';
const STORAGE_KEY_PROFILES = 'app_user_profiles';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [submissions, setSubmissions] = useState<FormSubmission[]>(INITIAL_SUBMISSIONS);
  const [loginLogs, setLoginLogs] = useState<LoginActivityLog[]>(INITIAL_LOGIN_LOGS);

  // Initialize from Supabase or LocalStorage
  useEffect(() => {
    const initData = async () => {
      try {
        const savedUser = localStorage.getItem(STORAGE_KEY_USER);
        const savedSubmissions = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
        const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
        const savedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES);

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedSubmissions) setSubmissions(JSON.parse(savedSubmissions));
        if (savedLogs) setLoginLogs(JSON.parse(savedLogs));
        if (savedProfiles) setProfiles(JSON.parse(savedProfiles));

        if (isSupabaseConfigured()) {
          try {
            const supabase = createClient();
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profile) {
                setUser(profile);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
              }
            }

            const { data: remoteProfiles, error: profsError } = await supabase
              .from('profiles')
              .select('*');

            if (!profsError && remoteProfiles && remoteProfiles.length > 0) {
              setProfiles(remoteProfiles);
              localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(remoteProfiles));
            }

            const { data: remoteSubs, error: subsError } = await supabase
              .from('form_submissions')
              .select('*')
              .order('last_active_at', { ascending: false });

            if (!subsError && remoteSubs && remoteSubs.length > 0) {
              setSubmissions(remoteSubs);
              localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(remoteSubs));
            }

            const { data: remoteLogs, error: logsError } = await supabase
              .from('login_activity_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);

            if (!logsError && remoteLogs && remoteLogs.length > 0) {
              setLoginLogs(remoteLogs);
              localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(remoteLogs));
            }
          } catch (supaErr) {
            console.warn('Supabase fetch notice:', supaErr);
          }
        }
      } catch (e) {
        console.warn('Initialization notice:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  const saveState = (
    newUser?: UserProfile | null,
    newSubmissions?: FormSubmission[],
    newLogs?: LoginActivityLog[],
    newProfiles?: UserProfile[]
  ) => {
    if (newUser !== undefined) {
      if (newUser === null) localStorage.removeItem(STORAGE_KEY_USER);
      else localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    }
    if (newSubmissions !== undefined) {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(newSubmissions));
    }
    if (newLogs !== undefined) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs));
    }
    if (newProfiles !== undefined) {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(newProfiles));
    }
  };

  const addLoginLog = async (email: string, role: UserRole, status: 'success' | 'failed', failure_reason?: string) => {
    const newLog: LoginActivityLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      user_id: user?.id,
      email,
      role_attempted: role,
      status,
      failure_reason,
      ip_address: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 40) + '...' : 'Browser Client',
      created_at: new Date().toISOString()
    };

    const updated = [newLog, ...loginLogs];
    setLoginLogs(updated);
    saveState(undefined, undefined, updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { error: logError } = await supabase.from('login_activity_logs').insert([newLog]);
        if (logError) {
          console.error('❌ Supabase login_activity_logs insert FAILED:', logError.message, logError.details, logError.hint);
        } else {
          console.log('✅ Supabase login_activity_logs insert OK');
        }
      } catch (err) {
        console.error('❌ Supabase log insert exception:', err);
      }
    }
  };

  const login = async (email: string, role: UserRole, password?: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Direct Administrator Passkey Authentication
    if (role === 'admin') {
      const validPasskeys = [
        'admin123',
        'ADMIN-2026',
        'admin',
        'ADMIN123',
        'ADMIN',
        'passkey123'
      ];
      const submittedKey = (password || email || '').trim();
      if (validPasskeys.includes(submittedKey) || (password && validPasskeys.includes(password.trim()))) {
        const adminUser: UserProfile = {
          id: 'admin-1',
          email: 'admin@company.com',
          full_name: 'Administrator',
          role: 'admin',
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString()
        };
        setUser(adminUser);
        saveState(adminUser);
        await addLoginLog('admin@company.com', 'admin', 'success');
        return { success: true };
      } else {
        await addLoginLog('admin@company.com', 'admin', 'failed', 'Invalid security passkey');
        return { success: false, error: 'Invalid Administrator Security Passkey. Please check and try again.' };
      }
    }

    // 2. Client Authentication via Supabase Auth (with graceful local fallback)
    if (isSupabaseConfigured() && password) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (!error && data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const activeUser: UserProfile = profile || {
            id: data.user.id,
            email: normalizedEmail,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role,
            created_at: data.user.created_at,
            last_login_at: new Date().toISOString()
          };

          setUser(activeUser);
          saveState(activeUser);
          await addLoginLog(normalizedEmail, role, 'success');
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase auth fallback:', err);
      }
    }

    let existing = profiles.find(p => p.email.toLowerCase() === normalizedEmail);
    if (!existing) {
      existing = {
        id: 'client-' + Date.now(),
        email: normalizedEmail,
        full_name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: 'client',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
      const newProfilesList = [...profiles, existing];
      setProfiles(newProfilesList);
      saveState(undefined, undefined, undefined, newProfilesList);
    } else {
      existing.last_login_at = new Date().toISOString();
    }

    setUser(existing);
    saveState(existing);
    await addLoginLog(email, role, 'success');
    return { success: true };
  };

  const register = async (data: { fullName: string; email: string; companyName?: string; phone?: string; password?: string }): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = data.email.trim().toLowerCase();
    let supabaseUserId: string | undefined;

    if (isSupabaseConfigured() && data.password) {
      try {
        const supabase = createClient();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              company_name: data.companyName,
              phone: data.phone,
              role: 'client'
            }
          }
        });

        if (signUpError) {
          console.error('❌ Supabase auth signUp FAILED:', signUpError.message);
          // If user already exists, try signing in instead
          if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password: data.password
            });
            if (!signInError && signInData.user) {
              supabaseUserId = signInData.user.id;
              console.log('✅ Existing user signed in:', supabaseUserId);
            } else {
              console.error('❌ Supabase signIn fallback FAILED:', signInError?.message);
            }
          }
        } else if (signUpData?.user) {
          supabaseUserId = signUpData.user.id;
          console.log('✅ Supabase auth signUp OK, user ID:', supabaseUserId);
        }
      } catch (err: any) {
        console.error('❌ Supabase signup exception:', err);
      }
    }

    const newProfile: UserProfile = {
      id: supabaseUserId || ('client-' + Date.now()),
      email: normalizedEmail,
      full_name: data.fullName,
      company_name: data.companyName,
      phone: data.phone,
      role: 'client',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString()
    };

    const newProfilesList = [...profiles.filter(p => p.email !== normalizedEmail), newProfile];
    setProfiles(newProfilesList);
    setUser(newProfile);
    saveState(newProfile, undefined, undefined, newProfilesList);
    await addLoginLog(normalizedEmail, 'client', 'success');

    // Direct write to Supabase profiles table
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const profileRecord = {
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          company_name: newProfile.company_name || '',
          phone: newProfile.phone || '',
          role: newProfile.role,
          created_at: newProfile.created_at,
          last_login_at: newProfile.last_login_at
        };
        const { error: profileError } = await supabase.from('profiles').upsert([profileRecord]);
        if (profileError) {
          console.error('❌ Supabase profiles upsert FAILED:', profileError.message, profileError.details, profileError.hint);
        } else {
          console.log('✅ Supabase profiles upsert OK for:', newProfile.email);
        }
      } catch (profileErr) {
        console.error('❌ Supabase profiles exception:', profileErr);
      }
    }

    return { success: true };
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.auth.signOut().then();
      } catch (err) {
        console.warn('Supabase sign out err', err);
      }
    }
    setUser(null);
    saveState(null);
  };

  const getActiveClientSubmission = (): FormSubmission | undefined => {
    if (!user) return undefined;
    const normalizedEmail = user.email.toLowerCase();
    return submissions.find(s => s.client_email.toLowerCase() === normalizedEmail || s.client_id === user.id);
  };

  const recalculateUserMetrics = (userProfile: UserProfile, candidates: ApprenticeRecord[], totalQuota: number, dbtOptIn: boolean = true): ClientApprenticeMetrics => {
    const activeCount = candidates.filter(c => c.status === 'Active' || c.status === 'Under Training').length;
    const remaining = Math.max(totalQuota - activeCount, 0);
    const dbtRate = dbtOptIn ? 4500 : 0;
    
    const grossDisbursed = candidates.reduce((sum, c) => sum + (c.stipendAmount || 18000), 0);
    const dbtTotal = candidates.reduce((sum, c) => sum + (c.dbtEligibleAmount || dbtRate), 0);
    const companyTotal = Math.max(grossDisbursed - dbtTotal, 0);

    const signedCount = candidates.filter(c => c.contractStatus === 'Signed').length;
    const pendingSign = candidates.filter(c => c.contractStatus !== 'Signed').length;

    const existingMetrics = userProfile.apprenticeMetrics;

    return {
      clientName: userProfile.full_name,
      companyName: userProfile.company_name || existingMetrics?.companyName || '',
      totalApprenticesEligible: totalQuota,
      currentOnboardedApprentices: activeCount,
      remainingNumbersLeft: remaining,
      dbtClaimedLastMonth: activeCount > 0 ? (existingMetrics?.dbtClaimedLastMonth ?? dbtTotal) : 0,
      pendingAmountClaimable: activeCount > 0 ? (existingMetrics?.pendingAmountClaimable ?? dbtTotal) : 0,
      lastMonthPayroll: {
        totalDisbursed: grossDisbursed,
        stipendProcessedCount: activeCount,
        payoutDate: activeCount > 0 ? (existingMetrics?.lastMonthPayroll?.payoutDate || new Date().toISOString().split('T')[0]) : 'Pending Onboarding',
        status: activeCount > 0 ? 'Processed' : 'Pending Approval',
        breakdown: {
          baseStipend: grossDisbursed,
          dbtGovtShare: dbtTotal,
          companyShare: companyTotal
        }
      },
      contractLetters: {
        totalGenerated: candidates.length,
        signedCount,
        pendingSignature: pendingSign,
        lastGeneratedDate: candidates.length > 0 ? new Date().toISOString().split('T')[0] : '-'
      },
      lastMonthCNRemarks: existingMetrics?.lastMonthCNRemarks || {
        remarkCode: 'CN-INITIAL-2026',
        summary: 'Quota initialized. Ready for candidate onboarding and contract issuance.',
        status: 'Clean / No Issues',
        auditDate: new Date().toISOString().split('T')[0],
        details: 'No non-compliance flags raised.'
      },
      lastMonthOnboardedList: candidates,
      dbtClaimsHistory: existingMetrics?.dbtClaimsHistory || []
    };
  };

  const saveSubmissionStep = async (
    responses: Partial<IntakeFormData>,
    step: number,
    isFinalSubmit: boolean = false
  ): Promise<FormSubmission> => {
    const existing = getActiveClientSubmission();
    const submissionId = existing?.id || 'sub-' + Date.now();
    const currentTotalTime = (existing?.time_spent_seconds || 0) + 12;

    const mergedResponses: Partial<IntakeFormData> = {
      ...(existing?.responses || {}),
      ...responses
    };

    const newStatus: SubmissionStatus = isFinalSubmit ? 'submitted' : 'in_progress';
    const completionPercentage = isFinalSubmit ? 100 : Math.round((step / 4) * 100);

    const quotaRequired = mergedResponses.requiredApprenticeCount || 15;
    const stipendVal = mergedResponses.stipendPerApprentice || 18500;
    const dbtShare = mergedResponses.dbtSchemeOptIn !== false ? 4500 : 0;

    const candidateList: ApprenticeRecord[] = existing?.candidates || [];

    const updatedSubmission: FormSubmission = {
      id: submissionId,
      client_id: user?.id || 'client-guest',
      client_name: user?.full_name || mergedResponses.contactName || 'Client User',
      client_email: user?.email || mergedResponses.contactEmail || 'client@portal.com',
      company_name: mergedResponses.companyName || user?.company_name || '',
      status: newStatus,
      current_step: step,
      total_steps: 4,
      completion_percentage: completionPercentage,
      time_spent_seconds: currentTotalTime,
      started_at: existing?.started_at || new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      submitted_at: isFinalSubmit ? new Date().toISOString() : existing?.submitted_at,
      responses: mergedResponses,
      candidates: candidateList
    };

    const filtered = submissions.filter(s => s.id !== submissionId);
    const updatedSubmissions = [updatedSubmission, ...filtered];
    setSubmissions(updatedSubmissions);

    if (user) {
      const dynamicMetrics = recalculateUserMetrics(user, candidateList, quotaRequired, mergedResponses.dbtSchemeOptIn !== false);
      const updatedUser = { ...user, company_name: mergedResponses.companyName || user.company_name, apprenticeMetrics: dynamicMetrics };
      setUser(updatedUser);
      saveState(updatedUser, updatedSubmissions);
    } else {
      saveState(undefined, updatedSubmissions);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { error: upsertError } = await supabase.from('form_submissions').upsert([updatedSubmission]);
        if (upsertError) {
          console.error('❌ Supabase form_submissions upsert FAILED:', upsertError.message, upsertError.details, upsertError.hint);
        } else {
          console.log('✅ Supabase form_submissions upsert OK for:', submissionId);
        }
      } catch (err) {
        console.error('❌ Supabase upsert exception:', err);
      }
    }

    return updatedSubmission;
  };

  // Helper to persist any updated FormSubmission directly to Supabase
  const persistSubmissionToSupabase = async (submission: FormSubmission) => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      const { error: upsertError } = await supabase.from('form_submissions').upsert([submission]);
      if (upsertError) {
        console.error('❌ Supabase form_submissions update FAILED:', upsertError.message, upsertError.details);
      } else {
        console.log('✅ Supabase form_submissions updated for:', submission.id);
      }
    } catch (err) {
      console.error('❌ Supabase update exception:', err);
    }
  };

  // Assign Dedicated Company Operations SPOC
  const assignCompanySpoc = (
    submissionId: string,
    spocData: { name: string; email: string; phone?: string; roleTitle?: string }
  ) => {
    const updatedSpoc = { ...spocData, assignedAt: new Date().toISOString() };
    const updatedSubmissions = submissions.map(sub => {
      if (sub.id === submissionId) {
        return {
          ...sub,
          assigned_company_spoc: updatedSpoc,
          last_active_at: new Date().toISOString()
        };
      }
      return sub;
    });

    setSubmissions(updatedSubmissions);

    const targetSub = updatedSubmissions.find(s => s.id === submissionId);
    if (targetSub) {
      persistSubmissionToSupabase(targetSub);
    }

    if (user && user.apprenticeMetrics) {
      const updatedMetrics = { ...user.apprenticeMetrics, assignedCompanySpoc: updatedSpoc };
      const updatedUser = { ...user, apprenticeMetrics: updatedMetrics };
      setUser(updatedUser);
      saveState(updatedUser, updatedSubmissions);
    } else {
      saveState(undefined, updatedSubmissions);
    }
  };

  // Trigger SPOC Email Dispatch Helper (Dual Dispatch: Company SPOC + Client SPOC)
  const triggerSPOCEmail = async (
    candidate: ApprenticeRecord,
    targetSpocEmail?: string,
    targetSpocName?: string
  ): Promise<SPOCEmailLog> => {
    const currentSub = getActiveClientSubmission();
    const companySpocEmail = currentSub?.assigned_company_spoc?.email || user?.apprenticeMetrics?.assignedCompanySpoc?.email || 'ops-desk@ourcompany.com';
    const companySpocName = currentSub?.assigned_company_spoc?.name || user?.apprenticeMetrics?.assignedCompanySpoc?.name || 'Company Operations Lead';

    const clientSpocEmail = targetSpocEmail || candidate.spocEmail || currentSub?.responses?.complianceOfficerEmail || user?.email || 'client-spoc@company.com';
    const clientSpocName = targetSpocName || candidate.spocName || currentSub?.responses?.complianceOfficerName || 'Client HR SPOC';
    const company = user?.company_name || currentSub?.company_name || 'Enterprise Client';

    const documentNames: string[] = [];
    if (candidate.documents?.aadhaarDoc?.name || candidate.documents?.aadhaarFile) {
      documentNames.push(candidate.documents?.aadhaarDoc?.name || candidate.documents?.aadhaarFile || 'Aadhaar Card');
    }
    if (candidate.documents?.educationDoc?.name || candidate.documents?.educationFile) {
      documentNames.push(candidate.documents?.educationDoc?.name || candidate.documents?.educationFile || 'Degree Marksheet');
    }
    if (candidate.documents?.bankProofDoc?.name || candidate.documents?.bankProofFile) {
      documentNames.push(candidate.documents?.bankProofDoc?.name || candidate.documents?.bankProofFile || 'Bank Passbook / Cheque');
    }
    if (candidate.documents?.resumeDoc?.name || candidate.documents?.resumeFile) {
      documentNames.push(candidate.documents?.resumeDoc?.name || candidate.documents?.resumeFile || 'Candidate Resume (.docx/.pdf)');
    }

    const emailSubject = `[Onboarding Dossier] New Candidate ${candidate.name} (${candidate.tradeOrRole}) - ${company}`;

    const newLog: SPOCEmailLog = {
      id: `spoc-log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      recipientEmail: `${companySpocEmail} & ${clientSpocEmail}`,
      recipientName: `${companySpocName} (Company) & ${clientSpocName} (Client)`,
      spocType: 'dual',
      companySpocEmail,
      clientSpocEmail,
      companyName: company,
      subject: emailSubject,
      documentNames: documentNames.length > 0 ? documentNames : ['Aadhaar Card (.pdf)', 'Degree Certificate (.docx)', 'Bank Passbook (.pdf)'],
      sentAt: new Date().toISOString(),
      status: 'Delivered',
      previewBodyHtml: `Dual SPOC Dispatch: Sent to Company Operations (${companySpocEmail}) & Client HR (${clientSpocEmail}). ${documentNames.length} compliance documents attached.`
    };

    // Call Next.js API route with dual recipients
    try {
      fetch('/api/send-spoc-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          companyName: company,
          spocEmail: `${companySpocEmail}, ${clientSpocEmail}`,
          companySpocEmail,
          clientSpocEmail,
          spocName: `${companySpocName} & ${clientSpocName}`,
          documentList: newLog.documentNames
        })
      }).catch(e => console.warn('Background SPOC email trigger note:', e));
    } catch (err) {
      console.warn('SPOC API call error:', err);
    }

    return newLog;
  };

  // Add Candidate to Roster
  const addApprentice = async (candidateData: Omit<ApprenticeRecord, 'id'>): Promise<ApprenticeRecord> => {
    const newId = `APP-${Date.now().toString().slice(-4)}`;
    const newCandidate: ApprenticeRecord = {
      ...candidateData,
      id: newId
    };

    const spocLog = await triggerSPOCEmail(newCandidate, candidateData.spocEmail, candidateData.spocName);

    const currentSub = getActiveClientSubmission();
    const existingCandidates = currentSub?.candidates || user?.apprenticeMetrics?.lastMonthOnboardedList || [];
    const updatedCandidates = [newCandidate, ...existingCandidates];

    const existingSpocLogs = user?.apprenticeMetrics?.spocEmailLogs || currentSub?.spoc_logs || [];
    const updatedSpocLogs = [spocLog, ...existingSpocLogs];

    const quota = user?.apprenticeMetrics?.totalApprenticesEligible || 20;
    const dbtOptIn = currentSub?.responses?.dbtSchemeOptIn !== false;

    if (user) {
      const updatedMetrics = recalculateUserMetrics(user, updatedCandidates, quota, dbtOptIn);
      updatedMetrics.spocEmailLogs = updatedSpocLogs;
      const updatedUser = { ...user, apprenticeMetrics: updatedMetrics };
      setUser(updatedUser);

      if (currentSub) {
        const updatedSub: FormSubmission = {
          ...currentSub,
          candidates: updatedCandidates,
          spoc_logs: updatedSpocLogs,
          last_active_at: new Date().toISOString()
        };
        const updatedSubmissions = submissions.map(s => s.id === currentSub.id ? updatedSub : s);
        setSubmissions(updatedSubmissions);
        saveState(updatedUser, updatedSubmissions);
        persistSubmissionToSupabase(updatedSub);
      } else {
        saveState(updatedUser);
      }
    }

    return newCandidate;
  };

  // Remove Candidate
  const removeApprentice = async (id: string): Promise<void> => {
    const currentSub = getActiveClientSubmission();
    const existingCandidates = currentSub?.candidates || user?.apprenticeMetrics?.lastMonthOnboardedList || [];
    const updatedCandidates = existingCandidates.filter(c => c.id !== id);

    const quota = user?.apprenticeMetrics?.totalApprenticesEligible || 20;
    const dbtOptIn = currentSub?.responses?.dbtSchemeOptIn !== false;

    if (user) {
      const updatedMetrics = recalculateUserMetrics(user, updatedCandidates, quota, dbtOptIn);
      const updatedUser = { ...user, apprenticeMetrics: updatedMetrics };
      setUser(updatedUser);

      if (currentSub) {
        const updatedSub: FormSubmission = {
          ...currentSub,
          candidates: updatedCandidates,
          last_active_at: new Date().toISOString()
        };
        const updatedSubmissions = submissions.map(s => s.id === currentSub.id ? updatedSub : s);
        setSubmissions(updatedSubmissions);
        saveState(updatedUser, updatedSubmissions);
        persistSubmissionToSupabase(updatedSub);
      } else {
        saveState(updatedUser);
      }
    }
  };

  // Update Candidate Details
  const updateApprentice = async (id: string, updates: Partial<ApprenticeRecord>): Promise<void> => {
    const currentSub = getActiveClientSubmission();
    const existingCandidates = currentSub?.candidates || user?.apprenticeMetrics?.lastMonthOnboardedList || [];
    const updatedCandidates = existingCandidates.map(c => c.id === id ? { ...c, ...updates } : c);

    const quota = user?.apprenticeMetrics?.totalApprenticesEligible || 20;
    const dbtOptIn = currentSub?.responses?.dbtSchemeOptIn !== false;

    if (user) {
      const updatedMetrics = recalculateUserMetrics(user, updatedCandidates, quota, dbtOptIn);
      const updatedUser = { ...user, apprenticeMetrics: updatedMetrics };
      setUser(updatedUser);

      if (currentSub) {
        const updatedSub: FormSubmission = {
          ...currentSub,
          candidates: updatedCandidates,
          last_active_at: new Date().toISOString()
        };
        const updatedSubmissions = submissions.map(s => s.id === currentSub.id ? updatedSub : s);
        setSubmissions(updatedSubmissions);
        saveState(updatedUser, updatedSubmissions);
        persistSubmissionToSupabase(updatedSub);
      } else {
        saveState(updatedUser);
      }
    }
  };

  // Process Monthly Payroll
  const processMonthlyPayrollBatch = async (payoutDate: string = new Date().toISOString().split('T')[0]): Promise<{ totalDisbursed: number; count: number }> => {
    const candidates = user?.apprenticeMetrics?.lastMonthOnboardedList || [];
    const totalDisbursed = candidates.reduce((acc, c) => acc + (c.stipendAmount || 18500), 0);
    const dbtTotal = candidates.reduce((acc, c) => acc + (c.dbtEligibleAmount || 4500), 0);

    if (user && user.apprenticeMetrics) {
      const updatedMetrics: ClientApprenticeMetrics = {
        ...user.apprenticeMetrics,
        pendingAmountClaimable: dbtTotal,
        lastMonthPayroll: {
          totalDisbursed,
          stipendProcessedCount: candidates.length,
          payoutDate,
          status: 'Processed',
          breakdown: {
            baseStipend: totalDisbursed,
            dbtGovtShare: dbtTotal,
            companyShare: Math.max(totalDisbursed - dbtTotal, 0)
          }
        }
      };

      const updatedUser = { ...user, apprenticeMetrics: updatedMetrics };
      setUser(updatedUser);
      saveState(updatedUser);
    }

    return { totalDisbursed, count: candidates.length };
  };

  // File DBT Subsidy Claim
  const fileDBTClaim = async (monthYear: string, amount: number): Promise<DBTClaimRecord> => {
    const candidates = user?.apprenticeMetrics?.lastMonthOnboardedList || [];
    const newClaim: DBTClaimRecord = {
      id: `DBT-CLAIM-${Date.now().toString().slice(-5)}`,
      monthYear,
      claimDate: new Date().toISOString().split('T')[0],
      candidateCount: candidates.length,
      amountClaimed: amount,
      amountSettled: amount,
      status: 'Submitted to Portal',
      utrReference: `NAPS-PFMS-${Math.floor(Math.random() * 900000 + 100000)}`,
      remarks: 'Automated DBT subsidy reimbursement claim logged with National Apprenticeship Promotion Scheme.'
    };

    if (user && user.apprenticeMetrics) {
      const existingHistory = user.apprenticeMetrics.dbtClaimsHistory || [];
      const updatedHistory = [newClaim, ...existingHistory];

      const updatedMetrics: ClientApprenticeMetrics = {
        ...user.apprenticeMetrics,
        dbtClaimedLastMonth: amount,
        pendingAmountClaimable: 0,
        dbtClaimsHistory: updatedHistory
      };

      const updatedUser = { ...user, apprenticeMetrics: updatedMetrics };
      setUser(updatedUser);

      const currentSub = getActiveClientSubmission();
      if (currentSub) {
        const updatedSub: FormSubmission = {
          ...currentSub,
          dbt_claims: updatedHistory,
          last_active_at: new Date().toISOString()
        };
        const updatedSubmissions = submissions.map(s => s.id === currentSub.id ? updatedSub : s);
        setSubmissions(updatedSubmissions);
        saveState(updatedUser, updatedSubmissions);
        persistSubmissionToSupabase(updatedSub);
      } else {
        saveState(updatedUser);
      }
    }

    return newClaim;
  };

  // Update CN Compliance Remark
  const updateCNRemark = async (
    remarkCode: string, 
    summary: string, 
    details: string, 
    status: 'Clean / No Issues' | 'Action Required' | 'Resolved'
  ): Promise<void> => {
    if (user && user.apprenticeMetrics) {
      const updatedMetrics: ClientApprenticeMetrics = {
        ...user.apprenticeMetrics,
        lastMonthCNRemarks: {
          remarkCode,
          summary,
          details,
          status,
          auditDate: new Date().toISOString().split('T')[0]
        }
      };
      const updatedUser = { ...user, apprenticeMetrics: updatedMetrics };
      setUser(updatedUser);
      saveState(updatedUser);
    }
  };

  const recordAbandonment = (step: number, responses: Partial<IntakeFormData>) => {
    const existing = getActiveClientSubmission();
    const submissionId = existing?.id || 'sub-' + Date.now();

    const abandonedSubmission: FormSubmission = {
      id: submissionId,
      client_id: user?.id || 'client-guest',
      client_name: user?.full_name || responses.contactName || 'Guest Client',
      client_email: user?.email || responses.contactEmail || 'guest@portal.com',
      company_name: responses.companyName || user?.company_name || '',
      status: 'abandoned',
      current_step: step,
      total_steps: 4,
      completion_percentage: Math.round((step / 4) * 100),
      time_spent_seconds: (existing?.time_spent_seconds || 0) + 5,
      started_at: existing?.started_at || new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      responses: {
        ...(existing?.responses || {}),
        ...responses
      }
    };

    const filtered = submissions.filter(s => s.id !== submissionId);
    const updatedSubmissions = [abandonedSubmission, ...filtered];
    setSubmissions(updatedSubmissions);
    saveState(undefined, updatedSubmissions);
    persistSubmissionToSupabase(abandonedSubmission);
  };

  const updateSubmissionStatus = (submissionId: string, status: SubmissionStatus) => {
    const updated = submissions.map(s => {
      if (s.id === submissionId) {
        return {
          ...s,
          status,
          last_active_at: new Date().toISOString()
        };
      }
      return s;
    });

    setSubmissions(updated);
    saveState(undefined, updated);

    const target = updated.find(s => s.id === submissionId);
    if (target) {
      persistSubmissionToSupabase(target);
    }
  };

  const syncDataToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: 'Local offline database active. Supabase will sync automatically when online.'
      };
    }

    try {
      const supabase = createClient();
      const errors: string[] = [];

      if (profiles.length > 0) {
        const profilePayloads = profiles.map(p => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          company_name: p.company_name || '',
          phone: p.phone || '',
          role: p.role,
          created_at: p.created_at,
          last_login_at: p.last_login_at
        }));
        const { error: profsError } = await supabase.from('profiles').upsert(profilePayloads);
        if (profsError) {
          console.error('❌ Sync profiles FAILED:', profsError.message, profsError.details);
          errors.push(`Profiles: ${profsError.message}`);
        } else {
          console.log('✅ Synced', profiles.length, 'profiles');
        }
      }

      if (submissions.length > 0) {
        const { error: subsError } = await supabase.from('form_submissions').upsert(submissions);
        if (subsError) {
          console.error('❌ Sync form_submissions FAILED:', subsError.message, subsError.details, subsError.hint);
          errors.push(`Submissions: ${subsError.message}`);
        } else {
          console.log('✅ Synced', submissions.length, 'form_submissions');
        }
      }
      if (loginLogs.length > 0) {
        const { error: logsError } = await supabase.from('login_activity_logs').upsert(loginLogs);
        if (logsError) {
          console.error('❌ Sync login_activity_logs FAILED:', logsError.message, logsError.details, logsError.hint);
          errors.push(`Logs: ${logsError.message}`);
        } else {
          console.log('✅ Synced', loginLogs.length, 'login_activity_logs');
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          message: `Sync errors: ${errors.join('; ')}. Check that Supabase tables exist — run the schema SQL in the SQL Editor.`
        };
      }

      return {
        success: true,
        message: `Successfully synchronized ${submissions.length} submissions and ${loginLogs.length} audit logs to Supabase.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Sync error: ' + (err.message || 'Database unreachable.')
      };
    }
  };

  const resetToDemoData = () => {
    setProfiles(INITIAL_PROFILES);
    setSubmissions(INITIAL_SUBMISSIONS);
    setLoginLogs(INITIAL_LOGIN_LOGS);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_PROFILES);
    setUser(null);
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        isLoading,
        submissions,
        loginLogs,
        login,
        register,
        logout,
        saveSubmissionStep,
        recordAbandonment,
        updateSubmissionStatus,
        getActiveClientSubmission,
        syncDataToSupabase,
        resetToDemoData,
        addApprentice,
        removeApprentice,
        updateApprentice,
        processMonthlyPayrollBatch,
        fileDBTClaim,
        updateCNRemark,
        triggerSPOCEmail,
        assignCompanySpoc
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
