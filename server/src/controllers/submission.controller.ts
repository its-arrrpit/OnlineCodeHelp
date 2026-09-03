// ===================================================================
// Submission Controller
// ===================================================================

import { Request, Response } from 'express';
import * as submissionService from '../services/submission.service';
import { CreateSubmissionInput, SubmissionQueryInput } from '../schemas/submission.schema';

/**
 * POST /api/submissions
 * Submits user code for evaluation.
 * Returns 201 Created with status "QUEUED" immediately.
 */
export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateSubmissionInput;
  const userId = req.user!.userId;
  const isAdmin = req.user?.role === 'ADMIN';

  const submission = await submissionService.createSubmission(input, userId, isAdmin);

  res.status(201).json({
    success: true,
    data: submission,
  });
}

/**
 * GET /api/submissions/:id
 * Fetches submission result and details for polling.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const userId = req.user!.userId;
  const isAdmin = req.user?.role === 'ADMIN';

  const submission = await submissionService.getSubmissionById(id, userId, isAdmin);

  res.json({
    success: true,
    data: submission,
  });
}

/**
 * GET /api/submissions/my (or /api/users/me/submissions)
 * Fetches the authenticated user's submission history.
 */
export async function getMySubmissions(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { page, limit, problemId, status } = req.query as unknown as SubmissionQueryInput;

  const result = await submissionService.getUserSubmissions(
    userId,
    page,
    limit,
    problemId,
    status
  );

  res.json({
    success: true,
    data: result,
  });
}
