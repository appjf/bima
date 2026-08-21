import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  QrCode, 
  PenTool,
  Phone,
  Mail,
  Award,
  AlertTriangle,
  X
} from 'lucide-react';
import { ASNPersonnel, ASNRoleCategory } from '../types';
import { 
  getASNPersonnelList, 
  addASNPersonnel, 
  updateASNPersonnel, 
  deleteASNPersonnel, 
  resetASNPersonnelToDefault 
} from '../lib/asnPersonnelEngine';

const ROLE_CONFIG: Record<ASNRoleCategory, { label: string; targetCount: number; badgeColor: string; description: string }> = {
  OPERATOR: {
    label: 'Operator SIMBG',
    targetCount: 4,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
    description: 'Operator Teknis verifikasi berkas & presensi'
  },
  TPA: {
    label: 'Tim Profesi Ahli (TPA)',
    targetCount: 5,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
    description: 'Tim Ahli Bangunan Gedung (Arsitektur, Struktur, MEP, Dll)'
  },
  TPT: {
    label: 'Tim Teknis (TPT)',
    targetCount: 1,
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
    description: 'Tim Teknis SIMBG Bangunan Gedung Sederhana'
  },
  PENGAWAS: {
    label: 'Pengawas SIMBG',
    targetCount: 1,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    description: 'Pengawas perhitungan retribusi daerah'
  },
  KABID: {
    label: 'Kepala Bidang Bangunan',
    targetCount: 1,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Penandatangan SKRD & Rekomendasi Teknis'
  },
  KADIN: {
    label: 'Kepala Dinas PUPR',
    targetCount: 1,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
    description: 'Pengarah & Pengesah Dokumen Perizinan'
  }
};

