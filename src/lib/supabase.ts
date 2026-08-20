import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
  latencyMs: number;
  url: string;
  tablesFound: string[];
  error?: string;
  lastCheckedAt: string;
}

/**
 * Test connectivity and table presence in Supabase
 */
export async function testSupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  const result: SupabaseHealthCheckResult = {
    isConfigured: isSupabaseConfigured,
    isConnected: false,
    latencyMs: 0,
    url: supabaseUrl ? supabaseUrl.replace(/https:\/\/(.*)\.supabase\.co.*/, 'https://$1.supabase.co') : 'Belum Dikonfigurasi',
    tablesFound: [],
    lastCheckedAt: new Date().toISOString()
  };

  if (!isSupabaseConfigured) {
    result.error = 'Kredensial VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diatur pada file .env.';
    return result;
  }

  const sb = getSupabaseClient();
  if (!sb) {
    result.error = 'Inisialisasi Supabase SDK gagal.';
    return result;
  }

  const startTime = Date.now();

  try {
    // Attempt pinging applications table
    const { data: appData, error: appErr } = await sb
      .from('applications')
      .select('id')
      .limit(1);

    result.latencyMs = Date.now() - startTime;

    if (!appErr) {
      result.isConnected = true;
      result.tablesFound.push('applications');
    }

    // Check user_accounts table
    const { error: userErr } = await sb
      .from('user_accounts')
      .select('id')
      .limit(1);
    if (!userErr) result.tablesFound.push('user_accounts');

    // Check notification_logs table
    const { error: notifErr } = await sb
      .from('notification_logs')
      .select('id')
      .limit(1);
    if (!notifErr) result.tablesFound.push('notification_logs');

    if (appErr && userErr && notifErr) {
      result.error = `Terkoneksi ke Supabase, namun tabel belum dibuat: ${appErr.message}`;
    }
  } catch (err: any) {
    result.error = err?.message || 'Gagal menghubungi server Supabase.';
  }

  return result;
}

/**
 * Synchronize applications list to Supabase
 */
export async function syncApplicationsToSupabase(applications: Application[]): Promise<{ success: boolean; count: number; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { success: false, count: 0, error: 'Supabase belum terhubung.' };
  }

  try {
    const formattedData = applications.map(app => ({
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
      documents: app.documents,
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
    }));

    const { error } = await sb
      .from('applications')
      .upsert(formattedData, { onConflict: 'id' });

    if (error) throw error;
    return { success: true, count: formattedData.length };
  } catch (err: any) {
    console.error('Error syncing applications to Supabase:', err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Sync User Accounts to Supabase
 */
export async function syncUserAccountsToSupabase(users: UserAccount[]): Promise<{ success: boolean; count: number; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, count: 0, error: 'Supabase belum terhubung.' };

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
      last_login_at: u.lastLoginAt || null
    }));

    const { error } = await sb
      .from('user_accounts')
      .upsert(formattedUsers, { onConflict: 'id' });

    if (error) throw error;
    return { success: true, count: formattedUsers.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}
