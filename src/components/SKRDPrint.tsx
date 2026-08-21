import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Application } from '../types';
import { calculateRetribution } from '../lib/retributionEngine';
import { getSavedSignatures, generateSignatureVerificationUrl } from '../lib/signatureEngine';
import { getSkrdStandardNumber } from '../utils/skrdFormatter';

interface SKRDPrintProps {
  application: Application;
  customShst?: number;
}

// Terbilang function for Indonesian
const terbilang = (n: number): string => {
  const words = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (n < 0) return "Minus " + terbilang(Math.abs(n));
  if (n < 12) return words[n];
  if (n < 20) return terbilang(n - 10) + " Belas";
  if (n < 100) return terbilang(Math.floor(n / 10)) + " Puluh " + terbilang(n % 10);
  if (n < 200) return "Seratus " + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + " Ratus " + terbilang(n % 100);
  if (n < 2000) return "Seribu " + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + " Ribu " + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + " Juta " + terbilang(n % 1000000);
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + " Miliar " + terbilang(n % 1000000000);
  return "Angka Terlalu Besar";
};

const formatCurrency = (amount: number) => {
  if (amount === 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' -';
};

const formatCurrencyWithPrefix = (amount: number) => {
  if (amount === 0) return '-';
  return 'Rp ' + new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' -';
};

export const SKRDPrint: React.FC<SKRDPrintProps> = ({ application, customShst = 3650000 }) => {
  const calc = calculateRetribution(application, customShst);
  
  const tanggal = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const jatuhTempo = new Date();
  jatuhTempo.setMonth(jatuhTempo.getMonth() + 1);
  const tanggalJatuhTempo = jatuhTempo.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const skrdNumber = getSkrdStandardNumber(application);
  const tahun = new Date().getFullYear();

  // Signature Data & QR Generation
  const savedSignatures = getSavedSignatures();
  const kabidSig = savedSignatures.kabid;
  const operatorSig = savedSignatures.operator;
  
  const kabidVerificationUrl = generateSignatureVerificationUrl(kabidSig, `SKRD_${skrdNumber}`);
  const operatorVerificationUrl = generateSignatureVerificationUrl(operatorSig, `STS_${skrdNumber}`);

  return (
    <div id="printable-skrd-doc" className="bg-white text-black font-serif w-[210mm] mx-auto text-[10px] leading-tight print:w-full">
      
      {/* Embedded print styles for page-break avoidance */}
      <style>{`
        @media print {
          table, tr, td, th, tbody, thead, .table-retribusi, .break-inside-avoid, .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-column-break-inside: avoid !important;
          }
        }
        .table-retribusi, .table-retribusi tr, .table-retribusi td, .table-retribusi th, .table-retribusi tbody {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      `}</style>
      
      {/* SECTION 1: SKRD */}
      <div className="border-[1.5px] border-black p-0 mb-2 break-inside-avoid page-break-inside-avoid">
        {/* Header Table */}
        <table className="w-full border-collapse break-inside-avoid page-break-inside-avoid">
          <tbody>
            <tr className="break-inside-avoid page-break-inside-avoid">
              <td className="w-[15%] text-center border-r-[1.5px] border-black py-2">
                <img src="/public/logo_garut.png" alt="Logo Garut" className="h-16 mx-auto object-contain" />
              </td>
              <td className="w-[45%] text-center border-r-[1.5px] border-black py-1">
                <div className="font-bold text-[11px] leading-tight">
                  PEMERINTAH KABUPATEN GARUT<br />
                  DINAS PEKERJAAN UMUM DAN<br />
                  PENATAAN RUANG
                </div>
                <div className="text-[8px] mt-1 italic">
                  Jalan Raya K.H. Cecep Syarifuddin - Tarogong Kidul<br />
                  Kode Pos 44151 - Garut
                </div>
              </td>
              <td className="w-[25%] text-center border-r-[1.5px] border-black py-1">
                <div className="font-bold text-[10px]">SURAT KETETAPAN RETRIBUSI DAERAH</div>
                <div className="font-bold text-[12px] mt-1">( S K R D )</div>
                <div className="text-left mt-2 px-2 space-y-0.5 text-[9px]">
                  <div className="grid grid-cols-[80px_5px_1fr]">
                    <span>Tanggal</span><span>:</span><span className="font-bold">{tanggal}</span>
                  </div>
                  <div className="grid grid-cols-[80px_5px_1fr]">
                    <span>Masa Retribusi</span><span>:</span><span className="font-bold">{tanggalJatuhTempo}</span>
                  </div>
                  <div className="grid grid-cols-[80px_5px_1fr]">
                    <span>Tahun</span><span>:</span><span className="font-bold">{tahun}</span>
                  </div>
                </div>
              </td>
              <td className="w-[15%] text-center py-1">
                <div className="font-bold text-[11px] mb-2 border-b border-black pb-1">Nomor</div>
                <div className="font-bold text-[14px] py-2">{skrdNumber}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Identity Section */}
        <div className="border-t-[1.5px] border-black p-2 space-y-1 break-inside-avoid page-break-inside-avoid">
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>NAMA</span><span>:</span><span className="font-bold uppercase">{application.applicant.name}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>ALAMAT</span><span>:</span><span className="uppercase">{application.applicant.address || '-'}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr] mt-2">
            <span>NOMOR POKOK WAJIB PAJAK</span><span>:</span><span className="font-bold">{application.applicant.npwp || '-'}</span>
          </div>
          <div className="grid grid-cols-[160px_10px_1fr]">
            <span>TANGGAL JATUH TEMPO</span><span>:</span><span className="font-bold">{tanggalJatuhTempo}</span>
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full border-collapse border-t-[1.5px] border-black table-retribusi break-inside-avoid page-break-inside-avoid">
          <thead>
            <tr className="bg-white break-inside-avoid page-break-inside-avoid">
              <th className="border-[1px] border-black w-[5%] py-1 text-center">NO</th>
              <th className="border-[1px] border-black w-[15%] py-1 text-center">KODE REKENING</th>
              <th className="border-[1px] border-black w-[60%] py-1 text-center uppercase">URAIAN</th>
              <th className="border-[1px] border-black w-[15%] py-1 text-center" colSpan={2}>JUMLAH (Rp)</th>
            </tr>
          </thead>
          <tbody className="break-inside-avoid page-break-inside-avoid">
            <tr className="align-top break-inside-avoid page-break-inside-avoid">
              <td className="border-x border-black text-center py-1">1</td>
              <td className="border-x border-black py-1 px-1">
                <div className="flex justify-between font-mono text-[11px] tracking-widest border border-black px-1 py-0.5">
                  <span>4</span><span>1</span><span>2</span><span>2</span><span>6</span><span>0</span><span>1</span>
                </div>
              </td>
              <td className="border-x border-black py-1 px-2">
                <div className="font-bold uppercase">PBG {application.building.name}</div>
                <div className="mt-1 space-y-0.5 text-[9px]">
                  <div className="font-bold">Luas Total Bangunan : {application.building.buildingArea} m²</div>
                  <div>* Total Biaya Retribusi Bangunan Gedung</div>
                  <div>* Total Biaya Retribusi Prasarana Gedung</div>
                  <div>* Biaya Petikan</div>
                  <div className="flex justify-between w-full">
                    <span>* Administrasi</span>
                    <span>Administrasi</span>
                  </div>
                </div>
              </td>
              <td className="border-l border-black py-1 px-1 text-left w-6">Rp</td>
              <td className="border-r border-black py-1 px-1 text-right">{formatCurrency(calc.finalRetribution)}</td>
            </tr>
            {/* Fillers to keep height consistent */}
            <tr className="h-4 break-inside-avoid page-break-inside-avoid">
              <td className="border-x border-black"></td>
              <td className="border-x border-black"></td>
              <td className="border-x border-black"></td>
              <td className="border-l border-black">Rp</td>
              <td className="border-r border-black text-right">-</td>
            </tr>
            <tr className="h-4 break-inside-avoid page-break-inside-avoid">
              <td className="border-x border-black"></td>
              <td className="border-x border-black"></td>
              <td className="border-x border-black"></td>
              <td className="border-l border-black">Rp</td>
              <td className="border-r border-black text-right">-</td>
            </tr>
            {/* Totals Section */}
            <tr className="font-bold break-inside-avoid page-break-inside-avoid">
              <td className="border border-black" colSpan={2}></td>
              <td className="border border-black px-2 py-1">Jumlah Ketetapan Pokok Retribusi</td>
              <td className="border-l border-black py-1 px-1 text-left">Rp</td>
              <td className="border-r border-black border-y py-1 px-1 text-right">{formatCurrency(calc.finalRetribution)}</td>
            </tr>
            <tr className="break-inside-avoid page-break-inside-avoid">
              <td className="border-x border-black" colSpan={2}></td>
              <td className="border-x border-black px-2 py-0.5">
                <div className="grid grid-cols-[20px_1fr]">
                  <span>:</span>
                  <div className="space-y-0.5 text-[9px]">
                    <div>a. Bunga</div>
                    <div>b. Kenaikan</div>
                  </div>
                </div>
              </td>
              <td className="border-l border-black py-1 px-1 text-left">Rp</td>
              <td className="border-r border-black py-1 px-1 text-right">-</td>
            </tr>
            <tr className="font-bold bg-white break-inside-avoid page-break-inside-avoid">
              <td className="border border-black" colSpan={2}></td>
              <td className="border border-black px-2 py-1 uppercase italic">Jumlah keseluruhan setelah dibulatkan</td>
              <td className="border-l border-black py-1 px-1 text-left border-y border-black">Rp</td>
              <td className="border-r border-black border-y py-1 px-1 text-right border-black">{formatCurrency(calc.finalRetribution)}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer SKRD */}
        <div className="p-2 space-y-2">
          <div className="flex gap-2 text-[10px]">
            <span className="font-bold italic">Dengan Huruf :</span>
            <span className="font-bold uppercase italic font-serif">({terbilang(calc.finalRetribution)} Rupiah)</span>
          </div>

          <div className="text-[8px] space-y-0.5">
            <div className="font-bold underline">PERHATIAN</div>
            <ol className="list-decimal list-outside ml-4 space-y-0">
              <li>Harap penyetoran dilakukan melalui Kasda Umum pada Bank JABAR BANTEN</li>
              <li>Apabila pembayaran retribusi melebihi jatuh tempo, maka dikenakan denda sebesar 1% setiap bulannya berdasarkan PERBUP No. 45 Tahun 2024</li>
              <li>Perhitungan Pembayaran retribusi berdasarkan PERDA NO. 1 TAHUN 2025 TENTANG PERUBAHAN PERDA KABUPATEN GARUT NO. 8 TAHUN 2023 tentang Pajak Daerah dan Retribusi Daerah</li>
              <li>Pembebasan Pembayaran retribusi berdasarkan PERBUP NO. 66 TAHUN 2024 Tentang Pembebasan Retribusi PBG bagi MBR</li>
            </ol>
          </div>

          {/* Signature SKRD */}
          <div className="grid grid-cols-2 mt-4 text-[10px]">
            <div className="space-y-1 text-[8px] pl-2">
              <div className="font-bold">CATATAN</div>
              <div>NOP : -</div>
              <div>A.N. : -</div>
            </div>
            <div className="text-center space-y-0 relative flex flex-col items-center">
              <div className="mb-1 text-[9px] w-full text-center">Garut, {tanggal}</div>
              <div className="font-bold uppercase text-[9px] w-full text-center">a.n.Kepala Dinas PUPR Kab. Garut</div>
              <div className="font-bold uppercase text-[9px] w-full text-center">Kepala Bidang Bangunan</div>
              <div className="h-16 flex items-center justify-center my-1 relative">
                {kabidSig.signatureDataUrl ? (
                  <img src={kabidSig.signatureDataUrl} alt="TTD Kabid" className="h-12 object-contain absolute z-10" />
                ) : null}
                <QRCodeSVG value={kabidVerificationUrl} size={50} level="M" />
              </div>
              <div className="font-bold uppercase underline text-[10px] w-full text-center">{kabidSig.name || 'DEDI KOMARA, ST. M,SI'}</div>
              <div className="text-[9px] w-full text-center">NIP. {kabidSig.nip || '19760527 201001 1 002'}</div>
            </div>
          </div>
        </div>

        {/* Receipt Section */}
        <div className="border-t border-black p-2 mt-2">
          <div className="flex justify-between items-end border-t border-dashed border-black pt-2">
            <div className="text-[9px] italic">........................................................................... potong disini ...........................................................................</div>
          </div>
          <div className="grid grid-cols-[1fr_1fr] mt-2 text-[9px]">
            <div className="space-y-0.5">
              <div className="grid grid-cols-[80px_5px_1fr]">
                <span>Tanda Terima</span><span>:</span><span className="border-b border-dotted border-black w-32"></span>
              </div>
              <div className="grid grid-cols-[80px_5px_1fr]">
                <span>Nama</span><span>:</span><span className="font-bold uppercase">{application.applicant.name}</span>
              </div>
              <div className="grid grid-cols-[80px_5px_1fr]">
                <span>Alamat</span><span>:</span><span>{application.building.address || '-'}</span>
              </div>
              <div className="grid grid-cols-[80px_5px_1fr] mt-2">
                <span>NPWP</span><span>:</span><span>-</span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div>No. Urut : <span className="font-bold">{skrdNumber}</span></div>
              <div className="pr-12">Garut, .............................</div>
              <div className="pr-16">Yang Menerima</div>
              <div className="h-8"></div>
              <div className="pr-4">( ............................................................ )</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: STS */}
      <div className="border-[1.5px] border-black p-0 mt-4 break-inside-avoid">
        <div className="text-center py-2 border-b-[1.5px] border-black bg-white">
          <div className="font-bold text-[12px] uppercase">PEMERINTAH KABUPATEN GARUT</div>
          <div className="font-bold text-[12px] uppercase">SURAT TANDA SETORAN</div>
          <div className="font-bold text-[12px] uppercase">( STS )</div>
        </div>

        <div className="p-3 space-y-2 text-[10px]">
          <div className="grid grid-cols-2">
            <div className="space-y-1">
              <div className="grid grid-cols-[80px_5px_1fr]">
                <span>STS No</span><span>:</span><span className="border-b border-dotted border-black">............................</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-[80px_5px_1fr]">
                <span>Bank</span><span>:</span><span className="font-bold">JABAR BANTEN Cab. Garut</span>
              </div>
              <div className="grid grid-cols-[80px_5px_1fr]">
                <span>No. Rekening</span><span>:</span><span className="font-bold">0170239201008</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>Harap diterima uang sebesar</span><span>:</span><span className="font-bold">Rp {formatCurrency(calc.finalRetribution)}</span>
            </div>
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>( dengan huruf )</span><span>:</span><span className="font-bold italic uppercase font-serif">({terbilang(calc.finalRetribution)} Rupiah)</span>
            </div>
          </div>

          <div className="grid grid-cols-[140px_10px_1fr] mt-2">
            <span>Untuk Pembayaran</span><span>:</span><span className="font-bold uppercase">Retribusi PBG {application.building.name}</span>
          </div>

          <div className="mt-2 text-[9px]">Dengan rincian penerimaan sebagai berikut :</div>

          <table className="w-full border-collapse border border-black mt-1 table-retribusi break-inside-avoid page-break-inside-avoid">
            <thead>
              <tr className="bg-white break-inside-avoid page-break-inside-avoid">
                <th className="border border-black py-1 w-[5%]">No</th>
                <th className="border border-black py-1 w-[20%]">Kode Rekening</th>
                <th className="border border-black py-1 w-[55%]">Uraian Rincian</th>
                <th className="border border-black py-1 w-[20%]">Jumlah (Rp)</th>
              </tr>
            </thead>
            <tbody className="break-inside-avoid page-break-inside-avoid">
              <tr className="align-top break-inside-avoid page-break-inside-avoid">
                <td className="border border-black text-center py-2">1</td>
                <td className="border border-black py-2 px-2 text-center font-mono">4.1.2.26.01</td>
                <td className="border border-black py-2 px-2 uppercase leading-normal">
                  <div className="font-bold">{skrdNumber}</div>
                  <div>{application.applicant.name}</div>
                  <div>{application.building.name}</div>
                  <div className="text-[8px]">{application.building.address}, {application.building.village}, {application.building.district}</div>
                </td>
                <td className="border border-black py-2 px-2 text-right">
                   {formatCurrencyWithPrefix(calc.finalRetribution)}
                </td>
              </tr>
              <tr className="font-bold break-inside-avoid page-break-inside-avoid">
                <td className="border border-black text-right px-2 py-1" colSpan={3}>JUMLAH</td>
                <td className="border border-black py-1 px-2 text-right">
                  {formatCurrencyWithPrefix(calc.finalRetribution)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-2 text-[9px]">
            Uang tersebut diterima pada tanggal : ...............................................
          </div>

          <div className="text-[8px] mt-4 space-y-0.5">
            <div className="font-bold underline">CATATAN</div>
            <ol className="list-decimal list-outside ml-4 space-y-0">
              <li>Penyetoran retribusi dilakukan melalui Kasda Umum pada Bank JABAR BANTEN</li>
              <li>Apabila pembayaran retribusi melebihi jatuh tempo, maka dikenakan denda sebesar 1% setiap bulannya berdasarkan PERBUP No. 45 Tahun 2024</li>
              <li>Perhitungan Pembayaran retribusi berdasarkan PERDA NO. 1 TAHUN 2025 TENTANG PERUBAHAN PERDA KABUPATEN GARUT NO. 8 TAHUN 2023 tentang Pajak Daerah dan Retribusi Daerah</li>
              <li>Pembebasan Pembayaran retribusi berdasarkan PERBUP NO. 66 TAHUN 2024 Tentang Pembebasan Retribusi PBG bagi MBR</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 mt-6 text-center">
            <div className="space-y-0 flex flex-col items-center">
              <div className="font-bold uppercase text-[9px] w-full text-center">a.n.Kepala Dinas PUPR Kab. Garut</div>
              <div className="font-bold uppercase text-[9px] w-full text-center">Kepala Bidang Bangunan</div>
              <div className="h-14 flex items-center justify-center my-1 relative">
                {kabidSig.signatureDataUrl ? (
                  <img src={kabidSig.signatureDataUrl} alt="TTD Kabid" className="h-10 object-contain absolute z-10" />
                ) : null}
                <QRCodeSVG value={kabidVerificationUrl} size={42} level="M" />
              </div>
              <div className="font-bold uppercase underline text-[10px] w-full text-center">{kabidSig.name || 'DEDI KOMARA, ST. M,SI'}</div>
              <div className="text-[9px] w-full text-center">NIP. {kabidSig.nip || '19760527 201001 1 002'}</div>
            </div>
            <div className="space-y-0 flex flex-col items-center">
              <div className="font-bold uppercase text-[9px] w-full text-center">&nbsp;</div>
              <div className="font-bold uppercase text-[9px] w-full text-center">Bendahara Penerimaan,</div>
              <div className="h-14 flex items-center justify-center my-1 relative">
                {operatorSig.signatureDataUrl ? (
                  <img src={operatorSig.signatureDataUrl} alt="TTD Bendahara" className="h-10 object-contain absolute z-10" />
                ) : null}
                <QRCodeSVG value={operatorVerificationUrl} size={42} level="M" />
              </div>
              <div className="font-bold uppercase underline text-[10px] w-full text-center">{operatorSig.name || 'AI PUPUN SUMIATI, SE'}</div>
              <div className="text-[9px] w-full text-center">NIP. {operatorSig.nip || '19740531 200701 2 005'}</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

