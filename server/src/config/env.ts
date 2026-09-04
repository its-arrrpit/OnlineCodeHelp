// ===================================================================
// Environment Configuration
// ===================================================================
// Validates and exports all environment variables at startup.
//
// WHY: If a required env var is missing, the app crashes immediately
// with a clear error message — not 10 minutes later with a cryptic
// "Cannot read property of undefined" deep in some handler.
//
// TYPESCRIPT CONCEPT — Type Inference:
//   We define the shape of our config as a plain object.
//   TypeScript infers the type from the object, so every usage of
//   `config.PORT` is type-checked automatically.
// ===================================================================

import dotenv from 'dotenv';

// Load .env file into process.env
dotenv.config();

/**
 * Reads an env var or throws if it's missing.
 * 
 * @param key - The environment variable name
 * @returns The value of the environment variable
 * @throws Error if the variable is not set
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Reads an env var with a fallback default value.
 * 
 * @param key - The environment variable name
 * @param defaultValue - Value to use if the env var is not set
 * @returns The env var value or the default
 */
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

// ─── Exported Config Object ─────────────────────────────────────────
// Every part of the app imports config from here.
// No file should read process.env directly.

// Ensure standard Windows Docker Desktop directories are in PATH
if (process.platform === 'win32') {
  const localAppData = process.env.LOCALAPPDATA || '';
  const dockerDirs = [
    `${localAppData}\\Programs\\DockerDesktop\\resources\\bin`,
    'C:\\Program Files\\Docker\\Docker\\resources\\bin',
  ];
  for (const d of dockerDirs) {
    if (!process.env.PATH?.includes(d)) {
      process.env.PATH = `${d};${process.env.PATH || ''}`;
    }
  }
}

// Helper to parse Redis configuration from REDIS_URL or REDIS_HOST/REDIS_PORT
function getRedisConfig(): { host: string; port: number } {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '6379', 10),
      };
    } catch {
      // Ignore URL parsing error and fallback
    }
  }
  return {
    host: optionalEnv('REDIS_HOST', 'localhost'),
    port: parseInt(optionalEnv('REDIS_PORT', '6379'), 10),
  };
}

const redisConfig = getRedisConfig();

export const config = {
  // Server
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '4000'), 10),

  // Database
  databaseUrl: requireEnv('DATABASE_URL'),

  // Redis
  redisHost: redisConfig.host,
  redisPort: redisConfig.port,

  // Authentication
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),

  // Rate Limiting
  rateLimitSubmissions: parseInt(optionalEnv('RATE_LIMIT_SUBMISSIONS', '5'), 10),

  // Execution
  defaultTimeLimitMs: parseInt(optionalEnv('DEFAULT_TIME_LIMIT_MS', '2000'), 10),
  defaultMemoryLimitMb: parseInt(optionalEnv('DEFAULT_MEMORY_LIMIT_MB', '256'), 10),
  useDocker: optionalEnv('USE_DOCKER', 'true') === 'true',

  // Computed
  isDev: optionalEnv('NODE_ENV', 'development') === 'development',
  isProd: optionalEnv('NODE_ENV', 'development') === 'production',
} as const;

// "as const" makes all properties readonly — prevents accidental mutation.
// TypeScript will error if you try: config.port = 5000
