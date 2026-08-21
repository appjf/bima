import { ASNPersonnel, ASNRoleCategory } from '../types';
import { generateSignatureQrPayload } from './signatureEngine';

const STORAGE_KEY = 'simbg_garut_asn_personnel_v1';

// Seed initial ASN personnel according to official Garut allocation
const INITIAL_ASN_PERSONNEL: ASNPersonnel[] = [
  // OPERATOR (4 Orang)
  {
    id: 'asn-op-1',
    nip: '19880512 201101 1 003',
    name: 'H. Irwan Kurnia, S.ST',
    roleCategory: 'OPERATOR',
    positionTitle: 'Operator Teknis Utama SIMBG',
    subSpecialty: 'Verifikasi & Presensi',
    phone: '081223344551',
    email: 'irwan.kurnia@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asn-op-2',
    nip: '19910418 201503 2 004',
    name: 'Rina Andriani, A.Md',
    roleCategory: 'OPERATOR',
    positionTitle: 'Operator Verifikasi Administrasi',
    subSpecialty: 'Dokumen Kelengkapan',
    phone: '081223344552',
    email: 'rina.andriani@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asn-op-3',
    nip: '19930722 201801 1 005',
    name: 'Agus Prasetyo, S.ST',
    roleCategory: 'OPERATOR',
    positionTitle: 'Operator Verifikasi Dokumen Teknis',
    subSpecialty: 'Arsitektur & Struktur',
    phone: '081223344553',
    email: 'agus.prasetyo@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asn-op-4',
    nip: '19951105 202012 2 008',
    name: 'Dian Purnama, A.Md.T',
    roleCategory: 'OPERATOR',
    positionTitle: 'Operator Penjadwalan Sidang & Helpdesk',
    subSpecialty: 'Layanan Publik SIMBG',
    phone: '081223344554',
    email: 'dian.purnama@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },

  // TPA (5 Orang)
  {
    id: 'asn-tpa-1',
    nip: '19700315 199803 1 002',
    name: 'Dr. Ir. H. Ahmad Sanusi, M.T., IAP',
    roleCategory: 'TPA',
    positionTitle: 'Ketua Tim Profesi Ahli (TPA)',
    subSpecialty: 'Arsitektur & Tata Ruang',
    phone: '081334455661',
    email: 'ahmad.sanusi@tpa.garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asn-tpa-2',
    nip: '19740820 200212 1 003',
    name: 'Ir. Hendra Wijaya, M.T., IPU',
    roleCategory: 'TPA',
    positionTitle: 'Anggota TPA Bidang Struktur',
    subSpecialty: 'Struktur & Geoteknik',
    phone: '081334455662',
    email: 'hendra.wijaya@tpa.garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asn-tpa-3',
    nip: '19780110 200501 1 006',
    name: 'Dr. Eng. Bambang Sugiarto, S.T., M.T.',
    roleCategory: 'TPA',
    positionTitle: 'Anggota TPA Bidang MEP',
    subSpecialty: 'Mekanikal, Elektrikal & Plambing',
    phone: '081334455663',
    email: 'bambang.sugiarto@tpa.garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asn-tpa-4',
    nip: '19810914 200902 2 004',
    name: 'Ar. Siti Nurhaliza, S.T., IAI',
    roleCategory: 'TPA',
    positionTitle: 'Anggota TPA Bidang Arsitektur',
    subSpecialty: 'Desain & Proteksi Kebakaran',
    phone: '081334455664',
    email: 'siti.nurhaliza@tpa.garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'asn-tpa-5',
    nip: '19830502 201001 1 007',
    name: 'Dr. Ir. Yudi Kurniawan, M.Sc.',
    roleCategory: 'TPA',
    positionTitle: 'Anggota TPA Bidang Lingkungan',
    subSpecialty: 'AAMD & Tata Graha',
    phone: '081334455665',
    email: 'yudi.kurniawan@tpa.garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },

  // TPT (1 Orang)
  {
    id: 'asn-tpt-1',
    nip: '19800612 200604 1 008',
    name: 'Yayan Supriatna, S.T., M.Si.',
    roleCategory: 'TPT',
    positionTitle: 'Ketua Tim Teknis SIMBG (TPT)',
    subSpecialty: 'Pemeriksaan Bangunan Sederhana',
    phone: '081445566771',
    email: 'yayan.supriatna@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },

  // PENGAWAS (1 Orang)
  {
    id: 'asn-pengawas-1',
    nip: '19820315 200801 1 009',
    name: 'Dedi Kurniawan, S.ST, MT',
    roleCategory: 'PENGAWAS',
    positionTitle: 'Pengawas Perhitungan Retribusi SIMBG',
    subSpecialty: 'Pengawasan Retribusi Daerah',
    phone: '081556677881',
    email: 'dedi.kurniawan@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },

  // BENDAHARA (1 Orang)
  {
    id: 'asn-bendahara-1',
    nip: '19860322 201001 2 005',
    name: 'Hj. Fitriani, S.E., M.Ak.',
    roleCategory: 'BENDAHARA',
    positionTitle: 'Bendahara Penerimaan DPUPR Kabupaten Garut',
    subSpecialty: 'Verifikasi Setoran Kas Daerah Bank bjb & Penerbitan STS',
    phone: '081223344888',
    email: 'bendahara.penerimaan@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },

  // KABID (1 Orang)
  {
    id: 'asn-kabid-1',
    nip: '19780512 200501 1 008',
    name: 'Juju Eka Utama, S.T., M.T.',
    roleCategory: 'KABID',
    positionTitle: 'Kepala Bidang Bangunan Gedung',
    subSpecialty: 'Dinas PUPR Kabupaten Garut',
    phone: '081667788991',
    email: 'juju.ekautama@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  },

  // KADIN (1 Orang)
  {
    id: 'asn-kadin-1',
    nip: '19680412 199303 1 003',
    name: 'Drs. H. Eko Yulianto, M.Si.',
    roleCategory: 'KADIN',
    positionTitle: 'Kepala Dinas Pekerjaan Umum & Penataan Ruang',
    subSpecialty: 'Pemerintah Kabupaten Garut',
    phone: '081778899001',
    email: 'eko.yulianto@garutkab.go.id',
    isActive: true,
    updatedAt: new Date().toISOString()
  }
];

// Initialize default QR codes
INITIAL_ASN_PERSONNEL.forEach(p => {
  const roleMap = (p.roleCategory === 'KADIN' || p.roleCategory === 'KABID') ? 'KABID' : (p.roleCategory === 'PENGAWAS' ? 'PENGAWAS' : 'OPERATOR');
  p.qrCodeUrl = generateSignatureQrPayload({
    role: roleMap,
    name: p.name,
    nip: p.nip,
    updatedAt: p.updatedAt
  });
});

export const getASNPersonnelList = (): ASNPersonnel[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASN_PERSONNEL));
      return INITIAL_ASN_PERSONNEL;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ASN_PERSONNEL));
      return INITIAL_ASN_PERSONNEL;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading ASN Personnel list from localStorage:', err);
    return INITIAL_ASN_PERSONNEL;
  }
};

export const saveASNPersonnelList = (list: ASNPersonnel[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving ASN Personnel list to localStorage:', err);
  }
};

export const getASNPersonnelByRole = (role: ASNRoleCategory): ASNPersonnel[] => {
  const list = getASNPersonnelList();
  return list.filter(p => p.roleCategory === role && p.isActive);
};

export const addASNPersonnel = (personnel: Omit<ASNPersonnel, 'id' | 'updatedAt'>): ASNPersonnel => {
  const list = getASNPersonnelList();
  const id = `asn-${personnel.roleCategory.toLowerCase()}-${Date.now()}`;
  const updatedAt = new Date().toISOString();
  
  const roleMap = (personnel.roleCategory === 'KADIN' || personnel.roleCategory === 'KABID') ? 'KABID' : (personnel.roleCategory === 'PENGAWAS' ? 'PENGAWAS' : 'OPERATOR');
  const qrCodeUrl = generateSignatureQrPayload({
    role: roleMap,
    name: personnel.name,
    nip: personnel.nip,
    updatedAt
  });

  const newPerson: ASNPersonnel = {
    ...personnel,
    id,
    qrCodeUrl: personnel.qrCodeUrl || qrCodeUrl,
    updatedAt
  };

  const updatedList = [newPerson, ...list];
  saveASNPersonnelList(updatedList);
  return newPerson;
};

export const updateASNPersonnel = (id: string, updated: Partial<ASNPersonnel>): ASNPersonnel[] => {
  const list = getASNPersonnelList();
  const index = list.findIndex(p => p.id === id);
  if (index === -1) return list;

  const current = list[index];
  const updatedAt = new Date().toISOString();
  const merged: ASNPersonnel = {
    ...current,
    ...updated,
    updatedAt
  };

  // Re-generate QR Code if name or NIP changed
  if (updated.name || updated.nip || updated.roleCategory) {
    const roleMap = (merged.roleCategory === 'KADIN' || merged.roleCategory === 'KABID') ? 'KABID' : (merged.roleCategory === 'PENGAWAS' ? 'PENGAWAS' : 'OPERATOR');
    merged.qrCodeUrl = generateSignatureQrPayload({
      role: roleMap,
      name: merged.name,
      nip: merged.nip,
      updatedAt
    });
  }

  list[index] = merged;
  saveASNPersonnelList(list);
  return list;
};

export const deleteASNPersonnel = (id: string): ASNPersonnel[] => {
  const list = getASNPersonnelList();
  const filtered = list.filter(p => p.id !== id);
  saveASNPersonnelList(filtered);
  return filtered;
};

export const resetASNPersonnelToDefault = (): ASNPersonnel[] => {
  saveASNPersonnelList(INITIAL_ASN_PERSONNEL);
  return INITIAL_ASN_PERSONNEL;
};
