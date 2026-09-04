// ===================================================================
// Prisma Seed Script — Full Problem Catalog Edition
// ===================================================================
// Populates the database with users and a rich catalog of 32 iconic
// LeetCode problems (Easy, Medium, Hard) across diverse DSA topics.
//
// Run with: npx prisma db seed   OR   npm run prisma:seed
// ===================================================================

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { ALL_PROBLEMS } from './problemsData';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🚀 Seeding database with full LeetCode problem suite...\n');

  // ─── 1. Create Admin User ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codejudge.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@codejudge.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ─── 2. Create Test User ───────────────────────────────────────────
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@codejudge.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'user@codejudge.com',
      passwordHash: userPassword,
      role: Role.USER,
    },
  });
  console.log(`✅ Test user:  ${user.email}\n`);

  // ─── 3. Seed All LeetCode Problems ─────────────────────────────────
  let createdCount = 0;
  let skippedCount = 0;

  for (const prob of ALL_PROBLEMS) {
    const existing = await prisma.problem.findFirst({
      where: { title: prob.title },
      include: { testCases: true },
    });

    if (existing) {
      // If problem exists but has no test cases, populate them
      if (existing.testCases.length === 0) {
        await prisma.testCase.createMany({
          data: prob.testCases.map((tc, idx) => ({
            problemId: existing.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample,
            orderIndex: tc.orderIndex ?? idx,
            timeLimitMs: tc.timeLimitMs ?? 2000,
            memoryLimitMb: tc.memoryLimitMb ?? 256,
          })),
        });
        console.log(`🔄 Backfilled test cases for: "${prob.title}"`);
      } else {
        skippedCount++;
      }
      continue;
    }

    // Create problem along with all test cases
    await prisma.problem.create({
      data: {
        title: prob.title,
        description: prob.description,
        difficulty: prob.difficulty,
        constraints: prob.constraints,
        examples: prob.examples,
        isPublished: true,
        createdBy: admin.id,
        testCases: {
          create: prob.testCases.map((tc, idx) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: tc.isSample,
            orderIndex: tc.orderIndex ?? idx,
            timeLimitMs: tc.timeLimitMs ?? 2000,
            memoryLimitMb: tc.memoryLimitMb ?? 256,
          })),
        },
      },
    });

    createdCount++;
    console.log(`[+] [${prob.difficulty.padEnd(6)}] Created problem: "${prob.title}"`);
  }

  console.log(`\n======================================================`);
  console.log(`✨ Seeding Complete: ${createdCount} created, ${skippedCount} already up-to-date.`);
  console.log(`Total Problems in Catalog: ${ALL_PROBLEMS.length}`);
  console.log(`======================================================`);
  console.log('Admin login: admin@codejudge.com / admin123');
  console.log('User login:  user@codejudge.com / user123\n');

  // ─── 4. Invalidate Redis Caches if Available ───────────────────────
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      retryStrategy: () => null,
    });

    redis.on('error', () => {
      // Silently ignore if Redis is offline during seed
    });

    const keys = await Promise.race([
      redis.keys('*problems*'),
      new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ]).catch(() => [] as string[]);

    if (keys && keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Cleared ${keys.length} cached problem keys in Redis.`);
    }
    redis.disconnect();
  } catch {
    // Redis not running; safe to ignore
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
