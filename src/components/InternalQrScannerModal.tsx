import React, { useEffect, useRef, useState } from 'react';
import { 
  QrCode, 
  X, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Keyboard,
  Upload
} from 'lucide-react';
import jsQR from 'jsqr';
import { ASNPersonnel, Application } from '../types';
import { getASNPersonnelList } from '../lib/asnPersonnelEngine';

interface InternalQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications?: Application[];
  onAttendanceVerified?: (result: {
    type: 'ASN' | 'APPLICATION' | 'UNKNOWN';
    name: string;
    details: string;
    timestamp: string;
    rawPayload: string;
  }) => void;
}

export const InternalQrScannerModal: React.FC<InternalQrScannerModalProps> = ({
  isOpen,
  onClose,
  applications = [],
  onAttendanceVerified
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    type: 'ASN' | 'APPLICATION' | 'UNKNOWN';
    title: string;
    subtitle: string;
    details: string;
    timestamp: string;
    rawPayload: string;
  } | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  // Play audio beep upon successful QR scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5 note)
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio Context beep disabled or error:', e);
    }
  };

  // Start Camera Stream & Frame Analyzer Loop
  useEffect(() => {
    if (!isOpen || isManualMode) return;

    let localStream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError(null);
      setHasCameraPermission(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCameraPermission(false);
          setCameraError('Perangkat atau peramban tidak mendukung akses kamera langsung. Silakan gunakan unggah gambar QR atau input manual.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }
        });

        localStream = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(e => {
            console.warn('Video playback warning:', e);
          });
          requestAnimationFrame(scanFrame);
        }
      } catch (err: any) {
        console.warn('Camera access was not granted or not available:', err?.message || err);
        setHasCameraPermission(false);
        const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        setCameraError(
          isDenied 
            ? 'Izin kamera belum diberikan pada peramban. Anda dapat mengunggah file foto QR atau memasukkan kode secara manual.' 
            : 'Kamera tidak ditemukan atau sedang digunakan aplikasi lain.'
        );
      }
    };

    startCamera();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, isManualMode]);

  // Analyze video frames for QR Code using jsQR
  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          handleQrPayload(code.data);
          return; // Stop loop after scan
        }
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Process & Verify Scanned Payload
  const handleQrPayload = (raw: string) => {
    playBeep();
    const timestamp = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';

    const asnList = getASNPersonnelList();
    
    // Check 1: Is Payload an ASN Personnel QR?
    const matchedAsn = asnList.find(asn => 
      raw.includes(asn.nip) || 
      raw.includes(asn.name) ||
      (asn.qrCodeUrl && asn.qrCodeUrl.includes(encodeURIComponent(asn.nip)))
    );

    if (matchedAsn) {
      const result = {
        type: 'ASN' as const,
        title: matchedAsn.name,
        subtitle: `NIP. ${matchedAsn.nip} • ${matchedAsn.roleCategory}`,
        details: `Presensi ASN Pejabat/Operator: ${matchedAsn.positionTitle} (${matchedAsn.subSpecialty || 'DPUPR Garut'}) - TERVERIFIKASI`,
        timestamp,
        rawPayload: raw
      };
      setScannedResult(result);
      if (onAttendanceVerified) onAttendanceVerified(result);
      return;
    }

    // Check 2: Is Payload an Application / No. Register?
    const matchedApp = applications.find(app => 
      raw.includes(app.registerNumber) || 
      (app.applicationNumber && raw.includes(app.applicationNumber)) ||
      raw.includes(app.id)
    );

    if (matchedApp) {
      const result = {
        type: 'APPLICATION' as const,
        name: matchedApp.registerNumber,
        title: matchedApp.registerNumber,
        subtitle: `${matchedApp.applicant.name} • ${matchedApp.building.name}`,
        details: `Presensi Peserta Sidang Pemohon SIMBG: ${matchedApp.building.district} (${matchedApp.building.functionType}) - HADIR SIDANG`,
        timestamp,
        rawPayload: raw
      };
      setScannedResult(result);
      if (onAttendanceVerified) onAttendanceVerified(result);
      return;
    }

    // Fallback: Generic Payload
    const genericResult = {
      type: 'UNKNOWN' as const,
      name: 'QR Code Terdeteksi',
      title: 'QR Code Terdeteksi',
      subtitle: raw.slice(0, 60) + (raw.length > 60 ? '...' : ''),
      details: 'Payload QR berhasil dibaca oleh sistem. Data tidak langsung terikat pada database ASN/Permohonan.',
      timestamp,
      rawPayload: raw
    };
    setScannedResult(genericResult);
    if (onAttendanceVerified) onAttendanceVerified(genericResult);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleQrPayload(manualInput.trim());
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });
          if (code && code.data) {
            handleQrPayload(code.data);
          } else {
            alert('QR Code tidak terdeteksi pada gambar yang diunggah. Pastikan QR tampak jelas dan tidak buram.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetScan = () => {
    setScannedResult(null);
    setManualInput('');
    if (!isManualMode && videoRef.current) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                PEMINDAI QR CODE DAFTAR HADIR KONSULTASI
              </h3>
              <p className="text-[10px] text-slate-400">
                Verifikasi Otomatis Kehadiran Peserta & Pejabat ASN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={soundEnabled ? 'Suara Beep Aktif' : 'Suara Beep Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* Mode Switcher */}
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-1 font-mono text-xs">
            <button
              onClick={() => {
                setIsManualMode(false);
                setScannedResult(null);
              }}
              className={`flex-1 py-1.5 text-center font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                !isManualMode
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera Langsung</span>
            </button>

            <button
              onClick={() => {
                setIsManualMode(true);
                setScannedResult(null);
              }}
              className={`flex-1 py-1.5 text-center font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                isManualMode
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Input Manual / Kode</span>
            </button>
          </div>

          {/* SCANNED RESULT CARD */}
          {scannedResult ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 p-5 space-y-3 font-sans">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 border border-emerald-300">
                      PRESENSI BERHASIL DIVERIFIKASI // {scannedResult.type}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                      {scannedResult.title}
                    </h4>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {scannedResult.subtitle}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                  {scannedResult.timestamp}
                </span>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed bg-white dark:bg-slate-900 p-3 border border-emerald-200 dark:border-emerald-800">
                {scannedResult.details}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-200 dark:border-emerald-800 font-mono text-xs">
                <button
                  onClick={handleResetScan}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase transition flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pindai QR Selanjutnya</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : !isManualMode ? (
            /* CAMERA SCANNER VIEW */
            <div className="space-y-3">
              <div className="relative aspect-4/3 bg-slate-950 border-2 border-slate-800 rounded-none overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target Overlay Scanner Frame */}
                {hasCameraPermission && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-52 h-52 border-2 border-emerald-400/80 rounded-lg relative animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-500"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-500"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-500"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-500"></div>
                    </div>
                  </div>
                )}

                {/* Permission Loading / Error */}
                {hasCameraPermission === null && (
                  <div className="text-center p-6 text-slate-400 font-mono text-xs space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                    <p>Meminta izin akses kamera perangkat...</p>
                  </div>
                )}

                {hasCameraPermission === false && (
                  <div className="text-center p-5 text-slate-200 font-mono text-xs space-y-3 bg-slate-900/95">
                    <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto" />
                    <p className="text-slate-300 leading-snug">{cameraError || 'Kamera tidak dapat diakses langsung.'}</p>
                    <div className="flex flex-wrap gap-2 justify-center pt-1">
                      <label className="cursor-pointer px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase transition flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Foto / Screenshot QR</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFileUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManualMode(true)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase transition"
                      >
                        Input Manual Kode
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Alternative in Camera Mode */}
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Atau gunakan berkas gambar:</span>
                <label className="cursor-pointer px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold uppercase transition flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Pilih Gambar QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileUpload}
                  />
                </label>
              </div>

              <p className="text-[11px] text-slate-500 font-mono text-center">
                Arahkan kamera perangkat ke QR Code pada kartu ASN atau berkas permohonan SIMBG.
              </p>
            </div>
          ) : (
            /* MANUAL INPUT MODE */
            <div className="space-y-4 font-mono text-xs">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Ketik atau Tempel Kode/NIP/No. Register SIMBG:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="E.g. 19880512 201101 1 003 atau PBG-320501..."
                      className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase transition"
                    >
                      Verifikasi
                    </button>
                  </div>
                </div>
              </form>

              {/* Upload QR File Box */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">Unggah berkas foto QR untuk pemindaian otomatis:</p>
                <label className="inline-flex cursor-pointer px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase transition items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih File Gambar QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileUpload}
                  />
                </label>
              </div>

              {/* Sample Quick Testing Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Pintasan Uji Presensi ASN:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQrPayload('19880512 201101 1 003')}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    NIP: H. Yudi, ST
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQrPayload('19920410 201903 2 008')}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    NIP: Ir. Rina Kartika
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQrPayload('PBG-320501-19082024-001')}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    No. Reg: PBG-320501
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
