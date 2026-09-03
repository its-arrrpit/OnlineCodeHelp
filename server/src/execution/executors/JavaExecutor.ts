// ===================================================================
// Java Executor
// ===================================================================
// Handles compilation (javac) and execution (java) of Java code.
// Class name is assumed to be 'Solution' or 'Main'.
// ===================================================================

import { BaseExecutor } from './BaseExecutor';
import { SingleRunResult, SubmissionStatus } from '../types';
import { config } from '../../config/env';

export class JavaExecutor extends BaseExecutor {
  readonly languageName = 'Java';
  readonly sourceFilename = 'Solution.java';
  readonly mainClassName = 'Solution';
  readonly dockerImage = 'ocj-runner-java:latest';
  readonly dockerRunCommand = ['java', '-Xmx256m', 'Solution'];

  /**
   * Compiles Solution.java (inside Docker if useDocker is true, else with local javac).
   */
  async compile(dir: string): Promise<{ success: boolean; error?: string }> {
    if (config.useDocker) {
      const normalizedDir = dir.replace(/\\/g, '/');
      const compileResult = await this.spawnProcess(
        'docker',
        [
          'run',
          '--rm',
          '-v', `${normalizedDir}:/sandbox:rw`,
          '-w', '/sandbox',
          this.dockerImage,
          'javac', this.sourceFilename,
        ],
        dir,
        '',
        15000 // 15-second compilation limit
      );

      if (compileResult.exitCode !== 0) {
        return {
          success: false,
          error: compileResult.stderr.trim() || 'Java compilation failed',
        };
      }

      return { success: true };
    }

    // Local host fallback
    const compileResult = await this.spawnProcess(
      'javac',
      [this.sourceFilename],
      dir,
      '',
      15000
    );

    if (compileResult.exitCode !== 0) {
      return {
        success: false,
        error: compileResult.stderr.trim() || 'Java compilation failed',
      };
    }

    return { success: true };
  }

  /**
   * Runs the compiled bytecode using the Java Virtual Machine.
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

    // Local host fallback
    const result = await this.spawnProcess(
      'java',
      [`-Xmx${memoryLimitMb}m`, this.mainClassName],
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
