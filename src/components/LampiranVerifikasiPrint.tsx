import React from 'react';
import { getTemplateForDoc } from "../lib/templateEngine";
import { Application } from '../types';
import { MASTER_DOCUMENT_RULES } from '../lib/ruleEngine';
import { getSavedSignatures } from '../lib/signatureEngine';
import { OfficialLetterhead } from './OfficialLetterhead';

interface Props {
  application: Application;
}

export const LampiranVerifikasiPrint: React.FC<Props> = ({ application }) => {
  const savedSignatures = getSavedSignatures();
  const operatorSig = savedSignatures.operator;

  // Group documents by category
  const categories = [
    { title: 'I. DATA TANAH & SERTIFIKAT', id: 'TANAH' },
    { title: 'II. DATA UMUM & PERIZINAN DASAR', id: 'UMUM' },
    { title: 'III. DOKUMEN TEKNIS ARSITEKTUR', id: 'ARSITEKTUR' },
    { title: 'IV. DOKUMEN TEKNIS STRUKTUR', id: 'STRUKTUR' },
    { title: 'V. DOKUMEN TEKNIS MEKANIKAL, ELEKTRIKAL & PLUMBING (MEP)', id: 'MEP' }
  ];

  // Get all required rules for this specific application that are included/checked by operator
  const requiredRules = MASTER_DOCUMENT_RULES.filter(rule => {
    const doc = application.documents.find(d => d.code === rule.code);
    if (doc?.includedInDaftarSimak !== undefined) {
      return doc.includedInDaftarSimak;
    }
    return rule.isRequired(application);
  });

  // Determine overall status
  const isLengkap = !requiredRules.some(rule => {
    const doc = application.documents.find(d => d.code === rule.code);
    return !doc || doc.status !== 'VALID';
  });

  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const currentYear = new Date().getFullYear();
  const rawNotice = application.consultationNotice?.letterNumber || `045.2/${application.registerNumber.slice(-5)}/DPUPR-BG/${currentYear}`;
  const noticeNumber = rawNotice.startsWith('600.1.15') ? rawNotice : `600.1.15 / ${rawNotice}`;

  return (
    <div className="bg-white text-slate-900 font-sans w-full max-w-[210mm] mx-auto text-xs leading-normal">
      
      {/* ========================================================= */}
      {/* LEMBAR 1: SURAT PEMBERITAHUAN HASIL VERIFIKASI (RESMI)     */}
      {/* ========================================================= */}
      <div className="p-8 sm:p-10 min-h-[297mm] flex flex-col justify-between">
        <div>
          {/* KOP SURAT RESMI KEDINASAN SEKRETARIAT SIMBG DPUPR GARUT */}
          <OfficialLetterhead />

          {/* METADATA SURAT DINAS */}
          <div className="flex justify-between items-start mb-6 gap-4">
            <table className="text-xs space-y-1">
              <tbody>
                <tr>
                  <td className="pr-4 py-0.5 font-semibold text-slate-700 w-24">Nomor</td>
                  <td className="px-1 py-0.5 font-semibold">:</td>
                  <td className="py-0.5 font-mono font-bold text-slate-900">{noticeNumber}</td>
                </tr>
                <tr>
                  <td className="pr-4 py-0.5 text-slate-700">Sifat</td>
                  <td className="px-1 py-0.5">:</td>
                  <td className="py-0.5 font-semibold">Penting</td>
                </tr>
                <tr>
                  <td className="pr-4 py-0.5 text-slate-700">Lampiran</td>
                  <td className="px-1 py-0.5">:</td>
                  <td className="py-0.5">1 (satu) Berkas Daftar Simak Verifikasi</td>
                </tr>
                <tr>
                  <td className="pr-4 py-0.5 font-semibold text-slate-700 align-top">Hal</td>
                  <td className="px-1 py-0.5 align-top">:</td>
                  <td className="py-0.5 font-bold text-slate-900 align-top max-w-sm">
                    Pemberitahuan Hasil Verifikasi Kelengkapan Dokumen Permohonan SIMBG
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-right text-xs font-mono font-semibold text-slate-800 whitespace-nowrap shrink-0 ml-4">
              Garut, {todayStr}
            </div>
          </div>

          {/* TUJUAN SURAT */}
          <div className="mb-6 bg-slate-50 p-3.5 border-l-4 border-indigo-700 border border-slate-200">
            <div className="text-slate-700 font-semibold mb-1">Kepada Yth.</div>
            <div className="font-bold text-slate-900 uppercase text-sm">{application.applicant.name}</div>
            <div className="text-slate-700 text-xs mt-0.5">Pemohon PBG/SLF Bangunan Gedung: <span className="font-semibold text-slate-900">{application.building.name}</span></div>
            <div className="text-slate-600 text-xs">Alamat Pemohon: {application.applicant.address}</div>
            <div className="text-slate-600 font-mono text-[11px] mt-0.5">No. Telp / WA: {application.applicant.phone}</div>
            <div className="mt-1 font-bold text-slate-800 uppercase">di - GARUT</div>
          </div>

          {/* ISI SURAT PEMBERITAHUAN */}
          <div className="space-y-3 text-slate-800 text-justify leading-relaxed text-xs">
            <p>
              Berdasarkan Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung, Tim Verifikator Penyelenggaraan Bangunan Gedung Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut telah melakukan penelitian dan verifikasi kelengkapan dokumen administratif dan teknis permohonan Penyelenggaraan Bangunan Gedung (PBG/SLF) melalui Sistem Informasi Manajemen Bangunan Gedung (SIMBG) dengan data permohonan sebagai berikut:
            </p>

            {/* TABEL DATA PERMOHONAN */}
            <table className="w-full border-collapse border border-slate-300 text-xs my-2 bg-white">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-100 font-semibold w-48 text-slate-700">Nomor Registrasi SIMBG</td>
                  <td className="p-2 font-mono font-bold text-indigo-800">{application.registerNumber}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-100 font-semibold text-slate-700">Nama Bangunan Gedung</td>
                  <td className="p-2 font-bold text-slate-900">{application.building.name}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-100 font-semibold text-slate-700">Fungsi & Luas Bangunan</td>
                  <td className="p-2 text-slate-900">{application.building.functionType} | Luas: {application.building.buildingArea} m² ({application.building.numberOfFloors} Lantai)</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-100 font-semibold text-slate-700">Lokasi Bangunan Gedung</td>
                  <td className="p-2 text-slate-900">
                    {application.building.address}, Desa/Kel. {application.building.village}, Kec. {application.building.district}, Kabupaten Garut
                  </td>
                </tr>
              </tbody>
            </table>

            {/* HASIL KEPUTUSAN VERIFIKASI */}
            <div className={`p-4 border my-3 ${
              isLengkap 
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950' 
                : 'bg-rose-50 border-rose-400 text-rose-950'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                  isLengkap ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
                }`}>
                  HASIL VERIFIKASI DOKUMEN
                </span>
                <span className="font-bold uppercase tracking-wider text-xs">
                  {isLengkap ? 'LENGKAP / MEMENUHI SYARAT (VALID)' : 'BELUM LENGKAP / PERLU PERBAIKAN'}
                </span>
              </div>
              
              <p className="text-xs mt-1.5 leading-relaxed">
                {isLengkap ? (
                  <span>
                    Berdasarkan hasil pemeriksaan administrasi dan teknis, seluruh dokumen permohonan Saudara dinyatakan <strong>MEMENUHI SYARAT / LENGKAP</strong>. Selanjutnya, proses permohonan Saudara dapat dilanjutkan ke tahap <strong>Sidang Konsultasi Teknis Tim Profesi Ahli (TPA) / Tim Penilai Teknis (TPT) Kabupaten Garut</strong>.
                  </span>
                ) : (
                  <span>
                    Berdasarkan hasil pemeriksaan administrasi dan teknis, dokumen permohonan Saudara dinyatakan <strong>BELUM MEMENUHI SYARAT / TIDAK LENGKAP</strong>. Rincian dokumen yang wajib dilengkapi atau diperbaiki oleh Pemohon tercantum secara mendetail pada <strong>Daftar Simak Verifikasi Dokumen</strong> di halaman lampiran surat ini.
                  </span>
                )}
              </p>
            </div>

            {!isLengkap && (
              <p className="font-semibold text-rose-900 bg-amber-50 p-3 border border-amber-300">
                ⚠️ <strong>INSTRUKSI TINDAK LANJUT:</strong> Dimohon agar Saudara segera melengkapi dan mengunggah kembali berkas perbaikan dokumen melalui akun SIMBG Saudara paling lambat <strong>7 (tujuh) hari kerja</strong> sejak diterimanya surat pemberitahuan ini agar permohonan dapat diproses lebih lanjut.
              </p>
            )}

            <p>
              Demikian surat pemberitahuan ini disampaikan untuk diketahui dan dilaksanakan sebagaimana mestinya. Atas perhatian dan kerja samanya diucapkan terima kasih.
            </p>
          </div>
        </div>

        {/* TANDA TANGAN KEDINASAN & TEMBUSAN */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="flex justify-between items-end">
            
            {/* TEMBUSAN */}
            <div className="text-[10px] text-slate-600 font-sans max-w-xs space-y-0.5">
              <span className="font-bold underline text-slate-800 block mb-1">Tembusan Yth:</span>
              <p>1. Kepala Dinas PUPR Kab. Garut (sebagai laporan);</p>
              <p>2. Sekretaris Dinas PUPR Kabupaten Garut;</p>
              <p>3. Tim Profesi Ahli (TPA) / TPT Kab. Garut;</p>
              <p>4. Arsip Penyelenggaraan Bangunan Gedung DPUPR.</p>
            </div>

            {/* BLOCK TTD OPERATOR SIMBG */}
            <div className="text-center font-sans w-64">
              <p className="text-[11px] font-semibold text-slate-800 uppercase">PETUGAS VERIFIKATOR / OPERATOR SIMBG</p>
              <p className="text-xs font-bold text-slate-900 uppercase mt-0.5">DINAS PUPR KABUPATEN GARUT</p>

              {/* SPACE STAMP & TTE */}
              <div className="my-2 py-1 flex items-center justify-center gap-2">
                {operatorSig.signatureDataUrl ? (
                  <img src={operatorSig.signatureDataUrl} alt="TTD Operator" className="h-14 max-w-[110px] object-contain" />
                ) : (
                  <div className="w-16 h-16 border-2 border-indigo-900 border-dashed rounded-full flex flex-col items-center justify-center p-1 text-[8px] font-mono text-indigo-900 font-bold bg-indigo-50/50">
                    <span>PARAF</span>
                    <span>VERIFIKASI</span>
                    <span>OPERATOR</span>
                  </div>
                )}
                
                {operatorSig.qrCodeUrl ? (
                  <img src={operatorSig.qrCodeUrl} alt="QR Operator" className="w-14 h-14 border border-slate-300 p-0.5 bg-white" />
                ) : (
                  <div className="w-14 h-14 border border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-1 text-[8px] font-mono text-slate-500">
                    <span>[ QR CODE ]</span>
                    <span>OPERATOR</span>
                  </div>
                )}
              </div>

              <p className="font-bold text-xs text-slate-950 underline uppercase">{operatorSig.name || 'OPERATOR TEKNIS SIMBG'}</p>
              <p className="text-[11px] font-medium text-slate-700">NIP. {operatorSig.nip || '19880512 201101 1 003'}</p>
              <p className="text-[10px] font-mono font-semibold text-slate-800">DPUPR KABUPATEN GARUT</p>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LEMBAR 2: LAMPIRAN DAFTAR SIMAK VERIFIKASI PERMOHONAN     */}
      {/* ========================================================= */}
      <div className="p-8 sm:p-10 min-h-[297mm]" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
        
        {/* HEADER LAMPIRAN RESMI */}
        <div className="border-b-2 border-slate-950 pb-3 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold text-indigo-800 uppercase block">
              LAMPIRAN SURAT PEMBERITAHUAN HASIL VERIFIKASI
            </span>
            <span className="text-[11px] font-mono text-slate-700">
              NOMOR : {noticeNumber}
            </span>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-700">
            TANGGAL : {todayStr}
          </div>
        </div>

        {/* JUDUL DAFTAR SIMAK */}
        <div className="text-center mb-5 bg-slate-100 p-3 border border-slate-300">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 font-sans">
            DAFTAR SIMAK VERIFIKASI KELENGKAPAN DOKUMEN PERMOHONAN
          </h2>
          <div className="text-xs font-mono font-bold text-indigo-800 mt-0.5">
            NO. REGISTRASI: {application.registerNumber}
          </div>
          <div className="text-[11px] font-semibold text-slate-700 uppercase mt-0.5">
            BANGUNAN: {application.building.name} ({application.applicant.name})
          </div>
        </div>

        {/* TABEL RINCIAN CHECKLIST PER KATEGORI DOKUMEN */}
        {categories.map((cat) => {
          const categoryRules = requiredRules.filter(r => r.category === cat.id);
          if (categoryRules.length === 0) return null;
          
          return (
            <div key={cat.id} className="mb-5 break-inside-avoid">
              <h4 className="font-bold border-b-2 border-slate-900 mb-1.5 uppercase bg-slate-200 p-2 text-slate-900 text-xs font-serif">
                {cat.title}
              </h4>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[11px]">
                    <th className="border border-slate-300 p-2 w-8 text-center">No.</th>
                    <th className="border border-slate-300 p-2 w-1/3 text-left">Jenis Dokumen Persyaratan</th>
                    <th className="border border-slate-300 p-2 w-48 text-center">Hasil Verifikasi Dokumen</th>
                    <th className="border border-slate-300 p-2 text-left">Catatan & Keterangan Perbaikan</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryRules.map((rule, idx) => {
                    const existingDoc = application.documents.find(d => d.code === rule.code);
                    const status = existingDoc ? existingDoc.status : 'BELUM_ADA';
                    const notes = existingDoc?.notes || getTemplateForDoc(rule.code);
                    const isSesuai = status === 'VALID';
                    const isTidakSesuai = status === 'PERLU_PERBAIKAN' || status === 'BELUM_ADA' || status === 'TIDAK_SESUAI';
                    
                    return (
                      <tr key={rule.code} className={isTidakSesuai ? "bg-rose-50/50" : "bg-white"}>
                        <td className="border border-slate-300 p-2 text-center align-top font-mono font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 align-top">
                          <div className="font-semibold text-slate-900">{rule.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{rule.description}</div>
                        </td>
                        <td className="border border-slate-300 p-2 text-center align-top whitespace-nowrap">
                          <div className="flex items-center justify-center gap-3 font-mono text-[10px]">
                            <label className={`flex items-center gap-1 p-1 rounded ${isSesuai ? 'bg-emerald-100 border border-emerald-400 font-bold text-emerald-800' : 'text-slate-400'}`}>
                              <input type="checkbox" checked={isSesuai} readOnly className="w-3.5 h-3.5 accent-emerald-600" />
                              <span>SESUAI</span>
                            </label>
                            <label className={`flex items-center gap-1 p-1 rounded ${isTidakSesuai ? 'bg-rose-100 border border-rose-400 font-bold text-rose-800' : 'text-slate-400'}`}>
                              <input type="checkbox" checked={isTidakSesuai} readOnly className="w-3 h-3.5 accent-rose-600" />
                              <span>TIDAK SESUAI</span>
                            </label>
                          </div>
                        </td>
                        <td className="border border-slate-300 p-2 align-top text-[11px] text-slate-700">
                          {notes ? (
                            <span className={isTidakSesuai ? "font-medium text-rose-900" : ""}>{notes}</span>
                          ) : isTidakSesuai ? (
                            <span className="font-semibold text-rose-700">
                              Agar mengunggah dokumen {rule.name} yang sah, lengkap, dan sesuai ketentuan teknis.
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-mono">✓ Dokumen valid & sesuai.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* CATATAN RINGKAS TIM VERIFIKATOR */}
        <div className="mt-6 border-2 border-slate-900 p-4 text-xs bg-slate-50 break-inside-avoid">
          <h4 className="font-bold border-b border-slate-900 pb-1 mb-2 uppercase text-slate-900 font-serif">
            RINGKASAN CATATAN TIM VERIFIKATOR DPUPR KABUPATEN GARUT
          </h4>
          <div className="grid grid-cols-[180px_10px_1fr] gap-y-1.5 leading-relaxed">
            <div className="text-slate-700 font-semibold">Status Kelengkapan Dokumen</div><div>:</div>
            <div className={`font-bold uppercase ${isLengkap ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isLengkap ? 'LENGKAP & MEMENUHI SYARAT' : 'PERLU PERBAIKAN DOKUMEN'}
            </div>
            
            <div className="text-slate-700 font-semibold">Tanggal Verifikasi Selesai</div><div>:</div>
            <div className="font-mono font-semibold">{todayStr}</div>
            
            <div className="text-slate-700 font-semibold">Instruksi Tim Teknis</div><div>:</div>
            <div className="text-justify text-slate-900">
              {isLengkap ? (
                <span>Dokumen permohonan saudara telah diperiksa dan dinyatakan <strong>LENGKAP</strong>. Permohonan dapat dilanjutkan ke penetapan jadwal Sidang Konsultasi Teknis.</span>
              ) : (
                <span>Dokumen permohonan saudara dinyatakan <strong>BELUM LENGKAP</strong>. Mohon segera melengkapi dokumen yang ditandai <strong>TIDAK SESUAI</strong> pada tabel daftar simak di atas melalui akun SIMBG Saudara.</span>
              )}
            </div>
          </div>
        </div>

        {/* TTD OPERATOR SIMBG PADA LAMPIRAN DAFTAR SIMAK */}
        <div className="mt-6 flex justify-end">
          <div className="text-center font-sans w-64 border border-slate-300 bg-slate-50/50 p-3">
            <p className="text-[10px] font-semibold text-slate-700 uppercase">Petugas Verifikator / Operator SIMBG</p>
            <p className="text-[11px] font-bold text-slate-900 uppercase">DINAS PUPR KABUPATEN GARUT</p>
            
            {/* SPACE STAMP & TTE INTEGRATION */}
            <div className="my-2 py-1 flex items-center justify-center gap-2">
              {operatorSig.signatureDataUrl ? (
                <img src={operatorSig.signatureDataUrl} alt="TTD Operator" className="h-12 max-w-[100px] object-contain" />
              ) : (
                <div className="w-14 h-14 border-2 border-indigo-900 border-dashed rounded-full flex flex-col items-center justify-center p-1 text-[7px] font-mono text-indigo-900 font-bold bg-indigo-50/50">
                  <span>PARAF</span>
                  <span>VERIFIKASI</span>
                  <span>OPERATOR</span>
                </div>
              )}
              
              {operatorSig.qrCodeUrl ? (
                <img src={operatorSig.qrCodeUrl} alt="QR Operator" className="w-12 h-12 border border-slate-300 p-0.5 bg-white" />
              ) : (
                <div className="w-12 h-12 border border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-1 text-[7px] font-mono text-slate-500">
                  <span>[ QR CODE ]</span>
                  <span>OPERATOR</span>
                </div>
              )}
            </div>

            <p className="font-bold text-xs text-slate-950 underline uppercase">{operatorSig.name || 'OPERATOR TEKNIS SIMBG'}</p>
            <p className="text-[10px] font-medium text-slate-700">NIP. {operatorSig.nip || '19880512 201101 1 003'}</p>
            <p className="text-[10px] font-mono font-semibold text-slate-800">DPUPR KABUPATEN GARUT</p>
          </div>
        </div>

      </div>

    </div>
  );
};
