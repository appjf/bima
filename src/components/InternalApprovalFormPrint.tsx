import React from 'react';
import { Application } from '../types';
import { getDocumentDataSchema, DocumentDataSchema } from '../lib/dataEngine';
import { isSlfApplication } from '../lib/workflowEngine';
import { getSavedSignatures, generateSignatureQrPayload } from '../lib/signatureEngine';
import { OfficialLetterhead } from './OfficialLetterhead';
import { ShieldCheck } from 'lucide-react';

interface InternalApprovalFormPrintProps {
  application: Application;
  onClose?: () => void;
  onPrintPdf?: () => void;
}

export const InternalApprovalFormPrint: React.FC<InternalApprovalFormPrintProps> = ({
  application,
  onClose,
  onPrintPdf
}) => {
  const savedSignatures = getSavedSignatures();
  const kabidSig = savedSignatures.kabid;
  const isSlf = isSlfApplication(application);
  const docSchema: DocumentDataSchema = getDocumentDataSchema(
    application, 
    isSlf ? 'BA_VISITE' : 'SKRD'
  );

  const permitLabel = isSlf ? 'SERTIFIKAT LAIK FUNGSI (SLF)' : 'PERSETUJUAN BANGUNAN GEDUNG (PBG)';
  const formCode = isSlf ? 'FORM-DPUPR-SLF-02' : 'FORM-DPUPR-PBG-01';
  const kabidQr = kabidSig.qrCodeUrl || generateSignatureQrPayload(kabidSig, application.registerNumber);

  return (
    <div id="printable-internal-approval-area" className="bg-white text-slate-900 p-8 font-mono w-full max-w-[210mm] mx-auto text-xs space-y-5 border border-slate-300 shadow-md print:border-none print:shadow-none print:p-0 print:m-0">
      
      {/* KOP SURAT RESMI SEKRETARIAT SIMBG DPUPR GARUT */}
      <OfficialLetterhead />

      {/* FORM TITLE & METADATA HEADER */}
      <div className="text-center space-y-1">
        <div className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">
          LEMBAR VERIFIKASI INTERNAL & FORMULIR PERSETUJUAN // {formCode}
        </div>
        <h1 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-slate-900 underline">
          LEMBAR PERSETUJUAN INTERNAL & REKOMENDASI TEKNIS {permitLabel}
        </h1>
        <div className="text-xs font-bold text-indigo-950 font-mono">
          NO. AGENDA REGISTER: <span className="underline">{application.registerNumber}</span>
        </div>
        <div className="text-[10px] text-slate-600 font-mono">
          Tanggal Evaluasi: {docSchema.header.tanggalLengkap} | SIMBG ID: {application.applicationNumber || application.registerNumber}
        </div>
      </div>

      {/* SECTION 1: DATA PEMOHON & LOKASI GEOGRAFIIS */}
      <div className="space-y-1.5 border border-slate-300 p-3 bg-slate-50/50">
        <div className="font-bold text-xs text-indigo-900 uppercase border-b border-slate-300 pb-1 flex justify-between">
          <span>I. IDENTITAS PEMOHON & LOKASI BANGUNAN GEDUNG</span>
          <span className="text-[10px] text-slate-500">SSOT SCHEMAS v1.2</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div>
            <span className="text-slate-500">Nama Pemohon:</span>{' '}
            <strong className="text-slate-900">{docSchema.pemohon.nama}</strong>
          </div>
          <div>
            <span className="text-slate-500">NIK / Identitas:</span>{' '}
            <strong className="text-slate-900">{docSchema.pemohon.nik}</strong>
          </div>
          <div>
            <span className="text-slate-500">No. Telepon / WA:</span>{' '}
            <strong className="text-slate-900">{docSchema.pemohon.telepon}</strong>
          </div>
          <div>
            <span className="text-slate-500">Alamat Pemohon:</span>{' '}
            <span className="text-slate-800">{docSchema.pemohon.alamat}, Kec. {docSchema.pemohon.kecamatan}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: SPESIFIKASI TEKNIS BANGUNAN GEDUNG */}
      <div className="space-y-1.5 border border-slate-300 p-3 bg-slate-50/50">
        <div className="font-bold text-xs text-indigo-900 uppercase border-b border-slate-300 pb-1 flex justify-between">
          <span>II. SPESIFIKASI ARSITEKTUR & KLASIFIKASI GEDUNG (PP 16/2021)</span>
          <span className="text-[10px] text-slate-500">KAB. GARUT</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div>
            <span className="text-slate-500">Nama Proyek:</span>{' '}
            <strong className="text-slate-900">{docSchema.bangunan.nama}</strong>
          </div>
          <div>
            <span className="text-slate-500">Fungsi / Sub-Fungsi:</span>{' '}
            <strong className="text-slate-900">{docSchema.bangunan.fungsi} ({docSchema.bangunan.subFungsi})</strong>
          </div>
          <div>
            <span className="text-slate-500">Luas Bangunan Total:</span>{' '}
            <strong className="text-indigo-900">{docSchema.bangunan.luasBangunanM2} m²</strong> ({docSchema.bangunan.jumlahLantai} Lantai)
          </div>
          <div>
            <span className="text-slate-500">Luas Tanah / Lahan:</span>{' '}
            <strong className="text-slate-900">{docSchema.bangunan.luasTanahM2} m²</strong>
          </div>
          <div>
            <span className="text-slate-500">Lokasi Gedung:</span>{' '}
            <span className="text-slate-800">{docSchema.bangunan.alamat}, Desa {docSchema.bangunan.desa}, Kec. {docSchema.bangunan.kecamatan}</span>
          </div>
          <div>
            <span className="text-slate-500">Konsultan Perencana:</span>{' '}
            <strong className="text-slate-900">{docSchema.bangunan.namaKonsultan}</strong>
          </div>
        </div>
      </div>

      {/* SECTION 3: CHECKLIST HASIL VERIFIKASI DOKUMEN MULTI-DISIPLIN */}
      <div className="space-y-2">
        <div className="font-bold text-xs text-indigo-900 uppercase border-b border-slate-900 pb-1">
          III. REKAPITULASI HASIL VERIFIKASI TEKNIS & DOKUMEN KELENGKAPAN
        </div>
        <table className="w-full border-collapse border border-slate-300 text-[10px]">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-bold uppercase">
              <th className="border border-slate-300 p-1.5 text-center w-8">NO.</th>
              <th className="border border-slate-300 p-1.5 text-left">NAMA DOKUMEN / KELENGKAPAN</th>
              <th className="border border-slate-300 p-1.5 text-center w-28">KATEGORI</th>
              <th className="border border-slate-300 p-1.5 text-center w-28">STATUS VERIFIKASI</th>
              <th className="border border-slate-300 p-1.5 text-left">CATATAN EVALUASI DPUPR</th>
            </tr>
          </thead>
          <tbody>
            {docSchema.dokumenChecklist.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border border-slate-300 p-1.5 text-center font-bold">{row.no}</td>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{row.nama}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono text-[9px] uppercase">{row.kategori}</td>
                <td className="border border-slate-300 p-1.5 text-center font-bold font-mono text-[9px]">
                  <span className={`px-1.5 py-0.5 border ${
                    row.status === 'VALID' || row.status === 'TERUNGGAH'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : row.status === 'PERLU_PERBAIKAN'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="border border-slate-300 p-1.5 text-slate-700">{row.catatan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECTION 4: RINCIAN FORMULA RETRIBUSI PP 16/2021 */}
      <div className="space-y-1.5 border border-slate-300 p-3 bg-slate-50/50">
        <div className="font-bold text-xs text-indigo-900 uppercase border-b border-slate-300 pb-1 flex justify-between">
          <span>IV. PERHITUNGAN RETRIBUSI PERIZINAN BANGUNAN GEDUNG (SKRD)</span>
          <span className="text-[10px] text-slate-500">SHST GARUT: {docSchema.retribusi.shstFormatted}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
          <div>
            <span className="text-slate-500">Indeks Terintegrasi:</span>{' '}
            <strong>{docSchema.retribusi.indeksTerintegrasi}</strong>
          </div>
          <div>
            <span className="text-slate-500">Indeks Lokalitas:</span>{' '}
            <strong>{docSchema.retribusi.indeksLokalitas}</strong>
          </div>
          <div>
            <span className="text-slate-500">Subtotal Retribusi Bangunan:</span>{' '}
            <strong>Rp {docSchema.retribusi.subtotalBangunan.toLocaleString('id-ID')}</strong>
          </div>
          <div>
            <span className="text-slate-500">Subtotal Retribusi Prasarana:</span>{' '}
            <strong>Rp {docSchema.retribusi.subtotalPrasarana.toLocaleString('id-ID')}</strong>
          </div>
        </div>
        <div className="border-t border-slate-300 pt-1 flex justify-between items-center">
          <span className="font-bold text-slate-900 text-xs">TOTAL RETRIBUSI PENETAPAN:</span>
          <span className="font-extrabold text-indigo-950 text-sm font-mono">{docSchema.retribusi.totalRetribusiFormatted}</span>
        </div>
        <div className="text-[10px] italic text-slate-600 font-sans">
          Terbilang: {docSchema.retribusi.terbilangRupiah}
        </div>
      </div>

      {/* SECTION 5: CATATAN REKOMENDASI TEKNIS & KESIMPULAN OPERATOR */}
      <div className="border border-slate-300 p-3 space-y-1">
        <div className="font-bold text-xs text-indigo-900 uppercase border-b border-slate-300 pb-1">
          V. CATATAN KESIMPULAN REKOMENDASI TEKNIS OPERATOR DPUPR
        </div>
        <p className="text-[11px] text-slate-800 leading-relaxed font-sans font-medium">
          {application.status === 'COMPLETE' || application.status === 'READY_FOR_CONSULTATION' || application.status === 'RETRIBUTION_READY' || application.status === 'COMPLETED'
            ? `Berdasarkan hasil penelitian administrasi, verifikasi dokumen teknis, dan perhitungan retribusi daerah Kabupaten Garut, permohonan ${permitLabel} Nomor Register ${application.registerNumber} dinyatakan TELAH MEMENUHI PERSYARATAN REGULASI PP NO. 16/2021 dan direkomendasikan untuk diproses ke tahap penerbitan SKRD / Sidang Pleno TPA.`
            : `Berdasarkan evaluasi dokumen teknis awal, permohonan ${permitLabel} Nomor Register ${application.registerNumber} masih memerlukan kelengkapan/perbaikan dokumen teknis sesuai dengan catatan verifikasi pada Seksi III di atas.`
          }
        </p>
      </div>

      {/* SECTION 6: LEMBAR PENGESAHAN & SEAL DIGITAL BSRE */}
      <div className="pt-4 flex justify-between items-end break-inside-avoid text-xs font-mono border-t border-slate-400">
        
        {/* QR Seal Verification Box */}
        <div className="border border-slate-400 p-2.5 bg-slate-50 text-[9px] space-y-1 max-w-[240px]">
          <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
            <span>VERIFIKASI DIGITAL BSRE</span>
          </div>
          <div className="text-slate-600 font-mono">
            HASH: <strong className="text-slate-900">{docSchema.verifikasiDigital.qrHash}</strong>
          </div>
          <div className="text-slate-500">
            Diterbitkan oleh DPUPR Kab. Garut melalui Portal SIMBG Terpadu PP 16/2021.
          </div>
        </div>

        {/* Official Signature Box */}
        <div className="text-center space-y-1">
          <div>Garut, {docSchema.header.tanggalLengkap}</div>
          <div className="font-bold text-slate-900">KEPALA BIDANG BANGUNAN</div>
          <div className="font-bold text-slate-900 uppercase">DINAS PUPR KABUPATEN GARUT</div>
          <div className="h-16 flex items-center justify-center gap-2 my-1">
            {kabidSig.signatureDataUrl ? (
              <div className="flex flex-col items-center">
                <img src={kabidSig.signatureDataUrl} alt="TTD Kabid" className="h-14 max-w-[110px] object-contain" />
                <span className="text-[6.5pt] text-slate-400">TTD Digital</span>
              </div>
            ) : null}
            <div className="flex flex-col items-center">
              <img src={kabidQr} alt="QR Kabid" className="w-12 h-12 border border-slate-300 p-0.5 bg-white shadow-2xs" />
              <span className="text-[6.5pt] text-indigo-900 font-bold">TTE BSrE</span>
            </div>
          </div>
          <div className="font-bold text-slate-900 underline">{kabidSig.name || docSchema.verifikasiDigital.penandatangan}</div>
          <div className="text-[10px] text-slate-600 font-mono">NIP. {kabidSig.nip || docSchema.verifikasiDigital.nipPenandatangan}</div>
        </div>
      </div>

      {/* Real-time Bottom Verification Footer */}
      <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[7.5pt] font-mono text-slate-600 bg-slate-50 p-2 border">
        <div className="flex items-center gap-2">
          <img src={kabidQr} alt="QR Realtime" className="w-8 h-8 border border-slate-300 p-0.5 bg-white shrink-0" />
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>VERIFIKASI REAL-TIME LEMBAR PERSETUJUAN INTERNAL // DPUPR KAB. GARUT</span>
          </div>
        </div>
        <div className="text-right text-[7pt] text-slate-500 font-mono">
          <div>REGISTER: {application.registerNumber}</div>
        </div>
      </div>

    </div>
  );
};
