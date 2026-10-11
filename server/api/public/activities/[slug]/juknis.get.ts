import { createReadStream } from 'node:fs'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { createError, defineEventHandler, getRouterParam, sendStream, setResponseHeader } from 'h3'
import { db } from '../../../../database/client'
import { activityJuknisDirectory } from '../../../../utils/activity-juknis'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const activity = slug ? await db.activity.findUnique({ where: { slug } }) : null
  if (!activity || activity.status !== 'PUBLISHED' || !activity.juknisStorageName || !activity.juknisFileName || !activity.juknisMimeType) {
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
