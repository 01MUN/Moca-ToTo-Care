import type express from 'express';
import type { UserRecord } from './store';
import { verifyAccessToken } from './jwt';

const UNAUTHORIZED_MESSAGE = '인증이 필요합니다. 다시 로그인해주세요.';

// Routes reachable without a token. Everything else under /api/v1 requires a
// valid JWT (deny by default, so newly added routes are protected automatically).
// Paths are relative to the /api/v1 mount point.
const PUBLIC_ROUTES: ReadonlyArray<{ method: string; pattern: RegExp }> = [
  { method: 'POST', pattern: /^\/auth\/login$/ },
  { method: 'POST', pattern: /^\/auth\/signup$/ },
  { method: 'GET', pattern: /^\/places\/[^/]+$/ } // /places/nearby and /places/:placeId
];

export function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some((r) => r.method === method && r.pattern.test(path));
}

function extractBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export function createAuthGuard(jwtSecret: string, usersDb: UserRecord[]): express.RequestHandler {
  return (req, res, next) => {
    if (isPublicRoute(req.method, req.path)) return next();

    const token = extractBearerToken(req);
    const claims = token ? verifyAccessToken(token, jwtSecret) : null;
    const user = claims ? usersDb.find((u) => u.id === claims.userId) : undefined;
    if (!user) {
      res.status(401).json({ success: false, message: UNAUTHORIZED_MESSAGE });
      return;
    }
    res.locals.authUser = user;
    next();
  };
}

// Returns the user attached by createAuthGuard. Throws if a handler is reached
// without the guard, which would be a wiring bug rather than a client error.
export function getAuthUser(res: express.Response): UserRecord {
  const user = res.locals.authUser as UserRecord | undefined;
  if (!user) throw new Error('getAuthUser called on a route that is not behind the auth guard');
  return user;
}
