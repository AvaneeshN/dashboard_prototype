import * as XLSX from 'xlsx';
import { FormSubmission, ApprenticeRecord } from '@/types';
import { generateAutoContinuedDbtRecords } from '@/lib/store';
import { AggregatedDbtRow } from '@/components/admin/AdminOverallDbtDashboard';

export type TimelineExportMode = 'single_month' | 'month_range' | 'all_time';

export interface MonthYearSelection {
  month: string; // e.g. 'JAN', 'FEB', ..., 'DEC'
  year: number;  // e.g. 2026
}

export interface TimelineExportOptions {
  mode: TimelineExportMode;
  singleMonth?: MonthYearSelection;
  startMonth?: MonthYearSelection;
  endMonth?: MonthYearSelection;
  establishmentId?: string; // 'all' or specific submission id
  statusFilter?: 'all' | 'PAID' | 'UNPAID' | 'FAIL';
}

export const MONTH_NAMES: { [key: string]: number } = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11
};

export const MONTH_LIST = [
  { value: 'JAN', label: 'January' },
  { value: 'FEB', label: 'February' },
  { value: 'MAR', label: 'March' },
  { value: 'APR', label: 'April' },
  { value: 'MAY', label: 'May' },
  { value: 'JUN', label: 'June' },
  { value: 'JUL', label: 'July' },
  { value: 'AUG', label: 'August' },
  { value: 'SEP', label: 'September' },
  { value: 'OCT', label: 'October' },
  { value: 'NOV', label: 'November' },
  { value: 'DEC', label: 'December' }
];

export const parseMonthYearToIndex = (monthYearStr: string): number | null => {
  if (!monthYearStr) return null;
  const upper = monthYearStr.toUpperCase().trim();

  // Pattern like "AUG-2026" or "AUG 2026"
  for (const [mName, mIdx] of Object.entries(MONTH_NAMES)) {
    if (upper.includes(mName)) {
      const yearMatch = upper.match(/20\d{2}/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0], 10);
        return year * 12 + mIdx;
      }
    }
  }

  // Pattern like "2026-08" or "2026-08-15"
  const isoMatch = upper.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    return year * 12 + month;
  }

  return null;
};

export const isRecordInTimeline = (
  payoutMonthStr: string,
  options: TimelineExportOptions
): boolean => {
  if (options.mode === 'all_time') return true;

  const recordIndex = parseMonthYearToIndex(payoutMonthStr);
  if (recordIndex === null) {
    // If undetermined, include in range so data is not lost
    return true;
  }

  if (options.mode === 'single_month') {
    if (!options.singleMonth) return true;
    const targetIdx = options.singleMonth.year * 12 + (MONTH_NAMES[options.singleMonth.month.toUpperCase()] ?? 0);
    return recordIndex === targetIdx;
  }

  if (options.mode === 'month_range') {
    const startIdx = options.startMonth 
      ? options.startMonth.year * 12 + (MONTH_NAMES[options.startMonth.month.toUpperCase()] ?? 0)
      : -Infinity;
    const endIdx = options.endMonth
      ? options.endMonth.year * 12 + (MONTH_NAMES[options.endMonth.month.toUpperCase()] ?? 11)
      : Infinity;

    return recordIndex >= startIdx && recordIndex <= endIdx;
  }

  return true;
};

