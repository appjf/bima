import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  List,
  LayoutGrid, 
  Clock, 
  Users, 
  QrCode, 
  CheckCircle2, 
  Printer, 
  FileText, 
  Plus, 
  Building2, 
  MapPin, 
  Sparkles,
  Zap,
  ShieldCheck,
  UserCheck,
  Download,
  Copy,
  Check,
  Scan,
  Search,
  X,
  ExternalLink,
  Edit3,
  User
} from 'lucide-react';
import { Application, ConsultationSchedule } from '../types';
import { getNextFridayDate, MASTER_EXPERTS, MASTER_ROOMS, TIME_SLOTS } from '../lib/schedulingEngine';
import { SchedulingAttendancePrint } from './SchedulingAttendancePrint';
import { PublicAttendanceSheet } from './PublicAttendanceSheet';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';
import { InternalQrScannerModal } from './InternalQrScannerModal';
import { generateNoticeLetterDraft } from '../lib/workflowEngine';
import { 
  buildAttendanceQrPayload, 
  generateQrDataUrl, 
  parseAndVerifyAttendanceQr, 
  AttendanceVerificationResult 
} from '../lib/qrAttendanceService';

interface SchedulingViewProps {
  applications: Application[];
  onAutoGenerateFridaySchedule: () => void;
  onToggleAttendance: (appId: string) => void;
  onUpdateConsultationResult: (appId: string, result: 'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG', notes?: string) => void;
  onSelectApplication: (app: Application) => void;
  onUpdateApplication?: (updated: Application) => void;
}

