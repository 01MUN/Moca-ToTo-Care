import type { Express } from 'express';
import { getAuthUser } from '../auth';
import { accessiblePetIds, requirePetAccess } from '../authorization';
import { validate } from '../validation';
import { dailyRecordBody, healthRecordBody, petIdQuery } from '../schemas';
import type { Store } from '../store';

export function registerRecordRoutes(app: Express, store: Store): void {
  const { dailyRecordsDb, healthRecordsDb, petsDb } = store;
  // ?petId= is optional on list endpoints; when present it must be accessible.
  const memberOfQueryPet = requirePetAccess(petsDb, { from: 'query', level: 'member', optional: true });
  const memberOfBodyPet = requirePetAccess(petsDb, { from: 'body', level: 'member' });

  // Filters records to the requested pet, or to every pet the caller can access.
  const visibleTo = <T extends { petId: string }>(records: T[], res: Parameters<typeof getAuthUser>[0], petId?: string): T[] => {
    if (petId) return records.filter(r => r.petId === petId);
    const ids = accessiblePetIds(getAuthUser(res));
    return records.filter(r => ids.has(r.petId));
  };

  app.get('/api/v1/records/daily', validate({ query: petIdQuery }), memberOfQueryPet, (req, res) => {
    const filtered = visibleTo(dailyRecordsDb, res, req.query.petId as string | undefined);
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  app.post('/api/v1/records/daily', validate({ body: dailyRecordBody }), memberOfBodyPet, (req, res) => {
    const newRecord = {
      id: `r${Date.now()}`,
      petId: req.body.petId as string,
      recordDate: req.body.recordDate || new Date().toISOString().split('T')[0],
      feedChecked: Boolean(req.body.feedChecked),
      waterChecked: Boolean(req.body.waterChecked),
      stoolChecked: Boolean(req.body.stoolChecked),
      medicineChecked: Boolean(req.body.medicineChecked),
      notes: req.body.notes || ''
    };
    dailyRecordsDb.push(newRecord);
    res.status(201).json({ success: true, data: newRecord });
  });

  app.get('/api/v1/records/health', validate({ query: petIdQuery }), memberOfQueryPet, (req, res) => {
    const filtered = visibleTo(healthRecordsDb, res, req.query.petId as string | undefined);
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  app.post('/api/v1/records/health', validate({ body: healthRecordBody }), memberOfBodyPet, (req, res) => {
    const newRecord = {
      id: `h${Date.now()}`,
      petId: req.body.petId as string,
      visitDate: req.body.visitDate || new Date().toISOString().split('T')[0],
      category: req.body.category || 'checkup',
      hospitalName: req.body.hospitalName || '동물병원',
      doctorName: req.body.doctorName || '',
      diagnosis: req.body.diagnosis || '',
      prescription: req.body.prescription || '',
      cost: Number(req.body.cost) || 0,
      weightAtVisit: Number(req.body.weightAtVisit) || 3.8
    };
    healthRecordsDb.push(newRecord);
    res.status(201).json({ success: true, data: newRecord });
  });
}
