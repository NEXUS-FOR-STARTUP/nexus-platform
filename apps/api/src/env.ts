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
