import { createError, defineEventHandler, getRouterParam, sendStream, setHeader } from 'h3'
import { db } from '../../../../database/client'
import { activityImageExists, getActivityImageStream } from '../../../../utils/activity-image'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const activity = slug ? await db.activity.findUnique({ where: { slug }, select: { id: true, image: true, status: true } }) : null
  if (!activity || activity.status !== 'PUBLISHED' || !activity.image || !await activityImageExists(activity.id, activity.image)) {
    throw createError({ statusCode: 404, statusMessage: 'Gambar kegiatan tidak ditemukan.' })
  }

  setHeader(event, 'Content-Type', 'image/jpeg')
  setHeader(event, 'Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
  return sendStream(event, getActivityImageStream(activity.id, activity.image)!)
})
