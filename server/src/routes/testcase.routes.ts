// ===================================================================
// TestCase Routes
// ===================================================================
// All test case routes are admin-only.
//
// Two route groups:
//   /api/problems/:problemId/testcases  → List and Create (scoped to a problem)
//   /api/testcases/:id                  → Update and Delete (by test case ID)
//
// WHY TWO GROUPS?
//   Creating and listing test cases makes sense under a problem:
//     POST /api/problems/abc/testcases → "Add a test case to problem abc"
//   
//   Updating/deleting uses the test case's own ID:
//     PUT /api/testcases/xyz → "Update test case xyz"
//   
//   This keeps URLs clean and RESTful.
// ===================================================================

import { Router } from 'express';
import * as testCaseController from '../controllers/testcase.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { createTestCaseSchema, updateTestCaseSchema } from '../schemas/testcase.schema';
import { asyncHandler } from '../utils/helpers';

// ─── Routes scoped to a problem ─────────────────────────────────────
// These are mounted at /api/problems/:problemId/testcases

export const problemTestCaseRouter = Router({ mergeParams: true });
// mergeParams: true allows this router to access :problemId from the parent router

problemTestCaseRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(testCaseController.list)
);

problemTestCaseRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createTestCaseSchema),
  asyncHandler(testCaseController.create)
);

// ─── Routes by test case ID ─────────────────────────────────────────
// These are mounted at /api/testcases

export const testCaseRouter = Router();

testCaseRouter.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateTestCaseSchema),
  asyncHandler(testCaseController.update)
);

testCaseRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(testCaseController.remove)
);
