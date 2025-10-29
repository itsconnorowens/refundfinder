/**
 * Generates a unique, professional claim ID
 * Format: FLY-YYYYMMDD-XXXX
 * Example: FLY-20251029-A7B3
 */
export function generateClaimId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Generate 4-character alphanumeric suffix
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `FLY-${dateStr}-${suffix}`;
}

/**
 * Validates claim ID format
 */
export function isValidClaimId(claimId: string): boolean {
  const regex = /^FLY-\d{8}-[A-Z0-9]{4}$/;
  return regex.test(claimId);
}
