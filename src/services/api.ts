import { PetProfile, RecordItem, HealthRecord, WalkSession, CommunityPlace, User, AuthResponse, FamilyInvite, AIConsultationResult, PixelCharacterAnalysis } from '../types';
import { INITIAL_PETS, INITIAL_DAILY_RECORDS, INITIAL_HEALTH_RECORDS, INITIAL_WALK_SESSIONS, INITIAL_COMMUNITY_PLACES } from '../data/mockData';

const BASE_URL = '/api/v1';
const AUTH_TOKEN_KEY = 'mocatoto_auth_token';

// Mock-data fallback is disabled under Vitest so tests see real request failures
// instead of silently passing on fallback data.
const isTestEnv =
  typeof process !== 'undefined' &&
  !!process.env &&
  (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test');

// Thrown for HTTP 401. Never replaced by mock fallback data: an expired or
// invalid session must surface so the UI can send the user to the login screen.
export class UnauthorizedError extends Error {
  constructor(message = '인증이 필요합니다. 다시 로그인해주세요.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export const authEvents = {
  // Subscribe to session-expiry events (any protected request answered with 401).
  // Returns an unsubscribe function.
  onUnauthorized(listener: UnauthorizedListener): () => void {
    unauthorizedListeners.add(listener);
    return () => {
      unauthorizedListeners.delete(listener);
    };
  }
};

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

// In-memory token with localStorage persistence (no default: logged out until login)
let currentAuthToken: string | null = readStoredToken();

export const authStorage = {
  getToken(): string | null {
    return currentAuthToken;
  },
  setToken(token: string | null) {
    currentAuthToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  }
};

// Decides what a failed request resolves to. 401s always rethrow; other errors
// fall back to mock data only when fallback is enabled and data was provided.
export function resolveRequestFailure<T>(error: unknown, fallbackData: T | undefined, fallbackEnabled: boolean): T {
  if (isUnauthorizedError(error)) throw error;
  if (fallbackEnabled && fallbackData !== undefined) return fallbackData;
  throw error;
}

interface RequestBehavior {
  // Auth endpoints answer 401 for bad credentials; that is not a session expiry.
  isAuthAttempt?: boolean;
}

function handleSessionExpired(): void {
  authStorage.setToken(null);
  unauthorizedListeners.forEach((listener) => listener());
}

// Safe fetch helper with fallback to initial mock data on network error
async function request<T>(endpoint: string, options?: RequestInit, fallbackData?: T, behavior: RequestBehavior = {}): Promise<T> {
  try {
    const token = authStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message = errBody.message || `API Error: ${res.status}`;
      if (res.status === 401 && !behavior.isAuthAttempt) {
        handleSessionExpired();
        throw new UnauthorizedError(errBody.message || undefined);
      }
      throw new Error(message);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      console.warn(`[API Client Warning] Failed fetching ${endpoint}:`, error);
    }
    return resolveRequestFailure(error, fallbackData, !isTestEnv);
  }
}

export const authApiService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, undefined, { isAuthAttempt: true });
    if (res.token) {
      authStorage.setToken(res.token);
    }
    return res;
  },

  async signup(email: string, password: string, nickname: string, role: string = 'owner'): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname, role }),
    }, undefined, { isAuthAttempt: true });
    if (res.token) {
      authStorage.setToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<{ user: User; managedPets: PetProfile[] }> {
    // No mock fallback: a fake "logged-in u1" must never appear when /auth/me fails.
    return request<{ user: User; managedPets: PetProfile[] }>('/auth/me', { method: 'GET' });
  },

  async createFamilyInvite(petId: string): Promise<FamilyInvite> {
    return request<FamilyInvite>('/auth/family/invite', {
      method: 'POST',
      body: JSON.stringify({ petId }),
    });
  },

  async joinFamily(inviteCode: string): Promise<{ pet: PetProfile; sharedPetIds: string[] }> {
    return request<{ pet: PetProfile; sharedPetIds: string[] }>('/auth/family/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  logout() {
    authStorage.setToken(null);
  }
};

export const petApiService = {
  // 1. Pets Management
  async getPets(): Promise<PetProfile[]> {
    return request<PetProfile[]>('/pets', { method: 'GET' }, INITIAL_PETS);
  },

  async createPet(pet: Partial<PetProfile>): Promise<PetProfile> {
    return request<PetProfile>('/pets', {
      method: 'POST',
      body: JSON.stringify(pet),
    });
  },

  async updatePet(petId: string, updates: Partial<PetProfile>): Promise<PetProfile> {
    return request<PetProfile>(`/pets/${petId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async updatePetHappiness(petId: string, increment: number = 5): Promise<{ happiness: number }> {
    return request<{ happiness: number }>(`/pets/${petId}/happiness`, {
      method: 'POST',
      body: JSON.stringify({ increment }),
    }, { happiness: 90 });
  },

  async getDashboard(petId: string): Promise<any> {
    return request<any>(`/pets/${petId}/dashboard`, { method: 'GET' });
  },

  // 2. Daily & Health Records
  async getDailyRecords(petId?: string): Promise<RecordItem[]> {
    const query = petId ? `?petId=${encodeURIComponent(petId)}` : '';
    return request<RecordItem[]>(`/records/daily${query}`, { method: 'GET' }, INITIAL_DAILY_RECORDS);
  },

  async createDailyRecord(record: Partial<RecordItem> & { petId?: string }): Promise<RecordItem> {
    return request<RecordItem>('/records/daily', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  async getHealthRecords(petId?: string): Promise<HealthRecord[]> {
    const query = petId ? `?petId=${encodeURIComponent(petId)}` : '';
    return request<HealthRecord[]>(`/records/health${query}`, { method: 'GET' }, INITIAL_HEALTH_RECORDS);
  },

  async createHealthRecord(record: Partial<HealthRecord> & { petId?: string }): Promise<HealthRecord> {
    return request<HealthRecord>('/records/health', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  // 3. Walks & Shapeify
  async startWalk(petId: string, coords?: { lat: number; lng: number }): Promise<{ walkId: string }> {
    return request<{ walkId: string }>('/walks/start', {
      method: 'POST',
      body: JSON.stringify({ petId, startLatitude: coords?.lat, startLongitude: coords?.lng }),
    });
  },

  async endWalk(walkData: Partial<WalkSession> & { walkId?: string; petId?: string; coordinates?: any[] }): Promise<WalkSession> {
    return request<WalkSession>('/walks/end', {
      method: 'POST',
      body: JSON.stringify(walkData),
    });
  },

  async shapeifyWalk(walkId: string, targetShape: string, rawCoordinates: any[]): Promise<any> {
    return request<any>(`/walks/${walkId}/shapeify`, {
      method: 'POST',
      body: JSON.stringify({ targetShape, rawCoordinates }),
    });
  },

  // 4. Places & Community
  async getNearbyPlaces(category?: string): Promise<CommunityPlace[]> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return request<CommunityPlace[]>(`/places/nearby${query}`, { method: 'GET' }, INITIAL_COMMUNITY_PLACES);
  },

  async createPlaceReview(placeId: string, review: { rating: number; content: string; tags?: string[] }): Promise<any> {
    return request<any>(`/places/${placeId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  },

  // 5. Gemini AI Doctor (Multimodal Vision & History)
  async analyzePetAI(data: {
    petId?: string;
    petName: string;
    breed: string;
    age?: string;
    category?: string;
    behaviorText?: string;
    imageBase64?: string;
    imageMimeType?: string;
  }): Promise<AIConsultationResult> {
    return request<AIConsultationResult>('/ai/doctor-analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAIHistory(petId: string): Promise<AIConsultationResult[]> {
    return request<AIConsultationResult[]>(`/ai/history/${encodeURIComponent(petId)}`, {
      method: 'GET',
    }, []);
  },

  // 6. Gemini AI Pixel Pet Characterizer
  async characterizePixelPet(data: {
    petName: string;
    breed: string;
    imageBase64?: string;
    imageMimeType?: string;
  }): Promise<PixelCharacterAnalysis> {
    return request<PixelCharacterAnalysis>('/ai/pixel-characterize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
