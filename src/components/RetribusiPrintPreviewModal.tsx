import React, { useEffect } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { Application } from '../types';
import { RetributionAttachmentPrint } from './RetributionAttachmentPrint';
import { logPrintAction } from '../lib/auditLogEngine';
import { getSavedSignatures } from '../lib/signatureEngine';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';

interface RetribusiPrintPreviewModalProps {
  application: Application;
  customShst: number;
  onClose: () => void;
  onExportPdf: () => void;
}

export const RetribusiPrintPreviewModal: React.FC<RetribusiPrintPreviewModalProps> = ({
  application,
  customShst,
  onClose,
  onExportPdf
}) => {
  useEffect(() => {
    // Add specific print styles for F4 when modal is open
    const style = document.createElement('style');
    style.id = 'retribusi-f4-print-style';
    style.innerHTML = `
      @media print {
        @page {
          size: 215mm 330mm !important; /* F4 size */
          margin: 5mm !important;
        }
        body {
          visibility: hidden;
        }
        #retribusi-print-preview-content {
          visibility: visible;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        #retribusi-print-preview-content * {
          visibility: visible;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existing = document.getElementById('retribusi-f4-print-style');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  const handlePrint = () => {
    const operator = getSavedSignatures().operator;
    logPrintAction('CETAK_RINCIAN_RETRIBUSI', application.registerNumber, operator.name, operator.nip);
    triggerPdfPrint('retribusi-print-preview-content', `Rincian_Retribusi_${application.registerNumber}`);
  };
  
  const handleExport = () => {
    const operator = getSavedSignatures().operator;
    logPrintAction('EXPORT_RINCIAN_RETRIBUSI', application.registerNumber, operator.name, operator.nip);
    onExportPdf();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm no-print">
      <div className="bg-slate-100 dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-lg">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              PRINT PREVIEW: RINCIAN RETRIBUSI (LAMPIRAN PP 16/2021)
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">
              F4 PAGE SIZING (215mm x 330mm)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs uppercase tracking-wide transition rounded"
            >
              <FileText className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs uppercase tracking-wide transition rounded shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Rincian
            </button>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable preview area */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-200/50 dark:bg-slate-950 flex justify-center">
          <div className="bg-white shadow-xl ring-1 ring-slate-900/5 print-container" style={{ width: '215mm', minHeight: '330mm' }}>
            <div id="retribusi-print-preview-content">
              <RetributionAttachmentPrint application={application} customShst={customShst} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
