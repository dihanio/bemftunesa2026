import * as crypto from 'crypto';

/**
 * Generate a short-lived QR token.
 * Format: base64( meetingId + ':' + timestamp_30s_window + ':' + hmac )
 * Token is valid only within its 30-second window.
 */
export function generateQrToken(meetingId: string, secret: string): string {
  const window = Math.floor(Date.now() / 30000); // 30s window
  const payload = `${meetingId}:${window}`;
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .slice(0, 12); // short signature
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export function verifyQrToken(
  token: string,
  meetingId: string,
  secret: string,
): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [tMeetingId, tWindow, tHmac] = parts;
    if (tMeetingId !== meetingId) return false;

    const currentWindow = Math.floor(Date.now() / 30000);
    // Accept current window and 1 window before (grace period)
    const validWindows = [currentWindow, currentWindow - 1];
    if (!validWindows.includes(Number(tWindow))) return false;

    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${tMeetingId}:${tWindow}`)
      .digest('hex')
      .slice(0, 12);
    return tHmac === expectedHmac;
  } catch {
    return false;
  }
}

/** Haversine formula — returns distance in meters */
export function getDistanceInMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
