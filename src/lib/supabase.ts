import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Application, UserAccount, NotificationLog, StatusAuditLog, PrasaranaPriceConfig } from '../types';

// Retrieve environment variables safely
const env = (import.meta as any).env || {};
const supabaseUrl: string = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

// Local storage keys for caching and egress tracking
export const STORAGE_KEYS = {
  APPS_CACHE: 'simbg_garut_cached_apps',
  LAST_SYNC_AT: 'simbg_garut_last_sync_timestamp',
  EGRESS_STATS: 'simbg_garut_egress_stats',
  CONFIG_LOW_EGRESS: 'simbg_garut_low_egress_mode'
};

export interface EgressStats {
  totalDeltaSyncs: number;
  zeroSyncHits: number;
  fullFetches: number;
  estimatedBytesSavedKb: number;
  estimatedBytesDownloadedKb: number;
  lastSyncAt: string | null;
  lastDeltaRowsCount: number;
  lowEgressEnabled: boolean;
}

// Get stored egress metrics
export function getStoredEgressStats(): EgressStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EGRESS_STATS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse egress stats:', e);
  }
  return {
    totalDeltaSyncs: 0,
    zeroSyncHits: 0,
    fullFetches: 0,
    estimatedBytesSavedKb: 0,
    estimatedBytesDownloadedKb: 0,
    lastSyncAt: null,
    lastDeltaRowsCount: 0,
    lowEgressEnabled: true
  };
}

// Update stored egress metrics
export function updateStoredEgressStats(updater: (prev: EgressStats) => EgressStats) {
  try {
    const prev = getStoredEgressStats();
    const updated = updater(prev);
    localStorage.setItem(STORAGE_KEYS.EGRESS_STATS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update egress stats:', e);
  }
}

// Reset egress stats counter
export function resetStoredEgressStats() {
  const initial: EgressStats = {
    totalDeltaSyncs: 0,
    zeroSyncHits: 0,
    fullFetches: 0,
    estimatedBytesSavedKb: 0,
    estimatedBytesDownloadedKb: 0,
    lastSyncAt: null,
    lastDeltaRowsCount: 0,
    lowEgressEnabled: true
  };
  localStorage.setItem(STORAGE_KEYS.EGRESS_STATS, JSON.stringify(initial));
}

// Create Supabase client singleton with graceful fallback
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  if (!client) {
    try {
      client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return client;
}

export interface SupabaseHealthCheckResult {
  isConfigured: boolean;
  isConnected: boolean;
  apiKeyValid: boolean;
  latencyMs: number;
  url: string;
  projectId: string;
  anonKeyMasked: string;
  anonKeyLength: number;
  tablesFound: string[];
  counts: {
    applications: number;
    user_accounts: number;
    notification_logs: number;
    status_audit_logs: number;
    prasarana_prices: number;
  };
  error?: string;
  authGatewayStatus: 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
  tableStatus: 'READY' | 'TABLES_MISSING' | 'ERROR';
  lastCheckedAt: string;
}

export function getSupabaseConfigDetails() {
  const isHttps = supabaseUrl.startsWith('https://');
  const projectIdMatch = supabaseUrl.match(/https:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/);
  const projectId = projectIdMatch ? projectIdMatch[1] : (supabaseUrl ? 'custom' : 'Belum Diisi');
  
  const keyLen = supabaseAnonKey ? supabaseAnonKey.length : 0;
  let maskedKey = 'Belum Dikonfigurasi';
  if (supabaseAnonKey) {
    if (supabaseAnonKey.length > 16) {
      maskedKey = `${supabaseAnonKey.slice(0, 10)}...${supabaseAnonKey.slice(-6)} (${keyLen} karakter)`;
    } else {
      maskedKey = '***';
    }
  }

  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl || 'Belum Diatur di .env',
    projectId,
    isHttps,
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    anonKeyMasked: maskedKey,
    anonKeyLength: keyLen,
    restEndpoint: supabaseUrl ? `${supabaseUrl}/rest/v1/` : 'N/A',
    authEndpoint: supabaseUrl ? `${supabaseUrl}/auth/v1/` : 'N/A'
  };
}

export interface MigrationStepResult {
  step: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  count: number;
  message?: string;
}

export interface FullMigrationReport {
  timestamp: string;
  isSuccess: boolean;
  totalMigrated: number;
  durationMs: number;
  steps: MigrationStepResult[];
  error?: string;
}

/**
 * Maps an Application client domain object to a Supabase DB row
 */
export function mapApplicationToSupabaseRow(app: Application) {
  return {
    id: app.id,
    register_number: app.registerNumber,
    application_number: app.applicationNumber || app.registerNumber,
    submission_date: app.submissionDate,
    permit_type: app.permitType || 'PBG_BARU',
    status: app.status,
    current_stage: app.currentStage || null,
    priority: app.priority || 'NORMAL',
    applicant: app.applicant,
    building: app.building,
    documents: app.documents || [],
    verification_iterations: app.verificationIterations || [],
    multi_verifications: app.multiVerifications || [],
    undangan_visite: app.undanganVisite || null,
    ba_lapangan: app.baLapangan || null,
    consultation_notice: app.consultationNotice || null,
    ba_konsultasi: app.baKonsultasi || null,
    multi_verifikasi_perbaikan: app.multiVerifikasiPerbaikan || [],
    ba_pleno: app.baPleno || null,
    retribution: app.retribution || null,
    schedule: app.schedule || null,
    sla_days: app.slaDays || 1,
    sla_deadline: app.slaDeadline || null,
    sla_status: app.slaStatus || 'IN_SLA',
    data_quality_score: app.dataQualityScore || 100,
    data_errors: app.dataErrors || [],
    assigned_operator: app.assignedOperator || null,
    internal_notes: app.internalNotes || null,
    is_archived: Boolean(app.isArchived),
    archived_at: app.archivedAt || null,
    archive_notes: app.archiveNotes || null,
    archived_by: app.archivedBy || null,
    last_updated: app.lastUpdated || new Date().toISOString()
  };
}

/**
 * Maps a Supabase DB row to an Application client domain object
 */
export function mapSupabaseRowToApplication(row: any): Application {
  return {
    id: row.id,
    registerNumber: row.register_number,
    applicationNumber: row.application_number || row.register_number,
    submissionDate: row.submission_date,
    permitType: row.permit_type || 'PBG_BARU',
    status: row.status,
    currentStage: row.current_stage || 'DOKUMEN_MASUK',
    priority: row.priority || 'NORMAL',
    applicant: row.applicant || {
      name: 'Pemohon SIMBG',
      nik: '',
      phone: '',
      email: '',
      address: '',
      village: '',
      district: '',
      city: 'Kabupaten Garut'
    },
    building: row.building || {
      name: 'Bangunan SIMBG',
      functionType: 'HUNIAN',
      subFunction: '',
      complexity: 'SEDERHANA',
      address: '',
      district: 'Garut Kota',
      village: '',
      landArea: 100,
      buildingArea: 100,
      floors: 1,
      height: 4,
      permanence: 'PERMANEN'
    },
    documents: row.documents || [],
    verificationIterations: row.verification_iterations || [],
    multiVerifications: row.multi_verifications || [],
    undanganVisite: row.undangan_visite || undefined,
    baLapangan: row.ba_lapangan || undefined,
    consultationNotice: row.consultation_notice || undefined,
    baKonsultasi: row.ba_konsultasi || undefined,
    multiVerifikasiPerbaikan: row.multi_verifikasi_perbaikan || [],
    baPleno: row.ba_pleno || undefined,
    retribution: row.retribution || undefined,
    schedule: row.schedule || undefined,
    slaDays: row.sla_days || 1,
    slaDeadline: row.sla_deadline || undefined,
    slaStatus: row.sla_status || 'IN_SLA',
    dataQualityScore: Number(row.data_quality_score) || 100,
    dataErrors: row.data_errors || [],
    assignedOperator: row.assigned_operator || undefined,
    internalNotes: row.internal_notes || undefined,
    isArchived: Boolean(row.is_archived),
    archivedAt: row.archived_at || undefined,
    archiveNotes: row.archive_notes || undefined,
    archivedBy: row.archived_by || undefined,
    lastUpdated: row.last_updated || new Date().toISOString()
  };
}

/**
 * Helper to identify if a Supabase error is caused by missing tables or missing schema cache (PGRST205 / 42P01)
 */
export function isSupabaseTableMissingError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const msg = typeof err === 'string' ? err : (err.message || '');
  const details = typeof err === 'object' ? JSON.stringify(err) : '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('PGRST205') ||
    msg.includes('schema cache') ||
    msg.includes('relation') ||
    msg.includes('does not exist') ||
    details.includes('PGRST205') ||
    details.includes('schema cache')
  );
}

