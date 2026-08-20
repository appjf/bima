import { 
  Application, 
  UserAccount, 
  NotificationLog, 
  StatusAuditLog, 
  PrasaranaPriceConfig,
  DocumentItem,
  Applicant,
  BuildingInfo
} from '../types';
import { INITIAL_APPLICATIONS } from '../data/initialData';
import { INITIAL_USER_ACCOUNTS } from '../lib/accountEngine';

export type DatabaseTargetTable = 
  | 'APPLICATIONS'
  | 'USER_ACCOUNTS'
  | 'NOTIFICATION_LOGS'
  | 'STATUS_AUDIT_LOGS'
  | 'PRASARANA_PRICES'
  | 'FULL_BUNDLE';

export interface TableMetaInfo {
  id: DatabaseTargetTable;
  tableName: string;
  label: string;
  description: string;
  iconName: string;
  supportedFormats: ('JSON' | 'CSV')[];
  primaryKey: string;
  columns: {
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'json' | 'date';
    required: boolean;
    description: string;
    example: string;
  }[];
}

export const DATABASE_TABLE_METAS: Record<DatabaseTargetTable, TableMetaInfo> = {
  APPLICATIONS: {
    id: 'APPLICATIONS',
    tableName: 'applications',
    label: 'Permohonan PBG / SLF',
    description: 'Data berkas permohonan SIMBG, identitas pemohon, spesifikasi bangunan gedung, status verifikasi, dan retribusi.',
    iconName: 'FileText',
    supportedFormats: ['JSON', 'CSV'],
    primaryKey: 'register_number / id',
    columns: [
      { name: 'registerNumber', label: 'Nomor Register', type: 'string', required: true, description: 'Format SIMBG resmi (mis. PBG-320501-18082026-001)', example: 'PBG-320501-20082026-001' },
      { name: 'applicantName', label: 'Nama Pemohon', type: 'string', required: true, description: 'Nama lengkap pemohon atau badan usaha', example: 'H. Ahmad Supriyadi' },
      { name: 'applicantPhone', label: 'No. WhatsApp Pemohon', type: 'string', required: true, description: 'Nomor kontak aktif pemohon', example: '08122334455' },
      { name: 'applicantEmail', label: 'Email Pemohon', type: 'string', required: false, description: 'Email resmi korespondensi', example: 'ahmad@example.com' },
      { name: 'buildingName', label: 'Nama Bangunan Gedung', type: 'string', required: true, description: 'Nama obyek bangunan', example: 'Ruko & Hunian Sentra Niaga Tarogong' },
      { name: 'functionType', label: 'Fungsi Bangunan', type: 'string', required: true, description: 'HUNIAN, USAHA, SOSIAL_BUDAYA, KEAGAMAAN, KHUSUS, CAMPURAN', example: 'USAHA' },
      { name: 'buildingDistrict', label: 'Kecamatan Bangunan', type: 'string', required: true, description: 'Lokasi kecamatan di Kab. Garut', example: 'Tarogong Kidul' },
      { name: 'buildingVillage', label: 'Desa/Kelurahan', type: 'string', required: true, description: 'Lokasi desa/kelurahan', example: 'Jayawaras' },
      { name: 'buildingArea', label: 'Luas Bangunan (m²)', type: 'number', required: true, description: 'Luas total lantai bangunan gedung', example: '250' },
      { name: 'landArea', label: 'Luas Tanah (m²)', type: 'number', required: false, description: 'Luas kavling/tapak tanah', example: '350' },
      { name: 'floors', label: 'Jumlah Lantai', type: 'number', required: true, description: 'Jumlah tingkat/lantai bangunan', example: '2' },
      { name: 'height', label: 'Tinggi Bangunan (m)', type: 'number', required: false, description: 'Tinggi dalam meter', example: '8.5' },
      { name: 'permitType', label: 'Jenis Permohonan', type: 'string', required: false, description: 'PBG_BARU, SLF_EKSISTING, PBG_PERUBAHAN, SLF_PERPANJANGAN', example: 'PBG_BARU' },
      { name: 'status', label: 'Status Alur', type: 'string', required: true, description: 'NEW, UNDER_VERIFICATION, INCOMPLETE, READY_FOR_CONSULTATION, SCHEDULED, RETRIBUTION_READY, COMPLETED', example: 'UNDER_VERIFICATION' },
      { name: 'submissionDate', label: 'Tanggal Pengajuan', type: 'date', required: false, description: 'Format YYYY-MM-DD', example: '2026-08-20' }
    ]
  },
  USER_ACCOUNTS: {
    id: 'USER_ACCOUNTS',
    tableName: 'user_accounts',
    label: 'Akun Pengguna & Personel ASN',
    description: 'Data akun operator dinas, tim TPA/TPT, pimpinan, dan hak akses matriks otorisasi SIMBG DPUPR.',
    iconName: 'Users',
    supportedFormats: ['JSON', 'CSV'],
    primaryKey: 'username / id',
    columns: [
      { name: 'username', label: 'Username', type: 'string', required: true, description: 'ID login unik', example: 'op_garut_pusat' },
      { name: 'name', label: 'Nama Lengkap & Gelar', type: 'string', required: true, description: 'Nama resmi ASN/TPA', example: 'Ir. Hendra Gunawan, S.T., M.T.' },
      { name: 'nip', label: 'NIP (Jika ASN)', type: 'string', required: false, description: 'Nomor Induk Pegawai 18 digit', example: '198405122009021003' },
      { name: 'email', label: 'Email Dinas', type: 'string', required: true, description: 'Alamat surel dinas', example: 'hendra.pupr@garutkab.go.id' },
      { name: 'role', label: 'Peran Operasional', type: 'string', required: true, description: 'OPERATOR_SIMBG, TPA_TPT, PIMPINAN, AUDITOR, SUPER_ADMIN', example: 'OPERATOR_SIMBG' },
      { name: 'positionTitle', label: 'Jabatan Struktural', type: 'string', required: true, description: 'Jabatan kedinasan di DPUPR Garut', example: 'Operator Verifikasi Teknis SIMBG' },
      { name: 'subSpecialty', label: 'Sub-Spesialisasi', type: 'string', required: false, description: 'Arsitektur, Struktur, MEP, Tata Ruang', example: 'Arsitektur' },
      { name: 'phone', label: 'Nomor WhatsApp', type: 'string', required: false, description: 'Kontak WhatsApp dinas', example: '081322998877' },
      { name: 'isActive', label: 'Status Aktif', type: 'boolean', required: true, description: 'TRUE jika akun aktif, FALSE jika nonaktif', example: 'true' }
    ]
  },
  NOTIFICATION_LOGS: {
    id: 'NOTIFICATION_LOGS',
    tableName: 'notification_logs',
    label: 'Log Notifikasi WhatsApp',
    description: 'Riwayat pengiriman notifikasi WhatsApp otomatis kepada pemohon SIMBG, undangan sidang, dan pemberitahuan SKRD.',
    iconName: 'MessageSquare',
    supportedFormats: ['JSON', 'CSV'],
    primaryKey: 'id',
    columns: [
      { name: 'id', label: 'ID Log Notifikasi', type: 'string', required: true, description: 'Identifier unik (mis. NOTIF-001)', example: 'NOTIF-2026-001' },
      { name: 'registerNumber', label: 'Nomor Register Permohonan', type: 'string', required: true, description: 'Register berkas terkait', example: 'PBG-320501-20082026-001' },
      { name: 'recipientName', label: 'Nama Penerima', type: 'string', required: true, description: 'Nama pemohon atau penanggung jawab', example: 'H. Ahmad Supriyadi' },
      { name: 'recipientPhone', label: 'No. WA Penerima', type: 'string', required: true, description: 'Nomor telepon tujuan', example: '08122334455' },
      { name: 'templateType', label: 'Tipe Template', type: 'string', required: true, description: 'VERIFIKASI_VALID, PERLU_PERBAIKAN, UNDANGAN_SIDANG, RETRIBUSI_TERBIT, dll', example: 'VERIFIKASI_VALID' },
      { name: 'message', label: 'Isi Pesan', type: 'string', required: true, description: 'Teks pesan notifikasi terkirim', example: 'Halo H. Ahmad Supriyadi, berkas PBG-320501-20082026-001 dinyatakan LENGKAP.' },
      { name: 'status', label: 'Status Pengiriman', type: 'string', required: true, description: 'SENT, PENDING, FAILED', example: 'SENT' },
      { name: 'channel', label: 'Kanal Pesan', type: 'string', required: false, description: 'WHATSAPP, SMS, EMAIL', example: 'WHATSAPP' },
      { name: 'createdAt', label: 'Waktu Pengiriman', type: 'date', required: false, description: 'Format ISO atau YYYY-MM-DD HH:mm:ss', example: '2026-08-20T09:30:00Z' }
    ]
  },
  STATUS_AUDIT_LOGS: {
    id: 'STATUS_AUDIT_LOGS',
    tableName: 'status_audit_logs',
    label: 'Jejak Rekam & Audit Trail Alur',
    description: 'Audit log perubahan tahapan, riwayat penolakan/perbaikan, operator pengubah, dan stempel waktu legal.',
    iconName: 'ShieldCheck',
    supportedFormats: ['JSON', 'CSV'],
    primaryKey: 'id',
    columns: [
      { name: 'id', label: 'ID Log Audit', type: 'string', required: true, description: 'Identifier unik (mis. AUDIT-001)', example: 'AUDIT-2026-001' },
      { name: 'registerNumber', label: 'Nomor Register Permohonan', type: 'string', required: true, description: 'Register berkas terkait', example: 'PBG-320501-20082026-001' },
      { name: 'fromStatus', label: 'Status Asal', type: 'string', required: true, description: 'Status sebelum diubah', example: 'NEW' },
      { name: 'toStatus', label: 'Status Baru', type: 'string', required: true, description: 'Status setelah diubah', example: 'UNDER_VERIFICATION' },
      { name: 'actorName', label: 'Petugas / Aktor', type: 'string', required: true, description: 'Nama operator penanggung jawab', example: 'Rian Sulaeman (Operator SIMBG)' },
      { name: 'actorRole', label: 'Peran Petugas', type: 'string', required: true, description: 'OPERATOR_SIMBG, TPA_TPT, PIMPINAN, dll', example: 'OPERATOR_SIMBG' },
      { name: 'stageName', label: 'Tahapan Alur', type: 'string', required: false, description: 'Nama tahapan alur SIMBG', example: 'STAGE_2_MULTI_VERIFIKASI' },
      { name: 'notes', label: 'Catatan Perubahan', type: 'string', required: false, description: 'Uraian keterangan tindakan', example: 'Menerima berkas dan memulai verifikasi dokumen arsitektur dan struktur' },
      { name: 'timestamp', label: 'Waktu Tindakan', type: 'date', required: true, description: 'Stempel waktu perubahan', example: '2026-08-20T08:15:00Z' }
    ]
  },
  PRASARANA_PRICES: {
    id: 'PRASARANA_PRICES',
    tableName: 'prasarana_prices',
    label: 'Daftar Tarif Retribusi Prasarana',
    description: 'Komponen tarif dan indeks harga satuan retribusi prasarana bangunan (Pagar, Kolam, Saluran, dsb) sesuai Perda Garut.',
    iconName: 'Coins',
    supportedFormats: ['JSON', 'CSV'],
    primaryKey: 'id / label',
    columns: [
      { name: 'id', label: 'Kode / ID Prasarana', type: 'string', required: true, description: 'Identifier unik (mis. PAGAR, SALURAN)', example: 'PAGAR_PEMBATAS' },
      { name: 'label', label: 'Nama Komponen Prasarana', type: 'string', required: true, description: 'Nama prasarana bangunan', example: 'Pagar Pembatas / Tembok Keliling' },
      { name: 'unit', label: 'Satuan Ukuran', type: 'string', required: true, description: 'm1 (meter panjang), m2 (luas), m3 (volume), unit', example: 'm1' },
      { name: 'price', label: 'Tarif Satuan (Rp)', type: 'number', required: true, description: 'Besaran nominal rupiah per satuan', example: '45000' },
      { name: 'updatedBy', label: 'Petugas Pemutakhiran', type: 'string', required: false, description: 'Nama ASN yang menginput tarif', example: 'Tim Teknis Retribusi DPUPR' }
    ]
  },
  FULL_BUNDLE: {
    id: 'FULL_BUNDLE',
    tableName: 'all_tables_bundle',
    label: 'Semua Tabel Terpadu (All-in-One Backup)',
    description: 'Paket arsip JSON lengkap mencakup 5 basis data (Permohonan, Akun ASN, Notifikasi WA, Audit Trail, dan Tarif Prasarana).',
    iconName: 'Database',
    supportedFormats: ['JSON'],
    primaryKey: 'bundle_signature',
    columns: [
      { name: 'version', label: 'Versi Cadangan', type: 'string', required: true, description: 'Nomor versi arsip', example: 'SIMBG-GARUT-V2-2026' },
      { name: 'applications', label: 'Array Permohonan', type: 'json', required: true, description: 'Daftar berkas permohonan', example: '[{ ... }]' },
      { name: 'userAccounts', label: 'Array Akun Pengguna', type: 'json', required: true, description: 'Daftar akun pengguna', example: '[{ ... }]' },
      { name: 'notificationLogs', label: 'Array Log Notifikasi', type: 'json', required: false, description: 'Daftar log notifikasi', example: '[{ ... }]' },
      { name: 'statusAuditLogs', label: 'Array Audit Trail', type: 'json', required: false, description: 'Daftar log audit status', example: '[{ ... }]' },
      { name: 'prasaranaPrices', label: 'Array Tarif Prasarana', type: 'json', required: false, description: 'Daftar tarif retribusi prasarana', example: '[{ ... }]' }
    ]
  }
};

