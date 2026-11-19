import type { Express } from 'express';
import { getAuthUser } from '../auth';
import { accessiblePetIds, requirePetAccess } from '../authorization';
import { toPetProfile } from '../petProfile';
import { validate } from '../validation';
import { createPetBody, happinessBody, petIdParams, updatePetBody } from '../schemas';
import type { Store } from '../store';

type Pet = Store['petsDb'][number];

export function registerPetRoutes(app: Express, store: Store): void {
  const { petsDb, usersDb, familyInvitesDb } = store;
  const memberOfPet = requirePetAccess(petsDb, { from: 'params', level: 'member' });
  const ownerOfPet = requirePetAccess(petsDb, { from: 'params', level: 'owner' });

  // GET /api/v1/pets - Get user's pets (owned + co-parenting). Never falls back
  // to other users' pets: a user without pets gets an empty list.
  app.get('/api/v1/pets', (req, res) => {
    const ids = accessiblePetIds(getAuthUser(res));
    const userPets = petsDb.filter(p => ids.has(p.id));
    res.json({ success: true, count: userPets.length, data: userPets.map(p => toPetProfile(p)) });
  });

  // POST /api/v1/pets - Register new pet
  app.post('/api/v1/pets', validate({ body: createPetBody }), (req, res) => {
    const user = getAuthUser(res);
    const { name, breed, birthDate, weight, traits, avatarUrl, currentTheme } = req.body;
    const newPet = {
      id: `p${Date.now()}`,
      userId: user.id,
      name: name || '아기 멍냥',
      breed: breed || '믹스견',
      birthDate: birthDate || new Date().toISOString().split('T')[0],
      weight: parseFloat(weight) || 3.0,
      happiness: 80,
      traits: traits || '',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      currentTheme: currentTheme || 'living'
    };
    petsDb.push(newPet);
    user.ownedPetIds.push(newPet.id);
    res.status(201).json({ success: true, data: toPetProfile(newPet) });
  });

  // PATCH /api/v1/pets/:petId - Update pet profile & theme (owner only)
  app.patch('/api/v1/pets/:petId', validate({ params: petIdParams, body: updatePetBody }), ownerOfPet, (req, res) => {
    const pet = res.locals.pet as Pet;
    const petIndex = petsDb.findIndex(p => p.id === pet.id);
    petsDb[petIndex] = { ...petsDb[petIndex], ...req.body };
    res.json({ success: true, data: toPetProfile(petsDb[petIndex]) });
  });

  // DELETE /api/v1/pets/:petId - Remove a pet (owner only). Detaches it from
  // every user and drops its pending family invites.
  app.delete('/api/v1/pets/:petId', validate({ params: petIdParams }), ownerOfPet, (req, res) => {
    const pet = res.locals.pet as Pet;
    petsDb.splice(petsDb.findIndex(p => p.id === pet.id), 1);
    for (const user of usersDb) {
      user.ownedPetIds = user.ownedPetIds.filter(id => id !== pet.id);
      user.sharedPetIds = user.sharedPetIds.filter(id => id !== pet.id);
    }
    const remainingInvites = familyInvitesDb.filter(i => i.petId !== pet.id);
    familyInvitesDb.splice(0, familyInvitesDb.length, ...remainingInvites);
    res.json({ success: true, message: `'${pet.name}' 프로필이 삭제되었습니다.`, data: { id: pet.id } });
  });

  // ==========================================
  // [v1 API] Home Dashboard & Happiness State
  // ==========================================
  app.get('/api/v1/pets/:petId/dashboard', validate({ params: petIdParams }), memberOfPet, (req, res) => {
    const pet = res.locals.pet as Pet;
    res.json({
      success: true,
      data: {
        pet: toPetProfile(pet),
        careScore: 95,
        todaySummary: {
          walkDistanceKm: 2.4,
          walkTimeMinutes: 45,
          feedStatus: '완료 (2/2회)',
          waterMl: 350,
        },
        ddayEvents: [
          { title: '심장사상충 예방약 복용', dday: -3, targetDate: '2026-08-13' },
          { title: '건강검진 예약', dday: 12, targetDate: '2026-08-22' }
        ]
      }
    });
  });

  // POST /api/v1/pets/:petId/happiness - Update pet touch interaction happiness
  app.post('/api/v1/pets/:petId/happiness', validate({ params: petIdParams, body: happinessBody }), memberOfPet, (req, res) => {
    const pet = res.locals.pet as Pet;
    const { increment = 5 } = req.body;
    pet.happiness = Math.min(100, pet.happiness + increment);
    res.json({ success: true, happiness: pet.happiness, message: `${pet.name}의 행복도가 상승했습니다! 💕` });
  });
}
