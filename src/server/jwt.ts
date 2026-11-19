import jwt from 'jsonwebtoken';

export const JWT_ISSUER = 'fluffy-days';
export const JWT_AUDIENCE = 'fluffy-days-app';
export const JWT_ALGORITHM = 'HS256' as const;
export const ACCESS_TOKEN_TTL = '7d';
export const MIN_JWT_SECRET_LENGTH = 32;

const PLACEHOLDER_SECRETS = new Set(['MY_JWT_SECRET']);

export interface AccessTokenClaims {
  userId: string;
}

// Reads and validates JWT_SECRET. Throws so the server refuses to start with a
// missing, placeholder, or weak key instead of silently issuing forgeable tokens.
export function loadJwtSecret(env: Record<string, string | undefined> = process.env): string {
  const secret = env.JWT_SECRET?.trim();
  if (!secret || PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET is not configured. Set it in .env (local) or the AI Studio Secrets panel (deploy). ' +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
    );
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`);
  }
  return secret;
}

export function signAccessToken(userId: string, secret: string): string {
  return jwt.sign({}, secret, {
    algorithm: JWT_ALGORITHM,
    subject: userId,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: ACCESS_TOKEN_TTL
  });
}

// Returns the claims for a valid token, or null for any invalid, expired,
// forged, or malformed token. Algorithm is pinned to block alg=none / confusion.
export function verifyAccessToken(token: string, secret: string): AccessTokenClaims | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string' || payload.sub.length === 0) {
      return null;
    }
    return { userId: payload.sub };
  } catch {
    return null;
  }
}
