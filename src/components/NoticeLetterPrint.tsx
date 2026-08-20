import React from 'react';
import { Application } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { getSavedSignatures, generateSignatureQrPayload } from '../lib/signatureEngine';
import { ShieldCheck, Calendar, MapPin, Clock, Users } from 'lucide-react';

interface NoticeLetterPrintProps {
  application: Application;
  noticeDate: string;
  noticeTime: string;
  noticeRoom: string;
  assignedExperts?: { name: string; expertise: string; role: 'KETUA' | 'ANGGOTA' | 'SEKRETARIAT' }[];
}

export const NoticeLetterPrint: React.FC<NoticeLetterPrintProps> = ({
  application,
  noticeDate,
  noticeTime,
  noticeRoom,
  assignedExperts: liveExperts
}) => {
  const savedSignatures = getSavedSignatures();
  const pengawasSig = savedSignatures.pengawas;

  const letterNumber = application.consultationNotice?.letterNumber || `600.1.15/${application.id.slice(-6).toUpperCase()}/DPUPR-PBG/${new Date().getFullYear()}`;
  const qrImageSrc = pengawasSig.qrCodeUrl || generateSignatureQrPayload(pengawasSig, letterNumber);

  const isSlf = application.registerNumber.toUpperCase().includes('SLF') || 
                (application.building?.functionType?.toUpperCase() || '').includes('SLF');

  const assignedExperts = liveExperts || application.schedule?.assignedExperts || [
    { name: 'Dr. Ir. H. Hendra Setiawan, MT, IAI', expertise: 'Arsitektur', role: 'KETUA' as const },
    { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', expertise: 'Struktur', role: 'ANGGOTA' as const },
    { name: 'Rian Pratama, ST, M.Eng', expertise: 'MEP & Damkar', role: 'ANGGOTA' as const },
    { name: 'Dedi Kurniawan, S.AP', expertise: 'Sekretariat SIMBG Garut', role: 'SEKRETARIAT' as const }
  ];

  return (
    <div 
      id="printable-notice-letter-area" 
      className="bg-white text-slate-900 p-12 font-serif w-full max-w-[210mm] min-h-[297mm] mx-auto text-xs space-y-4 leading-relaxed border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
    >
      {/* Kop Surat Resmi */}
      <OfficialLetterhead />

      {/* Detail Kepala Surat */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 text-[9.5pt] font-sans">
        <div className="space-y-0.5">
          <div className="flex">
            <span className="w-20 font-bold">Nomor</span>
            <span className="w-3">:</span>
            <span className="font-mono font-bold text-slate-950">{letterNumber}</span>
          </div>
          <div className="flex">
            <span className="w-20 font-bold">Sifat</span>
            <span className="w-3">:</span>
            <span className="uppercase font-semibold">PENTING</span>
          </div>
          <div className="flex">
            <span className="w-20 font-bold">Lampiran</span>
            <span className="w-3">:</span>
            <span>1 (satu) Berkas</span>
          </div>
          <div className="flex items-start">
            <span className="w-20 font-bold">Perihal</span>
            <span className="w-3">:</span>
            <span className="font-bold underline max-w-sm leading-snug">
              Pemberitahuan Jadwal Sidang Konsultasi Teknis {isSlf ? 'SLF' : 'PBG'}
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right font-serif text-[10pt] space-y-1">
          <p>Garut, {application.consultationNotice?.issuedAt ? new Date(application.consultationNotice.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <div className="mt-2 text-left sm:text-left bg-slate-50 border border-slate-200 p-2.5">
            <p className="font-sans text-[8.5pt] text-slate-500 uppercase font-bold">Kepada Yth.</p>
            <p className="font-bold text-slate-950 text-[10pt]">{application.applicant.name}</p>
            <p className="text-[8.5pt] text-slate-700">Pemilik / Penanggung Jawab Bangunan Gedung</p>
            <p className="text-[8.5pt] text-slate-600">di Tempat</p>
          </div>
        </div>
      </div>

      {/* Pembuka Surat */}
      <div className="space-y-3 text-justify text-[10pt]">
        <p className="indent-8">
          Berdasarkan ketentuan Peraturan Pemerintah Republik Indonesia Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung, serta menindaklanjuti permohonan penerbitan <strong>{isSlf ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)'}</strong> melalui Sistem Informasi Manajemen Bangunan Gedung (SIMBG) dengan data sebagai berikut:
        </p>

        {/* Tabel Data Permohonan */}
        <div className="my-2 bg-slate-50 border border-slate-300 p-3 font-sans text-[9pt]">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-44 py-0.5 text-slate-600 font-semibold">Nomor Registrasi SIMBG</td>
                <td className="w-3 py-0.5">:</td>
                <td className="py-0.5 font-mono font-bold text-indigo-950">{application.registerNumber}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-slate-600 font-semibold">Nama Bangunan Gedung</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-bold text-slate-900">{application.building.name}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-slate-600 font-semibold">Fungsi / Kompleksitas</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">{application.building.functionType} ({application.building.complexity})</td>
              </tr>
              <tr>
                <td className="py-0.5 text-slate-600 font-semibold">Lokasi Bangunan</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">{application.building.address}, Kec. {application.building.district}, Kab. Garut</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="indent-8">
          Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut mengundang Saudara/i beserta Tim Teknis / Konsultan Pendamping untuk hadir dan mendampingi pelaksanaan <strong>Sidang Konsultasi Teknis</strong> yang akan dilaksanakan pada:
        </p>

        {/* Detail Waktu Sidang */}
        <div className="my-2 border-2 border-slate-900 p-3 font-sans text-[9.5pt] bg-indigo-50/20">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-36 py-1 font-bold text-slate-900">Hari / Tanggal</td>
                <td className="w-3 py-1 font-bold">:</td>
                <td className="py-1 font-bold text-slate-950">Jumat, {noticeDate}</td>
              </tr>
              <tr>
                <td className="py-1 font-bold text-slate-900">Waktu / Sesi</td>
                <td className="py-1 font-bold">:</td>
                <td className="py-1 font-bold text-slate-950">{noticeTime}</td>
              </tr>
              <tr>
                <td className="py-1 font-bold text-slate-900">Tempat Sidang</td>
                <td className="py-1 font-bold">:</td>
                <td className="py-1 text-slate-900 font-bold">{noticeRoom}</td>
              </tr>
              <tr>
                <td className="py-1 font-bold text-slate-900">Agenda Kegiatan</td>
                <td className="py-1 font-bold">:</td>
                <td className="py-1 text-slate-900">Sidang Pleno Konsultasi Teknis Tim Profesi Ahli (TPA) / Tim Penilai Teknis (TPT)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Daftar Ahli */}
        {assignedExperts && assignedExperts.length > 0 && (
          <div className="mt-3">
            <p className="font-bold font-sans text-[9pt] mb-1 text-slate-950 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-700" />
              <span>Tim Penilai Teknis / Tim Profesi Ahli (TPA) yang ditugaskan:</span>
            </p>
            <div className="border border-slate-400 overflow-hidden font-sans text-[8.5pt]">
              <table className="w-full text-left">
                <thead className="bg-slate-100 border-b border-slate-400 text-slate-900">
                  <tr>
                    <th className="p-1 text-center w-10">No</th>
                    <th className="p-1">Nama Anggota Tim</th>
                    <th className="p-1">Bidang Keahlian</th>
                    <th className="p-1 text-center">Peran Sidang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {assignedExperts.map((expert, idx) => (
                    <tr key={idx}>
                      <td className="p-1 text-center font-bold">{idx + 1}</td>
                      <td className="p-1 font-bold text-slate-950">{expert.name}</td>
                      <td className="p-1 text-slate-700">{expert.expertise}</td>
                      <td className="p-1 text-center font-bold text-slate-800">{expert.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="indent-8 mt-3">
          Demikian surat undangan pemberitahuan ini disampaikan. Mengingat pentingnya kegiatan pemenuhan standar kelaikan fungsi bangunan gedung ini dalam rangka tertib pembangunan di Kabupaten Garut, atas perhatian dan kehadiran tepat pada waktunya kami ucapkan terima kasih.
        </p>
      </div>

      {/* Tanda Tangan */}
      <div className="mt-8 flex justify-between items-end break-inside-avoid">
        {/* Tembusan */}
        <div className="text-[8pt] font-sans text-slate-600 space-y-0.5 max-w-[240px]">
          <p className="font-bold text-slate-800 uppercase">Tembusan Yth:</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Bupati Garut (sebagai laporan)</li>
            <li>Kepala Dinas DPMPTSP Kab. Garut</li>
            <li>Camat {application.building.district}</li>
            <li>Arsip Sekretariat SIMBG</li>
          </ol>
        </div>

        {/* TTD Box */}
        <div className="text-center font-sans space-y-1 min-w-[280px]">
          <p className="text-[9.5pt] font-bold uppercase text-slate-900 leading-tight">
            Pengawas SIMBG DPUPR Kabupaten Garut
          </p>

          <div className="py-2 flex items-center justify-center gap-3">
            {pengawasSig.signatureDataUrl ? (
              <div className="flex flex-col items-center">
                <img 
                  src={pengawasSig.signatureDataUrl} 
                  alt="Tanda Tangan Digital Pengawas SIMBG" 
                  className="h-14 max-w-[120px] object-contain"
                />
              </div>
            ) : null}

            <div className="flex flex-col items-center">
              <div className="p-1 border border-slate-950 bg-white inline-block">
                <img 
                  src={qrImageSrc} 
                  alt="QR Code TTE BSrE" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="text-[6.5pt] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>TTE VALID</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10pt] font-bold text-slate-950 underline leading-none">
              {pengawasSig.name || 'Dedi Kurniawan, S.ST, MT'}
            </p>
            <p className="text-[8.5pt] font-mono text-slate-600 mt-0.5">
              NIP. {pengawasSig.nip || '19820315 200801 1 009'}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Security Verification Footer */}
      <div className="mt-8 pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[7.5pt] font-mono text-slate-700 bg-slate-50 p-2 border border-slate-300">
        <div className="flex items-center gap-2.5">
          <img 
            src={qrImageSrc} 
            alt="QR Verifikasi" 
            className="w-10 h-10 border border-slate-300 p-0.5 bg-white shrink-0" 
          />
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>VERIFIKASI KEASLIAN DOKUMEN ELEKTRONIK DPUPR GARUT</span>
            </div>
            <div className="text-[6.5pt] text-slate-500 font-sans">
              Dokumen ini sah & ditandatangani secara digital oleh <strong>{pengawasSig.name || 'Dedi Kurniawan, S.ST, MT'}</strong>. Pindai QR Code untuk validasi real-time.
            </div>
          </div>
        </div>
        <div className="text-right text-[6.5pt] text-slate-500 shrink-0 font-mono">
          <div>DOC: {letterNumber}</div>
          <div>ID: {application.registerNumber}</div>
          <div>ISO/IEC 27001 & BSrE BSSN</div>
        </div>
      </div>
    </div>
  );
};
