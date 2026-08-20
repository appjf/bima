import { Application, DocumentItem } from '../types';
import { calculateRetribution, DEFAULT_SHST_GARUT } from './retributionEngine';
import { triggerPdfPrint } from './pdfPrintEngine';

export type OfficialDocumentType = 
  | 'SKRD'
  | 'BA_VISITE'
  | 'BA_KONSULTASI'
  | 'SURAT_PEMBERITAHUAN'
  | 'FORM_INSPEKSI_CHECKLIST'
  | 'REKAPITULASI_RETRIBUSI_XLSX'
  | 'PERNYATAAN_STANDAR_TEKNIS'
  | 'REKAPITULASI_PEMOHON_XLSX';

export interface HeaderMetadata {
  pemerintah: string;
  dinas: string;
  alamat: string;
  telepon: string;
  website: string;
  email: string;
  kota: string;
  tanggalLengkap: string;
  nomorSurat: string;
  kodeBarcode: string;
}

export interface PemohonDataset {
  nama: string;
  nik: string;
  telepon: string;
  email: string;
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
}

export interface BangunanDataset {
  nama: string;
  fungsi: string;
  subFungsi: string;
  deskripsiJenis: string;
  kompleksitas: string;
  permanensi: string;
  jumlahLantai: number;
  tinggiMeter: number;
  luasBangunanM2: number;
  luasTanahM2: number;
  kdbPercent: number;
  klbRatio: number;
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  statusImb: string;
  nomorImbEksisting: string;
  namaKonsultan: string;
}

export interface RetribusiDataset {
  formulaVersion: string;
  shstRate: number;
  shstFormatted: string;
  indeksFungsi: number;
  indeksKompleksitas: number;
  indeksPermanensi: number;
  indeksLantai: number;
  indeksLokalitas: number;
  indeksTerintegrasi: number;
  subtotalBangunan: number;
  subtotalPrasarana: number;
  totalRetribusi: number;
  totalRetribusiFormatted: string;
  terbilangRupiah: string;
}

export interface InspectionRow {
  no: number;
  kategori: string;
  komponen: string;
  status: 'LAIK' | 'PERLU_PERBAIKAN' | 'TIDAK_DIPERIKSA' | string;
  catatan: string;
  lokasiFoto?: string;
}

export interface VisiteDataset {
  nomorBa: string;
  tanggalVisite: string;
  timSurveyor: string[];
  statusKelaikan: 'LAIK_FUNGSI' | 'PERLU_PERBAIKAN' | 'TIDAK_LAIK';
  catatanKritis: string;
  items: InspectionRow[];
}

export interface BeritaAcaraDataset {
  nomorBa: string;
  tanggalBa: string;
  jenisSidang: string;
  hasilSidang: string;
  catatanSidang: string;
  daftarRevisi: string[];
}

export interface DocumentItemRow {
  no: number;
  kode: string;
  nama: string;
  kategori: string;
  status: string;
  catatan: string;
}

export interface OfficialDocumentDataset {
  datasetVersion: string;
  generatedAt: string;
  documentType: OfficialDocumentType;
  documentTitle: string;
  registerNumber: string;
  applicationNumber: string;
  header: HeaderMetadata;
  pemohon: PemohonDataset;
  bangunan: BangunanDataset;
  retribusi: RetribusiDataset;
  visite: VisiteDataset;
  beritaAcara: BeritaAcaraDataset;
  dokumenChecklist: DocumentItemRow[];
  verifikasiDigital: {
    verificationUrl: string;
    qrHash: string;
    statusTtd: string;
    penandatangan: string;
    nipPenandatangan: string;
  };
  placeholders: Record<string, string>;
}

/**
  * Converts numeric currency amounts into formal Indonesian Terbilang wording.
  */
export function terbilangRupiah(amount: number): string {
  if (isNaN(amount) || amount <= 0) return 'Nol Rupiah';
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function spell(n: number): string {
    if (n < 12) return units[n];
    if (n < 20) return spell(n - 10) + ' Belas';
    if (n < 100) return spell(Math.floor(n / 10)) + ' Puluh ' + spell(n % 10);
    if (n < 200) return 'Seratus ' + spell(n - 100);
    if (n < 1000) return spell(Math.floor(n / 100)) + ' Ratus ' + spell(n % 100);
    if (n < 2000) return 'Seribu ' + spell(n - 1000);
    if (n < 1000000) return spell(Math.floor(n / 1000)) + ' Ribu ' + spell(n % 1000);
    if (n < 1000000000) return spell(Math.floor(n / 1000000)) + ' Juta ' + spell(n % 1000000);
    return spell(Math.floor(n / 1000000000)) + ' Milyar ' + spell(n % 1000000000);
  }

  const result = spell(Math.floor(amount)).trim();
  return result ? `${result} Rupiah` : 'Nol Rupiah';
}

