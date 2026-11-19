// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HealthRecord, PetProfile, User } from './types';

// The API layer is mocked; authStorage/authEvents stay real so token handling
// is exercised end to end.
const api = vi.hoisted(() => ({
  getMe: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  joinFamily: vi.fn(),
  getPets: vi.fn(),
  createPet: vi.fn(),
  getDailyRecords: vi.fn(),
  getHealthRecords: vi.fn(),
  getWalkSessions: vi.fn(),
  getNearbyPlaces: vi.fn()
}));

vi.mock('./services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/api')>();
  return {
    ...actual,
    authApiService: {
      ...actual.authApiService,
      getMe: api.getMe,
      login: api.login,
      signup: api.signup,
      joinFamily: api.joinFamily,
      logout: () => {
        api.logout();
        actual.authApiService.logout();
      }
    },
    petApiService: {
      ...actual.petApiService,
      getPets: api.getPets,
      createPet: api.createPet,
      getDailyRecords: api.getDailyRecords,
      getHealthRecords: api.getHealthRecords,
      getWalkSessions: api.getWalkSessions,
      getNearbyPlaces: api.getNearbyPlaces
    }
  };
});

import App from './App';
import { authStorage } from './services/api';

const user = (id: string, nickname: string): User => ({
  id,
  email: `${id}@pet.com`,
  nickname,
  role: 'owner',
  sharedPetIds: [],
  createdAt: '2026-01-01T00:00:00.000Z'
});

const pet = (id: string, name: string): PetProfile => ({
  id,
  name,
  breed: '믹스견',
  age: '2살',
  weightKg: 4,
  avatarUrl: 'https://images.unsplash.com/photo-1?w=400',
  happiness: 80,
  favoriteFood: '간식',
  birthday: '2024.01.01'
});

const health = (id: string, hospitalName: string): HealthRecord => ({
  id,
  date: '2026.11.01',
  hospitalName,
  category: 'checkup',
  diagnosis: '정기 검진',
  weightKg: 4,
  cost: 10000
});

const USER_A = user('ua', '에이집사');
const USER_B = user('ub', '비집사');
const PET_A = pet('pa', '에이멍멍');
const PET_B = pet('pb', '비냥냥');

beforeAll(() => {
  // jsdom gaps used by animation / canvas code paths.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  window.scrollTo = () => {};
});

beforeEach(() => {
  vi.clearAllMocks();
  authStorage.setToken(null);
  api.getNearbyPlaces.mockResolvedValue([]);
  api.getWalkSessions.mockResolvedValue([]);
  api.getDailyRecords.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  authStorage.setToken(null);
});

function loginAsOnNextSubmit(next: User, pets: PetProfile[], records: HealthRecord[] = []) {
  api.login.mockImplementation(async () => {
    authStorage.setToken(`token-${next.id}`);
    return { token: `token-${next.id}`, user: next, managedPets: pets };
  });
  api.getHealthRecords.mockResolvedValue(records);
}

async function submitLogin(email: string) {
  fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호 (8자 이상)'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: '로그인하기' }));
}

async function startLoggedInAsA() {
  authStorage.setToken('token-ua');
  api.getMe.mockResolvedValue({ user: USER_A, managedPets: [PET_A] });
  api.getHealthRecords.mockResolvedValue([health('ha', '에이동물병원')]);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /플러피 데이즈 시작하기/ }));
  await screen.findAllByText(PET_A.name);
}

function openAccountModal() {
  fireEvent.click(screen.getByTitle('계정 전환 및 로그인'));
}

async function openRecordsTab() {
  fireEvent.click(screen.getByRole('button', { name: '기록' }));
  fireEvent.click(await screen.findByRole('button', { name: '건강 & 병원 기록' }));
}

