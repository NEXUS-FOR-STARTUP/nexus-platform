import pino from 'pino'
import path from 'node:path'
import fs from 'node:fs'

/**
 * Base Pino logger for Nexus API.
 *
 * - Timestamps in Asia/Ho_Chi_Minh (UTC+7)
 * - Combined.log + error.log: newest lines at TOP (prepend, not append)
 * - Redacted: auth headers, passwords, tokens, secrets
 */
const level = process.env.LOG_LEVEL ?? 'info'
const service = process.env.SERVICE_NAME ?? 'nexus-api'
const enableLoki = process.env.ENABLE_LOKI === 'true'
const logDir = path.resolve(process.cwd(), 'logs')

/** `,"time":"2026-07-24T20:00:32.167+07:00"` — Pino requires comma + field name */
function vietnamTimestamp(): string {
  const d = new Date()
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000)
  return `,"time":"${vn.toISOString().replace('Z', '+07:00')}"`
}

/** Prepend a line to a file — newest line always at top */
function prependToFile(filePath: string, line: string): void {
  try {
    const existing = fs.readFileSync(filePath, 'utf-8')
    fs.writeFileSync(filePath, line + existing, 'utf-8')
  } catch {
    fs.writeFileSync(filePath, line, 'utf-8')
  }
}

// --- Pino shared options ---
const pinoOpts: pino.LoggerOptions = {
  level,
  timestamp: vietnamTimestamp,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret', '*.credit_card', '*.ccv'],
    censor: '[REDACTED]',
  },
  serializers: { err: pino.stdSerializers.err, error: pino.stdSerializers.err },
  base: { service, env: process.env.NODE_ENV ?? 'development' },
}

// --- Build logger ---
// Dev: pretty-print via pino transport (worker thread). Prod: raw JSON to stdout.
// File logging bypasses Pino's transport system entirely — we intercept via a custom
// destination stream that prepends instead of appending.
const isDev = process.env.NODE_ENV !== 'production'

let destination: pino.DestinationStream

if (isDev) {
  // pino.transport runs in a worker, returns a stream compatible with pino()
  destination = pino.transport({ target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' }, level })
} else {
  destination = pino.destination(1) // stdout
}

const baseLogger = pino(pinoOpts, destination)

// --- File logging — intercept at the logger level to prepend instead of append ---
if (!enableLoki) {
  fs.mkdirSync(logDir, { recursive: true })
  const combinedPath = path.join(logDir, 'combined.log')
  const errorPath = path.join(logDir, 'error.log')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dest = destination as any
  const origWrite = dest.write.bind(dest)
  dest.write = function (chunk: Buffer) {
    const line = chunk.toString('utf-8')
    prependToFile(combinedPath, line)
    try {
      const parsed = JSON.parse(line)
      if (parsed.level >= 50) prependToFile(errorPath, line)
    } catch { /* best-effort */ }
    return origWrite(chunk)
  }
}

// --- Optional Loki shipping ---
if (enableLoki) {
  const lokiUrl = process.env.LOKI_URL
  const lokiUser = process.env.LOKI_USER
  const lokiPass = process.env.LOKI_PASSWORD
  if (!lokiUrl || !lokiUser || !lokiPass) {
    console.warn('[logger] ENABLE_LOKI=true but missing LOKI_URL/USER/PASSWORD — Loki disabled')
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dest = destination as any
    const origWrite = dest.write.bind(dest)
    const lokiStream = pino.transport({
      target: 'pino-loki', level,
      options: {
        host: lokiUrl, basicAuth: { username: lokiUser, password: lokiPass },
        labels: { service, env: process.env.NODE_ENV ?? 'development' },
        batching: true, interval: 5, replaceTimestamp: true,
      },
    })
    dest.write = function (chunk: Buffer) {
      try { lokiStream.write(chunk.toString()) } catch { /* best-effort */ }
      return origWrite(chunk)
    }
  }
}

/**
 * Create a child logger with request-scoped context.
 * Use in middleware to attach correlationId, actor_id, etc.
 */
export function childLogger(context: Record<string, unknown>) {
  return baseLogger.child(context)
}

export default baseLogger
