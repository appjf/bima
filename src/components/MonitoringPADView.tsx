import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  FileText, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, 
  Calendar, Search, Filter, Layers, ArrowUpRight, ArrowDownRight, 
  CheckCircle, HelpCircle, Activity, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { Application } from '../types';

interface MonitoringPADViewProps {
  applications: Application[];
  onUpdateApplication: (updatedApp: Application) => void;
}

type TabType = 'SKRD_TERBIT' | 'INPUT_PEMBAYARAN' | 'MONEV';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

// Baseline monthly targets for APBD Garut PBG (in Rupiah) as foundation
const DEFAULT_BASELINE_MONTHLY = [
  { monthIdx: 0, target: 280000000, realized: 295000000 },
  { monthIdx: 1, target: 320000000, realized: 310000000 },
  { monthIdx: 2, target: 350000000, realized: 375000000 },
  { monthIdx: 3, target: 400000000, realized: 390000000 },
  { monthIdx: 4, target: 420000000, realized: 445000000 },
  { monthIdx: 5, target: 450000000, realized: 460000000 },
  { monthIdx: 6, target: 480000000, realized: 495000000 },
  { monthIdx: 7, target: 500000000, realized: 520000000 }, // Agustus
  { monthIdx: 8, target: 450000000, realized: 0 }, // Sep
  { monthIdx: 9, target: 420000000, realized: 0 }, // Okt
  { monthIdx: 10, target: 380000000, realized: 0 }, // Nov
  { monthIdx: 11, target: 350000000, realized: 0 }  // Des
];

