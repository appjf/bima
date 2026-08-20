/**
 * Type definitions for Sistem Asisten Operator SIMBG Otomatis
 */

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'OPERATOR_SIMBG'
  | 'TPA_TPT'
  | 'PIMPINAN'
  | 'AUDITOR';

export type ApplicationStatus =
  | 'NEW'
  | 'UNDER_VERIFICATION'
  | 'INCOMPLETE'
  | 'REVISION_REQUESTED'
  | 'REVERIFICATION'
  | 'COMPLETE'
  | 'READY_FOR_CONSULTATION'
  | 'SCHEDULED'
  | 'CONSULTATION_DONE'
  | 'RETRIBUTION_READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type BuildingFunction =
  | 'HUNIAN'
  | 'USAHA'
  | 'KEAGAMAAN'
  | 'SOSIAL_BUDAYA'
  | 'KHUSUS'
  | 'CAMPURAN'
  | string;

export type BuildingComplexity =
  | 'SEDERHANA'
  | 'TIDAK_SEDERHANA'
  | 'KHUSUS';

export type DocumentStatus =
  | 'BELUM_ADA'
  | 'TERUNGGAH'
  | 'VALIDASI_ADMINISTRATIF'
  | 'PERLU_PERBAIKAN'
  | 'VALID'
  | 'TIDAK_SESUAI'
  | 'TIDAK_DIPERSYARATKAN';


export interface VerificationIteration {
  iterationNumber: number;
  date: string;
  result: 'DITERIMA' | 'PERBAIKAN' | 'DITOLAK';
  documentsSnapshot: DocumentItem[];
}

export interface DocumentItem {
  id: string;
  code: string;
  name: string;
  category: 'TANAH' | 'UMUM' | 'ARSITEKTUR' | 'STRUKTUR' | 'MEP';
  isMandatory: boolean;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  driveUrl?: string;
  notes?: string;
  hasErrorTag?: string; // e.g. "#REF!", "#ERROR!", "CORRUPT"
  includedInDaftarSimak?: boolean; // Toggle for inclusion in Cetak Daftar Simak (PDF)
}

export interface Applicant {
  name: string;
  nik?: string;
  phone: string;
  email: string;
  address: string;
  npwp?: string;
  village?: string; // Desa/Kel. Pemilik
  district?: string; // Kec. Pemilik
  city?: string; // Kab. Pemilik (e.g. Kab. Garut)
}

export type ApplicationPermitType =
  | 'PBG_BARU'
  | 'SLF_EKSISTING'
  | 'PBG_PERUBAHAN'
  | 'SLF_PERPANJANGAN';

export type WorkflowStage =
  | 'STAGE_1_INPUT_DATA'
  | 'STAGE_2_MULTI_VERIFIKASI'
  | 'STAGE_VISITE_LAPANGAN_SLF' // Khusus Permohonan SLF: Visite Lapangan -> BA Lapangan
  | 'STAGE_3_SURAT_PEMBERITAHUAN'
  | 'STAGE_4_BA_KONSULTASI'
  | 'STAGE_5_VERIFIKASI_PERBAIKAN'
  | 'STAGE_6_BA_PLENO'
  | 'STAGE_7_PERHITUNGAN_SKRD'
  | 'STAGE_8_SELESAI';

export type ExistingImbStatus = 
  | 'BELUM_MEMILIKI_IMB_PBG'
  | 'SUDAH_MEMILIKI_IMB'
  | 'SUDAH_MEMILIKI_PBG'
  | 'BEBAS_RETRIBUSI_KEAGAMAAN';

export interface FieldVisitPhoto {
  id: string;
  tag: string; // e.g. 'Tampak Depan', 'Struktur Kolom', 'Panel MEP', 'APAR / Damkar', 'GSB & Drainase'
  dataUrl: string;
  url?: string;
  caption: string;
  timestamp: string;
}

export interface FieldVisitItem {
  id: string;
  category: 'ARSITEKTUR' | 'STRUKTUR' | 'MEP' | 'TATA_RUANG_UMUM';
  aspectChecked: string;
  status: 'SESUAI' | 'TIDAK_SESUAI' | 'CATATAN_KHUSUS';
  notes?: string;
  photoEvidence?: string;
}

