import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  UserCheck, 
  LogOut, 
  Plus, 
  Edit3, 
  Eye, 
  Lock, 
  Smartphone, 
  Mail, 
  Briefcase, 
  ShieldAlert,
  X,
  Layers,
  Database,
  ArrowRight
} from 'lucide-react';
import { UserAccount, UserRole, RolePermissions } from '../types';
import { 
  getStoredUserAccounts, 
  saveStoredUserAccounts, 
  getActiveUser, 
  setActiveUser, 
  ROLE_PERMISSIONS 
} from '../lib/accountEngine';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserChanged: (newUser: UserAccount) => void;
  onOpenDatabaseManager?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onOpenDatabaseManager
}) => {
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUserAccounts());
  const [activeTab, setActiveTab] = useState<'SWITCH' | 'PROFILE' | 'ROLES_INFO' | 'ADD_USER'>('SWITCH');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserAccount>(currentUser);
  
  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('OPERATOR_SIMBG');
  const [newPosition, setNewPosition] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectUser = (user: UserAccount) => {
    const updated = setActiveUser(user.id);
    onUserChanged(updated);
    setSelectedUserForDetail(updated);
    setFormSuccess(`Berhasil beralih akun ke: ${user.name} (${user.role})`);
    setTimeout(() => setFormSuccess(null), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName || !newEmail) return;

    const newUser: UserAccount = {
      id: `usr-custom-${Date.now()}`,
      username: newUsername.toLowerCase().trim(),
      name: newName.trim(),
      email: newEmail.trim(),
      nip: newNip.trim() || undefined,
      role: newRole,
      positionTitle: newPosition.trim() || `Petugas ${newRole}`,
      subSpecialty: newSpecialty.trim() || undefined,
      phone: newPhone.trim() || undefined,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
      isActive: true,
      permissions: ROLE_PERMISSIONS[newRole],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const updatedList = [...users, newUser];
    setUsers(updatedList);
    saveStoredUserAccounts(updatedList);
    
    // Switch to new user
    handleSelectUser(newUser);
    setActiveTab('SWITCH');
    setFormSuccess(`Akun baru ${newUser.name} berhasil dibuat dan diaktifkan!`);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-[10px] px-2 py-0.5 font-mono font-bold">SUPER_ADMIN</span>;
      case 'OPERATOR_SIMBG':
        return <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 text-[10px] px-2 py-0.5 font-mono font-bold">OPERATOR_SIMBG</span>;
      case 'TPA_TPT':
        return <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] px-2 py-0.5 font-mono font-bold">TPA / TPT AHLI</span>;
      case 'PIMPINAN':
        return <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[10px] px-2 py-0.5 font-mono font-bold">PIMPINAN DPUPR</span>;
      case 'AUDITOR':
        return <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10px] px-2 py-0.5 font-mono font-bold">AUDITOR / INSPEKTORAT</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 font-mono font-bold">{role}</span>;
    }
  };

  const permissionLabels: Record<keyof RolePermissions, string> = {
    canVerifyDocuments: 'Verifikasi Dokumen Teknis & Administrasi',
    canConductVisite: 'Surat Undangan & Berita Acara Visite Lapangan (SLF)',
    canScheduleSidang: 'Alokasi Jadwal Sidang TPA & Presensi QR',
    canInputBAKonsultasi: 'Input & Evaluasi Berita Acara Konsultasi Teknis',
    canApproveBAPleno: 'Pengesahan BA Sidang Pleno / Rekomtek PBG',
    canCalculateRetribution: 'Hitung & Validasi Retribusi PP 16/2021',
    canIssueSKRD: 'Penerbitan & Penetapan SKRD Retribusi Daerah',
    canSendWhatsApp: 'Kirim Notifikasi Otomatis WhatsApp Pemohon',
    canArchiveApplications: 'Pengarsipan Berkas Permohonan Selesai',
    canManageUsers: 'Kelola Akun & Penugasan Operator / ASN',
    canConfigureSystem: 'Konfigurasi Sistem, WhatsApp & Database Supabase',
    canExportAuditLogs: 'Akses Log Audit Kepatuhan & Export Data'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 flex items-center justify-center text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight">
                  MANAJEMEN AKUN & ROLE PEGAWAI
                </h2>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 font-mono font-bold">
                  DPUPR GARUT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Otorisasi peran ASN, akses modul, dan profil pengguna aktif sistem SIMBG.
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 sm:px-6 overflow-x-auto text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('SWITCH')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition ${
              activeTab === 'SWITCH'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Daftar Akun & Beralih ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition ${
              activeTab === 'PROFILE'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Hak Akses & Otorisasi
          </button>
          <button
            onClick={() => setActiveTab('ADD_USER')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition ${
              activeTab === 'ADD_USER'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            + Tambah Akun Pegawai
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Notification Feedback */}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* TAB 1: SWITCH USER */}
          {activeTab === 'SWITCH' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    PILIH AKUN LOGIN AKTIF
                  </h3>
                  <p className="text-xs text-slate-500">
                    Klik pada salah satu akun untuk beralih sesi secara instan sesuai peran operasional.
                  </p>
                </div>

                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 font-mono">
                  Sesi Aktif: <span className="font-bold">{currentUser.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map((user) => {
                  const isCurrent = currentUser.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`p-4 border transition cursor-pointer relative flex flex-col justify-between ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      {isCurrent && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          LOGIN AKTIF
                        </span>
                      )}

                      <div className="flex items-start gap-3">
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                          alt={user.name}
                          className="w-12 h-12 object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {user.name}
                            </span>
                          </div>
                          <div className="mt-1">
                            {getRoleBadge(user.role)}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-sans">
                            {user.positionTitle}
                          </p>
                          {user.nip && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              NIP. {user.nip}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>@{user.username}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                          {isCurrent ? 'Sesi Aktif' : 'Beralih Akun →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & PERMISSIONS MATRIX */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-5">
              
              {/* Profile Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-16 h-16 object-cover border-2 border-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {currentUser.name}
                      </h4>
                      {getRoleBadge(currentUser.role)}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {currentUser.positionTitle}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                      <span>NIP: {currentUser.nip || '-'}</span>
                      <span>Email: {currentUser.email}</span>
                      <span>Telp: {currentUser.phone || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Matriks Otorisasi & Hak Akses Berdasarkan Role ({currentUser.role})</span>
                </h4>
                
                <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {Object.entries(permissionLabels).map(([key, label]) => {
                    const isAllowed = currentUser.role === 'SUPER_ADMIN' || Boolean(currentUser.permissions[key as keyof RolePermissions]);
                    return (
                      <div key={key} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                          <span className="text-slate-800 dark:text-slate-200">{label}</span>
                        </div>
                        <div>
                          {isAllowed ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5">
                              DIIZINKAN (ALLOWED)
                            </span>
                          ) : (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-mono font-bold px-2 py-0.5">
                              TERBATAS (RESTRICTED)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: ADD USER */}
          {activeTab === 'ADD_USER' && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 font-mono">
                Pendaftaran akun baru ASN DPUPR / TPA / Tim Verifikator untuk penugasan operasional SIMBG.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Username / ID Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. operator.dedi"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dedi Supriadi, S.T."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Email Dinas / Aktif *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="dedi.supriadi@garutkab.go.id"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    placeholder="19920815 201903 1 007"
                    value={newNip}
                    onChange={(e) => setNewNip(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Peran / Role Pengguna *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="OPERATOR_SIMBG">Operator SIMBG (Verifikasi & Jadwal)</option>
                    <option value="TPA_TPT">Tim Profesi Ahli (TPA) / TPT</option>
                    <option value="PIMPINAN">Pimpinan DPUPR / Kadis / Kabid</option>
                    <option value="AUDITOR">Auditor / Inspektorat Daerah</option>
                    <option value="SUPER_ADMIN">Super Administrator Sistem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Jabatan Struktural / Fungsional
                  </label>
                  <input
                    type="text"
                    placeholder="Penata Bangunan Gedung Muda"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Sub-Keahlian / Bidang
                  </label>
                  <input
                    type="text"
                    placeholder="Struktur & Geoteknik"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('SWITCH')}
                  className="px-4 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-bold uppercase tracking-wider"
                >
                  Simpan & Daftarkan Akun
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-slate-500">
            Terhubung ke Database & RBAC Policy Engine DPUPR Garut
          </div>
          
          <div className="flex items-center gap-2">
            {onOpenDatabaseManager && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDatabaseManager();
                }}
                className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold flex items-center gap-1.5 transition"
              >
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span>Supabase Database Hub</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold uppercase"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