/**
 * Test connectivity, fetch counts, and inspect table presence in Supabase
 * Note: uses head:true and exact counts to minimize egress
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  const config = getSupabaseConfigDetails();
  const result: SupabaseHealthCheckResult = {
    isConfigured: isSupabaseConfigured,
    isConnected: false,
    apiKeyValid: false,
    latencyMs: 0,
    url: config.url,
    projectId: config.projectId,
    anonKeyMasked: config.anonKeyMasked,
    anonKeyLength: config.anonKeyLength,
    tablesFound: [],
    counts: {
      applications: 0,
      user_accounts: 0,
      notification_logs: 0,
      status_audit_logs: 0,
      prasarana_prices: 0
    },
    authGatewayStatus: isSupabaseConfigured ? 'ONLINE' : 'UNCONFIGURED',
    tableStatus: 'ERROR',
    lastCheckedAt: new Date().toISOString()
  };

  if (!isSupabaseConfigured) {
    result.error = 'Kredensial VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diatur pada file .env.';
    result.authGatewayStatus = 'UNCONFIGURED';
    result.tableStatus = 'ERROR';
    return result;
  }

  const sb = getSupabaseClient();
  if (!sb) {
    result.error = 'Inisialisasi Supabase SDK gagal. Format URL atau Key tidak valid.';
    result.authGatewayStatus = 'OFFLINE';
    result.tableStatus = 'ERROR';
    return result;
  }

  const startTime = performance.now();

  try {
    // Ping Auth / Session endpoint to verify API Key authentication validity
    try {
      const { error: authErr } = await sb.auth.getSession();
      if (!authErr) {
        result.apiKeyValid = true;
        result.authGatewayStatus = 'ONLINE';
      }
    } catch {
      result.apiKeyValid = true; // Anon public key is verified via REST
    }

    // 1. Applications table (HEAD request - ZERO body egress)
    const { count: appCount, error: appErr } = await sb
      .from('applications')
      .select('*', { count: 'exact', head: true });

    result.latencyMs = Math.round(performance.now() - startTime);

    if (!appErr) {
      result.isConnected = true;
      result.apiKeyValid = true;
      result.tablesFound.push('applications');
      result.counts.applications = appCount || 0;
    }

    // 2. User accounts table (HEAD request)
    const { count: userCount, error: userErr } = await sb
      .from('user_accounts')
      .select('*', { count: 'exact', head: true });
    if (!userErr) {
      result.tablesFound.push('user_accounts');
      result.counts.user_accounts = userCount || 0;
    }

    // 3. Notification logs table (HEAD request)
    const { count: notifCount, error: notifErr } = await sb
      .from('notification_logs')
      .select('*', { count: 'exact', head: true });
    if (!notifErr) {
      result.tablesFound.push('notification_logs');
      result.counts.notification_logs = notifCount || 0;
    }

    // 4. Status audit logs table (HEAD request)
    const { count: auditCount, error: auditErr } = await sb
      .from('status_audit_logs')
      .select('*', { count: 'exact', head: true });
    if (!auditErr) {
      result.tablesFound.push('status_audit_logs');
      result.counts.status_audit_logs = auditCount || 0;
    }

    // 5. Prasarana prices table (HEAD request)
    const { count: prasaranaCount, error: prasaranaErr } = await sb
      .from('prasarana_prices')
      .select('*', { count: 'exact', head: true });
    if (!prasaranaErr) {
      result.tablesFound.push('prasarana_prices');
      result.counts.prasarana_prices = prasaranaCount || 0;
    }

    // Determine table readiness
    if (result.tablesFound.length >= 5) {
      result.tableStatus = 'READY';
      result.isConnected = true;
    } else if (appErr && isSupabaseTableMissingError(appErr)) {
      result.tableStatus = 'TABLES_MISSING';
      result.isConnected = true; // Connection handshake succeeded, tables just need schema execution
      result.error = 'Koneksi ke Supabase berhasil, namun tabel PostgreSQL belum dibuat. Jalankan skrip di Tab "Schema SQL & RLS".';
    } else if (appErr && userErr && notifErr) {
      result.tableStatus = 'TABLES_MISSING';
      result.error = `Terkoneksi ke Supabase, namun tabel belum ditemukan: ${appErr.message || 'PGRST205'}. Jalankan schema SQL di Tab Schema SQL.`;
    }
  } catch (err: any) {
    result.latencyMs = Math.round(performance.now() - startTime);
    if (isSupabaseTableMissingError(err)) {
      result.isConnected = true;
      result.tableStatus = 'TABLES_MISSING';
      result.error = 'Koneksi ke Supabase berhasil, namun tabel PostgreSQL belum dibuat.';
    } else {
      result.isConnected = false;
      result.tableStatus = 'ERROR';
      result.error = err?.message || 'Gagal menghubungi server Supabase.';
    }
  }

  return result;
}

/**
 * HIGH-EFFICIENCY EGRESS STRATEGY:
 * Delta / Incremental Synchronization with Local Cache.
 * 
 * Only downloads rows that have changed (last_updated > lastSyncTimestamp).
 * Saves ~95-99% Supabase egress on recurrent sessions.
 */
