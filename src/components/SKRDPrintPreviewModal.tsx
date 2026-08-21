import React, { useEffect, useState } from 'react';
import { X, Printer, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { Application } from '../types';
import { SKRDPrint } from './SKRDPrint';
import { logPrintAction } from '../lib/auditLogEngine';
import { getSavedSignatures } from '../lib/signatureEngine';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';
import { getSkrdStandardNumber } from '../utils/skrdFormatter';

interface SKRDPrintPreviewModalProps {
  application: Application;
  customShst: number;
  onClose: () => void;
  onExportPdf: () => void;
  onUpdateApplication?: (updatedApp: Application) => void;
}

export const SKRDPrintPreviewModal: React.FC<SKRDPrintPreviewModalProps> = ({
  application,
  customShst,
  onClose,
  onExportPdf,
  onUpdateApplication
}) => {
  const [currentApp, setCurrentApp] = useState<Application>(application);

  useEffect(() => {
    setCurrentApp(application);
  }, [application]);

  useEffect(() => {
    // Add specific print styles for F4 when modal is open
    const style = document.createElement('style');
    style.id = 'skrd-f4-print-style';
    style.innerHTML = `
      @media print {
        @page {
          size: 215mm 330mm !important; /* F4 size */
          margin: 5mm !important;
        }
        body {
          visibility: hidden;
        }
        #skrd-print-preview-content {
          visibility: visible;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        #skrd-print-preview-content * {
          visibility: visible;
        }
        /* Hide non-essential UI */
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existing = document.getElementById('skrd-f4-print-style');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  // Retribution status validation
  const retribution = currentApp.retribution;
  const status = retribution?.status || 'DRAFT';
  const isVerified = retribution?.isVerified ?? false;

  // Retribution is considered valid / approved if:
  // status is APPROVED, VERIFIED, SKRD_ISSUED, UNPAID, or PAID OR isVerified === true
  const isApproved = Boolean(
    retribution && (
      ['APPROVED', 'VERIFIED', 'SKRD_ISSUED', 'UNPAID', 'PAID'].includes(status) ||
      isVerified === true
    )
  );

  const handleApprove = () => {
    const operator = getSavedSignatures().operator;
    const now = new Date().toISOString();
    const calculatedAt = currentApp.retribution?.calculatedAt || now;
    const skrdId = getSkrdStandardNumber({
      ...currentApp,
      retribution: {
        ...currentApp.retribution,
        calculatedAt
      }
    });

    const updatedRetribution = {
      formulaVersion: currentApp.retribution?.formulaVersion || 'PP-16-2021',
      calculatedAt,
      calculatedBy: currentApp.retribution?.calculatedBy || operator.name || 'Operator SIMBG',
      indexFungsi: currentApp.retribution?.indexFungsi ?? 1,
      indexKompleksitas: currentApp.retribution?.indexKompleksitas ?? 1,
      indexPermanensi: currentApp.retribution?.indexPermanensi ?? 1,
      indexJumlahLantai: currentApp.retribution?.indexJumlahLantai ?? 1,
      indeksLokalitas: currentApp.retribution?.indeksLokalitas ?? 0.5,
      shst: currentApp.retribution?.shst ?? customShst,
      buildingSubtotal: currentApp.retribution?.buildingSubtotal ?? 0,
      infrastructureItems: currentApp.retribution?.infrastructureItems ?? [],
      infrastructureSubtotal: currentApp.retribution?.infrastructureSubtotal ?? 0,
      totalPrimary: currentApp.retribution?.totalPrimary ?? 0,
      totalSecondary: currentApp.retribution?.totalSecondary ?? 0,
      variance: currentApp.retribution?.variance ?? 0,
      finalRetribution: currentApp.retribution?.finalRetribution ?? 0,
      ...currentApp.retribution,
      id: skrdId,
      status: 'APPROVED' as const,
      isVerified: true
    };

    const updatedApp: Application = {
      ...currentApp,
      retribution: updatedRetribution,
      lastUpdated: new Date().toISOString()
    };

    setCurrentApp(updatedApp);
    if (onUpdateApplication) {
      onUpdateApplication(updatedApp);
    }
  };

  const handlePrint = () => {
    if (!isApproved) return;
    const operator = getSavedSignatures().operator;
    logPrintAction('SKRD_CETAK_FISIK', currentApp.registerNumber, operator.name, operator.nip);
    triggerPdfPrint('printable-skrd-doc', `SKRD_${currentApp.registerNumber}`);
  };
  
  const handleExport = () => {
    if (!isApproved) return;
    const operator = getSavedSignatures().operator;
    logPrintAction('SKRD_EXPORT_PDF', currentApp.registerNumber, operator.name, operator.nip);
    onExportPdf();
  };

  const [mobileScaleFit, setMobileScaleFit] = useState<boolean>(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm no-print p-0 sm:p-4">
      <div className="bg-slate-100 dark:bg-slate-800 w-full max-w-4xl h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden rounded-none sm:rounded-xl">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shrink-0 gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  PRINT PREVIEW: SKRD
                </h2>

                {/* Status Validation Badge */}
                {isApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    DISETUJUI ({status})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    BELUM DISETUJUI ({status})
                  </span>
                )}
              </div>

              <p className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5 sm:mt-1">
                F4 PAGE SIZING (215mm x 330mm) • {currentApp.registerNumber}
              </p>
            </div>

            {/* Mobile Close Button (top-right on mobile) */}
            <button
              onClick={onClose}
              className="sm:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition"
              aria-label="Tutup"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3 w-auto justify-end">
            <button
              onClick={handleExport}
              disabled={!isApproved}
              title={!isApproved ? 'Perhitungan retribusi harus disetujui terlebih dahulu' : 'Download PDF'}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs uppercase tracking-wide transition rounded disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-50"
            >
              <FileText className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={!isApproved}
              title={!isApproved ? 'Perhitungan retribusi harus disetujui terlebih dahulu' : 'Cetak SKRD'}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs uppercase tracking-wide transition rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              <Printer className="w-4 h-4" />
              Cetak SKRD
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

        {/* Validation Banner if Not Approved */}
        {!isApproved && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-full text-amber-700 dark:text-amber-300 shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <p className="text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 font-medium leading-normal">
                <strong className="uppercase font-bold">Pencetakan Dibatasi:</strong> Status <span className="underline font-bold">{status}</span>. Hanya dokumen retribusi yang disetujui yang dapat dicetak.
              </p>
            </div>
            <button
              onClick={handleApprove}
              className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm transition min-h-[44px] sm:min-h-0"
            >
              <ShieldCheck className="w-4 h-4" />
              Setujui & Validasi Retribusi
            </button>
          </div>
        )}

        {/* Mobile View Indicator / Scale Toggle */}
        <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px] border-b border-slate-300 dark:border-slate-800">
          <span>📱 Pratinjau Dokumen F4</span>
          <button 
            onClick={() => setMobileScaleFit(!mobileScaleFit)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 rounded border border-indigo-200 dark:border-indigo-900"
          >
            {mobileScaleFit ? 'Ukuran Asli (100%)' : 'Sesuai Layar (Fit)'}
          </button>
        </div>

        {/* Scrollable preview area */}
        <div className="flex-1 overflow-auto p-2 sm:p-8 bg-slate-200/50 dark:bg-slate-950 flex justify-center items-start">
          {/* The visual paper preview */}
          <div 
            className={`bg-white shadow-xl ring-1 ring-slate-900/5 print-container transition-transform duration-200 ${
              mobileScaleFit ? 'scale-[0.45] min-[380px]:scale-[0.52] min-[480px]:scale-[0.68] sm:scale-100 origin-top' : 'scale-100 origin-top-left'
            }`}
            style={{ width: '215mm', minHeight: '330mm' }}
          >
            <div id="skrd-print-preview-content">
              <SKRDPrint application={currentApp} customShst={customShst} />
            </div>
          </div>
        </div>

        {/* Sticky Mobile Action Bar */}
        <div className="sm:hidden p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 shadow-lg">
          <button
            onClick={handleExport}
            disabled={!isApproved}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 font-bold text-xs uppercase tracking-wide transition rounded-lg min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!isApproved}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 font-bold text-xs uppercase tracking-wide transition rounded-lg shadow-sm min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="truncate">Cetak SKRD</span>
          </button>
        </div>

      </div>
    </div>
  );
};
