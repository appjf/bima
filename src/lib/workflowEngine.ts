import { 
  Application, 
  WorkflowStage, 
  VerificationReview, 
  ConsultationNoticeLetter, 
  BeritaAcaraKonsultasi, 
  BeritaAcaraPleno,
  BeritaAcaraLapangan,
  SuratUndanganVisite,
  FieldVisitItem,
  ExistingImbStatus 
} from '../types';

export interface WorkflowStepDefinition {
  id: WorkflowStage;
  stepNumber: number;
  stepCode: string;
  title: string;
  shortTitle: string;
  description: string;
  badge: string;
  iconName: string;
  isSlfOnly?: boolean;
}

export const WORKFLOW_STEPS: WorkflowStepDefinition[] = [
  {
    id: 'STAGE_1_INPUT_DATA',
    stepNumber: 1,
    stepCode: '01',
    title: 'Input Data Permohonan',
    shortTitle: '1. Input Data',
    description: 'Pendaftaran berkas pemohon, lokasi Garut, fungsi gedung, jenis izin (PBG/SLF), dan status kepemilikan IMB/PBG eksisting.',
    badge: 'REGISTRATION',
    iconName: 'FilePlus2'
  },
  {
    id: 'STAGE_2_MULTI_VERIFIKASI',
    stepNumber: 2,
    stepCode: '02',
    title: 'Verifikasi Permohonan (Multi Verif)',
    shortTitle: '2. Multi Verif Awal',
    description: 'Pemeriksaan multi-disiplin (Administrasi, Arsitektur, Struktur, MEP & Damkar, Lingkungan).',
    badge: 'MULTI_VERIF',
    iconName: 'CheckSquare'
  },
  {
    id: 'STAGE_VISITE_LAPANGAN_SLF',
    stepNumber: 3,
    stepCode: '2B',
    title: 'Visite Lapangan & BA Lapangan (Khusus SLF)',
    shortTitle: '2B. Visite Lapangan',
    description: 'Pemeriksaan fisik langsung ke lokasi bangunan dan penerbitan BA Lapangan untuk verifikasi kesesuaian dokumen laporan kelaikan fungsi.',
    badge: 'VISITE_SLF',
    iconName: 'Compass',
    isSlfOnly: true
  },
  {
    id: 'STAGE_3_SURAT_PEMBERITAHUAN',
    stepNumber: 4,
    stepCode: '03',
    title: 'Pembuat Surat Pemberitahuan Konsultasi Teknis',
    shortTitle: '3. Surat Konsultasi',
    description: 'Penerbitan surat resmi jadwal sidang TPA/TPT hari Jumat, penugasan tim ahli, dan notifikasi WA.',
    badge: 'NOTICE_LETTER',
    iconName: 'Mail'
  },
  {
    id: 'STAGE_4_BA_KONSULTASI',
    stepNumber: 5,
    stepCode: '04',
    title: 'Berita Acara (BA) Konsultasi Teknis',
    shortTitle: '4. BA Konsultasi',
    description: 'Pencatatan hasil sidang konsultasi teknis: Disetujui (ke BA Pleno) atau Perlu Perbaikan.',
    badge: 'BA_KONSULTASI',
    iconName: 'FileText'
  },
  {
    id: 'STAGE_5_VERIFIKASI_PERBAIKAN',
    stepNumber: 6,
    stepCode: '05',
    title: 'Verifikasi Perbaikan (Multi Verif Revisi)',
    shortTitle: '5. Verif Perbaikan',
    description: 'Pemeriksaan pemenuhan catatan perbaikan dari BA Konsultasi secara multi-disiplin verifikator.',
    badge: 'RE_VERIFIKASI',
    iconName: 'FileCheck2'
  },
  {
    id: 'STAGE_6_BA_PLENO',
    stepNumber: 7,
    stepCode: '06',
    title: 'BA Pleno & Surat Rekomendasi Teknis',
    shortTitle: '6. BA Pleno',
    description: 'Sidang Pleno TPA pengesahan akhir dan penerbitan Surat Rekomendasi Teknis PBG/SLF.',
    badge: 'BA_PLENO',
    iconName: 'Award'
  },
  {
    id: 'STAGE_7_PERHITUNGAN_SKRD',
    stepNumber: 8,
    stepCode: '07',
    title: 'Perhitungan SKRD (Kondisional IMB/PBG)',
    shortTitle: '7. SKRD Retribusi',
    description: 'Penghitungan retribusi PP 16/2021 bagi bangunan belum ber-IMB/PBG, atau bypass jika sudah ber-IMB.',
    badge: 'SKRD_CALC',
    iconName: 'Calculator'
  },
  {
    id: 'STAGE_8_SELESAI',
    stepNumber: 9,
    stepCode: '08',
    title: 'Penerbitan Dokumen PBG/SLF & Selesai',
    shortTitle: '8. Selesai',
    description: 'Penetapan akhir dokumen PBG/SLF resmi oleh DPUPR Kab. Garut dan pengarsipan permanen.',
    badge: 'COMPLETED',
    iconName: 'CheckCircle2'
  }
];

