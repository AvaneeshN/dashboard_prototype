import { UploadedDocument, ApprenticeRecord } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Uploads a file to Supabase Storage and returns the public URL, or null on failure.
 * Can be used standalone (e.g. by the intake wizard for company document uploads).
 */
export const uploadFileToSupabaseStorage = async (
  file: File,
  path: string
): Promise<string | null> => {
  try {
    if (!isSupabaseConfigured()) return null;

    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let contentType = file.type;
    if (ext === 'pdf') contentType = 'application/pdf';
    else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'doc') contentType = 'application/msword';
    else if (ext === 'txt') contentType = 'text/plain; charset=utf-8';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { 
        contentType: contentType || 'application/octet-stream',
        cacheControl: '3600', 
        upsert: true 
      });

    if (uploadError) {
      console.error('Supabase Storage upload failed:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Supabase Storage upload error:', err);
    return null;
  }
};

/**
 * Parses any File object (.pdf, .docx, .txt, image) into an UploadedDocument structure.
 * When Supabase is configured, the file is also uploaded to the `documents` bucket
 * and the public URL is stored in `storageUrl`.
 */
export const processUploadedFile = async (
  file: File,
  category: UploadedDocument['category']
): Promise<UploadedDocument> => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  let docType: UploadedDocument['type'] = 'other';

  if (extension === 'pdf') docType = 'pdf';
  else if (extension === 'docx' || extension === 'doc') docType = 'docx';
  else if (extension === 'txt' || extension === 'md' || extension === 'csv') docType = 'txt';
  else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) docType = 'image';

  // Format file size
  const sizeInKb = file.size / 1024;
  const sizeFormatted = sizeInKb > 1024 
    ? `${(sizeInKb / 1024).toFixed(1)} MB` 
    : `${Math.round(sizeInKb)} KB`;

  // Read data URL / content
  let dataUrl = '';
  let textContent = '';

  try {
    if (docType === 'txt') {
      textContent = await file.text();
    }
    
    // Read base64 data URL for downloads & previews
    dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.warn('File read notice:', err);
  }

  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Attempt Supabase Storage upload
  let storageUrl: string | undefined;
  if (isSupabaseConfigured()) {
    try {
      const sanitizedFileName = file.name.replace(/\s+/g, '_');
      const storagePath = `${category}/${docId}_${sanitizedFileName}`;
      const publicUrl = await uploadFileToSupabaseStorage(file, storagePath);
      if (publicUrl) {
        storageUrl = publicUrl;
      }
    } catch (err) {
      console.error('Supabase Storage upload failed, falling back to dataUrl:', err);
    }
  }

  // If file is large (>= 500KB) and we have a storageUrl, drop the dataUrl to save JSONB space
  const FILE_SIZE_THRESHOLD_KB = 500;
  if (storageUrl && sizeInKb >= FILE_SIZE_THRESHOLD_KB) {
    dataUrl = '';
  }

  return {
    id: docId,
    name: file.name,
    type: docType,
    category,
    sizeFormatted,
    dataUrl,
    storageUrl,
    textContent: textContent || `[Uploaded file: ${file.name} (${sizeFormatted})]`,
    uploadedAt: new Date().toISOString()
  };
};

/**
 * Triggers a 1-click browser download of an UploadedDocument.
 * Prefers storageUrl (opens in new tab), then dataUrl download, then text content blob.
 */
