import { PetProfile, RecordItem, HealthRecord, WalkSession, CommunityPlace, User, AuthResponse, FamilyInvite, AIConsultationResult, PixelCharacterAnalysis } from '../types';
import { INITIAL_PETS, INITIAL_DAILY_RECORDS, INITIAL_HEALTH_RECORDS, INITIAL_WALK_SESSIONS, INITIAL_COMMUNITY_PLACES } from '../data/mockData';

const BASE_URL = '/api/v1';
const AUTH_TOKEN_KEY = 'mocatoto_auth_token';

// In-memory token with localStorage persistence
let currentAuthToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) || 'token_u1_initial' : null;

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

// Safe fetch helper with fallback to initial mock data on network error
async function request<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
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
      throw new Error(errBody.message || `API Error: ${res.status}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (error) {
    console.warn(`[API Client Warning] Failed fetching ${endpoint}, using fallback:`, error);
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw error;
  }
}

export const authApiService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      authStorage.setToken(res.token);
    }
    return res;
  },

  async signup(email: string, password: string, nickname: string, role: string = 'owner'): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname, role }),
    });
    if (res.token) {
      authStorage.setToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<{ user: User; managedPets: PetProfile[] }> {
    return request<{ user: User; managedPets: PetProfile[] }>('/auth/me', { method: 'GET' }, {
      user: {
        id: 'u1',
        email: 'moca_mom@toto.com',
        nickname: '모카맘 (대표 보호자)',
        role: 'owner',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        sharedPetIds: [],
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      managedPets: INITIAL_PETS
    });
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
