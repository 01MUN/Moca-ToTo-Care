import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INITIAL_PETS } from '../data/mockData';
import {
  UnauthorizedError,
  authApiService,
  authEvents,
  authStorage,
  petApiService,
  resolveRequestFailure
} from './api';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  authStorage.setToken('header.payload.signature');
});

afterEach(() => {
  vi.unstubAllGlobals();
  authStorage.setToken(null);
});

describe('initial token', () => {
  it('has no hard-coded fallback token when nothing is stored (browser)', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
    vi.resetModules();
    const fresh = await import('./api');
    expect(fresh.authStorage.getToken()).toBeNull();
  });

  it('restores a stored token on load (browser)', async () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('localStorage', { getItem: () => 'stored.jwt.token', setItem: () => {}, removeItem: () => {} });
    vi.resetModules();
    const fresh = await import('./api');
    expect(fresh.authStorage.getToken()).toBe('stored.jwt.token');
  });
});

describe('401 handling', () => {
  it('throws UnauthorizedError, clears the token and notifies listeners', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { success: false, message: '인증이 필요합니다.' })));
    const listener = vi.fn();
    const unsubscribe = authEvents.onUnauthorized(listener);

    await expect(petApiService.getPets()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(authStorage.getToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('stops notifying after unsubscribe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { success: false })));
    const listener = vi.fn();
    authEvents.onUnauthorized(listener)();
    await expect(petApiService.getPets()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not treat a failed login (bad credentials) as session expiry', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' })));
    const listener = vi.fn();
    const unsubscribe = authEvents.onUnauthorized(listener);

    await expect(authApiService.login('a@pet.com', 'wrong-pass')).rejects.toThrow('이메일 또는 비밀번호가 일치하지 않습니다.');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('stores the token returned by a successful login', async () => {
    authStorage.setToken(null);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { success: true, data: { token: 'new.jwt.token', user: { id: 'u1' }, managedPets: [] } }))
    );
    await authApiService.login('moca_mom@toto.com', 'password123');
    expect(authStorage.getToken()).toBe('new.jwt.token');
  });
});

describe('resolveRequestFailure (mock-data fallback)', () => {
  it('never swallows a 401 with mock data, even when fallback is enabled', () => {
    expect(() => resolveRequestFailure(new UnauthorizedError(), INITIAL_PETS, true)).toThrow(UnauthorizedError);
  });

  it('returns fallback data for network errors when fallback is enabled', () => {
    expect(resolveRequestFailure(new TypeError('Failed to fetch'), INITIAL_PETS, true)).toBe(INITIAL_PETS);
  });

  it('rethrows when fallback is disabled or absent', () => {
    expect(() => resolveRequestFailure(new TypeError('Failed to fetch'), INITIAL_PETS, false)).toThrow('Failed to fetch');
    expect(() => resolveRequestFailure(new TypeError('Failed to fetch'), undefined, true)).toThrow('Failed to fetch');
  });
});
