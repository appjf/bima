import React, { useState } from 'react';
import { 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  MessageSquare, 
  Copy, 
  Eye, 
  Search, 
  Layers, 
  ShieldAlert,
  Sparkles,
  Printer
} from 'lucide-react';
import { Application } from '../types';
import { MASTER_DOCUMENT_RULES, runDocumentVerification } from '../lib/ruleEngine';
import { getStoredWhatsAppSettings } from '../lib/storage';
import { compileWhatsAppMessage } from '../lib/notificationTemplateEngine';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';
import { LampiranVerifikasiPrint } from './LampiranVerifikasiPrint';
import { VERIFICATION_NOTE_TEMPLATES, VerificationNoteTemplate } from '../lib/templateEngine';

interface VerificationViewProps {
  applications: Application[];
  onBatchVerifyAll: () => void;
  onSelectApplication: (app: Application) => void;
  onOpenWhatsApp: (phone: string, text: string) => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  applications,
  onBatchVerifyAll,
  onSelectApplication,
  onOpenWhatsApp
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const handleCopyTemplate = (template: VerificationNoteTemplate) => {
    navigator.clipboard.writeText(template.text);
    setCopiedTemplateId(template.id);
    setTimeout(() => {
      setCopiedTemplateId(null);
    }, 2000);
  };