/**
 * Generates sample CSV template string for a specific table
 */
export function generateSampleCsvTemplate(table: DatabaseTargetTable): string {
  switch (table) {
    case 'APPLICATIONS':
      return [
        'registerNumber,applicantName,applicantPhone,applicantEmail,buildingName,functionType,buildingDistrict,buildingVillage,buildingArea,landArea,floors,height,permitType,status,submissionDate',
        'PBG-320501-20082026-001,H. Ahmad Supriyadi,08122334455,ahmad.supriyadi@gmail.com,Ruko Sentra Niaga Tarogong,USAHA,Tarogong Kidul,Jayawaras,250,350,2,8.5,PBG_BARU,UNDER_VERIFICATION,2026-08-20',
        'PBG-320502-20082026-002,Dra. Hj. Siti Rohayah,08139988776,siti.rohayah@yahoo.com,Rumah Tinggal Sejahtera,HUNIAN,Garut Kota,Paminggir,180,220,1,4.2,PBG_BARU,READY_FOR_CONSULTATION,2026-08-19',
        'SLF-320503-20082026-003,PT Karya Garut Makmur,08521122334,info@karyagarut.co.id,Gedung Kantor & Workshop,USAHA,Karangpawitan,Sindanglaya,600,1200,3,12.0,SLF_EKSISTING,NEW,2026-08-20'
      ].join('\n');

    case 'USER_ACCOUNTS':
      return [
        'username,name,nip,email,role,positionTitle,subSpecialty,phone,isActive',
        'op_verif_1,Asep Kurniawan S.T.,198804152011011004,asep.verif@garutkab.go.id,OPERATOR_SIMBG,Operator Verifikasi Teknis,Arsitektur,081322110099,true',
        'tpa_ars_1,Prof. Dr. Ir. H. Bambang Setiadi M.Sc.,196510101991031002,bambang.tpa@garutkab.go.id,TPA_TPT,Anggota Tim TPA Garut,Arsitektur & Cagar Budaya,08122003344,true',
        'kabid_bg,H. Deden Kusnadi S.T. M.Si.,197508202002121003,kabid.bg@garutkab.go.id,PIMPINAN,Kepala Bidang Bangunan Gedung,Manajemen Konstruksi,08112233445,true'
      ].join('\n');

    case 'NOTIFICATION_LOGS':
      return [
        'id,registerNumber,recipientName,recipientPhone,templateType,message,status,channel,createdAt',
        'NOTIF-LOG-001,PBG-320501-20082026-001,H. Ahmad Supriyadi,08122334455,VERIFIKASI_VALID,"Yth. H. Ahmad Supriyadi, berkas PBG-320501-20082026-001 telah LENGKAP dan siap dijadwalkan sidang konsultasi.",SENT,WHATSAPP,2026-08-20T08:30:00Z',
        'NOTIF-LOG-002,PBG-320502-20082026-002,Dra. Hj. Siti Rohayah,08139988776,UNDANGAN_SIDANG,"Yth. Ibu Dra. Hj. Siti Rohayah, Anda diundang hadir pada Sidang Konsultasi TPA hari Jumat 22 Agustus 2026 pukul 09:00 WIB.",SENT,WHATSAPP,2026-08-20T09:15:00Z'
      ].join('\n');

    case 'STATUS_AUDIT_LOGS':
      return [
        'id,registerNumber,fromStatus,toStatus,actorName,actorRole,stageName,notes,timestamp',
        'AUDIT-LOG-001,PBG-320501-20082026-001,NEW,UNDER_VERIFICATION,Asep Kurniawan S.T.,OPERATOR_SIMBG,STAGE_2_MULTI_VERIFIKASI,Memulai pemeriksaan kelengkapan berkas tanah dan gambar teknis,2026-08-20T08:00:00Z',
        'AUDIT-LOG-002,PBG-320501-20082026-001,UNDER_VERIFICATION,READY_FOR_CONSULTATION,Asep Kurniawan S.T.,OPERATOR_SIMBG,STAGE_2_MULTI_VERIFIKASI,Seluruh 12 dokumen lolos uji kelayakan administratif dan teknis,2026-08-20T08:30:00Z'
      ].join('\n');

    case 'PRASARANA_PRICES':
      return [
        'id,label,unit,price,updatedBy',
        'PAGAR_PEMBATAS,Pagar Pembatas / Tembok Keliling,m1,45000,Tim Retribusi DPUPR',
        'SALURAN_DRAINASE,Saluran Drainase / Gorong-gorong,m1,35000,Tim Retribusi DPUPR',
        'PERKERASAN_HALAMAN,Perkerasan Halaman / Paving Block,m2,25000,Tim Retribusi DPUPR',
        'KOLAM_RETENSI,Kolam Retensi / Resapan Air Hujan,m3,65000,Tim Retribusi DPUPR',
        'GARDU_POS_JAGA,Gardu / Pos Jaga Satpam,unit,4500000,Tim Retribusi DPUPR'
      ].join('\n');

    case 'FULL_BUNDLE':
      return '# Format CSV tidak didukung untuk Full Bundle multi-tabel. Harap gunakan format JSON.';
  }
}