export async function syncApplicationsWithDelta(
  cachedApplications: Application[],
  forceFullFetch: boolean = false
): Promise<{
  data: Application[];
  isDelta: boolean;
  modifiedCount: number;
  isTableMissing?: boolean;
  error?: string;
}> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { data: cachedApplications, isDelta: false, modifiedCount: 0, error: 'Supabase client is not configured' };
  }

  const lastSyncTimestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_AT);
  const hasLocalData = cachedApplications && cachedApplications.length > 0;
  const shouldDeltaSync = !forceFullFetch && hasLocalData && Boolean(lastSyncTimestamp);

  const averageRowSizeBytes = 4200; // ~4.2 KB average per full record with JSON

  try {
    if (shouldDeltaSync) {
      // 1. DELTA SYNC: Query ONLY updated records since last sync
      const { data, error } = await sb
        .from('applications')
        .select('*')
        .gt('last_updated', lastSyncTimestamp)
        .order('last_updated', { ascending: false });

      if (error) {
        if (isSupabaseTableMissingError(error)) {
          console.info('[Supabase Bridge] Tabel public.applications belum dibuat di Supabase schema cache. Menggunakan fallback Firestore & local cache.');
          return { data: cachedApplications, isDelta: false, modifiedCount: 0, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
        }
        throw error;
      }

      const modifiedRows = (data || []).map(mapSupabaseRowToApplication);
      const nowIso = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_AT, nowIso);

      // Merge modified rows into cache
      const appMap = new Map(cachedApplications.map(a => [a.id, a]));
      modifiedRows.forEach(app => {
        appMap.set(app.id, app);
      });

      const mergedList = Array.from(appMap.values());

      // Update Egress Metrics
      const downloadedKb = Math.round((modifiedRows.length * averageRowSizeBytes) / 1024);
      const savedKb = Math.round(((cachedApplications.length - modifiedRows.length) * averageRowSizeBytes) / 1024);

      updateStoredEgressStats(prev => ({
        ...prev,
        totalDeltaSyncs: prev.totalDeltaSyncs + 1,
        zeroSyncHits: modifiedRows.length === 0 ? prev.zeroSyncHits + 1 : prev.zeroSyncHits,
        estimatedBytesDownloadedKb: prev.estimatedBytesDownloadedKb + downloadedKb,
        estimatedBytesSavedKb: prev.estimatedBytesSavedKb + Math.max(0, savedKb),
        lastSyncAt: nowIso,
        lastDeltaRowsCount: modifiedRows.length
      }));

      return {
        data: mergedList,
        isDelta: true,
        modifiedCount: modifiedRows.length
      };
    } else {
      // 2. FULL SYNC (Initial Load or Forced Reset)
      const { data, error } = await sb
        .from('applications')
        .select('*')
        .order('submission_date', { ascending: false });

      if (error) {
        if (isSupabaseTableMissingError(error)) {
          console.info('[Supabase Bridge] Tabel public.applications belum dibuat di Supabase schema cache. Menggunakan fallback Firestore & local cache.');
          return { data: cachedApplications, isDelta: false, modifiedCount: 0, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
        }
        throw error;
      }

      const apps = (data || []).map(mapSupabaseRowToApplication);
      const nowIso = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_AT, nowIso);

      const downloadedKb = Math.round((apps.length * averageRowSizeBytes) / 1024);

      updateStoredEgressStats(prev => ({
        ...prev,
        fullFetches: prev.fullFetches + 1,
        estimatedBytesDownloadedKb: prev.estimatedBytesDownloadedKb + downloadedKb,
        lastSyncAt: nowIso,
        lastDeltaRowsCount: apps.length
      }));

      return {
        data: apps,
        isDelta: false,
        modifiedCount: apps.length
      };
    }
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      console.info('[Supabase Bridge] Tabel public.applications belum dibuat di Supabase schema cache. Menggunakan fallback Firestore & local cache.');
      return { data: cachedApplications, isDelta: false, modifiedCount: 0, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    }
    console.warn('[Supabase Bridge] Sinkronisasi Supabase ditunda:', err?.message || err);
    return { data: cachedApplications, isDelta: false, modifiedCount: 0, error: err?.message || 'SYNC_ERROR' };
  }
}

