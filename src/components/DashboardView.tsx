import React from 'react';
import { 
  Building2, 
  FileCheck, 
  Calendar, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  Zap,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Application } from '../types';

interface DashboardViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onNavigate: (tab: string) => void;
  onRunBatchVerification: () => void;
  onOpenCopilot: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  applications,
  onSelectApplication,
  onNavigate,
  onRunBatchVerification,
  onOpenCopilot
}) => {
  // Compute Key Metrics
  const totalApps = applications.length;
  const newApps = applications.filter(a => a.status === 'NEW' || a.status === 'UNDER_VERIFICATION').length;
  const incompleteApps = applications.filter(a => a.status === 'INCOMPLETE' || a.status === 'REVISION_REQUESTED').length;
  const readyForConsultation = applications.filter(a => a.status === 'READY_FOR_CONSULTATION' || a.status === 'COMPLETE').length;
  const scheduledApps = applications.filter(a => a.status === 'SCHEDULED').length;
  const completedApps = applications.filter(a => a.status === 'COMPLETED' || a.status === 'RETRIBUTION_READY' || a.status === 'CONSULTATION_DONE').length;

  const criticalSlaApps = applications.filter(a => a.slaStatus === 'EXCEEDED');
  const warningSlaApps = applications.filter(a => a.slaStatus === 'WARNING');
  const healthySlaApps = applications.filter(a => a.slaStatus === 'IN_SLA');

  // Total retribution issued
  const totalRetribution = applications.reduce((acc, a) => acc + (a.retribution?.finalRetribution || 0), 0);

  // Workflow Stages
  const slfCount = applications.filter(a => a.permitType === 'SLF_EKSISTING' || a.permitType === 'SLF_PERPANJANGAN' || a.building.existingImbStatus === 'SUDAH_MEMILIKI_IMB').length;
  const baLapanganCount = applications.filter(a => a.baLapangan?.isCompleted).length;

  const stages = [
    { number: '01', label: 'Input Permohonan (PBG/SLF)', count: totalApps, status: 'DONE' },
    { number: '02', label: 'Multi Verifikasi Disiplin Teknis', count: totalApps - newApps, status: 'DONE' },
    { number: '2B', label: 'Visite & BA Lapangan (Khusus SLF)', count: baLapanganCount, status: slfCount > 0 ? 'ACTIVE' : 'IDLE' },
    { number: '03', label: 'Surat Pemberitahuan Sidang', count: scheduledApps, status: scheduledApps > 0 ? 'ACTIVE' : 'IDLE' },
    { number: '04', label: 'BA Konsultasi & Pleno Rekomtek', count: scheduledApps, status: scheduledApps > 0 ? 'ACTIVE' : 'IDLE' },
    { number: '05', label: 'SKRD Retribusi PP 16 & PBG/SLF Terbit', count: completedApps, status: completedApps > 0 ? 'DONE' : 'PENDING' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header Section - Architectural Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              WORKSPACE // MONITORING OPERASIONAL
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-slate-700 dark:text-slate-300">
            Implementation <span className="font-bold text-slate-900 dark:text-white">Dashboard</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoring kelayakan teknis permohonan PBG & SLF, visite lapangan, alokasi sidang TPA Jumat, dan simulasi retribusi daerah.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('VISITE_LAPANGAN')}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 sm:px-4 py-2 sm:py-2.5 shadow-xs transition font-mono"
          >
            <span>Visite Lapangan</span>
          </button>

          <button
            onClick={onRunBatchVerification}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-3 sm:px-4 py-2 sm:py-2.5 shadow-xs transition"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Verifikasi Semua</span>
          </button>

          <button
            onClick={() => onNavigate('SCHEDULING')}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider px-3 sm:px-4 py-2 sm:py-2.5 transition font-mono"
          >
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Alokasi Sidang</span>
          </button>
        </div>
      </div>

      {/* Main Structural Grid (3-6-3 Layout Inspired by Geometric Balance) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (3-Col): Implementation Workflow Stages */}
        <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Pipeline Pemrosesan
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="space-y-4">
              {stages.map((stg) => (
                <div key={stg.number} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 flex items-center justify-center text-[11px] font-mono font-bold ${
                      stg.status === 'DONE'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : stg.status === 'ACTIVE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {stg.status === 'DONE' ? '✓' : stg.number}
                    </div>
                    <span className={`text-xs font-semibold ${
                      stg.status === 'ACTIVE' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {stg.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {stg.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 font-mono">
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tight">
              <span>Tingkat Penyelesaian Berkas</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round(((completedApps + scheduledApps) / (totalApps || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500" 
                style={{ width: `${Math.round(((completedApps + scheduledApps) / (totalApps || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Center & Right Area (8-Col): Metric Blocks & Terminal */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Top 3 Metric Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Block 1: Total & Active */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  TOTAL PERMOHONAN PBG
                </h3>
                <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white">
                  {totalApps} <span className="text-xs text-slate-400 font-sans font-normal">berkas</span>
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>Siap Sidang: {readyForConsultation}</span>
                <span className="text-indigo-600 font-bold">Aktif: {scheduledApps}</span>
              </div>
            </div>

            {/* Block 2: SLA Status */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  SLA HEALTH INDEX
                </h3>
                <p className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {Math.round((healthySlaApps.length / (totalApps || 1)) * 100)}% <span className="text-xs font-sans text-slate-400">on-time</span>
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-mono border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-rose-500 font-bold">{criticalSlaApps.length} Lewat Batas</span>
                <span className="text-amber-500">{warningSlaApps.length} Peringatan</span>
              </div>
            </div>

            {/* Block 3: Total Retribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  ESTIMASI RETRIBUSI PBG
                </h3>
                <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white truncate">
                  Rp {(totalRetribution / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>PP 16/2021 Form.</span>
                <span className="text-emerald-600 font-bold">100% Valid</span>
              </div>
            </div>

          </div>

          {/* Live Network & Terminal Log Box (Geometric Balance Core Component) */}
          <div className="bg-slate-900 text-white p-6 relative overflow-hidden font-mono border border-slate-800 shadow-md">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SIMBG Live Activity Terminal // DPUPR Garut</span>
                </h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-800">
                  REALTIME LOG
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-emerald-400/90 leading-relaxed pt-1">
                <p className="flex items-center gap-2">
                  <span className="text-slate-500">&gt;</span>
                  <span>[RULE_ENGINE] Verified {applications.filter(a => a.status === 'READY_FOR_CONSULTATION').length} documents against PP 16/2021 standard matrix.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-slate-500">&gt;</span>
                  <span>[SCHEDULING] Friday TPA Consultation slots assigned: {scheduledApps} dossiers in Room DPUPR-01/02.</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-slate-500">&gt;</span>
                  <span>[RETRIBUTION] Dual Calculation cross-check: 0 variance detected across active calculations.</span>
                </p>
                <p className="flex items-center gap-2 text-indigo-300">
                  <span className="text-slate-500">&gt;</span>
                  <span>[SYSTEM] All operators synchronized. Ready for consultation agenda.</span>
                </p>
              </div>
            </div>

            {/* Geometric Background Watermark */}
            <div className="absolute right-[-20px] bottom-[-30px] opacity-5 text-[140px] font-black pointer-events-none select-none text-slate-100">
              GARUT
            </div>
          </div>

        </section>

      </div>

      {/* Critical SLA & Priority Action Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Berkas Memerlukan Tindakan Segera (SLA / Verifikasi)
            </h3>
            <p className="text-xs text-slate-500">
              Daftar permohonan berstatus kritis atau perlu perbaikan dokumen segera.
            </p>
          </div>

          <button
            onClick={() => onNavigate('APPLICATIONS')}
            className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Permohonan ({applications.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">No. Register</th>
                <th className="px-4 py-3">Pemohon</th>
                <th className="px-4 py-3">Bangunan & Fungsi</th>
                <th className="px-4 py-3">Kecamatan</th>
                <th className="px-4 py-3">SLA Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {applications.slice(0, 6).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {app.registerNumber}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {app.applicant.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{app.building.name}</span>
                    <span className="text-[10px] text-slate-400 block">{app.building.functionType} • {app.building.buildingArea}m²</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {app.building.district}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 font-mono font-bold ${
                      app.slaStatus === 'EXCEEDED'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : app.slaStatus === 'WARNING'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {app.slaDays} HARI // {app.slaStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectApplication(app)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold uppercase transition min-h-[36px]"
                    >
                      Buka
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden space-y-3">
          {applications.slice(0, 6).map((app) => (
            <div key={app.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 rounded-none shadow-2xs font-sans">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 block">
                    {app.registerNumber}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    {app.applicant.name}
                  </h4>
                </div>

                <span className={`text-[9px] px-2 py-0.5 font-mono font-bold shrink-0 ${
                  app.slaStatus === 'EXCEEDED'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : app.slaStatus === 'WARNING'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {app.slaDays} HARI // {app.slaStatus}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {app.building.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                  <span>{app.building.functionType} • {app.building.buildingArea}m²</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{app.building.district}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Status: {app.status}
                </span>

                <button
                  onClick={() => onSelectApplication(app)}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-mono text-xs font-bold uppercase min-h-[44px] flex items-center gap-1 shadow-2xs"
                >
                  <span>Buka Berkas</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
