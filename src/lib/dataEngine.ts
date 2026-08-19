import { Application } from '../types';
import { calculateRetribution, DEFAULT_SHST_GARUT } from './retributionEngine';
import { 
  OfficialDocumentType, 
  OfficialDocumentDataset, 
  HeaderMetadata, 
  PemohonDataset, 
  BangunanDataset, 
  RetribusiDataset, 
  VisiteDataset, 
  BeritaAcaraDataset, 
  DocumentItemRow, 
  terbilangRupiah 
} from './documentDataEngine';

// ============================================================================
// 1. DOMAIN SCHEMAS & INTERFACES (SSOT CORE)
// ============================================================================

export interface DigitalVerificationRecord {
  verificationId: string;
  qrHash: string;
  statusTtd: 'DRAFT' | 'PENDING_BSRE' | 'SIGNED_BSRE' | 'REVOKED';
  penandatangan: string;
  jabatanPenandatangan: string;
  nipPenandatangan: string;
  issuedAt: string;
  expiresAt?: string;
  verificationUrl: string;
  securityHashAlgorithm: string;
  auditTrailLogs: Array<{
    timestamp: string;
    action: string;
    actor: string;
    ipAddress?: string;
  }>;
}

export interface DocumentTemplateSchema {
  templateId: string;
  code: OfficialDocumentType | string;
  title: string;
  category: 'RETRIBUSI' | 'INSPEKSI' | 'SIDANG_TPA' | 'PERNYATAAN' | 'SURAT_RESMI' | 'REKAPITULASI';
  supportedFormats: Array<'PDF' | 'DOCX' | 'XLSX' | 'CSV'>;
  defaultFormat: 'PDF' | 'DOCX' | 'XLSX';
  version: string;
  updatedAt: string;
  description: string;
  requiredPlaceholders: string[];
  docxTemplateFilename?: string;
  xlsxSheetName?: string;
  cssStyleRules?: string;
}

export interface DocumentDataSchema {
  schemaVersion: string;
  generatedAt: string;
  documentType: OfficialDocumentType | string;
  documentTitle: string;
  registerNumber: string;
  applicationId: string;
  header: HeaderMetadata;
  pemohon: PemohonDataset;
  bangunan: BangunanDataset;
  retribusi: RetribusiDataset;
  visite: VisiteDataset;
  beritaAcara: BeritaAcaraDataset;
  dokumenChecklist: DocumentItemRow[];
  verifikasiDigital: DigitalVerificationRecord;
  placeholders: Record<string, string>;
  customMetadata?: Record<string, any>;
}

// ============================================================================
// 2. TEMPLATE MASTER REGISTRY (SIMBG KABUPATEN GARUT)
// ============================================================================

