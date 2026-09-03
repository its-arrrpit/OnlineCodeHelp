// ===================================================================
// Shared TypeScript Types
// ===================================================================
// This file contains types shared across the application.
//
// TYPESCRIPT CONCEPT — interface vs type:
//   `interface` is for object shapes. It can be extended (inherited).
//   `type` is more flexible — it can represent unions, intersections, etc.
//   Rule of thumb: use `interface` for objects, `type` for everything else.
//
// TYPESCRIPT CONCEPT — Union Types:
//   `type Fruit = 'apple' | 'banana' | 'cherry'`
//   A variable of type Fruit can ONLY be one of those three strings.
//   TypeScript will error if you try: const f: Fruit = 'grape'
// ===================================================================

// Re-export Prisma-generated enums so the rest of the app
// doesn't need to import directly from @prisma/client.
export {
  Role,
  Difficulty,
  Language,
  SubmissionStatus,
} from '@prisma/client';

/**
 * Standard API response wrapper.
 *
 * TYPESCRIPT CONCEPT — Generic Interface:
 *   ApiResponse<T> means "an API response that wraps data of type T".
 *   ApiResponse<User> → { success: true, data: User }
 *   ApiResponse<Problem[]> → { success: true, data: Problem[] }
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Pagination parameters (used in list endpoints).
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * JWT payload — the data stored inside the JWT token.
 * When we decode a JWT, we get this shape.
 */
export interface JwtPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
}
