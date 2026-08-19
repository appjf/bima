import { Application, ApplicationStatus, StatusAuditLog } from '../types';

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