describe('user without pets', () => {
  const DEMO_PET_NAMES = ['모카', '토토'];

  async function startAsUserWithoutPets() {
    authStorage.setToken('token-ua');
    api.getMe.mockResolvedValue({ user: USER_A, managedPets: [] });
    api.getHealthRecords.mockResolvedValue([]);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /플러피 데이즈 시작하기/ }));
    await screen.findByText('첫 반려동물 등록');
  }

  it('shows a first-pet screen instead of demo pets', async () => {
    await startAsUserWithoutPets();
    for (const name of DEMO_PET_NAMES) expect(screen.queryByText(new RegExp(name))).toBeNull();
    expect(screen.queryByText('오늘의 요약 카드')).toBeNull();
  });

  it('registers the first pet and then shows it', async () => {
    await startAsUserWithoutPets();
    api.createPet.mockResolvedValue(PET_B);
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: PET_B.name } });
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    await screen.findAllByText(PET_B.name);
    expect(api.createPet).toHaveBeenCalledWith(expect.objectContaining({ name: PET_B.name }));
    expect(screen.queryByText('첫 반려동물 등록')).toBeNull();
  });

  it('lets a co-parent join with an invite code from the empty screen', async () => {
    await startAsUserWithoutPets();
    api.joinFamily.mockResolvedValue({ pet: PET_B, sharedPetIds: [PET_B.id] });
    fireEvent.change(screen.getByLabelText('초대 코드'), { target: { value: 'K7QW-M3ZP-X9RD' } });
    fireEvent.click(screen.getByRole('button', { name: '참여하기' }));

    await screen.findAllByText(PET_B.name);
    expect(api.joinFamily).toHaveBeenCalledWith('K7QW-M3ZP-X9RD');
  });

  it('loads the shared pet’s existing records after joining with an invite code', async () => {
    await startAsUserWithoutPets();
    api.joinFamily.mockResolvedValue({ pet: PET_B, sharedPetIds: [PET_B.id] });
    api.getHealthRecords.mockResolvedValue([health('hj', '공유동물병원')]);
    fireEvent.change(screen.getByLabelText('초대 코드'), { target: { value: 'K7QW-M3ZP-X9RD' } });
    fireEvent.click(screen.getByRole('button', { name: '참여하기' }));
    await screen.findAllByText(PET_B.name);

    await openRecordsTab();
    expect(await screen.findByText('공유동물병원')).toBeTruthy();
  });

  it('ignores a pet registration that finishes after logging out and switching user', async () => {
    await startAsUserWithoutPets();
    let finishCreate: (pet: PetProfile) => void = () => {};
    api.createPet.mockImplementation(() => new Promise<PetProfile>((resolve) => (finishCreate = resolve)));
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '늦은냥' } });
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    // Log out and sign in as B before A's registration returns.
    fireEvent.click(screen.getByRole('button', { name: /로그아웃/ }));
    await screen.findByText('보호자 계정 로그인');
    loginAsOnNextSubmit(USER_B, [PET_B]);
    await submitLogin('ub@pet.com');
    await screen.findAllByText(PET_B.name, {}, { timeout: 3000 });

    await act(async () => finishCreate(pet('late', '늦은냥')));
    expect(screen.queryByText('늦은냥')).toBeNull();
    expect(screen.getAllByText(PET_B.name).length).toBeGreaterThan(0);
  });

  it('can still log out from the empty screen', async () => {
    await startAsUserWithoutPets();
    fireEvent.click(screen.getByRole('button', { name: /로그아웃/ }));
    expect(await screen.findByText('보호자 계정 로그인')).toBeTruthy();
    expect(authStorage.getToken()).toBeNull();
  });
});