/**
  * Builds the single source of truth dataset for any permohonan SIMBG/SIPEKA.
  */
export function buildOfficialDocumentDataset(
  app: Application, 
  docType: OfficialDocumentType = 'SKRD'
): OfficialDocumentDataset {
  const currentDate = new Date();
  const dateFormatted = currentDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate or fetch Retribution
  const retCalc = app.retribution || calculateRetribution(app, DEFAULT_SHST_GARUT);
  const totalRet = retCalc.finalRetribution || 0;
  const integratedIndex = (retCalc.indexFungsi || 0.15) * 
                          (retCalc.indexKompleksitas || 0.1) * 
                          (retCalc.indexPermanensi || 0.2) * 
                          (retCalc.indexJumlahLantai || 1.0);

  // Build Inspection Rows
  const visiteItems: InspectionRow[] = (app.baLapangan?.itemsChecked || []).map((item, idx) => ({
    no: idx + 1,
    kategori: item.category || 'STRUKTUR',
    komponen: item.aspectChecked,
    status: item.status || 'TIDAK_DIPERIKSA',
    catatan: item.notes || '-',
    lokasiFoto: item.photoEvidence
  }));

  // Build Document Items Checklist
  const docRows: DocumentItemRow[] = (app.documents || []).map((doc, idx) => ({
    no: idx + 1,
    kode: doc.code,
    nama: doc.name,
    kategori: doc.category,
    status: doc.status,
    catatan: doc.notes || '-'
  }));

  const registerCode = app.registerNumber || app.id;
  const skrdNum = `SKRD/3205/DPUPR/${currentDate.getFullYear()}/${registerCode.slice(-5).toUpperCase()}`;
  const baNum = app.baLapangan?.baLapanganNumber || `BA-VISITE/3205/DPUPR/${currentDate.getFullYear()}/${registerCode.slice(-4).toUpperCase()}`;
  const hash = `GARUT-DPUPR-${registerCode}-${Date.now().toString(36).toUpperCase()}`;

  const header: HeaderMetadata = {
    pemerintah: 'PEMERINTAH KABUPATEN GARUT',
    dinas: 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG (DPUPR)',
    alamat: 'Jalan Prof. KH. Cecep Syarifuddin No. 117 Garut 44151',
    telepon: '(0262) 233730 Fax (0262) 544184',
    website: 'simbg.garutkab.go.id',
    email: 'dpupr@garutkab.go.id',
    kota: 'Garut',
    tanggalLengkap: dateFormatted,
    nomorSurat: docType === 'SKRD' ? skrdNum : baNum,
    kodeBarcode: hash
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
    namaKonsultan: app.building.consultantName || 'Konsultan Perencana'
  };

  const retribusi: RetribusiDataset = {
    formulaVersion: retCalc.formulaVersion || 'RETRIBUSI-2026-GARUT',
    shstRate: DEFAULT_SHST_GARUT,
    shstFormatted: `Rp ${DEFAULT_SHST_GARUT.toLocaleString('id-ID')}`,
    indeksFungsi: retCalc.indexFungsi || 0.15,
    indeksKompleksitas: retCalc.indexKompleksitas || 0.10,
    indeksPermanensi: retCalc.indexPermanensi || 0.20,
    indeksLantai: retCalc.indexJumlahLantai || 1.00,
    indeksLokalitas: retCalc.indeksLokalitas || 0.50,
    indeksTerintegrasi: Number(integratedIndex.toFixed(4)),
    subtotalBangunan: retCalc.buildingSubtotal || 0,
    subtotalPrasarana: retCalc.infrastructureSubtotal || 0,
    totalRetribusi: totalRet,
    totalRetribusiFormatted: `Rp ${totalRet.toLocaleString('id-ID')}`,
    terbilangRupiah: terbilangRupiah(totalRet)
  };

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

  const placeholders: Record<string, string> = {
    '{{pemerintah}}': header.pemerintah,
    '{{dinas}}': header.dinas,
    '{{alamat_dinas}}': header.alamat,
    '{{nomor_surat}}': header.nomorSurat,
    '{{tanggal_surat}}': header.tanggalLengkap,
    '{{no_register}}': app.registerNumber,
    '{{no_permohonan}}': app.applicationNumber,
    '{{nama_pemohon}}': pemohon.nama,
    '{{nik_pemohon}}': pemohon.nik,
    '{{telepon_pemohon}}': pemohon.telepon,
    '{{email_pemohon}}': pemohon.email,
    '{{alamat_pemohon}}': pemohon.alamat,
    '{{nama_bangunan}}': bangunan.nama,
    '{{fungsi_bangunan}}': bangunan.fungsi,
    '{{kompleksitas_bangunan}}': bangunan.kompleksitas,
    '{{luas_bangunan}}': `${bangunan.luasBangunanM2} m²`,
    '{{luas_tanah}}': `${bangunan.luasTanahM2} m²`,
    '{{jumlah_lantai}}': `${bangunan.jumlahLantai} Lantai`,
    '{{alamat_bangunan}}': `${bangunan.alamat}, Kec. ${bangunan.kecamatan}`,
    '{{total_retribusi}}': retribusi.totalRetribusiFormatted,
    '{{terbilang_rupiah}}': retribusi.terbilangRupiah,
    '{{status_visite}}': visite.statusKelaikan,
    '{{hasil_sidang}}': beritaAcara.hasilSidang,
    '{{penandatangan}}': 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kab. Garut',
    '{{nip_penandatangan}}': 'NIP. 19780512 200501 1 008',
    '{{kode_barcode}}': hash
  };

  return {
    datasetVersion: '1.0.0-SIPEKA-SSOT',
    generatedAt: currentDate.toISOString(),
    documentType: docType,
    documentTitle: getDocumentTitle(docType),
    registerNumber: app.registerNumber,
    applicationNumber: app.applicationNumber,
    header,
    pemohon,
    bangunan,
    retribusi,
    visite,
    beritaAcara,
    dokumenChecklist: docRows,
    verifikasiDigital: {
      verificationUrl: `https://simbg.garutkab.go.id/verify/${hash}`,
      qrHash: hash,
      statusTtd: 'TERVERIFIKASI_ELEKTRONIK_BSRE',
      penandatangan: 'Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kab. Garut',
      nipPenandatangan: 'NIP. 19780512 200501 1 008'
    },
    placeholders
  };
}

