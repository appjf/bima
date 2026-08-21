import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Building2, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  Trash2,
  FileCheck,
  ChevronRight,
  FileSpreadsheet,
  Archive,
  ArchiveRestore,
  FolderCheck,
  Inbox,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Application, ApplicationStatus, BuildingFunction, BuildingComplexity } from '../types';
import { ApplicationFormModal } from './ApplicationFormModal';

interface ApplicationsViewProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  onQuickVerify: (app: Application) => void;
  onAddNewApplication: (newApp: Application) => void;
  onDeleteApplication: (appId: string) => void;
  onToggleArchive?: (app: Application, archive: boolean) => void;
  initialStatusFilter?: ApplicationStatus | 'ALL';
  initialArchiveTab?: 'ACTIVE' | 'ARCHIVE' | 'ALL';
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  onSelectApplication,
  onQuickVerify,
  onAddNewApplication,
  onDeleteApplication,
  onToggleArchive,
  initialStatusFilter = 'ALL',
  initialArchiveTab = 'ACTIVE'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveTab, setArchiveTab] = useState<'ACTIVE' | 'ARCHIVE' | 'ALL'>(initialArchiveTab);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>(initialStatusFilter);
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [functionFilter, setFunctionFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Extract unique districts
  const districts: string[] = Array.from(new Set(applications.map(a => a.building.district))).filter((d): d is string => Boolean(d));

  // Determine whether an application is completed/archived
  const isAppArchived = (app: Application): boolean => {
    return Boolean(app.isArchived || app.status === 'CONSULTATION_DONE' || app.status === 'COMPLETED');
  };

  // Extract unique submission months (format: YYYY-MM)
  const availableMonths = Array.from(
    new Set(
      applications
        .map(a => {
          if (!a.submissionDate) return null;
          const d = new Date(a.submissionDate);
          if (isNaN(d.getTime())) return null;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${year}-${month}`;
        })
        .filter((m): m is string => Boolean(m))
    )
  ).sort().reverse();

  const formatMonthYearIndo = (yearMonthStr: string): string => {
    const [year, month] = yearMonthStr.split('-');
    const monthNamesIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIndex = parseInt(month, 10) - 1;
    return `${monthNamesIndo[mIndex] || month} ${year}`;
  };

  // Monthly filtered apps for consistent counts
  const monthFilteredAppsForCount = applications.filter(app => {
    if (monthFilter === 'ALL') return true;
    if (!app.submissionDate) return false;
    const d = new Date(app.submissionDate);
    if (isNaN(d.getTime())) return false;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}` === monthFilter;
  });

  // Counts for tabs based on selected month
  const activeCount = monthFilteredAppsForCount.filter(a => !isAppArchived(a)).length;
  const archivedCount = monthFilteredAppsForCount.filter(a => isAppArchived(a)).length;
  const totalCount = monthFilteredAppsForCount.length;

  // Filtering Logic
  const filteredApps = applications.filter(app => {
    const isArchived = isAppArchived(app);
    
    // Archive tab filter
    if (archiveTab === 'ACTIVE' && isArchived) return false;
    if (archiveTab === 'ARCHIVE' && !isArchived) return false;

    const matchesSearch = 
      app.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.phone.includes(searchQuery) ||
      (app.building.consultantName && app.building.consultantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      app.building.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesDistrict = districtFilter === 'ALL' || app.building.district === districtFilter;
    const matchesFunction = functionFilter === 'ALL' || app.building.functionType === functionFilter;

    let matchesMonth = true;
    if (monthFilter !== 'ALL' && app.submissionDate) {
      const d = new Date(app.submissionDate);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        matchesMonth = `${year}-${month}` === monthFilter;
      } else {
        matchesMonth = false;
      }
    }

    return matchesSearch && matchesStatus && matchesDistrict && matchesFunction && matchesMonth;
  });

  const handleCreateSubmit = (newApp: Application) => {
    onAddNewApplication(newApp);
    setIsAddModalOpen(false);
  };

  const getStatusBadge = (app: Application) => {
    const isArchived = isAppArchived(app);
    if (app.status === 'CONSULTATION_DONE') {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 font-mono font-bold flex items-center gap-1">
            <FolderCheck className="w-3 h-3" />
            <span>KONSULTASI_SELESAI</span>
          </span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
            [TERARSIP OTOMATIS]
          </span>
        </div>
      );
    }

    if (app.status === 'COMPLETED') {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>SKRD_TERBIT / SELESAI</span>
          </span>
          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
            [TERARSIP]
          </span>
        </div>
      );
    }

    if (app.isArchived) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 font-mono font-bold flex items-center gap-1">
            <Archive className="w-3 h-3" />
            <span>DIARSIPKAN</span>
          </span>
          <span className="text-[9px] text-slate-500 font-mono">
            {app.status}
          </span>
        </div>
      );
    }

    switch (app.status) {
      case 'READY_FOR_CONSULTATION':
      case 'COMPLETE':
        return <span className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] px-2 py-0.5 font-mono font-bold">SIAP_KONSULTASI</span>;
      case 'SCHEDULED':
        return <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] px-2 py-0.5 font-mono font-bold">TERJADWAL_TPA</span>;
      case 'INCOMPLETE':
      case 'REVISION_REQUESTED':
        return <span className="bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] px-2 py-0.5 font-mono font-bold">PERLU_REVISI</span>;
      case 'NEW':
      case 'UNDER_VERIFICATION':
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] px-2 py-0.5 font-mono font-bold">BARU_MASUK</span>;
      case 'RETRIBUTION_READY':
        return <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 font-mono font-bold">HITUNG_RETRIBUSI</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 font-mono font-bold">{app.status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Filters (Geometric Precision) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                DATA ENGINE // REPOSITORY PBG & SLF
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-mono">
              <span>MANAJEMEN PERMOHONAN SIMBG</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh berkas permohonan SIMBG, kelengkapan berkas, alokasi sidang, dan pengarsipan permohonan selesai.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Permohonan</span>
          </button>
        </div>

        {/* Archive Primary Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 pt-1 overflow-x-auto">
          <button
            onClick={() => setArchiveTab('ACTIVE')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition border ${
              archiveTab === 'ACTIVE'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Berkas Aktif ({activeCount})</span>
          </button>

          <button
            onClick={() => setArchiveTab('ARCHIVE')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition border ${
              archiveTab === 'ARCHIVE'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arsip Permohonan Selesai ({archivedCount})</span>
          </button>

          <button
            onClick={() => setArchiveTab('ALL')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition border ${
              archiveTab === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Semua Berkas ({totalCount})</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari register, pemohon, bangunan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none focus:outline-none focus:border-indigo-600 font-sans"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-mono"
            >
              <option value="ALL">ALL STATUS</option>
              <option value="NEW">BARU MASUK</option>
              <option value="INCOMPLETE">PERLU REVISI</option>
              <option value="READY_FOR_CONSULTATION">SIAP KONSULTASI</option>
              <option value="SCHEDULED">TERJADWAL SIDANG</option>
              <option value="CONSULTATION_DONE">KONSULTASI SELESAI (ARSIP)</option>
              <option value="COMPLETED">SELESAI / SKRD (ARSIP)</option>
            </select>
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-mono"
            >
              <option value="ALL">SEMUA KECAMATAN</option>
              {districts.map(d => (
                <option key={d} value={d}>{d.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Function Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={functionFilter}
              onChange={(e) => setFunctionFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-mono"
            >
              <option value="ALL">SEMUA FUNGSI</option>
              <option value="HUNIAN">HUNIAN</option>
              <option value="USAHA">USAHA</option>
              <option value="SOSIAL_BUDAYA">SOSIAL & BUDAYA</option>
              <option value="KEAGAMAAN">KEAGAMAAN</option>
              <option value="KHUSUS">KHUSUS</option>
            </select>
          </div>

          {/* Monthly Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer font-mono font-bold"
            >
              <option value="ALL">SEMUA BULAN</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthYearIndo(m).toUpperCase()}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Applications View Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Mobile View Card List (< md screens) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredApps.map((app) => {
            const isArchived = isAppArchived(app);
            return (
              <div key={app.id} className={`p-4 space-y-3 ${isArchived ? 'bg-slate-50/70 dark:bg-slate-950/40' : 'bg-white dark:bg-slate-900'}`}>
                
                {/* Header: Register & Permit Badge */}
                <div className="flex items-center justify-between">
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1.5">
                    <span>{app.registerNumber}</span>
                    {app.permitType && (
                      <span className={`text-[9px] px-1.5 py-0.5 font-mono font-bold ${
                        app.permitType.startsWith('SLF') 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700' 
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        {app.permitType.startsWith('SLF') ? 'SLF' : 'PBG'}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 font-mono font-bold ${
                    app.slaStatus === 'EXCEEDED' 
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : app.slaStatus === 'WARNING'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    SLA: {app.slaDays} HARI
                  </span>
                </div>

                {/* Building Info */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {app.building.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[10px]">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 font-bold">
                      {app.building.functionType}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Kec. {app.building.district}, Desa {app.building.village}
                    </span>
                    <span className="text-slate-400">
                      ({app.building.buildingArea} m²)
                    </span>
                  </div>
                </div>

                {/* Applicant Info */}
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between font-mono bg-slate-50 dark:bg-slate-800/50 p-2 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{app.applicant.name}</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {app.applicant.phone}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    {getStatusBadge(app)}
                    {app.dataErrors.length > 0 && (
                      <div className="text-[10px] text-rose-500 font-mono font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{app.dataErrors.length} ANOMALI</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {app.submissionDate}
                  </div>
                </div>

                {/* Touch Actions Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onQuickVerify(app)}
                    className="flex-1 py-2 min-h-[44px] text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 active:bg-indigo-600 active:text-white"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Verifikasi</span>
                  </button>
                  <button
                    onClick={() => onSelectApplication(app)}
                    className="flex-1 py-2 min-h-[44px] text-xs font-mono font-bold uppercase text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:bg-slate-200"
                  >
                    Detail
                  </button>

                  {onToggleArchive && (
                    <button
                      onClick={() => onToggleArchive(app, !isArchived)}
                      className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center border transition ${
                        isArchived 
                          ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300' 
                          : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300'
                      }`}
                      title={isArchived ? "Buka Pengarsipan" : "Arsipkan Berkas"}
                    >
                      {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteApplication(app.id)}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-mono text-xs space-y-2">
              <Archive className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <div>TIDAK ADA PERMOHONAN YANG SESUAI DENGAN FILTER ATAU MODE ARSIP.</div>
            </div>
          )}
        </div>

        {/* Desktop View Table (hidden on mobile < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">No. Register & Tanggal</th>
                <th className="px-4 py-3">Pemohon</th>
                <th className="px-4 py-3">Bangunan & Fungsi</th>
                <th className="px-4 py-3">Lokasi (Garut)</th>
                <th className="px-4 py-3">Status Dokumen & Arsip</th>
                <th className="px-4 py-3">SLA Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApps.map((app) => {
                const isArchived = isAppArchived(app);
                return (
                  <tr 
                    key={app.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group ${
                      isArchived ? 'bg-slate-50/40 dark:bg-slate-950/20' : ''
                    }`}
                  >
                    
                    {/* Register & Date */}
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1.5">
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
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{app.submissionDate}</span>
                      </div>
                    </td>

                    {/* Applicant */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">
                        {app.applicant.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{app.applicant.phone}</span>
                      </div>
                    </td>

                    {/* Building & Function */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 max-w-[240px] truncate" title={app.building.name}>
                        {app.building.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px]">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 font-bold">
                          {app.building.functionType}
                        </span>
                        {app.building.subFunction && (
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={app.building.subFunction}>
                            • {app.building.subFunction}
                          </span>
                        )}
                        <span className="text-slate-400">
                          ({app.building.buildingArea} m²)
                        </span>
                      </div>
                      {app.building.consultantName && (
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] mt-0.5">
                          Konsultan: {app.building.consultantName}
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3.5">
                      <div className="text-slate-800 dark:text-slate-300 font-medium font-mono text-[11px]">
                        Kec. {app.building.district}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        Desa {app.building.village}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      {getStatusBadge(app)}
                      {app.dataErrors.length > 0 && (
                        <div className="text-[10px] text-rose-500 font-mono font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{app.dataErrors.length} ANOMALI</span>
                        </div>
                      )}
                    </td>

                    {/* SLA */}
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 font-mono font-bold ${
                        app.slaStatus === 'EXCEEDED' 
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : app.slaStatus === 'WARNING'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {app.slaDays} HARI
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Quick Verify */}
                        <button
                          onClick={() => onQuickVerify(app)}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white transition"
                          title="Verifikasi Dokumen"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                        </button>

                        {/* Archive Toggle Button */}
                        {onToggleArchive && (
                          <button
                            onClick={() => onToggleArchive(app, !isArchived)}
                            className={`p-1.5 transition ${
                              isArchived
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-600 hover:text-white'
                                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                            }`}
                            title={isArchived ? "Buka Pengarsipan (Pindahkan ke Aktif)" : "Arsipkan Berkas Selesai"}
                          >
                            {isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Detail Modal */}
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="px-2.5 py-1 text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-mono text-[11px] font-bold uppercase transition"
                          title="Buka Detail Permohonan"
                        >
                          Detail
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteApplication(app.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-mono text-xs">
                    <Archive className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    TIDAK ADA PERMOHONAN YANG SESUAI DENGAN FILTER ATAU TAB ARSIP.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official SIMBG Application Input Form Modal */}
      <ApplicationFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

    </div>
  );
};
