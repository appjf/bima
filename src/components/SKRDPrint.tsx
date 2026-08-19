import React from 'react';
import { Application } from '../types';
import { calculateRetribution } from '../lib/retributionEngine';
import { QrCode } from 'lucide-react';
import { getSavedSignatures } from '../lib/signatureEngine';
import { OfficialLetterhead } from './OfficialLetterhead';

interface SKRDPrintProps {
  application: Application;
  customShst?: number;
}

export const SKRDPrint: React.FC<SKRDPrintProps> = ({ application, customShst = 3250000 }) => {
  const calc = calculateRetribution(application, customShst);
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const savedSignatures = getSavedSignatures();
  const pengawasSig = savedSignatures.pengawas;
  const kabidSig = savedSignatures.kabid;

  const skrdNumber = `SKRD/3205/DPUPR/${new Date().getFullYear()}/${application.id.slice(-5).toUpperCase()}`;

  return (
    <div id="printable-skrd-doc" className="bg-white text-slate-900 p-8 font-mono w-full max-w-[210mm] mx-auto text-xs space-y-4 leading-relaxed border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
      
      {/* Kop Surat Resmi Sekretariat SIMBG DPUPR Garut */}
      <OfficialLetterhead />

      {/* Document Title & Number */}
      <div className="text-center space-y-1 pt-2">
        <h1 className="font-extrabold text-sm uppercase tracking-wider underline">
          SURAT KETETAPAN RETRIBUSI DAERAH (SKRD)
        </h1>
        <div className="text-xs font-bold text-indigo-900">
          RETRIBUSI PERSETUJUAN BANGUNAN GEDUNG (PBG) // PP NO. 16 TAHUN 2021
        </div>
        <div className="text-[11px] font-bold text-slate-700">
          NOMOR: {skrdNumber}
        </div>
      </div>

      {/* Identitas Wajib Retribusi */}
      <div className="border border-slate-300 p-3 space-y-2 bg-slate-50/50">
        <h2 className="font-bold border-b border-slate-300 pb-1 text-indigo-900 uppercase">
          I. DATA WAJIB RETRIBUSI & PERMOHONAN
        </h2>
        <div className="grid grid-cols-[180px_10px_1fr] gap-y-1 text-xs">
          <div className="text-slate-600">Nama Wajib Retribusi</div><div>:</div><div className="font-bold text-slate-900">{application.applicant.name}</div>
          <div className="text-slate-600">Nomor Registrasi SIMBG</div><div>:</div><div className="font-bold font-mono text-indigo-800">{application.registerNumber}</div>
          <div className="text-slate-600">Nomor HP / Kontak</div><div>:</div><div>{application.applicant.phone}</div>
          <div className="text-slate-600">Nama Bangunan Gedung</div><div>:</div><div className="font-semibold">{application.building.name}</div>
          <div className="text-slate-600">Lokasi Bangunan</div><div>:</div>
          <div>
            {application.building.address}, Desa/Kel. {application.building.village}, Kec. {application.building.district}, Kab. Garut
          </div>
          <div className="text-slate-600">Fungsi Bangunan</div><div>:</div><div>{application.building.functionType} ({application.building.subFunction || 'Standar'})</div>
          <div className="text-slate-600">Luas Bangunan Total</div><div>:</div><div className="font-bold">{application.building.buildingArea} m²</div>
        </div>
      </div>

      {/* Rincian Perhitungan Retribusi */}
      <div className="border border-slate-300 p-3 space-y-2">
        <h2 className="font-bold border-b border-slate-300 pb-1 text-indigo-900 uppercase">
          II. RINCIAN KALKULASI RETRIBUSI MATEMATIS (PP 16/2021)
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-300 mt-2">
          <thead>
            <tr className="bg-slate-100 text-slate-800">
              <th className="border border-slate-300 p-2 text-left">Parameter Kalkulasi</th>
              <th className="border border-slate-300 p-2 text-center">Nilai / Koefisien</th>
              <th className="border border-slate-300 p-2 text-right">Keterangan Formula</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2">Luas Bangunan Gedung (L)</td>
              <td className="border border-slate-300 p-2 text-center font-bold">{application.building.buildingArea} m²</td>
              <td className="border border-slate-300 p-2 text-right">Luas lantai fisik</td>
            </tr>
            <tr>
              <td className="border border-slate-300 p-2">Standard Harga Satuan Tertinggi (SHST Garut)</td>
              <td className="border border-slate-300 p-2 text-center font-bold">Rp {customShst.toLocaleString('id-ID')} /m²</td>
              <td className="border border-slate-300 p-2 text-right">SK Bupati Garut 2026</td>
            </tr>
            <tr>
              <td className="border border-slate-300 p-2">Indeks Terhitung Kompleksitas (I_k)</td>
              <td className="border border-slate-300 p-2 text-center font-bold">{((calc.indexFungsi || 0.15) * (calc.indexKompleksitas || 0.1)).toFixed(4)}</td>
              <td className="border border-slate-300 p-2 text-right">Metode Cross-Check Valid</td>
            </tr>
            <tr>
              <td className="border border-slate-300 p-2">Indeks Pokok Retribusi (I_p)</td>
              <td className="border border-slate-300 p-2 text-center font-bold">{(calc.indeksLokalitas || 0.5).toFixed(2)}</td>
              <td className="border border-slate-300 p-2 text-right">Parameter Wilayah & SHST</td>
            </tr>
            <tr className="bg-indigo-50/60 font-bold text-indigo-950">
              <td className="border border-slate-300 p-2.5 text-sm">TOTAL RETRIBUSI TERHUTANG (RP)</td>
              <td className="border border-slate-300 p-2.5 text-center text-sm font-extrabold text-indigo-700" colSpan={2}>
                Rp {calc.finalRetribution.toLocaleString('id-ID')},-
              </td>
            </tr>
          </tbody>
        </table>
        <div className="text-[10px] text-slate-500 italic pt-1">
          Nominal Resmi Terbilang: <span className="font-bold text-slate-800">Rp {calc.finalRetribution.toLocaleString('id-ID')} (Lunas Saat Dibayar ke Kasda bjb)</span>
        </div>
      </div>

      {/* Catatan Ketentuan & Petunjuk Pembayaran */}
      <div className="border border-slate-300 p-3 space-y-1.5 bg-amber-50/30 text-[11px]">
        <h3 className="font-bold text-amber-900 uppercase">III. PETUNJUK PEMBAYARAN KAS DAERAH</h3>
        <ol className="list-decimal list-inside space-y-1 text-slate-700">
          <li>Pembayaran dilakukan melalui **Kas Daerah Kabupaten Garut** di Seluruh Cabang **Bank bjb**.</li>
          <li>Gunakan Nomor SKRD: <strong className="font-mono text-indigo-900">{skrdNumber}</strong> sebagai kode bayar/rekening tujuan.</li>
          <li>Harap melakukan konfirmasi/upload bukti setoran ke SIMBG DPUPR Garut setelah pembayaran berhasil.</li>
        </ol>
      </div>

      {/* Pengesahan & Tanda Tangan Ganda (Pengawas SIMBG & Kabid Bangunan) */}
      <div className="pt-4 grid grid-cols-2 gap-6 items-end break-inside-avoid text-xs font-mono">
        {/* Signatory 1: Pengawas SIMBG */}
        <div className="text-center space-y-1 border border-slate-200 bg-slate-50/50 p-3">
          <div className="font-bold text-slate-800 uppercase text-[11px]">PENGAWAS PERHITUNGAN RETRIBUSI</div>
          <div className="font-bold text-indigo-950 uppercase text-[11px]">PENGAWAS SIMBG DPUPR GARUT</div>
          <div className="h-16 flex items-center justify-center gap-2 my-1">
            {pengawasSig.signatureDataUrl ? (
              <img src={pengawasSig.signatureDataUrl} alt="TTD Pengawas" className="h-14 max-w-[110px] object-contain" />
            ) : null}
            {pengawasSig.qrCodeUrl ? (
              <img src={pengawasSig.qrCodeUrl} alt="QR Pengawas" className="w-12 h-12 border border-slate-300 p-0.5 bg-white" />
            ) : (
              <div className="border border-indigo-300 bg-white px-2 py-1 text-[9px] font-bold text-indigo-900">
                [ VERIFIED BY PENGAWAS SIMBG ]
              </div>
            )}
          </div>
          <div className="font-bold text-slate-900 underline">{pengawasSig.name || 'DEDI KURNIAWAN, S.ST, MT'}</div>
          <div className="text-[10px] text-slate-600">NIP. {pengawasSig.nip || '19820315 200801 1 009'}</div>
        </div>

        {/* Signatory 2: Kepala Bidang Bangunan */}
        <div className="text-center space-y-1 border border-slate-200 bg-slate-50/50 p-3">
          <div className="text-[10px] text-slate-600 whitespace-nowrap">Garut, {currentDate}</div>
          <div className="font-bold text-slate-800 uppercase text-[11px]">a.n. KEPALA DINAS PUPR KAB. GARUT</div>
          <div className="font-bold text-indigo-950 uppercase text-[11px]">KEPALA BIDANG BANGUNAN</div>
          <div className="h-16 flex items-center justify-center gap-2 my-1">
            {kabidSig.signatureDataUrl ? (
              <img src={kabidSig.signatureDataUrl} alt="TTD Kabid" className="h-14 max-w-[110px] object-contain" />
            ) : null}
            {kabidSig.qrCodeUrl ? (
              <img src={kabidSig.qrCodeUrl} alt="QR Kabid" className="w-12 h-12 border border-slate-300 p-0.5 bg-white" />
            ) : (
              <div className="w-12 h-12 border border-slate-300 flex items-center justify-center p-0.5 bg-white">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
            )}
          </div>
          <div className="font-bold text-slate-900 underline">{kabidSig.name || 'JUJU EKA UTAMA, S.T., M.T.'}</div>
          <div className="text-[10px] text-slate-600">NIP. {kabidSig.nip || '19780512 200501 1 008'}</div>
        </div>
      </div>

    </div>
  );
};
