import './env.js'

import { createHash } from 'node:crypto'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError, betterAuth } from 'better-auth'
import { admin, emailOTP, openAPI } from 'better-auth/plugins'
import { prisma } from './db.js'
import {
  emailService,
  renderEmailHtml,
} from './modules/notifications/infrastructure/email.service.js'
import logger from './shared/infrastructure/logger.js'

const requiredEnv = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

type VerificationOtpType =
  | 'sign-in'
  | 'email-verification'
  | 'forget-password'
  | 'change-email'

const OTP_SUBJECTS: Record<VerificationOtpType, string> = {
  'email-verification': 'Xác minh email của bạn',
  'sign-in': 'Mã đăng nhập của bạn',
  'forget-password': 'Mã đặt lại mật khẩu của bạn',
  'change-email': 'Mã xác minh thay đổi email của bạn',
}

const sendVerificationEmail = (
  email: string,
  otp: string,
  type: VerificationOtpType,
): Promise<void> => {
  const subject = OTP_SUBJECTS[type]
  const body = `Mã xác minh của bạn là:\n<otp>${otp}</otp>\nMã có hiệu lực trong 5 phút.`
  const html = renderEmailHtml(subject, body, null)
  // Idempotency key ổn định theo type + email + otp → retry cùng OTP không gửi email trùng.
  const idempotencyKey = createHash('sha256')
    .update(`${type}:${email.toLowerCase()}:${otp}`)
    .digest('hex')

  return emailService.send(email, subject, html, idempotencyKey)
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
      '/email-otp/send-verification-otp': {
        window: 60,
        max: 3,
      },
      '/sign-in/email': {
        window: 60,
        max: 10,
      },
      '/sign-up/email': {
        window: 60,
        max: 5,
      },
    },
  },
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
    before: async (ctx) => {
      // Type của main hooks.before không expose path/body, nhưng runtime luôn có:
      // dispatch.mjs set path = endpoint.path, router parse body trước khi gọi handler.
      const { path, body } = ctx as unknown as {
        path?: string
        body?: { email?: unknown; type?: unknown }
      }
      if (
        path === '/sign-up/email' ||
        (path === '/email-otp/send-verification-otp' &&
          (body?.type === 'email-verification' || !body?.type))
      ) {
        if (body && typeof body.email === 'string') {
          const existing = await prisma.user.findUnique({
            where: { email: body.email.toLowerCase() },
            select: { email_verified: true },
          })
          if (existing?.email_verified) {
            throw new APIError('CONFLICT', {
              message: 'EMAIL_ALREADY_VERIFIED',
            })
          }
        }
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Ví mặc định khi tạo tài khoản: user mới luôn có user_wallets row.
        // Best-effort — nếu fail, mua credit vẫn tự tạo ví (getOrCreateWalletInTx).
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
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      rateLimit: { window: 60, max: 3 },
      sendVerificationOTP: async ({ email, otp, type }) => {
        // Không await network call: email gửi nền, catch ghi lỗi có cấu trúc,
        // không tạo unhandled rejection.
        void sendVerificationEmail(email, otp, type).catch((err) => {
          logger.error(
            { err, email, type },
            'Không gửi được email OTP xác minh',
          )
        })
      },
    }),
  ],
})
