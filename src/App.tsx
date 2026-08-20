import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Navbar, 
  MainNavTab 
} from './components/Navbar';
import { 
  DashboardView 
} from './components/DashboardView';
import { 
  WorkflowPipelineView 
} from './components/WorkflowPipelineView';
import { 
  VisiteLapanganModule 
} from './components/VisiteLapanganModule';
import { 
  ApplicationsView 
} from './components/ApplicationsView';
import { 
  ApplicationDetailModal 
} from './components/ApplicationDetailModal';
import { 
  VerificationView 
} from './components/VerificationView';
import { 
  SchedulingView 
} from './components/SchedulingView';
import { 
  RetributionView 
} from './components/RetributionView';
import { 
  NotificationView 
} from './components/NotificationView';
import { 
  DataQualityCenter 
} from './components/DataQualityCenter';
import {
  SettingsView
} from './components/SettingsView';
import { 
  CopilotDrawer 
} from './components/CopilotDrawer';
import {
  InternalQrScannerModal
} from './components/InternalQrScannerModal';
import {
  OfficialVerificationModal
} from './components/OfficialVerificationModal';
import {
  PublicAttendanceView
} from './components/PublicAttendanceView';
import { 
  Application, 
  ApplicationStatus, 
  NotificationLog, 
  UserRole,
  WhatsAppSettings
} from './types';
import { RetribusiForm } from './components/RetribusiForm';
import { useApplications } from './hooks/useApplications';
import { 
  getStoredNotifications, 
  saveStoredNotifications,
  scanDataQualityIssues,
  getStoredWhatsAppSettings,
  saveStoredWhatsAppSettings,
  resetStoredWhatsAppSettings
} from './lib/storage';
import { runDocumentVerification } from './lib/ruleEngine';
import { generateSmartSchedule } from './lib/schedulingEngine';
import { generateNoticeLetterDraft } from './lib/workflowEngine';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Info, Calculator, MessageSquare } from 'lucide-react';

