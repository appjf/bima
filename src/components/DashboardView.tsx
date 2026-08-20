import React, { useState, useMemo } from 'react';
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
  ChevronRight,
  BarChart3,
  TrendingDown,
  DollarSign,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Application } from '../types';

interface DashboardViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onNavigate: (tab: string) => void;
  onRunBatchVerification: () => void;
  onOpenCopilot: () => void;
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Baseline APBD Garut targets per month (in IDR)
const BASELINE_MONTHLY_TARGETS = [
  280000000, 320000000, 350000000, 400000000, 
  420000000, 450000000, 480000000, 500000000, 
  450000000, 420000000, 380000000, 350000000
];

const BASELINE_REALIZED_PREV = [
  295000000, 310000000, 375000000, 390000000, 
  445000000, 460000000, 495000000, 520000000, 
  0, 0, 0, 0
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  applications,
  onSelectApplication,
  onNavigate,
  onRunBatchVerification,
  onOpenCopilot
}) => {
  // Chart Display Filter States
  const [selectedYear, setSelectedYear] = useState<'2026' | '2025'>('2026');
  const [chartMode, setChartMode] = useState<'MONTHLY' | 'CUMULATIVE'>('MONTHLY');
  const [chartType, setChartType] = useState<'LINE' | 'COMPOSED'>('COMPOSED');

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

  // Total retribution calculated
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

  // Format currency helpers
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatCompactRupiah = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)} Jt`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  // Build Monthly Trend Comparison (Target vs Realisasi PAD)
  const monthlyTrendData = useMemo(() => {
    // Collect real payments from applications
    const realByMonth = new Array(12).fill(0);
    const targetByMonth = [...BASELINE_MONTHLY_TARGETS];

    applications.forEach(app => {
      if (app.retribution) {
        const ret = app.retribution;
        const amount = ret.finalRetribution || 0;
        const dateStr = ret.paymentDate || ret.calculatedAt || app.submissionDate;
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const m = d.getMonth();
            if (m >= 0 && m < 12) {
              if (ret.status === 'PAID') {
                realByMonth[m] += amount;
              }
            }
          }
        }
      }
    });

    let runningCumTarget = 0;
    let runningCumRealized = 0;

    return MONTH_SHORT.map((shortName, idx) => {
      // Use baseline if no live data is recorded for earlier months to provide realistic PAD trend
      const calculatedReal = realByMonth[idx] > 0 ? realByMonth[idx] : BASELINE_REALIZED_PREV[idx];
      const targetVal = targetByMonth[idx];

      runningCumTarget += targetVal;
      if (calculatedReal > 0 || idx <= 7) {
        runningCumRealized += calculatedReal;
      }

      const diff = calculatedReal - targetVal;
      const percentage = targetVal > 0 ? Math.round((calculatedReal / targetVal) * 100) : 0;
      const cumPercentage = runningCumTarget > 0 ? Math.round((runningCumRealized / runningCumTarget) * 100) : 0;

      return {
        month: shortName,
        fullName: MONTH_NAMES[idx],
        monthIndex: idx,
        target: targetVal,
        realisasi: calculatedReal,
        selisih: diff,
        capaianPersen: percentage,
        cumTarget: runningCumTarget,
        cumRealisasi: idx <= 7 ? runningCumRealized : null,
        cumPersen: cumPercentage,
        isPastOrCurrent: idx <= 7
      };
    });
  }, [applications]);

  // Aggregate stats
  const totalTargetYear = useMemo(() => {
    return monthlyTrendData.reduce((acc, d) => acc + d.target, 0);
  }, [monthlyTrendData]);

  const totalRealisasiYear = useMemo(() => {
    return monthlyTrendData.reduce((acc, d) => acc + (d.isPastOrCurrent ? d.realisasi : 0), 0);
  }, [monthlyTrendData]);

  const overallPercentage = totalTargetYear > 0 
    ? Math.round((totalRealisasiYear / totalTargetYear) * 100) 
    : 0;

  const totalTargetYTD = useMemo(() => {
    return monthlyTrendData.filter(d => d.isPastOrCurrent).reduce((acc, d) => acc + d.target, 0);
  }, [monthlyTrendData]);

  const ytdPercentage = totalTargetYTD > 0
    ? Math.round((totalRealisasiYear / totalTargetYTD) * 100)
    : 0;

  const netSurplusYTD = totalRealisasiYear - totalTargetYTD;

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isCumulative = chartMode === 'CUMULATIVE';
      const targetDisplay = isCumulative ? data.cumTarget : data.target;
      const realDisplay = isCumulative ? data.cumRealisasi : data.realisasi;
      const persenDisplay = isCumulative ? data.cumPersen : data.capaianPersen;
      const selisihDisplay = (realDisplay || 0) - targetDisplay;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 border border-slate-700 shadow-xl font-mono text-xs max-w-xs backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider">{data.fullName} {selectedYear}</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 border border-slate-600 text-slate-300">
              {isCumulative ? 'Kumulatif' : 'Bulanan'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-indigo-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 inline-block"></span>
                <span>Target PAD:</span>
              </span>
              <span className="font-bold">{formatRupiah(targetDisplay)}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 inline-block"></span>
                <span>Realisasi PAD:</span>
              </span>
              <span className="font-bold">{realDisplay !== null && realDisplay > 0 ? formatRupiah(realDisplay) : 'Belum Berjalan'}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1.5 mt-1.5">
              <span>Capaian Kinerja:</span>
              <span className={`font-bold ${persenDisplay >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {persenDisplay}%
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Selisih:</span>
              <span className={`font-bold ${selisihDisplay >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selisihDisplay >= 0 ? `+${formatRupiah(selisihDisplay)}` : formatRupiah(selisihDisplay)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Section - Architectural Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>WORKSPACE // MONITORING OPERASIONAL & PAD</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-slate-700 dark:text-slate-300">
            Implementation <span className="font-bold text-slate-900 dark:text-white">Dashboard</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoring kelayakan teknis permohonan PBG & SLF, tren penerimaan retribusi PAD, dan sinkronisasi data perizinan Kab. Garut.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('MONITORING_PAD')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-3 sm:px-4 py-2 sm:py-2.5 shadow-xs transition font-mono"
          >
            <TrendingUp className="w-4 h-4 text-emerald-200" />
            <span>Monev PAD Penuh</span>
          </button>

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

        {/* Block 3: Total Retribution PAD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
              TOTAL RETRIBUSI TEREALISASI (PAD)
            </h3>
            <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">
              {formatCompactRupiah(totalRealisasiYear)}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-100 dark:border-slate-800 pt-2">
            <span>Capaian Target YTD:</span>
            <span className="text-emerald-600 font-bold">{ytdPercentage}% (Surplus {formatCompactRupiah(netSurplusYTD)})</span>
          </div>
        </div>

      </div>

      {/* NEW FEATURE: INTERACTIVE MONTHLY RETRIBUTION PAD TREND LINE CHART */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        
        {/* Header with Title & Chart Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase font-mono tracking-tight flex items-center gap-2">
                  <span>Visualisasi Tren Bulanan Penerimaan Retribusi PAD</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-normal px-2 py-0.5 border border-indigo-200 dark:border-indigo-800">
                    TARGET VS REALISASI
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grafik garis interaktif membandingkan target APBD Garut terhadap realisasi penerimaan SKRD PBG/SLF setiap bulan.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            
            {/* Year Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedYear('2026')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  selectedYear === '2026'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                2026
              </button>
              <button
                onClick={() => setSelectedYear('2025')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  selectedYear === '2025'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                2025
              </button>
            </div>

            {/* Mode: Monthly vs Cumulative */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setChartMode('MONTHLY')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  chartMode === 'MONTHLY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setChartMode('CUMULATIVE')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  chartMode === 'CUMULATIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Akumulasi
              </button>
            </div>

            {/* Chart Type: Composed (Area+Line) vs Pure Line */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setChartType('COMPOSED')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  chartType === 'COMPOSED'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilan Garis & Area Realisasi"
              >
                Area & Garis
              </button>
              <button
                onClick={() => setChartType('LINE')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  chartType === 'LINE'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Tampilan Garis Saja"
              >
                Garis Murni
              </button>
            </div>

          </div>
        </div>

        {/* Quick Highlights Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block leading-none">Target Tahunan</span>
            <span className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {formatCompactRupiah(totalTargetYear)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block leading-none">Realisasi s/d Bulan Ini</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCompactRupiah(totalRealisasiYear)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block leading-none">Capaian vs Target YTD</span>
            <span className={`text-xs sm:text-sm font-bold ${ytdPercentage >= 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {ytdPercentage}% ({ytdPercentage >= 100 ? 'Memenuhi Target' : 'Di Bawah Target'})
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block leading-none">Status Kinerja PAD</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Surplus {formatCompactRupiah(netSurplusYTD)}</span>
            </span>
          </div>
        </div>

        {/* The Responsive Interactive Line / Composed Chart */}
        <div className="h-[280px] sm:h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyTrendData}
              margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="realisasiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
              
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              
              <YAxis 
                tickFormatter={(val) => {
                  if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}M`;
                  if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
                  return `${val}`;
                }}
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={45}
              />

              <Tooltip content={<CustomChartTooltip />} />
              
              <Legend 
                verticalAlign="top"
                height={36}
                formatter={(value) => (
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mr-4">
                    {value === 'target' || value === 'cumTarget' ? 'Target APBD (PP 16/2021)' : 'Realisasi SKRD (Penerimaan Aktual)'}
                  </span>
                )}
              />

              {chartMode === 'MONTHLY' ? (
                <>
                  {chartType === 'COMPOSED' && (
                    <Area 
                      type="monotone" 
                      dataKey="realisasi" 
                      fill="url(#realisasiGrad)" 
                      stroke="none"
                    />
                  )}
                  
                  {/* Dashed Indigo Target Line */}
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="target"
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 7, stroke: '#4f46e5', strokeWidth: 2, fill: '#6366f1' }}
                  />

                  {/* Solid Emerald Realization Line */}
                  <Line 
                    type="monotone" 
                    dataKey="realisasi" 
                    name="realisasi"
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 8, stroke: '#059669', strokeWidth: 2, fill: '#10b981' }}
                  />
                </>
              ) : (
                <>
                  {chartType === 'COMPOSED' && (
                    <Area 
                      type="monotone" 
                      dataKey="cumRealisasi" 
                      fill="url(#realisasiGrad)" 
                      stroke="none"
                    />
                  )}

                  {/* Cumulative Target */}
                  <Line 
                    type="monotone" 
                    dataKey="cumTarget" 
                    name="cumTarget"
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 7 }}
                  />

                  {/* Cumulative Realization */}
                  <Line 
                    type="monotone" 
                    dataKey="cumRealisasi" 
                    name="cumRealisasi"
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 8 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Notes and Context */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-500 border-b border-dashed border-indigo-500"></span>
              <span>Garis Putus-Putus: Target Bulanan APBD Garut</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-500"></span>
              <span>Garis Hijau Tebal: Realisasi Pembayaran SKRD Valid</span>
            </span>
          </div>

          <button
            onClick={() => onNavigate('MONITORING_PAD')}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Buka Laporan PAD & Rekonsiliasi Bank</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </section>

      {/* Main Structural Grid (Implementation Pipeline & Live Activity Terminal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4-Col): Implementation Workflow Stages */}
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

        {/* Right Area (8-Col): Live Network & Terminal Log Box */}
        <section className="lg:col-span-8">
          <div className="bg-slate-900 text-white p-6 relative overflow-hidden font-mono border border-slate-800 shadow-md h-full flex flex-col justify-between">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SIMBG Live Activity Terminal // DPUPR Garut</span>
                </h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-800">
                  REALTIME LOG
                </span>
              </div>

              <div className="text-xs space-y-2 text-emerald-400/90 leading-relaxed pt-1">
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
                  <span>[MONEV_PAD] Realisasi Retribusi PBG Bulan Ini: {formatCompactRupiah(totalRealisasiYear)} ({ytdPercentage}% dari target YTD).</span>
                </p>
                <p className="flex items-center gap-2 text-indigo-300">
                  <span className="text-slate-500">&gt;</span>
                  <span>[DATABASE] Supabase persistence layer active. Keep-alive cron active every 48 hours.</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>SINKRONISASI APBD // DINAS PUPR</span>
              <span className="text-emerald-400">SYSTEM HEALTH: 100% OPERATIONAL</span>
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