export function getDocumentTitle(docType: OfficialDocumentType): string {
  switch (docType) {
    case 'SKRD':
      return 'Surat Ketetapan Retribusi Daerah (SKRD)';
    case 'BA_VISITE':
      return 'Berita Acara Visite Lapangan Inspection (SLF/PBG)';
    case 'BA_KONSULTASI':
      return 'Berita Acara Sidang Konsultasi Teknis TPA/TPT';
    case 'SURAT_PEMBERITAHUAN':
      return 'Surat Pemberitahuan Jadwal Sidang Konsultasi';
    case 'FORM_INSPEKSI_CHECKLIST':
      return 'Formulir Inspeksi & Checklist Teknis PUPR';
    case 'REKAPITULASI_RETRIBUSI_XLSX':
      return 'Rekapitulasi Perhitungan Retribusi Bangunan Gedung';
    case 'PERNYATAAN_STANDAR_TEKNIS':
      return 'Surat Pernyataan Pemenuhan Standar Teknis';
    case 'REKAPITULASI_PEMOHON_XLSX':
      return 'Rekapitulasi Data Permohonan SIMBG Kab. Garut';
    default:
      return 'Dokumen Resmi Dinas PUPR Kabupaten Garut';
  }
}

/**
  * Export dataset directly as a formatted DOCX / Word XML file.
  */
