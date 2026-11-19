import type { Express } from 'express';
import type { Store } from '../store';

export function registerRecordRoutes(app: Express, store: Store): void {
  const { dailyRecordsDb, healthRecordsDb } = store;

  app.get('/api/v1/records/daily', (req, res) => {
    const petId = req.query.petId as string;
    const filtered = petId ? dailyRecordsDb.filter(r => r.petId === petId) : dailyRecordsDb;
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  app.post('/api/v1/records/daily', (req, res) => {
    const newRecord = {
      id: `r${Date.now()}`,
      petId: req.body.petId || 'p1',
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

  app.get('/api/v1/records/health', (req, res) => {
    const petId = req.query.petId as string;
    const filtered = petId ? healthRecordsDb.filter(r => r.petId === petId) : healthRecordsDb;
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  app.post('/api/v1/records/health', (req, res) => {
    const newRecord = {
      id: `h${Date.now()}`,
      petId: req.body.petId || 'p1',
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