/**
 * Generates sample JSON template string for a specific table
 */
export function generateSampleJsonTemplate(table: DatabaseTargetTable): string {
  switch (table) {
    case 'APPLICATIONS':
      return JSON.stringify([
        {
          id: 'APP-PBG-GARUT-2026-001',
          registerNumber: 'PBG-320501-20082026-001',
          applicationNumber: 'SIMBG-2026-08-2001',
          submissionDate: '2026-08-20',
          permitType: 'PBG_BARU',
          status: 'UNDER_VERIFICATION',
          currentStage: 'STAGE_2_MULTI_VERIFIKASI',
          priority: 'NORMAL',
          applicant: {
            name: 'H. Ahmad Supriyadi',
            nik: '3205011508820005',
            phone: '08122334455',
            email: 'ahmad.supriyadi@gmail.com',
            address: 'Jl. Otista No. 142',
            village: 'Jayawaras',
            district: 'Tarogong Kidul',
            city: 'Kabupaten Garut'
          },
          building: {
            name: 'Ruko Sentra Niaga Tarogong',
            functionType: 'USAHA',
            subFunction: 'Perdagangan dan Jasa',
            complexity: 'SEDERHANA',
            address: 'Jl. Pembangunan No. 88',
            district: 'Tarogong Kidul',
            village: 'Jayawaras',
            landArea: 350,
            buildingArea: 250,
            floors: 2,
            height: 8.5,
            permanence: 'PERMANEN'
          },
          documents: [
            { id: 'DOC-1', code: 'KRK', name: 'Keterangan Rencana Kota (KRK)', category: 'TANAH', isMandatory: true, status: 'VALID' },
            { id: 'DOC-2', code: 'SHM', name: 'Sertifikat Hak Milik / Tanah', category: 'TANAH', isMandatory: true, status: 'VALID' },
            { id: 'DOC-3', code: 'ARS', name: 'Gambar Arsitektur Lengkap', category: 'ARSITEKTUR', isMandatory: true, status: 'VALID' },
            { id: 'DOC-4', code: 'STR', name: 'Perhitungan Struktur & Sondir', category: 'STRUKTUR', isMandatory: true, status: 'TERUNGGAH' }
          ],
          slaDays: 3,
          slaDeadline: '2026-08-23T16:00:00Z',
          slaStatus: 'IN_SLA',
          dataQualityScore: 100,
          assignedOperator: 'Asep Kurniawan S.T.',
          internalNotes: 'Berkas masuk via loket SIMBG online',
          lastUpdated: new Date().toISOString()
        }
      ], null, 2);

    case 'USER_ACCOUNTS':
      return JSON.stringify([
        {
          id: 'USR-OP-ASEP-01',
          username: 'op_asep_garut',
          name: 'Asep Kurniawan, S.T.',
          nip: '198804152011011004',
          email: 'asep.verif@garutkab.go.id',
          role: 'OPERATOR_SIMBG',
          positionTitle: 'Operator Verifikasi Teknis SIMBG',
          subSpecialty: 'Arsitektur',
          phone: '081322110099',
          isActive: true,
          permissions: {
            canVerifyDocuments: true,
            canConductVisite: true,
            canScheduleSidang: true,
            canInputBAKonsultasi: true,
            canApproveBAPleno: false,
            canCalculateRetribution: true,
            canIssueSKRD: false,
            canSendWhatsApp: true,
            canArchiveApplications: false,
            canManageUsers: false,
            canConfigureSystem: false,
            canExportAuditLogs: true
          },
          createdAt: new Date().toISOString()
        }
      ], null, 2);

    case 'NOTIFICATION_LOGS':
      return JSON.stringify([
        {
          id: 'NOTIF-2026-001',
          applicationId: 'APP-PBG-GARUT-2026-001',
          registerNumber: 'PBG-320501-20082026-001',
          recipientName: 'H. Ahmad Supriyadi',
          recipientPhone: '08122334455',
          templateType: 'VERIFIKASI_VALID',
          message: 'Yth. H. Ahmad Supriyadi, berkas PBG-320501-20082026-001 dinyatakan LENGKAP dan siap diagendakan sidang konsultasi.',
          channel: 'WHATSAPP',
          status: 'SENT',
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          retryCount: 0
        }
      ], null, 2);

    case 'STATUS_AUDIT_LOGS':
      return JSON.stringify([
        {
          id: 'AUDIT-2026-001',
          applicationId: 'APP-PBG-GARUT-2026-001',
          registerNumber: 'PBG-320501-20082026-001',
          fromStatus: 'NEW',
          toStatus: 'UNDER_VERIFICATION',
          actorName: 'Asep Kurniawan, S.T.',
          actorRole: 'OPERATOR_SIMBG',
          stageName: 'STAGE_2_MULTI_VERIFIKASI',
          notes: 'Memulai pemeriksaan kelengkapan berkas tanah dan gambar teknis',
          timestamp: new Date().toISOString()
        }
      ], null, 2);

    case 'PRASARANA_PRICES':
      return JSON.stringify([
        {
          id: 'PAGAR_PEMBATAS',
          label: 'Pagar Pembatas / Tembok Keliling',
          unit: 'm1',
          price: 45000,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Tim Retribusi DPUPR'
        },
        {
          id: 'SALURAN_DRAINASE',
          label: 'Saluran Drainase / Gorong-gorong',
          unit: 'm1',
          price: 35000,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Tim Retribusi DPUPR'
        }
      ], null, 2);

    case 'FULL_BUNDLE':
      return JSON.stringify({
        version: 'SIMBG-GARUT-V2-2026',
        exportedAt: new Date().toISOString(),
        author: 'Operator SIMBG DPUPR Garut',
        applications: INITIAL_APPLICATIONS.slice(0, 2),
        userAccounts: INITIAL_USER_ACCOUNTS.slice(0, 3),
        notificationLogs: [],
        statusAuditLogs: [],
        prasaranaPrices: [
          { id: 'PAGAR_PEMBATAS', label: 'Pagar Pembatas / Tembok Keliling', unit: 'm1', price: 45000, updatedAt: new Date().toISOString(), updatedBy: 'DPUPR' }
        ]
      }, null, 2);
  }
}

