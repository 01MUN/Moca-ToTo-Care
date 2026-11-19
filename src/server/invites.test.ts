import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createStore, type Store } from './store';
import { signAccessToken } from './jwt';
import { startTestServer, type TestServer } from './testServer';
import { INVITE_CODE_ALPHABET, generateInviteCode } from './inviteCode';

// u1 owns p1,p2 (u2 already co-parents both) · u3 owns p3 and has no access to p1.
const SECRET = 'invites-test-secret-longer-than-32-chars';

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
  return async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${server.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: res.status, json: await res.json() };
  };
}

async function signupUser(email: string): Promise<string> {
  const res = await fetch(`${server.baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', nickname: '새가족' })
  });
  return (await res.json()).data.user.id;
}

async function issueCode(petId = 'p1'): Promise<string> {
  const res = await as('u1')('POST', '/auth/family/invite', { petId });
  expect(res.status).toBe(201);
  return res.json.data.inviteCode;
}

describe('generateInviteCode', () => {
  it('produces XXXX-XXXX-XXXX from an unambiguous alphabet', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    for (const ch of code.replace(/-/g, '')) expect(INVITE_CODE_ALPHABET).toContain(ch);
    expect(INVITE_CODE_ALPHABET).not.toMatch(/[01IO]/);
  });

  it('does not repeat across many draws', () => {
    const codes = new Set(Array.from({ length: 2000 }, () => generateInviteCode()));
    expect(codes.size).toBe(2000);
  });
});

describe('POST /auth/family/invite', () => {
  it('issues a random code that does not contain the pet name or a short number', async () => {
    const code = await issueCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(code).not.toContain('모카');
    expect(code).not.toMatch(/^[^-]+-\d{4}$/);
  });

  it('issues a different code every time', async () => {
    expect(await issueCode()).not.toBe(await issueCode());
  });

  it('sets a future expiry', async () => {
    const res = await as('u1')('POST', '/auth/family/invite', { petId: 'p1' });
    expect(new Date(res.json.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('POST /auth/family/join', () => {
  it('lets a user join with a valid code (case/whitespace-insensitive)', async () => {
    const code = await issueCode();
    const res = await as('u3')('POST', '/auth/family/join', { inviteCode: `  ${code.toLowerCase()} ` });
    expect(res.status).toBe(200);
    expect(store.usersDb.find((u) => u.id === 'u3')?.sharedPetIds).toContain('p1');
  });

  it('accepts a code only once', async () => {
    const code = await issueCode();
    const newcomer = await signupUser('second@pet.com');
    expect((await as('u3')('POST', '/auth/family/join', { inviteCode: code })).status).toBe(200);

    const reuse = await as(newcomer)('POST', '/auth/family/join', { inviteCode: code });
    expect(reuse.status).toBe(404);
    expect(store.usersDb.find((u) => u.id === newcomer)?.sharedPetIds).not.toContain('p1');
  });

  it('rejects an expired code', async () => {
    const code = await issueCode();
    const invite = store.familyInvitesDb.find((i) => i.inviteCode === code)!;
    invite.expiresAt = new Date(Date.now() - 1000).toISOString();

    const res = await as('u3')('POST', '/auth/family/join', { inviteCode: code });
    expect(res.status).toBe(404);
    expect(store.usersDb.find((u) => u.id === 'u3')?.sharedPetIds).not.toContain('p1');
  });

  it('uses one identical 404 for unknown, used and expired codes (no oracle)', async () => {
    const used = await issueCode();
    await as('u3')('POST', '/auth/family/join', { inviteCode: used });
    const expired = await issueCode();
    store.familyInvitesDb.find((i) => i.inviteCode === expired)!.expiresAt = new Date(0).toISOString();
    const newcomer = await signupUser('oracle@pet.com');
    const join = as(newcomer);

    const unknown = await join('POST', '/auth/family/join', { inviteCode: 'ZZZZ-ZZZZ-ZZZZ' });
    const reused = await join('POST', '/auth/family/join', { inviteCode: used });
    const old = await join('POST', '/auth/family/join', { inviteCode: expired });
    expect([unknown.status, reused.status, old.status]).toEqual([404, 404, 404]);
    expect(reused.json).toEqual(unknown.json);
    expect(old.json).toEqual(unknown.json);
  });

  it('does not consume the code when the user already has access', async () => {
    const code = await issueCode();
    const already = await as('u2')('POST', '/auth/family/join', { inviteCode: code });
    expect(already.status).toBe(409);
    expect((await as('u3')('POST', '/auth/family/join', { inviteCode: code })).status).toBe(200);
  });

  it('no longer accepts the old guessable demo code', async () => {
    const res = await as('u3')('POST', '/auth/family/join', { inviteCode: 'MOCA-LOVE-7728' });
    expect(res.status).toBe(404);
  });

  it('rejects a code whose pet was deleted', async () => {
    const code = await issueCode();
    expect((await as('u1')('DELETE', '/pets/p1')).status).toBe(200);
    expect((await as('u3')('POST', '/auth/family/join', { inviteCode: code })).status).toBe(404);
  });
});
