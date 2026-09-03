// ===================================================================
// Docker Sandbox — Containerized Code Execution Isolation
// ===================================================================
// Runs untrusted code inside isolated, disposable Docker containers.
//
// DEFENSE-IN-DEPTH SECURITY RESTRICTIONS:
//   1. Network Isolation: `--network=none`
//      Completely shuts down networking. Untrusted code cannot connect
//      to the Internet, reach external servers, or scan internal networks.
//
//   2. Memory Isolation: `--memory=${limit}m --memory-swap=${limit}m`
//      Hard RAM limit. Setting memory-swap equal to memory disables
//      swapping to disk, forcing the Linux kernel OOM-killer to terminate
//      greedy memory-allocation attacks immediately.
//
//   3. CPU Isolation: `--cpus=${quota}`
//      Limits CPU core consumption so a single submission cannot starve
//      host CPU resources or degrade the API server.
//
//   4. Process Table Isolation: `--pids-limit=64`
//      Defends against fork bombs (`:(){ :|:& };:`) by capping the total
//      number of processes/threads a container can spawn.
//
//   5. Automatic Cleanup: `--rm` + explicit `docker rm -f` on timeout
//      Guarantees containers are removed when execution finishes.
//
//   6. Non-Root Execution:
//      Images run under low-privilege `sandboxuser` (UID 1000).
//
// IMPORTANT HONESTY NOTE FOR TECHNICAL INTERVIEWS:
//   Docker uses Linux cgroups and namespaces. While it provides strong
//   practical isolation for student and interview projects, Docker shares
//   the host Linux kernel. Production judges (like LeetCode or HackerRank)
//   often add further sandboxing layers such as seccomp filter profiles,
//   gVisor (user-space kernel virtualization), or Firecracker microVMs.
// ===================================================================

import { spawn } from 'child_process';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface DockerRunOptions {
  image: string;
  hostDir: string;
  command: string[];
  input: string;
  timeLimitMs: number;
  memoryLimitMb?: number;
  cpuQuota?: string;
  pidsLimit?: number;
}

export interface DockerRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  oomKilled: boolean;
  executionTimeMs: number;
}

export class DockerSandbox {
  /**
   * Executes a command inside an isolated Docker container with strict constraints.
   */
  public static async run(options: DockerRunOptions): Promise<DockerRunResult> {
    const {
      image,
      hostDir,
      command,
      input,
      timeLimitMs,
      memoryLimitMb = 256,
      cpuQuota = '1.0',
      pidsLimit = 64,
    } = options;

    // Unique container name for reliable tracking and forced cleanup
    const containerName = `ocj-box-${crypto.randomBytes(6).toString('hex')}`;

    // Normalize Windows path for Docker volume mounting:
    // "C:\Users\foo" -> "C:/Users/foo"
    const normalizedHostDir = hostDir.replace(/\\/g, '/');

    // Docker CLI arguments enforcing sandbox boundaries
    const dockerArgs = [
      'run',
      '-i',                                          // Interactive stdin stream
      '--name', containerName,                       // Explicit container name for cleanup
      '--rm',                                        // Remove container on exit
      '--network=none',                              // NO network access
      `--memory=${memoryLimitMb}m`,                  // Memory ceiling
      `--memory-swap=${memoryLimitMb}m`,             // No disk swap (force OOM kill)
      `--cpus=${cpuQuota}`,                          // CPU usage ceiling
      `--pids-limit=${pidsLimit}`,                   // Fork bomb prevention
      '-v', `${normalizedHostDir}:/sandbox:rw`,      // Mount host temp dir into container
      '-w', '/sandbox',                              // Set container working directory
      image,
      ...command,
    ];

    return new Promise((resolve) => {
      const startTime = Date.now();
      let timedOut = false;
      let stdout = '';
      let stderr = '';

      const child = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });

      // Strict timeout guard: kill the container if execution exceeds timeLimitMs
      const timer = setTimeout(() => {
        timedOut = true;
        // Kill the client process
        child.kill('SIGKILL');
        // Explicitly remove the container in Docker daemon in case it hung
        this.forceRemoveContainer(containerName);
      }, timeLimitMs + 500); // 500ms grace window for container boot overhead

      // Stream testcase input into container's stdin
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
        this.forceRemoveContainer(containerName);
        const executionTimeMs = Date.now() - startTime;
        resolve({
          stdout,
          stderr: stderr || err.message,
          exitCode: -1,
          timedOut: false,
          oomKilled: false,
          executionTimeMs,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;

        // Docker exit code 137 often indicates SIGKILL or OOM kill
        const oomKilled = code === 137 && !timedOut;

        resolve({
          stdout,
          stderr,
          exitCode: code,
          timedOut,
          oomKilled,
          executionTimeMs: Math.min(executionTimeMs, timeLimitMs),
        });
      });
    });
  }

  /**
   * Forces termination and removal of a container.
   */
  private static forceRemoveContainer(containerName: string): void {
    const killer = spawn('docker', ['rm', '-f', containerName], {
      stdio: 'ignore',
      shell: false,
    });
    killer.on('error', () => {
      // Ignore errors if container already exited cleanly with --rm
    });
  }
}
