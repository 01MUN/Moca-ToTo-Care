import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type express from 'express';

export interface TestServer {
  baseUrl: string;
  close: () => Promise<void>;
}

// Test-only helper: listens on an ephemeral port so tests can hit the real
// Express app with the built-in fetch (no supertest dependency).
export async function startTestServer(app: express.Express): Promise<TestServer> {
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}/api/v1`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
  };
}
