import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { startTestServer, type TestServer } from './testServer';

let server: TestServer;

beforeEach(async () => {
  server = await startTestServer(createApp());
});

afterEach(async () => {
  await server.close();
});

async function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${server.baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
}

describe('createApp', () => {
  it('serves public places list', async () => {
    const res = await fetch(`${server.baseUrl}/places/nearby`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('logs in a seeded user', async () => {
    const res = await post('/auth/login', { email: 'moca_mom@toto.com', password: 'password123' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.user.id).toBe('u1');
    expect(typeof json.data.token).toBe('string');
  });

  it('rejects a wrong password with 401', async () => {
    const res = await post('/auth/login', { email: 'moca_mom@toto.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('isolates state between app instances', async () => {
    await post('/auth/signup', { email: 'new@pet.com', password: 'password123', nickname: '새집사' });
    const other = await startTestServer(createApp());
    try {
      const res = await fetch(`${other.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@pet.com', password: 'password123' })
      });
      expect(res.status).toBe(401);
    } finally {
      await other.close();
    }
  });
});
