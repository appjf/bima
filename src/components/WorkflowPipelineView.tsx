import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Mail, 
  FileCheck, 
  Award, 
  Calculator, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Printer, 
  MessageSquare, 
  UserCheck, 
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Calendar,
  Building,
  RotateCcw
} from 'lucide-react';
import { Application, WorkflowStage, ExistingImbStatus } from '../types';
import { WORKFLOW_STEPS, getApplicationWorkflowStage, getWorkflowStepIndex } from '../lib/workflowEngine';

interface WorkflowPipelineViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onUpdateApplication: (app: Application) => void;
  onOpenNewApplicationModal: () => void;
  onOpenWhatsApp: (phone: string, text: string) => void;
}

export const WorkflowPipelineView: React.FC<WorkflowPipelineViewProps> = ({
  applications,
  onSelectApplication,
  onUpdateApplication,
  onOpenNewApplicationModal,
  onOpenWhatsApp
}) => {
  const [selectedStageFilter, setSelectedStageFilter] = useState<WorkflowStage | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImbFilter, setSelectedImbFilter] = useState<ExistingImbStatus | 'ALL'>('ALL');

  // Compute stage statistics
  const stageStats = WORKFLOW_STEPS.reduce((acc, step) => {
    acc[step.id] = applications.filter(a => getApplicationWorkflowStage(a) === step.id).length;
    return acc;
  }, {} as Record<WorkflowStage, number>);

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const appStage = getApplicationWorkflowStage(app);
    if (selectedStageFilter !== 'ALL' && appStage !== selectedStageFilter) return false;
    if (selectedImbFilter !== 'ALL' && (app.building.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG') !== selectedImbFilter) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.applicant.name.toLowerCase().includes(q);
      const matchReg = app.registerNumber.toLowerCase().includes(q);
      const matchBld = app.building.name.toLowerCase().includes(q);
      const matchDist = app.building.district.toLowerCase().includes(q);
      return matchName || matchReg || matchBld || matchDist;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              END-TO-END PIPELINE // 8 TAHAPAN ALUR PBG & PROSES VISITE SLF
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 border border-emerald-200">
              PP NO. 16/2021 COMPLIANT
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Alur Proses Penyelenggaraan Bangunan Gedung (PBG & SLF)
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl mt-0.5">
            Monitoring dan eksekusi terstruktur: Input Data → Multi Verif → Visite Lapangan & BA Lapangan (Khusus SLF) → Surat Konsultasi → BA Konsultasi → Verifikasi Perbaikan → BA Pleno → Perhitungan SKRD → Selesai.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewApplicationModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Permohonan Baru</span>
          </button>
        </div>
      </div>

      {/* 8-Step + SLF Visite Interactive Pipeline Stepper (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Tahapan Alur Kerja (Pipeline Progress)
            </span>
            <span className="text-[10px] font-mono text-slate-400">PILIH TAHAPAN UNTUK FILTER BERKAS</span>
          </div>
          {selectedStageFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedStageFilter('ALL')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-mono hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tampilkan Semua ({applications.length})</span>
            </button>
          )}
        </div>

        {/* 9-Step Horizontal Track */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2">
          {WORKFLOW_STEPS.map((step, idx) => {
            const count = stageStats[step.id] || 0;
            const isSelected = selectedStageFilter === step.id;

            return (
              <button
                key={step.id}
                onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : step.id)}
                className={`p-2 text-left border transition flex flex-col justify-between h-28 relative ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-600/30'
                    : count > 0
                    ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                    : 'bg-slate-50/30 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="font-bold">{step.stepCode}</span>
                    <span className={`px-1.5 py-0.2 font-bold ${count > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      {count}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                    {step.shortTitle}
                  </div>
                </div>

                <div className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter truncate mt-1">
                  {step.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari register, nama pemohon, atau lokasi kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedImbFilter}
              onChange={(e) => setSelectedImbFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none"
            >
              <option value="ALL">Semua Status IMB/PBG</option>
              <option value="BELUM_MEMILIKI_IMB_PBG">Belum Ada IMB (Wajib Retribusi)</option>
              <option value="SUDAH_MEMILIKI_IMB">Sudah Ber-IMB (Bebas/SLF)</option>
              <option value="SUDAH_MEMILIKI_PBG">Sudah Ber-PBG</option>
              <option value="BEBAS_RETRIBUSI_KEAGAMAAN">Fungsi Keagamaan (Tarif Rp 0)</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filteredApps.length}</span> dari {applications.length} berkas
        </div>
      </div>

      {/* Application Workflow Dossiers Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Register & Pemohon</th>
                <th className="py-3 px-4">Bangunan & Lokasi</th>
                <th className="py-3 px-4">Status IMB Eksisting</th>
                <th className="py-3 px-4">Tahapan Saat Ini</th>
                <th className="py-3 px-4">Indikator Alur</th>
                <th className="py-3 px-4 text-right">Aksi Alur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Tidak ada permohonan yang sesuai dengan filter tahapan ini.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const stage = getApplicationWorkflowStage(app);
                  const stepIndex = getWorkflowStepIndex(stage);
                  const currentStepDef = WORKFLOW_STEPS[stepIndex] || WORKFLOW_STEPS[0];

                  return (
                    <tr 
                      key={app.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onSelectApplication(app)}
                    >
                      {/* Register & Applicant */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1.5">
                          <span>{app.registerNumber}</span>
                          {app.permitType && (
                            <span className={`text-[9px] px-1 py-0.2 font-mono font-bold ${
                              app.permitType.startsWith('SLF') 
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700' 
                                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            }`}>
                              {app.permitType.startsWith('SLF') ? 'SLF' : 'PBG'}
                            </span>
                          )}
                        </div>
                        <div className="font-sans font-semibold text-slate-900 dark:text-white mt-0.5">
                          {app.applicant.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {app.applicant.phone}
                        </div>
                      </td>

                      {/* Building & Location */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-200 max-w-xs truncate">
                          {app.building.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{app.building.functionType}</span>
                          <span>•</span>
                          <span>{app.building.buildingArea} m²</span>
                          <span>•</span>
                          <span>Kec. {app.building.district}</span>
                        </div>
                      </td>

                      {/* Existing IMB Status */}
                      <td className="py-3 px-4">
                        {app.building.existingImbStatus === 'SUDAH_MEMILIKI_IMB' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 px-2 py-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            SUDAH BER-IMB
                          </span>
                        ) : app.building.functionType === 'KEAGAMAAN' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 px-2 py-0.5">
                            TARIF RP 0 (KEAGAMAAN)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 px-2 py-0.5">
                            <Calculator className="w-3 h-3" />
                            BELUM IMB (WAJIB SKRD)
                          </span>
                        )}
                      </td>

                      {/* Current Stage */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold text-[10px] flex items-center justify-center">
                            {currentStepDef.stepNumber}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                            {currentStepDef.shortTitle}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {currentStepDef.badge}
                        </div>
                      </td>

                      {/* Pipeline Indicator Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="w-32 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>Step {stepIndex + 1}/8</span>
                            <span>{Math.round(((stepIndex + 1) / 8) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-300"
                              style={{ width: `${((stepIndex + 1) / 8) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white font-mono text-xs font-bold transition uppercase"
                        >
                          <span>Buka Alur</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards (< 768px) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 pb-24">
          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs">
              Tidak ada permohonan yang sesuai dengan filter tahapan ini.
            </div>
          ) : (
            filteredApps.map((app) => {
              const stage = getApplicationWorkflowStage(app);
              const stepIndex = getWorkflowStepIndex(stage);
              const currentStepDef = WORKFLOW_STEPS[stepIndex] || WORKFLOW_STEPS[0];

              return (
                <div 
                  key={app.id}
                  onClick={() => onSelectApplication(app)}
                  className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/60 transition cursor-pointer"
                >
                  {/* Card Header: Register & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {app.registerNumber}
                        </span>
                        {app.permitType && (
                          <span className={`text-[9px] px-1 py-0.2 font-mono font-bold ${
                            app.permitType.startsWith('SLF') 
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700' 
                              : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          }`}>
                            {app.permitType.startsWith('SLF') ? 'SLF' : 'PBG'}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mt-0.5">
                        {app.building.name}
                      </h4>
                    </div>

                    {app.building.existingImbStatus === 'SUDAH_MEMILIKI_IMB' ? (
                      <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 border border-emerald-300 shrink-0">
                        BER-IMB
                      </span>
                    ) : app.building.functionType === 'KEAGAMAAN' ? (
                      <span className="text-[9px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 border border-blue-300 shrink-0">
                        RP 0
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 border border-amber-300 shrink-0">
                        SKRD
                      </span>
                    )}
                  </div>

                  {/* Applicant & District */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <div>
                      Pemohon: <span className="font-semibold text-slate-800 dark:text-slate-200">{app.applicant.name}</span>
                    </div>
                    <div className="text-[11px] font-mono">
                      Kec. {app.building.district}
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px]">
                          {currentStepDef.stepNumber}
                        </span>
                        <span>{currentStepDef.shortTitle}</span>
                      </span>
                      <span className="text-slate-400">Step {stepIndex + 1}/8</span>
                    </div>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((stepIndex + 1) / 8) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectApplication(app)}
                      className="flex-1 py-2 px-3 bg-indigo-600 active:bg-indigo-700 text-white font-mono font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Buka Detail & Verifikasi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const clean = app.applicant.phone.replace(/[^0-9]/g, '');
                        const wa = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
                        window.open(`https://wa.me/${wa}?text=${encodeURIComponent(`Halo Bapak/Ibu ${app.applicant.name}, mengenai permohonan PBG/SLF ${app.registerNumber} (${app.building.name})...`)}`, '_blank');
                      }}
                      className="py-2 px-3 bg-emerald-600 active:bg-emerald-700 text-white font-mono font-bold text-xs flex items-center gap-1"
                      title="Hubungi Pemohon via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WA</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Sticky Bottom Navigation & Action Bar for Mobile (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-700/80 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] p-2.5 px-4 flex items-center justify-between gap-3 font-mono">
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400">
            {selectedStageFilter !== 'ALL' ? (
              <span className="text-indigo-400 font-bold">
                Filter: {WORKFLOW_STEPS.find(s => s.id === selectedStageFilter)?.shortTitle}
              </span>
            ) : (
              <span>Semua Tahapan Pipeline</span>
            )}
          </div>
          <div className="text-xs font-bold text-white">
            {filteredApps.length} Permohonan
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedStageFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedStageFilter('ALL')}
              className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold uppercase border border-slate-700"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewApplicationModal}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Permohonan Baru</span>
          </button>
        </div>
      </div>

    </div>
  );
};
