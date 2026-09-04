// ===================================================================
// Problem Validation Schemas (Zod)
// ===================================================================

import { z } from 'zod';

// ─── Create Problem (Admin) ─────────────────────────────────────────

export const createProblemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters'),

  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' }),
  }),

  constraints: z.string().optional(),

  examples: z.string().optional(),

  // Admin can save drafts (isPublished = false) and publish later
  isPublished: z.boolean().optional().default(false),
});

export type CreateProblemInput = z.infer<typeof createProblemSchema>;

// ─── Update Problem (Admin) ─────────────────────────────────────────
// All fields are optional — admin can update any subset.

export const updateProblemSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .optional(),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .optional(),

  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: 'Difficulty must be EASY, MEDIUM, or HARD' }),
  }).optional(),

  constraints: z.string().optional(),

  examples: z.string().optional(),

  isPublished: z.boolean().optional(),
});

export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;

// ─── Query Parameters ───────────────────────────────────────────────
// Used for filtering and paginating the problem list.
// z.coerce.number() converts string query params to numbers.
//   "?page=2" → req.query.page is the string "2"
//   z.coerce.number() converts it to the number 2

export const problemQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  search: z.string().trim().max(100).optional(),
  topic: z.string().trim().max(100).optional(),
});

export type ProblemQueryInput = z.infer<typeof problemQuerySchema>;
