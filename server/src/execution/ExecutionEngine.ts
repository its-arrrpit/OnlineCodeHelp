// ===================================================================
// Execution Engine — Central Evaluator
// ===================================================================
// Coordinates compiling, executing, and evaluating a submission
// against a suite of test cases.
//
// DESIGN PATTERN — Strategy Pattern:
//   ExecutionEngine delegates the actual language execution details
//   to specialized executor classes (PythonExecutor, CppExecutor, JavaExecutor).
//   The engine itself contains the high-level evaluation algorithm:
//     1. Write code to isolated directory
//     2. Compile if required
//     3. Iterate test cases (fail-fast on first failure)
//     4. Compare outputs
//     5. Return final ExecutionResult
//     6. Always clean up files in finally block
// ===================================================================

import { BaseExecutor } from './executors/BaseExecutor';
import { PythonExecutor } from './executors/PythonExecutor';
import { CppExecutor } from './executors/CppExecutor';
import { JavaExecutor } from './executors/JavaExecutor';
import { Language, SubmissionStatus, TestCaseData, ExecutionResult } from './types';
import { logger } from '../utils/logger';

export class ExecutionEngine {
  /**
   * Factory method to obtain the appropriate executor instance for a language.
   *
   * TYPESCRIPT CONCEPT — Exhaustive Switch / Union Check:
   *   TypeScript ensures every member of the `Language` enum is handled.
   */
  private static getExecutor(language: Language): BaseExecutor {
    switch (language) {
      case Language.PYTHON:
        return new PythonExecutor();
      case Language.CPP:
        return new CppExecutor();
      case Language.JAVA:
        return new JavaExecutor();
      default:
        throw new Error(`Unsupported programming language: ${language}`);
    }
  }

  /**
   * Evaluates user source code against a list of test cases.
   *
   * @param language - Submission language (JAVA, CPP, PYTHON)
   * @param sourceCode - The raw code written by the user
   * @param testCases - Array of test cases to test against
   * @returns Final judge verdict and metrics
   */
  public static async execute(
    language: Language,
    sourceCode: string,
    testCases: TestCaseData[]
  ): Promise<ExecutionResult> {
    const executor = this.getExecutor(language);
    const tempDir = await executor.createTempDir();

    let maxExecutionTimeMs = 0;

    try {
      // 1. Write the source file
      await executor.writeSourceFile(tempDir, sourceCode);

      // 2. Compile step
      const compileResult = await executor.compile(tempDir);
      if (!compileResult.success) {
        return {
          status: SubmissionStatus.COMPILATION_ERROR,
          executionTimeMs: 0,
          memoryUsedMb: 0,
          errorOutput: compileResult.error || 'Compilation Error',
        };
      }

      // If no test cases are registered for this problem, accept by default
      if (testCases.length === 0) {
        return {
          status: SubmissionStatus.ACCEPTED,
          executionTimeMs: 0,
          memoryUsedMb: 0,
        };
      }

      let firstCaseSummary = '';

      // 3. Run against each testcase in sequential order (Fail-Fast)
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i]!;

        const runResult = await executor.run(
          tempDir,
          testCase.input,
          testCase.timeLimitMs,
          testCase.memoryLimitMb
        );

        maxExecutionTimeMs = Math.max(maxExecutionTimeMs, runResult.executionTimeMs);

        // Check if execution failed due to TLE or Runtime Error
        if (runResult.status !== SubmissionStatus.ACCEPTED) {
          return {
            status: runResult.status,
            executionTimeMs: maxExecutionTimeMs,
            memoryUsedMb: runResult.memoryUsedMb || 0,
            errorOutput: runResult.errorOutput,
            failedTestCaseIndex: i,
          };
        }

        // Compare actual output with expected output
        const actual = runResult.actualOutput ?? '';
        const passed = executor.compareOutput(actual, testCase.expectedOutput);

        if (i === 0) {
          firstCaseSummary = `Sample Test Case 1:\nInput:\n${testCase.input.trim()}\n\nExpected Output:\n${testCase.expectedOutput.trim()}\n\nYour Output:\n${actual.trim() || '(No output)'}`;
        }

        if (!passed) {
          const previewActual = actual.trim() || '(No output)';
          const previewExpected = testCase.expectedOutput.trim();
          return {
            status: SubmissionStatus.WRONG_ANSWER,
            executionTimeMs: maxExecutionTimeMs,
            memoryUsedMb: runResult.memoryUsedMb || 0,
            errorOutput: `Test Case ${i + 1} (Failed):\nInput:\n${testCase.input.trim()}\n\nExpected Output:\n${previewExpected}\n\nYour Output:\n${previewActual}`,
            failedTestCaseIndex: i,
          };
        }
      }

      // 4. If all test cases passed:
      return {
        status: SubmissionStatus.ACCEPTED,
        executionTimeMs: maxExecutionTimeMs,
        memoryUsedMb: 16, // Baseline estimation for local process
        errorOutput: firstCaseSummary,
      };
    } catch (err: unknown) {
      logger.error({ err, language }, 'Unexpected error during code execution');
      return {
        status: SubmissionStatus.SYSTEM_ERROR,
        executionTimeMs: maxExecutionTimeMs,
        memoryUsedMb: 0,
        errorOutput: err instanceof Error ? err.message : 'Internal execution failure',
      };
    } finally {
      // 5. Always clean up temporary directory and code artifacts
      await executor.cleanup(tempDir);
    }
  }
}