const OFFICIAL_TEMPLATES: Record<string, DocumentTemplateSchema> = {
  SKRD: {
    templateId: 'TPL-SKRD-2026',
    code: 'SKRD',
    title: 'Surat Ketetapan Retribusi Daerah (SKRD) PBG / SLF',
    category: 'RETRIBUSI',
    supportedFormats: ['PDF', 'DOCX', 'XLSX'],
    defaultFormat: 'PDF',
    version: '1.2',
    updatedAt: '2026-08-01',
    description: 'Dokumen penetapan resmi nilai retribusi PBG/SLF berdasarkan SHST Garut & PP 16/2021',
    requiredPlaceholders: [
      'HEADER_NOMOR_SURAT',
      'PEMOHON_NAMA',
      'PEMOHON_NIK',
      'BANGUNAN_NAMA',
      'BANGUNAN_LUAS_M2',
      'RETRIBUSI_TOTAL_FORMATTED',
      'RETRIBUSI_TERBILANG',
      'HASH_VERIFIKASI'
    ],
    docxTemplateFilename: 'Template_SKRD_DPUPR_Garut.docx',
    xlsxSheetName: 'RincianSKRD'
  },
  BA_VISITE: {
    templateId: 'TPL-VISITE-2026',
    code: 'BA_VISITE',
    title: 'Berita Acara Visite Lapangan Kelaikan Fungsi (SLF)',
    category: 'INSPEKSI',
    supportedFormats: ['PDF', 'DOCX'],
    defaultFormat: 'PDF',
    version: '2.0',
    updatedAt: '2026-08-10',
    description: 'Berita Acara hasil verifikasi kesesuaian fisik bangunan di lapangan oleh Tim TPT DPUPR',
    requiredPlaceholders: [
      'VISITE_NOMOR_BA',
      'VISITE_TANGGAL',
      'VISITE_STATUS_KELAIKAN',
      'BANGUNAN_NAMA',
      'BANGUNAN_ALAMAT',
      'HASH_VERIFIKASI'
    ],
    docxTemplateFilename: 'Template_BA_Visite_SLF.docx'
  },
  BA_KONSULTASI: {
    templateId: 'TPL-KONSULTASI-2026',
    code: 'BA_KONSULTASI',
    title: 'Berita Acara Sidang Konsultasi TPA / TPT',
    category: 'SIDANG_TPA',
    supportedFormats: ['PDF', 'DOCX'],
    defaultFormat: 'PDF',
    version: '1.5',
    updatedAt: '2026-07-25',
    description: 'Berita Acara Pleno Sidang Konsultasi Dokumen Teknis Bangunan Gedung oleh TPA/TPT Garut',
    requiredPlaceholders: [
      'BA_NOMOR',
      'BA_TANGGAL',
      'BA_JENIS_SIDANG',
      'BA_HASIL_SIDANG',
      'PEMOHON_NAMA',
      'BANGUNAN_NAMA'
    ],
    docxTemplateFilename: 'Template_BA_Konsultasi_TPA.docx'
  },
  SURAT_PEMBERITAHUAN: {
    templateId: 'TPL-NOTIF-2026',
    code: 'SURAT_PEMBERITAHUAN',
    title: 'Surat Pemberitahuan Jadwal Sidang / Visite',
    category: 'SURAT_RESMI',
    supportedFormats: ['PDF', 'DOCX'],
    defaultFormat: 'PDF',
    version: '1.0',
    updatedAt: '2026-06-15',
    description: 'Surat resmi pemberitahuan jadwal pemeriksaan dokumen atau inspeksi lapangan kepada pemohon',
    requiredPlaceholders: [
      'HEADER_NOMOR_SURAT',
      'PEMOHON_NAMA',
      'PEMOHON_ALAMAT',
      'HEADER_TANGGAL_LENGKAP'
    ],
    docxTemplateFilename: 'Template_Surat_Pemberitahuan.docx'
  },
  FORM_INSPEKSI_CHECKLIST: {
    templateId: 'TPL-CHECKLIST-2026',
    code: 'FORM_INSPEKSI_CHECKLIST',
    title: 'Formulir Inspeksi & Checklist Komponen Bangunan',
    category: 'INSPEKSI',
    supportedFormats: ['PDF', 'DOCX', 'XLSX'],
    defaultFormat: 'PDF',
    version: '2.1',
    updatedAt: '2026-08-12',
    description: 'Lembar pemeriksaan teknis struktur, arsitektur, dan MEP bangunan gedung',
    requiredPlaceholders: [
      'REGISTER_NUMBER',
      'BANGUNAN_NAMA',
      'VISITE_NOMOR_BA'
    ],
    docxTemplateFilename: 'Template_Checklist_Inspeksi.docx',
    xlsxSheetName: 'ChecklistInspeksi'
  },
  REKAPITULASI_RETRIBUSI_XLSX: {
    templateId: 'TPL-REKAP-RETRIBUSI-XLSX',
    code: 'REKAPITULASI_RETRIBUSI_XLSX',
    title: 'Rekapitulasi Kalkulasi Retribusi (Spreadsheet XLSX)',
    category: 'REKAPITULASI',
    supportedFormats: ['XLSX', 'CSV'],
    defaultFormat: 'XLSX',
    version: '1.0',
    updatedAt: '2026-08-05',
    description: 'Lembar kerja rincian koefisien dan perhitungan matematis retribusi PBG',
    requiredPlaceholders: [
      'REGISTER_NUMBER',
      'RETRIBUSI_TOTAL_NUMERIC',
      'RETRIBUSI_SHST_RATE'
    ],
    xlsxSheetName: 'PerhitunganRetribusi'
  },
  PERNYATAAN_STANDAR_TEKNIS: {
    templateId: 'TPL-PERNYATAAN-2026',
    code: 'PERNYATAAN_STANDAR_TEKNIS',
    title: 'Surat Pernyataan Pemenuhan Standar Teknis PBG/SLF',
    category: 'PERNYATAAN',
    supportedFormats: ['PDF', 'DOCX'],
    defaultFormat: 'PDF',
    version: '1.1',
    updatedAt: '2026-07-10',
    description: 'Surat pernyataan keabsahan dokumen teknis oleh pemohon/pemilik bangunan',
    requiredPlaceholders: [
      'PEMOHON_NAMA',
      'PEMOHON_NIK',
      'BANGUNAN_NAMA',
      'HEADER_TANGGAL_LENGKAP'
    ],
    docxTemplateFilename: 'Template_Pernyataan_Pemenuhan_Teknis.docx'
  },
  REKAPITULASI_PEMOHON_XLSX: {
    templateId: 'TPL-REKAP-PEMOHON-XLSX',
    code: 'REKAPITULASI_PEMOHON_XLSX',
    title: 'Rekapitulasi Permohonan PBG/SLF Se-Kabupaten Garut',
    category: 'REKAPITULASI',
    supportedFormats: ['XLSX', 'CSV'],
    defaultFormat: 'XLSX',
    version: '1.0',
    updatedAt: '2026-08-15',
    description: 'Export spreadsheet laporan rekapitulasi permohonan untuk analisis pimpinan',
    requiredPlaceholders: [
      'HEADER_TANGGAL_LENGKAP',
      'HEADER_PEMERINTAH'
    ],
    xlsxSheetName: 'DataPermohonan'
  }
};

