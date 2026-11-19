import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createStore, type Store } from './store';
import { signAccessToken } from './jwt';
import { startTestServer, type TestServer } from './testServer';

const SECRET = 'validation-test-secret-longer-than-32-chars';

let server: TestServer;
let store: Store;
let token: string;

beforeAll(() => {
  token = signAccessToken('u1', SECRET);
});

beforeEach(async () => {
  store = createStore();
  server = await startTestServer(createApp({ jwtSecret: SECRET, store }));
});

afterEach(async () => {
  await server.close();
});

function send(method: string, path: string, body?: unknown, opts: { auth?: boolean; raw?: string } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth !== false) headers.Authorization = `Bearer ${token}`;
  return fetch(`${server.baseUrl}${path}`, {
    method,
    headers,
    body: opts.raw ?? (body === undefined ? undefined : JSON.stringify(body))
  });
}

async function expect400(res: Response) {
  expect(res.status).toBe(400);
  const json = await res.json();
  expect(json.success).toBe(false);
  expect(typeof json.message).toBe('string');
  return json;
}

describe('error envelope', () => {
  it('returns field-level errors for invalid input', async () => {
    const json = await expect400(await send('POST', '/auth/login', { email: 'not-an-email', password: 'x' }, { auth: false }));
    expect(json.errors).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'email' })]));
  });

  it('returns a JSON 400 for malformed JSON bodies', async () => {
    await expect400(await send('POST', '/auth/login', undefined, { auth: false, raw: '{"email":' }));
  });

  it('checks auth before validation (401 beats 400)', async () => {
    const res = await send('POST', '/places/place-1/reviews', { rating: 99 }, { auth: false });
    expect(res.status).toBe(401);
  });
});

describe('auth input', () => {
  it('rejects signup with a short password', async () => {
    await expect400(await send('POST', '/auth/signup', { email: 'a@pet.com', password: 'short', nickname: '집사' }, { auth: false }));
  });

  it('rejects signup with a password over 72 bytes', async () => {
    const password = '가'.repeat(25); // 75 bytes in UTF-8
    await expect400(await send('POST', '/auth/signup', { email: 'a@pet.com', password, nickname: '집사' }, { auth: false }));
  });

  it('rejects signup with an empty or too-long nickname', async () => {
    await expect400(await send('POST', '/auth/signup', { email: 'a@pet.com', password: 'password123', nickname: '   ' }, { auth: false }));
    await expect400(
      await send('POST', '/auth/signup', { email: 'a@pet.com', password: 'password123', nickname: 'n'.repeat(31) }, { auth: false })
    );
  });

  it('ignores a client-supplied role and creates an owner', async () => {
    const res = await send(
      'POST',
      '/auth/signup',
      { email: 'role@pet.com', password: 'password123', nickname: '집사', role: 'co_parent' },
      { auth: false }
    );
    expect(res.status).toBe(201);
    expect((await res.json()).data.user.role).toBe('owner');
  });

  it('normalizes email case and whitespace on login', async () => {
    const res = await send('POST', '/auth/login', { email: '  MOCA_MOM@toto.com ', password: 'password123' }, { auth: false });
    expect(res.status).toBe(200);
  });

  it('rejects non-string credentials', async () => {
    await expect400(await send('POST', '/auth/login', { email: { $ne: null }, password: 'password123' }, { auth: false }));
  });

  it('rejects a missing invite code', async () => {
    await expect400(await send('POST', '/auth/family/join', {}));
  });
});

describe('pets input', () => {
  it('accepts a whitelisted PATCH field', async () => {
    const res = await send('PATCH', '/pets/p1', { name: '모카2' });
    expect(res.status).toBe(200);
    expect((await res.json()).data.name).toBe('모카2');
  });

  it('rejects PATCH fields outside the whitelist (no id/userId override)', async () => {
    await expect400(await send('PATCH', '/pets/p1', { id: 'p999' }));
    await expect400(await send('PATCH', '/pets/p1', { userId: 'u3' }));
    await expect400(await send('PATCH', '/pets/p1', { happiness: 100 }));
    expect(store.petsDb.find((p) => p.id === 'p1')?.userId).toBe('u1');
  });

  it('rejects an empty PATCH body', async () => {
    await expect400(await send('PATCH', '/pets/p1', {}));
  });

  it('accepts a pixel-art data URL avatar (client flow)', async () => {
    const res = await send('PATCH', '/pets/p1', { avatarUrl: 'data:image/png;base64,iVBORw0KGgo=' });
    expect(res.status).toBe(200);
  });

  it('rejects a javascript: avatar URL', async () => {
    await expect400(await send('PATCH', '/pets/p1', { avatarUrl: 'javascript:alert(1)' }));
  });

  it('rejects an invalid weight or birth date', async () => {
    await expect400(await send('POST', '/pets', { name: '새친구', weight: -1 }));
    await expect400(await send('POST', '/pets', { name: '새친구', birthDate: '2024-13-45' }));
  });

  it('rejects an out-of-range happiness increment', async () => {
    await expect400(await send('POST', '/pets/p1/happiness', { increment: 1000 }));
    expect((await send('POST', '/pets/p1/happiness', { increment: 1 })).status).toBe(200);
  });

  it('rejects malformed path ids', async () => {
    await expect400(await send('GET', `/pets/${encodeURIComponent('p1;drop')}/dashboard`));
  });
});

