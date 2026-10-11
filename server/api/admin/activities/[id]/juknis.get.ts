import { createReadStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { createError, defineEventHandler, sendStream, setResponseHeader } from 'h3'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'
import { activityJuknisDirectory } from '../../../../utils/activity-juknis'
import { requireActivityAccess } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  if (!activity.juknisStorageName || !activity.juknisFileName || !activity.juknisMimeType) {
    throw createError({ statusCode: 404, statusMessage: 'Juknis tidak ditemukan.' })
  }

  const filePath = join(activityJuknisDirectory(activity.id), activity.juknisStorageName)
  try {
    await access(filePath)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File juknis tidak ditemukan.' })
  }

  setResponseHeader(event, 'Content-Type', activity.juknisMimeType)
  setResponseHeader(event, 'Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(activity.juknisFileName)}`)
  return sendStream(event, createReadStream(filePath))
})
