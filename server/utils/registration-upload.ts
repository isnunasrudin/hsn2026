import { rm } from 'node:fs/promises'
import { join } from 'node:path'

export const registrationUploadDirectory = (code: string): string => join(
  process.env.NUXT_DATABASE_PATH ? join(process.env.NUXT_DATABASE_PATH, '..') : './data',
  'registration-uploads',
  code
)

export const removeRegistrationUpload = async (code: string): Promise<void> => {
  await rm(registrationUploadDirectory(code), { recursive: true, force: true })
}
