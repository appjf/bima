import React, { useState } from 'react';
import { 
  X, 
  User, 
  Building2, 
  FileSpreadsheet, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Layers, 
  Compass, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  Application, 
  ApplicationPermitType, 
  BuildingFunction, 
  BuildingComplexity, 
  ExistingImbStatus,
  WorkflowStage
} from '../types';

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newApp: Application) => void;
  initialData?: Partial<Application>;
}

// Kecamatan di Kabupaten Garut
export const GARUT_DISTRICTS = [
  'Tarogong Kidul',
  'Tarogong Kaler',
  'Garut Kota',
  'Karangpawitan',
  'Samarang',
  'Kadungora',
  'Leles',
  'Cilawu',
  'Banyuresmi',
  'Wanaraja',
  'Sucinaraja',
  'Pangatikan',
  'Sukawening',
  'Karangtengah',
  'Bayongbong',
  'Cigedug',
  'Cikajang',
  'Banjarwangi',
  'Singajaya',
  'Peundeuy',
  'Pameungpeuk',
  'Cibalong',
  'Cikelet',
  'Cisompet',
  'Bungbulang',
  'Pakenjeng',
  'Pamulihan',
  'Cisewu',
  'Caringin',
  'Talegong',
  'Limbangan',
  'Selaawi',
  'Malangbong',
  'Cibiuk',
  'Leuwigoong',
  'Pasirwangi',
  'Sukaresmi'
];

