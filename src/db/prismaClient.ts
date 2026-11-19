import { PrismaClient } from '@prisma/client';

// Single shared Prisma Client instance for server.ts route handlers.
export const prisma = new PrismaClient();
