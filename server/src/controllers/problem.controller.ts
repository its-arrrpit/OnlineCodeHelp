// ===================================================================
// Problem Controller
// ===================================================================

import { Request, Response } from 'express';
import * as problemService from '../services/problem.service';
import { CreateProblemInput, UpdateProblemInput, ProblemQueryInput } from '../schemas/problem.schema';

/**
 * GET /api/problems
 * Lists published problems with pagination and optional difficulty filter.
 */
export async function list(req: Request, res: Response): Promise<void> {
  // Query params come as strings. Zod's z.coerce.number() in
  // problemQuerySchema converts them to numbers during validation.
  const { page, limit, difficulty } = req.query as unknown as ProblemQueryInput;

  const result = await problemService.listProblems(page, limit, difficulty);

  res.json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/problems/:id
 * Returns a single problem with sample test cases.
 * Admins see all test cases; regular users see only samples.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const isAdmin = req.user?.role === 'ADMIN';

  const problem = await problemService.getProblemById(id, isAdmin);

  res.json({
    success: true,
    data: problem,
  });
}

/**
 * POST /api/problems
 * Creates a new problem. Admin only.
 */
export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateProblemInput;
  const adminId = req.user!.userId;

  const problem = await problemService.createProblem(input, adminId);

  res.status(201).json({
    success: true,
    data: problem,
  });
}

/**
 * PUT /api/problems/:id
 * Updates an existing problem. Admin only.
 */
export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const input = req.body as UpdateProblemInput;

  const problem = await problemService.updateProblem(id, input);

  res.json({
    success: true,
    data: problem,
  });
}

/**
 * DELETE /api/problems/:id
 * Deletes a problem and its test cases. Admin only.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  await problemService.deleteProblem(id);

  // 200 OK with a confirmation message (not 204, so the client gets JSON)
  res.json({
    success: true,
    data: { message: 'Problem deleted successfully' },
  });
}