export const SUB_FUNCTIONS_BY_FUNCTION: Record<BuildingFunction, string[]> = {
  HUNIAN: [
    'Rumah Tinggal Tunggal',
    'Rumah Tinggal Deret',
    'Rumah Tinggal Susun / Apartemen',
    'Rumah Tinggal Sementara (Kost/Asrama)',
    'Rumah Singgah / Villa'
  ],
  USAHA: [
    'Pertokoan / Ruko / Rukan',
    'Perkantoran',
    'Pasar Tradisional / Modern / Mall',
    'Perhotelan / Penginapan / Resort',
    'Restoran / Kafe / Rumah Makan',
    'Gudang Penyimpanan & Logistik',
    'Bengkel & Showroom Otomotif',
    'Pabrik / Industri Manufaktur'
  ],
  KEAGAMAAN: [
    'Masjid Jami / Musholla',
    'Gereja Kristen / Katolik',
    'Pura',
    'Vihara',
    'Klenteng / Tempat Ibadah Lainnya'
  ],
  SOSIAL_BUDAYA: [
    'Fasilitas Pendidikan (TK/SD/SMP/SMA/Kampus/Pesantren)',
    'Fasilitas Kesehatan (Rumah Sakit/Klinik/Puskesmas/Apotek)',
    'Gedung Pertemuan / Kesenian / Museum',
    'Fasilitas Olahraga / GOR / Stadion',
    'Panti Asuhan / Panti Wreda / Sosial'
  ],
  KHUSUS: [
    'Stasiun Pengisian Bahan Bakar (SPBU / SPBE)',
    'Gardu Induk Listrik & Pembangkit',
    'Menara Telekomunikasi / BTS',
    'Instalasi Pengolahan Air Limbah / Air Bersih',
    'Bangunan Pertahanan / Keamanan / Militer'
  ],
  CAMPURAN: [
    'Hunian & Komersial (Mix-Use Ruko-Kost)',
    'Mall, Hotel & Convention Hall Terpadu',
    'Perkantoran & Pusat Perbelanjaan'
  ]
};

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  // 1. DATA PEMILIK
  const [registerNumber, setRegisterNumber] = useState(
    initialData?.registerNumber || `PBG-320501-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [ownerName, setOwnerName] = useState(initialData?.applicant?.name || '');
  const [ownerStreetAddress, setOwnerStreetAddress] = useState(initialData?.applicant?.address || '');
  const [ownerVillage, setOwnerVillage] = useState(initialData?.applicant?.village || 'Sukagalih');
  const [ownerDistrict, setOwnerDistrict] = useState(initialData?.applicant?.district || 'Tarogong Kidul');
  const [ownerCity, setOwnerCity] = useState(initialData?.applicant?.city || 'Garut');
  const [ownerPhone, setOwnerPhone] = useState(initialData?.applicant?.phone || '');
  const [ownerEmail, setOwnerEmail] = useState(initialData?.applicant?.email || '');
  const [permitType, setPermitType] = useState<ApplicationPermitType>(
    initialData?.permitType || 'PBG_BARU'
  );

  // 2. DATA UMUM BANGUNAN GEDUNG
  const [buildingName, setBuildingName] = useState(initialData?.building?.name || '');
  const [buildingStreetAddress, setBuildingStreetAddress] = useState(initialData?.building?.address || '');
  const [buildingVillage, setBuildingVillage] = useState(initialData?.building?.village || 'Sukagalih');
  const [buildingDistrict, setBuildingDistrict] = useState(initialData?.building?.district || 'Tarogong Kidul');
  const [buildingCity, setBuildingCity] = useState(initialData?.building?.city || 'Garut');
  
  const [buildingFunction, setBuildingFunction] = useState<string>(
    initialData?.building?.functionType || 'Fungsi Hunian'
  );
  const [subFunction, setSubFunction] = useState<string>(
    initialData?.building?.subFunction || 'Rumah Tinggal Tunggal'
  );
  const [buildingComplexity, setBuildingComplexity] = useState<BuildingComplexity>(
    initialData?.building?.complexity || 'SEDERHANA'
  );
  const [buildingTypeDesc, setBuildingTypeDesc] = useState(
    initialData?.building?.buildingTypeDescription || 'Bangunan Gedung Sederhana Permanen'
  );
  const [buildingArea, setBuildingArea] = useState<number>(
    initialData?.building?.buildingArea || 120
  );
  const [landArea, setLandArea] = useState<number>(
    initialData?.building?.landArea || 150
  );
  const [floors, setFloors] = useState<number>(
    initialData?.building?.floors || 2
  );
  const [height, setHeight] = useState<number>(
    initialData?.building?.height || 7.5
  );
  const [consultantName, setConsultantName] = useState(
    initialData?.building?.consultantName || ''
  );

  // 3. Status Kepemilikan IMB/PBG
  const [existingImbStatus, setExistingImbStatus] = useState<ExistingImbStatus>(
    initialData?.building?.existingImbStatus || 'BELUM_MEMILIKI_IMB_PBG'
  );
  const [existingImbNumber, setExistingImbNumber] = useState(
    initialData?.building?.existingImbNumber || ''
  );

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Auto Generate Register Number
  const handleGenerateRegister = () => {
    const code = permitType.startsWith('SLF') ? 'SLF' : 'PBG';
    const distCode = '3205' + (Math.floor(10 + Math.random() * 30)).toString();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setRegisterNumber(`${code}-${distCode}-${dateStr}-${rand}`);
  };

  // Synchronize address helper
  const handleCopyOwnerAddressToBuilding = () => {
    setBuildingStreetAddress(ownerStreetAddress);
    setBuildingVillage(ownerVillage);
    setBuildingDistrict(ownerDistrict);
    setBuildingCity(ownerCity);
  };

  // Quick Preset Handlers
  const handleApplyPreset = (type: 'RUKO_TAROGONG' | 'RUMAH_GARUT' | 'SLF_PABRIK' | 'KLINIK_CIPANAS') => {
    if (type === 'RUKO_TAROGONG') {
      setPermitType('PBG_BARU');
      setOwnerName('Bpk. H. Dadan Ramdani, SE');
      setOwnerStreetAddress('Jl. Patriot No. 45, RT 02/RW 08');
      setOwnerVillage('Sukagalih');
      setOwnerDistrict('Tarogong Kidul');
      setOwnerCity('Garut');
      setOwnerPhone('081223456789');
      setOwnerEmail('dadan.ramdani@gmail.com');

      setBuildingName('Pembangunan Gedung Ruko & Kantor Patriot Square');
      setBuildingStreetAddress('Jl. Pembangunan No. 112');
      setBuildingVillage('Sukagalih');
      setBuildingDistrict('Tarogong Kidul');
      setBuildingCity('Garut');
      setBuildingFunction('USAHA');
      setSubFunction('Pertokoan / Ruko / Rukan');
      setBuildingComplexity('TIDAK_SEDERHANA');
      setBuildingTypeDesc('Ruko Komersial 3 Lantai Beton Bertulang');
      setBuildingArea(480);
      setLandArea(650);
      setFloors(3);
      setHeight(12.5);
      setConsultantName('PT. Garut Cipta Rancang / Ir. Hendra Setiawan, IAI');
      setExistingImbStatus('BELUM_MEMILIKI_IMB_PBG');
    } else if (type === 'RUMAH_GARUT') {
      setPermitType('PBG_BARU');
      setOwnerName('Bpk. Irfan Maulana');
      setOwnerStreetAddress('Jl. Cimanuk No. 204, Jayawaras');
      setOwnerVillage('Jayawaras');
      setOwnerDistrict('Tarogong Kidul');
      setOwnerCity('Garut');
      setOwnerPhone('087829102938');
      setOwnerEmail('irfan.maulana@gmail.com');

      setBuildingName('Pembangunan Rumah Tinggal 2 Lantai Jayawaras');
      setBuildingStreetAddress('Perumahan Intan Asri Blok C-12');
      setBuildingVillage('Jayawaras');
      setBuildingDistrict('Tarogong Kidul');
      setBuildingCity('Garut');
      setBuildingFunction('HUNIAN');
      setSubFunction('Rumah Tinggal Tunggal');
      setBuildingComplexity('SEDERHANA');
      setBuildingTypeDesc('Rumah Tinggal 2 Lantai');
      setBuildingArea(160);
      setLandArea(180);
      setFloors(2);
      setHeight(7.5);
      setConsultantName('Arsitek Mandiri / Bpk. Rudi Hartono, ST');
      setExistingImbStatus('BELUM_MEMILIKI_IMB_PBG');
    } else if (type === 'SLF_PABRIK') {
      setPermitType('SLF_EKSISTING');
      setOwnerName('PT. Agro Intan Perkasa (Bpk. H. Yudi)');
      setOwnerStreetAddress('Kawasan Industri Kadungora Blok B-3');
      setOwnerVillage('Karangtengah');
      setOwnerDistrict('Kadungora');
      setOwnerCity('Garut');
      setOwnerPhone('081321456987');
      setOwnerEmail('operasional@agrointan.co.id');

      setBuildingName('Gedung Pabrik & Gudang Pengolahan Kopi Garut');
      setBuildingStreetAddress('Jl. Raya Kadungora KM 14 No. 88');
      setBuildingVillage('Karangtengah');
      setBuildingDistrict('Kadungora');
      setBuildingCity('Garut');
      setBuildingFunction('USAHA');
      setSubFunction('Pabrik / Industri Manufaktur');
      setBuildingComplexity('TIDAK_SEDERHANA');
      setBuildingTypeDesc('Bangunan Pabrik Struktur Baja Berat & Gudang');
      setBuildingArea(1400);
      setLandArea(2500);
      setFloors(1);
      setHeight(9.0);
      setConsultantName('Pengkaji Teknis IPT / PT. Struktur Prima Konsultan');
      setExistingImbStatus('SUDAH_MEMILIKI_IMB');
      setExistingImbNumber('503.640/IMB-082/DPUPR-GRT/2018');
    } else if (type === 'KLINIK_CIPANAS') {
      setPermitType('PBG_BARU');
      setOwnerName('Ibu Hj. Siti Nurjanah, S.Kep');
      setOwnerStreetAddress('Kp. Cipanas RT 01/RW 04');
      setOwnerVillage('Rancabango');
      setOwnerDistrict('Tarogong Kaler');
      setOwnerCity('Garut');
      setOwnerPhone('085220112233');
      setOwnerEmail('siti.nurjanah.garut@gmail.com');

      setBuildingName('Pembangunan Klinik Pratama Rawat Inap Sehat Garut');
      setBuildingStreetAddress('Jl. Raya Cipanas No. 88, Rancabango');
      setBuildingVillage('Rancabango');
      setBuildingDistrict('Tarogong Kaler');
      setBuildingCity('Garut');
      setBuildingFunction('SOSIAL_BUDAYA');
      setSubFunction('Fasilitas Kesehatan (Rumah Sakit/Klinik/Puskesmas/Apotek)');
      setBuildingComplexity('TIDAK_SEDERHANA');
      setBuildingTypeDesc('Fasilitas Pelayanan Kesehatan Rawat Inap');
      setBuildingArea(310);
      setLandArea(420);
      setFloors(2);
      setHeight(8.0);
      setConsultantName('CV. Garut Medika Graha / Ir. Nina Marlina');
      setExistingImbStatus('BELUM_MEMILIKI_IMB_PBG');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const id = `APP-GARUT-${Date.now().toString().slice(-4)}`;
    const fullOwnerAddress = `${ownerStreetAddress}, Desa/Kel. ${ownerVillage}, Kec. ${ownerDistrict}, Kab. ${ownerCity}`;
    const fullBuildingAddress = `${buildingStreetAddress}, Desa/Kel. ${buildingVillage}, Kec. ${buildingDistrict}, Kab. ${buildingCity}`;
    const chosenSubFunction = subFunction.trim() || 'Rumah Tinggal Tunggal';

    const newApp: Application = {
      id,
      registerNumber,
      applicationNumber: `SIMBG-2026-GRT-${Math.floor(1000 + Math.random() * 9000)}`,
      submissionDate: new Date().toISOString().split('T')[0],
      permitType,
      status: 'NEW',
      currentStage: 'STAGE_1_INPUT_DATA',
      priority: 'NORMAL',
      applicant: {
        name: ownerName,
        nik: '3205' + Math.floor(100000000000 + Math.random() * 900000000000).toString(),
        phone: ownerPhone,
        email: ownerEmail || `${ownerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        address: fullOwnerAddress,
        village: ownerVillage,
        district: ownerDistrict,
        city: ownerCity
      },
      building: {
        name: buildingName,
        functionType: buildingFunction,
        subFunction: chosenSubFunction,
        buildingTypeDescription: buildingTypeDesc,
        complexity: buildingComplexity,
        address: fullBuildingAddress,
        district: buildingDistrict,
        village: buildingVillage,
        city: buildingCity,
        landArea: Number(landArea) || 100,
        buildingArea: Number(buildingArea) || 100,
        floors: Number(floors) || 1,
        height: Number(height) || (Number(floors) * 3.5),
        kdb: Math.round(((Number(buildingArea) / (Number(floors) || 1)) / (Number(landArea) || 1)) * 100) || 60,
        klb: Number(((Number(buildingArea)) / (Number(landArea) || 1)).toFixed(2)) || 1.2,
        permanence: 'PERMANEN',
        existingImbStatus,
        existingImbNumber: existingImbStatus === 'SUDAH_MEMILIKI_IMB' || existingImbStatus === 'SUDAH_MEMILIKI_PBG' ? existingImbNumber : undefined,
        consultantName: consultantName || 'Tim Perencana Mandiri'
      },
      documents: [
        { id: 'd1', code: 'DOC-KTP-01', name: 'KTP Pemohon / Akta Perusahaan', category: 'UMUM', isMandatory: true, status: 'VALID', fileName: 'KTP_Pemohon.pdf', fileSize: '1.1 MB' },
        { id: 'd2', code: 'DOC-TANAH-02', name: 'Bukti Kepemilikan Hak Atas Tanah', category: 'UMUM', isMandatory: true, status: 'VALID', fileName: 'Sertifikat_Tanah.pdf', fileSize: '3.4 MB' },
        { id: 'd3', code: 'DOC-KRK-03', name: 'Keterangan Rencana Kota (KRK) Garut', category: 'UMUM', isMandatory: true, status: 'VALID', fileName: 'KRK_Garut.pdf', fileSize: '1.8 MB' },
        { id: 'd4', code: 'DOC-ARS-04', name: 'Gambar Arsitektur Lengkap', category: 'ARSITEKTUR', isMandatory: true, status: 'TERUNGGAH', fileName: 'Gambar_Arsitektur.pdf', fileSize: '8.5 MB' },
        { id: 'd5', code: 'DOC-STRUK-06', name: 'Gambar & Perhitungan Struktur', category: 'STRUKTUR', isMandatory: true, status: 'TERUNGGAH', fileName: 'Perhitungan_Struktur.pdf', fileSize: '6.2 MB' },
        { id: 'd6', code: 'DOC-MEP-08', name: 'Gambar Rencana MEP & Sanitasi', category: 'MEP', isMandatory: true, status: 'TERUNGGAH', fileName: 'Gambar_MEP.pdf', fileSize: '4.1 MB' }
      ],
      slaDays: 0,
      slaDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      slaStatus: 'IN_SLA',
      dataQualityScore: 100,
      dataErrors: [],
      assignedOperator: 'Operator SIMBG DPUPR Garut',
      internalNotes: `Permohonan ${permitType} didaftarkan melalui Input Data Permohonan. Siap diverifikasi multi-disiplin.`,
      lastUpdated: new Date().toISOString()
    };

    onSubmit(newApp);
    onClose();
  };

  const copyAsTableText = () => {
    const text = `
=== FORMULIR INPUT DATA PERMOHONAN SIMBG DPUPR GARUT ===

DATA PEMILIK
Nomor Register            : ${registerNumber}
Nama Pemilik              : ${ownerName}
Alamat Pemilik            : ${ownerStreetAddress}
            Desa/Kel.     : ${ownerVillage}
            Kec.          : ${ownerDistrict}
            Kab.          : ${ownerCity}
Nomor Telp/HP             : ${ownerPhone}
Alamat email              : ${ownerEmail}
Jenis Permohonan          : ${permitType}

DATA UMUM BANGUNAN GEDUNG
Nama Bangunan Gedung      : ${buildingName}
Lokasi Bangunan Gedung    : ${buildingStreetAddress}
            Desa/Kel.     : ${buildingVillage}
            Kec.          : ${buildingDistrict}
            Kab.          : ${buildingCity}
Fungsi Bangunan           : ${buildingFunction}
Sub Fungsi Bangunan       : ${subFunction}
Jenis Bangunan Gedung     : ${buildingTypeDesc} (${buildingComplexity})
Luas Bangunan Gedung      : ${buildingArea} m²
Nama Konsultan            : ${consultantName || '-'}
Status IMB/PBG Eksisting  : ${existingImbStatus} ${existingImbNumber ? `(${existingImbNumber})` : ''}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-indigo-500 w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 flex items-center justify-center font-mono font-bold text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">
                  FORMULIR STANDAR RESMI // SIMBG DPUPR GARUT
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 font-mono">
                  PP 16/2021
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-mono uppercase tracking-tight text-white flex items-center gap-2">
                <span>Input Data Permohonan (PBG & SLF)</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyAsTableText}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition"
              title="Salin data teks berformat tabel"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin Format'}</span>
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 font-mono text-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold uppercase">Template Cepat Garut:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleApplyPreset('RUKO_TAROGONG')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-[11px] font-mono whitespace-nowrap transition"
            >
              🏢 Ruko 3 Lt Tarogong
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('RUMAH_GARUT')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-[11px] font-mono whitespace-nowrap transition"
            >
              🏡 Rumah 2 Lt Jayawaras
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('SLF_PABRIK')}
              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-amber-900 dark:text-amber-200 text-[11px] font-mono font-bold whitespace-nowrap transition"
            >
              🏭 SLF Pabrik Kadungora
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('KLINIK_CIPANAS')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-[11px] font-mono whitespace-nowrap transition"
            >
              🏥 Klinik Pratama Cipanas
            </button>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6 text-xs font-sans">
          
          {/* ========================================================================= */}
          {/* SECTION 1: DATA PEMILIK */}
          {/* ========================================================================= */}
          <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase font-mono text-sm tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>DATA PEMILIK</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                BAGIAN 1 // IDENTITAS PEMOHON
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              
              {/* Nomor Register */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Nomor Register
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      placeholder="Contoh: PBG-320501-18082026-0001"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-indigo-600 dark:text-indigo-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRegister}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center gap-1 whitespace-nowrap"
                      title="Generate Nomor Register Otomatis"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Auto</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Nama Pemilik */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Nama Pemilik
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Nama lengkap pemilik / nama perusahaan / yayasan (e.g. Bpk. H. Dadan / PT. Garut Properti)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Alamat Pemilik (Jalan / RT / RW) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Alamat Pemilik
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="text"
                    required
                    value={ownerStreetAddress}
                    onChange={(e) => setOwnerStreetAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, RT/RW, blok atau kawasan domisili pemohon"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Alamat Pemilik: Desa/Kel, Kec, Kab */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <div className="sm:col-span-3 hidden sm:block"></div>
                <div className="sm:col-span-9 flex items-center gap-2 pl-0 sm:pl-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mb-1 font-bold">
                        <span>Desa/Kel.</span>
                        <span className="font-bold">:</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={ownerVillage}
                        onChange={(e) => setOwnerVillage(e.target.value)}
                        placeholder="Contoh: Sukagalih"
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mb-1 font-bold">
                        <span>Kec.</span>
                        <span className="font-bold">:</span>
                      </div>
                      <input
                        type="text"
                        required
                        list="districts-list-owner"
                        value={ownerDistrict}
                        onChange={(e) => setOwnerDistrict(e.target.value)}
                        placeholder="Contoh: Tarogong Kidul"
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <datalist id="districts-list-owner">
                        {GARUT_DISTRICTS.map(d => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mb-1 font-bold">
                        <span>Kab.</span>
                        <span className="font-bold">:</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={ownerCity}
                        onChange={(e) => setOwnerCity(e.target.value)}
                        placeholder="Contoh: Garut"
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nomor Telp/HP */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Nomor Telp/HP
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <div className="flex-1 flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 font-mono text-slate-500 text-xs">
                      🇮🇩 +62
                    </span>
                    <input
                      type="text"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="081234567890 (Nomor WhatsApp Aktif Notifikasi)"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat email */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Alamat email
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="contoh: pemohon@domain.com"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jenis Permohonan */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Jenis Permohonan
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <select
                    value={permitType}
                    onChange={(e) => setPermitType(e.target.value as ApplicationPermitType)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-indigo-700 dark:text-indigo-300 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="PBG_BARU">PBG - Bangunan Gedung Baru</option>
                    <option value="SLF_EKSISTING">SLF - Bangunan Gedung Eksisting (Wajib Visite Lapangan)</option>
                    <option value="PBG_PERUBAHAN">PBG - Perubahan Bangunan Gedung (Renovasi/Perluasan)</option>
                    <option value="SLF_PERPANJANGAN">SLF - Perpanjangan Sertifikat Laik Fungsi</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: DATA UMUM BANGUNAN GEDUNG */}
          {/* ========================================================================= */}
          <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase font-mono text-sm tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>DATA UMUM BANGUNAN GEDUNG</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyOwnerAddressToBuilding}
                  className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 border border-indigo-200 dark:border-indigo-800"
                >
                  ↳ Samakan Lokasi dengan Alamat Pemilik
                </button>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  BAGIAN 2 // SPESIFIKASI TEKNIS
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5">
              
              {/* Nama Bangunan Gedung */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Nama Bangunan Gedung
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="text"
                    required
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="Contoh: Pembangunan Gedung Ruko & Kantor Patriot Square / Rumah Tinggal 2 Lantai"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lokasi Bangunan Gedung (Jalan) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Lokasi Bangunan Gedung
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="text"
                    required
                    value={buildingStreetAddress}
                    onChange={(e) => setBuildingStreetAddress(e.target.value)}
                    placeholder="Nama jalan, nomor persil, blok, kawasan lokasi fisik bangunan"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Lokasi Bangunan: Desa/Kel, Kec, Kab */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <div className="sm:col-span-3 hidden sm:block"></div>
                <div className="sm:col-span-9 flex items-center gap-2 pl-0 sm:pl-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mb-1 font-bold">
                        <span>Desa/Kel.</span>
                        <span className="font-bold">:</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={buildingVillage}
                        onChange={(e) => setBuildingVillage(e.target.value)}
                        placeholder="Contoh: Sukagalih"
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mb-1 font-bold">
                        <span>Kec.</span>
                        <span className="font-bold">:</span>
                      </div>
                      <input
                        type="text"
                        required
                        list="districts-list-building"
                        value={buildingDistrict}
                        onChange={(e) => setBuildingDistrict(e.target.value)}
                        placeholder="Contoh: Tarogong Kidul"
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <datalist id="districts-list-building">
                        {GARUT_DISTRICTS.map(d => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 mb-1 font-bold">
                        <span>Kab.</span>
                        <span className="font-bold">:</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={buildingCity}
                        onChange={(e) => setBuildingCity(e.target.value)}
                        placeholder="Contoh: Garut"
                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fungsi Bangunan */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Fungsi Bangunan
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="text"
                    required
                    list="building-functions-list"
                    value={buildingFunction}
                    onChange={(e) => setBuildingFunction(e.target.value)}
                    placeholder="Ketik fungsi bangunan (e.g. Fungsi Hunian, Fungsi Usaha, Fungsi Keagamaan, Fungsi Sosial & Budaya, Fungsi Khusus, Fungsi Campuran)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <datalist id="building-functions-list">
                    <option value="Fungsi Hunian" />
                    <option value="Fungsi Usaha" />
                    <option value="Fungsi Keagamaan" />
                    <option value="Fungsi Sosial dan Budaya" />
                    <option value="Fungsi Khusus" />
                    <option value="Fungsi Campuran" />
                    <option value="HUNIAN" />
                    <option value="USAHA" />
                    <option value="KEAGAMAAN" />
                    <option value="SOSIAL_BUDAYA" />
                    <option value="KHUSUS" />
                    <option value="CAMPURAN" />
                  </datalist>
                </div>
              </div>

              {/* Sub Fungsi Bangunan */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Sub Fungsi Bangunan
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="text"
                    required
                    list="building-subfunctions-list"
                    value={subFunction}
                    onChange={(e) => setSubFunction(e.target.value)}
                    placeholder="Ketik sub fungsi bangunan (e.g. Rumah Tinggal Tunggal, Ruko/Pertokoan, Pabrik, Klinik, Masjid)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <datalist id="building-subfunctions-list">
                    <option value="Rumah Tinggal Tunggal" />
                    <option value="Rumah Tinggal Deret" />
                    <option value="Rumah Tinggal Susun / Apartemen" />
                    <option value="Rumah Tinggal Sementara (Kost/Asrama)" />
                    <option value="Rumah Singgah / Villa" />
                    <option value="Pertokoan / Ruko / Rukan" />
                    <option value="Perkantoran" />
                    <option value="Pasar Tradisional / Modern / Mall" />
                    <option value="Perhotelan / Penginapan / Resort" />
                    <option value="Restoran / Kafe / Rumah Makan" />
                    <option value="Gudang Penyimpanan & Logistik" />
                    <option value="Bengkel & Showroom Otomotif" />
                    <option value="Pabrik / Industri Manufaktur" />
                    <option value="Masjid Jami / Musholla" />
                    <option value="Gereja Kristen / Katolik" />
                    <option value="Pura" />
                    <option value="Vihara / Klenteng" />
                    <option value="Fasilitas Pendidikan (TK/SD/SMP/SMA/Kampus/Pesantren)" />
                    <option value="Fasilitas Kesehatan (Rumah Sakit/Klinik/Puskesmas/Apotek)" />
                    <option value="Gedung Pertemuan / Kesenian / Museum" />
                    <option value="Fasilitas Olahraga / GOR / Stadion" />
                    <option value="Stasiun Pengisian Bahan Bakar (SPBU / SPBE)" />
                    <option value="Hunian & Komersial (Mix-Use Ruko-Kost)" />
                  </datalist>
                </div>
              </div>

              {/* Jenis Bangunan Gedung */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Jenis Bangunan Gedung
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={buildingComplexity}
                      onChange={(e) => {
                        const comp = e.target.value as BuildingComplexity;
                        setBuildingComplexity(comp);
                        if (comp === 'SEDERHANA') setBuildingTypeDesc('Bangunan Gedung Sederhana');
                        else if (comp === 'TIDAK_SEDERHANA') setBuildingTypeDesc('Bangunan Gedung Tidak Sederhana');
                        else setBuildingTypeDesc('Bangunan Gedung Khusus');
                      }}
                      className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="SEDERHANA">SEDERHANA</option>
                      <option value="TIDAK_SEDERHANA">TIDAK SEDERHANA</option>
                      <option value="KHUSUS">KHUSUS</option>
                    </select>
                    <input
                      type="text"
                      value={buildingTypeDesc}
                      onChange={(e) => setBuildingTypeDesc(e.target.value)}
                      placeholder="Deskripsi jenis bangunan (e.g. Ruko Komersial 3 Lt Beton)"
                      className="sm:col-span-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Luas Bangunan Gedung */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Luas Bangunan Gedung
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2 flex items-center">
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={buildingArea}
                        onChange={(e) => setBuildingArea(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                        m²
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="px-2 py-2 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-500">
                        Lt. Tanah:
                      </span>
                      <input
                        type="number"
                        value={landArea}
                        onChange={(e) => setLandArea(Number(e.target.value))}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center">
                      <span className="px-2 py-2 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-500">
                        Jml Lt:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={floors}
                        onChange={(e) => {
                          const fl = Number(e.target.value);
                          setFloors(fl);
                          setHeight(fl * 3.5);
                        }}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nama Konsultan */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Nama Konsultan
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <input
                    type="text"
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                    placeholder="Nama Konsultan Perencana / Konsultan Pengawas / Pengkaji Teknis IPT / Arsitek Berlisensi"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Kepemilikan IMB/PBG Eksisting (Regulasi PP 16 & Retribusi) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="sm:col-span-3 font-mono font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                  Status IMB Eksisting
                </label>
                <div className="sm:col-span-9 flex items-center gap-2">
                  <span className="hidden sm:inline font-mono font-bold text-slate-400">:</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={existingImbStatus}
                      onChange={(e) => setExistingImbStatus(e.target.value as ExistingImbStatus)}
                      className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="BELUM_MEMILIKI_IMB_PBG">BELUM MEMILIKI IMB / PBG (Hitung Retribusi Penuh)</option>
                      <option value="SUDAH_MEMILIKI_IMB">SUDAH MEMILIKI IMB (Bebas Retribusi Luas Eksisting)</option>
                      <option value="SUDAH_MEMILIKI_PBG">SUDAH MEMILIKI PBG</option>
                      <option value="BEBAS_RETRIBUSI_KEAGAMAAN">BEBAS RETRIBUSI (Fungsi Keagamaan/Sosial)</option>
                    </select>
                    
                    {(existingImbStatus === 'SUDAH_MEMILIKI_IMB' || existingImbStatus === 'SUDAH_MEMILIKI_PBG') && (
                      <input
                        type="text"
                        value={existingImbNumber}
                        onChange={(e) => setExistingImbNumber(e.target.value)}
                        placeholder="Nomor IMB/PBG Terdahulu (e.g. 503.640/IMB-...)"
                        className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Format isian sesuai sistem SIMBG & Peraturan Pemerintah No. 16 Tahun 2021.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs uppercase"
              >
                Batal
              </button>
              
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan & Daftarkan Permohonan</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
