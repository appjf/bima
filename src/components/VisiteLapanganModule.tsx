import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Printer, 
  UserCheck, 
  Building, 
  MapPin, 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  CheckSquare, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { 
  Application, 
  BeritaAcaraLapangan, 
  FieldVisitItem, 
  FieldVisitPhoto,
  WorkflowStage, 
  UserRole 
} from '../types';
import { 
  generateBeritaAcaraLapanganDraft, 
  generateDefaultFieldVisitItems, 
  isSlfApplication,
  getApplicationWorkflowStage 
} from '../lib/workflowEngine';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';

interface VisiteLapanganModuleProps {
  applications: Application[];
  onUpdateApplication: (updated: Application) => void;
  onSelectApplication: (app: Application) => void;
  onSendWhatsApp: (phone: string, message: string, templateType: any) => void;
  currentRole: UserRole;
}

export const VisiteLapanganModule: React.FC<VisiteLapanganModuleProps> = ({
  applications,
  onUpdateApplication,
  onSelectApplication,
  onSendWhatsApp,
  currentRole
}) => {
  // Filter for applications relevant to Visite Lapangan (Prioritizing SLF, but accessible to any PBG needing site inspection)
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    const slfApp = applications.find(a => isSlfApplication(a) || a.currentStage === 'STAGE_VISITE_LAPANGAN_SLF');
    return slfApp ? slfApp.id : (applications[0]?.id || '');
  });

  const [activeSubTab, setActiveSubTab] = useState<'FORM' | 'CAMERA' | 'BA_PREVIEW'>('FORM');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEED_VISITE' | 'COMPLETED_VISITE'>('ALL');

  const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0];

  // Local state for the active application's Field Visit & BA Lapangan
  const [visitDate, setVisitDate] = useState<string>(
    selectedApp?.baLapangan?.visitDate || new Date().toISOString().split('T')[0]
  );
  const [visitTime, setVisitTime] = useState<string>(
    selectedApp?.baLapangan?.visitTime || '09:30 WIB'
  );
  const [locationNotes, setLocationNotes] = useState<string>(
    selectedApp?.baLapangan?.locationNotes || 'Pemeriksaan fisik lapangan di lokasi bangunan berjalan lancar dan didampingi pemilik bangunan.'
  );
  const [conformityStatus, setConformityStatus] = useState<'SESUAI_DOKUMEN' | 'PERLU_PENYESUAIAN_LAPORAN' | 'TIDAK_SESUAI'>(
    selectedApp?.baLapangan?.conformityStatus || 'SESUAI_DOKUMEN'
  );
  const [recommendations, setRecommendations] = useState<string>(
    selectedApp?.baLapangan?.recommendations || 'Kondisi fisik bangunan eksisting laik fungsi dan sesuai dengan dokumen laporan kelaikan fungsi. Dapat dilanjutkan ke Sidang Konsultasi Teknis TPA/TPT.'
  );
  const [itemsChecked, setItemsChecked] = useState<FieldVisitItem[]>(
    selectedApp?.baLapangan?.itemsChecked || generateDefaultFieldVisitItems(selectedApp || ({} as any))
  );
  const [photos, setPhotos] = useState<FieldVisitPhoto[]>(
    selectedApp?.baLapangan?.photos || []
  );

  // Sync state when selectedApp changes
  useEffect(() => {
    if (selectedApp) {
      setVisitDate(selectedApp.baLapangan?.visitDate || new Date().toISOString().split('T')[0]);
      setVisitTime(selectedApp.baLapangan?.visitTime || '09:30 WIB');
      setLocationNotes(selectedApp.baLapangan?.locationNotes || 'Pemeriksaan fisik lapangan di lokasi bangunan berjalan lancar dan didampingi pemilik bangunan.');
      setConformityStatus(selectedApp.baLapangan?.conformityStatus || 'SESUAI_DOKUMEN');
      setRecommendations(selectedApp.baLapangan?.recommendations || 'Kondisi fisik bangunan eksisting laik fungsi dan sesuai dengan dokumen laporan kelaikan fungsi. Dapat dilanjutkan ke Sidang Konsultasi Teknis TPA/TPT.');
      setItemsChecked(selectedApp.baLapangan?.itemsChecked || generateDefaultFieldVisitItems(selectedApp));
      setPhotos(selectedApp.baLapangan?.photos || []);
    }
  }, [selectedAppId]);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedPhotoTag, setSelectedPhotoTag] = useState<string>('Tampak Depan / Fasad');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Kamera tidak didukung di browser ini. Gunakan fitur upload berkas foto.');
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Izin akses kamera ditolak atau tidak tersedia. Anda tetap dapat mengunggah file foto dari perangkat.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Photo from Camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add timestamp overlay on photo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(10, canvas.height - 40, canvas.width - 20, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        const tsText = `DPUPR GARUT // VISITE LAPANGAN // ${new Date().toLocaleString('id-ID')}`;
        ctx.fillText(tsText, 20, canvas.height - 20);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const newPhoto: FieldVisitPhoto = {
          id: `FOTO-${Date.now()}`,
          tag: selectedPhotoTag,
          dataUrl,
          caption: photoCaption || `Foto ${selectedPhotoTag} di lokasi ${selectedApp?.building.name}`,
          timestamp: new Date().toLocaleString('id-ID') + ' WIB'
        };

        const updatedPhotos = [newPhoto, ...photos];
        setPhotos(updatedPhotos);
        setPhotoCaption('');
        
        // Auto-save to application
        saveCurrentDraft(updatedPhotos, itemsChecked);
      }
    }
  };

  // Handle File Upload for Photos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhoto: FieldVisitPhoto = {
            id: `FOTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            tag: selectedPhotoTag,
            dataUrl: event.target.result as string,
            caption: photoCaption || file.name,
            timestamp: new Date().toLocaleString('id-ID') + ' WIB'
          };
          setPhotos(prev => {
            const updated = [newPhoto, ...prev];
            saveCurrentDraft(updated, itemsChecked);
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
    setPhotoCaption('');
  };

  // Delete Photo
  const handleDeletePhoto = (photoId: string) => {
    const updated = photos.filter(p => p.id !== photoId);
    setPhotos(updated);
    saveCurrentDraft(updated, itemsChecked);
  };

  // Helper: Save Draft
  const saveCurrentDraft = (currentPhotos: FieldVisitPhoto[], currentItems: FieldVisitItem[]) => {
    if (!selectedApp) return;
    const regClean = selectedApp.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const draftBa: BeritaAcaraLapangan = {
      baLapanganNumber: selectedApp.baLapangan?.baLapanganNumber || `BA-VISITE/${regClean}/DPUPR-GRT/2026`,
      visitDate,
      visitTime,
      inspectors: selectedApp.baLapangan?.inspectors || [
        { name: 'Dr. Ir. H. Hendra Setiawan, MT, IAI', role: 'Tim Penilai Teknis (TPA Arsitektur)' },
        { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', role: 'Tim Pengawas Struktur Bangunan' },
        { name: 'Rian Pratama, ST, M.Eng', role: 'Pengawas MEP & Damkar DPUPR' },
        { name: 'Dedi Kurniawan, S.AP', role: 'Sekretariat SIMBG Garut' }
      ],
      attendeesOwner: {
        name: selectedApp.applicant.name,
        role: 'Pemilik / Kuasa Bangunan Gedung',
        phone: selectedApp.applicant.phone
      },
      locationNotes,
      itemsChecked: currentItems,
      photos: currentPhotos,
      conformityStatus,
      recommendations,
      isCompleted: selectedApp.baLapangan?.isCompleted || false,
      completedAt: selectedApp.baLapangan?.completedAt
    };

    const updatedApp: Application = {
      ...selectedApp,
      baLapangan: draftBa,
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  // Finalize BA Lapangan & Advance to Consultation Stage
  const handleFinalizeAndProceed = () => {
    if (!selectedApp) return;
    const regClean = selectedApp.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const finalizedBa: BeritaAcaraLapangan = {
      baLapanganNumber: selectedApp.baLapangan?.baLapanganNumber || `BA-VISITE/${regClean}/DPUPR-GRT/2026`,
      visitDate,
      visitTime,
      inspectors: [
        { name: 'Dr. Ir. H. Hendra Setiawan, MT, IAI', role: 'Tim Penilai Teknis (TPA Arsitektur)' },
        { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', role: 'Tim Pengawas Struktur Bangunan' },
        { name: 'Rian Pratama, ST, M.Eng', role: 'Pengawas MEP & Damkar DPUPR' },
        { name: 'Dedi Kurniawan, S.AP', role: 'Sekretariat SIMBG Garut' }
      ],
      attendeesOwner: {
        name: selectedApp.applicant.name,
        role: 'Pemilik / Kuasa Bangunan Gedung',
        phone: selectedApp.applicant.phone
      },
      locationNotes,
      itemsChecked,
      photos,
      conformityStatus,
      recommendations,
      isCompleted: true,
      completedAt: new Date().toISOString()
    };

    const updatedApp: Application = {
      ...selectedApp,
      baLapangan: finalizedBa,
      status: 'READY_FOR_CONSULTATION',
      currentStage: 'STAGE_3_SURAT_PEMBERITAHUAN',
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);

    // Prompt WhatsApp notification
    const waText = `Yth. ${selectedApp.applicant.name}, Berita Acara Pemeriksaan Fisik Lapangan (Visite SLF) untuk bangunan "${selectedApp.building.name}" (No. Register: ${selectedApp.registerNumber}) telah disahkan dengan Nomor ${finalizedBa.baLapanganNumber}. Status: ${conformityStatus}. Permohonan kini berlanjut ke tahap Pembuatan Surat Pemberitahuan Konsultasi Teknis TPA/TPT.`;
    onSendWhatsApp(selectedApp.applicant.phone, waText, 'DOKUMEN_VALID');
    setActiveSubTab('BA_PREVIEW');
  };

  const handlePrint = () => {
    if (selectedApp) {
      triggerPdfPrint('printable-ba-area', `BA_Visite_${selectedApp.registerNumber}`);
    } else {
      window.print();
    }
  };

  // Filtered App List for Visite
  const filteredList = applications.filter(app => {
    const isSlf = isSlfApplication(app);
    if (filterStatus === 'NEED_VISITE' && app.baLapangan?.isCompleted) return false;
    if (filterStatus === 'COMPLETED_VISITE' && !app.baLapangan?.isCompleted) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.applicant.name.toLowerCase().includes(q) ||
        app.registerNumber.toLowerCase().includes(q) ||
        app.building.name.toLowerCase().includes(q) ||
        app.building.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Module Header Banner (Geometric Balance) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              <span>MODUL KHUSUS // VISITE LAPANGAN & BA LAPANGAN</span>
            </span>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 border border-indigo-200">
              TAHAP SEBELUM KONSULTASI TEKNIS
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase font-mono">
            Pemeriksaan Lapangan & Berita Acara Kesesuaian Fisik (SLF & PBG)
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl mt-0.5">
            Inspeksi fisik langsung ke lokasi gedung, dokumentasi foto real-time via kamera, verifikasi as-built drawing vs laporan kelaikan, dan penerbitan Berita Acara (BA) Lapangan resmi DPUPR Garut.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 border border-slate-200 dark:border-slate-700 text-center font-mono">
            <span className="text-[9px] text-slate-400 block uppercase">Total Permohonan</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{applications.length}</span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/60 p-2.5 border border-amber-200 dark:border-amber-800 text-center font-mono">
            <span className="text-[9px] text-amber-700 dark:text-amber-400 block uppercase">Butuh Visite</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">
              {applications.filter(a => isSlfApplication(a) && !a.baLapangan?.isCompleted).length}
            </span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-2.5 border border-emerald-200 dark:border-emerald-800 text-center font-mono">
            <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block uppercase">BA Sah</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {applications.filter(a => a.baLapangan?.isCompleted).length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Selector Sidebar + Right Interactive Inspection Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Permohonan Selector (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white uppercase">
              Pilih Permohonan Gedung
            </span>
            <span className="text-[10px] font-mono text-slate-400">{filteredList.length} Berkas</span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari register, nama, gedung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase border ${
                  filterStatus === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterStatus('NEED_VISITE')}
                className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase border ${
                  filterStatus === 'NEED_VISITE'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                Belum Visite
              </button>
              <button
                onClick={() => setFilterStatus('COMPLETED_VISITE')}
                className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase border ${
                  filterStatus === 'COMPLETED_VISITE'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                BA Sah
              </button>
            </div>
          </div>

          {/* List of Applications */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredList.map(app => {
              const isSelected = app.id === selectedAppId;
              const isSlf = isSlfApplication(app);
              const isBaDone = app.baLapangan?.isCompleted;

              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`w-full text-left p-3 border transition font-mono ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{app.registerNumber}</span>
                    {isBaDone ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] px-1.5 py-0.2 border border-emerald-300 font-bold">
                        ✓ BA SAH
                      </span>
                    ) : isSlf ? (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] px-1.5 py-0.2 border border-amber-300 font-bold">
                        VISITE SLF
                      </span>
                    ) : (
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] px-1.5 py-0.2">
                        PBG
                      </span>
                    )}
                  </div>

                  <div className="font-sans font-bold text-xs text-slate-900 dark:text-white line-clamp-1 mb-0.5">
                    {app.building.name}
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Pemohon: {app.applicant.name}</span>
                    <span>{app.building.district}</span>
                  </div>

                  {app.baLapangan?.photos && app.baLapangan.photos.length > 0 && (
                    <div className="mt-1.5 text-[9px] text-slate-400 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-amber-500" />
                      <span>{app.baLapangan.photos.length} Foto Lapangan Terlampir</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visite Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {selectedApp ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              
              {/* Target App Quick Bar */}
              <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-bold">{selectedApp.registerNumber}</span>
                    <span className="bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                      {selectedApp.building.functionType}
                    </span>
                    <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 text-[10px] border border-indigo-800">
                      {selectedApp.building.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG'}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-base text-white">{selectedApp.building.name}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedApp.building.address}, Kec. {selectedApp.building.district}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectApplication(selectedApp)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono uppercase border border-slate-700 transition"
                  >
                    Buka Modal Lengkap
                  </button>
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 text-xs font-mono font-bold uppercase">
                <button
                  onClick={() => setActiveSubTab('FORM')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition ${
                    activeSubTab === 'FORM'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                  <span>1. Laporan Kunjungan & Checklist Kesesuaian</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('CAMERA')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition ${
                    activeSubTab === 'CAMERA'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>2. Kamera & Foto Lapangan ({photos.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('BA_PREVIEW')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition ${
                    activeSubTab === 'BA_PREVIEW'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>3. Cetak Berita Acara (BA) Lapangan</span>
                </button>
              </div>

              {/* Sub-Tab 1: Input Laporan & Checklist */}
              {activeSubTab === 'FORM' && (
                <div className="p-6 space-y-6 font-mono text-xs">
                  
                  {/* Waktu & Tim Pemeriksa */}
                  <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Pelaksanaan Kunjungan Lapangan</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tanggal Visite</label>
                        <input
                          type="date"
                          value={visitDate}
                          onChange={(e) => {
                            setVisitDate(e.target.value);
                            saveCurrentDraft(photos, itemsChecked);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Waktu Kunjungan</label>
                        <input
                          type="text"
                          value={visitTime}
                          onChange={(e) => {
                            setVisitTime(e.target.value);
                            saveCurrentDraft(photos, itemsChecked);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Status Kesesuaian Fisik</label>
                        <select
                          value={conformityStatus}
                          onChange={(e) => {
                            setConformityStatus(e.target.value as any);
                            saveCurrentDraft(photos, itemsChecked);
                          }}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none text-indigo-600"
                        >
                          <option value="SESUAI_DOKUMEN">✓ SESUAI DOKUMEN LAPORAN & LAIK FUNGSI</option>
                          <option value="PERLU_PENYESUAIAN_LAPORAN">⚠ PERLU PENYESUAIAN LAPORAN KELAIKAN</option>
                          <option value="TIDAK_SESUAI">✕ TIDAK SESUAI / BELUM LAIK FUNGSI</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Checklist Pemeriksaan 4 Aspek Teknis */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5 text-xs">
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                        <span>Checklist Verifikasi Kesesuaian Fisik vs As-Built Drawing & Dokumen Laporan</span>
                      </h4>
                      <span className="text-[10px] text-slate-400">4 Aspek Teknis PP 16/2021</span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      {itemsChecked.map((item, idx) => (
                        <div key={item.id} className="p-3.5 space-y-2 bg-white dark:bg-slate-900">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-600 text-xs">{item.id}</span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] px-1.5 py-0.5 font-bold uppercase">
                                {item.category}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white text-xs">{item.aspectChecked}</span>
                            </div>

                            <select
                              value={item.status}
                              onChange={(e) => {
                                const newItems = [...itemsChecked];
                                newItems[idx].status = e.target.value as any;
                                setItemsChecked(newItems);
                                saveCurrentDraft(photos, newItems);
                              }}
                              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                            >
                              <option value="SESUAI">✓ SESUAI FISIK & LAPORAN</option>
                              <option value="CATATAN_KHUSUS">⚠ ADA CATATAN KHUSUS</option>
                              <option value="TIDAK_SESUAI">✕ TIDAK SESUAI / PERBAIKAN</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Catatan visual temuan pengawas lapangan..."
                              value={item.notes || ''}
                              onChange={(e) => {
                                const newItems = [...itemsChecked];
                                newItems[idx].notes = e.target.value;
                                setItemsChecked(newItems);
                                saveCurrentDraft(photos, newItems);
                              }}
                              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Catatan Lokasi & Rekomendasi */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Catatan Pengamatan Lokasi & Lingkungan Sekitar Bangunan
                      </label>
                      <input
                        type="text"
                        value={locationNotes}
                        onChange={(e) => {
                          setLocationNotes(e.target.value);
                          saveCurrentDraft(photos, itemsChecked);
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Rekomendasi Tindak Lanjut Tim Pemeriksa Lapangan
                      </label>
                      <textarea
                        rows={2}
                        value={recommendations}
                        onChange={(e) => {
                          setRecommendations(e.target.value);
                          saveCurrentDraft(photos, itemsChecked);
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setActiveSubTab('CAMERA')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Lanjut ke Kamera & Foto ({photos.length} Foto)</span>
                    </button>

                    <button
                      onClick={handleFinalizeAndProceed}
                      className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase shadow-xs flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Sahkan BA Lapangan & Lanjut ke Konsultasi</span>
                    </button>
                  </div>

                </div>
              )}

              {/* Sub-Tab 2: Camera & Foto Lapangan */}
              {activeSubTab === 'CAMERA' && (
                <div className="p-6 space-y-6 font-mono text-xs">
                  
                  {/* Camera Control Box */}
                  <div className="border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-800/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2 text-xs">
                          <Camera className="w-4 h-4 text-indigo-600" />
                          <span>Dokumentasi Foto Lapangan (Kamera & Berkas)</span>
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Ambil foto langsung menggunakan kamera perangkat atau unggah file foto dari galeri
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCameraActive ? (
                          <button
                            onClick={startCamera}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 shadow-xs"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Buka Kamera</span>
                          </button>
                        ) : (
                          <button
                            onClick={stopCamera}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tutup Kamera</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {cameraError && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    {/* Live Camera Viewfinder */}
                    {isCameraActive && (
                      <div className="space-y-3 bg-black p-3 border border-slate-800 flex flex-col items-center">
                        <div className="relative w-full max-w-xl aspect-video bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-700">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/60 text-emerald-400 px-2 py-0.5 text-[10px] font-mono flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>LIVE PREVIEW // DPUPR GARUT</span>
                          </div>
                        </div>

                        {/* Capture Controls */}
                        <div className="w-full max-w-xl flex flex-col sm:flex-row items-center gap-3">
                          <select
                            value={selectedPhotoTag}
                            onChange={(e) => setSelectedPhotoTag(e.target.value)}
                            className="w-full sm:w-1/3 px-2 py-2 bg-slate-800 text-white border border-slate-700 text-xs font-mono font-bold"
                          >
                            <option value="Tampak Depan / Fasad">Fasad / Tampak Depan</option>
                            <option value="Struktur Kolom & Balok">Struktur Kolom & Balok</option>
                            <option value="Panel Listrik & MEP">Panel Listrik & MEP</option>
                            <option value="APAR & Proteksi Kebakaran">APAR & Damkar</option>
                            <option value="GSB, RTH & Saluran Air">GSB & Saluran Air</option>
                            <option value="Bukaan & Sirkulasi Udara">Bukaan & Ventilasi</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Keterangan foto (opsional)..."
                            value={photoCaption}
                            onChange={(e) => setPhotoCaption(e.target.value)}
                            className="w-full sm:flex-1 px-3 py-2 bg-slate-800 text-white border border-slate-700 text-xs font-mono"
                          />

                          <button
                            onClick={capturePhoto}
                            className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shrink-0 shadow-xs"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Jepret Foto</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fallback File Upload & Tag Select */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tag Kategori Foto</label>
                        <select
                          value={selectedPhotoTag}
                          onChange={(e) => setSelectedPhotoTag(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                        >
                          <option value="Tampak Depan / Fasad">Fasad / Tampak Depan</option>
                          <option value="Struktur Kolom & Balok">Struktur Kolom & Balok</option>
                          <option value="Panel Listrik & MEP">Panel Listrik & MEP</option>
                          <option value="APAR & Proteksi Kebakaran">APAR & Proteksi Damkar</option>
                          <option value="GSB, RTH & Saluran Air">GSB & Saluran Air</option>
                          <option value="Bukaan & Sirkulasi Udara">Bukaan & Ventilasi</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Unggah Berkas Foto dari Perangkat</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className="flex-1 text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-mono file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hidden Canvas for Camera Frame Capture */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Photo Gallery */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase text-xs">
                        Galeri Bukti Foto Lapangan Terlampir ({photos.length})
                      </h4>
                      <span className="text-[10px] text-slate-400">Semua foto akan dilampirkan pada BA Lapangan</span>
                    </div>

                    {photos.length === 0 ? (
                      <div className="border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-2 text-slate-400">
                        <Camera className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs">Belum ada foto lapangan yang diambil atau diunggah.</p>
                        <p className="text-[10px]">Gunakan tombol "Buka Kamera" di atas atau unggah foto dari perangkat.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map(photo => (
                          <div key={photo.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs flex flex-col justify-between">
                            <div className="relative aspect-4/3 bg-slate-950 overflow-hidden">
                              <img 
                                src={photo.dataUrl} 
                                alt={photo.caption} 
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 font-bold">
                                {photo.tag}
                              </span>
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="absolute top-2 right-2 bg-rose-600 text-white p-1 hover:bg-rose-500 transition"
                                title="Hapus Foto"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="p-2.5 space-y-1">
                              <p className="font-sans font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{photo.caption}</p>
                              <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between">
                                <span>{photo.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setActiveSubTab('FORM')}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase"
                    >
                      ← Kembali ke Checklist
                    </button>

                    <button
                      onClick={() => setActiveSubTab('BA_PREVIEW')}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Lihat Format Berita Acara (BA) →</span>
                    </button>
                  </div>

                </div>
              )}

              {/* Sub-Tab 3: Format Cetak Berita Acara (BA) Lapangan */}
              {activeSubTab === 'BA_PREVIEW' && (
                <div className="p-6 space-y-6 font-mono text-xs">
                  
                  {/* Top Print Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white uppercase text-xs flex items-center gap-2">
                        <span>Format Dokumen Berita Acara Pemeriksaan Fisik Bangunan</span>
                        {selectedApp.baLapangan?.isCompleted && (
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 border border-emerald-300 font-bold">
                            ✓ TELAH DISAHKAN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Siap dicetak atau diekspor untuk arsip resmi SIMBG Garut</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs uppercase flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak BA Lapangan</span>
                      </button>

                      {!selectedApp.baLapangan?.isCompleted && (
                        <button
                          onClick={handleFinalizeAndProceed}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Sahkan & Lanjut ke Konsultasi</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Official Letter Paper Representation */}
                  <div id="printable-ba-area" className="bg-white dark:bg-slate-950 p-6 sm:p-8 border border-slate-300 dark:border-slate-700 shadow-lg max-w-3xl mx-auto text-slate-900 dark:text-slate-100 space-y-4 font-mono leading-relaxed">
                    
                    {/* Header Kop Surat DPUPR Garut */}
                    <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-4 space-y-1">
                      <div className="font-bold text-sm tracking-wide">PEMERINTAH KABUPATEN GARUT</div>
                      <div className="font-extrabold text-base tracking-wider">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</div>
                      <div className="text-[10px] text-slate-500">Jl. Raya Samarang No. 115, Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151</div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center pt-2 space-y-0.5">
                      <div className="font-bold text-xs uppercase underline tracking-wider">
                        BERITA ACARA PEMERIKSAAN KELAIKAN FUNGSI LAPANGAN (VISITE SLF/PBG)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        Nomor: {selectedApp.baLapangan?.baLapanganNumber || `BA-VISITE/${selectedApp.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}/DPUPR-GRT/2026`}
                      </div>
                    </div>

                    {/* Narrative */}
                    <p className="text-xs pt-2">
                      Pada hari ini, <strong>{visitDate}</strong> pukul <strong>{visitTime}</strong>, telah dilaksanakan pemeriksaan langsung/visite ke lokasi bangunan gedung dalam rangka permohonan penerbitan <strong>{isSlfApplication(selectedApp) ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)'}</strong>:
                    </p>

                    {/* Building & Applicant Specs */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500">Nama Pemilik/Pemohon</span>
                        <span className="col-span-2 font-bold">: {selectedApp.applicant.name} (NIK: {selectedApp.applicant.nik})</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500">Nama Bangunan Gedung</span>
                        <span className="col-span-2 font-bold">: {selectedApp.building.name}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500">Lokasi / Alamat</span>
                        <span className="col-span-2">: {selectedApp.building.address}, Kec. {selectedApp.building.district}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500">Fungsi / Luas Gedung</span>
                        <span className="col-span-2">: {selectedApp.building.functionType} / {selectedApp.building.buildingArea} m² ({selectedApp.building.floors} Lantai)</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-slate-500">Status IMB Eksisting</span>
                        <span className="col-span-2 font-bold text-indigo-600">: {selectedApp.building.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG'}</span>
                      </div>
                    </div>

                    {/* Checklist Summary */}
                    <div className="space-y-1 pt-1">
                      <div className="font-bold text-[11px] uppercase">A. Hasil Pemeriksaan Fisik Multi-Disiplin:</div>
                      <div className="border border-slate-300 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-800 text-[10px]">
                        {itemsChecked.map((item) => (
                          <div key={item.id} className="p-1.5 flex items-center justify-between">
                            <span className="font-semibold">{item.aspectChecked}</span>
                            <span className="font-bold text-indigo-600">[{item.status}]</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Conclusion & Recommendations */}
                    <div className="space-y-1 pt-1 text-[11px]">
                      <div className="font-bold uppercase">B. Kesimpulan Kesesuaian Laporan Kelaikan:</div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-indigo-700 dark:text-indigo-300">
                        STATUS: {conformityStatus}
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                        Catatan Lokasi: {locationNotes}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">
                        Rekomendasi: {recommendations}
                      </p>
                    </div>

                    {/* Photos Attached Notification */}
                    <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-slate-800">
                      * Terlampir {photos.length} (lembar) dokumentasi visual/foto lapangan terverifikasi.
                    </div>

                    {/* Signatures: Operator SIMBG & Pemohon/Yang Dikuasakan */}
                    <div className="pt-6 grid grid-cols-2 gap-6 text-center text-[10px] border-t border-slate-300 dark:border-slate-700">
                      <div className="space-y-12">
                        <div className="font-bold uppercase text-slate-800 dark:text-slate-200">PEMOHON / YANG DIKUASAKAN</div>
                        <div>
                          <div className="font-bold underline text-slate-900 dark:text-white uppercase">{selectedApp.applicant.name}</div>
                          <div className="text-[9px] text-slate-500 font-mono">NIK: {selectedApp.applicant.nik}</div>
                        </div>
                      </div>
                      <div className="space-y-12">
                        <div className="font-bold uppercase text-slate-800 dark:text-slate-200">PETUGAS / OPERATOR SIMBG DPUPR GARUT</div>
                        <div>
                          <div className="font-bold underline text-slate-900 dark:text-white uppercase">OPERATOR TEKNIS SIMBG</div>
                          <div className="text-[9px] text-slate-500 font-mono">Dinas PUPR Kabupaten Garut</div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              Pilih salah satu permohonan dari daftar di sebelah kiri untuk membuka modul pemeriksaan lapangan.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
