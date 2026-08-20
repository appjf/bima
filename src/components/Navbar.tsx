import React, { useState } from 'react';
import { 
  Building2, 
  Sparkles, 
  Sun, 
  Moon, 
  ShieldAlert, 
  UserCheck, 
  RefreshCw, 
  Layers, 
  LayoutDashboard, 
  FileCheck, 
  Calendar, 
  Calculator, 
  MessageSquare,
  TrendingUp, 
  ShieldCheck,
  Zap,
  GitMerge,
  Compass,
  Settings,
  Menu,
  X,
  QrCode,
  Database,
  User,
  ChevronDown
} from 'lucide-react';
import { UserRole, UserAccount } from '../types';

export type MainNavTab = 
  | 'DASHBOARD' 
  | 'PIPELINE' 
  | 'APPLICATIONS' 
  | 'VISITE_LAPANGAN' 
  | 'VERIFICATION' 
  | 'SCHEDULING' 
  | 'RETRIBUTION' 
  | 'MONITORING_PAD'
  | 'NOTIFICATIONS' 
  | 'DATA_QUALITY'
  | 'SETTINGS';

interface NavbarProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser?: UserAccount;
  onOpenUserModal?: () => void;
  onOpenDatabaseManager?: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenCopilot: () => void;
  onOpenQrScanner?: () => void;
  dataQualityIssueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  currentUser,
  onOpenUserModal,
  onOpenDatabaseManager,
  isDarkMode,
  setIsDarkMode,
  onOpenCopilot,
  onOpenQrScanner,
  dataQualityIssueCount
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roleNames: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    OPERATOR_SIMBG: 'Operator SIMBG',
    TPA_TPT: 'Tim Profesi Ahli (TPA)',
    PIMPINAN: 'Pimpinan DPUPR',
    AUDITOR: 'Inspektorat / Auditor'
  };

  interface NavTabItem {
    id: MainNavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    shortcut?: string;
  }

  const navTabs: NavTabItem[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Ctrl+1' },
    { id: 'PIPELINE', label: 'Alur Terpadu PBG/SLF', icon: GitMerge, shortcut: 'Ctrl+2' },
    { id: 'APPLICATIONS', label: 'Permohonan', icon: Building2, shortcut: 'Ctrl+3' },
    { id: 'VISITE_LAPANGAN', label: 'Visite Lapangan', icon: Compass, shortcut: 'Ctrl+4' },
    { id: 'VERIFICATION', label: 'Verifikasi Dokumen', icon: FileCheck, shortcut: 'Ctrl+5' },
    { id: 'SCHEDULING', label: 'Sidang Jumat', icon: Calendar, shortcut: 'Ctrl+6' },
    { id: 'RETRIBUTION', label: 'Retribusi PP 16', icon: Calculator, shortcut: 'Ctrl+7' },
    { id: 'MONITORING_PAD', label: 'Monev PAD', icon: TrendingUp, shortcut: 'Ctrl+8' },
    { id: 'NOTIFICATIONS', label: 'Notifikasi WA', icon: MessageSquare, shortcut: 'Ctrl+9' },
    { id: 'DATA_QUALITY', label: 'Data Sanity', icon: ShieldAlert, badge: dataQualityIssueCount, shortcut: 'Ctrl+0' },
    { id: 'SETTINGS', label: 'Pengaturan WA & DB', icon: Settings }
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
      
      {/* Top Header Bar - Ultra Clean & Responsive */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo & System Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <img 
                src="/logo_garut.png" 
                alt="Logo Pemkab Garut" 
                className="w-8 h-10 object-contain"
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-mono truncate">
                  BIMA-BG<span className="text-indigo-600 dark:text-indigo-400">.GARUT</span>
                </h1>
                <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800 shrink-0">
                  DPUPR
                </span>
              </div>
              
              {/* Active Tab Badge on Mobile for Clarity */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="hidden sm:block text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none font-mono truncate">
                  Sistem Informasi Manajemen Bangunan Gedung // PP 16/2021
                </p>
                <div className="sm:hidden flex items-center gap-1 text-[9.5px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="truncate">{navTabs.find(t => t.id === activeTab)?.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            
            {/* Database Hub Trigger (Desktop Only) */}
            {onOpenDatabaseManager && (
              <button
                onClick={onOpenDatabaseManager}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-mono font-bold transition"
                title="Buka Pusat Database Supabase & Schema SQL"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Supabase DB</span>
              </button>
            )}

            {/* User Account & Role Profile Button */}
            {onOpenUserModal ? (
              <button
                onClick={onOpenUserModal}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-left transition"
                title="Kelola Akun & Hak Akses Pengguna"
              >
                <img
                  src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name || 'User'}
                  className="w-6 h-6 rounded-none object-cover border border-indigo-500 shrink-0"
                />
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px] leading-tight">
                    {currentUser?.name || 'Petugas SIMBG'}
                  </span>
                  <span className="text-[9.5px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase leading-none">
                    {currentUser?.role || currentRole}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden md:inline">Role:</span>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                  className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-sans"
                >
                  {(Object.keys(roleNames) as UserRole[]).map((role) => (
                    <option key={role} value={role} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {roleNames[role]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title="Toggle Theme"
              aria-label="Ganti Mode Gelap / Terang"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* QR Scanner Button */}
            {onOpenQrScanner && (
              <button
                onClick={onOpenQrScanner}
                className="h-8 sm:h-9 px-2 sm:px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 transition shadow-2xs"
                title="Buka Pemindai QR Code Kamera Internal untuk Presensi Sidang"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden md:inline">Pindai QR</span>
              </button>
            )}

            {/* AI Copilot Button */}
            <button
              onClick={onOpenCopilot}
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition"
              title="Buka Asisten AI Copilot SIMBG"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline font-mono">AI COPILOT</span>
            </button>

            {/* Mobile Navigation Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 text-rose-500" /> : <Menu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            </button>

          </div>

        </div>
      </div>

      {/* Collapsible Mobile Menu Drawer with Integrated Role & Modules */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3.5 shadow-xl font-mono animate-in slide-in-from-top-2 duration-150">
          
          {/* Mobile User Profile Trigger */}
          {onOpenUserModal && (
            <div 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenUserModal();
              }}
              className="mb-3.5 p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                  alt={currentUser?.name || 'User'}
                  className="w-8 h-8 object-cover border border-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser?.name || 'Petugas'}
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    Peran: {currentUser?.role || currentRole}
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 uppercase font-bold">
                Kelola Akun
              </span>
            </div>
          )}

          {onOpenDatabaseManager && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDatabaseManager();
              }}
              className="w-full mb-3 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-mono font-bold flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Database Supabase Hub & Schema SQL</span>
            </button>
          )}

          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
            PILIH MODUL SIMBG
          </div>
          <div className="grid grid-cols-1 gap-1 max-h-[60vh] overflow-y-auto pr-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 text-xs font-bold transition text-left min-h-[44px] ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Main Navigation Tabs Bar */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none font-mono">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all uppercase tracking-wider relative ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
                title={tab.shortcut ? `${tab.label} (${tab.shortcut})` : tab.label}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1 text-[9px] px-1 py-0.2 font-bold ${
                    isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </header>
  );
};
