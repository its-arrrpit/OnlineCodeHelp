// ===================================================================
// Auth Middleware — JWT Verification
// ===================================================================
// This middleware runs BEFORE protected route handlers.
// It extracts the JWT from the Authorization header, verifies it,
// and attaches the decoded user info to req.user.
//
// HOW IT WORKS:
//   Client sends: Authorization: Bearer <token>
//   Middleware:
//     1. Extracts the token from the header
//     2. Verifies the signature using JWT_SECRET
//     3. Decodes the payload: { userId, role }
//     4. Attaches it to req.user
//     5. Calls next() — request continues to the route handler
//
// AUTHENTICATION vs AUTHORIZATION:
//   Authentication = "Who are you?" (this middleware)
//   Authorization  = "What are you allowed to do?" (authorize middleware)
//
// TYPESCRIPT CONCEPT — Type Guard:
//   After this middleware runs, req.user is guaranteed to exist.
//   But TypeScript doesn't know that — req.user is typed as optional (?).
//   In controllers, we use `req.user!` (non-null assertion) or
//   check `if (!req.user)` to satisfy TypeScript.
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { JwtPayload } from '../types';

/**
 * Middleware that verifies the JWT token from the Authorization header.
 * After this middleware, req.user contains { userId, role }.
 *
 * Usage:
 *   router.get('/profile', authenticate, controller.getProfile)
 *                          ^^^^^^^^^^^^
 *                          Runs before controller
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  // ── Extract token from header ──
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw ApiError.unauthorized('No authorization token provided');
  }

  // Expected format: "Bearer <token>"
  // Split by space and take the second part
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw ApiError.unauthorized('Invalid authorization format. Use: Bearer <token>');
  }

  const token = parts[1]!;

  // ── Verify token ──
  try {
    // jwt.verify() checks:
    // 1. Is the signature valid? (not tampered with)
    // 2. Is the token expired?
    // If either fails, it throws an error.
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Attach user info to the request object.
    // Now every subsequent middleware/controller can access req.user.
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // jwt.verify throws different errors:
    // - TokenExpiredError: token has expired
    // - JsonWebTokenError: invalid signature or malformed token
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token has expired');
    }
    throw ApiError.unauthorized('Invalid token');
  }
}
