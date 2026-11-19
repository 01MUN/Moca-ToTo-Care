import type { Express } from 'express';
import { getAuthUser } from '../auth';
import { accessiblePetIds, getPetAccess, requirePetAccess, sendPetNotFound } from '../authorization';
import { validate } from '../validation';
import { endWalkBody, petIdQuery, shapeifyBody, startWalkBody, walkIdParams } from '../schemas';
import type { Store, WalkLogRecord } from '../store';
import { randomUUID } from 'node:crypto';
import type { z } from 'zod';

type EndWalkBody = z.infer<typeof endWalkBody>;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Korean relative time for the walk list ("방금 전", "5분 전", "3시간 전", "2일 전").
export function formatTimeAgo(endedAt: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - endedAt.getTime());
  if (diff < MINUTE_MS) return '방금 전';
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)}분 전`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)}시간 전`;
  return `${Math.floor(diff / DAY_MS)}일 전`;
}

// Stored walk -> client WalkSession shape (src/types.ts), without owner fields.
function toWalkSession(walk: WalkLogRecord, now: Date = new Date()) {
  const { userId: _userId, endedAt, ...session } = walk;
  const ended = new Date(endedAt);
  return {
    ...session,
    date: ended.toISOString().slice(0, 10).replace(/-/g, '.'),
    timeAgo: formatTimeAgo(ended, now),
    endedAt
  };
}

export function registerWalkRoutes(app: Express, store: Store): void {
  const { activeWalks, petsDb, walkLogsDb } = store;
  const memberOfBodyPet = requirePetAccess(petsDb, { from: 'body', level: 'member' });
  const memberOfQueryPet = requirePetAccess(petsDb, { from: 'query', level: 'member', optional: true });

  app.post('/api/v1/walks/start', validate({ body: startWalkBody }), memberOfBodyPet, (req, res) => {
    const { petId, startLatitude, startLongitude } = req.body;
    const walkId = `walk_${Date.now()}`;
    activeWalks[walkId] = {
      walkId,
      petId,
      userId: getAuthUser(res).id,
      startedAt: new Date(),
      coordinates: [{ lat: startLatitude || 37.5665, lng: startLongitude || 126.9780 }]
    };
    res.status(201).json({ success: true, walkId, message: '산책이 시작되었습니다.' });
  });

  // GET /api/v1/walks?petId= - Finished walks (newest first) for one accessible
  // pet, or for every pet the caller can access.
  app.get('/api/v1/walks', validate({ query: petIdQuery }), memberOfQueryPet, (req, res) => {
    const petId = req.query.petId as string | undefined;
    const ids = petId ? new Set([petId]) : accessiblePetIds(getAuthUser(res));
    const now = new Date();
    const walks = walkLogsDb
      .filter(w => ids.has(w.petId))
      .slice()
      .reverse()
      .map(w => toWalkSession(w, now));
    res.json({ success: true, count: walks.length, data: walks });
  });

  app.post('/api/v1/walks/end', validate({ body: endWalkBody }), (req, res) => {
    const body = req.body as EndWalkBody;
    const activeWalk = body.walkId ? activeWalks[body.walkId] : undefined;

    // The pet comes from the active walk if there is one, otherwise from the body
    // (the client logs finished walks with { ...session, petId }).
    const petId: unknown = activeWalk?.petId ?? body.petId;
    if (typeof petId !== 'string') {
      return res.status(400).json({ success: false, message: '산책한 반려동물(petId)이 필요합니다.' });
    }
    const user = getAuthUser(res);
    const pet = petsDb.find(p => p.id === petId);
    if (!pet || !getPetAccess(user, pet)) return sendPetNotFound(res);

    // Keep the client's id (shapeify references it) unless it is already taken.
    const requestedId = body.walkId ?? body.id;
    const id = requestedId && !walkLogsDb.some(w => w.id === requestedId) ? requestedId : `walk_${randomUUID()}`;

    // Missing metrics are stored as 0, never replaced with made-up numbers.
    const walkLog: WalkLogRecord = {
      id,
      petId,
      userId: user.id,
      durationMinutes: body.durationMinutes ?? 0,
      distanceKm: body.distanceKm ?? 0,
      calories: body.calories ?? 0,
      stepCount: body.stepCount ?? 0,
      rawPath: body.rawPath ?? activeWalk?.coordinates ?? [],
      shapeType: body.shapeType ?? 'raw',
      ...(body.shapedPath ? { shapedPath: body.shapedPath } : {}),
      ...(body.note ? { note: body.note } : {}),
      weather: body.weather || '',
      endedAt: new Date().toISOString()
    };
    walkLogsDb.push(walkLog);

    if (body.walkId) delete activeWalks[body.walkId];
    res.json({ success: true, data: toWalkSession(walkLog), message: '산책이 성공적으로 종료되어 기록되었습니다.' });
  });

  // POST /api/v1/walks/:walkId/shapeify - Shapeify Route Transformation API
  app.post('/api/v1/walks/:walkId/shapeify', validate({ params: walkIdParams, body: shapeifyBody }), (req, res) => {
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
