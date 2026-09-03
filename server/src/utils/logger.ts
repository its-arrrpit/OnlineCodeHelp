// ===================================================================
// Logger — Structured Logging with Pino
// ===================================================================
// WHY STRUCTURED LOGGING?
//   console.log("User 123 submitted") is unstructured — you can't
//   search, filter, or aggregate these logs in production.
//
//   Structured logs output JSON:
//   {"level":"info","userId":"123","action":"submit","time":"2024-..."}
//
//   This lets you search: "show me all ERROR logs where userId=123"
//   in tools like Grafana, Datadog, or even a simple `jq` command.
//
// WHY PINO?
//   Pino is the fastest Node.js logger. It outputs JSON in production
//   and pretty-prints in development. Express integrations exist too.
//
// TYPESCRIPT CONCEPT — Generic Function:
//   pino<T>() could accept a type parameter for custom log fields.
//   We use the default, so every log entry has standard fields:
//   level, time, pid, hostname, msg.
// ===================================================================

import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({
  // Log level: 'debug' in dev, 'info' in production
  level: config.isDev ? 'debug' : 'info',

  // In development, use pino-pretty for human-readable output.
  // In production, output raw JSON (for log aggregation tools).
  transport: config.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard', // Human-readable timestamps
          ignore: 'pid,hostname',        // Less noise in dev
        },
      }
    : undefined,
});
