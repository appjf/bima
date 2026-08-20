import React from 'react';
import { Application } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { getSavedSignatures, generateSignatureQrPayload } from '../lib/signatureEngine';
import { ShieldCheck, Calendar, Users } from 'lucide-react';

interface BAKonsultasiPrintProps {
  application: Application;
  baNumber?: string;
  baDate?: string;
  sessionTitle?: string;
  arsitekturNotes?: string;
  arsitekturRevisions?: string;
  strukturNotes?: string;
  strukturRevisions?: string;
  mepNotes?: string;
  mepRevisions?: string;
  arsitekturResult?: string;
  strukturResult?: string;
  mepResult?: string;
  overallResult?: string;
  summaryNotes?: string;
}

export const BAKonsultasiPrint: React.FC<BAKonsultasiPrintProps> = ({
  application,
  baNumber,
  baDate,
  sessionTitle,
  arsitekturNotes,
  arsitekturRevisions,
  strukturNotes,
  strukturRevisions,
  mepNotes,
  mepRevisions,
  arsitekturResult,
  strukturResult,
  mepResult,
  overallResult,
  summaryNotes
}) => {
  const savedSignatures = getSavedSignatures();
  const leadSig = savedSignatures.pengawas || savedSignatures.kabid;

  const isSlf = application.registerNumber.toUpperCase().includes('SLF') || 
                (application.building?.functionType?.toUpperCase() || '').includes('SLF') ||
                application.permitType?.includes('SLF');

  const docBaNumber = baNumber || application.baKonsultasi?.baNumber || (isSlf ? `BA-KONSUL/SLF/${application.registerNumber.slice(-4)}/${new Date().getFullYear()}` : `BA-KONS/3205/DPUPR/${new Date().getFullYear()}/${application.registerNumber.slice(-4)}`);
  const docDate = baDate || application.baKonsultasi?.baDate || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sessionLabel = sessionTitle || 'Sidang Konsultasi Teknis TPA / TPT Tahap 1';
  const resultState = overallResult || application.baKonsultasi?.result || 'DISETUJUI';

  const arsitRes = arsitekturResult || application.baKonsultasi?.fieldEvaluations?.find(f => f.field === 'ARSITEKTUR')?.result || 'DISETUJUI';
  const arsitTxt = arsitekturNotes || application.baKonsultasi?.fieldEvaluations?.find(f => f.field === 'ARSITEKTUR')?.notes || 'Tata ruang, koefisien dasar bangunan (KDB), garis sempadan bangunan (GSB), dan sirkulasi memenuhi standar teknis.';

  const strukRes = strukturResult || application.baKonsultasi?.fieldEvaluations?.find(f => f.field === 'STRUKTUR')?.result || 'DISETUJUI';
  const strukTxt = strukturNotes || application.baKonsultasi?.fieldEvaluations?.find(f => f.field === 'STRUKTUR')?.notes || 'Perhitungan pembebanan struktur atas dan bawah menggunakan SNI 1726 (Beban Gempa) memenuhi persyaratan.';

  const mepRes = mepResult || application.baKonsultasi?.fieldEvaluations?.find(f => f.field === 'MEP')?.result || 'DISETUJUI';
  const mepTxt = mepNotes || application.baKonsultasi?.fieldEvaluations?.find(f => f.field === 'MEP')?.notes || 'Sistem plambing, kelistrikan (SLD), sanitasi, dan proteksi kebakaran memenuhi SNI dan standar keselamatan.';

  const qrImageSrc = leadSig?.qrCodeUrl || generateSignatureQrPayload(leadSig, docBaNumber);

  return (
    <div 
      id="printable-ba-konsultasi-area" 
      className="bg-white text-slate-900 p-12 font-serif w-full max-w-[210mm] min-h-[297mm] mx-auto text-xs space-y-4 leading-relaxed border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
    >
      {/* Kop Surat Resmi */}
      <OfficialLetterhead />

      {/* Title Berita Acara Konsultasi */}
      <div className="text-center space-y-1 py-2 border-b-2 border-slate-900">
        <h1 className="font-extrabold text-[12pt] uppercase tracking-wide">
          {isSlf ? 'BERITA ACARA RAPAT KONSULTASI TPT' : 'BERITA ACARA KONSULTASI TEKNIS PBG'}
        </h1>
        <div className="text-[9pt] font-sans text-slate-700 uppercase font-semibold">
          {sessionLabel}
        </div>
        <div className="text-[10pt] font-mono font-bold text-slate-900">
          NOMOR: {docBaNumber}
        </div>
      </div>

      {/* Opening Statement */}
      <div className="text-[10pt] text-justify space-y-2.5 font-sans">
        <p className="indent-8 mt-2">
          {isSlf 
            ? <span>Pada hari ini, tanggal <strong>{docDate}</strong>, telah dilaksanakan Rapat Konsultasi TPT Kabupaten Garut yang memeriksa dokumen kajian teknis atas permohonan Sertifikat Laik Fungsi (SLF) untuk:</span>
            : <span>Pada hari ini, tanggal <strong>{docDate}</strong>, Tim Profesi Ahli (TPA) / Tim Penilai Teknis (TPT) Kabupaten Garut telah melaksanakan Sidang Konsultasi Teknis dokumen rencana arsitektur, struktur, dan MEP untuk permohonan Persetujuan Bangunan Gedung (PBG) dengan data sebagai berikut:</span>
          }
        </p>

        {/* Identitas Permohonan */}
        <div className="border border-slate-400 p-3 bg-slate-50/50 text-[9pt] leading-relaxed my-2">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-40 py-0.5 text-slate-600 font-semibold">Nama Bangunan</td>
                <td className="w-3 py-0.5">:</td>
                <td className="py-0.5 font-bold text-slate-900">{application.building.name}</td>
              </tr>
              {!isSlf && (
                <tr>
                  <td className="py-0.5 text-slate-600 font-semibold">Jenis / Fungsi Gedung</td>
                  <td className="py-0.5">:</td>
                  <td className="py-0.5">
                    Fungsi {application.building.functionType} ({application.building.complexity})
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-0.5 text-slate-600 font-semibold">Lokasi {isSlf ? 'di' : 'Pembangunan'}</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5">
                  {application.building.address}, Kec. {application.building.district}, Kab. Garut
                </td>
              </tr>
              {isSlf ? (
                <tr>
                  <td className="py-0.5 text-slate-600 font-semibold">Nomor SLF</td>
                  <td className="py-0.5">:</td>
                  <td className="py-0.5 font-mono font-bold text-indigo-950">{application.registerNumber}</td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td className="py-0.5 text-slate-600 font-semibold">Nama Pemohon</td>
                    <td className="py-0.5">:</td>
                    <td className="py-0.5 font-bold">{application.applicant.name}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-600 font-semibold">Nomor Register SIMBG</td>
                    <td className="py-0.5">:</td>
                    <td className="py-0.5 font-mono font-bold text-indigo-950">{application.registerNumber}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {isSlf && (
          <div className="font-bold text-slate-950 text-[10pt] mt-3">Mempertimbangkan bahwa:</div>
        )}
        
        {isSlf ? (
          <p className="indent-8 text-[9pt]">
            Berdasarkan pemeriksaan substantif terhadap dokumen permohonan SLF, Laporan Kajian Teknis, data pendukung, serta hasil verifikasi dan validasi lapangan yang dilaksanakan, Tim Penilai Teknis (TPT) menyampaikan pertimbangan sebagai berikut:
          </p>
        ) : null}

        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-slate-950 text-[10pt] uppercase border-b border-slate-300 pb-1">
            {isSlf ? 'Catatan Teknis / Pertimbangan TPT:' : 'Hasil Evaluasi Tenaga Ahli (TPA / TPT) per Bidang Keahlian:'}
          </h3>

          {/* Bidang Arsitektur */}
          <div className="bg-slate-50 border border-slate-300 p-3 space-y-1">
            <div className="flex items-center justify-between font-bold text-[9.5pt]">
              <span>1. Bidang Arsitektur (Dr. Ir. H. Hendra Setiawan, MT, IAI)</span>
              <span className={`px-2 py-0.5 text-[9px] uppercase ${arsitRes === 'DISETUJUI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {arsitRes}
              </span>
            </div>
            <p className="text-[9pt] text-slate-700 pl-4 whitespace-pre-wrap">{arsitTxt}</p>
            {arsitekturRevisions && arsitekturRevisions.trim() && (
              <div className="pl-4 pt-1">
                <span className="text-[8.5pt] font-semibold text-slate-600 block mb-0.5">Daftar Revisi:</span>
                <ul className="list-disc pl-4 text-[8.5pt] text-slate-700">
                  {arsitekturRevisions.split('\n').filter(r => r.trim()).map((rev, i) => (
                    <li key={i}>{rev.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Bidang Struktur */}
          <div className="bg-slate-50 border border-slate-300 p-3 space-y-1">
            <div className="flex items-center justify-between font-bold text-[9.5pt]">
              <span>2. Bidang Struktur (Ir. Ahmad Fauzi, ST, MT, IPM)</span>
              <span className={`px-2 py-0.5 text-[9px] uppercase ${strukRes === 'DISETUJUI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {strukRes}
              </span>
            </div>
            <p className="text-[9pt] text-slate-700 pl-4 whitespace-pre-wrap">{strukTxt}</p>
            {strukturRevisions && strukturRevisions.trim() && (
              <div className="pl-4 pt-1">
                <span className="text-[8.5pt] font-semibold text-slate-600 block mb-0.5">Daftar Revisi:</span>
                <ul className="list-disc pl-4 text-[8.5pt] text-slate-700">
                  {strukturRevisions.split('\n').filter(r => r.trim()).map((rev, i) => (
                    <li key={i}>{rev.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Bidang MEP */}
          <div className="bg-slate-50 border border-slate-300 p-3 space-y-1">
            <div className="flex items-center justify-between font-bold text-[9.5pt]">
              <span>3. Bidang MEP (Rian Pratama, ST, M.Eng)</span>
              <span className={`px-2 py-0.5 text-[9px] uppercase ${mepRes === 'DISETUJUI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {mepRes}
              </span>
            </div>
            <p className="text-[9pt] text-slate-700 pl-4 whitespace-pre-wrap">{mepTxt}</p>
            {mepRevisions && mepRevisions.trim() && (
              <div className="pl-4 pt-1">
                <span className="text-[8.5pt] font-semibold text-slate-600 block mb-0.5">Daftar Revisi:</span>
                <ul className="list-disc pl-4 text-[8.5pt] text-slate-700">
                  {mepRevisions.split('\n').filter(r => r.trim()).map((rev, i) => (
                    <li key={i}>{rev.trim()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Kesimpulan */}
        {isSlf ? (
          <div className="mt-4 pt-2 border-t border-slate-300 break-inside-avoid font-sans">
            <p className="font-bold text-slate-950 font-sans text-[9.5pt] mb-2 uppercase tracking-wide">
              MEMUTUSKAN UNTUK:
            </p>
            <div className="space-y-1.5 text-[9pt] pl-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-slate-900 flex items-center justify-center shrink-0">
                  {resultState === 'DISETUJUI' && <span className="text-[10px] font-bold">X</span>}
                </div>
                <span className={resultState === 'DISETUJUI' ? 'font-bold text-slate-900' : 'text-slate-600'}>
                  Merekomendasikan Penerbitan SLF
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-slate-900 flex items-center justify-center shrink-0">
                  {resultState === 'PERBAIKAN' && <span className="text-[10px] font-bold">X</span>}
                </div>
                <span className={resultState === 'PERBAIKAN' ? 'font-bold text-slate-900' : 'text-slate-600'}>
                  Memperbaiki/ Menyempurnakan Dokumen Rencana Teknis
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-slate-900 flex items-center justify-center shrink-0">
                  {resultState === 'KONSULTASI_ULANG' && <span className="text-[10px] font-bold">X</span>}
                </div>
                <span className={resultState === 'KONSULTASI_ULANG' ? 'font-bold text-slate-900' : 'text-slate-600'}>
                  Merubah/ Mengganti Rencana Teknis
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50/60 border border-indigo-200 p-3.5 space-y-1 my-3">
            <div className="font-bold text-indigo-950 text-[10pt] uppercase">Kesimpulan Hasil Sidang Konsultasi Teknis:</div>
            <div className="text-[9.5pt] font-semibold text-slate-900">
              Status Keputusan: <span className="underline uppercase text-indigo-800">{resultState}</span>
            </div>
            <p className="text-[9pt] text-slate-700">
              {summaryNotes || application.baKonsultasi?.expertNotes || (isSlf ? 'Seluruh catatan dan hasil evaluasi teknis telah disampaikan kepada pemohon untuk kelanjutan proses perizinan SLF.' : 'Seluruh catatan dan hasil evaluasi teknis telah disampaikan kepada pemohon untuk kelanjutan proses perizinan PBG.')}
            </p>
          </div>
        )}

        <p className="indent-8 pt-3">
          {isSlf 
            ? 'Demikian hasil Konsultasi Tim Teknis.'
            : 'Demikian Berita Acara Konsultasi Teknis ini dibuat dengan sebenarnya dan ditandatangani oleh para pihak yang hadir untuk dipergunakan sebagaimana mestinya.'}
        </p>
      </div>

      {/* Signature & QR Section */}
      <div className="pt-6 grid grid-cols-2 gap-8 font-sans text-[9pt] break-inside-avoid">
        {isSlf ? (
          <div></div> // SLF doesn't have the applicant signature on the left side in the example
        ) : (
          <div className="space-y-16 text-center">
            <div>
              <p className="font-semibold">Mengetahui / Pemohon,</p>
              <p className="text-[8.5pt] text-slate-500">Pemilik / Kuasa Pemohon PBG</p>
            </div>
            <div className="pt-2">
              <p className="font-bold underline">{application.applicant.name}</p>
              <p className="text-[8pt] text-slate-500">NIK / Badan Usaha Pemohon</p>
            </div>
          </div>
        )}

        <div className="space-y-4 text-center">
          <div>
            <p className="font-semibold">{isSlf ? `Garut, ${docDate}` : `Kabupaten Garut, ${docDate}`}</p>
            <p className="font-semibold">{isSlf ? 'Ketua Rapat' : 'Ketua Tim Profesi Ahli (TPA) / TPT,'}</p>
          </div>
          <div className="flex justify-center my-2">
            <div className="p-1.5 bg-white border border-slate-300 inline-block">
              <img 
                src={qrImageSrc} 
                alt="TTE QR Code" 
                className="w-20 h-20 object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
              <div className="text-[7pt] font-mono text-slate-600 mt-0.5">BSrE / TTE Resmi</div>
            </div>
          </div>
          <div>
            <p className="font-bold underline">{leadSig?.name || (isSlf ? 'Asep Tedi Sugianto, ST., M.Si' : 'Mirza Fathir, ST., MT')}</p>
            <p className="text-[8pt] text-slate-500">NIP. {leadSig?.nip || (isSlf ? '19770525 201410 1 002' : '19820315 200801 1 009')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
