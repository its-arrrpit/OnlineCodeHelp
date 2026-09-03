// ===================================================================
// Zod Validation Middleware
// ===================================================================
// WHY ZOD?
//   Express does NOT validate request bodies. If a client sends
//   { "email": 123 } instead of { "email": "a@b.com" }, Express
//   happily passes it to your handler. Zod catches this.
//
// WHY MIDDLEWARE?
//   Instead of validating in every controller, this middleware runs
//   BEFORE the controller. If validation fails, it throws a 400
//   error immediately — the controller never executes.
//
// TYPESCRIPT CONCEPT — Generics <T>:
//   ZodSchema<T> means "a Zod schema that produces type T".
//   When you define: const schema = z.object({ email: z.string() })
//   T is inferred as { email: string }. After validation, TypeScript
//   KNOWS req.body has exactly that shape.
//
// TYPESCRIPT CONCEPT — Higher-Order Function:
//   validate() returns a function. This is called a "higher-order
//   function" — a function that returns another function.
//   Usage: router.post('/register', validate(registerSchema), controller)
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Creates an Express middleware that validates req.body, req.query, or req.params against a Zod schema.
 *
 * @param schema - The Zod schema to validate against
 * @param source - 'body' | 'query' | 'params' (defaults to 'body')
 * @returns Express middleware function
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // schema.parse() throws ZodError if validation fails.
      // If it succeeds, it assigns the parsed (and coerced/typed) data.
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next(); // Validation passed — continue to next middleware/controller
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable structure
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw ApiError.badRequest('Validation failed', details);
      }
      throw error; // Re-throw unexpected errors
    }
  };
}
