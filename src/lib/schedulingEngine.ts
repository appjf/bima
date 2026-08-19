import { Application, ConsultationSchedule } from '../types';

export const MASTER_ROOMS = [
  'Ruang Sidang TPA Utama (Gedung DPUPR Lt. 2)',
  'Ruang Konsultasi Teknis 1 (DPUPR Lt. 1)',
  'Ruang Rapat Bidang Bangunan (DPUPR Lt. 2)',
  'Ruang Mediasi & Asistensi SIMBG (DPUPR Lt. 1)'
];

export const MASTER_EXPERTS = [
  { name: 'Dr. Ir. H. Hendra Setiawan, MT, IAI', expertise: 'Arsitektur & Tata Ruang', role: 'KETUA' as const },
  { name: 'Ir. Ahmad Fauzi, ST, MT, IPM', expertise: 'Struktur & Geoteknik', role: 'ANGGOTA' as const },
  { name: 'Rian Pratama, ST, M.Eng', expertise: 'Mekanikal, Elektrikal & Proteksi Kebakaran', role: 'ANGGOTA' as const },
  { name: 'Novi Andriani, ST, M.Si', expertise: 'Kesehatan Lingkungan & Sanitasi', role: 'ANGGOTA' as const },
  { name: 'Dedi Kurniawan, S.AP', expertise: 'Sekretariat SIMBG Garut', role: 'SEKRETARIAT' as const }
];

export const TIME_SLOTS = [
  '08:30 - 09:15 WIB',
  '09:15 - 10:00 WIB',
  '10:00 - 10:45 WIB',
  '10:45 - 11:30 WIB',
  '13:30 - 14:15 WIB',
  '14:15 - 15:00 WIB',
  '15:00 - 15:45 WIB'
];

/**
 * Returns next Friday date string (YYYY-MM-DD)
 */
export function getNextFridayDate(): string {
  const d = new Date();
  const day = d.getDay();
  // 5 is Friday
  const diff = (5 - day + 7) % 7 || 7;
  const nextFriday = new Date(d);
  nextFriday.setDate(d.getDate() + diff);
  return nextFriday.toISOString().split('T')[0];
}

export function generateSmartSchedule(
  applications: Application[],
  targetDate?: string,
  startSlotIndex: number = 0
): { app: Application; schedule: ConsultationSchedule }[] {
  const fridayDate = targetDate || getNextFridayDate();
  const readyApps = applications.filter(
    a => a.status === 'COMPLETE' || a.status === 'READY_FOR_CONSULTATION'
  );

  const results: { app: Application; schedule: ConsultationSchedule }[] = [];

  readyApps.forEach((app, index) => {
    const slotIdx = (startSlotIndex + index) % TIME_SLOTS.length;
    const roomIdx = Math.floor((startSlotIndex + index) / TIME_SLOTS.length) % MASTER_ROOMS.length;
    const timeSlot = TIME_SLOTS[slotIdx];
    const room = MASTER_ROOMS[roomIdx];
    
    // Choose TPA for complex/large buildings, TPT for simpler buildings
    const sessionType = (app.building.complexity === 'SEDERHANA' && app.building.floors <= 2)
      ? 'KONSULTASI_TPT'
      : 'SIDANG_TPA';

    const token = `QR-ATT-${app.id.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString(36).toUpperCase()}`;

    const schedule: ConsultationSchedule = {
      id: `SCH-${app.id}-${Date.now().toString().slice(-4)}`,
      scheduleDate: fridayDate,
      timeSlot,
      room,
      sessionType,
      assignedExperts: MASTER_EXPERTS.slice(0, sessionType === 'SIDANG_TPA' ? 5 : 3),
      attendanceToken: token,
      applicantAttended: false,
      consultationResult: undefined
    };

    results.push({ app, schedule });
  });

  return results;
}
