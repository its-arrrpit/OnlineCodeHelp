// ===================================================================
// TestCase Service — Business Logic for Test Cases
// ===================================================================
// Test cases are managed by admins and used by workers during execution.
// Regular users never see hidden test cases directly.
// ===================================================================

import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CacheService } from './cache.service';
import { CreateTestCaseInput, UpdateTestCaseInput } from '../schemas/testcase.schema';

// ─── List Test Cases for a Problem (Admin) ──────────────────────────

/**
 * Returns all test cases for a problem, ordered by orderIndex.
 * Admin only — includes hidden test cases.
 *
 * @param problemId - Problem UUID
 */
export async function listTestCases(problemId: string) {
  // First verify the problem exists
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  });

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  const testCases = await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { orderIndex: 'asc' },
  });

  return testCases;
}

// ─── Create Test Case (Admin) ───────────────────────────────────────

/**
 * Adds a new test case to a problem.
 *
 * @param problemId - Problem UUID
 * @param input - Validated test case data
 */
export async function createTestCase(problemId: string, input: CreateTestCaseInput) {
  // Verify the problem exists
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  });

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  const testCase = await prisma.testCase.create({
    data: {
      problemId,
      input: input.input,
      expectedOutput: input.expectedOutput,
      timeLimitMs: input.timeLimitMs,
      memoryLimitMb: input.memoryLimitMb,
      isSample: input.isSample,
      orderIndex: input.orderIndex,
    },
  });

  // Invalidate problem public cache so sample test cases stay fresh
  await CacheService.del(`problem:public:${problemId}`);

  return testCase;
}

// ─── Update Test Case (Admin) ───────────────────────────────────────

/**
 * Updates an existing test case.
 *
 * @param testCaseId - TestCase UUID
 * @param input - Fields to update
 */
export async function updateTestCase(testCaseId: string, input: UpdateTestCaseInput) {
  const existing = await prisma.testCase.findUnique({
    where: { id: testCaseId },
  });

  if (!existing) {
    throw ApiError.notFound('Test case not found');
  }

  const updated = await prisma.testCase.update({
    where: { id: testCaseId },
    data: input,
  });

  // Invalidate problem public cache
  await CacheService.del(`problem:public:${existing.problemId}`);

  return updated;
}

// ─── Delete Test Case (Admin) ───────────────────────────────────────

/**
 * Deletes a test case.
 *
 * @param testCaseId - TestCase UUID
 */
export async function deleteTestCase(testCaseId: string) {
  const existing = await prisma.testCase.findUnique({
    where: { id: testCaseId },
  });

  if (!existing) {
    throw ApiError.notFound('Test case not found');
  }

  await prisma.testCase.delete({ where: { id: testCaseId } });

  // Invalidate problem public cache
  await CacheService.del(`problem:public:${existing.problemId}`);
}
