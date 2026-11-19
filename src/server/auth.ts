import type express from 'express';
import type { UserRecord } from './store';

// Helper to extract authenticated user from Bearer token
export function getAuthUser(usersDb: UserRecord[], req: express.Request): UserRecord {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Mock JWT token decoding: format "token_<userId>_<timestamp>" or user ID
    const parts = token.split('_');
    const userId = parts.length >= 2 ? parts[1] : token;
    const matched = usersDb.find(u => u.id === userId || u.email === token);
    if (matched) return matched;
  }
  // Default fallback to primary user u1
  return usersDb[0];
}
