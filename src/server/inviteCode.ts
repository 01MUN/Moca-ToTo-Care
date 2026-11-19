import { randomInt } from 'node:crypto';

// 32 symbols without look-alikes (no 0/O, 1/I). 12 symbols ≈ 60 bits of entropy.
export const INVITE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GROUPS = 3;
const GROUP_LENGTH = 4;

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Unguessable family invite code, e.g. "K7QW-M3ZP-X9RD". crypto.randomInt is
// uniform (no modulo bias), unlike Math.random.
export function generateInviteCode(): string {
  const groups: string[] = [];
  for (let g = 0; g < GROUPS; g++) {
    let group = '';
    for (let i = 0; i < GROUP_LENGTH; i++) {
      group += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
    }
    groups.push(group);
  }
  return groups.join('-');
}

// Canonical form for lookups: trimmed, upper-case.
export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}
