// ===================================================================
// Small Utility / Helper Functions
// ===================================================================

/**
 * Wraps an async Express route handler so that rejected promises
 * are automatically forwarded to the error handler middleware.
 *
 * WHY?
 *   Express 4 does NOT catch async errors automatically.
 *   Without this wrapper, an unhandled promise rejection silently
 *   hangs the request (no response, no error logged).
 *
 *   With this wrapper:
 *     router.get('/problems', asyncHandler(controller.list))
 *   If controller.list throws, it's caught and passed to next().
 *
 * NOTE: Express 5 fixes this natively, but as of 2024, Express 4
 * is still the stable version.
 *
 * TYPESCRIPT CONCEPT — Function Type:
 *   (req: Request, res: Response, next: NextFunction) => Promise<void>
 *   This describes a function that takes req, res, next and returns
 *   a Promise that resolves to nothing (void).
 */
import { Request, Response, NextFunction } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
