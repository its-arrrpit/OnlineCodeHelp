// ===================================================================
// Submission Validation Schemas (Zod)
// ===================================================================

import { z } from 'zod';
import { Language, SubmissionStatus } from '../types';

// ─── Create Submission Schema ───────────────────────────────────────

export const createSubmissionSchema = z.object({
  problemId: z.string().uuid('Invalid problem ID format'),

  language: z.nativeEnum(Language, {
    errorMap: () => ({ message: 'Language must be JAVA, CPP, or PYTHON' }),
  }),

  sourceCode: z
    .string()
    .min(1, 'Source code is required')
    .max(65536, 'Source code cannot exceed 64 KB'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

// ─── Submission Query Schema ────────────────────────────────────────

export const submissionQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  problemId: z.string().uuid().optional(),
  status: z.nativeEnum(SubmissionStatus).optional(),
});

export type SubmissionQueryInput = z.infer<typeof submissionQuerySchema>;
