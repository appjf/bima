import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  Copy,
  Phone,
  Layers,
  Sparkles,
  Settings,
  Users,
  CheckSquare,
  Square,
  Filter,
  FileText,
  Check,
  ChevronRight,
  SendHorizontal
} from 'lucide-react';
import { Application, NotificationLog, WhatsAppSettings, WhatsAppTemplate } from '../types';
import { getStoredWhatsAppSettings } from '../lib/storage';
import { compileWhatsAppMessage } from '../lib/notificationTemplateEngine';

interface NotificationViewProps {
  notifications: NotificationLog[];
  applications?: Application[];
  onResendNotification: (notifId: string) => void;
  onOpenWhatsApp: (phone: string, message: string) => void;
  onNavigateToSettings?: () => void;
  onAddNotifications?: (newNotifs: NotificationLog[]) => void;
}

export const NotificationView: React.FC<NotificationViewProps> = ({
  notifications,
  applications = [],
  onResendNotification,
  onOpenWhatsApp,
  onNavigateToSettings,
  onAddNotifications
}) => {
  // Navigation & Sub-Tab State
  const [activeTab, setActiveTab] = useState<'OUTBOX' | 'BULK_BROADCAST'>('OUTBOX');

  // Search & Copy states for Outbox Log
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk Broadcast Engine States
  const [waSettings] = useState<WhatsAppSettings>(() => getStoredWhatsAppSettings());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPermitFilter, setSelectedPermitFilter] = useState<string>('ALL');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  
  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    waSettings.templates[0]?.id || 'TPL-MASUK'
  );
  const selectedTemplate = waSettings.templates.find(t => t.id === selectedTemplateId) || waSettings.templates[0];
  const [customBody, setCustomBody] = useState<string>(selectedTemplate?.templateBody || '');

  // Dispatch feedback state
  const [dispatchSuccessCount, setDispatchSuccessCount] = useState<number | null>(null);
  const [lastDispatchedQueue, setLastDispatchedQueue] = useState<Array<{ name: string; phone: string; register: string; text: string }>>([]);

  // Filtered Notifications for Outbox
  const filteredNotifs = notifications.filter(n => 
    n.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
    n.recipientName.toLowerCase().includes(search.toLowerCase()) ||
    n.recipientPhone.includes(search)
  );

  // Filtered Applications for Bulk Sender
  const filteredApplications = applications.filter(app => {
    // Status filter
    if (selectedStatusFilter !== 'ALL' && app.status !== selectedStatusFilter) {
      return false;
    }
    // Permit type filter
    if (selectedPermitFilter === 'PBG' && !app.registerNumber.startsWith('PBG')) {
      return false;
    }
    if (selectedPermitFilter === 'SLF' && !app.registerNumber.startsWith('SLF')) {
      return false;
    }
    // Search query
    if (appSearchQuery.trim()) {
      const q = appSearchQuery.toLowerCase();
      const matchReg = app.registerNumber.toLowerCase().includes(q);
      const matchApplicant = app.applicant.name.toLowerCase().includes(q);
      const matchPhone = app.applicant.phone.includes(q);
      const matchBuilding = app.building.name.toLowerCase().includes(q);
      if (!matchReg && !matchApplicant && !matchPhone && !matchBuilding) {
        return false;
      }
    }
    return true;
  });

  // Target selected objects
  const selectedAppsList = applications.filter(a => selectedAppIds.includes(a.id));
  const previewApp = selectedAppsList[0] || filteredApplications[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle selection
  const handleToggleSelectApp = (appId: string) => {
    setSelectedAppIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredApplications.map(a => a.id);
    setSelectedAppIds(Array.from(new Set([...selectedAppIds, ...allFilteredIds])));
  };

  const handleDeselectAll = () => {
    setSelectedAppIds([]);
  };

  // Change selected template
  const handleTemplateChange = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = waSettings.templates.find(t => t.id === tplId);
    if (tpl) {
      setCustomBody(tpl.templateBody);
    }
  };

  // Execute Bulk Dispatch
  const handleExecuteBulkBroadcast = () => {
    if (selectedAppIds.length === 0) {
      alert('Pilih setidaknya satu permohonan untuk dikirimi pesan siaran massal.');
      return;
    }

    if (!customBody.trim()) {
      alert('Isi pesan template tidak boleh kosong.');
      return;
    }

    const newNotifLogs: NotificationLog[] = [];
    const dispatchQueue: Array<{ name: string; phone: string; register: string; text: string }> = [];

    selectedAppsList.forEach(app => {
      const compiledMsg = compileWhatsAppMessage(customBody, app, {}, waSettings);
      
      const notifItem: NotificationLog = {
        id: `NOTIF-BULK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        applicationId: app.id,
        registerNumber: app.registerNumber,
        recipientName: app.applicant.name,
        recipientPhone: app.applicant.phone,
        templateType: selectedTemplate?.title || 'SIARAN_MASSAL_OPERATOR',
        message: compiledMsg,
        channel: 'WHATSAPP',
        status: 'SENT',
        createdAt: new Date().toLocaleString('id-ID'),
        sentAt: new Date().toISOString(),
        retryCount: 0
      };

      newNotifLogs.push(notifItem);
      dispatchQueue.push({
        name: app.applicant.name,
        phone: app.applicant.phone,
        register: app.registerNumber,
        text: compiledMsg
      });
    });

    if (onAddNotifications) {
      onAddNotifications(newNotifLogs);
    }

    setDispatchSuccessCount(newNotifLogs.length);
    setLastDispatchedQueue(dispatchQueue);

    // Auto-open first WhatsApp Web in new tab for convenient workflow if requested
    if (dispatchQueue.length > 0) {
      onOpenWhatsApp(dispatchQueue[0].phone, dispatchQueue[0].text);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>NOTIFICATION ENGINE // WHATSAPP OUTBOX & BULK BROADCAST</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 border border-emerald-200">
              SIMBG KAB. GARUT
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Outbox Notifikasi & Siaran Pesan Massal WhatsApp
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl mt-0.5">
            Pusat manajemen komunikasi otomatis dan pengiriman siaran massal (bulk broadcast) pemberitahuan status permohonan PBG & SLF Kabupaten Garut.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('BULK_BROADCAST')}
            className={`flex items-center gap-1.5 px-3.5 py-2 font-bold uppercase tracking-wider transition border ${
              activeTab === 'BULK_BROADCAST'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>Siaran Massal ({selectedAppIds.length})</span>
          </button>

          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-2 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template WA</span>
            </button>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5">
            <span className="text-[9px] text-slate-400 block uppercase font-mono">TOTAL LOG OUTBOX</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{notifications.length} Pesan</span>
          </div>
        </div>
      </div>

      {/* Main Sub-Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-xs font-mono font-bold uppercase overflow-x-auto">
        <button
          onClick={() => setActiveTab('OUTBOX')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'OUTBOX'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Outbox & History Log ({notifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BULK_BROADCAST')}
          className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'BULK_BROADCAST'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-800/40 -mb-[1px]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>Siaran Notifikasi Massal (Bulk Sender)</span>
          {selectedAppIds.length > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {selectedAppIds.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: OUTBOX HISTORY LOG */}
      {activeTab === 'OUTBOX' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari register, nama, atau no HP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans"
              />
            </div>
            <div className="text-xs font-mono text-slate-500">
              Menampilkan <strong className="text-slate-900 dark:text-white">{filteredNotifs.length}</strong> dari {notifications.length} log
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Waktu & Tipe Pesan</th>
                  <th className="px-4 py-3">Penerima & No. WA</th>
                  <th className="px-4 py-3">No. Register</th>
                  <th className="px-4 py-3">Isi Pesan (Preview)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNotifs.map((notif) => (
                  <tr key={notif.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    
                    {/* Time & Template */}
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                        {notif.templateType}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {notif.createdAt}
                      </span>
                    </td>

                    {/* Recipient */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {notif.recipientName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{notif.recipientPhone}</span>
                      </div>
                    </td>

                    {/* Register */}
                    <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      {notif.registerNumber}
                    </td>

                    {/* Message Preview */}
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 font-mono">
                        {notif.message}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 font-mono font-bold ${
                        notif.status === 'SENT' || notif.status === 'DELIVERED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : notif.status === 'PENDING'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {notif.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(notif.id, notif.message)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold uppercase transition"
                          title="Salin Pesan"
                        >
                          {copiedId === notif.id ? 'COPIED!' : 'SALIN'}
                        </button>

                        <button
                          onClick={() => onOpenWhatsApp(notif.recipientPhone, notif.message)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-bold uppercase transition"
                          title="Buka di WhatsApp Web"
                        >
                          KIRIM WA
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredNotifs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-mono text-xs">
                      TIDAK ADA LOG NOTIFIKASI YANG DITEMUKAN.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BULK BROADCAST SENDER */}
      {activeTab === 'BULK_BROADCAST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Filter & Select Applications (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-mono font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. Filter & Pilih Target Permohonan ({filteredApplications.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Centang daftar permohonan yang akan dikirimi notifikasi massal secara bersamaan.
                </p>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 uppercase transition"
                >
                  Pilih Semua ({filteredApplications.length})
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 font-bold uppercase transition"
                >
                  Reset Pilih
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              
              {/* Status Filter */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Status Permohonan</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="NEW">NEW (Pendaftaran Baru)</option>
                  <option value="UNDER_VERIFICATION">UNDER_VERIFICATION (Verifikasi Dokumen)</option>
                  <option value="INCOMPLETE">INCOMPLETE (Dokumen Kurang/Revisi)</option>
                  <option value="READY_FOR_CONSULTATION">READY_FOR_CONSULTATION (Siap Sidang/Visite)</option>
                  <option value="SCHEDULED">SCHEDULED (Terjadwal Sidang)</option>
                  <option value="CONSULTATION_DONE">CONSULTATION_DONE (Selesai Sidang)</option>
                  <option value="RETRIBUTION_READY">RETRIBUTION_READY (Siap SKRD)</option>
                  <option value="COMPLETED">COMPLETED (PBG/SLF Terbit)</option>
                </select>
              </div>

              {/* Permit Filter */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Jenis Izin</label>
                <select
                  value={selectedPermitFilter}
                  onChange={(e) => setSelectedPermitFilter(e.target.value)}
                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="ALL">Semua (PBG & SLF)</option>
                  <option value="PBG">Hanya PBG</option>
                  <option value="SLF">Hanya SLF</option>
                </select>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Cari Kata Kunci</label>
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Register/Nama/No HP..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans"
                  />
                </div>
              </div>

            </div>

            {/* Selected Counter Pill */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-indigo-900 dark:text-indigo-300 font-bold">
                PERMOHONAN TERPILIH: <strong className="text-indigo-600 dark:text-indigo-400 text-sm">{selectedAppIds.length}</strong> / {filteredApplications.length} Terfilter
              </span>
              <span className="text-[10px] text-slate-500">
                {selectedAppIds.length === 0 ? 'Pilih minimal 1 item untuk siaran' : 'Siap diproses ke Outbox'}
              </span>
            </div>

            {/* Application Multi-Select Table */}
            <div className="border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[460px]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={filteredApplications.length > 0 && filteredApplications.every(a => selectedAppIds.includes(a.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSelectAllFiltered();
                          } else {
                            handleDeselectAll();
                          }
                        }}
                        className="rounded-none cursor-pointer"
                      />
                    </th>
                    <th className="p-2.5">No. Register & Izin</th>
                    <th className="p-2.5">Pemohon & Kontak WA</th>
                    <th className="p-2.5">Proyek Bangunan</th>
                    <th className="p-2.5">Status Alur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredApplications.map(app => {
                    const isSelected = selectedAppIds.includes(app.id);
                    const isSlf = app.registerNumber.startsWith('SLF');

                    return (
                      <tr 
                        key={app.id} 
                        onClick={() => handleToggleSelectApp(app.id)}
                        className={`cursor-pointer transition ${
                          isSelected 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-medium' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectApp(app.id)}
                            className="rounded-none cursor-pointer"
                          />
                        </td>

                        <td className="p-2.5 font-mono">
                          <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                            {app.registerNumber}
                          </div>
                          <span className={`text-[9px] font-bold px-1 py-0.2 border uppercase ${
                            isSlf ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {isSlf ? 'SLF' : 'PBG'}
                          </span>
                        </td>

                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {app.applicant.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{app.applicant.phone}</span>
                          </div>
                        </td>

                        <td className="p-2.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {app.building.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Kec. {app.building.district}
                          </div>
                        </td>

                        <td className="p-2.5">
                          <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredApplications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 font-mono text-xs">
                        TIDAK ADA PERMOHONAN YANG MEMENUHI FILTER TEKS / STATUS.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right Column: Template Config & Batch Dispatch (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Pilih Template & Edit Narasi Siaran</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Pesan akan dikompilasi secara dinamis untuk setiap pemohon terpilih.
              </p>
            </div>

            {/* Template Selector */}
            <div className="font-mono text-xs space-y-1">
              <label className="block text-[10px] text-slate-500 uppercase font-bold">Pilih Template Otomatis *</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold"
              >
                {waSettings.templates.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    [{tpl.category}] {tpl.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Body Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <label className="text-slate-500 uppercase font-bold">Naskah Pesan Siaran Massal *</label>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">Variabel/Tags Aktif</span>
              </div>

              <textarea
                rows={7}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Tuliskan naskah template pesan WhatsApp..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans text-xs text-slate-900 dark:text-white leading-relaxed"
              />

              <div className="text-[10px] text-slate-400 font-mono italic">
                Tags yang tersedia: &#123;nama_pemohon&#125;, &#123;no_register&#125;, &#123;jenis_izin&#125;, &#123;nama_bangunan&#125;, &#123;link_simbg&#125;
              </div>
            </div>

            {/* Live Sample Preview Box */}
            {previewApp && (
              <div className="border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-1">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>PRATINJAU HASIL KOMPILASI (SAMPLE)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{previewApp.registerNumber}</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 text-[11px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-36 overflow-y-auto">
                  {compileWhatsAppMessage(customBody, previewApp, {}, waSettings)}
                </div>
              </div>
            )}

            {/* Dispatch Action Button */}
            <div className="pt-2">
              <button
                onClick={handleExecuteBulkBroadcast}
                disabled={selectedAppIds.length === 0}
                className={`w-full py-3 px-4 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition ${
                  selectedAppIds.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Kirim Siaran Massal ke {selectedAppIds.length} Permohonan</span>
              </button>
            </div>

            {/* Dispatch Success Result Drawer / Queue */}
            {dispatchSuccessCount !== null && (
              <div className="border border-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40 p-3 space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>BERHASIL MEMPROSES {dispatchSuccessCount} NOTIFIKASI MASSAL!</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">
                  Semua {dispatchSuccessCount} pesan telah ditambahkan ke Outbox Log. Anda dapat mengirimkan pesan langsung via WhatsApp Web satu per satu di bawah ini:
                </p>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {lastDispatchedQueue.map((item, idx) => (
                    <div key={idx} className="p-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-[10px]">
                      <div>
                        <strong className="text-slate-900 dark:text-white block">{item.name} ({item.register})</strong>
                        <span className="text-slate-500">{item.phone}</span>
                      </div>
                      <button
                        onClick={() => onOpenWhatsApp(item.phone, item.text)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase transition"
                      >
                        Buka WA
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
