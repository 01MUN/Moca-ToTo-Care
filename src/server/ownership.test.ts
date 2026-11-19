import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createStore, type Store } from './store';
import { signAccessToken } from './jwt';
import { startTestServer, type TestServer } from './testServer';

// Seed data: u1 owns p1,p2 · u2 is co-parent (shared) of p1,p2 · u3 owns p3.
const SECRET = 'ownership-test-secret-longer-than-32-chars';
const OWNER = 'u1';
const CO_PARENT = 'u2';
const STRANGER = 'u3';

let server: TestServer;
let store: Store;

beforeEach(async () => {
  store = createStore();
  server = await startTestServer(createApp({ jwtSecret: SECRET, store }));
});

afterEach(async () => {
  await server.close();
});

function as(userId: string) {
  const token = signAccessToken(userId, SECRET);
  return (method: string, path: string, body?: unknown) =>
    fetch(`${server.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
}

async function expectNotFound(res: Response) {
  expect(res.status).toBe(404);
  const json = await res.json();
  expect(json.success).toBe(false);
  return json;
}

describe('404 hides whether another user’s pet exists', () => {
  it('returns the same 404 body for someone else’s pet and a nonexistent pet', async () => {
    const stranger = as(STRANGER);
    const others = await expectNotFound(await stranger('GET', '/pets/p1/dashboard'));
    const missing = await expectNotFound(await stranger('GET', '/pets/p999/dashboard'));
    expect(others).toEqual(missing);
  });
});

describe('pets', () => {
  it('lists only the caller’s own and shared pets', async () => {
    const res = await as(STRANGER)('GET', '/pets');
    expect(res.status).toBe(200);
    const ids = (await res.json()).data.map((p: { id: string }) => p.id);
    expect(ids).toEqual(['p3']);
  });

  it('returns an empty list (not demo pets) for a user with no pets', async () => {
    const signup = await fetch(`${server.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'empty@pet.com', password: 'password123', nickname: '빈집사' })
    });
    const { token, user } = (await signup.json()).data;
    expect(user.id).toBeTruthy();
    const res = await fetch(`${server.baseUrl}/pets`, { headers: { Authorization: `Bearer ${token}` } });
    expect((await res.json()).data).toEqual([]);
  });

  it('cannot view another user’s pet dashboard', async () => {
    await expectNotFound(await as(STRANGER)('GET', '/pets/p1/dashboard'));
    expect((await as(OWNER)('GET', '/pets/p1/dashboard')).status).toBe(200);
    expect((await as(CO_PARENT)('GET', '/pets/p1/dashboard')).status).toBe(200);
  });

  it('cannot modify another user’s pet', async () => {
    await expectNotFound(await as(STRANGER)('PATCH', '/pets/p1', { name: '해킹' }));
    expect(store.petsDb.find((p) => p.id === 'p1')?.name).toBe('모카');
  });

  it('cannot delete another user’s pet', async () => {
    await expectNotFound(await as(STRANGER)('DELETE', '/pets/p1'));
    expect(store.petsDb.some((p) => p.id === 'p1')).toBe(true);
  });

  it('lets the owner delete their pet and removes it from every user', async () => {
    const res = await as(OWNER)('DELETE', '/pets/p1');
    expect(res.status).toBe(200);
    expect(store.petsDb.some((p) => p.id === 'p1')).toBe(false);
    for (const user of store.usersDb) {
      expect(user.ownedPetIds).not.toContain('p1');
      expect(user.sharedPetIds).not.toContain('p1');
    }
    await expectNotFound(await as(OWNER)('GET', '/pets/p1/dashboard'));
  });

  it('cannot change another user’s pet happiness', async () => {
    const before = store.petsDb.find((p) => p.id === 'p1')?.happiness;
    await expectNotFound(await as(STRANGER)('POST', '/pets/p1/happiness', { increment: 5 }));
    expect(store.petsDb.find((p) => p.id === 'p1')?.happiness).toBe(before);
  });
});