export const SchedulingView: React.FC<SchedulingViewProps> = ({
  applications,
  onAutoGenerateFridaySchedule,
  onToggleAttendance,
  onUpdateConsultationResult,
  onSelectApplication,
  onUpdateApplication
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<Application | null>(null);
  const [filterDate, setFilterDate] = useState<string>('ALL');

  // QR Attendance State
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // View Mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Scanner State
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scanInput, setScanInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<AttendanceVerificationResult | null>(null);

  // Edit Schedule & Sync State
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editTimeSlot, setEditTimeSlot] = useState<string>('');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editSessionType, setEditSessionType] = useState<'SIDANG_TPA' | 'KONSULTASI_TPT'>('SIDANG_TPA');
  const [editExperts, setEditExperts] = useState<{ name: string; expertise: string; role: 'KETUA' | 'ANGGOTA' | 'SEKRETARIAT' }[]>([]);

  useEffect(() => {
    if (editingApp && editingApp.schedule) {
      const sch = editingApp.schedule;
      setEditDate(sch.scheduleDate);
      setEditTimeSlot(sch.timeSlot);
      setEditRoom(sch.room);
      setEditSessionType(sch.sessionType);
      setEditExperts(sch.assignedExperts);
    }
  }, [editingApp]);

  const toggleExpertAssignment = (expert: typeof MASTER_EXPERTS[0]) => {
    const exists = editExperts.some(e => e.name === expert.name);
    if (exists) {
      setEditExperts(prev => prev.filter(e => e.name !== expert.name));
    } else {
      let role: 'KETUA' | 'ANGGOTA' | 'SEKRETARIAT' = 'ANGGOTA';
      if (expert.role === 'KETUA') role = 'KETUA';
      if (expert.role === 'SEKRETARIAT') role = 'SEKRETARIAT';
      setEditExperts(prev => [...prev, { name: expert.name, expertise: expert.expertise, role }]);
    }
  };

  const handleSaveScheduleEdit = () => {
    if (!editingApp || !editingApp.schedule || !onUpdateApplication) return;

    const updatedSchedule: ConsultationSchedule = {
      ...editingApp.schedule,
      scheduleDate: editDate,
      timeSlot: editTimeSlot,
      room: editRoom,
      sessionType: editSessionType,
      assignedExperts: editExperts
    };

    // Keep invitation letter (consultationNotice) in perfect sync
    const letter = generateNoticeLetterDraft(editingApp, editDate, editTimeSlot, editRoom);
    const updatedApp: Application = {
      ...editingApp,
      schedule: updatedSchedule,
      consultationNotice: {
        ...(editingApp.consultationNotice || letter),
        scheduledDate: editDate,
        timeSlot: editTimeSlot,
        room: editRoom,
        isIssued: true,
        issuedAt: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    };

    onUpdateApplication(updatedApp);
    setEditingApp(null);
  };

  const handleGridDrop = (appId: string, targetTimeSlot: string, targetRoom: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app || !app.schedule || !onUpdateApplication) return;
    
    // Auto-save the new time slot and room via drag-and-drop
    const updatedSchedule: ConsultationSchedule = {
      ...app.schedule,
      timeSlot: targetTimeSlot,
      room: targetRoom
    };
    
    // Also sync the consultation notice letter
    const letter = generateNoticeLetterDraft(app, updatedSchedule.scheduleDate, updatedSchedule.timeSlot, updatedSchedule.room);
    
    const updatedApp: Application = {
      ...app,
      schedule: updatedSchedule,
      consultationNotice: letter,
      lastUpdated: new Date().toISOString()
    };
    
    onUpdateApplication(updatedApp);
  };

  const scheduledApps = applications.filter(a => a.schedule);
  const unscheduledReadyApps = applications.filter(a => (a.status === 'READY_FOR_CONSULTATION' || a.status === 'COMPLETE') && !a.schedule);

  const nextFriday = getNextFridayDate();

  // Generate QR Data URL whenever QR Modal is opened
  useEffect(() => {
    if (showQrModal) {
      setIsGeneratingQr(true);
      const payload = buildAttendanceQrPayload(showQrModal);
      generateQrDataUrl(payload.verificationUrl, { width: 320, margin: 2 })
        .then(url => {
          setGeneratedQrUrl(url);
          setIsGeneratingQr(false);
        })
        .catch(() => setIsGeneratingQr(false));
    } else {
      setGeneratedQrUrl('');
      setCopiedLink(false);
    }
  }, [showQrModal]);

  // Escape key handler to close local modals (QR display, Scanner, or Edit modal)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingApp) {
          e.stopPropagation();
          setEditingApp(null);
        } else if (showQrModal || showScannerModal) {
          e.stopPropagation();
          setShowQrModal(null);
          setShowScannerModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => {
      window.removeEventListener('keydown', handleEscape, true);
    };
  }, [showQrModal, showScannerModal, editingApp]);

  const handleCopyVerificationLink = () => {
    if (showQrModal) {
      const payload = buildAttendanceQrPayload(showQrModal);
      navigator.clipboard.writeText(payload.verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(null as any), 2000);
    }
  };

  const handleDownloadQrImage = () => {
    if (generatedQrUrl && showQrModal) {
      const a = document.createElement('a');
      a.href = generatedQrUrl;
      a.download = `QR_Presensi_${showQrModal.registerNumber}.png`;
      a.click();
    }
  };

  const handleRunScanVerification = (input: string) => {
    setScanInput(input);
    const result = parseAndVerifyAttendanceQr(input);
    setScanResult(result);
  };

  const handlePrintAttendanceList = () => {
    triggerPdfPrint('printable-attendance-area', `Daftar_Hadir_Sidang_${nextFriday.replace(/\s/g, '_')}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              SCHEDULE ENGINE // FRIDAY CONSULTATION
            </span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 border border-emerald-200">
              NEXT: {nextFriday}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Penjadwalan Sidang Konsultasi TPA / TPT (Hari Jumat)
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Manajemen alokasi ruangan sidang, penugasan Tim Profesi Ahli (TPA) & TPT, presensi pemohon berbasis Token QR digital, dan penerbitan berita acara konsultasi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowScannerModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 transition shadow-xs"
            title="Scan / Verifikasi Token Presensi QR Pemohon"
          >
            <Scan className="w-4 h-4 text-emerald-100" />
            <span>Scan / Verifikasi QR</span>
          </button>

          <button
            onClick={handlePrintAttendanceList}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 transition border border-slate-200 dark:border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Daftar Hadir</span>
          </button>

          <button
            onClick={() => triggerPdfPrint('printable-public-attendance-area', `Daftar_Hadir_Publik_${nextFriday.replace(/\s/g, '_')}`)}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 transition border border-slate-200 dark:border-slate-700"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Cetak QR Publik</span>
          </button>

          <button
            onClick={onAutoGenerateFridaySchedule}
            disabled={unscheduledReadyApps.length === 0}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition ${
              unscheduledReadyApps.length > 0 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Jadwalkan Otomatis ({unscheduledReadyApps.length})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (3-Col Geometric Balance) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            TERJADWAL SIDANG JUMAT
          </span>
          <div className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {scheduledApps.length} <span className="text-xs font-sans text-slate-400">permohonan</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Ruang DPUPR-01 & Ruang Rapat Lt. 2
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            SIAP DIJADWALKAN
          </span>
          <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400">
            {unscheduledReadyApps.length} <span className="text-xs font-sans text-slate-400">antrean berkas</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Dokumen 100% lengkap & terverifikasi
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
            TIM PROFESI AHLI (TPA) GARUT
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {MASTER_EXPERTS.length} <span className="text-xs font-sans text-slate-400">tenaga ahli</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2">
            Arsitektur, Struktur, Geoteknik, MEP
          </div>
        </div>
      </div>

      {/* Main Schedule Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase font-mono">
              Jadwal Sidang & Daftar Hadir Presensi Digital
            </h3>
            <p className="text-xs text-slate-500">
              Verifikasi kehadiran pemohon menggunakan token presensi QR dan catat rekomendasi sidang TPA.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded">
              <button 
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-xs font-bold uppercase flex items-center gap-1.5 rounded transition ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <List className="w-3.5 h-3.5" />
                Table
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-bold uppercase flex items-center gap-1.5 rounded transition ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid Kalender
              </button>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              TOTAL SESI: <span className="font-bold text-indigo-600 dark:text-indigo-400">{scheduledApps.length}</span>
            </span>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="border border-slate-200 dark:border-slate-800 overflow-x-auto pb-4">
            <table className="w-full text-xs font-sans table-fixed min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-2 py-3 w-32 border-r border-slate-200 dark:border-slate-800">Waktu</th>
                  {MASTER_ROOMS.map(room => (
                    <th key={room} className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">{room}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {TIME_SLOTS.map(timeSlot => (
                  <tr key={timeSlot}>
                    <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
                      {timeSlot}
                    </td>
                    {MASTER_ROOMS.map(room => {
                       const appsInSlot = scheduledApps.filter(app => app.schedule?.timeSlot === timeSlot && app.schedule?.room === room);
                       return (
                         <td 
                           key={room} 
                           className="p-1 border-r border-slate-200 dark:border-slate-800 align-top transition-colors"
                           onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50', 'dark:bg-indigo-900/30'); }}
                           onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/30'); }}
                           onDrop={(e) => { 
                             e.preventDefault(); 
                             e.currentTarget.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/30');
                             const appId = e.dataTransfer.getData('appId');
                             handleGridDrop(appId, timeSlot, room);
                           }}
                         >
                           <div className="min-h-[60px] space-y-1">
                             {appsInSlot.map(app => (
                               <div 
                                 key={app.id} 
                                 draggable
                                 onDragStart={(e) => e.dataTransfer.setData('appId', app.id)}
                                 className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded cursor-move hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400/50 transition relative group"
                                 onClick={() => { 
                                   setEditingApp(app); 
                                   setEditDate(app.schedule!.scheduleDate); 
                                   setEditTimeSlot(app.schedule!.timeSlot); 
                                   setEditRoom(app.schedule!.room); 
                                   setEditSessionType(app.schedule!.sessionType); 
                                   setEditExperts(app.schedule!.assignedExperts || []); 
                                 }}
                               >
                                 <div className="font-bold text-[10px] text-indigo-700 dark:text-indigo-400 truncate">{app.registerNumber}</div>
                                 <div className="text-[10px] text-slate-900 dark:text-white truncate font-medium">{app.applicant.name}</div>
                                 <div className="text-[9px] text-slate-500 truncate mt-1">
                                  <span className={app.schedule?.sessionType === 'SIDANG_TPA' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                                    {app.schedule?.sessionType === 'SIDANG_TPA' ? 'TPA' : 'TPT'}
                                  </span> • {app.building.name}
                                 </div>
                                 
                                 {/* Hover tooltip hint */}
                                 <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-400/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none rounded">
                                   <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase bg-white/90 dark:bg-slate-900/90 px-1 py-0.5 rounded shadow-sm">
                                     Edit / Drag
                                   </span>
                                 </div>
                               </div>
                             ))}
                             {appsInSlot.length === 0 && (
                               <div className="h-full w-full flex items-center justify-center">
                                 <span className="text-[9px] font-mono text-slate-300 dark:text-slate-700">Kosong</span>
                               </div>
                             )}
                           </div>
                         </td>
                       );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-[10px] text-slate-500 font-mono italic">
              * Tip: Drag and drop kartu jadwal ke kolom ruangan atau jam yang berbeda untuk memindahkan sesi. Klik kartu untuk mengedit tim ahli.
            </div>
          </div>
        ) : (
        <div className="border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Waktu & Sesi</th>
                <th className="px-4 py-3">Ruangan</th>
                <th className="px-4 py-3">No. Register & Pemohon</th>
                <th className="px-4 py-3">Bangunan & Kompleksitas</th>
                <th className="px-4 py-3">Kehadiran (Presensi)</th>
                <th className="px-4 py-3">Hasil Sidang</th>
                <th className="px-4 py-3 text-right">QR / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {scheduledApps.map((app) => {
                const sch = app.schedule!;
                return (
                  <tr key={app.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    
                    {/* Time Slot */}
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{sch.timeSlot}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Jumat, {sch.scheduleDate}
                      </span>
                    </td>

                    {/* Room */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] block">
                        {sch.room}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800 mt-0.5 inline-block">
                        {sch.sessionType}
                      </span>
                    </td>

                    {/* Applicant */}
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                        {app.registerNumber}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {app.applicant.name}
                      </div>
                    </td>

                    {/* Building */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {app.building.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {app.building.functionType} • {app.building.buildingArea}m²
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggleAttendance(app.id)}
                        className={`px-3 py-1 text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition ${
                          sch.applicantAttended
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{sch.applicantAttended ? 'HADIR (VERIFIED)' : 'BELUM HADIR'}</span>
                      </button>
                    </td>

                    {/* Result */}
                    <td className="px-4 py-3">
                      <select
                        value={sch.consultationResult || 'PENDING'}
                        onChange={(e) => onUpdateConsultationResult(app.id, e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold px-2 py-1 focus:outline-none"
                      >
                        <option value="PENDING">MENUNGGU SIDANG</option>
                        <option value="DISETUJUI">DISETUJUI (REKOMENDASI TERBIT)</option>
                        <option value="PERBAIKAN">PERBAIKAN GAMBAR</option>
                        <option value="KONSULTASI_ULANG">KONSULTASI ULANG</option>
                      </select>
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingApp(app)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 transition"
                          title="Edit Jadwal & Penugasan TPA"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setShowQrModal(app)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 transition"
                          title="Tampilkan QR Code Presensi"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {scheduledApps.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-mono text-xs">
                    BELUM ADA PERMOHONAN YANG DIJADWALKAN UNTUK HARI JUMAT.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* MODAL 1: QR Code Digital Token Display Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl relative font-sans">
            <button
              onClick={() => setShowQrModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono text-xs"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 text-center">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-0.5">
                DAFTAR HADIR // DIGITAL PRESENCE TOKEN
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white uppercase font-mono">
                QR Presensi Sidang TPA/TPT
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Scan QR Code ini pada meja registrasi / operator sidang untuk memverifikasi kehadiran.
              </p>
            </div>

            {/* Generated QR Code Display Container */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-none flex flex-col items-center justify-center space-y-3">
              {isGeneratingQr ? (
                <div className="w-52 h-52 flex flex-col items-center justify-center space-y-2 text-slate-400 font-mono text-xs">
                  <QrCode className="w-12 h-12 animate-pulse text-indigo-500" />
                  <span>Membuat QR Presensi...</span>
                </div>
              ) : generatedQrUrl ? (
                <div className="bg-white p-3 border border-slate-300 shadow-md flex flex-col items-center">
                  <img src={generatedQrUrl} alt="QR Code Presensi" className="w-52 h-52 object-contain" />
                  <span className="text-[10px] font-mono text-slate-500 mt-1 uppercase font-bold tracking-wider">
                    {showQrModal.registerNumber}
                  </span>
                </div>
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-red-500 font-mono text-xs">
                  Gagal mendatangkan QR Code
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 border ${
                  showQrModal.schedule?.applicantAttended
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800'
                }`}>
                  {showQrModal.schedule?.applicantAttended ? '✓ STATUS: TERDAPAT PRESENSI (HADIR)' : '! STATUS: BELUM PRESENSI'}
                </span>
              </div>
            </div>

            {/* Meeting Info Summary */}
            <div className="text-xs space-y-1.5 font-mono bg-slate-100 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="text-slate-500">Pemohon:</span>
                <strong className="text-slate-900 dark:text-white">{showQrModal.applicant.name}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <span className="text-slate-500">Jadwal:</span>
                <strong className="text-indigo-600 dark:text-indigo-400">Jumat, {showQrModal.schedule?.scheduleDate} ({showQrModal.schedule?.timeSlot})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ruangan:</span>
                <strong className="text-slate-900 dark:text-white">{showQrModal.schedule?.room}</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1 font-mono">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadQrImage}
                  disabled={!generatedQrUrl}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-600 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh QR</span>
                </button>

                <button
                  onClick={handleCopyVerificationLink}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-600 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onToggleAttendance(showQrModal.id);
                  setShowQrModal(null);
                }}
                className={`w-full py-2.5 px-4 font-bold text-xs uppercase transition flex items-center justify-center gap-2 ${
                  showQrModal.schedule?.applicantAttended
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{showQrModal.schedule?.applicantAttended ? 'Ubah Menjadi Belum Hadir' : 'Tandai Hadir Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Scanner / Verifikasi Token Presensi QR */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl relative font-sans">
            <button
              onClick={() => {
                setShowScannerModal(false);
                setScanInput('');
                setScanResult(null);
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono text-xs"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Scan className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white uppercase font-mono">
                  Scan & Verifikasi QR Presensi
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Pindai kamera atau tempelkan token/string QR Code pemohon untuk memeriksa keabsahan kehadiran sidang.
              </p>
            </div>

            {/* Input & Simulation Area */}
            <div className="space-y-3 font-mono text-xs">
              <label className="block text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                Tempelkan String / Token QR Presensi:
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => handleRunScanVerification(e.target.value)}
                  placeholder="Contoh: GARUT-PRESENSI-PBG-320501... atau tempelkan JSON QR"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2.5 font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  onClick={() => handleRunScanVerification(scanInput)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 flex items-center gap-1.5 transition"
                >
                  <Search className="w-4 h-4" />
                  <span>Verifikasi</span>
                </button>
              </div>

              {/* Preset Quick Scan Buttons for Scheduled Meetings */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Simulasi 1-Click Scan Pemohon Terjadwal:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {scheduledApps.map((app) => {
                    const payload = buildAttendanceQrPayload(app);
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleRunScanVerification(JSON.stringify(payload))}
                        className="bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2 py-1 text-[10px] font-mono flex items-center gap-1 transition"
                      >
                        <QrCode className="w-3 h-3 text-emerald-600" />
                        <span>{app.applicant.name} ({app.registerNumber})</span>
                      </button>
                    );
                  })}
                  {scheduledApps.length === 0 && (
                    <span className="text-[10px] text-slate-400 p-1">Belum ada pemohon terjadwal untuk dites.</span>
                  )}
                </div>
              </div>

              {/* Verification Result Feedback Box */}
              {scanResult && (
                <div className={`p-4 border space-y-2 transition ${
                  scanResult.isValid
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100'
                    : 'bg-red-50 border-red-300 text-red-950 dark:bg-red-950/60 dark:border-red-800 dark:text-red-100'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-xs uppercase">
                    {scanResult.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <span>{scanResult.message}</span>
                  </div>

                  {scanResult.payload && (
                    <div className="text-[11px] space-y-1 border-t border-emerald-200 dark:border-emerald-800/60 pt-2 font-mono">
                      <div><span className="opacity-70">No. Register:</span> <strong>{scanResult.payload.registerNumber}</strong></div>
                      <div><span className="opacity-70">Bangunan:</span> {scanResult.payload.buildingName}</div>
                      <div><span className="opacity-70">Sesi Sidang:</span> {scanResult.payload.scheduleDate} ({scanResult.payload.timeSlot})</div>
                      <div><span className="opacity-70">Ruangan:</span> {scanResult.payload.room}</div>

                      {/* Action to auto-mark attendance for matched app */}
                      {(() => {
                        const matchedApp = scheduledApps.find(a => a.registerNumber === scanResult.payload?.registerNumber || a.id === scanResult.payload?.appId);
                        if (matchedApp) {
                          return (
                            <div className="pt-2">
                              <button
                                onClick={() => {
                                  if (!matchedApp.schedule?.applicantAttended) {
                                    onToggleAttendance(matchedApp.id);
                                  }
                                  setShowScannerModal(false);
                                  setScanInput('');
                                  setScanResult(null);
                                }}
                                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-2 text-xs uppercase flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>{matchedApp.schedule?.applicantAttended ? 'Hadir (Sudah Dikonfirmasi)' : 'Konfirmasi Kehadiran Pemohon Ini'}</span>
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 text-right border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowScannerModal(false);
                  setScanInput('');
                  setScanResult(null);
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Camera QR Scanner Modal */}
      <InternalQrScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        applications={applications}
        onAttendanceVerified={(res) => {
          // Auto mark attendance for matched application
          const matchedApp = applications.find(a => 
            res.rawPayload.includes(a.registerNumber) || a.registerNumber === res.name || a.id === res.name
          );
          if (matchedApp && matchedApp.schedule && !matchedApp.schedule.applicantAttended) {
            onToggleAttendance(matchedApp.id);
          }
        }}
      />

      {/* MODAL 3: Edit Jadwal, Sesi & Penugasan Ahli (Synchronized with Notice Letter) */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 shadow-2xl relative font-sans">
            <button
              onClick={() => setEditingApp(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white font-mono text-xs"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white uppercase font-mono">
                  Alokasi Jadwal & Surat Undangan Sidang
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Sesuaikan jadwal sidang konsultasi teknis pemohon. Perubahan di sini akan **otomatis menyinkronkan** draf Surat Pemberitahuan Konsultasi secara real-time.
              </p>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold mb-1">
                    No. Register Permohonan
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={editingApp.registerNumber}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase font-bold mb-1">
                    Nama Pemohon
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={editingApp.applicant.name}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-bold text-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase font-bold mb-1">
                    Tanggal Sidang (Hari Jumat)
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase font-bold mb-1">
                    Waktu / Sesi Jam
                  </label>
                  <select
                    value={editTimeSlot}
                    onChange={(e) => setEditTimeSlot(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase font-bold mb-1">
                    Ruangan Sidang
                  </label>
                  <select
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {MASTER_ROOMS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase font-bold mb-1">
                    Jenis Sidang Konsultasi
                  </label>
                  <select
                    value={editSessionType}
                    onChange={(e) => setEditSessionType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="SIDANG_TPA">SIDANG TIM PROFESI AHLI (TPA)</option>
                    <option value="KONSULTASI_TPT">KONSULTASI TIM PENILAI TEKNIS (TPT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase font-bold mb-1">
                    Penugasan Tim Penilai / Ahli TPA
                  </label>
                  <div className="border border-slate-200 dark:border-slate-800 p-2.5 max-h-[142px] overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-950 font-mono text-[10px]">
                    {MASTER_EXPERTS.map((expert) => {
                      const isAssigned = editExperts.some(e => e.name === expert.name);
                      return (
                        <label
                          key={expert.name}
                          className="flex items-start gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1"
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => toggleExpertAssignment(expert)}
                            className="mt-0.5"
                          />
                          <div>
                            <span className="font-bold block text-slate-900 dark:text-slate-100">{expert.name}</span>
                            <span className="text-slate-400 block">{expert.expertise} • ({expert.role})</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Alert Banner */}
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div className="font-mono text-[10px] leading-relaxed text-indigo-950 dark:text-indigo-200">
                <span className="font-bold block uppercase">Sinkronisasi Dokumen Surat Undangan Aktif:</span>
                Menyimpan jadwal ini akan memperbarui tanggal, jam, ruangan, dan templat undangan pada menu permohonan bersangkutan. Surat Undangan fisik (PDF) dapat dicetak dengan data terupdate secara instan.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 text-right border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 font-mono">
              <button
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveScheduleEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase transition shadow-xs"
              >
                Simpan & Sinkronkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Attendance Sheet */}
      <div id="printable-attendance-area" className="hidden print:block">
        <SchedulingAttendancePrint scheduledApps={scheduledApps} nextFridayDate={nextFriday} />
      </div>

      {/* Printable Public Attendance Sheet (Tersinkronisasi dengan Permohonan) */}
      <div id="printable-public-attendance-area" className="hidden print:block">
        {scheduledApps.length > 0 && (
          <PublicAttendanceSheet 
            application={scheduledApps[0]}
            qrCodeUrl={generatedQrUrl || ''}
          />
        )}
      </div>

    </div>
  );
};