/**
 * Simple CSV parser handling quotes and commas
 */
export function parseCsvText(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0 && !line.startsWith('#'));
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuote && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

export interface ParseAndValidationResult<T> {
  success: boolean;
  table: DatabaseTargetTable;
  data: T[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  warnings: string[];
  previewRows: any[];
}

/**
 * Universal Parser & Validator for any table
 */
export function parseAndValidateImportPayload(
  table: DatabaseTargetTable,
  rawContent: string,
  detectedFormat: 'JSON' | 'CSV'
): ParseAndValidationResult<any> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsedRaw: any[] = [];

  if (!rawContent || rawContent.trim() === '') {
    return {
      success: false,
      table,
      data: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: ['Konten data impor kosong.'],
      warnings: [],
      previewRows: []
    };
  }

  // 1. Parsing Phase
  if (detectedFormat === 'JSON') {
    try {
      const json = JSON.parse(rawContent);
      if (table === 'FULL_BUNDLE') {
        if (typeof json !== 'object' || Array.isArray(json)) {
          return {
            success: false,
            table,
            data: [],
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            errors: ['Format JSON Full Bundle harus berupa object berkas cadangan.'],
            warnings: [],
            previewRows: []
          };
        }
        return {
          success: true,
          table,
          data: [json],
          totalRows: 1,
          validRows: 1,
          invalidRows: 0,
          errors: [],
          warnings: [],
          previewRows: [{
            bundleVersion: json.version || 'V2-2026',
            totalApplications: (json.applications || []).length,
            totalUserAccounts: (json.userAccounts || []).length,
            totalNotificationLogs: (json.notificationLogs || []).length,
            totalAuditLogs: (json.statusAuditLogs || []).length,
            totalPrasaranaPrices: (json.prasaranaPrices || []).length
          }]
        };
      } else {
        if (!Array.isArray(json)) {
          if (typeof json === 'object') {
            parsedRaw = [json];
          } else {
            throw new Error('Data JSON harus berupa array objek data.');
          }
        } else {
          parsedRaw = json;
        }
      }
    } catch (e: any) {
      return {
        success: false,
        table,
        data: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [`Gagal membaca format JSON: ${e.message}`],
        warnings: [],
        previewRows: []
      };
    }
  } else {
    // CSV Format
    try {
      parsedRaw = parseCsvText(rawContent);
      if (parsedRaw.length === 0) {
        return {
          success: false,
          table,
          data: [],
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          errors: ['Berkas CSV tidak memiliki baris data setelah header.'],
          warnings: [],
          previewRows: []
        };
      }
    } catch (e: any) {
      return {
        success: false,
        table,
        data: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [`Gagal memproses berkas CSV: ${e.message}`],
        warnings: [],
        previewRows: []
      };
    }
  }