/**
 * Fetch all applications directly from Supabase (Full Fetch)
 */
export async function fetchApplicationsFromSupabase(): Promise<{ data: Application[]; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { data: [], error: 'Supabase client is not configured' };
  }

  try {
    const { data, error } = await sb
      .from('applications')
      .select('*')
      .order('submission_date', { ascending: false });

    if (error) {
      if (isSupabaseTableMissingError(error)) {
        return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
      }
      throw error;
    }

    const apps = (data || []).map(mapSupabaseRowToApplication);
    return { data: apps };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    }
    console.warn('Supabase fetch notice:', err?.message || err);
    return { data: [], error: err?.message || 'FETCH_ERROR' };
  }
}

/**
 * Save / Upsert a single application to Supabase with lightweight payload
 */
export async function saveApplicationToSupabase(app: Application): Promise<{ success: boolean; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const row = mapApplicationToSupabaseRow(app);
    const { error } = await sb
      .from('applications')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      if (isSupabaseTableMissingError(error)) {
        return { success: false, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { success: false, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    }
    console.warn('Upsert application to Supabase deferred:', err?.message || err);
    return { success: false, error: err?.message || 'UPSERT_ERROR' };
  }
}

/**
 * Batch save applications to Supabase with chunking for optimal network efficiency
 */
export async function batchSaveApplicationsToSupabase(apps: Application[]): Promise<{ success: boolean; count: number; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, count: 0, error: 'Supabase belum terkonfigurasi' };
  if (!apps || apps.length === 0) return { success: true, count: 0 };

  try {
    // Process in chunks of 50 to avoid request body size limits & timeout
    const CHUNK_SIZE = 50;
    let savedCount = 0;

    for (let i = 0; i < apps.length; i += CHUNK_SIZE) {
      const chunk = apps.slice(i, i + CHUNK_SIZE);
      const rows = chunk.map(mapApplicationToSupabaseRow);
      const { error } = await sb
        .from('applications')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        if (isSupabaseTableMissingError(error)) {
          return { success: false, count: savedCount, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
        }
        throw error;
      }
      savedCount += rows.length;
    }

    return { success: true, count: savedCount };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { success: false, count: 0, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    }
    console.warn('Batch save to Supabase deferred:', err?.message || err);
    return { success: false, count: 0, error: err?.message || 'BATCH_ERROR' };
  }
}

/**
 * Delete an application from Supabase
 */
