/**
 * Utility to standardize and format Surat Ketetapan Retribusi Daerah (SKRD)
 * to the mandated YYYYMMxxx format where:
 * - YYYY = Year SKRD diterbitkan / dihitung (4 digits)
 * - MM = Month SKRD diterbitkan / dihitung (2 digits)
 * - xxx = Sequential sequence number (3 digits)
 */
export function getSkrdStandardNumber(
  app: { 
    id: string; 
    registerNumber?: string; 
    submissionDate?: string; 
    retribution?: { 
      id?: string;
      calculatedAt?: string; 
      issuedAt?: string;
      paymentDate?: string;
    } 
  },
  customDate?: string | Date
): string {
  // 1. Determine SKRD Issuance / Calculation Date (Tahun dan Bulan SKRD Diterbitkan)
  let issueDate: Date | null = null;

  if (customDate) {
    issueDate = new Date(customDate);
  } else if (app?.retribution?.issuedAt) {
    issueDate = new Date(app.retribution.issuedAt);
  } else if (app?.retribution?.calculatedAt) {
    issueDate = new Date(app.retribution.calculatedAt);
  } else if (app?.retribution?.paymentDate) {
    issueDate = new Date(app.retribution.paymentDate);
  }

  // If no calculation/issuance date exists yet, fallback to current local date (time of issuance)
  if (!issueDate || isNaN(issueDate.getTime())) {
    issueDate = new Date();
  }

  const year = String(issueDate.getFullYear());
  const month = String(issueDate.getMonth() + 1).padStart(2, '0');

  // 2. Extract sequential sequence number (xxx)
  let seq = '';
  const regNum = app?.registerNumber || '';
  
  // Try matching any trailing hyphen-delimited number (e.g., "-001")
  const seqMatch = regNum.match(/-(\d+)$/);
  if (seqMatch) {
    seq = seqMatch[1].padStart(3, '0');
  } else {
    // Fallback: Generate a stable, deterministic 3-digit number from application ID
    let hash = 0;
    const cleanId = app?.id || '001';
    for (let i = 0; i < cleanId.length; i++) {
      hash = cleanId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const positiveHash = (Math.abs(hash) % 999) + 1; // 001 - 999 range
    seq = String(positiveHash).padStart(3, '0');
  }

  // Cap sequence number to 3 digits as required
  if (seq.length > 3) {
    seq = seq.slice(-3);
  } else if (seq.length < 3) {
    seq = seq.padStart(3, '0');
  }

  return `${year}${month}${seq}`;
}

