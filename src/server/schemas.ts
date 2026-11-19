import { z } from 'zod';
import { MAX_PASSWORD_BYTES, passwordByteLength } from './password';

// Request schemas for /api/v1/*. Bodies use z.object (unknown keys are stripped)
// because the current client sends extra fields; PATCH /pets is strict so
// protected fields like id/userId cannot be overwritten.

export const JSON_BODY_LIMIT = '10mb';
export const MAX_IMAGE_BASE64_CHARS = 8 * 1024 * 1024;
const MAX_COORDINATES = 10_000;

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, '올바르지 않은 ID 형식입니다.');
const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => z.string().trim().min(1).max(max);
const isoDate = z.iso.date();
const nonNegative = (max: number) => z.number().finite().min(0).max(max);
const latitude = z.number().finite().min(-90).max(90);
const longitude = z.number().finite().min(-180).max(180);

const imageUrl = z
  .string()
  .max(2_000_000)
  .refine((v) => /^https:\/\//.test(v) || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(v), {
    message: 'https URL 또는 base64 이미지 data URL만 허용됩니다.'
  });

const imageBase64 = z
  .string()
  .max(MAX_IMAGE_BASE64_CHARS)
  .regex(/^[A-Za-z0-9+/]+={0,2}$/, '올바른 base64 이미지 데이터가 아닙니다.');
const imageMimeType = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

const password = z
  .string()
  .refine((v) => passwordByteLength(v) <= MAX_PASSWORD_BYTES, { message: `비밀번호는 ${MAX_PASSWORD_BYTES}바이트 이하여야 합니다.` });

const coordinate = z.union([
  z.object({ lat: latitude, lng: longitude }),
  z.object({ x: z.number().finite(), y: z.number().finite() })
]);
const coordinateList = z.array(coordinate).max(MAX_COORDINATES);

// ---------- params / query ----------
export const petIdParams = z.object({ petId: id });
export const walkIdParams = z.object({ walkId: id });
export const placeIdParams = z.object({ placeId: id });
export const petIdQuery = z.object({ petId: id.optional() });
export const placesQuery = z.object({
  category: z.enum(['all', 'hospital', 'cafe', 'park', 'grooming']).optional()
});

// ---------- auth ----------
const email = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const loginBody = z.object({
  email,
  password: password.pipe(z.string().min(1))
});

export const signupBody = z.object({
  email,
  password: password.pipe(z.string().min(8, '비밀번호는 8자 이상이어야 합니다.')),
  nickname: requiredText(30)
  // `role` is intentionally not accepted: new accounts are always 'owner'.
});

export const familyInviteBody = z.object({ petId: id });
export const familyJoinBody = z.object({ inviteCode: requiredText(40) });

// ---------- pets ----------
const petFields = {
  name: requiredText(30),
  breed: requiredText(50),
  birthDate: isoDate,
  weight: z.number().finite().positive().max(200),
  traits: text(200),
  avatarUrl: imageUrl,
  currentTheme: requiredText(30)
};

export const createPetBody = z.object({
  name: petFields.name.optional(),
  breed: petFields.breed.optional(),
  birthDate: petFields.birthDate.optional(),
  weight: petFields.weight.optional(),
  traits: petFields.traits.optional(),
  avatarUrl: petFields.avatarUrl.optional(),
  currentTheme: petFields.currentTheme.optional()
});

export const updatePetBody = createPetBody
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: '변경할 항목이 없습니다.' });

export const happinessBody = z.object({ increment: z.number().int().min(1).max(10).optional() });

// ---------- records ----------
export const dailyRecordBody = z.object({
  petId: id.optional(),
  recordDate: isoDate.optional(),
  feedChecked: z.boolean().optional(),
  waterChecked: z.boolean().optional(),
  stoolChecked: z.boolean().optional(),
  medicineChecked: z.boolean().optional(),
  notes: text(2000).optional()
});

export const healthRecordBody = z.object({
  petId: id.optional(),
  visitDate: isoDate.optional(),
  category: z.enum(['checkup', 'vaccine', 'treatment', 'dental', 'surgery']).optional(),
  hospitalName: text(100).optional(),
  doctorName: text(50).optional(),
  diagnosis: text(2000).optional(),
  prescription: text(2000).optional(),
  cost: nonNegative(100_000_000).optional(),
  weightAtVisit: z.number().finite().positive().max(200).optional()
});

// ---------- walks ----------
export const startWalkBody = z.object({
  petId: id.optional(),
  startLatitude: latitude.optional(),
  startLongitude: longitude.optional()
});

export const endWalkBody = z.object({
  walkId: id.optional(),
  distanceKm: nonNegative(1000).optional(),
  durationSeconds: z.number().int().min(0).max(7 * 24 * 3600).optional(),
  calories: nonNegative(100_000).optional(),
  steps: z.number().int().min(0).max(10_000_000).optional(),
  coordinates: coordinateList.optional()
});

export const shapeifyBody = z.object({
  targetShape: z.enum(['paw', 'heart', 'bone', 'raw']).optional(),
  rawCoordinates: coordinateList.optional()
});

// ---------- places ----------
export const placeReviewBody = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  content: text(1000).optional(),
  tags: z.array(requiredText(20)).max(10).optional()
});

// ---------- ai ----------
export const doctorAnalyzeBody = z.object({
  petId: id.optional(),
  petName: text(30).optional(),
  breed: text(50).optional(),
  age: text(20).optional(),
  category: z.enum(['behavior', 'stool', 'skin', 'food', 'general']).optional(),
  behaviorText: text(2000).optional(),
  imageBase64: imageBase64.optional(),
  imageMimeType: imageMimeType.optional()
});

export const pixelCharacterizeBody = z.object({
  petName: text(30).optional(),
  breed: text(50).optional(),
  imageBase64: imageBase64.optional(),
  imageMimeType: imageMimeType.optional()
});
