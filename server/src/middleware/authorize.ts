// ===================================================================
// Authorization Middleware — Role-Based Access Control
// ===================================================================
// This middleware checks if the authenticated user has the required role.
// It runs AFTER the auth middleware (which sets req.user).
//
// Middleware chain for admin routes:
//   authenticate → authorize('ADMIN') → controller
//
// TYPESCRIPT CONCEPT — Rest Parameters (...roles):
//   `...roles: string[]` means "accept any number of string arguments
//   and collect them into an array".
//   authorize('ADMIN')           → roles = ['ADMIN']
//   authorize('ADMIN', 'USER')   → roles = ['ADMIN', 'USER']
//
// TYPESCRIPT CONCEPT — Higher-Order Function:
//   authorize() returns a function. This is the same pattern as
//   the validate() middleware — a function that creates middleware.
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * Creates middleware that checks if the user has one of the allowed roles.
 *
 * @param roles - Allowed roles (e.g., 'ADMIN', 'USER')
 * @returns Express middleware
 *
 * @example
 * // Only admins can access this route
 * router.post('/problems', authenticate, authorize('ADMIN'), controller.create)
 *
 * @example
 * // Both admins and users can access this route
 * router.get('/dashboard', authenticate, authorize('ADMIN', 'USER'), controller.view)
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // req.user is set by the authenticate middleware.
    // If it's missing, auth middleware didn't run (developer error).
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Check if the user's role is in the allowed list
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }

    next();
  };
}
