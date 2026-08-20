
export interface RetribusiParameter {
  name: string;
  weight: number;
  options: {
    label: string;
    value: number;
  }[];
}

export const INDEKS_FUNGSI = [
  { label: 'Hunian < 100 m²', value: 0.15 },
  { label: 'Hunian > 100 m²', value: 0.17 },
  { label: 'Usaha', value: 0.7 },
  { label: 'Usaha (UMKM)', value: 0.5 },
  { label: 'Keagamaan', value: 0 },
  { label: 'Fungsi Khusus', value: 1 },
  { label: 'Sosial Budaya', value: 0.3 },
  { label: 'Ganda Campuran', value: 0.7 }, // Assuming 0.7 based on Usaha
];

export const INDEKS_BG_TERBANGUN = [
  { label: 'Bangunan Gedung Baru', value: 1 },
  { label: 'Bangunan Gedung Lama', value: 0 },
  { label: 'Rehabilitasi/Renovasi (Sedang)', value: 0.255 },
  { label: 'Rehabilitasi/Renovasi (Berat)', value: 0.325 },
  { label: 'Pelestarian/Pemugaran (Pratama)', value: 0.325 },
  { label: 'Pelestarian/Pemugaran (Madya)', value: 0.225 },
  { label: 'Pelestarian/Pemugaran (Utama)', value: 0.15 },
];

export const PARAMETERS_KLASIFIKASI: RetribusiParameter[] = [
  {
    name: 'Kompleksitas',
    weight: 0.25,
    options: [
      { label: 'Sederhana', value: 0.4 },
      { label: 'Tidak Sederhana', value: 0.7 },
      { label: 'Khusus', value: 1.0 },
    ],
  },
  {
    name: 'Permanensi',
    weight: 0.20,
    options: [
      { label: 'Darurat', value: 0.4 },
      { label: 'Semi Permanen', value: 0.7 },
      { label: 'Permanen', value: 1.0 },
    ],
  },
  {
    name: 'Zonasi Gempa',
    weight: 0.15,
    options: [
      { label: 'Rendah', value: 0.4 },
      { label: 'Sedang', value: 0.7 },
      { label: 'Tinggi', value: 1.0 },
    ],
  },
  {
    name: 'Kepadatan',
    weight: 0.10,
    options: [
      { label: 'Rendah', value: 0.4 },
      { label: 'Sedang', value: 0.7 },
      { label: 'Tinggi', value: 1.0 },
    ],
  },
  {
    name: 'Ketinggian',
    weight: 0.10,
    options: [
      { label: 'Rendah', value: 0.4 },
      { label: 'Sedang', value: 0.7 },
      { label: 'Tinggi', value: 1.0 },
    ],
  },
  {
    name: 'Kepemilikan',
    weight: 0.05,
    options: [
      { label: 'Pemerintah', value: 0 },
      { label: 'Perorangan', value: 1.0 },
      { label: 'Badan Usaha', value: 1.0 },
    ],
  },
  {
    name: 'Waktu Penggunaan',
    weight: 0.15,
    options: [
      { label: 'Sementara Jangka Pendek', value: 0.4 },
      { label: 'Sementara Jangka Menengah', value: 0.7 },
      { label: 'Tetap', value: 1.0 },
    ],
  },
];

export const KOEFISIEN_LANTAI = [
  { label: 'Lantai 1', value: 1 },
  { label: 'Lantai 2', value: 1.09 },
  { label: 'Lantai 3', value: 1.12 },
  { label: 'Lantai 4', value: 1.135 },
  { label: 'Lantai 5', value: 1.162 },
  { label: 'Lantai 6', value: 1.197 },
  { label: 'Lantai 7', value: 1.299 },
  { label: 'Lantai 8', value: 1.265 },
  { label: 'Lantai 9', value: 1.299 },
  { label: 'Lantai 10', value: 1.333 },
  { label: 'Besmen 1 lapis', value: 1.197 },
  { label: 'Besmen 2 lapis', value: 1.299 },
  { label: 'Besmen 3 lapis', value: 1.393 },
  { label: 'Besmen 3 lapis + (n)', value: 1.493 },
];

export const PRASARANA_TYPES = [
  { label: 'Konstruksi Pembatas/Pagar', unit: 'm', price: 50000 },
  { label: 'Konstruksi Penahan Tanah', unit: 'm3', price: 150000 },
  { label: 'Konstruksi Menara', unit: 'unit', price: 1000000 },
  { label: 'Tangki/Tandon Air', unit: 'm3', price: 75000 },
  { label: 'Konstruksi Reklame', unit: 'm2', price: 200000 },
];
