// ===================================================================
// Base Executor — Abstract Class for Language Runners
// ===================================================================
// Provides the common lifecycle for compiling and running code:
//   1. Create isolated temporary working directory
//   2. Write source code file
//   3. Compile code (if language requires compilation, e.g. C++, Java)
//   4. Run against test case with input streaming & execution timeout
//   5. Output normalization and string comparison
//   6. Clean up temporary files
//
// TYPESCRIPT CONCEPT — Abstract Class:
//   An `abstract class` cannot be instantiated directly with `new BaseExecutor()`.
//   It serves as a blueprint that language-specific subclasses (`PythonExecutor`,
//   `CppExecutor`, `JavaExecutor`) extend and implement.
//
// TYPESCRIPT CONCEPT — Access Modifiers (protected, public, private):
//   - `public`: accessible from anywhere.
//   - `protected`: accessible within this class and any subclass.
//   - `private`: accessible ONLY inside this class.
// ===================================================================

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { TestCaseData, SingleRunResult, SubmissionStatus } from '../types';
import { DockerSandbox } from '../DockerSandbox';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

export abstract class BaseExecutor {
  abstract readonly languageName: string;
  abstract readonly sourceFilename: string;
  abstract readonly dockerImage: string;
  abstract readonly dockerRunCommand: string[];

  /**
   * Prepares code for execution (e.g. compilation for C++/Java).
   * Interpreted languages like Python can simply return { success: true }.
   */
  abstract compile(dir: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Executes the code with standard input and a maximum time limit.
   */
  abstract run(
    dir: string,
    input: string,
    timeLimitMs: number,
    memoryLimitMb?: number
  ): Promise<SingleRunResult>;

  /**
   * Executes code safely inside an isolated Docker container.
   */
  protected async runInDocker(
    dir: string,
    input: string,
    timeLimitMs: number,
    memoryLimitMb = 256
  ): Promise<SingleRunResult> {
    const res = await DockerSandbox.run({
      image: this.dockerImage,
      hostDir: dir,
      command: this.dockerRunCommand,
      input,
      timeLimitMs,
      memoryLimitMb,
    });

    if (res.oomKilled) {
      return {
        passed: false,
        status: SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
        executionTimeMs: res.executionTimeMs,
        memoryUsedMb: memoryLimitMb,
        errorOutput: `Memory limit exceeded (${memoryLimitMb}MB)`,
      };
    }

    if (res.timedOut) {
      return {
        passed: false,
        status: SubmissionStatus.TIME_LIMIT_EXCEEDED,
        executionTimeMs: timeLimitMs,
        errorOutput: `Time limit exceeded (${timeLimitMs}ms)`,
      };
    }

    if (res.exitCode !== 0) {
      return {
        passed: false,
        status: SubmissionStatus.RUNTIME_ERROR,
        executionTimeMs: res.executionTimeMs,
        errorOutput: res.stderr.trim() || `Process exited with code ${res.exitCode}`,
      };
    }

    return {
      passed: false,
      status: SubmissionStatus.ACCEPTED,
      executionTimeMs: res.executionTimeMs,
      actualOutput: res.stdout,
    };
  }

  /**
   * Creates a dedicated temporary directory on the filesystem.
   */
  async createTempDir(): Promise<string> {
    const tempBase = path.join(os.tmpdir(), 'ocj-runs');
    await fs.mkdir(tempBase, { recursive: true });
    try {
      await fs.chmod(tempBase, 0o777);
    } catch {}
    const dir = await fs.mkdtemp(path.join(tempBase, 'run-'));
    try {
      await fs.chmod(dir, 0o777);
    } catch {}
    return dir;
  }

  /**
   * Writes the user's source code into the temp directory.
   */
  async writeSourceFile(dir: string, sourceCode: string): Promise<string> {
    const filePath = path.join(dir, this.sourceFilename);
    await fs.writeFile(filePath, sourceCode, 'utf-8');
    try {
      await fs.chmod(filePath, 0o666);
    } catch {}
    return filePath;
  }

  /**
   * Cleans up the temporary directory to avoid leaking disk space.
   */
  async cleanup(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (err) {
      logger.warn({ dir, err }, 'Failed to remove temp execution dir');
    }
  }

  /**
   * Normalizes output for fair comparison:
   * 1. Converts Windows `\r\n` to Unix `\n`
   * 2. Trims trailing whitespace from each line
   * 3. Trims overall trailing newlines and whitespace
   */
  protected normalizeOutput(output: string): string {
    return output
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
  }

  /**
   * Compares normalized actual output with expected output.
   */
  public compareOutput(actual: string, expected: string): boolean {
    return this.normalizeOutput(actual) === this.normalizeOutput(expected);
  }

  /**
   * Helper utility to spawn a child process with timeout protection
   * and standard input feeding.
   *
   * TYPESCRIPT CONCEPT — Generics & Promise<T>:
   *   `spawnProcess(...) : Promise<ProcessOutput>` returns a Promise
   *   resolving with `{ stdout, stderr, exitCode, timedOut, executionTimeMs }`.
   */
  protected spawnProcess(
    command: string,
    args: string[],
    cwd: string,
    input: string,
    timeLimitMs: number
  ): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    executionTimeMs: number;
  }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let timedOut = false;

      const child = spawn(command, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });

      let stdout = '';
      let stderr = '';

      // Timer to terminate process if it exceeds time limit
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeLimitMs);

      if (child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;
        resolve({
          stdout,
          stderr: stderr || err.message,
          exitCode: -1,
          timedOut: false,
          executionTimeMs,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;
        resolve({
          stdout,
          stderr,
          exitCode: code,
          timedOut,
          executionTimeMs,
        });
      });
    });
  }
}