describe('records input', () => {
  it('rejects a negative cost and unknown category', async () => {
    await expect400(await send('POST', '/records/health', { petId: 'p1', cost: -100 }));
    await expect400(await send('POST', '/records/health', { petId: 'p1', category: 'magic' }));
  });

  it('strips unknown fields the client sends instead of rejecting (current client payload)', async () => {
    const res = await send('POST', '/records/health', {
      id: 'h-client',
      date: '2026-08-01',
      hospitalName: '행복 병원',
      category: 'vaccine',
      diagnosis: '접종',
      weightKg: 3.8,
      cost: 45000,
      petId: 'p1',
      unknownClientField: 'should be dropped'
    });
    expect(res.status).toBe(201);
    const data = (await res.json()).data;
    expect(data).not.toHaveProperty('unknownClientField');
    // The client's own fields are now part of the API contract and are kept.
    expect(data).toMatchObject({ weightKg: 3.8, date: '2026.08.01' });
    // The client-supplied id is not trusted; the server assigns its own.
    expect(data.id).not.toBe('h-client');
  });

  it('rejects overly long notes', async () => {
    await expect400(await send('POST', '/records/daily', { petId: 'p1', notes: 'x'.repeat(2001) }));
  });

  it('rejects a malformed query petId', async () => {
    await expect400(await send('GET', `/records/daily?petId=${encodeURIComponent('<script>')}`));
  });
});

describe('walks input', () => {
  it('rejects out-of-range coordinates', async () => {
    await expect400(await send('POST', '/walks/start', { petId: 'p1', startLatitude: 91, startLongitude: 0 }));
    await expect400(await send('POST', '/walks/start', { petId: 'p1', startLatitude: 0, startLongitude: 181 }));
  });

  it('rejects an unknown shape and accepts the raw shape the client sends', async () => {
    await expect400(await send('POST', '/walks/w1/shapeify', { targetShape: 'star' }));
    const res = await send('POST', '/walks/w1/shapeify', { targetShape: 'raw', rawCoordinates: [{ x: 1, y: 2 }] });
    expect(res.status).toBe(200);
  });

  it('rejects an oversized coordinate list', async () => {
    const coords = Array.from({ length: 10_001 }, () => ({ x: 0, y: 0 }));
    await expect400(await send('POST', '/walks/w1/shapeify', { targetShape: 'paw', rawCoordinates: coords }));
  });

  it('rejects negative walk metrics', async () => {
    await expect400(await send('POST', '/walks/end', { walkId: 'w1', distanceKm: -1 }));
  });
});

describe('places input', () => {
  it('rejects ratings outside 1-5 and non-integers', async () => {
    await expect400(await send('POST', '/places/place-1/reviews', { rating: 0, content: '별로' }));
    await expect400(await send('POST', '/places/place-1/reviews', { rating: 6, content: '최고' }));
    await expect400(await send('POST', '/places/place-1/reviews', { rating: 4.5, content: '좋아요' }));
  });

  it('rejects too many tags or overly long content', async () => {
    await expect400(await send('POST', '/places/place-1/reviews', { rating: 5, content: '좋아요', tags: Array(11).fill('t') }));
    await expect400(await send('POST', '/places/place-1/reviews', { rating: 5, content: 'x'.repeat(1001) }));
  });

  it('rejects an unknown category filter', async () => {
    await expect400(await send('GET', '/places/nearby?category=casino', undefined, { auth: false }));
    expect((await send('GET', '/places/nearby?category=cafe', undefined, { auth: false })).status).toBe(200);
  });
});

describe('ai input', () => {
  it('rejects a non-image MIME type', async () => {
    await expect400(
      await send('POST', '/ai/doctor-analyze', { petName: '모카', breed: '말티푸', imageBase64: 'AAAA', imageMimeType: 'text/html' })
    );
  });

  it('rejects non-base64 image data', async () => {
    await expect400(await send('POST', '/ai/pixel-characterize', { petName: '모카', breed: '말티푸', imageBase64: 'not base64!' }));
  });

  it('rejects an unknown consultation category', async () => {
    await expect400(await send('POST', '/ai/doctor-analyze', { petName: '모카', breed: '말티푸', category: 'astrology' }));
  });

  it('accepts a body above the old 100kb express default (photo upload)', async () => {
    const imageBase64 = 'A'.repeat(300_000);
    const res = await send('POST', '/ai/pixel-characterize', { petName: '모카', breed: '말티푸', imageBase64 });
    expect(res.status).not.toBe(413);
    expect(res.status).not.toBe(400);
  });

  it('returns JSON 413 for bodies over the size limit', async () => {
    const res = await send('POST', '/ai/pixel-characterize', { petName: '모카', breed: '말티푸', imageBase64: 'A'.repeat(11 * 1024 * 1024) });
    expect(res.status).toBe(413);
    expect((await res.json()).success).toBe(false);
  });
});
