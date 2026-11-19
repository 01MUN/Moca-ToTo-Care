import type { Store } from './store';

type Pet = Store['petsDb'][number];

// Korean age label from an ISO birth date, e.g. "2살 4개월" or "7개월".
export function formatPetAge(birthDate: string, now: Date = new Date()): string {
  const born = new Date(`${birthDate}T00:00:00Z`);
  if (Number.isNaN(born.getTime())) return '';
  let months = (now.getUTCFullYear() - born.getUTCFullYear()) * 12 + (now.getUTCMonth() - born.getUTCMonth());
  if (now.getUTCDate() < born.getUTCDate()) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest}개월`;
  return rest === 0 ? `${years}살` : `${years}살 ${rest}개월`;
}

// Server pet -> API response. Keeps the stored fields and adds the client
// PetProfile field names (src/types.ts) so the UI shows what was saved.
export function toPetProfile(pet: Pet, now: Date = new Date()) {
  return {
    ...pet,
    weightKg: pet.weight,
    birthday: pet.birthDate.replace(/-/g, '.'),
    age: formatPetAge(pet.birthDate, now),
    favoriteFood: pet.traits
  };
}
