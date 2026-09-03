// ===================================================================
// Problem Service — Business Logic for Problems (Cache-Aside Edition)
// ===================================================================
// Handles all problem-related operations:
//   - List problems (public, paginated, filterable, Redis cached)
//   - Get problem by ID (public, sample test cases, Redis cached)
//   - Create problem (admin, invalidates list cache)
//   - Update problem (admin, invalidates problem + list cache)
//   - Delete problem (admin, cascading, invalidates cache)
//
// SYSTEM DESIGN CONCEPT — Cache-Aside Pattern:
//   1. Reads check Redis first. Cache Hit returns in <2ms.
//   2. Cache Miss queries PostgreSQL, sets Redis key with TTL.
//   3. Writes / Updates purge the cache immediately so users never see stale data.
// ===================================================================

import { Difficulty } from '@prisma/client';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CacheService } from './cache.service';
import { CreateProblemInput, UpdateProblemInput } from '../schemas/problem.schema';

const PROBLEM_CACHE_TTL = 3600; // 1 hour for problem detail
const PROBLEM_LIST_CACHE_TTL = 300; // 5 minutes for problem listing pages

// ─── List Problems (Public, Cached) ─────────────────────────────────

/**
 * Returns a paginated list of published problems.
 * Utilizes Redis Cache-Aside to minimize PostgreSQL query load.
 */
export async function listProblems(
  page: number = 1,
  limit: number = 10,
  difficulty?: Difficulty
) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(50, Number(limit) || 10));
  const cacheKey = `problems:list:p${pageNum}:l${limitNum}:d${difficulty || 'all'}`;

  return await CacheService.getOrSet(cacheKey, PROBLEM_LIST_CACHE_TTL, async () => {
    // Build the WHERE clause dynamically.
    // Only published problems are shown to users.
    const where: { isPublished: boolean; difficulty?: Difficulty } = {
      isPublished: true,
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const [items, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        select: {
          id: true,
          title: true,
          difficulty: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.problem.count({ where }),
    ]);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  });
}

// ─── Get Problem by ID (Public, Cached) ─────────────────────────────

/**
 * Returns a single problem with its sample test cases.
 * Uses Cache-Aside for regular users.
 */
export async function getProblemById(id: string, isAdmin = false) {
  const cacheKey = `problem:public:${id}`;

  // Only use cache for regular public users (admins need live hidden test cases)
  if (!isAdmin) {
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      testCases: {
        where: isAdmin ? {} : { isSample: true },
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          input: true,
          expectedOutput: true,
          isSample: true,
          orderIndex: true,
          ...(isAdmin ? { timeLimitMs: true, memoryLimitMb: true } : {}),
        },
      },
    },
  });

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  if (!isAdmin && !problem.isPublished) {
    throw ApiError.notFound('Problem not found');
  }

  // Populate cache for public users
  if (!isAdmin) {
    await CacheService.set(cacheKey, problem, PROBLEM_CACHE_TTL);
  }

  return problem;
}

// ─── Create Problem (Admin) ─────────────────────────────────────────

/**
 * Creates a new problem and purges problem listing caches.
 */
export async function createProblem(input: CreateProblemInput, adminId: string) {
  const problem = await prisma.problem.create({
    data: {
      title: input.title,
      description: input.description,
      difficulty: input.difficulty,
      constraints: input.constraints,
      examples: input.examples,
      isPublished: input.isPublished,
      createdBy: adminId,
    },
  });

  // Purge problem list cache so newly created problem appears immediately
  await CacheService.delPattern('problems:list:*');

  return problem;
}

// ─── Update Problem (Admin) ─────────────────────────────────────────

/**
 * Updates an existing problem and invalidates its cache.
 */
export async function updateProblem(id: string, input: UpdateProblemInput) {
  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Problem not found');
  }

  const updated = await prisma.problem.update({
    where: { id },
    data: input,
  });

  // Invalidate individual problem cache and listing caches
  await Promise.all([
    CacheService.del(`problem:public:${id}`),
    CacheService.delPattern('problems:list:*'),
  ]);

  return updated;
}

// ─── Delete Problem (Admin) ─────────────────────────────────────────

/**
 * Deletes a problem and purges its cache.
 */
export async function deleteProblem(id: string) {
  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Problem not found');
  }

  await prisma.problem.delete({ where: { id } });

  // Invalidate individual problem cache and listing caches
  await Promise.all([
    CacheService.del(`problem:public:${id}`),
    CacheService.delPattern('problems:list:*'),
  ]);
}