describe('co-parent (shared) permissions', () => {
  it('can update care data for a shared pet', async () => {
    const coParent = as(CO_PARENT);
    expect((await coParent('POST', '/pets/p1/happiness', { increment: 1 })).status).toBe(200);
    expect((await coParent('POST', '/records/daily', { petId: 'p1', notes: '산책 완료' })).status).toBe(201);
  });

  it('is forbidden (403) from owner-only actions on a shared pet', async () => {
    const coParent = as(CO_PARENT);
    expect((await coParent('PATCH', '/pets/p1', { name: '바꿈' })).status).toBe(403);
    expect((await coParent('DELETE', '/pets/p1')).status).toBe(403);
    expect((await coParent('POST', '/auth/family/invite', { petId: 'p1' })).status).toBe(403);
    expect(store.petsDb.find((p) => p.id === 'p1')?.name).toBe('모카');
  });
});

describe('records', () => {
  it('cannot read another user’s daily or health records by petId', async () => {
    await expectNotFound(await as(STRANGER)('GET', '/records/daily?petId=p1'));
    await expectNotFound(await as(STRANGER)('GET', '/records/health?petId=p1'));
  });

  it('only lists the caller’s pets’ records when no petId is given', async () => {
    const strangerDaily = (await (await as(STRANGER)('GET', '/records/daily')).json()).data;
    const strangerHealth = (await (await as(STRANGER)('GET', '/records/health')).json()).data;
    expect(strangerDaily).toEqual([]);
    expect(strangerHealth).toEqual([]);

    const ownerDaily = (await (await as(OWNER)('GET', '/records/daily')).json()).data;
    expect(ownerDaily.map((r: { petId: string }) => r.petId)).toContain('p1');
  });

  it('cannot create records for another user’s pet', async () => {
    const before = [store.dailyRecordsDb.length, store.healthRecordsDb.length];
    await expectNotFound(await as(STRANGER)('POST', '/records/daily', { petId: 'p1' }));
    await expectNotFound(await as(STRANGER)('POST', '/records/health', { petId: 'p1', cost: 1000 }));
    expect([store.dailyRecordsDb.length, store.healthRecordsDb.length]).toEqual(before);
  });

  it('requires a petId when creating records (no silent p1 default)', async () => {
    expect((await as(STRANGER)('POST', '/records/daily', {})).status).toBe(400);
    expect((await as(STRANGER)('POST', '/records/health', {})).status).toBe(400);
  });
});

describe('walks', () => {
  it('cannot start a walk for another user’s pet', async () => {
    await expectNotFound(await as(STRANGER)('POST', '/walks/start', { petId: 'p1' }));
    expect((await as(OWNER)('POST', '/walks/start', { petId: 'p1' })).status).toBe(201);
  });

  it('cannot end another user’s walk', async () => {
    const started = await (await as(OWNER)('POST', '/walks/start', { petId: 'p1' })).json();
    await expectNotFound(await as(STRANGER)('POST', '/walks/end', { walkId: started.walkId }));
    expect(store.activeWalks[started.walkId]).toBeDefined();
    expect((await as(OWNER)('POST', '/walks/end', { walkId: started.walkId })).status).toBe(200);
  });

  it('cannot end a walk logged against another user’s pet', async () => {
    await expectNotFound(await as(STRANGER)('POST', '/walks/end', { petId: 'p1', distanceKm: 1 }));
  });
});

describe('ai', () => {
  it('cannot read another user’s pet consultation history', async () => {
    await expectNotFound(await as(STRANGER)('GET', '/ai/history/p1'));
    expect((await as(CO_PARENT)('GET', '/ai/history/p1')).status).toBe(200);
  });

  it('cannot run an analysis that is saved to another user’s pet', async () => {
    const before = store.aiConsultationsDb.length;
    await expectNotFound(await as(STRANGER)('POST', '/ai/doctor-analyze', { petId: 'p1', petName: '모카', breed: '토이푸들' }));
    expect(store.aiConsultationsDb.length).toBe(before);
  });
});

describe('family invites', () => {
  it('cannot issue an invite code for another user’s pet', async () => {
    const before = store.familyInvitesDb.length;
    await expectNotFound(await as(STRANGER)('POST', '/auth/family/invite', { petId: 'p1' }));
    expect(store.familyInvitesDb.length).toBe(before);
    expect((await as(OWNER)('POST', '/auth/family/invite', { petId: 'p1' })).status).toBe(201);
  });
});
