import './env.js'

import { prismaAdapter } from 'better-auth/adapters/prisma'
import { betterAuth } from 'better-auth'
import { admin, openAPI } from 'better-auth/plugins'
import { prisma } from './db.js'

const requiredEnv = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

export const auth = betterAuth({
  baseURL: requiredEnv('BETTER_AUTH_URL'),
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://nexusforstartup.site',
    'https://www.nexusforstartup.site',
  ],
  user: {
    modelName: 'user',
    fields: {
      emailVerified: 'email_verified',
      twoFactorEnabled: 'two_factor_enabled',
      role: 'role',
      banned: 'banned',
      banReason: 'ban_reason',
      banExpires: 'ban_expires',
      displayUsername: 'display_username',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  session: {
    modelName: 'session',
    fields: {
      expiresAt: 'expires_at',
      userId: 'user_id',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      impersonatedBy: 'impersonated_by',
    },
  },
  account: {
    modelName: 'account',
    fields: {
      accountId: 'account_id',
      providerId: 'provider_id',
      userId: 'user_id',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'access_token_expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  verification: {
    modelName: 'verification',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: requiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
    },
  },
  plugins: [admin(), openAPI()],
})
