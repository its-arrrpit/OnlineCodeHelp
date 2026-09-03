// ===================================================================
// Problem Routes
// ===================================================================
// Public routes (no auth): GET /problems, GET /problems/:id
// Admin routes (auth + admin): POST, PUT, DELETE /problems
//
// The middleware chain for admin routes:
//   authenticate → authorize('ADMIN') → validate → controller
//
// For the public GET /:id route, we optionally authenticate to check
// if the user is an admin (to show hidden test cases). But we don't
// REQUIRE auth — unauthenticated users can still view the problem.
// ===================================================================

import { Router } from 'express';
import * as problemController from '../controllers/problem.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { createProblemSchema, updateProblemSchema, problemQuerySchema } from '../schemas/problem.schema';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// ─── Public Routes ──────────────────────────────────────────────────

// GET /api/problems — List all published problems
router.get(
  '/',
  validate(problemQuerySchema, 'query'),
  asyncHandler(problemController.list)
);

// GET /api/problems/:id — Get a single problem
// Uses optional auth: if user is logged in AND is admin, show all test cases.
// If not logged in or is regular user, show only sample test cases.
router.get(
  '/:id',
  optionalAuth, // Custom middleware below
  asyncHandler(problemController.getById)
);

// ─── Admin Routes ───────────────────────────────────────────────────

// POST /api/problems — Create a new problem
router.post(
  '/',
  authenticate,                                    // Must be logged in
  authorize('ADMIN'),                              // Must be admin
  validate(createProblemSchema),                   // Validate request body
  asyncHandler(problemController.create)
);

// PUT /api/problems/:id — Update a problem
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProblemSchema),
  asyncHandler(problemController.update)
);

// DELETE /api/problems/:id — Delete a problem
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(problemController.remove)
);

// ─── Optional Auth Middleware ───────────────────────────────────────
// Tries to authenticate but doesn't fail if no token is provided.
// This lets us check if the user is an admin on public routes.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload } from '../types';

function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(); // No token — continue as unauthenticated
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(); // Malformed — treat as unauthenticated
  }

  try {
    const decoded = jwt.verify(parts[1]!, config.jwtSecret) as JwtPayload;
    req.user = { userId: decoded.userId, role: decoded.role };
  } catch {
    // Invalid token — treat as unauthenticated (don't error)
  }

  next();
}

export default router;