export function exportDatasetToDocx(dataset: OfficialDocumentDataset): void {
  const docTitle = dataset.documentTitle;
  const fileName = `${docTitle.replace(/\s+/g, '_')}_${dataset.registerNumber}.docx`;

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${docTitle}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; margin: 20mm; }
        .kop-header { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px; }
        .kop-header h2 { font-size: 12pt; margin: 0; font-weight: bold; }
        .kop-header h1 { font-size: 14pt; margin: 2px 0; font-weight: bold; text-transform: uppercase; }
        .kop-header p { font-size: 9pt; margin: 0; color: #333; }
        .title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-top: 10px; text-transform: uppercase; }
        .subtitle { text-align: center; font-size: 10pt; font-weight: bold; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; font-size: 10pt; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
        .no-border td { border: none; padding: 3px 0; }
        .section-title { font-weight: bold; font-size: 11pt; margin-top: 12px; margin-bottom: 5px; text-transform: uppercase; }
        .total-box { font-weight: bold; background-color: #e6f0fa; text-align: right; }
        .signature-table { margin-top: 30px; width: 100%; border: none; }
        .signature-table td { border: none; text-align: center; vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="kop-header">
        <h2>${dataset.header.pemerintah}</h2>
        <h1>${dataset.header.dinas}</h1>
        <p>${dataset.header.alamat}</p>
        <p>Telp / Fax: ${dataset.header.telepon} | Website: ${dataset.header.website} | Email: ${dataset.header.email}</p>
      </div>

      <div class="title">${dataset.documentTitle}</div>
      <div class="subtitle">NOMOR: ${dataset.header.nomorSurat}</div>

      <div class="section-title">I. IDENTITAS PERMOHONAN & PEMOHON</div>
      <table class="no-border">
        <tr><td width="30%">No. Register SIMBG</td><td width="5%">:</td><td><strong>${dataset.registerNumber}</strong></td></tr>
        <tr><td>Nama Wajib Retribusi / Pemohon</td><td>:</td><td>${dataset.pemohon.nama} (${dataset.pemohon.nik})</td></tr>
        <tr><td>Alamat Pemohon</td><td>:</td><td>${dataset.pemohon.alamat}, Kec. ${dataset.pemohon.kecamatan}</td></tr>
        <tr><td>No. Telepon / HP</td><td>:</td><td>${dataset.pemohon.telepon}</td></tr>
      </table>

      <div class="section-title">II. SPESIFIKASI BANGUNAN GEDUNG</div>
      <table class="no-border">
        <tr><td width="30%">Nama Bangunan Gedung</td><td width="5%">:</td><td><strong>${dataset.bangunan.nama}</strong></td></tr>
        <tr><td>Fungsi Bangunan</td><td>:</td><td>${dataset.bangunan.fungsi} (${dataset.bangunan.subFungsi})</td></tr>
        <tr><td>Kompleksitas / Permanensi</td><td>:</td><td>${dataset.bangunan.kompleksitas} / ${dataset.bangunan.permanensi}</td></tr>
        <tr><td>Jumlah Lantai / Tinggi</td><td>:</td><td>${dataset.bangunan.jumlahLantai} Lantai (${dataset.bangunan.tinggiMeter} meter)</td></tr>
        <tr><td>Luas Bangunan / Tanah</td><td>:</td><td>${dataset.bangunan.luasBangunanM2} m² / ${dataset.bangunan.luasTanahM2} m²</td></tr>
        <tr><td>Lokasi Bangunan</td><td>:</td><td>${dataset.bangunan.alamat}, Kec. ${dataset.bangunan.kecamatan}, Kab. Garut</td></tr>
      </table>

      <div class="section-title">III. RINCIAN PERHITUNGAN RETRIBUSI PBG/SLF</div>
      <table>
        <thead>
          <tr>
            <th>Parameter Formula</th>
            <th>Nilai / Koefisien</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Luas Bangunan (L)</td>
            <td style="text-align:center;">${dataset.bangunan.luasBangunanM2} m²</td>
            <td>Luas fisik bangunan</td>
          </tr>
          <tr>
            <td>SHST Kabupaten Garut</td>
            <td style="text-align:center;">${dataset.retribusi.shstFormatted} /m²</td>
            <td>SK Bupati Garut 2026</td>
          </tr>
          <tr>
            <td>Indeks Terintegrasi (I_k)</td>
            <td style="text-align:center;">${dataset.retribusi.indeksTerintegrasi}</td>
            <td>Fungsi x Kompleksitas x Permanensi x Lantai</td>
          </tr>
          <tr>
            <td>Indeks Lokalitas Wilayah</td>
            <td style="text-align:center;">${dataset.retribusi.indeksLokalitas}</td>
            <td>Parameter Daerah Garut</td>
          </tr>
          <tr class="total-box">
            <td colspan="2" style="font-size: 11pt;">TOTAL RETRIBUSI TERHUTANG</td>
            <td style="text-align: right; font-size: 12pt; font-weight: bold; color: #0f4c81;">${dataset.retribusi.totalRetribusiFormatted}</td>
          </tr>
        </tbody>
      </table>
      <p style="font-style: italic; font-size: 9.5pt; color: #444;">
        Terbilang: <strong>"${dataset.retribusi.terbilangRupiah}"</strong>
      </p>

      <div class="section-title">IV. HASIL VERIFIKASI & DOKUMEN CHECKLIST</div>
      <table>
        <thead>
          <tr>
            <th width="8%">No</th>
            <th width="20%">Kode</th>
            <th>Nama Persyaratan Dokumen</th>
            <th width="20%">Status</th>
          </tr>
        </thead>
        <tbody>
          ${dataset.dokumenChecklist.map(doc => `
            <tr>
              <td style="text-align:center;">${doc.no}</td>
              <td>${doc.kode}</td>
              <td>${doc.nama}</td>
              <td style="text-align:center; font-weight:bold;">${doc.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table class="signature-table">
        <tr>
          <td width="50%">
            <p>Diverifikasi Oleh,<br>Tim Penilai Teknis DPUPR Garut</p>
            <br><br><br>
            <p><strong><u>VERIFIKATOR SIMBG</u></strong><br>NIP. 19850314 201001 1 005</p>
          </td>
          <td width="50%">
            <p>Garut, ${dataset.header.tanggalLengkap}<br>${dataset.verifikasiDigital.penandatangan}</p>
            <br><br>
            <p style="font-size: 8pt; color: #666;">[ Terverifikasi BSrE / QR DPUPR ]<br><strong>${dataset.verifikasiDigital.qrHash}</strong></p>
            <br>
            <p><strong><u>KEPALA DINAS PUPR</u></strong><br>${dataset.verifikasiDigital.nipPenandatangan}</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
  * Export dataset as a structured CSV/XLSX spreadsheet table file.
  */
export function exportDatasetToXlsxCsv(
  dataset: OfficialDocumentDataset, 
  docType: OfficialDocumentType = 'REKAPITULASI_RETRIBUSI_XLSX'
): void {
  const fileName = `Export_${docType}_${dataset.registerNumber}_${Date.now()}.csv`;

  let csvContent = `\uFEFF`; // UTF-8 BOM for Excel compatibility

  if (docType === 'REKAPITULASI_RETRIBUSI_XLSX' || docType === 'SKRD') {
    csvContent += `METADATA LAPORAN SIPEKA v2.0 - DINAS PUPR KABUPATEN GARUT\n`;
    csvContent += `Nomor Register;${dataset.registerNumber}\n`;
    csvContent += `Nomor Permohonan;${dataset.applicationNumber}\n`;
    csvContent += `Nama Pemohon;${dataset.pemohon.nama}\n`;
    csvContent += `NIK Pemohon;${dataset.pemohon.nik}\n`;
    csvContent += `Nama Bangunan;${dataset.bangunan.nama}\n`;
    csvContent += `Fungsi Bangunan;${dataset.bangunan.fungsi}\n`;
    csvContent += `Lokasi Bangunan;${dataset.bangunan.alamat}, Kec. ${dataset.bangunan.kecamatan}\n`;
    csvContent += `Tanggal Cetak;${dataset.header.tanggalLengkap}\n\n`;

    csvContent += `RINCIAN PARAMETER KALKULASI RETRIBUSI\n`;
    csvContent += `Parameter;Nilai;Satuan;Keterangan\n`;
    csvContent += `Luas Bangunan Gedung;${dataset.bangunan.luasBangunanM2};m2;Luas Fisik Lantai\n`;
    csvContent += `SHST Kabupaten Garut;${dataset.retribusi.shstRate};Rupiah/m2;SK Bupati 2026\n`;
    csvContent += `Indeks Fungsi;${dataset.retribusi.indeksFungsi};Koefisien;PP 16/2021\n`;
    csvContent += `Indeks Kompleksitas;${dataset.retribusi.indeksKompleksitas};Koefisien;PP 16/2021\n`;
    csvContent += `Indeks Permanensi;${dataset.retribusi.indeksPermanensi};Koefisien;PP 16/2021\n`;
    csvContent += `Indeks Jumlah Lantai;${dataset.retribusi.indeksLantai};Koefisien;Koefisien Lantai\n`;
    csvContent += `Indeks Terintegrasi;${dataset.retribusi.indeksTerintegrasi};Koefisien;Hasil Perkalian Koefisien\n`;
    csvContent += `Subtotal Retribusi Bangunan;${dataset.retribusi.subtotalBangunan};Rupiah;Kalkulasi Bangunan Utama\n`;
    csvContent += `Subtotal Retribusi Prasarana;${dataset.retribusi.subtotalPrasarana};Rupiah;Kalkulasi Prasarana\n`;
    csvContent += `TOTAL RETRIBUSI TERHUTANG;${dataset.retribusi.totalRetribusi};Rupiah;${dataset.retribusi.terbilangRupiah}\n`;
  } else {
    // Document Checklist / Inspection CSV
    csvContent += `NO;KODE_DOKUMEN;NAMA_DOKUMEN;KATEGORI;STATUS_VERIFIKASI;CATATAN\n`;
    dataset.dokumenChecklist.forEach(item => {
      csvContent += `${item.no};${item.kode};"${item.nama}";${item.kategori};${item.status};"${item.catatan}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
