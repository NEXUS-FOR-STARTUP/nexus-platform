import path from 'node:path'

import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.resolve(process.cwd(), '../../.env') })
loadEnv({ path: path.resolve(process.cwd(), '.env') })
loadEnv({ path: path.resolve(process.cwd(), 'apps/api/.env') })

const requiredEnv = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return `test_${name.toLowerCase()}`
    }
    throw new Error(`${name} is required`)
  }

  return value
}

requiredEnv('CLOUDINARY_CLOUD_NAME')
requiredEnv('CLOUDINARY_API_KEY')
requiredEnv('CLOUDINARY_API_SECRET')

/** Phase 2 of the journey redesign: unified stage input + "template or file" rule + no auto-grading. Restart the API after changing. */
export const AUDIT_STAGE_INPUT_RULES = process.env.AUDIT_STAGE_INPUT_RULES === "true"

/** Email of the "Đội ngũ Nexus" account that owns done-for-you cases; receivable "mua lượt hộ" credits it. Unset = feature off. */
export const receivableSystemUserEmail = (): string | undefined =>
  process.env.RECEIVABLE_SYSTEM_USER_EMAIL?.trim().toLowerCase() || undefined
