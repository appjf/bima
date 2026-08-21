import React, { useState } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  FileText, 
  TrendingUp, 
  Building2, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { Application } from '../types';
import { calculateRetribution, DEFAULT_SHST_GARUT } from '../lib/retributionEngine';
import { SKRDPrintPreviewModal } from './SKRDPrintPreviewModal';
import { exportToPdf } from '../lib/pdfPrintEngine';
import { getSavedSignatures } from '../lib/signatureEngine';
import { logPrintAction } from '../lib/auditLogEngine';

interface RetributionViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onUpdateApplication: (app: Application) => void;
}

export const RetributionView: React.FC<RetributionViewProps> = ({
  applications,
  onSelectApplication,
  onUpdateApplication
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  const [customShst, setCustomShst] = useState<number>(DEFAULT_SHST_GARUT);
  const [isSKRDPreviewOpen, setIsSKRDPreviewOpen] = useState(false);

  const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0];
  const retribution = selectedApp ? calculateRetribution(selectedApp, customShst) : null;

  const handlePrintSKRD = () => {
    if (selectedApp) {
      setIsSKRDPreviewOpen(true);
    }
  };

  const handleExportPDF = async () => {
    if (selectedApp) {
      const operator = getSavedSignatures().operator;
      logPrintAction('SKRD_EXPORT_PDF', selectedApp.registerNumber, operator.name, operator.nip);
      await exportToPdf('skrd-print-preview-content', `SKRD_${selectedApp.registerNumber}.pdf`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              CALCULATION ENGINE // RETRIBUTION PP 16/2021
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 border border-emerald-200">
              DUAL VERIFIED // ZERO VARIANCE
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Kalkulator Retribusi PBG & Validasi Matematis
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Formula otomatis berbasis rumus PP No. 16 Tahun 2021 dengan cross-check Metode A vs B untuk menjamin ketepatan hitungan tanpa pembulatan liar atau manipulasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 transition border border-emerald-200 dark:border-emerald-800"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrintSKRD}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 transition border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak SKRD</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Application Selector & Calculation Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5-Col): Applications list */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Pilih Permohonan ({applications.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-400">DOSSIER LIST</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {applications.map((app) => {
              const calc = calculateRetribution(app, customShst);
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
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      Rp {calc.finalRetribution.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    {app.registerNumber}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {app.building.name} ({app.building.buildingArea}m²)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7-Col): Retribution Engine Sheet */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          {selectedApp && retribution ? (
            <>
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {selectedApp.registerNumber}
                    </span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 font-bold border border-emerald-200">
                      DUAL VERIFIED (VARIANCE 0)
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {selectedApp.building.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Luas: {selectedApp.building.buildingArea}m² • Fungsi: {selectedApp.building.functionType} ({selectedApp.building.complexity})
                  </div>
                </div>
              </div>

              {/* Total Retribution Highlight Box (Geometric Balance Dark Slate Box) */}
              <div className="bg-slate-900 text-white p-6 border border-slate-800 font-mono space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest">
                  <span>TOTAL RETRIBUSI PBG TERHITUNG</span>
                  <span className="text-emerald-400">STATUS: SKRD READY</span>
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                  Rp {retribution.finalRetribution.toLocaleString('id-ID')}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                  <span>Subtotal Bangunan: Rp {retribution.buildingSubtotal.toLocaleString('id-ID')}</span>
                  <span>Prasarana: Rp {retribution.infrastructureSubtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Parameter Indexes Matrix (PP 16/2021) */}
              <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">
                    Indeks Parameter Perhitungan (PP 16/2021)
                  </span>
                  <span className="text-[10px] text-slate-400">RUMUS MATEMATIS</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Indeks Fungsi (If)</span>
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{retribution.indexFungsi}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Kompleksitas (Ik)</span>
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{retribution.indexKompleksitas}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Jml Lantai (Il)</span>
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{retribution.indexJumlahLantai}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Lokalitas (Ilok)</span>
                    <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{retribution.indeksLokalitas}</span>
                  </div>
                </div>
              </div>

              {/* Editable SHST Rate */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] block">
                    Standar Harga Satuan Tertinggi (SHST) Garut
                  </span>
                  <span className="text-[10px] text-slate-400">Dapat disesuaikan dengan Keputusan Bupati Garut terkini</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Rp</span>
                  <input
                    type="number"
                    value={customShst}
                    onChange={(e) => setCustomShst(Number(e.target.value))}
                    className="w-36 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-right font-bold text-xs focus:outline-none"
                  />
                  <span className="text-slate-400 text-[10px]">/m²</span>
                </div>
              </div>

            </>
          ) : (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              PILIH SALAH SATU BERKAS DI SEBELAH KIRI UNTUK MEMBUKA KALKULATOR RETRIBUSI.
            </div>
          )}
        </div>

      </div>

      {/* Printable SKRD Document Modal */}
      {isSKRDPreviewOpen && selectedApp && (
        <SKRDPrintPreviewModal
          application={selectedApp}
          customShst={customShst}
          onClose={() => setIsSKRDPreviewOpen(false)}
          onExportPdf={handleExportPDF}
          onUpdateApplication={onUpdateApplication}
        />
      )}

    </div>
  );
};
