import './env.js'

import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError, betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { admin, emailOTP, openAPI } from 'better-auth/plugins'
import { prisma } from './db.js'
import { sendVerificationEmail } from './modules/notifications/application/auth-verification-email.js'
import { accountLockoutService } from './modules/auth/infrastructure/account-lockout.service.js'
import logger from './shared/infrastructure/logger.js'
const requiredEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

// Bắt buộc RESEND_API_KEY cho luồng email verification: thiếu key → fail fast,
// tránh tạo user không thể nhận mã OTP.
requiredEnv('RESEND_API_KEY')

export const auth = betterAuth({
  baseURL: requiredEnv('BETTER_AUTH_URL'),
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://nexusforstartup.site',
    'https://www.nexusforstartup.site',
  ],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      '/get-session': false,
      '/email-otp/send-verification-otp': { window: 60, max: 3 },
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 60, max: 5 },
    },
  },
  user: {
    modelName: 'user',
    additionalFields: {
      termsAndPrivacyVersion: {
        type: 'string',
        required: false,
        input: false,
        fieldName: 'terms_and_privacy_version',
      },
      termsAndPrivacyAcceptedAt: {
        type: 'date',
        required: false,
        input: false,
        fieldName: 'terms_and_privacy_accepted_at',
      },
    },
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
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
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
    requireEmailVerification: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
  },
  socialProviders: {
    google: {
      clientId: requiredEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requiredEnv('GOOGLE_CLIENT_SECRET'),
    },
  },
  hooks: {
    // Chặn đăng ký/gửi lại mã cho email đã xác minh: trả 409 để UI chuyển thẳng login.
    // Dùng hooks.before native của Better Auth (chạy trên HTTP path, body đã parse,
    // APIError throw từ hook propagate tới client) — không intercept Hono bên ngoài.
    before: createAuthMiddleware(async (ctx) => {
      // Type của main hooks.before không expose path/body, nhưng runtime luôn có:
      // dispatch.mjs set path = endpoint.path, router parse body trước khi gọi handler.
      const { path, body } = ctx as unknown as {
        path?: string
        body?: { email?: unknown; type?: unknown }
      }

      if (path === '/sign-in/email' && body && typeof body.email === 'string') {
        const lockout = accountLockoutService.checkLockout(body.email)
        if (lockout.isLocked) {
          throw new APIError('TOO_MANY_REQUESTS', {
            message: `ACCOUNT_LOCKED_TEMPORARY:${lockout.remainingSeconds}`,
          })
        }
      }

      if (path === '/sign-up/email') {
        throw new APIError('BAD_REQUEST', { message: 'PASSWORD_AUTH_DISABLED' })
      }

      if (
        path === '/email-otp/send-verification-otp' &&
        (body?.type === 'email-verification' || !body?.type)
      ) {
        if (body && typeof body.email === 'string') {
          const existing = await prisma.user.findUnique({
            where: { email: body.email.toLowerCase() },
            select: { email_verified: true },
          })
          if (existing?.email_verified) {
            throw new APIError('CONFLICT', { message: 'EMAIL_ALREADY_VERIFIED' })
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const authCtx = ctx as {
        path?: string
        body?: { email?: unknown }
        context?: { returned?: unknown }
      }
      const path = authCtx.path
      const email =
        authCtx.body && typeof authCtx.body.email === 'string'
          ? authCtx.body.email
          : undefined

      if (path === '/sign-in/email' && email) {
        const returned = authCtx.context?.returned
        const isFailure =
          returned instanceof APIError ||
          (Boolean(returned) &&
            typeof returned === 'object' &&
            ('statusCode' in (returned as Record<string, unknown>) ||
              'status' in (returned as Record<string, unknown>)) &&
            ((returned as { statusCode?: number }).statusCode === 401 ||
              (returned as { status?: string | number }).status === 'UNAUTHORIZED' ||
              (returned as { status?: string | number }).status === 401))

        if (isFailure) {
          accountLockoutService.recordFailure(email)
        } else {
          accountLockoutService.recordSuccess(email)
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              termsAndPrivacyVersion: '2026-08-v2.0',
              termsAndPrivacyAcceptedAt: new Date(),
            },
          }
        },
        // Ví mặc định khi tạo tài khoản: user mới luôn có user_wallets row.
        after: async (user) => {
          try {
            await prisma.userWallet.create({ data: { user_id: user.id } })
          } catch (error) {
            logger.warn({ userId: user.id, error }, 'auto-create wallet on signup failed')
          }
        },
      },
    },
  },
  plugins: [
    admin(),
    openAPI(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      disableSignUp: false,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      rateLimit: { window: 60, max: 3 },
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendVerificationEmail(email, otp, type)
      },
    }),
  ],
})
