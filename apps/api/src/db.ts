import './env.js'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const DEFAULT_POOL_MAX = 20
const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000
const DEFAULT_IDLE_TIMEOUT_MS = 30_000

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const adapter = new PrismaPg({
  connectionString,
  max: Number(process.env.DATABASE_POOL_MAX) || DEFAULT_POOL_MAX,
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS) || DEFAULT_CONNECTION_TIMEOUT_MS,
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS) || DEFAULT_IDLE_TIMEOUT_MS,
})

export const prisma = new PrismaClient({ adapter })