describe('signup as a family co-parent', () => {
  it('uses the invite code entered at signup to join the shared pet', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /플러피 데이즈 시작하기/ }));
    await screen.findByText('보호자 계정 로그인');

    api.signup.mockImplementation(async () => {
      authStorage.setToken('token-ub');
      return { token: 'token-ub', user: USER_B, managedPets: [] };
    });
    api.joinFamily.mockResolvedValue({ pet: PET_A, sharedPetIds: [PET_A.id] });
    api.getHealthRecords.mockResolvedValue([]);

    fireEvent.click(screen.getByRole('button', { name: /신규 가입/ }));
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: 'ub@pet.com' } });
    fireEvent.change(screen.getByPlaceholderText('비밀번호 (8자 이상)'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('예: 초코언니, 뽀삐아빠'), { target: { value: '비집사' } });
    fireEvent.click(screen.getByRole('button', { name: /가족 공동 양육자/ }));
    fireEvent.change(screen.getByLabelText('받은 초대 코드'), { target: { value: 'K7QW-M3ZP-X9RD' } });
    fireEvent.click(screen.getByRole('button', { name: '회원가입 완료' }));

    await screen.findAllByText(PET_A.name, {}, { timeout: 3000 });
    expect(api.signup).toHaveBeenCalledWith('ub@pet.com', 'password123', '비집사');
    expect(api.joinFamily).toHaveBeenCalledWith('K7QW-M3ZP-X9RD');
  });

  it('requires an invite code when the co-parent option is chosen', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /플러피 데이즈 시작하기/ }));
    await screen.findByText('보호자 계정 로그인');
    fireEvent.click(screen.getByRole('button', { name: /신규 가입/ }));
    fireEvent.click(screen.getByRole('button', { name: /가족 공동 양육자/ }));
    expect((screen.getByLabelText('받은 초대 코드') as HTMLInputElement).required).toBe(true);
  });
});

describe('logout', () => {
  it('has a logout button that clears the token and shows the login screen', async () => {
    await startLoggedInAsA();
    openAccountModal();
    fireEvent.click(await screen.findByRole('button', { name: /로그아웃/ }));

    expect(await screen.findByText('보호자 계정 로그인')).toBeTruthy();
    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(authStorage.getToken()).toBeNull();
    expect(screen.queryByText(PET_A.name)).toBeNull();
    // Logging out is not a session expiry: no "expired" notice.
    expect(screen.queryByText(/로그인이 만료되었습니다/)).toBeNull();
  });

  it('does not show the previous user’s pets or records to the next user', async () => {
    await startLoggedInAsA();
    openAccountModal();
    fireEvent.click(await screen.findByRole('button', { name: /로그아웃/ }));
    await screen.findByText('보호자 계정 로그인');

    loginAsOnNextSubmit(USER_B, [PET_B], [health('hb', '비동물병원')]);
    await submitLogin('ub@pet.com');

    await screen.findAllByText(PET_B.name, {}, { timeout: 3000 });
    expect(screen.queryByText(PET_A.name)).toBeNull();
    await openRecordsTab();
    expect(await screen.findByText('비동물병원')).toBeTruthy();
    expect(screen.queryByText('에이동물병원')).toBeNull();
  });
});

describe('account switch without logout', () => {
  it('replaces the previous user’s data when logging in as someone else', async () => {
    await startLoggedInAsA();
    openAccountModal();
    loginAsOnNextSubmit(USER_B, [PET_B], [health('hb', '비동물병원')]);
    await submitLogin('ub@pet.com');

    await screen.findAllByText(PET_B.name, {}, { timeout: 3000 });
    expect(screen.queryByText(PET_A.name)).toBeNull();
    await openRecordsTab();
    expect(await screen.findByText('비동물병원')).toBeTruthy();
    expect(screen.queryByText('에이동물병원')).toBeNull();
  });

  it('ignores a slow response from the previous session that arrives after the switch', async () => {
    let resolveOldHealth: (records: HealthRecord[]) => void = () => {};
    authStorage.setToken('token-ua');
    api.getMe.mockResolvedValue({ user: USER_A, managedPets: [PET_A] });
    api.getHealthRecords.mockImplementationOnce(
      () => new Promise<HealthRecord[]>((resolve) => (resolveOldHealth = resolve))
    );
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /플러피 데이즈 시작하기/ }));
    await screen.findAllByText(PET_A.name);

    openAccountModal();
    loginAsOnNextSubmit(USER_B, [PET_B], [health('hb', '비동물병원')]);
    await submitLogin('ub@pet.com');
    await screen.findAllByText(PET_B.name, {}, { timeout: 3000 });

    // User A's request finally resolves — it must not overwrite user B's data.
    await act(async () => resolveOldHealth([health('ha', '에이동물병원')]));
    await openRecordsTab();
    await waitFor(() => expect(screen.queryByText('비동물병원')).toBeTruthy());
    expect(screen.queryByText('에이동물병원')).toBeNull();
  });
});
