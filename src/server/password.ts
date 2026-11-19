import { compare, hash } from 'bcryptjs';

export const BCRYPT_COST = 10;
// bcrypt silently truncates input beyond 72 bytes; reject instead of truncating.
export const MAX_PASSWORD_BYTES = 72;

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;

export function passwordByteLength(plain: string): number {
  return Buffer.byteLength(plain, 'utf8');
}

export async function hashPassword(plain: string): Promise<string> {
  if (passwordByteLength(plain) > MAX_PASSWORD_BYTES) {
    throw new Error(`Password exceeds ${MAX_PASSWORD_BYTES} bytes.`);
  }
  return hash(plain, BCRYPT_COST);
}

// Returns false for a wrong password or a stored value that is not a bcrypt hash.
export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!BCRYPT_HASH_PATTERN.test(storedHash)) return false;
  return compare(plain, storedHash);
}