export const buildAggregatedRows = (submissions: FormSubmission[]): AggregatedDbtRow[] => {
  const rows: AggregatedDbtRow[] = [];

  submissions.forEach(sub => {
    const estName = sub.company_name || sub.client_name || 'Establishment';
    const estCodeFallback = sub.establishment_details?.pan || sub.naps_portal_id || sub.id;
    const candidates = sub.candidates || [];
    const napsRecords = generateAutoContinuedDbtRecords(sub);

    const processedCandIds = new Set<string>();

    napsRecords.forEach(rec => {
      const matchedCand = candidates.find(c => 
        c.id === rec.candidateId || 
        (c.contractCode && rec.contractCode && c.contractCode === rec.contractCode) ||
        (c.name && rec.candidateName && c.name.toLowerCase() === rec.candidateName.toLowerCase())
      );

      if (matchedCand?.id) {
        processedCandIds.add(matchedCand.id);
      }

      const estCode = rec.establishmentCode || estCodeFallback;
      const loc = rec.location || 
        (rec.ojtDistrict ? `${rec.ojtDistrict}, ${rec.ojtState}` : 
        (matchedCand?.ojtDistrict ? `${matchedCand.ojtDistrict}, ${matchedCand.ojtState || ''}` : 
        (sub.establishment_details?.state || 'Corporate Office')));

      const aadharName = rec.candidateAadhaarName || rec.candidateName || matchedCand?.name || 'Unknown';
      const birthDate = rec.dob || matchedCand?.dob || '-';
      const candGender = rec.gender || matchedCand?.gender || '-';
      const phoneNum = rec.mobileNumber || matchedCand?.phone || '-';
      const mailAddr = rec.emailId || matchedCand?.email || '-';
      const stipendVal = rec.stipend || matchedCand?.stipendAmount || rec.amount || 0;
      const dbtSubsidyVal = matchedCand?.dbtEligibleAmount || rec.amount || 0;
      const qual = rec.qualification || matchedCand?.qualification || '-';
      const curr = rec.curriculum || matchedCand?.tradeOrRole || '-';
      const tradeType = rec.contractType || matchedCand?.tradeType || 'optional';
      const apCode = rec.apprenticeCode || matchedCand?.apprenticeCode || '-';
      const benId = rec.beneficiaryId || '-';
      const cnNum = rec.contractCode || matchedCand?.contractCode || '-';
      const rem = rec.remarks || '-';
      const startDate = rec.contractStartDate || matchedCand?.onboardingDate || '-';
      const endDate = rec.contractEndDate || matchedCand?.contractExpireDate || '-';
      const resolvedStatus: 'PAID' | 'UNPAID' | 'FAIL' = 
        rec.dbtStatus === 'PAID' || rec.paymentStatus === 'PAID' ? 'PAID' :
        rec.dbtStatus === 'FAIL' || rec.paymentStatus === 'FAILED' ? 'FAIL' : 'UNPAID';

      rows.push({
        id: rec.id,
        submissionId: sub.id,
        submission: sub,
        establishmentName: estName,
        establishmentCode: estCode,
        documentReceiveDate: rec.documentReceiveDate || matchedCand?.documentReceiveDate || sub.started_at?.split('T')[0] || '-',
        location: loc,
        candidateAadhaarName: aadharName,
        dob: birthDate,
        gender: candGender,
        mobileNumber: phoneNum,
        emailId: mailAddr,
        stipend: stipendVal,
        dbtSubsidy: dbtSubsidyVal,
        qualification: qual,
        curriculum: curr,
        tradeType,
        apprenticeCode: apCode,
        beneficiaryId: benId,
        contractCode: cnNum,
        remarks: rem,
        contractStartDate: startDate,
        contractEndDate: endDate,
        dbtStatus: resolvedStatus,
        payoutMonth: rec.payoutMonth || 'AUG-2026',
        candidate: matchedCand,
        rawRecord: rec
      });
    });

    candidates.forEach(cand => {
      if (processedCandIds.has(cand.id)) return;

      const loc = cand.ojtDistrict 
        ? `${cand.ojtDistrict}, ${cand.ojtState || ''}` 
        : (sub.establishment_details?.state || 'Corporate Office');

      const resolvedStatus: 'PAID' | 'UNPAID' | 'FAIL' = 
        cand.contractStatus === 'Signed' ? 'PAID' : 'UNPAID';

      rows.push({
        id: `cand-${cand.id}`,
        submissionId: sub.id,
        submission: sub,
        establishmentName: estName,
        establishmentCode: estCodeFallback,
        documentReceiveDate: cand.documentReceiveDate || cand.onboardingDate || '-',
        location: loc,
        candidateAadhaarName: cand.name,
        dob: cand.dob || '-',
        gender: cand.gender || '-',
        mobileNumber: cand.phone || '-',
        emailId: cand.email || '-',
        stipend: cand.stipendAmount || 0,
        dbtSubsidy: cand.dbtEligibleAmount || 0,
        qualification: cand.qualification || '-',
        curriculum: cand.tradeOrRole || '-',
        tradeType: cand.tradeType || 'optional',
        apprenticeCode: cand.apprenticeCode || '-',
        beneficiaryId: cand.aadhaarNumber ? `BEN-${cand.aadhaarNumber.slice(-4)}` : '-',
        contractCode: cand.contractCode || 'CN Pending',
        remarks: cand.status || 'Active',
        contractStartDate: cand.onboardingDate || '-',
        contractEndDate: cand.contractExpireDate || '-',
        dbtStatus: resolvedStatus,
        payoutMonth: `AUG-${new Date().getFullYear()}`,
        candidate: cand
      });
    });
  });

  return rows;
};

