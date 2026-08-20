import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  ExternalLink,
  Activity,
  Calendar,
  X,
  Server,
  ArrowRight,
  Sparkles,
  Upload,
  FileText,
  Clock,
  Radio,
  HardDrive,
  Zap,
  Gauge,
  Cpu,
  Sliders,
  TrendingDown
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  runCompleteMigrationToSupabase,
  SupabaseHealthCheckResult, 
  FullMigrationReport,
  isSupabaseConfigured,
  getStoredEgressStats,
  resetStoredEgressStats,
  EgressStats,
  STORAGE_KEYS
} from '../lib/supabase';
import { Application } from '../types';
import { getStoredUserAccounts } from '../lib/accountEngine';
import { DatabaseImportExportModule } from './DatabaseImportExportModule';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  refreshApplications?: (forceFull?: boolean) => Promise<void>;
  isDeltaSyncing?: boolean;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  applications,
  refreshApplications,
  isDeltaSyncing = false
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT_EXPORT' | 'EGRESS_SAVER' | 'MIGRATION' | 'STATUS' | 'SCHEMA_SQL' | 'CRON_PING' | 'BACKUP'>('IMPORT_EXPORT');
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<FullMigrationReport | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCron, setCopiedCron] = useState(false);
  const [egressStats, setEgressStats] = useState<EgressStats>(getStoredEgressStats());
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleRunHealthCheck();
      setEgressStats(getStoredEgressStats());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunHealthCheck = async () => {
    setIsChecking(true);
    try {
      const res = await testSupabaseConnection();
      setHealthStatus(res);
      setEgressStats(getStoredEgressStats());
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRunDeltaSync = async () => {
    if (refreshApplications) {
      setSyncNotice('Menjalankan Sinkronisasi Delta (Hanya Mengunduh Perubahan)...');
      await refreshApplications(false);
      setEgressStats(getStoredEgressStats());
      setSyncNotice('Sinkronisasi Delta Selesai. Kuota Egress Terhemat!');
      setTimeout(() => setSyncNotice(null), 3500);
    }
  };

  const handleRunFullSync = async () => {
    if (refreshApplications) {
      setSyncNotice('Menjalankan Full Resync (Mengunduh Seluruh Data Ulang)...');
      await refreshApplications(true);
      setEgressStats(getStoredEgressStats());
      setSyncNotice('Unduh Penuh Selesai. Cache Lokal Telah Dimutakhirkan.');
      setTimeout(() => setSyncNotice(null), 3500);
    }
  };

  const handleResetEgressStats = () => {
    resetStoredEgressStats();
    setEgressStats(getStoredEgressStats());
    setSyncNotice('Statistik kuota egress berhasil direset.');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleRunFullMigration = async () => {
    setIsMigrating(true);
    setMigrationReport(null);
    try {
      const users = getStoredUserAccounts();
      const report = await runCompleteMigrationToSupabase(applications, users);
      setMigrationReport(report);
      // Refresh status after migration
      await handleRunHealthCheck();
    } catch (err: any) {
      console.error('Migration error:', err);
    } finally {
      setIsMigrating(false);
    }
  };

  const sqlSchemaCode = `-- ==============================================================================
-- DATABASE SCHEMA: ASISTEN OPERATOR SIMBG DPUPR KABUPATEN GARUT
-- Target Database: Supabase (PostgreSQL 15+)
-- Standard: PP No. 16/2021 & UU Cipta Kerja No. 6/2023
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ACCOUNTS & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nip TEXT,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'OPERATOR_SIMBG', 'TPA_TPT', 'PIMPINAN', 'AUDITOR')),
    position_title TEXT NOT NULL,
    sub_specialty TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    signature_data_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPLICATIONS TABLE (PERMOHONAN PBG & SLF)
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    register_number TEXT UNIQUE NOT NULL,
    application_number TEXT,
    submission_date DATE NOT NULL,
    permit_type TEXT DEFAULT 'PBG_BARU' CHECK (permit_type IN ('PBG_BARU', 'SLF_EKSISTING', 'PBG_PERUBAHAN', 'SLF_PERPANJANGAN')),
    status TEXT NOT NULL,
    current_stage TEXT,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'URGENT')),
    
    applicant JSONB NOT NULL,
    building JSONB NOT NULL,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_iterations JSONB DEFAULT '[]'::jsonb,
    multi_verifications JSONB DEFAULT '[]'::jsonb,
    undangan_visite JSONB,
    ba_lapangan JSONB,
    consultation_notice JSONB,
    ba_konsultasi JSONB,
    multi_verifikasi_perbaikan JSONB DEFAULT '[]'::jsonb,
    ba_pleno JSONB,
    retribution JSONB,
    schedule JSONB,
    
    sla_days INTEGER DEFAULT 1,
    sla_deadline TIMESTAMPTZ,
    sla_status TEXT DEFAULT 'IN_SLA' CHECK (sla_status IN ('IN_SLA', 'WARNING', 'EXCEEDED')),
    data_quality_score NUMERIC(5,2) DEFAULT 100.00,
    data_errors JSONB DEFAULT '[]'::jsonb,
    assigned_operator TEXT,
    internal_notes TEXT,
    
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    archive_notes TEXT,
    archived_by TEXT,
    
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NOTIFICATION LOGS (WHATSAPP DISPATCH)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id TEXT PRIMARY KEY,
    application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
    register_number TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    template_type TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT DEFAULT 'WHATSAPP',
    status TEXT DEFAULT 'SENT',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STATUS AUDIT TRAIL LOGS
CREATE TABLE IF NOT EXISTS public.status_audit_logs (
    id TEXT PRIMARY KEY,
    application_id TEXT,
    register_number TEXT,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    stage_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRASARANA PRICE CONFIG TABLE (TARIF RETRIBUSI)
CREATE TABLE IF NOT EXISTS public.prasarana_prices (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    unit TEXT NOT NULL,
    price NUMERIC(15,2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- INDEXES FOR HIGH-SPEED QUERYING & LOW EGRESS
CREATE INDEX IF NOT EXISTS idx_applications_register_num ON public.applications (register_number);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON public.applications (current_stage);
CREATE INDEX IF NOT EXISTS idx_applications_submission_date ON public.applications (submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_applications_last_updated ON public.applications (last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_notif_reg_num ON public.notification_logs (register_number);
CREATE INDEX IF NOT EXISTS idx_audit_app_id ON public.status_audit_logs (application_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prasarana_prices ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE ANON ACCESS POLICIES (FOR ASISTEN OPERATOR INTEGRATION)
CREATE POLICY "Allow public read-write for user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for notification_logs" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for status_audit_logs" ON public.status_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for prasarana_prices" ON public.prasarana_prices FOR ALL USING (true) WITH CHECK (true);

-- ENABLE SUPABASE REALTIME REPLICATION FOR APPLICATIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_accounts;
`;

  const cronWorkflowSnippet = `# ==============================================================================
# GITHUB ACTIONS: SUPABASE ANTI-PAUSE CRON JOB (KABUPATEN GARUT)
# File Path: .github/workflows/supabase-keepalive.yml
# Schedule: Setiap 2 Hari (Menjaga database Supabase tier gratis tetap aktif)
# ==============================================================================
name: Supabase Database Keepalive Ping

on:
  schedule:
    # Berjalan setiap 2 hari pada pukul 04:00 UTC (11:00 WIB)
    - cron: '0 4 */2 * *'
  workflow_dispatch: # Memungkinkan trigger manual dari GitHub UI

jobs:
  ping-supabase:
    name: Ping Supabase PostgreSQL Endpoint
    runs-on: ubuntu-latest
    steps:
      - name: Send Lightweight REST Ping to Supabase
        run: |
          echo "Mengirim ping kesehatan ke Supabase..."
          STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \\
            -X GET "\${{ secrets.SUPABASE_URL }}/rest/v1/user_accounts?select=id&limit=1" \\
            -H "apikey: \${{ secrets.SUPABASE_ANON_KEY }}" \\
            -H "Authorization: Bearer \${{ secrets.SUPABASE_ANON_KEY }}")
          
          echo "Supabase Response Status Code: $STATUS_CODE"
          if [ "$STATUS_CODE" -eq 200 ] || [ "$STATUS_CODE" -eq 206 ]; then
            echo "SUCCESS: Database Supabase aktif dan siap digunakan."
          else
            echo "WARNING: Periksa kembali status project Supabase."
          fi
`;

  const copyToClipboard = (text: string, type: 'sql' | 'cron') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedCron(true);
      setTimeout(() => setCopiedCron(false), 2000);
    }
  };

  const downloadSqlFile = () => {
    const blob = new Blob([sqlSchemaCode], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simbg_garut_supabase_schema_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      source: 'DPUPR Kabupaten Garut - SIMBG Operator',
      version: '2.0-SUPABASE-READY',
      totalApplications: applications.length,
      applications: applications,
      userAccounts: getStoredUserAccounts()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simbg_garut_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalCalculatedOps = (egressStats.totalDeltaSyncs + egressStats.fullFetches) || 1;
  const savingsPercentage = egressStats.estimatedBytesSavedKb + egressStats.estimatedBytesDownloadedKb > 0
    ? Math.round((egressStats.estimatedBytesSavedKb / (egressStats.estimatedBytesSavedKb + egressStats.estimatedBytesDownloadedKb)) * 100)
    : 95;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white">
                  PUSAT DATABASE & OPTIMASI EGRESS SUPABASE
                </h2>
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-600/60 px-2 py-0.5 font-mono font-bold">
                  POSTGRESQL 15+ & REALTIME
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pusat migrasi, penghemat kuota bandwidth egress, delta sync, dan manajemen database SIMBG DPUPR Garut.
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
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 sm:px-6 overflow-x-auto text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('IMPORT_EXPORT')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'IMPORT_EXPORT'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Impor & Template Database</span>
          </button>

          <button
            onClick={() => setActiveTab('EGRESS_SAVER')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'EGRESS_SAVER'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Efisiensi Egress & Kuota</span>
          </button>

          <button
            onClick={() => setActiveTab('MIGRATION')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'MIGRATION'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Migrasi Menyeluruh (1-Click)</span>
          </button>

          <button
            onClick={() => setActiveTab('STATUS')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'STATUS'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Status & Realtime Channel</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEMA_SQL')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'SCHEMA_SQL'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Schema SQL & RLS</span>
          </button>

          <button
            onClick={() => setActiveTab('CRON_PING')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'CRON_PING'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Anti-Pause Ping (2 Hari)</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 shrink-0 ${
              activeTab === 'BACKUP'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Backup / Export JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB: DATABASE IMPORT & EXPORT WITH TEMPLATES */}
          {activeTab === 'IMPORT_EXPORT' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <DatabaseImportExportModule
                applications={applications}
                onApplicationsImported={(apps) => {
                  if (refreshApplications) refreshApplications(false);
                }}
                onRefreshApplications={refreshApplications}
              />
            </div>
          )}

          {/* TAB 0: EGRESS OPTIMIZER (HIGH-EFFICIENCY BANDWIDTH) */}
          {activeTab === 'EGRESS_SAVER' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Notification Banner */}
              {syncNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-mono flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{syncNotice}</span>
                  </div>
                  <button onClick={() => setSyncNotice(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Hero Egress Optimization Card */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-700/50 p-5 sm:p-6 text-white relative overflow-hidden shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>HIGH-EFFICIENCY EGRESS ARCHITECTURE</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
                      Arsitektur Hemat Bandwidth & Kuota Supabase
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Sistem menerapkan <strong>Delta Incremental Sync</strong>, <strong>Zero-Body HEAD Checks</strong>, dan <strong>Chunked Write Buffers</strong> untuk menekan pemakaian kuota egress hingga <strong>~95%</strong> tanpa mengurangi reaktivitas data real-time.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      onClick={handleRunDeltaSync}
                      disabled={isDeltaSyncing}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md border border-emerald-400/40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDeltaSyncing ? 'animate-spin' : ''}`} />
                      <span>{isDeltaSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Delta (Hemat)'}</span>
                    </button>

                    <button
                      onClick={handleRunFullSync}
                      disabled={isDeltaSyncing}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-300 font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Full Resync</span>
                    </button>
                  </div>
                </div>

                {/* Egress Live Meters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 font-mono text-xs">
                  <div className="bg-slate-900/90 p-3 border border-indigo-900/60">
                    <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-emerald-400" />
                      ESTIMASI EGRESS TERHEMAT:
                    </span>
                    <span className="text-base sm:text-lg font-bold text-emerald-400">
                      {egressStats.estimatedBytesSavedKb > 1024 
                        ? `${(egressStats.estimatedBytesSavedKb / 1024).toFixed(2)} MB` 
                        : `${egressStats.estimatedBytesSavedKb} KB`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ~{savingsPercentage}% efisiensi kuota
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-3 border border-indigo-900/60">
                    <span className="text-slate-400 block text-[10px]">TOTAL DELTA SYNCS:</span>
                    <span className="text-base sm:text-lg font-bold text-indigo-400">
                      {egressStats.totalDeltaSyncs} Kali
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {egressStats.zeroSyncHits} zero-byte cache hits
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-3 border border-indigo-900/60">
                    <span className="text-slate-400 block text-[10px]">TOTAL DATA DIUNDUH:</span>
                    <span className="text-base sm:text-lg font-bold text-amber-300">
                      {egressStats.estimatedBytesDownloadedKb > 1024
                        ? `${(egressStats.estimatedBytesDownloadedKb / 1024).toFixed(2)} MB`
                        : `${egressStats.estimatedBytesDownloadedKb} KB`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {egressStats.fullFetches} full fetches
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-3 border border-indigo-900/60">
                    <span className="text-slate-400 block text-[10px]">SYNC TERAKHIR:</span>
                    <span className="text-xs font-bold text-slate-200 truncate block mt-1">
                      {egressStats.lastSyncAt 
                        ? new Date(egressStats.lastSyncAt).toLocaleTimeString('id-ID') 
                        : 'Baru Saja'}
                    </span>
                    <span className="text-[10px] text-emerald-400 block mt-0.5">
                      {egressStats.lastDeltaRowsCount} baris termutakhirkan
                    </span>
                  </div>
                </div>
              </div>

              {/* Strategy Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-none bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h4 className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    1. Delta Incremental Sync
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Setiap request hanya meminta data dengan filter <code>last_updated &gt; :timestamp</code>. Jika tidak ada perubahan di server, unduhan menghasilkan <strong>0 byte payload</strong>.
                  </p>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-none bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <h4 className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    2. Zero-Body HEAD Ingress
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pengecekan konektivitas, diagnostik kesehatan tabel, dan penghitungan jumlah baris menggunakan mode <code>head: true</code> sehingga tidak mentransfer isi body berkas JSON.
                  </p>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-none bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    3. Chunked Write Buffer (50)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Pengunggahan berkas secara massal dipecah dalam batch 50 baris untuk mencegah request timeout, ukuran payload ekstrem, dan duplikasi egress response.
                  </p>
                </div>
              </div>

              {/* Maintenance & Reset Controls */}
              <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    Reset Metrik Penghematan Bandwidth
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kosongkan counter statistik penghematan egress lokal jika ingin menghitung ulang dari awal siklus penagihan.
                  </p>
                </div>
                <button
                  onClick={handleResetEgressStats}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition shrink-0"
                >
                  Reset Counter Metrik
                </button>
              </div>

            </div>
          )}

          {/* TAB 1: MIGRATION MENYELURUH */}
          {activeTab === 'MIGRATION' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Migration Action Hero Card */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-800/60 p-5 sm:p-6 text-white relative overflow-hidden shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AUTOMATED FULL MIGRATION ENGINE</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-white">
                      Migrasikan Seluruh Database ke Supabase PostgreSQL
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Memindahkan seluruh data permohonan PBG/SLF, dokumen teknis, akun pengguna & hak akses (RBAC), 
                      log notifikasi WhatsApp, serta riwayat audit trail secara otomatis ke database Supabase.
                    </p>
                  </div>

                  <button
                    onClick={handleRunFullMigration}
                    disabled={isMigrating}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2.5 shadow-md shrink-0 border border-emerald-400/40"
                  >
                    <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                    <span>{isMigrating ? 'Memproses Migrasi...' : 'JALANKAN MIGRASI SEKARANG'}</span>
                  </button>
                </div>

                {/* Live Stats Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 font-mono text-xs">
                  <div className="bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">TOTAL PERMOHONAN:</span>
                    <span className="text-base font-bold text-emerald-400">{applications.length} Berkas</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">AKUN PENGGUNA (RBAC):</span>
                    <span className="text-base font-bold text-indigo-400">{getStoredUserAccounts().length} Pengguna</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">STATUS SUPABASE:</span>
                    <span className={`text-base font-bold ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isSupabaseConfigured ? 'TERHUBUNG' : 'PERIKSA .ENV'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">MODE STORAGE:</span>
                    <span className="text-base font-bold text-slate-200">REALTIME + DUAL SYNC</span>
                  </div>
                </div>
              </div>

              {/* Migration Report / Progress Checklist */}
              {migrationReport && (
                <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      {migrationReport.isSuccess ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                      <h4 className="font-mono font-bold text-sm">
                        {migrationReport.isSuccess ? 'LAPORAN MIGRASI SUKSES 100%' : 'LAPORAN HASIL MIGRASI'}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Waktu Eksekusi: {migrationReport.durationMs}ms
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {migrationReport.steps.map((st, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 border font-mono text-xs flex items-center justify-between ${
                          st.status === 'SUCCESS'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
                            : st.status === 'FAILED'
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-300'
                            : st.status === 'SKIPPED'
                            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                            : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {st.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {st.status === 'FAILED' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {st.status === 'RUNNING' && <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />}
                          {st.status === 'SKIPPED' && <Check className="w-4 h-4 text-slate-400" />}
                          <span className="font-bold">{st.step}</span>
                        </div>
                        <div className="text-right">
                          {st.count > 0 && <span className="font-bold mr-2">[{st.count} record]</span>}
                          <span className="text-[11px] opacity-80">{st.message || st.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {migrationReport.error && (
                    <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 text-red-800 dark:text-red-200 text-xs font-mono">
                      <strong>Peringatan:</strong> {migrationReport.error}
                    </div>
                  )}
                </div>
              )}

              {/* 3 Step Migration Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                  <div className="w-7 h-7 bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                    1
                  </div>
                  <h4 className="font-mono font-bold text-xs">Buat Tabel di Supabase</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Buka <strong>SQL Editor</strong> di dashboard Supabase Anda, salin skema SQL dari Tab <strong>Schema SQL</strong>, dan jalankan sekali.
                  </p>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                  <div className="w-7 h-7 bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                    2
                  </div>
                  <h4 className="font-mono font-bold text-xs">Pasang Kredensial .env</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Masukkan nilai <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> pada konfigurasi Secrets / Environment aplikasi.
                  </p>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                  <div className="w-7 h-7 bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <h4 className="font-mono font-bold text-xs">Jalankan Migrasi 1-Click</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tekan tombol <strong>JALANKAN MIGRASI SEKARANG</strong> di atas untuk memindahkan 100% database dengan integritas terjamin.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: STATUS & REALTIME */}
          {activeTab === 'STATUS' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                    DIAGNOSTIK KONEKSI & DATABASE SUPABASE
                  </h3>
                  <p className="text-xs text-slate-500">
                    Memeriksa status latensi REST API, keberadaan tabel PostgreSQL, dan channel real-time.
                  </p>
                </div>
                <button
                  onClick={handleRunHealthCheck}
                  disabled={isChecking}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-mono font-bold flex items-center gap-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Memeriksa...' : 'Uji Koneksi Ulang'}</span>
                </button>
              </div>

              {healthStatus && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 border font-mono text-xs flex items-center justify-between ${
                    healthStatus.isConnected 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {healthStatus.isConnected ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                      <div>
                        <div className="font-bold text-sm">
                          {healthStatus.isConnected ? 'TERHUBUNG KE SUPABASE POSTGRESQL' : 'SUPABASE BELUM TERHUBUNG / TABEL BELUM DIBUAT'}
                        </div>
                        <div className="text-[11px] opacity-80 mt-0.5">
                          Endpoint: {healthStatus.url} | Latensi: {healthStatus.latencyMs}ms
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 font-bold uppercase bg-white/50 border border-current">
                      {healthStatus.isConnected ? 'STATUS: ACTIVE' : 'STATUS: OFFLINE / LOCAL CACHE'}
                    </span>
                  </div>

                  {(!healthStatus.isConnected || healthStatus.tablesFound.length < 5) && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300">
                          <Database className="w-4 h-4 text-indigo-600" />
                          <span>Tabel PostgreSQL Belum Terdeteksi di Supabase</span>
                        </div>
                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 max-w-xl">
                          Jalankan skrip DDL SQL di Supabase SQL Editor untuk menginisialisasi 5 tabel (<code>applications</code>, <code>user_accounts</code>, <code>notification_logs</code>, <code>status_audit_logs</code>, <code>prasarana_prices</code>).
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('SCHEMA_SQL')}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Buka Tab Schema SQL</span>
                      </button>
                    </div>
                  )}

                  {/* Table Inventory */}
                  <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-mono font-bold flex items-center justify-between">
                      <span>INVENTARIS TABEL DATABASE SUPABASE (ZERO-EGRESS HEAD COUNT)</span>
                      <span className="text-slate-500">{healthStatus.tablesFound.length} / 5 Tabel Ditemukan</span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {healthStatus.tablesFound.includes('applications') ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-bold">public.applications</span>
                          <span className="text-slate-400 text-[11px]">(Data permohonan PBG & SLF)</span>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {healthStatus.counts.applications} rows
                        </span>
                      </div>

                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {healthStatus.tablesFound.includes('user_accounts') ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-bold">public.user_accounts</span>
                          <span className="text-slate-400 text-[11px]">(Akun operator, TPA, pimpinan & RBAC)</span>
                        </div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {healthStatus.counts.user_accounts} rows
                        </span>
                      </div>

                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {healthStatus.tablesFound.includes('notification_logs') ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-bold">public.notification_logs</span>
                          <span className="text-slate-400 text-[11px]">(Riwayat pesan WhatsApp pemohon)</span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {healthStatus.counts.notification_logs} rows
                        </span>
                      </div>

                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {healthStatus.tablesFound.includes('status_audit_logs') ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-bold">public.status_audit_logs</span>
                          <span className="text-slate-400 text-[11px]">(Audit trail status)</span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {healthStatus.counts.status_audit_logs} rows
                        </span>
                      </div>

                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {healthStatus.tablesFound.includes('prasarana_prices') ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-bold">public.prasarana_prices</span>
                          <span className="text-slate-400 text-[11px]">(Master tarif prasarana retribusi Garut)</span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {healthStatus.counts.prasarana_prices} rows
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCHEMA SQL */}
          {activeTab === 'SCHEMA_SQL' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                    SKEMA POSTGRESQL & ROW LEVEL SECURITY (RLS)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jalankan skrip ini pada Supabase SQL Editor untuk membuat semua tabel dan mengaktifkan real-time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(sqlSchemaCode, 'sql')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                  </button>
                  <button
                    onClick={downloadSqlFile}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .sql</span>
                  </button>
                </div>
              </div>

              <div className="relative border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 max-h-[380px] overflow-y-auto leading-relaxed selection:bg-emerald-900 selection:text-white">
                <pre>{sqlSchemaCode}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: CRON PING (ANTI PAUSE) */}
          {activeTab === 'CRON_PING' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                    OTOMATISASI PING CRON 2 HARI (GITHUB ACTIONS)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mencegah auto-pause gratis pada database Supabase dengan ping terjadwal setiap 2 hari.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(cronWorkflowSnippet, 'cron')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
                >
                  {copiedCron ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCron ? 'Tersalin!' : 'Salin Workflow YAML'}</span>
                </button>
              </div>

              <div className="border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-[340px] overflow-y-auto leading-relaxed">
                <pre>{cronWorkflowSnippet}</pre>
              </div>
            </div>
          )}

          {/* TAB 5: BACKUP / EXPORT JSON */}
          {activeTab === 'BACKUP' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                  BACKUP & EKSPOR DATA OPERASIONAL LENGKAP
                </h3>
                <p className="text-xs text-slate-500">
                  Simpan cadangan offline seluruh data permohonan dan akun dalam format standar JSON.
                </p>
              </div>

              <div className="p-5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    Unduh Cadangan Lengkap (.json)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Termasuk {applications.length} berkas permohonan aktif, iterasi revisi dokumen, BA sidang, dan akun RBAC.
                  </p>
                </div>
                <button
                  onClick={handleExportJson}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-sm shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Backup JSON</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Database Adapter: <strong>Supabase (PostgreSQL 15+)</strong> &bull; Egress Mode: <strong>Delta Saver Active</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
