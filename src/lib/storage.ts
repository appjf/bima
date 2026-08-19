import { Application, AuditLog, DataQualityIssue, NotificationLog, UserRole, WhatsAppSettings } from '../types';
import { INITIAL_APPLICATIONS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS } from '../data/initialData';
import { DEFAULT_WHATSAPP_SETTINGS } from './notificationTemplateEngine';
import { runDocumentVerification } from './ruleEngine';
import { calculateRetribution } from './retributionEngine';
import { generateSmartSchedule } from './schedulingEngine';

const STORAGE_KEYS = {
  APPLICATIONS: 'simbg_applications_v2',
  NOTIFICATIONS: 'simbg_notifications_v2',
  AUDIT_LOGS: 'simbg_audit_logs_v2',
  USER_ROLE: 'simbg_user_role_v2',
  OPERATOR_NAME: 'simbg_operator_name_v2',
  WA_SETTINGS: 'simbg_wa_settings_v2'
};

export function getStoredApplications(): Application[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored applications:', e);
  }
  return INITIAL_APPLICATIONS;
}

export function saveApplications(apps: Application[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save applications:', e);
  }
}
export const saveStoredApplications = saveApplications;

export function getStoredNotifications(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored notifications:', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifs: NotificationLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications:', e);
  }
}
export const saveStoredNotifications = saveNotifications;

export function getStoredAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stored audit logs:', e);
  }
  return INITIAL_AUDIT_LOGS;
}

export function addAuditLog(
  action: string,
  targetRegister: string,
  details: string,
  options?: {
    userId?: string;
    userName?: string;
    userRole?: UserRole;
    previousValue?: string;
    newValue?: string;
    targetId?: string;
  }
): void {
  const currentLogs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: `AUDIT-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }) + ' WIB',
    userId: options?.userId || 'usr-op-garut',
    userName: options?.userName || 'Operator SIMBG DPUPR',
    userRole: options?.userRole || 'OPERATOR_SIMBG',
    action,
    targetId: options?.targetId || targetRegister,
    targetRegister,
    details,
    previousValue: options?.previousValue,
    newValue: options?.newValue,
    ipSource: '10.20.45.12 (DPUPR Garut)'
  };
  const updated = [newLog, ...currentLogs];
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated.slice(0, 300)));
  } catch (e) {
    console.error('Failed to save audit log:', e);
  }
}

export function scanDataQualityIssues(apps: Application[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  const registerMap = new Map<string, number>();

  apps.forEach(app => {
    // Check duplicates
    const count = registerMap.get(app.registerNumber) || 0;
    registerMap.set(app.registerNumber, count + 1);
    if (count >= 1) {
      issues.push({
        id: `ISSUE-DUP-${app.id}`,
        applicationId: app.id,
        registerNumber: app.registerNumber,
        applicantName: app.applicant.name,
        field: 'registerNumber',
        issueType: 'DUPLICATE_REGISTER',
        rawSnippet: app.registerNumber,
        severity: 'CRITICAL',
        suggestion: 'Ubah nomor register agar unik dan tidak saling menimpa'
      });
    }

    // Check Phone formula errors
    if (app.applicant.phone.includes('#REF!') || app.applicant.phone.includes('#ERROR!') || app.applicant.phone.includes('#VALUE!')) {
      issues.push({
        id: `ISSUE-PHO-${app.id}`,
        applicationId: app.id,
        registerNumber: app.registerNumber,
        applicantName: app.applicant.name,
        field: 'applicant.phone',
        issueType: 'REF_ERROR',
        rawSnippet: app.applicant.phone,
        severity: 'CRITICAL',
        suggestion: 'Input nomor telepon manual (format 08xxxxxxxxxx)'
      });
    }

    // Check document errors
    app.documents.forEach(doc => {
      if (doc.hasErrorTag) {
        issues.push({
          id: `ISSUE-DOC-${doc.id}`,
          applicationId: app.id,
          registerNumber: app.registerNumber,
          applicantName: app.applicant.name,
          field: `document.${doc.name}`,
          issueType: 'ERROR_FORMULA',
          rawSnippet: doc.hasErrorTag,
          severity: 'WARNING',
          suggestion: `Periksa kembali tautan Google Drive / file referensi untuk dokumen ${doc.name}`
        });
      }
    });

    // Check suspicious area
    if (app.building.buildingArea <= 0 || app.building.buildingArea > 500000) {
      issues.push({
        id: `ISSUE-AREA-${app.id}`,
        applicationId: app.id,
        registerNumber: app.registerNumber,
        applicantName: app.applicant.name,
        field: 'building.buildingArea',
        issueType: 'SUSPICIOUS_AREA',
        rawSnippet: `${app.building.buildingArea} m²`,
        severity: 'WARNING',
        suggestion: 'Verifikasi kembali luas lantai bangunan terhadap berkas gambar rencana'
      });
    }
  });

  return issues;
}

export function autoFixQualityIssue(appId: string, issueType: string, fixedValue?: string): Application[] {
  const apps = getStoredApplications();
  const updated = apps.map(app => {
    if (app.id !== appId) return app;
    const clone = { ...app };

    if (issueType === 'REF_ERROR' || issueType === 'INVALID_PHONE') {
      clone.applicant = {
        ...clone.applicant,
        phone: fixedValue || '081234567890'
      };
      clone.dataErrors = clone.dataErrors.filter(e => !e.includes('#REF!') && !e.includes('telepon'));
      clone.dataQualityScore = 95;
    } else if (issueType === 'ERROR_FORMULA') {
      clone.documents = clone.documents.map(d => ({
        ...d,
        hasErrorTag: undefined,
        status: d.status === 'TIDAK_SESUAI' ? 'TERUNGGAH' : d.status
      }));
      clone.dataErrors = clone.dataErrors.filter(e => !e.includes('#REF!'));
      clone.dataQualityScore = 90;
    }

    return clone;
  });

  saveApplications(updated);
  addAuditLog('DATA_QUALITY_AUTOFIX', appId, `Melakukan auto-fix anomali data: ${issueType}`);
  return updated;
}

export function getStoredWhatsAppSettings(): WhatsAppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WA_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure any newly added default templates are also present if missing
      const existingIds = new Set((parsed.templates || []).map((t: any) => t.id));
      const mergedTemplates = [
        ...(parsed.templates || []),
        ...DEFAULT_WHATSAPP_SETTINGS.templates.filter(t => !existingIds.has(t.id))
      ];
      return {
        ...DEFAULT_WHATSAPP_SETTINGS,
        ...parsed,
        templates: mergedTemplates
      };
    }
  } catch (e) {
    console.error('Failed to load stored WhatsApp settings:', e);
  }
  return DEFAULT_WHATSAPP_SETTINGS;
}

export function saveStoredWhatsAppSettings(settings: WhatsAppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WA_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save WhatsApp settings:', e);
  }
}

export function resetStoredWhatsAppSettings(): WhatsAppSettings {
  try {
    localStorage.removeItem(STORAGE_KEYS.WA_SETTINGS);
  } catch (e) {
    console.error('Failed to reset WhatsApp settings:', e);
  }
  return DEFAULT_WHATSAPP_SETTINGS;
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  localStorage.removeItem(STORAGE_KEYS.WA_SETTINGS);
}

