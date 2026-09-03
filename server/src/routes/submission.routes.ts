// ===================================================================
// Submission Routes
// ===================================================================

import { Router } from 'express';
import * as submissionController from '../controllers/submission.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { submissionRateLimiter } from '../middleware/rateLimiter';
import { createSubmissionSchema, submissionQuerySchema } from '../schemas/submission.schema';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// POST /api/submissions — Submit solution for evaluation (rate-limited)
router.post(
  '/',
  authenticate,
  submissionRateLimiter,
  validate(createSubmissionSchema),
  asyncHandler(submissionController.create)
);

// GET /api/submissions/me — View user's own submission history
router.get(
  '/me',
  authenticate,
  validate(submissionQuerySchema, 'query'),
  asyncHandler(submissionController.getMySubmissions)
);

// GET /api/submissions/:id — Poll submission outcome
router.get(
  '/:id',
  authenticate,
  asyncHandler(submissionController.getById)
);

export default router;
