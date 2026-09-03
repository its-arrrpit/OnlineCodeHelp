// ===================================================================
// TestCase Validation Schemas (Zod)
// ===================================================================

import { z } from 'zod';

// ─── Create TestCase (Admin) ────────────────────────────────────────

export const createTestCaseSchema = z.object({
  input: z
    .string()
    .min(0, 'Input is required'),  // Empty string is valid (some problems have no input)

  expectedOutput: z
    .string()
    .min(0, 'Expected output is required'),

  timeLimitMs: z
    .number()
    .int()
    .positive()
    .max(10000, 'Time limit cannot exceed 10 seconds')
    .optional()
    .default(2000),

  memoryLimitMb: z
    .number()
    .int()
    .positive()
    .max(512, 'Memory limit cannot exceed 512 MB')
    .optional()
    .default(256),

  isSample: z.boolean().optional().default(false),

  orderIndex: z.number().int().min(0).optional().default(0),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;

// ─── Update TestCase (Admin) ────────────────────────────────────────

export const updateTestCaseSchema = z.object({
  input: z.string().optional(),
  expectedOutput: z.string().optional(),
  timeLimitMs: z
    .number()
    .int()
    .positive()
    .max(10000)
    .optional(),
  memoryLimitMb: z
    .number()
    .int()
    .positive()
    .max(512)
    .optional(),
  isSample: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;
