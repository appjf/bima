
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
  // Page 1
  { label: 'Pagar', unit: 'M2', price: 12000 },
  { label: 'Tanggul/Retaining wall', unit: 'M2', price: 9000 },
  { label: 'Turap batas kaveling/persil', unit: 'M2', price: 6000 },
  { label: 'Gapura', unit: 'M2', price: 102000 },
  { label: 'Gerbang', unit: 'M2', price: 102000 },
  { label: 'Pos', unit: 'M2', price: 0 },
  { label: 'Jalan', unit: 'M2', price: 6000 },
  { label: 'Parkir', unit: 'M2', price: 6000 },
  { label: 'Lapangan Upacara', unit: 'M2', price: 3000 },
  { label: 'Lapangan Olahraga Terbuka', unit: 'M2', price: 4000 },
  { label: 'Taman Bermain dan Lapangan Voli', unit: 'M2', price: 4000 },
  { label: 'Carport', unit: 'M2', price: 3000 },
  { label: 'Teras', unit: 'M2', price: 3000 },
  { label: 'Pedestrian', unit: 'M2', price: 3000 },
  { label: 'Perkerasan Grassblock', unit: 'M2', price: 3000 },
  { label: 'Jembatan', unit: 'M2', price: 68000 },
  { label: 'Dek', unit: 'M2', price: 68000 },
  { label: 'Box Culvert', unit: 'M2', price: 17000 },
  { label: 'Jembatan antar gedung', unit: 'M2', price: 68000 },
  { label: 'Jembatan Penyebrangan orang/barang', unit: 'M2', price: 68000 },
  { label: 'Jembatan bawah tanah/underpass', unit: 'M2', price: 150000 },
  { label: 'Mini Pool dan Kolam Renang', unit: 'M2', price: 50000 },
  { label: 'Reflecting Pool', unit: 'M2', price: 50000 },
  { label: 'Kolam (Danau)', unit: 'M2', price: 50000 },
  { label: 'Ground Water Tank', unit: 'M2', price: 10000 },
  { label: 'Septictank, sumur resapan', unit: 'M2', price: 8000 },
  { label: 'Menara reservoir', unit: 'per 5 m2', price: 238000 },
  { label: 'Cerobong', unit: 'per 5 m2', price: 238000 },
  { label: 'Bak Penampung Air', unit: 'per 5 m2', price: 238000 },
  { label: 'Kolam Pengolahan air reservoir bawah tanah', unit: 'M2', price: 379000 },
  { label: 'Patung', unit: 'Unit', price: 379000 },
  { label: 'Di dalam persil', unit: 'Unit', price: 379000 },
  { label: 'Di Luar persil', unit: 'Unit', price: 379000 },
  { label: 'PJU', unit: 'per 10 m2', price: 200000 },
  { label: 'TPS (9 M2)', unit: 'per 10 m2', price: 200000 },
  { label: 'Instalasi Listrik (80 M2)', unit: 'per 10 m2', price: 200000 },
  { label: 'Bak Penampung (50 M2)', unit: 'per 10 m2', price: 200000 },
  { label: 'TPS 3R (200 M2)', unit: 'per 10 m2', price: 200000 },
  { label: 'TPS Domestik (200 M2)', unit: 'per 10 m2', price: 200000 },
  { label: 'IPAL (120 M2)', unit: 'per 10 m2', price: 200000 },
  { label: 'Instalasi Pengolahan', unit: 'per 10 m2', price: 200000 },
  { label: 'Billboard papan iklan', unit: 'per Maks 10 m2', price: 3500000 },
  { label: 'Papan nama (berdiri sendiri atau berupa tembok pagar)', unit: 'per Maks 10 m2', price: 377000 },
  { label: 'Fondasi mesin (diluar bangunan)', unit: 'per Unit Mesin', price: 193000 },
  { label: 'Menara televisi /100 m', unit: 'Tg Mak 100 m1', price: 10000000 },
  
  // Page 2
  { label: 'Antena radio 3-4 Kaki Ketinggian 20 - 50 m', unit: 'Unit', price: 6000000 },
  { label: 'Antena radio 3-4 Kaki Ketinggian 51 - 75 m', unit: 'Unit', price: 8000000 },
  { label: 'Antena radio 3-4 Kaki Ketinggian 76 - 100 m', unit: 'Unit', price: 10000000 },
  { label: 'Antena radio 3-4 Kaki Ketinggian 101 - 125 m', unit: 'Unit', price: 12500000 },
  { label: 'Antena radio 3-4 Kaki Ketinggian 126 - 150 m', unit: 'Unit', price: 15000000 },
  { label: 'Antena radio 3-4 Kaki Ketinggian Diatas 150 m', unit: 'Unit', price: 20500000 },
  { label: 'Antena radio guy wire Tinggi 0-50 m', unit: 'Unit', price: 3000000 },
  { label: 'Antena radio guy wire Tinggi 51-75 m', unit: 'Unit', price: 4000000 },
  { label: 'Antena radio guy wire Tinggi 76-100 m', unit: 'Unit', price: 6000000 },
  { label: 'Antena radio guy wire diatas 100 m', unit: 'Unit', price: 10000000 },
  { label: 'Menara bersama Tinggi Kurang dari 25 m', unit: 'Unit', price: 6000000 },
  { label: 'Menara bersama Tinggi 25-50 m', unit: 'Unit', price: 10000000 },
  { label: 'Menara bersama Tinggi diatas 50 m', unit: 'Unit', price: 15000000 },
  { label: 'Menara mandiri Tinggi Kurang dari 25 m', unit: 'Unit', price: 6000000 },
  { label: 'Menara mandiri Tinggi 25-50 m', unit: 'Unit', price: 10000000 },
  { label: 'Menara mandiri Tinggi diatas 50 m', unit: 'Unit', price: 15000000 },
  { label: 'Tangki tanam bahan bakar', unit: 'Unit', price: 4000000 },
  { label: 'Saluran', unit: 'M1', price: 3000 },
  { label: 'Kolam Tampung/Bak Kontrol', unit: 'M2', price: 9000 },
  { label: 'Penyimpanan silo', unit: 'M3', price: 35000 },
];
