'use client';

import React, { useEffect, useState } from 'react';
import { FormSubmission, SubmissionStatus } from '@/types';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
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
  ExternalLink
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
  const [activeTab, setActiveTab] = useState<'application' | 'documents' | 'candidates' | 'dbt_claims'>('application');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!submission) return null;

  const responses = submission.responses || {};
  const companyDocs = responses.companyDocs || {};
  const candidateList = submission.candidates || [];
  const dbtClaims = submission.dbt_claims || [];

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

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs font-sans"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl h-full bg-white border-l border-zinc-200 shadow-2xl flex flex-col text-zinc-900"
        >
          {/* Sticky Header with Always-Visible Close Button */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                {submission.company_name?.charAt(0) || submission.client_name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 leading-tight">
                  {submission.company_name || submission.client_name || 'Candidate Intake Application'}
                </h3>
                <p className="text-[10px] font-mono text-zinc-400">
                  Client: {submission.client_name} · ID: {submission.id}
                </p>
              </div>
            </div>

            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* Section Tabs inside Drawer */}
          <div className="px-6 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'application', label: 'Intake Application' },
              { id: 'documents', label: 'Company Documents' },
              { id: 'candidates', label: `Apprentices (${candidateList.length})` },
              { id: 'dbt_claims', label: `DBT Claims (${dbtClaims.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black hover:bg-zinc-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            
            {/* Status & Approval Bar */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-bold font-mono">STATUS:</span>
                {getStatusBadge(submission.status)}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">Set Approval:</span>
                <select
                  value={submission.status}
                  onChange={(e) => onStatusChange(submission.id, e.target.value as SubmissionStatus)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-zinc-300 text-zinc-900 font-bold focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="abandoned">Abandoned</option>
                </select>
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

                {/* Section 1 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                    1. Candidate Requirements & Quota
                  </h4>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                    {(responses.companyName || submission.company_name) && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-medium">Company / Org:</span> 
                        <span className="font-extrabold text-zinc-900">{responses.companyName || submission.company_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">Client Contact:</span> <span className="font-bold text-zinc-900">{submission.client_name}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">Email:</span> <span className="font-mono text-zinc-800">{submission.client_email}</span></div>
                    {responses.contactPhone && <div className="flex justify-between"><span className="text-zinc-500 font-medium">Phone:</span> <span className="text-zinc-800">{responses.contactPhone}</span></div>}
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">Apprentice Quota:</span> <span className="font-extrabold text-zinc-900">{responses.requiredApprenticeCount || 0} Candidates</span></div>
                    <div>
                      <span className="text-zinc-500 font-medium block mb-1.5">Target Roles / Specializations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {responses.tradesRequired && responses.tradesRequired.length > 0 ? (
                          responses.tradesRequired.map((t: string) => (
                            <span key={t} className="px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-800 text-[11px] font-semibold">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                    2. Payroll, Stipend & DBT Configuration
                  </h4>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">Monthly Stipend:</span> <span className="font-extrabold text-zinc-900">₹{Number(responses.stipendPerApprentice || 0).toLocaleString()}/mo</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">DBT Subsidy Opt-In:</span> <span className="font-bold text-emerald-700">{responses.dbtSchemeOptIn !== false ? 'Active (₹4,500/mo)' : 'Standard'}</span></div>
                    {responses.proposedJoiningDate && <div className="flex justify-between"><span className="text-zinc-500 font-medium">Proposed Joining:</span> <span className="font-mono text-zinc-800">{responses.proposedJoiningDate}</span></div>}
                    {responses.trainingLocations && <div className="flex justify-between"><span className="text-zinc-500 font-medium">Location Mode:</span> <span className="text-zinc-800">{responses.trainingLocations}</span></div>}
                  </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase font-mono">
                    3. Contract Template & Compliance
                  </h4>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">Template Framework:</span> <span className="text-zinc-800 font-semibold">{responses.contractTemplateType || 'Standard National Template'}</span></div>
                    {responses.complianceOfficerName && <div className="flex justify-between"><span className="text-zinc-500 font-medium">Compliance Officer:</span> <span className="text-zinc-800">{responses.complianceOfficerName} ({responses.complianceOfficerEmail || 'No email'})</span></div>}
                    {responses.cnIssueNotes && (
                      <div>
                        <span className="text-zinc-500 font-medium block mb-1">Compliance Notes:</span>
                        <p className="text-zinc-700 leading-relaxed bg-white p-3 rounded-xl border border-zinc-200 font-mono text-xs">{responses.cnIssueNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Company Documents */}
            {activeTab === 'documents' && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500 font-medium">Company GSTIN:</span> <span className="font-mono font-bold text-zinc-900">{responses.gstinNumber || '27AAACN0123M1Z5 (Logged)'}</span></div>
                  {companyDocs.epfoRegistrationCode && (
                    <div className="flex justify-between"><span className="text-zinc-500 font-medium">EPFO Code:</span> <span className="font-mono text-zinc-800">{companyDocs.epfoRegistrationCode}</span></div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* COI */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">Certificate of Incorporation</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
                      <span className="font-mono text-zinc-600 truncate">{companyDocs.coiFileName || 'certificate_of_incorporation.pdf'}</span>
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>

                  {/* GST */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">GST / PAN Certificate</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
                      <span className="font-mono text-zinc-600 truncate">{companyDocs.gstFileName || 'company_gst_registration.pdf'}</span>
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>

                  {/* Signatory Letter */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">Signatory Authorization</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
                      <span className="font-mono text-zinc-600 truncate">{companyDocs.signatoryLetterFileName || 'board_authorization_letter.pdf'}</span>
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>

                  {/* Bank Proof */}
                  <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">Cancelled Cheque / Bank</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">Uploaded</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-zinc-200 flex items-center justify-between">
                      <span className="font-mono text-zinc-600 truncate">{companyDocs.cancelledChequeFileName || 'company_bank_proof.pdf'}</span>
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Apprentices Roster */}
            {activeTab === 'candidates' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-900 uppercase font-mono mb-2">
                  Candidate Roster & Document Records ({candidateList.length})
                </div>

                {candidateList.length > 0 ? (
                  <div className="space-y-2.5">
                    {candidateList.map(cand => (
                      <div key={cand.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-zinc-900">{cand.name}</div>
                            <div className="text-[10px] font-mono text-zinc-400">{cand.id} · {cand.email || 'Verified'}</div>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-white">
                            {cand.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 text-[11px]">
                          <div><span className="text-zinc-500">Role:</span> <strong className="text-zinc-800">{cand.tradeOrRole}</strong></div>
                          <div><span className="text-zinc-500">Stipend:</span> <strong className="text-zinc-800">₹{cand.stipendAmount.toLocaleString()}</strong></div>
                          <div><span className="text-zinc-500">Aadhaar:</span> <span className="font-mono">{cand.aadhaarNumber || '4523-XXXX-9901'}</span></div>
                          <div><span className="text-zinc-500">Contract:</span> <span className="font-semibold text-emerald-700">{cand.contractStatus}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 rounded-2xl border border-zinc-200">
                    No candidates onboarded by client yet.
                  </div>
                )}
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

          </div>

          {/* Sticky Bottom Actions */}
          <div className="p-4 border-t border-zinc-200 bg-white flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">* Press ESC to close</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold cursor-pointer transition-all"
            >
              Close Inspector
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
