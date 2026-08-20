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
    { id: 'NOTIFICATIONS', label: 'Notifikasi WA', icon: MessageSquare, shortcut: 'Ctrl+8' },
    { id: 'DATA_QUALITY', label: 'Data Sanity', icon: ShieldAlert, badge: dataQualityIssueCount, shortcut: 'Ctrl+9' },
    { id: 'SETTINGS', label: 'Pengaturan WA', icon: Settings, shortcut: 'Ctrl+0' }
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
                src="/src/assets/images/simbg_garut_logo_1787203176158.jpg" 
                alt="Logo SIMBG Garut" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-md shadow-sm border border-slate-200 dark:border-slate-800"
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
            
            {/* System Status Indicator (Desktop Only) */}
            <div className="hidden lg:flex flex-col items-end font-mono">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM_STATUS: STABLE</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                ENGINE v2026.08 // LATENCY 18ms
              </span>
            </div>

            <div className="hidden lg:block h-7 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

            {/* Role Switcher (Desktop / Tablet) */}
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
          
          {/* Mobile Role Switcher */}
          <div className="mb-3.5 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-indigo-500" />
                <span>PERAN AKTIF (ROLE)</span>
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">DPUPR GARUT</span>
            </div>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-900 dark:text-white font-sans focus:outline-none focus:border-indigo-500"
            >
              {(Object.keys(roleNames) as UserRole[]).map((role) => (
                <option key={role} value={role} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {roleNames[role]}
                </option>
              ))}
            </select>
          </div>

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
                    setActiveTab(tab.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition ${
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

      {/* Navigation Sub-bar with Horizontal Scroll for Desktop (Hidden on Mobile) */}
      <div className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                title={`${tab.label} (${tab.shortcut})`}
                className={`py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition border-b-2 relative group ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 -mb-[1px]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">{tab.label}</span>
                {tab.shortcut && (
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-1 py-0.2 rounded-xs opacity-70 group-hover:opacity-100 transition">
                    {tab.shortcut}
                  </span>
                )}
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
