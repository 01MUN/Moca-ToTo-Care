import type { Express } from 'express';
import { getAuthUser as getAuthUserFrom } from '../auth';
import type { Store } from '../store';

export function registerPetRoutes(app: Express, store: Store): void {
  const { usersDb, petsDb } = store;
  const getAuthUser = (req: Parameters<typeof getAuthUserFrom>[1]) => getAuthUserFrom(usersDb, req);

  // GET /api/v1/pets - Get user's pets (owned + co-parenting)
  app.get('/api/v1/pets', (req, res) => {
    const user = getAuthUser(req);
    const userPetIds = [...user.ownedPetIds, ...user.sharedPetIds];
    const userPets = petsDb.filter(p => userPetIds.includes(p.id));
    res.json({ success: true, count: userPets.length, data: userPets.length > 0 ? userPets : petsDb.slice(0, 2) });
  });

  // POST /api/v1/pets - Register new pet
  app.post('/api/v1/pets', (req, res) => {
    const user = getAuthUser(req);
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
    res.status(201).json({ success: true, data: newPet });
  });

  // PATCH /api/v1/pets/:petId - Update pet profile & theme
  app.patch('/api/v1/pets/:petId', (req, res) => {
    const { petId } = req.params;
    const petIndex = petsDb.findIndex(p => p.id === petId);
    if (petIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }
    petsDb[petIndex] = { ...petsDb[petIndex], ...req.body };
    res.json({ success: true, data: petsDb[petIndex] });
  });

  // ==========================================
  // [v1 API] Home Dashboard & Happiness State
  // ==========================================
  app.get('/api/v1/pets/:petId/dashboard', (req, res) => {
    const { petId } = req.params;
    const pet = petsDb.find(p => p.id === petId) || petsDb[0];
    res.json({
      success: true,
      data: {
        pet,
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
  app.post('/api/v1/pets/:petId/happiness', (req, res) => {
    const { petId } = req.params;
    const { increment = 5 } = req.body;
    const pet = petsDb.find(p => p.id === petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    pet.happiness = Math.min(100, pet.happiness + increment);
    res.json({ success: true, happiness: pet.happiness, message: `${pet.name}의 행복도가 상승했습니다! 💕` });
  });
}