export const downloadDocumentFile = (doc: {
  name: string;
  storageUrl?: string;
  dataUrl?: string;
  textContent?: string;
  type?: string;
}) => {
  if (typeof window === 'undefined') return;

  const fileName = doc.name || 'document.pdf';

  // 1. If a Supabase Storage URL exists, open it in a new tab
  if (doc.storageUrl) {
    window.open(doc.storageUrl, '_blank');
    return;
  }

  // 2. Fall back to dataUrl-based download
  if (doc.dataUrl && doc.dataUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = doc.dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 3. Fallback blob generation from text content or placeholder
  const content = doc.textContent || `Document: ${fileName}\nStatus: Verified\nTimestamp: ${new Date().toLocaleString()}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export interface SPOCEmailDocument {
  name: string;
  url?: string;
  category?: string;
}

/**
 * Generates an official SPOC Email notification template
 */
export const generateSPOCEmailHtml = (params: {
  candidate: ApprenticeRecord;
  companyName: string;
  spocName?: string;
  spocEmail?: string;
  documentList?: (string | SPOCEmailDocument)[];
}) => {
  const { candidate, companyName, documentList = [] } = params;

  // Resolve documents with storage download URLs
  const docsToRender: SPOCEmailDocument[] = [];

  if (documentList.length > 0) {
    documentList.forEach(item => {
      if (typeof item === 'string') {
        let matchedUrl: string | undefined;
        if (candidate?.documents) {
          const allDocs = [
            candidate.documents.aadhaarDoc,
            candidate.documents.educationDoc,
            candidate.documents.bankProofDoc,
            candidate.documents.resumeDoc
          ].filter(Boolean);
          const found = allDocs.find(d => d?.name === item);
          matchedUrl = found?.storageUrl;
        }
        docsToRender.push({ name: item, url: matchedUrl });
      } else {
        docsToRender.push(item);
      }
    });
  } else if (candidate?.documents) {
    if (candidate.documents.aadhaarDoc || candidate.documents.aadhaarFile) {
      docsToRender.push({
        name: candidate.documents.aadhaarDoc?.name || candidate.documents.aadhaarFile || 'Aadhaar Card.pdf',
        url: candidate.documents.aadhaarDoc?.storageUrl
      });
    }
    if (candidate.documents.educationDoc || candidate.documents.educationFile) {
      docsToRender.push({
        name: candidate.documents.educationDoc?.name || candidate.documents.educationFile || 'Degree Marksheet.pdf',
        url: candidate.documents.educationDoc?.storageUrl
      });
    }
    if (candidate.documents.bankProofDoc || candidate.documents.bankProofFile) {
      docsToRender.push({
        name: candidate.documents.bankProofDoc?.name || candidate.documents.bankProofFile || 'Bank Passbook.pdf',
        url: candidate.documents.bankProofDoc?.storageUrl
      });
    }
    if (candidate.documents.resumeDoc || candidate.documents.resumeFile) {
      docsToRender.push({
        name: candidate.documents.resumeDoc?.name || candidate.documents.resumeFile || 'Candidate Resume.docx',
        url: candidate.documents.resumeDoc?.storageUrl
      });
    }
  }
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; color: #18181b;">
      <div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 14px; margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #18181b; margin: 0;">Candidate Onboarding Notification</h2>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 10px 0;">
        Hello,
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0 0 16px 0;">
        A new candidate has been onboarded${companyName ? ` for <strong>${companyName}</strong>` : ''}. The candidate details and uploaded compliance documentation are provided below.
      </p>

      <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #18181b; margin-top: 0; margin-bottom: 12px;">Candidate Summary</h3>
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #71717a;">Candidate Name:</td>
            <td style="padding: 5px 0; font-weight: 600; color: #18181b;">${candidate.name}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #71717a;">Designated Role / Trade:</td>
            <td style="padding: 5px 0; font-weight: 600; color: #18181b;">${candidate.tradeOrRole}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #71717a;">Aadhaar Number:</td>
            <td style="padding: 5px 0; font-family: monospace; color: #18181b;">${candidate.aadhaarNumber || 'Submitted'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #71717a;">Monthly Stipend:</td>
            <td style="padding: 5px 0; font-weight: 600; color: #18181b;">₹${(candidate.stipendAmount || 18500).toLocaleString()} / month</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #71717a;">DBT Subsidy Share:</td>
            <td style="padding: 5px 0; font-weight: 600; color: #18181b;">₹${(candidate.dbtEligibleAmount || 4500).toLocaleString()} / month</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #71717a;">Joining Date:</td>
            <td style="padding: 5px 0; font-family: monospace; color: #18181b;">${candidate.onboardingDate}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 20px 0;">
        <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #18181b; margin-bottom: 10px;">Attached Compliance Documents (${docsToRender.length}):</h4>
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          ${docsToRender.map(doc => `
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e4e4e7; background: #fafafa; font-weight: 600; color: #18181b;">
                ${doc.name}
              </td>
              <td style="padding: 8px 12px; border: 1px solid #e4e4e7; text-align: right; background: #ffffff;">
                ${doc.url 
                  ? `<a href="${doc.url}" target="_blank" download style="color: #2563eb; text-decoration: underline; font-weight: 600;">View / Download &rarr;</a>` 
                  : `<span style="color: #a1a1aa;">Stored on Portal</span>`
                }
              </td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="border-top: 1px solid #e4e4e7; padding-top: 14px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
        This is an automated notification.
      </div>
    </div>
  `;
};
