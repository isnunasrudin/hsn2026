import { randomBytes } from 'node:crypto'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { join, resolve } from 'node:path'

export const ACTIVITY_IMAGE_PREFIX = 'storage:'
export const MAX_ACTIVITY_IMAGE_SIZE = 8 * 1024 * 1024

export const activityImageDirectory = (activityId: number): string => join(resolve(process.cwd(), process.env.NUXT_DATA_DIR ?? './data'), 'activity-images', String(activityId))

const activityImagePath = (activityId: number, image: string): string | null => {
  if (!image.startsWith(ACTIVITY_IMAGE_PREFIX)) return null
  const storageName = image.slice(ACTIVITY_IMAGE_PREFIX.length)
  if (!/^[a-f0-9]{32}\.jpg$/.test(storageName)) return null
  return join(activityImageDirectory(activityId), storageName)
}

export const saveActivityImage = async (activityId: number, data: Uint8Array, mimeType: string): Promise<string> => {
  if (mimeType !== 'image/jpeg' || data.byteLength < 4 || data.byteLength > MAX_ACTIVITY_IMAGE_SIZE) {
    throw new Error('Gambar hasil crop harus berupa JPEG maksimal 8 MB.')
  }
  if (data[0] !== 0xff || data[1] !== 0xd8 || data[data.byteLength - 2] !== 0xff || data[data.byteLength - 1] !== 0xd9) {
    throw new Error('File gambar JPEG tidak valid.')
  }

  const storageName = `${randomBytes(16).toString('hex')}.jpg`
  const directory = activityImageDirectory(activityId)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, storageName), data, { flag: 'wx' })
  return `${ACTIVITY_IMAGE_PREFIX}${storageName}`
}

export const getActivityImageStream = (activityId: number, image: string) => {
  const path = activityImagePath(activityId, image)
  return path ? createReadStream(path) : null
}

export const removeActivityImage = async (activityId: number, image: string | null): Promise<void> => {
  if (!image?.startsWith(ACTIVITY_IMAGE_PREFIX)) return
  const path = activityImagePath(activityId, image)
  if (path) await rm(path, { force: true })
}

export const activityImageExists = async (activityId: number, image: string): Promise<boolean> => {
  const path = activityImagePath(activityId, image)
  if (!path) return false
  try {
    const file = await stat(path)
    return file.isFile()
  } catch {
    return false
  }
}
