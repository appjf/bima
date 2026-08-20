import React, { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import { Application } from '../types';

interface PublicAttendanceViewProps {
  application: Application;
  onConfirmAttendance: (appId: string) => void;
}

export const PublicAttendanceView: React.FC<PublicAttendanceViewProps> = ({
  application,
  onConfirmAttendance
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(application.schedule?.applicantAttended || false);

  const handleCheckIn = () => {
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
      onConfirmAttendance(application.id);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-emerald-200 shadow-2xl p-8 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Presensi Berhasil</h2>
            <p className="text-slate-500 text-sm">Terima kasih, kehadiran Anda telah tercatat dalam sistem SIMBG Kabupaten Garut.</p>
          </div>
          
          <div className="bg-slate-50 p-4 border border-slate-200 text-left space-y-3">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase">
              <span>Waktu Presensi</span>
              <span>{new Date().toLocaleString('id-ID')} WIB</span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">No. Register</p>
              <p className="font-mono font-bold text-slate-900">{application.registerNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Pemohon</p>
              <p className="font-bold text-slate-900">{application.applicant.name}</p>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-mono italic">
            Silakan tunjukkan layar ini kepada petugas sekretariat jika diperlukan.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="bg-slate-900 text-white px-3 py-1 inline-block text-[10px] font-bold tracking-widest uppercase mb-2">
          DPUPR KABUPATEN GARUT
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900">
          Digital Presensi
        </h1>
        <p className="text-slate-500 text-sm font-medium">Sidang Konsultasi Teknis TPA/TPT</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white border-t-4 border-t-indigo-600 shadow-xl overflow-hidden"
      >
        <div className="p-6 space-y-6">
          {/* Building Info */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 bg-indigo-100 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 leading-tight uppercase text-sm">{application.building.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {application.building.address}, {application.building.district}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Tanggal
              </p>
              <p className="text-xs font-bold text-slate-800">
                {new Date(application.schedule?.scheduleDate || '').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Jam Sesi
              </p>
              <p className="text-xs font-bold text-slate-800">{application.schedule?.timeSlot}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <User className="w-3 h-3" /> Pemohon
              </p>
              <p className="text-xs font-bold text-slate-800">{application.applicant.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <QrCode className="w-3 h-3" /> No. Register
              </p>
              <p className="text-xs font-mono font-bold text-indigo-600 truncate">{application.registerNumber}</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleCheckIn}
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <span>Konfirmasi Kehadiran Saya</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 flex items-center justify-center gap-2 border-t border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
            SIMBG GARUT SECURE ATTENDANCE SYSTEM
          </span>
        </div>
      </motion.div>

      <div className="text-[10px] text-slate-400 font-mono text-center max-w-xs leading-relaxed">
        Sistem ini memverifikasi data Anda secara langsung dengan database DPUPR Kabupaten Garut.
      </div>
    </div>
  );
};
