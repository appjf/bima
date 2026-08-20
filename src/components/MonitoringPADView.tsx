import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { FileText, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, Calendar, Search } from 'lucide-react';
import { Application } from '../types';

interface MonitoringPADViewProps {
  applications: Application[];
  onUpdateApplication: (updatedApp: Application) => void;
}

type TabType = 'SKRD_TERBIT' | 'INPUT_PEMBAYARAN' | 'MONEV';

export const MonitoringPADView: React.FC<MonitoringPADViewProps> = ({ applications, onUpdateApplication }) => {
  const [activeTab, setActiveTab] = useState<TabType>('SKRD_TERBIT');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentReceipt, setPaymentReceipt] = useState<string>('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  // Filter apps that have SKRD issued (retribution status is SKRD_ISSUED, UNPAID, or PAID)
  const skrdApps = useMemo(() => {
    return applications.filter(a => a.retribution && 
      ['SKRD_ISSUED', 'UNPAID', 'PAID'].includes(a.retribution.status));
  }, [applications]);

  const filteredApps = useMemo(() => {
    return skrdApps.filter(a => 
      a.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.applicant.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [skrdApps, searchTerm]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">Monitoring PAD & Retribusi</h2>
          <p className="text-sm text-slate-500 font-medium">Dashboard Realisasi Pendapatan Asli Daerah dari Retribusi PBG</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-fit shadow-inner">
        <button
          onClick={() => setActiveTab('SKRD_TERBIT')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition ${activeTab === 'SKRD_TERBIT' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Rekap SKRD Terbit
        </button>
        <button
          onClick={() => setActiveTab('INPUT_PEMBAYARAN')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition ${activeTab === 'INPUT_PEMBAYARAN' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Input Pembayaran
        </button>
        <button
          onClick={() => setActiveTab('MONEV')}
          className={`px-4 py-2 text-xs font-bold uppercase rounded-md transition ${activeTab === 'MONEV' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Dashboard Monev
        </button>
      </div>

      {/* Tab: SKRD Terbit */}
      {activeTab === 'SKRD_TERBIT' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 uppercase">Daftar SKRD Diterbitkan</h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Register / Pemohon..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">No. Register & Pemohon</th>
                  <th className="px-4 py-3">Bangunan</th>
                  <th className="px-4 py-3 text-right">Nilai Retribusi</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Tanggal SKRD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-indigo-700">{app.registerNumber}</div>
                      <div className="text-slate-600">{app.applicant.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{app.building.name}</div>
                      <div className="text-[10px] text-slate-500">{app.building.functionType}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(app.retribution?.finalRetribution || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {app.retribution?.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> SUDAH BAYAR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> BELUM BAYAR
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 font-mono text-[10px]">
                      {app.retribution?.calculatedAt ? new Date(app.retribution.calculatedAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">
                      Belum ada data SKRD yang diterbitkan.
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
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-800 uppercase">Input Realisasi Pembayaran PAD</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">No. Register</th>
                  <th className="px-4 py-3">Pemohon</th>
                  <th className="px-4 py-3 text-right">Tagihan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.filter(a => a.retribution?.status !== 'PAID').map(app => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-bold text-indigo-700">{app.registerNumber}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{app.applicant.name}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(app.retribution?.finalRetribution || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">MENUNGGU PEMBAYARAN</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => { setSelectedApp(app); setPaymentModalOpen(true); }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase rounded shadow-sm transition"
                      >
                        Validasi Bayar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApps.filter(a => a.retribution?.status !== 'PAID').length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">
                      Semua tagihan SKRD sudah terbayar atau tidak ada tagihan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: MONEV */}
      {activeTab === 'MONEV' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-600 text-xs uppercase">Total Target PAD (SKRD)</h4>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {formatCurrency(totalTargetPAD)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-600 text-xs uppercase">Realisasi PAD (Terbayar)</h4>
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 tracking-tight font-mono">
                {formatCurrency(totalRealizedPAD)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-100 text-rose-600 rounded">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-600 text-xs uppercase">Piutang / Belum Bayar</h4>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 tracking-tight font-mono">
                {formatCurrency(totalTargetPAD - totalRealizedPAD)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 h-80">
              <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase">Status Pembayaran SKRD</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
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
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 h-80">
              <h4 className="font-bold text-slate-800 text-sm mb-4 uppercase">Komparasi Target vs Realisasi</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'PAD Retribusi', Target: totalTargetPAD, Realisasi: totalRealizedPAD }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `Rp ${value / 1000000}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Target" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realisasi" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 uppercase">Validasi Pembayaran SKRD</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
                <div className="text-[10px] uppercase font-bold text-indigo-500 mb-1">Total Tagihan</div>
                <div className="font-mono text-xl font-black text-indigo-700">
                  {formatCurrency(selectedApp.retribution?.finalRetribution || 0)}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. Register Permohonan</label>
                <input type="text" readOnly value={selectedApp.registerNumber} className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-sm font-mono text-slate-600 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Pembayaran (Validasi Bank)</label>
                <input 
                  type="date" 
                  value={paymentDate} 
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nomor Resi / STS / NTPN (Opsional)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: STS-2026-08-001"
                  value={paymentReceipt} 
                  onChange={e => setPaymentReceipt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono" 
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setPaymentModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-200 rounded transition">
                Batal
              </button>
              <button onClick={handleMarkAsPaid} className="px-4 py-2 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-500 text-white rounded transition shadow-sm">
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
