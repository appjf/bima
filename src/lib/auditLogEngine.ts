import { Application, ApplicationStatus, StatusAuditLog } from '../types';

export interface PrintAuditLog {
  id: string;
  timestamp: string;
  documentType: string; // e.g., 'SKRD_PDF', 'SKRD_PRINT'
  registerNumber: string;
  operatorName: string;
  operatorNip: string;
}

const PRINT_LOGS_STORAGE_KEY = 'simbg_garut_print_audit_logs';

export const logPrintAction = (
  documentType: string,
  registerNumber: string,
  operatorName: string = 'H. Irwan Kurnia, S.ST',
  operatorNip: string = '19880512 201101 1 003'
) => {
  try {
    const existingRaw = localStorage.getItem(PRINT_LOGS_STORAGE_KEY);
    const existingLogs: PrintAuditLog[] = existingRaw ? JSON.parse(existingRaw) : [];
    
    const newLog: PrintAuditLog = {
      id: `prt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      documentType,
      registerNumber,
      operatorName,
      operatorNip
    };
    
    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem(PRINT_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
    
    // Also dispatch an event so UI can update if viewing logs
    window.dispatchEvent(new CustomEvent('print-audit-log-updated'));
    
    console.log(`[AUDIT LOG] ${documentType} generated for ${registerNumber} by ${operatorName} (${operatorNip})`);
  } catch (err) {
    console.error('Failed to save print audit log', err);
  }
};

export const getPrintAuditLogs = (): PrintAuditLog[] => {
  try {
    const raw = localStorage.getItem(PRINT_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
};

/**
 * Creates a status change audit log entry and appends it to the application object.
 */
export const logStatusChange = (
  app: Application,
  toStatus: ApplicationStatus,
  actorName: string = 'H. Irwan Kurnia, S.ST',
  actorRole: string = 'OPERATOR TEKNIS',
  notes?: string,
  stageName?: string
): Application => {
  const now = new Date().toISOString();
  
  const newLogEntry: StatusAuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: now,
    fromStatus: app.status,
    toStatus,
    actorName,
    actorRole,
    notes: notes || `Perubahan status permohonan dari ${app.status} menjadi ${toStatus}.`,
    stageName: stageName || app.currentStage
  };

  const existingLogs = app.statusAuditLogs || [];
  
  return {
    ...app,
    status: toStatus,
    lastUpdated: now,
    statusAuditLogs: [newLogEntry, ...existingLogs]
  };
};

/**
 * Ensures initial default audit log entries exist for mock/initial applications.
 */
export const ensureInitialAuditLogs = (app: Application): Application => {
  if (app.statusAuditLogs && app.statusAuditLogs.length > 0) {
    return app;
  }

  const creationTime = new Date(app.submissionDate || Date.now() - 86400000 * 3).toISOString();
  const updateTime = new Date(app.lastUpdated || Date.now()).toISOString();

  const initialLogs: StatusAuditLog[] = [
    {
      id: `log-init-2-${app.id}`,
      timestamp: updateTime,
      fromStatus: 'NEW',
      toStatus: app.status,
      actorName: app.assignedOperator || 'H. Irwan Kurnia, S.ST',
      actorRole: 'OPERATOR TEKNIS',
      notes: `Permohonan diproses ke tahap ${app.status}. Verifikasi dokumen kelengkapan berlangsung.`,
      stageName: app.currentStage
    },
    {
      id: `log-init-1-${app.id}`,
      timestamp: creationTime,
      fromStatus: 'INITIAL_SUBMISSION',
      toStatus: 'NEW',
      actorName: app.applicant?.name || 'Pemohon SIMBG',
      actorRole: 'PEMOHON',
      notes: `Pendaftaran permohonan SIMBG dengan No. Register ${app.registerNumber} berhasil diterima sistem.`,
      stageName: 'STAGE_1_INPUT_DATA'
    }
  ];

  return {
    ...app,
    statusAuditLogs: initialLogs
  };
};

/**
 * Format status labels into readable Indonesian text
 */
export const getStatusIndonesianLabel = (status: ApplicationStatus | string): string => {
  const labels: Record<string, string> = {
    'NEW': 'Baru Masuk (Antrean)',
    'UNDER_VERIFICATION': 'Dalam Verifikasi Dokumen',
    'INCOMPLETE': 'Dokumen Belum Lengkap',
    'REVISION_REQUESTED': 'Perlu Perbaikan Pemohon',
    'REVERIFICATION': 'Verifikasi Ulang Perbaikan',
    'COMPLETE': 'Dokumen Lengkap & Valid',
    'READY_FOR_CONSULTATION': 'Siap Penjadwalan Sidang',
    'SCHEDULED': 'Terjadwal Sidang TPA/TPT',
    'CONSULTATION_DONE': 'Sidang Konsultasi Selesai',
    'RETRIBUTION_READY': 'Perhitungan SKRD Siap',
    'COMPLETED': 'Penerbitan SKRD / Rekomtek Selesai',
    'CANCELLED': 'Dibatalkan Pemohon',
    'REJECTED': 'Permohonan Ditolak'
  };

  return labels[status] || status;
};