  // 2. Transformation & Schema Validation Phase
  const validItems: any[] = [];

  parsedRaw.forEach((row, index) => {
    const rowNum = index + 1;
    try {
      switch (table) {
        case 'APPLICATIONS': {
          const regNum = row.registerNumber || row.register_number || row.regNumber || row.nomor_register;
          if (!regNum) {
            errors.push(`Baris ${rowNum}: Nomor Register (registerNumber) wajib diisi.`);
            return;
          }

          const appName = row.applicantName || row.applicant_name || row.applicant?.name || row.pemohon || 'Pemohon SIMBG';
          const bldName = row.buildingName || row.building_name || row.building?.name || row.nama_bangunan || 'Bangunan Gedung';
          const bldFunc = (row.functionType || row.function_type || row.building?.functionType || row.fungsi || 'HUNIAN').toUpperCase();
          const district = row.buildingDistrict || row.district || row.building?.district || row.kecamatan || 'Garut Kota';
          const village = row.buildingVillage || row.village || row.building?.village || row.desa || '';
          const bldArea = Number(row.buildingArea || row.building_area || row.building?.buildingArea || row.luas_bangunan || 100);
          const landArea = Number(row.landArea || row.land_area || row.building?.landArea || row.luas_tanah || bldArea);
          const floors = Number(row.floors || row.building?.floors || row.lantai || 1);
          const height = Number(row.height || row.building?.height || row.tinggi || 4);
          const permitType = (row.permitType || row.permit_type || row.jenis_izin || 'PBG_BARU').toUpperCase();
          const status = (row.status || row.status_alur || 'UNDER_VERIFICATION').toUpperCase();

          const newApp: Application = {
            id: row.id || `APP-${regNum.replace(/[^a-zA-Z0-9]/g, '-')}`,
            registerNumber: regNum,
            applicationNumber: row.applicationNumber || row.application_number || regNum,
            submissionDate: row.submissionDate || row.submission_date || new Date().toISOString().split('T')[0],
            permitType: permitType as any,
            status: status as any,
            currentStage: row.currentStage || row.current_stage || 'STAGE_2_MULTI_VERIFIKASI',
            priority: (row.priority || 'NORMAL').toUpperCase() as any,
            applicant: {
              name: appName,
              nik: row.applicantNik || row.applicant_nik || row.applicant?.nik || row.nik || '',
              phone: row.applicantPhone || row.applicant_phone || row.applicant?.phone || row.telepon || '08000000000',
              email: row.applicantEmail || row.applicant_email || row.applicant?.email || row.email || '',
              address: row.applicantAddress || row.applicant_address || row.applicant?.address || row.alamat_pemohon || 'Garut',
              village: row.applicantVillage || row.applicant?.village || '',
              district: row.applicantDistrict || row.applicant?.district || '',
              city: row.applicantCity || row.applicant?.city || 'Kabupaten Garut'
            },
            building: {
              name: bldName,
              functionType: bldFunc,
              subFunction: row.buildingSubFunction || row.building?.subFunction || '',
              complexity: (row.buildingComplexity || row.building?.complexity || 'SEDERHANA').toUpperCase() as any,
              address: row.buildingAddress || row.building?.address || row.alamat_bangunan || 'Kabupaten Garut',
              district,
              village,
              city: 'Kabupaten Garut',
              landArea: isNaN(landArea) ? 100 : landArea,
              buildingArea: isNaN(bldArea) ? 100 : bldArea,
              floors: isNaN(floors) ? 1 : floors,
              height: isNaN(height) ? 4 : height,
              permanence: (row.buildingPermanence || row.building?.permanence || 'PERMANEN').toUpperCase() as any,
              kdb: row.buildingKdb || row.building?.kdb || 60,
              klb: row.buildingKlb || row.building?.klb || 1.2
            },
            documents: Array.isArray(row.documents) ? row.documents : [],
            verificationIterations: Array.isArray(row.verificationIterations) ? row.verificationIterations : [],
            multiVerifications: Array.isArray(row.multiVerifications) ? row.multiVerifications : [],
            slaDays: Number(row.slaDays || 3),
            slaDeadline: row.slaDeadline || new Date(Date.now() + 3 * 86400000).toISOString(),
            slaStatus: row.slaStatus || 'IN_SLA',
            dataQualityScore: Number(row.dataQualityScore || 100),
            dataErrors: Array.isArray(row.dataErrors) ? row.dataErrors : [],
            assignedOperator: row.assignedOperator || row.assigned_operator || 'Operator SIMBG',
            internalNotes: row.internalNotes || row.internal_notes || '',
            lastUpdated: row.lastUpdated || new Date().toISOString()
          };

          validItems.push(newApp);
          break;
        }

        case 'USER_ACCOUNTS': {
          const username = row.username || row.user_name || row.id;
          const name = row.name || row.nama_lengkap;
          if (!username || !name) {
            errors.push(`Baris ${rowNum}: username dan name wajib diisi.`);
            return;
          }

          const role = (row.role || 'OPERATOR_SIMBG').toUpperCase();
          const email = row.email || `${username}@garutkab.go.id`;
          const isActive = row.isActive === 'true' || row.isActive === true || row.is_active === true || row.status === 'AKTIF';

          const newUser: UserAccount = {
            id: row.id || `USR-${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            username,
            name,
            nip: row.nip || undefined,
            email,
            role: role as any,
            positionTitle: row.positionTitle || row.position_title || row.jabatan || 'Personel DPUPR Garut',
            subSpecialty: row.subSpecialty || row.sub_specialty || undefined,
            phone: row.phone || row.telepon || undefined,
            isActive,
            permissions: row.permissions || {
              canVerifyDocuments: true,
              canConductVisite: true,
              canScheduleSidang: true,
              canInputBAKonsultasi: true,
              canApproveBAPleno: role === 'SUPER_ADMIN' || role === 'PIMPINAN',
              canCalculateRetribution: true,
              canIssueSKRD: role === 'SUPER_ADMIN' || role === 'PIMPINAN',
              canSendWhatsApp: true,
              canArchiveApplications: role === 'SUPER_ADMIN',
              canManageUsers: role === 'SUPER_ADMIN',
              canConfigureSystem: role === 'SUPER_ADMIN',
              canExportAuditLogs: true
            },
            createdAt: row.createdAt || new Date().toISOString()
          };

          validItems.push(newUser);
          break;
        }

        case 'NOTIFICATION_LOGS': {
          const regNum = row.registerNumber || row.register_number;
          const recipient = row.recipientName || row.recipient_name;
          const phone = row.recipientPhone || row.recipient_phone;
          const msg = row.message || row.pesan;

          if (!recipient || !phone || !msg) {
            errors.push(`Baris ${rowNum}: recipientName, recipientPhone, dan message wajib diisi.`);
            return;
          }

          const newNotif: NotificationLog = {
            id: row.id || `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            applicationId: row.applicationId || row.application_id || '',
            registerNumber: regNum || 'PBG-GARUT',
            recipientName: recipient,
            recipientPhone: phone,
            templateType: (row.templateType || row.template_type || 'INFO_UMUM').toUpperCase(),
            message: msg,
            channel: (row.channel || 'WHATSAPP').toUpperCase() as any,
            status: (row.status || 'SENT').toUpperCase() as any,
            sentAt: row.sentAt || row.sent_at || new Date().toISOString(),
            createdAt: row.createdAt || row.created_at || new Date().toISOString(),
            retryCount: Number(row.retryCount || row.retry_count || 0)
          };

          validItems.push(newNotif);
          break;
        }

        case 'STATUS_AUDIT_LOGS': {
          const fromStatus = row.fromStatus || row.from_status;
          const toStatus = row.toStatus || row.to_status;
          const actorName = row.actorName || row.actor_name || 'Operator SIMBG';

          if (!fromStatus || !toStatus) {
            errors.push(`Baris ${rowNum}: fromStatus dan toStatus wajib diisi.`);
            return;
          }

          const newAudit: StatusAuditLog = {
            id: row.id || `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            applicationId: row.applicationId || row.application_id || undefined,
            registerNumber: row.registerNumber || row.register_number || undefined,
            fromStatus,
            toStatus,
            actorName,
            actorRole: row.actorRole || row.actor_role || 'OPERATOR_SIMBG',
            stageName: row.stageName || row.stage_name || undefined,
            notes: row.notes || row.catatan || undefined,
            timestamp: row.timestamp || row.created_at || new Date().toISOString()
          };

          validItems.push(newAudit);
          break;
        }

        case 'PRASARANA_PRICES': {
          const label = row.label || row.name || row.nama;
          const unit = row.unit || row.satuan;
          const price = Number(row.price || row.basePrice || row.base_price || row.tarif || 0);

          if (!label || !unit || isNaN(price)) {
            errors.push(`Baris ${rowNum}: label, unit, dan price nominal wajib valid.`);
            return;
          }

          const id = row.id || label.toUpperCase().replace(/[^A-Z0-9]/g, '_');
          const newPrice: PrasaranaPriceConfig = {
            id,
            label,
            unit,
            price,
            updatedAt: row.updatedAt || row.updated_at || new Date().toISOString(),
            updatedBy: row.updatedBy || row.updated_by || 'Petugas DPUPR Garut'
          };

          validItems.push(newPrice);
          break;
        }
      }
    } catch (rowErr: any) {
      errors.push(`Baris ${rowNum}: Kesalahan pemrosesan - ${rowErr.message}`);
    }
  });

  const validCount = validItems.length;
  const invalidCount = parsedRaw.length - validCount;

  return {
    success: validCount > 0,
    table,
    data: validItems,
    totalRows: parsedRaw.length,
    validRows: validCount,
    invalidRows: invalidCount,
    errors,
    warnings,
    previewRows: validItems.slice(0, 10)
  };
}
