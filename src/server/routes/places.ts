import type { Express } from 'express';
import type { Store } from '../store';

export function registerPlaceRoutes(app: Express, store: Store): void {
  const { placesDb } = store;

  app.get('/api/v1/places/nearby', (req, res) => {
    const { category } = req.query;
    let result = placesDb;
    if (category && category !== 'all') {
      result = placesDb.filter(p => p.category === category);
    }
    res.json({ success: true, count: result.length, data: result });
  });

  app.get('/api/v1/places/:placeId', (req, res) => {
    const place = placesDb.find(p => p.id === req.params.placeId);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found' });
    res.json({ success: true, data: place });
  });

  app.post('/api/v1/places/:placeId/reviews', (req, res) => {
    const { rating, content, tags } = req.body;
    const newReview = {
      id: `rev_${Date.now()}`,
      placeId: req.params.placeId,
      userId: 'u1',
      rating: rating || 5,
      content: content || '선생님들이 너무 친절하셨어요!',
      tags: tags || ['친절해요'],
      createdAt: new Date()
    };
    res.status(201).json({ success: true, data: newReview });
  });
}
