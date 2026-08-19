export interface VerificationNoteTemplate {
  id: string;
  label: string; // Label tombol 1-klik singkat
  category: 'ALL' | 'UMUM' | 'ARSITEKTUR' | 'STRUKTUR' | 'MEP' | 'VALID' | 'TANAH';
  suggestedStatus?: 'TIDAK_SESUAI' | 'VALID';
  text: string; // Teks lengkap catatan verifikasi
}

export const VERIFICATION_NOTE_TEMPLATES: VerificationNoteTemplate[] = [
  // 1. Dokumen belum dilegalisasi (Permintaan Utama)
  {
    id: 'TPL-LEGALISIR',
    label: 'Belum Dilegalisasi',
    category: 'ALL',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Dokumen belum dilegalisasi oleh pihak berwenang / instansi terkait. Mohon unggah dokumen yang telah berstempel basah atau tanda tangan digital (TTE/BSrE) yang sah.'
  },
  // 2. Dokumen yang diunggah tidak sesuai dengan persyaratan di sistem (Permintaan Utama)
  {
    id: 'TPL-TIDAK-SESUAI-SYARAT',
    label: 'Tidak Sesuai Persyaratan',
    category: 'ALL',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Dokumen yang diunggah tidak sesuai dengan persyaratan di sistem SIMBG. Mohon periksa kembali ketentuan format, jenis berkas, dan ketentuan administratif yang diminta.'
  },
  // 3. Judul gambar agar disesuaikan (Permintaan Utama)
  {
    id: 'TPL-JUDUL-GAMBAR',
    label: 'Judul Gambar Disesuaikan',
    category: 'ARSITEKTUR',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Judul gambar agar disesuaikan dengan fungsi, tipe, dan nama bangunan gedung yang dimohonkan pada sistem SIMBG.'
  },
  // 4. Nama Tenaga Ahli yang menandatangani dokumen tidak sesuai dengan SKK Tenaga Ahli yang diupload SIMBG (Permintaan Utama)
  {
    id: 'TPL-SKK-TENAGA-AHLI',
    label: 'SKK Tenaga Ahli Tidak Sesuai',
    category: 'UMUM',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Nama Tenaga Ahli yang menandatangani dokumen tidak sesuai dengan SKK Tenaga Ahli yang diupload di sistem SIMBG. Mohon sesuaikan penandatangan atau unggah SKK/STRA yang sesuai.'
  },
  // 5. Kop / Etiket Gambar
  {
    id: 'TPL-KOP-ETIKET',
    label: 'Kop/Etiket Belum Lengkap',
    category: 'ARSITEKTUR',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Kop gambar (etiket) belum lengkap / belum ditandatangani oleh pemohon dan perencana teknis berlisensi (SKA/SKK/STRA).'
  },
  // 6. Gambar teknis resolusi rendah
  {
    id: 'TPL-RESOLUSI-GAMBAR',
    label: 'Gambar Buram / Kurang Jelas',
    category: 'ARSITEKTUR',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Gambar teknis tidak terbaca dengan jelas / resolusi terlalu rendah. Unggah file hasil scan atau export CAD/PDF berkualitas tinggi dengan skala, notasi, dan dimensi yang terbaca.'
  },
  // 7. Perhitungan Struktur SNI Gempa
  {
    id: 'TPL-STRUKTUR-GEMPA',
    label: 'Perhitungan Gempa SNI 1726',
    category: 'STRUKTUR',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Perhitungan struktur belum menyertakan input pembebanan gempa sesuai SNI 1726:2019 dan permodelan struktur (output software analisa struktur SAP2000/ETABS/STAAD).'
  },
  // 8. Uji Penyelidikan Tanah / Sondir
  {
    id: 'TPL-SONDIR-TANAH',
    label: 'Uji Tanah / Sondir Belum Ada',
    category: 'STRUKTUR',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Laporan hasil penyelidikan tanah (Soil Investigation / Uji Sondir / Boring Log) belum dilampirkan atau belum divalidasi oleh ahli geoteknik berlisensi.'
  },
  // 9. Gambar Detail Penulangan
  {
    id: 'TPL-DETAIL-PENULANGAN',
    label: 'Detail Pembesian & Pondasi',
    category: 'STRUKTUR',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Gambar detail penulangan balok, kolom, pelat, dan pondasi belum lengkap serta belum memuat dimensi dan spesifikasi mutu beton/baja (fc/fy).'
  },
  // 10. Sistem Proteksi Kebakaran & MEP
  {
    id: 'TPL-MEP-DAMKAR',
    label: 'MEP & Proteksi Kebakaran',
    category: 'MEP',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Spesifikasi teknis mekanikal, elektrikal, plambing, dan sistem proteksi kebakaran (APAR/Hydrant/Alarm/Sprinkler) belum lengkap sesuai standar teknis.'
  },
  // 11. Diagram Satu Garis Kelistrikan
  {
    id: 'TPL-SLD-LISTRIK',
    label: 'Diagram Kelistrikan (SLD)',
    category: 'MEP',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Diagram satu garis kelistrikan (Single Line Diagram) dan perhitungan kebutuhan daya belum dilampirkan secara komprehensif.'
  },
  // 12. Septic Tank / Pengolahan Air Limbah
  {
    id: 'TPL-SEPTIC-TANK',
    label: 'Detail Sanitasi & Septic Tank',
    category: 'MEP',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Rencana instalasi sanitasi air bersih/kotor dan detail septic tank biofilter/IPAL belum tercantum dengan jelas pada gambar rencana.'
  },
  // 13. Surat Kuasa Bermaterai
  {
    id: 'TPL-SURAT-KUASA',
    label: 'Surat Kuasa Bermaterai',
    category: 'TANAH',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Surat Kuasa bermaterai Rp 10.000 belum dilampirkan karena nama pemohon berbeda dengan nama yang tertera pada sertifikat kepemilikan tanah.'
  },
  // 14. Bukti Kepemilikan Tanah / Sertifikat
  {
    id: 'TPL-SERTIFIKAT-TANAH',
    label: 'Legalitas Sertifikat Tanah',
    category: 'TANAH',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Bukti kepemilikan tanah (Sertifikat Hak Milik/HGB/Akta Jual Beli) belum dilegalisir oleh pihak berwenang atau batas-batas tanah belum tampak jelas.'
  },
  // 15. KRK / KKPR
  {
    id: 'TPL-KRK-KKPR',
    label: 'KRK / KKPR Belum Lengkap',
    category: 'UMUM',
    suggestedStatus: 'TIDAK_SESUAI',
    text: 'Dokumen Keterangan Rencana Kota (KRK) / KKPR dari Dinas PUPR / DPMPTSP belum dilampirkan atau masa berlakunya telah berakhir.'
  },
  // 16. Dokumen Telah Lengkap & Valid
  {
    id: 'TPL-VALID-LENGKAP',
    label: '✓ Dokumen Lengkap & Sesuai',
    category: 'VALID',
    suggestedStatus: 'VALID',
    text: 'Dokumen telah diperiksa dan dinyatakan LENGKAP, SAH, serta MEMENUHI seluruh persyaratan teknis PP 16/2021.'
  }
];

