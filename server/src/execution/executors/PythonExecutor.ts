// ===================================================================
// Python Executor
// ===================================================================
// Executes Python code solutions against test cases.
//
// Python is an interpreted language, so no compilation step is needed.
// Flag '-u' forces unbuffered binary stdout/stderr for immediate capture.
// ===================================================================

import { BaseExecutor } from './BaseExecutor';
import { SingleRunResult, SubmissionStatus } from '../types';
import { config } from '../../config/env';

export class PythonExecutor extends BaseExecutor {
  readonly languageName = 'Python';
  readonly sourceFilename = 'solution.py';
  readonly dockerImage = 'ocj-runner-python:latest';
  readonly dockerRunCommand = ['python3', '-u', 'solution.py'];

  /**
   * Python does not require compilation.
   */
  async compile(_dir: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  /**
   * Executes the Python script against a single test case inside Docker Sandbox.
   */
  async run(
    dir: string,
    input: string,
    timeLimitMs: number,
    memoryLimitMb = 256
  ): Promise<SingleRunResult> {
    if (config.useDocker) {
      return this.runInDocker(dir, input, timeLimitMs, memoryLimitMb);
    }

    // Local host fallback (if Docker is disabled)
    const command = process.platform === 'win32' ? 'python' : 'python3';

    const result = await this.spawnProcess(
      command,
      ['-u', this.sourceFilename],
      dir,
      input,
      timeLimitMs
    );

    if (result.timedOut) {
      return {
        passed: false,
        status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
        executionTimeMs: timeLimitMs,
        errorOutput: `Time limit exceeded (${timeLimitMs}ms)`,
      };
    }

    if (result.exitCode !== 0) {
      return {
        passed: false,
        status: SubmissionStatus.RUNTIME_ERROR,
        executionTimeMs: result.executionTimeMs,
        errorOutput: result.stderr.trim() || `Process exited with code ${result.exitCode}`,
      };
    }

    return {
      passed: false,
      status: SubmissionStatus.ACCEPTED,
      executionTimeMs: result.executionTimeMs,
      actualOutput: result.stdout,
    };
  }
}