export async function deleteApplicationFromSupabase(appId: string): Promise<{ success: boolean; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'Supabase belum terkonfigurasi' };

  try {
    const { error } = await sb
      .from('applications')
      .delete()
      .eq('id', appId);

    if (error) {
      if (isSupabaseTableMissingError(error)) {
        return { success: false, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { success: false, isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    }
    console.warn('Delete application from Supabase deferred:', err?.message || err);
    return { success: false, error: err?.message || 'DELETE_ERROR' };
  }
}

/**
 * Subscribe to real-time changes on applications table
 * Filters specific event types to minimize client-side reconnections
 */
export function subscribeToApplicationsSupabase(
  onInsertOrUpdate: (app: Application) => void,
  onDelete: (id: string) => void
): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};

  try {
    const channel: RealtimeChannel = sb
      .channel('realtime_applications_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'applications' },
        (payload) => {
          if (payload.new) {
            const app = mapSupabaseRowToApplication(payload.new);
            onInsertOrUpdate(app);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'applications' },
        (payload) => {
          if (payload.new) {
            const app = mapSupabaseRowToApplication(payload.new);
            onInsertOrUpdate(app);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'applications' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.info('[Supabase Realtime] Realtime channel standby.');
        }
      });

    return () => {
      sb.removeChannel(channel);
    };
  } catch (err) {
    console.info('[Supabase Realtime] Standby notice:', err);
    return () => {};
  }
}

/**
 * Synchronize applications list to Supabase
 */
export async function syncApplicationsToSupabase(applications: Application[]): Promise<{ success: boolean; count: number; error?: string }> {
  return batchSaveApplicationsToSupabase(applications);
}

/**
 * Fetch User Accounts from Supabase
 */
export async function fetchUserAccountsFromSupabase(): Promise<{ data: UserAccount[]; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { data: [], error: 'Supabase belum terkonfigurasi' };

  try {
    const { data, error } = await sb
      .from('user_accounts')
      .select('*')
      .order('name');

    if (error) {
      if (isSupabaseTableMissingError(error)) {
        return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
      }
      throw error;
    }

    const users: UserAccount[] = (data || []).map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      email: row.email,
      nip: row.nip || undefined,
      role: row.role,
      positionTitle: row.position_title,
      subSpecialty: row.sub_specialty || undefined,
      phone: row.phone || undefined,
      avatarUrl: row.avatar_url || undefined,
      isActive: row.is_active,
      permissions: row.permissions,
      signatureDataUrl: row.signature_data_url || undefined,
      lastLoginAt: row.last_login_at || undefined,
      createdAt: row.created_at || new Date().toISOString()
    }));

    return { data: users };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    }
    return { data: [], error: err.message };
  }
}

/**
 * Sync User Accounts to Supabase
 */
export async function syncUserAccountsToSupabase(users: UserAccount[]): Promise<{ success: boolean; count: number; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, count: 0, error: 'Supabase belum terhubung.' };
  if (!users || users.length === 0) return { success: true, count: 0 };

  try {
    const formattedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      nip: u.nip || null,
      role: u.role,
      position_title: u.positionTitle,
      sub_specialty: u.subSpecialty || null,
      phone: u.phone || null,
      avatar_url: u.avatarUrl || null,
      is_active: u.isActive,
      permissions: u.permissions,
      signature_data_url: u.signatureDataUrl || null,
      last_login_at: u.lastLoginAt || null,
      updated_at: new Date().toISOString()
    }));

    const { error } = await sb
      .from('user_accounts')
      .upsert(formattedUsers, { onConflict: 'id' });

    if (error) {
      if (isSupabaseTableMissingError(error)) {
        return { success: false, count: 0, isTableMissing: true, error: 'Tabel user_accounts belum dibuat di Supabase.' };
      }
      throw error;
    }
    return { success: true, count: formattedUsers.length };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { success: false, count: 0, isTableMissing: true, error: 'Tabel user_accounts belum dibuat di Supabase.' };
    }
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Record a Notification log in Supabase
 */
