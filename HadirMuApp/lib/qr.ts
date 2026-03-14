const QR_SECRET = process.env.EXPO_PUBLIC_QR_SECRET ?? 'HADIRMUPROD2026SECRET';
const QR_REFRESH_SECONDS = 30;

/**
 * Generate QR payload — Format Web: HADIR_SESSION_{timestamp}_{secret}_{sessionName}
 */
export function generateQRPayload(teacherId: string, classId: string): string {
  const currentTimestamp = Math.floor(Date.now() / (QR_REFRESH_SECONDS * 1000));
  return `HADIR_SESSION_${currentTimestamp}_${QR_SECRET}_${classId}`;
}

/**
 * Validate QR payload — Cek format & window tolerance (±1)
 */
export function validateQRPayload(payload: string): {
  valid: boolean;
  classId?: string;
} {
  try {
    const parts = payload.split('_');
    if (parts.length < 4 || parts[0] !== 'HADIR' || parts[1] !== 'SESSION') {
      return { valid: false };
    }

    const scannedTimestamp = parseInt(parts[2]);
    const scannedSecret = parts[3];
    const classId = parts.length >= 5 ? parts.slice(4).join('_') : 'DEFAULT';

    // 1. Validasi Secret
    if (scannedSecret !== QR_SECRET) {
      return { valid: false };
    }

    // 2. Validasi Window (±1 window tolerance)
    const currentTimestamp = Math.floor(Date.now() / (QR_REFRESH_SECONDS * 1000));
    if (Math.abs(scannedTimestamp - currentTimestamp) > 1) {
      return { valid: false };
    }

    return { valid: true, classId };
  } catch {
    return { valid: false };
  }
}

/** Seberapa detik hingga QR code berikutnya */
export function secondsUntilNextQR(): number {
  const now = Math.floor(Date.now() / 1000);
  return QR_REFRESH_SECONDS - (now % QR_REFRESH_SECONDS);
}
