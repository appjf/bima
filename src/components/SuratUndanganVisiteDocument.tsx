import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Send, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Edit3, 
  Eye, 
  Copy, 
  Check, 
  Share2, 
  MessageSquare, 
  Plus, 
  Trash2, 
  QrCode, 
  AlertCircle,
  Building,
  User,
  Sparkles,
  Download
} from 'lucide-react';
import { Application, SuratUndanganVisite, UserRole } from '../types';
import { OfficialLetterhead } from './OfficialLetterhead';
import { generateSuratUndanganVisiteDraft, isSlfApplication } from '../lib/workflowEngine';
import { generateSecureTteToken } from '../lib/securityEngine';
import { getSavedSignatures, generateSignatureQrPayload } from '../lib/signatureEngine';
import { triggerPdfPrint } from '../lib/pdfPrintEngine';

interface SuratUndanganVisiteDocumentProps {
  application: Application;
  onUpdateApplication: (updated: Application) => void;
  onSendWhatsApp?: (phone: string, message: string, templateType: any) => void;
  currentRole?: UserRole;
  onClose?: () => void;
}

export const SuratUndanganVisiteDocument: React.FC<SuratUndanganVisiteDocumentProps> = ({
  application,
  onUpdateApplication,
  onSendWhatsApp,
  currentRole,
  onClose
}) => {
  const savedSignatures = getSavedSignatures();
  const pengawasSig = savedSignatures.pengawas;

  // Mode: PREVIEW (Siap Cetak / Publish) vs EDIT (Formulir Penyesuaian)
  const [viewMode, setViewMode] = useState<'PREVIEW' | 'EDIT'>('PREVIEW');
  const [isCopied, setIsCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [qrToken, setQrToken] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [qrImageSrc, setQrImageSrc] = useState<string>('');

  // Initial Surat Undangan Data (from application or freshly drafted with Pengawas SIMBG as default signer)
  const [formData, setFormData] = useState<SuratUndanganVisite>(() => {
    if (application.undanganVisite) {
      return application.undanganVisite;
    }
    const draft = generateSuratUndanganVisiteDraft(application);
    return {
      ...draft,
      signerName: draft.signerName || pengawasSig.name || 'Dedi Kurniawan, S.ST, MT',
      signerNip: draft.signerNip || pengawasSig.nip || '19820315 200801 1 009',
      signerRole: draft.signerRole || 'Pengawas SIMBG DPUPR Kabupaten Garut'
    };
  });

  // Sync state if application changes
  useEffect(() => {
    if (application.undanganVisite) {
      setFormData(application.undanganVisite);
    } else {
      const draft = generateSuratUndanganVisiteDraft(application);
      setFormData({
        ...draft,
        signerName: draft.signerName || pengawasSig.name || 'Dedi Kurniawan, S.ST, MT',
        signerNip: draft.signerNip || pengawasSig.nip || '19820315 200801 1 009',
        signerRole: draft.signerRole || 'Pengawas SIMBG DPUPR Kabupaten Garut'
      });
    }
  }, [application.id]);

  // Generate TTE Token when document is ready
  useEffect(() => {
    async function prepareToken() {
      try {
        const result = await generateSecureTteToken({
          docType: 'BERITA_ACARA',
          docNumber: formData.letterNumber,
          docTitle: `Surat Undangan Visite Lapangan - ${application.registerNumber}`,
          applicant: application.applicant.name,
          signerName: formData.signerName || pengawasSig.name,
          signerNip: formData.signerNip || pengawasSig.nip,
          signerRole: formData.signerRole || 'Pengawas SIMBG DPUPR Kabupaten Garut'
        });
        setQrToken(result.token);
        setVerificationUrl(result.verificationUrl);
        setQrImageSrc(result.qrImageUrl);
      } catch (err) {
        console.warn('Error creating TTE token for invitation:', err);
      }
    }
    prepareToken();
  }, [formData.letterNumber, formData.signerName, formData.signerNip, application.id]);

  // Add a new inspector to the team
  const handleAddInspector = () => {
    setFormData(prev => ({
      ...prev,
      assignedInspectors: [
        ...prev.assignedInspectors,
        { name: '', role: 'Penilik Teknis Lapangan', nip: '-' }
      ]
    }));
  };

  // Remove inspector from the team
  const handleRemoveInspector = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignedInspectors: prev.assignedInspectors.filter((_, i) => i !== index)
    }));
  };

  // Update inspector data
  const handleUpdateInspector = (index: number, field: string, val: string) => {
    setFormData(prev => {
      const updated = [...prev.assignedInspectors];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, assignedInspectors: updated };
    });
  };

  // Add new instruction item
  const handleAddInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  // Remove instruction item
  const handleRemoveInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  // Update instruction item
  const handleUpdateInstruction = (index: number, val: string) => {
    setFormData(prev => {
      const updated = [...prev.instructions];
      updated[index] = val;
      return { ...prev, instructions: updated };
    });
  };

  // Save changes & update application
  const handleSaveAndPublish = () => {
    setIsPublishing(true);
    const updatedUndangan: SuratUndanganVisite = {
      ...formData,
      isSigned: true,
      signedAt: new Date().toISOString(),
      tteToken: qrToken
    };

    const updatedApp: Application = {
      ...application,
      undanganVisite: updatedUndangan,
      lastUpdated: new Date().toISOString()
    };

    onUpdateApplication(updatedApp);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
    }, 600);
  };

  // WhatsApp Broadcast Template
  const generateWhatsAppMessage = (): string => {
    return `*PEMERINTAH KABUPATEN GARUT*\n*DINAS PEKERJAAN UMUM DAN PENATAAN RUANG (DPUPR)*\n_Sekretariat SIMBG Kab. Garut_\n\n` +
      `Kepada Yth.\n*${formData.recipientName}*\n(${formData.recipientRole || 'Pemohon / Penanggung Jawab Gedung'})\n\n` +
      `Sehubungan dengan permohonan ${isSlfApplication(application) ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)'} dengan rincian:\n` +
      `• *No. Registrasi*: ${application.registerNumber}\n` +
      `• *Nama Bangunan*: ${application.building.name}\n` +
      `• *Lokasi*: ${application.building.address}, Kec. ${application.building.district}\n\n` +
      `Bersama ini kami sampaikan *Surat Undangan Pemeriksaan / Visite Lapangan* Nomor: *${formData.letterNumber}* yang akan dilaksanakan pada:\n\n` +
      `📅 *Hari / Tanggal*: ${formData.visitDate}\n` +
      `⏰ *Waktu*: ${formData.visitTime}\n` +
      `📍 *Titik Kumpul / Lokasi*: ${formData.meetingPoint}\n` +
      `🎯 *Agenda*: ${formData.agenda}\n\n` +
      `*Instruksi Kesiapan Pemohon:*\n` +
      formData.instructions.map((ins, i) => `${i + 1}. ${ins}`).join('\n') +
      `\n\n*Tim Penilik Teknis Yang Bertugas:*\n` +
      formData.assignedInspectors.map((ins, i) => `• ${ins.name} (${ins.role})`).join('\n') +
      `\n\nDokumen resmi ini telah ditandatangani secara elektronik (TTE BSrE BSSN).\n` +
      `Tautan Verifikasi Keabsahan: ${verificationUrl || window.location.href}\n\n` +
      `_Pesan otomatis SIMBG DPUPR Garut // Layanan Konsultasi: 0812-2345-6789_`;
  };

  const handleSendWa = () => {
    const waText = generateWhatsAppMessage();
    const phone = application.applicant.phone || '081223456789';
    if (onSendWhatsApp) {
      onSendWhatsApp(phone, waText, 'VISITE_LAPANGAN');
    } else {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const formatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
      window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(waText)}`, '_blank');
    }
  };

  const handleCopyText = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handlePrintPdf = () => {
    triggerPdfPrint('surat-undangan-visite-print-area', `Surat_Undangan_Visite_${application.registerNumber.replace(/[^a-zA-Z0-9]/g, '_')}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Control Action Bar (Publish & Broadcast Suite) */}
      <div className="bg-slate-900 text-white p-4 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
              MODUL DOKUMEN RESMI
            </span>
            <span className="text-[10px] text-slate-400">
              NOMOR: {formData.letterNumber}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold font-sans mt-0.5 text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Surat Undangan Pemeriksaan / Visite Lapangan</span>
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch View Mode */}
          <div className="flex bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('PREVIEW')}
              className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'PREVIEW'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Dokumen (Siap Publish)</span>
            </button>
            <button
              onClick={() => setViewMode('EDIT')}
              className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'EDIT'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Formulir</span>
            </button>
          </div>

          {/* Cetak PDF */}
          <button
            onClick={handlePrintPdf}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
            title="Cetak format kertas A4 kedinasan resmi"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cetak PDF A4</span>
          </button>

          {/* Kirim WhatsApp */}
          <button
            onClick={handleSendWa}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            title="Kirim pemberitahuan resmi via WhatsApp ke Pemohon"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim WhatsApp</span>
          </button>

          {/* Salin Teks */}
          <button
            onClick={handleCopyText}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
            title="Salin isi pesan undangan"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>

          {/* Simpan & Publish */}
          <button
            onClick={handleSaveAndPublish}
            disabled={isPublishing}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
            <span>{isPublishing ? 'Memublikasikan...' : 'Publikasikan Surat (TTE)'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {publishSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border-l-4 border-emerald-600 p-4 text-emerald-900 dark:text-emerald-200 text-xs font-mono flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>Surat Undangan Berhasil Dipublikasikan & Disahkan!</strong> Token kriptografi TTE telah terikat pada berkas No. {application.registerNumber}.
            </span>
          </div>
          <button
            onClick={handleSendWa}
            className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold uppercase hover:bg-emerald-700"
          >
            Kirim WhatsApp Sekarang
          </button>
        </div>
      )}

      {/* VIEW MODE 1: PREVIEW READY-TO-PUBLISH OFFICIAL DOCUMENT */}
      {viewMode === 'PREVIEW' && (
        <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-2 sm:p-6 border border-slate-200 dark:border-slate-800">
          
          {/* A4 Standard Official Printable Letter */}
          <div 
            id="surat-undangan-visite-print-area"
            className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-12 shadow-xl font-serif text-[11pt] leading-relaxed relative print:shadow-none print:p-0 print:m-0"
          >
            {/* Kop Surat Resmi Kabupaten Garut */}
            <OfficialLetterhead />

            {/* Letter Head Attributes (Nomor, Sifat, Lampiran, Tanggal) */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5 text-[10pt] font-sans">
              <div className="space-y-0.5">
                <div className="flex">
                  <span className="w-20 font-bold">Nomor</span>
                  <span className="w-3">:</span>
                  <span className="font-mono font-bold text-slate-950">{formData.letterNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold">Sifat</span>
                  <span className="w-3">:</span>
                  <span className="uppercase font-semibold">{formData.nature}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold">Lampiran</span>
                  <span className="w-3">:</span>
                  <span>{formData.attachments}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-20 font-bold">Perihal</span>
                  <span className="w-3">:</span>
                  <span className="font-bold underline max-w-xs leading-snug">
                    {formData.subject}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right font-serif text-[10pt] space-y-1">
                <p>Garut, {formData.letterDate}</p>
                <div className="mt-2 text-left sm:text-left bg-slate-50 border border-slate-200 p-2.5 rounded-none">
                  <p className="font-sans text-[9pt] text-slate-500 uppercase font-bold">Kepada Yth.</p>
                  <p className="font-bold text-slate-950 text-[10pt]">{formData.recipientName}</p>
                  <p className="text-[9pt] text-slate-700">{formData.recipientRole || 'Pemilik / Penanggung Jawab Bangunan Gedung'}</p>
                  <p className="text-[9pt] text-slate-600">{formData.recipientAddress || 'Di Tempat'}</p>
                </div>
              </div>
            </div>

            {/* Letter Body Opening */}
            <div className="space-y-3 text-justify text-[10.5pt]">
              <p className="indent-8">
                Berdasarkan ketentuan Peraturan Pemerintah Republik Indonesia Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung, serta menindaklanjuti permohonan penerbitan <strong>{isSlfApplication(application) ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)'}</strong> melalui Sistem Informasi Manajemen Bangunan Gedung (SIMBG) dengan data sebagai berikut:
              </p>

              {/* Data Permohonan Table */}
              <div className="my-2 bg-slate-50/70 border border-slate-300 p-3 font-sans text-[10pt]">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-44 py-0.5 text-slate-600 font-semibold">Nomor Registrasi SIMBG</td>
                      <td className="w-3 py-0.5">:</td>
                      <td className="py-0.5 font-mono font-bold text-indigo-900">{application.registerNumber}</td>
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
                Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut mengundang Saudara/i beserta Tim Teknis / Konsultan Pendamping untuk hadir dan mendampingi pelaksanaan <strong>Pemeriksaan Fisik Lapangan (Visite Teknis)</strong> yang akan dilaksanakan pada:
              </p>

              {/* Detail Jadwal & Lokasi Pelaksanaan */}
              <div className="my-3 border-2 border-slate-900 p-3 font-sans text-[10pt] bg-amber-50/40">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-36 py-1 font-bold text-slate-900">Hari / Tanggal</td>
                      <td className="w-3 py-1 font-bold">:</td>
                      <td className="py-1 font-bold text-slate-950">{formData.visitDate}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-slate-900">Waktu / Pukul</td>
                      <td className="py-1 font-bold">:</td>
                      <td className="py-1 font-bold text-slate-950">{formData.visitTime}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-slate-900">Titik Kumpul / Lokasi</td>
                      <td className="py-1 font-bold">:</td>
                      <td className="py-1 text-slate-900">{formData.meetingPoint}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold text-slate-900">Agenda Kegiatan</td>
                      <td className="py-1 font-bold">:</td>
                      <td className="py-1 text-slate-900">{formData.agenda}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tim Penilik Teknis Yang Ditugaskan */}
              <div className="mt-3">
                <p className="font-bold font-sans text-[10pt] mb-1 text-slate-950">
                  Adapun Tim Penilik Teknis DPUPR Kabupaten Garut yang ditugaskan adalah sebagai berikut:
                </p>
                <div className="border border-slate-400 overflow-hidden font-sans text-[9.5pt]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 border-b border-slate-400 text-slate-900">
                      <tr>
                        <th className="p-1.5 text-center w-10">No</th>
                        <th className="p-1.5">Nama Petugas Penilik</th>
                        <th className="p-1.5">NIP / Identitas</th>
                        <th className="p-1.5">Peran / Penugasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {formData.assignedInspectors.map((inspector, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-1.5 text-center font-bold">{idx + 1}</td>
                          <td className="p-1.5 font-bold text-slate-950">{inspector.name}</td>
                          <td className="p-1.5 font-mono text-[9pt] text-slate-600">{inspector.nip || '-'}</td>
                          <td className="p-1.5 text-slate-800">{inspector.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Petunjuk Kesiapan Pemohon */}
              <div className="mt-3 bg-slate-50 border border-slate-300 p-3 font-sans text-[9.5pt]">
                <p className="font-bold text-slate-950 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Petunjuk Kesiapan & Kewajiban Pemohon / Penanggung Jawab Bangunan:</span>
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-800">
                  {formData.instructions.map((ins, idx) => (
                    <li key={idx}>{ins}</li>
                  ))}
                </ol>
              </div>

              {/* Penutup Surat */}
              <p className="indent-8 mt-3">
                Demikian surat undangan ini kami sampaikan. Mengingat pentingnya kegiatan verifikasi kelaikan fisik bangunan gedung ini dalam rangka tertib penyelenggaraan bangunan gedung di Kabupaten Garut, atas perhatian dan kehadiran Saudara/i tepat pada waktunya kami ucapkan terima kasih.
              </p>
            </div>

            {/* Signature Area with Official TTE QR Code & Canvas Signature */}
            <div className="mt-8 flex justify-between items-end break-inside-avoid">
              
              {/* Tembusan */}
              <div className="text-[8.5pt] font-sans text-slate-600 space-y-0.5 max-w-[240px]">
                <p className="font-bold text-slate-800 uppercase">Tembusan Yth:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Bupati Garut (sebagai laporan)</li>
                  <li>Kepala Dinas DPMPTSP Kab. Garut</li>
                  <li>Camat {application.building.district}</li>
                  <li>Arsip Sekretariat SIMBG</li>
                </ol>
              </div>

              {/* Official TTE Box */}
              <div className="text-center font-sans space-y-1 min-w-[280px]">
                <p className="text-[10pt] font-bold uppercase text-slate-900 leading-tight">
                  {formData.signerRole || 'Pengawas SIMBG DPUPR Kabupaten Garut'}
                </p>

                {/* TTD Canvas + QR Code TTE Container */}
                <div className="py-2 flex items-center justify-center gap-3">
                  {pengawasSig.signatureDataUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={pengawasSig.signatureDataUrl} 
                        alt="Tanda Tangan Digital Pengawas SIMBG" 
                        className="h-16 max-w-[130px] object-contain"
                      />
                      <span className="text-[6.5pt] font-mono text-slate-400">TTD Tersimpan (Settings)</span>
                    </div>
                  ) : null}

                  <div className="flex flex-col items-center">
                    <div className="p-1 border border-slate-900 bg-white shadow-2xs inline-block">
                      <img 
                        src={qrImageSrc || pengawasSig.qrCodeUrl || generateSignatureQrPayload(pengawasSig, formData.letterNumber)} 
                        alt="QR Code TTE BSrE" 
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                    <div className="text-[7pt] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>TTE BSrE VALID</span>
                    </div>
                  </div>
                </div>

                {/* Signer Identity */}
                <div>
                  <p className="text-[10.5pt] font-bold text-slate-950 underline leading-none">
                    {formData.signerName || pengawasSig.name || 'Dedi Kurniawan, S.ST, MT'}
                  </p>
                  <p className="text-[9pt] font-mono text-slate-600 mt-0.5">
                    NIP. {formData.signerNip || pengawasSig.nip || '19820315 200801 1 009'}
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Real-time Security Verification Footer */}
            <div className="mt-8 pt-3 border-t-2 border-slate-900 flex items-center justify-between text-[8pt] font-mono text-slate-700 bg-slate-50 p-2.5 border border-slate-300">
              <div className="flex items-center gap-2.5">
                <img 
                  src={qrImageSrc || pengawasSig.qrCodeUrl || generateSignatureQrPayload(pengawasSig, formData.letterNumber)} 
                  alt="QR Verifikasi" 
                  className="w-11 h-11 border border-slate-300 p-0.5 bg-white shrink-0" 
                />
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>VERIFIKASI KEASLIAN DOKUMEN ELEKTRONIK DPUPR GARUT</span>
                  </div>
                  <div className="text-[7pt] text-slate-500 font-sans">
                    Dokumen ini sah & ditandatangani secara digital oleh <strong>{formData.signerName || pengawasSig.name}</strong>. Pindai QR Code untuk validasi real-time.
                  </div>
                </div>
              </div>
              <div className="text-right text-[7pt] text-slate-500 shrink-0 font-mono space-y-0.5">
                <div>DOC: {formData.letterNumber}</div>
                <div>ID: {application.registerNumber}</div>
                <div>ISO/IEC 27001 & BSrE BSSN</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW MODE 2: FORMULIR EDIT PARAMETER SURAT */}
      {viewMode === 'EDIT' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>Formulir Kustomisasi Surat Undangan Visite</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sesuaikan jadwal, personil tim penilik teknis, instruksi kesiapan, dan pejabat penandatangan.
              </p>
            </div>
            <button
              onClick={() => setViewMode('PREVIEW')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
            >
              Lihat Pratinjau
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nomor Surat</label>
              <input
                type="text"
                value={formData.letterNumber}
                onChange={(e) => setFormData({ ...formData, letterNumber: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Tanggal Surat</label>
              <input
                type="text"
                value={formData.letterDate}
                onChange={(e) => setFormData({ ...formData, letterDate: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sifat Surat</label>
              <select
                value={formData.nature}
                onChange={(e) => setFormData({ ...formData, nature: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="PENTING">PENTING</option>
                <option value="SEGERA">SEGERA</option>
                <option value="AMAT_SEGERA">AMAT SEGERA</option>
                <option value="BIASA">BIASA</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Lampiran</label>
              <input
                type="text"
                value={formData.attachments}
                onChange={(e) => setFormData({ ...formData, attachments: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Perihal Surat</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Penerima Undangan (Pemohon)</label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Detail Pelaksanaan Kunjungan */}
          <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
            <h5 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Detail Waktu & Lokasi Pelaksanaan</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Hari & Tanggal Pelaksanaan</label>
                <input
                  type="text"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  placeholder="Contoh: Kamis, 20 Agustus 2026"
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Waktu Pelaksanaan</label>
                <input
                  type="text"
                  value={formData.visitTime}
                  onChange={(e) => setFormData({ ...formData, visitTime: e.target.value })}
                  placeholder="Contoh: 09.30 WIB s.d. Selesai"
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Titik Kumpul / Lokasi</label>
                <input
                  type="text"
                  value={formData.meetingPoint}
                  onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Agenda Pemeriksaan</label>
              <textarea
                rows={2}
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-sans"
              />
            </div>
          </div>

          {/* Tim Penilik Teknis Yang Ditugaskan */}
          <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Tim Penilik Teknis Yang Ditugaskan ({formData.assignedInspectors.length} Petugas)</span>
              </h5>
              <button
                onClick={handleAddInspector}
                className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Petugas</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.assignedInspectors.map((inspector, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-white dark:bg-slate-800 p-2 border border-slate-300 dark:border-slate-700">
                  <span className="w-6 text-center font-bold text-slate-400">{idx + 1}.</span>
                  <input
                    type="text"
                    value={inspector.name}
                    onChange={(e) => handleUpdateInspector(idx, 'name', e.target.value)}
                    placeholder="Nama Lengkap & Gelar Petugas"
                    className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={inspector.nip || ''}
                    onChange={(e) => handleUpdateInspector(idx, 'nip', e.target.value)}
                    placeholder="NIP (contoh: 19820315...)"
                    className="w-44 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={inspector.role}
                    onChange={(e) => handleUpdateInspector(idx, 'role', e.target.value)}
                    placeholder="Peran (Penilik Teknis / TPT)"
                    className="w-48 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleRemoveInspector(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    title="Hapus Petugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instruksi Kesiapan Pemohon */}
          <div className="border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Instruksi Kesiapan & Kewajiban Pemohon</span>
              </h5>
              <button
                onClick={handleAddInstruction}
                className="px-2.5 py-1 bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-amber-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Instruksi</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.instructions.map((ins, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 border border-slate-300 dark:border-slate-700">
                  <span className="w-6 text-center font-bold text-slate-400">{idx + 1}.</span>
                  <input
                    type="text"
                    value={ins}
                    onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                    className="flex-1 p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={() => handleRemoveInstruction(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    title="Hapus Instruksi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pejabat Penandatangan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Nama Penandatangan</label>
              <input
                type="text"
                value={formData.signerName}
                onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">NIP Penandatangan</label>
              <input
                type="text"
                value={formData.signerNip}
                onChange={(e) => setFormData({ ...formData, signerNip: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Jabatan Kedinasan</label>
              <input
                type="text"
                value={formData.signerRole}
                onChange={(e) => setFormData({ ...formData, signerRole: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Save & Preview Action */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setViewMode('PREVIEW')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            >
              Lihat Pratinjau Surat
            </button>
            <button
              onClick={handleSaveAndPublish}
              disabled={isPublishing}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Simpan & Sahkan Surat Undangan (TTE)</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
