import SHA256 from 'crypto-js/sha256';

export function generateDigitalTouristId(userId: string, timestamp: number): string {
  const hash = SHA256(`${userId}-${timestamp}`).toString();
  return `STAR-${hash.substring(0, 8).toUpperCase()}`;
}

export function hashIdData(idData: string): string {
  return SHA256(idData).toString();
}

export function generateQRCode(ticketId: string, monumentId: string, visitDate: string): string {
  const data = `${ticketId}-${monumentId}-${visitDate}`;
  return SHA256(data).toString().substring(0, 16).toUpperCase();
}

export function generateCouponCode(touristId: string, type: string): string {
  const hash = SHA256(`${touristId}-${type}-${Date.now()}`).toString();
  return `STAR-${type.toUpperCase()}-${hash.substring(0, 6).toUpperCase()}`;
}