export function isSlfApplication(app: Application): boolean {
  return (
    app.permitType === 'SLF_EKSISTING' ||
    app.permitType === 'SLF_PERPANJANGAN' ||
    app.building.existingImbStatus === 'SUDAH_MEMILIKI_IMB' ||
    app.building.existingImbStatus === 'SUDAH_MEMILIKI_PBG' ||
    app.registerNumber.includes('SLF') ||
    app.building.name.toLowerCase().includes('slf')
  );
}

export function getApplicationWorkflowStage(app: Application): WorkflowStage {
  if (app.currentStage) return app.currentStage;
  if (app.status === 'COMPLETED') return 'STAGE_8_SELESAI';
  if (app.retribution?.status === 'SKRD_ISSUED' || (app.retribution?.isVerified && app.baPleno?.isSigned)) {
    return 'STAGE_7_PERHITUNGAN_SKRD';
  }
  if (app.baPleno?.isSigned) {
    const isNeedsSkrd = app.building.existingImbStatus === 'BELUM_MEMILIKI_IMB_PBG' || !app.building.existingImbStatus;
    return isNeedsSkrd ? 'STAGE_7_PERHITUNGAN_SKRD' : 'STAGE_8_SELESAI';
  }
  if (app.baKonsultasi?.result === 'PERBAIKAN' && (!app.multiVerifikasiPerbaikan || app.multiVerifikasiPerbaikan.some(v => v.status !== 'VALID'))) {
    return 'STAGE_5_VERIFIKASI_PERBAIKAN';
  }
  if (app.schedule?.applicantAttended || app.schedule?.consultationResult || app.baKonsultasi) {
    return 'STAGE_4_BA_KONSULTASI';
  }
  if (app.schedule?.scheduleDate || app.consultationNotice?.isIssued) {
    return 'STAGE_3_SURAT_PEMBERITAHUAN';
  }
  if (isSlfApplication(app) && (!app.baLapangan || !app.baLapangan.isCompleted)) {
    // If multi verif is done for SLF, it needs Visite Lapangan & BA Lapangan
    const isMultiVerifValid = app.documents.some(d => d.status === 'VALID');
    if (isMultiVerifValid) return 'STAGE_VISITE_LAPANGAN_SLF';
  }
  if (app.documents.some(d => d.status === 'VALID' || d.status === 'PERLU_PERBAIKAN')) {
    return 'STAGE_2_MULTI_VERIFIKASI';
  }
  return 'STAGE_1_INPUT_DATA';
}

export function getWorkflowStepIndex(stage: WorkflowStage): number {
  return WORKFLOW_STEPS.findIndex(s => s.id === stage);
}

export function generateDefaultFieldVisitItems(app: Application): FieldVisitItem[] {
  return [
    {
      id: 'VIS-01',
      category: 'ARSITEKTUR',
      aspectChecked: 'Kesesuaian Tata Letak Ruang & Dimensi Fisik vs As-Built Drawing',
      status: 'SESUAI',
      notes: 'Bukaan jendela, ventilasi alami, dan pencahayaan sesuai gambar terpasang.'
    },
    {
      id: 'VIS-02',
      category: 'STRUKTUR',
      aspectChecked: 'Integritas Kolom, Balok, Plat Beton, dan Tidak Ada Retak Struktural',
      status: 'SESUAI',
      notes: 'Struktur beton bertulang kokoh, tidak ditemukan lendutan atau retak geser.'
    },
    {
      id: 'VIS-03',
      category: 'MEP',
      aspectChecked: 'Kesiapan APAR, Hydrant, Jalur Evakuasi, dan Instalasi Panel Listrik',
      status: 'SESUAI',
      notes: 'APAR terpasang dengan tekanan aktif, jalur evakuasi bebas rintangan.'
    },
    {
      id: 'VIS-04',
      category: 'TATA_RUANG_UMUM',
      aspectChecked: 'Garis Sempadan Bangunan (GSB), RTH, dan Saluran Pembuangan Air Hujan',
      status: 'SESUAI',
      notes: 'Resapan air dan saluran drainase berfungsi optimal.'
    }
  ];
}

