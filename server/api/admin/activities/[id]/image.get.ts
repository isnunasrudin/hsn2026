import { createError, defineEventHandler, sendStream, setHeader } from 'h3'
import { db } from '../../../../database/client'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'
import { activityImageExists, getActivityImageStream } from '../../../../utils/activity-image'
import { requireActivityAccess } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  if (!activity.image || !await activityImageExists(activityId, activity.image)) {
    throw createError({ statusCode: 404, statusMessage: 'Gambar kegiatan tidak ditemukan.' })
  }

  setHeader(event, 'Content-Type', 'image/jpeg')
  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  return sendStream(event, getActivityImageStream(activityId, activity.image)!)
})