export default function App() {
  // Realtime Firebase State
  const { applications, updateApplication, batchUpdateApplications, deleteApplication, loading: appsLoading } = useApplications();

  // Persistence State
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => getStoredNotifications());
  const [waSettings, setWaSettings] = useState<WhatsAppSettings>(() => getStoredWhatsAppSettings());

  // Navigation State
  const [activeTab, setActiveTab] = useState<MainNavTab>('PIPELINE');

  // Role & Theme State
  const [currentRole, setCurrentRole] = useState<UserRole>('OPERATOR_SIMBG');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('simbg_theme') === 'dark';
  });

  // Modal & Detail State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState<string | undefined>(undefined);
  const [statusFilterForApps, setStatusFilterForApps] = useState<ApplicationStatus | 'ALL'>('ALL');

  // Realtime QR Verification Notice State & Modal
  const [qrVerifyNotice, setQrVerifyNotice] = useState<{
    type: string;
    title: string;
    subtitle: string;
  } | null>(null);
  const [isOfficialVerificationOpen, setIsOfficialVerificationOpen] = useState(false);
  const [attendanceApp, setAttendanceApp] = useState<Application | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | undefined>(undefined);
  const [verificationParams, setVerificationParams] = useState<{
    type?: string;
    role?: string;
    name?: string;
    nip?: string;
    reg?: string;
    applicant?: string;
  } | undefined>(undefined);

  // Detect Realtime QR Verification Query Parameters in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyType = params.get('type');
      const token = params.get('token');
      const mode = params.get('mode');
      const regNum = params.get('reg');
      const tok = params.get('tok');
      
      if (mode === 'attendance' && regNum) {
        const matched = applications.find(a => a.registerNumber === regNum);
        if (matched) {
          setAttendanceApp(matched);
          if (tok) setVerificationToken(tok);
        }
      }

      if (verifyType || token) {
        const role = params.get('role') || 'TERVERIFIKASI';
        const name = params.get('name') || params.get('applicant') || 'ASN DPUPR Garut';
        const nip = params.get('nip') || params.get('reg') || '';
        const reg = params.get('reg') || params.get('doc') || '';
        const applicant = params.get('applicant') || '';

        setQrVerifyNotice({
          type: verifyType || 'TTE',
          title: `${name} (${role})`,
          subtitle: nip ? `Nomor Identitas / Register: ${nip}` : 'Keabsahan TTE DPUPR Garut Terkonfirmasi'
        });

        setVerificationToken(token || undefined);
        setVerificationParams({
          type: verifyType || 'TTE DOKUMEN RESMI',
          role,
          name,
          nip,
          reg,
          applicant
        });
        setIsOfficialVerificationOpen(true);
      }
    }
  }, []);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync dark mode to DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('simbg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('simbg_theme', 'light');
    }
  }, [isDarkMode]);

  // Keyboard shortcut listener for quick tab navigation (Ctrl+1 to Ctrl+0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Do not intercept if user is typing in form inputs, textareas, or select elements
        const activeTagName = document.activeElement?.tagName?.toLowerCase();
        if (activeTagName === 'input' || activeTagName === 'textarea' || activeTagName === 'select') {
          return;
        }

        const key = e.key;
        const tabMap: Record<string, { tab: MainNavTab; label: string }> = {
          '1': { tab: 'DASHBOARD', label: 'Dashboard' },
          '2': { tab: 'PIPELINE', label: 'Alur Terpadu PBG/SLF' },
          '3': { tab: 'APPLICATIONS', label: 'Permohonan' },
          '4': { tab: 'VISITE_LAPANGAN', label: 'Visite Lapangan' },
          '5': { tab: 'VERIFICATION', label: 'Verifikasi Dokumen' },
          '6': { tab: 'SCHEDULING', label: 'Sidang Jumat' },
          '7': { tab: 'RETRIBUTION', label: 'Retribusi PP 16' },
          '8': { tab: 'NOTIFICATIONS', label: 'Notifikasi WA' },
          '9': { tab: 'DATA_QUALITY', label: 'Data Sanity' },
          '0': { tab: 'SETTINGS', label: 'Pengaturan WA' }
        };

        if (tabMap[key]) {
          e.preventDefault();
          const targetTab = tabMap[key];
          setActiveTab(targetTab.tab);
          showToast(`Navigasi Cepat: Membuka ${targetTab.label} (Ctrl+${key})`, 'info');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Global Escape key listener to close modals
  useEffect(() => {
    const handleEscapeKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedApp(null);
        setIsCopilotOpen(false);
        setIsQrScannerOpen(false);
        setIsOfficialVerificationOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscapeKeyDown);
    return () => {
      window.removeEventListener('keydown', handleEscapeKeyDown);
    };
  }, []);

  // Persist notifications on change
  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  // Data Quality scan count
  const dataQualityIssueCount = scanDataQualityIssues(applications).length;

  // Handlers for Application CRUD
  const handleAddNewApplication = (newApp: Application) => {
    updateApplication(newApp);
    showToast(`Permohonan ${newApp.registerNumber} berhasil ditambahkan ke sistem.`);
  };

  const handleDeleteApplication = async (appId: string) => {
    await deleteApplication(appId);
    if (selectedApp?.id === appId) {
      setSelectedApp(null);
    }
    showToast('Permohonan berhasil dihapus dari sistem.', 'success');
  };

  const handleUpdateApplication = (updatedApp: Application) => {
    updateApplication(updatedApp);
    if (selectedApp?.id === updatedApp.id) setSelectedApp(updatedApp);
    showToast(`Data permohonan ${updatedApp.registerNumber} berhasil diperbarui.`);
  };

  const handleSaveWaSettings = (newSettings: WhatsAppSettings) => {
    setWaSettings(newSettings);
    saveStoredWhatsAppSettings(newSettings);
    showToast('Pengaturan template WhatsApp berhasil disimpan.');
  };

  const handleResetWaSettings = () => {
    const defaultSettings = resetStoredWhatsAppSettings();
    setWaSettings(defaultSettings);
    showToast('Pengaturan template WhatsApp dikembalikan ke standar bawaan DPUPR Garut.', 'info');
  };

  // Batch Verification Trigger
  const handleBatchVerifyAll = () => {
    let updatedCount = 0;
    const toUpdate: Application[] = [];
    const updated = applications.map(app => {
      const result = runDocumentVerification(app);
      let newStatus = app.status;

      if (app.status === 'NEW' || app.status === 'UNDER_VERIFICATION') {
        newStatus = result.status === 'VALID' ? 'READY_FOR_CONSULTATION' : 'INCOMPLETE';
        updatedCount++;
        const updatedApp = {
          ...app,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
        toUpdate.push(updatedApp);
        return updatedApp;
      }

      return app;
    });

    if (toUpdate.length > 0) {
      batchUpdateApplications(toUpdate);
    }
    showToast(`Verifikasi massal selesai. ${updatedCount} permohonan telah diperbarui statusnya.`);
  };

  // Auto Generate Friday Schedule
  const handleAutoGenerateFridaySchedule = () => {
    const readyApps = applications.filter(a => (a.status === 'READY_FOR_CONSULTATION' || a.status === 'COMPLETE') && !a.schedule);
    if (readyApps.length === 0) {
      showToast('Tidak ada permohonan berstatus Siap Konsultasi yang belum dijadwalkan.', 'info');
      return;
    }

    const scheduled = generateSmartSchedule(readyApps);
    const scheduledMap = new Map(scheduled.map(s => [s.app.id, s.schedule]));

    const updated = applications.map(a => {
      if (scheduledMap.has(a.id)) {
        const sch = scheduledMap.get(a.id)!;
        const letter = generateNoticeLetterDraft(a, sch.scheduleDate, sch.timeSlot, sch.room);
        const updatedApp = {
          ...a,
          schedule: sch,
          consultationNotice: letter,
          status: 'SCHEDULED' as const,
          lastUpdated: new Date().toISOString()
        };
        updateApplication(updatedApp);
        return updatedApp;
      }
      return a;
    });

    showToast(`Berhasil menjadwalkan ${scheduled.length} permohonan ke Sidang TPA/TPT hari Jumat.`);
  };

  // Toggle Attendance
  const handleToggleAttendance = (appId: string) => {
    const target = applications.find(a => a.id === appId);
    if (!target || !target.schedule) return;

    const isAttended = !target.schedule.applicantAttended;
    const updatedApp: Application = {
      ...target,
      schedule: {
        ...target.schedule,
        applicantAttended: isAttended,
        attendanceTimestamp: isAttended ? new Date().toLocaleString('id-ID') + ' WIB' : undefined
      },
      lastUpdated: new Date().toISOString()
    };

    handleUpdateApplication(updatedApp);
    showToast(`Status kehadiran pemohon ${target.applicant.name}: ${isAttended ? 'HADIR' : 'BELUM HADIR'}`);
  };

  // Update Consultation Result
  const handleUpdateConsultationResult = (appId: string, result: 'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG', notes?: string) => {
    const target = applications.find(a => a.id === appId);
    if (!target || !target.schedule) return;

    const updatedApp: Application = {
      ...target,
      schedule: {
        ...target.schedule,
        consultationResult: result,
        consultationNotes: notes || target.schedule.consultationNotes
      },
      status: result === 'DISETUJUI' ? 'CONSULTATION_DONE' : 'REVISION_REQUESTED',
      lastUpdated: new Date().toISOString()
    };

    handleUpdateApplication(updatedApp);
    showToast(`Hasil sidang konsultasi ${target.registerNumber}: ${result}`);
  };

  // Open WhatsApp Web Link
  const handleOpenWhatsAppWeb = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Ask AI about a specific app
  const handleAskAiAboutApp = (app: Application) => {
    setSelectedApp(app);
    setCopilotInitialPrompt(`Berikan analisis kepatuhan regulasi PP 16/2021, kelengkapan berkas, dan estimasi retribusi untuk permohonan ${app.registerNumber} (${app.building.name}).`);
    setIsCopilotOpen(true);
  };

  if (appsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing SIMBG Production Environment...</p>
      </div>
    );
  }

  if (attendanceApp) {
    return (
      <PublicAttendanceView 
        application={attendanceApp} 
        onConfirmAttendance={(id) => handleToggleAttendance(id)} 
        verificationToken={verificationToken}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      
      {/* Toast Alert (Geometric Precision) */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 shadow-2xl flex items-center gap-2 text-xs font-mono">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Realtime QR Verification Banner */}
      {qrVerifyNotice && (
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-3 px-4 sm:px-6 shadow-lg flex flex-wrap items-center justify-between gap-2 font-mono text-xs z-50 border-b border-emerald-400/40">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-200 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold uppercase tracking-wider bg-emerald-900/90 px-2 py-0.5 border border-emerald-400 mr-2 text-[10px]">
                🛡️ TTE KRIPTOGRAFI SAH
              </span>
              <span className="font-bold">{qrVerifyNotice.title}</span>
              <span className="text-emerald-100 ml-2">({qrVerifyNotice.subtitle})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsOfficialVerificationOpen(true)}
              className="px-3 py-1 bg-white text-emerald-900 hover:bg-emerald-50 text-[10px] uppercase font-bold transition flex items-center gap-1 shadow-sm"
            >
              <span>📜 Buka Sertifikat TTE</span>
            </button>
            <button 
              onClick={() => setQrVerifyNotice(null)}
              className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-900 text-white text-[10px] uppercase font-bold transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar with Geometric Tabs */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenCopilot={() => {
          setCopilotInitialPrompt(undefined);
          setIsCopilotOpen(true);
        }}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        dataQualityIssueCount={dataQualityIssueCount}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 md:p-8 pb-20 md:pb-8">
        
        {/* Dynamic Views with Smooth Fade-In Transitions */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-6"
        >
          {activeTab === 'PIPELINE' && (
            <WorkflowPipelineView
              applications={applications}
              onSelectApplication={(app) => setSelectedApp(app)}
              onUpdateApplication={handleUpdateApplication}
              onOpenNewApplicationModal={() => {
                setActiveTab('APPLICATIONS');
              }}
              onOpenWhatsApp={handleOpenWhatsAppWeb}
            />
          )}

          {activeTab === 'DASHBOARD' && (
            <DashboardView
              applications={applications}
              onSelectApplication={(app) => setSelectedApp(app)}
              onNavigate={(tab) => setActiveTab(tab as any)}
              onRunBatchVerification={handleBatchVerifyAll}
              onOpenCopilot={() => {
                setCopilotInitialPrompt(undefined);
                setIsCopilotOpen(true);
              }}
            />
          )}

          {activeTab === 'APPLICATIONS' && (
            <ApplicationsView
              applications={applications}
              onSelectApplication={(app) => setSelectedApp(app)}
              onQuickVerify={(app) => {
                setSelectedApp(app);
              }}
              onAddNewApplication={handleAddNewApplication}
              onDeleteApplication={handleDeleteApplication}
              initialStatusFilter={statusFilterForApps}
            />
          )}

          {activeTab === 'VISITE_LAPANGAN' && (
            <VisiteLapanganModule
              applications={applications}
              onUpdateApplication={handleUpdateApplication}
              onSelectApplication={(app) => setSelectedApp(app)}
              onSendWhatsApp={(phone, text) => handleOpenWhatsAppWeb(phone, text)}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'VERIFICATION' && (
            <VerificationView
              applications={applications}
              onBatchVerifyAll={handleBatchVerifyAll}
              onSelectApplication={(app) => setSelectedApp(app)}
              onOpenWhatsApp={handleOpenWhatsAppWeb}
            />
          )}

          {activeTab === 'SCHEDULING' && (
            <SchedulingView
              applications={applications}
              onAutoGenerateFridaySchedule={handleAutoGenerateFridaySchedule}
              onSelectApplication={(app) => setSelectedApp(app)}
              onToggleAttendance={handleToggleAttendance}
              onUpdateConsultationResult={handleUpdateConsultationResult}
              onUpdateApplication={handleUpdateApplication}
            />
          )}

          {activeTab === 'RETRIBUTION' && (
            <div className="max-w-5xl mx-auto p-4 sm:p-8">
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Kalkulator Retribusi Digital</h2>
                  <p className="text-slate-500 font-medium">Hitung rincian retribusi bangunan gedung & prasarana sesuai PP 16/2021.</p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 px-4 py-2 rounded-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Indeks Lokalitas Garut: 0,5</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <RetribusiForm 
                    application={selectedApp || undefined} 
                    onSave={(data) => {
                      showToast('Hasil perhitungan retribusi berhasil disimpan ke database.', 'success');
                    }}
                  />
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-4 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-indigo-600" /> Panduan Perhitungan
                    </h3>
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-sm">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase mb-1">Rumus Utama (BG)</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                          L_Lt × (I_lo × SHST) × I_t × I_bg
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-sm">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase mb-1">Rumus Prasarana</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                          V × I × I_bg × HSpbg
                        </p>
                      </div>
                      <ul className="text-[10px] text-slate-500 space-y-2 list-disc pl-4">
                        <li><strong>L_Lt</strong>: Luas Lantai Total (m²)</li>
                        <li><strong>I_lo</strong>: Indeks Lokalitas (Garut = 0,5)</li>
                        <li><strong>SHST</strong>: Standar Harga Satuan Tertinggi</li>
                        <li><strong>I_t</strong>: Indeks Terintegrasi (Fungsi & Klasifikasi)</li>
                        <li><strong>I_bg</strong>: Indeks Bangunan Gedung Terbangun</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-6 text-white shadow-lg">
                    <h3 className="text-xs font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Validasi PP 16/2021
                    </h3>
                    <p className="text-[11px] text-indigo-100 leading-relaxed">
                      Kalkulator ini menggunakan parameter indeks yang mengacu pada Lampiran II Peraturan Pemerintah No. 16 Tahun 2021 tentang Peraturan Pelaksanaan UU No. 28 Tahun 2002 tentang Bangunan Gedung.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'NOTIFICATIONS' && (
            <NotificationView
              notifications={notifications}
              applications={applications}
              onResendNotification={(id) => {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'SENT', errorMessage: undefined } : n));
                showToast('Notifikasi berhasil dikirim ulang.');
              }}
              onAddNotifications={(newNotifs) => {
                setNotifications(prev => [...newNotifs, ...prev]);
                saveStoredNotifications([...newNotifs, ...notifications]);
                showToast(`${newNotifs.length} notifikasi siaran massal berhasil ditambahkan ke Outbox.`);
              }}
              onOpenWhatsApp={handleOpenWhatsAppWeb}
              onNavigateToSettings={() => setActiveTab('SETTINGS')}
            />
          )}

          {activeTab === 'DATA_QUALITY' && (
            <DataQualityCenter
              applications={applications}
              onUpdateApplications={batchUpdateApplications}
              onSelectApplication={(app) => setSelectedApp(app)}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <SettingsView
              applications={applications}
              settings={waSettings}
              onSaveSettings={handleSaveWaSettings}
              onResetSettings={handleResetWaSettings}
              onOpenWhatsApp={handleOpenWhatsAppWeb}
            />
          )}
        </motion.div>

      </main>

      {/* Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdateApplication={handleUpdateApplication}
          onSendWhatsApp={(phone, text) => handleOpenWhatsAppWeb(phone, text)}
          onAskAiAboutThisApp={handleAskAiAboutApp}
          currentRole={currentRole}
        />
      )}

      {/* Floating AI Copilot Trigger Button (Geometric Balance) */}
      {!isCopilotOpen && (
        <button
          onClick={() => {
            setCopilotInitialPrompt(undefined);
            setIsCopilotOpen(true);
          }}
          className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 sm:px-4 py-2.5 sm:py-3 shadow-xl flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-105 border border-indigo-400/30"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>AI COPILOT</span>
        </button>
      )}

      {/* Copilot Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        applications={applications}
        currentRole={currentRole}
        initialPrompt={copilotInitialPrompt}
      />

      {/* Internal QR Code Scanner Modal */}
      <InternalQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        applications={applications}
        onAttendanceVerified={(result) => {
          if (result.type === 'APPLICATION' && result.appId && result.isAutoLogged) {
            const app = applications.find(a => a.id === result.appId);
            if (app && !app.schedule?.applicantAttended) {
              handleToggleAttendance(app.id);
              showToast(`AUTO-LOG: Kehadiran ${app.applicant.name} terverifikasi via QR.`, 'success');
            } else {
              showToast(`Presensi ${result.name} sudah tercatat sebelumnya.`);
            }
          } else {
            showToast(`Presensi ${result.type}: ${result.name} berhasil diverifikasi!`);
          }
        }}
      />

      {/* Official Cryptographic TTE Verification Certificate Modal */}
      <OfficialVerificationModal
        isOpen={isOfficialVerificationOpen}
        onClose={() => setIsOfficialVerificationOpen(false)}
        token={verificationToken}
        initialParams={verificationParams}
      />

      {/* Telemetry Footer (Geometric Balance Signature Component) */}
      <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-10 text-[10px] font-mono text-slate-400">
        <div className="flex gap-4 sm:gap-6">
          <span>BUILD_ID: 2026.08.18-GARUT-STABLE</span>
          <span>SESSION: DPUPR-SIMBG-4F92</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>CONNECTION SECURE // RSA-4096</span>
        </div>
      </footer>

    </div>
  );
}
