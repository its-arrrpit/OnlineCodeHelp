// ===================================================================
// Auth Controller
// ===================================================================
// Controllers handle HTTP concerns:
//   - Parse the request (req.body, req.params, req.user)
//   - Call the service
//   - Send the response (res.json, res.status)
//
// Controllers do NOT contain business logic.
// They delegate to services and format the response.
//
// TYPESCRIPT CONCEPT — Request, Response:
//   These are types from the 'express' package.
//   Request represents the incoming HTTP request (body, params, headers).
//   Response represents the outgoing HTTP response (json, status, send).
// ===================================================================

import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
export async function register(req: Request, res: Response): Promise<void> {
  // req.body has already been validated by the validate(registerSchema) middleware.
  // TypeScript knows it matches RegisterInput because of Zod.
  const input = req.body as RegisterInput;

  const result = await authService.register(input);

  // 201 Created — a new resource (user) was created
  res.status(201).json({
    success: true,
    data: result,
  });
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;

  const result = await authService.login(input);

  res.json({
    success: true,
    data: result,
  });
}

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 * Requires: authenticate middleware (sets req.user)
 */
export async function me(req: Request, res: Response): Promise<void> {
  // req.user is set by the authenticate middleware.
  // The "!" is a non-null assertion — we know req.user exists because
  // this route is protected by the authenticate middleware.
  const user = await authService.getCurrentUser(req.user!.userId);

  res.json({
    success: true,
    data: user,
  });
}
