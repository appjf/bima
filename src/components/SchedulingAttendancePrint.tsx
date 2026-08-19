import React from 'react';
import { Application } from '../types';
import { getSavedSignatures, generateSignatureQrPayload } from '../lib/signatureEngine';
import { OfficialLetterhead } from './OfficialLetterhead';
import { ShieldCheck } from 'lucide-react';

interface SchedulingAttendancePrintProps {
  scheduledApps: Application[];
  nextFridayDate: string;
}

export const SchedulingAttendancePrint: React.FC<SchedulingAttendancePrintProps> = ({
  scheduledApps,
  nextFridayDate
}) => {
  const savedSignatures = getSavedSignatures();
  const operatorSig = savedSignatures.operator;
  const operatorQr = operatorSig.qrCodeUrl || generateSignatureQrPayload(operatorSig, `PRESENSI-TPA-${nextFridayDate}`);

  return (
    <div id="printable-attendance-doc" className="bg-white text-slate-900 p-8 font-mono w-full max-w-[210mm] mx-auto text-xs space-y-4 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
      
      {/* Kop Surat Resmi Sekretariat SIMBG DPUPR Garut */}
      <OfficialLetterhead />

      {/* Header Document */}
      <div className="text-center space-y-1 pt-2">
        <h1 className="font-extrabold text-sm uppercase tracking-wider underline">
          DAFTAR HADIR SIDANG KONSULTASI TEKNIS TPA / TPT
        </h1>
        <div className="text-xs font-bold text-indigo-900">
          AGENDA SIDANG JUMAT // TANGGAL: {nextFridayDate}
        </div>
        <div className="text-[11px] text-slate-600">
          LOKASI: RUANG RAPAT DEWAN DIREKSI DINAS PUPR KABUPATEN GARUT
        </div>
      </div>

      {/* Table Agenda & Attendance */}
      <table className="w-full text-xs border-collapse border border-slate-300 mt-4">
        <thead>
          <tr className="bg-slate-100 text-slate-800">
            <th className="border border-slate-300 p-2 text-center w-8">NO.</th>
            <th className="border border-slate-300 p-2 text-left w-36">NO. REGISTER SIMBG</th>
            <th className="border border-slate-300 p-2 text-left">NAMA PEMOHON & BANGUNAN</th>
            <th className="border border-slate-300 p-2 text-center w-24">WAKTU SIDANG</th>
            <th className="border border-slate-300 p-2 text-center w-24">TOKEN QR</th>
            <th className="border border-slate-300 p-2 text-center w-32">TANDA TANGAN</th>
          </tr>
        </thead>
        <tbody>
          {scheduledApps.map((app, idx) => (
            <tr key={app.id}>
              <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
              <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-900">{app.registerNumber}</td>
              <td className="border border-slate-300 p-2">
                <div className="font-bold text-slate-900">{app.applicant.name}</div>
                <div className="text-[10px] text-slate-600">{app.building.name} (Kec. {app.building.district})</div>
              </td>
              <td className="border border-slate-300 p-2 text-center font-bold">
                {app.schedule?.timeSlot || '09:00 WIB'}
              </td>
              <td className="border border-slate-300 p-2 text-center font-mono font-bold text-indigo-700 text-[10px]">
                {app.schedule?.attendanceToken ? app.schedule.attendanceToken.slice(0, 16) + '...' : 'QR-PRESENSI-GARUT'}
              </td>
              <td className="border border-slate-300 p-2 text-center text-slate-400 font-mono text-[10px]">
                {idx + 1}. ....................
              </td>
            </tr>
          ))}

          {scheduledApps.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-6 text-slate-400 italic">
                Belum ada permohonan yang dijadwalkan pada sidang ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Signatures: Operator SIMBG & Ketua Rapat Konsultasi TPA/TPT */}
      <div className="pt-6 flex justify-between items-end break-inside-avoid text-xs font-mono border-t border-slate-300">
        <div className="border border-slate-200 bg-slate-50/50 p-3 text-center w-64">
          <div className="font-bold text-slate-800 uppercase text-[10px]">PETUGAS PRESENSI / OPERATOR</div>
          <div className="font-bold text-slate-900 uppercase text-[10px]">SIMBG DPUPR KABUPATEN GARUT</div>
          <div className="h-16 flex items-center justify-center gap-2 my-1">
            {operatorSig.signatureDataUrl ? (
              <div className="flex flex-col items-center">
                <img src={operatorSig.signatureDataUrl} alt="TTD Operator" className="h-12 max-w-[90px] object-contain" />
                <span className="text-[6.5pt] text-slate-400">TTD Digital</span>
              </div>
            ) : null}
            <div className="flex flex-col items-center">
              <img src={operatorQr} alt="QR Operator" className="w-12 h-12 border border-slate-300 p-0.5 bg-white shadow-2xs" />
              <span className="text-[6.5pt] text-indigo-900 font-bold">TTE OPERATOR</span>
            </div>
          </div>
          <div className="font-bold text-slate-900 underline uppercase">{operatorSig.name || 'H. IRWAN KURNIA, S.ST'}</div>
          <div className="text-[10px] text-slate-600 font-mono">NIP. {operatorSig.nip || '19880512 201101 1 003'}</div>
        </div>

        <div className="text-center space-y-1 border border-slate-200 bg-slate-50/50 p-3 w-64">
          <div className="whitespace-nowrap text-[10px]">Garut, {nextFridayDate}</div>
          <div className="font-bold text-slate-800 uppercase text-[10px]">KETUA RAPAT KONSULTASI TEKNIS</div>
          <div className="font-bold text-indigo-950 uppercase text-[10px]">TIM PROFESI AHLI (TPA) / TPT GARUT</div>
          <div className="h-16 flex items-center justify-center">
            <div className="border border-dashed border-slate-300 px-3 py-1.5 text-[8px] text-slate-400 font-mono">
              [ PARAF KETUA SIDANG ]
            </div>
          </div>
          <div className="font-bold text-slate-900 underline uppercase">IR. H. DEDI SUPRIADI, ST., MT</div>
          <div className="text-[10px] text-slate-600 font-mono">KETUA RAPAT KONSULTASI TPA/TPT</div>
        </div>
      </div>

      {/* Real-time Bottom Verification Footer */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[7.5pt] font-mono text-slate-600 bg-slate-50 p-2 border">
        <div className="flex items-center gap-2">
          <img src={operatorQr} alt="QR Realtime" className="w-7 h-7 border border-slate-300 p-0.5 bg-white shrink-0" />
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>VERIFIKASI REAL-TIME: DAFTAR HADIR SIDANG TPA/TPT // DPUPR KAB. GARUT</span>
          </div>
        </div>
        <div className="text-right text-[7pt] text-slate-500 font-mono">
          <div>TOTAL AGENDA: {scheduledApps.length} PEMOHON</div>
        </div>
      </div>

    </div>
  );
};
