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
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { cacheControl: '3600', upsert: true });

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

/**
 * Generates an official SPOC Email notification template
 */
export const generateSPOCEmailHtml = (params: {
  candidate: ApprenticeRecord;
  companyName: string;
  spocName: string;
  spocEmail: string;
  documentList: string[];
}) => {
  const { candidate, companyName, spocName, spocEmail, documentList } = params;
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; color: #18181b;">
      <div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 14px; margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #18181b; margin: 0;">Candidate Onboarding Notification</h2>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
        Dear <strong>${spocName || 'SPOC'}</strong> (${spocEmail}),
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #52525b;">
        A new candidate has been onboarded${companyName ? ` for <strong>${companyName}</strong>` : ''}. The details and compliance documentation have been submitted.
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
        <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #18181b; margin-bottom: 8px;">Attached Documents (${documentList.length}):</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #3f3f46; line-height: 1.8;">
          ${documentList.map(doc => `<li><strong>${doc}</strong></li>`).join('')}
        </ul>
      </div>

      <div style="border-top: 1px solid #e4e4e7; padding-top: 14px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
        This is an automated notification.
      </div>
    </div>
  `;
};
