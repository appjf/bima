import React from 'react';
import { OfficialLetterhead } from './OfficialLetterhead';

interface AttendanceSheetProps {
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  meetingLocation: string;
  qrCodeUrl: string; // The URL for public attendance
}

export const PublicAttendanceSheet: React.FC<AttendanceSheetProps> = ({
  meetingTitle,
  meetingDate,
  meetingTime,
  meetingLocation,
  qrCodeUrl
}) => {
  return (
    <div id="printable-attendance-doc" className="bg-white text-slate-900 p-8 font-mono w-full max-w-[210mm] mx-auto text-xs space-y-4 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
      
      {/* Kop Surat Resmi */}
      <OfficialLetterhead />

      {/* Header Document */}
      <div className="text-center space-y-1 pt-2">
        <h1 className="font-extrabold text-lg uppercase tracking-wider underline">
          DAFTAR HADIR
        </h1>
        <div className="grid grid-cols-[150px_1fr] text-left mx-auto max-w-lg mt-4 gap-y-1 text-sm">
          <div className="font-bold">JUDUL RAPAT</div><div>: {meetingTitle}</div>
          <div className="font-bold">HARI/ TANGGAL</div><div>: {meetingDate}</div>
          <div className="font-bold">WAKTU</div><div>: {meetingTime}</div>
          <div className="font-bold">TEMPAT</div><div>: {meetingLocation}</div>
        </div>
      </div>

      {/* QR Code section */}
      <div className="flex justify-center my-6">
        <div className="text-center border p-4 bg-slate-50">
          <div className="font-bold mb-2">SCAN UNTUK ABSENSI</div>
          <img src={qrCodeUrl} alt="QR Absensi" className="w-40 h-40" />
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-xs border-collapse border border-slate-300 mt-4">
        <thead>
          <tr className="bg-slate-100 text-slate-800">
            <th className="border border-slate-300 p-2 text-center w-10">No.</th>
            <th className="border border-slate-300 p-2 text-center">Nama</th>
            <th className="border border-slate-300 p-2 text-center">Dinas/Instansi/Perusahaan</th>
            <th className="border border-slate-300 p-2 text-center">Jabatan</th>
            <th className="border border-slate-300 p-2 text-center w-24">Paraf</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(15)].map((_, idx) => (
            <tr key={idx} className="h-12">
              <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2 text-right font-bold text-slate-400">{idx + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