  const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0];
  const evalResult = selectedApp ? runDocumentVerification(selectedApp) : null;

  // Compile WA text from customized template if available
  let dynamicWaText = evalResult?.recommendationApplicantWa || '';
  if (selectedApp && evalResult) {
    const waSettings = getStoredWhatsAppSettings();
    const isComp = evalResult.status === 'VALID';
    const targetStatus = isComp ? 'READY_FOR_CONSULTATION' : 'INCOMPLETE';
    const activeTpl = waSettings.templates.find(t => t.triggerStatus === targetStatus && t.isActive);
    if (activeTpl) {
      const listDocs = [...evalResult.missingMandatoryDocs, ...evalResult.invalidDocs].map((doc, idx) => `${idx + 1}. ${doc}`).join('\n');
      dynamicWaText = compileWhatsAppMessage(
        activeTpl.templateBody, 
        selectedApp, 
        { daftar_kekurangan: listDocs || '- Seluruh berkas lengkap dan valid.' },
        waSettings
      );
    }
  }

  const filteredApps = applications.filter(a => 
    a.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
    a.applicant.name.toLowerCase().includes(search.toLowerCase()) ||
    a.building.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              RULE ENGINE // MATRIX EVALUATION
            </span>
            <span className="text-[10px] font-mono text-slate-400">PP 16/2021 & DPUPR GARUT</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Verifikasi Dokumen & Rekomendasi Teknis
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mt-0.5">
            Sistem mencocokkan fungsi dan kompleksitas bangunan terhadap matriks aturan dokumen wajib, mendeteksi formula error, dan menghasilkan draf instruksi perbaikan untuk pemohon.
          </p>
        </div>

        <button
          onClick={onBatchVerifyAll}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-xs transition"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Verifikasi Semua Berkas</span>
        </button>
      </div>

      {/* Two Columns: Left List & Right Active Verification Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Application Selection List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Daftar Berkas ({filteredApps.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-400">SELECT DOSSIER</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari register atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
            />
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredApps.map((app) => {
              const res = runDocumentVerification(app);
              const isSelected = app.id === selectedApp?.id;

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`p-3 border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 ring-1 ring-indigo-600/30'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900 dark:text-white truncate max-w-[180px]">
                      {app.applicant.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 font-mono font-bold ${
                      res.status === 'VALID'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {res.scorePercentage}% VALID
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-bold">
                    {app.registerNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {app.building.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Verification Engine Result */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          {selectedApp && evalResult ? (
            <>
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {selectedApp.registerNumber}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 font-mono font-bold">
                      {selectedApp.building.functionType} // {selectedApp.building.complexity}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {selectedApp.building.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Pemohon: {selectedApp.applicant.name} ({selectedApp.applicant.phone})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerPdfPrint('printable-daftar-simak-area-verif', `Daftar_Simak_${selectedApp.registerNumber}`)}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 border border-slate-700 uppercase transition"
                    title="Cetak Daftar Simak Verifikasi SIMBG (PDF)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Daftar Simak (PDF)</span>
                  </button>

                  <button
                    onClick={() => onSelectApplication(selectedApp)}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 uppercase hover:bg-indigo-600 hover:text-white transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Berkas</span>
                  </button>
                </div>
              </div>

              {/* Hidden printable element for VerificationView */}
              <div id="printable-daftar-simak-area-verif" className="hidden">
                <LampiranVerifikasiPrint application={selectedApp} />
              </div>

              {/* Status Banner */}
              <div className={`p-4 border flex items-center justify-between font-mono ${
                evalResult.status === 'VALID'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-3">
                  {evalResult.status === 'VALID' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {evalResult.status === 'VALID' ? 'STATUS: DOKUMEN LENGKAP & VALID' : 'STATUS: PERLU PERBAIKAN / REVISI'}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 font-sans">
                      {evalResult.totalValid} dari {evalResult.totalRequired} dokumen wajib terpenuhi
                    </div>
                  </div>
                </div>

                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {evalResult.scorePercentage}%
                </span>
              </div>

              {/* Missing Documents Breakdown if any */}
              {evalResult.missingMandatoryDocs.length > 0 && (
                <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 space-y-2">
                  <span className="font-bold text-xs text-rose-800 dark:text-rose-300 block font-mono uppercase">
                    Dokumen Wajib yang Belum Tersedia ({evalResult.missingMandatoryDocs.length}):
                  </span>
                  <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-1 font-mono text-[11px]">
                    {evalResult.missingMandatoryDocs.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Invalid or Notes */}
              {evalResult.invalidDocs.length > 0 && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 space-y-2">
                  <span className="font-bold text-xs text-amber-800 dark:text-amber-300 block font-mono uppercase">
                    Dokumen Perlu Perbaikan Teknis ({evalResult.invalidDocs.length}):
                  </span>
                  <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 space-y-1 font-mono text-[11px]">
                    {evalResult.invalidDocs.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Automated WhatsApp Draft Box (Geometric Balance Terminal Styling) */}
              <div className="bg-slate-900 text-white p-5 space-y-3 border border-slate-800 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5 uppercase">
                    <MessageSquare className="w-4 h-4" />
                    <span>Draf Instruksi Pelayanan (WhatsApp)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(dynamicWaText)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-bold uppercase transition"
                    >
                      {copied ? 'COPIED!' : 'SALIN'}
                    </button>
                    <button
                      onClick={() => onOpenWhatsApp(selectedApp.applicant.phone, dynamicWaText)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-[11px] text-white font-bold uppercase transition"
                    >
                      KIRIM WA
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 max-h-[160px] overflow-y-auto">
                  {dynamicWaText}
                </div>
              </div>

              {/* Bank Template Catatan Verifikasi (1-Klik Salin) */}
              <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 font-mono uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bank Template Catatan Verifikasi Operator (1-Klik Salin)</span>
                  </span>
                  
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
                    {['ALL', 'UMUM', 'ARSITEKTUR', 'STRUKTUR', 'MEP', 'TANAH', 'VALID'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setTemplateCategoryFilter(cat)}
                        className={`px-2 py-0.5 rounded transition ${templateCategoryFilter === cat ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {VERIFICATION_NOTE_TEMPLATES
                    .filter(tpl => templateCategoryFilter === 'ALL' || tpl.category === templateCategoryFilter || (templateCategoryFilter === 'VALID' && tpl.category === 'VALID'))
                    .map(tpl => {
                      const isCopied = copiedTemplateId === tpl.id;
                      return (
                        <div 
                          key={tpl.id}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded flex flex-col justify-between gap-1.5 text-[11px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[10px]">
                              {tpl.label}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.2 font-mono font-bold rounded ${
                              tpl.suggestedStatus === 'VALID' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {tpl.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-tight">
                            {tpl.text}
                          </p>
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleCopyTemplate(tpl)}
                              className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded flex items-center gap-1 transition ${
                                isCopied 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              }`}
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{isCopied ? 'TERSALIN!' : 'SALIN 1-KLIK'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Master Rule Matrix Reference */}
              <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono uppercase">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Matriks Aturan Dokumen Aktif ({MASTER_DOCUMENT_RULES.length} Rules)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {MASTER_DOCUMENT_RULES.map(rule => {
                    const isReq = rule.isRequired(selectedApp);
                    return (
                      <div key={rule.code} className="p-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={rule.name}>
                          {rule.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                          isReq ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isReq ? 'WAJIB' : 'OPSIONAL'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </>
          ) : (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              PILIH SALAH SATU BERKAS DI SEBELAH KIRI UNTUK MELIHAT EVALUASI RULE ENGINE.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