export interface SuratUndanganVisite {
  letterNumber: string; // e.g. "600.1.15/048/DPUPR-BG/2026"
  letterDate: string;
  nature: 'BIASA' | 'SEGERA' | 'PENTING' | 'AMAT_SEGERA';
  attachments: string;
  subject: string;
  recipientName: string;
  recipientRole?: string;
  recipientAddress?: string;
  visitDate: string;
  visitTime: string;
  meetingPoint: string;
  agenda: string;
  assignedInspectors: { name: string; nip?: string; role: string }[];
  instructions: string[];
  contactPerson: { name: string; phone: string; role: string };
  signerName: string;
  signerNip: string;
  signerRole: string;
  isSigned: boolean;
  signedAt?: string;
  tteToken?: string;
  notes?: string;
}

export interface BeritaAcaraLapangan {
  baLapanganNumber: string; // e.g. "BA-VISITE/042/DPUPR-GRT/2026"
  visitDate: string;
  visitTime?: string;
  inspectors: { name: string; role: string; nip?: string; present?: boolean }[];
  attendeesOwner?: { name: string; role: string; phone?: string; nik?: string };
  locationNotes: string;
  itemsChecked: FieldVisitItem[];
  photos?: FieldVisitPhoto[];
  conformityStatus: 'SESUAI_DOKUMEN' | 'PERLU_PENYESUAIAN_LAPORAN' | 'TIDAK_SESUAI';
  recommendations: string;
  isCompleted: boolean;
  completedAt?: string;
  perwakilanTtdUrl?: string;

  // TTE (Tanda Tangan Elektronik) Verification fields
  isTteSigned?: boolean;
  tteSignedAt?: string;
  tteToken?: string;
  tteSignerName?: string;
  tteSignerNip?: string;
  tteCertificateSerial?: string; // BSrE certificate ID

  // New fields from the official PDF
  kondisiLapangan?: {
    tanahKosong?: boolean;
    adaBangunanLama?: boolean;
    bongkarKeseluruhan?: boolean;
    bongkarSebagian?: boolean;
    bangunanSudahJadi?: boolean;
  };
  kondisiKegiatan?: {
    belumAdaKegiatan?: boolean;
    sedangAdaKegiatan?: boolean;
    sedangAdaKegiatanPersen?: string;
    selesaiDikerjakan?: boolean;
  };
  fungsiBangunanTerpilih?: 'HUNIAN' | 'KEAGAMAAN' | 'USAHA' | 'SOSIAL_BUDAYA' | 'KHUSUS' | 'CAMPURAN';
  keteranganLain?: string;

  // Parameters Table fields
  paramSertifikatLuas?: string;
  paramSertifikatNomor?: string;
  paramKrkJenisBangunan?: string;
  paramKrkJumlahLantai?: string;
  paramKrkJumlahLantaiKet?: string; // 'OK' | 'LEBIH'
  paramKrkKdb?: string;
  paramKrkKdbKet?: string; // 'OK' | 'LEBIH'
  paramKrkKlb?: string;
  paramKrkKlbKet?: string; // 'OK' | 'LEBIH'
  paramKrkKdh?: string;
  paramKrkKdhKet?: string; // 'OK' | 'KURANG'
  paramKrkLuasPerkerasan?: string;
  paramKrkPanjangPagar?: string;
  paramKrkGsj?: string;
  paramKrkGsbDepan?: string;
  paramKrkGsbBelakang?: string;
  paramKrkGsbKanan?: string;
  paramKrkGsbKiri?: string;

  // Classification fields
  paramKlasifikasiKompleksitas?: 'SEDERHANA' | 'TIDAK_SEDERHANA' | 'KHUSUS';
  paramKlasifikasiPermanensi?: 'DIATAS_5_TAHUN' | 'DIBAWAH_5_TAHUN';
  paramKlasifikasiKepadatan?: 'TINGGI' | 'SEDANG' | 'RENDAH';
  paramKlasifikasiKetinggian?: 'RENDAH_1_4_LT' | 'SEDANG_5_8_LT' | 'TINGGI_GT_8_LT';
  paramKlasifikasiKepemilikan?: 'PERORANGAN' | 'BADAN' | 'PEMERINTAH';
  paramKlasifikasiFungsiJalan?: 'JALAN_KOLEKTOR' | 'LOKAL' | 'ARTERI' | 'LINGKUNGAN' | 'PERUMAHAN';
}

export interface VerificationReview {
  id: string;
  discipline: 'UMUM' | 'ARSITEKTUR' | 'STRUKTUR' | 'MEP' | 'UMUM';
  verifierName: string;
  verifiedAt: string;
  status: 'VALID' | 'PERLU_PERBAIKAN' | 'MENUNGGU';
  notes?: string;
  revisionsRequested?: string[];
}

export interface ConsultationNoticeLetter {
  letterNumber: string;
  letterDate: string;
  scheduledDate: string;
  timeSlot: string;
  room: string;
  signeeName: string;
  signeeNip: string;
  isIssued: boolean;
  issuedAt?: string;
}

