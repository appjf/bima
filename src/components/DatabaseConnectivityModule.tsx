import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Activity,
  Key,
  Globe,
  Server,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Terminal,
  HelpCircle,
  HardDrive
} from 'lucide-react';
import {
  testSupabaseConnection,
  getSupabaseConfigDetails,
  SupabaseHealthCheckResult,
  isSupabaseConfigured,
  getStoredEgressStats,
  EgressStats
} from '../lib/supabase';

interface DatabaseConnectivityModuleProps {
  onOpenDatabaseManager?: () => void;
  className?: string;
}

export const DatabaseConnectivityModule: React.FC<DatabaseConnectivityModuleProps> = ({
  onOpenDatabaseManager,
  className = ''
}) => {
  const [isTesting, setIsTesting] = useState(false);
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthCheckResult | null>(null);
  const [lastTestedTime, setLastTestedTime] = useState<string | null>(null);
  const [copiedDiag, setCopiedDiag] = useState(false);
  const [showEnvHelp, setShowEnvHelp] = useState(false);
  const [egressStats, setEgressStats] = useState<EgressStats>(getStoredEgressStats());

  const configDetails = getSupabaseConfigDetails();

  const runConnectionTest = useCallback(async () => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setHealthStatus(res);
      setLastTestedTime(new Date().toLocaleTimeString('id-ID'));
      setEgressStats(getStoredEgressStats());
    } catch (err: any) {
      console.error('Connection test error:', err);
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Run test on mount
  useEffect(() => {
    runConnectionTest();
  }, [runConnectionTest]);

  // Determine Latency Speed rating
  const getLatencyBadge = (latency: number) => {
    if (latency <= 0) return { text: 'N/A', color: 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300' };
    if (latency < 120) return { text: `${latency} ms (Sangat Cepat / Optimal)`, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800' };
    if (latency < 350) return { text: `${latency} ms (Normal / Stabil)`, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800' };
    return { text: `${latency} ms (Tinggi / Lambat)`, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800' };
  };

  const handleCopyDiagnostics = () => {
    const diag = {
      timestamp: new Date().toISOString(),
      config: {
        isConfigured: configDetails.isConfigured,
        url: configDetails.url,
        projectId: configDetails.projectId,
        hasAnonKey: configDetails.hasAnonKey,
        anonKeyLength: configDetails.anonKeyLength
      },
      healthCheck: healthStatus,
      egressStats
    };
    navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
    setCopiedDiag(true);
    setTimeout(() => setCopiedDiag(false), 2000);
  };

  const isConnected = healthStatus?.isConnected ?? false;
  const isKeyValid = healthStatus?.apiKeyValid ?? false;
  const latencyBadge = getLatencyBadge(healthStatus?.latencyMs || 0);

  return (
    <div className={`space-y-5 font-mono ${className}`}>
      {/* 1. TOP HEADER & TEST ACTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                <Database className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Konektivitas Database Supabase</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Real-time Monitor
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Verifikasi kredensial API Key dari berkas <code>.env</code>, pantau latensi jaringan, serta periksa kesiapan tabel PostgreSQL.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={runConnectionTest}
              disabled={isTesting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-sm"
              title="Kirim ping kueri HEAD ke REST API Supabase untuk memverifikasi API Key dan latensi"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi (.env)'}</span>
            </button>

            <button
              onClick={handleCopyDiagnostics}
              className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
              title="Salin laporan diagnostik koneksi lengkap (JSON)"
            >
              {copiedDiag ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDiag ? 'Tersalin' : 'Salin Diagnostik'}</span>
            </button>

            {onOpenDatabaseManager && (
              <button
                onClick={onOpenDatabaseManager}
                className="px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Pusat Database & SQL</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Status Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Card 1: Status Koneksi */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Status Gateway</span>
            <div className="flex items-center gap-2">
              {isTesting ? (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              ) : isConnected ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              ) : configDetails.isConfigured ? (
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              )}
              <span className="font-bold text-slate-900 dark:text-white">
                {isTesting
                  ? 'Sedang Memeriksa...'
                  : isConnected
                  ? 'TERHUBUNG (ONLINE)'
                  : configDetails.isConfigured
                  ? 'STANDBY / TABEL BELUM ADA'
                  : 'BELUM DIKONFIGURASI'}
              </span>
            </div>
          </div>

          {/* Card 2: Latensi Jaringan */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Latensi Round-Trip</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 text-[11px] font-bold border ${latencyBadge.color}`}>
                {latencyBadge.text}
              </span>
            </div>
          </div>

          {/* Card 3: Verifikasi API Key */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Key className="w-3 h-3 text-indigo-500" />
              <span>Validasi API Key .env</span>
            </span>
            <div className="flex items-center gap-1.5">
              {configDetails.hasAnonKey ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valid ({configDetails.anonKeyLength} bytes)</span>
                </span>
              ) : (
                <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Key Kosong</span>
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Kesiapan PostgreSQL Table */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-cyan-500" />
              <span>Tabel PostgreSQL</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white">
                {healthStatus?.tablesFound ? `${healthStatus.tablesFound.length} / 5 Tabel Aktif` : '0 / 5 Tabel'}
              </span>
              {healthStatus?.tablesFound && healthStatus.tablesFound.length === 5 && (
                <span className="text-[10px] px-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">Lengkap</span>
              )}
            </div>
          </div>
        </div>

        {lastTestedTime && (
          <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Terakhir diuji pada: <strong className="text-slate-600 dark:text-slate-300">{lastTestedTime}</strong></span>
            <span className="text-[10px] text-slate-400 font-sans">Zero-Egress HEAD Ping (Hemat Kuota Bandwidth)</span>
          </div>
        )}
      </div>

      {/* 2. CREDENTIALS & .ENV INSPECTOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Inspeksi Kredensial Lingkungan (.env)
            </h4>
          </div>
          <button
            onClick={() => setShowEnvHelp(!showEnvHelp)}
            className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showEnvHelp ? 'Sembunyikan Panduan' : 'Panduan Pengaturan .env'}</span>
          </button>
        </div>

        {/* Collapsible Help Section */}
        {showEnvHelp && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-sans space-y-2">
            <div className="font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-500" />
              <span>Konfigurasi Variabel Lingkungan di .env:</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs">
              Pastikan berkas <code>.env</code> di root proyek memiliki variabel berikut:
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto rounded">
{`# Supabase Database Configuration
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
            </pre>
            <p className="text-slate-500 text-[11px]">
              Dapatkan URL dan Anon Key tersebut dari dashboard Supabase Anda di menu <strong>Project Settings &gt; API</strong>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* VITE_SUPABASE_URL */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>VITE_SUPABASE_URL</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 font-bold ${configDetails.hasUrl ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'}`}>
                {configDetails.hasUrl ? 'Dikonfigurasi' : 'Kosong'}
              </span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 break-all text-[11px] text-slate-800 dark:text-slate-200">
              {configDetails.url}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans">
              <span>Project Ref: <strong className="font-mono">{configDetails.projectId}</strong></span>
              <span>HTTPS: {configDetails.isHttps ? 'Ya' : 'Tidak'}</span>
            </div>
          </div>

          {/* VITE_SUPABASE_ANON_KEY */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                <span>VITE_SUPABASE_ANON_KEY (Public Key)</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 font-bold ${configDetails.hasAnonKey ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'}`}>
                {configDetails.hasAnonKey ? 'Dikonfigurasi' : 'Kosong'}
              </span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 break-all text-[11px] text-slate-800 dark:text-slate-200">
              {configDetails.anonKeyMasked}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans">
              <span>Format JWT: {configDetails.hasAnonKey ? 'Terverifikasi' : 'N/A'}</span>
              <span>Role: Public Anon Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABLE INVENTORY & SCHEMA STATUS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Status Tabel PostgreSQL & Record Inventory
            </h4>
          </div>
          {onOpenDatabaseManager && (
            <button
              onClick={onOpenDatabaseManager}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              <span>Lihat Schema SQL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {healthStatus?.error && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Pemberitahuan Status:</span>
              <p className="text-[11px] font-sans">{healthStatus.error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[
            {
              name: 'applications',
              label: 'Berkas PBG / SLF',
              count: healthStatus?.counts.applications ?? 0,
              exists: healthStatus?.tablesFound.includes('applications') ?? false
            },
            {
              name: 'user_accounts',
              label: 'Akun Pengguna',
              count: healthStatus?.counts.user_accounts ?? 0,
              exists: healthStatus?.tablesFound.includes('user_accounts') ?? false
            },
            {
              name: 'notification_logs',
              label: 'Log Notifikasi WA',
              count: healthStatus?.counts.notification_logs ?? 0,
              exists: healthStatus?.tablesFound.includes('notification_logs') ?? false
            },
            {
              name: 'status_audit_logs',
              label: 'Audit Jejak Status',
              count: healthStatus?.counts.status_audit_logs ?? 0,
              exists: healthStatus?.tablesFound.includes('status_audit_logs') ?? false
            },
            {
              name: 'prasarana_prices',
              label: 'Tarif Retribusi',
              count: healthStatus?.counts.prasarana_prices ?? 0,
              exists: healthStatus?.tablesFound.includes('prasarana_prices') ?? false
            }
          ].map(table => (
            <div
              key={table.name}
              className={`p-3 border transition ${
                table.exists
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <code className="font-bold text-slate-800 dark:text-slate-200">{table.name}</code>
                {table.exists ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
              </div>
              <div className="mt-2 text-slate-500 dark:text-slate-400 text-[10px]">
                {table.label}
              </div>
              <div className="mt-1 font-bold text-slate-900 dark:text-white text-xs">
                {table.exists ? `${table.count.toLocaleString()} baris` : 'Belum Dibuat'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
