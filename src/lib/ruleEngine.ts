import { Application, DocumentItem, DocumentStatus } from '../types';
import { isSlfApplication } from './workflowEngine';
import { getDocumentDataSchema, DocumentDataSchema } from './dataEngine';

export interface DocumentRule {
  code: string;
  name: string;
  category: 'TANAH' | 'UMUM' | 'ARSITEKTUR' | 'STRUKTUR' | 'MEP';
  isRequired: (app: Application) => boolean;
  description: string;
}

export const MASTER_DOCUMENT_RULES: DocumentRule[] = [
  // --- TANAH ---
  {
    code: 'DOC-TANAH-01',
    name: 'Dokumen Kepemilikan Lahan Sertifikat Hak',
    category: 'TANAH',
    isRequired: () => true,
    description: 'Sertifikat Hak No. - A.N - tgl - dengan luas tanah sebesar - m2'
  },
  {
    code: 'DOC-TANAH-01A',
    name: 'a. Dokumen izin pemanfaatan tanah',
    category: 'TANAH',
    isRequired: () => true,
    description: 'Dokumen izin pemanfaatan tanah yang telah dilegalisasi'
  },
  {
    code: 'DOC-TANAH-02',
    name: 'Data Teknis Tanah Lainnya',
    category: 'TANAH',
    isRequired: () => true,
    description: 'Data pendukung teknis tanah'
  },
  {
    code: 'DOC-TANAH-02A',
    name: 'a. Gambar Sederhana Batas Tanah',
    category: 'TANAH',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-TANAH-02B',
    name: 'b. Hasil Penyelidikan Tanah',
    category: 'TANAH',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },

  // --- UMUM ---
  {
    code: 'DOC-UMUM-01',
    name: 'Data Siteplan yang telah disetujui Pemerintah Daerah Setempat',
    category: 'UMUM',
    isRequired: (app) => !isSlfApplication(app), // PBG only
    description: 'Siteplan yang telah disetujui seluas M2'
  },
  {
    code: 'DOC-UMUM-SLF-01',
    name: 'Gambar Terbangun (As Build Drawing)',
    category: 'UMUM',
    isRequired: (app) => isSlfApplication(app),
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-UMUM-02',
    name: 'Data Penyedia Jasa Perencana',
    category: 'UMUM',
    isRequired: () => true,
    description: 'SBU, SKK/STR Arsitek, SKK SIPIL, SKK MEP'
  },
  {
    code: 'DOC-UMUM-SLF-02',
    name: 'Laporan Pemeriksaan Berkala Bangunan',
    category: 'UMUM',
    isRequired: (app) => isSlfApplication(app),
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-UMUM-SLF-03',
    name: 'Laporan Pemeriksaan Kelaikan Fungsi Bangunan',
    category: 'UMUM',
    isRequired: (app) => isSlfApplication(app),
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-UMUM-SLF-04',
    name: 'Surat Pernyataan Kelaikan Fungsi',
    category: 'UMUM',
    isRequired: (app) => isSlfApplication(app),
    description: 'Dari Konsultan Ke Pemilik Bangunan dan Pemohon Ke Dinas'
  },
  {
    code: 'DOC-UMUM-03',
    name: 'Data Persetujuan Lingkungan',
    category: 'UMUM',
    isRequired: () => true,
    description: 'SPPL/UKL-UPL/AMDAL dari DLH sesuai kewenangannya'
  },
  {
    code: 'DOC-UMUM-04',
    name: 'Data Intensitas Bangunan (KKPR/KRK)',
    category: 'UMUM',
    isRequired: () => true,
    description: 'Dokumen KRK/KKPR'
  },
  {
    code: 'DOC-UMUM-05',
    name: 'Data Perizinan Bangunan (IMB/PBG/SLF)',
    category: 'UMUM',
    isRequired: (app) => isSlfApplication(app) || app.building.existingImbStatus === 'SUDAH_MEMILIKI_IMB',
    description: 'Data IMB/PBG terdahulu'
  },
  {
    code: 'DOC-UMUM-06',
    name: 'Data Identitas Pemilik Bangunan (KTP/KITAS)',
    category: 'UMUM',
    isRequired: () => true,
    description: 'Kartu Tanda Penduduk / Nomor Induk Berusaha'
  },

  // --- ARSITEKTUR ---
  {
    code: 'DOC-ARS-01',
    name: 'Gambar Situasi, Rencana Tapak, Denah, Potongan, Tampak dan detail Bangunan Gedung',
    category: 'ARSITEKTUR',
    isRequired: (app) => !isSlfApplication(app), // PBG only
    description: 'AGAR MELAMPIRKAN DOKUMEN SESUAI PERSYARATAN'
  },
  {
    code: 'DOC-ARS-01A',
    name: 'Spesifikasi teknis terbangun',
    category: 'ARSITEKTUR',
    isRequired: (app) => isSlfApplication(app), // SLF only
    description: 'Meliputi spesifikasi umum dan spesifikasi khusus'
  },
  {
    code: 'DOC-ARS-02',
    name: 'Gambar Detail Bangunan',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-03',
    name: 'Gambar Tata Ruang Luar',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-04',
    name: 'Gambar Tata Ruang Dalam',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-05',
    name: 'Gambar Tampak Bangunan',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-06',
    name: 'Gambar Potongan Bangunan',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-07',
    name: 'Gambar Denah Bangunan',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-08',
    name: 'Gambar Tapak Bangunan',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-09',
    name: 'Spesifikasi Teknis Arsitektur Bangunan',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-ARS-10',
    name: 'Gambar Situasi',
    category: 'ARSITEKTUR',
    isRequired: () => true,
    description: 'Menyajikan sampai lahan tetangga dan jalan, menampilkan GSJ'
  },

  // --- STRUKTUR ---
  {
    code: 'DOC-STRUK-01',
    name: 'Gambar Dan Detail Teknis Tangga',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-02',
    name: 'Gambar Dan Detail Teknis Pelat Lantai',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-03',
    name: 'Gambar Dan Detail Teknis Penutup',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-04',
    name: 'Gambar Dan Detail Teknis Rangka Atap',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-05',
    name: 'Gambar Dan Detail Teknis Balok',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-06',
    name: 'Gambar Dan Detail Teknis Kolom',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-07',
    name: 'Gambar Dan Detail Teknis Fondasi dan sloof',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-08',
    name: 'Spesifikasi Teknis Struktur Bangunan',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-STRUK-09',
    name: 'Perhitungan Teknis Struktur',
    category: 'STRUKTUR',
    isRequired: () => true,
    description: 'Melakukan Analisis & Evaluasi telah menggunakan NSPK yang berlaku'
  },

  // --- MEP ---
  {
    code: 'DOC-MEP-01',
    name: 'Gambar Dan Detail Sistem Proteksi Kebakaran',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-02',
    name: 'Gambar Dan Detail Pengelolaan Persampahan',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-03',
    name: 'Gambar Dan Detail Pengelolaan Drainase',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-04',
    name: 'Gambar Dan Detail Pengelolaan Air Limbah',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-05',
    name: 'Gambar Dan Detail Pengelolaan Air Hujan',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-06',
    name: 'Gambar Dan Detail Pengelolaan Air Bersih',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-07',
    name: 'Gambar Dan Detail Pencahayaan Umum, dan Pencahanyaan Khusus',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-08',
    name: 'Gambar Dan Detail Sumber Listrik, dan Jaringan Listrik',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-09',
    name: 'Spesifikasi Teknis Mekanikal, Elektrikal, dan Plambing',
    category: 'MEP',
    isRequired: () => true,
    description: 'Dilegalisasi oleh Tenaga Ahli yang ber-SKK terkait'
  },
  {
    code: 'DOC-MEP-10',
    name: 'Perhitungan Teknis Mekanikal, Elektrikal, dan Plambing',
    category: 'MEP',
    isRequired: () => true,
    description: 'Melakukan Analisis & Evaluasi telah menggunakan NSPK yang berlaku'
  }
];

