// ===================================================================
// Execution Engine Types & Interfaces
// ===================================================================
// This file defines the contracts and data structures used across
// code execution, test-case evaluations, and judge verdicts.
//
// TYPESCRIPT CONCEPT — Type Alias vs Interface:
//   - We use `interface` for object structures that represent data models
//     or contracts (like `ExecutionResult`, `TestCaseData`).
//   - We use `type` for union types, primitive aliases, or mapped types.
//
// TYPESCRIPT CONCEPT — Enums & Re-exports:
//   We re-export `Language` and `SubmissionStatus` directly from
//   `../types` so the execution modules have a single source of truth.
// ===================================================================

import { Language, SubmissionStatus } from '../types';

export { Language, SubmissionStatus };

/**
 * Data needed to run a code submission against a single test case.
 *
 * TYPESCRIPT CONCEPT — Interface:
 *   An interface defines the structure/shape an object MUST have.
 *   Any object passed as TestCaseData must provide all 4 fields.
 */
export interface TestCaseData {
  input: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
}

/**
 * The outcome of running user code against a single test case.
 *
 * TYPESCRIPT CONCEPT — Optional Properties (?):
 *   `errorOutput?: string` means the property may be a string OR undefined.
 *   A successful run doesn't have an error, so errorOutput is omitted.
 */
export interface SingleRunResult {
  passed: boolean;
  status: SubmissionStatus;
  executionTimeMs: number;
  memoryUsedMb?: number;
  actualOutput?: string;
  errorOutput?: string;
}

/**
 * The final verdict across all test cases for a submission.
 */
export interface ExecutionResult {
  status: SubmissionStatus;
  executionTimeMs: number;
  memoryUsedMb: number;
  errorOutput?: string;
  failedTestCaseIndex?: number;
}
