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

const TOPIC_KEYWORD_MAP: Record<string, string[]> = {
  'arrays': ['array', 'matrix', 'subarray'],
  'arrays & hashing': ['array', 'matrix', 'subarray', 'hash', 'hash table'],
  'hashing': ['hash', 'hash table', 'map'],
  'two pointers': ['two pointer', 'pointer', 'palindrome'],
  'dynamic programming': ['dynamic programming', 'subsequence', 'substring', 'partition', 'knapsack', 'subset', 'ways'],
  'dp': ['dynamic programming', 'subsequence', 'substring', 'partition', 'knapsack', 'subset', 'ways'],
  'trees & graphs': ['tree', 'graph', 'binary tree', 'node', 'bst', 'depth-first', 'breadth-first'],
  'trees': ['tree', 'binary tree', 'node', 'bst'],
  'graphs': ['graph', 'vertex', 'edge', 'cycle', 'path'],
  'binary search': ['binary search', 'search in', 'median', 'peak'],
  'sliding window': ['window', 'sliding', 'substring', 'consecutive'],
  'greedy': ['greedy', 'jump', 'gas', 'interval', 'maximize'],
  'math': ['math', 'prime', 'digit', 'number', 'integer'],
  'strings': ['string', 'words', 'character', 'anagram'],
};

// ─── List Problems (Public, Cached) ─────────────────────────────────

/**
 * Returns a paginated list of published problems.
 * Utilizes Redis Cache-Aside to minimize PostgreSQL query load.
 */
export async function listProblems(
  page: number = 1,
  limit: number = 10,
  difficulty?: Difficulty,
  search?: string,
  topic?: string
) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(50, Number(limit) || 10));
  const trimmedSearch = search?.trim() || '';
  const trimmedTopic = topic?.trim() || '';
  const cacheKey = `problems:list:p${pageNum}:l${limitNum}:d${difficulty || 'all'}:s${trimmedSearch ? encodeURIComponent(trimmedSearch) : 'none'}:t${trimmedTopic ? encodeURIComponent(trimmedTopic) : 'none'}`;

  return await CacheService.getOrSet(cacheKey, PROBLEM_LIST_CACHE_TTL, async () => {
    const andConditions: any[] = [{ isPublished: true }];

    if (difficulty) {
      andConditions.push({ difficulty });
    }

    // 1. Topic Filtering
    if (trimmedTopic.length > 0) {
      const normalizedTopic = trimmedTopic.toLowerCase();
      const keywords = TOPIC_KEYWORD_MAP[normalizedTopic] || [trimmedTopic];
      const topicOrConditions = keywords.flatMap((kw) => [
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
      ]);
      andConditions.push({ OR: topicOrConditions });
    }

    // 2. Search Text Filtering
    if (trimmedSearch.length > 0) {
      const normalizedSearch = trimmedSearch.toLowerCase();
      const topicKeywords = TOPIC_KEYWORD_MAP[normalizedSearch];
      if (topicKeywords) {
        const searchTopicConditions = topicKeywords.flatMap((kw) => [
          { title: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
        ]);
        andConditions.push({ OR: searchTopicConditions });
      } else {
        andConditions.push({
          OR: [
            { title: { contains: trimmedSearch, mode: 'insensitive' } },
            { description: { contains: trimmedSearch, mode: 'insensitive' } },
          ],
        });
      }
    }

    const where: any = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };

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
