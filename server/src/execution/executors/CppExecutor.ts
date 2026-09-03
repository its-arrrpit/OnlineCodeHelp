// ===================================================================
// C++ Executor
// ===================================================================
// Handles compilation (g++ -O2) and execution of C++ source files.
// ===================================================================

import path from 'path';
import { BaseExecutor } from './BaseExecutor';
import { SingleRunResult, SubmissionStatus } from '../types';
import { config } from '../../config/env';

export class CppExecutor extends BaseExecutor {
  readonly languageName = 'C++';
  readonly sourceFilename = 'solution.cpp';
  readonly binaryFilename = process.platform === 'win32' && !config.useDocker ? 'solution.exe' : 'solution.out';
  readonly dockerImage = 'ocj-runner-cpp:latest';
  readonly dockerRunCommand = ['./solution.out'];

  /**
   * Compiles C++ code (inside Docker if useDocker is true, else with local g++).
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
          'g++', '-O2', this.sourceFilename, '-o', 'solution.out',
        ],
        dir,
        '',
        15000 // 15s compile timeout
      );

      if (compileResult.exitCode !== 0) {
        return {
          success: false,
          error: compileResult.stderr.trim() || 'C++ compilation failed',
        };
      }

      return { success: true };
    }

    // Local host fallback
    const compileResult = await this.spawnProcess(
      'g++',
      ['-O2', this.sourceFilename, '-o', this.binaryFilename],
      dir,
      '',
      10000
    );

    if (compileResult.exitCode !== 0) {
      return {
        success: false,
        error: compileResult.stderr.trim() || 'Compilation failed',
      };
    }

    return { success: true };
  }

  /**
   * Runs the compiled executable.
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
    const executablePath = path.join(dir, this.binaryFilename);

    const result = await this.spawnProcess(
      executablePath,
      [],
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
