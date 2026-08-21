import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ShieldCheck, 
  QrCode, 
  Code, 
  Sparkles, 
  Download, 
  Layers, 
  Eye, 
  CheckCircle2, 
  FileCheck, 
  Calculator, 
  Compass, 
  Building 
} from 'lucide-react';
import { Application } from '../types';
import { 
  buildOfficialDocumentDataset, 
  exportDatasetToDocx, 
  exportDatasetToXlsxCsv, 
  OfficialDocumentType, 
  OfficialDocumentDataset, 
  getDocumentTitle 
} from '../lib/documentDataEngine';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';
import { SKRDPrint } from './SKRDPrint';
import { BAKonsultasiPrint } from './BAKonsultasiPrint';
import { BAPlenoPrint } from './BAPlenoPrint';
import { NoticeLetterPrint } from './NoticeLetterPrint';
import { LampiranVerifikasiPrint } from './LampiranVerifikasiPrint';
import { isSlfApplication } from '../lib/workflowEngine';

interface DocumentEngineHubProps {
  application: Application;
  onClose: () => void;
}

export const DocumentEngineHub: React.FC<DocumentEngineHubProps> = ({ application, onClose }) => {
  const [selectedDocType, setSelectedDocType] = useState<OfficialDocumentType>('SKRD');
  const [activeViewMode, setActiveViewMode] = useState<'PREVIEW' | 'PLACEHOLDERS' | 'JSON'>('PREVIEW');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Generate Single Source of Truth dataset
  const dataset: OfficialDocumentDataset = buildOfficialDocumentDataset(application, selectedDocType);

  const docTypeOptions: Array<{ id: OfficialDocumentType; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'SKRD', label: 'SKRD Retribusi Daerah', icon: Calculator },
    { id: 'BA_VISITE', label: 'BA Visite Lapangan (SLF)', icon: Compass },
    { id: 'BA_KONSULTASI', label: 'BA Sidang Konsultasi TPA/TPT', icon: FileCheck },
    { id: 'BA_PLENO', label: 'BA Sidang Pleno TPA (Rekomendasi Teknis)', icon: Layers },
    { id: 'SURAT_PEMBERITAHUAN', label: 'Surat Pemberitahuan Sidang', icon: FileText },
    { id: 'FORM_INSPEKSI_CHECKLIST', label: 'Formulir Inspeksi Checklist', icon: CheckCircle2 },
    { id: 'REKAPITULASI_RETRIBUSI_XLSX', label: 'Rekapitulasi Retribusi (XLSX)', icon: FileSpreadsheet },
    { id: 'PERNYATAAN_STANDAR_TEKNIS', label: 'Surat Pernyataan Teknis', icon: ShieldCheck },
  ];

  const handleCopyText = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrintPdf = () => {
    triggerPdfPrint('printable-ssot-document', `${selectedDocType}_${application.registerNumber}`);
  };

  const handleDownloadDocx = () => {
    exportDatasetToDocx(dataset);
  };

  const handleDownloadXlsx = () => {
    exportDatasetToXlsxCsv(dataset, selectedDocType);
  };

  const renderBaVisitePreview = () => {
    const visitDate = application.baLapangan?.visitDate || dataset.header.tanggalLengkap;
    const visitTime = application.baLapangan?.visitTime || '10:00 WIB';
    const conformityStatus = application.baLapangan?.conformityStatus === 'SESUAI_DOKUMEN' ? 'SESUAI DOKUMEN (LAIK FUNGSI)' : 'PERLU PERBAIKAN';
    const locationNotes = application.baLapangan?.locationNotes || 'Seluruh aspek struktural, arsitektural dan utilitas telah diverifikasi secara visual.';
    const recommendations = application.baLapangan?.recommendations || 'Direkomendasikan untuk diterbitkan Sertifikat Laik Fungsi (SLF) tanpa penundaan.';
    const itemsChecked = application.baLapangan?.itemsChecked || [
      { id: '1', category: 'STRUKTUR', aspectChecked: 'Pondasi dan Kolom Utama', status: 'LAIK' },
      { id: '2', category: 'ARSITEKTUR', aspectChecked: 'Fasad dan Tata Ruang Dalam', status: 'LAIK' },
      { id: '3', category: 'MEP', aspectChecked: 'Sistem Sanitasi dan Air Bersih', status: 'LAIK' },
      { id: '4', category: 'MEP', aspectChecked: 'Proteksi Kebakaran / Damkar', status: 'LAIK' }
    ];

    return (
      <div id="printable-ba-visite-area" className="bg-white text-slate-900 p-12 font-serif w-full max-w-[210mm] min-h-[297mm] mx-auto text-xs space-y-4 leading-relaxed border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Header Kop Surat DPUPR Garut */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <div className="font-bold text-xs tracking-wide">PEMERINTAH KABUPATEN GARUT</div>
          <div className="font-extrabold text-sm tracking-wider">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</div>
          <div className="text-[10px] text-slate-500 font-sans">Jalan Prof. KH. Cecep Syarifuddin No. 117 Telp. (0262) 233730 Fax (0262) 544184 Garut 44151</div>
        </div>

        {/* Document Title */}
        <div className="text-center pt-2 space-y-0.5">
          <div className="font-bold text-xs uppercase underline tracking-wider">
            BERITA ACARA PEMERIKSAAN KELAIKAN FUNGSI LAPANGAN (VISITE SLF/PBG)
          </div>
          <div className="text-[11px] text-slate-600 font-mono font-bold">
            Nomor: {application.baLapangan?.baLapanganNumber || `BA-VISITE/${application.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}/DPUPR-GRT/${new Date().getFullYear()}`}
          </div>
        </div>

        {/* Narrative */}
        <p className="text-xs pt-2">
          Pada hari ini, <strong>{visitDate}</strong> pukul <strong>{visitTime}</strong>, telah dilaksanakan pemeriksaan langsung/visite ke lokasi bangunan gedung dalam rangka permohonan penerbitan <strong>{isSlfApplication(application) ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)'}</strong>:
        </p>

        {/* Building & Applicant Specs */}
        <div className="bg-slate-50 p-4 border border-slate-200 text-xs space-y-1">
          <div className="grid grid-cols-3">
            <span className="text-slate-500 font-bold">Nama Pemilik/Pemohon</span>
            <span className="col-span-2 font-bold">: {application.applicant.name} (NIK: {application.applicant.nik})</span>
          </div>
          <div className="grid grid-cols-3">
            <span className="text-slate-500 font-bold">Nama Bangunan Gedung</span>
            <span className="col-span-2 font-bold">: {application.building.name}</span>
          </div>
          <div className="grid grid-cols-3">
            <span className="text-slate-500 font-bold">Lokasi / Alamat</span>
            <span className="col-span-2">: {application.building.address}, Kec. {application.building.district}</span>
          </div>
          <div className="grid grid-cols-3">
            <span className="text-slate-500 font-bold">Fungsi / Luas Gedung</span>
            <span className="col-span-2">: {application.building.functionType} / {application.building.buildingArea} m² ({application.building.floors} Lantai)</span>
          </div>
          <div className="grid grid-cols-3">
            <span className="text-slate-500 font-bold">Status IMB Eksisting</span>
            <span className="col-span-2 font-bold text-indigo-700">: {application.building.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG'}</span>
          </div>
        </div>

        {/* Checklist Summary */}
        <div className="space-y-3 pt-1">
          <div className="font-bold text-xs uppercase">A. Pemeriksaan Kondisi Fisik Lapangan & Kesesuaian Laporan:</div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="border border-slate-300 p-2.5 space-y-1 bg-slate-50/50">
              <div className="font-bold border-b pb-0.5 mb-1 text-xs uppercase">Kondisi Lapangan</div>
              <div>
                {application.baLapangan?.kondisiLapangan?.tanahKosong ? '☑' : '☐'} 1. Tanah kosong
              </div>
              <div>
                {application.baLapangan?.kondisiLapangan?.adaBangunanLama ? '☑' : '☐'} 2. Ada bangunan lama
                {application.baLapangan?.kondisiLapangan?.adaBangunanLama && (
                  <div className="pl-4 text-[10px] text-slate-500">
                    {application.baLapangan?.kondisiLapangan?.bongkarKeseluruhan ? '• Dibongkar keseluruhan' : ''}
                    {application.baLapangan?.kondisiLapangan?.bongkarSebagian ? '• Dibongkar sebagian' : ''}
                  </div>
                )}
              </div>
              <div>
                {application.baLapangan?.kondisiLapangan?.bangunanSudahJadi ? '☑' : '☐'} 3. Bangunan sudah jadi
              </div>
            </div>

            <div className="border border-slate-300 p-2.5 space-y-1 bg-slate-50/50">
              <div className="font-bold border-b pb-0.5 mb-1 text-xs uppercase">Kondisi Kegiatan</div>
              <div>
                {application.baLapangan?.kondisiKegiatan?.belumAdaKegiatan ? '☑' : '☐'} 1. Belum ada kegiatan
              </div>
              <div>
                {application.baLapangan?.kondisiKegiatan?.sedangAdaKegiatan ? '☑' : '☐'} 2. Sedang ada kegiatan {application.baLapangan?.kondisiKegiatan?.sedangAdaKegiatanPersen ? `(${application.baLapangan.kondisiKegiatan.sedangAdaKegiatanPersen}%)` : ''}
              </div>
              <div>
                {application.baLapangan?.kondisiKegiatan?.selesaiDikerjakan ? '☑' : '☐'} 3. Bangunan sudah selesai
              </div>
            </div>
          </div>

          {/* Checklist details */}
          <div className="space-y-1">
            <div className="font-bold text-xs uppercase">B. Verifikasi Aspek Teknis (PP 16/2021):</div>
            <div className="border border-slate-300 divide-y divide-slate-200 text-xs">
              {itemsChecked.map((item, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between">
                  <span className="font-semibold">{item.aspectChecked} ({item.category})</span>
                  <span className="font-bold text-indigo-700">[{item.status}]</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conclusion & Recommendations */}
        <div className="space-y-1 pt-1 text-xs">
          <div className="font-bold uppercase">C. Kesimpulan Kesesuaian Laporan Kelaikan:</div>
          <div className="p-2.5 bg-slate-50 border border-slate-300 font-bold text-indigo-700">
            STATUS: {conformityStatus}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Catatan Lokasi: {locationNotes}
          </p>
          <p className="text-xs text-slate-600">
            Rekomendasi: {recommendations}
          </p>
        </div>

        {/* Signatures */}
        <div className="pt-6 grid grid-cols-2 gap-6 text-center text-xs border-t border-slate-300">
          <div className="flex flex-col items-center justify-between min-h-[140px] space-y-2">
            <div className="font-bold uppercase text-slate-800">
              {application.baLapangan?.attendeesOwner?.role ? application.baLapangan.attendeesOwner.role.toUpperCase() : 'PEMOHON / YANG DIKUASAKAN'}
            </div>
            {application.baLapangan?.perwakilanTtdUrl ? (
              <div className="my-1 h-16 flex items-center justify-center">
                <img 
                  src={application.baLapangan.perwakilanTtdUrl} 
                  alt="Tanda Tangan Pemohon" 
                  className="h-16 object-contain mix-blend-multiply" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[10px] font-sans">
                (Belum ditandatangani)
              </div>
            )}
            <div>
              <div className="font-bold underline text-slate-900 uppercase">
                {application.baLapangan?.attendeesOwner?.name || application.applicant.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                NIK: {application.baLapangan?.attendeesOwner?.nik || application.applicant.nik || '-'}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between min-h-[140px] space-y-2">
            <div className="font-bold uppercase text-slate-800">
              {application.baLapangan?.isTteSigned ? 'PEJABAT PENGESAH DOKUMEN TTE' : 'PETUGAS / OPERATOR SIMBG DPUPR GARUT'}
            </div>
            {application.baLapangan?.isTteSigned ? (
              <div className="my-1 h-16 flex items-center gap-2 border border-emerald-500/30 p-1.5 bg-emerald-50/20 max-w-[190px] text-left">
                <div className="w-12 h-12 bg-white flex items-center justify-center p-0.5 border border-slate-300 shrink-0">
                  <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-[1px]">
                    {[1,0,1,1,0,1,0,1,1,1,0,0,1,0,1,1].map((v, i) => (
                      <div key={i} className={`w-full h-full ${v === 1 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] font-mono leading-tight text-slate-600">
                  <div className="font-bold text-emerald-700">TTE BSrE SAH</div>
                  <div className="truncate">SN: {application.baLapangan.tteCertificateSerial?.slice(-8)}</div>
                  <div>Date: {new Date(application.baLapangan.tteSignedAt || '').toLocaleDateString('id-ID')}</div>
                </div>
              </div>
            ) : (
              <div className="my-1 h-16 flex items-center justify-center text-slate-400 text-[9px] font-mono leading-tight">
                <div className="border border-slate-300 p-1 text-center bg-slate-50 select-none uppercase">
                  <div>DRAFT BELUM SAH TTE</div>
                  <div className="font-bold text-slate-600">SIMBG Garut TTE</div>
                </div>
              </div>
            )}
            <div>
              {application.baLapangan?.isTteSigned ? (
                <>
                  <div className="font-bold underline text-slate-900 uppercase">
                    {application.baLapangan.tteSignerName}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    NIP: {application.baLapangan.tteSignerNip}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold underline text-slate-900 uppercase">OPERATOR TEKNIS SIMBG</div>
                  <div className="text-[10px] text-slate-500 font-mono">Dinas PUPR Kabupaten Garut</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPernyataanTeknisPreview = () => {
    return (
      <div id="printable-pernyataan-teknis-area" className="bg-white text-slate-900 p-12 font-serif w-full max-w-[210mm] min-h-[297mm] mx-auto text-xs space-y-5 leading-relaxed border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Kop Surat Resmi */}
        <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
          <div className="font-bold text-sm tracking-wide">PEMERINTAH KABUPATEN GARUT</div>
          <div className="font-extrabold text-base tracking-wider">DINAS PEKERJAAN UMUM DAN PENATAAN RUANG</div>
          <div className="text-[10px] text-slate-500">Jalan Prof. KH. Cecep Syarifuddin No. 117 Telp. (0262) 233730 Fax (0262) 544184 Garut 44151</div>
        </div>

        <div className="text-center space-y-1 py-2 border-b border-slate-900">
          <h1 className="font-extrabold text-[12pt] uppercase tracking-wide">
            SURAT PERNYATAAN PEMENUHAN STANDAR TEKNIS BANGUNAN GEDUNG
          </h1>
          <div className="text-[10pt] font-mono font-bold text-slate-900">
            NOMOR: {dataset.header.nomorSurat || `3205/DPUPR/STANDAR-TEKNIS/${new Date().getFullYear()}`}
          </div>
        </div>

        <div className="text-justify space-y-3 font-sans text-xs">
          <p className="indent-8">
            Berdasarkan Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung, dengan ini Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut menyatakan bahwa bangunan gedung yang tercantum di bawah ini telah memenuhi Standar Teknis keandalan bangunan gedung yang meliputi aspek keselamatan, kesehatan, kenyamanan, dan kemudahan:
          </p>

          <table className="w-full border-collapse my-3 text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 font-bold w-[35%]">Nama Wajib Retribusi / Pemohon</td>
                <td className="py-2">: {dataset.pemohon.nama}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 font-bold">Nomor Registrasi SIMBG</td>
                <td className="py-2">: {dataset.registerNumber}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 font-bold">Nama Bangunan Gedung</td>
                <td className="py-2">: {dataset.bangunan.nama}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 font-bold">Fungsi Bangunan</td>
                <td className="py-2">: {dataset.bangunan.fungsi} ({dataset.bangunan.subFungsi})</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 font-bold">Spesifikasi Fisik</td>
                <td className="py-2">: {dataset.bangunan.jumlahLantai} Lantai (Luas: {dataset.bangunan.luasBangunanM2} m²)</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 font-bold">Lokasi Bangunan Gedung</td>
                <td className="py-2">: {dataset.bangunan.alamat}, Kec. {dataset.bangunan.kecamatan}, Kab. Garut</td>
              </tr>
            </tbody>
          </table>

          <p className="indent-8">
            Surat Pernyataan Pemenuhan Standar Teknis ini diterbitkan atas rekomendasi hasil sidang Tim Penilai Teknis (TPT) / Tim Profesi Ahli (TPA) dan pemeriksaan kelaikan fungsi lapangan yang dinyatakan laik fungsi sepenuhnya. Dokumen ini menjadi dasar mutlak untuk penerbitan Persetujuan Bangunan Gedung (PBG) dan Sertifikat Laik Fungsi (SLF) di sistem SIMBG Kementerian PUPR.
          </p>

          <p>
            Demikian surat pernyataan pemenuhan standar teknis ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.
          </p>
        </div>

        {/* Signature Area */}
        <div className="pt-6 grid grid-cols-2 gap-6 items-end font-sans text-xs">
          <div className="p-3 border border-slate-300 bg-slate-50 space-y-1">
            <div className="font-bold uppercase text-slate-900 border-b pb-1 flex items-center gap-1 text-[9px]">
              <QrCode className="w-3.5 h-3.5 text-indigo-700" />
              <span>BSrE Digital Certification</span>
            </div>
            <div className="text-[9px]">Kode Hash: <span className="font-mono">{dataset.verifikasiDigital.qrHash}</span></div>
            <div className="text-[9px]">Status: <span className="text-emerald-700 font-bold">RELEASED</span></div>
          </div>

          <div className="text-center space-y-1 font-sans">
            <div>Garut, {dataset.header.tanggalLengkap}</div>
            <div className="font-bold text-slate-900">{dataset.verifikasiDigital.penandatangan}</div>
            <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic border border-dashed border-slate-300 my-1">
              [ Tanda Tangan Elektronik BSrE Sah ]
            </div>
            <div className="font-bold text-slate-900">{dataset.verifikasiDigital.nipPenandatangan}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderDefaultSsotPreview = () => {
    return (
      <div className="bg-white text-slate-900 p-8 sm:p-10 border border-slate-300 shadow-xl font-mono leading-relaxed space-y-6 text-xs max-w-[210mm] mx-auto print:border-none print:shadow-none print:p-0">
        
        {/* Kop Surat DPUPR Garut */}
        <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4">
          <div className="w-16 h-16 bg-slate-900 text-white font-bold text-xl flex items-center justify-center shrink-0">
            GARUT
          </div>
          <div className="flex-1 text-center">
            <div className="font-bold text-sm tracking-wider uppercase">{dataset.header.pemerintah}</div>
            <div className="font-extrabold text-base tracking-widest text-indigo-950 uppercase">{dataset.header.dinas}</div>
            <div className="text-[10px] text-slate-600 font-sans mt-0.5">{dataset.header.alamat}</div>
            <div className="text-[9px] text-slate-500 font-sans">
              Telp. {dataset.header.telepon} // Website: {dataset.header.website} // Email: {dataset.header.email}
            </div>
          </div>
        </div>

        {/* Document Title Header */}
        <div className="text-center space-y-1">
          <h1 className="font-extrabold text-sm sm:text-base tracking-wide uppercase underline decoration-2">
            {dataset.documentTitle}
          </h1>
          <div className="text-xs font-bold text-indigo-950">
            NOMOR: {dataset.header.nomorSurat}
          </div>
          <div className="text-[10px] text-slate-500">
            Tanggal Terbit: {dataset.header.tanggalLengkap} // Register: {dataset.registerNumber}
          </div>
        </div>

        {/* Section I: Identitas Pemohon */}
        <div className="border border-slate-300 p-4 space-y-2 bg-slate-50">
          <h3 className="font-bold text-xs uppercase underline tracking-wider text-slate-900">
            I. IDENTITAS PEMOHON / WAJIB RETRIBUSI
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div><span className="text-slate-500">Nama Pemohon:</span> <strong>{dataset.pemohon.nama}</strong></div>
            <div><span className="text-slate-500">NIK:</span> <strong>{dataset.pemohon.nik}</strong></div>
            <div><span className="text-slate-500">No. Telepon/WA:</span> <strong>{dataset.pemohon.telepon}</strong></div>
            <div><span className="text-slate-500">Email:</span> {dataset.pemohon.email}</div>
            <div className="sm:col-span-2"><span className="text-slate-500">Alamat Pemohon:</span> {dataset.pemohon.alamat}, Kec. {dataset.pemohon.kecamatan}, {dataset.pemohon.kabupaten}</div>
          </div>
        </div>

        {/* Section II: Spesifikasi Bangunan Gedung */}
        <div className="border border-slate-300 p-4 space-y-2 bg-slate-50">
          <h3 className="font-bold text-xs uppercase underline tracking-wider text-slate-900">
            II. SPESIFIKASI BANGUNAN GEDUNG
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div><span className="text-slate-500">Nama Bangunan:</span> <strong className="text-indigo-950">{dataset.bangunan.nama}</strong></div>
            <div><span className="text-slate-500">Fungsi Bangunan:</span> <strong>{dataset.bangunan.fungsi} ({dataset.bangunan.subFungsi})</strong></div>
            <div><span className="text-slate-500">Kompleksitas:</span> {dataset.bangunan.kompleksitas}</div>
            <div><span className="text-slate-500">Permanensi:</span> {dataset.bangunan.permanensi}</div>
            <div><span className="text-slate-500">Luas Bangunan:</span> <strong>{dataset.bangunan.luasBangunanM2} m²</strong></div>
            <div><span className="text-slate-500">Jumlah Lantai:</span> <strong>{dataset.bangunan.jumlahLantai} Lantai ({dataset.bangunan.tinggiMeter} m)</strong></div>
            <div className="sm:col-span-2"><span className="text-slate-500">Lokasi Gedung:</span> {dataset.bangunan.alamat}, Kec. {dataset.bangunan.kecamatan}, Kab. Garut</div>
          </div>
        </div>

        {/* Section III: Retribusi Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase underline tracking-wider text-slate-900">
            III. PARAMETER CALCULATED RETRIBUSI (PP 16/2021)
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold">
                <th className="border border-slate-300 p-2 text-left">Parameter Kalkulasi</th>
                <th className="border border-slate-300 p-2 text-center">Nilai Koefisien</th>
                <th className="border border-slate-300 p-2 text-right">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2">Luas Bangunan (L)</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{dataset.bangunan.luasBangunanM2} m²</td>
                <td className="border border-slate-300 p-2 text-right">Luas Lantai Bangunan</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">SHST Kab. Garut (Rp/m²)</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{dataset.retribusi.shstFormatted}</td>
                <td className="border border-slate-300 p-2 text-right">SK Bupati Garut 2026</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Indeks Terintegrasi (I_k)</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{dataset.retribusi.indeksTerintegrasi}</td>
                <td className="border border-slate-300 p-2 text-right">PP 16/2021 Calculated</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">Indeks Parameter Lokalitas</td>
                <td className="border border-slate-300 p-2 text-center font-bold">{dataset.retribusi.indeksLokalitas}</td>
                <td className="border border-slate-300 p-2 text-right">Perda Kab. Garut</td>
              </tr>
              <tr className="bg-indigo-50 font-bold text-indigo-950">
                <td className="border border-slate-300 p-2 text-sm">TOTAL RETRIBUSI TERHUTANG</td>
                <td className="border border-slate-300 p-2 text-center text-sm text-indigo-700 font-extrabold" colSpan={2}>
                  {dataset.retribusi.totalRetribusiFormatted},-
                </td>
              </tr>
            </tbody>
          </table>
          <div className="text-[11px] italic text-slate-600 bg-slate-100 p-2 border border-slate-200">
            Terbilang Resmi: <strong className="text-slate-900 font-bold">"{dataset.retribusi.terbilangRupiah}"</strong>
          </div>
        </div>

        {/* Section IV: Digital Verification & Signature Box */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
          <div className="p-3 border border-slate-300 bg-slate-50 space-y-2 text-[10px]">
            <div className="font-bold uppercase text-slate-900 border-b pb-1 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-indigo-700" />
              <span>Sistem Otentikasi Digital BSrE</span>
            </div>
            <div>Kode Hash: <strong className="font-mono text-indigo-950">{dataset.verifikasiDigital.qrHash}</strong></div>
            <div>Status: <strong className="text-emerald-700 uppercase font-bold">{dataset.verifikasiDigital.statusTtd}</strong></div>
            <div className="text-[9px] text-slate-500">Dokumen ini sah tanpa cap basah sesuai UU ITE.</div>
          </div>

          <div className="text-center space-y-1">
            <div>Garut, {dataset.header.tanggalLengkap}</div>
            <div className="font-bold text-slate-900">{dataset.verifikasiDigital.penandatangan}</div>
            <div className="h-14 flex items-center justify-center text-[10px] text-slate-400 font-sans italic border border-dashed border-slate-300 my-1">
              [ Digital Signature Verified ]
            </div>
            <div className="font-bold text-slate-900">{dataset.verifikasiDigital.nipPenandatangan}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentPreview = () => {
    switch (selectedDocType) {
      case 'SKRD':
        return <SKRDPrint application={application} />;
      case 'BA_KONSULTASI':
        return <BAKonsultasiPrint application={application} />;
      case 'BA_PLENO':
        return <BAPlenoPrint application={application} />;
      case 'SURAT_PEMBERITAHUAN': {
        const noticeDate = application.schedule?.scheduleDate || application.consultationNotice?.scheduledDate || '2026-08-22';
        const noticeTime = application.schedule?.timeSlot || application.consultationNotice?.timeSlot || '08:30 - 09:15 WIB';
        const noticeRoom = application.schedule?.room || application.consultationNotice?.room || 'Ruang Sidang TPA Utama (Gedung DPUPR Garut Lt. 2)';
        const assignedExperts = application.schedule?.assignedExperts;
        return (
          <NoticeLetterPrint 
            application={application} 
            noticeDate={noticeDate} 
            noticeTime={noticeTime} 
            noticeRoom={noticeRoom} 
            assignedExperts={assignedExperts}
          />
        );
      }
      case 'FORM_INSPEKSI_CHECKLIST':
        return <LampiranVerifikasiPrint application={application} />;
      case 'BA_VISITE':
        return renderBaVisitePreview();
      case 'PERNYATAAN_STANDAR_TEKNIS':
        return renderPernyataanTeknisPreview();
      case 'REKAPITULASI_RETRIBUSI_XLSX':
      default:
        return renderDefaultSsotPreview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none max-w-6xl w-full h-full sm:h-auto sm:max-h-[95vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800 font-mono shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Layers className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base tracking-wide text-white">
                  Document Engine SSOT & Multi-Format Center
                </h2>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  v1.0 SINGLE SOURCE OF TRUTH
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Sumber Data Terpusat Terpercaya untuk PDF, DOCX (Word), dan XLSX (Excel) // SIMBG Kab. Garut
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition font-mono text-xs"
          >
            [X]
          </button>
        </div>

        {/* Document Selector & Action Toolbar */}
        <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 font-mono text-xs">
          
          {/* Document Type Selector Dropdown / Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-slate-500 font-bold uppercase text-[10px] whitespace-nowrap">Pilih Dokumen:</span>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as OfficialDocumentType)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 font-mono text-xs font-bold rounded-none focus:ring-2 focus:ring-indigo-500 max-w-xs cursor-pointer"
            >
              {docTypeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle & Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setActiveViewMode('PREVIEW')}
                className={`px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 transition ${
                  activeViewMode === 'PREVIEW' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview A4</span>
              </button>

              <button
                onClick={() => setActiveViewMode('PLACEHOLDERS')}
                className={`px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 transition ${
                  activeViewMode === 'PLACEHOLDERS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Placeholders DOCX</span>
              </button>

              <button
                onClick={() => setActiveViewMode('JSON')}
                className={`px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 transition ${
                  activeViewMode === 'JSON' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Raw SSOT JSON</span>
              </button>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-1.5 ml-auto md:ml-0">
              <button
                onClick={handlePrintPdf}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 flex items-center gap-1.5 text-xs transition shadow-xs"
                title="Export PDF / Print A4"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 flex items-center gap-1.5 text-xs transition shadow-xs"
                title="Export Template Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export DOCX</span>
              </button>

              <button
                onClick={handleDownloadXlsx}
                className="bg-teal-700 hover:bg-teal-600 text-white font-bold px-3 py-1.5 flex items-center gap-1.5 text-xs transition shadow-xs"
                title="Export Spreadsheet Excel (.xlsx / .csv)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export XLSX</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-slate-950/80 font-sans">
          
          {/* VIEW MODE 1: A4 Document Live Preview */}
          {activeViewMode === 'PREVIEW' && (
            <div className="max-w-4xl mx-auto space-y-4">
              
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Dokumen ini digenerate secara otomatis dari **Single Source of Truth (SSOT)** permohonan <strong>{application.registerNumber}</strong>.
                  </span>
                </div>
                <span className="font-bold uppercase text-[10px] bg-amber-200 dark:bg-amber-900 px-2 py-0.5 shrink-0">
                  VERIFIED SSOT
                </span>
              </div>

              {/* Printable Document Container */}
              <div id="printable-ssot-document" className="print:w-full overflow-x-auto">
                {renderDocumentPreview()}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Placeholders Mapping for DOCX Engineering */}
          {activeViewMode === 'PLACEHOLDERS' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-indigo-950 text-indigo-100 p-4 border border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2 font-mono">
                    <Code className="w-4 h-4 text-indigo-300" />
                    <span>Daftar Key Placeholders Dokumen Engine (Template .DOCX)</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 font-bold font-mono">
                    {Object.keys(dataset.placeholders).length} PLACEHOLDERS TERHUBUNG
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80">
                  Gunakan variabel placeholder di bawah ini dalam template Word (`.docx` / `.xml`). Semua data tersinkronisasi terpusat dengan engine SIPEKA v2.0.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <th className="p-3">Placeholder Key</th>
                      <th className="p-3">Nilai Data SSOT Terkini</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {Object.entries(dataset.placeholders).map(([key, value]) => (
                      <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{key}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 max-w-xs truncate">{value}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleCopyText(key, key)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 px-2.5 py-1 text-[10px] font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1 ml-auto transition"
                          >
                            {copiedKey === key ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin Key</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: Raw SSOT JSON Schema */}
          {activeViewMode === 'JSON' && (
            <div className="max-w-4xl mx-auto space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between bg-slate-900 text-white p-3 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Raw Official Document Dataset (SSOT Object)</span>
                </div>
                <button
                  onClick={() => handleCopyText(JSON.stringify(dataset, null, 2), 'raw_json')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 text-[11px] font-bold flex items-center gap-1"
                >
                  {copiedKey === 'raw_json' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'raw_json' ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 text-emerald-400 p-4 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed max-h-[500px]">
                {JSON.stringify(dataset, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="bg-slate-900 text-slate-400 px-4 py-2 text-[11px] font-mono border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>DPUPR Kabupaten Garut // Document Data Engine Ready</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">PDF (A4) • DOCX (Word Template) • XLSX (Spreadsheet)</span>
        </div>

      </div>
    </div>
  );
};
