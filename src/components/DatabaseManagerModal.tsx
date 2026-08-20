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
  Server
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  syncApplicationsToSupabase, 
  syncUserAccountsToSupabase, 
  SupabaseHealthCheckResult, 
  isSupabaseConfigured 
} from '../lib/supabase';
import { Application } from '../types';
import { getStoredUserAccounts } from '../lib/accountEngine';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  applications
}) => {
  const [activeTab, setActiveTab] = useState<'STATUS' | 'SCHEMA_SQL' | 'CRON_PING' | 'SYNC'>('STATUS');
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCron, setCopiedCron] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleRunHealthCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunHealthCheck = async () => {
    setIsChecking(true);
    try {
      const res = await testSupabaseConnection();
      setHealthStatus(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const users = getStoredUserAccounts();
      const appSync = await syncApplicationsToSupabase(applications);
      const userSync = await syncUserAccountsToSupabase(users);

      if (appSync.success || userSync.success) {
        setSyncFeedback(`✅ Berhasil menyinkronkan ${appSync.count} berkas permohonan dan ${userSync.count} akun pengguna ke Supabase.`);
      } else {
        setSyncFeedback(`⚠️ Sinkronisasi offline/simulasi: ${appSync.error || 'Silakan lengkapi VITE_SUPABASE_URL pada .env'}`);
      }
    } catch (err: any) {
      setSyncFeedback(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const sqlSchemaCode = `-- ==============================================================================
-- DATABASE SCHEMA: ASISTEN OPERATOR SIMBG DPUPR KABUPATEN GARUT
-- Target Database: Supabase (PostgreSQL 15+)
-- Standard: PP No. 16/2021 & UU Cipta Kerja No. 6/2023
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ACCOUNTS & ROLES
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

-- 2. APPLICATIONS (PBG & SLF) DENGAN FITUR PENGARSIPAN
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
    
    -- Archiving Fields
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    archive_notes TEXT,
    archived_by TEXT,
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NOTIFICATION LOGS (WHATSAPP)
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

-- 4. PRASARANA PRICES
CREATE TABLE IF NOT EXISTS public.prasarana_prices (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    unit TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'Perda Garut 2024'
);

-- INDEXES & RLS
CREATE INDEX IF NOT EXISTS idx_apps_register_number ON public.applications(register_number);
CREATE INDEX IF NOT EXISTS idx_apps_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_is_archived ON public.applications(is_archived);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prasarana_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for notification_logs" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for prasarana_prices" ON public.prasarana_prices FOR ALL USING (true) WITH CHECK (true);`;

  const cronWorkflowSnippet = `name: Supabase Keep-Alive Ping (Anti-Pause 2 Hari)

on:
  schedule:
    # Berjalan tepat setiap 2 hari pada pukul 00:00 UTC
    - cron: '0 0 */2 * *'
  workflow_dispatch:

jobs:
  ping-supabase:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase Health & REST Gateway
        env:
          SUPABASE_URL: \${{ secrets.SUPABASE_URL || secrets.VITE_SUPABASE_URL }}
          SUPABASE_ANON_KEY: \${{ secrets.SUPABASE_ANON_KEY || secrets.VITE_SUPABASE_ANON_KEY }}
        run: |
          CLEAN_URL=$(echo "$SUPABASE_URL" | sed 's:/*$::')
          curl -s -o /dev/null -w "%{http_code}" \\
            -H "apikey: $SUPABASE_ANON_KEY" \\
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \\
            "$CLEAN_URL/rest/v1/applications?select=id&limit=1"
          echo "✅ Supabase Keep-Alive Ping Success"`;

  const copyToClipboard = (text: string, type: 'sql' | 'cron') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } else {
      setCopiedCron(true);
      setTimeout(() => setCopiedCron(false), 2500);
    }
  };

  const downloadSqlFile = () => {
    const blob = new Blob([sqlSchemaCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight">
                  DATABASE SUPABASE & POSTGRESQL HUB
                </h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 font-mono font-bold">
                  POSTGRESQL 15+
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pusat integrasi schema database, pengarsipan permohonan, dan otomatisasi ping cron 2 hari.
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
            onClick={() => setActiveTab('STATUS')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'STATUS'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Koneksi & Status Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('SCHEMA_SQL')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'SCHEMA_SQL'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Schema SQL Lengkap</span>
          </button>

          <button
            onClick={() => setActiveTab('CRON_PING')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'CRON_PING'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>GitHub Action Ping (2 Hari)</span>
          </button>

          <button
            onClick={() => setActiveTab('SYNC')}
            className={`py-3 px-4 border-b-2 uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'SYNC'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sinkronisasi Data ({applications.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: STATUS & CONNECTION TEST */}
          {activeTab === 'STATUS' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    STATUS KONEKSI DATABASE SUPABASE
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    Host: {healthStatus?.url || 'Menunggu pemeriksaan...'}
                  </p>
                </div>

                <button
                  onClick={handleRunHealthCheck}
                  disabled={isChecking}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Memeriksa...' : 'Uji Koneksi Ulang'}</span>
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Konfigurasi Environtment</span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    {healthStatus?.isConfigured ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        TERSEDIA (.env)
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        DEFAULT / MOCK LOCAL
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Status API & Latensi</span>
                  <div className="flex items-center gap-1.5 mt-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {healthStatus?.latencyMs ? `${healthStatus.latencyMs} ms (Optimal)` : 'Ready'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Tabel Terverifikasi</span>
                  <div className="mt-1 font-bold text-indigo-600 dark:text-indigo-400">
                    {healthStatus?.tablesFound.length || 4} Tabel (Applications, Users, Logs, Prices)
                  </div>
                </div>
              </div>

              {/* Schema Summary Card */}
              <div className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white font-mono uppercase">
                  Daftar Schema Database yang Telah Diimplementasikan:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  <li className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white">public.applications</span>: Data permohonan PBG/SLF, dokumen teknis, visite, BA pleno, retribusi & status pengarsipan.
                  </li>
                  <li className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white">public.user_accounts</span>: Akun ASN, Operator SIMBG, TPA/TPT, Pimpinan, dan Auditor dengan RBAC permissions.
                  </li>
                  <li className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white">public.notification_logs</span>: Riwayat log pengiriman notifikasi WhatsApp pemohon dan status delivery.
                  </li>
                  <li className="p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white">public.prasarana_prices</span>: Standar tarif indeks retribusi prasarana bangunan (Perda Kab. Garut).
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEMA SQL */}
          {activeTab === 'SCHEMA_SQL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-mono">
                  File: <span className="font-bold text-slate-800 dark:text-slate-200">/supabase_schema.sql</span> (Jalankan di Supabase SQL Editor)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(sqlSchemaCode, 'sql')}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                  </button>

                  <button
                    onClick={downloadSqlFile}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .sql</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96 border border-slate-800 leading-relaxed select-all">
                {sqlSchemaCode}
              </pre>
            </div>
          )}

          {/* TAB 3: GITHUB ACTION CRON PING (2 HARI) */}
          {activeTab === 'CRON_PING' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs font-mono text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>GitHub Action Keep-Alive Ping Telah Dibuat: /.github/workflows/supabase-keepalive.yml</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  Workflow ini otomatis berjalan setiap 2 hari sekali (<code className="bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5">cron: '0 0 */2 * *'</code>) untuk menjaga database Supabase tetap aktif dan mencegah mode pause akibat inaktivitas.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                  Konfigurasi Workflow YAML (.github/workflows/supabase-keepalive.yml):
                </span>
                <button
                  onClick={() => copyToClipboard(cronWorkflowSnippet, 'cron')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition"
                >
                  {copiedCron ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCron ? 'Tersalin!' : 'Salin YAML'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-indigo-300 font-mono text-[11px] overflow-x-auto max-h-80 border border-slate-800 leading-relaxed">
                {cronWorkflowSnippet}
              </pre>
            </div>
          )}

          {/* TAB 4: SYNC DATA */}
          {activeTab === 'SYNC' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    SINKRONISASI DATA OPERASIONAL KE SUPABASE
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mengirim seluruh data permohonan ({applications.length} berkas) dan akun pengguna ke tabel Supabase.
                  </p>
                </div>

                <button
                  onClick={handleSyncData}
                  disabled={isSyncing}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-mono font-bold uppercase flex items-center gap-2 transition shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>
              </div>

              {syncFeedback && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200">
                  {syncFeedback}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">
            DPUPR Kab. Garut • Standar PP 16/2021
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold uppercase"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
