import { createHash } from 'node:crypto'
import {
  emailService,
  renderEmailHtml,
} from '../infrastructure/email.service.js'

export type VerificationOtpType =
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

export const sendVerificationEmail = (
  email: string,
  otp: string,
  type: VerificationOtpType,
): Promise<void> => {
  const subject = OTP_SUBJECTS[type]
  const body = `Mã xác minh của bạn là:\n<otp>${otp}</otp>\nMã có hiệu lực trong 5 phút.`
  const html = renderEmailHtml(subject, body, null)
  const idempotencyKey = createHash('sha256')
    .update(`${type}:${email.toLowerCase()}:${otp}`)
    .digest('hex')

  return emailService.send(email, subject, html, idempotencyKey)
}
