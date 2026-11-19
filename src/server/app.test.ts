import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { createStore, type Store } from './store';
import { signAccessToken } from './jwt';
import { startTestServer, type TestServer } from './testServer';

const SECRET = 'integration-test-secret-longer-than-32-chars';

let server: TestServer;
let store: Store;

beforeEach(async () => {
  store = createStore();
  server = await startTestServer(createApp({ jwtSecret: SECRET, store }));
});

afterEach(async () => {
  await server.close();
});

function call(method: string, path: string, opts: { body?: unknown; token?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token !== undefined) headers.Authorization = `Bearer ${opts.token}`;
  return fetch(`${server.baseUrl}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
  });
}

async function login(email = 'moca_mom@toto.com', password = 'password123'): Promise<string> {
  const res = await call('POST', '/auth/login', { body: { email, password } });
  expect(res.status).toBe(200);
  return (await res.json()).data.token;
}

describe('public routes', () => {
  it('serves places without a token', async () => {
    expect((await call('GET', '/places/nearby')).status).toBe(200);
    expect((await call('GET', '/places/place-1')).status).toBe(200);
  });

  it('logs in a seeded user and returns a signed JWT', async () => {
    const token = await login();
    expect(token.split('.')).toHaveLength(3);
    expect(token).not.toMatch(/^token_/);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await call('POST', '/auth/login', { body: { email: 'moca_mom@toto.com', password: 'wrong-password' } });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with the same 401 message', async () => {
    const wrongPw = await call('POST', '/auth/login', { body: { email: 'moca_mom@toto.com', password: 'wrong-password' } });
    const noUser = await call('POST', '/auth/login', { body: { email: 'nobody@pet.com', password: 'password123' } });
    expect(noUser.status).toBe(401);
    expect((await noUser.json()).message).toBe((await wrongPw.json()).message);
  });
});

describe('auth guard', () => {
  const protectedRoutes: Array<[string, string, unknown?]> = [
    ['GET', '/auth/me'],
    ['POST', '/auth/family/invite', { petId: 'p1' }],
    ['POST', '/auth/family/join', { inviteCode: 'MOCA-LOVE-7728' }],
    ['GET', '/pets'],
    ['POST', '/pets', { name: '새친구' }],
    ['PATCH', '/pets/p1', { name: '해킹' }],
    ['GET', '/pets/p1/dashboard'],
    ['POST', '/pets/p1/happiness', { increment: 5 }],
    ['GET', '/records/daily'],
    ['POST', '/records/daily', { petId: 'p1' }],
    ['GET', '/records/health'],
    ['POST', '/records/health', { petId: 'p1' }],
    ['POST', '/walks/start', { petId: 'p1' }],
    ['POST', '/walks/end', { walkId: 'w1' }],
    ['POST', '/walks/w1/shapeify', { targetShape: 'paw' }],
    ['POST', '/places/place-1/reviews', { rating: 5, content: '좋아요' }],
    ['GET', '/ai/history/p1'],
    ['POST', '/ai/doctor-analyze', { petName: '모카', breed: '말티푸' }],
    ['POST', '/ai/pixel-characterize', { petName: '모카', breed: '말티푸' }]
  ];

  it.each(protectedRoutes)('%s %s returns 401 without a token', async (method, path, body) => {
    const res = await call(method, path, { body });
    expect(res.status).toBe(401);
    expect((await res.json()).success).toBe(false);
  });

  it('does not fall back to u1 when unauthenticated', async () => {
    const res = await call('GET', '/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects the legacy fake token format', async () => {
    expect((await call('GET', '/auth/me', { token: 'token_u1_1700000000000' })).status).toBe(401);
    expect((await call('GET', '/auth/me', { token: 'moca_mom@toto.com' })).status).toBe(401);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = signAccessToken('u1', 'attacker-secret-that-is-longer-than-32-chars');
    expect((await call('GET', '/auth/me', { token: forged })).status).toBe(401);
  });

  it('rejects a valid token for a user that does not exist', async () => {
    const token = signAccessToken('u999', SECRET);
    expect((await call('GET', '/auth/me', { token })).status).toBe(401);
  });

  it('returns the token owner from /auth/me', async () => {
    const token = await login('coco_dad@pet.com');
    const res = await call('GET', '/auth/me', { token });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.user.id).toBe('u3');
    expect(json.data.user).not.toHaveProperty('passwordHash');
  });

  it('attributes a place review to the authenticated user', async () => {
    const token = await login('coco_dad@pet.com');
    const res = await call('POST', '/places/place-1/reviews', { token, body: { rating: 4, content: '친절해요' } });
    expect(res.status).toBe(201);
    expect((await res.json()).data.userId).toBe('u3');
  });
});

describe('password hashing', () => {
  it('stores seeded users with bcrypt hashes, not plaintext', () => {
    for (const user of store.usersDb) {
      expect(user.passwordHash).not.toBe('password123');
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    }
  });

  it('hashes the password on signup and lets the user log in', async () => {
    const res = await call('POST', '/auth/signup', {
      body: { email: 'new@pet.com', password: 'my-strong-pw', nickname: '새집사' }
    });
    expect(res.status).toBe(201);
    const signupToken = (await res.json()).data.token;

    const created = store.usersDb.find((u) => u.email === 'new@pet.com');
    expect(created?.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(created?.passwordHash).not.toContain('my-strong-pw');

    expect((await call('GET', '/auth/me', { token: signupToken })).status).toBe(200);
    expect(await login('new@pet.com', 'my-strong-pw')).toBeTruthy();
  });
});

describe('hardening', () => {
  it('gives distinct, unguessable ids to users who sign up in the same millisecond', async () => {
    const spy = vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    try {
      const [a, b] = await Promise.all([
        call('POST', '/auth/signup', { body: { email: 'a1@pet.com', password: 'password123', nickname: 'A' } }),
        call('POST', '/auth/signup', { body: { email: 'b1@pet.com', password: 'password123', nickname: 'B' } })
      ]);
      const [idA, idB] = [(await a.json()).data.user.id, (await b.json()).data.user.id];
      expect(idA).not.toBe(idB);
      expect(idA).not.toBe('u1800000000000');
    } finally {
      spy.mockRestore();
    }
  });

  it('limits public auth request bodies to a small size (413)', async () => {
    const res = await call('POST', '/auth/login', {
      body: { email: 'moca_mom@toto.com', password: 'password123', padding: 'x'.repeat(32 * 1024) }
    });
    expect(res.status).toBe(413);
  });

  it('returns a generic JSON 500 instead of crashing or leaking a stack trace', async () => {
    const brokenStore = createStore();
    // Make GET /pets throw inside the handler.
    brokenStore.petsDb = new Proxy(brokenStore.petsDb, {
      get(target, prop, receiver) {
        if (prop === 'filter') throw new Error('secret internal detail');
        return Reflect.get(target, prop, receiver);
      }
    });
    const local = await startTestServer(createApp({ jwtSecret: SECRET, store: brokenStore }));
    try {
      const res = await fetch(`${local.baseUrl}/pets`, { headers: { Authorization: `Bearer ${signAccessToken('u1', SECRET)}` } });
      expect(res.status).toBe(500);
      const text = await res.text();
      expect(text).not.toContain('secret internal detail');
      expect(JSON.parse(text).success).toBe(false);
    } finally {
      await local.close();
    }
  });
});

describe('store isolation', () => {
  it('does not share state between app instances', async () => {
    await call('POST', '/auth/signup', { body: { email: 'iso@pet.com', password: 'password123', nickname: '격리' } });
    const other = await startTestServer(createApp({ jwtSecret: SECRET }));
    try {
      const res = await fetch(`${other.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'iso@pet.com', password: 'password123' })
      });
      expect(res.status).toBe(401);
    } finally {
      await other.close();
    }
  });
});
