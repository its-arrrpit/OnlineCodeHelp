// ===================================================================
// TestCase Controller
// ===================================================================

import { Request, Response } from 'express';
import * as testCaseService from '../services/testcase.service';
import { CreateTestCaseInput, UpdateTestCaseInput } from '../schemas/testcase.schema';

/**
 * GET /api/problems/:problemId/testcases
 * Lists all test cases for a problem. Admin only.
 */
export async function list(req: Request, res: Response): Promise<void> {
  const problemId = req.params.problemId as string;

  const testCases = await testCaseService.listTestCases(problemId);

  res.json({
    success: true,
    data: testCases,
  });
}

/**
 * POST /api/problems/:problemId/testcases
 * Creates a new test case for a problem. Admin only.
 */
export async function create(req: Request, res: Response): Promise<void> {
  const problemId = req.params.problemId as string;
  const input = req.body as CreateTestCaseInput;

  const testCase = await testCaseService.createTestCase(problemId, input);

  res.status(201).json({
    success: true,
    data: testCase,
  });
}

/**
 * PUT /api/testcases/:id
 * Updates an existing test case. Admin only.
 */
export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const input = req.body as UpdateTestCaseInput;

  const testCase = await testCaseService.updateTestCase(id, input);

  res.json({
    success: true,
    data: testCase,
  });
}

/**
 * DELETE /api/testcases/:id
 * Deletes a test case. Admin only.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  await testCaseService.deleteTestCase(id);

  res.json({
    success: true,
    data: { message: 'Test case deleted successfully' },
  });
}
