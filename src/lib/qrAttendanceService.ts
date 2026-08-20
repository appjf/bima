import QRCode from 'qrcode';
import { Application, ConsultationSchedule } from '../types';

export interface AttendanceQrPayload {
  version: string;
  type: 'PRESENSI_SIDANG_TPA_TPT' | 'PRESENSI_VISITE_LAPANGAN' | 'DAFTAR_HADIR';
  appId: string;
  registerNumber: string;
  applicantName: string;
  buildingName: string;
  scheduleDate: string;
  timeSlot: string;
  room: string;
  token: string;
  verificationUrl: string;
  generatedAt: string;
  hashSignature: string;
}

export interface AttendanceVerificationResult {
  isValid: boolean;
  message: string;
  payload?: AttendanceQrPayload;
  scannedAt: string;
}

/**
 * Creates a structured attendance QR payload object for a consultation event / meeting.
 */
export function buildAttendanceQrPayload(app: Application): AttendanceQrPayload {
  const schedule = app.schedule || {
    id: `SCH-${app.id}`,
    scheduleDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:00 - 10:00 WIB',
    room: 'Ruang Sidang DPUPR Garut',
    sessionType: 'SIDANG_TPA',
    assignedExperts: [{ name: 'TPA Garut', expertise: 'Arsitektur', role: 'ANGGOTA' }],
    applicantAttended: false,
    attendanceToken: `TOK-${app.registerNumber}-${Date.now().toString(36).toUpperCase()}`
  };

  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://simbg.garutkab.go.id';
  const token = schedule.attendanceToken || `TOK-${app.registerNumber}-${Date.now().toString(36).toUpperCase()}`;
  const verificationUrl = `${origin}/?mode=attendance&reg=${encodeURIComponent(app.registerNumber)}&tok=${token}`;
  
  // Simple checksum for authenticity check
  const hashSignature = `GARUT-PRESENSI-${app.registerNumber}-${token.slice(-6)}`;

  return {
    version: '1.0-SIMBG-PRESENSI',
    type: 'PRESENSI_SIDANG_TPA_TPT',
    appId: app.id,
    registerNumber: app.registerNumber,
    applicantName: app.applicant.name,
    buildingName: app.building.name,
    scheduleDate: schedule.scheduleDate,
    timeSlot: schedule.timeSlot,
    room: schedule.room,
    token,
    verificationUrl,
    generatedAt: new Date().toISOString(),
    hashSignature
  };
}

/**
 * Generates a PNG Data URL for a given text or object payload.
 */
export async function generateQrDataUrl(
  content: string | AttendanceQrPayload,
  options: { width?: number; margin?: number; colorDark?: string; colorLight?: string } = {}
): Promise<string> {
  const stringContent = typeof content === 'string' ? content : JSON.stringify(content);

  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    width: options.width || 300,
    margin: options.margin !== undefined ? options.margin : 2,
    color: {
      dark: options.colorDark || '#0f172a', // slate-900 high contrast
      light: options.colorLight || '#ffffff'
    },
    errorCorrectionLevel: 'M'
  };

  try {
    return await QRCode.toDataURL(stringContent, qrOptions);
  } catch (err) {
    console.error('Failed to generate QR Data URL:', err);
    throw new Error('Gagal mendatangkan QR Code presensi');
  }
}

/**
 * Generates an SVG string representation of the QR code for scalable rendering.
 */
export async function generateQrSvgString(
  content: string | AttendanceQrPayload,
  options: { width?: number; margin?: number } = {}
): Promise<string> {
  const stringContent = typeof content === 'string' ? content : JSON.stringify(content);

  try {
    return await QRCode.toString(stringContent, {
      type: 'svg',
      width: options.width || 250,
      margin: options.margin !== undefined ? options.margin : 2,
      color: {
        dark: '#020617',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR SVG:', err);
    throw new Error('Gagal mendatangkan SVG QR Code');
  }
}

/**
 * Validates and verifies a scanned QR code text payload.
 */
export function parseAndVerifyAttendanceQr(scannedString: string): AttendanceVerificationResult {
  const nowISO = new Date().toISOString();

  if (!scannedString || scannedString.trim().length === 0) {
    return {
      isValid: false,
      message: 'Kode QR kosong atau tidak dapat dibaca.',
      scannedAt: nowISO
    };
  }

  try {
    // Check if JSON
    let parsed: any;
    if (scannedString.startsWith('{') && scannedString.endsWith('}')) {
      parsed = JSON.parse(scannedString);
    } else {
      // Check if URL or plain token string
      if (scannedString.includes('simbg.garutkab.go.id') || scannedString.startsWith('TOK-') || scannedString.startsWith('GARUT-')) {
        return {
          isValid: true,
          message: 'Token Presensi Valid (Sistem SIMBG Kab. Garut).',
          scannedAt: nowISO
        };
      }
      return {
        isValid: false,
        message: 'Format QR Code tidak dikenali sebagai Token Presensi SIMBG Garut.',
        scannedAt: nowISO
      };
    }

    if (parsed.hashSignature && parsed.hashSignature.startsWith('GARUT-PRESENSI-')) {
      return {
        isValid: true,
        message: `Presensi Terverifikasi! Pemohon: ${parsed.applicantName || 'Pemohon'} [${parsed.registerNumber}]`,
        payload: parsed as AttendanceQrPayload,
        scannedAt: nowISO
      };
    }

    return {
      isValid: false,
      message: 'Signature QR Code tidak valid atau bukan diterbitkan oleh DPUPR Garut.',
      scannedAt: nowISO
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Gagal memproses data QR Code.',
      scannedAt: nowISO
    };
  }
}
