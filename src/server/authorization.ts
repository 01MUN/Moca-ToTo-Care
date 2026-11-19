import type express from 'express';
import type { UserRecord } from './store';
import { getAuthUser } from './auth';

// Per-pet authorization. A pet is visible to its owner and to co-parents it was
// shared with. Anyone else gets the same 404 as for a nonexistent pet, so the
// API never reveals whether another user's pet exists.

export type PetAccessLevel = 'member' | 'owner';
type PetAccess = 'owner' | 'shared';

export const PET_NOT_FOUND_MESSAGE = '반려동물을 찾을 수 없습니다.';
const OWNER_ONLY_MESSAGE = '대표 보호자만 할 수 있는 작업입니다.';

interface PetLike {
  id: string;
  userId: string;
}

export function getPetAccess(user: UserRecord, pet: PetLike): PetAccess | null {
  if (user.ownedPetIds.includes(pet.id) || pet.userId === user.id) return 'owner';
  if (user.sharedPetIds.includes(pet.id)) return 'shared';
  return null;
}

// Ids of every pet the user may see (owned + shared), for filtering list endpoints.
export function accessiblePetIds(user: UserRecord): Set<string> {
  return new Set([...user.ownedPetIds, ...user.sharedPetIds]);
}

export function sendPetNotFound(res: express.Response): void {
  res.status(404).json({ success: false, message: PET_NOT_FOUND_MESSAGE });
}

export interface RequirePetAccessOptions {
  /** Where the petId comes from. */
  from: 'params' | 'query' | 'body';
  /** 'member' = owner or co-parent; 'owner' = owner only (co-parent gets 403). */
  level: PetAccessLevel;
  /** When true a missing petId passes through (the handler must then filter by access). */
  optional?: boolean;
}

// Middleware: resolves req[from].petId, enforces access and stores the pet in
// res.locals.pet. Must run after the auth guard and validate().
export function requirePetAccess<T extends PetLike>(petsDb: T[], options: RequirePetAccessOptions): express.RequestHandler {
  return (req, res, next) => {
    const source = req[options.from] as Record<string, unknown> | undefined;
    const petId = source?.petId;
    if (petId === undefined && options.optional) return next();
    if (typeof petId !== 'string') return sendPetNotFound(res);

    const pet = petsDb.find((p) => p.id === petId);
    const access = pet ? getPetAccess(getAuthUser(res), pet) : null;
    if (!pet || !access) return sendPetNotFound(res);
    if (options.level === 'owner' && access !== 'owner') {
      res.status(403).json({ success: false, message: OWNER_ONLY_MESSAGE });
      return;
    }
    res.locals.pet = pet;
    next();
  };
}
