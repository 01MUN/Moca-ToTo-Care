import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, MAX_PASSWORD_BYTES } from './password';

describe('hashPassword', () => {
  it('produces a bcrypt hash that is not the plaintext', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('salts each hash so the same password hashes differently', async () => {
    const [a, b] = await Promise.all([hashPassword('password123'), hashPassword('password123')]);
    expect(a).not.toBe(b);
  });

  it('rejects passwords longer than the bcrypt byte limit', async () => {
    await expect(hashPassword('a'.repeat(MAX_PASSWORD_BYTES + 1))).rejects.toThrow();
  });
});

describe('verifyPassword', () => {
  it('accepts the correct password', async () => {
    const hash = await hashPassword('password123');
    expect(await verifyPassword('password123', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('password123');
    expect(await verifyPassword('password124', hash)).toBe(false);
  });

  it('handles non-ASCII (Korean) passwords', async () => {
    const hash = await hashPassword('모카토토사랑해');
    expect(await verifyPassword('모카토토사랑해', hash)).toBe(true);
    expect(await verifyPassword('모카토토사랑', hash)).toBe(false);
  });

  it('returns false (not throws) for a plaintext or malformed stored hash', async () => {
    expect(await verifyPassword('password123', 'password123')).toBe(false);
    expect(await verifyPassword('password123', '')).toBe(false);
  });
});
