import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { loadJwtSecret, signAccessToken, verifyAccessToken, JWT_AUDIENCE, JWT_ISSUER } from './jwt';

const SECRET = 'test-secret-that-is-definitely-longer-than-32-chars';
const OTHER_SECRET = 'another-secret-that-is-also-longer-than-32-chars';

describe('loadJwtSecret', () => {
  it('returns the secret when it is long enough', () => {
    expect(loadJwtSecret({ JWT_SECRET: SECRET })).toBe(SECRET);
  });

  it('throws when JWT_SECRET is missing', () => {
    expect(() => loadJwtSecret({})).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    expect(() => loadJwtSecret({ JWT_SECRET: 'too-short' })).toThrow(/32/);
  });

  it('rejects the .env.example placeholder value', () => {
    expect(() => loadJwtSecret({ JWT_SECRET: 'MY_JWT_SECRET' })).toThrow();
  });
});

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips the user id', () => {
    const token = signAccessToken('u1', SECRET);
    expect(verifyAccessToken(token, SECRET)).toEqual({ userId: 'u1' });
  });

  it('produces a three-part HS256 JWT', () => {
    const token = signAccessToken('u1', SECRET);
    expect(token.split('.')).toHaveLength(3);
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(header.alg).toBe('HS256');
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAccessToken('u1', OTHER_SECRET);
    expect(verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({}, SECRET, {
      algorithm: 'HS256',
      subject: 'u1',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: -10
    });
    expect(verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects an unsigned alg=none token', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: 'u1', iss: JWT_ISSUER, aud: JWT_AUDIENCE, exp: Math.floor(Date.now() / 1000) + 3600 })
    ).toString('base64url');
    expect(verifyAccessToken(`${header}.${payload}.`, SECRET)).toBeNull();
  });

  it('rejects a token with the wrong audience', () => {
    const token = jwt.sign({}, SECRET, { algorithm: 'HS256', subject: 'u1', issuer: JWT_ISSUER, audience: 'other-app' });
    expect(verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects a token without a subject', () => {
    const token = jwt.sign({}, SECRET, { algorithm: 'HS256', issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
    expect(verifyAccessToken(token, SECRET)).toBeNull();
  });

  it('rejects the legacy fake token format', () => {
    expect(verifyAccessToken('token_u1_1700000000000', SECRET)).toBeNull();
    expect(verifyAccessToken('moca_mom@toto.com', SECRET)).toBeNull();
    expect(verifyAccessToken('', SECRET)).toBeNull();
  });
});
