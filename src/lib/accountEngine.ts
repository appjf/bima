import { UserRole, UserAccount, RolePermissions, MainNavTab } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: {
    canVerifyDocuments: true,
    canConductVisite: true,
    canScheduleSidang: true,
    canInputBAKonsultasi: true,
    canApproveBAPleno: true,
    canCalculateRetribution: true,
    canIssueSKRD: true,
    canSendWhatsApp: true,
    canArchiveApplications: true,
    canManageUsers: true,
    canConfigureSystem: true,
    canExportAuditLogs: true,
  },
  OPERATOR_SIMBG: {
    canVerifyDocuments: true,
    canConductVisite: true,
    canScheduleSidang: true,
    canInputBAKonsultasi: true,
    canApproveBAPleno: false,
    canCalculateRetribution: true,
    canIssueSKRD: true,
    canSendWhatsApp: true,
    canArchiveApplications: true,
    canManageUsers: false,
    canConfigureSystem: false,
    canExportAuditLogs: false,
  },
  TPA_TPT: {
    canVerifyDocuments: true,
    canConductVisite: true,
    canScheduleSidang: false,
    canInputBAKonsultasi: true,
    canApproveBAPleno: true,
    canCalculateRetribution: false,
    canIssueSKRD: false,
    canSendWhatsApp: false,
    canArchiveApplications: false,
    canManageUsers: false,
    canConfigureSystem: false,
    canExportAuditLogs: false,
  },
  PIMPINAN: {
    canVerifyDocuments: false,
    canConductVisite: false,
    canScheduleSidang: false,
    canInputBAKonsultasi: false,
    canApproveBAPleno: true,
    canCalculateRetribution: false,
    canIssueSKRD: true,
    canSendWhatsApp: false,
    canArchiveApplications: true,
    canManageUsers: true,
    canConfigureSystem: false,
    canExportAuditLogs: true,
  },
  AUDITOR: {
    canVerifyDocuments: false,
    canConductVisite: false,
    canScheduleSidang: false,
    canInputBAKonsultasi: false,
    canApproveBAPleno: false,
    canCalculateRetribution: false,
    canIssueSKRD: false,
    canSendWhatsApp: false,
    canArchiveApplications: false,
    canManageUsers: false,
    canConfigureSystem: false,
    canExportAuditLogs: true,
  }
};

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-admin-1',
    username: 'superadmin',
    name: 'Administrator Utama SIMBG',
    email: 'admin.simbg@garutkab.go.id',
    nip: '19850101 200801 1 001',
    role: 'SUPER_ADMIN',
    positionTitle: 'Kepala Seksi Tata Kelola Bangunan & Sistem',
    subSpecialty: 'Sistem Integrasi & Keamanan Data',
    phone: '081223344001',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isActive: true,
    permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-08-20T08:00:00Z'
  },
  {
    id: 'usr-op-1',
    username: 'operator.irwan',
    name: 'H. Irwan Kurnia, S.ST',
    email: 'irwan.kurnia@garutkab.go.id',
    nip: '19880512 201101 1 003',
    role: 'OPERATOR_SIMBG',
    positionTitle: 'Operator Verifikasi Teknis Utama SIMBG',
    subSpecialty: 'Verifikasi Dokumen & Presensi QR',
    phone: '081223344551',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    isActive: true,
    permissions: ROLE_PERMISSIONS.OPERATOR_SIMBG,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-08-20T07:30:00Z'
  },
  {
    id: 'usr-op-2',
    username: 'operator.rina',
    name: 'Rina Andriani, A.Md',
    email: 'rina.andriani@garutkab.go.id',
    nip: '19910418 201503 2 004',
    role: 'OPERATOR_SIMBG',
    positionTitle: 'Operator Verifikasi Administrasi & Notifikasi WA',
    subSpecialty: 'Kelengkapan Dokumen Tanah & Umum',
    phone: '081223344552',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    isActive: true,
    permissions: ROLE_PERMISSIONS.OPERATOR_SIMBG,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-08-19T14:15:00Z'
  },
  {
    id: 'usr-tpa-1',
    username: 'tpa.ahmad',
    name: 'Dr. Ir. H. Ahmad Sanusi, M.T., IAP',
    email: 'ahmad.sanusi@tpa.garutkab.go.id',
    nip: '19700315 199803 1 002',
    role: 'TPA_TPT',
    positionTitle: 'Ketua Tim Profesi Ahli (TPA)',
    subSpecialty: 'Arsitektur & Tata Ruang Perkotaan',
    phone: '081334455661',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    isActive: true,
    permissions: ROLE_PERMISSIONS.TPA_TPT,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-08-20T08:15:00Z'
  },
  {
    id: 'usr-kadis-1',
    username: 'pimpinan.kadis',
    name: 'Ir. Agus Ismail, S.T., M.T.',
    email: 'kadin.dpupr@garutkab.go.id',
    nip: '19720614 199803 1 004',
    role: 'PIMPINAN',
    positionTitle: 'Kepala Dinas PUPR Kabupaten Garut',
    subSpecialty: 'Pengesahan Rekomtek & Otorisasi SKRD',
    phone: '081122339900',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    isActive: true,
    permissions: ROLE_PERMISSIONS.PIMPINAN,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-08-18T10:00:00Z'
  },
  {
    id: 'usr-audit-1',
    username: 'auditor.inspektorat',
    name: 'Drs. H. Maman Suryaman, M.Si, CGCAE',
    email: 'auditor.inspektorat@garutkab.go.id',
    nip: '19691120 199403 1 003',
    role: 'AUDITOR',
    positionTitle: 'Auditor Utama Inspektorat Daerah Garut',
    subSpecialty: 'Audit Kepatuhan SLA & Akuntabilitas Retribusi PAD',
    phone: '081233445599',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    isActive: true,
    permissions: ROLE_PERMISSIONS.AUDITOR,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-08-19T11:20:00Z'
  }
];