export const getQuickTemplatesForCategory = (category?: string): VerificationNoteTemplate[] => {
  if (!category) return VERIFICATION_NOTE_TEMPLATES;
  return VERIFICATION_NOTE_TEMPLATES.filter(
    t => t.category === 'ALL' || t.category === category || t.category === 'VALID'
  );
};

export const getTemplateForDoc = (code: string) => {
  switch (code) {
    case 'DOC-UMUM-02': return `SBU No.: - Nama Badan Usaha: - Tgl. Berakhir: -\nSKK/STR Arsitek No. : -  Nama TA: - Tgl. Berakhir: -\nSKK SIPIL No. : - Nama TA: -  Tgl. Berakhir: -\nSKK MEP No. : - Nama TA: - Tgl. Berakhir: -`;
    case 'DOC-UMUM-03': return `"Pesetujuan Dokumen Andalalin No. - Tgl. -"\n"Sartek/Andal Lalin dari Polres Garut No. - Tgl. -"\n"Sartek Akses Jalan Masuk dari Bina Marga Prov. Jabar No. - Tgl. -"\n"SPPL/UKL-UPL/AMDAL dari DLH sesuai kewenangannya No. -  Tgl. -"\n"Saran Teknis Proteksi Kebakaran dari Disdamkar Kab. Garut No.  -  Tgl. -"\n"Rekomendasi Peil Banjir dari Bidang SDA Dinas PUPR Kab. Garut No.   Tgl. -"\n"Saran Teknis Irigasi dari Bidang SDA Dinas PUPR Kab. Garut (bila disyaratkan) No.- Tgl. -"`;
    case 'DOC-UMUM-04': return `"Dokumen KRK/KKPR No. -  Tgl. -"\n"Kawasan LSD seluas     M2 (apabila disyaratkan) No. Rekom    tgl"\n"Rekomendasi Kuota Minimarket (apabila disyaratkan) No. 500.2.2.11/2310/DISPERINDAGESDM Tgl. 04/12/2024"\n"Kawasan Rawan Bencana Seluas      M2 (apabila disyaratkan) No. Rekom    tgl"\n"Kawasan Sempadan Sungai seluas     M2 (apabila disyaratkan) No. Rekom    tgl"\n`;
    case 'DOC-UMUM-05': return `No. - tgl -`;
    case 'DOC-UMUM-06': return `No. Identitas: -\nNama: -`;
    default: return '';
  }
};
