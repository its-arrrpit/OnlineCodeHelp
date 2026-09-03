// ===================================================================
// Infrastructure Error Class
// ===================================================================
// SYSTEM DESIGN CONCEPT — Error Classification:
//
// In an asynchronous processing system, errors fall into two categories:
//
// 1. DOMAIN / USER ERRORS (Non-Retriable):
//    - Wrong Answer, Compilation Error, Runtime Error, Time Limit Exceeded.
//    - The user wrote flawed code. Retrying will yield the exact same result.
//    - Action: Save verdict to PostgreSQL, complete the BullMQ job successfully.
//
// 2. INFRASTRUCTURE / TRANSIENT FAILURES (Retriable):
//    - Docker daemon temporary glitch, connection reset, host disk exhaustion.
//    - The failure is caused by our platform's infrastructure, NOT the user.
//    - Action: Throw InfrastructureError, trigger BullMQ exponential backoff retry.
// ===================================================================

export class InfrastructureError extends Error {
  public readonly isInfrastructureError = true;
  public readonly originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'InfrastructureError';
    this.originalError = originalError;

    // Preserve proper prototype chain in TypeScript transpilation
    Object.setPrototypeOf(this, InfrastructureError.prototype);
  }
}
