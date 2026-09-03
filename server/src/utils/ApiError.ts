// ===================================================================
// ApiError — Custom Error Class
// ===================================================================
// WHY A CUSTOM ERROR CLASS?
//   JavaScript's built-in Error only has a message. We need:
//   - HTTP status code (400, 401, 404, etc.)
//   - Error code string (VALIDATION_ERROR, NOT_FOUND, etc.)
//   - Optional details (validation errors, etc.)
//
//   The centralized error handler catches ApiErrors and formats
//   them into consistent JSON responses.
//
// TYPESCRIPT CONCEPT — extends:
//   `class ApiError extends Error` means ApiError inherits everything
//   from the built-in Error class (message, stack trace, etc.) and
//   adds our custom fields on top.
//
// TYPESCRIPT CONCEPT — readonly:
//   `readonly statusCode: number` means once set in the constructor,
//   it cannot be changed. Prevents accidental mutation.
// ===================================================================

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message); // Call the parent Error constructor
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Fix the prototype chain (required when extending built-in classes in TypeScript)
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // ─── Factory Methods ────────────────────────────────────────────
  // These make it easy to create common errors without remembering
  // status codes. Usage: throw ApiError.notFound('Problem not found')

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