export interface VerificationEvaluation {
  status: DocumentStatus;
  missingMandatoryDocs: string[];
  invalidDocs: string[];
  errorFormulaDocs: string[];
  totalRequired: number;
  totalValid: number;
  scorePercentage: number;
  recommendationInternal: string;
  recommendationApplicantWa: string;
}

export function runDocumentVerification(app: Application): VerificationEvaluation {
  const isSlf = isSlfApplication(app);
  const docType = isSlf ? 'BA_VISITE' : 'SKRD';
  const docSchema: DocumentDataSchema = getDocumentDataSchema(app, docType);

  const missingMandatoryDocs: string[] = [];
  const invalidDocs: string[] = [];
  const errorFormulaDocs: string[] = [];
  let totalRequired = 0;
  let totalValid = 0;

  for (const rule of MASTER_DOCUMENT_RULES) {
    const isReq = rule.isRequired(app);
    const existingDoc = app.documents.find(d => d.code === rule.code);

    if (isReq) {
      totalRequired++;
      if (!existingDoc || existingDoc.status === 'BELUM_ADA') {
        missingMandatoryDocs.push(rule.name);
      } else if (existingDoc.status === 'VALID') {
        totalValid++;
      } else if (existingDoc.status === 'PERLU_PERBAIKAN' || existingDoc.status === 'TIDAK_SESUAI') {
        invalidDocs.push(`${rule.name} (${existingDoc.notes || 'Format tidak sesuai'})`);
      } else if (existingDoc.status === 'TERUNGGAH' || existingDoc.status === 'VALIDASI_ADMINISTRATIF') {
        // Under review
      }

      if (existingDoc?.hasErrorTag) {
        errorFormulaDocs.push(`${rule.name} [Flag Error: ${existingDoc.hasErrorTag}]`);
      }
    }
  }

  // Check SLF-specific inspection items from SSOT Schema if applicable
  if (isSlf && docSchema.visite?.items) {
    for (const item of docSchema.visite.items) {
      if (item.status === 'PERLU_PERBAIKAN') {
        invalidDocs.push(`[Visite Lapangan] ${item.komponen}: ${item.catatan || 'Perlu perbaikan fisik'}`);
      }
    }
  }

  const scorePercentage = totalRequired > 0 ? Math.round((totalValid / totalRequired) * 100) : 100;
  const isComplete = missingMandatoryDocs.length === 0 && invalidDocs.length === 0 && errorFormulaDocs.length === 0 && totalValid >= totalRequired;

  // Build Operator technical recommendation using centralized SSOT metadata
  const permitTypeLabel = isSlf ? 'SLF (Sertifikat Laik Fungsi)' : 'PBG (Persetujuan Bangunan Gedung)';
  const registerNum = docSchema.registerNumber;
  const buildingName = docSchema.bangunan.nama;
  const applicantName = docSchema.pemohon.nama;

  let recommendationInternal = '';
  if (isComplete) {
    recommendationInternal = `Dokumen permohonan ${permitTypeLabel} No. ${registerNum} (${buildingName}) telah memenuhi seluruh persyaratan verifikasi regulasi PP 16/2021 [Verifikasi Digital Hash: ${docSchema.verifikasiDigital.qrHash}]. Siap diproses ke tahap ${isSlf ? 'Penerbitan SLF / Berita Acara' : 'Penjadwalan Konsultasi TPA/TPT'}.`;
  } else {
    recommendationInternal = `Dokumen ${permitTypeLabel} No. ${registerNum} belum lengkap/valid. Ditemukan ${missingMandatoryDocs.length} dokumen wajib belum terunggah dan ${invalidDocs.length} dokumen/aspek perlu perbaikan teknis. Status dialihkan ke REVISION_REQUESTED / INCOMPLETE.`;
  }

  // Build polite WhatsApp message for applicant using SSOT dataset
  let recommendationApplicantWa = '';
  if (isComplete) {
    recommendationApplicantWa = `Yth. Bpk/Ibu ${applicantName},\n\nKabar baik! Berkas permohonan ${permitTypeLabel} Anda (${registerNum} - ${buildingName}) telah diverifikasi oleh Operator SIMBG DPUPR Garut dan dinyatakan LENGKAP & VALID.\n\nTim kami sedang menyiapkan tahap selanjutnya (${isSlf ? 'Penerbitan SLF & Lampiran' : 'Jadwal Sidang Konsultasi TPA/TPT'}). Informasi lengkap akan kami sampaikan secara berkala.\n\nKode Verifikasi Resmi: ${docSchema.verifikasiDigital.qrHash}\n\nTerima kasih.\n\nDPUPR Kabupaten Garut`;
  } else {
    const listDocs = [...missingMandatoryDocs, ...invalidDocs].map((doc, idx) => `${idx + 1}. ${doc}`).join('\n');
    recommendationApplicantWa = `Yth. Bpk/Ibu ${applicantName},\n\nTerima kasih telah mengajukan permohonan ${permitTypeLabel} (${registerNum} - ${buildingName}).\n\nBerdasarkan hasil verifikasi administratif & teknis awal, masih terdapat dokumen/persyaratan yang perlu dilengkapi/diperbaiki sebagai berikut:\n${listDocs}\n\nCatatan:\nDokumen Permohonan saudara *TIDAK LENGKAP*, agar ditindaklanjuti secepatnya untuk pemenuhan kelengkapan dokumen permohonan yang saudara mohonkan melalui SIMBG DPUPR Kab. Garut.\n\nSalam hormat,\nOperator Pelayanan SIMBG DPUPR Kab. Garut`;
  }

  return {
    status: isComplete ? 'VALID' : 'PERLU_PERBAIKAN',
    missingMandatoryDocs,
    invalidDocs,
    errorFormulaDocs,
    totalRequired,
    totalValid,
    scorePercentage,
    recommendationInternal,
    recommendationApplicantWa
  };
}