export function generateBeritaAcaraLapanganDraft(
  app: Application,
  locationNotes: string = 'Pemeriksaan fisik lapangan di lokasi bangunan berjalan lancar dan didampingi pemilik bangunan.',
  conformityStatus: 'SESUAI_DOKUMEN' | 'PERLU_PENYESUAIAN_LAPORAN' | 'TIDAK_SESUAI' = 'SESUAI_DOKUMEN',
  recommendations: string = 'Kondisi fisik bangunan eksisting laik fungsi dan sesuai dengan dokumen laporan kelaikan fungsi. Dapat dilanjutkan ke Sidang Konsultasi Teknis TPA/TPT.'
): BeritaAcaraLapangan {
  const regClean = app.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  
  let functionMap: 'HUNIAN' | 'KEAGAMAAN' | 'USAHA' | 'SOSIAL_BUDAYA' | 'KHUSUS' | 'CAMPURAN' = 'HUNIAN';
  const appFunc = app.building.functionType?.toUpperCase() || 'HUNIAN';
  if (appFunc.includes('HUNIAN') || appFunc.includes('TINGGAL')) functionMap = 'HUNIAN';
  else if (appFunc.includes('KEAGAMAAN') || appFunc.includes('MASJID') || appFunc.includes('IBADAH')) functionMap = 'KEAGAMAAN';
  else if (appFunc.includes('USAHA') || appFunc.includes('TOKO') || appFunc.includes('KANTOR')) functionMap = 'USAHA';
  else if (appFunc.includes('SOSIAL') || appFunc.includes('BUDAYA') || appFunc.includes('SEKOLAH')) functionMap = 'SOSIAL_BUDAYA';
  else if (appFunc.includes('KHUSUS') || appFunc.includes('PABRIK')) functionMap = 'KHUSUS';
  else if (appFunc.includes('CAMPURAN')) functionMap = 'CAMPURAN';

  return {
    baLapanganNumber: `BA-VISITE/${regClean}/DPUPR-GRT/2026`,
    visitDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    inspectors: [
      { name: 'Dr. Ir. H. Hendra Setiawan, MT, IAI', role: 'Tim Penilai Teknis (TPA Arsitektur)' },
      { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', role: 'Tim Pengawas Struktur Bangunan' },
      { name: 'Rian Pratama, ST, M.Eng', role: 'Pengawas MEP & Damkar DPUPR' },
      { name: 'Dedi Kurniawan, S.AP', role: 'Sekretariat SIMBG Garut' }
    ],
    locationNotes,
    itemsChecked: generateDefaultFieldVisitItems(app),
    conformityStatus,
    recommendations,
    isCompleted: true,
    completedAt: new Date().toISOString(),

    // New official form fields defaults
    kondisiLapangan: {
      tanahKosong: false,
      adaBangunanLama: false,
      bongkarKeseluruhan: false,
      bongkarSebagian: false,
      bangunanSudahJadi: true
    },
    kondisiKegiatan: {
      belumAdaKegiatan: false,
      sedangAdaKegiatan: false,
      sedangAdaKegiatanPersen: '100',
      selesaiDikerjakan: true
    },
    fungsiBangunanTerpilih: functionMap,
    keteranganLain: 'Bangunan berdiri kokoh, struktur balok dan kolom beton bertulang dalam kondisi aman dan laik fungsi. Akses jalan memadai dan prasarana lingkungan tertata baik.',

    // Parameters Table fields
    paramSertifikatLuas: app.building.landArea?.toString() || '350',
    paramSertifikatNomor: `M.${regClean}/Garut`,
    paramKrkJenisBangunan: app.building.name,
    paramKrkJumlahLantai: app.building.floors?.toString() || '2',
    paramKrkJumlahLantaiKet: 'OK',
    paramKrkKdb: app.building.kdb?.toString() || '60',
    paramKrkKdbKet: 'OK',
    paramKrkKlb: app.building.klb?.toString() || '1.2',
    paramKrkKlbKet: 'OK',
    paramKrkKdh: '20',
    paramKrkKdhKet: 'OK',
    paramKrkLuasPerkerasan: '120',
    paramKrkPanjangPagar: '45',
    paramKrkGsj: '6 m',
    paramKrkGsbDepan: '5',
    paramKrkGsbBelakang: '3',
    paramKrkGsbKanan: '2',
    paramKrkGsbKiri: '2',

    // Classification fields
    paramKlasifikasiKompleksitas: app.building.complexity === 'SEDERHANA' ? 'SEDERHANA' : app.building.complexity === 'KHUSUS' ? 'KHUSUS' : 'TIDAK_SESUAI' as any,
    paramKlasifikasiPermanensi: 'DIATAS_5_TAHUN',
    paramKlasifikasiKepadatan: 'SEDANG',
    paramKlasifikasiKetinggian: (app.building.floors || 1) <= 4 ? 'RENDAH_1_4_LT' : (app.building.floors || 1) <= 8 ? 'SEDANG_5_8_LT' : 'TINGGI_GT_8_LT',
    paramKlasifikasiKepemilikan: 'PERORANGAN',
    paramKlasifikasiFungsiJalan: 'LOKAL'
  };
}

export function generateDefaultMultiVerifications(app: Application): VerificationReview[] {
  return [
    {
      id: `VR-ADM-${app.id}`,
      discipline: 'UMUM',
      verifierName: 'Dedi Kurniawan, S.AP (Operator SIMBG)',
      verifiedAt: new Date().toISOString(),
      status: app.documents.filter(d => d.category === 'UMUM').every(d => d.status === 'VALID') ? 'VALID' : 'MENUNGGU',
      notes: 'Pemeriksaan KTP, Sertifikat Tanah, dan KRK DPUPR Garut.'
    },
    {
      id: `VR-ARS-${app.id}`,
      discipline: 'ARSITEKTUR',
      verifierName: 'Dr. Ir. H. Hendra Setiawan, MT, IAI (TPA Arsitektur)',
      verifiedAt: new Date().toISOString(),
      status: app.documents.filter(d => d.category === 'ARSITEKTUR').every(d => d.status === 'VALID') ? 'VALID' : 'MENUNGGU',
      notes: 'Pemeriksaan gambar denah, tampak, potongan, dan tata ruang Garut.'
    },
    {
      id: `VR-STR-${app.id}`,
      discipline: 'STRUKTUR',
      verifierName: 'Ir. Ahmad Fauzi, ST, MT, IPM (TPA Struktur)',
      verifiedAt: new Date().toISOString(),
      status: app.documents.filter(d => d.category === 'STRUKTUR').every(d => d.status === 'VALID') ? 'VALID' : 'MENUNGGU',
      notes: 'Pemeriksaan pondasi, pembebanan gempa SNI, dan analisis struktur.'
    },
    {
      id: `VR-MEP-${app.id}`,
      discipline: 'MEP',
      verifierName: 'Rian Pratama, ST, M.Eng (TPA MEP & Damkar)',
      verifiedAt: new Date().toISOString(),
      status: app.documents.filter(d => d.category === 'MEP').every(d => d.status === 'VALID') ? 'VALID' : 'MENUNGGU',
      notes: 'Pemeriksaan instalasi listrik, plumbing air bersih/kotor, dan proteksi kebakaran.'
    },
    {
      id: `VR-ENV-${app.id}`,
      discipline: 'UMUM',
      verifierName: 'Siti Rahmawati, ST (Verifikator DLH Garut)',
      verifiedAt: new Date().toISOString(),
      status: app.documents.filter(d => d.category === 'UMUM').every(d => d.status === 'VALID') ? 'VALID' : 'MENUNGGU',
      notes: 'Pemeriksaan dokumen SPPL / UKL-UPL dan Andalalin.'
    }
  ];
}

export function generateNoticeLetterDraft(app: Application, date: string, timeSlot: string, room: string): ConsultationNoticeLetter {
  const regClean = app.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  return {
    letterNumber: `600.1.15/${regClean}/DPUPR-PBG/2026`,
    letterDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    scheduledDate: date,
    timeSlot: timeSlot,
    room: room,
    signeeName: 'Dedi Kurniawan, S.ST, MT (Pengawas SIMBG)',
    signeeNip: '19820315 200801 1 009',
    isIssued: true,
    issuedAt: new Date().toISOString()
  };
}

export function generateBeritaAcaraKonsultasiDraft(
  app: Application,
  result: 'DISETUJUI' | 'PERBAIKAN' | 'KONSULTASI_ULANG',
  notes: string,
  revisions: string[] = []
): BeritaAcaraKonsultasi {
  const regClean = app.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  return {
    baNumber: `BA-KONS/${regClean}/DPUPR-GRT/2026`,
    baDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    result,
    expertNotes: notes,
    revisionItems: revisions,
    revisionDeadline: result === 'PERBAIKAN' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
    attendees: [
      { name: 'Ir. H. Dedi Supriadi, ST, MT', role: 'Ketua Rapat Konsultasi TPA/TPT', present: true },
      { name: 'Dr. Ir. H. Hendra Setiawan, MT, IAI', role: 'Anggota TPA Arsitektur', present: true },
      { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', role: 'Anggota TPA Struktur', present: true },
      { name: 'Rian Pratama, ST, M.Eng', role: 'Anggota TPA MEP & Damkar', present: true },
      { name: app.applicant.name, role: 'Pemohon / Pemilik Bangunan', present: true }
    ],
    isFinalized: true
  };
}

export function generateBeritaAcaraPlenoDraft(app: Application, notes: string): BeritaAcaraPleno {
  const regClean = app.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  return {
    baPlenoNumber: `BA-PLENO/${regClean}/TPA-GRT/2026`,
    rekomtekNumber: `REKOMTEK/${regClean}/DPUPR-PBG/2026`,
    plenoDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    conclusion: 'DISETUJUI_PENERBITAN_PBG',
    notes: notes || 'Permohonan telah memenuhi seluruh persyaratan standar teknis bangunan gedung PP 16/2021. Direkomendasikan untuk diterbitkan Persetujuan Bangunan Gedung (PBG).',
    leadExpertName: 'Dr. Ir. H. Hendra Setiawan, MT, IAI (Ketua Rapat Konsultasi TPA/TPT)',
    leadExpertNip: '19680514 199403 1 002',
    isSigned: true
  };
}

export function generateSuratUndanganVisiteDraft(
  app: Application,
  date?: string,
  timeSlot?: string,
  meetingPoint?: string
): SuratUndanganVisite {
  const regClean = app.registerNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  const defaultDate = date || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    letterNumber: `600.1.15/${regClean}/DPUPR-VISITE/2026`,
    letterDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    nature: 'PENTING',
    attachments: '1 (satu) Berkas Jadwal',
    subject: `Undangan Pemeriksaan / Visite Lapangan Kelaikan Bangunan Gedung (${isSlfApplication(app) ? 'SLF Eksisting' : 'PBG'})`,
    recipientName: app.applicant.name,
    recipientRole: 'Pemilik / Penanggung Jawab Bangunan Gedung',
    recipientAddress: app.applicant.address || 'Kabupaten Garut',
    visitDate: defaultDate,
    visitTime: timeSlot || '09.30 WIB s.d. Selesai',
    meetingPoint: meetingPoint || `${app.building.name}, ${app.building.address}, Kec. ${app.building.district}`,
    agenda: `Pemeriksaan Kesesuaian Fisik Bangunan Terbangun dengan Dokumen Gambar Teknis dan Persyaratan Kelaikan Fungsi (${isSlfApplication(app) ? 'SLF Eksisting' : 'PBG'})`,
    assignedInspectors: [
      { name: 'Dedi Kurniawan, S.ST, MT', role: 'Koordinator Tim Penilik Teknis DPUPR', nip: '19820315 200801 1 009' },
      { name: 'Rian Pratama, ST, M.Eng', role: 'Penilik Teknis Sub Bidang MEP & Proteksi Kebakaran', nip: '19880512 201101 1 003' },
      { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', role: 'Tim Pengkaji Teknis (TPT) Bangunan Gedung', nip: '19750918 200212 1 004' }
    ],
    instructions: [
      'Menyiapkan dokumen gambar terbangun (As-Built Drawings), sertifikat kelayakan instalasi / proteksi kebakaran (jika ada), dan dokumen permohonan.',
      'Membuka akses penuh bagi Tim Penilik Teknis ke seluruh lantai, ruang, atap, serta sarana utilitas gedung.',
      'Menghadirkan penanggung jawab gedung / konsultan pengkaji teknis berizin selama proses pemeriksaan lapangan berlangsung.'
    ],
    contactPerson: {
      name: 'Sekretariat SIMBG DPUPR Garut',
      phone: '0812-2345-6789',
      role: 'Helpdesk Teknis Bangunan Gedung'
    },
    signerName: 'Dedi Kurniawan, S.ST, MT',
    signerNip: '19820315 200801 1 009',
    signerRole: 'Pengawas SIMBG DPUPR Kabupaten Garut',
    isSigned: true,
    signedAt: new Date().toISOString()
  };
}
