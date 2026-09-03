// ===================================================================
// Auth Routes
// ===================================================================
// Routes wire together: URL path + HTTP method + middleware + controller.
//
// Each route reads like a sentence:
//   POST /register → validate body → register the user
//   POST /login    → validate body → log the user in
//   GET  /me       → authenticate  → return current user
//
// TYPESCRIPT CONCEPT — Router:
//   express.Router() creates a mini-app that handles a subset of routes.
//   We mount it in index.ts: app.use('/api/auth', authRouter)
//   So POST /register becomes POST /api/auth/register.
// ===================================================================

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// POST /api/auth/register
// Public — no authentication required
router.post(
  '/register',
  validate(registerSchema),              // 1. Validate request body
  asyncHandler(authController.register)  // 2. Create user + return JWT
);

// POST /api/auth/login
// Public — no authentication required
router.post(
  '/login',
  validate(loginSchema),              // 1. Validate request body
  asyncHandler(authController.login)  // 2. Verify credentials + return JWT
);

// GET /api/auth/me
// Protected — requires valid JWT
router.get(
  '/me',
  authenticate,                    // 1. Verify JWT → set req.user
  asyncHandler(authController.me)  // 2. Return user profile
);

export default router;
