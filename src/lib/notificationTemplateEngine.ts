import { Application, ApplicationStatus, BuildingInfo } from '../types';

export interface WhatsAppTemplateTag {
  tag: string;
  label: string;
  description: string;
  example: string;
}

export interface WhatsAppTemplate {
  id: string;
  triggerStatus: string;
  title: string;
  category: 'VERIFIKASI' | 'VISITE' | 'KONSULTASI' | 'RETRIBUSI' | 'PENERBITAN' | 'UMUM';
  description: string;
  templateBody: string;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface WhatsAppSettings {
  headerGreeting: string;
  agencyName: string;
  helpdeskPhone: string;
  portalUrl: string;
  autoAppendFooter: boolean;
  customFooterText?: string;
  templates: WhatsAppTemplate[];
}

export const AVAILABLE_TEMPLATE_TAGS: WhatsAppTemplateTag[] = [
  { tag: '{nama_pemohon}', label: 'Nama Pemohon', description: 'Nama lengkap pemohon atau penanggung jawab', example: 'H. Dadan Ramdani, SE' },
  { tag: '{no_register}', label: 'No. Register', description: 'Nomor register PBG/SLF Garut', example: 'PBG-320501-18082026-0001' },
  { tag: '{no_simbg}', label: 'No. SIMBG', description: 'Nomor pendaftaran SIMBG pusat', example: 'SIMBG-2026-GRT-9921' },
  { tag: '{nama_bangunan}', label: 'Nama Bangunan', description: 'Nama/judul proyek bangunan gedung', example: 'Pembangunan Gedung Ruko & Kantor Patriot Square' },
  { tag: '{jenis_izin}', label: 'Jenis Izin', description: 'PBG atau SLF', example: 'PBG' },
  { tag: '{fungsi_bangunan}', label: 'Fungsi Bangunan', description: 'Fungsi gedung (Hunian/Usaha/dll)', example: 'Fungsi Usaha' },
  { tag: '{sub_fungsi}', label: 'Sub Fungsi', description: 'Sub fungsi detail gedung', example: 'Pertokoan / Ruko' },
  { tag: '{luas_bangunan}', label: 'Luas Bangunan', description: 'Luas total lantai bangunan (m²)', example: '480 m²' },
  { tag: '{jumlah_lantai}', label: 'Jumlah Lantai', description: 'Jumlah lantai gedung', example: '3 Lantai' },
  { tag: '{alamat_bangunan}', label: 'Alamat Bangunan', description: 'Lokasi jalan dan desa gedung', example: 'Jl. Pembangunan No. 112, Sukagalih' },
  { tag: '{kecamatan}', label: 'Kecamatan', description: 'Kecamatan lokasi di Kab. Garut', example: 'Tarogong Kidul' },
  { tag: '{status_permohonan}', label: 'Status Saat Ini', description: 'Status alur permohonan', example: 'Siap Konsultasi Teknis' },
  { tag: '{daftar_kekurangan}', label: 'Daftar Kekurangan/Catatan', description: 'Rincian dokumen belum lengkap / catatan revisi perbaikan', example: '1. Perhitungan Teknis Struktur Bangunan\n2. Dokumen Proteksi Kebakaran (APAR)' },
  { tag: '{hari_sidang}', label: 'Hari Sidang', description: 'Hari pelaksanaan sidang (e.g. Jumat)', example: 'Jumat' },
  { tag: '{tanggal_sidang}', label: 'Tanggal Sidang/Visite', description: 'Tanggal jadwal sidang TPA atau visite', example: '22 Agustus 2026' },
  { tag: '{jam_sidang}', label: 'Waktu / Jam', description: 'Jam alokasi waktu sesi', example: '09:00 - 10:00 WIB' },
  { tag: '{ruang_sidang}', label: 'Ruangan Sidang', description: 'Ruangan konsultasi DPUPR Garut', example: 'Ruang Rapat TPA Gedung DPUPR Lt. 2' },
  { tag: '{nominal_retribusi}', label: 'Nominal Retribusi', description: 'Total retribusi SKRD (Rp)', example: 'Rp 2.450.000,-' },
  { tag: '{nomor_skrd}', label: 'Nomor SKRD', description: 'Nomor Surat Ketetapan Retribusi Daerah', example: 'SKRD/3205/DPUPR/2026/045' },
  { tag: '{nomor_ba}', label: 'Nomor Berita Acara', description: 'Nomor BA Konsultasi / BA Pleno / BA Lapangan', example: 'BA-TPA/2026/08/042' },
  { tag: '{operator_nama}', label: 'Nama Operator', description: 'Nama operator SIMBG yang bertugas', example: 'Operator SIMBG DPUPR Garut' },
  { tag: '{kontak_helpdesk}', label: 'Kontak Helpdesk', description: 'Nomor WhatsApp resmi layanan DPUPR', example: '0811-2233-4455' },
  { tag: '{link_simbg}', label: 'Tautan SIMBG', description: 'Tautan resmi portal SIMBG untuk login', example: 'https://simbg.pu.go.id' }
];

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'TPL-MASUK',
    triggerStatus: 'NEW',
    title: '1. Permohonan Baru Diterima (Dalam Verifikasi)',
    category: 'VERIFIKASI',
    description: 'Pemberitahuan kepada pemohon bahwa berkas pendaftaran telah masuk dan sedang dalam antrean verifikasi operator.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Terima kasih telah mengajukan permohonan *{jenis_izin}* melalui SIMBG dengan rincian:
• No. Register: *{no_register}*
• Bangunan: *{nama_bangunan}*
• Lokasi: *{alamat_bangunan}, Kec. {kecamatan}*

Berkas permohonan Anda saat ini telah diterima dan sedang dalam proses *Verifikasi Administratif & Teknis* oleh Tim Operator DPUPR Kabupaten Garut.

Perkembangan status akan kami sampaikan berkala via WhatsApp ini. Anda juga dapat memantau melalui {link_simbg}.`
  },
  {
    id: 'TPL-KURANG',
    triggerStatus: 'INCOMPLETE',
    title: '2. Dokumen Kurang / Permintaan Perbaikan Awal',
    category: 'VERIFIKASI',
    description: 'Notifikasi otomatis saat verifikasi awal menemukan berkas wajib yang belum terunggah atau format tidak sesuai.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Sehubungan dengan permohonan *{jenis_izin}* (*{no_register}* - {nama_bangunan}), hasil verifikasi dokumen oleh Tim DPUPR Garut menyatakan bahwa masih terdapat kekurangan/catatan perbaikan berkas sebagai berikut:

{daftar_kekurangan}

📌 *Tindakan Pemohon:*
Mohon segera melengkapi dan mengunggah kembali perbaikan dokumen di portal {link_simbg} agar berkas dapat segera dijadwalkan ke tahap Sidang Konsultasi Teknis TPA/TPT.

Batas waktu pemenuhan perbaikan: 7 (tujuh) hari kerja.`
  },
  {
    id: 'TPL-LENGKAP',
    triggerStatus: 'READY_FOR_CONSULTATION',
    title: '3. Berkas Lengkap & Menunggu Sidang Konsultasi',
    category: 'VERIFIKASI',
    description: 'Pemberitahuan bahwa dokumen telah diverifikasi 100% lengkap dan siap dijadwalkan sidang pleno TPA hari Jumat.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Kabar baik! Berkas permohonan *{jenis_izin}* Anda (*{no_register}* - {nama_bangunan}) telah dinyatakan *LENGKAP & VALID* berdasarkan evaluasi regulasi PP No. 16/2021.

Saat ini permohonan Anda telah dimasukkan ke dalam antrean *Penjadwalan Sidang Konsultasi Teknis TPA/TPT*. Surat pemberitahuan resmi beserta jam dan tempat sidang akan dikirimkan segera via WhatsApp ini.`
  },
  {
    id: 'TPL-VISITE',
    triggerStatus: 'VISITE_LAPANGAN',
    title: '4. Jadwal Pemeriksaan Fisik Lapangan (Visite SLF/PBG)',
    category: 'VISITE',
    description: 'Pemberitahuan kepada pemohon mengenai jadwal kunjungan tim inspeksi lapangan ke lokasi bangunan gedung.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Diberitahukan bahwa Tim Pengawas Teknis DPUPR Kabupaten Garut akan melaksanakan *Pemeriksaan Fisik Lapangan (Visite)* untuk permohonan *{jenis_izin}* (*{no_register}*):

📅 Hari/Tanggal : *{hari_sidang}, {tanggal_sidang}*
⏰ Waktu : *{jam_sidang}*
📍 Lokasi Bangunan : *{alamat_bangunan}, Kec. {kecamatan}*
🏢 Nama Bangunan : *{nama_bangunan}*

Mohon pemilik/penanggung jawab bangunan atau konsultan perencana dapat hadir mendampingi tim di lokasi untuk penandatanganan Berita Acara (BA) Lapangan.`
  },
  {
    id: 'TPL-JADWAL',
    triggerStatus: 'SCHEDULED',
    title: '5. Undangan Sidang Konsultasi Teknis TPA / TPT',
    category: 'KONSULTASI',
    description: 'Surat undangan resmi jadwal sidang konsultasi teknis TPA/TPT pada hari Jumat dengan alokasi ruangan dan jam.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Undangan Resmi Sidang Konsultasi Teknis *{jenis_izin}* DPUPR Kabupaten Garut:
• No. Register : *{no_register}*
• Bangunan : *{nama_bangunan}*

Jadwal Sidang Konsultasi Teknis:
📅 Hari/Tanggal : *{hari_sidang}, {tanggal_sidang}*
⏰ Waktu Sesi : *{jam_sidang}*
🏛️ Tempat : *{ruang_sidang}*
🏢 Alamat : Dinas PUPR Kab. Garut (Jalan Prof. KH. Cecep Syarifuddin No. 117)

*Kelengkapan yang Wajib Dibawa:*
1. Gambar Kerja Arsitektur, Struktur, dan MEP tercetak (Hardcopy A3/A1)
2. Dokumen Perhitungan Struktur & Penyelidikan Tanah (jika dipersyaratkan)
3. Kehadiran Pemohon dan/atau Perencana Teknis Berlisensi

Mohon hadir 15 menit sebelum sesi dimulai untuk registrasi presensi QR digital.`
  },
  {
    id: 'TPL-REMINDER',
    triggerStatus: 'REMINDER_KONSULTASI',
    title: '6. Pengingat Sidang Konsultasi (H-1 Sidang)',
    category: 'KONSULTASI',
    description: 'Pesan pengingat otomatis satu hari sebelum sidang konsultasi berlangsung.',
    isActive: true,
    templateBody: `*PENGINGAT SIDANG KONSULTASI (H-1)*

Yth. Bpk/Ibu *{nama_pemohon}*,

Mengingatkan kembali bahwa jadwal Sidang Konsultasi Teknis *{jenis_izin}* untuk bangunan *{nama_bangunan}* (*{no_register}*) akan dilaksanakan besok:
📅 *{hari_sidang}, {tanggal_sidang}*
⏰ Pukul *{jam_sidang}*
🏛️ Lokasi *{ruang_sidang}*

Pastikan berkas gambar dan tim perencana teknis Anda siap untuk pemaparan di hadapan Tim Profesi Ahli (TPA) DPUPR Garut.`
  },
  {
    id: 'TPL-REVISI-SIDANG',
    triggerStatus: 'REVISION_REQUESTED',
    title: '7. Catatan Perbaikan Hasil Sidang Konsultasi Teknis',
    category: 'KONSULTASI',
    description: 'Penyampaian Berita Acara catatan perbaikan teknis setelah sidang konsultasi TPA.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Sidang Konsultasi Teknis permohonan *{jenis_izin}* (*{no_register}* - {nama_bangunan}) telah selesai dilaksanakan.

Berdasarkan Berita Acara Konsultasi (*{nomor_ba}*), permohonan dinyatakan *PERLU PERBAIKAN TEKNIS* dengan catatan tim ahli sebagai berikut:
{daftar_kekurangan}

Mohon mengunggah berkas revisi yang telah disesuaikan melalui portal {link_simbg} untuk diverifikasi kembali oleh tim verifikator sebelum penerbitan Rekomendasi Teknis.`
  },
  {
    id: 'TPL-SETUJU-PLENO',
    triggerStatus: 'CONSULTATION_DONE',
    title: '8. Hasil Konsultasi Disetujui / Rekomtek Terbit',
    category: 'KONSULTASI',
    description: 'Pemberitahuan bahwa sidang pleno TPA telah menyetujui dokumen teknis dan Rekomtek PBG/SLF telah disahkan.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Selamat! Berdasarkan hasil Sidang Pleno Tim Profesi Ahli (TPA), dokumen teknis permohonan *{jenis_izin}* (*{no_register}* - {nama_bangunan}) telah *DISETUJUI SEPENUHNYA*.

Surat Rekomendasi Teknis (Rekomtek) resmi telah diterbitkan oleh DPUPR Garut. Permohonan Anda saat ini melanjutkan ke tahap penetapan retribusi daerah (SKRD).`
  },
  {
    id: 'TPL-SKRD',
    triggerStatus: 'RETRIBUTION_READY',
    title: '9. Penerbitan Surat Ketetapan Retribusi Daerah (SKRD)',
    category: 'RETRIBUSI',
    description: 'Pemberitahuan besaran retribusi PBG resmi dan petunjuk pembayaran ke rekening Kas Daerah Garut di Bank bjb.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Surat Ketetapan Retribusi Daerah (SKRD) untuk permohonan *{jenis_izin}* Anda telah resmi diterbitkan oleh Pemerintah Kabupaten Garut:

• No. Register : *{no_register}*
• Nama Bangunan : *{nama_bangunan}*
• No. SKRD : *{nomor_skrd}*
• Total Retribusi : *{nominal_retribusi}*

💳 *Petunjuk Pembayaran:*
Pembayaran dilakukan melalui Kas Daerah Kab. Garut (Bank bjb) dengan menyertakan Nomor SKRD.

Setelah melakukan pembayaran, mohon unggah bukti setor/transfer di SIMBG atau konfirmasikan ke helpdesk ini agar dokumen PBG dapat langsung ditandatangani secara elektronik.`
  },
  {
    id: 'TPL-SELESAI',
    triggerStatus: 'COMPLETED',
    title: '10. PBG / SLF Resmi Terbit (Selesai)',
    category: 'PENERBITAN',
    description: 'Pemberitahuan bahwa dokumen PBG / SLF telah ditandatangani secara elektronik (TTE) dan siap diunduh.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Kabar gembira! Dokumen resmi *{jenis_izin}* untuk bangunan gedung *{nama_bangunan}* (No. Register: *{no_register}*) telah resmi *DITERBITKAN & DITANDATANGANI SECARA ELEKTRONIK (TTE)* oleh Kepala Dinas PUPR Kabupaten Garut.

📄 Anda dapat mengunduh dokumen sertifikat dan lampiran rencana teknis secara langsung melalui portal {link_simbg} pada menu Dokumen Terbit.

Terima kasih atas kepatuhan Anda dalam memenuhi regulasi bangunan gedung yang tertib, andal, dan laik fungsi di Kabupaten Garut.`
  },
  {
    id: 'TPL-BATAL',
    triggerStatus: 'CANCELLED',
    title: '11. Permohonan Dibatalkan / Tidak Memenuhi Syarat',
    category: 'UMUM',
    description: 'Pemberitahuan pembatalan permohonan karena ketidaksesuaian tata ruang, kepemilikan tanah, atau batas waktu revisi terlampaui.',
    isActive: true,
    templateBody: `Yth. Bpk/Ibu *{nama_pemohon}*,

Sehubungan dengan permohonan *{jenis_izin}* (*{no_register}* - {nama_bangunan}), dengan ini diberitahukan bahwa permohonan dinyatakan *DIBATALKAN / DITOLAK* dengan pertimbangan:

{daftar_kekurangan}

Untuk informasi dan konsultasi lebih lanjut terkait permohonan ulang, silakan menghubungi Layanan Konsultasi DPUPR Garut di {kontak_helpdesk}.`
  }
];

export const DEFAULT_WHATSAPP_SETTINGS: WhatsAppSettings = {
  headerGreeting: 'Yth. Bpk/Ibu',
  agencyName: 'Dinas Pekerjaan Umum dan Penataan Ruang (DPUPR) Kabupaten Garut',
  helpdeskPhone: '0811-2233-4455',
  portalUrl: 'https://simbg.pu.go.id',
  autoAppendFooter: true,
  customFooterText: 'Dinas Pekerjaan Umum dan Penataan Ruang (DPUPR)\nPemerintah Kabupaten Garut // SIMBG Terpadu PP 16/2021',
  templates: DEFAULT_WHATSAPP_TEMPLATES
};

/**
 * Replace placeholders inside template body with real data from Application
 */
export function compileWhatsAppMessage(
  templateBody: string,
  app: Application,
  customVars?: Record<string, string>,
  settings?: WhatsAppSettings
): string {
  const isSlf = (app.permitType && app.permitType.includes('SLF')) || app.registerNumber.startsWith('SLF');
  const permitLabel = isSlf ? 'Sertifikat Laik Fungsi (SLF)' : 'Persetujuan Bangunan Gedung (PBG)';

  // Build missing or revision docs list
  let missingListStr = customVars?.daftar_kekurangan || '';
  if (!missingListStr) {
    const errorDocs = app.documents.filter(d => d.status === 'BELUM_ADA' || d.status === 'PERLU_PERBAIKAN' || d.status === 'TIDAK_SESUAI');
    if (errorDocs.length > 0) {
      missingListStr = errorDocs.map((d, i) => `${i + 1}. ${d.name}${d.notes ? ` (${d.notes})` : ''}`).join('\n');
    } else if (app.dataErrors && app.dataErrors.length > 0) {
      missingListStr = app.dataErrors.map((e, i) => `${i + 1}. ${e}`).join('\n');
    } else {
      missingListStr = '- Berkas catatan teknis terlampir pada sistem SIMBG.';
    }
  }

  const scheduleDate = app.schedule?.scheduleDate || app.consultationNotice?.scheduledDate || app.baLapangan?.visitDate || customVars?.tanggal_sidang || 'Jumat terdekat';
  const scheduleTime = app.schedule?.timeSlot || app.consultationNotice?.timeSlot || app.baLapangan?.visitTime || customVars?.jam_sidang || '09:00 - 10:00 WIB';
  const scheduleRoom = app.schedule?.room || app.consultationNotice?.room || customVars?.ruang_sidang || 'Ruang Rapat TPA Gedung DPUPR Garut Lt. 2';
  
  // Calculate day name
  let dayName = customVars?.hari_sidang || 'Jumat';
  if (scheduleDate && scheduleDate.includes('-')) {
    try {
      const d = new Date(scheduleDate);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      dayName = days[d.getDay()] || 'Jumat';
    } catch {
      dayName = 'Jumat';
    }
  }

  const retributionTotal = app.retribution?.finalRetribution 
    ? `Rp ${app.retribution.finalRetribution.toLocaleString('id-ID')},-` 
    : (customVars?.nominal_retribusi || 'Rp 0,-');

  const skrdNumber = customVars?.nomor_skrd || `SKRD/3205/DPUPR/${new Date().getFullYear()}/${app.id.slice(-4)}`;
  const baNumber = app.baPleno?.baPlenoNumber || app.baKonsultasi?.baNumber || app.baLapangan?.baLapanganNumber || customVars?.nomor_ba || `BA-DPUPR/${app.id.slice(-4)}`;

  const replacements: Record<string, string> = {
    '{nama_pemohon}': app.applicant.name || 'Pemohon SIMBG',
    '{no_register}': app.registerNumber,
    '{no_simbg}': app.applicationNumber || app.registerNumber,
    '{nama_bangunan}': app.building.name,
    '{jenis_izin}': permitLabel,
    '{fungsi_bangunan}': app.building.functionType || 'Fungsi Gedung',
    '{sub_fungsi}': app.building.subFunction || '-',
    '{luas_bangunan}': `${app.building.buildingArea} m²`,
    '{jumlah_lantai}': `${app.building.floors} Lantai`,
    '{alamat_bangunan}': app.building.address,
    '{kecamatan}': app.building.district || 'Garut',
    '{status_permohonan}': app.status,
    '{daftar_kekurangan}': missingListStr,
    '{hari_sidang}': dayName,
    '{tanggal_sidang}': scheduleDate,
    '{jam_sidang}': scheduleTime,
    '{ruang_sidang}': scheduleRoom,
    '{nominal_retribusi}': retributionTotal,
    '{nomor_skrd}': skrdNumber,
    '{nomor_ba}': baNumber,
    '{operator_nama}': app.assignedOperator || 'Operator SIMBG DPUPR Garut',
    '{kontak_helpdesk}': settings?.helpdeskPhone || '0811-2233-4455',
    '{link_simbg}': settings?.portalUrl || 'https://simbg.pu.go.id',
    ...customVars
  };

  let rendered = templateBody;
  for (const [tag, val] of Object.entries(replacements)) {
    rendered = rendered.split(tag).join(val);
  }

  // Auto append footer if enabled
  if (settings?.autoAppendFooter) {
    const footer = settings.customFooterText || `\n\n────────────────\n*${settings.agencyName}*\nLayanan SIMBG Kab. Garut // Helpdesk: ${settings.helpdeskPhone}`;
    if (!rendered.includes(settings.agencyName) && !rendered.includes('DPUPR')) {
      rendered = `${rendered}\n\n${footer}`;
    }
  }

  return rendered.trim();
}
