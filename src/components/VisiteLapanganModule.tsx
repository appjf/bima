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
  Check,
  Mail
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
import { SuratUndanganVisiteDocument } from './SuratUndanganVisiteDocument';

interface VisiteLapanganModuleProps {
  applications: Application[];
  onUpdateApplication: (updated: Application) => void;
  onSelectApplication: (app: Application) => void;
  onSendWhatsApp: (phone: string, message: string, templateType: any) => void;
  currentRole: UserRole;
  singleApplication?: boolean;
}

export const VisiteLapanganModule: React.FC<VisiteLapanganModuleProps> = ({
  applications,
  onUpdateApplication,
  onSelectApplication,
  onSendWhatsApp,
  currentRole,
  singleApplication = false
}) => {
  // Filter for applications relevant to Visite Lapangan (Prioritizing SLF, but accessible to any PBG needing site inspection)
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    const slfApp = applications.find(a => isSlfApplication(a) || a.currentStage === 'STAGE_VISITE_LAPANGAN_SLF');
    return slfApp ? slfApp.id : (applications[0]?.id || '');
  });

  const [activeSubTab, setActiveSubTab] = useState<'UNDANGAN_VISITE' | 'FORM' | 'CAMERA' | 'BA_PREVIEW'>('UNDANGAN_VISITE');
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

  // Print & TTE Preview States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTteModalOpen, setIsTteModalOpen] = useState(false);
  const [ttePassphrase, setTtePassphrase] = useState('');
  const [tteSigner, setTteSigner] = useState('Ir. H. Agus Ismail, S.T., M.T.');
  const [tteSignerRole, setTteSignerRole] = useState('Kepala Dinas Pekerjaan Umum dan Penataan Ruang');
  const [tteSignerNip, setTteSignerNip] = useState('197208151998031004');
  const [tteError, setTteError] = useState<string | null>(null);
  const [isTteSigningProgress, setIsTteSigningProgress] = useState(false);
  const [tteSigningStep, setTteSigningStep] = useState('');

  // Print Configuration Options (Real-time Preview Toggles)
  const [printConfigKop, setPrintConfigKop] = useState(true);
  const [printConfigPhotos, setPrintConfigPhotos] = useState(true);
  const [printConfigSignatures, setPrintConfigSignatures] = useState(true);

  // Escape key handler to close the local print or TTE modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPrintModalOpen || isTteModalOpen) {
          e.stopPropagation();
          setIsPrintModalOpen(false);
          setIsTteModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => {
      window.removeEventListener('keydown', handleEscape, true);
    };
  }, [isPrintModalOpen, isTteModalOpen]);

  const handleApplyTte = () => {
    if (!selectedApp) return;
    if (!ttePassphrase) {
      setTteError('Passphrase TTE wajib diisi!');
      return;
    }
    
    setIsTteSigningProgress(true);
    setTteError(null);
    
    const steps = [
      'Menghubungi server Balai Sertifikasi Elektronik (BSrE) BSSN...',
      'Melakukan validasi sertifikat aktif pejabat penilai...',
      'Membentuk hash kriptografis SHA-256 dari dokumen Berita Acara...',
      'Menyandikan hash menggunakan kunci privat (RSA-2048)...',
      'Membubuhi penanda timestamp terpercaya (trusted RFC-3161 timestamps)...',
      'Selesai! Menandatangani dokumen secara elektronik (TTE).'
    ];

    let currentStep = 0;
    setTteSigningStep(steps[0]);

    const interval = setInterval(() => {
      currentStep += 1;
      if (currentStep < steps.length) {
        setTteSigningStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        
        // Finalize signature
        const randomHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase();
        const tteTokenVal = `JWS.eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYmI2NCJdfQ.${randomHex()}.${randomHex()}.${randomHex()}`;
        const serialNum = `BSrE-DPUPR-GRT-2026/${randomHex()}/${randomHex()}`;
        
        const currentBa = selectedApp.baLapangan || generateBeritaAcaraLapanganDraft(selectedApp);
        const updatedBa: BeritaAcaraLapangan = {
          ...currentBa,
          isTteSigned: true,
          tteSignedAt: new Date().toISOString(),
          tteToken: tteTokenVal,
          tteSignerName: tteSigner,
          tteSignerNip: tteSignerNip,
          tteCertificateSerial: serialNum
        };

        const updatedApp: Application = {
          ...selectedApp,
          baLapangan: updatedBa,
          lastUpdated: new Date().toISOString()
        };

        onUpdateApplication(updatedApp);
        setIsTteSigningProgress(false);
        setIsTteModalOpen(false);
        setTtePassphrase('');
        setTteError(null);
      }
    }, 400);
  };

  // Interactive Signature Pad State & Handlers
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e3a8a'; // Royal blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateBaField('perwakilanTtdUrl', '');
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    updateBaField('perwakilanTtdUrl', dataUrl);
  };

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
          videoRef.current.play().catch(e => {
            console.warn('Video play warning:', e);
          });
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Kamera tidak didukung di browser ini. Silakan gunakan tombol upload file foto.');
      }
    } catch (err: any) {
      console.warn('Camera access was not granted or not available:', err?.message || err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setCameraError(
        isDenied
          ? 'Izin akses kamera belum diaktifkan pada browser. Silakan unggah foto dokumentasi langsung dari perangkat/galeri.'
          : 'Kamera tidak dapat diakses atau sedang digunakan oleh aplikasi lain.'
      );
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
      ...selectedApp.baLapangan,
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

  const updateBaField = (field: string, value: any) => {
    if (!selectedApp) return;
    const currentBa = selectedApp.baLapangan || generateBeritaAcaraLapanganDraft(selectedApp);
    
    let updatedBa = { ...currentBa };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const parentObj = (updatedBa as any)[parent] || {};
      (updatedBa as any)[parent] = {
        ...parentObj,
        [child]: value
      };
    } else {
      (updatedBa as any)[field] = value;
    }

    const updatedApp: Application = {
      ...selectedApp,
      baLapangan: updatedBa,
      lastUpdated: new Date().toISOString()
    };
    onUpdateApplication(updatedApp);
  };

  // Finalize BA Lapangan & Advance to Consultation Stage
  const handleFinalizeAndProceed = () => {
    if (!selectedApp) return;
    const regClean = selectedApp.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const finalizedBa: BeritaAcaraLapangan = {
      ...selectedApp.baLapangan,
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
      setIsPrintModalOpen(true);
    } else {
      window.print();
    }
  };

  const executePhysicalPrint = () => {
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
      
      {/* Module Header Banner (Geometric Balance) - Only when not singleApplication */}
      {!singleApplication && (
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
              Pemeriksaan Lapangan & Berita Acara Kesesuaian Fisik {singleApplication && isSlfApplication(selectedApp || ({} as any)) ? '(SLF)' : '(PBG & SLF)'}
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
      )}

      {/* Main Grid: Left Selector Sidebar + Right Interactive Inspection Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Permohonan Selector (4 cols) - Only when not singleApplication */}
        {!singleApplication && (
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
        )}

        {/* Right Column: Visite Workspace (8 cols normally, 12 cols if singleApplication) */}
        <div className={singleApplication ? 'lg:col-span-12 space-y-4' : 'lg:col-span-8 space-y-4'}>
          
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
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 text-xs font-mono font-bold uppercase overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveSubTab('UNDANGAN_VISITE')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                    activeSubTab === 'UNDANGAN_VISITE'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Mail className="w-4 h-4 text-amber-600" />
                  <span>1. Surat Undangan Visite (Siap Publish)</span>
                  {selectedApp.undanganVisite?.isSigned && (
                    <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] font-bold">TTE SIAP</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveSubTab('FORM')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                    activeSubTab === 'FORM'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                  <span>2. Checklist Kesesuaian Fisik</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('CAMERA')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                    activeSubTab === 'CAMERA'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>3. Kamera & Foto ({photos.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('BA_PREVIEW')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                    activeSubTab === 'BA_PREVIEW'
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>4. Cetak BA Lapangan & TTE</span>
                </button>
              </div>

              {/* Sub-Tab 1: Surat Undangan Visite (Siap Publish) */}
              {activeSubTab === 'UNDANGAN_VISITE' && (
                <div className="p-4 sm:p-6">
                  <SuratUndanganVisiteDocument
                    application={selectedApp}
                    onUpdateApplication={onUpdateApplication}
                    onSendWhatsApp={onSendWhatsApp}
                    currentRole={currentRole}
                  />
                </div>
              )}

              {/* Sub-Tab 2: Input Laporan & Checklist */}
              {activeSubTab === 'FORM' && (() => {
                const ba = selectedApp?.baLapangan || ({} as any);
                return (
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

                  {/* BAGIAN I: DATA FISIK LAPANGAN RESMI (BERDASARKAN LAMPIRAN PDF) */}
                  <div className="border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-5 bg-slate-50/30 dark:bg-slate-800/10">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5 text-xs">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>Formulir Berita Acara Pemeriksaan Fisik Resmi</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">Berdasarkan Dokumen BA Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* A. Kondisi Lapangan */}
                      <div className="border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 space-y-2">
                        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block border-b pb-1">A. Kondisi Lapangan</span>
                        <div className="space-y-1.5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!ba.kondisiLapangan?.tanahKosong} 
                              onChange={(e) => updateBaField('kondisiLapangan.tanahKosong', e.target.checked)} 
                              className="rounded-none border-slate-300 dark:border-slate-700 focus:ring-0 text-indigo-600"
                            />
                            <span>1. Tanah kosong</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!ba.kondisiLapangan?.adaBangunanLama} 
                              onChange={(e) => updateBaField('kondisiLapangan.adaBangunanLama', e.target.checked)} 
                              className="rounded-none border-slate-300 dark:border-slate-700 focus:ring-0 text-indigo-600"
                            />
                            <span>2. Ada bangunan lama</span>
                          </label>
                          {ba.kondisiLapangan?.adaBangunanLama && (
                            <div className="pl-6 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 py-1">
                              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-500">
                                <input 
                                  type="checkbox" 
                                  checked={!!ba.kondisiLapangan?.bongkarKeseluruhan} 
                                  onChange={(e) => updateBaField('kondisiLapangan.bongkarKeseluruhan', e.target.checked)} 
                                  className="rounded-none border-slate-300 dark:border-slate-700 text-indigo-600"
                                />
                                <span>- Bangunan lama akan dibongkar keseluruhan</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-500">
                                <input 
                                  type="checkbox" 
                                  checked={!!ba.kondisiLapangan?.bongkarSebagian} 
                                  onChange={(e) => updateBaField('kondisiLapangan.bongkarSebagian', e.target.checked)} 
                                  className="rounded-none border-slate-300 dark:border-slate-700 text-indigo-600"
                                />
                                <span>- Bangunan lama akan dibongkar sebagian</span>
                              </label>
                            </div>
                          )}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!ba.kondisiLapangan?.bangunanSudahJadi} 
                              onChange={(e) => updateBaField('kondisiLapangan.bangunanSudahJadi', e.target.checked)} 
                              className="rounded-none border-slate-300 dark:border-slate-700 focus:ring-0 text-indigo-600"
                            />
                            <span>3. Bangunan sudah jadi</span>
                          </label>
                        </div>
                      </div>

                      {/* B. Kondisi Kegiatan */}
                      <div className="border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 space-y-2">
                        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block border-b pb-1">B. Kondisi Kegiatan</span>
                        <div className="space-y-1.5 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!ba.kondisiKegiatan?.belumAdaKegiatan} 
                              onChange={(e) => updateBaField('kondisiKegiatan.belumAdaKegiatan', e.target.checked)} 
                              className="rounded-none border-slate-300 dark:border-slate-700 focus:ring-0 text-indigo-600"
                            />
                            <span>1. Belum ada kegiatan pembangunan</span>
                          </label>
                          <div className="space-y-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={!!ba.kondisiKegiatan?.sedangAdaKegiatan} 
                                onChange={(e) => updateBaField('kondisiKegiatan.sedangAdaKegiatan', e.target.checked)} 
                                className="rounded-none border-slate-300 dark:border-slate-700 focus:ring-0 text-indigo-600"
                              />
                              <span>2. Sedang ada kegiatan pembangunan</span>
                            </label>
                            {ba.kondisiKegiatan?.sedangAdaKegiatan && (
                              <div className="pl-6 flex items-center gap-1.5 py-0.5">
                                <span className="text-[10.5px] text-slate-400">Perkiraan progress:</span>
                                <input 
                                  type="text" 
                                  value={ba.kondisiKegiatan?.sedangAdaKegiatanPersen || ''} 
                                  onChange={(e) => updateBaField('kondisiKegiatan.sedangAdaKegiatanPersen', e.target.value)} 
                                  className="w-16 px-1.5 py-0.5 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-transparent text-center font-bold text-[10.5px] focus:outline-none focus:border-indigo-600"
                                  placeholder="e.g. 65"
                                />
                                <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200">%</span>
                              </div>
                            )}
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!!ba.kondisiKegiatan?.selesaiDikerjakan} 
                              onChange={(e) => updateBaField('kondisiKegiatan.selesaiDikerjakan', e.target.checked)} 
                              className="rounded-none border-slate-300 dark:border-slate-700 focus:ring-0 text-indigo-600"
                            />
                            <span>3. Bangunan sudah selesai dikerjakan</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* C. Fungsi Bangunan */}
                      <div className="border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 space-y-2">
                        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block border-b pb-1">C. Fungsi Bangunan</span>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {(['HUNIAN', 'KEAGAMAAN', 'USAHA', 'SOSIAL_BUDAYA', 'KHUSUS', 'CAMPURAN'] as const).map((func) => (
                            <label key={func} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                              <input 
                                type="radio" 
                                name="fungsiBangunanTerpilih"
                                checked={ba.fungsiBangunanTerpilih === func} 
                                onChange={() => updateBaField('fungsiBangunanTerpilih', func)} 
                                className="border-slate-300 dark:border-slate-700 text-indigo-600"
                              />
                              <span className="capitalize">{func.replace('_', ' ').toLowerCase()}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* D. Keterangan Lain */}
                      <div className="border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 space-y-1.5">
                        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block border-b pb-1">D. Keterangan Lain</span>
                        <textarea
                          rows={3}
                          value={ba.keteranganLain || ''}
                          onChange={(e) => updateBaField('keteranganLain', e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 font-mono text-[11px] focus:outline-none focus:border-indigo-600 text-slate-700 dark:text-slate-200"
                          placeholder="Tulis keterangan lainnya atau temuan khusus disini..."
                        />
                      </div>
                    </div>

                    {/* TABLE PARAMETERS FORM (PAGE 2 & 3 OF PDF) */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider block font-mono border-b pb-1">
                        E. Matriks Parameter Kesesuaian Aturan Tata Ruang & Fisik Bangunan
                      </span>

                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-[11px] font-mono border-collapse">
                          <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-bold text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">No</th>
                              <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Uraian Parameter</th>
                              <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Informasi Kondisi Lapangan</th>
                              <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Aturan Rencana (KRK)</th>
                              <th className="px-3 py-2">Keterangan Verifikasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            
                            {/* A. Sertifikat */}
                            <tr className="bg-slate-50/50 dark:bg-slate-950/20 font-bold">
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800">A</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800" colSpan={4}>Sertifikat Tanah</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Luas Tanah (m²)</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramSertifikatLuas || ''} 
                                  onChange={(e) => updateBaField('paramSertifikatLuas', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none text-slate-900 dark:text-white"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={2}>Sesuai dokumen kepemilikan tanah</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Nomor Sertifikat</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramSertifikatNomor || ''} 
                                  onChange={(e) => updateBaField('paramSertifikatNomor', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none text-slate-900 dark:text-white"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={2}>Terverifikasi valid oleh BPN Garut</td>
                            </tr>

                            {/* B. KRK */}
                            <tr className="bg-slate-50/50 dark:bg-slate-950/20 font-bold">
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800">B</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800" colSpan={4}>Keterangan Rencana Kabupaten (KRK) / Tata Ruang</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Jenis Bangunan</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramKrkJenisBangunan || ''} 
                                  onChange={(e) => updateBaField('paramKrkJenisBangunan', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none text-slate-900 dark:text-white"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={2}>Disetujui untuk peruntukan ruang</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Jumlah Lantai</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramKrkJumlahLantai || ''} 
                                  onChange={(e) => updateBaField('paramKrkJumlahLantai', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none text-slate-900 dark:text-white"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Rencana Tata Bangunan</td>
                              <td className="px-3 py-2">
                                <select 
                                  value={ba.paramKrkJumlahLantaiKet || 'OK'} 
                                  onChange={(e) => updateBaField('paramKrkJumlahLantaiKet', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
                                >
                                  <option value="OK">OK</option>
                                  <option value="LEBIH">LEBIH</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">KDB (%)</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramKrkKdb || ''} 
                                  onChange={(e) => updateBaField('paramKrkKdb', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Maksimal Koefisien Dasar</td>
                              <td className="px-3 py-2">
                                <select 
                                  value={ba.paramKrkKdbKet || 'OK'} 
                                  onChange={(e) => updateBaField('paramKrkKdbKet', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
                                >
                                  <option value="OK">OK</option>
                                  <option value="LEBIH">LEBIH</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">KLB</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramKrkKlb || ''} 
                                  onChange={(e) => updateBaField('paramKrkKlb', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Maksimal Koefisien Lantai</td>
                              <td className="px-3 py-2">
                                <select 
                                  value={ba.paramKrkKlbKet || 'OK'} 
                                  onChange={(e) => updateBaField('paramKrkKlbKet', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
                                >
                                  <option value="OK">OK</option>
                                  <option value="LEBIH">LEBIH</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">KDH (%)</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramKrkKdh || ''} 
                                  onChange={(e) => updateBaField('paramKrkKdh', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Minimal Koefisien Hijau</td>
                              <td className="px-3 py-2">
                                <select 
                                  value={ba.paramKrkKdhKet || 'OK'} 
                                  onChange={(e) => updateBaField('paramKrkKdhKet', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-[10px] font-bold"
                                >
                                  <option value="OK">OK</option>
                                  <option value="KURANG">KURANG</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">GSJ (Garis Sempadan Jalan)</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                                <input 
                                  type="text" 
                                  value={ba.paramKrkGsj || ''} 
                                  onChange={(e) => updateBaField('paramKrkGsj', e.target.value)} 
                                  className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 py-0.5 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={2}>Batas bahu jalan terluar</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">GSB (Garis Sempadan Bangunan)</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={3}>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                                  <div className="flex items-center gap-1">
                                    <span>Depan:</span>
                                    <input type="text" value={ba.paramKrkGsbDepan || ''} onChange={(e) => updateBaField('paramKrkGsbDepan', e.target.value)} className="w-10 bg-transparent border-b focus:outline-none text-center" />
                                    <span>m</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>Belakang:</span>
                                    <input type="text" value={ba.paramKrkGsbBelakang || ''} onChange={(e) => updateBaField('paramKrkGsbBelakang', e.target.value)} className="w-10 bg-transparent border-b focus:outline-none text-center" />
                                    <span>m</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>Kanan:</span>
                                    <input type="text" value={ba.paramKrkGsbKanan || ''} onChange={(e) => updateBaField('paramKrkGsbKanan', e.target.value)} className="w-10 bg-transparent border-b focus:outline-none text-center" />
                                    <span>m</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>Kiri:</span>
                                    <input type="text" value={ba.paramKrkGsbKiri || ''} onChange={(e) => updateBaField('paramKrkGsbKiri', e.target.value)} className="w-10 bg-transparent border-b focus:outline-none text-center" />
                                    <span>m</span>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* C. KLASIFIKASI */}
                            <tr className="bg-slate-50/50 dark:bg-slate-950/20 font-bold">
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800">C</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 dark:border-slate-800" colSpan={4}>Klasifikasi & Karakteristik Bangunan Gedung</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Kompleksitas Bangunan</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={3}>
                                <select 
                                  value={ba.paramKlasifikasiKompleksitas || 'SEDERHANA'} 
                                  onChange={(e) => updateBaField('paramKlasifikasiKompleksitas', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                                >
                                  <option value="SEDERHANA">Sederhana</option>
                                  <option value="TIDAK_SEDERHANA">Tidak Sederhana</option>
                                  <option value="KHUSUS">Khusus</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Permanensi Bangunan</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={3}>
                                <select 
                                  value={ba.paramKlasifikasiPermanensi || 'DIATAS_5_TAHUN'} 
                                  onChange={(e) => updateBaField('paramKlasifikasiPermanensi', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                                >
                                  <option value="DIATAS_5_TAHUN">Permanen (Diatas 5 tahun)</option>
                                  <option value="DIBAWAH_5_TAHUN">Semi Permanen / Sementara (Dibawah 5 tahun)</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Tingkat Kepadatan Lokasi</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={3}>
                                <select 
                                  value={ba.paramKlasifikasiKepadatan || 'SEDANG'} 
                                  onChange={(e) => updateBaField('paramKlasifikasiKepadatan', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                                >
                                  <option value="TINGGI">Tinggi</option>
                                  <option value="SEDANG">Sedang</option>
                                  <option value="RENDAH">Rendah</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Ketinggian Bangunan</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={3}>
                                <select 
                                  value={ba.paramKlasifikasiKetinggian || 'RENDAH_1_4_LT'} 
                                  onChange={(e) => updateBaField('paramKlasifikasiKetinggian', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                                >
                                  <option value="RENDAH_1_4_LT">Rendah (1-4 lantai)</option>
                                  <option value="SEDANG_5_8_LT">Sedang (5-8 lantai)</option>
                                  <option value="TINGGI_GT_8_LT">Tinggi (&gt; 8 lantai)</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Kepemilikan Bangunan</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={3}>
                                <select 
                                  value={ba.paramKlasifikasiKepemilikan || 'PERORANGAN'} 
                                  onChange={(e) => updateBaField('paramKlasifikasiKepemilikan', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                                >
                                  <option value="PERORANGAN">Perorangan</option>
                                  <option value="BADAN">Badan Usaha / Korporasi</option>
                                  <option value="PEMERINTAH">Pemerintah Daerah / Negara</option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800"></td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">Fungsi Kelas Jalan Utama</td>
                              <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800" colSpan={3}>
                                <select 
                                  value={ba.paramKlasifikasiFungsiJalan || 'LOKAL'} 
                                  onChange={(e) => updateBaField('paramKlasifikasiFungsiJalan', e.target.value)}
                                  className="bg-transparent border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                                >
                                  <option value="JALAN_KOLEKTOR">Jalan Kolektor</option>
                                  <option value="LOKAL">Jalan Lokal</option>
                                  <option value="ARTERI">Jalan Arteri</option>
                                  <option value="LINGKUNGAN">Jalan Lingkungan</option>
                                  <option value="PERUMAHAN">Jalan Kompleks Perumahan</option>
                                </select>
                              </td>
                            </tr>

                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                  {/* END OF BAGIAN I */}

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

                  {/* F. Tanda Tangan Pemohon / Perwakilan Resmi */}
                  <div className="border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/10 space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider block font-mono border-b pb-1">
                        F. Verifikasi Kehadiran & Tanda Tangan Pemohon / Perwakilan Resmi
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Penandatanganan berita acara pemeriksaan oleh pemohon atau pihak yang diberikan kuasa resmi di lapangan</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Nama Pemohon/Perwakilan</label>
                        <input
                          type="text"
                          value={ba.attendeesOwner?.name || ''}
                          onChange={(e) => updateBaField('attendeesOwner.name', e.target.value)}
                          placeholder="Nama lengkap..."
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">NIK Perwakilan</label>
                        <input
                          type="text"
                          value={ba.attendeesOwner?.nik || ''}
                          onChange={(e) => updateBaField('attendeesOwner.nik', e.target.value)}
                          placeholder="No NIK KTP..."
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Kapasitas / Hubungan</label>
                        <select
                          value={ba.attendeesOwner?.role || 'Pemilik / Kuasa Bangunan Gedung'}
                          onChange={(e) => updateBaField('attendeesOwner.role', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none text-slate-800 dark:text-slate-200"
                        >
                          <option value="Pemilik / Kuasa Bangunan Gedung">Pemilik Langsung</option>
                          <option value="Kuasa / Ahli Waris">Kuasa / Ahli Waris Resmi</option>
                          <option value="Penanggung Jawab Teknis">Konsultan / Pengkaji Teknis</option>
                          <option value="Perwakilan / Kontraktor">Perwakilan Kontraktor / Dev</option>
                        </select>
                      </div>
                    </div>

                    {/* Signature Canvas Drawing Area */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase font-bold block">Goreskan Tanda Tangan Digital Pemohon / Perwakilan:</label>
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative border border-slate-300 dark:border-slate-700 bg-white rounded-xs overflow-hidden w-full max-w-[340px] h-[130px] shadow-inner">
                          {ba.perwakilanTtdUrl ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                              <img 
                                src={ba.perwakilanTtdUrl} 
                                alt="Signature" 
                                className="h-28 object-contain mix-blend-multiply" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <canvas
                              ref={sigCanvasRef}
                              width={340}
                              height={130}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="w-full h-full cursor-crosshair touch-none bg-white"
                            />
                          )}
                          <div className="absolute bottom-1 right-2 text-[9px] font-sans font-semibold text-slate-400 pointer-events-none select-none uppercase">
                            {ba.perwakilanTtdUrl ? '✓ TANDA TANGAN DISIMPAN' : 'Area Tanda Tangan (Touch/Mouse)'}
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                          {ba.perwakilanTtdUrl ? (
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase transition cursor-pointer"
                            >
                              Tanda Tangan Ulang
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={clearSignature}
                                className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase transition cursor-pointer"
                              >
                                Bersihkan Coretan
                              </button>
                              <div className="text-[10px] text-slate-400 font-mono hidden sm:block max-w-[160px] leading-snug">
                                *Tanda tangan otomatis disimpan setelah Anda selesai menggoreskan pena.
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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
                );
              })()}

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

                  {/* TTE Certificate Status & Validation Panel */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-indigo-50 dark:bg-slate-800 text-indigo-600">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                            Validasi Sertifikat & Otorisasi TTE BSrE
                          </h4>
                          <span className="text-[10px] text-slate-400">Verifikasi tanda tangan elektronik pejabat teknis DPUPR Garut</span>
                        </div>
                      </div>

                      {/* OCSP / LTV Status Badge */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-700 dark:text-emerald-400">OCSP & LTV STATUS: ACTIVE (BSrE CA)</span>
                      </div>
                    </div>

                    {selectedApp.baLapangan?.isTteSigned ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 p-3">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>✓ DOKUMEN TTE TERVERIFIKASI SAH</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] text-slate-600 dark:text-slate-400">
                            <div>
                              <span className="text-slate-400 block text-[9.5px] uppercase">Penandatangan:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{selectedApp.baLapangan.tteSignerName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px] uppercase">NIP Pejabat:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{selectedApp.baLapangan.tteSignerNip || '197208151998031004'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px] uppercase">Tanggal TTE:</span>
                              <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedApp.baLapangan.tteSignedAt || '').toLocaleString('id-ID')} WIB</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9.5px] uppercase">Serial BSrE:</span>
                              <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-[9px]">{selectedApp.baLapangan.tteCertificateSerial}</strong>
                            </div>
                          </div>
                          <div className="border-t border-emerald-100 dark:border-emerald-900/40 pt-1.5 mt-1.5 flex items-center justify-between text-[9px] text-slate-500">
                            <span>Hash SHA-256 Valid & Utuh (Integritas Terjaga)</span>
                            <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[8px] font-mono select-all">{selectedApp.baLapangan.tteToken?.slice(0, 32)}...</span>
                          </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/60 flex flex-col justify-between space-y-2">
                          <div className="text-[10px] space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase">Log Audit Validasi TTE</span>
                            <div className="text-[9.5px] font-mono text-slate-500 space-y-0.5">
                              <div>- RSA-2048 Bit Key Verified</div>
                              <div>- Timestamp RFC 3161 Certified</div>
                              <div>- OCSP Status Revocation: GOOD</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              alert(`Audit Validasi Kriptografi:\n-----------------------------------\nSertifikat Penandatangan: ${selectedApp.baLapangan?.tteSignerName}\nSerial: ${selectedApp.baLapangan?.tteCertificateSerial}\nRoot CA: Balai Sertifikasi Elektronik - BSSN RI\nIntegritas File: SANGAT BAIK (TIDAK ADA MODIFIKASI)\nStatus OCSP: VALID & AKTIF`);
                            }}
                            className="w-full py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase transition"
                          >
                            Uji Log Integritas TTE
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px] uppercase">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Peringatan TTE: Dokumen Belum Ditandatangani</span>
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                            Dokumen Berita Acara Lapangan ini belum ditandatangani secara elektronik (TTE) menggunakan sertifikat BSrE resmi Dinas PUPR Garut. Pencetakan resmi tanpa TTE akan ditandai tanda air (watermark) draft tidak sah.
                          </p>
                        </div>

                        <button
                          onClick={() => setIsTteModalOpen(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Bubuhkan TTE Pejabat Sekarang</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Official Letter Paper Representation */}
                  <div id="printable-ba-area" className="bg-white dark:bg-slate-950 p-6 sm:p-8 border border-slate-300 dark:border-slate-700 shadow-lg max-w-3xl mx-auto text-slate-900 dark:text-slate-100 space-y-4 font-mono leading-relaxed">
                    
                    {/* Header Kop Surat DPUPR Garut */}
                    <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-4 space-y-1">
                      <div className="font-bold text-sm tracking-wide">PEMERINTAH KABUPATEN GARUT</div>
                      <div className="font-extrabold text-base tracking-wider">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</div>
                      <div className="text-[10px] text-slate-500">Jalan Prof. KH. Cecep Syarifuddin No. 117 Telp. (0262) 233730 Fax (0262) 544184 Garut 44151</div>
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
                     <div className="space-y-3 pt-1">
                       <div className="font-bold text-[11px] uppercase">A. Pemeriksaan Kondisi Fisik Lapangan & Kesesuaian Laporan:</div>
                       
                       {/* Official Physical Conditions */}
                       <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                         <div className="border border-slate-300 dark:border-slate-700 p-2.5 space-y-1 bg-slate-50/50">
                           <div className="font-bold border-b pb-0.5 mb-1 text-[10.5px] uppercase">Kondisi Lapangan</div>
                           <div>
                             {selectedApp.baLapangan?.kondisiLapangan?.tanahKosong ? '☑' : '☐'} 1. Tanah kosong
                           </div>
                           <div>
                             {selectedApp.baLapangan?.kondisiLapangan?.adaBangunanLama ? '☑' : '☐'} 2. Ada bangunan lama
                             {selectedApp.baLapangan?.kondisiLapangan?.adaBangunanLama && (
                               <div className="pl-4 text-[9.5px] text-slate-500">
                                 {selectedApp.baLapangan?.kondisiLapangan?.bongkarKeseluruhan ? '• Dibongkar keseluruhan' : ''}
                                 {selectedApp.baLapangan?.kondisiLapangan?.bongkarSebagian ? '• Dibongkar sebagian' : ''}
                               </div>
                             )}
                           </div>
                           <div>
                             {selectedApp.baLapangan?.kondisiLapangan?.bangunanSudahJadi ? '☑' : '☐'} 3. Bangunan sudah jadi
                           </div>
                         </div>

                         <div className="border border-slate-300 dark:border-slate-700 p-2.5 space-y-1 bg-slate-50/50">
                           <div className="font-bold border-b pb-0.5 mb-1 text-[10.5px] uppercase">Kondisi Kegiatan</div>
                           <div>
                             {selectedApp.baLapangan?.kondisiKegiatan?.belumAdaKegiatan ? '☑' : '☐'} 1. Belum ada kegiatan
                           </div>
                           <div>
                             {selectedApp.baLapangan?.kondisiKegiatan?.sedangAdaKegiatan ? '☑' : '☐'} 2. Sedang ada kegiatan {selectedApp.baLapangan?.kondisiKegiatan?.sedangAdaKegiatanPersen ? `(${selectedApp.baLapangan.kondisiKegiatan.sedangAdaKegiatanPersen}%)` : ''}
                           </div>
                           <div>
                             {selectedApp.baLapangan?.kondisiKegiatan?.selesaiDikerjakan ? '☑' : '☐'} 3. Bangunan sudah selesai
                           </div>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                         <div className="border border-slate-300 dark:border-slate-700 p-2">
                           <span className="font-bold">Fungsi Terpilih: </span>
                           <span className="capitalize">{selectedApp.baLapangan?.fungsiBangunanTerpilih?.replace('_', ' ').toLowerCase() || '-'}</span>
                         </div>
                         <div className="border border-slate-300 dark:border-slate-700 p-2">
                           <span className="font-bold">Keterangan Lain: </span>
                           <span>{selectedApp.baLapangan?.keteranganLain || '-'}</span>
                         </div>
                       </div>

                       {/* Checklist details */}
                       <div className="space-y-1">
                         <div className="font-bold text-[10.5px] uppercase">B. Verifikasi 4 Aspek Teknis (PP 16/2021):</div>
                         <div className="border border-slate-300 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-800 text-[10px]">
                           {itemsChecked.map((item) => (
                             <div key={item.id} className="p-1.5 flex items-center justify-between">
                               <span className="font-semibold">{item.aspectChecked} ({item.category})</span>
                               <span className="font-bold text-indigo-600">[{item.status}]</span>
                             </div>
                           ))}
                         </div>
                       </div>

                       {/* Matrix Parameters */}
                       <div className="space-y-1">
                         <div className="font-bold text-[10.5px] uppercase">C. Matriks Parameter Kesesuaian Tata Ruang & Fisik:</div>
                         <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
                           <thead>
                             <tr className="bg-slate-100 font-bold">
                               <th className="border border-slate-300 p-1 w-8 text-center">No</th>
                               <th className="border border-slate-300 p-1">Uraian Parameter</th>
                               <th className="border border-slate-300 p-1">Informasi Lapangan</th>
                               <th className="border border-slate-300 p-1">Rencana (KRK) / Aturan</th>
                             </tr>
                           </thead>
                           <tbody>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center font-bold" colSpan={4}>Sertifikat Tanah</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">1</td>
                               <td className="border border-slate-300 p-1">Luas Tanah</td>
                               <td className="border border-slate-300 p-1 font-bold">{selectedApp.baLapangan?.paramSertifikatLuas || '-'} m²</td>
                               <td className="border border-slate-300 p-1">Sesuai kepemilikan</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">2</td>
                               <td className="border border-slate-300 p-1">No Sertifikat</td>
                               <td className="border border-slate-300 p-1 font-bold">{selectedApp.baLapangan?.paramSertifikatNomor || '-'}</td>
                               <td className="border border-slate-300 p-1">Sesuai kepemilikan</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center font-bold" colSpan={4}>Keterangan Rencana Kabupaten (KRK)</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">3</td>
                               <td className="border border-slate-300 p-1">Jenis Bangunan</td>
                               <td className="border border-slate-300 p-1 font-bold">{selectedApp.baLapangan?.paramKrkJenisBangunan || '-'}</td>
                               <td className="border border-slate-300 p-1">Rencana Peruntukan</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">4</td>
                               <td className="border border-slate-300 p-1">Jumlah Lantai</td>
                               <td className="border border-slate-300 p-1 font-bold">{selectedApp.baLapangan?.paramKrkJumlahLantai || '-'} ({selectedApp.baLapangan?.paramKrkJumlahLantaiKet || 'OK'})</td>
                               <td className="border border-slate-300 p-1">Sesuai RTB</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">5</td>
                               <td className="border border-slate-300 p-1">KDB (%)</td>
                               <td className="border border-slate-300 p-1 font-bold">{selectedApp.baLapangan?.paramKrkKdb || '-'}% ({selectedApp.baLapangan?.paramKrkKdbKet || 'OK'})</td>
                               <td className="border border-slate-300 p-1">Maksimal KDB</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">6</td>
                               <td className="border border-slate-300 p-1">KLB</td>
                               <td className="border border-slate-300 p-1 font-bold">{selectedApp.baLapangan?.paramKrkKlb || '-'} ({selectedApp.baLapangan?.paramKrkKlbKet || 'OK'})</td>
                               <td className="border border-slate-300 p-1">Maksimal KLB</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">7</td>
                               <td className="border border-slate-300 p-1">KDH (%)</td>
                               <td className="border border-slate-300 p-1 font-bold">{selectedApp.baLapangan?.paramKrkKdh || '-'}% ({selectedApp.baLapangan?.paramKrkKdhKet || 'OK'})</td>
                               <td className="border border-slate-300 p-1">Minimal KDH</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">8</td>
                               <td className="border border-slate-300 p-1">Garis Sempadan (GSJ & GSB)</td>
                               <td className="border border-slate-300 p-1 font-bold" colSpan={2}>
                                 <div>GSJ: {selectedApp.baLapangan?.paramKrkGsj || '-'} m</div>
                                 <div className="grid grid-cols-4 gap-1 text-[9.5px] mt-0.5">
                                   <span>Depan: {selectedApp.baLapangan?.paramKrkGsbDepan || '0'}m</span>
                                   <span>Belakang: {selectedApp.baLapangan?.paramKrkGsbBelakang || '0'}m</span>
                                   <span>Kanan: {selectedApp.baLapangan?.paramKrkGsbKanan || '0'}m</span>
                                   <span>Kiri: {selectedApp.baLapangan?.paramKrkGsbKiri || '0'}m</span>
                                 </div>
                               </td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center font-bold" colSpan={4}>Karakteristik & Klasifikasi Bangunan</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">9</td>
                               <td className="border border-slate-300 p-1">Kompleksitas</td>
                               <td className="border border-slate-300 p-1 font-bold" colSpan={2}>{selectedApp.baLapangan?.paramKlasifikasiKompleksitas || '-'}</td>
                             </tr>
                             <tr>
                               <td className="border border-slate-300 p-1 text-center">10</td>
                               <td className="border border-slate-300 p-1">Permanensi</td>
                               <td className="border border-slate-300 p-1 font-bold" colSpan={2}>{selectedApp.baLapangan?.paramKlasifikasiPermanensi === 'DIATAS_5_TAHUN' ? 'Permanen (>5 Tahun)' : 'Semi Permanen (<5 Tahun)'}</td>
                             </tr>
                           </tbody>
                         </table>
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
                      <div className="flex flex-col items-center justify-between min-h-[140px] space-y-2">
                        <div className="font-bold uppercase text-slate-800 dark:text-slate-200">
                          {selectedApp.baLapangan?.attendeesOwner?.role ? selectedApp.baLapangan.attendeesOwner.role.toUpperCase() : 'PEMOHON / YANG DIKUASAKAN'}
                        </div>
                        
                        {selectedApp.baLapangan?.perwakilanTtdUrl ? (
                          <div className="my-1 h-16 flex items-center justify-center">
                            <img 
                              src={selectedApp.baLapangan.perwakilanTtdUrl} 
                              alt="Tanda Tangan Pemohon" 
                              className="h-16 object-contain mix-blend-multiply" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="h-16 flex items-center justify-center text-slate-300 italic text-[9px] font-sans">
                            (Belum ditandatangani)
                          </div>
                        )}

                        <div>
                          <div className="font-bold underline text-slate-900 dark:text-white uppercase">
                            {selectedApp.baLapangan?.attendeesOwner?.name || selectedApp.applicant.name}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            NIK: {selectedApp.baLapangan?.attendeesOwner?.nik || selectedApp.applicant.nik || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-between min-h-[140px] space-y-2">
                        <div className="font-bold uppercase text-slate-800 dark:text-slate-200">
                          {selectedApp.baLapangan?.isTteSigned ? 'PEJABAT PENGESAH DOKUMEN TTE' : 'PETUGAS / OPERATOR SIMBG DPUPR GARUT'}
                        </div>
                        
                        {selectedApp.baLapangan?.isTteSigned ? (
                          <div className="my-1 h-16 flex items-center gap-2 border border-emerald-500/30 p-1.5 bg-emerald-50/20 max-w-[190px] text-left">
                            {/* QR Verification Seal */}
                            <div className="w-12 h-12 bg-white flex items-center justify-center p-0.5 border border-slate-300 shrink-0">
                              {/* Inline representation of a barcode/QR code using custom styled boxes */}
                              <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-[1px]">
                                {[1,0,1,1,0,1,0,1,1,1,0,0,1,0,1,1].map((v, i) => (
                                  <div key={i} className={`w-full h-full ${v === 1 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                                ))}
                              </div>
                            </div>
                            <div className="text-[7.5px] font-mono leading-tight text-slate-600">
                              <div className="font-bold text-emerald-700">TTE BSrE SAH</div>
                              <div className="truncate">SN: {selectedApp.baLapangan.tteCertificateSerial?.slice(-8)}</div>
                              <div>Date: {new Date(selectedApp.baLapangan.tteSignedAt || '').toLocaleDateString('id-ID')}</div>
                              <div className="text-[6.5px] text-indigo-600 truncate">Verify @simbg.garut</div>
                            </div>
                          </div>
                        ) : (
                          <div className="my-1 h-16 flex items-center justify-center text-slate-400 text-[8px] font-mono leading-tight">
                            <div className="border border-slate-300 p-1 text-center bg-slate-50 select-none uppercase">
                              <div>DRAFT BELUM SAH TTE</div>
                              <div className="font-bold text-slate-600">SIMBG Garut TTE</div>
                              <div>KUNCI DITANGGUHKAN</div>
                            </div>
                          </div>
                        )}

                        <div>
                          {selectedApp.baLapangan?.isTteSigned ? (
                            <>
                              <div className="font-bold underline text-slate-900 dark:text-white uppercase">
                                {selectedApp.baLapangan.tteSignerName}
                              </div>
                              <div className="text-[8.5px] text-slate-500 font-mono">
                                NIP: {selectedApp.baLapangan.tteSignerNip}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-bold underline text-slate-900 dark:text-white uppercase">OPERATOR TEKNIS SIMBG</div>
                              <div className="text-[9px] text-slate-500 font-mono">Dinas PUPR Kabupaten Garut</div>
                            </>
                          )}
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

      {/* Modal 1: Otorisasi & TTE Signature Pejabat */}
      {isTteModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 max-w-md w-full shadow-2xl p-5 space-y-4 font-mono text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="font-bold uppercase text-slate-900 dark:text-white">Otorisasi TTE BSrE</span>
              </div>
              <button 
                disabled={isTteSigningProgress}
                onClick={() => {
                  setIsTteModalOpen(false);
                  setTtePassphrase('');
                  setTteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isTteSigningProgress ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center">
                {/* Animated spinner */}
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white uppercase block">Proses Enkripsi TTE</span>
                  <p className="text-[10px] text-slate-500 animate-pulse">{tteSigningStep}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10.5px] leading-relaxed text-slate-500">
                  Anda akan membubuhi Berita Acara Lapangan dengan Tanda Tangan Elektronik (TTE) tersertifikasi Balai Sertifikasi Elektronik - BSSN. Sesuai Undang-Undang ITE, dokumen yang disahkan memiliki kekuatan hukum penuh.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pejabat Penandatangan:</label>
                    <select
                      value={`${tteSigner}||${tteSignerRole}||${tteSignerNip}`}
                      onChange={(e) => {
                        const [name, role, nip] = e.target.value.split('||');
                        setTteSigner(name);
                        setTteSignerRole(role);
                        setTteSignerNip(nip);
                      }}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold focus:ring-0"
                    >
                      <option value="Ir. H. Agus Ismail, S.T., M.T.||Kepala Dinas Pekerjaan Umum dan Penataan Ruang||197208151998031004">
                        Ir. H. Agus Ismail, S.T., M.T. (Kepala Dinas)
                      </option>
                      <option value="Ir. H. Deni Kusnadi, M.Si.||Kepala Bidang Tata Bangunan & Bina Konstruksi||196904121995031002">
                        Ir. H. Deni Kusnadi, M.Si. (Kabid Tata Bangunan)
                      </option>
                      <option value="Rian Pratama, S.T., M.Eng.||Ketua Tim Pengawas Lapangan DPUPR||198511202009041001">
                        Rian Pratama, S.T., M.Eng. (Ketua Tim Pengawas)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Passphrase / PIN Kunci Privat:</label>
                    <input
                      type="password"
                      value={ttePassphrase}
                      onChange={(e) => setTtePassphrase(e.target.value)}
                      placeholder="Masukkan Passphrase TTE (e.g. puprgarut)"
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Petunjuk: Masukkan PIN sertifikat BSrE Pejabat (e.g. 'puprgarut')</span>
                  </div>
                </div>

                {tteError && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-2 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                    ⚠️ {tteError}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsTteModalOpen(false);
                      setTtePassphrase('');
                      setTteError(null);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition uppercase cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleApplyTte}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition uppercase shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sahkan TTE</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Premium Print Preview & Live Configuration Drawer */}
      {isPrintModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-sans">
            
            {/* Header */}
            <div className="bg-white dark:bg-slate-950 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Pratinjau Cetak Berita Acara Lapangan (A4 Live Preview)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">No. Register: {selectedApp.registerNumber} | Pemilik: {selectedApp.applicant.name}</span>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic Split Layout */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Pane: Config Panel & Controls (320px) */}
              <div className="w-[320px] shrink-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between overflow-y-auto space-y-6">
                
                <div className="space-y-5">
                  {/* Status TTE Badge Card */}
                  <div className="border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Sertifikasi TTE</span>
                    
                    {selectedApp.baLapangan?.isTteSigned ? (
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono font-bold text-[9px] border border-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>TERVERIFIKASI TTE BSrE</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Dokumen sah. Hash SHA-256 telah disahkan oleh {selectedApp.baLapangan.tteSignerName}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-mono font-bold text-[9px] border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>DRAFT (BELUM SAH TTE)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Dokumen belum dibubuhi TTE Pejabat. Tanda air "DRAFT" akan dicetak secara semi-transparan.
                        </p>
                        <button
                          onClick={() => {
                            setIsPrintModalOpen(false);
                            setIsTteModalOpen(true);
                          }}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase transition cursor-pointer"
                        >
                          Bubuhi TTE Sekarang
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Real-time Layout Options */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1">Konfigurasi Lembar Kerja</span>
                    
                    <div className="space-y-2 text-xs">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={printConfigKop}
                          onChange={(e) => setPrintConfigKop(e.target.checked)}
                          className="mt-0.5 rounded-none border-slate-300 focus:ring-0 text-indigo-600"
                        />
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">Tampilkan Kop Resmi DPUPR</span>
                          <span className="text-[10px] text-slate-400">Menyisipkan kop surat kedinasan Garut di halaman 1</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={printConfigSignatures}
                          onChange={(e) => setPrintConfigSignatures(e.target.checked)}
                          className="mt-0.5 rounded-none border-slate-300 focus:ring-0 text-indigo-600"
                        />
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">Tampilkan TTD Pemohon</span>
                          <span className="text-[10px] text-slate-400">Menampilkan tanda tangan fisik perwakilan pemilik</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={printConfigPhotos}
                          onChange={(e) => setPrintConfigPhotos(e.target.checked)}
                          className="mt-0.5 rounded-none border-slate-300 focus:ring-0 text-indigo-600"
                        />
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 block">Lampirkan Foto Lapangan</span>
                          <span className="text-[10px] text-slate-400">Menyisipkan dokumentasi visual di akhir Berita Acara</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* PDF Dimensions Info */}
                  <div className="border border-slate-200 dark:border-slate-800 p-2.5 text-[10px] text-slate-400 font-mono space-y-1">
                    <div>Format Target: Kertas A4 (ISO 216)</div>
                    <div>Dimensi: 210mm x 297mm</div>
                    <div>Integritas: Terproteksi Kriptografi</div>
                  </div>
                </div>

                {/* Core Print Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    onClick={() => {
                      setIsPrintModalOpen(false);
                      executePhysicalPrint();
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Kirim ke Mesin Cetak / PDF</span>
                  </button>
                  
                  <button
                    onClick={() => setIsPrintModalOpen(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase transition cursor-pointer"
                  >
                    Tutup Pratinjau
                  </button>
                </div>
              </div>

              {/* Right Pane: Live Simulated Paper Canvas */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-300/60 dark:bg-slate-950/40 flex justify-center items-start">
                
                {/* Styled Sheet Simulating Physical A4 Letterhead */}
                <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-12 max-w-[210mm] w-full shadow-2xl border border-slate-300 dark:border-slate-800 relative space-y-4 font-mono text-[10.5px] leading-relaxed select-none">
                  
                  {/* Real-time diagonal watermark if draft */}
                  {!selectedApp.baLapangan?.isTteSigned && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] text-slate-900 dark:text-white text-5xl font-extrabold select-none pointer-events-none rotate-12 z-10">
                      DRAFT - BELUM SAH TTE
                    </div>
                  )}

                  {/* Kop Surat (Configurable) */}
                  {printConfigKop && (
                    <div className="text-center border-b-2 border-slate-900 dark:border-slate-700 pb-4 space-y-1">
                      <div className="font-bold text-xs tracking-wide">PEMERINTAH KABUPATEN GARUT</div>
                      <div className="font-extrabold text-sm tracking-wider">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</div>
                      <div className="text-[9px] text-slate-500">Jalan Prof. KH. Cecep Syarifuddin No. 117 Telp. (0262) 233730 Fax (0262) 544184 Garut 44151</div>
                    </div>
                  )}

                  {/* Title */}
                  <div className="text-center pt-2 space-y-0.5">
                    <div className="font-bold text-xs uppercase underline tracking-wider">
                      BERITA ACARA PEMERIKSAAN KELAIKAN FUNGSI LAPANGAN (VISITE SLF/PBG)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Nomor: {selectedApp.baLapangan?.baLapanganNumber || `BA-VISITE/${selectedApp.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}/DPUPR-GRT/2026`}
                    </div>
                  </div>

                  {/* Narrative */}
                  <p className="text-[10.5px]">
                    Pada hari ini, <strong>{visitDate}</strong> pukul <strong>{visitTime}</strong>, telah dilaksanakan pemeriksaan langsung/visite ke lokasi bangunan gedung dalam rangka permohonan penerbitan <strong>{isSlfApplication(selectedApp) ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)'}</strong>:
                  </p>

                  {/* Specs Table */}
                  <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-bold w-1/3">Nama Permohonan</td>
                        <td className="border border-slate-300 p-1.5 capitalize">{selectedApp.building.name}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-bold">No. Register</td>
                        <td className="border border-slate-300 p-1.5 font-mono">{selectedApp.registerNumber}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-bold">Nama Pemilik</td>
                        <td className="border border-slate-300 p-1.5">{selectedApp.applicant.name}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 font-bold">Lokasi Bangunan</td>
                        <td className="border border-slate-300 p-1.5">{selectedApp.building.address}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Param checks */}
                  <div className="space-y-2 pt-1">
                    <div className="font-bold text-[10px] uppercase">Hasil Verifikasi Parameter Lapangan:</div>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      <div className="border border-slate-300 p-2 space-y-0.5 bg-slate-50">
                        <div className="font-bold border-b pb-0.5 mb-1 text-[9px] uppercase">Kondisi Tanah</div>
                        <div>{selectedApp.baLapangan?.kondisiLapangan?.tanahKosong ? '☑' : '☐'} 1. Tanah kosong</div>
                        <div>{selectedApp.baLapangan?.kondisiLapangan?.adaBangunanLama ? '☑' : '☐'} 2. Ada bangunan lama</div>
                        <div>{selectedApp.baLapangan?.kondisiLapangan?.bangunanSudahJadi ? '☑' : '☐'} 3. Bangunan sudah jadi</div>
                      </div>

                      <div className="border border-slate-300 p-2 space-y-0.5 bg-slate-50">
                        <div className="font-bold border-b pb-0.5 mb-1 text-[9px] uppercase">Kesesuaian Fisik</div>
                        <div className="font-bold text-indigo-700">{conformityStatus.replace('_', ' ')}</div>
                        <div className="text-[9px] text-slate-500">Catatan: {locationNotes.slice(0, 50)}...</div>
                      </div>
                    </div>
                  </div>

                  {/* Attached Photos (Configurable) */}
                  {printConfigPhotos && photos.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="font-bold text-[10px] uppercase">Lampiran Dokumentasi Visual Lapangan:</div>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.slice(0, 3).map((ph) => (
                          <div key={ph.id} className="border border-slate-300 p-1 bg-slate-50 text-center">
                            <img 
                              src={ph.url} 
                              alt={ph.tag} 
                              className="h-16 w-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[7.5px] font-bold block truncate mt-0.5 uppercase">{ph.tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signatures Row */}
                  <div className="pt-6 grid grid-cols-2 gap-6 text-center text-[10px] border-t border-slate-200">
                    
                    {/* Pemohon (Configurable) */}
                    <div className="flex flex-col items-center justify-between min-h-[110px] space-y-1">
                      <div className="font-bold uppercase text-slate-700">
                        {selectedApp.baLapangan?.attendeesOwner?.role ? selectedApp.baLapangan.attendeesOwner.role.toUpperCase() : 'PEMOHON / YANG DIKUASAKAN'}
                      </div>
                      
                      {printConfigSignatures && selectedApp.baLapangan?.perwakilanTtdUrl ? (
                        <div className="my-0.5 h-12 flex items-center justify-center">
                          <img 
                            src={selectedApp.baLapangan.perwakilanTtdUrl} 
                            alt="Tanda Tangan Pemohon" 
                            className="h-12 object-contain mix-blend-multiply" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-12 flex items-center justify-center text-slate-400 italic text-[9px]">
                          {printConfigSignatures ? '(Belum ditandatangani)' : '(Disembunyikan)'}
                        </div>
                      )}

                      <div>
                        <div className="font-bold underline uppercase">{selectedApp.baLapangan?.attendeesOwner?.name || selectedApp.applicant.name}</div>
                        <div className="text-[8.5px] text-slate-500">NIK: {selectedApp.baLapangan?.attendeesOwner?.nik || selectedApp.applicant.nik || '-'}</div>
                      </div>
                    </div>

                    {/* TTE Seal (Pejabat) */}
                    <div className="flex flex-col items-center justify-between min-h-[110px] space-y-1">
                      <div className="font-bold uppercase text-slate-700">
                        {selectedApp.baLapangan?.isTteSigned ? 'PEJABAT PENILAI TEKNIS' : 'PETUGAS SIMBG DPUPR'}
                      </div>
                      
                      {selectedApp.baLapangan?.isTteSigned ? (
                        <div className="my-0.5 h-12 flex items-center gap-2 border border-emerald-500/30 p-1 bg-emerald-50/20 max-w-[170px] text-left">
                          <div className="w-9 h-9 bg-white flex items-center justify-center p-0.5 border border-slate-300 shrink-0">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&ecc=M&data=${encodeURIComponent(`https://simbg.garutkab.go.id/verify?sn=${selectedApp.baLapangan.tteCertificateSerial || 'BSRE-GARUT'}&signer=${encodeURIComponent(selectedApp.baLapangan.tteSignerName || '')}&doc=${encodeURIComponent(selectedApp.baLapangan.baLapanganNumber || selectedApp.registerNumber)}`)}`} 
                              alt="QR TTE BSrE" 
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="text-[7px] font-mono leading-tight text-slate-600">
                            <div className="font-bold text-emerald-700">TTE BSrE SAH</div>
                            <div className="truncate">SN: {selectedApp.baLapangan.tteCertificateSerial?.slice(-8)}</div>
                            <div className="text-[6px] text-indigo-600 truncate">Verify @simbg</div>
                          </div>
                        </div>
                      ) : (
                        <div className="my-0.5 h-12 flex items-center justify-center text-slate-400 text-[8px] font-mono leading-tight">
                          <div className="border border-slate-300 p-1 text-center bg-slate-50 select-none uppercase">
                            <div>DRAFT BELUM SAH TTE</div>
                          </div>
                        </div>
                      )}

                      <div>
                        {selectedApp.baLapangan?.isTteSigned ? (
                          <>
                            <div className="font-bold underline uppercase">{selectedApp.baLapangan.tteSignerName}</div>
                            <div className="text-[8px] text-slate-500">NIP: {selectedApp.baLapangan.tteSignerNip}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold underline uppercase">OPERATOR TEKNIS SIMBG</div>
                            <div className="text-[8.5px] text-slate-500">Dinas PUPR Kabupaten Garut</div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
