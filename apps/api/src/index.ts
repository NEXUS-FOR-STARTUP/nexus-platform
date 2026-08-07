import crypto from 'node:crypto'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamText } from 'hono/streaming'
import { idempotency } from "hono-idempotency"
import { memoryStore } from "hono-idempotency/stores/memory"
import './env.js'
import { auth } from './auth.js'
import { casesRouter } from './modules/cases/http/cases.routes.js'
import { reportsRouter } from './modules/reports/http/reports.routes.js'
import { paymentsRouter } from './modules/payments/http/payments.routes.js'
import { sepayRouter } from './modules/payments/http/sepay.routes.js'
import { packagesRouter } from './modules/packages/http/packages.routes.js'
import { aiEngineRouter } from './modules/ai-engine/http/ai-engine.routes.js'
import { adminRouter } from './modules/admin/http/admin.routes.js'
import { supporterRouter } from './modules/supporter/http/supporter.routes.js'
import { documentsRouter } from './modules/documents/http/documents.routes.js'
import { notificationsRouter } from './modules/notifications/http/notifications.routes.js'
import { registerNotificationListener } from './modules/notifications/application/notification-listener.js'
import { startRelay } from './modules/notifications/application/notification-relay.js'
import { prisma } from './db.js'
import { AppError } from './shared/domain/app-error.js'
import logger from './shared/infrastructure/logger.js'


type Variables = { correlationId: string }
const app = new Hono<{ Variables: Variables }>()
const port = Number(process.env.PORT ?? 8000)

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return null
      const allowedOrigins = [
        /^http:\/\/localhost:(3000|3001)$/,
        /^https:\/\/(?:www\.)?nexusforstartup\.site$/,
      ]
      return allowedOrigins.some((r) => r.test(origin)) ? origin : null
    },
    allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

// Correlation ID + request logging middleware
app.use('/api/*', async (c, next) => {
  const correlationId = crypto.randomUUID()
  c.set('correlationId', correlationId)

  const start = Date.now()
  await next()
  const duration = Date.now() - start

  // Log completed requests (skip healthcheck noise in production)
  const path = c.req.path
  if (path === '/health' || path === '/ready') return

  logger.info({
    correlationId,
    method: c.req.method,
    path,
    status: c.res.status,
    duration_ms: duration,
  }, 'request completed')
})

// Idempotency middleware — Stripe-style Idempotency-Key for POST/PATCH
// Skip multipart uploads (body consumed by middleware breaks file parsing).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const idempMw: any = idempotency({
  store: memoryStore(),
  cacheKeyPrefix: (c) => {
    const userId = (c.get("user") as { id: string } | undefined)?.id;
    return userId ? `${userId}:` : "anon:";
  },
  required: false,
  methods: ["POST", "PATCH"],
  maxKeyLength: 256,
});

app.use("/api/*", async (c, next) => {
  const ct = c.req.header("content-type") || "";
  if (ct.startsWith("multipart/")) return next();
  return idempMw(c, next);
});

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/health', async (c) => {
  let dbStatus = 'unknown'
  try {
    await prisma.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = 'disconnected'
  }

  const isHealthy = dbStatus === 'connected'

  const healthData = {
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV ?? 'development',
    checks: {
      database: dbStatus,
    },
    memory: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
    }
  }

  return c.json(healthData, isHealthy ? 200 : 503)
})


app.get('/stream', (c) => {
  return streamText(c, async (stream) => {
    await stream.writeln('Hello')
    await stream.sleep(250)
    await stream.writeln('from Hono streaming')
  })
})

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

app.get('/session', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.body(null, 401)
  }

  return c.json(session)
})

// Mount Bounded Context Modules
app.route('/api/cases', casesRouter)
app.route('/api/reports', reportsRouter)
app.route('/api/payments', paymentsRouter)
app.route('/api/payments', sepayRouter)
app.route('/api/packages', packagesRouter)
app.route('/api/ai-engine', aiEngineRouter)
app.route('/api/admin', adminRouter)
app.route('/api/supporter', supporterRouter)
app.route('/api/documents', documentsRouter)
app.route('/api/notifications', notificationsRouter)

// Global error handler — catches unhandled errors, no stack trace leak
app.onError((err, c) => {
  const correlationId = (c.get('correlationId') as string) ?? 'unknown'
  logger.error({ correlationId, err }, `Unhandled error: ${err instanceof Error ? err.message : String(err)}`)

  if (err instanceof AppError) {
    return c.json({ code: err.code, message: err.message }, err.status as 200)
  }

  return c.json({ code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống' }, 500 as 200)
})

export { app }

if (process.env.NODE_ENV !== 'test') {
  registerNotificationListener();
  startRelay();

  serve({
    fetch: app.fetch,
    port
  }, (info) => {
    logger.info({ port: info.port }, 'server started')
  })
}
