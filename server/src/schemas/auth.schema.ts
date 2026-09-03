// ===================================================================
// Auth Validation Schemas (Zod)
// ===================================================================
// These schemas validate request bodies for auth endpoints.
//
// TYPESCRIPT CONCEPT — z.infer<typeof schema>:
//   Zod schemas are runtime validators, but they ALSO produce
//   TypeScript types. z.infer<typeof registerSchema> gives you:
//   { username: string; email: string; password: string }
//
//   This means one schema does TWO jobs:
//   1. Runtime validation (catches bad input)
//   2. Compile-time type (catches bugs in your code)
// ===================================================================

import { z } from 'zod';

// ─── Register ───────────────────────────────────────────────────────

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: z
    .string()
    .email('Invalid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
});

// z.infer extracts the TypeScript type from the Zod schema.
// RegisterInput = { username: string; email: string; password: string }
export type RegisterInput = z.infer<typeof registerSchema>;

// ─── Login ──────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address'),

  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
