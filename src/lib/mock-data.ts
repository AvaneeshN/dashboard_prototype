import { FormSubmission, LoginActivityLog, UserProfile, ClientApprenticeMetrics, ApprenticeRecord } from '@/types';

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'admin-1',
    email: 'admin@company.com',
    full_name: 'Administrator',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    last_login_at: new Date().toISOString()
  }
];

export const INITIAL_SUBMISSIONS: FormSubmission[] = [];

export const INITIAL_LOGIN_LOGS: LoginActivityLog[] = [
  {
    id: 'log-1',
    email: 'admin@company.com',
    role_attempted: 'admin',
    status: 'success',
    ip_address: '192.168.1.1',
    user_agent: 'Console Admin Client',
    created_at: new Date(Date.now() - 5 * 60000).toISOString()
  }
];

export const INITIAL_FUNNEL_STEPS = [
  { step: 1, name: 'Candidate & Quota Requirements', started: 100, completed: 95, dropOff: 5, dropOffRate: '5.0%' },
  { step: 2, name: 'Payroll & Stipend Structure', started: 95, completed: 88, dropOff: 7, dropOffRate: '7.3%' },
  { step: 3, name: 'Contract & Compliance Setup', started: 88, completed: 82, dropOff: 6, dropOffRate: '6.8%' },
  { step: 4, name: 'Document Verification & Submit', started: 82, completed: 80, dropOff: 2, dropOffRate: '2.4%' }
];