export const filterTimelineRows = (
  allRows: AggregatedDbtRow[],
  options: TimelineExportOptions
): AggregatedDbtRow[] => {
  return allRows.filter(row => {
    // Timeline match
    if (!isRecordInTimeline(row.payoutMonth, options)) {
      return false;
    }

    // Specific establishment filter
    if (options.establishmentId && options.establishmentId !== 'all') {
      if (row.submissionId !== options.establishmentId) {
        return false;
      }
    }

    // Status filter
    if (options.statusFilter && options.statusFilter !== 'all') {
      if (row.dbtStatus !== options.statusFilter) {
        return false;
      }
    }

    return true;
  });
};

export const exportTimelineToExcel = (
  submissions: FormSubmission[],
  options: TimelineExportOptions,
  seniorAdminName: string = 'Senior Administrator'
): { success: boolean; rowCount: number; fileName: string } => {
  const allRows = buildAggregatedRows(submissions);
  const filteredRows = filterTimelineRows(allRows, options);

  // Timeline label for metadata and filename
  let timelineLabel = 'All_Time_Archive';
  let readableTimeline = 'All Time Historical Dataset';

  if (options.mode === 'single_month' && options.singleMonth) {
    timelineLabel = `${options.singleMonth.month}_${options.singleMonth.year}`;
    readableTimeline = `${options.singleMonth.month} ${options.singleMonth.year}`;
  } else if (options.mode === 'month_range' && options.startMonth && options.endMonth) {
    timelineLabel = `${options.startMonth.month}_${options.startMonth.year}_to_${options.endMonth.month}_${options.endMonth.year}`;
    readableTimeline = `${options.startMonth.month} ${options.startMonth.year} to ${options.endMonth.month} ${options.endMonth.year}`;
  }

  // Create workbook
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const totalStipend = filteredRows.reduce((sum, r) => sum + (r.stipend || 0), 0);
  const totalDbt = filteredRows.reduce((sum, r) => sum + (r.dbtSubsidy || 0), 0);
  const paidRows = filteredRows.filter(r => r.dbtStatus === 'PAID');
  const unpaidRows = filteredRows.filter(r => r.dbtStatus === 'UNPAID');
  const failRows = filteredRows.filter(r => r.dbtStatus === 'FAIL');

  const uniqueEstablishments = Array.from(new Set(filteredRows.map(r => r.establishmentName)));
  const uniqueApprentices = Array.from(new Set(filteredRows.map(r => r.candidateAadhaarName)));

  const summaryData = [
    ['WF47 ZYNG - APPRENTICESHIP & DBT COMPLIANCE AUDIT REPORT'],
    ['Report Scope', readableTimeline],
    ['Generated By', seniorAdminName],
    ['Generated At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
    ['Confidentiality', 'Privileged Senior Administration Document'],
    [],
    ['KEY PERFORMANCE METRICS', 'VALUE'],
    ['Total Establishments Included', uniqueEstablishments.length],
    ['Total Enrolled Apprentices Represented', uniqueApprentices.length],
    ['Total DBT & Subsidy Records', filteredRows.length],
    ['Total Gross Stipend Disbursed (INR)', totalStipend],
    ['Total Government DBT Subsidy Claimed (INR)', totalDbt],
    ['Verified Paid Transactions', paidRows.length],
    ['Pending / Unpaid Transactions', unpaidRows.length],
    ['Failed / Discrepancy Transactions', failRows.length],
    ['Disbursal Success Rate', `${filteredRows.length > 0 ? ((paidRows.length / filteredRows.length) * 100).toFixed(1) : '0.0'}%`],
    [],
    ['ESTABLISHMENT BREAKDOWN', 'ESTABLISHMENT CODE', 'TOTAL APPRENTICES', 'GROSS STIPEND (INR)', 'DBT SUBSIDY (INR)', 'PAID COUNT', 'UNPAID COUNT', 'FAIL COUNT']
  ];

  // Group by establishment for summary
  uniqueEstablishments.forEach(estName => {
    const estRows = filteredRows.filter(r => r.establishmentName === estName);
    const estCode = estRows[0]?.establishmentCode || '-';
    const estStipend = estRows.reduce((s, r) => s + (r.stipend || 0), 0);
    const estDbt = estRows.reduce((s, r) => s + (r.dbtSubsidy || 0), 0);
    const estPaid = estRows.filter(r => r.dbtStatus === 'PAID').length;
    const estUnpaid = estRows.filter(r => r.dbtStatus === 'UNPAID').length;
    const estFail = estRows.filter(r => r.dbtStatus === 'FAIL').length;
    const estCands = new Set(estRows.map(r => r.candidateAadhaarName)).size;

    summaryData.push([
      estName,
      estCode,
      estCands,
      estStipend,
      estDbt,
      estPaid,
      estUnpaid,
      estFail
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 42 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

  // 2. DBT & Subsidy Ledger Sheet
  const ledgerData = [
    [
      'Sl No',
      'Payout Cycle',
      'Establishment Name',
      'Establishment Code',
      'Apprentice Name (Aadhaar)',
      'Apprentice Code',
      'PFMS Beneficiary ID',
      'Contract Number (CN)',
      'Location / OJT District',
      'Document Receive Date',
      'Date of Birth',
      'Gender',
      'Mobile Number',
      'Email Address',
      'Gross Stipend (INR)',
      'DBT Subsidy (INR)',
      'Qualification',
      'Curriculum / Trade',
      'Trade Type',
      'Contract Start Date',
      'Contract End Date',
      'DBT Payment Status',
      'Compliance Remarks'
    ],
    ...filteredRows.map((r, idx) => [
      idx + 1,
      r.payoutMonth,
      r.establishmentName,
      r.establishmentCode,
      r.candidateAadhaarName,
      r.apprenticeCode,
      r.beneficiaryId,
      r.contractCode,
      r.location,
      r.documentReceiveDate,
      r.dob,
      r.gender,
      r.mobileNumber,
      r.emailId,
      r.stipend,
      r.dbtSubsidy,
      r.qualification,
      r.curriculum,
      r.tradeType,
      r.contractStartDate,
      r.contractEndDate,
      r.dbtStatus,
      r.remarks
    ])
  ];

  const wsLedger = XLSX.utils.aoa_to_sheet(ledgerData);
  wsLedger['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 32 },
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 24 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsLedger, 'DBT_Subsidy_Ledger');

  // 3. Establishments Overview Sheet
  const matchedSubmissions = submissions.filter(sub => {
    if (options.establishmentId && options.establishmentId !== 'all') {
      return sub.id === options.establishmentId;
    }
    return true;
  });

  const establishmentData = [
    [
      'Sl No',
      'Legal Company Name',
      'Legal Entity Type',
      'PAN Number',
      'GST Number',
      'Head Office Location',
      'SPOC Name',
      'SPOC Email',
      'SPOC Contact Phone',
      'Intake Status',
      'Total Candidates Registered',
      'Onboarding Date'
    ],
    ...matchedSubmissions.map((sub, idx) => [
      idx + 1,
      sub.company_name || sub.client_name || 'N/A',
      sub.responses?.industry || 'Corporate Establishment',
      sub.establishment_details?.pan || sub.responses?.panNumber || 'N/A',
      sub.establishment_details?.gstin || sub.responses?.gstinNumber || 'N/A',
      `${sub.establishment_details?.city || 'Corporate'}, ${sub.establishment_details?.state || 'Office'}`,
      sub.assigned_company_spoc?.name || sub.responses?.contactName || sub.client_name || 'N/A',
      sub.assigned_company_spoc?.email || sub.responses?.contactEmail || sub.client_email || 'N/A',
      sub.assigned_company_spoc?.phone || sub.responses?.contactPhone || 'N/A',
      (sub.status || 'under_review').toUpperCase(),
      sub.candidates?.length || 0,
      sub.started_at ? sub.started_at.split('T')[0] : 'N/A'
    ])
  ];

  const wsEst = XLSX.utils.aoa_to_sheet(establishmentData);
  wsEst['!cols'] = [
    { wch: 8 },
    { wch: 34 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsEst, 'Establishments_Overview');

  // 4. Apprentice Registry Sheet
  const allCandidates: { cand: ApprenticeRecord; estName: string; estCode: string }[] = [];
  matchedSubmissions.forEach(sub => {
    const estName = sub.company_name || sub.client_name || 'Establishment';
    const estCode = sub.establishment_details?.pan || sub.naps_portal_id || sub.id;
    (sub.candidates || []).forEach(cand => {
      allCandidates.push({ cand, estName, estCode });
    });
  });

  const apprenticeData = [
    [
      'Sl No',
      'Apprentice Full Name',
      'Establishment Employer',
      'Establishment Code',
      'Apprentice Code (AP Code)',
      'Contract Code (CN Number)',
      'Aadhaar Number',
      'Mobile Phone',
      'Email Address',
      'Gender',
      'Qualification',
      'Trade / Role',
      'Trade Type',
      'Monthly Stipend (INR)',
      'DBT Eligible Subsidy (INR)',
      'OJT District',
      'OJT State',
      'Contract Status',
      'Onboarding Date',
      'Contract Expiry Date',
      'Bank Name',
      'Bank Account Number',
      'IFSC Code'
    ],
    ...allCandidates.map((item, idx) => [
      idx + 1,
      item.cand.name || 'Unknown',
      item.estName,
      item.estCode,
      item.cand.apprenticeCode || '-',
      item.cand.contractCode || 'Pending',
      item.cand.aadhaarNumber || '-',
      item.cand.phone || '-',
      item.cand.email || '-',
      item.cand.gender || '-',
      item.cand.qualification || '-',
      item.cand.tradeOrRole || '-',
      item.cand.tradeType || 'optional',
      item.cand.stipendAmount || 0,
      item.cand.dbtEligibleAmount || 0,
      item.cand.ojtDistrict || '-',
      item.cand.ojtState || '-',
      item.cand.contractStatus || 'Signed',
      item.cand.onboardingDate || '-',
      item.cand.contractExpireDate || '-',
      item.cand.bankName || '-',
      item.cand.bankAccountNumber || '-',
      item.cand.ifscCode || '-'
    ])
  ];

  const wsApprentices = XLSX.utils.aoa_to_sheet(apprenticeData);
  wsApprentices['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 28 },
    { wch: 10 },
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsApprentices, 'Apprentice_Registry');

  // Trigger file download
  const fileName = `WF47_ZYNG_DBT_Ledger_${timelineLabel}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return {
    success: true,
    rowCount: filteredRows.length,
    fileName
  };
};
