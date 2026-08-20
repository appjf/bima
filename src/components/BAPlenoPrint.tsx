import React from 'react';
import { Application } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { getSavedSignatures, generateSignatureQrPayload } from '../lib/signatureEngine';
import { ShieldCheck, Calendar, CheckSquare, Users } from 'lucide-react';

interface BAPlenoPrintProps {
  application: Application;
  plenoDate?: string;
  baPlenoNumber?: string;
  conclusion?: 'DISETUJUI_PENERBITAN_PBG' | 'DITOLAK';
  notes?: string;
  arsitekturNotes?: string[];
  strukturNotes?: string[];
  mepNotes?: string[];
}

export const BAPlenoPrint: React.FC<BAPlenoPrintProps> = ({
  application,
  plenoDate,
  baPlenoNumber,
  conclusion = 'DISETUJUI_PENERBITAN_PBG',
  notes,
  arsitekturNotes,
  strukturNotes,
  mepNotes
}) => {
  const savedSignatures = getSavedSignatures();
  const kabidSig = savedSignatures.kabid; // Kepala Dinas PUPR/Kabid Tata Bangunan
  const pengawasSig = savedSignatures.pengawas; // Mirza Fathir / Dedi Kurniawan

  const baNumber = baPlenoNumber || application.baPleno?.baPlenoNumber || `080/TPA-P/VII/${new Date().getFullYear()}`;
  const currentDateFormatted = plenoDate || application.baPleno?.plenoDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const qrImageSrc = pengawasSig.qrCodeUrl || generateSignatureQrPayload(pengawasSig, baNumber);

  const isSlf = application.registerNumber.toUpperCase().includes('SLF') || 
                (application.building?.functionType?.toUpperCase() || '').includes('SLF');

  // Load Arsitektur Notes
  const arsitNotes = arsitekturNotes || application.baPleno?.arsitekturNotes || [
    'Lahan diperbolehkan untuk Fungsi Bangunan Usaha, sub fungsi Bangunan Wisata dan Rekreasi; Bangunan Gedung Perhotelan berdasarkan KRK.',
    'Tenaga Ahli Arsitektur sudah sesuai.',
    'Sudah melampirkan gambar detail arsitektur lengkap.',
    'Sudah melampirkan gambar jalur evakuasi pada rencana tata ruang dalam dan luar.',
    'Gambar Arsitektur sudah lengkap dan memenuhi syarat.'
  ];

  // Load Struktur Notes
  const strukNotes = strukturNotes || application.baPleno?.strukturNotes || [
    'Pemohon menginformasikan bangunan belum dibangun / dibangun setelah PBG terbit.',
    'Tenaga ahli struktur sudah tersedia bersertifikat kompetensi kerja (SKK).',
    'Lokasi/lahan telah diperbolehkan untuk dibangun menurut KRK.',
    'Perhitungan struktur atas dan struktur bawah sudah ada.',
    'Legalitas tandatangan dokumen perhitungan struktur oleh tenaga ahli yang kompeten ber-SKK.'
  ];

  // Load MEP Notes
  const mechanicalNotes = mepNotes || application.baPleno?.mepNotes || [
    'Perencanaan pembangunan sudah memiliki tenaga ahli MEP.',
    'Peruntukan lahan sudah sesuai dengan KRK.',
    'Bangunan belum terbangun 100%.',
    'Spesifikasi dan desain Mekanikal, Elektrikal dan Plambing lengkap.',
    'Sudah menghitung kebutuhan sesuai luasan dan kapasitas.',
    'Sudah melengkapi SLD atau diagram pengawatan.'
  ];

  const attendeesList = [
    { name: 'Mirza Fathir, ST., MT', role: 'Ketua Pleno merangkap TPA Arsitektur' },
    { name: 'Ir. Eko Waluyodjati, ST., MT', role: 'Anggota TPA Struktur' },
    { name: 'Saepul Ulum, ST', role: 'Anggota TPA Mekanikal Elektrikal' },
    { name: application.applicant.name, role: 'Pemilik (Owner)' },
    { name: application.applicant.name === 'PT. Agro Intan Perkasa' ? 'Ar. Hari Ramdhani, IAI' : 'Ar. Hari Ramdhani, IAI (Pemohon/TA)' , role: 'Pemohon / Tenaga Ahli' }
  ];

  return (
    <div 
      id="printable-ba-pleno-area" 
      className="bg-white text-slate-900 p-12 font-serif w-full max-w-[210mm] min-h-[297mm] mx-auto text-xs space-y-4 leading-relaxed border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
    >
      {/* Kop Surat Resmi */}
      <OfficialLetterhead />

      {/* Title Berita Acara */}
      <div className="text-center space-y-1 py-2 border-b-2 border-slate-900">
        <h1 className="font-extrabold text-[12pt] uppercase tracking-wide">
          BERITA ACARA PLENO TPA
        </h1>
        <div className="text-[10pt] font-mono font-bold text-slate-800">
          NOMOR: {baNumber}
        </div>
      </div>

      {/* Opening Statement */}
      <div className="text-[10pt] text-justify space-y-2.5">
        <p className="indent-8 mt-2">
          Pleno Tim Profesi Ahli (TPA) / Tim Penilai Teknis (TPT) Kabupaten Garut yang memeriksa dokumen rencana teknis pada hari <strong>Kamis</strong>, Tanggal <strong>{currentDateFormatted}</strong>, atas permohonan penerbitan Persetujuan Bangunan Gedung (PBG) dengan data sebagai berikut:
        </p>

        {/* Identitas Permohonan */}
        <div className="border border-slate-400 p-3 bg-slate-50/50 font-sans text-[9pt] leading-relaxed my-2">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-40 py-0.5 text-slate-600 font-semibold">Nama Bangunan</td>
                <td className="w-3 py-0.5">:</td>
                <td className="py-0.5 font-bold text-slate-900">{application.building.name}</td>
              </tr>
              <tr>
                <td className="py-0.5 text-slate-600 font-semibold">Bangunan Gedung</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">
                  Fungsi {application.building.functionType}, Kompleksitas {application.building.complexity} 
                  {application.building.subFunction ? ` (${application.building.subFunction})` : ''}
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-slate-600 font-semibold">Lokasi di</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">
                  {application.building.address}, Kec. {application.building.district}, Kabupaten Garut, Jawa Barat
                </td>
              </tr>
              <tr>
                <td className="py-0.5 text-slate-600 font-semibold">Nomor PPBG</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-mono font-bold text-indigo-950">{application.registerNumber}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="font-bold underline text-slate-950 font-sans text-[9.5pt] pt-1">
          Masukan dan saran untuk:
        </p>

        {/* A. Bidang Arsitektur */}
        <div className="space-y-1 pl-2">
          <h3 className="font-bold text-slate-950 font-sans text-[9.5pt] flex items-center gap-1.5">
            <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[9px] font-mono">A</span>
            <span>Bidang Arsitektur</span>
          </h3>
          <ol className="list-decimal pl-7 space-y-1 text-[9pt] text-slate-800">
            {arsitNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ol>
        </div>

        {/* B. Bidang Struktur */}
        <div className="space-y-1 pl-2 pt-2">
          <h3 className="font-bold text-slate-950 font-sans text-[9.5pt] flex items-center gap-1.5">
            <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[9px] font-mono">B</span>
            <span>Bidang Struktur</span>
          </h3>
          <ol className="list-decimal pl-7 space-y-1 text-[9pt] text-slate-800">
            {strukNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ol>
        </div>

        {/* C. Bidang Mekanikal, Elektrikal dan Plumbing */}
        <div className="space-y-1 pl-2 pt-2 break-inside-avoid">
          <h3 className="font-bold text-slate-950 font-sans text-[9.5pt] flex items-center gap-1.5">
            <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[9px] font-mono">C</span>
            <span>Bidang Mekanikal, Elektrikal dan Plumbing (MEP)</span>
          </h3>
          <ol className="list-decimal pl-7 space-y-1 text-[9pt] text-slate-800">
            {mechanicalNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ol>
        </div>

        {/* MEMUTUSKAN UNTUK */}
        <div className="mt-4 pt-2 border-t border-slate-300 break-inside-avoid">
          <p className="font-bold text-slate-950 font-sans text-[9.5pt] mb-2 uppercase tracking-wide">
            MEMUTUSKAN UNTUK:
          </p>
          <div className="space-y-1.5 font-sans text-[9pt] pl-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border border-slate-900 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold">X</span>
              </div>
              <span className="font-bold text-slate-900">Merekomendasikan penerbitan Persetujuan Bangunan Gedung (PBG)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-4 h-4 border border-slate-300 flex items-center justify-center shrink-0"></div>
              <span>Memperbaiki / menyempurnakan dokumen rencana teknis</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <div className="w-4 h-4 border border-slate-300 flex items-center justify-center shrink-0"></div>
              <span>Merubah / mengganti rencana teknis</span>
            </div>
          </div>
        </div>

        {/* MENGINGATKAN UNTUK */}
        <div className="bg-slate-50 border-l-4 border-indigo-600 p-2.5 my-3 font-sans text-[8.5pt] leading-normal break-inside-avoid">
          <p className="font-bold text-slate-900">Mengingatkan untuk:</p>
          <p className="text-slate-700 italic">
            "Setiap bangunan yang telah selesai konstruksinya dan telah mendapatkan Persetujuan Bangunan Gedung (PBG) <strong>wajib memiliki SLF (Sertifikat Laik Fungsi)</strong> sebelum digunakan / dimanfaatkan secara fungsional."
          </p>
        </div>

        {/* KEHADIRAN */}
        <div className="pt-2 break-inside-avoid">
          <p className="font-bold text-slate-900 font-sans text-[9pt] mb-1">
            Demikian hasil Pleno TPA yang dihadiri oleh seluruh unsur terkait:
          </p>
          <div className="border border-slate-300 overflow-hidden font-sans text-[8pt]">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-900 font-bold">
                <tr>
                  <th className="p-1 text-center w-10">No</th>
                  <th className="p-1">Nama Anggota Tim / Unsur</th>
                  <th className="p-1">Keterangan Jabatan</th>
                  <th className="p-1 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendeesList.map((att, idx) => (
                  <tr key={idx}>
                    <td className="p-1 text-center font-bold">{idx + 1}</td>
                    <td className="p-1 font-bold text-slate-900">{att.name}</td>
                    <td className="p-1 text-slate-600">{att.role}</td>
                    <td className="p-1 text-center font-bold text-emerald-600">✓ HADIR / PLENO</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tanda Tangan */}
      <div className="mt-8 flex justify-between items-end break-inside-avoid pt-4">
        {/* Tembusan */}
        <div className="text-[7.5pt] font-sans text-slate-500 space-y-0.5 max-w-[240px]">
          <p className="font-bold text-slate-700 uppercase">Tembusan Kepada Yth:</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Bupati Garut (Laporan)</li>
            <li>Kepala Dinas DPMPTSP Kab. Garut</li>
            <li>Arsip Sekretariat SIMBG DPUPR</li>
          </ol>
        </div>

        {/* TTD Box */}
        <div className="text-center font-sans space-y-1 min-w-[280px]">
          <p className="text-[9pt] font-semibold text-slate-600 leading-tight">
            Garut, {currentDateFormatted}
          </p>
          <p className="text-[9.5pt] font-bold uppercase text-slate-900 leading-tight">
            Ketua Pleno merangkap TPA Arsitektur
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
              Mirza Fathir, ST., MT
            </p>
            <p className="text-[8.5pt] font-mono text-slate-600 mt-0.5">
              TPA Arsitektur Ikatan Arsitek Indonesia (IAI)
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
              <span>DOKUMEN SIDANG TPA ELEKTRONIK DPUPR KABUPATEN GARUT</span>
            </div>
            <div className="text-[6.5pt] text-slate-500 font-sans">
              Lembar Berita Acara Pleno ini sah & ditandatangani secara elektronik berlandaskan Undang-Undang ITE.
            </div>
          </div>
        </div>
        <div className="text-right text-[6.5pt] text-slate-500 shrink-0 font-mono">
          <div>DOC: {baNumber}</div>
          <div>ID: {application.registerNumber}</div>
          <div>ISO/IEC 27001 & BSrE BSSN</div>
        </div>
      </div>
    </div>
  );
};