const STORAGE_KEY_USERS = 'simbg_garut_user_accounts_v1';
const STORAGE_KEY_ACTIVE_USER = 'simbg_garut_active_user_id_v1';

export function getStoredUserAccounts(): UserAccount[] {
  if (typeof window === 'undefined') return INITIAL_USER_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USER_ACCOUNTS));
      return INITIAL_USER_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load user accounts from storage', err);
    return INITIAL_USER_ACCOUNTS;
  }
}

export function saveStoredUserAccounts(accounts: UserAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save user accounts to storage', err);
  }
}

export function getActiveUser(): UserAccount {
  const accounts = getStoredUserAccounts();
  if (typeof window === 'undefined') return accounts[1] || accounts[0];
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (activeId) {
      const found = accounts.find(a => a.id === activeId);
      if (found) return found;
    }
    // Default to Operator Irwan Kurnia
    const defaultUser = accounts.find(a => a.username === 'operator.irwan') || accounts[0];
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, defaultUser.id);
    return defaultUser;
  } catch {
    return accounts[0];
  }
}

export function setActiveUser(userId: string): UserAccount {
  const accounts = getStoredUserAccounts();
  const matched = accounts.find(a => a.id === userId) || accounts[0];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, matched.id);
  }
  return matched;
}

export function switchUserRole(role: UserRole): UserAccount {
  const accounts = getStoredUserAccounts();
  const matched = accounts.find(a => a.role === role && a.isActive) || accounts[0];
  setActiveUser(matched.id);
  return matched;
}

export function hasPermission(user: UserAccount, permission: keyof RolePermissions): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return !!user.permissions[permission];
}

export function updateUserAccount(updated: UserAccount): UserAccount[] {
  const accounts = getStoredUserAccounts();
  const index = accounts.findIndex(a => a.id === updated.id);
  if (index !== -1) {
    accounts[index] = { ...updated, permissions: ROLE_PERMISSIONS[updated.role] || updated.permissions };
  } else {
    accounts.push(updated);
  }
  saveStoredUserAccounts(accounts);
  return accounts;
}

const ALLOWED_TABS: Record<UserRole, MainNavTab[]> = {
  SUPER_ADMIN: [
    'DASHBOARD', 'PIPELINE', 'APPLICATIONS', 'VISITE_LAPANGAN', 'VERIFICATION', 
    'SCHEDULING', 'RETRIBUTION', 'MONITORING_PAD', 'NOTIFICATIONS', 'DATA_QUALITY', 'SETTINGS'
  ],
  OPERATOR_SIMBG: [
    'DASHBOARD', 'PIPELINE', 'APPLICATIONS', 'VISITE_LAPANGAN', 'VERIFICATION', 
    'SCHEDULING', 'RETRIBUTION', 'NOTIFICATIONS'
  ],
  TPA_TPT: [
    'DASHBOARD', 'PIPELINE', 'APPLICATIONS', 'VISITE_LAPANGAN', 'VERIFICATION', 'SCHEDULING'
  ],
  PIMPINAN: [
    'DASHBOARD', 'PIPELINE', 'APPLICATIONS', 'MONITORING_PAD'
  ],
  AUDITOR: [
    'DASHBOARD', 'PIPELINE', 'APPLICATIONS', 'MONITORING_PAD'
  ]
};

export function getAllowedTabsForRole(role: UserRole): MainNavTab[] {
  return ALLOWED_TABS[role] || ALLOWED_TABS.OPERATOR_SIMBG;
}

export function isTabAllowedForRole(tab: MainNavTab, role: UserRole): boolean {
  const allowed = getAllowedTabsForRole(role);
  return allowed.includes(tab);
}