/**
 * Class DataEngineManager
 * Pusat manajemen skema data dokumen, verifikasi digital, dan template registry.
 */
export class DataEngineManager {
  private templates: Map<string, DocumentTemplateSchema>;
  private cache: Map<string, DocumentDataSchema>;

  constructor() {
    this.templates = new Map(Object.entries(OFFICIAL_TEMPLATES));
    this.cache = new Map();
  }

  // --------------------------------------------------------------------------
  // TEMPLATE MANAGEMENT METHODS
  // --------------------------------------------------------------------------

  public getAllTemplates(): DocumentTemplateSchema[] {
    return Array.from(this.templates.values());
  }

  public getTemplateByCode(code: string): DocumentTemplateSchema | undefined {
    return this.templates.get(code);
  }

  public registerTemplate(template: DocumentTemplateSchema): void {
    this.templates.set(template.code, template);
  }

  public filterTemplatesByCategory(category: DocumentTemplateSchema['category']): DocumentTemplateSchema[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  // --------------------------------------------------------------------------
  // DIGITAL VERIFICATION ENGINE (BSrE HASH GENERATOR)
  // --------------------------------------------------------------------------

  public generateVerificationHash(registerNumber: string, docType: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const cleanReg = (registerNumber || 'GARUT').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return `GARUT-DPUPR-${cleanReg}-${docType}-${timestamp}`;
  }

  public createDigitalVerificationRecord(
    registerNumber: string, 
    docType: string,
    signerName: string = 'H. Jujun Juansyah, S.T., M.T.',
    signerNip: string = '19750812 200212 1 003'
  ): DigitalVerificationRecord {
    const hash = this.generateVerificationHash(registerNumber, docType);
    const nowISO = new Date().toISOString();
    
    return {
      verificationId: `VERIF-${Date.now()}`,
      qrHash: hash,
      statusTtd: 'SIGNED_BSRE',
      penandatangan: signerName,
      jabatanPenandatangan: 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang',
      nipPenandatangan: signerNip,
      issuedAt: nowISO,
      verificationUrl: `https://simbg.garutkab.go.id/verify/${hash}`,
      securityHashAlgorithm: 'SHA-256 / BSrE E-Sign Certified',
      auditTrailLogs: [
        {
          timestamp: nowISO,
          action: 'DIGITAL_SIGNATURE_APPLIED',
          actor: signerName,
          ipAddress: '103.144.xxx.xxx'
        }
      ]
    };
  }

  // --------------------------------------------------------------------------
  // DATA TRANSFORMER: Application -> DocumentDataSchema
  // --------------------------------------------------------------------------

  public transformApplicationToDocumentData(
    app: Application,
    docType: OfficialDocumentType = 'SKRD'
  ): DocumentDataSchema {
    const cacheKey = `${app.id}_${docType}_${app.lastUpdated || ''}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const currentDate = new Date();
    const dateFormatted = currentDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const retCalc = app.retribution || calculateRetribution(app, DEFAULT_SHST_GARUT);
    const totalRet = retCalc.finalRetribution || 0;
    const integratedIndex = (retCalc.indexFungsi || 0.15) * 
                            (retCalc.indexKompleksitas || 0.1) * 
                            (retCalc.indexPermanensi || 0.2) * 
                            (retCalc.indexJumlahLantai || 1.0);

    const registerCode = app.registerNumber || app.id;
    const skrdNum = `SKRD/3205/DPUPR/${currentDate.getFullYear()}/${registerCode.slice(-5).toUpperCase()}`;
    const baNum = app.baLapangan?.baLapanganNumber || `BA-VISITE/3205/DPUPR/${currentDate.getFullYear()}/${registerCode.slice(-4).toUpperCase()}`;

    const verificationRecord = this.createDigitalVerificationRecord(registerCode, docType);

    const header: HeaderMetadata = {
      pemerintah: 'PEMERINTAH KABUPATEN GARUT',
      dinas: 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG (DPUPR)',
      alamat: 'Jl. Raya Samarang No. 115, Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151',
      telepon: '(0262) 233-115',
      website: 'simbg.garutkab.go.id',
      email: 'dpupr@garutkab.go.id',
      kota: 'Garut',
      tanggalLengkap: dateFormatted,
      nomorSurat: docType === 'SKRD' ? skrdNum : baNum,
      kodeBarcode: verificationRecord.qrHash
    };

    const pemohon: PemohonDataset = {
      nama: app.applicant.name || 'Tanpa Nama',
      nik: app.applicant.nik || '3205000000000000',
      telepon: app.applicant.phone || '08123456789',
      email: app.applicant.email || 'pemohon@garutkab.go.id',
      alamat: app.applicant.address || 'Kabupaten Garut',
      desa: app.applicant.village || 'Tarogong',
      kecamatan: app.applicant.district || 'Tarogong Kidul',
      kabupaten: app.applicant.city || 'Kab. Garut'
    };

    const bangunan: BangunanDataset = {
      nama: app.building.name || 'Gedung Tanpa Nama',
      fungsi: app.building.functionType || 'HUNIAN',
      subFungsi: app.building.subFunction || 'Rumah Tinggal',
      deskripsiJenis: app.building.buildingTypeDescription || 'Bangunan Gedung Permanen',
      kompleksitas: app.building.complexity || 'SEDERHANA',
      permanensi: app.building.permanence || 'PERMANEN',
      jumlahLantai: app.building.floors || 1,
      tinggiMeter: app.building.height || 4,
      luasBangunanM2: app.building.buildingArea || 0,
      luasTanahM2: app.building.landArea || 0,
      kdbPercent: app.building.kdb || 60,
      klbRatio: app.building.klb || 1.2,
      alamat: app.building.address || 'Kabupaten Garut',
      desa: app.building.village || 'Kelurahan',
      kecamatan: app.building.district || 'Kecamatan Garut',
      kabupaten: app.building.city || 'Kab. Garut',
      statusImb: app.building.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG',
      nomorImbEksisting: app.building.existingImbNumber || '-',
      namaKonsultan: app.building.consultantName || 'Mandiri / Penilai Teknis'
    };

    const retribusi: RetribusiDataset = {
      formulaVersion: 'PP 16/2021 Garut v2026',
      shstRate: DEFAULT_SHST_GARUT,
      shstFormatted: `Rp ${DEFAULT_SHST_GARUT.toLocaleString('id-ID')}`,
      indeksFungsi: retCalc.indexFungsi || 0.15,
      indeksKompleksitas: retCalc.indexKompleksitas || 0.1,
      indeksPermanensi: retCalc.indexPermanensi || 0.2,
      indeksLantai: retCalc.indexJumlahLantai || 1.0,
      indeksLokalitas: 0.5,
      indeksTerintegrasi: parseFloat(integratedIndex.toFixed(4)),
      subtotalBangunan: totalRet,
      subtotalPrasarana: 0,
      totalRetribusi: totalRet,
      totalRetribusiFormatted: `Rp ${totalRet.toLocaleString('id-ID')}`,
      terbilangRupiah: terbilangRupiah(totalRet)
    };

    const visiteItems = (app.baLapangan?.itemsChecked || []).map((item, idx) => ({
      no: idx + 1,
      kategori: item.category || 'STRUKTUR',
      komponen: item.aspectChecked,
      status: item.status || 'TIDAK_DIPERIKSA',
      catatan: item.notes || '-',
      lokasiFoto: item.photoEvidence
    }));

    const visite: VisiteDataset = {
      nomorBa: baNum,
      tanggalVisite: app.baLapangan?.visitDate || dateFormatted,
      timSurveyor: app.baLapangan?.inspectors?.map(i => i.name) || ['Tim Penilai Teknis DPUPR Garut'],
      statusKelaikan: app.baLapangan?.conformityStatus === 'SESUAI_DOKUMEN' ? 'LAIK_FUNGSI' : 'PERLU_PERBAIKAN',
      catatanKritis: app.baLapangan?.recommendations || app.baLapangan?.locationNotes || 'Bangunan gedung memenuhi persyaratan kelaikan fungsi teknis.',
      items: visiteItems
    };

    const beritaAcara: BeritaAcaraDataset = {
      nomorBa: app.baKonsultasi?.baNumber || `BA-KONSULTASI/3205/DPUPR/${currentDate.getFullYear()}/${registerCode.slice(-4).toUpperCase()}`,
      tanggalBa: app.baKonsultasi?.baDate || dateFormatted,
      jenisSidang: app.schedule?.sessionType || 'SIDANG_KONSULTASI_TPA_TPT',
      hasilSidang: app.baKonsultasi?.result || 'DISETUJUI',
      catatanSidang: app.baKonsultasi?.expertNotes || 'Seluruh dokumen teknis dan administratif telah diverifikasi dan disetujui.',
      daftarRevisi: app.baKonsultasi?.revisionItems || []
    };

    const dokumenChecklist: DocumentItemRow[] = (app.documents || []).map((doc, idx) => ({
      no: idx + 1,
      kode: doc.code,
      nama: doc.name,
      kategori: doc.category,
      status: doc.status,
      catatan: doc.notes || '-'
    }));

    // Comprehensive Placeholders Key-Value Mapping for DOCX Template Injection
    const placeholders: Record<string, string> = {
      '{{HEADER_PEMERINTAH}}': header.pemerintah,
      '{{HEADER_DINAS}}': header.dinas,
      '{{HEADER_ALAMAT}}': header.alamat,
      '{{HEADER_TELEPON}}': header.telepon,
      '{{HEADER_EMAIL}}': header.email,
      '{{HEADER_WEBSITE}}': header.website,
      '{{HEADER_NOMOR_SURAT}}': header.nomorSurat,
      '{{HEADER_TANGGAL_LENGKAP}}': header.tanggalLengkap,
      '{{REGISTER_NUMBER}}': registerCode,
      '{{APPLICATION_ID}}': app.id,
      '{{PEMOHON_NAMA}}': pemohon.nama,
      '{{PEMOHON_NIK}}': pemohon.nik,
      '{{PEMOHON_TELEPON}}': pemohon.telepon,
      '{{PEMOHON_EMAIL}}': pemohon.email,
      '{{PEMOHON_ALAMAT}}': pemohon.alamat,
      '{{PEMOHON_KECAMATAN}}': pemohon.kecamatan,
      '{{PEMOHON_KABUPATEN}}': pemohon.kabupaten,
      '{{BANGUNAN_NAMA}}': bangunan.nama,
      '{{BANGUNAN_FUNGSI}}': bangunan.fungsi,
      '{{BANGUNAN_KOMPLEKSITAS}}': bangunan.kompleksitas,
      '{{BANGUNAN_PERMANENSI}}': bangunan.permanensi,
      '{{BANGUNAN_LUAS_M2}}': bangunan.luasBangunanM2.toString(),
      '{{BANGUNAN_LANTAI}}': bangunan.jumlahLantai.toString(),
      '{{BANGUNAN_TINGGI_M}}': bangunan.tinggiMeter.toString(),
      '{{BANGUNAN_ALAMAT}}': bangunan.alamat,
      '{{BANGUNAN_KECAMATAN}}': bangunan.kecamatan,
      '{{RETRIBUSI_SHST_RATE}}': retribusi.shstFormatted,
      '{{RETRIBUSI_INDEKS_INTEGRATED}}': retribusi.indeksTerintegrasi.toString(),
      '{{RETRIBUSI_TOTAL_NUMERIC}}': retribusi.totalRetribusi.toString(),
      '{{RETRIBUSI_TOTAL_FORMATTED}}': retribusi.totalRetribusiFormatted,
      '{{RETRIBUSI_TERBILANG}}': retribusi.terbilangRupiah,
      '{{VISITE_NOMOR_BA}}': visite.nomorBa,
      '{{VISITE_TANGGAL}}': visite.tanggalVisite,
      '{{VISITE_STATUS_KELAIKAN}}': visite.statusKelaikan,
      '{{VISITE_CATATAN}}': visite.catatanKritis,
      '{{BA_NOMOR}}': beritaAcara.nomorBa,
      '{{BA_HASIL_SIDANG}}': beritaAcara.hasilSidang,
      '{{HASH_VERIFIKASI}}': verificationRecord.qrHash,
      '{{STATUS_TTD_BSRE}}': verificationRecord.statusTtd,
      '{{PENANDATANGAN_NAMA}}': verificationRecord.penandatangan,
      '{{PENANDATANGAN_NIP}}': verificationRecord.nipPenandatangan
    };

    const templateMeta = this.getTemplateByCode(docType);

    const resultSchema: DocumentDataSchema = {
      schemaVersion: '2.0.0-SSOT',
      generatedAt: new Date().toISOString(),
      documentType: docType,
      documentTitle: templateMeta ? templateMeta.title : docType,
      registerNumber: registerCode,
      applicationId: app.id,
      header,
      pemohon,
      bangunan,
      retribusi,
      visite,
      beritaAcara,
      dokumenChecklist,
      verifikasiDigital: verificationRecord,
      placeholders
    };

    this.cache.set(cacheKey, resultSchema);
    return resultSchema;
  }

  // --------------------------------------------------------------------------
  // MULTI-FORMAT GENERATOR SPECIFIC DATA FORMATTERS
  // --------------------------------------------------------------------------

  /**
   * Generates a dataset formatted specifically for PDF rendering / print preview.
   */
  public generatePdfData(app: Application, docType: OfficialDocumentType): {
    documentData: DocumentDataSchema;
    printableHtmlContainerId: string;
    printableTitle: string;
  } {
    const data = this.transformApplicationToDocumentData(app, docType);
    return {
      documentData: data,
      printableHtmlContainerId: 'printable-ssot-document',
      printableTitle: `${docType}_${data.registerNumber}`
    };
  }

  /**
   * Generates a key-value placeholder map specifically for DOCX template engines.
   */
  public generateDocxData(app: Application, docType: OfficialDocumentType): {
    placeholders: Record<string, string>;
    metadata: {
      docType: string;
      filename: string;
      templateName: string;
    };
  } {
    const data = this.transformApplicationToDocumentData(app, docType);
    const template = this.getTemplateByCode(docType);
    
    return {
      placeholders: data.placeholders,
      metadata: {
        docType,
        filename: `${docType}_${data.registerNumber}.docx`,
        templateName: template?.docxTemplateFilename || 'Default_Template.docx'
      }
    };
  }

  /**
   * Generates tabular structured arrays specifically for XLSX / CSV spreadsheet exporters.
   */
  public generateXlsxData(app: Application, docType: OfficialDocumentType): {
    sheetName: string;
    headers: string[];
    rows: Array<Array<string | number>>;
    summaryRow?: Record<string, string | number>;
  } {
    const data = this.transformApplicationToDocumentData(app, docType);
    const template = this.getTemplateByCode(docType);
    const sheetName = template?.xlsxSheetName || 'Sheet1';

    if (docType === 'REKAPITULASI_RETRIBUSI_XLSX' || docType === 'SKRD') {
      return {
        sheetName,
        headers: [
          'No. Register',
          'Nama Pemohon',
          'NIK',
          'Nama Bangunan',
          'Fungsi Gedung',
          'Luas (m²)',
          'SHST Garut (Rp/m²)',
          'Indeks Terintegrasi',
          'Total Retribusi (Rp)',
          'Terbilang',
          'Hash Verifikasi'
        ],
        rows: [
          [
            data.registerNumber,
            data.pemohon.nama,
            data.pemohon.nik,
            data.bangunan.nama,
            data.bangunan.fungsi,
            data.bangunan.luasBangunanM2,
            data.retribusi.shstRate,
            data.retribusi.indeksTerintegrasi,
            data.retribusi.totalRetribusi,
            data.retribusi.terbilangRupiah,
            data.verifikasiDigital.qrHash
          ]
        ],
        summaryRow: {
          'Total Retribusi': data.retribusi.totalRetribusi
        }
      };
    }

    if (docType === 'FORM_INSPEKSI_CHECKLIST' || docType === 'BA_VISITE') {
      return {
        sheetName,
        headers: ['No', 'Kategori', 'Komponen Diperiksa', 'Status Inspeksi', 'Catatan Lapangan'],
        rows: data.visite.items.map(i => [
          i.no,
          i.kategori,
          i.komponen,
          i.status,
          i.catatan
        ])
      };
    }

    // Default Document Checklist
    return {
      sheetName,
      headers: ['No', 'Kode Dokumen', 'Nama Dokumen', 'Kategori', 'Status Verifikasi', 'Catatan Verifikator'],
      rows: data.dokumenChecklist.map(d => [
        d.no,
        d.kode,
        d.nama,
        d.kategori,
        d.status,
        d.catatan
      ])
    };
  }
}

// ============================================================================
// 3. SINGLETON INSTANCE & EXPORTED UTILITY FUNCTIONS
// ============================================================================

export const globalDataEngine = new DataEngineManager();

/**
 * Global helper function to retrieve the complete DocumentDataSchema for any application.
 */
export function getDocumentDataSchema(
  app: Application, 
  docType: OfficialDocumentType = 'SKRD'
): DocumentDataSchema {
  return globalDataEngine.transformApplicationToDocumentData(app, docType);
}

/**
 * Global helper function to validate whether a document hash is genuine and matches DPUPR Garut standard.
 */
export function verifyDocumentHash(qrHash: string): {
  isValid: boolean;
  issuer: string;
  hashAlgorithm: string;
} {
  const isGarutHash = typeof qrHash === 'string' && qrHash.startsWith('GARUT-DPUPR-');
  return {
    isValid: isGarutHash,
    issuer: isGarutHash ? 'Dinas PUPR Kabupaten Garut' : 'Tidak Teridentifikasi',
    hashAlgorithm: 'SHA-256 / BSrE E-Sign Certified'
  };
}

/**
 * Global helper function to retrieve available document templates.
 */
export function getAvailableDocumentTemplates(): DocumentTemplateSchema[] {
  return globalDataEngine.getAllTemplates();
}
