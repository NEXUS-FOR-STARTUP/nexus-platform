/**
 * Structured audit logging for backend demo-critical operations.
 *
 * Backed by Pino instead of console.log — ships JSON to stdout
 * and optionally to Grafana Cloud Loki for production tracing.
 *
 * Interface stays the same — no caller changes needed.
 */

import baseLogger from './logger.js'

export interface AuditLogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  operation: string;
  actor_id: string;
  actor_role?: string;
  case_id?: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  old_state?: Record<string, any>;
  new_state?: Record<string, any>;
  metadata?: Record<string, any>;
  error_code?: string;
  error_message?: string;
  duration_ms?: number;
}

class AuditLogger {
  private shouldLog(): boolean {
    return process.env.NODE_ENV !== "test";
  }

  log(entry: Omit<AuditLogEntry, "timestamp" | "level">): void {
    if (!this.shouldLog()) return;
    baseLogger.info({ ...entry, event: 'audit' }, entry.operation)
  }

  warn(entry: Omit<AuditLogEntry, "timestamp" | "level">): void {
    if (!this.shouldLog()) return;
    baseLogger.warn({ ...entry, event: 'audit' }, entry.operation)
  }

  error(entry: Omit<AuditLogEntry, "timestamp" | "level">): void {
    if (!this.shouldLog()) return;
    baseLogger.error({ ...entry, event: 'audit' }, entry.operation)
  }

  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
}

export const auditLogger = new AuditLogger();
