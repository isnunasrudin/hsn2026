import { randomBytes } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'

export const MAX_JUKNIS_SIZE = 10 * 1024 * 1024

const allowedMimeTypes = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx']
])

export const activityJuknisRoot = (): string => {
  return join(resolve(process.cwd(), process.env.NUXT_DATA_DIR ?? './data'), 'juknis')
}

export const activityJuknisDirectory = (activityId: number): string => join(activityJuknisRoot(), String(activityId))

export const validateJuknisFile = (mimeType: string, fileName: string, size: number): void => {
  if (size === 0 || size > MAX_JUKNIS_SIZE) throw new Error('Ukuran juknis maksimal 10 MB.')
  const expectedExtension = allowedMimeTypes.get(mimeType)
  if (!expectedExtension || extname(fileName).toLowerCase() !== expectedExtension) {
    throw new Error('Juknis harus berupa file PDF, DOC, atau DOCX yang valid.')
  }
}

export const saveActivityJuknis = async (activityId: number, fileName: string, mimeType: string, data: Uint8Array) => {
  validateJuknisFile(mimeType, fileName, data.byteLength)
  const safeName = basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_')
  const storageName = `${randomBytes(16).toString('hex')}${extname(safeName).toLowerCase()}`
  const directory = activityJuknisDirectory(activityId)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, storageName), data, { flag: 'wx' })
  return { fileName: safeName, storageName, mimeType, size: data.byteLength }
}

export const removeActivityJuknis = async (activityId: number, storageName: string | null): Promise<void> => {
  if (!storageName) return
  await rm(join(activityJuknisDirectory(activityId), storageName), { force: true })
}
