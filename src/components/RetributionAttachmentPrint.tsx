import React from 'react';
import { Application } from '../types';
import { calculateRetribution, DEFAULT_SHST_GARUT } from '../lib/retributionEngine';
import { OfficialLetterhead } from './OfficialLetterhead';

interface RetributionAttachmentPrintProps {
  application: Application;
  customShst?: number;
}

export const RetributionAttachmentPrint: React.FC<RetributionAttachmentPrintProps> = ({ 
  application, 
  customShst = DEFAULT_SHST_GARUT 
}) => {
  const calc = application.retribution || calculateRetribution(application, customShst);
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  const d = new Date();
  const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="bg-white text-slate-900 p-8 w-full max-w-[210mm] mx-auto text-[11px] font-sans">
      <OfficialLetterhead />
      
      <div className="mt-6 text-center space-y-1">
        <h1 className="font-extrabold text-sm uppercase underline">RINCIAN PERHITUNGAN RETRIBUSI PERSETUJUAN BANGUNAN GEDUNG</h1>
        <div className="text-xs uppercase font-bold text-slate-700">BERDASARKAN LAMPIRAN II PERATURAN PEMERINTAH NOMOR 16 TAHUN 2021</div>
      </div>

      <div className="mt-8 space-y-4">
        {/* IDENTITAS PEMOHON */}
        <div>
          <h2 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">A. IDENTITAS PEMOHON & BANGUNAN GEDUNG</h2>
          <table className="w-full mt-2 border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 w-48 font-bold text-slate-600">Nomor Register</td>
                <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-800">{application.registerNumber}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold text-slate-600">Nama Pemohon</td>
                <td className="border border-slate-300 p-2 uppercase">{application.applicant.name}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold text-slate-600">Nama Bangunan Gedung</td>
                <td className="border border-slate-300 p-2">{application.building.name}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold text-slate-600">Fungsi Bangunan</td>
                <td className="border border-slate-300 p-2 uppercase">{application.building.functionType}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold text-slate-600">Lokasi / Alamat</td>
                <td className="border border-slate-300 p-2">{application.building.address}, Kec. {application.building.district}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PERHITUNGAN BANGUNAN UTAMA */}
        <div>
          <h2 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">B. PERHITUNGAN RETRIBUSI BANGUNAN GEDUNG UTAMA</h2>
          <table className="w-full mt-2 border-collapse border border-slate-300 text-center">
            <thead className="bg-slate-50 font-bold">
              <tr>
                <th className="border border-slate-300 p-2 w-10">No</th>
                <th className="border border-slate-300 p-2 text-left">Uraian / Parameter Index</th>
                <th className="border border-slate-300 p-2">Indeks</th>
                <th className="border border-slate-300 p-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2">1</td>
                <td className="border border-slate-300 p-2 text-left">Indeks Fungsi Bangunan Gedung (If)</td>
                <td className="border border-slate-300 p-2 font-mono">{calc.indexFungsi.toFixed(2)}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-slate-500">{application.building.functionType}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">2</td>
                <td className="border border-slate-300 p-2 text-left">Indeks Kompleksitas (Ik)</td>
                <td className="border border-slate-300 p-2 font-mono">{calc.indexKompleksitas.toFixed(2)}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-slate-500">{application.building.complexity}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">3</td>
                <td className="border border-slate-300 p-2 text-left">Indeks Permanensi (Ip)</td>
                <td className="border border-slate-300 p-2 font-mono">{calc.indexPermanensi.toFixed(2)}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-slate-500">{application.building.permanence}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">4</td>
                <td className="border border-slate-300 p-2 text-left">Indeks Jumlah Lantai (Il)</td>
                <td className="border border-slate-300 p-2 font-mono">{calc.indexJumlahLantai.toFixed(3)}</td>
                <td className="border border-slate-300 p-2 text-[10px] text-slate-500">{application.building.floors} Lantai</td>
              </tr>
              <tr className="bg-indigo-50 font-bold">
                <td className="border border-slate-300 p-2" colSpan={2} text-right>Indeks Terintegrasi (It = If x Ik x Ip x Il)</td>
                <td className="border border-slate-300 p-2 font-mono text-indigo-700" colSpan={2}>
                  {(calc.indexFungsi * calc.indexKompleksitas * calc.indexPermanensi * calc.indexJumlahLantai).toFixed(4)}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full mt-4 border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold w-1/3 bg-slate-50">Indeks Lokalitas (Ilo)</td>
                <td className="border border-slate-300 p-2 font-mono">{calc.indeksLokalitas} %</td>
                <td className="border border-slate-300 p-2 text-[10px] text-slate-500">Perda Kab. Garut</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Luas Bangunan (LL)</td>
                <td className="border border-slate-300 p-2 font-mono">{application.building.buildingArea} m²</td>
                <td className="border border-slate-300 p-2 text-[10px] text-slate-500">Berdasarkan Gambar Rencana</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">SHST (Standar Harga Satuan Tertinggi)</td>
                <td className="border border-slate-300 p-2 font-mono">{formatCurrency(calc.shst)} / m²</td>
                <td className="border border-slate-300 p-2 text-[10px] text-slate-500">Standar Harga Satuan Tertinggi (SK Bupati)</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 border border-slate-300 p-3 bg-emerald-50">
            <div className="font-bold text-[10px] text-slate-500 uppercase mb-1">RUMUS RETRIBUSI BANGUNAN GEDUNG (Rbg)</div>
            <div className="font-mono text-sm text-emerald-800 font-bold text-center mb-1">
              Rbg = Luas Total (LL) x Indeks Terintegrasi (It) x Indeks Lokalitas (Ilo) x SHST
            </div>
            <div className="text-right font-black text-lg text-emerald-900 border-t border-emerald-200 mt-2 pt-2">
              Rbg = {formatCurrency(calc.buildingSubtotal)}
            </div>
          </div>
        </div>

        {/* PRASARANA */}
        {calc.infrastructureItems.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="font-bold text-xs uppercase bg-slate-100 p-1.5 border border-slate-300">C. PERHITUNGAN RETRIBUSI PRASARANA BANGUNAN</h2>
            <table className="w-full mt-2 border-collapse border border-slate-300 text-center">
              <thead className="bg-slate-50 font-bold">
                <tr>
                  <th className="border border-slate-300 p-2 w-10">No</th>
                  <th className="border border-slate-300 p-2 text-left">Nama Prasarana</th>
                  <th className="border border-slate-300 p-2">Volume</th>
                  <th className="border border-slate-300 p-2">Satuan</th>
                  <th className="border border-slate-300 p-2">Indeks</th>
                  <th className="border border-slate-300 p-2">Harga Satuan (SHST x Ilo)</th>
                  <th className="border border-slate-300 p-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {calc.infrastructureItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="border border-slate-300 p-2">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 text-left">{item.name}</td>
                    <td className="border border-slate-300 p-2 font-mono">{item.volume}</td>
                    <td className="border border-slate-300 p-2">{item.unit}</td>
                    <td className="border border-slate-300 p-2 font-mono">{item.index.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold text-right">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-bold">
                  <td className="border border-slate-300 p-2 text-right" colSpan={6}>TOTAL RETRIBUSI PRASARANA (Rp)</td>
                  <td className="border border-slate-300 p-2 font-mono text-indigo-800 text-right">{formatCurrency(calc.infrastructureSubtotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TOTAL KESELURUHAN */}
        <div className="border-2 border-slate-800 p-4 bg-slate-50 break-inside-avoid">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold uppercase">1. Total Retribusi Bangunan (Rbg)</span>
            <span className="font-mono font-bold text-slate-700">{formatCurrency(calc.buildingSubtotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-2 border-b border-slate-300 pb-3">
            <span className="font-bold uppercase">2. Total Retribusi Prasarana (Rp)</span>
            <span className="font-mono font-bold text-slate-700">{formatCurrency(calc.infrastructureSubtotal)}</span>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2">
            <span className="font-black text-sm uppercase text-slate-900">NILAI RETRIBUSI PBG KESELURUHAN (Rbg + Rp)</span>
            <span className="font-mono font-black text-xl text-indigo-800 bg-white px-3 py-1 border border-indigo-200 shadow-sm">
              {formatCurrency(calc.finalRetribution)}
            </span>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="mt-12 flex justify-end break-inside-avoid">
          <div className="w-64 text-center space-y-1">
            <div className="text-[11px] mb-2">Garut, {dateStr}</div>
            <div className="font-bold text-[11px] uppercase">PETUGAS PERHITUNGAN RETRIBUSI</div>
            <div className="font-bold text-[11px] uppercase">DPUPR KABUPATEN GARUT</div>
            <div className="h-20"></div> {/* Space for signature */}
            <div className="font-bold underline uppercase text-[11px]">{calc.calculatedBy || 'TIM RETRIBUSI'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
