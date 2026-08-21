import * as XLSX from 'xlsx';
import { Application, NotificationLog } from '../types';

/**
 * Formats a number as Indonesian Rupiah (Rp) for representation
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Formats date string to beautiful DD-MM-YYYY format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Interface for exporting options
 */
interface ExportDataOptions {
  applications: Application[];
  notifications: NotificationLog[];
  operatorName?: string;
}

/**
 * Generates and downloads a beautifully-formatted Multi-Sheet Excel (XLSX) file containing
 * the complete SIMBG management data, fully integrated with clean columns and math totals.
 */
export function exportAllDataToExcel({ applications, notifications, operatorName = 'Petugas SIMBG' }: ExportDataOptions) {
  // 1. Create a blank Workbook
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // SHEET 1: RINGKASAN EKSEKUTIF (Executive Summary Dashboard)
  // =========================================================================
  const summaryRows = [
    ['SISTEM INFORMASI MANAJEMEN BANGUNAN GEDUNG (BIMA-BG.GARUT)'],
    ['DINAS PEKERJAAN UMUM DAN PENATAAN RUANG (DPUPR) KABUPATEN GARUT'],
    [''],
    ['LAPORAN EKSPOR DATA OPERASIONAL DAN MONEV PBG/SLF'],
    [`Tanggal Ekspor: ${new Date().toLocaleString('id-ID')} WIB`],
    [`Diekspor Oleh : ${operatorName}`],
    [''],
    ['RINGKASAN METRIK UTAMA', ''],
    ['Indikator', 'Jumlah / Nilai'],
    ['Total Permohonan Terdaftar', applications.length],
    ['Permohonan Sudah Terbit (Selesai/COMPLETED)', applications.filter(a => a.status === 'COMPLETED').length],
    ['Permohonan Sedang Diproses (Aktif)', applications.filter(a => a.status !== 'COMPLETED' && a.status !== 'REJECTED' && a.status !== 'CANCELLED').length],
    ['Permohonan Ditolak / Gugur', applications.filter(a => a.status === 'REJECTED').length],
    ['Permohonan Dibatalkan (CANCELLED)', applications.filter(a => a.status === 'CANCELLED').length],
    [''],
    ['MONEV KEUANGAN & RETRIBUSI', ''],
    ['Total Retribusi PP 16 Terhitung', formatRupiah(applications.reduce((acc, curr) => acc + (curr.retribution?.finalRetribution || 0), 0))],
    ['Retribusi Lunas (PAD Masuk)', formatRupiah(applications.filter(a => a.retribution?.status === 'PAID').reduce((acc, curr) => acc + (curr.retribution?.finalRetribution || 0), 0))],
    ['Retribusi Belum Bayar (Potensi PAD)', formatRupiah(applications.filter(a => a.retribution?.status !== 'PAID').reduce((acc, curr) => acc + (curr.retribution?.finalRetribution || 0), 0))],
    [''],
    ['MONEV LAYANAN (SLA)', ''],
    ['Penyelesaian Sesuai SLA (< 28 Hari)', applications.filter(a => a.slaStatus === 'IN_SLA').length],
    ['Peringatan SLA (Hampir Melewati Batas)', applications.filter(a => a.slaStatus === 'WARNING').length],
    ['Melewati Batas SLA (Overdue)', applications.filter(a => a.slaStatus === 'EXCEEDED').length],
    [''],
    ['KOMUNIKASI SISTEM (WHATSAPP GATEWAY)', ''],
    ['Total Log Notifikasi Terkirim', notifications.filter(n => n.status === 'SENT' || n.status === 'DELIVERED').length],
    ['Log Notifikasi Gagal Terkirim', notifications.filter(n => n.status === 'FAILED').length],
    ['Log Notifikasi Menunggu Antrean (Pending)', notifications.filter(n => n.status === 'PENDING').length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);

  // Set Summary columns width
  wsSummary['!cols'] = [
    { wch: 45 }, // Indicator Name
    { wch: 30 }  // Count or Value
  ];

  // =========================================================================
  // SHEET 2: DATA PERMOHONAN (Detailed Applications)
  // =========================================================================
  const appHeaders = [
    'No.',
    'No. Register',
    'No. Permohonan (SIMBG)',
    'Nama Pemohon',
    'NIK Pemohon',
    'No. Telepon / WA',
    'Jenis Izin',
    'Fungsi Bangunan',
    'Nama Bangunan / Alamat',
    'Luas Bangunan (m2)',
    'Tinggi Bangunan (m)',
    'SLA Status',
    'Hari SLA Berjalan',
    'SLA Deadline',
    'Status Alur',
    'Internal Memo / Catatan',
    'Tanggal Masuk'
  ];

  const appDataRows = applications.map((app, index) => [
    index + 1,
    app.registerNumber,
    app.applicationNumber,
    app.applicant.name,
    app.applicant.nik || '-',
    app.applicant.phone || '-',
    app.permitType === 'PBG_BARU' ? 'PBG Baru' : app.permitType === 'SLF_EKSISTING' ? 'SLF Bangunan Eksisting' : app.permitType || '-',
    app.building.functionType || '-',
    `${app.building.name || '-'} (Alamat: ${app.building.address || '-'})`,
    app.building.buildingArea || 0,
    app.building.height || 0,
    app.slaStatus === 'IN_SLA' ? 'Sesuai SLA' : app.slaStatus === 'WARNING' ? 'SLA Menipis' : 'Melewati SLA',
    app.slaDays,
    formatDate(app.slaDeadline),
    app.status,
    app.internalNotes || '-',
    formatDate(app.submissionDate)
  ]);

  const wsApps = XLSX.utils.aoa_to_sheet([appHeaders, ...appDataRows]);

  // Apply auto column widths to avoid text truncation
  const appColWidths = appHeaders.map((header, colIndex) => {
    let maxLen = header.length;
    appDataRows.forEach(row => {
      const val = row[colIndex];
      if (val !== null && val !== undefined) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(maxLen + 3, 50) }; // cap at 50 chars width
  });
  wsApps['!cols'] = appColWidths;

  // =========================================================================
  // SHEET 3: MONITORING RETRIBUSI PP 16/2021 (Monev PAD)
  // =========================================================================
  const retHeaders = [
    'No.',
    'No. Register',
    'Nama Pemohon',
    'Jenis Permohonan',
    'Fungsi Bangunan',
    'Luas Bangunan (m2)',
    'Indeks Fungsi',
    'Indeks Kompleksitas',
    'Indeks Permanensi',
    'Indeks Jumlah Lantai',
    'Indeks Lokalitas',
    'Tarif Retribusi (IDR)',
    'Status Pembayaran',
    'No. Bukti Transaksi',
    'Tanggal Validasi Finansial'
  ];

  const retDataRows = applications.map((app, index) => {
    const r = app.retribution;
    return [
      index + 1,
      app.registerNumber,
      app.applicant.name,
      app.permitType === 'PBG_BARU' ? 'PBG Baru' : 'SLF Eksisting',
      app.building.functionType || '-',
      app.building.buildingArea || 0,
      r?.indexFungsi || 0,
      r?.indexKompleksitas || 0,
      r?.indexPermanensi || 0,
      r?.indexJumlahLantai || 0,
      r?.indeksLokalitas || 0,
      r?.finalRetribution || 0,
      r?.status || 'DRAFT',
      r?.paymentReceipt || '-',
      r?.paymentDate ? formatDate(r.paymentDate) : '-'
    ];
  });

  // Calculate sums for the end of the sheet
  const totalTarif = applications.reduce((sum, app) => sum + (app.retribution?.finalRetribution || 0), 0);
  const paidTarif = applications.filter(a => a.retribution?.status === 'PAID').reduce((sum, app) => sum + (app.retribution?.finalRetribution || 0), 0);
  const unpaidTarif = applications.filter(a => a.retribution?.status !== 'PAID').reduce((sum, app) => sum + (app.retribution?.finalRetribution || 0), 0);

  const extraRows = [
    [],
    ['', '', '', '', '', '', '', 'TOTAL RETRIBUSI TERHITUNG:', '', totalTarif],
    ['', '', '', '', '', '', '', 'TOTAL RETRIBUSI LUNAS (PAD):', '', paidTarif],
    ['', '', '', '', '', '', '', 'TOTAL POTENSI PIUTANG RETRIBUSI:', '', unpaidTarif]
  ];

  const wsRet = XLSX.utils.aoa_to_sheet([retHeaders, ...retDataRows, ...extraRows]);

  // Set auto widths for retribution columns
  const retColWidths = retHeaders.map((header, colIndex) => {
    let maxLen = header.length;
    retDataRows.forEach(row => {
      const val = row[colIndex];
      if (val !== null && val !== undefined) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(maxLen + 3, 40) };
  });
  wsRet['!cols'] = retColWidths;

  // =========================================================================
  // SHEET 4: LOG NOTIFIKASI WHATSAPP (Communication Gate)
  // =========================================================================
  const notifHeaders = [
    'No.',
    'ID Log',
    'No. Register Terkait',
    'Nama Penerima',
    'No. Telepon / WhatsApp',
    'Tipe Template Pesan',
    'Status Pengiriman',
    'Waktu Dibuat',
    'Waktu Terkirim',
    'Jumlah Percobaan',
    'Isi Pesan Notifikasi'
  ];

  const notifDataRows = notifications.map((notif, index) => [
    index + 1,
    notif.id,
    notif.registerNumber,
    notif.recipientName,
    notif.recipientPhone,
    notif.templateType,
    notif.status,
    formatDate(notif.createdAt),
    notif.sentAt ? formatDate(notif.sentAt) : '-',
    notif.retryCount,
    notif.message
  ]);

  const wsNotifs = XLSX.utils.aoa_to_sheet([notifHeaders, ...notifDataRows]);

  // Set widths
  const notifColWidths = notifHeaders.map((header, colIndex) => {
    let maxLen = header.length;
    notifDataRows.forEach(row => {
      const val = row[colIndex];
      if (val !== null && val !== undefined) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    // For message column, let's limit width to 50 but let others scale
    if (colIndex === 10) return { wch: 60 };
    return { wch: Math.min(maxLen + 3, 30) };
  });
  wsNotifs['!cols'] = notifColWidths;


  // 5. Append Sheets to Workbook with clean, professional localized titles
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monev Ringkasan');
  XLSX.utils.book_append_sheet(wb, wsApps, 'Data Permohonan PBG_SLF');
  XLSX.utils.book_append_sheet(wb, wsRet, 'Realisasi Retribusi PP16');
  XLSX.utils.book_append_sheet(wb, wsNotifs, 'Log Notifikasi WA');

  // 6. Save File using standard naming schema with local ISO Date
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `BIMA-BG_GARUT_EXPORT_${dateStr}.xlsx`);
}