export const ASNPersonnelSettings: React.FC = () => {
  const [personnelList, setPersonnelList] = useState<ASNPersonnel[]>(() => getASNPersonnelList());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<ASNRoleCategory | 'ALL'>('ALL');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<ASNPersonnel | null>(null);
  
  // Form Fields
  const [formName, setFormName] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formRole, setFormRole] = useState<ASNRoleCategory>('OPERATOR');
  const [formPositionTitle, setFormPositionTitle] = useState('');
  const [formSubSpecialty, setFormSubSpecialty] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // View QR Modal
  const [viewingQrPerson, setViewingQrPerson] = useState<ASNPersonnel | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingPerson(null);
    setFormName('');
    setFormNip('');
    setFormRole('OPERATOR');
    setFormPositionTitle('Operator Teknis SIMBG');
    setFormSubSpecialty('Verifikasi Administrasi');
    setFormPhone('');
    setFormEmail('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: ASNPersonnel) => {
    setEditingPerson(p);
    setFormName(p.name);
    setFormNip(p.nip);
    setFormRole(p.roleCategory);
    setFormPositionTitle(p.positionTitle);
    setFormSubSpecialty(p.subSpecialty || '');
    setFormPhone(p.phone || '');
    setFormEmail(p.email || '');
    setFormIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSavePerson = () => {
    if (!formName.trim() || !formNip.trim()) {
      alert('Nama Lengkap dan NIP Wajib Diisi!');
      return;
    }

    if (editingPerson) {
      const updated = updateASNPersonnel(editingPerson.id, {
        name: formName.trim(),
        nip: formNip.trim(),
        roleCategory: formRole,
        positionTitle: formPositionTitle.trim(),
        subSpecialty: formSubSpecialty.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        isActive: formIsActive
      });
      setPersonnelList(updated);
      showFeedback(`Data ASN ${formName} berhasil diperbarui.`);
    } else {
      addASNPersonnel({
        name: formName.trim(),
        nip: formNip.trim(),
        roleCategory: formRole,
        positionTitle: formPositionTitle.trim(),
        subSpecialty: formSubSpecialty.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        isActive: formIsActive
      });
      setPersonnelList(getASNPersonnelList());
      showFeedback(`Personil ASN baru ${formName} berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (p: ASNPersonnel) => {
    const updated = updateASNPersonnel(p.id, { isActive: !p.isActive });
    setPersonnelList(updated);
    showFeedback(`Status ASN ${p.name} diubah menjadi ${!p.isActive ? 'Aktif' : 'Non-Aktif'}.`);
  };

  const handleDeletePerson = (p: ASNPersonnel) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data ASN ${p.name}?`)) {
      const updated = deleteASNPersonnel(p.id);
      setPersonnelList(updated);
      showFeedback(`Data ASN ${p.name} berhasil dihapus.`);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Reset ulang data personil ke alokasi resmi Pemkab Garut (4 Operator, 5 TPA, 1 TPT, 1 Pengawas, 1 Kabid, 1 Kadin)?')) {
      const res = resetASNPersonnelToDefault();
      setPersonnelList(res);
      showFeedback('Data personil ASN berhasil di-reset ke alokasi resmi Garut.');
    }
  };

  // Filter Personnel
  const filteredPersonnel = personnelList.filter(p => {
    const matchesRole = selectedRoleFilter === 'ALL' || p.roleCategory === selectedRoleFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !searchQuery || 
      p.name.toLowerCase().includes(q) || 
      p.nip.toLowerCase().includes(q) || 
      p.positionTitle.toLowerCase().includes(q) ||
      (p.subSpecialty && p.subSpecialty.toLowerCase().includes(q));
    return matchesRole && matchesQuery;
  });

  // Calculate count stats per role
  const getRoleCount = (role: ASNRoleCategory) => {
    return personnelList.filter(p => p.roleCategory === role && p.isActive).length;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Notice */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 font-mono space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>PENGATURAN IDENTITAS KEPEGAWAIAN ASN DPUPR KABUPATEN GARUT</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-bold">
            ⚡ LOKAL PERSISTENT (PRE-SUPABASE FULL INTEGRATION)
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
          Kelola data identitas pejabat dan pelaksana kepegawaian ASN SIMBG untuk verifikasi dokumen, presensi sidang, hingga penerbitan SKRD. Alokasi resmi terdiri dari: <strong>4 Operator</strong>, <strong>5 TPA</strong>, <strong>1 TPT</strong>, <strong>1 Pengawas SIMBG</strong>, <strong>1 Kepala Bidang</strong>, dan <strong>1 Kepala Dinas</strong>.
        </p>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-2 text-xs font-mono font-bold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
        </div>
      )}

      {/* Stats Cards: Allocation Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(ROLE_CONFIG) as ASNRoleCategory[]).map(roleKey => {
          const cfg = ROLE_CONFIG[roleKey];
          const currentCount = getRoleCount(roleKey);
          const isTargetMet = currentCount === cfg.targetCount;

          return (
            <button
              key={roleKey}
              onClick={() => setSelectedRoleFilter(selectedRoleFilter === roleKey ? 'ALL' : roleKey)}
              className={`p-3 text-left border transition flex flex-col justify-between ${
                selectedRoleFilter === roleKey 
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div>
                <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 border ${cfg.badgeColor}`}>
                  {roleKey}
                </span>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                  {cfg.label}
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5">
                <span className="text-[10px] text-slate-500 font-mono">Alokasi:</span>
                <div className="font-mono text-xs font-extrabold flex items-center gap-1">
                  <span className={isTargetMet ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {currentCount}
                  </span>
                  <span className="text-slate-400">/ {cfg.targetCount} Org</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 font-mono">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Lengkap, NIP, atau Sub-Spesialisasi ASN..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-sans text-slate-900 dark:text-white"
            />
          </div>

          {/* Role Filter Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase whitespace-nowrap border ${
                selectedRoleFilter === 'ALL'
                  ? 'bg-indigo-900 text-white border-indigo-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              Semua ({personnelList.length})
            </button>
            {(Object.keys(ROLE_CONFIG) as ASNRoleCategory[]).map(r => (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase whitespace-nowrap border ${
                  selectedRoleFilter === r
                    ? 'bg-indigo-900 text-white border-indigo-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {r} ({personnelList.filter(p => p.roleCategory === r).length})
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase flex items-center gap-1.5 transition"
              title="Reset ke alokasi awal resmi Garut"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Alokasi</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase flex items-center gap-1.5 transition shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Personil ASN</span>
            </button>
          </div>
        </div>
      </div>

      {/* ASN Personnel List: Desktop Table & Mobile Card View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-3">Nama Lengkap & NIP</th>
                <th className="p-3">Peran KedINASAN</th>
                <th className="p-3">Jabatan & Sub-Spesialisasi</th>
                <th className="p-3">Kontak</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">QR Verifikasi</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                    Tidak ditemukan personil ASN yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map(person => {
                  const roleCfg = ROLE_CONFIG[person.roleCategory];
                  return (
                    <tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      
                      {/* Name & NIP */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white font-sans text-xs">
                          {person.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          NIP. {person.nip}
                        </div>
                      </td>

                      {/* Role Category */}
                      <td className="p-3">
                        <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 border ${roleCfg.badgeColor}`}>
                          {person.roleCategory} - {roleCfg.label}
                        </span>
                      </td>

                      {/* Position & Sub-Specialty */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {person.positionTitle}
                        </div>
                        {person.subSpecialty && (
                          <div className="text-[10px] text-slate-500 italic">
                            Sub-Spesialisasi: {person.subSpecialty}
                          </div>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="p-3 font-mono text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5">
                        {person.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{person.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleActive(person)}
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold border transition ${
                            person.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {person.isActive ? '● AKTIF' : '○ NON-AKTIF'}
                        </button>
                      </td>

                      {/* QR Code Status */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingQrPerson(person)}
                          className="p-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition inline-flex items-center gap-1 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                          title="Lihat QR Code Verifikasi TTE"
                        >
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Lihat QR</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(person)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                            title="Edit Data ASN"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePerson(person)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                            title="Hapus Data ASN"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (for responsive layout) */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredPersonnel.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs">
              Tidak ditemukan personil ASN yang sesuai dengan filter.
            </div>
          ) : (
            filteredPersonnel.map(person => {
              const roleCfg = ROLE_CONFIG[person.roleCategory];
              return (
                <div key={person.id} className="p-4 space-y-3 font-sans">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 border ${roleCfg.badgeColor}`}>
                        {person.roleCategory} - {roleCfg.label}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        {person.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-500">
                        NIP. {person.nip}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleActive(person)}
                      className={`px-2 py-0.5 text-[9px] font-mono font-bold border ${
                        person.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      {person.isActive ? 'AKTIF' : 'NON-AKTIF'}
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {person.positionTitle}
                    </div>
                    {person.subSpecialty && (
                      <div className="text-[11px] text-slate-500">
                        Sub-Spesialisasi: {person.subSpecialty}
                      </div>
                    )}
                    {person.phone && (
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{person.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                    <button
                      onClick={() => setViewingQrPerson(person)}
                      className="text-xs font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-bold"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Lihat QR Code TTE</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(person)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePerson(person)}
                        className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* MODAL: ADD / EDIT ASN PERSONNEL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm no-print font-sans">
          {/* Lock background scroll */}
          <style>{`
            body {
              overflow: hidden !important;
            }
          `}</style>

          <div className="flex items-center justify-center min-h-screen p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col min-h-screen sm:min-h-0 sm:rounded-xl">
              
              {/* Modal Header */}
              <div className="bg-indigo-950 text-white p-4 flex items-center justify-between font-mono shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider">
                    {editingPerson ? 'EDIT IDENTITAS PEGAWAI ASN' : 'TAMBAH PEGAWAI ASN BARU'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 min-h-[44px] min-w-[44px] bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center transition font-bold"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Form */}
              <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
                
                <div>
                  <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
                    Nama Lengkap & Gelar Resmi: *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="E.g. H. Irwan Kurnia, S.ST"
                    className="w-full p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
                      NIP Resmi ASN: *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formNip}
                      onChange={(e) => setFormNip(e.target.value)}
                      placeholder="E.g. 19880512 201101 1 003"
                      className="w-full p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
                      Kategori Peran Kedinasan: *
                    </label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as ASNRoleCategory)}
                      className="w-full p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white rounded-lg"
                    >
                      <option value="OPERATOR">OPERATOR (4 Org)</option>
                      <option value="TPA">TPA - Tim Profesi Ahli (5 Org)</option>
                      <option value="TPT">TPT - Tim Teknis (1 Org)</option>
                      <option value="PENGAWAS">PENGAWAS SIMBG (1 Org)</option>
                      <option value="KABID">KEPALA BIDANG (1 Org)</option>
                      <option value="KADIN">KEPALA DINAS (1 Org)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
                      Jabatan Kedinasan:
                    </label>
                    <input
                      type="text"
                      value={formPositionTitle}
                      onChange={(e) => setFormPositionTitle(e.target.value)}
                      placeholder="E.g. Operator Teknis Verifikasi"
                      className="w-full p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
                      Sub-Spesialisasi / Keahlian:
                    </label>
                    <input
                      type="text"
                      value={formSubSpecialty}
                      onChange={(e) => setFormSubSpecialty(e.target.value)}
                      placeholder="E.g. Arsitektur / Struktur / MEP"
                      className="w-full p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
                      No. WhatsApp / HP:
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-mono font-bold text-[10px] text-slate-500 uppercase mb-1">
                      EmailKedinasan:
                    </label>
                    <input
                      type="email"
                      inputMode="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="nama@garutkab.go.id"
                      className="w-full p-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-5 h-5 min-w-[20px] text-indigo-600 rounded"
                  />
                  <label htmlFor="isActiveCheck" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Status Personil Aktif dalam Penugasan SIMBG
                  </label>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 font-mono shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase transition rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSavePerson}
                  className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase transition shadow-2xs rounded-lg"
                >
                  Simpan Data ASN
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW QR CODE VERIFICATION */}
      {viewingQrPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm shadow-2xl p-5 space-y-4 font-mono text-center">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                QR CODE VERIFIKASI ASN
              </span>
              <button
                onClick={() => setViewingQrPerson(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-900 dark:text-white font-sans">
                {viewingQrPerson.name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                NIP. {viewingQrPerson.nip}
              </div>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {viewingQrPerson.positionTitle}
              </div>
            </div>

            <div className="w-36 h-36 mx-auto border border-slate-300 p-1 bg-white">
              {viewingQrPerson.qrCodeUrl ? (
                <img src={viewingQrPerson.qrCodeUrl} alt="QR Code ASN" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-full h-full text-slate-300" />
              )}
            </div>

            <div className="text-[10px] text-slate-500 font-sans leading-tight bg-slate-50 dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700">
              Payload QR Code ini secara otomatis memverifikasi identitas kepegawaian ASN DPUPR Garut pada dokumen cetak SIMBG.
            </div>

            <button
              onClick={() => setViewingQrPerson(null)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold uppercase"
            >
              Tutup
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
