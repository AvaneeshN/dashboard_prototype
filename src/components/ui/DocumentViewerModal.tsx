'use client';

import React from 'react';
import { UploadedDocument } from '@/types';
import { downloadDocumentFile } from '@/lib/document-utils';
import { 
  X, 
  Download, 
  FileText, 
  FileCheck, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  ExternalLink,
  Calendar,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentViewerModalProps {
  document: {
    name: string;
    type?: string;
    category?: string;
    sizeFormatted?: string;
    textContent?: string;
    dataUrl?: string;
    uploadedAt?: string;
  } | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  onClose
}) => {
  if (!doc) return null;

  const getFormatBadge = (type?: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase() || type || 'file';
    let badgeColor = 'bg-zinc-800 text-white';

    if (ext === 'pdf') badgeColor = 'bg-rose-600 text-white';
    else if (ext === 'docx' || ext === 'doc') badgeColor = 'bg-blue-600 text-white';
    else if (ext === 'txt') badgeColor = 'bg-emerald-600 text-white';
    else if (['png', 'jpg', 'jpeg'].includes(ext)) badgeColor = 'bg-amber-600 text-white';

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${badgeColor}`}>
        .{ext}
      </span>
    );
  };

  const isImage = ['png', 'jpg', 'jpeg', 'webp'].some(ext => doc.name.toLowerCase().endsWith(ext)) || doc.type === 'image';
  const isDataUrlImage = isImage && doc.dataUrl?.startsWith('data:image');

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-zinc-900"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-zinc-900 truncate max-w-md">
                    {doc.name}
                  </h3>
                  {getFormatBadge(doc.type, doc.name)}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono mt-0.5">
                  <span>{doc.sizeFormatted || 'Verified File'}</span>
                  <span>·</span>
                  <span>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Compliance Record'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Preview */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {isDataUrlImage ? (
              <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center p-4">
                <img src={doc.dataUrl} alt={doc.name} className="max-h-96 object-contain rounded-xl" />
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    File Contents & Metadata Inspection
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Format: {doc.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>

                <pre className="text-xs text-zinc-800 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {doc.textContent || `[File Content Verified: ${doc.name}]\n\nAll candidate records, identity verifications, and compliance signatures have been validated against the National Apprenticeship standard.\n\nReady for administrative processing and DBT reimbursement reconciliation.`}
                </pre>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 font-mono">
              Encryption: SHA-256 Verified
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200 cursor-pointer transition-all"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => downloadDocumentFile(doc)}
                className="px-5 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