export const MonitoringPADView: React.FC<MonitoringPADViewProps> = ({ applications, onUpdateApplication }) => {
  const [activeTab, setActiveTab] = useState<TabType>('MONEV');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [chartMode, setChartMode] = useState<'MONTHLY' | 'CUMULATIVE'>('MONTHLY');
  const [functionFilter, setFunctionFilter] = useState<string>('ALL');
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentReceipt, setPaymentReceipt] = useState<string>('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  const formatCompactCurrency = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(0)} Jt`;
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  // Filter apps that have SKRD issued (retribution status is SKRD_ISSUED, UNPAID, or PAID)
  const skrdApps = useMemo(() => {
    return applications.filter(a => a.retribution && 
      ['SKRD_ISSUED', 'UNPAID', 'PAID'].includes(a.retribution.status));
  }, [applications]);

  const filteredApps = useMemo(() => {
    return skrdApps.filter(a => {
      const matchesSearch = 
        a.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.building.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFunction = functionFilter === 'ALL' || a.building.functionType === functionFilter;
      return matchesSearch && matchesFunction;
    });
  }, [skrdApps, searchTerm, functionFilter]);

  // Derived metrics for MONEV
  const totalTargetPAD = skrdApps.reduce((sum, app) => sum + (app.retribution?.finalRetribution || 0), 0);
  const totalRealizedPAD = skrdApps
    .filter(a => a.retribution?.status === 'PAID')
    .reduce((sum, app) => sum + (app.retribution?.finalRetribution || 0), 0);
  
  const unpaidCount = skrdApps.filter(a => a.retribution?.status !== 'PAID').length;
  const paidCount = skrdApps.filter(a => a.retribution?.status === 'PAID').length;

  const pieData = [
    { name: 'Sudah Bayar', value: paidCount, color: '#10b981' },
    { name: 'Belum Bayar', value: unpaidCount, color: '#f43f5e' }
  ];

  // Monthly Aggregated Trend Data
  const monthlyTrendData = useMemo(() => {
    // Bucket applications by month for target and realization
    const monthlyTargetFromApps = new Array(12).fill(0);
    const monthlyRealizedFromApps = new Array(12).fill(0);

    skrdApps.forEach(app => {
      // Check function filter
      if (functionFilter !== 'ALL' && app.building.functionType !== functionFilter) {
        return;
      }

      // Determine date of SKRD
      const dateStr = app.retribution?.calculatedAt || app.submissionDate || '2026-08-18';
      const dateObj = new Date(dateStr);
      const mIdx = isNaN(dateObj.getMonth()) ? 7 : dateObj.getMonth();

      const amount = app.retribution?.finalRetribution || 0;
      if (mIdx >= 0 && mIdx < 12) {
        monthlyTargetFromApps[mIdx] += amount;
      }

      // Check payment date
      if (app.retribution?.status === 'PAID') {
        const pDateStr = app.retribution.paymentDate || dateStr;
        const pDateObj = new Date(pDateStr);
        const pIdx = isNaN(pDateObj.getMonth()) ? 7 : pDateObj.getMonth();
        if (pIdx >= 0 && pIdx < 12) {
          monthlyRealizedFromApps[pIdx] += amount;
        }
      }
    });

    let runningCumulativeTarget = 0;
    let runningCumulativeRealized = 0;

    return MONTH_SHORT.map((shortName, idx) => {
      const base = DEFAULT_BASELINE_MONTHLY[idx];
      
      // Calculate target: Baseline target + live SKRD created in system
      const liveTarget = monthlyTargetFromApps[idx];
      const liveRealized = monthlyRealizedFromApps[idx];
      
      const target = (selectedYear === '2026' ? base.target : base.target * 0.9) + liveTarget;
      // Realized up to current month (August = index 7)
      const isPastOrCurrentMonth = idx <= 7;
      const realized = isPastOrCurrentMonth 
        ? (selectedYear === '2026' ? base.realized : base.realized * 0.95) + liveRealized 
        : 0;

      runningCumulativeTarget += target;
      if (isPastOrCurrentMonth) {
        runningCumulativeRealized += realized;
      }

      const percent = target > 0 ? (realized / target) * 100 : 0;
      const deviasi = realized - target;

      return {
        monthIndex: idx,
        name: shortName,
        fullName: MONTH_NAMES[idx],
        target,
        realisasi: realized,
        targetKumulatif: runningCumulativeTarget,
        realisasiKumulatif: isPastOrCurrentMonth ? runningCumulativeRealized : null,
        persentase: percent,
        deviasi: deviasi,
        isFuture: !isPastOrCurrentMonth,
        appCountTarget: skrdApps.filter(a => {
          const d = new Date(a.retribution?.calculatedAt || a.submissionDate || '');
          return d.getMonth() === idx;
        }).length,
        appCountPaid: skrdApps.filter(a => {
          if (a.retribution?.status !== 'PAID') return false;
          const d = new Date(a.retribution?.paymentDate || a.retribution?.calculatedAt || '');
          return d.getMonth() === idx;
        }).length
      };
    });
  }, [skrdApps, selectedYear, functionFilter]);

  // Derived Trend Summary KPIs
  const totalTrendTarget = useMemo(() => {
    return monthlyTrendData.reduce((acc, curr) => acc + curr.target, 0);
  }, [monthlyTrendData]);

  const totalTrendRealized = useMemo(() => {
    return monthlyTrendData.reduce((acc, curr) => acc + curr.realisasi, 0);
  }, [monthlyTrendData]);

  const ytdTarget = useMemo(() => {
    return monthlyTrendData.filter(d => !d.isFuture).reduce((acc, curr) => acc + curr.target, 0);
  }, [monthlyTrendData]);

  const ytdAchievementRate = ytdTarget > 0 ? (totalTrendRealized / ytdTarget) * 100 : 0;
  const annualAchievementRate = totalTrendTarget > 0 ? (totalTrendRealized / totalTrendTarget) * 100 : 0;

  // Best performing month
  const peakMonth = useMemo(() => {
    const activeMonths = monthlyTrendData.filter(d => !d.isFuture && d.realisasi > 0);
    if (activeMonths.length === 0) return null;
    return activeMonths.reduce((prev, current) => (prev.realisasi > current.realisasi) ? prev : current);
  }, [monthlyTrendData]);

  const handleMarkAsPaid = () => {
    if (!selectedApp || !selectedApp.retribution) return;
    
    const updatedApp: Application = {
      ...selectedApp,
      retribution: {
        ...selectedApp.retribution,
        status: 'PAID',
        paymentDate,
        paymentReceipt: paymentReceipt || 'KASDA_SETORAN'
      },
      lastUpdated: new Date().toISOString()
    };
    
    onUpdateApplication(updatedApp);
    setPaymentModalOpen(false);
    setSelectedApp(null);
  };

  // Custom Chart Tooltip
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const targetVal = chartMode === 'MONTHLY' ? data.target : data.targetKumulatif;
      const realVal = chartMode === 'MONTHLY' ? data.realisasi : data.realisasiKumulatif;
      const pct = targetVal > 0 && realVal !== null ? (realVal / targetVal) * 100 : 0;
      const diff = realVal !== null ? realVal - targetVal : 0;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[240px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">{data.fullName} {selectedYear}</span>
            {data.isFuture ? (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">Periode Mendatang</span>
            ) : (
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${pct >= 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                {pct.toFixed(1)}% Capaian
              </span>
            )}
          </div>
          
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                Target {chartMode === 'CUMULATIVE' ? 'Kumulatif' : 'SKRD'}:
              </span>
              <span className="font-mono font-bold text-slate-100">{formatCurrency(targetVal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                Realisasi {chartMode === 'CUMULATIVE' ? 'Kumulatif' : 'Kasda'}:
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {realVal !== null && !data.isFuture ? formatCurrency(realVal) : 'Belum Berjalan'}
              </span>
            </div>

            {!data.isFuture && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 text-[11px]">
                <span className="text-slate-400">Deviasi (Selisih):</span>
                <span className={`font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diff >= 0 ? `+${formatCurrency(diff)} (Surplus)` : `${formatCurrency(diff)} (Defisit)`}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                Monitoring PAD & Retribusi PBG
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Sistem Analitik Realisasi Pendapatan Asli Daerah & Efisiensi Penagihan SKRD DPUPR Garut
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit shadow-inner border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('MONEV')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-md flex items-center gap-2 transition ${activeTab === 'MONEV' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <TrendingUp className="w-4 h-4" />
          Dashboard Monev & Tren
        </button>
        <button
          onClick={() => setActiveTab('SKRD_TERBIT')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-md flex items-center gap-2 transition ${activeTab === 'SKRD_TERBIT' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <FileText className="w-4 h-4" />
          Rekap SKRD Terbit ({skrdApps.length})
        </button>
        <button
          onClick={() => setActiveTab('INPUT_PEMBAYARAN')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-md flex items-center gap-2 transition ${activeTab === 'INPUT_PEMBAYARAN' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Input Validasi Bayar ({unpaidCount})
        </button>
      </div>

      {/* Tab: MONEV & TREN */}
      {activeTab === 'MONEV' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Target PAD (APBD)</span>
                <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                {formatCompactCurrency(totalTrendTarget)}
              </div>
              <div className="mt-2 flex items-center text-[10px] text-slate-500">
                <span>SKRD Terbit di Sistem: </span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 ml-1">{formatCompactCurrency(totalTargetPAD)}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Realisasi Kasda (YTD)</span>
                <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCompactCurrency(totalTrendRealized)}
              </div>
              <div className="mt-2 flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                <span>{ytdAchievementRate.toFixed(1)}% dari Target Berjalan YTD</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Capaian Target Tahunan</span>
                <span className="p-1.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-lg">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                {annualAchievementRate.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(annualAchievementRate, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bulan Realisasi Tertinggi</span>
                <span className="p-1.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {peakMonth ? peakMonth.fullName : '-'}
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                {peakMonth ? `Rekor: ${formatCompactCurrency(peakMonth.realisasi)}` : 'Belum ada data'}
              </div>
            </div>
          </div>

          {/* MAIN VISUALIZATION: TREN BULANAN LINE CHART */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-tight">
                    Visualisasi Tren Bulanan Penerimaan Retribusi PBG
                  </h3>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
                    Interaktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Komparasi grafik garis antara Ketetapan SKRD Target vs Realisasi Setoran Kas Daerah per Bulan
                </p>
              </div>

              {/* Chart Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Year Select */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setSelectedYear('2026')}
                    className={`px-3 py-1.5 rounded-md font-bold transition ${selectedYear === '2026' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    TA 2026
                  </button>
                  <button
                    onClick={() => setSelectedYear('2025')}
                    className={`px-3 py-1.5 rounded-md font-bold transition ${selectedYear === '2025' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    TA 2025
                  </button>
                </div>

                {/* View Mode Toggle: Monthly vs Cumulative */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    onClick={() => setChartMode('MONTHLY')}
                    className={`px-3 py-1.5 rounded-md font-bold transition ${chartMode === 'MONTHLY' ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Nominal Bulanan
                  </button>
                  <button
                    onClick={() => setChartMode('CUMULATIVE')}
                    className={`px-3 py-1.5 rounded-md font-bold transition ${chartMode === 'CUMULATIVE' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    Akumulasi YTD
                  </button>
                </div>

                {/* Function Filter */}
                <select
                  value={functionFilter}
                  onChange={(e) => setFunctionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">Semua Fungsi Bangunan</option>
                  <option value="USAHA">Fungsi Usaha</option>
                  <option value="HUNIAN">Fungsi Hunian</option>
                  <option value="SOSIAL_BUDAYA">Fungsi Sosial & Budaya</option>
                  <option value="KHUSUS">Fungsi Khusus</option>
                </select>
              </div>
            </div>

            {/* Line Chart Canvas */}
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrendData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRealized" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  
                  <YAxis 
                    tickFormatter={(value) => {
                      if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} M`;
                      if (value >= 1000000) return `${(value / 1000000).toFixed(0)} Jt`;
                      return value;
                    }}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  
                  <Tooltip content={<CustomLineTooltip />} />
                  
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => {
                      if (value === 'target' || value === 'targetKumulatif') {
                        return <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Target SKRD ({chartMode === 'MONTHLY' ? 'Bulanan' : 'Akumulatif'})</span>;
                      }
                      if (value === 'realisasi' || value === 'realisasiKumulatif') {
                        return <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Realisasi Penerimaan Terbayar</span>;
                      }
                      return value;
                    }}
                  />

                  {/* Target Line */}
                  <Line
                    type="monotone"
                    dataKey={chartMode === 'MONTHLY' ? 'target' : 'targetKumulatif'}
                    name={chartMode === 'MONTHLY' ? 'target' : 'targetKumulatif'}
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    strokeDasharray={chartMode === 'MONTHLY' ? '4 4' : undefined}
                    dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#6366f1' }}
                    activeDot={{ r: 7, strokeWidth: 0, fill: '#4f46e5' }}
                  />

                  {/* Realized Line */}
                  <Line
                    type="monotone"
                    dataKey={chartMode === 'MONTHLY' ? 'realisasi' : 'realisasiKumulatif'}
                    name={chartMode === 'MONTHLY' ? 'realisasi' : 'realisasiKumulatif'}
                    stroke="#10b981"
                    strokeWidth={3.5}
                    dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#10b981' }}
                    activeDot={{ r: 8, strokeWidth: 2, stroke: '#ffffff', fill: '#059669' }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Chart Insight Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  <strong>Tren Realisasi:</strong> Hingga Agustus {selectedYear}, tercatat total penerimaan <strong>{formatCompactCurrency(totalTrendRealized)}</strong> dengan deviasi 
                  <span className={`font-bold ml-1 ${totalTrendRealized >= ytdTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totalTrendRealized >= ytdTarget ? `+${formatCompactCurrency(totalTrendRealized - ytdTarget)} (Surplus)` : `-${formatCompactCurrency(ytdTarget - totalTrendRealized)}`}
                  </span>.
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>Mode: {chartMode === 'MONTHLY' ? 'Grafik Nominal Per Bulan' : 'Kurva Akumulasi YTD'}</span>
              </div>
            </div>
          </div>

          {/* Secondary Charts: Pie Status & Monthly Breakdown Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Piutang vs Lunas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 h-96 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Efektivitas Penagihan SKRD
                </h4>
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                  {skrdApps.length} Berkas
                </span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-100 dark:border-emerald-900/40">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Lunas</div>
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{paidCount} Dokumen</div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-100 dark:border-rose-900/40">
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Piutang</div>
                  <div className="font-mono font-bold text-rose-700 dark:text-rose-300">{unpaidCount} Dokumen</div>
                </div>
              </div>
            </div>

            {/* Monthly Matrix Breakdown Table */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                  Matriks Rincian Target vs Realisasi Bulanan ({selectedYear})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">12 Periode Anggaran</span>
              </div>
              <div className="overflow-x-auto flex-1 max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Bulan</th>
                      <th className="px-3 py-2 text-right">Target SKRD</th>
                      <th className="px-3 py-2 text-right">Realisasi Setoran</th>
                      <th className="px-3 py-2 text-right">Deviasi</th>
                      <th className="px-3 py-2 text-center">Capaian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {monthlyTrendData.map((row) => (
                      <tr key={row.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">
                          {row.fullName}
                          {row.isFuture && <span className="ml-1 text-[9px] text-slate-400 font-normal italic">(Rencana)</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-400">
                          {formatCompactCurrency(row.target)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {row.isFuture ? '-' : formatCompactCurrency(row.realisasi)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px]">
                          {row.isFuture ? '-' : (
                            <span className={row.deviasi >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                              {row.deviasi >= 0 ? `+${formatCompactCurrency(row.deviasi)}` : formatCompactCurrency(row.deviasi)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.isFuture ? (
                            <span className="text-[10px] text-slate-400 font-mono">-</span>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-bold font-mono rounded ${row.persentase >= 100 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                              {row.persentase.toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: SKRD Terbit */}
      {activeTab === 'SKRD_TERBIT' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase">Daftar Ketetapan SKRD Terbit</h3>
              <p className="text-xs text-slate-500">Semua permohonan yang telah memiliki perhitungan retribusi final</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Register / Pemohon / Bangunan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-72"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">No. Register & Pemohon</th>
                  <th className="px-4 py-3">Bangunan & Fungsi</th>
                  <th className="px-4 py-3 text-right">Nilai SKRD</th>
                  <th className="px-4 py-3 text-center">Status Pembayaran</th>
                  <th className="px-4 py-3 text-center">Tanggal Terbit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-indigo-700 dark:text-indigo-400">{app.registerNumber}</div>
                      <div className="text-slate-700 dark:text-slate-300 font-medium">{app.applicant.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{app.building.name}</div>
                      <div className="text-[10px] text-slate-500">{app.building.functionType} • {app.building.buildingArea} m²</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(app.retribution?.finalRetribution || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {app.retribution?.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded text-[10px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> BELUM BAYAR
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                      {app.retribution?.calculatedAt ? new Date(app.retribution.calculatedAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">
                      Belum ada data SKRD yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: INPUT PEMBAYARAN */}
      {activeTab === 'INPUT_PEMBAYARAN' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase">Validasi Pembayaran Kasda</h3>
            <p className="text-xs text-slate-500">Pilih berkas untuk mencatat nomor bukti setor / STS dan validasi lunas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">No. Register</th>
                  <th className="px-4 py-3">Pemohon & Bangunan</th>
                  <th className="px-4 py-3 text-right">Tagihan SKRD</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApps.filter(a => a.retribution?.status !== 'PAID').map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-indigo-700 dark:text-indigo-400">{app.registerNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900 dark:text-white font-medium">{app.applicant.name}</div>
                      <div className="text-[10px] text-slate-500">{app.building.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(app.retribution?.finalRetribution || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[10px] font-bold">
                        MENUNGGU SETORAN
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => { setSelectedApp(app); setPaymentModalOpen(true); }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-sm transition inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validasi Lunas
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApps.filter(a => a.retribution?.status !== 'PAID').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">
                      Semua tagihan SKRD sudah terbayar lunas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm">Validasi Setoran Kasda SKRD</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900">
                <div className="text-[10px] uppercase font-bold text-indigo-500 mb-1">Total Tagihan Retribusi</div>
                <div className="font-mono text-xl font-black text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(selectedApp.retribution?.finalRetribution || 0)}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">No. Register Permohonan</label>
                <input type="text" readOnly value={selectedApp.registerNumber} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-400 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tanggal Pembayaran (Validasi Bank)</label>
                <input 
                  type="date" 
                  value={paymentDate} 
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nomor Resi / Bukti STS / NTPN</label>
                <input 
                  type="text" 
                  placeholder="Contoh: STS-2026-08-001"
                  value={paymentReceipt} 
                  onChange={e => setPaymentReceipt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono" 
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-2">
              <button onClick={() => setPaymentModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition">
                Batal
              </button>
              <button onClick={handleMarkAsPaid} className="px-4 py-2 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-sm">
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
