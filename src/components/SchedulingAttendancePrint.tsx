import React from 'react';
import { Application } from '../types';
import { getSavedSignatures } from '../lib/signatureEngine';
import { OfficialLetterhead } from './OfficialLetterhead';

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
        <div>
          <div className="font-bold text-slate-800 uppercase">PETUGAS PRESENSI / OPERATOR</div>
          <div className="font-bold text-slate-900 uppercase">SIMBG DPUPR KABUPATEN GARUT</div>
          <div className="h-16 flex items-center gap-2 my-1">
            {operatorSig.signatureDataUrl ? (
              <img src={operatorSig.signatureDataUrl} alt="TTD Operator" className="h-14 max-w-[110px] object-contain" />
            ) : null}
            {operatorSig.qrCodeUrl ? (
              <img src={operatorSig.qrCodeUrl} alt="QR Operator" className="w-12 h-12 border border-slate-300 p-0.5 bg-white" />
            ) : null}
          </div>
          <div className="font-bold text-slate-900 underline uppercase">{operatorSig.name || 'OPERATOR TEKNIS SIMBG'}</div>
          <div className="text-[10px] text-slate-600 font-mono">NIP. {operatorSig.nip || '19880512 201101 1 003'}</div>
        </div>

        <div className="text-center space-y-1">
          <div className="whitespace-nowrap">Garut, {nextFridayDate}</div>
          <div className="font-bold text-slate-800 uppercase">KETUA RAPAT KONSULTASI TEKNIS</div>
          <div className="font-bold text-indigo-950 uppercase">TIM PROFESI AHLI (TPA) / TPT GARUT</div>
          <div className="h-14"></div>
          <div className="font-bold text-slate-900 underline uppercase">IR. H. DEDI SUPRIADI, ST., MT</div>
          <div className="text-[10px] text-slate-600 font-mono">KETUA RAPAT KONSULTASI TPA/TPT</div>
        </div>
      </div>

    </div>
  );
};