export interface FieldConsultationEvaluation {
  field: 'ARSITEKTUR' | 'STRUKTUR' | 'MEP';
  expertName: string;
  result: 'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG';
  notes: string;
  revisionItems: string[];
  updatedAt: string;
}

export interface ConsultationHistoryItem {
  id: string;
  timestamp: string;
  sessionTitle: string;
  overallResult: 'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG';
  evaluations: FieldConsultationEvaluation[];
  summaryNotes: string;
}

export interface BeritaAcaraKonsultasi {
  baNumber: string;
  baDate: string;
  result: 'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG';
  expertNotes: string;
  revisionItems: string[];
  arsitekturRevisions?: string[];
  strukturRevisions?: string[];
  mepRevisions?: string[];
  revisionDeadline?: string;
  attendees: { name: string; role: string; present: boolean }[];
  isFinalized: boolean;
  // Field-specific evaluations by TPA experts
  fieldEvaluations?: FieldConsultationEvaluation[];
  // History log of previous consultation sessions & revisions
  history?: ConsultationHistoryItem[];
}

export interface BeritaAcaraPleno {
  baPlenoNumber: string;
  rekomtekNumber: string;
  plenoDate: string;
  conclusion: 'DISETUJUI_PENERBITAN_PBG' | 'DITOLAK';
  notes: string;
  leadExpertName: string;
  leadExpertNip?: string;
  isSigned: boolean;
  arsitekturNotes?: string[];
  strukturNotes?: string[];
  mepNotes?: string[];
  attendants?: { name: string; role: string; present?: boolean }[];
}

export interface BuildingInfo {
  name: string; // Nama Bangunan Gedung
  functionType: BuildingFunction; // Fungsi Bangunan
  subFunction?: string; // Sub Fungsi Bangunan
  buildingTypeDescription?: string; // Jenis Bangunan Gedung
  complexity: BuildingComplexity;
  address: string; // Lokasi Bangunan Gedung
  district: string; // Kecamatan
  village: string; // Desa/Kelurahan
  city?: string; // Kab.
  landArea: number; // m²
  buildingArea: number; // Luas Bangunan Gedung (m²)
  floors: number;
  numberOfFloors?: number; // Alias for floors
  height: number; // meter
  kdb: number; // Koefisien Dasar Bangunan (%)
  klb: number; // Koefisien Lantai Bangunan
  permanence: 'PERMANEN' | 'SEMI_PERMANEN' | 'NON_PERMANEN';
  existingImbStatus?: ExistingImbStatus; // Status kepemilikan IMB/PBG eksisting
  existingImbNumber?: string;
  consultantName?: string; // Nama Konsultan
}

export interface RetributionComponent {
  id: string;
  name: string;
  volume: number;
  unit: string;
  index: number;
  unitPrice: number;
  subtotal: number;
}

export interface RetributionCalculation {
  id: string;
  formulaVersion: string;
  calculatedAt: string;
  calculatedBy: string;
  lastCalculated?: string;
  // Building Indexes (PP 16/2021)
  indexFungsi: number;
  indexKompleksitas: number;
  indexPermanensi: number;
  indexJumlahLantai: number;
  indeksLokalitas: number;
  shst: number; // Standar Harga Satuan Tertinggi (Rp/m²)
  totalBuildingArea?: number;
  buildingRetribution?: number;
  buildingSubtotal: number;
  
  // Infrastructure
  infrastructureItems: RetributionComponent[];
  infrastructureRetribution?: number;
  infrastructureSubtotal: number;

  // Dual calculation verification
  totalPrimary: number; // Calculation A
  totalSecondary: number; // Calculation B
  variance: number; // Math.abs(A - B)
  isVerified: boolean;
  finalRetribution: number;
  status: 'DRAFT' | 'VERIFIED' | 'APPROVED' | 'SKRD_ISSUED' | 'UNPAID';
  notes?: string;
  components?: any[];
}

export interface ConsultationSchedule {
  id: string;
  scheduleDate: string; // YYYY-MM-DD (typically Friday)
  timeSlot: string; // e.g. "08:30 - 09:15"
  room: string;
  sessionType: 'SIDANG_TPA' | 'KONSULTASI_TPT';
  assignedExperts: {
    name: string;
    expertise: string;
    role: 'KETUA' | 'ANGGOTA' | 'SEKRETARIAT';
  }[];
  attendanceToken: string;
  applicantAttended?: boolean;
  attendanceTimestamp?: string;
  consultationNotes?: string;
  consultationResult?: 'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG';
  revisionDeadline?: string;
}

