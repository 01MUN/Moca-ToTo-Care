export type TabType = 'home' | 'records' | 'walk' | 'community';

export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  age: string;
  weightKg: number;
  avatarUrl: string;
  happiness: number; // 0 to 100
  favoriteFood: string;
  birthday: string;
}

export type ThemeId = 'forest' | 'living' | 'sunset' | 'starry';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  bgGradient: string;
  cardBg: string;
  textColor: string;
  subTextColor: string;
  accentColor: string;
  badgeBg: string;
  ambientPattern: string;
}

export interface RecordItem {
  id: string;
  time: string;
  category: 'food' | 'water' | 'poop' | 'snack' | 'medication';
  title: string;
  detail: string;
  value?: string;
  completed: boolean;
}

export interface HealthRecord {
  id: string;
  date: string;
  hospitalName: string;
  doctorName?: string;
  category: 'checkup' | 'vaccine' | 'treatment' | 'dental' | 'surgery';
  diagnosis: string;
  prescription?: string;
  weightKg: number;
  cost: number;
  memo?: string;
}

export interface WalkSession {
  id: string;
  date: string;
  timeAgo: string;
  durationMinutes: number;
  distanceKm: number;
  calories: number;
  stepCount: number;
  rawPath: { x: number; y: number }[];
  shapeType: 'paw' | 'heart' | 'bone' | 'raw';
  shapedPath?: string; // SVG path d attribute or icon representation
  note?: string;
  weather: string;
}

export interface CommunityReview {
  id: string;
  author: string;
  petName: string;
  avatarUrl: string;
  rating: number;
  date: string;
  content: string;
  tags: string[];
}

export interface CommunityPlace {
  id: string;
  name: string;
  category: 'hospital' | 'cafe' | 'park' | 'grooming';
  rating: number;
  reviewCount: number;
  distanceMeter: number;
  address: string;
  phone: string;
  tags: string[];
  imageUrl: string;
  lat: number; // relative grid coordinates for mock map
  lng: number;
  is24h?: boolean;
  isOpenNow: boolean;
  reviews: CommunityReview[];
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: 'owner' | 'co_parent' | 'guest';
  avatarUrl?: string;
  sharedPetIds: string[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  managedPets: PetProfile[];
}

export interface FamilyInvite {
  inviteCode: string;
  petId: string;
  petName: string;
  inviterName: string;
  expiresAt: string;
}

export type AIConsultationCategory = 'behavior' | 'stool' | 'skin' | 'food' | 'general';

export type PixelSpritePose = 'sitting_cute' | 'belly_up_heart' | 'sleeping_cushion' | 'fluffy_ribbon';

export type PixelFurColorPreset = 
  | 'white' 
  | 'grey_tabby' 
  | 'cheese_tabby' 
  | 'cream_maltipoo' 
  | 'bichon_fluffy' 
  | 'shiba_sable' 
  | 'tuxedo' 
  | 'choco_mocha' 
  | 'calico'
  | 'sakura_pastel';

export interface PixelCharacterAnalysis {
  pixelCharacterName: string;
  species: 'cat' | 'dog';
  breed: string;
  furColorPreset: PixelFurColorPreset;
  furColorName: string;
  primaryColors: string[];
  mainFurHex: string;
  secondaryFurHex: string;
  eyeHex: string;
  blushHex: string;
  outlineStyle: 'soft_lavender' | 'dark_charcoal' | 'rosy_brown' | 'soft_grey';
  recommendedPose: PixelSpritePose;
  hasTabbyStripes: boolean;
  hasWhitePaws: boolean;
  accessories: string[];
  personalityTitle: string;
  rpgStats: {
    fluffiness: number;
    zoomies: number;
    treatRadar: number;
    loyalty: number;
  };
  pixelStyleTip: string;
  retroDialogue: string;
  recommendedGridSize: number;
}

export interface PixelPetData {
  originalImageUrl: string;
  pixelCanvasDataUrl: string;
  gridSize: number;
  pose: PixelSpritePose;
  paletteName: string;
  analysis?: PixelCharacterAnalysis;
  createdAt: string;
}

export interface AIConsultationResult {
  id: string;
  petId: string;
  petName: string;
  category: AIConsultationCategory;
  imageUrl?: string;
  userQuery: string;
  summary: string;
  urgencyLevel: 'NORMAL' | 'ATTENTION' | 'URGENT';
  healthScore: number; // 0 - 100
  innerVoiceTranslation: string;
  moodStatus: string;
  detectedIssues: string[];
  veterinaryTip: string;
  actionPlan: string[];
  createdAt: string;
}
