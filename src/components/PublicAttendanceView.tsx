import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  QrCode, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertTriangle,
  PenTool,
  Eraser,
  Check,
  Briefcase,
  UserCheck,
  Users,
  Building,
  ArrowLeft
} from 'lucide-react';
import { Application, AttendanceRecord } from '../types';

interface PublicAttendanceViewProps {
  application: Application;
  onConfirmAttendance: (updatedApp: Application) => void;
  verificationToken?: string;
  onClose?: () => void;
}

export const PublicAttendanceView: React.FC<PublicAttendanceViewProps> = ({
  application,
  onConfirmAttendance,
  verificationToken,
  onClose
}) => {
  const [role, setRole] = useState<'PEMOHON' | 'TPA_EXPERT' | 'TPT_MEMBER' | 'SEKRETARIAT' | 'TAMU'>('PEMOHON');
  const [name, setName] = useState('');
  const [nikOrNip, setNikOrNip] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [subSpecialty, setSubSpecialty] = useState('');
  
  // TPA Select Dropdown State
  const [selectedTpaIndex, setSelectedTpaIndex] = useState<string>('manual');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null);

  // HTML5 Canvas Drawing Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0f172a'); // slate-900
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [hasSigned, setHasSigned] = useState(false);

  const isTokenValid = !verificationToken || application.schedule?.attendanceToken === verificationToken;

  // Initialize fields based on selected role
  useEffect(() => {
    if (role === 'PEMOHON') {
      setName(application.applicant.name || '');
      setNikOrNip(application.applicant.nik || '');
      setPhone(application.applicant.phone || '');
      setInstitution('Pribadi / Perorangan');
      setSubSpecialty('');
    } else if (role === 'TPA_EXPERT') {
      const experts = application.schedule?.assignedExperts || [];
      if (experts.length > 0) {
        setSelectedTpaIndex('0');
        setName(experts[0].name);
        setSubSpecialty(experts[0].expertise);
        setNikOrNip('');
        setPhone('');
        setInstitution('Ikatan Arsitek Indonesia (IAI) / Ikatan Nasional Konsult Indonesia (INKINDO)');
      } else {
        setSelectedTpaIndex('manual');
        setName('');
        setSubSpecialty('');
        setNikOrNip('');
        setPhone('');
        setInstitution('');
      }
    } else if (role === 'TPT_MEMBER') {
      setName('');
      setNikOrNip('');
      setPhone('');
      setInstitution('Dinas PUPR Kabupaten Garut');
      setSubSpecialty('Tim Penilai Teknis');
    } else if (role === 'SEKRETARIAT') {
      setName('');
      setNikOrNip('');
      setPhone('');
      setInstitution('Sekretariat SIMBG DPUPR Garut');
      setSubSpecialty('Petugas Sekretariat');
    } else {
      setName('');
      setNikOrNip('');
      setPhone('');
      setInstitution('');
      setSubSpecialty('');
    }
    
    // Clear canvas when role changes
    clearCanvas();
  }, [role, application]);

  // Handle TPA selection change
  const handleTpaChange = (val: string) => {
    setSelectedTpaIndex(val);
    const experts = application.schedule?.assignedExperts || [];
    if (val === 'manual') {
      setName('');
      setSubSpecialty('');
    } else {
      const idx = parseInt(val);
      if (experts[idx]) {
        setName(experts[idx].name);
        setSubSpecialty(experts[idx].expertise);
      }
    }
  };

  // Canvas drawing handlers with support for mouse and touch events
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    // Check if Touch Event
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setHasSigned(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Nama lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Capture canvas signature as base64 PNG
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';

      const newRecord: AttendanceRecord = {
        id: `ATT-${Date.now().toString(36).toUpperCase()}`,
        name: name.trim(),
        role,
        nikOrNip: nikOrNip.trim() || undefined,
        phone: phone.trim() || undefined,
        institution: institution.trim() || undefined,
        subSpecialty: subSpecialty.trim() || undefined,
        signatureDataUrl: hasSigned ? signatureDataUrl : undefined,
        signedAt: new Date().toLocaleString('id-ID') + ' WIB'
      };

      // Prepare updated application schedule and attendance logs
      const currentSchedule = application.schedule || {
        id: `SCH-${application.id}`,
        scheduleDate: new Date().toISOString().split('T')[0],
        timeSlot: '09:00 - 10:00 WIB',
        room: 'Ruang Sidang DPUPR Garut',
        sessionType: 'SIDANG_TPA',
        assignedExperts: [],
        attendanceToken: `TOK-${application.registerNumber}-${Date.now().toString(36).toUpperCase()}`
      };

      const existingLogs = currentSchedule.attendanceLogs || [];
      const updatedLogs = [...existingLogs, newRecord];

      const updatedSchedule = {
        ...currentSchedule,
        attendanceLogs: updatedLogs
      };

      // If checking in as Pemohon, update the main attended state too
      if (role === 'PEMOHON') {
        updatedSchedule.applicantAttended = true;
        updatedSchedule.attendanceTimestamp = newRecord.signedAt;
      }

      const updatedApp: Application = {
        ...application,
        schedule: updatedSchedule,
        lastUpdated: new Date().toISOString()
      };

      onConfirmAttendance(updatedApp);
      setLatestRecord(newRecord);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  if (isSuccess && latestRecord) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white uppercase tracking-tight font-mono">
              Presensi Berhasil Dikirim
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-sans">
              Terima kasih, kehadiran Anda telah tercatat secara real-time pada sistem SIMBG Kabupaten Garut.
            </p>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-800 text-left space-y-2.5 text-xs font-mono">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase">
              <span>WAKTU PRESENSI:</span>
              <span>{latestRecord.signedAt}</span>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block">PERAN / JABATAN:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 border border-indigo-100 dark:border-indigo-900 inline-block text-[10px]">
                {latestRecord.role.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase block">NAMA LENGKAP:</span>
              <strong className="text-slate-900 dark:text-white uppercase text-[12px]">{latestRecord.name}</strong>
            </div>
            {latestRecord.nikOrNip && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block">NIK / NIP:</span>
                <strong className="text-slate-900 dark:text-white">{latestRecord.nikOrNip}</strong>
              </div>
            )}
            {latestRecord.institution && (
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase block">INSTANSI / PERUSAHAAN:</span>
                <span className="text-slate-700 dark:text-slate-300 font-sans">{latestRecord.institution}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold uppercase transition border border-slate-200 dark:border-slate-700"
              >
                Kembali ke Beranda
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                setRole('PEMOHON');
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase transition"
            >
              Absen Orang Lain
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>VERIFIED ONLINE BY DPUPR GARUT</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-8 px-4 space-y-6 font-sans">
      
      {/* Dynamic Header */}
      <div className="text-center space-y-1.5 max-w-md w-full">
        <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-1 inline-block text-[10px] font-mono font-bold tracking-widest uppercase border border-slate-700">
          DPUPR KABUPATEN GARUT
        </div>
        <h1 className="text-2xl font-black tracking-tight uppercase text-slate-950 dark:text-white font-mono">
          FORM ABSENSI DIGITAL
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs">
          Silakan isi data kehadiran Anda untuk Agenda Sidang Konsultasi Teknis.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col"
      >
        {/* Verification Link Banner */}
        {!isTokenValid && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 p-3 flex items-center gap-2 text-amber-800 dark:text-amber-400 text-[10px] font-mono font-bold uppercase">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Peringatan: Token Digital Tidak Cocok // Verifikasi Manual</span>
          </div>
        )}

        {/* Meeting Event Info Banner */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">PERUNTUKAN GEDUNG:</span>
              <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs leading-tight font-mono">{application.building.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Kec. {application.building.district}, Kab. Garut</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1.5 text-xs font-mono border-t border-dashed border-slate-200 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase">NO. REGISTER:</span>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 truncate">{application.registerNumber}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase">JADWAL SIDANG:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{application.schedule?.scheduleDate || 'Hari Jumat'}</div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Peran / Category Picker */}
          <div className="space-y-2">
            <label className="block font-mono font-bold text-[10px] text-slate-400 uppercase">
              1. Pilih Kategori Kehadiran (Peran):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'PEMOHON', label: 'Pemohon', icon: User },
                { id: 'TPA_EXPERT', label: 'Ahli TPA', icon: Briefcase },
                { id: 'TPT_MEMBER', label: 'Tim TPT', icon: Users },
                { id: 'SEKRETARIAT', label: 'Sekretaris', icon: UserCheck },
                { id: 'TAMU', label: 'Tamu', icon: Building }
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = role === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setRole(cat.id as any)}
                    className={`p-2 border transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-bold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-mono tracking-tighter whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="block font-mono font-bold text-[10px] text-slate-400 uppercase">
              2. Formulir Data Kehadiran:
            </span>

            {/* If TPA: Show assigned experts dropdown */}
            {role === 'TPA_EXPERT' && (
              <div>
                <label className="block font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Pilih Anggota TPA Terdaftar:
                </label>
                <select
                  value={selectedTpaIndex}
                  onChange={(e) => handleTpaChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="manual">Tulis Nama Manual (Tidak terdaftar)</option>
                  {(application.schedule?.assignedExperts || []).map((exp, idx) => (
                    <option key={idx} value={idx.toString()}>
                      {exp.name} ({exp.expertise})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nama Lengkap */}
            <div>
              <label className="block font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">
                Nama Lengkap (Sesuai KTP / SK Ahli): <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda..."
                disabled={role === 'TPA_EXPERT' && selectedTpaIndex !== 'manual'}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white uppercase disabled:opacity-75"
              />
            </div>

            {/* NIK / NIP */}
            <div>
              <label className="block font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">
                {role === 'PEMOHON' || role === 'TAMU' ? 'Nomor NIK KTP (16 Digit):' : 'Nomor NIP Resmi / ID:'}
              </label>
              <input
                type="text"
                value={nikOrNip}
                onChange={(e) => setNikOrNip(e.target.value)}
                placeholder={role === 'PEMOHON' || role === 'TAMU' ? "E.g. 320501xxxxxxxxxx" : "E.g. 19820315xxxxxxxxxx"}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* No Telepon/WA */}
              <div>
                <label className="block font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">
                  No. HP / WhatsApp:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="E.g. 08123456xxxx"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              {/* Instansi / Perusahaan */}
              <div>
                <label className="block font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Nama Instansi / Perusahaan:
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="E.g. PT. Bangun Sejahtera / Pribadi"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Keahlian / Bidang */}
            {(role === 'TPA_EXPERT' || role === 'TPT_MEMBER' || role === 'SEKRETARIAT' || role === 'TAMU') && (
              <div>
                <label className="block font-mono font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Bidang Keahlian / Jabatan Sidang:
                </label>
                <input
                  type="text"
                  value={subSpecialty}
                  onChange={(e) => setSubSpecialty(e.target.value)}
                  placeholder="E.g. Arsitektur / Struktur / Pranata Komputer"
                  disabled={role === 'TPA_EXPERT' && selectedTpaIndex !== 'manual'}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white disabled:opacity-75"
                />
              </div>
            )}
          </div>

          {/* Interactive Signature Pad */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-[10px] text-slate-400 uppercase flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Tanda Tangan Digital Anda (Paraf):</span>
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[9px] font-mono text-rose-600 hover:text-rose-500 font-bold uppercase flex items-center gap-1 border border-rose-200 hover:border-rose-300 dark:border-rose-900 dark:hover:border-rose-800 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5"
              >
                <Eraser className="w-3 h-3" />
                <span>Hapus Goresan</span>
              </button>
            </div>

            <div className="relative bg-white border border-dashed border-slate-300 dark:border-slate-700 rounded overflow-hidden">
              <canvas
                ref={canvasRef}
                width={480}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[160px] cursor-crosshair touch-none bg-white"
              />
              <div className="absolute bottom-1.5 right-2.5 text-[8px] text-slate-400 font-mono pointer-events-none select-none uppercase tracking-wide">
                [ Area Paraf Digital SIMBG ]
              </div>
            </div>
            
            {/* Ink options */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Tinta:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { color: '#0f172a', label: 'Hitam' },
                  { color: '#1d4ed8', label: 'Biru' }
                ].map(ink => (
                  <button
                    key={ink.color}
                    type="button"
                    onClick={() => setPenColor(ink.color)}
                    className={`px-2 py-0.5 text-[9px] font-mono border rounded ${
                      penColor === ink.color 
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold border-slate-900 dark:border-slate-100' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {ink.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Tebal:</span>
                <select
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="text-[10px] p-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-white"
                >
                  <option value={2}>2px</option>
                  <option value={3}>3px (Sedang)</option>
                  <option value={4}>4px</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-950 dark:bg-slate-100 dark:text-slate-950 text-white font-mono font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Memproses Absensi...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Kirim Kehadiran Saya</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {onClose && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[10px] font-mono uppercase tracking-tight flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Batal / Kembali ke Beranda</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer info banner */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-mono uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sistem Enkripsi Validasi Kehadiran Dinas PUPR Garut</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