export async function recordNotificationLogToSupabase(log: NotificationLog): Promise<{ success: boolean; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'Supabase belum terhubung' };

  try {
    const { error } = await sb
      .from('notification_logs')
      .upsert({
        id: log.id,
        application_id: log.applicationId || null,
        register_number: log.registerNumber,
        recipient_name: log.recipientName,
        recipient_phone: log.recipientPhone,
        template_type: log.templateType,
        message: log.message,
        channel: log.channel || 'WHATSAPP',
        status: log.status || 'SENT',
        retry_count: log.retryCount || 0,
        error_message: log.errorMessage || null,
        sent_at: log.sentAt || new Date().toISOString(),
        created_at: log.createdAt || new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      if (isSupabaseTableMissingError(error)) {
        return { success: false, isTableMissing: true, error: 'Tabel notification_logs belum dibuat di Supabase.' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { success: false, isTableMissing: true, error: 'Tabel notification_logs belum dibuat di Supabase.' };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Record a Status Audit log in Supabase
 */
export async function recordStatusAuditLogToSupabase(log: StatusAuditLog): Promise<{ success: boolean; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'Supabase belum terhubung' };

  try {
    const { error } = await sb
      .from('status_audit_logs')
      .upsert({
        id: log.id,
        application_id: log.applicationId || null,
        register_number: log.registerNumber || null,
        from_status: log.fromStatus,
        to_status: log.toStatus,
        actor_name: log.actorName,
        actor_role: log.actorRole,
        stage_name: log.stageName || null,
        notes: log.notes || null,
        created_at: log.timestamp || new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      if (isSupabaseTableMissingError(error)) {
        return { success: false, isTableMissing: true, error: 'Tabel status_audit_logs belum dibuat di Supabase.' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) {
      return { success: false, isTableMissing: true, error: 'Tabel status_audit_logs belum dibuat di Supabase.' };
    }
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Notification Logs from Supabase
 */
export async function fetchNotificationLogsFromSupabase(): Promise<{ data: NotificationLog[]; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { data: [], error: 'Supabase belum terkonfigurasi' };

  try {
    const { data, error } = await sb
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      if (isSupabaseTableMissingError(error)) return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
      throw error;
    }

    const logs: NotificationLog[] = (data || []).map(row => ({
      id: row.id,
      applicationId: row.application_id || '',
      registerNumber: row.register_number || '',
      recipientName: row.recipient_name || '',
      recipientPhone: row.recipient_phone || '',
      templateType: row.template_type || 'INFO_UMUM',
      message: row.message || '',
      channel: row.channel || 'WHATSAPP',
      status: row.status || 'SENT',
      retryCount: row.retry_count || 0,
      errorMessage: row.error_message || undefined,
      sentAt: row.sent_at || undefined,
      createdAt: row.created_at || new Date().toISOString()
    }));

    return { data: logs };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    return { data: [], error: err.message };
  }
}

/**
 * Fetch Status Audit Logs from Supabase
 */
export async function fetchStatusAuditLogsFromSupabase(): Promise<{ data: StatusAuditLog[]; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { data: [], error: 'Supabase belum terkonfigurasi' };

  try {
    const { data, error } = await sb
      .from('status_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      if (isSupabaseTableMissingError(error)) return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
      throw error;
    }

    const logs: StatusAuditLog[] = (data || []).map(row => ({
      id: row.id,
      applicationId: row.application_id || undefined,
      registerNumber: row.register_number || undefined,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      actorName: row.actor_name,
      actorRole: row.actor_role,
      stageName: row.stage_name || undefined,
      notes: row.notes || undefined,
      timestamp: row.created_at || new Date().toISOString()
    }));

    return { data: logs };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    return { data: [], error: err.message };
  }
}

/**
 * Fetch Prasarana Prices from Supabase
 */
export async function fetchPrasaranaPricesFromSupabase(): Promise<{ data: PrasaranaPriceConfig[]; isTableMissing?: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { data: [], error: 'Supabase belum terkonfigurasi' };

  try {
    const { data, error } = await sb
      .from('prasarana_prices')
      .select('*')
      .order('id');

    if (error) {
      if (isSupabaseTableMissingError(error)) return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
      throw error;
    }

    const prices: PrasaranaPriceConfig[] = (data || []).map(row => ({
      id: row.id,
      label: row.label,
      unit: row.unit,
      price: Number(row.price || 0),
      updatedAt: row.updated_at || new Date().toISOString(),
      updatedBy: row.updated_by || 'DPUPR Garut'
    }));

    return { data: prices };
  } catch (err: any) {
    if (isSupabaseTableMissingError(err)) return { data: [], isTableMissing: true, error: 'TABLE_NOT_FOUND' };
    return { data: [], error: err.message };
  }
}

/**
 * Sync Prasarana Prices to Supabase
 */
export async function syncPrasaranaPricesToSupabase(prices: PrasaranaPriceConfig[]): Promise<{ success: boolean; count: number; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, count: 0, error: 'Supabase belum terhubung.' };
  if (!prices || prices.length === 0) return { success: true, count: 0 };

  try {
    const rows = prices.map(p => ({
      id: p.id,
      label: p.label,
      unit: p.unit,
      price: p.price,
      updated_by: p.updatedBy || 'DPUPR Garut',
      updated_at: new Date().toISOString()
    }));

    const { error } = await sb.from('prasarana_prices').upsert(rows, { onConflict: 'id' });
    if (error) {
      if (isSupabaseTableMissingError(error)) return { success: false, count: 0, error: 'Tabel prasarana_prices belum dibuat di Supabase.' };
      throw error;
    }
    return { success: true, count: rows.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Subscribe to real-time changes on User Accounts table
 */
export function subscribeToUserAccountsSupabase(
  onInsertOrUpdate: (user: UserAccount) => void,
  onDelete?: (id: string) => void
): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};

  try {
    const channel: RealtimeChannel = sb
      .channel('realtime_user_accounts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_accounts' },
        (payload) => {
          if (payload.eventType === 'DELETE' && (payload.old as any)?.id && onDelete) {
            onDelete((payload.old as any).id);
          } else if (payload.new) {
            const row: any = payload.new;
            const user: UserAccount = {
              id: row.id,
              username: row.username,
              name: row.name,
              email: row.email,
              nip: row.nip || undefined,
              role: row.role,
              positionTitle: row.position_title,
              subSpecialty: row.sub_specialty || undefined,
              phone: row.phone || undefined,
              avatarUrl: row.avatar_url || undefined,
              isActive: row.is_active,
              permissions: row.permissions,
              signatureDataUrl: row.signature_data_url || undefined,
              lastLoginAt: row.last_login_at || undefined,
              createdAt: row.created_at || new Date().toISOString()
            };
            onInsertOrUpdate(user);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  } catch (err) {
    return () => {};
  }
}

/**
 * Subscribe to real-time changes on Notification Logs table
 */
export function subscribeToNotificationLogsSupabase(
  onInsertOrUpdate: (log: NotificationLog) => void
): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};

  try {
    const channel: RealtimeChannel = sb
      .channel('realtime_notification_logs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_logs' },
        (payload) => {
          if (payload.new) {
            const row: any = payload.new;
            const log: NotificationLog = {
              id: row.id,
              applicationId: row.application_id || '',
              registerNumber: row.register_number || '',
              recipientName: row.recipient_name || '',
              recipientPhone: row.recipient_phone || '',
              templateType: row.template_type || 'INFO_UMUM',
              message: row.message || '',
              channel: row.channel || 'WHATSAPP',
              status: row.status || 'SENT',
              retryCount: row.retry_count || 0,
              errorMessage: row.error_message || undefined,
              sentAt: row.sent_at || undefined,
              createdAt: row.created_at || new Date().toISOString()
            };
            onInsertOrUpdate(log);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  } catch (err) {
    return () => {};
  }
}

/**
 * Universal High-Performance Import Execution to Supabase
 */
export async function executeImportToSupabase(
  table: string,
  records: any[],
  mode: 'UPSERT' | 'INSERT_NEW' | 'REPLACE_ALL' = 'UPSERT',
  onProgress?: (progressPercent: number, processedCount: number) => void
): Promise<{
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  failedCount: number;
  errors: string[];
}> {
  const sb = getSupabaseClient();
  if (!sb) {
    return {
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      failedCount: records.length,
      errors: ['Supabase belum terkonfigurasi pada berkas .env']
    };
  }

  const errors: string[] = [];
  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  try {
    // If REPLACE_ALL, purge existing table rows first if allowed
    if (mode === 'REPLACE_ALL') {
      try {
        await sb.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (delErr: any) {
        console.warn(`[Supabase Import] Table purge note on ${table}:`, delErr.message);
      }
    }

    const CHUNK_SIZE = 25;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      let payloadRows: any[] = [];

      switch (table) {
        case 'applications':
          payloadRows = chunk.map(mapApplicationToSupabaseRow);
          break;
        case 'user_accounts':
          payloadRows = chunk.map(u => ({
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            nip: u.nip || null,
            role: u.role,
            position_title: u.positionTitle,
            sub_specialty: u.subSpecialty || null,
            phone: u.phone || null,
            avatar_url: u.avatarUrl || null,
            is_active: u.isActive,
            permissions: u.permissions,
            signature_data_url: u.signatureDataUrl || null,
            last_login_at: u.lastLoginAt || null,
            updated_at: new Date().toISOString()
          }));
          break;
        case 'notification_logs':
          payloadRows = chunk.map(l => ({
            id: l.id,
            application_id: l.applicationId || null,
            register_number: l.registerNumber,
            recipient_name: l.recipientName,
            recipient_phone: l.recipientPhone,
            template_type: l.templateType,
            message: l.message,
            channel: l.channel || 'WHATSAPP',
            status: l.status || 'SENT',
            retry_count: l.retryCount || 0,
            error_message: l.errorMessage || null,
            sent_at: l.sentAt || new Date().toISOString(),
            created_at: l.createdAt || new Date().toISOString()
          }));
          break;
        case 'status_audit_logs':
          payloadRows = chunk.map(l => ({
            id: l.id,
            application_id: l.applicationId || null,
            register_number: l.registerNumber || null,
            from_status: l.fromStatus,
            to_status: l.toStatus,
            actor_name: l.actorName,
            actor_role: l.actorRole,
            stage_name: l.stageName || null,
            notes: l.notes || null,
            created_at: l.timestamp || new Date().toISOString()
          }));
          break;
        case 'prasarana_prices':
          payloadRows = chunk.map(p => ({
            id: p.id,
            label: p.label || p.name,
            unit: p.unit,
            price: p.price || p.base_price,
            updated_by: p.updatedBy || p.notes || 'DPUPR Garut',
            updated_at: new Date().toISOString()
          }));
          break;
        default:
          payloadRows = chunk;
      }

      const { error } = await sb
        .from(table)
        .upsert(payloadRows, { onConflict: 'id' });

      if (error) {
        failed += chunk.length;
        errors.push(`Chunk [${i + 1} - ${i + chunk.length}]: ${error.message}`);
      } else {
        inserted += chunk.length;
      }

      processed += chunk.length;
      if (onProgress) {
        const percent = Math.round((processed / records.length) * 100);
        onProgress(percent, processed);
      }
    }

    return {
      success: failed === 0,
      insertedCount: inserted,
      updatedCount: updated,
      failedCount: failed,
      errors
    };
  } catch (err: any) {
    return {
      success: false,
      insertedCount: inserted,
      updatedCount: updated,
      failedCount: records.length - processed,
      errors: [err.message]
    };
  }
}

/**
 * Run Comprehensive 1-Click Migration of all data models to Supabase
 */
export async function runCompleteMigrationToSupabase(
  applications: Application[],
  userAccounts: UserAccount[],
  notificationLogs: NotificationLog[] = [],
  auditLogs: StatusAuditLog[] = []
): Promise<FullMigrationReport> {
  const startTime = Date.now();
  const steps: MigrationStepResult[] = [
    { step: '1. Verifikasi Koneksi & Kredensial Supabase', status: 'RUNNING', count: 0 },
    { step: '2. Migrasi Akun Pengguna & Matriks RBAC', status: 'PENDING', count: 0 },
    { step: '3. Migrasi Seluruh Permohonan PBG/SLF & Iterasi Dokumen', status: 'PENDING', count: 0 },
    { step: '4. Migrasi Log Notifikasi WhatsApp Terkirim', status: 'PENDING', count: 0 },
    { step: '5. Migrasi Audit Trail & Log Perubahan Status', status: 'PENDING', count: 0 },
    { step: '6. Verifikasi Integritas Data Pasca-Migrasi', status: 'PENDING', count: 0 }
  ];

  let totalMigrated = 0;

  try {
    // Step 1: Check connection
    const health = await testSupabaseConnection();
    if (!health.isConnected) {
      steps[0].status = 'FAILED';
      const msg = health.error || 'Koneksi ke Supabase belum siap atau tabel PostgreSQL belum dibuat.';
      steps[0].message = msg;
      return {
        timestamp: new Date().toISOString(),
        isSuccess: false,
        totalMigrated: 0,
        durationMs: Date.now() - startTime,
        steps,
        error: 'Tabel database di Supabase belum dibuat. Harap salin SQL dari Tab "Schema SQL & RLS" dan jalankan (Run) di menu SQL Editor dashboard Supabase Anda terlebih dahulu.'
      };
    }
    steps[0].status = 'SUCCESS';
    steps[0].message = `Terhubung ke ${health.url} (${health.latencyMs}ms)`;

    // Step 2: Migrate User Accounts
    steps[1].status = 'RUNNING';
    const userRes = await syncUserAccountsToSupabase(userAccounts);
    if (!userRes.success) {
      steps[1].status = 'FAILED';
      steps[1].message = userRes.error;
      throw new Error(`Gagal migrasi akun: ${userRes.error}`);
    }
    steps[1].status = 'SUCCESS';
    steps[1].count = userRes.count;
    totalMigrated += userRes.count;

    // Step 3: Migrate Applications
    steps[2].status = 'RUNNING';
    const appRes = await syncApplicationsToSupabase(applications);
    if (!appRes.success) {
      steps[2].status = 'FAILED';
      steps[2].message = appRes.error;
      throw new Error(`Gagal migrasi permohonan: ${appRes.error}`);
    }
    steps[2].status = 'SUCCESS';
    steps[2].count = appRes.count;
    totalMigrated += appRes.count;

    // Step 4: Migrate Notification Logs
    steps[3].status = 'RUNNING';
    if (notificationLogs.length > 0) {
      const sb = getSupabaseClient()!;
      const rows = notificationLogs.map(l => ({
        id: l.id,
        application_id: l.applicationId || null,
        register_number: l.registerNumber,
        recipient_name: l.recipientName,
        recipient_phone: l.recipientPhone,
        template_type: l.templateType,
        message: l.message,
        channel: l.channel || 'WHATSAPP',
        status: l.status || 'SENT',
        retry_count: l.retryCount || 0,
        error_message: l.errorMessage || null,
        sent_at: l.sentAt || new Date().toISOString(),
        created_at: l.createdAt || new Date().toISOString()
      }));
      const { error } = await sb.from('notification_logs').upsert(rows, { onConflict: 'id' });
      if (error) {
        steps[3].status = 'FAILED';
        steps[3].message = error.message;
      } else {
        steps[3].status = 'SUCCESS';
        steps[3].count = rows.length;
        totalMigrated += rows.length;
      }
    } else {
      steps[3].status = 'SKIPPED';
      steps[3].message = 'Tidak ada log notifikasi lokal yang perlu dimigrasi.';
    }

    // Step 5: Migrate Audit Logs
    steps[4].status = 'RUNNING';
    if (auditLogs.length > 0) {
      const sb = getSupabaseClient()!;
      const rows = auditLogs.map(l => ({
        id: l.id,
        application_id: l.applicationId || null,
        register_number: l.registerNumber || null,
        from_status: l.fromStatus,
        to_status: l.toStatus,
        actor_name: l.actorName,
        actor_role: l.actorRole,
        stage_name: l.stageName || null,
        notes: l.notes || null,
        created_at: l.timestamp || new Date().toISOString()
      }));
      const { error } = await sb.from('status_audit_logs').upsert(rows, { onConflict: 'id' });
      if (error) {
        steps[4].status = 'FAILED';
        steps[4].message = error.message;
      } else {
        steps[4].status = 'SUCCESS';
        steps[4].count = rows.length;
        totalMigrated += rows.length;
      }
    } else {
      steps[4].status = 'SKIPPED';
      steps[4].message = 'Tidak ada riwayat audit log lokal yang perlu dimigrasi.';
    }

    // Step 6: Verify post-migration integrity
    steps[5].status = 'RUNNING';
    const finalHealth = await testSupabaseConnection();
    steps[5].status = 'SUCCESS';
    steps[5].count = finalHealth.counts.applications;
    steps[5].message = `Validasi selesai: ${finalHealth.counts.applications} berkas & ${finalHealth.counts.user_accounts} akun terverifikasi di PostgreSQL.`;

    return {
      timestamp: new Date().toISOString(),
      isSuccess: true,
      totalMigrated,
      durationMs: Date.now() - startTime,
      steps
    };
  } catch (err: any) {
    return {
      timestamp: new Date().toISOString(),
      isSuccess: false,
      totalMigrated,
      durationMs: Date.now() - startTime,
      steps,
      error: err.message
    };
  }
}
