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
  ShieldCheck,
  Zap,
  GitMerge,
  Compass,
  Settings,
  Menu,
  X,
  QrCode
} from 'lucide-react';
import { UserRole } from '../types';

export type MainNavTab = 
  | 'DASHBOARD' 
  | 'PIPELINE' 
  | 'APPLICATIONS' 
  | 'VISITE_LAPANGAN' 
  | 'VERIFICATION' 
  | 'SCHEDULING' 
  | 'RETRIBUTION' 
  | 'NOTIFICATIONS' 
  | 'DATA_QUALITY'
  | 'SETTINGS';

interface NavbarProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
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
  }

  const navTabs: NavTabItem[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PIPELINE', label: 'Alur Terpadu PBG/SLF', icon: GitMerge },
    { id: 'APPLICATIONS', label: 'Permohonan', icon: Building2 },
    { id: 'VISITE_LAPANGAN', label: 'Visite Lapangan', icon: Compass },
    { id: 'VERIFICATION', label: 'Verifikasi Dokumen', icon: FileCheck },
    { id: 'SCHEDULING', label: 'Sidang Jumat', icon: Calendar },
    { id: 'RETRIBUTION', label: 'Retribusi PP 16', icon: Calculator },
    { id: 'NOTIFICATIONS', label: 'Notifikasi WA', icon: MessageSquare },
    { id: 'DATA_QUALITY', label: 'Data Sanity', icon: ShieldAlert, badge: dataQualityIssueCount },
    { id: 'SETTINGS', label: 'Pengaturan WA', icon: Settings }
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
      
      {/* Top Header Bar - Geometric Precision */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 shrink-0">
              <img 
                src="/logo_garut.png" 
                alt="Logo Pemkab Garut" 
                className="w-9 h-11 sm:w-10 sm:h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <img 
                src="/logo_pupr.svg" 
                alt="Logo PUPR" 
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain hidden sm:block"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase font-mono">
                  BIMA-BG<span className="text-indigo-600">.GARUT</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                  DPUPR GARUT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none font-mono mt-0.5">
                Sistem Informasi Manajemen Bangunan Gedung // PP 16/2021
              </p>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* System Status Indicator */}
            <div className="hidden lg:flex flex-col items-end font-mono">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM_STATUS: STABLE</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                ENGINE v2026.08 // LATENCY 18ms
              </span>
            </div>

            <div className="hidden lg:block h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

            {/* Role Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 hidden sm:inline" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:inline">Role:</span>
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

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* QR Scanner Button */}
            {onOpenQrScanner && (
              <button
                onClick={onOpenQrScanner}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition shadow-2xs"
                title="Buka Pemindai QR Code Kamera Internal untuk Presensi Sidang"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pindai QR Presensi</span>
              </button>
            )}

            {/* AI Copilot Button */}
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline font-mono">AI COPILOT</span>
            </button>

            {/* Mobile Navigation Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Collapsible Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-lg font-mono">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
            PILIH MODUL (MENU UTAMA)
          </div>
          <div className="grid grid-cols-1 gap-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border-l-4 border-indigo-600'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-indigo-500" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Sub-bar with Horizontal Scroll for Desktop & Mobile */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition border-b-2 relative ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-mono font-bold leading-none">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (Native Mobile Experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-2xl font-mono">
        <button
          onClick={() => setActiveTab('PIPELINE')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-none transition ${
            activeTab === 'PIPELINE' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <GitMerge className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-tighter mt-0.5">Alur PBG</span>
        </button>

        <button
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-none transition ${
            activeTab === 'APPLICATIONS' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-tighter mt-0.5">Berkas</span>
        </button>

        <button
          onClick={() => setActiveTab('SCHEDULING')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-none transition ${
            activeTab === 'SCHEDULING' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-tighter mt-0.5">Sidang</span>
        </button>

        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-none transition relative ${
            activeTab === 'NOTIFICATIONS' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-tighter mt-0.5">Notif WA</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          className={`flex flex-col items-center py-1 px-2.5 rounded-none transition ${
            isMobileMenuOpen ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-tighter mt-0.5">Menu</span>
        </button>
      </div>

    </header>
  );
};
