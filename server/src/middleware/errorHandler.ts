// ===================================================================
// Centralized Error Handler Middleware
// ===================================================================
// WHY CENTRALIZED?
//   Without this, every route handler needs its own try-catch with
//   its own error response format. With this, any route can just:
//     throw ApiError.notFound('Problem not found')
//   and this middleware catches it, logs it, and sends a consistent
//   JSON error response.
//
// HOW IT WORKS:
//   Express error-handling middleware has 4 parameters: (err, req, res, next).
//   Express calls this when:
//   1. A route handler throws an error
//   2. A route handler calls next(error)
//
// TYPESCRIPT CONCEPT — ErrorRequestHandler:
//   Express provides this type for error middleware. It's a function
//   with (err, req, res, next) signature. TypeScript enforces we
//   handle all 4 parameters.
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * Centralized error handler — catches all errors thrown in routes.
 * Must be registered LAST in the Express middleware chain.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction // Underscore prefix = "I know this exists but I don't use it"
): void {
  // ── Handle known API errors ──
  if (err instanceof ApiError) {
    // Log 4xx as warnings, 5xx as errors
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, err.message);
    } else {
      logger.warn({ code: err.code, path: req.path, method: req.method }, err.message);
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // ── Handle unexpected errors ──
  // These are bugs — log the full error with stack trace
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
