import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createStore, type Store } from './store';
import { signAccessToken } from './jwt';
import { startTestServer, type TestServer } from './testServer';

// Save → reload round-trips using the payloads the React client actually sends
// (src/App.tsx handleAddHealthRecord / handleSaveWalkSession).
const SECRET = 'persistence-test-secret-longer-than-32-chars';

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

const clientHealthRecord = {
  id: 'hlth-1763500000000',
  petId: 'p1',
  date: '2026.11.19',
  hospitalName: '행복 24시 동물병원',
  doctorName: '김수석 원장님',
  category: 'vaccine',
  diagnosis: '종합 백신 접종',
  prescription: '3일간 목욕 금지',
  weightKg: 4.15,
  cost: 45000,
  memo: '접종 후 컨디션 양호'
};

describe('health records keep the date and weight after reload', () => {
  it('returns the saved date, weight and memo from GET', async () => {
    const owner = as('u1');
    const created = await owner('POST', '/records/health', clientHealthRecord);
    expect(created.status).toBe(201);

    const list = await owner('GET', '/records/health?petId=p1');
    const saved = list.json.data.find((r: { id: string }) => r.id === created.json.data.id);
    expect(saved).toMatchObject({
      petId: 'p1',
      date: '2026.11.19',
      weightKg: 4.15,
      memo: '접종 후 컨디션 양호',
      hospitalName: '행복 24시 동물병원',
      category: 'vaccine',
      cost: 45000
    });
  });

  it('accepts an ISO date and stores it in the client display format', async () => {
    const owner = as('u1');
    const created = await owner('POST', '/records/health', { ...clientHealthRecord, date: '2026-11-20' });
    expect(created.status).toBe(201);
    expect(created.json.data.date).toBe('2026.11.20');
  });

  it('rejects an impossible date instead of silently saving today', async () => {
    const res = await as('u1')('POST', '/records/health', { ...clientHealthRecord, date: '2026.13.45' });
    expect(res.status).toBe(400);
  });

  it('does not overwrite a missing weight with a fake default', async () => {
    const { weightKg: _omit, ...withoutWeight } = clientHealthRecord;
    const created = await as('u1')('POST', '/records/health', withoutWeight);
    expect(created.status).toBe(201);
    expect(created.json.data.weightKg).toBeUndefined();
  });
});

const clientWalkSession = {
  id: 'walk-1763500000000',
  date: '방금 전 (오늘)',
  timeAgo: '방금 전',
  durationMinutes: 37,
  distanceKm: 2.4,
  calories: 96,
  stepCount: 3120,
  rawPath: [
    { x: 15, y: 75 },
    { x: 28, y: 55 },
    { x: 40, y: 80 }
  ],
  shapeType: 'raw',
  weather: '☀️ 24°C 맑음 / 도산공원',
  note: '모카와 함께한 상쾌한 GPS 산책 완료! 🐾',
  petId: 'p1'
};

describe('walks keep their duration and steps after reload', () => {
  it('stores a finished walk and returns it from GET /walks', async () => {
    const owner = as('u1');
    const ended = await owner('POST', '/walks/end', clientWalkSession);
    expect(ended.status).toBe(200);

    const list = await owner('GET', '/walks?petId=p1');
    expect(list.status).toBe(200);
    const saved = list.json.data.find((w: { id: string }) => w.id === ended.json.data.id);
    expect(saved).toMatchObject({
      petId: 'p1',
      durationMinutes: 37,
      stepCount: 3120,
      distanceKm: 2.4,
      calories: 96,
      shapeType: 'raw',
      rawPath: clientWalkSession.rawPath,
      note: clientWalkSession.note,
      weather: clientWalkSession.weather
    });
    expect(typeof saved.date).toBe('string');
    expect(typeof saved.timeAgo).toBe('string');
  });

  it('keeps the client walk id so shapeify can reference it', async () => {
    const ended = await as('u1')('POST', '/walks/end', clientWalkSession);
    expect(ended.json.data.id).toBe('walk-1763500000000');
  });

  it('lists walks newest first and only for pets the caller can access', async () => {
    const owner = as('u1');
    await owner('POST', '/walks/end', { ...clientWalkSession, id: 'walk-a', durationMinutes: 10 });
    await owner('POST', '/walks/end', { ...clientWalkSession, id: 'walk-b', durationMinutes: 20 });

    const mine = await owner('GET', '/walks');
    expect(mine.json.data.map((w: { id: string }) => w.id).slice(0, 2)).toEqual(['walk-b', 'walk-a']);

    const stranger = as('u3');
    expect((await stranger('GET', '/walks')).json.data).toEqual([]);
    expect((await stranger('GET', '/walks?petId=p1')).status).toBe(404);
    expect((await as('u2')('GET', '/walks?petId=p1')).json.data.length).toBe(2);
  });

  it('does not let another user reuse an existing walk id', async () => {
    await as('u1')('POST', '/walks/end', clientWalkSession);
    const other = await as('u3')('POST', '/walks/end', { ...clientWalkSession, petId: 'p3' });
    expect(other.status).toBe(200);
    expect(other.json.data.id).not.toBe(clientWalkSession.id);
    const ownerWalk = store.walkLogsDb.find((w) => w.id === clientWalkSession.id);
    expect(ownerWalk?.petId).toBe('p1');
  });

  it('does not invent walk metrics when they are missing', async () => {
    const ended = await as('u1')('POST', '/walks/end', { petId: 'p1' });
    expect(ended.status).toBe(200);
    expect(ended.json.data).toMatchObject({ durationMinutes: 0, distanceKm: 0, stepCount: 0, calories: 0 });
  });
});
