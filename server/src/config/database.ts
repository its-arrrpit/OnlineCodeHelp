// ===================================================================
// Prisma Client Singleton
// ===================================================================
// WHY A SINGLETON?
//   Each PrismaClient instance holds a database connection pool.
//   If we created a new PrismaClient in every file that needs DB access,
//   we'd exhaust PostgreSQL's connection limit quickly.
//   Instead, we create ONE instance and import it everywhere.
//
// TYPESCRIPT CONCEPT — Module-level Singleton:
//   Node.js caches module exports. When multiple files import from
//   this module, they all get the same `prisma` object.
//   This is the simplest singleton pattern in Node.js.
// ===================================================================

import { PrismaClient } from '@prisma/client';
import { config } from './env';
import { logger } from '../utils/logger';

// Create the singleton Prisma client
export const prisma = new PrismaClient({
  // In development, log all queries for debugging.
  // In production, only log errors and warnings.
  log: config.isDev
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

/**
 * Connects to the database and logs the result.
 * Called once at server startup.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to PostgreSQL');
    process.exit(1); // Exit — the server cannot function without a database
  }
}

/**
 * Gracefully disconnects from the database.
 * Called during server shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Disconnected from PostgreSQL');
}
