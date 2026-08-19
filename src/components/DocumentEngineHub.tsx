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
              <div id="printable-ssot-document" className="bg-white text-slate-900 p-8 sm:p-10 border border-slate-300 shadow-xl font-mono leading-relaxed space-y-6 text-xs max-w-[210mm] mx-auto print:border-none print:shadow-none print:p-0">
                
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
