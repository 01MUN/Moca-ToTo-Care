import type { Express } from 'express';
import type { Store } from '../store';

export function registerWalkRoutes(app: Express, store: Store): void {
  const { activeWalks } = store;

  app.post('/api/v1/walks/start', (req, res) => {
    const { petId, startLatitude, startLongitude } = req.body;
    const walkId = `walk_${Date.now()}`;
    activeWalks[walkId] = {
      walkId,
      petId: petId || 'p1',
      startedAt: new Date(),
      coordinates: [{ lat: startLatitude || 37.5665, lng: startLongitude || 126.9780 }]
    };
    res.status(201).json({ success: true, walkId, message: '산책이 시작되었습니다.' });
  });

  app.post('/api/v1/walks/end', (req, res) => {
    const { walkId, distanceKm, durationSeconds, calories, steps, coordinates } = req.body;
    const walk = activeWalks[walkId] || { startedAt: new Date() };

    const walkLog = {
      id: walkId || `walk_${Date.now()}`,
      petId: walk.petId || 'p1',
      distanceKm: distanceKm || 1.8,
      durationSeconds: durationSeconds || 1800,
      calories: calories || 120,
      steps: steps || 2400,
      rawCoordinatesJson: coordinates || walk.coordinates || [],
      shapeType: 'paw',
      weather: '☀️ 24°C 맑음',
      savedCardUrl: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600',
      endedAt: new Date()
    };

    delete activeWalks[walkId];
    res.json({ success: true, data: walkLog, message: '산책이 성공적으로 종료되어 기록되었습니다.' });
  });

  // POST /api/v1/walks/:walkId/shapeify - Shapeify Route Transformation API
  app.post('/api/v1/walks/:walkId/shapeify', (req, res) => {
    const { targetShape = 'paw', rawCoordinates = [] } = req.body;
    
    // Shapeify algorithm mock conversion metadata
    const shapeifyResult = {
      walkId: req.params.walkId,
      appliedShape: targetShape, // 'paw', 'heart', 'bone'
      pointCountOriginal: rawCoordinates.length || 42,
      pointCountSmoothed: 24,
      smoothAccuracyPercentage: 98.2,
      shapedSvgPath: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
      cardImageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600"
    };

    res.json({ success: true, data: shapeifyResult, message: `산책 경로가 '${targetShape}' 아트 형상으로 성공적으로 변환되었습니다.` });
  });
}
