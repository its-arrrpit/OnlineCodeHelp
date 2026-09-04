// ===================================================================
// Seed Expanded DSA Problems Script
// ===================================================================
// Seeds all expanded LeetCode problems from problemsData.ts into PostgreSQL
// and invalidates Redis problem caches.
//
// Run with: npx tsx prisma/seed_expanded.ts
// ===================================================================

import { PrismaClient, Role } from '@prisma/client';
import Redis from 'ioredis';
import { ALL_PROBLEMS } from './problemsData';

const prisma = new PrismaClient();

async function seedMore() {
  console.log('🚀 Seeding expanded LeetCode problem library...');

  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!admin) {
    throw new Error('Admin user not found. Please run base seed first (npm run prisma:seed).');
  }

  let addedCount = 0;
  let skippedCount = 0;

  for (const prob of ALL_PROBLEMS) {
    const existing = await prisma.problem.findFirst({
      where: { title: prob.title },
      include: { testCases: true },
    });

    if (existing) {
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
        console.log(`[~] Backfilled test cases for existing problem: "${prob.title}"`);
      } else {
        skippedCount++;
      }
      continue;
    }

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

    addedCount++;
    console.log(`[+] Added problem: "${prob.title}" [${prob.difficulty}]`);
  }

  console.log(`\n======================================================`);
  console.log(`Successfully added ${addedCount} new problems! (${skippedCount} already existed)`);
  console.log(`Total catalog: ${ALL_PROBLEMS.length} problems`);
  console.log(`======================================================`);

  // Invalidate Redis problem caches so UI sees new problems immediately
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      retryStrategy: () => null,
    });

    redis.on('error', () => {});

    const keys = await Promise.race([
      redis.keys('*problem*'),
      new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ]).catch(() => [] as string[]);

    if (keys && keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Cleared ${keys.length} cached problem keys in Redis.`);
    }
    redis.disconnect();
  } catch {
    // Redis offline; safe to ignore
  }
}

seedMore()
  .catch((e) => {
    console.error('Failed to seed more problems:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