export interface StatusAuditLog {
  id: string;
  timestamp: string;
  fromStatus: ApplicationStatus | string;
  toStatus: ApplicationStatus | string;
  actorName: string;
  actorRole: string;
  notes?: string;
  stageName?: string;
}

export type ASNRoleCategory = 
  | 'OPERATOR' 
  | 'TPA' 
  | 'TPT' 
  | 'PENGAWAS' 
  | 'KABID' 
  | 'KADIN';

export interface ASNPersonnel {
  id: string;
  nip: string;
  name: string;
  roleCategory: ASNRoleCategory;
  positionTitle: string; // e.g. "Operator Teknis Verifikasi", "Anggota TPA Arsitektur", "Kepala Bidang Bangunan"
  subSpecialty?: string; // e.g. "Arsitektur", "Struktur", "MEP", "Tata Ruang"
  phone?: string;
  email?: string;
  isActive: boolean;
  signatureDataUrl?: string;
  qrCodeUrl?: string;
  updatedAt: string;
}

export interface PrasaranaPriceConfig {
  id: string; // The label of the infrastructure
  label: string;
  unit: string;
  price: number;
  updatedAt: string;
  updatedBy: string;
}

export interface Application {
  id: string;
  registerNumber: string; // e.g. "PBG-320501-18082026-001"
  applicationNumber: string;
  submissionDate: string;
  permitType?: ApplicationPermitType; // 'PBG_BARU' | 'SLF_EKSISTING' | etc.
  status: ApplicationStatus;
  statusAuditLogs?: StatusAuditLog[];
  currentStage?: WorkflowStage; // Explicit workflow tracker
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  applicant: Applicant;
  building: BuildingInfo;
  documents: DocumentItem[];
  verificationIterations?: VerificationIteration[];
  multiVerifications?: VerificationReview[]; // Multi-verifikator reviews
  undanganVisite?: SuratUndanganVisite; // Surat Undangan Pemeriksaan Lapangan / Visite
  baLapangan?: BeritaAcaraLapangan; // Khusus SLF: Berita Acara Visite Lapangan
  consultationNotice?: ConsultationNoticeLetter; // Surat Pemberitahuan Konsultasi
  baKonsultasi?: BeritaAcaraKonsultasi; // BA Konsultasi Teknis
  multiVerifikasiPerbaikan?: VerificationReview[]; // Multi-verifikasi perbaikan
  baPleno?: BeritaAcaraPleno; // BA Sidang Pleno / Rekomtek
  retribution?: RetributionCalculation;
  schedule?: ConsultationSchedule;
  slaDays: number;
  slaDeadline: string;
  slaStatus: 'IN_SLA' | 'WARNING' | 'EXCEEDED';
  dataQualityScore: number; // 0 - 100%
  dataErrors: string[];
  assignedOperator: string;
  internalNotes: string;
  lastUpdated: string;
}

export interface NotificationLog {
  id: string;
  applicationId: string;
  registerNumber: string;
  recipientName: string;
  recipientPhone: string;
  templateType: 
    | 'PERMOHONAN_MASUK' 
    | 'DOKUMEN_KURANG' 
    | 'JADWAL_KONSULTASI' 
    | 'REMINDER_KONSULTASI' 
    | 'HASIL_KONSULTASI' 
    | 'SKRD_TERBIT'
    | 'VISITE_LAPANGAN'
    | 'PENERBITAN_PBG_SLF'
    | 'PERMOHONAN_BATAL'
    | string;
  message: string;
  channel: 'WHATSAPP';
  status: 'SENT' | 'DELIVERED' | 'PENDING' | 'FAILED';
  createdAt: string;
  sentAt?: string;
  retryCount: number;
  errorMessage?: string;
}

export type { WhatsAppTemplate, WhatsAppSettings, WhatsAppTemplateTag } from './lib/notificationTemplateEngine';


export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetId: string;
  targetRegister: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  ipSource?: string;
}

export interface DataQualityIssue {
  id: string;
  applicationId: string;
  registerNumber: string;
  applicantName: string;
  field: string;
  issueType: 'ERROR_FORMULA' | 'REF_ERROR' | 'DUPLICATE_REGISTER' | 'INVALID_PHONE' | 'MISSING_DATE' | 'SUSPICIOUS_AREA';
  rawSnippet: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  suggestion: string;
}

export interface DailyBriefing {
  date: string;
  totalPendingVerification: number;
  totalNeedsRevision: number;
  totalReadyForConsultation: number;
  totalFridayScheduled: number;
  totalSlaWarning: number;
  totalFailedNotifications: number;
  keyHighlights: string[];
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
