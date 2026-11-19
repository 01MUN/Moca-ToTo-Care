import express from 'express';
import { createStore, type Store } from './store';
import { registerAuthRoutes } from './routes/auth';
import { registerPetRoutes } from './routes/pets';
import { registerRecordRoutes } from './routes/records';
import { registerWalkRoutes } from './routes/walks';
import { registerPlaceRoutes } from './routes/places';
import { registerAiRoutes } from './routes/ai';

import { createAuthGuard } from './auth';

export interface CreateAppOptions {
  jwtSecret: string;
  store?: Store;
}

// Builds the Express app with all /api/v1/* routes. Vite middleware, static
// serving and listen() stay in server.ts so tests can mount the API alone.
export function createApp(options: CreateAppOptions): express.Express {
  const app = express();
  const store = options.store ?? createStore();
  const { jwtSecret } = options;

  app.use(express.json());
  app.use('/api/v1', createAuthGuard(jwtSecret, store.usersDb));

  registerAuthRoutes(app, store, jwtSecret);
  registerPetRoutes(app, store);
  registerRecordRoutes(app, store);
  registerWalkRoutes(app, store);
  registerPlaceRoutes(app, store);
  registerAiRoutes(app, store);

  return app;
}
