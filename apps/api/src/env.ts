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
